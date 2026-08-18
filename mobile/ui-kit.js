// mobile/ui-kit.js
// Pequenos utilitários de UI reaproveitados por todos os módulos mobile.
let appRoot = null;
export function setAppRoot(el) { appRoot = el; }

export function toast(msg, type = '') {
  if (!appRoot) return;
  let host = appRoot.querySelector('#toastHost');
  if (!host) { host = document.createElement('div'); host.id = 'toastHost'; appRoot.appendChild(host); }
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  host.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

export function showSheet(html) {
  closeSheet();
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.id = 'sheetOverlay';
  ov.innerHTML = `<div class="sheet" id="sheetHost">${html}</div>`;
  ov.onclick = (e) => { if (e.target === ov) closeSheet(); };
  (appRoot || document.body).appendChild(ov);
}
export function closeSheet() {
  const ov = document.getElementById('sheetOverlay');
  if (ov) ov.remove();
}

export function initials(nome) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}
export function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
export function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function renderDemoBanner(isDemo) {
  if (!isDemo) return '';
  return `<div class="demo-banner">MODO DEMONSTRAÇÃO — dados de exemplo (backend ainda não configurado)</div>`;
}
