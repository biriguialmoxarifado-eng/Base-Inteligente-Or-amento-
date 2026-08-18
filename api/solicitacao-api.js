// api/solicitacao-api.js
import { request, API_STATUS } from './api.js';
import { loadDemoDb, saveDemoDb } from './demo-data.js';
import { EstoqueAPI } from './estoque-api.js';
import { NotificacaoAPI } from './notificacao-api.js';
import { FichasAPI } from './pdf-api.js';

export const SolicitacaoAPI = {
  async criar(colaboradorId, itensCarrinho, metodoIdentificacao) {
    const r = await request('/solicitacoes', { method: 'POST', payload: { colaboradorId, itens: itensCarrinho, metodoIdentificacao } });
    if (r.status === API_STATUS.OK) return r.data;
    const db = loadDemoDb();
    const numero = `SOL-2026-${String(db.nextSol).padStart(6, '0')}`;
    db.nextSol++;
    const sol = { id: numero, colaboradorId, itens: itensCarrinho, status: 'Aguardando aprovação', dataCriacao: new Date().toISOString(), metodoIdentificacao };
    db.solicitacoes.unshift(sol);
    saveDemoDb(db);
    return { ...sol, demo: true };
  },
  async minhasSolicitacoes(colaboradorId) {
    const r = await request(`/solicitacoes?colaboradorId=${colaboradorId}`);
    if (r.status === API_STATUS.OK) return { itens: r.data, demo: false };
    const db = loadDemoDb();
    return { itens: db.solicitacoes.filter((s) => s.colaboradorId === colaboradorId), demo: true };
  },
  async pendentesAprovacao() {
    const r = await request('/solicitacoes?status=Aguardando aprovação');
    if (r.status === API_STATUS.OK) return { itens: r.data, demo: false };
    const db = loadDemoDb();
    return { itens: db.solicitacoes.filter((s) => s.status === 'Aguardando aprovação'), demo: true };
  },
  async aprovar(id, aprovadorNome) {
    const r = await request(`/solicitacoes/${id}/aprovar`, { method: 'POST', payload: { aprovadorNome } });
    if (r.status === API_STATUS.OK) return { ok: true };
    const db = loadDemoDb();
    const s = db.solicitacoes.find((s) => s.id === id);
    if (!s) return { ok: false };
    s.status = 'Aprovada'; s.aprovador = aprovadorNome; s.dataAprovacao = new Date().toISOString();
    for (const ci of s.itens) {
      await EstoqueAPI.darBaixa(ci.itemId, ci.qtd);
      await FichasAPI.registrar({ colaboradorId: s.colaboradorId, itemId: ci.itemId, qtd: ci.qtd, tamanho: ci.tamanho, solicitacaoId: s.id, metodo: s.metodoIdentificacao });
    }
    await NotificacaoAPI.enviar('colaborador', `Sua solicitação ${s.id} foi aprovada.`, s.colaboradorId);
    saveDemoDb(db);
    return { ok: true, demo: true };
  },
  async reprovar(id, motivo) {
    const r = await request(`/solicitacoes/${id}/reprovar`, { method: 'POST', payload: { motivo } });
    if (r.status === API_STATUS.OK) return { ok: true };
    const db = loadDemoDb();
    const s = db.solicitacoes.find((s) => s.id === id);
    if (!s) return { ok: false };
    s.status = 'Reprovada'; s.motivoReprovacao = motivo || 'Não informado';
    await NotificacaoAPI.enviar('colaborador', `Sua solicitação ${s.id} foi recusada.`, s.colaboradorId);
    saveDemoDb(db);
    return { ok: true, demo: true };
  },
};
