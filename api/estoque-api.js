// api/estoque-api.js
// Estoque compartilhado — mesma leitura para Mobile e Desktop.
// Qualquer baixa de estoque (aprovação de solicitação, conferência,
// etc.) deve passar por este adaptador para não haver "estoque local".
import { request, API_STATUS } from './api.js';
import { loadDemoDb, saveDemoDb } from './demo-data.js';

export const EstoqueAPI = {
  async listar() {
    const r = await request('/estoque');
    if (r.status === API_STATUS.OK) return { itens: r.data, demo: false };
    const db = loadDemoDb();
    return { itens: db.itens, demo: true };
  },
  async abaixoDoMinimo() {
    const { itens } = await this.listar();
    return itens.filter((i) => i.estoque < i.minimo);
  },
  async valorTotal() {
    const { itens } = await this.listar();
    return itens.reduce((s, i) => s + i.estoque * (i.valorUnit || 0), 0);
  },
  async darBaixa(itemId, qtd) {
    const r = await request('/estoque/baixa', { method: 'POST', payload: { itemId, qtd } });
    if (r.status === API_STATUS.OK) return { ok: true };
    const db = loadDemoDb();
    const it = db.itens.find((i) => i.id === itemId);
    if (it) it.estoque = Math.max(0, it.estoque - qtd);
    saveDemoDb(db);
    return { ok: true, demo: true };
  },
  /** Confere se um código de barras lido pertence ao item esperado. */
  async conferirCodigoBarras(codigoLido, itemEsperadoId) {
    const r = await request('/estoque/conferir', { method: 'POST', payload: { codigoLido, itemEsperadoId } });
    if (r.status === API_STATUS.OK) return r.data;
    const db = loadDemoDb();
    const item = db.itens.find((i) => i.codigo === codigoLido);
    if (!item) return { ok: false, motivo: 'Código não cadastrado no sistema.' };
    if (itemEsperadoId && item.id !== itemEsperadoId) return { ok: false, motivo: `Este código de barras já está vinculado a "${item.nome}", não ao item esperado.` };
    return { ok: true, item };
  },
};
