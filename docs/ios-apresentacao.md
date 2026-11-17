# Apresentação no iOS — MapPin

O projeto está configurado para iOS com o identificador `com.mappin.app`. O Expo aplica as
mensagens exigidas pelo iOS para localização em primeiro plano e câmera durante o prebuild,
a partir dos plugins em `frontend/app.json`.

## Build para o iPhone

Na raiz do projeto, em uma máquina com Node.js 22.13+ e acesso à conta Expo/EAS:

```bash
npm install
npm run build:ios
```

O perfil `preview` produz uma distribuição interna. Para instalar em um iPhone físico, a conta
Apple usada pelo EAS precisa ter o aparelho registrado no provisionamento ad hoc, ou o build
precisa ser distribuído pelo TestFlight. O simulador não permite testar a câmera real.

## Roteiro mínimo antes da apresentação

1. Instale o build novo no mesmo iPhone que será usado na apresentação.
2. Ao abrir, permita **Localização ao usar o app**; confirme que o botão de localização centraliza o mapa.
3. Toque no mapa, permita **Câmera**, tire uma foto, confirme-a e salve o lugar.
4. Feche e abra o app; edite o lugar e confira que a foto permanece visível.
5. Ative modo avião para demonstrar que lugares e fotos seguem disponíveis; somente o fundo do OpenStreetMap pode não carregar.

O mapa nativo usa `WKWebView` e possui uma grade local de contingência enquanto o OpenStreetMap
carrega ou está indisponível. Os registros permanecem em SQLite no dispositivo.
