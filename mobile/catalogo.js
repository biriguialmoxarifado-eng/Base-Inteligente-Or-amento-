// mobile/catalogo.js
import { EpiAPI } from '../api/epi-api.js';
import { NotificacaoAPI } from '../api/notificacao-api.js';
import { toast, fmtDate, renderDemoBanner } from './ui-kit.js';

let filtroCategoria = 'Todos';
let filtroBusca = '';
let apenasPerfil = true;

export async function renderCatalogo(colaborador, cart, onCartChange) {
  const el = document.createElement('div');
  el.className = 'content';
  const categorias = ['Todos', ...await EpiAPI.categorias()];
  el.innerHTML = `
    <div class="searchbox"><span>🔎</span><input id="searchInput" placeholder="Buscar EPI…" value="${filtroBusca}"></div>
    <div class="chip-row" id="chipRow"></div>
    <label class="check-label"><input type="checkbox" id="chkPerfil" ${apenasPerfil ? 'checked' : ''}> Mostrar apenas EPIs do meu perfil (${colaborador.perfilEpi})</label>
    <div id="prodList"></div>
  `;
  const chipRow = el.querySelector('#chipRow');
  categorias.forEach((cat) => {
    const chip = document.createElement('div');
    chip.className = 'chip' + (filtroCategoria === cat ? ' active' : '');
    chip.textContent = cat;
    chip.onclick = () => { filtroCategoria = cat; renderLista(el, colaborador, cart, onCartChange); };
    chipRow.appendChild(chip);
  });
  el.querySelector('#searchInput').oninput = (e) => { filtroBusca = e.target.value; renderLista(el, colaborador, cart, onCartChange); };
  el.querySelector('#chkPerfil').onchange = (e) => { apenasPerfil = e.target.checked; renderLista(el, colaborador, cart, onCartChange); };
  await renderLista(el, colaborador, cart, onCartChange);
  return el;
}

async function renderLista(el, colaborador, cart, onCartChange) {
  const listEl = el.querySelector('#prodList');
  listEl.innerHTML = '<div class="loading-row">Carregando catálogo…</div>';
  const { itens, demo } = await EpiAPI.listarCatalogo({ categoria: filtroCategoria, busca: filtroBusca });
  let visiveis = itens;
  if (apenasPerfil) visiveis = visiveis.filter((i) => EpiAPI.permitidoParaPerfil(i, colaborador.perfilEpi));
  listEl.innerHTML = demo ? renderDemoBanner(true) : '';
  if (!visiveis.length) {
    listEl.innerHTML += `<div class="empty-state"><div class="es-ic">🔍</div><h3>Nada encontrado</h3><p>Ajuste a busca ou os filtros.</p></div>`;
    return;
  }
  for (const it of visiveis) {
    listEl.appendChild(await productCard(it, colaborador, cart, onCartChange));
  }
}

async function productCard(item, colaborador, cart, onCartChange) {
  const div = document.createElement('div');
  div.className = 'product';
  const permitido = EpiAPI.permitidoParaPerfil(item, colaborador.perfilEpi);
  const validacao = await EpiAPI.validarRetiradaAnterior(colaborador.id, item.id);
  const semEstoque = item.estoque <= 0;
  div.innerHTML = `
    <div class="p-thumb">🛡️</div>
    <div class="p-info">
      <div class="p-name">${item.nome}</div>
      <div class="p-sub">CA ${item.ca} · ${item.categoria} · Estoque: ${item.estoque} ${item.unidade}</div>
      <div class="p-foot">
        <select class="tamSel" ${item.tamanhos.length === 1 ? 'disabled' : ''}>${item.tamanhos.map((t) => `<option value="${t}">${t}</option>`).join('')}</select>
        <div class="qtyArea"></div>
      </div>
      <div class="noteArea"></div>
    </div>`;
  const qtyArea = div.querySelector('.qtyArea');
  const drawQty = () => {
    qtyArea.innerHTML = '';
    const cur = cart.find((c) => c.itemId === item.id);
    if (!cur) {
      const btn = document.createElement('button');
      btn.className = 'add-btn'; btn.textContent = 'Adicionar';
      btn.disabled = semEstoque || !validacao.liberado;
      btn.onclick = () => {
        cart.push({ itemId: item.id, qtd: 1, tamanho: div.querySelector('.tamSel').value, foraDoPerfil: !permitido });
        toast(`${item.nome} adicionado ao carrinho.`, 'ok');
        onCartChange();
        drawQty();
      };
      qtyArea.appendChild(btn);
    } else {
      const st = document.createElement('div'); st.className = 'stepper';
      st.innerHTML = `<button class="dec">−</button><span>${cur.qtd}</span><button class="inc">+</button>`;
      st.querySelector('.dec').onclick = () => { cur.qtd--; if (cur.qtd <= 0) cart.splice(cart.indexOf(cur), 1); onCartChange(); drawQty(); };
      st.querySelector('.inc').onclick = () => { cur.qtd++; onCartChange(); drawQty(); };
      qtyArea.appendChild(st);
    }
  };
  drawQty();
  const noteArea = div.querySelector('.noteArea');
  if (!permitido) {
    noteArea.innerHTML = `<div class="blocked-note">Este item não está previsto para o seu perfil de EPI. <a href="#" class="reqLib">Solicitar liberação da Segurança</a></div>`;
    noteArea.querySelector('.reqLib').onclick = async (e) => {
      e.preventDefault();
      await NotificacaoAPI.enviar('seguranca', `${colaborador.nome} solicitou liberação de "${item.nome}" fora do perfil (${colaborador.perfilEpi}).`);
      toast('Solicitação de liberação enviada à Segurança.', 'ok');
    };
  } else if (!validacao.liberado) {
    noteArea.innerHTML = `<div class="locked-note">Este EPI já foi retirado em ${fmtDate(validacao.dataUltima)}. Prazo: ${validacao.prazoDias} dias. Nova retirada liberada em ${fmtDate(validacao.dataPrevista)}.</div>`;
  } else if (semEstoque) {
    noteArea.innerHTML = `<div class="blocked-note">Sem estoque disponível no momento.</div>`;
  }
  return div;
}
