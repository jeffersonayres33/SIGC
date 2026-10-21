import { AuthUser, MainSection } from '../types';

export interface ModuloInfo {
  id: string;
  nome: string;
  descricao: string;
  icone?: string;
}

export const MODULOS_SISTEMA: ModuloInfo[] = [
  { id: 'dashboard', nome: 'Painel Executivo / Dashboard', descricao: 'Indicadores gerais, gráficos e resumos' },
  { id: 'profissionais', nome: '1. Profissionais (PF)', descricao: 'Cadastro, carteira e dados de farmacêuticos' },
  { id: 'empresas', nome: '2. Empresas (PJ)', descricao: 'Estabelecimentos, farmácias, RTs e CRT' },
  { id: 'protocolos', nome: '3. Protocolos & Requerimentos', descricao: 'Processos e despachos administrativos' },
  { id: 'cadastros_basicos', nome: '4. Cadastros Básicos', descricao: 'Tipos, habilitações, cargos e setores' },
  { id: 'financeiro', nome: '5. Financeiro & Arrecadação', descricao: 'Boletos bancários, Pix, anuidades e conciliação' },
  { id: 'cobranca_juridico', nome: '6. Jurídico & Dívida Ativa', descricao: 'CDA, execuções judiciais e protestos' },
  { id: 'fiscalizacao', nome: '7. Fiscalização em Campo', descricao: 'Autos de infração/notificação, GPS e offline' },
  { id: 'relatorios', nome: '8. Relatórios & BI Diretoria', descricao: 'Relatórios gerenciais e inteligência de dados' },
  { id: 'formularios', nome: '9. Formulários Dinâmicos', descricao: 'Formulários dinâmicos de requerimentos' },
  { id: 'portal_inscrito', nome: '10. Portal do Inscrito (PF/PJ)', descricao: 'Autoatendimento de profissionais e empresas' },
  { id: 'configuracoes', nome: 'Painel do Administrador', descricao: 'Configurações gerais, parâmetros e sistema' },
  { id: 'funcionarios', nome: 'Cadastro de Funcionários', descricao: 'Gestão de colaboradores, acessos e cargos' },
  { id: 'microsservicos', nome: 'Microsserviços & Cloud', descricao: 'Status dos serviços distribuídos e gateway' }
];

export const MASTER_DEVELOPER_CPF = '93413530259';

/**
 * Verifica se o usuário autenticado é o Desenvolvedor Master do sistema.
 * O Desenvolvedor Master possui autoridade máxima e acesso irrestrito a todas as áreas.
 */
export function isMasterDeveloper(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  const cleanDoc = (user.documentoLimpo || user.documento || '').replace(/\D/g, '');
  return (
    cleanDoc === MASTER_DEVELOPER_CPF ||
    user.role === 'DEVELOPER' ||
    user.id === '00000000-0000-4000-a000-000000000001'
  );
}

/**
 * Verifica se o usuário autenticado é um inscrito externo (Portal PF / PJ).
 */
export function isPortalUser(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return (
    user.role === 'PORTAL_PROFISSIONAL' ||
    user.role === 'PORTAL_EMPRESA' ||
    user.tipo === 'PROFISSIONAL' ||
    user.tipo === 'EMPRESA'
  );
}

/**
 * Normaliza o identificador de seção para o módulo de permissão correspondente.
 */
export function normalizeSectionToModule(section: string): string {
  const s = String(section || '').toLowerCase().trim();
  if (s === 'backup_restore') return 'configuracoes';
  if (s === 'admin') return 'cadastros_basicos';
  return s;
}

/**
 * Verifica se o usuário autenticado possui permissão concedida para acessar a seção ou módulo especificado.
 */
export function hasModulePermission(
  user: AuthUser | null | undefined, 
  sectionOrModule: string
): boolean {
  if (!user) return false;

  // 1. Desenvolvedor Master possui acesso total irrestrito
  if (isMasterDeveloper(user)) {
    return true;
  }

  // 2. Usuários externos do Portal têm acesso estritamente ao portal_inscrito
  if (isPortalUser(user)) {
    return sectionOrModule === 'portal_inscrito';
  }

  // Se um colaborador tentar acessar o portal do inscrito diretamente sem ser portal,
  // permitimos apenas se explicitamente concedido em permissoes
  const targetModule = normalizeSectionToModule(sectionOrModule);

  // Lista de permissões concedidas pelo Administrador (normalizada)
  const userPerms = (user.permissoes || []).map(p => String(p).toLowerCase().trim());

  // Se o usuário tem uma lista vazia ou não configurada:
  // Se for admin geral sem lista definida ainda, permite tudo exceto se for colaborador restrito
  if (userPerms.length === 0) {
    if (user.role === 'ADMIN' && user.tipo === 'ADMIN') {
      return true;
    }
    // Para funcionários sem permissões explícitas, apenas dashboard é concedido por padrão
    return targetModule === 'dashboard';
  }

  // Verifica se o módulo requerido está expressamente autorizado
  if (userPerms.includes(targetModule)) {
    return true;
  }

  // Verificação direta pelo nome original da seção
  const rawSection = String(sectionOrModule).toLowerCase().trim();
  if (userPerms.includes(rawSection)) {
    return true;
  }

  // Permissões compostas:
  // Se requer "funcionarios", verificar se tem "funcionarios" ou se tem "configuracoes"
  if (targetModule === 'funcionarios') {
    return userPerms.includes('funcionarios') || userPerms.includes('configuracoes');
  }

  // Se requer "configuracoes", checa se tem "configuracoes"
  if (targetModule === 'configuracoes') {
    return userPerms.includes('configuracoes');
  }

  return false;
}

/**
 * Retorna todos os módulos que o usuário tem autorização para acessar.
 */
export function getAllowedModules(user: AuthUser | null | undefined): string[] {
  if (!user) return [];
  if (isMasterDeveloper(user)) {
    return MODULOS_SISTEMA.map(m => m.id);
  }
  if (isPortalUser(user)) {
    return ['portal_inscrito'];
  }
  return MODULOS_SISTEMA
    .map(m => m.id)
    .filter(id => hasModulePermission(user, id));
}

/**
 * Obtém o módulo inicial padrão ou primeiro módulo liberado para o usuário.
 */
export function getDefaultAllowedSection(user: AuthUser | null | undefined): MainSection {
  if (!user) return 'dashboard';
  if (isPortalUser(user)) return 'portal_inscrito';
  if (hasModulePermission(user, 'dashboard')) return 'dashboard';

  const allowed = getAllowedModules(user);
  if (allowed.length > 0) {
    return allowed[0] as MainSection;
  }
  return 'dashboard';
}

/**
 * Retorna o título legível de um módulo para exibição em mensagens de alerta/bloqueio.
 */
export function getModuleName(sectionOrModule: string): string {
  const norm = normalizeSectionToModule(sectionOrModule);
  const found = MODULOS_SISTEMA.find(m => m.id === norm || m.id === sectionOrModule);
  if (found) return found.nome;

  switch (sectionOrModule) {
    case 'backup_restore': return 'Backup & Restauração de Dados';
    case 'admin': return 'Parâmetros Administrativos';
    default: return sectionOrModule.replace(/_/g, ' ').toUpperCase();
  }
}
