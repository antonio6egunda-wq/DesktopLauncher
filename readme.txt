DESKTOP LAUNCHER - v1.1.2
=========================

Launcher Android com ambiente de trabalho, barra de tarefas, painel de aplicações,
centro de ações e configurações do launcher.

Estado: ainda não validado num conjunto alargado de dispositivos. Reporta qualquer
problema encontrado.


NOVIDADES DESTA VERSÃO
----------------------

1. Predefinições da barra: 68 px de altura e ícones de 40 px.
   Quem tinha as predefinições antigas passa automaticamente para as novas.

2. Modo «Organizar» por toque
   Toca num ícone e depois noutro: os dois trocam de lugar. Funciona na área de
   trabalho, na barra e entre as duas. Para mover um item para o fim, seleciona-o e
   toca no espaço vazio no fim da zona.

3. Tamanho dos ícones da área de trabalho
   Ajustável em Configurações → Barra e ícones (32 a 72 px).

4. Menu do espaço vazio
   Mantém premido o espaço vazio do ambiente de trabalho para abrir o menu:
   Organizar, Fechar todas as apps e Configurações do launcher.

5. Apps em segundo plano na barra
   Até três aplicações abertas pelo launcher aparecem na barra, depois das fixadas,
   com um pequeno ponto por baixo. Mantém premida uma delas para a fixar na barra ou
   para a fechar.

6. Configurações do launcher centradas, por categorias
   - Perfil: nome e avatar.
   - Aspeto: papéis de parede predefinidos e imagem da galeria.
   - Barra e ícones: altura da barra, ícones da barra e ícones do ambiente.
   - Aplicações: todas as aplicações instaladas, com botão de editar (renomear,
     ícone) e botão de visibilidade. Quando a app está oculta, o botão fica vermelho.
   - Sistema: definições do Android.


FUNCIONALIDADES
---------------

AMBIENTE DE TRABALHO
- Atalhos afixados com os ícones reais das aplicações.
- Modo «Organizar» por toque (ver acima).
- Menu do espaço vazio por toque longo.
- Papel de parede: cinco imagens incluídas ou uma imagem da galeria.

BARRA DE TAREFAS
- Botão de aplicações, pesquisa centrada e aplicações afixadas.
- Apps em segundo plano, abertas pelo launcher (máximo de três).
- Volume, notificações (com indicador) e relógio com data, à direita.

PESQUISA
- Encontra aplicações e definições principais.
- Sem resultados locais, oferece pesquisa no Google.
- Ignora acentos: «definicoes» encontra «definições».

PAINEL DE APLICAÇÕES
- Pesquisa e grelha das aplicações visíveis, por ordem alfabética.
- Toque longo numa aplicação abre o menu:
    · Renomear (só no launcher)
    · Editar ícone
    · Afixar ou remover do ambiente e da barra
    · Organizar
    · Ocultar
    · Desinstalar (o Android pede a confirmação final)
    · Informação da aplicação
- O botão de definições abre as configurações do launcher. O botão no nome de
  utilizador abre diretamente o perfil.

CONFIGURAÇÕES DO LAUNCHER
- Painel centrado, com categorias: Perfil, Aspeto, Barra e ícones, Aplicações e Sistema.
- Perfil: nome de utilizador (até 24 caracteres) e avatar, entre dois avatares incluídos.
- Aplicações: lista de todas as aplicações instaladas, com editar e ocultar/mostrar.

CENTRO DE AÇÕES
- Controlos rápidos de Wi-Fi, Bluetooth e localização, com o estado de cada um.
- Volume (com silenciar) e brilho.
- Lista das notificações recentes, até 40, com a aplicação de origem.
  · Tocar numa notificação abre a aplicação de origem.
  · O botão × dispensa uma notificação.
  · «Limpar tudo» remove as notificações ativas.

TECLADO E BOTÃO VOLTAR
- Escape fecha diálogos, menus e painéis.
- O botão Voltar fecha o que estiver aberto e, nas configurações, volta à lista de categorias.


REQUISITOS
----------
- Android 6.0 (API 23) ou superior.
- Para compilar: JDK 17, Android Gradle Plugin 7.4.2, Gradle 7.6.3, compileSdk e targetSdk 33.


COMPILAR
--------
O workflow em .github/workflows/android.yml compila o APK de debug a cada push para main
ou master. Também pode ser iniciado manualmente em Actions. O APK fica disponível como
artefacto «DesktopLauncher-debug».


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

Não edites à mão os ficheiros ic_*.xml gerados.


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
- «Fechar app» e «Fechar todas as apps» encerram apenas os processos em segundo plano.
  Uma app que esteja visível no ecrã pode continuar aberta; o Android decide quando a
  encerra. A lista de apps em segundo plano é a das apps abertas pelo launcher, não
  inclui as abertas por outros meios.
- Em Android 10 ou superior, o launcher não liga nem desliga o Wi-Fi diretamente: abre
  o painel oficial do sistema.
- Em Android 13 ou superior, o Bluetooth também só se controla através das definições.
- A localização abre sempre as definições do sistema.
- O controlo de brilho pode exigir a autorização «Modificar definições do sistema».
- targetSdk está em 33 porque o AGP 7.4.2 não suporta versões superiores.
