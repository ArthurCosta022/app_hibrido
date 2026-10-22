# Plano da evolução — MapPin (P2)

## Ponto de partida (P1)
MapPin é um mapa pessoal e privado: o usuário toca no mapa, salva lugares com nome e
descrição, busca, edita e exclui. Tudo fica em SQLite no dispositivo e funciona offline
(somente o fundo do OpenStreetMap depende de internet). O app já usa **localização (GPS)**.

## Necessidade do usuário
Nome e descrição nem sempre bastam para reconhecer um lugar depois: a entrada de um
estabelecimento, a vaga onde o carro ficou, uma trilha sem sinalização. Uma **foto** do
lugar resolve isso, e precisa estar disponível **sem internet**, como o resto do app.

## Evolução escolhida
**Foto do lugar com a câmera.** Ao criar ou editar um lugar, o usuário pode tirar uma foto,
ver a prévia, escolher *Usar esta foto*, *Refazer* ou *Descartar*, e salvar. A foto é copiada
para o armazenamento permanente do app e associada ao lugar.

- Recurso nativo: câmera (`expo-image-picker`) + arquivos locais (`expo-file-system`).
- Fluxo: abrir câmera → capturar → visualizar → confirmar → salvar → recuperar.
- Preserva as funcionalidades da P1 (lugares já cadastrados continuam abrindo; a coluna
  nova é adicionada ao banco existente sem apagar dados).

## Critérios de aceitação (observáveis)
1. Ao confirmar a foto na prévia e salvar o lugar, a foto aparece ao reabrir esse lugar
   para edição. Ao cancelar a câmera ou descartar a prévia, nenhuma foto nova é associada
   e a foto anterior, se houver, é preservada.
2. Sem internet (modo avião), um lugar com foto continua com a foto depois de fechar e
   reabrir o aplicativo.
3. Se a permissão da câmera for negada, o app mostra mensagem clara, mantém o formulário
   utilizável e permite salvar o lugar sem foto.

## Plano de testes (resumo)
| Item | Definição |
|---|---|
| Escopo | Criar/editar lugar com foto: permissão, captura, prévia, confirmar, refazer, descartar, cancelar, persistência offline, migração do banco. |
| Fora do escopo | Galeria, vídeo, foto na versão web, sincronização em nuvem, foto no balão do mapa. |
| Estratégia | Casos manuais derivados por **particionamento de equivalência** (permissão) e **transição de estados** (fluxo da foto); testes automatizados da lógica pura e do banco com `node --test`. |
| Ambiente | Android físico ou emulador com câmera virtual; build com o plugin nativo da câmera. |
| Riscos | Permissão bloqueada de vez; aparelho sem câmera; falta de espaço; arquivo removido fora do app; necessidade de novo build nativo. |
| Aprovação | Os três critérios atendidos e nenhum caso crítico reprovado; defeitos registrados e tratados. |

## Tarefas sugeridas para o GitHub (issues)
- [ ] Banco: coluna `photo_uri` com migração segura
- [ ] Armazenamento: copiar/apagar fotos no diretório do app
- [ ] Formulário: seção de foto com prévia, refazer e descartar
- [ ] Permissão da câmera: negada, bloqueada e atalho para configurações
- [ ] Casos de teste CT01–CT04 e planilha da Aula 2
- [ ] Execução manual e evidências
