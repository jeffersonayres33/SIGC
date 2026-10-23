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
  LogOut
} from 'lucide-react';
import { UserRole, AuthUser } from '../types';
import { CouncilConfig, storageService } from '../services/storageService';
import { toastService } from '../services/toastService';
import { isMasterDeveloper } from '../utils/permissionUtils';

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
  onLogout
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
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Hamburger menu toggle + System Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 border border-slate-200 transition-colors shadow-xs cursor-pointer"
            title="Abrir Menu do Sistema"
            aria-label="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <img 
              src="/public/assets/aistudio/Gemini_Generated_Image_ftnohaftnohaftno_8f366e0b.jpeg" 
              alt="SIGCON Icon" 
              className="h-9 w-9 object-contain rounded-xl border border-slate-200 shadow-2xs p-0.5 bg-white"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 flex items-center">
                  SIGCON <span className="text-slate-500 font-normal text-xs ml-1.5 hidden md:inline">| Sistema Integrado de Gestão de Conselho</span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                {councilConfig.sigla} — {councilConfig.nomeCompleto}
              </p>
              <div className="text-[11px] text-blue-700 font-bold mt-0.5 flex flex-wrap items-center gap-1.5">
                <span>
                  Olá, <strong className="text-blue-900 underline decoration-blue-300">{authUser?.nome || 'Usuário'}</strong>! Seja bem-vindo(a) ao SIGCON.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Role Switcher & Sair */}
        <div className="flex items-center space-x-2.5">

          {/* User Role Badge / Developer Switcher */}
          {isMasterDeveloper(authUser) ? (
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${activeRoleConfig.color} hover:shadow-sm cursor-pointer`}
                title="Modo Desenvolvedor: Alternar simulação de perfil"
              >
                <Icon className="w-4 h-4" />
                <div className="text-left hidden sm:block">
                  <div className="text-[10px] text-slate-500 font-normal leading-none flex items-center space-x-1">
                    <span>Simular Perfil</span>
                    <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded font-bold">DEV</span>
                  </div>
                  <div className="font-bold leading-tight mt-0.5">{activeRoleConfig.label}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-60" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 text-xs">
                  <div className="px-3.5 py-2 text-[11px] font-bold text-slate-500 border-b border-slate-100 uppercase tracking-wider flex items-center justify-between">
                    <span>Simular Perfil de Acesso</span>
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
                              'Perfil Simulado',
                              `Ambiente alterado para o perfil: ${item.label}.`
                            );
                          }}
                          className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold' 
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <ItemIcon className="w-4 h-4 text-slate-500 shrink-0" />
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
          ) : (
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${activeRoleConfig.color}`}>
              <Icon className="w-4 h-4" />
              <div className="text-left hidden sm:block">
                <div className="text-[10px] text-slate-500 font-normal leading-none">Perfil de Acesso</div>
                <div className="font-bold leading-tight mt-0.5">{activeRoleConfig.label}</div>
              </div>
            </div>
          )}

          {/* Botão Sair / Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
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
