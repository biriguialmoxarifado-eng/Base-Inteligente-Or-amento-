// core/session.js
// ------------------------------------------------------------------
// Sessão do usuário identificado. Guarda apenas o necessário no
// dispositivo (id do colaborador, papel, método/hora de autenticação)
// — os dados completos do colaborador vêm sempre de api/usuarios-api.js.
// ------------------------------------------------------------------
import { CONFIG } from './config.js';

const KEY = CONFIG.STORAGE_KEYS.session;

export const Session = {
  get() {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  },
  set({ colaboradorId, role, metodoIdentificacao, autenticadoEm, roleOverrideTeste }) {
    const data = { colaboradorId, role, metodoIdentificacao, autenticadoEm: autenticadoEm || new Date().toISOString(), roleOverrideTeste: roleOverrideTeste || null };
    sessionStorage.setItem(KEY, JSON.stringify(data));
    return data;
  },
  setRoleOverride(role) {
    const s = this.get();
    if (!s) return;
    s.roleOverrideTeste = role || null;
    sessionStorage.setItem(KEY, JSON.stringify(s));
  },
  papelAtivo() {
    const s = this.get();
    if (!s) return null;
    return s.roleOverrideTeste || s.role;
  },
  clear() { sessionStorage.removeItem(KEY); },
  isAuthenticated() { return this.get() !== null; },
};
