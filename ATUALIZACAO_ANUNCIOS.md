# Atualização dos anúncios do Mercury

## Posições

| Local | Unidade |
| --- | --- |
| Abaixo de “Seu espaço”, no computador | 300×250 existente |
| Abaixo do conteúdo, quando cabem 728 px | 728×90 |
| Abaixo do conteúdo, no celular ou em janela estreita | Banner nativo |
| `/anuncio`, para integração posterior no Android | 320×50 |

O site mede o espaço disponível; não carrega banners grandes escondidos no
celular. Não há Smartlink nem atualização automática dos anúncios. O 320×50
não aparece junto do nativo no habit tracker. Os anúncios retangulares têm
documentos separados para evitar interferência entre os códigos `atOptions`.

O layout interno do nativo vem do painel Adsterra. A captura enviada mostra
`4:1`. Se os quatro cartões ficarem apertados no celular, altere o layout do
widget no painel para uma coluna (`1:1`, se disponível) e salve. Não é preciso
trocar a chave do anúncio para alterar o layout no painel.

## Aplicar no site existente

Antes de copiar, guarde uma cópia do projeto atual. Os arquivos desta mudança são:

- `components/mercury/adsterra-config.ts` (novo)
- `components/mercury/adsterra-banner.tsx`
- `components/mercury/web-app.tsx`
- `app/anuncio/page.tsx`
- `tests/adsterra.test.mjs` (novo)
- `ATUALIZACAO_ANUNCIOS.md` (este documento)

Copie esses arquivos para os mesmos caminhos na pasta do site, não na pasta do
Flutter. Preserve suas configurações de build e publicação no Cloudflare.
Se você modificou `web-app.tsx` depois do pacote anterior, compare as alterações
antes de substituí-lo. Os dados dos hábitos continuam no mesmo localStorage.

No terminal do VS Code, dentro da pasta do site:

```powershell
git status
git add components/mercury/adsterra-config.ts components/mercury/adsterra-banner.tsx components/mercury/web-app.tsx app/anuncio/page.tsx tests/adsterra.test.mjs ATUALIZACAO_ANUNCIOS.md
git commit -m "Separar banners responsivos e preparar anuncio do app"
git push origin main
```

Se o push informar que há alterações remotas ou conflitos, pare e resolva-os
antes de continuar; não use `--force`. A atualização só entra no endereço
`workers.dev` após o envio ao GitHub e a implantação bem-sucedida no Cloudflare.

Esta atualização não altera seu botão de download. O projeto mantém o endereço
direto via GitHub Releases já configurado na entrega anterior:
`https://github.com/cezar0810/mercury-habit-tracker-site/releases/latest/download/Mercury-Habit-Tracker.apk`.
O arquivo precisa existir com esse nome no release publicado mais recente.

## Página para o WebView

Após publicar, o endereço será:
`https://mercury-habit-tracker-site.cezaraugust76.workers.dev/anuncio`.

Reserve no WebView pelo menos **320 px CSS de largura e 70 px CSS de altura**:
50 px do anúncio e 20 px do rótulo “PUBLICIDADE”. A página não tem menus,
cadastro, tela do tracker ou botão de download. JavaScript precisa estar
habilitado. No Android, cliques legítimos que abrem outra janela devem ser
tratados pelo app e encaminhados ao navegador externo; nunca abra destinos
automaticamente nem dê ao JavaScript dos anúncios acesso a interfaces nativas
privilegiadas.

Esta entrega altera apenas o site, não gera nem modifica o APK. Confirme com a
Adsterra se o tráfego do seu aplicativo via WebView está autorizado antes de
distribuir essa integração. Não foi confirmada aqui a aprovação desse uso.

## Verificação

- No computador com espaço suficiente: um 300×250 lateral e um 728×90 abaixo.
- No celular: somente o nativo dentro do tracker, sem rolagem horizontal causada
  por um anúncio de 728 px.
- Em `/anuncio`: somente o espaço do 320×50 com o rótulo.
- Nome, hábitos, planejamento, foco e download devem continuar funcionando.
- Bloqueadores, indisponibilidade de campanhas e regras da rede podem impedir
  anúncios reais. O carregamento de um script não garante receita/aprovação.
- Não clique nos próprios anúncios para testar nem faça recargas repetidas.

Os testes automatizados usam renderização em memória e os códigos de
configuração; não acessam campanhas nem geram impressões ou cliques de teste.

Verificações desta entrega: build concluído, 17 testes dos anúncios aprovados e
respostas HTTP 200 de `/` e `/anuncio` em memória. O teste antigo
`tests/rendered-html.test.mjs` ainda espera uma metatag de preview que o layout
atual não contém. A checagem TypeScript completa também aponta tipos ausentes
de Cloudflare (`cloudflare:workers`, `Fetcher`, `D1Database`) nos arquivos de
infraestrutura existentes. Essas pendências não foram alteradas nesta tarefa;
não considere a suíte geral totalmente aprovada.
