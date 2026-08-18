// core/config.js
// ------------------------------------------------------------------
// Configuração central do ALMOXA PRO. Mobile, Desktop e /api leem
// SEMPRE deste arquivo — não duplique constantes em outros módulos.
// ------------------------------------------------------------------

export const CONFIG = {
  // ******************* PONTO DE INTEGRAÇÃO *******************
  // Preencha com a URL real do backend (Google Apps Script /exec,
  // API REST própria, etc). Enquanto estiver vazio, api/api.js
  // entra automaticamente em MODO DEMONSTRAÇÃO e nenhuma tela
  // finge estar conectada a um backend real.
  API_BASE_URL: '', // ex: 'https://script.google.com/macros/s/XXXXX/exec'
  API_TIMEOUT_MS: 12000,

  // ******************* AUTENTICAÇÃO *******************
  // Preencha quando houver um servidor de credenciais WebAuthn real.
  WEBAUTHN_RP_ID: '',        // ex: 'almoxapro.suaempresa.com'
  WEBAUTHN_CHALLENGE_URL: '', // endpoint que emite o desafio do servidor

  // ******************* AMBIENTE *******************
  APP_NAME: 'ALMOXA PRO',
  APP_TAGLINE: 'Gestão Inteligente para Obras',
  DEFAULT_OBRA: 'Real Parque — Torre 1',

  // ******************* REGRAS DE NEGÓCIO *******************
  RESERVA_PRAZO_PADRAO_HORAS: 24,

  // Chaves de armazenamento local (somente cache/sessão, nunca fonte
  // de verdade quando a API estiver configurada).
  STORAGE_KEYS: {
    session: 'almoxapro_session_v1',
    forcedEnv: 'almoxapro_forced_env',
    demoDb: 'almoxapro_demo_db_v1',
  },
};

export function isBackendConfigured() {
  return Boolean(CONFIG.API_BASE_URL);
}
