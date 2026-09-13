# Mercury: ativação e revisão da sincronização

Estado em 13/09/2026: as migrações `mercury_cloud_sync` e `harden_mercury_grants` foram aplicadas ao projeto `Mercury habit tracker`. As três tabelas estão vazias, com RLS ativo, Realtime publicado e sem alertas dos advisors de segurança/performance. O código ainda está em branch de revisão e não foi publicado no site ou no APK. A configuração do provedor Google continua pendente no painel.

## Ativação no mesmo projeto para site e app

1. Use o projeto existente `Mercury habit tracker` (`ujgmefsbaehwpvmelqrc`). Não crie outro banco.
2. No painel Supabase, Authentication → Sign In / Providers → Google, habilite o provedor. No Google Cloud, configure um cliente OAuth Web e use a URL de callback exibida pelo Supabase, normalmente `https://SEU_PROJETO.supabase.co/auth/v1/callback`. O segredo Google fica somente no painel do Supabase.
3. Em Authentication → URL Configuration, configure Site URL como `https://mercury-habit-tracker-site.cezaraugust76.workers.dev`. Adicione à lista de redirecionamentos `https://mercury-habit-tracker-site.cezaraugust76.workers.dev/` e `com.mercury.habits://login-callback`. Inclua separadamente o domínio de homologação e localhost se forem usados.
4. As duas migrações em `supabase/migrations/` já foram aplicadas ao projeto remoto. Não as execute novamente manualmente. Em um ambiente novo, aplique-as na ordem pelo processo normal de migrações.
5. O cliente contém a URL e a chave **publicável** deste projeto como padrão para o primeiro deploy. As variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` podem sobrescrever esses valores no build para rotação ou homologação. Nunca use `service_role` nem chave secreta no cliente.
6. Configure o app conforme `docs/CLOUD-SYNC.md` no repositório App-mercury. Ambos devem apontar para o mesmo projeto.
7. Rode os testes e o checklist abaixo, depois publique pelo processo Cloudflare já existente. Este trabalho não modifica o APK publicado nem `version.json`.

## Contrato e concorrência

- Documento por usuário, campos identificados por caminhos JSON; entidades usam UUID/ID estável, não posição de array. Campos desconhecidos são preservados pelo adaptador Flutter.
- Fila persistida por conta e dispositivo, sequência monotônica e RPC transacional. Reenvios da mesma sequência não repetem incrementos. O lock de linha serializa as operações de uma conta. Campos distintos se combinam; alterações concorrentes no mesmo campo usam a última operação recebida, não o relógio do dispositivo.
- Foco usa deltas. Água usa entradas com ID. Calorias novas de treino usam treino + dia; repetir conclusão não dobra calorias. Passos usam máximo de valores cumulativos, não soma de snapshots. A captura contínua deve ser validada em aparelho físico, incluindo reinício, meia-noite e uso de mais de um celular.
- No navegador, Web Locks coordenam abas; um journal persiste a edição antes de aguardar o lock. Realtime notifica mudanças e a reconciliação periódica cobre desconexões. RLS impede acesso a outra conta; RPC roda com privilégios do usuário.
- Dados sem login ficam locais. A importação inicial é somente para uma conta vazia. Não há união automática de históricos guest de vários dispositivos sobre uma conta já existente, evitando sobrescrever dados remotos.
- Preferências e histórico do usuário são compartilhados. Baseline do sensor, permissões do sistema e coordenadas atuais pertencem ao dispositivo.

## Resumo anual leve

`mercury_annual` mantém uma linha por usuário/ano, com `habits`, `water_ml`, `focus_minutes`, `steps`, `workout_kcal` e `workouts`. A RPC ajusta cada total pela diferença entre o valor novo e o anterior, na mesma transação que salva os dados. Desmarcar/remover registros corrige os totais. Não existe uma segunda coleção de logs diários para o relatório.

`habits` conta marcações explícitas; hábitos automáticos de água/treino são calculados pelo histórico na UI e não devem ser apresentados como parte desse contador sem essa distinção. `workout_kcal` representa as calorias registradas de treino, não todas as calorias metabólicas. O histórico necessário às telas continua no documento principal; a linha anual evita reler esse histórico para os totalizadores armazenados.

Exemplo de leitura sob RLS: `supabase.from('mercury_annual').select('*').eq('user_id', user.id).eq('year', 2026).maybeSingle()`.

## Passos no navegador

Não foi implementado pedômetro web. As Sensor APIs oferecem leituras de sensores brutos e têm suporte variável; não equivalem a uma API padronizada e confiável de passos. Core Motion/CMPedometer é uma API nativa Apple. O site mostra `stepsByDay` recebido do app pelo Supabase.

Referências: [Sensor APIs / MDN](https://developer.mozilla.org/en-US/docs/Web/API/Sensor_APIs), [CMPedometer / Apple](https://developer.apple.com/documentation/coremotion/cmpedometer), [Google OAuth / Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google).

## Verificação

Executados: build do site; 39 testes Node de regressão, protocolo, clima e Postgres/PGlite. PGlite executou as regras de RLS, isolamento entre usuários, reenvios, sequência fora de ordem, alterações de dois dispositivos, correção anual entre anos e rollback de requisição inválida. No Supabase real foram verificados tabelas, RLS, privilégios mínimos, publicação Realtime, migrações e advisors. Isso não substitui teste de Realtime/OAuth com uma conta Google real.

`tsc --noEmit` ainda aponta quatro declarações Cloudflare ausentes que já existem na base (`cloudflare:workers`, `D1Database`, `Fetcher`). Nenhum erro novo de tipos foi observado nas alterações. O navegador de homologação não foi acessível neste ambiente; a semelhança visual foi implementada em código, mas não certificada por comparação de screenshots.

Antes de publicar, validar em homologação:

1. Google: entrar, cancelar, sair, renovar sessão e trocar entre duas contas sem vazamento visual/dados.
2. Abrir app + site + duas abas: editar hábitos diferentes, marcar/desmarcar, adicionar água, terminar o mesmo treino nos dois e concluir foco. Conferir estado após recarregar.
3. Desconectar, editar, reconectar e repetir envio: nada desaparece nem duplica. Simular fechamento após journal, antes/depois de confirmação do servidor.
4. Relatórios: fevereiro bissexto, janeiro comparado a dezembro, hábitos criados no meio do mês, arquivamento e alteração da meta de água.
5. Clima: permitir/negar localização, timeout e mudança de cidade. Não apresentar Barretos quando não houver localização.
6. Layout mobile e desktop: navegação, tabela, água, treinos, foco, rolagem e página de download existente.

Comandos: `npm ci`, `npm test`, `npx tsc --noEmit`. Para atualizar os tipos Cloudflare no ambiente de desenvolvimento, use o comando de geração do Wrangler adequado ao projeto e revise o resultado; não substitua os tipos por declarações fictícias.

Mensagem de commit do site: `feat(web): sincronizar dados via Supabase e alinhar clima e relatorios ao app`
