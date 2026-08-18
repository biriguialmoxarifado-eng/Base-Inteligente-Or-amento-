// api/notificacao-api.js
// ------------------------------------------------------------------
// PONTO DE INTEGRAÇÃO PARA TEMPO REAL: em produção, troque o polling
// abaixo por WebSocket/Server-Sent Events/push, para que uma ação no
// Desktop apareça no Mobile sem precisar recarregar a tela.
// ------------------------------------------------------------------
import { request, API_STATUS } from './api.js';
import { loadDemoDb, saveDemoDb } from './demo-data.js';

export const NotificacaoAPI = {
  async listarPara(role, colaboradorId) {
    const r = await request(`/notificacoes?role=${role}${colaboradorId ? `&colaboradorId=${colaboradorId}` : ''}`);
    if (r.status === API_STATUS.OK) return { itens: r.data, demo: false };
    const db = loadDemoDb();
    const itens = db.notificacoes.filter((n) => n.role === role && (!n.colaboradorId || n.colaboradorId === colaboradorId))
      .sort((a, b) => new Date(b.data) - new Date(a.data));
    return { itens, demo: true };
  },
  async marcarLida(id) {
    const r = await request(`/notificacoes/${id}/lida`, { method: 'POST' });
    if (r.status === API_STATUS.OK) return { ok: true };
    const db = loadDemoDb();
    const n = db.notificacoes.find((n) => n.id === id);
    if (n) { n.lida = true; saveDemoDb(db); }
    return { ok: true, demo: true };
  },
  async enviar(role, msg, colaboradorId = null) {
    const r = await request('/notificacoes', { method: 'POST', payload: { role, msg, colaboradorId } });
    if (r.status === API_STATUS.OK) return { ok: true };
    const db = loadDemoDb();
    db.notificacoes.unshift({ id: 'n' + Date.now() + Math.random().toString(16).slice(2), role, colaboradorId, msg, data: new Date().toISOString(), lida: false });
    saveDemoDb(db);
    return { ok: true, demo: true };
  },
};
