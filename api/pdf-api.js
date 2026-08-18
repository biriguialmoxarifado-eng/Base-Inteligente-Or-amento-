// api/pdf-api.js
// ------------------------------------------------------------------
// Registro de fichas de EPI (histórico de retirada) + geração de PDF.
// A ficha NUNCA é substituída — cada retirada gera um novo registro
// permanente vinculado ao colaborador (ver seção 13 do prompt).
// A geração do PDF em si (mobile/pdf.js) roda no cliente com jsPDF;
// este adaptador cuida do REGISTRO/leitura dos dados da ficha.
// ------------------------------------------------------------------
import { request, API_STATUS } from './api.js';
import { loadDemoDb, saveDemoDb } from './demo-data.js';

export const FichasAPI = {
  async registrar({ colaboradorId, itemId, qtd, tamanho, solicitacaoId, metodo }) {
    const r = await request('/fichas', { method: 'POST', payload: { colaboradorId, itemId, qtd, tamanho, solicitacaoId, metodo } });
    if (r.status === API_STATUS.OK) return r.data;
    const db = loadDemoDb();
    const numero = `FICHA-2026-${String(db.nextFicha).padStart(4, '0')}`;
    db.nextFicha++;
    const now = new Date();
    const ficha = { id: numero, colaboradorId, itemId, qtd, tamanho, data: now.toISOString(), hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), solicitacaoId, metodo };
    db.fichas.unshift(ficha);
    saveDemoDb(db);
    return { ...ficha, demo: true };
  },
  async historicoDoColaborador(colaboradorId) {
    const r = await request(`/fichas?colaboradorId=${colaboradorId}`);
    if (r.status === API_STATUS.OK) return { itens: r.data, demo: false };
    const db = loadDemoDb();
    const itens = db.fichas.filter((f) => f.colaboradorId === colaboradorId).sort((a, b) => new Date(b.data) - new Date(a.data));
    return { itens, demo: true };
  },
};
