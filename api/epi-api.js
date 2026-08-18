// api/epi-api.js
// Catálogo de EPIs + regra de perfil/prazo de retirada.
import { request, API_STATUS } from './api.js';
import { loadDemoDb } from './demo-data.js';

export const EpiAPI = {
  async listarCatalogo({ categoria, busca } = {}) {
    const r = await request('/epi/catalogo', { method: 'POST', payload: { categoria, busca } });
    if (r.status === API_STATUS.OK) return { itens: r.data, demo: false };
    const db = loadDemoDb();
    let itens = db.itens;
    if (categoria && categoria !== 'Todos') itens = itens.filter((i) => i.categoria === categoria);
    if (busca) itens = itens.filter((i) => i.nome.toLowerCase().includes(busca.toLowerCase()) || i.codigo.toLowerCase().includes(busca.toLowerCase()));
    return { itens, demo: true };
  },

  async categorias() {
    const db = loadDemoDb(); // categorias podem ser derivadas localmente do catálogo já carregado
    return [...new Set(db.itens.map((i) => i.categoria))];
  },

  /** Regra: item pertence ao perfil de EPI do colaborador (ou é "Geral"). */
  permitidoParaPerfil(item, perfilEpi) {
    return item.perfis.includes(perfilEpi) || item.perfis.includes('Geral');
  },

  /** Verifica se o colaborador já retirou o item dentro do prazo. */
  async validarRetiradaAnterior(colaboradorId, itemId) {
    const r = await request('/epi/validar-retirada', { method: 'POST', payload: { colaboradorId, itemId } });
    if (r.status === API_STATUS.OK) return r.data;
    const db = loadDemoDb();
    const item = db.itens.find((i) => i.id === itemId);
    const historico = db.fichas.filter((f) => f.colaboradorId === colaboradorId && f.itemId === itemId)
      .sort((a, b) => new Date(b.data) - new Date(a.data));
    if (!historico.length) return { liberado: true };
    const ultima = new Date(historico[0].data);
    const prevista = new Date(ultima); prevista.setDate(prevista.getDate() + item.prazoDias);
    if (new Date() < prevista) return { liberado: false, dataUltima: ultima.toISOString(), dataPrevista: prevista.toISOString(), prazoDias: item.prazoDias };
    return { liberado: true };
  },
};
