# video-tab-generator

Gera vídeos de tablatura sincronizados com a música, para criadores de conteúdo de aulas de baixo e guitarra.

Roda inteiro no navegador, sem servidor e sem dependências, então pode ser publicado no GitHub Pages.

## Sumário

- [Telas](#telas)
- [Início rápido](#início-rápido)
- [Tablatura](#tablatura)
- [Instrumento e visual](#instrumento-e-visual)
- [Áudio e sincronia](#áudio-e-sincronia)
- [Prévia e o vídeo](#prévia-e-o-vídeo)
- [Arrastar notas na prévia](#arrastar-notas-na-prévia)
- [Exportar o vídeo](#exportar-o-vídeo)
- [O que fica salvo](#o-que-fica-salvo)
- [Navegadores compatíveis](#navegadores-compatíveis)
- [Limitações](#limitações)
- [Rodar localmente](#rodar-localmente)
- [Publicar no GitHub Pages](#publicar-no-github-pages)
- [Como gerar as capturas](#como-gerar-as-capturas)
- [Estrutura do código](#estrutura-do-código)

## Telas

**Editor e prévia**

![Editor e prévia](docs/screenshot-editor.png)

**Ajuste de notas arrastando na prévia**

![Arrastar notas](docs/screenshot-drag.png)

**Validação da tablatura**

![Erros de validação](docs/screenshot-errors.png)

> Para adicionar as capturas, veja [Como gerar as capturas](#como-gerar-as-capturas).

## Início rápido

1. Escolha o instrumento e escreva (ou cole) a tablatura.
2. Carregue o arquivo de áudio da música.
3. Informe o BPM, ou use **Tap tempo**.
4. Toque a música e clique em **Marcar início no ponto atual do áudio** quando a primeira nota soar.
5. Confira a prévia. Se alguma nota estiver adiantada ou atrasada, arraste-a para o lado.
6. Clique em **Exportar vídeo**.

## Tablatura

Escreva uma linha por corda, na ordem do instrumento (de cima para baixo), começando com o nome da corda e um `|`:

```
G|----------------|----------------|
D|----------------|----------------|
A|--2--2--3--2--0-|--0--0--2--3--2-|
E|----------------|----------------|
```

### Regras do formato

| Elemento | Regra |
| --- | --- |
| Linha | Começa com o nome da corda (uma letra) seguido de `\|` e termina com `\|`. |
| Compasso | Exatamente **16 posições** (semicolcheias em 4/4), fechado por `\|`. Todas as cordas de um sistema precisam ter o mesmo número de compassos. |
| Traste | Número de 0 a 24. Dois dígitos ocupam duas posições (`12` usa duas casas). |
| Silêncio | `-` |
| Técnicas | `x` (abafado), `h` (hammer-on), `p` (pull-off), `/` e `\` (slide), `~` (vibrato), `b` (bend), `r` (release). Aparecem no vídeo como as notas. |
| Sistemas | Um sistema é um bloco com todas as cordas. Separe sistemas com uma linha em branco; eles são tocados em sequência, um depois do outro. |

Com o BPM informado, cada posição dura `60 / BPM / 4` segundos. A 120 BPM, uma posição dura 0,125 s e um compasso dura 2 s.

### Validação

Erros de formato aparecem em vermelho abaixo do campo, com o número da linha. Exemplos:

- corda fora de ordem, faltando ou que não existe no instrumento;
- linha sem `|` no final;
- compasso com mais ou menos de 16 posições;
- número de compassos diferente entre as cordas de um sistema;
- caractere não permitido;
- traste acima de 24.

Mesmo com erros, a prévia continua mostrando as notas válidas, mas **a exportação fica bloqueada** até tudo ser corrigido.

### Modelo vazio

Escolha a quantidade de compassos (1 a 32) em **Compassos no modelo** e clique em **Novo modelo vazio** para gerar as linhas do instrumento atual preenchidas com `-`. Se já houver uma tablatura, o app pede confirmação antes de substituí-la.

## Instrumento e visual

- **Instrumento**
  - **Baixo (4 cordas)**: `G D A E`.
  - **Guitarra (6 cordas)**: `e B G D A E`.
  - **Personalizado**: digite os nomes das cordas de cima para baixo, separados por espaço ou vírgula. Cada nome é uma única letra. Exemplos: `e B G D A D` (guitarra em Drop D), `G D A E B` (baixo de 5 cordas). Nomes repetidos são permitidos: o app identifica a corda pela linha dentro do sistema.
- Os nomes **diferenciam maiúsculas**: na guitarra, `e` é a corda mais fina e `E` a mais grossa.
- Cada instrumento guarda **a própria tablatura e os próprios ajustes de notas**. Trocar de instrumento não apaga nada.
- **Cor de destaque**: cor do playhead, da nota que está soando, da barra de progresso e dos destaques da interface.
- **Fundo**: Noite, Grafite, Azul-marinho ou Roxo.

## Áudio e sincronia

- **Arquivo de áudio**: qualquer formato que o navegador toque (MP3, WAV, OGG, M4A…). O arquivo não é enviado para lugar nenhum.
- **BPM** (20 a 300): o andamento da música.
- **Tap tempo**: clique no ritmo da música. O BPM é a média dos últimos 8 cliques; uma pausa de mais de 2 segundos recomeça a contagem.
- **Início da tab (s)**: momento do áudio, em segundos, em que a primeira posição da tablatura começa.
  - **Marcar início no ponto atual do áudio** copia o tempo atual do player para esse campo. Toque a música e clique quando a primeira nota soar (ou pause no ponto certo e clique).
  - **−0,1** e **+0,1** fazem ajuste fino de um décimo de segundo. Também dá para digitar o valor direto, com centésimos.
- **Zerar ajustes de notas** desfaz todos os ajustes feitos arrastando notas no instrumento atual (pede confirmação).

O início da tab desloca a tablatura inteira; o arraste de notas ajusta uma nota de cada vez. Comece acertando o início e o BPM, e só depois corrija notas individuais.

## Prévia e o vídeo

A prévia mostra exatamente o quadro que vai para o vídeo, em 1280×720 (16:9):

- as cordas na horizontal, com os nomes em círculos à esquerda;
- as notas correm da direita para a esquerda e passam pelo **playhead**, a linha vertical fixa a um quarto da largura;
- a nota que está soando acende com a cor de destaque; as que já passaram ficam apagadas;
- linhas de compasso com o número de cada compasso no topo;
- embaixo, o tempo atual da tablatura em segundos (negativo antes do início) e uma barra de progresso.

Use **Tocar / pausar** ou os controles do player para ouvir a música junto com a prévia. Ao avançar ou voltar no player, a prévia acompanha.

## Arrastar notas na prévia

Às vezes uma nota da gravação não cai exatamente na grade de semicolcheias (um atraso de propósito, um swing, uma imprecisão do músico). Para isso, dá para mover cada número da tablatura individualmente, direto na prévia do vídeo.

**Como usar**

1. Pare o áudio no trecho da nota (ou deixe tocando, se preferir).
2. Passe o mouse sobre o número da nota na prévia: o cursor vira uma mão.
3. Clique e arraste para os lados:
   - **para a direita**: a nota acontece **mais tarde**;
   - **para a esquerda**: a nota acontece **mais cedo**.
4. Solte. O ajuste é salvo na hora.

**Detalhes**

- Só o movimento horizontal conta; arrastar para cima ou para baixo não muda a nota de corda.
- A largura de uma posição na prévia equivale à duração de uma semicolcheia. Arrastar uma posição inteira move a nota uma semicolcheia; arrastar meia posição move meia semicolcheia. Não há encaixe na grade: o ajuste é livre e arredondado para milissegundos.
- O ajuste muda tanto o lugar onde o número aparece quanto o momento em que ele acende no playhead.
- Cada nota é ajustada sozinha; as outras não se mexem.
- Para refazer, arraste a nota de novo. O novo arraste parte do ajuste atual.
- Para desfazer todos os ajustes do instrumento, use **Zerar ajustes de notas**.
- Funciona com mouse, toque (celular e tablet) e caneta.
- Só dá para arrastar as notas que estão visíveis na prévia. Notas atrás dos nomes das cordas, à esquerda, não podem ser arrastadas: avance ou volte o áudio até a nota aparecer.
- Os ajustes entram no vídeo exportado.
- Os ajustes são guardados por instrumento e identificados pela corda e pela posição da nota na tablatura. Veja a [limitação](#limitações) ao editar a tablatura depois de ajustar.

## Exportar o vídeo

Clique em **Exportar vídeo**. Antes de começar, o app confere se há áudio carregado, se a tablatura tem notas e se não há erros.

- A gravação começa **1 segundo antes** do início da tab e termina **1 segundo depois** da última posição.
- Ela roda **em tempo real**: um trecho de 3 minutos leva 3 minutos. O áudio toca durante a gravação.
- Você pode trocar de aba enquanto grava, mas não pode fechar o navegador nem a aba. Pausar o player encerra a gravação no ponto em que estiver.
- O arquivo sai em **MP4** quando o navegador suporta (Safari, Chrome recente) e em **WebM** caso contrário, com cerca de 30 quadros por segundo e 6 Mbps de vídeo.
- O download começa sozinho, com o nome `tablatura-<data>.mp4` (ou `.webm`).

## O que fica salvo

Tudo fica no `localStorage` do navegador e volta quando você reabre a página:

- a tablatura de cada instrumento;
- os ajustes de notas de cada instrumento;
- instrumento, cordas personalizadas, cor de destaque e fundo;
- BPM, compassos do modelo e início da tab.

**O arquivo de áudio não é salvo**: carregue-o de novo a cada visita. Em janela anônima, ou com o armazenamento bloqueado, o app funciona, mas não salva nada. Os dados ficam só neste navegador, neste computador.

## Navegadores compatíveis

Precisa de um navegador atual com Canvas, Web Audio e `MediaRecorder`: Chrome, Edge, Firefox ou Safari recentes. Se o navegador não conseguir gravar vídeo, o app mostra uma mensagem de erro ao exportar.

## Limitações

- Os ajustes de notas são identificados pela corda (a linha dentro do sistema) e pela posição. Se você inserir ou apagar caracteres antes de uma nota, os ajustes das notas seguintes podem ir para posições erradas. Confira a prévia depois de editar a tablatura.
- A subdivisão é fixa em semicolcheias, com 16 posições por compasso (4/4). Não há outras fórmulas de compasso nem tercinas.
- O BPM é único para a música toda.
- Nomes de corda têm uma letra só (`F#` ou `Bb` não são aceitos).
- A exportação é em tempo real e depende do desempenho do computador; feche outras abas pesadas se o vídeo engasgar.

## Rodar localmente

Os módulos JavaScript não carregam abrindo o `index.html` direto pelo sistema de arquivos. Rode um servidor estático na pasta do projeto:

```
python3 -m http.server 8000
```

e abra `http://localhost:8000`.

## Publicar no GitHub Pages

Em **Settings → Pages**, escolha a branch `master` e a pasta `/ (root)`. O site fica em `https://<seu-usuario>.github.io/video-tab-generator/`.

## Como gerar as capturas

Abra o app localmente, tire os prints e salve os arquivos em `docs/`:

```
docs/screenshot-editor.png
docs/screenshot-drag.png
docs/screenshot-errors.png
```

## Estrutura do código

```
index.html            interface
style.css             estilos
src/instruments.js    instrumentos, fundos e cor padrão
src/parser.js         tablatura ASCII → eventos com tempo, com validação
src/render.js         desenho de cada quadro no canvas
src/export.js         gravação do canvas + áudio com MediaRecorder
src/app.js            ligação entre a interface, o áudio, o arraste de notas e a gravação
```
