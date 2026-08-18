// mobile/dashboards.js
// Telas dos perfis Segurança, Almoxarife e Gestor. Todos leem os
// MESMOS adaptadores /api usados pelo Colaborador — nunca uma cópia
// separada de estoque/solicitações/reservas.
import { EstoqueAPI } from '../api/estoque-api.js';
import { SolicitacaoAPI } from '../api/solicitacao-api.js';
import { ReservaAPI } from '../api/reserva-api.js';
import { InventarioAPI } from '../api/inventario-api.js';
import { renderDemoBanner, fmtDate } from './ui-kit.js';

/* ---------------- SEGURANÇA ---------------- */
export async function renderSegDashboard(nav) {
  const el = document.createElement('div'); el.className = 'content';
  const { itens: pendentes, demo } = await SolicitacaoAPI.pendentesAprovacao();
  const abaixoMin = await EstoqueAPI.abaixoDoMinimo();
  const { itens: reservas } = await ReservaAPI.listar();
  const vencidas = reservas.filter((r) => r.status === 'Vencida');
  el.innerHTML = `
    ${renderDemoBanner(demo)}
    <div class="kpi-grid">
      <div class="kpi-box"><div class="kv-label">Aprovações pendentes</div><div class="kv-val txt-amber">${pendentes.length}</div></div>
      <div class="kpi-box"><div class="kv-label">Abaixo do mínimo</div><div class="kv-val txt-red">${abaixoMin.length}</div></div>
      <div class="kpi-box"><div class="kv-label">Reservas vencidas</div><div class="kv-val txt-red">${vencidas.length}</div></div>
      <div class="kpi-box"><div class="kv-label">Estoque crítico p/ categoria</div><div class="kv-val">${abaixoMin.length}</div></div>
    </div>
    <div class="section-title">Pendências <span class="link" id="verAprov">ver todas ›</span></div>
    <div id="pendList"></div>`;
  el.querySelector('#verAprov').onclick = () => nav('segAprovacoes');
  const list = el.querySelector('#pendList');
  if (!pendentes.length) { list.innerHTML = `<div class="empty-state"><div class="es-ic">✅</div><h3>Tudo em dia</h3><p>Nenhuma aprovação pendente.</p></div>`; return el; }
  pendentes.slice(0, 5).forEach((s) => {
    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `<div class="list-tile" style="border:none;padding:0;"><div><div class="lt-title mono">${s.id}</div><div class="lt-sub">${s.itens.length} item(ns)</div></div><span class="badge badge-amber">${s.status}</span></div>`;
    list.appendChild(card);
  });
  return el;
}

export async function renderEstoqueLista() {
  const el = document.createElement('div'); el.className = 'content';
  el.innerHTML = `<div class="section-title">Itens de EPI</div><div id="estList"></div>`;
  const { itens, demo } = await EstoqueAPI.listar();
  const list = el.querySelector('#estList');
  if (demo) list.insertAdjacentHTML('beforebegin', renderDemoBanner(true));
  itens.forEach((it) => {
    const baixo = it.estoque < it.minimo;
    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `<div class="list-tile" style="border:none;padding:0;">
      <div><div class="lt-title">${it.nome}</div><div class="lt-sub">CA ${it.ca} · Mín: ${it.minimo}</div></div>
      <span class="badge ${baixo ? 'badge-red' : 'badge-green'}">${it.estoque} ${it.unidade}</span></div>`;
    list.appendChild(card);
  });
  return el;
}

/* ---------------- ALMOXARIFE ---------------- */
export async function renderAlmDashboard(nav) {
  const el = document.createElement('div'); el.className = 'content';
  const abaixoMin = await EstoqueAPI.abaixoDoMinimo();
  const { itens: reservas, demo } = await ReservaAPI.listar();
  const ativas = reservas.filter((r) => r.status === 'Ativa');
  const { itens: sols } = await SolicitacaoAPI.pendentesAprovacao();
  const { itens: catalogo } = await EstoqueAPI.listar();
  el.innerHTML = `
    ${renderDemoBanner(demo)}
    <div class="kpi-grid">
      <div class="kpi-box"><div class="kv-label">Estoque total</div><div class="kv-val">${catalogo.reduce((s, i) => s + i.estoque, 0)}</div></div>
      <div class="kpi-box"><div class="kv-label">Itens cadastrados</div><div class="kv-val">${catalogo.length}</div></div>
      <div class="kpi-box"><div class="kv-label">Reservas ativas</div><div class="kv-val">${ativas.length}</div></div>
      <div class="kpi-box"><div class="kv-label">Solicitações pendentes</div><div class="kv-val txt-amber">${sols.length}</div></div>
    </div>
    <div class="section-title">Ações rápidas</div>
    <div class="card" id="goConf" style="cursor:pointer;">📷 Conferência com código de barras</div>
    <div class="card" id="goEst" style="cursor:pointer;">📦 Ver estoque completo</div>
    <div class="integration-flag"><b>Ponto de integração</b>Entrada de NF-e (leitura de chave de acesso/XML) depende do adaptador fiscal do backend — hoje preparado em api/estoque-api.js aguardando endpoint real.</div>
  `;
  el.querySelector('#goConf').onclick = () => nav('almConferencia');
  el.querySelector('#goEst').onclick = () => nav('almEstoque');
  return el;
}

export async function renderAlmConferencia() {
  const el = document.createElement('div'); el.className = 'content';
  const { itens } = await EstoqueAPI.listar();
  el.innerHTML = `
    <div class="section-title">Conferência de itens</div>
    <div class="card">
      <label>Item esperado</label>
      <select id="itemEsperado">${itens.map((i) => `<option value="${i.id}">${i.nome} (${i.codigo})</option>`).join('')}</select>
      <label>Código lido (bipagem)</label>
      <input id="codigoLido" placeholder="Digite ou simule a leitura do código">
      <button class="btn btn-primary" id="btnConferir" style="margin-top:14px;">Conferir</button>
      <div id="confResult" style="margin-top:12px;"></div>
    </div>
    <div class="integration-flag"><b>Ponto de integração</b>Leitura por câmera do scanner de código de barras deve usar o mesmo motor do Desktop; hoje a bipagem é simulada por digitação para validar a regra de vínculo código↔item.</div>`;
  el.querySelector('#btnConferir').onclick = async () => {
    const esperado = el.querySelector('#itemEsperado').value;
    const lido = el.querySelector('#codigoLido').value.trim();
    const res = await EstoqueAPI.conferirCodigoBarras(lido, esperado);
    const box = el.querySelector('#confResult');
    box.innerHTML = res.ok ? `<div class="badge badge-green">OK — vinculado a ${res.item.nome}</div>` : `<div class="blocked-note">${res.motivo}</div>`;
  };
  return el;
}

export async function renderAlmInventario() {
  const el = document.createElement('div'); el.className = 'content';
  const status = await InventarioAPI.iniciarContagem();
  el.innerHTML = `
    <div class="card">
      <div class="kv-row"><span class="k">Inventário</span><span class="v">${fmtDate(new Date().toISOString())}</span></div>
      <div class="kv-row"><span class="k">Itens esperados</span><span class="v">${status.itensEsperados}</span></div>
      <div class="kv-row"><span class="k">Itens contados</span><span class="v">${status.itensContados}</span></div>
    </div>
    <div class="integration-flag"><b>Ponto de integração</b>${status.demo ? 'Contagem simulada nesta sessão — conecte api/inventario-api.js ao backend real para persistir divergências.' : 'Conectado ao backend.'}</div>`;
  return el;
}

/* ---------------- GESTOR ---------------- */
export async function renderGestDashboard() {
  const el = document.createElement('div'); el.className = 'content';
  const valor = await EstoqueAPI.valorTotal();
  const abaixoMin = await EstoqueAPI.abaixoDoMinimo();
  const { itens: sols, demo } = await SolicitacaoAPI.pendentesAprovacao();
  const { itens: reservas } = await ReservaAPI.listar();
  el.innerHTML = `
    ${renderDemoBanner(demo)}
    <div class="kpi-grid">
      <div class="kpi-box"><div class="kv-label">Valor do estoque</div><div class="kv-val">R$ ${valor.toLocaleString('pt-BR')}</div></div>
      <div class="kpi-box"><div class="kv-label">Solicitações abertas</div><div class="kv-val">${sols.length}</div></div>
      <div class="kpi-box"><div class="kv-label">Itens críticos</div><div class="kv-val txt-red">${abaixoMin.length}</div></div>
      <div class="kpi-box"><div class="kv-label">Reservas ativas</div><div class="kv-val">${reservas.filter((r) => r.status === 'Ativa').length}</div></div>
    </div>
    <div class="section-title">Compras necessárias</div>
    <div id="comprasList"></div>`;
  const list = el.querySelector('#comprasList');
  if (!abaixoMin.length) { list.innerHTML = `<div class="empty-state"><div class="es-ic">📊</div><h3>Nenhuma compra urgente</h3><p>Estoque dentro do previsto.</p></div>`; return el; }
  abaixoMin.forEach((it) => {
    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `<div class="list-tile" style="border:none;padding:0;"><div><div class="lt-title">${it.nome}</div><div class="lt-sub">Atual: ${it.estoque} · Mínimo: ${it.minimo}</div></div><span class="badge badge-red">Repor</span></div>`;
    list.appendChild(card);
  });
  return el;
}
