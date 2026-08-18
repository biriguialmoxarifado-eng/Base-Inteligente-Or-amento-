// mobile/notificacoes.js
import { NotificacaoAPI } from '../api/notificacao-api.js';
import { fmtDateTime, renderDemoBanner } from './ui-kit.js';

export async function renderNotificacoes(papel, colaboradorId, onLida) {
  const el = document.createElement('div'); el.className = 'content';
  const { itens: notifs, demo } = await NotificacaoAPI.listarPara(papel, colaboradorId);
  el.innerHTML = renderDemoBanner(demo);
  if (!notifs.length) {
    el.innerHTML += `<div class="empty-state"><div class="es-ic">🔔</div><h3>Sem notificações</h3><p>Você está em dia.</p></div>`;
    return el;
  }
  const card = document.createElement('div'); card.className = 'card';
  notifs.forEach((n) => {
    const item = document.createElement('div');
    item.className = 'notif-item' + (n.lida ? ' read' : '');
    item.innerHTML = `<div class="n-dot"></div><div class="n-text">${n.msg}<div class="n-time">${n.hora || fmtDateTime(n.data)}</div></div>`;
    item.onclick = async () => { await NotificacaoAPI.marcarLida(n.id); onLida(); };
    card.appendChild(item);
  });
  el.appendChild(card);
  return el;
}

export async function contarNaoLidas(papel, colaboradorId) {
  const { itens } = await NotificacaoAPI.listarPara(papel, colaboradorId);
  return itens.filter((n) => !n.lida).length;
}
