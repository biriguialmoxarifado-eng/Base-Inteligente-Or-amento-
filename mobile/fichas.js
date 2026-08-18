// mobile/fichas.js
import { FichasAPI } from '../api/pdf-api.js';
import { EpiAPI } from '../api/epi-api.js';
import { fmtDate, renderDemoBanner } from './ui-kit.js';
import { gerarFichaPDF } from './pdf.js';

export async function renderMinhasFichas(colaborador) {
  const el = document.createElement('div'); el.className = 'content';
  const { itens: fichas, demo } = await FichasAPI.historicoDoColaborador(colaborador.id);
  el.innerHTML = renderDemoBanner(demo);
  if (!fichas.length) {
    el.innerHTML += `<div class="empty-state"><div class="es-ic">🗂️</div><h3>Nenhuma ficha ainda</h3><p>Fichas de EPI aparecem aqui após aprovação.</p></div>`;
    return el;
  }
  const { itens: catalogo } = await EpiAPI.listarCatalogo();
  fichas.forEach((f) => {
    const it = catalogo.find((i) => i.id === f.itemId);
    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `
      <div class="list-tile" style="border:none;padding:0 0 4px;">
        <div><div class="lt-title">${it ? it.nome : f.itemId}</div><div class="lt-sub">${fmtDate(f.data)} · ${f.metodo}</div></div>
        <span class="badge badge-green">Confirmada</span>
      </div>
      <div class="kv-row"><span class="k">Quantidade</span><span class="v">${f.qtd} ${it ? it.unidade : ''} (${f.tamanho || '—'})</span></div>
      <div class="kv-row"><span class="k">Solicitação</span><span class="v mono">${f.solicitacaoId}</span></div>
      <button class="btn btn-outline btn-sm" style="margin-top:10px;width:100%;" data-pdf="1">📄 Gerar PDF da ficha</button>
    `;
    card.querySelector('[data-pdf]').onclick = () => gerarFichaPDF(f, it, colaborador);
    el.appendChild(card);
  });
  return el;
}
