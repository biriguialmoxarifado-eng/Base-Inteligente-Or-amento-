// mobile/reservas.js
import { ReservaAPI } from '../api/reserva-api.js';
import { EpiAPI } from '../api/epi-api.js';
import { UsuariosAPI } from '../api/usuarios-api.js';
import { fmtDateTime, renderDemoBanner } from './ui-kit.js';

export async function renderReservas(colaborador, somenteMinhas) {
  await ReservaAPI.processarVencimentos();
  const el = document.createElement('div'); el.className = 'content';
  const { itens: reservas, demo } = await ReservaAPI.listar();
  const visiveis = somenteMinhas ? reservas.filter((r) => r.colaboradorId === colaborador.id) : reservas;
  el.innerHTML = renderDemoBanner(demo);
  if (!visiveis.length) {
    el.innerHTML += `<div class="empty-state"><div class="es-ic">⏱️</div><h3>Nenhuma reserva</h3><p>Reservas de material aparecerão aqui.</p></div>`;
    return el;
  }
  const { itens: catalogo } = await EpiAPI.listarCatalogo();
  for (const r of visiveis) {
    const it = catalogo.find((i) => i.id === r.itemId);
    const col = await UsuariosAPI.obterPorId(r.colaboradorId);
    const cor = r.status === 'Ativa' ? 'blue' : r.status === 'Vencida' ? 'red' : 'green';
    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `<div class="list-tile" style="border:none;padding:0 0 6px;">
        <div><div class="lt-title">${it ? it.nome : r.itemId}</div><div class="lt-sub">${col ? col.nome : ''} · ${r.qtd} ${it ? it.unidade : ''}</div></div>
        <span class="badge badge-${cor}">${r.status}</span>
      </div>
      <div class="kv-row"><span class="k">Reservado em</span><span class="v">${fmtDateTime(r.dataReserva)}</span></div>
      <div class="kv-row"><span class="k">Vence em</span><span class="v">${fmtDateTime(r.dataVencimento)}</span></div>
      <div class="kv-row"><span class="k">Motivo</span><span class="v">${r.motivo}</span></div>
      <div class="kv-row"><span class="k">Responsável</span><span class="v">${r.responsavel}</span></div>`;
    el.appendChild(card);
  }
  return el;
}
