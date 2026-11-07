import React, { useState } from 'react';
import { 
  Building2, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  UserCheck, 
  Shield, 
  ShieldCheck,
  Coins, 
  Scale, 
  Compass, 
  LayoutDashboard, 
  User,
  SlidersHorizontal,
  ChevronDown,
  Menu,
  LogOut,
  ArrowRightLeft,
  Briefcase
} from 'lucide-react';
import { UserRole, AuthUser } from '../types';
import { CouncilConfig, storageService } from '../services/storageService';
import { toastService } from '../services/toastService';
import { isMasterDeveloper } from '../utils/permissionUtils';
import { SIGCON_LOGO } from '../constants/assets';

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
  authUser?: AuthUser | null;
  onLogout?: () => void;
  onSwitchProfile?: (targetTipo: 'FUNCIONARIO' | 'PROFISSIONAL') => void;
}

const ROLES_LIST: { role: UserRole; label: string; icon: any; color: string; badgeColor: string }[] = [
  { role: 'DEVELOPER', label: 'Desenvolvedor Master', icon: ShieldCheck, color: 'bg-purple-50 text-purple-700 border-purple-200', badgeColor: 'bg-purple-100 text-purple-800' },
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
  authUser,
  onLogout,
  onSwitchProfile
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

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
            <span className="font-extrabold tracking-wider text-blue-400">SIGCON</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono font-bold tracking-wider text-slate-200">{councilConfig.sigla}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 font-medium truncate max-w-lg hidden sm:inline">
              {councilConfig.nomeCompleto}
            </span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            {(authUser?.role === 'DEVELOPER' || currentRole === 'DEVELOPER') && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-linear-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-mono font-extrabold tracking-wide uppercase shadow-xs border border-purple-400/30">
                <span>👑</span>
                <span>DESENVOLVEDOR MASTER</span>
              </span>
            )}
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
            <span className="font-semibold">{networkStatus.isOnline ? 'Onlaine' : 'Offlaine'}</span>
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

      {/* Main Bar with Hamburger Menu Button, Logo, Clean Brand and Role Switcher */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Hamburger menu toggle + System Title */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 border border-slate-200 transition-colors shadow-xs cursor-pointer shrink-0"
            title="Abrir Menu do Sistema"
            aria-label="Abrir Menu"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <img 
              src={SIGCON_LOGO} 
              alt="SIGCON Icon" 
              className="h-8 w-8 sm:h-9 sm:w-9 object-contain rounded-xl border border-slate-200 shadow-2xs p-0.5 bg-white transition-transform hover:scale-105 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 flex items-center">
                  SIGCON <span className="text-slate-500 font-normal text-xs ml-1.5 hidden md:inline">| Sistema Integrado de Gestão de Conselho</span>
                </h1>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden sm:block truncate">
                {councilConfig.sigla} — {councilConfig.nomeCompleto}
              </p>
              <div className="text-[10px] sm:text-[11px] text-blue-700 font-bold mt-0.5 hidden sm:flex items-center gap-1.5 truncate">
                <span className="truncate">
                  Olá, <strong className="text-blue-900 underline decoration-blue-300">{authUser?.nome || 'Usuário'}</strong>!
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Profile Switcher, Role & Sair */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">

          {/* Botão de Alternância Imediata Sem Deslogar */}
          {authUser && authUser.perfisDisponiveis && authUser.perfisDisponiveis.length > 1 && onSwitchProfile && (
            <button
              type="button"
              onClick={() => onSwitchProfile(authUser.tipo === 'PROFISSIONAL' ? 'FUNCIONARIO' : 'PROFISSIONAL')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-white text-xs font-bold shadow-xs transition-all cursor-pointer group shrink-0 active:scale-95 ${
                authUser.tipo === 'PROFISSIONAL'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
              }`}
              title={
                authUser.tipo === 'PROFISSIONAL'
                  ? 'Clique para alternar imediatamente para sua atuação como Colaborador do Conselho'
                  : 'Clique para alternar imediatamente para sua atuação como Profissional Inscrito (PF)'
              }
            >
              <ArrowRightLeft className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" />
              <span className="hidden sm:inline">
                {authUser.tipo === 'PROFISSIONAL' ? 'Alternar para Colaborador' : 'Alternar para Profissional'}
              </span>
              <span className="inline sm:hidden text-[11px]">
                {authUser.tipo === 'PROFISSIONAL' ? 'Colaborador' : 'Profissional'}
              </span>
            </button>
          )}

          {/* Perfil de Acesso Ativo (Informativo - Simulação no Menu Lateral) */}
          <div className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold ${activeRoleConfig.color}`}>
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <div className="text-left hidden md:block">
              <div className="font-bold leading-tight text-[11px] truncate max-w-[130px]">{activeRoleConfig.label}</div>
            </div>
          </div>

          {/* Botão Sair / Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Desconectar do sistema"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
