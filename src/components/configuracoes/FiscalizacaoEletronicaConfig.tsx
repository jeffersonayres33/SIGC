import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Save, 
  RotateCcw, 
  ShieldCheck, 
  Tablet, 
  Hash, 
  AlertCircle,
  MapPin,
  MapPinOff,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { storageService, CouncilConfig, DEFAULT_COUNCIL_CONFIG } from '../../services/storageService';
import { toastService } from '../../services/toastService';

export const FiscalizacaoEletronicaConfig: React.FC = () => {
  const [config, setConfig] = useState<CouncilConfig>(storageService.getCouncilConfig());
  const [hasChanges, setHasChanges] = useState(false);

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

  const handleTextoChange = (val: string) => {
    setConfig(prev => ({ ...prev, textoPadraoNotificacao: val }));
    setHasChanges(true);
  };

  const handleNumeroNotificacaoChange = (val: number) => {
    setConfig(prev => ({ ...prev, proximoNumeroNotificacao: Math.max(1, val) }));
    setHasChanges(true);
  };

  const handleNumeroIntimacaoChange = (val: number) => {
    setConfig(prev => ({ ...prev, proximoNumeroIntimacao: Math.max(1, val) }));
    setHasChanges(true);
  };

  const handleNumeroTermoChange = (val: number) => {
    setConfig(prev => ({ ...prev, proximoNumeroTermo: Math.max(1, val) }));
    setHasChanges(true);
  };

  const handleNumeroAutuacaoChange = (val: number) => {
    setConfig(prev => ({ ...prev, proximoNumeroAutuacao: Math.max(1, val) }));
    setHasChanges(true);
  };

  const handleRestaurarPadrao = () => {
    if (window.confirm('Deseja restaurar o texto padrão oficial da Notificação Fiscal?')) {
      const padrao = DEFAULT_COUNCIL_CONFIG.textoPadraoNotificacao || '';
      setConfig(prev => ({ ...prev, textoPadraoNotificacao: padrao }));
      setHasChanges(true);
      toastService.info('Texto Restaurado', 'Texto padrão oficial da Lei 3.820/1960 reaplicado.');
    }
  };

  const handleSalvar = () => {
    storageService.updateCouncilConfig({
      textoPadraoNotificacao: config.textoPadraoNotificacao,
      proximoNumeroNotificacao: config.proximoNumeroNotificacao,
      proximoNumeroIntimacao: config.proximoNumeroIntimacao,
      proximoNumeroTermo: config.proximoNumeroTermo,
      proximoNumeroAutuacao: config.proximoNumeroAutuacao,
      geolocalizacaoAtiva: config.geolocalizacaoAtiva
    });
    setHasChanges(false);
    toastService.success(
      'Configurações Salvas',
      'Parâmetros da Fiscalização Eletrônica atualizados com sucesso.'
    );
  };

  const currentYear = new Date().getFullYear();
  const nextNotificacaoFormatted = `NOT-${currentYear}-${String(config.proximoNumeroNotificacao || 1).padStart(5, '0')}`;
  const nextIntimacaoFormatted = `INT-${currentYear}-${String(config.proximoNumeroIntimacao || 1).padStart(5, '0')}`;
  const nextTermoFormatted = `TI-${currentYear}-${String(config.proximoNumeroTermo || 1).padStart(5, '0')}`;
  const nextAutuacaoFormatted = `AI-${currentYear}-${String(config.proximoNumeroAutuacao || 1).padStart(5, '0')}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
            <Tablet className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Módulo Fiscais de Campo (Tablet & Offline)
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-1">
              Configuração da Fiscalização Eletrônica
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Defina os parâmetros de geolocalização, textos regulatórios e gerencie os sequenciais numéricos únicos.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleRestaurarPadrao}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Restaurar Texto Padrão</span>
          </button>

          <button
            type="button"
            onClick={handleSalvar}
            disabled={!hasChanges}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-xs ${
              hasChanges 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>

      {/* Seção 1: Controle de Geolocalização */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${isGeoAtiva ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {isGeoAtiva ? <MapPin className="w-6 h-6" /> : <MapPinOff className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Geolocalização GPS dos Fiscais
                </h2>
                <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border ${
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

        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-2.5 text-xs text-slate-600">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-slate-900">Regra de Negócio:</strong> Quando a geolocalização estiver <strong>Desativada</strong>, ela ficará totalmente invisível em toda a aplicação (barra de status do tablet, telas de fiscalização, detalhes do termo e PDF oficial) e o campo no banco de dados receberá explicitamente o valor <code>null</code>.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Editor do Texto Padrão da Notificação */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center space-x-2.5">
              <FileText className="w-5 h-5 text-amber-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Texto Padrão da Notificação
                </h2>
                <p className="text-xs text-slate-400">
                  Este texto surgirá automaticamente no tablet quando o fiscal marcar "Lavrar Notificação".
                </p>
              </div>
            </div>

            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              Editável pelo Administrador
            </span>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Teor Regulatório Oficial da Notificação:
            </label>
            <textarea
              rows={6}
              value={config.textoPadraoNotificacao || ''}
              onChange={(e) => handleTextoChange(e.target.value)}
              placeholder="Insira o texto oficial da notificação..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed shadow-inner"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Base legal: Lei Federal nº 3.820/1960 e Resoluções CFF vigentes</span>
              </span>
              <span>{(config.textoPadraoNotificacao || '').length} caracteres</span>
            </div>
          </div>
        </div>

        {/* Numeração Cronológica Sequencial */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 mb-4">
            <Hash className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Numeração Sequencial Única (Anti-Duplicidade)
              </h2>
              <p className="text-xs text-slate-400">
                Controladores de sequência numérica anual para Notificações, Intimações, Termos e Autos.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Notificação Sequencial */}
            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">NOTIFICAÇÃO</span>
                <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                  Prefixo NOT-{currentYear}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Próximo Número:
                </label>
                <input
                  type="number"
                  min={1}
                  value={config.proximoNumeroNotificacao || 1}
                  onChange={(e) => handleNumeroNotificacaoChange(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-500">Próximo:</span>
                <span className="font-mono font-bold text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200">
                  {nextNotificacaoFormatted}
                </span>
              </div>
            </div>

            {/* Intimação Sequencial */}
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900">INTIMAÇÃO</span>
                <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  Prefixo INT-{currentYear}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Próximo Número:
                </label>
                <input
                  type="number"
                  min={1}
                  value={config.proximoNumeroIntimacao || 1}
                  onChange={(e) => handleNumeroIntimacaoChange(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-500">Próximo:</span>
                <span className="font-mono font-bold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200">
                  {nextIntimacaoFormatted}
                </span>
              </div>
            </div>

            {/* Termo de Inspeção Sequencial */}
            <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900">TERMO DE INSPEÇÃO</span>
                <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                  Prefixo TI-{currentYear}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Próximo Número:
                </label>
                <input
                  type="number"
                  min={1}
                  value={config.proximoNumeroTermo || 1}
                  onChange={(e) => handleNumeroTermoChange(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-500">Próximo:</span>
                <span className="font-mono font-bold text-purple-800 bg-white px-2 py-0.5 rounded border border-purple-200">
                  {nextTermoFormatted}
                </span>
              </div>
            </div>

            {/* Auto de Infração Sequencial */}
            <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900">AUTO DE INFRAÇÃO</span>
                <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                  Prefixo AI-{currentYear}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Próximo Número:
                </label>
                <input
                  type="number"
                  min={1}
                  value={config.proximoNumeroAutuacao || 1}
                  onChange={(e) => handleNumeroAutuacaoChange(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-500">Próximo:</span>
                <span className="font-mono font-bold text-rose-800 bg-white px-2 py-0.5 rounded border border-rose-200">
                  {nextAutuacaoFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Aviso Anti-Duplicidade */}
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-2.5 text-xs text-slate-600">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Garantia de Não-Duplicidade:</strong> O sistema verifica em tempo real
              a existência de números na base de dados central e na fila de contingência offline de cada tablet.
              Nenhum número de notificação ou intimação é reutilizado ou sobrescrito durante a sincronização.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
