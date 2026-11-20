# Desktop Launcher

Launcher Android com ambiente de trabalho, barra de tarefas, painel de aplicações, centro de
notificações e personalização de perfil e aspeto. Implementado com Java e WebView, com a interface
em HTML, CSS e JavaScript.

**Versão:** 1.1.2 (`versionName` 1.1.2, `versionCode` 8)

> Esta versão ainda não foi validada num conjunto alargado de dispositivos. Reporta os problemas encontrados.

## Funcionalidades

**Ambiente de trabalho**
- Atalhos afixados com ícones reais das aplicações. Tamanho dos ícones ajustável (32–72 px).
- Modo «Organizar»: toca num ícone e depois noutro para trocar os lugares. Para mover para o fim, seleciona o ícone e toca no espaço vazio no fim da zona.
- Toque longo no espaço vazio abre o menu: Organizar, Fechar todas as apps e Configurações do launcher.
- Papel de parede: cinco imagens incluídas ou uma imagem escolhida na galeria.

**Barra de tarefas**
- Botão Iniciar, pesquisa centrada e aplicações afixadas, seguidas à direita por volume, notificações e relógio.
- Predefinições: barra de 68 px e ícones de 40 px. Altura da barra (56–84 px) e tamanho dos ícones (20–44 px) ajustáveis, com opção de repor os valores.
- Até três apps abertas pelo launcher aparecem na barra, depois das fixadas. Toque longo numa delas: Fixar na barra ou Fechar app.
- A pesquisa encontra aplicações, definições principais e, sem resultados, oferece pesquisa no Google.

**Painel de aplicações**
- Pesquisa, grelha de aplicações e separador de Configurações.
- Toque longo numa aplicação: renomear, mudar o ícone, afixar ou remover do ambiente e da barra,
  ocultar, desinstalar ou ver as informações do sistema.
- Aplicações ocultas saem do painel, da pesquisa, do ambiente de trabalho e da barra. As fixações
  são mantidas e a aplicação pode ser mostrada de novo em Configurações → Aplicações.

**Configurações do launcher** (painel centrado)
- Perfil: nome de utilizador (até 24 caracteres) e avatar, escolhido entre dois avatares incluídos.
- Aspeto: papéis de parede predefinidos e imagem da galeria.
- Barra e ícones: altura da barra, tamanho dos ícones da barra e do ambiente de trabalho.
- Aplicações: lista de todas as aplicações instaladas, com botão de editar (renomear, ícone) e botão de visibilidade. Quando a app está oculta, o botão fica vermelho.
- Sistema: acesso às definições do Android.

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

## Histórico de versões

### 1.1.2
- Predefinições da barra: 68 px de altura e ícones de 40 px. Quem tinha as predefinições antigas (56 px e 30 px) passa automaticamente para as novas.
- Modo «Organizar» por toque: toca num ícone e depois noutro para trocar de lugar. Substitui o arrasto, que não permitia mover um item para o fim da lista.
- Tamanho dos ícones do ambiente de trabalho ajustável.
- Toque longo no espaço vazio do ambiente abre o menu com Organizar, Fechar todas as apps e Configurações do launcher.
- Até três apps abertas pelo launcher aparecem na barra, com indicador. Toque longo: Fixar na barra ou Fechar app.
- Configurações do launcher em painel centrado, organizado por categorias. A aba de configurações foi retirada do painel de aplicações.
- Lista de aplicações instaladas em Configurações → Aplicações, com editar e ocultar/mostrar. Substitui a lista de apps ocultas.
- Aspeto reúne os papéis de parede predefinidos e a galeria, sem painel separado.

### 1.1.0-beta
- Novo ícone de aplicações (`ic_app`, a partir de `apps.svg`) no botão Iniciar, na pesquisa e como
  ícone de reserva para aplicações sem ícone.
- A barra de tarefas foi reorganizada: pesquisa e aplicações afixadas ficam juntas ao centro, e o
  bloco de sistema permanece na extrema direita.
- Correções de revisão: referência de acessibilidade do painel de aplicações e documentação.

### 1.0.0
- Perfil com nome de utilizador editável e avatar escolhido entre dois avatares.
- Papel de parede personalizado a partir da galeria.
- Altura da barra e tamanho dos ícones ajustáveis.
- Volume, notificações e relógio movidos para a extrema direita da barra.
- Aplicações ocultas, com a opção de as mostrar de novo em Configurações.
- Painel de aplicações redesenhado, sem o indicador de aplicações afixadas.
- Configurações organizadas em secções.
- As preferências das versões anteriores são lidas automaticamente na primeira abertura.

### 0.3.2
- Barra de tarefas corrigida: deixou de partir em duas linhas.
- Arrasto de ícones afixados por toque, em substituição do drag-and-drop HTML5, que a WebView não suporta.
- Painel de aplicações com scroll interno.
- Lista de notificações redesenhada só quando há alterações, com dispensa individual.
- Símbolos de texto substituídos por ícones vetoriais.
- Controlos rápidos com estado (`aria-pressed`).

### 0.3.1
- Removida a dependência de `androidx.core.app.NotificationManagerCompat`. A autorização do serviço de
  notificações passou a ser verificada com `Settings.Secure.ENABLED_NOTIFICATION_LISTENERS`.
- Removido o atributo `package` obsoleto do manifesto.

### 0.3
- Afixação de aplicações no ambiente de trabalho e na barra, através de toque longo.
- Pesquisa na barra com aplicações e pesquisa no Google.
- Controlos de volume, silenciar, brilho e atalhos de Wi-Fi, Bluetooth e localização.
- Limpeza das notificações ativas.
