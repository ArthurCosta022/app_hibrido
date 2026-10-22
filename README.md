# MapPin

Aplicativo de mapa pessoal e privado feito com Expo/React Native para Android, iOS e web. Permite salvar e encontrar lugares sem conta e mantém os dados somente no dispositivo.

## Recursos

- cadastro, edição, busca e exclusão de lugares;
- foto opcional de cada lugar, tirada com a câmera, com prévia, confirmação e uso offline (Android e iOS);
- zoom por pinça, roda do mouse e botões `+`/`−`;
- atalhos para localização atual e enquadramento dos marcadores;
- tema claro/escuro;
- armazenamento local com SQLite e funcionamento offline;
- mapa do OpenStreetMap sem chave de API.

## Executar

Requer Node.js 22.5 ou superior e npm.

```bash
npm install
npm run dev:frontend
```

No Expo, pressione `w`, `a` ou `i` para abrir na web, Android ou iOS.

## Builds

```bash
npm run build:web
npm run build:apk
```

O APK instalável mais recente está em [`artifacts/MapPin-1.0.0-atualizado.apk`](artifacts/MapPin-1.0.0-atualizado.apk). Os dados de assinatura e SHA-256 estão em [`artifacts/README.md`](artifacts/README.md).

## Offline e privacidade

Os lugares são gravados no banco local `mappin.db` e continuam disponíveis sem internet. Somente o fundo do OpenStreetMap depende de conexão; nenhum marcador é enviado para servidor.

## Documentação da P2

- [`docs/plano-evolucao.md`](docs/plano-evolucao.md): necessidade, critérios de aceitação e plano de testes.
- [`docs/aula-2.md`](docs/aula-2.md): primeiro fluxo, técnicas de teste, execuções e pendências.
- [`docs/testes/`](docs/testes/): planilha com casos, execuções e defeitos.

A foto usa um plugin nativo: depois de atualizar, rode `npm install` e gere um novo build (`npm run build:apk`).

## Verificação

```bash
npm test
npx expo-doctor frontend
npm run build:web
```
