// Grava o canvas + áudio com MediaRecorder e baixa o arquivo.
// Funciona com a aba em segundo plano: os quadros são desenhados por um timer em
// Web Worker (não limitado pelo navegador) e enviados manualmente ao stream.

const MIME_TYPES = [
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm',
];

function pickMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  return MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) || null;
}

function once(target, event) {
  return new Promise((resolve) => target.addEventListener(event, resolve, { once: true }));
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Grava de `start` a `end` (tempos do áudio).
 * @param {function(number): void} drawAt desenha o quadro correspondente ao tempo do áudio
 */
export async function exportVideo({ canvas, audio, dest, start, end, drawAt, onStatus }) {
  const mimeType = pickMime();
  if (!mimeType) throw new Error('Este navegador não consegue gravar vídeo.');

  // Quadros manuais (requestFrame) não dependem do ciclo de pintura da aba
  const probe = canvas.captureStream(0).getVideoTracks()[0];
  const manual = typeof probe.requestFrame === 'function';
  probe.stop();

  const videoTrack = canvas.captureStream(manual ? 0 : 30).getVideoTracks()[0];
  const stream = new MediaStream([videoTrack, ...dest.stream.getAudioTracks()]);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });

  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  const stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = (e) => reject(e.error || new Error('Falha na gravação.'));
  });

  const workerUrl = URL.createObjectURL(
    new Blob(['setInterval(() => postMessage(0), 33);'], { type: 'text/javascript' }),
  );
  const worker = new Worker(workerUrl);

  try {
    audio.pause();
    if (Math.abs(audio.currentTime - start) > 0.01) {
      audio.currentTime = start;
      await once(audio, 'seeked');
    }

    const pushFrame = () => {
      drawAt(audio.currentTime);
      if (manual) videoTrack.requestFrame();
    };

    pushFrame();
    recorder.start(1000);
    await audio.play();
    onStatus('Gravando… pode trocar de aba, mas não feche o navegador.');

    await new Promise((resolve) => {
      worker.onmessage = () => {
        pushFrame();
        if (audio.currentTime >= end || audio.paused || audio.ended) resolve();
      };
    });
  } finally {
    worker.terminate();
    URL.revokeObjectURL(workerUrl);
    audio.pause();
    if (recorder.state !== 'inactive') recorder.stop();
  }

  await stopped;
  videoTrack.stop();

  const blob = new Blob(chunks, { type: mimeType.split(';')[0] });
  const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
  download(blob, `tablatura-${Date.now()}.${ext}`);
}
