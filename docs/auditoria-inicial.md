# Auditoria técnica inicial — MapPin P2

**Data da auditoria:** 16/11/2026

**Base analisada:** `app_hibrido-main.zip` recebido nesta conversa.

## 1. Escopo inspecionado

Foram inspecionados os arquivos de configuração e dependências, documentação, planilha de testes, componentes React Native/web, telas, hooks, serviços de mapa, câmera, armazenamento e SQLite, testes automatizados, APK fornecido e arquivos de distribuição.

## 2. Arquitetura identificada

- React Native 0.88.0, React 19.3.0 e Expo SDK 58 (`frontend/package.json`).
- JavaScript, Expo Router/navigation nativa conforme código existente.
- Persistência local em SQLite (`expo-sqlite`), com migração de registros legados de AsyncStorage.
- Fotos com `expo-image-picker` e armazenamento de documentos via `expo-file-system`.
- Localização com `expo-location`.
- OpenStreetMap e Leaflet na implementação web.
- Testes com `node:test`.
- Supabase não faz parte da arquitetura e não foi introduzido.

## 3. Funcionalidades encontradas

Cadastro, edição, exclusão e busca de lugares; coordenadas e localização atual; mapa nativo/web; tema claro/escuro; SQLite local; migração de banco antigo; fluxo de foto com permissão, prévia, confirmar, refazer, descartar, substituir e remover; recuperação da foto a partir do URI salvo.

## 4. Execução automatizada inicial

Comando: `npm test` (diretório `frontend`).

Ambiente: Node.js v22.16.0.

Resultado: **22 testes aprovados, 0 falhas** antes das alterações desta entrega.

Os testes exercitam lógica pura, persistência SQLite simulada/isolada e migração. Eles não substituem validação de câmera em Android/iOS físico.

## 5. Riscos e divergências

1. `docs/aula-2.md` e a planilha declaravam React Native 0.81 / Expo SDK 54, divergentes do `package.json` (0.88.0 / SDK 58); documentação foi corrigida nesta revisão.
2. A pasta `docs/evidencias/` não continha evidências manuais.
3. As execuções manuais CT01–CT04 estavam como “Não executado”.
4. O README apontava para `artifacts/MapPin-1.0.0-atualizado.apk`, mas o arquivo recebido é `artifacts/MapPin V1.apk`; a documentação foi ajustada para não indicar um artefato inexistente.
5. Foi encontrado `frontend/credentials.json`, arquivo de credenciais de assinatura. Ele foi removido do pacote de trabalho e incluído no `.gitignore`. Caso os valores tenham sido compartilhados/publicados, o responsável deve rotacionar/revogar as credenciais no provedor de assinatura; remover o arquivo não invalida credenciais já expostas.
6. Não foi possível confirmar que o APK legado corresponde ao código-fonte atual. Ele permanece identificado como APK recebido, não como build produzido nesta revisão.

## 6. Limitações da auditoria

Não foi realizada instalação em dispositivo Android/iOS, concessão real de permissões, captura por câmera física, validação de modo avião em aparelho, build EAS nem push ao GitHub. Não há dados suficientes para afirmar aprovação dos testes manuais ou avaliação por usuário externo.
