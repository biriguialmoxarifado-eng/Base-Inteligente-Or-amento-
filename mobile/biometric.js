// mobile/biometric.js
// Módulo "Digital" — usa api/auth-api.js, nunca aprova identidade sozinho.
import { AuthAPI } from '../api/auth-api.js';

export async function autenticarDigital() {
  const suporte = await AuthAPI.suportaBiometria();
  if (!suporte.suportado) {
    return { ok: false, motivo: suporte.motivo };
  }
  const resultado = await AuthAPI.autenticarBiometria();
  if (resultado.status === 'pending_config') {
    return { ok: false, pendingConfig: true, motivo: resultado.mensagem };
  }
  if (resultado.status === 'error') {
    return { ok: false, motivo: resultado.mensagem };
  }
  return { ok: true };
}
