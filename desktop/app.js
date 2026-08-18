// desktop/app.js
// ------------------------------------------------------------------
// ALMOXA PRO — DESKTOP (Fase 1). Consome exatamente os mesmos módulos
// de /core e /api que o Mobile (../core/*, ../api/*) — nenhum dado,
// regra ou banco duplicado. Se aparecer a faixa "MODO DEMONSTRAÇÃO",
// significa que core/config.js -> API_BASE_URL ainda está vazio.
// ------------------------------------------------------------------
import { CONFIG } from '../core/config.js';
import { Session } from '../core/session.js';
import { homeViewFor, podeAcessarView } from '../core/permissions.js';

import { UsuariosAPI } from '../api/usuarios-api.js';
import { EpiAPI } from '../api/epi-api.js';
import { EstoqueAPI } from '../api/estoque-api.js';
import { SolicitacaoAPI } from '../api/solicitacao-api.js';
import { ReservaAPI } from '../api/reserva-api.js';
import { InventarioAPI } from '../api/inventario-api.js';
import { NotificacaoAPI } from '../api/notificacao-api.js';
import { FichasAPI } from '../api/pdf-api.js';
import { AuthAPI } from '../api/auth-api.js';

const NAV_ITEMS = [
  { view: 'dashboard', ic: '📊', label: 'Início', roles: ['seguranca', 'almoxarife', 'gestor'] },
  { view: 'colaboradores', ic: '👷', label: 'Colaboradores', roles: ['seguranca', 'gestor'] },
  { view: 'catalogo', ic: '🛡️', label: 'Catálogo de EPI', roles: ['seguranca', 'almoxarife', 'gestor'] },
  { view: 'estoque', ic: '📦', label: 'Estoque', roles: ['seguranca', 'almoxarife', 'gestor'] },
  { view: 'solicitacoes', ic: '📋', label: 'Solicitações', roles: ['seguranca', 'gestor'] },
  { view: 'aprovacoes', ic: '✅', label: 'Aprovações', roles: ['seguranca', 'gestor'] },
  { view: 'reservas', ic: '⏱️', label: 'Reservas', roles: ['seguranca', 'almoxarife', 'gestor'] },
  { view: 'inventario', ic: '🧮', label: 'Inventário', roles: ['almoxarife', 'gestor'] },
  { view: 'fichas', ic: '🗂️', label: 'Fichas de EPI', roles: ['seguranca', 'gestor'] },
  { view: 'notificacoes', ic: '🔔', label: 'Notificações', roles: ['seguranca', 'almoxarife', 'gestor'] },
];

let VIEW = 'dashboard';
let PAPEL = Session.papelAtivo() || 'seguranca'; // Desktop é usado por Segurança/Almoxarife/Gestor
let USUARIO = null;

async function boot() {
  // No Desktop, se ainda não houver sessão do dispositivo, assume o papel
  // de teste selecionado no topo (ver seletor de papel abaixo) — a
  // identificação completa (mesmas 4 opções do Mobile) fica disponível
  // via botão "Entrar" no topo, reaproveitando api/auth-api.js.
  const { itens } = await UsuariosAPI.listarTodos();
  USUARIO = itens.find((u) => u.role === PAPEL) || itens[0];
  render();
}

function go(view) { VIEW = view; render(); }

function toast(msg, type = '') {
  const host = document.getElementById('toastHost');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  host.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

async function render() {
  document.getElementById('sidebarNav').innerHTML = '';
  renderSidebar();
  await renderTopbar();
  const content = document.getElementById('content');
  content.innerHTML = '<div class="empty-state">Carregando…</div>';
  content.replaceChildren(await renderView());
}

function renderSidebar() {
  const nav = document.getElementById('sidebarNav');
  NAV_ITEMS.filter((it) => it.roles.includes(PAPEL)).forEach((it) => {
    const div = document.createElement('div');
    div.className = 'nav-item' + (VIEW === it.view ? ' active' : '');
    div.innerHTML = `<span class="ic">${it.ic}</span> ${it.label}`;
    div.onclick = () => go(it.view);
    nav.appendChild(div);
  });
}

async function renderTopbar() {
  const titles = { dashboard: 'Dashboard', colaboradores: 'Colaboradores', catalogo: 'Catálogo de EPI', estoque: 'Estoque', solicitacoes: 'Solicitações', aprovacoes: 'Aprovações', reservas: 'Reservas', inventario: 'Inventário', fichas: 'Fichas de EPI', notificacoes: 'Notificações' };
  document.getElementById('tbTitle').textContent = titles[VIEW] || CONFIG.APP_NAME;
  document.getElementById('tbSub').textContent = `${PAPEL.toUpperCase()} · ${USUARIO ? USUARIO.nome : ''}`;
  const { itens: notifs } = await NotificacaoAPI.listarPara(PAPEL, null);
  const naoLidas = notifs.filter((n) => !n.lida).length;
  const badge = document.getElementById('tbNotifBadge');
  badge.style.display = naoLidas > 0 ? 'flex' : 'none';
  badge.textContent = naoLidas;
}

async function renderView() {
  switch (VIEW) {
    case 'dashboard': return renderDashboard();
    case 'colaboradores': return renderColaboradores();
    case 'catalogo': return renderCatalogo();
    case 'estoque': return renderEstoque();
    case 'solicitacoes': return renderSolicitacoes();
    case 'aprovacoes': return renderAprovacoes();
    case 'reservas': return renderReservas();
    case 'inventario': return renderInventario();
    case 'fichas': return renderFichas();
    case 'notificacoes': return renderNotificacoes();
    default: return renderDashboard();
  }
}

function demoBanner(isDemo) {
  const d = document.createElement('div');
  if (isDemo) { d.className = 'demo-banner'; d.textContent = 'MODO DEMONSTRAÇÃO — backend ainda não configurado em core/config.js'; }
  return d;
}
function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }

/* ---------------- DASHBOARD ---------------- */
async function renderDashboard() {
  const wrap = document.createElement('div');
  const abaixoMin = await EstoqueAPI.abaixoDoMinimo();
  const { itens: sols, demo } = await SolicitacaoAPI.pendentesAprovacao();
  const { itens: reservas } = await ReservaAPI.listar();
  const valor = await EstoqueAPI.valorTotal();
  wrap.appendChild(demoBanner(demo));
  wrap.appendChild(el(`<div class="kpi-grid">
    <div class="kpi-box"><div class="kv-label">Valor do estoque</div><div class="kv-val">R$ ${valor.toLocaleString('pt-BR')}</div></div>
    <div class="kpi-box"><div class="kv-label">Solicitações pendentes</div><div class="kv-val txt-amber">${sols.length}</div></div>
    <div class="kpi-box"><div class="kv-label">Itens abaixo do mínimo</div><div class="kv-val txt-red">${abaixoMin.length}</div></div>
    <div class="kpi-box"><div class="kv-label">Reservas ativas</div><div class="kv-val">${reservas.filter((r) => r.status === 'Ativa').length}</div></div>
  </div>`));
  const block = el(`<section class="block"><div class="block-head"><h2>Solicitações aguardando aprovação</h2></div><div id="dashTable"></div></section>`);
  wrap.appendChild(block);
  const tableHost = block.querySelector('#dashTable');
  if (!sols.length) { tableHost.appendChild(el(`<div class="empty-state"><div class="es-ic">✅</div><p>Nenhuma pendência.</p></div>`)); return wrap; }
  const { itens: catalogo } = await EpiAPI.listarCatalogo();
  const rows = await Promise.all(sols.map(async (s) => {
    const col = await UsuariosAPI.obterPorId(s.colaboradorId);
    return `<tr><td class="mono">${s.id}</td><td>${col ? col.nome : s.colaboradorId}</td><td>${s.itens.length}</td><td><span class="badge badge-amber">${s.status}</span></td></tr>`;
  }));
  tableHost.appendChild(el(`<table><thead><tr><th>Nº</th><th>Colaborador</th><th>Itens</th><th>Status</th></tr></thead><tbody>${rows.join('')}</tbody></table>`));
  return wrap;
}

/* ---------------- COLABORADORES ---------------- */
async function renderColaboradores() {
  const wrap = document.createElement('div');
  const { itens, demo } = await UsuariosAPI.listarTodos();
  wrap.appendChild(demoBanner(demo));
  const rows = itens.map((c) => `<tr><td>${c.nome}</td><td class="mono">${c.matricula}</td><td>${c.funcao}</td><td>${c.obra}</td><td>${c.perfilEpi}</td><td><span class="badge badge-green">${c.status}</span></td></tr>`).join('');
  wrap.appendChild(el(`<table><thead><tr><th>Nome</th><th>Matrícula</th><th>Função</th><th>Obra</th><th>Perfil de EPI</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`));
  return wrap;
}

/* ---------------- CATÁLOGO ---------------- */
async function renderCatalogo() {
  const wrap = document.createElement('div');
  const { itens, demo } = await EpiAPI.listarCatalogo();
  wrap.appendChild(demoBanner(demo));
  const rows = itens.map((i) => `<tr><td class="mono">${i.codigo}</td><td>${i.nome}</td><td>${i.ca}</td><td>${i.categoria}</td><td>${i.perfis.join(', ')}</td><td>${i.prazoDias}d</td><td><span class="badge ${i.estoque < i.minimo ? 'badge-red' : 'badge-green'}">${i.estoque} ${i.unidade}</span></td></tr>`).join('');
  wrap.appendChild(el(`<table><thead><tr><th>Código</th><th>Nome</th><th>CA</th><th>Categoria</th><th>Perfis</th><th>Prazo</th><th>Estoque</th></tr></thead><tbody>${rows}</tbody></table>`));
  return wrap;
}

/* ---------------- ESTOQUE ---------------- */
async function renderEstoque() {
  const wrap = document.createElement('div');
  const { itens, demo } = await EstoqueAPI.listar();
  wrap.appendChild(demoBanner(demo));
  const rows = itens.map((i) => `<tr><td>${i.nome}</td><td>${i.minimo}</td><td>${i.estoque}</td><td><span class="badge ${i.estoque < i.minimo ? 'badge-red' : 'badge-green'}">${i.estoque < i.minimo ? 'Repor' : 'OK'}</span></td></tr>`).join('');
  wrap.appendChild(el(`<table><thead><tr><th>Item</th><th>Mínimo</th><th>Atual</th><th>Situação</th></tr></thead><tbody>${rows}</tbody></table>`));
  return wrap;
}

/* ---------------- SOLICITAÇÕES ---------------- */
async function renderSolicitacoes() {
  const wrap = document.createElement('div');
  const { itens: catalogo } = await EpiAPI.listarCatalogo();
  const todas = [];
  for (const c of (await UsuariosAPI.listarTodos()).itens) {
    const { itens } = await SolicitacaoAPI.minhasSolicitacoes(c.id);
    todas.push(...itens.map((s) => ({ ...s, colaboradorNome: c.nome })));
  }
  if (!todas.length) { wrap.appendChild(el(`<div class="empty-state"><div class="es-ic">📋</div><p>Nenhuma solicitação registrada.</p></div>`)); return wrap; }
  const cor = (st) => st === 'Aprovada' ? 'green' : st === 'Reprovada' ? 'red' : 'amber';
  const rows = todas.map((s) => `<tr><td class="mono">${s.id}</td><td>${s.colaboradorNome}</td><td>${s.itens.length}</td><td><span class="badge badge-${cor(s.status)}">${s.status}</span></td></tr>`).join('');
  wrap.appendChild(el(`<table><thead><tr><th>Nº</th><th>Colaborador</th><th>Itens</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`));
  return wrap;
}

/* ---------------- APROVAÇÕES ---------------- */
async function renderAprovacoes() {
  const wrap = document.createElement('div');
  const { itens: sols, demo } = await SolicitacaoAPI.pendentesAprovacao();
  wrap.appendChild(demoBanner(demo));
  if (!sols.length) { wrap.appendChild(el(`<div class="empty-state"><div class="es-ic">✅</div><p>Sem pendências.</p></div>`)); return wrap; }
  const { itens: catalogo } = await EpiAPI.listarCatalogo();
  for (const s of sols) {
    const col = await UsuariosAPI.obterPorId(s.colaboradorId);
    const itensHtml = s.itens.map((ci) => { const it = catalogo.find((i) => i.id === ci.itemId); return `<div class="kv-row"><span class="k">${it.nome} (${ci.tamanho})${ci.foraDoPerfil ? ' — fora do perfil' : ''}</span><span class="v">${ci.qtd} ${it.unidade}</span></div>`; }).join('');
    const card = el(`<div class="card">
      <div class="kv-row"><span class="k">Colaborador</span><span class="v">${col.nome} (${col.matricula})</span></div>
      <div class="kv-row"><span class="k">Solicitação</span><span class="v mono">${s.id}</span></div>
      ${itensHtml}
      <div class="btn-row" style="margin-top:12px;"><button class="btn btn-green" data-ap="1">Aprovar</button><button class="btn btn-ghost" data-rp="1" style="color:var(--red);">Reprovar</button></div>
    </div>`);
    card.querySelector('[data-ap]').onclick = async () => { await SolicitacaoAPI.aprovar(s.id, USUARIO.nome); toast('Solicitação aprovada.', 'ok'); render(); };
    card.querySelector('[data-rp]').onclick = async () => { const motivo = prompt('Motivo da reprovação:'); if (motivo === null) return; await SolicitacaoAPI.reprovar(s.id, motivo); toast('Solicitação reprovada.', ''); render(); };
    wrap.appendChild(card);
  }
  return wrap;
}

/* ---------------- RESERVAS ---------------- */
async function renderReservas() {
  await ReservaAPI.processarVencimentos();
  const wrap = document.createElement('div');
  const { itens, demo } = await ReservaAPI.listar();
  wrap.appendChild(demoBanner(demo));
  if (!itens.length) { wrap.appendChild(el(`<div class="empty-state"><div class="es-ic">⏱️</div><p>Nenhuma reserva.</p></div>`)); return wrap; }
  const { itens: catalogo } = await EpiAPI.listarCatalogo();
  const cor = (st) => st === 'Ativa' ? 'blue' : st === 'Vencida' ? 'red' : 'green';
  const rows = await Promise.all(itens.map(async (r) => {
    const it = catalogo.find((i) => i.id === r.itemId);
    const col = await UsuariosAPI.obterPorId(r.colaboradorId);
    return `<tr><td>${it ? it.nome : r.itemId}</td><td>${col ? col.nome : ''}</td><td>${r.qtd}</td><td><span class="badge badge-${cor(r.status)}">${r.status}</span></td></tr>`;
  }));
  wrap.appendChild(el(`<table><thead><tr><th>Item</th><th>Colaborador</th><th>Qtd</th><th>Status</th></tr></thead><tbody>${rows.join('')}</tbody></table>`));
  return wrap;
}

/* ---------------- INVENTÁRIO ---------------- */
async function renderInventario() {
  const wrap = document.createElement('div');
  const status = await InventarioAPI.iniciarContagem();
  wrap.appendChild(el(`<div class="card">
    <div class="kv-row"><span class="k">Itens esperados</span><span class="v">${status.itensEsperados}</span></div>
    <div class="kv-row"><span class="k">Itens contados</span><span class="v">${status.itensContados}</span></div>
  </div>`));
  wrap.appendChild(el(`<div class="integration-flag"><b>Ponto de integração</b>${status.demo ? 'Contagem simulada nesta sessão — conecte api/inventario-api.js ao backend real para persistir divergências entre Desktop e Mobile.' : 'Conectado ao backend.'}</div>`));
  return wrap;
}

/* ---------------- FICHAS ---------------- */
async function renderFichas() {
  const wrap = document.createElement('div');
  const { itens: colaboradores } = await UsuariosAPI.listarTodos();
  const { itens: catalogo } = await EpiAPI.listarCatalogo();
  let linhas = [];
  for (const c of colaboradores) {
    const { itens } = await FichasAPI.historicoDoColaborador(c.id);
    linhas.push(...itens.map((f) => ({ ...f, colaboradorNome: c.nome })));
  }
  if (!linhas.length) { wrap.appendChild(el(`<div class="empty-state"><div class="es-ic">🗂️</div><p>Nenhuma ficha registrada.</p></div>`)); return wrap; }
  const rows = linhas.map((f) => { const it = catalogo.find((i) => i.id === f.itemId); return `<tr><td class="mono">${f.id}</td><td>${f.colaboradorNome}</td><td>${it ? it.nome : f.itemId}</td><td>${f.metodo}</td></tr>`; }).join('');
  wrap.appendChild(el(`<table><thead><tr><th>Ficha</th><th>Colaborador</th><th>Item</th><th>Método</th></tr></thead><tbody>${rows}</tbody></table>`));
  return wrap;
}

/* ---------------- NOTIFICAÇÕES ---------------- */
async function renderNotificacoes() {
  const wrap = document.createElement('div');
  const { itens, demo } = await NotificacaoAPI.listarPara(PAPEL, null);
  wrap.appendChild(demoBanner(demo));
  if (!itens.length) { wrap.appendChild(el(`<div class="empty-state"><div class="es-ic">🔔</div><p>Sem notificações.</p></div>`)); return wrap; }
  const card = el(`<div class="card"></div>`);
  itens.forEach((n) => {
    const row = el(`<div class="kv-row"><span class="k">${n.msg}</span><span class="v">${n.lida ? '' : '<span class=\"badge badge-amber\">Nova</span>'}</span></div>`);
    row.style.cursor = 'pointer';
    row.onclick = async () => { await NotificacaoAPI.marcarLida(n.id); render(); };
    card.appendChild(row);
  });
  wrap.appendChild(card);
  return wrap;
}

/* ---------------- Painel de teste (papel + reset) ---------------- */
function montarPainelTeste() {
  const host = document.getElementById('roleSwitchHost');
  host.innerHTML = `<div class="role-switch">
    <b>MODO TESTE</b> · papel:
    <select id="rsRole"><option value="seguranca">seguranca</option><option value="almoxarife">almoxarife</option><option value="gestor">gestor</option></select>
    <button class="rs-btn" id="rsSwitchEnv">Trocar ambiente</button>
  </div>`;
  const sel = document.getElementById('rsRole');
  sel.value = PAPEL;
  sel.onchange = async () => { PAPEL = sel.value; Session.setRoleOverride ? Session.setRoleOverride(sel.value) : null; await boot(); };
  document.getElementById('rsSwitchEnv').onclick = () => { localStorage.removeItem(CONFIG.STORAGE_KEYS.forcedEnv); window.location.href = '../index.html'; };
}

document.addEventListener('DOMContentLoaded', () => {
  montarPainelTeste();
  boot();
});
