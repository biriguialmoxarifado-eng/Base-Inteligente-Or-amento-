// mobile/app.js
// ------------------------------------------------------------------
// Orquestrador do ALMOXA PRO MOBILE: sessão, navegação por abas,
// dispatch de telas por papel (colaborador/segurança/almoxarife/gestor).
// Cada tela é renderizada pelo seu próprio módulo — este arquivo só
// decide QUAL módulo chamar e mantém o estado de navegação/carrinho.
// ------------------------------------------------------------------
import { CONFIG } from '../core/config.js';
import { detectDevice } from '../core/device-detector.js';
import { Session } from '../core/session.js';
import { homeViewFor } from '../core/permissions.js';
import { UsuariosAPI } from '../api/usuarios-api.js';
import { EpiAPI } from '../api/epi-api.js';
import { NotificacaoAPI } from '../api/notificacao-api.js';

import { setAppRoot, initials, fmtDateTime } from './ui-kit.js';
import { renderIdentificacao } from './auth.js';
import { renderCatalogo } from './catalogo.js';
import { renderCarrinho } from './carrinho.js';
import { renderMinhasSolicitacoes, renderAprovacoes } from './solicitacoes.js';
import { renderReservas } from './reservas.js';
import { renderNotificacoes, contarNaoLidas } from './notificacoes.js';
import { renderMinhasFichas } from './fichas.js';
import { renderSegDashboard, renderEstoqueLista, renderAlmDashboard, renderAlmConferencia, renderAlmInventario, renderGestDashboard } from './dashboards.js';

let ROOT = null;
let VIEW = { name: 'identificacao' };
let CART = [];
let COLABORADOR_ATUAL = null;

export function mountApp(rootEl) {
  ROOT = rootEl;
  setAppRoot(rootEl);
  boot();
}

async function boot() {
  const s = Session.get();
  if (s) {
    COLABORADOR_ATUAL = await UsuariosAPI.obterPorId(s.colaboradorId);
    VIEW = { name: homeViewFor(Session.papelAtivo()) };
  }
  render();
}

function go(name) { VIEW = { name }; render(); }

async function render() {
  if (!ROOT) return;
  ROOT.innerHTML = '<div id="app"></div>';
  const app = document.getElementById('app');

  if (!Session.isAuthenticated()) {
    app.appendChild(renderIdentificacao(async (colaborador) => {
      COLABORADOR_ATUAL = colaborador;
      go(homeViewFor(Session.papelAtivo()));
    }));
    appendToast(app);
    return;
  }

  const papel = Session.papelAtivo();
  app.appendChild(await renderTopbar(papel));
  const screen = document.createElement('div'); screen.className = 'app-screen';
  screen.appendChild(await renderScreen(papel));
  app.appendChild(screen);
  app.appendChild(renderTabbar(papel));
  appendToast(app);

  if (VIEW.name === 'catalogo' && CART.length) {
    const fab = document.createElement('div'); fab.className = 'cart-fab';
    fab.innerHTML = `<span>🛒 ${CART.reduce((s, i) => s + i.qtd, 0)} item(ns) no carrinho</span><span>Ver carrinho ›</span>`;
    fab.onclick = () => go('carrinho');
    app.appendChild(fab);
  }
}
function appendToast(app) { const h = document.createElement('div'); h.id = 'toastHost'; app.appendChild(h); }

async function renderTopbar(papel) {
  const titles = {
    inicio: CONFIG.APP_NAME, catalogo: 'Catálogo de EPI', carrinho: 'Carrinho', minhasSolicitacoes: 'Minhas Solicitações',
    minhasFichas: 'Minhas Fichas', minhasReservas: 'Reservas', notificacoes: 'Notificações', perfil: 'Meu Perfil',
    segDashboard: 'Dashboard Segurança', segAprovacoes: 'Aprovações', segEstoque: 'Estoque de EPI',
    almDashboard: 'Dashboard Almoxarifado', almConferencia: 'Conferência', almEstoque: 'Estoque', almInventario: 'Inventário',
    gestDashboard: 'Dashboard Gestor',
  };
  const showBack = !['inicio', 'segDashboard', 'almDashboard', 'gestDashboard'].includes(VIEW.name);
  const naoLidas = await contarNaoLidas(papel, COLABORADOR_ATUAL ? COLABORADOR_ATUAL.id : null);
  const el = document.createElement('div'); el.className = 'topbar';
  el.innerHTML = `
    <div class="tb-left">
      ${showBack ? `<button class="tb-back" id="tbBack">←</button>` : ''}
      <div><h1>${titles[VIEW.name] || CONFIG.APP_NAME}</h1><div class="tb-sub">${COLABORADOR_ATUAL ? COLABORADOR_ATUAL.obra : ''}</div></div>
    </div>
    <button class="tb-icon-btn" id="tbNotif">🔔${naoLidas > 0 ? `<span class="tb-badge">${naoLidas}</span>` : ''}</button>`;
  el.querySelector('#tbNotif').onclick = () => go('notificacoes');
  if (showBack) el.querySelector('#tbBack').onclick = () => go(homeViewFor(papel));
  return el;
}

function renderTabbar(papel) {
  const el = document.createElement('div'); el.className = 'tabbar';
  const tabsByRole = {
    colaborador: [['inicio', '🏠', 'Início'], ['catalogo', '🛡️', 'Catálogo'], ['carrinho', '🛒', 'Carrinho'], ['minhasSolicitacoes', '📋', 'Pedidos'], ['perfil', '👤', 'Mais']],
    seguranca: [['segDashboard', '🟢', 'Início'], ['segAprovacoes', '✅', 'Aprovações'], ['segEstoque', '📦', 'Estoque'], ['minhasReservas', '⏱️', 'Reservas'], ['perfil', '👤', 'Mais']],
    almoxarife: [['almDashboard', '🏭', 'Início'], ['almConferencia', '📷', 'Confer.'], ['almEstoque', '📦', 'Estoque'], ['almInventario', '🧮', 'Invent.'], ['perfil', '👤', 'Mais']],
    gestor: [['gestDashboard', '📊', 'Início'], ['segEstoque', '📦', 'Estoque'], ['segAprovacoes', '✅', 'Aprov.'], ['notificacoes', '🔔', 'Avisos'], ['perfil', '👤', 'Mais']],
  };
  (tabsByRole[papel] || tabsByRole.colaborador).forEach(([v, ic, label]) => {
    const b = document.createElement('div');
    b.className = 'tab-item' + (VIEW.name === v ? ' active' : '');
    b.innerHTML = `<div class="tab-ic">${ic}</div><div>${label}</div>`;
    b.onclick = () => go(v);
    el.appendChild(b);
  });
  return el;
}

async function renderScreen(papel) {
  switch (VIEW.name) {
    case 'inicio': return renderInicio();
    case 'catalogo': return renderCatalogo(COLABORADOR_ATUAL, CART, () => render());
    case 'carrinho': {
      const { itens: catalogo } = await EpiAPI.listarCatalogo();
      return renderCarrinho(COLABORADOR_ATUAL, CART, catalogo, () => go('catalogo'), () => go('minhasSolicitacoes'), () => render());
    }
    case 'minhasSolicitacoes': return renderMinhasSolicitacoes(COLABORADOR_ATUAL);
    case 'minhasFichas': return renderMinhasFichas(COLABORADOR_ATUAL);
    case 'minhasReservas': return renderReservas(COLABORADOR_ATUAL, papel === 'colaborador');
    case 'notificacoes': return renderNotificacoes(papel, COLABORADOR_ATUAL ? COLABORADOR_ATUAL.id : null, () => render());
    case 'perfil': return renderPerfil();
    case 'segDashboard': return renderSegDashboard(go);
    case 'segAprovacoes': return renderAprovacoes(COLABORADOR_ATUAL.nome, () => render());
    case 'segEstoque': return renderEstoqueLista();
    case 'almDashboard': return renderAlmDashboard(go);
    case 'almConferencia': return renderAlmConferencia();
    case 'almEstoque': return renderEstoqueLista();
    case 'almInventario': return renderAlmInventario();
    case 'gestDashboard': return renderGestDashboard();
    default: return renderInicio();
  }
}

async function renderInicio() {
  const c = COLABORADOR_ATUAL;
  const el = document.createElement('div'); el.className = 'content';
  const { itens: fichas } = await (await import('../api/pdf-api.js')).FichasAPI.historicoDoColaborador(c.id);
  const { itens: sols } = await (await import('../api/solicitacao-api.js')).SolicitacaoAPI.minhasSolicitacoes(c.id);
  const { itens: reservas } = await (await import('../api/reserva-api.js')).ReservaAPI.listar();
  const minhasReservas = reservas.filter((r) => r.colaboradorId === c.id && r.status === 'Ativa');
  el.innerHTML = `
    <div class="card profile-card">
      <div class="avatar">${initials(c.nome)}</div>
      <div><div class="p-name">${c.nome}</div><div class="p-meta">Perfil: ${c.perfilEpi}</div></div>
    </div>
    <div class="section-title">Ações rápidas</div>
    <div class="quick-grid">
      <div class="quick-item" id="qaCatalogo"><span>🛡️</span>Solicitar EPI</div>
      <div class="quick-item" id="qaSol"><span>📋</span>Minhas solicitações</div>
      <div class="quick-item" id="qaRes"><span>⏱️</span>Minhas reservas</div>
      <div class="quick-item" id="qaFic"><span>🗂️</span>Minhas fichas</div>
    </div>
    ${minhasReservas.length ? `<div class="section-title">Próxima troca de EPIs</div><div id="proxTroca"></div>` : ''}
    <div class="section-title">Solicitações recentes <span class="link" id="verTodas">ver todas ›</span></div>
    <div id="solList"></div>
  `;
  el.querySelector('#qaCatalogo').onclick = () => go('catalogo');
  el.querySelector('#qaSol').onclick = () => go('minhasSolicitacoes');
  el.querySelector('#qaRes').onclick = () => go('minhasReservas');
  el.querySelector('#qaFic').onclick = () => go('minhasFichas');
  el.querySelector('#verTodas').onclick = () => go('minhasSolicitacoes');
  const listEl = el.querySelector('#solList');
  if (!sols.length) {
    listEl.innerHTML = `<div class="empty-state"><div class="es-ic">📋</div><h3>Nenhuma solicitação ainda</h3><p>Toque em "Solicitar EPI" para começar.</p></div>`;
  } else {
    sols.slice(0, 4).forEach((s) => {
      const div = document.createElement('div'); div.className = 'card';
      const cor = s.status === 'Aprovada' ? 'green' : s.status === 'Reprovada' ? 'red' : 'amber';
      div.innerHTML = `<div class="list-tile" style="border:none;padding:0;"><div><div class="lt-title mono" style="font-size:12px;">${s.id}</div><div class="lt-sub">${s.itens.length} item(ns) · ${fmtDateTime(s.dataCriacao)}</div></div><span class="badge badge-${cor}">${s.status}</span></div>`;
      listEl.appendChild(div);
    });
  }
  return el;
}

async function renderPerfil() {
  const c = COLABORADOR_ATUAL;
  const el = document.createElement('div'); el.className = 'content';
  const { itens: fichas } = await (await import('../api/pdf-api.js')).FichasAPI.historicoDoColaborador(c.id);
  el.innerHTML = `
    <div class="card profile-card">
      <div class="avatar">${initials(c.nome)}</div>
      <div><div class="p-name">${c.nome}</div><div class="p-meta">Mat. ${c.matricula} · ${c.funcao}</div></div>
    </div>
    <div class="card" style="margin-top:10px;">
      <div class="kv-row"><span class="k">Obra</span><span class="v">${c.obra}</span></div>
      <div class="kv-row"><span class="k">Perfil de EPI</span><span class="v">${c.perfilEpi}</span></div>
      <div class="kv-row"><span class="k">Gênero</span><span class="v">${c.genero}</span></div>
      <div class="kv-row"><span class="k">Status</span><span class="v"><span class="badge badge-green">${c.status}</span></span></div>
      <div class="kv-row"><span class="k">Permissões</span><span class="v" style="text-transform:capitalize;">${c.role}</span></div>
    </div>
    <div class="section-title">Histórico</div>
    <div class="card"><div class="kv-row"><span class="k">Total de fichas</span><span class="v">${fichas.length}</span></div></div>
    <button class="btn btn-ghost" id="btnSair" style="margin-top:20px;">Sair</button>
  `;
  el.querySelector('#btnSair').onclick = () => { Session.clear(); COLABORADOR_ATUAL = null; go('identificacao'); };
  return el;
}

/* ---------------- Boot: chamado por mobile/index.html ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  mountApp(document.getElementById('appRoot'));
});
