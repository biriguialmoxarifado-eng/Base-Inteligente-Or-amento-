// api/reserva-api.js
import { request, API_STATUS } from './api.js';
import { loadDemoDb, saveDemoDb } from './demo-data.js';
import { CONFIG } from '../core/config.js';
import { NotificacaoAPI } from './notificacao-api.js';

export const ReservaAPI = {
  async listar() {
    const r = await request('/reservas');
    if (r.status === API_STATUS.OK) return { itens: r.data, demo: false };
    const db = loadDemoDb();
    return { itens: db.reservas, demo: true };
  },
  async criar(colaboradorId, itemId, qtd, tamanho, responsavel, motivo, prazoHoras = CONFIG.RESERVA_PRAZO_PADRAO_HORAS) {
    const r = await request('/reservas', { method: 'POST', payload: { colaboradorId, itemId, qtd, tamanho, responsavel, motivo, prazoHoras } });
    if (r.status === API_STATUS.OK) return r.data;
    const db = loadDemoDb();
    const venc = new Date(); venc.setHours(venc.getHours() + prazoHoras);
    const res = { id: 'res' + Date.now(), colaboradorId, itemId, qtd, tamanho, dataReserva: new Date().toISOString(), dataVencimento: venc.toISOString(), motivo, responsavel, status: 'Ativa' };
    db.reservas.unshift(res);
    saveDemoDb(db);
    return { ...res, demo: true };
  },
  /** Marca reservas vencidas e libera estoque + notifica — chamar periodicamente (ex: ao abrir cada tela de reservas). */
  async processarVencimentos() {
    const db = loadDemoDb();
    const agora = new Date();
    let mudou = false;
    db.reservas.forEach((r) => {
      if (r.status === 'Ativa' && new Date(r.dataVencimento) < agora) {
        r.status = 'Vencida';
        mudou = true;
        NotificacaoAPI.enviar('almoxarife', `Reserva vencida — liberar estoque do item ${r.itemId}.`);
      }
    });
    if (mudou) saveDemoDb(db);
  },
};
