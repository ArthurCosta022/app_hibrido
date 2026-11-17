# Status da entrega MapPin — 16/11/2026

## Concluído
- Auditoria técnica do projeto e correções de documentação.
- Preservação da arquitetura Expo/React Native com SQLite local e uso offline.
- Inclusão dos casos CT05 a CT08 na planilha de testes, além de CT01 a CT04.
- Ampliação da suíte automatizada: **24 testes aprovados, 0 falhas**, executados com `npm test` em 16/11/2026.
- Remoção do arquivo local `frontend/credentials.json` do pacote e atualização do `.gitignore`.

## Pendente / não comprovado
- Testes manuais CT01 a CT08 em dispositivo Android real, com registros de evidências.
- Validação externa, retestes manuais e regressão em dispositivo.
- Geração de um APK novo: o APK em `artifacts/MapPin V1.apk` é legado e não foi comprovado como build do código atual.
- Apresentação editável em PPTX, não incluída nesta versão parcial do pacote.
- Publicação de commits no GitHub (não realizada).

## Atenção de segurança
Se `frontend/credentials.json` já foi versionado ou compartilhado anteriormente, recomenda-se revogar/substituir as credenciais de assinatura expostas. A exclusão do arquivo do pacote não elimina cópias históricas.

Este documento distingue evidências verificadas de atividades ainda pendentes; nenhuma execução manual foi declarada aprovada.
