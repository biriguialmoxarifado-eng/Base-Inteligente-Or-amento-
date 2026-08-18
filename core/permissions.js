// core/permissions.js
// ------------------------------------------------------------------
// Fonte única de permissões por papel. Mobile e Desktop devem
// consultar este mapa em vez de decidir acesso na marra em cada tela.
// ------------------------------------------------------------------

export const ROLES = {
  COLABORADOR: 'colaborador',
  SEGURANCA: 'seguranca',
  ALMOXARIFE: 'almoxarife',
  GESTOR: 'gestor',
};

// Views permitidas por papel (usado pela navegação mobile/desktop)
export const VIEWS_BY_ROLE = {
  [ROLES.COLABORADOR]: ['inicio', 'catalogo', 'carrinho', 'minhasSolicitacoes', 'minhasReservas', 'minhasFichas', 'notificacoes', 'perfil'],
  [ROLES.SEGURANCA]: ['segDashboard', 'segColaboradores', 'segEstoque', 'segAprovacoes', 'segFichas', 'segReservas', 'notificacoes', 'perfil'],
  [ROLES.ALMOXARIFE]: ['almDashboard', 'almEntradaNf', 'almConferencia', 'almEstoque', 'almReservas', 'almInventario', 'notificacoes', 'perfil'],
  [ROLES.GESTOR]: ['gestDashboard', 'gestEstoque', 'gestAprovacoes', 'gestRelatorios', 'notificacoes', 'perfil'],
};

// Ações sensíveis por papel (usado para habilitar/desabilitar botões)
export const ACTIONS_BY_ROLE = {
  [ROLES.COLABORADOR]: ['solicitarEpi', 'verPropriasFichas', 'verPropriasReservas'],
  [ROLES.SEGURANCA]: ['aprovarSolicitacao', 'reprovarSolicitacao', 'liberarForaDoPerfil', 'verTodasFichas', 'verEstoque'],
  [ROLES.ALMOXARIFE]: ['conferirCodigoBarras', 'registrarEntradaNf', 'ajustarEstoque', 'iniciarInventario', 'gerenciarReservas'],
  [ROLES.GESTOR]: ['verIndicadores', 'verValorEstoque', 'gerarRelatorios'],
};

export function podeAcessarView(role, view) {
  return (VIEWS_BY_ROLE[role] || []).includes(view);
}
export function podeExecutar(role, action) {
  return (ACTIONS_BY_ROLE[role] || []).includes(action);
}
export function homeViewFor(role) {
  const map = { [ROLES.COLABORADOR]: 'inicio', [ROLES.SEGURANCA]: 'segDashboard', [ROLES.ALMOXARIFE]: 'almDashboard', [ROLES.GESTOR]: 'gestDashboard' };
  return map[role] || 'inicio';
}
