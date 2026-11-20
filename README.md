# Desktop Launcher

Launcher Android com ambiente de trabalho, barra de tarefas, painel de aplicações, centro de
notificações e personalização de perfil e aspeto. Implementado com Java e WebView, com a interface
em HTML, CSS e JavaScript.

**Versão:** 1.1.0-beta (`versionName` 1.1.0-beta, `versionCode` 7)

> Esta versão é uma beta. Foi revista ao nível do código, mas ainda não foi validada num conjunto
> alargado de dispositivos. Reporta os problemas encontrados.

## Funcionalidades

**Ambiente de trabalho**
- Atalhos afixados com ícones reais das aplicações, reorganizáveis por arrasto no modo «Organizar».
- Papel de parede: cinco imagens incluídas ou uma imagem escolhida na galeria.

**Barra de tarefas**
- Botão Iniciar, pesquisa centrada e aplicações afixadas, seguidas à direita por volume, notificações e relógio.
- Altura da barra (52–84 px) e tamanho dos ícones (20–40 px) ajustáveis, com opção de repor os valores.
- A pesquisa encontra aplicações, definições principais e, sem resultados, oferece pesquisa no Google.

**Painel de aplicações**
- Pesquisa, grelha de aplicações e separador de Configurações.
- Toque longo numa aplicação: renomear, mudar o ícone, afixar ou remover do ambiente e da barra,
  ocultar, desinstalar ou ver as informações do sistema.
- Aplicações ocultas saem do painel, da pesquisa, do ambiente de trabalho e da barra. As fixações
  são mantidas e a aplicação pode ser mostrada de novo em Configurações → Aplicações ocultas.

**Perfil e configurações**
- Nome de utilizador (até 24 caracteres) e avatar escolhido entre dois avatares incluídos.
- Secções: Perfil, Aspeto, Barra de tarefas, Aplicações ocultas e Sistema.

**Centro de ações**
- Controlos rápidos de Wi-Fi, Bluetooth e localização, com indicação de estado.
- Volume e brilho.
- Lista das notificações recentes (até 40), com a aplicação de origem, dispensa individual e
  limpeza total. Tocar numa notificação abre a aplicação de origem.

## Requisitos

- Android 6.0 (API 23) ou superior.
- JDK 17.
- Android Gradle Plugin 7.4.2 e Gradle 7.6.3.
- `compileSdk` e `targetSdk` 33.

## Compilação

O workflow `.github/workflows/android.yml` compila o APK de debug em cada push para `main` ou
`master`, e também pode ser iniciado manualmente em Actions. O APK fica disponível como artefacto
`DesktopLauncher-debug`.

## Estrutura do projeto

```
app/src/main/
  assets/                                interface web (index.html, css/, js/, wallpapers/)
  java/com/tayson/desktop/
    MainActivity.java                    WebView, ponte "Desktop" e seletor de papel de parede
    DesktopNotificationListener.java     regista as notificações recentes
  res/drawable/                          ícones vetoriais ic_*.xml (gerados)
  res/drawable-nodpi/                    ícones de marca, avatares (PNG)
icons-src/svg/                           origem dos ícones (SVG), a editar aqui
tools/svg_to_vector.py                   converte icons-src/svg em res/drawable
```

## Ícones

Os ícones de funcionalidade são SVG em `icons-src/svg/`. Para os converter em VectorDrawable:

```
python3 tools/svg_to_vector.py
```

O script gera um `ic_<nome>.xml` por cada SVG, além de `ic_launcher.xml`, que usa o desenho de
`category.svg` como glifo. Os ficheiros gerados não se editam à mão.

Para adicionar um ícone, cria `icons-src/svg/<nome>.svg` com `viewBox` e elementos `<path>`, `<circle>`,
`<rect>` ou `<polygon>`, e volta a executar o script. Na interface, usa-se
`<img data-icon="ic_<nome>">`.

## Papel de parede personalizado

A imagem escolhida na galeria é reduzida para um máximo de 1600 px e guardada como
`wallpaper_custom.jpg` no armazenamento interno da aplicação. Escolher outra imagem substitui a
anterior, por isso só existe uma imagem personalizada de cada vez.

## Notificações

Para ver as notificações, abre o centro de ações e escolhe **Ativar acesso às notificações**. O
Android abre as definições próprias, onde o acesso tem de ser concedido manualmente.

## Limitações conhecidas

- Em Android 10 ou superior, aplicações normais não podem ligar ou desligar o Wi-Fi diretamente. O
  launcher abre o painel oficial do sistema.
- Em Android 13 ou superior, o controlo direto do Bluetooth também é limitado, e o launcher abre as
  definições.
- A localização abre sempre as definições do sistema, porque um launcher comum não pode alterar esse
  interruptor.
- O controlo de brilho pode exigir a autorização especial «Modificar definições do sistema».
- O botão Definições do Android abre as definições do sistema, não um painel próprio.
- A lista de aplicações atualiza-se ao abrir o painel de aplicações, ao ganhar foco e ao arrancar.
- `targetSdk` está em 33 porque o AGP 7.4.2 não suporta versões superiores. Para `targetSdk` 34 ou
  superior é necessário AGP 8.x.
