# Desktop Launcher

Launcher Android com ambiente de trabalho, barra de tarefas (dock), página de aplicações,
centro de notificações e papel de parede. Usa Java + WebView + HTML/CSS/JavaScript.

## Funcionalidades

- **Ambiente de trabalho** com atalhos Aplicações, Papel de parede e Definições, mais as apps afixadas.
- **Barra de tarefas** com botão Iniciar, apps afixadas, notificações (com ponto quando há novidades) e relógio.
- **Afixar apps**: toque longo num ícone (no painel de aplicações, no desktop ou na barra) abre um menu para afixar ou remover no ambiente de trabalho e na barra. As fixações ficam guardadas no dispositivo.
- **Ícones reais** das aplicações, lidos do sistema (PackageManager). Quando o sistema não devolve um ícone, usa-se um ícone de marca incluído no projeto.
- **Papel de parede**: cinco imagens incluídas ou uma imagem da galeria, escolhidas no painel Papel de parede.
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


## v0.3.1 — correção de compilação
- Removida qualquer referência a `androidx.core.app.NotificationManagerCompat`.
- A autorização do serviço de notificações é verificada pela API nativa `Settings.Secure.ENABLED_NOTIFICATION_LISTENERS`, sem dependência AndroidX adicional.
- Atualizado `versionCode` para 3 e `versionName` para 0.3.1.
- Removido o atributo `package` obsoleto do Manifest; o namespace continua definido em `app/build.gradle`.

A correção elimina a causa indicada no log de compilação partilhado. A compilação completa ainda deve ser confirmada no GitHub Actions.

## v0.3.2 — correções de interface
- **Dock**: a barra deixou de partir em duas linhas (o bloco de volume, notificações e relógio ficava fora da barra). A pesquisa fica reduzida a um ícone em ecrãs estreitos e expande ao toque.
- **Arrastar ícones afixados**: passou a funcionar com toque (antes usava drag-and-drop HTML5, que a WebView do Android não suporta). Arrastar entre o ambiente de trabalho e a dock move o ícone; largar fora da barra ou do ambiente não altera nada.
- **Painel de aplicações**: a lista faz scroll dentro do painel em vez de transbordar.
- **Notificações**: a lista só é redesenhada quando há mudanças, por isso a rolagem deixa de saltar a cada atualização. Tocar numa notificação abre a aplicação de origem, e o botão × dispensa-a (remove-a do sistema quando o acesso às notificações está ativo).
- **Ícones**: todos os símbolos de texto (⚙, ◉, ᛒ, ⌖, ◖, ⌕) foram substituídos por ícones `ic_*`. O ícone de volume e o de Wi-Fi mudam conforme o estado.
- Os controlos rápidos indicam o estado (`aria-pressed`) e o slider de volume não é reposto enquanto está a ser arrastado.

## v1.0.0 — perfil, personalização da barra e aplicações

- **Perfil**: nome de utilizador editável (até 24 caracteres) e avatar à escolha entre os dois incluídos (`ic_avatar_00` e `ic_avatar_01`). O perfil aparece no topo do painel de aplicações.
- **Papel de parede do utilizador**: o botão Galeria abre o seletor de imagens do Android. A imagem é reduzida para 1600 px e guardada no armazenamento interno da app (`wallpaper_custom.jpg`), por isso não depende da galeria depois de escolhida.
- **Barra de tarefas**: altura da barra (52–84 px) e tamanho dos ícones afixados (20–40 px) ajustáveis em Configurações, com «Repor predefinições».
- **Volume, notificações e relógio** passam para a extrema direita da barra, separados das apps afixadas por um traço.
- **Aplicações ocultas**: no menu de toque longo, «Ocultar» retira a app do painel, da pesquisa, do ambiente de trabalho e da barra. As fixações ficam guardadas, por isso voltam a aparecer ao mostrar a app de novo, em Configurações → Aplicações ocultas.
- **Painel de aplicações redesenhado**: separador em forma de pílula, pesquisa arredondada, ícones maiores em grelha, sem o pino que marcava as apps afixadas.
- **Configurações** organizadas em secções: Perfil, Aspeto, Barra de tarefas, Aplicações ocultas e Sistema.
- Versão: `versionName` 1.0.0, `versionCode` 6.

Os dados antigos (versão 0.3.x) são lidos automaticamente na primeira abertura.

### Notas
- O papel de parede personalizado não fica em `localStorage`: a imagem é lida do armazenamento interno da app pela ponte Java a cada arranque.
- Ocultar uma app não a desinstala nem remove as fixações; a lista de ocultas está em Configurações.

