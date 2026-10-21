import React from 'react';
import { 
  ShieldAlert, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Briefcase, 
  Building2, 
  User, 
  HelpCircle 
} from 'lucide-react';
import { AuthUser } from '../../types';
import { MainSection } from '../../components/Sidebar';
import { 
  getModuleName, 
  getAllowedModules, 
  MODULOS_SISTEMA,
  getDefaultAllowedSection 
} from '../../utils/permissionUtils';

interface AccessDeniedViewProps {
  attemptedSection: string;
  authUser: AuthUser;
  onNavigateToAllowed: (section: MainSection) => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  attemptedSection,
  authUser,
  onNavigateToAllowed
}) => {
  const attemptedName = getModuleName(attemptedSection);
  const allowedModules = getAllowedModules(authUser);
  const defaultAllowed = getDefaultAllowedSection(authUser);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Top Warning Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 p-6 sm:p-8 text-white">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-lg">
              <ShieldAlert className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/25 text-rose-100 text-[11px] font-extrabold uppercase tracking-wider mb-2 border border-white/10">
                <Lock className="w-3.5 h-3.5" />
                <span>Controle de Acesso Institucional</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                Acesso Não Autorizado ao Módulo
              </h2>
              <p className="text-rose-100 text-xs sm:text-sm mt-1.5 leading-relaxed">
                Você tentou acessar <span className="font-bold underline text-white">{attemptedName}</span>, porém o seu perfil não possui liberação concedida pelo Administrador do Sistema.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* User Profile Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {authUser.fotoUrl ? (
                  <img src={authUser.fotoUrl} alt={authUser.nome} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <User className="w-5 h-5 text-slate-300" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                  <span>{authUser.nome}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono">
                    {authUser.documento}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                  <span className="flex items-center space-x-1">
                    <Briefcase className="w-3 h-3 text-slate-400" />
                    <span>{authUser.cargoOuTitulo || 'Colaborador'}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Regra Aplicada
              </span>
              <span className="text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg inline-block mt-0.5">
                Cargo & Setor
              </span>
            </div>
          </div>

          {/* Permitted Modules Info */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Módulos Liberados Para Você ({allowedModules.length})</span>
              </div>
              <span className="text-[11px] text-slate-400">Clique para navegar</span>
            </div>

            {allowedModules.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                Nenhum módulo operacional foi liberado para o seu usuário. Solicite à Administração o vínculo de permissões ao seu cadastro.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {allowedModules.map((modId) => {
                  const mod = MODULOS_SISTEMA.find(m => m.id === modId);
                  const isCurrent = modId === attemptedSection;
                  return (
                    <button
                      key={modId}
                      onClick={() => onNavigateToAllowed(modId as MainSection)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-rose-50 border-rose-300 text-rose-800 opacity-60 cursor-not-allowed'
                          : 'bg-white hover:bg-blue-50/80 border-slate-200 hover:border-blue-300 hover:shadow-xs text-slate-800 group'
                      }`}
                      disabled={isCurrent}
                    >
                      <div className="truncate pr-2">
                        <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                          {mod?.nome || modId}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {mod?.descricao || 'Módulo autorizado'}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Admin help info */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start space-x-3 text-xs text-blue-900">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Precisa de acesso a esta funcionalidade?</span>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Entre em contato com o Administrador Geral ou com a Diretoria do Conselho para solicitar a liberação do módulo em{' '}
                <span className="font-semibold text-slate-800">Cadastro de Funcionários &gt; Login, nível de acesso e módulos</span>.
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              onClick={() => onNavigateToAllowed(defaultAllowed)}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <span>Ir para Módulo Autorizado ({getModuleName(defaultAllowed)})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
