// mobile/carrinho.js
import { SolicitacaoAPI } from '../api/solicitacao-api.js';
import { toast, showSheet, closeSheet, fmtDateTime } from './ui-kit.js';

export function renderCarrinho(colaborador, cart, itensCatalogo, onIrCatalogo, onFinalizado, onCartChange) {
  const el = document.createElement('div');
  el.className = 'content';
  if (!cart.length) {
    el.innerHTML = `<div class="empty-state"><div class="es-ic">🛒</div><h3>Seu carrinho está vazio</h3><p>Adicione EPIs no catálogo para continuar.</p></div>`;
    const b = document.createElement('button');
    b.className = 'btn btn-primary'; b.textContent = 'Ir para o catálogo'; b.style.marginTop = '14px';
    b.onclick = onIrCatalogo;
    el.appendChild(b);
    return el;
  }
  el.innerHTML = `<div class="section-title">🛒 ${cart.reduce((s, i) => s + i.qtd, 0)} item(ns)</div><div id="cartList"></div>`;
  const list = el.querySelector('#cartList');
  cart.forEach((ci) => {
    const it = itensCatalogo.find((i) => i.id === ci.itemId);
    const row = document.createElement('div');
    row.className = 'card';
    row.innerHTML = `<div class="list-tile" style="border:none;padding:0;">
      <div><div class="lt-title">${it.nome}</div><div class="lt-sub">Tam. ${ci.tamanho} · ${ci.foraDoPerfil ? '<span class="txt-red">Fora do perfil — requer aprovação</span>' : 'Dentro do perfil'}</div></div>
      <div class="stepper"><button class="dec">−</button><span>${ci.qtd}</span><button class="inc">+</button></div>
    </div>`;
    row.querySelector('.dec').onclick = () => { ci.qtd--; if (ci.qtd <= 0) cart.splice(cart.indexOf(ci), 1); onCartChange(); };
    row.querySelector('.inc').onclick = () => { ci.qtd++; onCartChange(); };
    list.appendChild(row);
  });
  const foot = document.createElement('div'); foot.style.marginTop = '20px';
  foot.innerHTML = `<button class="btn btn-primary" id="btnFinalizar">Finalizar solicitação</button>`;
  el.appendChild(foot);
  foot.querySelector('#btnFinalizar').onclick = () => abrirConfirmacao(colaborador, cart, itensCatalogo, onFinalizado);
  return el;
}

function abrirConfirmacao(colaborador, cart, itensCatalogo, onFinalizado) {
  const itensHtml = cart.map((ci) => {
    const it = itensCatalogo.find((i) => i.id === ci.itemId);
    return `<div class="kv-row"><span class="k">${it.nome} (${ci.tamanho})</span><span class="v">${ci.qtd} ${it.unidade}</span></div>`;
  }).join('');
  showSheet(`
    <div class="sheet-handle"></div>
    <h3>Resumo da solicitação</h3>
    <div class="kv-row"><span class="k">Colaborador</span><span class="v">${colaborador.nome}</span></div>
    <div class="kv-row"><span class="k">Matrícula</span><span class="v mono">${colaborador.matricula}</span></div>
    <div class="kv-row"><span class="k">Perfil</span><span class="v">${colaborador.perfilEpi}</span></div>
    <div class="kv-row"><span class="k">Obra</span><span class="v">${colaborador.obra}</span></div>
    ${itensHtml}
    <div class="section-title" style="margin-top:16px;">Confirme sua identidade</div>
    <div class="btn-row" style="flex-wrap:wrap;gap:8px;">
      <button class="btn btn-outline btn-sm" data-m="Digital">Digital</button>
      <button class="btn btn-outline btn-sm" data-m="Reconhecimento facial">Rosto</button>
      <button class="btn btn-outline btn-sm" data-m="QR Code / Crachá">QR Code</button>
      <button class="btn btn-outline btn-sm" data-m="Matrícula">Matrícula</button>
    </div>
    <div id="confirmMsg" style="margin-top:12px;"></div>
  `);
  document.querySelectorAll('#sheetHost [data-m]').forEach((b) => {
    b.onclick = () => {
      const msg = document.getElementById('confirmMsg');
      msg.innerHTML = `<div class="integration-flag"><b>Identidade confirmada</b>Método: ${b.dataset.m} · ${fmtDateTime(new Date().toISOString())}</div>
        <button class="btn btn-primary" id="btnConfirmarFinal" style="margin-top:12px;">Confirmar solicitação</button>`;
      document.getElementById('btnConfirmarFinal').onclick = async () => {
        const sol = await SolicitacaoAPI.criar(colaborador.id, cart.splice(0), b.dataset.m);
        closeSheet();
        toast(`Solicitação confirmada. ${sol.id} enviada para aprovação.`, 'ok');
        onFinalizado(sol);
      };
    };
  });
}
