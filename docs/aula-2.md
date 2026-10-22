# Aula 2 — MapPin

## Equipe e ambiente
- Integrantes: **PREENCHER** (nome e matrícula).
- Tecnologia: JavaScript, React Native 0.81 com Expo SDK 54; SQLite (`expo-sqlite`).
- Dispositivo/SO: **PREENCHER** (modelo, versão do Android).
- Versão/commit testado: **PREENCHER** após o commit.

## Primeiro fluxo
**RF01** — O usuário deve poder tirar uma foto ao criar ou editar um lugar, visualizar a
prévia e confirmá-la; ao salvar o lugar, a foto fica associada a ele e permanece disponível
depois de fechar e reabrir o app, sem internet.

**Critério de aceite:** após confirmar a foto e salvar o lugar, ela aparece ao reabrir o
lugar para edição; ao cancelar ou descartar, nenhuma nova foto é associada e a anterior é
preservada. (Os três critérios completos estão em [`plano-evolucao.md`](plano-evolucao.md).)

**Sequência implementada** (tela `MapScreen` → `PinFormModal`):
1. Toque no mapa abre o formulário do lugar (ou toque no marcador para editar).
2. Em **Foto**, *Adicionar foto* solicita a permissão e abre a câmera.
3. A foto capturada aparece em **prévia**, ainda não associada.
4. *Usar esta foto* a confirma no formulário; *Refazer* abre a câmera de novo descartando a
   rejeitada; *Descartar* volta sem alterar nada.
5. *Salvar lugar* copia o arquivo para `pin-photos/` (diretório de documentos do app) e grava
   o caminho em `photo_uri`. Ao reabrir o lugar, a foto é lida de lá.
6. *Tirar outra foto* substitui e *Remover foto* exclui; o arquivo antigo só é apagado depois
   que o banco já aponta para o novo estado. Excluir o lugar apaga também o arquivo.

## Recurso nativo e alternativas
- **Integração:** `ImagePicker.requestCameraPermissionsAsync` e `launchCameraAsync`
  (`PinFormModal.js`); arquivos com `expo-file-system` (`photoStorage.js`).
- **Permissão:** concedida → abre a câmera. Negada → mensagem e formulário utilizável. Bloqueada
  de vez → mensagem e botão *Abrir configurações*.
- **Cancelamento:** voltar da câmera sem foto mantém o formulário e a foto existente.
- **Falhas:** erro da câmera ou da cópia do arquivo mostra mensagem, não altera o lugar e permite
  tentar de novo. Foto salva que não carrega mostra um aviso no lugar da imagem.
- **Não se aplica:** a versão **web** não oferece foto (a seção fica oculta), pois depende de
  câmera e arquivos nativos.
- **Banco existente:** `PRAGMA table_info` detecta a falta de `photo_uri` e executa
  `ALTER TABLE` sem apagar os lugares cadastrados na P1.
- **Requer novo build nativo** (o plugin da câmera altera o manifesto Android): `npm install`
  e depois `npm run build:apk`, ou usar o Expo Go para desenvolvimento.

## Projeto dos testes
- **T01 — Particionamento de equivalência.** Grupos de permissão da câmera: concedida, negada
  (pode pedir de novo) e bloqueada. Casos: CT01 (concedida), CT02 (negada); CT08 (bloqueada) fica
  para a aula 3/4.
- **T02 — Transição de estados.** Estados `idle → capturing → preview → idle`, com cancelar,
  refazer, descartar e confirmar. Casos: CT03 (cancelar preserva a foto existente) e CT04
  (refazer não associa a foto rejeitada).
- Planilha: `docs/testes/Aula_2_Projeto_e_Documentacao_de_Testes.xlsx` (abas Casos e Tecnicas).

**Casos planejados para completar oito até a aula 4:** CT05 persistência offline após fechar e
reabrir (critério 2); CT06 lugar criado na P1 continua abrindo e aceita foto; CT07 trocar a foto
e salvar; CT08 permissão bloqueada com atalho para configurações. Remover foto fica como
candidato extra.

## Execuções e evidências
- **Testes manuais em dispositivo: ainda não executados.** A aba Execucoes traz EX01–EX04 como
  *Não executado*; preencher data, executor, dispositivo, versão, resultado e evidência apenas
  depois de testar.
- Testes automatizados da lógica (não substituem os manuais): `npm test` → 22 testes, 22
  aprovados em Node 22 (6 da P1 e 16 novos: máquina de estados da foto, validação, persistência
  após reabrir o banco e migração de banco antigo).
- Evidências em `docs/evidencias/`, nomeadas como `EX01_CT01_confirmacao.png`.

## Defeitos e pendências
- Nenhum defeito registrado até agora (nenhum teste manual foi executado).
- A foto ainda não aparece no balão do marcador no mapa, só no formulário do lugar.
- A foto não é exibida nem gravada na versão web.
- Ainda não foi validado em aparelho real: comportamento da câmera, da permissão e do arquivo
  no Android.

## Evolução
- Commits: **PREENCHER** com os links após o `git push`.
- Mensagem sugerida: `Implementa foto do lugar com câmera e documenta testes da aula 2`.
- Próximos passos (aula 3): integração completa e persistência após fechar e reabrir, executar
  CT01–CT04, e manter pelo menos dois testes automatizados executáveis (já há 16 novos).
