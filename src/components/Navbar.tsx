import React, { useState } from 'react';
import { 
  Building2, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  UserCheck, 
  Shield, 
  Coins, 
  Scale, 
  Compass, 
  LayoutDashboard, 
  User,
  SlidersHorizontal,
  ChevronDown,
  Menu,
  Settings,
  Bell,
  Search,
  Database
} from 'lucide-react';
import { UserRole } from '../types';
import { CouncilConfig, storageService } from '../services/storageService';
import { toastService } from '../services/toastService';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  networkStatus: { isOnline: boolean; queueSize: number };
  onSyncOffline: () => void;
  activeModule: string;
  councilConfig: CouncilConfig;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenSupabaseModal?: () => void;
}

const ROLES_LIST: { role: UserRole; label: string; icon: any; color: string; badgeColor: string }[] = [
  { role: 'ADMIN', label: 'Administrador Geral', icon: Shield, color: 'bg-red-50 text-red-700 border-red-200', badgeColor: 'bg-red-100 text-red-800' },
  { role: 'FISCAL', label: 'Fiscal de Campo (GPS/Offline)', icon: Compass, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', badgeColor: 'bg-emerald-100 text-emerald-800' },
  { role: 'FINANCEIRO', label: 'Setor Financeiro & Cobrança', icon: Coins, color: 'bg-amber-50 text-amber-700 border-amber-200', badgeColor: 'bg-amber-100 text-amber-800' },
  { role: 'JURIDICO', label: 'Jurídico & Execução Extrajudicial', icon: Scale, color: 'bg-purple-50 text-purple-700 border-purple-200', badgeColor: 'bg-purple-100 text-purple-800' },
  { role: 'DIRETORIA', label: 'Diretoria / Relatórios BI', icon: LayoutDashboard, color: 'bg-blue-50 text-blue-700 border-blue-200', badgeColor: 'bg-blue-100 text-blue-800' },
  { role: 'PORTAL_PROFISSIONAL', label: 'Portal do Profissional (PF)', icon: User, color: 'bg-cyan-50 text-cyan-700 border-cyan-200', badgeColor: 'bg-cyan-100 text-cyan-800' },
  { role: 'PORTAL_EMPRESA', label: 'Portal da Empresa (PJ)', icon: Building2, color: 'bg-teal-50 text-teal-700 border-teal-200', badgeColor: 'bg-teal-100 text-teal-800' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  networkStatus,
  onSyncOffline,
  activeModule,
  councilConfig,
  onToggleSidebar,
  onOpenSettings,
  onOpenSupabaseModal
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const supabaseInfo = storageService.getSupabaseStatus();

  const activeRoleConfig = ROLES_LIST.find(r => r.role === currentRole) || ROLES_LIST[0];
  const Icon = activeRoleConfig.icon;

  const handleToggleOffline = () => {
    const nextState = !networkStatus.isOnline;
    storageService.setSimulatedOffline(nextState);
    if (!nextState) {
      toastService.warning(
        'Modo Offline Ativado',
        'O sistema agora opera desconectado da rede. Cadastros e autos de fiscalização serão armazenados no dispositivo.'
      );
    } else {
      toastService.success(
        'Conexão Restabelecida',
        'Conexão com os servidores do conselho restabelecida com sucesso.'
      );
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-xs">
      {/* Top Banner (Header Oficial do Conselho) */}
      <div className="bg-slate-900 text-slate-200 px-4 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono font-bold tracking-wider text-blue-300">{councilConfig.sigla}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 font-medium truncate max-w-lg hidden sm:inline">
              {councilConfig.nomeCompleto}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Simulated Offline Toggle */}
          <button
            onClick={handleToggleOffline}
            title="Alternar Simulação de Conexão Online/Offline"
            className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
              networkStatus.isOnline 
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700 hover:bg-emerald-900' 
                : 'bg-rose-950/90 text-rose-300 border-rose-600 hover:bg-rose-900 animate-pulse'
            }`}
          >
            {networkStatus.isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-rose-400" />}
            <span className="hidden md:inline">{networkStatus.isOnline ? 'Online (Central Conectada)' : 'Modo Offline Ativo'}</span>
          </button>

          {/* Offline Queue Badge & Sync Action */}
          {networkStatus.queueSize > 0 && (
            <button
              onClick={onSyncOffline}
              disabled={!networkStatus.isOnline}
              className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                networkStatus.isOnline
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${networkStatus.isOnline ? 'animate-spin' : ''}`} />
              <span>{networkStatus.queueSize} na fila local</span>
            </button>
          )}

          <div className="hidden lg:flex items-center space-x-2 text-slate-400 text-[11px]">
            <span>CNPJ: {councilConfig.cnpj || '04.382.491/0001-20'}</span>
            <span className="text-slate-600">•</span>
            <span>UF: {councilConfig.uf}</span>
          </div>
        </div>
      </div>

      {/* Main Bar with Hamburger Menu Button, Logo, Search, Role Switcher and Settings */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Hamburger menu toggle + System Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 border border-slate-200 transition-colors shadow-xs"
            title="Abrir Menu do Sistema"
            aria-label="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-sm tracking-tight text-slate-900 flex items-center">
                  SIGC <span className="text-blue-600 font-semibold ml-1">Cloud</span>
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Conselhos de Classe
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Sistema Integrado de Gestão de Conselhos
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick actions + Settings + Role Switcher */}
        <div className="flex items-center space-x-2.5">
          {/* Supabase Database Sync Button */}
          {onOpenSupabaseModal && (
            <button
              onClick={onOpenSupabaseModal}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xs ${
                supabaseInfo.connected
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Gerenciar Banco de Dados Supabase (PostgreSQL)"
            >
              <Database className={`w-4 h-4 ${supabaseInfo.connected ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Supabase</span>
              <span className={`w-2 h-2 rounded-full ${supabaseInfo.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            </button>
          )}

          {/* Quick Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors shadow-xs"
            title="Configurações e Parâmetros do Conselho"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">Configurações</span>
          </button>

          {/* User Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${activeRoleConfig.color} hover:shadow-sm`}
            >
              <Icon className="w-4 h-4" />
              <div className="text-left hidden sm:block">
                <div className="text-[10px] text-slate-500 font-normal leading-none">Perfil de Acesso</div>
                <div className="font-bold leading-tight mt-0.5">{activeRoleConfig.label}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-60" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 text-xs">
                <div className="px-3.5 py-2 text-[11px] font-bold text-slate-500 border-b border-slate-100 uppercase tracking-wider flex items-center justify-between">
                  <span>Alternar Perfil de Acesso</span>
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="p-1.5 space-y-1">
                  {ROLES_LIST.map((item) => {
                    const ItemIcon = item.icon;
                    const isSelected = item.role === currentRole;
                    return (
                      <button
                        key={item.role}
                        onClick={() => {
                          onRoleChange(item.role);
                          setShowRoleMenu(false);
                          toastService.info(
                            'Perfil Alternado',
                            `Ambiente alterado para o perfil: ${item.label}.`
                          );
                        }}
                        className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-left transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold' 
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <ItemIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800">{item.label}</div>
                        </div>
                        {isSelected && <UserCheck className="w-4 h-4 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
