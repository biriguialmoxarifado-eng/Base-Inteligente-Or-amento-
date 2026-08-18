// mobile/solicitacoes.js
import { SolicitacaoAPI } from '../api/solicitacao-api.js';
import { EpiAPI } from '../api/epi-api.js';
import { UsuariosAPI } from '../api/usuarios-api.js';
import { FichasAPI } from '../api/pdf-api.js';
import { toast, fmtDateTime, renderDemoBanner } from './ui-kit.js';

export async function renderMinhasSolicitacoes(colaborador) {
  const el = document.createElement('div'); el.className = 'content';
  const { itens: sols, demo } = await SolicitacaoAPI.minhasSolicitacoes(colaborador.id);
  el.innerHTML = renderDemoBanner(demo);
  if (!sols.length) {
    el.innerHTML += `<div class="empty-state"><div class="es-ic">📋</div><h3>Nenhuma solicitação</h3><p>Suas solicitações aparecerão aqui.</p></div>`;
    return el;
  }
  const { itens: catalogo } = await EpiAPI.listarCatalogo();
  sols.forEach((s) => el.appendChild(solicitacaoCard(s, catalogo)));
  return el;
}

function solicitacaoCard(s, catalogo) {
  const card = document.createElement('div'); card.className = 'card';
  const cor = s.status === 'Aprovada' ? 'green' : s.status === 'Reprovada' ? 'red' : 'amber';
  card.innerHTML = `
    <div class="list-tile" style="border:none;padding:0 0 8px;">
      <div><div class="lt-title mono">${s.id}</div><div class="lt-sub">${fmtDateTime(s.dataCriacao)}</div></div>
      <span class="badge badge-${cor}">${s.status}</span>
    </div>
    ${s.itens.map((ci) => { const it = catalogo.find((i) => i.id === ci.itemId); return `<div class="kv-row"><span class="k">${it ? it.nome : ci.itemId}</span><span class="v">${ci.qtd} ${it ? it.unidade : ''}</span></div>`; }).join('')}
    ${s.motivoReprovacao ? `<div class="blocked-note" style="margin-top:8px;">Motivo: ${s.motivoReprovacao}</div>` : ''}
  `;
  return card;
}

export async function renderAprovacoes(aprovadorNome, onMudou) {
  const el = document.createElement('div'); el.className = 'content';
  const { itens: sols, demo } = await SolicitacaoAPI.pendentesAprovacao();
  el.innerHTML = renderDemoBanner(demo);
  if (!sols.length) {
    el.innerHTML += `<div class="empty-state"><div class="es-ic">✅</div><h3>Sem pendências</h3><p>Todas as solicitações foram avaliadas.</p></div>`;
    return el;
  }
  const { itens: catalogo } = await EpiAPI.listarCatalogo();
  for (const s of sols) {
    const col = await UsuariosAPI.obterPorId(s.colaboradorId);
    const { itens: historico } = await FichasAPI.historicoDoColaborador(s.colaboradorId);
    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `
      <div class="list-tile" style="border:none;padding:0 0 6px;">
        <div><div class="lt-title">${col.nome}</div><div class="lt-sub">Mat. ${col.matricula} · ${col.funcao}</div></div>
        <span class="badge mono badge-blue">${s.id}</span>
      </div>
      ${s.itens.map((ci) => { const it = catalogo.find((i) => i.id === ci.itemId); return `<div class="kv-row"><span class="k">${it.nome} (${ci.tamanho})${ci.foraDoPerfil ? ' — fora do perfil' : ''}</span><span class="v">${ci.qtd} ${it.unidade}</span></div>`; }).join('')}
      <div class="kv-row"><span class="k">Perfil do colaborador</span><span class="v">${col.perfilEpi}</span></div>
      <div class="kv-row"><span class="k">Histórico</span><span class="v">${historico.length} fichas</span></div>
      <div class="btn-row" style="margin-top:12px;">
        <button class="btn btn-green btn-sm" data-ap="1">Aprovar</button>
        <button class="btn btn-ghost btn-sm txt-red" data-rp="1">Reprovar</button>
      </div>`;
    card.querySelector('[data-ap]').onclick = async () => { await SolicitacaoAPI.aprovar(s.id, aprovadorNome); toast('Solicitação aprovada.', 'ok'); onMudou(); };
    card.querySelector('[data-rp]').onclick = async () => {
      const motivo = prompt('Motivo da reprovação:');
      if (motivo === null) return;
      await SolicitacaoAPI.reprovar(s.id, motivo);
      toast('Solicitação reprovada.', '');
      onMudou();
    };
    el.appendChild(card);
  }
  return el;
}
