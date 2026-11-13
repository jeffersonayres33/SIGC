import React, { useState, useEffect } from 'react';
import { 
  Code2, 
  MapPin, 
  MapPinOff, 
  Save, 
  ShieldCheck, 
  Cpu, 
  Database, 
  Terminal, 
  AlertCircle, 
  Sparkles,
  Server,
  Key,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { storageService, CouncilConfig } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { isMasterDeveloper } from '../../utils/permissionUtils';

export const DevConfiguracaoView: React.FC = () => {
  const [config, setConfig] = useState<CouncilConfig>(storageService.getCouncilConfig());
  const [hasChanges, setHasChanges] = useState(false);
  const currentAuthUser = storageService.getCurrentAuthUser();
  const isDevUser = isMasterDeveloper(currentAuthUser);

  // Feature flags locais de dev
  const [debugMode, setDebugMode] = useState(true);
  const [verboseLogging, setVerboseLogging] = useState(false);
  const [mockLatency, setMockLatency] = useState(15);

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setConfig(storageService.getCouncilConfig());
    });
    return () => unsub();
  }, []);

  const isGeoAtiva = config.geolocalizacaoAtiva !== false;

  const handleToggleGeolocalizacao = () => {
    const novoStatus = !isGeoAtiva;
    setConfig(prev => ({
      ...prev,
      geolocalizacaoAtiva: novoStatus
    }));
    setHasChanges(true);
    if (novoStatus) {
      toastService.info('Geolocalização Ativada', 'Coordenadas GPS serão capturadas e exibidas na aplicação.');
    } else {
      toastService.warning('Geolocalização Desativada', 'Coordenadas GPS ficarão invisíveis e receberão null no banco de dados.');
    }
  };

  const handleSalvar = () => {
    storageService.updateCouncilConfig({
      geolocalizacaoAtiva: config.geolocalizacaoAtiva
    });
    setHasChanges(false);
    toastService.success(
      'Configurações DEV Salvas',
      'Parâmetros do Desenvolvedor e Geolocalização GPS atualizados com sucesso.'
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-purple-500/20 text-purple-300 rounded-2xl border border-purple-400/30">
            <Code2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 font-mono">
                MÓDULO EXCLUSIVO DEV
              </span>
              {isDevUser && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Master Developer Authenticated (CPF 934.135.302-59)</span>
                </span>
              )}
            </div>
            <h1 className="text-xl font-black text-white mt-1">
              Dev &gt; Configuração de Microsserviços, Cloud & Telemetria
            </h1>
            <p className="text-xs text-purple-200 mt-0.5 max-w-2xl">
              Painel de parâmetros restrito ao Desenvolvedor Master. Controle o status global da telemetria GPS dos fiscais, modos de depuração e microsserviços.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleSalvar}
            disabled={!hasChanges}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-md ${
              hasChanges 
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/50' 
                : 'bg-white/10 text-purple-300 cursor-not-allowed opacity-60'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações DEV</span>
          </button>
        </div>
      </div>

      {/* Seção 1: Controle de Geolocalização GPS dos Fiscais */}
      <div className="bg-white rounded-2xl border border-purple-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl ${isGeoAtiva ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {isGeoAtiva ? <MapPin className="w-6 h-6" /> : <MapPinOff className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">
                  Geolocalização GPS dos Fiscais
                </h2>
                <span className={`px-2.5 py-0.5 text-xs font-extrabold rounded-full border ${
                  isGeoAtiva 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}>
                  {isGeoAtiva ? 'ATIVADA' : 'DESATIVADA'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isGeoAtiva 
                  ? 'As coordenadas de latitude e longitude são capturadas pelo tablet e registradas no banco de dados.'
                  : 'A geolocalização está oculta em toda a aplicação e receberá null no banco de dados.'
                }
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleGeolocalizacao}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-xs ${
              isGeoAtiva 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200' 
                : 'bg-slate-700 hover:bg-slate-800 text-white shadow-slate-300'
            }`}
          >
            {isGeoAtiva ? (
              <>
                <MapPin className="w-4 h-4" />
                <span>Geolocalização Ativa (Clique para Desativar)</span>
              </>
            ) : (
              <>
                <MapPinOff className="w-4 h-4" />
                <span>Geolocalização Desativada (Clique para Ativar)</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-4 p-4 bg-purple-50/70 border border-purple-200 rounded-xl flex items-start space-x-3 text-xs text-purple-900">
          <AlertCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-purple-950">Regra de Negócio DEV:</strong> Este parâmetro de GPS foi movido para o ambiente exclusivo <code>Dev &gt; Configuração</code>. Quando a geolocalização estiver <strong>Desativada</strong>, ela ficará totalmente invisível em toda a aplicação (barra de status do tablet, telas de fiscalização, detalhes do termo e PDF oficial) e o campo no banco de dados receberá explicitamente o valor <code>null</code>.
          </div>
        </div>
      </div>

      {/* Seção 2: Parâmetros Avançados de Infraestrutura & Desenvolvedor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identificação de Acesso Master */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
            <Lock className="w-5 h-5 text-purple-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Segurança & Permissão Master DEV</h2>
              <p className="text-xs text-slate-500">Credenciais e isolamento estrito de acesso</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">CPF Master Developer:</span>
                <span className="font-bold text-purple-900">934.135.302-59</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Função Atribuída:</span>
                <span className="font-bold text-emerald-700">👑 MASTER_DEVELOPER</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Isolamento no Painel Admin:</span>
                <span className="font-bold text-purple-700">Ativo (Invisível p/ Administradores Comuns)</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 leading-relaxed text-[11px]">
              <strong>Regra de Acesso Restrito:</strong> Administradores sem permissão Master DEV não conseguem visualizar, habilitar ou desabilitar o checkbox do módulo DEV no cadastro de funcionários.
            </div>
          </div>
        </div>

        {/* Status dos Microserviços Cloud */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
            <Server className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Gateway & Microserviços Cloud</h2>
              <p className="text-xs text-slate-500">Conectividade e tolerância a falhas</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-800">API Gateway Proxy</span>
              </div>
              <span className="font-mono text-emerald-700 font-bold">Port :3000</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-800">PostgreSQL / Supabase Engine</span>
              </div>
              <span className="font-mono text-emerald-700 font-bold">Conectado</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-800">IndexedDB Contingency Queue</span>
              </div>
              <span className="font-mono text-emerald-700 font-bold">Offline Sync OK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
