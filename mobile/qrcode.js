// mobile/qrcode.js
// Módulo "QR Code / Crachá" — leitura real via câmera + jsQR.
import { AuthAPI } from '../api/auth-api.js';

let stream = null;

export async function lerQrCode(videoEl, onLido) {
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
    onLido({ ok: false, motivo: 'Este dispositivo não possui suporte para este método.' });
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    videoEl.srcObject = stream;
    await videoEl.play();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const tick = async () => {
      if (!stream) return;
      if (videoEl.readyState === videoEl.HAVE_ENOUGH_DATA) {
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = window.jsQR ? window.jsQR(img.data, img.width, img.height) : null;
        if (code && code.data) {
          const resultado = await AuthAPI.validarQrCode(code.data);
          pararCameraQr();
          onLido(resultado.ok ? { ok: true, colaborador: resultado.colaborador, demo: resultado.demo } : { ok: false, motivo: resultado.motivo });
          return;
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  } catch (e) {
    onLido({ ok: false, motivo: 'Não foi possível acessar a câmera (permissão negada ou indisponível).' });
  }
}

export function pararCameraQr() {
  if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
}
