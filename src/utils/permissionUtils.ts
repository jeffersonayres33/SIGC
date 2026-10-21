import { AuthUser } from '../types';
import { MainSection } from '../components/Sidebar';
import { UserRole } from '../types';

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
  { id: 'microsservicos', nome: 'Microsservicos & Cloud', descricao: 'Status dos serviços distribuídos e gateway' }
];

export const MASTER_DEVELOPER_CPF = '93413530259';

/**
 * Verifica se o usuário autenticado é o Desenvolvedor Master do sistema.
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
 * Suporta opcionalmente um perfil simulado (para testes do desenvolvedor/administrador).
 */
export function hasModulePermission(
  user: AuthUser | null | undefined, 
  sectionOrModule: string,
  simulatedRole?: UserRole | string
): boolean {
  if (!user) return false;

  const activeRole = simulatedRole || user.role;
  const targetModule = normalizeSectionToModule(sectionOrModule);

  // Se o Master Developer estiver simulando um papel restrito, aplica as restrições daquele papel
  if (isMasterDeveloper(user)) {
    if (activeRole === 'FISCAL') {
      return ['dashboard', 'fiscalizacao', 'empresas', 'profissionais', 'formularios'].includes(targetModule);
    }
    if (activeRole === 'FINANCEIRO') {
      return ['dashboard', 'financeiro', 'profissionais', 'empresas', 'protocolos', 'relatorios'].includes(targetModule);
    }
    if (activeRole === 'JURIDICO') {
      return ['dashboard', 'cobranca_juridico', 'protocolos', 'profissionais', 'empresas', 'relatorios'].includes(targetModule);
    }
    if (activeRole === 'DIRETORIA') {
      return ['dashboard', 'relatorios', 'protocolos', 'profissionais', 'empresas', 'financeiro', 'fiscalizacao', 'cobranca_juridico'].includes(targetModule);
    }
    if (activeRole === 'PORTAL_PROFISSIONAL' || activeRole === 'PORTAL_EMPRESA') {
      return targetModule === 'portal_inscrito';
    }
    // Caso contrário, acesso total irrestrito para Desenvolvedor Master
    return true;
  }

  // Papéis simulados ou atribuídos para usuários normais
  if (activeRole === 'FISCAL') {
    return ['dashboard', 'fiscalizacao', 'empresas', 'profissionais', 'formularios'].includes(targetModule);
  }
  if (activeRole === 'FINANCEIRO') {
    return ['dashboard', 'financeiro', 'profissionais', 'empresas', 'protocolos', 'relatorios'].includes(targetModule);
  }
  if (activeRole === 'JURIDICO') {
    return ['dashboard', 'cobranca_juridico', 'protocolos', 'profissionais', 'empresas', 'relatorios'].includes(targetModule);
  }
  if (activeRole === 'DIRETORIA') {
    return ['dashboard', 'relatorios', 'protocolos', 'profissionais', 'empresas', 'financeiro', 'fiscalizacao', 'cobranca_juridico'].includes(targetModule);
  }

  // Usuários externos do Portal
  if (isPortalUser(user) || activeRole === 'PORTAL_PROFISSIONAL' || activeRole === 'PORTAL_EMPRESA') {
    return targetModule === 'portal_inscrito';
  }

  // Lista de permissões concedidas pelo Administrador
  const userPerms = (user.permissoes || []).map(p => String(p).toLowerCase().trim());

  if (userPerms.length === 0) {
    if (user.role === 'ADMIN' && user.tipo === 'ADMIN') {
      return true;
    }
    return targetModule === 'dashboard';
  }

  if (userPerms.includes(targetModule)) {
    return true;
  }

  const rawSection = String(sectionOrModule).toLowerCase().trim();
  if (userPerms.includes(rawSection)) {
    return true;
  }

  if (targetModule === 'funcionarios') {
    return userPerms.includes('funcionarios') || userPerms.includes('configuracoes');
  }

  if (targetModule === 'configuracoes') {
    return userPerms.includes('configuracoes');
  }

  return false;
}

/**
 * Retorna todos os módulos que o usuário tem autorização para acessar (considerando simulação de papel).
 */
export function getAllowedModules(user: AuthUser | null | undefined, simulatedRole?: UserRole | string): string[] {
  if (!user) return [];
  const activeRole = simulatedRole || user.role;

  if (isMasterDeveloper(user) && activeRole !== 'FISCAL' && activeRole !== 'FINANCEIRO' && activeRole !== 'JURIDICO' && activeRole !== 'DIRETORIA' && activeRole !== 'PORTAL_PROFISSIONAL' && activeRole !== 'PORTAL_EMPRESA') {
    return MODULOS_SISTEMA.map(m => m.id);
  }

  return MODULOS_SISTEMA
    .map(m => m.id)
    .filter(id => hasModulePermission(user, id, simulatedRole));
}

/**
 * Obtém o módulo inicial padrão ou primeiro módulo liberado para o usuário.
 */
export function getDefaultAllowedSection(user: AuthUser | null | undefined, simulatedRole?: UserRole | string): MainSection {
  if (!user) return 'dashboard';
  if (hasModulePermission(user, 'dashboard', simulatedRole)) return 'dashboard';

  const allowed = getAllowedModules(user, simulatedRole);
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
