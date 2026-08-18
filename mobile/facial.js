// mobile/facial.js
// Módulo "Rosto" — abre a câmera real do dispositivo (getUserMedia).
// NÃO faz reconhecimento facial no cliente: isso deve ser feito por um
// mecanismo compatível do dispositivo/backend (ver CONFIG). Aqui apenas
// confirmamos que a câmera está disponível e entregamos o stream para
// a tela de identificação, deixando explícito quando falta integração.
let stream = null;

export function suportaCamera() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

export async function iniciarCameraFacial(videoEl) {
  if (!suportaCamera()) return { ok: false, motivo: 'Este dispositivo não possui suporte para este método.' };
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    videoEl.srcObject = stream;
    return { ok: true, pendingConfig: true, motivo: 'Câmera ativa. Conecte o mecanismo de reconhecimento facial do dispositivo/servidor no ponto de integração para validar a identidade de verdade.' };
  } catch (e) {
    return { ok: false, motivo: 'Não foi possível acessar a câmera (permissão negada ou indisponível).' };
  }
}

export function pararCameraFacial() {
  if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
}
