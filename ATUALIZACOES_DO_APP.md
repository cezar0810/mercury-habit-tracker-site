# Atualizações do Mercury para Android

- Página para as pessoas: `/atualizacao`.
- Manifesto consultado pelo aplicativo: `/version.json`.
- Fonte de versão, mensagem e links: `public/version.json`.
- O botão da página de atualização e o download principal usam o mesmo `download_url`.

## Publicar uma atualização

1. Gere um APK de distribuição com a mesma assinatura e identificador do app instalado. O APK debug de teste do Actions não substitui essa assinatura.
2. Publique uma Release pública em `cezar0810/mercury-downloads` e anexe o APK com o nome `Mercury-Habit-Tracker.apk` (respeite maiúsculas e minúsculas). O link `/releases/latest/download/Mercury-Habit-Tracker.apk` precisa funcionar sem login.
3. Só depois de confirmar o download, edite `public/version.json`: copie `version_name` e `version_code` da versão efetivamente publicada. Em `pubspec.yaml`, `1.0.1+3` corresponde ao nome `1.0.1` e código `3`.
4. Atualize `message` com um resumo verdadeiro dessa versão. Mantenha `update_page_url` apontando para o site em `/atualizacao` e `download_url` apontando diretamente para o APK.
5. Mantenha `minimum_version_code` se a atualização for opcional. Aumente-o somente se quiser impedir o uso dos builds anteriores, nunca acima de `version_code` e nunca antes de disponibilizar um APK compatível.
6. Faça commit e aguarde a implantação do Cloudflare. Confira a página e o JSON no endereço público.

O aplicativo preparado para esse fluxo consulta o manifesto ao abrir. Uma versão mais nova mostra um aviso com **Ver atualização** e **Agora não**; builds abaixo do mínimo recebem o aviso obrigatório. O botão abre a página no navegador. Isso não envia uma notificação push com o app fechado nem instala APKs automaticamente.

APKs antigos que foram gerados sem configurar a consulta precisam ser substituídos uma vez por um APK que inclua o novo fluxo. A alteração no GitHub não modifica arquivos APK já baixados.

O site consulta os dados públicos da Release mais recente e exibe automaticamente o tamanho do arquivo, em MB. Enquanto nenhuma Release possuir o APK com o nome correto, o botão informa que o APK ainda não está disponível.
