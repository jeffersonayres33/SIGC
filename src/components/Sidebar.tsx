import React, { useState } from 'react';
import { 
  Users, 
  Building2, 
  Coins, 
  Scale, 
  Compass, 
  FileText, 
  BarChart3, 
  FormInput, 
  Network, 
  ChevronRight, 
  ChevronDown, 
  Home, 
  User, 
  Gavel,
  Settings,
  X,
  Building,
  ShieldCheck,
  UserCheck,
  FolderTree,
  Database,
  ShieldAlert,
  Briefcase,
  Tablet,
  Sliders,
  Send,
  Globe,
  Code2
} from 'lucide-react';
import { UserRole, AuthUser } from '../types';
import { CouncilConfig, storageService } from '../services/storageService';
import { toastService } from '../services/toastService';
import { hasModulePermission, isMasterDeveloper } from '../utils/permissionUtils';
import { SIGCON_LOGO } from '../constants/assets';

export type MainSection = 
  | 'dashboard'
  | 'profissionais'
  | 'empresas'
  | 'cadastros_basicos'
  | 'financeiro'
  | 'cobranca_juridico'
  | 'fiscalizacao'
  | 'protocolos'
  | 'relatorios'
  | 'formularios'
  | 'site_publico'
  | 'portal_inscrito'
  | 'portal_inscrito_pf'
  | 'portal_inscrito_pj'
  | 'portal_profissional_perfil'
  | 'portal_profissional_anuidade'
  | 'portal_profissional_protocolo'
  | 'portal_profissional_requerimento'
  | 'portal_profissional_formularios'
  | 'portal_empresa_perfil'
  | 'portal_empresa_anuidade'
  | 'portal_empresa_protocolo'
  | 'portal_empresa_requerimento'
  | 'portal_empresa_formularios'
  | 'configuracoes'
  | 'painel_admin'
  | 'backup_restore'
  | 'funcionarios'
  | 'admin'
  | 'microsservicos'
  | 'dev_configuracao';

const SIDEBAR_ROLES: { role: UserRole; label: string; icon: any; color: string }[] = [
  { role: 'DEVELOPER', label: '👑 Desenvolvedor Master', icon: ShieldCheck, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { role: 'ADMIN', label: '🛡️ Administrador Geral', icon: ShieldAlert, color: 'text-red-700 bg-red-50 border-red-200' },
  { role: 'FISCAL', label: '🧭 Fiscal de Campo (GPS)', icon: Compass, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { role: 'FINANCEIRO', label: '🪙 Setor Financeiro', icon: Coins, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { role: 'JURIDICO', label: '⚖️ Jurídico & Dívida Ativa', icon: Scale, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { role: 'DIRETORIA', label: '📊 Diretoria / Relatórios BI', icon: BarChart3, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { role: 'PORTAL_PROFISSIONAL', label: '👤 Portal do Profissional (PF)', icon: User, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
  { role: 'PORTAL_EMPRESA', label: '🏢 Portal da Empresa (PJ)', icon: Building2, color: 'text-teal-700 bg-teal-50 border-teal-200' },
];

interface SidebarProps {
  activeSection: MainSection;
  activeSubTab?: string;
  onSelectSection: (section: MainSection, subTab?: string) => void;
  currentRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
  onSwitchProfile?: (targetTipo: 'FUNCIONARIO' | 'PROFISSIONAL') => void;
  isOpen: boolean;
  onClose: () => void;
  councilConfig: CouncilConfig;
  onOpenSupabaseModal?: () => void;
  authUser?: AuthUser | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  activeSubTab,
  onSelectSection,
  currentRole,
  onRoleChange,
  onSwitchProfile,
  isOpen,
  onClose,
  councilConfig,
  onOpenSupabaseModal,
  authUser
}) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    cadastros: true,
    financeiro: true,
    fiscalizacao: true,
    juridico: true,
    relatorios: true,
    configuracoes: true,
    configuracaoMenu: true,
    inscritoMenu: true,
    portalInscrito: true,
    portalProfissional: true,
    portalEmpresa: true,
    devTopic: true
  });

  const isProfissionalAccess = currentRole === 'PORTAL_PROFISSIONAL' || authUser?.tipo === 'PROFISSIONAL';
  const isEmpresaAccess = currentRole === 'PORTAL_EMPRESA' || authUser?.tipo === 'EMPRESA';
  const isInternalAdmin = !isProfissionalAccess && !isEmpresaAccess;

  const checkPerm = (sec: string) => hasModulePermission(authUser, sec, currentRole);

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelect = (section: MainSection, subTab?: string) => {
    onSelectSection(section, subTab);
    onClose();
  };

  const supabaseInfo = storageService.getSupabaseStatus();

  return (
    <>
      {/* Backdrop overlay when sidebar is open */}
      <div 
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sliding Sidebar Drawer */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-white border-r border-slate-200 text-slate-700 flex flex-col shadow-2xl transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <img 
              src={SIGCON_LOGO} 
              alt="SIGCON Icon" 
              className="h-8 w-8 object-contain rounded-xl p-0.5 bg-white border border-slate-200 shadow-2xs"
            />
            <div>
              <div className="font-bold text-xs text-slate-900 leading-tight flex items-center space-x-1.5">
                <span>SIGCON</span>
                <span className="text-[10px] font-mono px-1 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  {councilConfig.sigla}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate max-w-[150px]" title={councilConfig.nomeCompleto}>
                {councilConfig.sigla} - {councilConfig.nomeCompleto}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>



        {/* Executive Dashboard Shortcut */}
        {checkPerm( 'dashboard') && (
          <div className="p-3 border-b border-slate-100">
            <button
              onClick={() => handleSelect('dashboard')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeSection === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Home className={`w-4 h-4 ${activeSection === 'dashboard' ? 'text-white' : 'text-blue-600'}`} />
              <span>Painel Executivo / Dashboard</span>
            </button>
          </div>
        )}

        {/* Scrollable Navigation List */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto text-xs">
          {/* Profissionais (PF) */}
          {checkPerm( 'profissionais') && (
            <button
              onClick={() => handleSelect('profissionais')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSection === 'profissionais'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span>Profissionais (PF)</span>
            </button>
          )}

          {/* Empresas (PJ) */}
          {checkPerm( 'empresas') && (
            <button
              onClick={() => handleSelect('empresas')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSection === 'empresas'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Building className="w-4 h-4 text-cyan-600" />
              <span>Empresas (PJ)</span>
            </button>
          )}

          {/* Protocolos */}
          {checkPerm( 'protocolos') && (
            <button
              onClick={() => handleSelect('protocolos')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSection === 'protocolos'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Protocolos & Requerimentos</span>
            </button>
          )}

          {/* Cadastros Básicos */}
          {checkPerm( 'cadastros_basicos') && (
            <div>
              <div className="flex items-center justify-between rounded-xl">
                <button
                  onClick={() => handleSelect('cadastros_basicos', 'PROFISSIONAIS')}
                  className={`flex-1 flex items-center space-x-2.5 px-3 py-2 rounded-l-xl text-xs font-semibold transition-colors cursor-pointer ${
                    activeSection === 'cadastros_basicos'
                      ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FolderTree className="w-4 h-4 text-blue-600" />
                  <span>Cadastros Básicos</span>
                </button>
                <button
                  onClick={() => toggleGroup('cadastros')}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-r-xl transition-colors cursor-pointer"
                  title="Expandir/Recolher subcategorias de Cadastros Básicos"
                >
                  {openGroups.cadastros ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>

              {openGroups.cadastros && (
                <div className="ml-3 pl-2.5 border-l-2 border-slate-100 space-y-1 mt-1">
                  <button
                    onClick={() => handleSelect('cadastros_basicos', 'PROFISSIONAIS')}
                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeSection === 'cadastros_basicos' && activeSubTab === 'PROFISSIONAIS'
                        ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Profissionais</span>
                  </button>

                  <button
                    onClick={() => handleSelect('cadastros_basicos', 'EMPRESAS')}
                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeSection === 'cadastros_basicos' && activeSubTab === 'EMPRESAS'
                        ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Empresas</span>
                  </button>

                  <button
                    onClick={() => handleSelect('cadastros_basicos', 'PROTOCOLOS')}
                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeSection === 'cadastros_basicos' && activeSubTab === 'PROTOCOLOS'
                        ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Protocolo e Processo</span>
                  </button>

                  <button
                    onClick={() => handleSelect('cadastros_basicos', 'FUNCIONARIOS')}
                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeSection === 'cadastros_basicos' && activeSubTab === 'FUNCIONARIOS'
                        ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                    <span>Cargos, Setores e Acessos</span>
                  </button>

                  <button
                    onClick={() => handleSelect('cadastros_basicos', 'FORMULARIOS')}
                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeSection === 'cadastros_basicos' && activeSubTab === 'FORMULARIOS'
                        ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <FormInput className="w-3.5 h-3.5 text-blue-600" />
                    <span>Formulários Dinâmicos</span>
                  </button>

                  <button
                    onClick={() => handleSelect('cadastros_basicos', 'ADMIN')}
                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeSection === 'cadastros_basicos' && activeSubTab === 'ADMIN'
                        ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Governança & Segurança</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Financeiro & Arrecadação */}
          {checkPerm( 'financeiro') && (
            <div>
              <button
                onClick={() => toggleGroup('financeiro')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors font-bold text-[11px] uppercase tracking-wider cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                  <span>Financeiro & Arrecadação</span>
                </div>
                {openGroups.financeiro ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {openGroups.financeiro && (
                <div className="ml-3 pl-2.5 border-l-2 border-slate-100 space-y-1 mt-1">
                  <button
                    onClick={() => handleSelect('financeiro')}
                    className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeSection === 'financeiro'
                        ? 'bg-amber-50 text-amber-800 font-bold border-l-2 border-amber-500'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-600" />
                    <span>Anuidades, Boletos & Pix</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Jurídico & Dívida Ativa */}
          {checkPerm( 'cobranca_juridico') && (
            <div>
              <button
                onClick={() => toggleGroup('juridico')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors font-bold text-[11px] uppercase tracking-wider cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Scale className="w-3.5 h-3.5 text-purple-600" />
                  <span>Jurídico & Dívida Ativa</span>
                </div>
                {openGroups.juridico ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {openGroups.juridico && (
                <div className="ml-3 pl-2.5 border-l-2 border-slate-100 space-y-1 mt-1">
                  <button
                    onClick={() => handleSelect('cobranca_juridico')}
                    className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeSection === 'cobranca_juridico'
                        ? 'bg-purple-50 text-purple-800 font-bold border-l-2 border-purple-500'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Gavel className="w-3.5 h-3.5 text-purple-600" />
                    <span>CDA, Execução & Protestos</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Fiscalização */}
          {checkPerm( 'fiscalizacao') && (
            <div>
              <button
                onClick={() => toggleGroup('fiscalizacao')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors font-bold text-[11px] uppercase tracking-wider cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Compass className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fiscalização</span>
                </div>
                {openGroups.fiscalizacao ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {openGroups.fiscalizacao && (
                <div className="ml-3 pl-2.5 border-l-2 border-slate-100 space-y-1 mt-1">
                  <button
                    onClick={() => handleSelect('fiscalizacao', 'eletronica')}
                    className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeSection === 'fiscalizacao' && (activeSubTab === 'eletronica' || !activeSubTab)
                        ? 'bg-emerald-50 text-emerald-800 font-bold border-l-2 border-emerald-500'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Tablet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Fiscalização Eletrônica</span>
                  </button>

                  <button
                    onClick={() => handleSelect('fiscalizacao', 'termo_inspecao')}
                    className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeSection === 'fiscalizacao' && activeSubTab === 'termo_inspecao'
                        ? 'bg-emerald-50 text-emerald-800 font-bold border-l-2 border-emerald-500'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Termos de Inspeção/ Visita</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Relatórios Analíticos */}
          {checkPerm( 'relatorios') && (
            <button
              onClick={() => handleSelect('relatorios')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSection === 'relatorios'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-cyan-600" />
              <span>Relatórios & BI Diretoria</span>
            </button>
          )}

          {/* Formulários Dinâmicos */}
          {checkPerm( 'formularios') && (
            <button
              onClick={() => handleSelect('formularios')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSection === 'formularios'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FormInput className="w-4 h-4 text-pink-600" />
              <span>Formulários Dinâmicos</span>
            </button>
          )}

          {/* Site Oficial & Portal Público */}
          <button
            onClick={() => handleSelect('site_publico')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeSection === 'site_publico'
                ? 'bg-purple-50 text-purple-700 font-bold border-l-2 border-purple-600'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-4 h-4 text-purple-600" />
            <span className="flex items-center justify-between w-full">
              <span>Site Oficial / Portal Público</span>
              <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded uppercase">
                Livre
              </span>
            </span>
          </button>

          {/* Portal do Inscrito (Grupo Pai com SubMenus Profissional e Empresa) */}
          {(checkPerm('portal_inscrito') || checkPerm('portal_inscrito_pf') || checkPerm('portal_inscrito_pj') || checkPerm('profissionais') || checkPerm('empresas')) && (
            <div>
              <button
                onClick={() => toggleGroup('portalInscrito')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSection.startsWith('portal_')
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-cyan-500" />
                  <span>Portal do Inscrito</span>
                </div>
                {openGroups.portalInscrito ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openGroups.portalInscrito && (
                <div className="ml-2 pl-2 border-l-2 border-cyan-200/80 space-y-2 mt-1">
                  {/* SubMenu 1: Profissional (PF) */}
                  {(isProfissionalAccess || isInternalAdmin) && (
                    <div>
                      <button
                        onClick={() => toggleGroup('portalProfissional')}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          activeSection.startsWith('portal_profissional_') || activeSection === 'portal_inscrito_pf'
                            ? 'bg-cyan-50 text-cyan-900 font-bold border-l-2 border-cyan-500'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <User className="w-3.5 h-3.5 text-cyan-600" />
                          <span>Profissional</span>
                        </div>
                        {openGroups.portalProfissional ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                      </button>

                      {openGroups.portalProfissional && (
                        <div className="ml-3 pl-2 border-l border-cyan-200/80 space-y-1 mt-1">
                          <button
                            onClick={() => handleSelect('portal_profissional_perfil')}
                            className={`w-full flex items-center space-x-2 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              activeSection === 'portal_profissional_perfil' || activeSection === 'portal_inscrito_pf'
                                ? 'bg-cyan-600 text-white font-bold shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <User className="w-3 h-3" />
                            <span>Dados Cadastrais</span>
                          </button>

                          <button
                            onClick={() => handleSelect('portal_profissional_anuidade')}
                            className={`w-full flex items-center space-x-2 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              activeSection === 'portal_profissional_anuidade'
                                ? 'bg-cyan-600 text-white font-bold shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <Coins className="w-3 h-3" />
                            <span>Anuidade</span>
                          </button>

                          <button
                            onClick={() => handleSelect('portal_profissional_protocolo')}
                            className={`w-full flex items-center space-x-2 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              activeSection === 'portal_profissional_protocolo'
                                ? 'bg-cyan-600 text-white font-bold shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <FileText className="w-3 h-3" />
                            <span>Protocolo</span>
                          </button>

                          <button
                            onClick={() => handleSelect('portal_profissional_requerimento')}
                            className={`w-full flex items-center space-x-2 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              activeSection === 'portal_profissional_requerimento'
                                ? 'bg-cyan-600 text-white font-bold shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <Send className="w-3 h-3" />
                            <span>Requerimento</span>
                          </button>

                          <button
                            onClick={() => handleSelect('portal_profissional_formularios')}
                            className={`w-full flex items-center space-x-2 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              activeSection === 'portal_profissional_formularios'
                                ? 'bg-cyan-600 text-white font-bold shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <FormInput className="w-3 h-3" />
                            <span>Formulários</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SubMenu 2: Empresa (PJ) */}
                  {(isEmpresaAccess || isInternalAdmin) && (
                    <div>
                      <button
                        onClick={() => toggleGroup('portalEmpresa')}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          activeSection.startsWith('portal_empresa_') || activeSection === 'portal_inscrito_pj'
                            ? 'bg-teal-50 text-teal-900 font-bold border-l-2 border-teal-500'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>Empresa</span>
                        </div>
                        {openGroups.portalEmpresa ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                      </button>

                      {openGroups.portalEmpresa && (
                        <div className="ml-3 pl-2 border-l border-teal-200/80 space-y-1 mt-1">
                          <button
                            onClick={() => handleSelect('portal_empresa_perfil')}
                            className={`w-full flex items-center space-x-2 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              activeSection === 'portal_empresa_perfil' || activeSection === 'portal_inscrito_pj'
                                ? 'bg-teal-600 text-white font-bold shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <Building2 className="w-3 h-3" />
                            <span>Dados Cadastrais</span>
                          </button>

                          <button
                            onClick={() => handleSelect('portal_empresa_anuidade')}
                            className={`w-full flex items-center space-x-2 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              activeSection === 'portal_empresa_anuidade'
                                ? 'bg-teal-600 text-white font-bold shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <Coins className="w-3 h-3" />
                            <span>Anuidade</span>
                          </button>

                          <button
                            onClick={() => handleSelect('portal_empresa_protocolo')}
                            className={`w-full flex items-center space-x-2 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              activeSection === 'portal_empresa_protocolo'
                                ? 'bg-teal-600 text-white font-bold shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <FileText className="w-3 h-3" />
                            <span>Protocolo</span>
                          </button>

                          <button
                            onClick={() => handleSelect('portal_empresa_requerimento')}
                            className={`w-full flex items-center space-x-2 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              activeSection === 'portal_empresa_requerimento'
                                ? 'bg-teal-600 text-white font-bold shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <Send className="w-3 h-3" />
                            <span>Requerimento</span>
                          </button>

                          <button
                            onClick={() => handleSelect('portal_empresa_formularios')}
                            className={`w-full flex items-center space-x-2 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              activeSection === 'portal_empresa_formularios'
                                ? 'bg-teal-600 text-white font-bold shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <FormInput className="w-3 h-3" />
                            <span>Formulários</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tópico DEV com submenus Configuração e Microsserviços (EXCLUSIVO PARA DESENVOLVEDOR MASTER) */}
          {isMasterDeveloper(authUser) && (
            <div>
              <button
                onClick={() => toggleGroup('devTopic')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSection === 'dev_configuracao' || activeSection === 'microsservicos'
                    ? 'bg-purple-900 text-white shadow-md'
                    : 'text-slate-800 hover:bg-purple-50 hover:text-purple-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Code2 className="w-4 h-4 text-purple-400" />
                  <span className="font-mono font-bold tracking-wider">DEV</span>
                </div>
                {openGroups.devTopic ? <ChevronDown className="w-3.5 h-3.5 text-purple-200" /> : <ChevronRight className="w-3.5 h-3.5 text-purple-200" />}
              </button>

              {openGroups.devTopic && (
                <div className="ml-3 pl-2.5 border-l-2 border-purple-200 space-y-1 mt-1">
                  <button
                    onClick={() => handleSelect('dev_configuracao')}
                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeSection === 'dev_configuracao'
                        ? 'bg-purple-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-300" />
                    <span>Configuração</span>
                  </button>

                  <button
                    onClick={() => handleSelect('microsservicos')}
                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeSection === 'microsservicos'
                        ? 'bg-purple-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Network className="w-3.5 h-3.5 text-purple-300" />
                    <span>Microsserviços & Cloud</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Divisor do Sistema & Painel Admin (Oculto estritamente para Profissionais e Empresas) */}
          {isInternalAdmin && (checkPerm('configuracoes') || 
            checkPerm('funcionarios') || 
            isMasterDeveloper(authUser)) && (
            <>
              <div className="pt-2 pb-1 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 px-3 tracking-wider">
                  Sistema & Parâmetros
                </span>
              </div>

              <div>
                <button
                  onClick={() => toggleGroup('configuracoes')}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSection === 'configuracoes' || activeSection === 'funcionarios' || activeSection === 'backup_restore'
                      ? 'bg-slate-800 text-white shadow-md'
                      : 'text-slate-800 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-blue-500" />
                    <span>Painel do Administrador</span>
                  </div>
                  {openGroups.configuracoes ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {openGroups.configuracoes && (
                  <div className="ml-3 pl-2.5 border-l-2 border-slate-100 space-y-1 mt-1">
                    {/* ITEM CONFIGURAÇÃO COM SUBMENUS GERAL E FISCALIZAÇÃO ELETRÔNICA */}
                    {checkPerm('configuracoes') && (
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => toggleGroup('configuracaoMenu')}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            activeSection === 'configuracoes' && (activeSubTab === 'geral' || activeSubTab === 'fiscalizacao' || !activeSubTab)
                              ? 'bg-blue-50/80 text-blue-800'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Sliders className="w-3.5 h-3.5 text-blue-600" />
                            <span>Configuração</span>
                          </div>
                          {openGroups.configuracaoMenu ? (
                            <ChevronDown className="w-3 h-3 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                          )}
                        </button>

                        {openGroups.configuracaoMenu && (
                          <div className="ml-3 pl-2.5 border-l-2 border-blue-200/60 space-y-1 my-1">
                            {/* Submenu 1: Geral */}
                            <button
                              type="button"
                              onClick={() => handleSelect('configuracoes', 'geral')}
                              className={`w-full flex items-center space-x-2 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                activeSection === 'configuracoes' && (activeSubTab === 'geral' || !activeSubTab)
                                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                            >
                              <Settings className="w-3 h-3" />
                              <span>Geral</span>
                            </button>

                            {/* Submenu 2: Fiscalização Eletrônica */}
                            <button
                              type="button"
                              onClick={() => handleSelect('configuracoes', 'fiscalizacao')}
                              className={`w-full flex items-center space-x-2 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                activeSection === 'configuracoes' && activeSubTab === 'fiscalizacao'
                                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                            >
                              <Tablet className="w-3 h-3 text-amber-500" />
                              <span>Fiscalização Eletrônica</span>
                            </button>

                            {/* Submenu 3: Inscrito (com subdivisões Pessoa Física e Pessoa Jurídica) */}
                            <div className="space-y-0.5 pt-0.5">
                              <button
                                type="button"
                                onClick={() => toggleGroup('inscritoMenu')}
                                className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                  activeSection === 'configuracoes' && (activeSubTab === 'inscrito' || activeSubTab === 'inscrito_pf' || activeSubTab === 'inscrito_pj')
                                    ? 'bg-indigo-50 text-indigo-900 font-bold'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <ShieldCheck className="w-3 h-3 text-indigo-600" />
                                  <span>Inscrito</span>
                                </div>
                                {openGroups.inscritoMenu ? (
                                  <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                                ) : (
                                  <ChevronRight className="w-2.5 h-2.5 text-slate-400" />
                                )}
                              </button>

                              {openGroups.inscritoMenu && (
                                <div className="ml-2.5 pl-2 border-l border-indigo-200/80 space-y-0.5 my-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSelect('configuracoes', 'inscrito_pf')}
                                    className={`w-full flex items-center space-x-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                      activeSection === 'configuracoes' && (activeSubTab === 'inscrito_pf' || activeSubTab === 'inscrito')
                                        ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                  >
                                    <User className="w-2.5 h-2.5" />
                                    <span>Pessoa Física</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSelect('configuracoes', 'inscrito_pj')}
                                    className={`w-full flex items-center space-x-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                      activeSection === 'configuracoes' && activeSubTab === 'inscrito_pj'
                                        ? 'bg-teal-600 text-white font-bold shadow-2xs'
                                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                  >
                                    <Building2 className="w-2.5 h-2.5" />
                                    <span>Pessoa Jurídica</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* CADASTRO DE FUNCIONÁRIOS */}
                    {(checkPerm( 'funcionarios') || checkPerm( 'configuracoes')) && (
                      <button
                        onClick={() => handleSelect('funcionarios')}
                        className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          activeSection === 'funcionarios'
                            ? 'bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Cadastro de Funcionários</span>
                      </button>
                    )}

                    {/* BANCO DE DADOS SUPABASE */}
                    {onOpenSupabaseModal && (checkPerm( 'configuracoes') || isMasterDeveloper(authUser)) && (
                      <button
                        onClick={() => {
                          onOpenSupabaseModal();
                          onClose();
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          supabaseInfo.connected
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                        title="Gerenciar conexão Supabase e sincronização PostgreSQL"
                      >
                        <div className="flex items-center space-x-2">
                          <Database className={`w-3.5 h-3.5 ${supabaseInfo.connected ? 'text-emerald-600' : 'text-slate-500'}`} />
                          <span className="font-semibold">Banco de Dados Supabase</span>
                        </div>
                        <span className={`w-2 h-2 rounded-full ${supabaseInfo.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      </button>
                    )}

                    {/* Assistência Farmacêutica */}
                    {checkPerm( 'configuracoes') && (
                      <button
                        onClick={() => handleSelect('configuracoes', 'assistencia')}
                        className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          activeSection === 'configuracoes' && activeSubTab === 'assistencia'
                            ? 'bg-teal-50 text-teal-700 font-bold border-l-2 border-teal-600'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Scale className="w-3.5 h-3.5 text-teal-600" />
                        <span>Assistência Farmacêutica</span>
                      </button>
                    )}

                    {/* Impedimentos de ART */}
                    {checkPerm( 'configuracoes') && (
                      <button
                        onClick={() => handleSelect('configuracoes', 'impedimentos_art')}
                        className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          activeSection === 'configuracoes' && activeSubTab === 'impedimentos_art'
                            ? 'bg-rose-50 text-rose-700 font-bold border-l-2 border-rose-600'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        <span>Impedimentos de ART</span>
                      </button>
                    )}

                    {/* Backup & Restore */}
                    {(checkPerm( 'configuracoes') || checkPerm( 'backup_restore')) && (
                      <button
                        onClick={() => handleSelect('configuracoes', 'backup_restore')}
                        className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          activeSection === 'configuracoes' && activeSubTab === 'backup_restore'
                            ? 'bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Database className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Backup & Restore</span>
                      </button>
                    )}

                    {/* Parâmetros Administrativos */}
                    {(checkPerm( 'cadastros_basicos') || checkPerm( 'configuracoes')) && (
                      <button
                        onClick={() => handleSelect('cadastros_basicos', 'ADMIN')}
                        className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          activeSection === 'cadastros_basicos' && activeSubTab === 'ADMIN'
                            ? 'bg-rose-50 text-rose-700 font-bold border-l-2 border-rose-600'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                        <span>Parâmetros Administrativos</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}


        </nav>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">SIGCON</span>
            <span className="font-mono text-emerald-600 font-bold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Online</span>
            </span>
          </div>
          <div className="text-[10px] text-slate-400 truncate" title={councilConfig.nomeCompleto}>
            {councilConfig.sigla} - {councilConfig.nomeCompleto}
          </div>
        </div>
      </aside>
    </>
  );
};
