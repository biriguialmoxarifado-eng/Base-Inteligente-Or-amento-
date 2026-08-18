// api/auth-api.js
// ------------------------------------------------------------------
// Adaptador de autenticação. NÃO aprova biometria/facial fictícia.
// Métodos de dispositivo (WebAuthn/câmera) só CONFIRMAM SUPORTE local;
// a aprovação da identidade sempre depende do backend real quando
// configurado (CONFIG.WEBAUTHN_CHALLENGE_URL / API_BASE_URL).
// ------------------------------------------------------------------
import { request, API_STATUS } from './api.js';
import { CONFIG, isBackendConfigured } from '../core/config.js';
import { loadDemoDb } from './demo-data.js';

export const AuthAPI = {
  async loginMatricula(matricula, senha) {
    const r = await request('/auth/login', { method: 'POST', payload: { matricula, senha }, auth: false });
    if (r.status === API_STATUS.OK) return { ok: true, colaborador: r.data.colaborador, token: r.data.token };
    if (r.status === API_STATUS.PENDING_CONFIG) {
      const db = loadDemoDb();
      const c = db.colaboradores.find((c) => c.matricula === matricula);
      if (!c) return { ok: false, motivo: 'Matrícula não encontrada (modo demonstração).' };
      return { ok: true, colaborador: c, token: null, demo: true };
    }
    return { ok: false, motivo: r.error || 'Falha na autenticação.' };
  },

  /** Verifica SUPORTE do dispositivo a biometria (WebAuthn). Não aprova nada sozinho. */
  async suportaBiometria() {
    if (!window.PublicKeyCredential) return { suportado: false, motivo: 'Navegador sem suporte a WebAuthn.' };
    try {
      const ok = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return { suportado: ok, motivo: ok ? null : 'Este dispositivo não possui suporte para este método.' };
    } catch (e) {
      return { suportado: false, motivo: 'Não foi possível verificar suporte a biometria.' };
    }
  },

  /** Autentica via WebAuthn contra o servidor real. Retorna pendente se não configurado. */
  async autenticarBiometria() {
    if (!CONFIG.WEBAUTHN_CHALLENGE_URL) {
      return { status: 'pending_config', mensagem: 'CONFIGURAÇÃO PENDENTE — conecte CONFIG.WEBAUTHN_CHALLENGE_URL ao servidor de credenciais corporativo.' };
    }
    const desafio = await request('/auth/webauthn/challenge', { method: 'POST', auth: false });
    if (desafio.status !== API_STATUS.OK) return { status: 'error', mensagem: desafio.error };
    // Fluxo real: navigator.credentials.get({ publicKey: desafio.data.publicKey })
    // e envio da assinatura de volta para validação no servidor.
    return { status: 'pending_config', mensagem: 'Fluxo de assinatura WebAuthn preparado — aguardando implementação final do desafio do servidor.' };
  },

  suportaCamera() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  },

  async validarQrCode(payload) {
    const r = await request('/auth/qrcode', { method: 'POST', payload: { payload }, auth: false });
    if (r.status === API_STATUS.OK) return { ok: true, colaborador: r.data.colaborador };
    if (r.status === API_STATUS.PENDING_CONFIG) {
      const db = loadDemoDb();
      const c = db.colaboradores.find((c) => payload.includes(c.matricula)) || db.colaboradores[0];
      return { ok: true, colaborador: c, demo: true };
    }
    return { ok: false, motivo: r.error };
  },

  logout() {
    sessionStorage.removeItem('almoxapro_auth_token');
  },
};
