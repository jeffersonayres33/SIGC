import { AuthUser } from '../types';
import { MainSection } from '../components/Sidebar';
import { UserRole } from '../types';
import { storageService } from '../services/storageService';

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
 * Verifica se um recurso específico do Portal do Inscrito PF está liberado pelo conselho.
 */
export function isRecursoPFLiberado(
  recursoKey: 'dadosCadastrais' | 'vinculosProfissionais' | 'certidaoQuitacao' | 'anuidadeFinanceiro' | 'protocolosProcessos' | 'requerimentoEletronico'
): boolean {
  const config = storageService.getCouncilConfig();
  const regra = config.acessosInscritoPF || storageService.getAcessosInscritoPF();
  if (!regra.permiteAcessoAoPortal) return false;
  
  if (regra.recursosPortal && regra.recursosPortal[recursoKey] !== undefined) {
    return Boolean(regra.recursosPortal[recursoKey]?.liberado);
  }

  // Fallback baseado em modulosPermitidos
  const mods = (regra.modulosPermitidos || []).map(m => m.toLowerCase().trim());
  if (recursoKey === 'dadosCadastrais') return mods.includes('dados_cadastrais') || mods.includes('portal_inscrito');
  if (recursoKey === 'vinculosProfissionais') return true;
  if (recursoKey === 'certidaoQuitacao') return Boolean(regra.recursosPermitidos?.emissaoCertidaoQuitacao ?? true);
  if (recursoKey === 'anuidadeFinanceiro') return mods.includes('anuidade') || mods.includes('financeiro');
  if (recursoKey === 'protocolosProcessos') return mods.includes('protocolo') || mods.includes('protocolos');
  if (recursoKey === 'requerimentoEletronico') return mods.includes('requerimento') || mods.includes('requerimentos');
  return true;
}

/**
 * Verifica se um recurso específico do Portal do Inscrito PJ está liberado pelo conselho.
 */
export function isRecursoPJLiberado(
  recursoKey: 'dadosEstabelecimento' | 'certidaoCrtDigital' | 'anuidadeFinanceiro' | 'protocolosProcessos' | 'requerimentoEletronico'
): boolean {
  const config = storageService.getCouncilConfig();
  const regra = config.acessosInscritoPJ || storageService.getAcessosInscritoPJ();
  if (!regra.permiteAcessoAoPortal) return false;

  if (regra.recursosPortal && regra.recursosPortal[recursoKey] !== undefined) {
    return Boolean(regra.recursosPortal[recursoKey]?.liberado);
  }

  // Fallback baseado em modulosPermitidos
  const mods = (regra.modulosPermitidos || []).map(m => m.toLowerCase().trim());
  if (recursoKey === 'dadosEstabelecimento') return mods.includes('dados_cadastrais') || mods.includes('portal_inscrito');
  if (recursoKey === 'certidaoCrtDigital') return Boolean(regra.recursosPermitidos?.emissaoCrt ?? true);
  if (recursoKey === 'anuidadeFinanceiro') return mods.includes('anuidade') || mods.includes('financeiro');
  if (recursoKey === 'protocolosProcessos') return mods.includes('protocolo') || mods.includes('protocolos');
  if (recursoKey === 'requerimentoEletronico') return mods.includes('requerimento') || mods.includes('requerimentos');
  return true;
}

/**
 * Verifica se o usuário autenticado possui permissão concedida para acessar a seção ou módulo especificado.
 * ISOLAMENTO ESTRITO: Inscritos (PF ou PJ) só podem acessar os recursos do seu respectivo portal.
 */
export function hasModulePermission(
  user: AuthUser | null | undefined, 
  sectionOrModule: string,
  simulatedRole?: UserRole | string
): boolean {
  if (!user) return false;

  const activeRole = simulatedRole || user.role;
  const rawSection = String(sectionOrModule || '').toLowerCase().trim();
  const targetModule = normalizeSectionToModule(rawSection);

  // O Site Oficial / Portal Público é livre para todos os perfis e público em geral
  if (targetModule === 'site_publico') {
    return true;
  }

  // Se o Master Developer NÃO estiver simulando um papel restrito e não for perfil de inscrito, tem acesso total
  if (isMasterDeveloper(user) && !simulatedRole && user.tipo !== 'PROFISSIONAL' && user.tipo !== 'EMPRESA') {
    return true;
  }

  // Papéis simulados ou atribuídos para usuários internos
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

  // ============================================================================
  // REGRA DE ISOLAMENTO ESTRITO: USUÁRIOS DO PORTAL DO PROFISSIONAL (PF)
  // O profissional NÃO acessa nenhuma área interna do conselho!
  // ============================================================================
  const isProfissional = activeRole === 'PORTAL_PROFISSIONAL' || user.tipo === 'PROFISSIONAL';
  if (isProfissional) {
    const config = storageService.getCouncilConfig();
    const regraPF = config.acessosInscritoPF || storageService.getAcessosInscritoPF();
    if (!regraPF.permiteAcessoAoPortal) {
      return false; // Acesso ao portal desabilitado pela administração
    }

    // Rotas gerais do portal PF
    if (rawSection === 'portal_inscrito' || rawSection === 'portal_inscrito_pf') {
      return true;
    }

    // Subitem: Dados Cadastrais
    if (rawSection === 'portal_profissional_perfil' || targetModule === 'dados_cadastrais') {
      return isRecursoPFLiberado('dadosCadastrais');
    }

    // Subitem: Anuidade
    if (rawSection === 'portal_profissional_anuidade' || targetModule === 'anuidade') {
      return isRecursoPFLiberado('anuidadeFinanceiro');
    }

    // Subitem: Protocolo
    if (rawSection === 'portal_profissional_protocolo' || targetModule === 'protocolo') {
      return isRecursoPFLiberado('protocolosProcessos');
    }

    // Subitem: Requerimento
    if (rawSection === 'portal_profissional_requerimento' || targetModule === 'requerimento') {
      return isRecursoPFLiberado('requerimentoEletronico');
    }

    // Bloqueia qualquer outro módulo interno (dashboard, fiscalizacao, empresas, funcionarios, etc.)
    return false;
  }

  // ============================================================================
  // REGRA DE ISOLAMENTO ESTRITO: USUÁRIOS DO PORTAL DA EMPRESA (PJ)
  // A empresa NÃO acessa nenhuma área interna do conselho!
  // ============================================================================
  const isEmpresa = activeRole === 'PORTAL_EMPRESA' || user.tipo === 'EMPRESA';
  if (isEmpresa) {
    const config = storageService.getCouncilConfig();
    const regraPJ = config.acessosInscritoPJ || storageService.getAcessosInscritoPJ();
    if (!regraPJ.permiteAcessoAoPortal) {
      return false; // Acesso ao portal desabilitado pela administração
    }

    // Rotas gerais do portal PJ
    if (rawSection === 'portal_inscrito' || rawSection === 'portal_inscrito_pj') {
      return true;
    }

    // Subitem: Dados do Estabelecimento
    if (rawSection === 'portal_empresa_perfil' || targetModule === 'dados_cadastrais') {
      return isRecursoPJLiberado('dadosEstabelecimento');
    }

    // Subitem: Anuidade
    if (rawSection === 'portal_empresa_anuidade' || targetModule === 'anuidade') {
      return isRecursoPJLiberado('anuidadeFinanceiro');
    }

    // Subitem: Protocolo
    if (rawSection === 'portal_empresa_protocolo' || targetModule === 'protocolo') {
      return isRecursoPJLiberado('protocolosProcessos');
    }

    // Subitem: Requerimento
    if (rawSection === 'portal_empresa_requerimento' || targetModule === 'requerimento') {
      return isRecursoPJLiberado('requerimentoEletronico');
    }

    // Bloqueia qualquer outro módulo interno
    return false;
  }

  // ============================================================================
  // USUÁRIOS ADMINISTRATIVOS E COLABORADORES INTERNOS DO CONSELHO
  // ============================================================================
  if (user.role === 'ADMIN' && user.tipo === 'ADMIN') {
    return true;
  }

  const userPerms = (user.permissoes || []).map(p => String(p).toLowerCase().trim());
  if (userPerms.length === 0) {
    return targetModule === 'dashboard';
  }

  if (userPerms.includes(targetModule) || userPerms.includes(rawSection)) {
    return true;
  }

  // Permissões do Portal do Inscrito para Funcionários e Colaboradores
  const hasPortalGeral = userPerms.includes('portal_inscrito');
  const hasPortalPF = userPerms.includes('portal_inscrito_pf') || userPerms.includes('profissionais');
  const hasPortalPJ = userPerms.includes('portal_inscrito_pj') || userPerms.includes('empresas');

  if (hasPortalGeral) {
    if (rawSection.startsWith('portal_') || targetModule === 'portal_inscrito') {
      return true;
    }
  }

  if (hasPortalPF) {
    if (
      rawSection === 'portal_inscrito' ||
      rawSection === 'portal_inscrito_pf' ||
      rawSection.startsWith('portal_profissional_') ||
      targetModule === 'portal_inscrito_pf'
    ) {
      return true;
    }
  }

  if (hasPortalPJ) {
    if (
      rawSection === 'portal_inscrito' ||
      rawSection === 'portal_inscrito_pj' ||
      rawSection.startsWith('portal_empresa_') ||
      targetModule === 'portal_inscrito_pj'
    ) {
      return true;
    }
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

  // Master Developer sem simulação tem acesso total
  if (isMasterDeveloper(user) && !simulatedRole) {
    return MODULOS_SISTEMA.map(m => m.id);
  }

  if (user.tipo === 'PROFISSIONAL' || activeRole === 'PORTAL_PROFISSIONAL') {
    return ['portal_inscrito'];
  }

  if (user.tipo === 'EMPRESA' || activeRole === 'PORTAL_EMPRESA') {
    return ['portal_inscrito'];
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
  const activeRole = simulatedRole || user.role;

  // Se for Profissional, inicia direto na visão de perfil do Profissional
  if (user.tipo === 'PROFISSIONAL' || activeRole === 'PORTAL_PROFISSIONAL') {
    if (isRecursoPFLiberado('dadosCadastrais')) return 'portal_profissional_perfil';
    if (isRecursoPFLiberado('anuidadeFinanceiro')) return 'portal_profissional_anuidade';
    if (isRecursoPFLiberado('protocolosProcessos')) return 'portal_profissional_protocolo';
    if (isRecursoPFLiberado('requerimentoEletronico')) return 'portal_profissional_requerimento';
    return 'portal_inscrito';
  }

  // Se for Empresa, inicia direto no perfil da Empresa
  if (user.tipo === 'EMPRESA' || activeRole === 'PORTAL_EMPRESA') {
    if (isRecursoPJLiberado('dadosEstabelecimento')) return 'portal_empresa_perfil';
    if (isRecursoPJLiberado('anuidadeFinanceiro')) return 'portal_empresa_anuidade';
    if (isRecursoPJLiberado('protocolosProcessos')) return 'portal_empresa_protocolo';
    if (isRecursoPJLiberado('requerimentoEletronico')) return 'portal_empresa_requerimento';
    return 'portal_inscrito';
  }

  // Para colaboradores e administradores
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
    case 'portal_profissional_perfil': return 'Profissional • Dados Cadastrais & Perfil';
    case 'portal_profissional_anuidade': return 'Profissional • Anuidade & Posição Financeira';
    case 'portal_profissional_protocolo': return 'Profissional • Protocolos & Processos';
    case 'portal_profissional_requerimento': return 'Profissional • Requerimento Eletrônico';
    case 'portal_empresa_perfil': return 'Empresa • Dados do Estabelecimento & CRT';
    case 'portal_empresa_anuidade': return 'Empresa • Anuidade & Financeiro';
    case 'portal_empresa_protocolo': return 'Empresa • Protocolos & Processos';
    case 'portal_empresa_requerimento': return 'Empresa • Requerimento Eletrônico';
    case 'backup_restore': return 'Backup & Restauração de Dados';
    case 'admin': return 'Parâmetros Administrativos';
    default: return sectionOrModule.replace(/_/g, ' ').toUpperCase();
  }
}

/**
 * Verifica se o usuário autenticado possui permissão para uma ação específica
 * ('visualizar' | 'editar' | 'deletar') dentro de um módulo determinado.
 */
export function hasActionPermission(
  user: AuthUser | null | undefined,
  module: string,
  action: 'visualizar' | 'editar' | 'deletar'
): boolean {
  if (!user) return false;

  // Master Developer tem permissão irrestrita total
  if (isMasterDeveloper(user)) return true;

  // Primeiro checa se tem acesso ao módulo
  if (!hasModulePermission(user, module)) return false;

  // Se o usuário for Inscrito PF
  if (user.tipo === 'PROFISSIONAL' || user.role === 'PORTAL_PROFISSIONAL') {
    const config = storageService.getCouncilConfig();
    const regraPF = config.acessosInscritoPF || storageService.getAcessosInscritoPF();
    if (module === 'dados_cadastrais' || module === 'portal_profissional_perfil') {
      if (action === 'visualizar') return isRecursoPFLiberado('dadosCadastrais');
      if (action === 'editar') return Boolean(regraPF.recursosPortal?.dadosCadastrais?.permiteEditar ?? true);
      return false; // inscritos nunca deletam
    }
    if (module === 'anuidade' || module === 'portal_profissional_anuidade') {
      if (action === 'visualizar') return isRecursoPFLiberado('anuidadeFinanceiro');
      if (action === 'editar') return Boolean(regraPF.recursosPortal?.anuidadeFinanceiro?.permiteEmitir ?? true);
      return false;
    }
    if (module === 'requerimento' || module === 'portal_profissional_requerimento') {
      if (action === 'visualizar') return isRecursoPFLiberado('requerimentoEletronico');
      if (action === 'editar') return Boolean(regraPF.recursosPortal?.requerimentoEletronico?.permiteEditar ?? true);
      return false;
    }
    if (action === 'visualizar') return true;
    return false;
  }

  // Se o usuário for Inscrito PJ
  if (user.tipo === 'EMPRESA' || user.role === 'PORTAL_EMPRESA') {
    const config = storageService.getCouncilConfig();
    const regraPJ = config.acessosInscritoPJ || storageService.getAcessosInscritoPJ();
    if (module === 'anuidade' || module === 'portal_empresa_anuidade') {
      if (action === 'visualizar') return isRecursoPJLiberado('anuidadeFinanceiro');
      if (action === 'editar') return Boolean(regraPJ.recursosPortal?.anuidadeFinanceiro?.permiteEmitir ?? true);
      return false;
    }
    if (module === 'requerimento' || module === 'portal_empresa_requerimento') {
      if (action === 'visualizar') return isRecursoPJLiberado('requerimentoEletronico');
      if (action === 'editar') return Boolean(regraPJ.recursosPortal?.requerimentoEletronico?.permiteEditar ?? true);
      return false;
    }
    if (action === 'visualizar') return true;
    return false;
  }

  // Regra padrão para colaboradores
  if (action === 'visualizar') return true;
  if (action === 'editar') return true;
  if (action === 'deletar') {
    return user.role === 'ADMIN' || user.role === 'DEVELOPER';
  }

  return false;
}
