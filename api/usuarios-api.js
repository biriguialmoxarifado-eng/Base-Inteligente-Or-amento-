// api/usuarios-api.js
import { request, API_STATUS } from './api.js';
import { loadDemoDb } from './demo-data.js';

export const UsuariosAPI = {
  async obterPorId(id) {
    const r = await request(`/usuarios/${id}`);
    if (r.status === API_STATUS.OK) return { ...r.data, demo: false };
    const db = loadDemoDb();
    const c = db.colaboradores.find((c) => c.id === id);
    return c ? { ...c, demo: true } : null;
  },
  async listarTodos() {
    const r = await request('/usuarios');
    if (r.status === API_STATUS.OK) return { itens: r.data, demo: false };
    const db = loadDemoDb();
    return { itens: db.colaboradores, demo: true };
  },
};
