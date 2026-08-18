// api/api.js
// ------------------------------------------------------------------
// Cliente HTTP único do ALMOXA PRO. TODOS os adaptadores (auth-api,
// epi-api, estoque-api, etc) passam por aqui — nunca chamam fetch()
// diretamente. Isso garante: mesmo timeout, mesmo tratamento de erro,
// mesmo log, e a mesma regra de "não fingir que está conectado".
// ------------------------------------------------------------------
import { CONFIG, isBackendConfigured } from '../core/config.js';

export const API_STATUS = {
  OK: 'ok',
  ERROR: 'error',
  PENDING_CONFIG: 'pending_config', // backend real ainda não configurado
  TIMEOUT: 'timeout',
};

function log(nivel, msg, extra) {
  const linha = `[ALMOXA PRO API] ${nivel.toUpperCase()} — ${msg}`;
  if (nivel === 'error') console.error(linha, extra || '');
  else console.log(linha, extra || '');
}

/**
 * Executa uma chamada real ao backend configurado em CONFIG.API_BASE_URL.
 * Se não houver backend configurado, retorna imediatamente
 * { status: PENDING_CONFIG } — NUNCA inventa uma resposta de sucesso.
 */
export async function request(path, { method = 'GET', payload = null, auth = true } = {}) {
  if (!isBackendConfigured()) {
    log('warn', `Backend não configurado — chamada a "${path}" não foi enviada. Preencha CONFIG.API_BASE_URL em core/config.js.`);
    return { status: API_STATUS.PENDING_CONFIG, data: null, error: 'CONFIGURAÇÃO PENDENTE' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT_MS);
  const url = `${CONFIG.API_BASE_URL.replace(/\/$/, '')}${path}`;

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = sessionStorage.getItem('almoxapro_auth_token');
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(url, {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      log('error', `${method} ${path} -> HTTP ${res.status}`);
      return { status: API_STATUS.ERROR, data: null, error: `HTTP ${res.status}`, httpStatus: res.status };
    }
    const data = await res.json().catch(() => null);
    log('info', `${method} ${path} -> OK`);
    return { status: API_STATUS.OK, data, error: null };
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') {
      log('error', `${method} ${path} -> TIMEOUT (${CONFIG.API_TIMEOUT_MS}ms)`);
      return { status: API_STATUS.TIMEOUT, data: null, error: 'Tempo de resposta excedido' };
    }
    log('error', `${method} ${path} -> ${e.message}`);
    return { status: API_STATUS.ERROR, data: null, error: e.message };
  }
}
