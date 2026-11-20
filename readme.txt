DESKTOP LAUNCHER - v1.1.0-beta
==============================

Launcher Android com ambiente de trabalho, barra de tarefas, painel de aplicações,
centro de ações e personalização de perfil e aspeto.

Estado: beta. Revisto ao nível do código, mas ainda não validado num conjunto alargado
de dispositivos. Reporta qualquer problema encontrado.


O QUE HÁ DE MELHOR NESTA VERSÃO
-------------------------------

1. Barra de tarefas mais organizada
   A pesquisa e as aplicações afixadas ficam juntas ao centro, e o bloco de sistema
   (volume, notificações e relógio) fica na extrema direita, separado por um traço.
   Deixou de haver um vão grande entre a pesquisa e as aplicações.

2. Altura da barra e tamanho dos ícones ajustáveis
   Em Configurações → Barra de tarefas, podes escolher a altura (52 a 84 px) e o tamanho
   dos ícones afixados (20 a 40 px). Há um botão para repor os valores originais.

3. Papel de parede da galeria
   Além dos cinco papéis de parede incluídos, podes escolher uma imagem da tua galeria.
   A imagem é guardada na app, por isso não depende da galeria depois de escolhida.

4. Aplicações ocultas
   No toque longo, a opção «Ocultar» retira a app do painel, da pesquisa, do ambiente de
   trabalho e da barra. As fixações são mantidas, e podes mostrar a app de novo em
   Configurações → Aplicações ocultas.

5. Painel de aplicações redesenhado
   Separador em forma de pílula, pesquisa arredondada, ícones maiores em grelha e sem o
   indicador de aplicações afixadas.

6. Perfil personalizável
   Nome de utilizador (até 24 caracteres) e avatar escolhido entre dois avatares incluídos.

7. Ícone novo para o botão de aplicações
   O botão Iniciar, a entrada «Aplicações» da pesquisa e o ícone de reserva usam agora o
   novo ícone de aplicações (ic_app).


FUNCIONALIDADES DO PROJETO
--------------------------

AMBIENTE DE TRABALHO
- Atalhos afixados com os ícones reais das aplicações.
- Modo «Organizar»: arrasta os atalhos para os reordenar, ou entre o ambiente de trabalho
  e a barra.
- Papel de parede: cinco imagens incluídas ou uma imagem da galeria.

BARRA DE TAREFAS
- Botão Iniciar, pesquisa centrada e aplicações afixadas.
- Volume, notificações (com indicador quando há novidades) e relógio com data, à direita.
- Altura da barra e tamanho dos ícones ajustáveis.

PESQUISA
- Encontra aplicações e definições principais (Wi-Fi, Bluetooth, localização, notificações,
  papel de parede e definições do Android).
- Sem resultados locais, oferece pesquisa no Google.
- Acentos são ignorados: «definicoes» encontra «definições».

PAINEL DE APLICAÇÕES
- Pesquisa e grelha de todas as aplicações visíveis, por ordem alfabética.
- Toque longo numa aplicação, no ambiente, na barra ou no painel, abre o menu com:
    · Renomear (nome só no launcher)
    · Editar ícone (escolha entre ícones incluídos ou o original)
    · Afixar ou remover do ambiente de trabalho e da barra
    · Organizar
    · Ocultar
    · Desinstalar (o Android pede a confirmação final)
    · Informação da aplicação (definições do sistema)

PERFIL E CONFIGURAÇÕES
- Nome de utilizador e avatar, editáveis a partir do topo do painel de aplicações.
- Secções: Perfil, Aspeto, Barra de tarefas, Aplicações ocultas e Sistema.

CENTRO DE AÇÕES
- Controlos rápidos de Wi-Fi, Bluetooth e localização, com o estado de cada um.
- Volume (com silenciar) e brilho.
- Lista das notificações recentes, até 40, com a aplicação de origem.
  · Tocar numa notificação abre a aplicação de origem.
  · O botão × dispensa uma notificação.
  · «Limpar tudo» remove as notificações ativas.

ATALHOS DO TECLADO E DO SISTEMA
- Escape fecha diálogos, menus e painéis.
- O botão Voltar fecha o que estiver aberto antes de sair do launcher.


REQUISITOS
----------
- Android 6.0 (API 23) ou superior.
- Para compilar: JDK 17, Android Gradle Plugin 7.4.2, Gradle 7.6.3, compileSdk e targetSdk 33.

ESTRUTURA
---------
app/src/main/assets/                    interface web: index.html, css/, js/, wallpapers/
app/src/main/java/com/tayson/desktop/   MainActivity.java e DesktopNotificationListener.java
app/src/main/res/drawable/              ícones vetoriais ic_*.xml (gerados)
app/src/main/res/drawable-nodpi/        ícones de marca e avatares (PNG)
icons-src/svg/                          origem dos ícones (SVG)
tools/svg_to_vector.py                  converte icons-src/svg em res/drawable


ÍCONES
------
Os ícones de funcionalidade são SVG em icons-src/svg/. Para os converter:

    python3 tools/svg_to_vector.py

Não edites à mão os ficheiros ic_*.xml gerados. Para adicionar um ícone, cria um SVG
em icons-src/svg/ e volta a executar o script.


PAPEL DE PAREDE PERSONALIZADO
-----------------------------
A imagem da galeria é reduzida para um máximo de 1600 px e guardada como
wallpaper_custom.jpg no armazenamento interno da app. Escolher outra imagem substitui a
anterior, por isso só existe uma imagem personalizada de cada vez.


NOTIFICAÇÕES
------------
Para ver as notificações, abre o centro de ações e escolhe «Ativar acesso às
notificações». O Android abre as definições próprias, onde o acesso tem de ser concedido
manualmente.


LIMITAÇÕES CONHECIDAS
---------------------
- Em Android 10 ou superior, o launcher não liga nem desliga o Wi-Fi diretamente: abre o
  painel oficial do sistema.
- Em Android 13 ou superior, o Bluetooth também só se controla através das definições.
- A localização abre sempre as definições do sistema.
- O controlo de brilho pode exigir a autorização «Modificar definições do sistema».
- O botão Definições do Android abre as definições do sistema, não um painel próprio.
- A lista de aplicações atualiza-se ao abrir o painel, ao ganhar foco e ao arrancar.
- targetSdk está em 33 porque o AGP 7.4.2 não suporta versões superiores.
