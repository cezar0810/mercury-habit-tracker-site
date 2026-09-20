/* ============================================================
   Assistente Híbrido — JS vanilla (sem frameworks)
   Gerencia toggle de modo, envio via fetch e render do histórico.
   ============================================================ */

(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  const form = $("#chat-form");
  const input = $("#prompt-input");
  const sendBtn = $("#send-btn");
  const chatEl = $("#chat");
  const emptyState = $("#empty-state");
  const badge = $("#mode-badge");
  const badgeText = $("#mode-badge-text");
  const modeHint = $("#mode-hint");
  const footerMode = $("#footer-mode");
  const btnOffline = $("#btn-offline");
  const btnOnline = $("#btn-online");

  let currentMode = "OFFLINE";

  const HINTS = {
    OFFLINE: "Básico: responde via Ollama local (localhost:11434), sem internet.",
    ONLINE: "Work: executa o Freebuff CLI no terminal com o seu prompt.",
  };

  // ------------------------------------------------------------------
  // Renderização
  // ------------------------------------------------------------------

  function hideEmptyState() {
    if (emptyState) emptyState.remove();
  }

  function addMessage(role, text, meta) {
    hideEmptyState();
    const article = document.createElement("article");
    article.className = `msg msg--${role}`;

    const metaEl = document.createElement("span");
    metaEl.className = "msg-meta";
    metaEl.textContent = meta;
    article.appendChild(metaEl);

    const body = document.createElement("p");
    body.textContent = text; // safe: textContent, nunca innerHTML
    article.appendChild(body);

    chatEl.appendChild(article);
    chatEl.scrollTop = chatEl.scrollHeight;
    return body;
  }

  function addTyping(meta) {
    const body = addMessage("bot", "", meta);
    body.classList.add("typing");
    body.textContent = "processando";
    return body;
  }

  // ------------------------------------------------------------------
  // Selo de modo no header
  // ------------------------------------------------------------------

  function renderMode(mode) {
    currentMode = mode;
    badge.classList.toggle("mode-badge--offline", mode === "OFFLINE");
    badge.classList.toggle("mode-badge--online", mode === "ONLINE");
    badgeText.textContent = mode === "OFFLINE" ? "OFFLINE" : "WORK";
    modeHint.textContent = HINTS[mode];
    footerMode.textContent = mode;

    btnOffline.classList.toggle("is-active", mode === "OFFLINE");
    btnOnline.classList.toggle("is-active", mode === "ONLINE");
    btnOffline.setAttribute("aria-selected", String(mode === "OFFLINE"));
    btnOnline.setAttribute("aria-selected", String(mode === "ONLINE"));
  }

  // ------------------------------------------------------------------
  // API
  // ------------------------------------------------------------------

  async function refreshStatus() {
    try {
      const res = await fetch("/api/status");
      if (!res.ok) return;
      const data = await res.json();
      renderMode(data.mode);
      if (!data.ollama_available && data.mode === "OFFLINE") {
        modeHint.textContent =
          "Básico: Ollama não detectado em localhost:11434 — rode `ollama serve`.";
      }
    } catch {
      /* servidor ainda inicializando — segue com padrão visual */
    }
  }

  async function setMode(mode) {
    if (mode === currentMode) return;
    try {
      const res = await fetch("/api/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      renderMode(data.mode);
    } catch {
      addMessage(
        "error",
        "Não foi possível alternar o modo. O backend respondeu com erro.",
        "Sistema"
      );
    }
  }

  async function sendMessage(prompt) {
    addMessage("user", prompt, "Você");
    const typingEl = addTyping("Assistente");

    sendBtn.disabled = true;
    input.disabled = true;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const detail = data.detail || `Erro HTTP ${res.status}`;
        typingEl.classList.remove("typing");
        typingEl.textContent = `⚠ ${detail}`;
        typingEl.closest(".msg").classList.add("msg--error");
        return;
      }

      typingEl.classList.remove("typing");
      typingEl.textContent = data.reply;
      typingEl.closest(".msg").querySelector(".msg-meta").textContent =
        `Assistente · ${data.source}`;
    } catch {
      typingEl.classList.remove("typing");
      typingEl.textContent =
        "⚠ Falha de conexão com o servidor local. Verifique se app.py está rodando.";
      typingEl.closest(".msg").classList.add("msg--error");
    } finally {
      sendBtn.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  // ------------------------------------------------------------------
  // Eventos
  // ------------------------------------------------------------------

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const prompt = input.value.trim();
    if (!prompt) return;
    input.value = "";
    sendMessage(prompt);
  });

  btnOffline.addEventListener("click", () => setMode("OFFLINE"));
  btnOnline.addEventListener("click", () => setMode("ONLINE"));

  refreshStatus();
})();
