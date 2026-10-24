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
  Sliders
} from 'lucide-react';
import { UserRole, AuthUser } from '../types';
import { CouncilConfig, storageService } from '../services/storageService';
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
  | 'portal_inscrito'
  | 'configuracoes'
  | 'painel_admin'
  | 'backup_restore'
  | 'funcionarios'
  | 'admin'
  | 'microsservicos';

interface SidebarProps {
  activeSection: MainSection;
  activeSubTab?: string;
  onSelectSection: (section: MainSection, subTab?: string) => void;
  currentRole: UserRole;
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
    configuracaoMenu: true
  });

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
          {/* 1. Profissionais (PF) */}
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
              <span>1. Profissionais (PF)</span>
            </button>
          )}

          {/* 2. Empresas (PJ) */}
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
              <span>2. Empresas (PJ)</span>
            </button>
          )}

          {/* 3. Protocolos */}
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
              <span>3. Protocolos & Requerimentos</span>
            </button>
          )}

          {/* 4. Cadastros Básicos (com seções próprias para Profissionais, Empresas, Protocolo e Processo) */}
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
                  <span>4. Cadastros Básicos</span>
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
                </div>
              )}
            </div>
          )}

          {/* 5. Financeiro & Arrecadação */}
          {checkPerm( 'financeiro') && (
            <div>
              <button
                onClick={() => toggleGroup('financeiro')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors font-bold text-[11px] uppercase tracking-wider cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                  <span>5. Financeiro & Arrecadação</span>
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

          {/* 6. Jurídico & Dívida Ativa */}
          {checkPerm( 'cobranca_juridico') && (
            <div>
              <button
                onClick={() => toggleGroup('juridico')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors font-bold text-[11px] uppercase tracking-wider cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Scale className="w-3.5 h-3.5 text-purple-600" />
                  <span>6. Jurídico & Dívida Ativa</span>
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

          {/* 7. Fiscalização */}
          {checkPerm( 'fiscalizacao') && (
            <div>
              <button
                onClick={() => toggleGroup('fiscalizacao')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors font-bold text-[11px] uppercase tracking-wider cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Compass className="w-3.5 h-3.5 text-emerald-600" />
                  <span>7. Fiscalização</span>
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

          {/* 8. Relatórios Analíticos */}
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
              <span>8. Relatórios & BI Diretoria</span>
            </button>
          )}

          {/* 9. Formulários Dinâmicos */}
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
              <span>9. Formulários Dinâmicos</span>
            </button>
          )}

          {/* 10. Portal de Autoatendimento do Inscrito */}
          {checkPerm( 'portal_inscrito') && (
            <button
              onClick={() => handleSelect('portal_inscrito')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSection === 'portal_inscrito'
                  ? 'bg-teal-50 text-teal-800 font-bold border-l-2 border-teal-500'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4 text-teal-600" />
              <span>10. Portal do Inscrito (PF/PJ)</span>
            </button>
          )}

          {/* Divisor do Sistema & Painel Admin */}
          {(checkPerm( 'configuracoes') || 
            checkPerm( 'funcionarios') || 
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

          {/* Microsserviços & Cloud */}
          {checkPerm( 'microsservicos') && (
            <button
              onClick={() => handleSelect('microsservicos')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSection === 'microsservicos'
                  ? 'bg-violet-50 text-violet-800 font-bold border-l-2 border-violet-500'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Network className="w-4 h-4 text-violet-600" />
              <span>Microsserviços & Cloud</span>
            </button>
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
