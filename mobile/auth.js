// mobile/auth.js
// Orquestra a tela de identificação: chama biometric.js / facial.js /
// qrcode.js / AuthAPI.loginMatricula e, ao confirmar, grava a sessão.
import { AuthAPI } from '../api/auth-api.js';
import { UsuariosAPI } from '../api/usuarios-api.js';
import { Session } from '../core/session.js';
import { autenticarDigital } from './biometric.js';
import { iniciarCameraFacial, pararCameraFacial } from './facial.js';
import { lerQrCode, pararCameraQr } from './qrcode.js';
import { CONFIG } from '../core/config.js';
import { toast, showSheet, closeSheet } from './ui-kit.js';

export function renderIdentificacao(onEntrar) {
  const wrap = document.createElement('div');
  wrap.className = 'id-screen';
  wrap.innerHTML = `
    <div class="id-brand">
      <div class="id-mark">AP</div>
      <h1>${CONFIG.APP_NAME}</h1>
      <div class="sub">${CONFIG.APP_TAGLINE}</div>
    </div>
    <div class="id-prompt">Identifique-se para continuar</div>
    <div class="id-methods">
      <button class="id-method" id="mDigital"><div class="im-ic">🔐</div><div class="im-txt"><b>Digital</b><span>Biometria deste aparelho</span></div></button>
      <button class="id-method" id="mFacial"><div class="im-ic">🙂</div><div class="im-txt"><b>Reconhecimento facial</b><span>Usa a câmera do dispositivo</span></div></button>
      <button class="id-method" id="mQr"><div class="im-ic">📷</div><div class="im-txt"><b>Ler QR Code / Crachá</b><span>Aponte a câmera para o código</span></div></button>
      <button class="id-method" id="mMat"><div class="im-ic">🔢</div><div class="im-txt"><b>Matrícula e senha</b><span>Alternativa manual</span></div></button>
    </div>
    <div class="id-foot">🔒 Ambiente seguro — seus dados são protegidos</div>
  `;

  wrap.querySelector('#mDigital').onclick = async () => {
    toast('Verificando biometria do dispositivo…');
    const r = await autenticarDigital();
    if (!r.ok) { toast(r.motivo, 'err'); return; }
  };
  wrap.querySelector('#mFacial').onclick = () => abrirCameraFacial(onEntrar);
  wrap.querySelector('#mQr').onclick = () => abrirCameraQr(onEntrar);
  wrap.querySelector('#mMat').onclick = () => abrirLoginMatricula(onEntrar);
  return wrap;
}

function abrirLoginMatricula(onEntrar) {
  showSheet(`
    <div class="sheet-handle"></div>
    <h3>Matrícula e senha</h3>
    <div class="muted">Use suas credenciais cadastradas no ALMOXA PRO.</div>
    <form id="fLogin">
      <label>Matrícula</label>
      <input id="fMat" inputmode="numeric" placeholder="Ex.: 00458" required>
      <label>Senha</label>
      <input id="fSenha" type="password" placeholder="••••••" required>
      <div style="margin-top:18px;"></div>
      <button class="btn btn-primary" type="submit">Entrar</button>
    </form>
  `);
  document.getElementById('fLogin').onsubmit = async (e) => {
    e.preventDefault();
    const mat = document.getElementById('fMat').value.trim();
    const senha = document.getElementById('fSenha').value;
    const r = await AuthAPI.loginMatricula(mat, senha);
    if (!r.ok) { toast(r.motivo, 'err'); return; }
    closeSheet();
    finalizarLogin(r.colaborador, 'Matrícula e senha', onEntrar);
  };
}

function abrirCameraFacial(onEntrar) {
  showSheet(`
    <div class="sheet-handle"></div>
    <h3>Reconhecimento facial</h3>
    <div class="muted">Posicione o rosto dentro da moldura.</div>
    <div class="camera-box"><video autoplay playsinline id="camVideo"></video><div class="cam-frame"></div></div>
    <div id="facialMsg" style="margin-top:12px;"></div>
    <button class="btn btn-ghost" id="btnCancelFacial" style="margin-top:10px;">Cancelar</button>
  `);
  document.getElementById('btnCancelFacial').onclick = () => { pararCameraFacial(); closeSheet(); };
  iniciarCameraFacial(document.getElementById('camVideo')).then((r) => {
    const msgEl = document.getElementById('facialMsg');
    if (!msgEl) return;
    if (!r.ok && !r.pendingConfig) { msgEl.innerHTML = `<div class="blocked-note">${r.motivo}</div>`; return; }
    msgEl.innerHTML = `<div class="integration-flag"><b>Configuração pendente</b>${r.motivo}</div>
      <button class="btn btn-primary" id="btnContinuarTeste" style="margin-top:10px;">Continuar em modo teste</button>`;
    document.getElementById('btnContinuarTeste').onclick = async () => {
      pararCameraFacial(); closeSheet();
      const { itens } = await import('../api/usuarios-api.js').then((m) => m.UsuariosAPI.listarTodos());
      finalizarLogin(itens[0], 'Reconhecimento facial', onEntrar);
    };
  });
}

function abrirCameraQr(onEntrar) {
  showSheet(`
    <div class="sheet-handle"></div>
    <h3>Ler QR Code / Crachá</h3>
    <div class="muted">Aponte a câmera para o QR Code do crachá.</div>
    <div class="camera-box"><video autoplay playsinline id="camVideoQr"></video><div class="cam-frame"></div></div>
    <button class="btn btn-ghost" id="btnCancelQr" style="margin-top:10px;">Cancelar</button>
  `);
  document.getElementById('btnCancelQr').onclick = () => { pararCameraQr(); closeSheet(); };
  lerQrCode(document.getElementById('camVideoQr'), (r) => {
    if (!r.ok) { toast(r.motivo, 'err'); closeSheet(); return; }
    closeSheet();
    finalizarLogin(r.colaborador, 'QR Code / Crachá', onEntrar);
  });
}

async function finalizarLogin(colaborador, metodo, onEntrar) {
  Session.set({ colaboradorId: colaborador.id, role: colaborador.role, metodoIdentificacao: metodo });
  onEntrar(colaborador, metodo);
}
