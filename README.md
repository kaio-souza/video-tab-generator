# Video Tab Generator

Crie vídeos de tablatura que rolam junto com a música, para aulas de baixo e guitarra.

**Acesse:** https://kaio-souza.github.io/video-tab-generator/

Não precisa instalar nada nem criar conta. Funciona direto no navegador, e sua música não é enviada para lugar nenhum.

---

## Como usar

### 1. Escolha o instrumento

Em **Instrumento**, escolha **Baixo** ou **Guitarra**.

### 2. Escreva a tablatura

1. Clique em **Novo modelo vazio**. Aparece uma linha para cada corda, cheia de tracinhos:

   ```
   G|----------------|----------------|
   D|----------------|----------------|
   A|----------------|----------------|
   E|----------------|----------------|
   ```

2. Troque os tracinhos pelos números das casas, na corda certa:

   ```
   G|----------------|----------------|
   D|----------------|----------------|
   A|--2--2--3--2--0-|--0--0--2--3--2-|
   E|----------------|----------------|
   ```

   - Cada número é uma casa do braço (de 0 a 24).
   - O tracinho `-` é silêncio.
   - Cada bloco entre `|` é um compasso, com 16 espaços.
   - **Troque** os tracinhos, não acrescente: cada linha precisa continuar do mesmo tamanho.

Se algo estiver errado, aparece um aviso em vermelho embaixo do campo dizendo a linha do problema.

### 3. Carregue a música

Em **Arquivo de áudio**, escolha o arquivo da música (MP3, WAV etc.).

### 4. Informe a velocidade (BPM)

BPM é a velocidade da música. Se souber, digite. Se não souber, clique em **Tap tempo** várias vezes, no ritmo da música, como se estivesse batendo o pé.

### 5. Sincronize com a música

1. Clique em **Tocar / pausar**.
2. Quando a primeira nota da tablatura soar, clique em **Marcar início no ponto atual do áudio**.
3. Assista à prévia. Se os números estiverem passando **antes** do som, clique em **+0,1**. Se estiverem **atrasados**, clique em **−0,1**.

### 6. Ajuste uma nota fora do tempo (opcional)

Se só uma nota estiver adiantada ou atrasada, **arraste o número dela na prévia**:

- arraste para a **direita** para a nota acontecer **mais tarde**;
- arraste para a **esquerda** para ela acontecer **mais cedo**.

As outras notas não se mexem. Para desfazer todos os ajustes, clique em **Zerar ajustes de notas**.

### 7. Exporte o vídeo

Clique em **Exportar vídeo**.

- A gravação acontece **enquanto a música toca**: uma música de 3 minutos leva 3 minutos para gravar.
- Pode usar outra aba, mas **não feche o navegador** e **não pause a música**.
- No fim, o vídeo é baixado sozinho para a sua pasta de downloads.

### Dicas

- Seu trabalho fica salvo neste navegador. **A música não fica salva**: carregue o arquivo de novo quando voltar.
- Você pode mudar a **cor de destaque** e o **fundo** do vídeo.
- Use Chrome, Edge, Firefox ou Safari atualizados.

---

## Parte técnica

### Formato da tablatura

| Elemento | Regra |
| --- | --- |
| Linha | Nome da corda (uma letra) + `\|`, terminando com `\|`. Uma linha por corda, na ordem do instrumento. |
| Compasso | Exatamente 16 posições (semicolcheias em 4/4). |
| Traste | 0 a 24. Dois dígitos ocupam duas posições. |
| Silêncio | `-` |
| Técnicas | `x` abafado, `h` hammer-on, `p` pull-off, `/` `\` slide, `~` vibrato, `b` bend, `r` release. |
| Sistemas | Blocos com todas as cordas, separados por linha em branco e tocados em sequência. |

Cada posição dura `60 / BPM / 4` segundos. Enquanto houver erro na tablatura, a exportação fica bloqueada.

### Instrumentos

- Baixo `G D A E` e guitarra `e B G D A E`. Os nomes diferenciam maiúsculas (`e` ≠ `E`).
- **Personalizado**: nomes das cordas de cima para baixo, uma letra cada, separados por espaço ou vírgula (ex.: `e B G D A D` para Drop D). Nomes repetidos são aceitos: a corda é identificada pela linha dentro do sistema.
- Cada instrumento guarda a própria tablatura e os próprios ajustes de notas.

### Ajuste de notas (arrastar)

- Só o movimento horizontal conta. Uma posição de largura na prévia = uma semicolcheia; o valor é livre e arredondado para milissegundos.
- O ajuste move o número e o momento em que ele acende no playhead, e entra no vídeo exportado.
- Funciona com mouse, toque e caneta. Só notas visíveis na prévia podem ser arrastadas.
- Os ajustes são guardados como `corda@posição`. Inserir ou apagar caracteres antes de uma nota desloca os ajustes das notas seguintes.

### Vídeo

- 1280×720, playhead fixo a 1/4 da largura, números de compasso no topo, tempo e barra de progresso embaixo.
- Gravação com `MediaRecorder`, de 1 s antes do início da tab até 1 s depois do fim, a ~30 quadros por segundo e 6 Mbps.
- Sai em MP4 quando o navegador suporta e em WebM caso contrário (`tablatura-<data>.mp4`/`.webm`).
- Os quadros são gerados por um timer em Web Worker, então a gravação continua com a aba em segundo plano.

### Armazenamento

Tudo é salvo no `localStorage` (tablaturas, ajustes, instrumento, cores, BPM, início). O áudio não é salvo. Em janela anônima o app funciona, mas não guarda nada.

### Limitações

- Subdivisão fixa em semicolcheias, só 4/4, sem tercinas.
- Um único BPM para a música toda.
- Nomes de corda com uma letra só (`F#`, `Bb` não são aceitos).

### Rodar localmente

Os módulos JavaScript não carregam abrindo o `index.html` direto. Rode um servidor na pasta do projeto:

```
python3 -m http.server 8000
```

e abra `http://localhost:8000`.

### Publicação

Publicado pelo GitHub Pages a partir da branch `master`, pasta `/ (root)`.

### Estrutura do código

```
index.html            interface
style.css             estilos
src/instruments.js    instrumentos, fundos e cor padrão
src/parser.js         tablatura ASCII → eventos com tempo, com validação
src/render.js         desenho de cada quadro no canvas
src/export.js         gravação do canvas + áudio com MediaRecorder
src/app.js            ligação entre interface, áudio, arraste de notas e gravação
```
