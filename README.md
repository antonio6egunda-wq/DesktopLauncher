# Desktop Launcher

Launcher Android com ambiente de trabalho, barra de tarefas (dock), página de aplicações,
centro de notificações e papel de parede. Usa Java + WebView + HTML/CSS/JavaScript.

## Funcionalidades

- **Ambiente de trabalho** com atalhos Aplicações, Papel de parede e Definições, mais as apps afixadas.
- **Barra de tarefas** com botão Iniciar, apps afixadas, notificações (com ponto quando há novidades) e relógio.
- **Afixar apps**: toque longo num ícone (no painel de aplicações, no desktop ou na barra) abre um menu para afixar ou remover no ambiente de trabalho e na barra. As fixações ficam guardadas no dispositivo.
- **Ícones reais** das aplicações, lidos do sistema (PackageManager). Quando o sistema não devolve um ícone, usa-se um ícone de marca incluído no projeto.
- **Papel de parede**: cinco imagens incluídas, escolhidas no painel Personalizar.
- **Centro de notificações** que mostra a app de origem e todas as notificações recentes (até 40). Notificações contínuas, como música ou navegação, são ignoradas.

## Requisitos

- Android mínimo: 6.0 (API 23)
- JDK 17 no ambiente de compilação
- Android Gradle Plugin 7.4.2 / Gradle 7.6.3
- `compileSdk` e `targetSdk` 33

## Compilar

O workflow em `.github/workflows/android.yml` compila o APK em cada push para `main` ou `master`
e também pode ser iniciado manualmente em Actions. O APK de debug fica disponível como artefacto
`DesktopLauncher-debug`.

## Estrutura

```
app/src/main/
  assets/                 interface web (index.html, css/, js/, wallpapers/)
  java/com/tayson/desktop/
    MainActivity.java     WebView e ponte "Desktop" (apps, ícones, notificações, abrir apps)
    DesktopNotificationListener.java   guarda as notificações recentes
  res/drawable/           ícones vetoriais ic_*.xml (gerados, ver abaixo)
  res/drawable-nodpi/     ícones de marca ic_app_*.png
icons-src/svg/            origem dos ícones (SVG), a editar aqui
tools/svg_to_vector.py    converte icons-src/svg em res/drawable
```

## Ícones

Os ícones de funcionalidade são SVG em `icons-src/svg/`. Para os usar no Android:

```
python3 tools/svg_to_vector.py
```

O script gera um `ic_<nome>.xml` (VectorDrawable, branco) por cada SVG, mais o `ic_launcher.xml`.
Os ficheiros gerados têm a marca "Gerado por tools/svg_to_vector.py" e não se devem editar à mão.
Para adicionar um ícone, cria `icons-src/svg/<nome>.svg` com `viewBox` e `<path>`, `<circle>`,
`<rect>` ou `<polygon>`, e volta a correr o script. Na interface, usa `<img data-icon="ic_<nome>">`.

Os ícones chegam à página através de `Desktop.getIcon("ic_<nome>")`, que renderiza o recurso
para uma imagem embebida.

## Notificações

Abre o painel de notificações e escolhe **Ativar acesso às notificações**. O Android abre as
definições próprias, e o utilizador tem de conceder o acesso manualmente.

## Limitações conhecidas

- O botão Definições do desktop abre as definições do Android, não um painel próprio.
- A lista de apps só se atualiza quando se abre o painel de aplicações (ou ao arrancar).
- Ainda não há reordenação de ícones por arrastar. A ordem é a ordem de afixação.
- `targetSdk` está em 33 por causa do AGP 7.4.2. Para 34 ou superior é preciso AGP 8.x.


## v0.3 — personalização e centro de ações
- Corrigido o acesso aos assets locais da WebView para carregar wallpapers e imagens.
- Fixar aplicações no desktop e na Dock através do menu de toque longo.
- Arrastar aplicações já afixadas para a área de trabalho/Dock; a ordem é guardada no armazenamento local.
- Perfil de utilizador e separador de configurações do launcher.
- Pesquisa da Dock: abre a aplicação correspondente ou pesquisa no Google.
- Controlos de volume, mute, brilho e atalhos Wi-Fi/Bluetooth/Localização.
- Limpar notificações ativas.

### Limitações impostas pelo Android
Em Android 10 ou superior, aplicações normais já não podem ligar/desligar Wi-Fi diretamente; o launcher abre o painel oficial do sistema. Em Android 13 ou superior, o controlo direto do Bluetooth também é limitado e abre as definições. A localização abre as definições do sistema porque o Android não permite a um launcher comum alterar silenciosamente esse interruptor. O controlo de brilho pode pedir autorização especial "Modificar definições do sistema".
