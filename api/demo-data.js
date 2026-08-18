// api/demo-data.js
// ------------------------------------------------------------------
// MODO DEMONSTRAÇÃO — dados de exemplo, usados SOMENTE quando
// CONFIG.API_BASE_URL não está configurado (ver core/config.js).
// Toda tela que exibe dados vindos deste arquivo deve mostrar a
// bandeira "MODO DEMONSTRAÇÃO" (ver mobile/app.js -> renderDemoBanner).
// Quando o backend real for conectado, este arquivo deixa de ser lido.
// ------------------------------------------------------------------
import { CONFIG } from '../core/config.js';

const DB_KEY = CONFIG.STORAGE_KEYS.demoDb;

function isoDaysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); }
function isoHoursFromNow(n) { const d = new Date(); d.setHours(d.getHours() + n); return d.toISOString(); }

function seed() {
  return {
    colaboradores: [
      { id: 'c1', matricula: '00458', nome: 'João Silva', funcao: 'Encanador', obra: CONFIG.DEFAULT_OBRA, perfilEpi: 'Hidráulica', genero: 'M', status: 'Ativo', role: 'colaborador' },
      { id: 'c2', matricula: '00512', nome: 'Marcos Ferreira', funcao: 'Eletricista', obra: CONFIG.DEFAULT_OBRA, perfilEpi: 'Elétrica', genero: 'M', status: 'Ativo', role: 'colaborador' },
      { id: 'c3', matricula: '00233', nome: 'Renata Alves', funcao: 'Técnica de Segurança', obra: CONFIG.DEFAULT_OBRA, perfilEpi: 'Geral', genero: 'F', status: 'Ativo', role: 'seguranca' },
      { id: 'c4', matricula: '00119', nome: 'Carlos Mendes', funcao: 'Almoxarife', obra: CONFIG.DEFAULT_OBRA, perfilEpi: 'Geral', genero: 'M', status: 'Ativo', role: 'almoxarife' },
      { id: 'c5', matricula: '00071', nome: 'Patrícia Nunes', funcao: 'Gestora de Obra', obra: CONFIG.DEFAULT_OBRA, perfilEpi: 'Geral', genero: 'F', status: 'Ativo', role: 'gestor' },
    ],
    itens: [
      { id: 'i1', codigo: 'CAP-2026-0056', nome: 'Capacete Aba Frontal', ca: '12345', categoria: 'Cabeça', unidade: 'UN', tamanhos: ['Único'], estoque: 128, minimo: 20, perfis: ['Hidráulica', 'Elétrica', 'Geral'], prazoDias: 365, valorUnit: 42 },
      { id: 'i2', codigo: 'LUV-2026-0021', nome: 'Luva de Raspa', ca: '34567', categoria: 'Mãos', unidade: 'PAR', tamanhos: ['P', 'M', 'G'], estoque: 86, minimo: 15, perfis: ['Hidráulica', 'Geral'], prazoDias: 30, valorUnit: 18 },
      { id: 'i3', codigo: 'OCU-2026-0012', nome: 'Óculos de Segurança', ca: '54321', categoria: 'Olhos', unidade: 'UN', tamanhos: ['Único'], estoque: 76, minimo: 30, perfis: ['Hidráulica', 'Elétrica', 'Geral'], prazoDias: 180, valorUnit: 12 },
      { id: 'i4', codigo: 'BOT-2026-0034', nome: 'Bota de Segurança', ca: '67890', categoria: 'Pés', unidade: 'PAR', tamanhos: ['39', '40', '41', '42', '43'], estoque: 35, minimo: 20, perfis: ['Hidráulica', 'Elétrica', 'Geral'], prazoDias: 365, valorUnit: 89 },
      { id: 'i5', codigo: 'LUI-2026-0045', nome: 'Luva Isolante Classe 0', ca: '38210', categoria: 'Mãos', unidade: 'PAR', tamanhos: ['M', 'G'], estoque: 22, minimo: 10, perfis: ['Elétrica'], prazoDias: 90, valorUnit: 65 },
      { id: 'i6', codigo: 'RES-2026-0009', nome: 'Respirador Semifacial PFF2', ca: '15678', categoria: 'Respiratória', unidade: 'UN', tamanhos: ['Único'], estoque: 5, minimo: 25, perfis: ['Geral'], prazoDias: 15, valorUnit: 22 },
    ],
    solicitacoes: [
      { id: 'SOL-2026-001258', colaboradorId: 'c1', itens: [{ itemId: 'i1', qtd: 1, tamanho: 'Único', foraDoPerfil: false }, { itemId: 'i2', qtd: 1, tamanho: 'M', foraDoPerfil: false }, { itemId: 'i3', qtd: 1, tamanho: 'Único', foraDoPerfil: false }, { itemId: 'i4', qtd: 1, tamanho: '41', foraDoPerfil: false }], status: 'Aguardando aprovação', dataCriacao: isoDaysAgo(0), metodoIdentificacao: 'Digital' },
      { id: 'SOL-2026-001210', colaboradorId: 'c1', itens: [{ itemId: 'i2', qtd: 1, tamanho: 'M', foraDoPerfil: false }], status: 'Aprovada', dataCriacao: isoDaysAgo(9), metodoIdentificacao: 'Digital', aprovador: 'Renata Alves' },
      { id: 'SOL-2026-001185', colaboradorId: 'c1', itens: [{ itemId: 'i6', qtd: 1, tamanho: 'Único', foraDoPerfil: false }], status: 'Reprovada', dataCriacao: isoDaysAgo(16), metodoIdentificacao: 'Matrícula + senha', motivoReprovacao: 'Estoque insuficiente no momento' },
    ],
    fichas: [
      { id: 'FICHA-2026-0156', colaboradorId: 'c1', itemId: 'i1', qtd: 1, tamanho: 'Único', data: isoDaysAgo(0), hora: '10:22', solicitacaoId: 'SOL-2026-001258', metodo: 'Digital' },
      { id: 'FICHA-2026-0127', colaboradorId: 'c1', itemId: 'i2', qtd: 1, tamanho: 'M', data: isoDaysAgo(30), hora: '14:10', solicitacaoId: 'SOL-2026-001210', metodo: 'Digital' },
      { id: 'FICHA-2026-0098', colaboradorId: 'c1', itemId: 'i4', qtd: 1, tamanho: '41', data: isoDaysAgo(60), hora: '09:30', solicitacaoId: 'SOL-2026-000980', metodo: 'Reconhecimento facial' },
    ],
    reservas: [
      { id: 'res1', colaboradorId: 'c1', itemId: 'i1', qtd: 1, tamanho: 'Único', dataReserva: isoDaysAgo(0), dataVencimento: isoHoursFromNow(48), motivo: 'Retirada programada', responsavel: 'Carlos Mendes', status: 'Ativa' },
      { id: 'res2', colaboradorId: 'c1', itemId: 'i2', qtd: 1, tamanho: 'M', dataReserva: isoDaysAgo(1), dataVencimento: isoHoursFromNow(-24), motivo: 'Reserva não retirada', responsavel: 'Carlos Mendes', status: 'Vencida' },
    ],
    notificacoes: [
      { id: 'n1', role: 'colaborador', colaboradorId: 'c1', msg: 'Solicitação aprovada: SOL-2026-001210', data: isoDaysAgo(9) + '', lida: false, hora: '10:30' },
      { id: 'n2', role: 'colaborador', colaboradorId: 'c1', msg: 'Reserva criada: Capacete Aba Frontal', data: isoDaysAgo(0), lida: false, hora: '09:45' },
      { id: 'n3', role: 'colaborador', colaboradorId: 'c1', msg: 'Prazo de reserva vencendo em 24h', data: isoDaysAgo(1), lida: false, hora: 'Ontem' },
      { id: 'n4', role: 'colaborador', colaboradorId: 'c1', msg: 'EPI não liberado: fora do perfil', data: isoDaysAgo(1), lida: true, hora: 'Ontem' },
      { id: 'n5', role: 'seguranca', msg: 'Respirador PFF2 abaixo do mínimo (5/25).', data: isoDaysAgo(0), lida: false },
      { id: 'n6', role: 'almoxarife', msg: 'Reserva de Luva de Raspa vencida — liberar estoque.', data: isoDaysAgo(0), lida: false },
      { id: 'n7', role: 'gestor', msg: '1 item crítico esta semana.', data: isoDaysAgo(0), lida: false },
    ],
    nextSol: 1259,
    nextFicha: 157,
  };
}

export function loadDemoDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  const s = seed();
  saveDemoDb(s);
  return s;
}
export function saveDemoDb(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
export function resetDemoDb() { localStorage.removeItem(DB_KEY); return loadDemoDb(); }
