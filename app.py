"""
Assistente Híbrido — Servidor local (FastAPI).

Roteador de Estado:
  - OFFLINE ("Básico"): envia o prompt para a API local do Ollama (localhost:11434).
  - ONLINE ("Work"): executa o Freebuff CLI no terminal via subprocess.

Como rodar:
    pip install -r requirements.txt
    uvicorn app:app --host 0.0.0.0 --port 8000
    # ou: python app.py
"""

from __future__ import annotations

import asyncio
import subprocess
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent

# ---------------------------------------------------------------------------
# Configuração
# ---------------------------------------------------------------------------

OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3"          # modelo leve (Llama 3 8B)
OLLAMA_TIMEOUT = 120.0           # segundos (geração local pode demorar)

FREEBUFF_CLI = "freebuff"        # binário do Freebuff CLI
FREEBUFF_TIMEOUT = 180.0         # segundos (rede + execução de comandos)
FREEBUFF_MAX_OUTPUT = 8_000      # truncamento do output para o frontend


class Mode(str, Enum):
    OFFLINE = "OFFLINE"  # Modo Básico
    ONLINE = "ONLINE"    # Modo Work


@dataclass
class AppState:
    """Roteador de Estado: define para onde as mensagens são enviadas."""
    mode: Mode = Mode.OFFLINE


state = AppState()

app = FastAPI(title="Assistente Híbrido", version="1.0.0")

# ---------------------------------------------------------------------------
# Modelos de requisição/resposta
# ---------------------------------------------------------------------------


class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=8_000)


class ChatResponse(BaseModel):
    reply: str
    mode: Mode
    source: str


class StatusResponse(BaseModel):
    mode: Mode
    ollama_available: bool


# ---------------------------------------------------------------------------
# Backend OFFLINE — Ollama local
# ---------------------------------------------------------------------------

OFFLINE_SYSTEM_PROMPT = (
    "Você é um assistente offline, conciso e direto, executado localmente. "
    "Responda em português do Brasil."
)


async def query_ollama(prompt: str) -> str:
    """Envia o prompt para a API do Ollama e retorna o texto gerado."""
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": OFFLINE_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "stream": False,
    }
    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
            resp = await client.post(
                f"{OLLAMA_BASE_URL}/api/chat", json=payload
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=504,
            detail=(
                f"Timeout ao contatar o Ollama em {OLLAMA_BASE_URL} "
                f"(modelo '{OLLAMA_MODEL}'). Verifique se o serviço está rodando: "
                "`ollama serve`."
            ),
        ) from exc
    except httpx.ConnectError as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                f"Não foi possível conectar ao Ollama em {OLLAMA_BASE_URL}. "
                "Inicie com `ollama serve` e baixe o modelo: "
                f"`ollama pull {OLLAMA_MODEL}`."
            ),
        ) from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                f"Ollama respondeu {exc.response.status_code}: "
                f"{exc.response.text[:300]}"
            ),
        ) from exc

    reply = (data.get("message") or {}).get("content") or data.get("response")
    if not reply:
        raise HTTPException(
            status_code=502,
            detail="Resposta vazia do Ollama. Verifique se o modelo foi baixado.",
        )
    return reply.strip()


async def check_ollama() -> bool:
    """Verifica rapidamente se o Ollama está acessível."""
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            return resp.status_code == 200
    except httpx.HTTPError:
        return False


# ---------------------------------------------------------------------------
# Backend ONLINE — Freebuff CLI via subprocess
# ---------------------------------------------------------------------------

# Palavras proibidas que não devem ser passadas ao CLI.
_BLOCKED_PATTERNS = ("rm -rf /", "shutdown", "mkfs", ":(){:|:&};:")


async def query_freebuff(prompt: str) -> str:
    """
    Executa o Freebuff CLI no terminal via subprocess:
        freebuff "<prompt do usuário>"

    Inclui tratamento de erros de rede/tempo limite/retorno inválido.
    """
    if any(p in prompt for p in _BLOCKED_PATTERNS):
        raise HTTPException(
            status_code=400,
            detail="Prompt contém um comando potencialmente destrutivo; bloqueado.",
        )

    # freebuff <prompt> — aspas simples preservam o prompt inteiro como 1 argumento.
    cmd = [FREEBUFF_CLI, prompt]
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            cwd=str(BASE_DIR),
        )
        try:
            stdout, _ = await asyncio.wait_for(proc.communicate(), FREEBUFF_TIMEOUT)
        except asyncio.TimeoutError:
            proc.kill()
            await proc.wait()
            raise HTTPException(
                status_code=504,
                detail=(
                    f"O Freebuff CLI excedeu {FREEBUFF_TIMEOUT:.0f}s. "
                    "Provável queda de internet ou lentidão — verifique sua conexão."
                ),
            )
    except FileNotFoundError:
        raise HTTPException(
            status_code=502,
            detail=(
                f"Comando '{FREEBUFF_CLI}' não encontrado. Verifique se o "
                "Freebuff CLI está instalado e no PATH."
            ),
        )
    except OSError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Falha ao executar o Freebuff CLI: {exc}",
        )

    output = stdout.decode("utf-8", errors="replace").strip()
    if proc.returncode != 0:
        raise HTTPException(
            status_code=502,
            detail=(
                f"Freebuff CLI terminou com código {proc.returncode}. "
                f"Saída: {output[:500] or '(sem saída)'}"
            ),
        )
    if not output:
        raise HTTPException(
            status_code=502,
            detail=(
                "Freebuff CLI retornou saída vazia. Possível queda de internet "
                "ou falha de autenticação."
            ),
        )

    if len(output) > FREEBUFF_MAX_OUTPUT:
        output = output[:FREEBUFF_MAX_OUTPUT] + "\n\n… (saída truncada)"
    return output


# ---------------------------------------------------------------------------
# Rotas da API
# ---------------------------------------------------------------------------


@app.get("/", response_class=HTMLResponse)
async def index() -> FileResponse:
    """Serve o frontend."""
    return FileResponse(BASE_DIR / "index.html")


@app.get("/api/status", response_model=StatusResponse)
async def get_status() -> StatusResponse:
    """Estado atual do Roteador + disponibilidade do Ollama (para o selo do header)."""
    return StatusResponse(mode=state.mode, ollama_available=await check_ollama())


@app.post("/api/mode")
async def set_mode(mode: Mode) -> StatusResponse:
    """Alterna o Roteador de Estado entre OFFLINE (Básico) e ONLINE (Work)."""
    state.mode = mode
    return StatusResponse(mode=state.mode, ollama_available=await check_ollama())


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    """Roteia o prompt para o backend correspondente ao modo atual."""
    if state.mode == Mode.OFFLINE:
        reply = await query_ollama(req.prompt)
        return ChatResponse(reply=reply, mode=state.mode, source=f"Ollama ({OLLAMA_MODEL})")

    reply = await query_freebuff(req.prompt)
    return ChatResponse(reply=reply, mode=state.mode, source="Freebuff CLI")


# ---------------------------------------------------------------------------
# Static assets (script.js, style.css)
# ---------------------------------------------------------------------------

app.mount(
    "/static",
    StaticFiles(directory=str(BASE_DIR)),
    name="static",
)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )
