// core/router.js
// ------------------------------------------------------------------
// A PONTE. Ponto único de entrada do ALMOXA PRO (chamado por /index.html).
// Detecta o dispositivo e carrega a interface correspondente.
// Não decide regra de negócio — só decide QUAL INTERFACE abrir.
// ------------------------------------------------------------------
import { detectDevice } from './device-detector.js';
import { CONFIG } from './config.js';

const DESTINOS = {
  mobile: './mobile/index.html',
  tablet: './mobile/index.html?ambiente=tablet', // reusa o Mobile em layout adaptado
  desktop: './desktop/index.html',
};

export function iniciarPonte({ mountEl }) {
  const forced = localStorage.getItem(CONFIG.STORAGE_KEYS.forcedEnv);
  const device = forced || detectDevice();

  mountEl.innerHTML = `
    <div class="ponte-card">
      <div class="ponte-spinner"></div>
      <div class="ponte-mark">AP</div>
      <h1>${CONFIG.APP_NAME}</h1>
      <p class="ponte-sub">${CONFIG.APP_TAGLINE}</p>
      <p class="ponte-msg">Identificando o ambiente…</p>
      <button class="ponte-link" id="btnModoTeste">Modo de teste — escolher ambiente manualmente</button>
      <div class="ponte-picker" id="pontePicker">
        <button data-env="mobile">📱 MOBILE</button>
        <button data-env="tablet">📱 TABLET</button>
        <button data-env="desktop">💻 DESKTOP</button>
      </div>
    </div>`;

  document.getElementById('btnModoTeste').onclick = () => {
    document.getElementById('pontePicker').classList.toggle('show');
  };
  mountEl.querySelectorAll('.ponte-picker button').forEach((b) => {
    b.onclick = () => {
      localStorage.setItem(CONFIG.STORAGE_KEYS.forcedEnv, b.dataset.env);
      window.location.href = DESTINOS[b.dataset.env];
    };
  });

  setTimeout(() => {
    window.location.href = DESTINOS[device] || DESTINOS.mobile;
  }, 550);
}
