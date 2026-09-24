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
  FolderTree
} from 'lucide-react';
import { UserRole } from '../types';
import { CouncilConfig } from '../services/storageService';

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
  | 'microsservicos';

interface SidebarProps {
  activeSection: MainSection;
  onSelectSection: (section: MainSection) => void;
  currentRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
  councilConfig: CouncilConfig;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  currentRole,
  isOpen,
  onClose,
  councilConfig
}) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    cadastros: true,
    financeiro: true,
    fiscalizacao: true,
    juridico: true,
    relatorios: true
  });

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelect = (section: MainSection) => {
    onSelectSection(section);
    onClose();
  };

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
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-500/20">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 leading-tight flex items-center space-x-1.5">
                <span>SIGC</span>
                <span className="text-[10px] font-mono px-1 rounded bg-blue-100 text-blue-700 font-semibold">
                  {councilConfig.sigla}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                Menu de Navegação
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

        {/* Scrollable Navigation List */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto text-xs">
          {/* Cadastros Group */}
          <div>
            <button
              onClick={() => toggleGroup('cadastros')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors font-bold text-[11px] uppercase tracking-wider"
            >
              <div className="flex items-center space-x-2">
                <FolderTree className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Cadastros Oficiais</span>
              </div>
              {openGroups.cadastros ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {openGroups.cadastros && (
              <div className="ml-3 pl-2.5 border-l-2 border-slate-100 space-y-1 mt-1">
                <button
                  onClick={() => handleSelect('profissionais')}
                  className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeSection === 'profissionais'
                      ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Profissionais (Pessoa Física)</span>
                </button>

                <button
                  onClick={() => handleSelect('empresas')}
                  className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeSection === 'empresas'
                      ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Building className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Firmas & Empresas (Pessoa Jurídica)</span>
                </button>

                <button
                  onClick={() => handleSelect('cadastros_basicos')}
                  className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeSection === 'cadastros_basicos'
                      ? 'bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Cadastros Básicos</span>
                </button>
              </div>
            )}
          </div>

          {/* Financeiro Group */}
          <div>
            <button
              onClick={() => toggleGroup('financeiro')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors font-bold text-[11px] uppercase tracking-wider"
            >
              <div className="flex items-center space-x-2">
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                <span>2. Financeiro & Arrecadação</span>
              </div>
              {openGroups.financeiro ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {openGroups.financeiro && (
              <div className="ml-3 pl-2.5 border-l-2 border-slate-100 space-y-1 mt-1">
                <button
                  onClick={() => handleSelect('financeiro')}
                  className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
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

          {/* Jurídico & Cobrança Group */}
          <div>
            <button
              onClick={() => toggleGroup('juridico')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors font-bold text-[11px] uppercase tracking-wider"
            >
              <div className="flex items-center space-x-2">
                <Scale className="w-3.5 h-3.5 text-purple-600" />
                <span>3. Jurídico & Dívida Ativa</span>
              </div>
              {openGroups.juridico ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {openGroups.juridico && (
              <div className="ml-3 pl-2.5 border-l-2 border-slate-100 space-y-1 mt-1">
                <button
                  onClick={() => handleSelect('cobranca_juridico')}
                  className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
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

          {/* Fiscalização */}
          <div>
            <button
              onClick={() => toggleGroup('fiscalizacao')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors font-bold text-[11px] uppercase tracking-wider"
            >
              <div className="flex items-center space-x-2">
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                <span>4. Fiscalização em Campo</span>
              </div>
              {openGroups.fiscalizacao ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {openGroups.fiscalizacao && (
              <div className="ml-3 pl-2.5 border-l-2 border-slate-100 space-y-1 mt-1">
                <button
                  onClick={() => handleSelect('fiscalizacao')}
                  className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeSection === 'fiscalizacao'
                      ? 'bg-emerald-50 text-emerald-800 font-bold border-l-2 border-emerald-500'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fiscais Offline & GPS</span>
                </button>
              </div>
            )}
          </div>

          {/* Protocolos */}
          <button
            onClick={() => handleSelect('protocolos')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeSection === 'protocolos'
                ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>5. Protocolos & Requerimentos</span>
          </button>

          {/* Relatórios Analíticos */}
          <button
            onClick={() => handleSelect('relatorios')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeSection === 'relatorios'
                ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-cyan-600" />
            <span>6. Relatórios & BI Diretoria</span>
          </button>

          {/* Formulários Dinâmicos */}
          <button
            onClick={() => handleSelect('formularios')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeSection === 'formularios'
                ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FormInput className="w-4 h-4 text-pink-600" />
            <span>7. Formulários Dinâmicos</span>
          </button>

          {/* Portal de Autoatendimento do Inscrito */}
          <button
            onClick={() => handleSelect('portal_inscrito')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeSection === 'portal_inscrito'
                ? 'bg-teal-50 text-teal-800 font-bold border-l-2 border-teal-500'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4 text-teal-600" />
            <span>8. Portal do Inscrito (PF/PJ)</span>
          </button>

          {/* Divisor do Sistema */}
          <div className="pt-2 pb-1 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 px-3 tracking-wider">
              Sistema & Parâmetros
            </span>
          </div>

          {/* Configurações do Conselho */}
          <button
            onClick={() => handleSelect('configuracoes')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'configuracoes'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-800 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <Settings className={`w-4 h-4 ${activeSection === 'configuracoes' ? 'text-white' : 'text-blue-600'}`} />
            <span>Configurações do Conselho</span>
          </button>

          {/* Microsserviços & Arquitetura */}
          <button
            onClick={() => handleSelect('microsservicos')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeSection === 'microsservicos'
                ? 'bg-violet-50 text-violet-800 font-bold border-l-2 border-violet-500'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Network className="w-4 h-4 text-violet-600" />
            <span>Microsserviços & Cloud</span>
          </button>
        </nav>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">SIGC Cloud</span>
            <span className="font-mono text-emerald-600 font-bold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Online</span>
            </span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {councilConfig.nomeCompleto}
          </div>
        </div>
      </aside>
    </>
  );
};
