# MapPin — Implementação e projeto dos testes (P2)

## Equipe e ambiente
- Integrantes: **PREENCHER** (nome e matrícula).
- Plataforma: Android (APK via EAS Build), iOS e web; recurso de foto disponível somente em Android/iOS.
- Tecnologia conferida no `frontend/package.json`: JavaScript, React Native 0.88.0, React 19.3.0, Expo SDK 58 e SQLite (`expo-sqlite`).
- Ambiente de testes automatizados desta revisão: Node.js v22.16.0.
- Dispositivo/SO e commit testado: **PREENCHER após validação física e commit**.

## Primeiro fluxo — RF01
O usuário pode tirar uma foto ao criar ou editar um lugar, visualizar a prévia e confirmá-la. Ao salvar o lugar, a foto é armazenada no diretório de documentos do aplicativo e associada ao registro SQLite. Deve permanecer disponível após fechar e reabrir o app, sem internet.

### Critérios de aceitação
1. Após confirmar a foto e salvar, ela aparece ao reabrir o lugar; cancelar a câmera ou descartar a prévia não associa foto nova e preserva a anterior.
2. Em modo avião, lugar e foto permanecem disponíveis após fechar e reabrir o app (o mapa base do OpenStreetMap pode não carregar).
3. Com permissão negada, o app mostra mensagem clara, mantém o formulário utilizável e permite salvar sem foto; quando bloqueada permanentemente, oferece atalho às configurações.

## Fluxo implementado
1. Toque no mapa abre novo lugar; toque em marcador abre edição.
2. Em Foto, Adicionar foto solicita permissão e abre a câmera nativa.
3. A imagem capturada é apresentada em prévia.
4. Usar esta foto confirma a seleção; Refazer inicia nova captura; Descartar abandona a prévia.
5. Ao salvar, `photoStorage.js` copia a imagem para `pin-photos/` no diretório de documentos e `pinDatabase.js` grava o caminho em `photo_uri`.
6. Ao reabrir o registro, a imagem é recuperada pelo caminho local.
7. Substituição e remoção atualizam primeiro o banco e depois removem o arquivo anterior gerenciado pelo app.

## Recurso nativo e alternativas
- Câmera: `expo-image-picker` (`requestCameraPermissionsAsync`, `launchCameraAsync`) em `PinFormModal.js`.
- Armazenamento: `expo-file-system` em `photoStorage.js`.
- Permissão concedida: abre câmera; negada: mensagem e nova tentativa; bloqueada: mensagem e botão Abrir configurações.
- Cancelamento/falha: não associa nova imagem e preserva a imagem anterior.
- Web: foto não é oferecida, pois depende de APIs nativas.
- Migração: a coluna `photo_uri` é adicionada ao banco anterior sem remover os lugares já cadastrados.

## Técnicas de projeto de testes
- **T01 — Particionamento de equivalência:** permissão concedida (CT01), negada com nova tentativa possível (CT02) e bloqueada (CT08).
- **T02 — Transição de estados:** fluxo `idle → capturing → preview → idle`, com cancelar, refazer, descartar e confirmar (CT03–CT07).

## Casos de teste
A planilha `docs/testes/Aula_2_Projeto_e_Documentacao_de_Testes.xlsx` contém CT01–CT08, pré-condições, dados, passos e resultados esperados. CT01–CT04 foram especificados na Aula 2; CT05–CT08 foram acrescentados para completar oito cenários.

## Testes automatizados
Executar em `frontend/` com `npm test`. Na revisão de 16/11/2026, **24 testes passaram e 0 falharam** com Node.js v22.16.0. A suíte inclui fluxo de foto, permissões, persistência SQLite e migração. Os resultados automatizados não substituem os casos manuais em dispositivo.

## Execuções manuais e evidências
**CT01–CT08 continuam Não executado** até que alguém execute em dispositivo físico ou emulador compatível e registre data, executor, dispositivo/SO, versão/commit, resultado e evidência. A pasta `docs/evidencias/` está preparada, mas não contém evidências manuais nesta entrega.

## Pendências reais
- Preencher integrantes e matrículas.
- Gerar e instalar build nativo atualizado; o APK incluído é apenas o arquivo recebido originalmente.
- Executar CT01–CT08 em Android físico/emulador com câmera.
- Realizar validação por outro usuário e registrar observações.
- Registrar defeitos apenas se observados e executar retestes/regressão.
- Criar commit/push no repositório remoto e registrar hash/link real.
- Rotacionar credenciais de assinatura se o arquivo removido tiver sido compartilhado ou publicado.
