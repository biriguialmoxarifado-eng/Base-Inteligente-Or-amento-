// api/inventario-api.js
// Inventário / contagem cíclica do Almoxarife. Mesma base de itens do
// estoque — nunca uma lista paralela.
import { request, API_STATUS } from './api.js';
import { EstoqueAPI } from './estoque-api.js';

export const InventarioAPI = {
  async iniciarContagem() {
    const r = await request('/inventario/iniciar', { method: 'POST' });
    if (r.status === API_STATUS.OK) return r.data;
    const { itens } = await EstoqueAPI.listar();
    return { id: 'INV-' + new Date().toISOString().slice(0, 10), itensEsperados: itens.length, itensContados: 0, demo: true };
  },
  async registrarDivergencia(itemId, quantidadeContada, quantidadeEsperada) {
    const r = await request('/inventario/divergencia', { method: 'POST', payload: { itemId, quantidadeContada, quantidadeEsperada } });
    if (r.status === API_STATUS.OK) return r.data;
    return { ok: true, divergencia: quantidadeContada - quantidadeEsperada, demo: true, mensagem: 'CONFIGURAÇÃO PENDENTE — divergência registrada apenas localmente nesta sessão.' };
  },
};
