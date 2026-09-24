import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Coins, 
  Users, 
  FileText,
  Key,
  QrCode,
  Sliders,
  Hash,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Search,
  Loader2,
  Check,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Database,
  ExternalLink,
  Scale,
  ShieldAlert
} from 'lucide-react';
import { storageService, CouncilConfig, DEFAULT_COUNCIL_CONFIG } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { SupabaseManagerModal } from '../common/SupabaseManagerModal';
import { AssistenciaFarmaceuticaConfig } from './AssistenciaFarmaceuticaConfig';
import { ImpedimentosArtConfig } from './ImpedimentosArtConfig';
import { 
  maskCNPJ, 
  validateCNPJ, 
  maskPhone, 
  maskCEP, 
  validateCEP,
  fetchAddressByCEP,
  formatInscricaoCompleta 
} from '../../utils/documentUtils';

export const ConfiguracoesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'geral' | 'assistencia' | 'impedimentos_art'>('geral');
  const [config, setConfig] = useState<CouncilConfig>(storageService.getCouncilConfig());
  const [hasChanges, setHasChanges] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const supabaseStatus = storageService.getSupabaseStatus();

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setConfig(storageService.getCouncilConfig());
    });
    return () => {
      unsub();
    };
  }, []);

  const handleChange = (field: keyof CouncilConfig, value: any) => {
    let finalVal = value;
    if (typeof value === 'string' && field !== 'email' && field !== 'site' && field !== 'chavePix' && field !== 'sufixoInscricaoProfissional' && field !== 'sufixoInscricaoEmpresa') {
      finalVal = value.toUpperCase();
    }
    setConfig(prev => ({ ...prev, [field]: finalVal }));
    setHasChanges(true);
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCNPJ(e.target.value);
    handleChange('cnpj', masked);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhone(e.target.value);
    handleChange('telefone', masked);
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCEP(e.target.value);
    handleChange('cep', masked);

    // Auto search CEP if enabled and 8 digits typed
    if (config.autoPreencherEnderecoCEP && masked.replace(/\D/g, '').length === 8) {
      await searchCep(masked);
    }
  };

  const searchCep = async (cepToSearch?: string) => {
    const targetCep = cepToSearch || config.cep;
    if (!targetCep || targetCep.replace(/\D/g, '').length !== 8) {
      toastService.warning('CEP Incompleto', 'Digite os 8 dígitos do CEP para realizar a consulta automática.');
      return;
    }

    setIsSearchingCep(true);
    try {
      const res = await fetchAddressByCEP(targetCep);
      if (res && !res.erro) {
        setConfig(prev => ({
          ...prev,
          endereco: res.logradouro ? `${res.logradouro}${res.complemento ? ` - ${res.complemento}` : ''}` : prev.endereco,
          bairro: res.bairro || prev.bairro,
          cidadeSede: res.localidade || prev.cidadeSede,
          uf: res.uf || prev.uf
        }));
        setHasChanges(true);
        toastService.info('Endereço Preenchido', `${res.logradouro}, ${res.bairro} - ${res.localidade}/${res.uf}`);
      } else {
        toastService.warning('CEP Não Localizado', 'O CEP informado não foi encontrado na base dos Correios/ViaCEP.');
      }
    } catch (err) {
      toastService.warning('Falha na Consulta', 'Não foi possível consultar o CEP no momento.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  const isCnpjValid = validateCNPJ(config.cnpj);

  const previewInscricaoPF = formatInscricaoCompleta(
    config.prefixoInscricaoProfissional || config.sigla || 'CRF-AM',
    config.proximoNumeroInscricaoProfissional || 4150,
    config.sufixoInscricaoProfissional,
    config.digitosMinimosInscricaoProfissional ?? 4
  );

  const previewInscricaoPJ = formatInscricaoCompleta(
    config.prefixoInscricaoEmpresa || config.sigla || 'CRF-AM',
    config.proximoNumeroInscricaoEmpresa || 1250,
    config.sufixoInscricaoEmpresa,
    config.digitosMinimosInscricaoEmpresa ?? 4
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (config.validarCNPJ && config.cnpj && !isCnpjValid) {
      toastService.warning('CNPJ Inválido', 'Por favor, insira um CNPJ válido com dígitos verificadores corretos para a autarquia ou desative a validação de CNPJ.');
      return;
    }

    storageService.updateCouncilConfig(config);
    setHasChanges(false);
    toastService.success(
      'Configurações Atualizadas',
      `Os parâmetros do conselho (${config.sigla} - ${config.nomeCompleto}) foram atualizados e sincronizados em todo o sistema SIGC.`
    );
  };

  const handleReset = () => {
    if (window.confirm('Deseja restaurar as configurações padrão do conselho?')) {
      storageService.updateCouncilConfig(DEFAULT_COUNCIL_CONFIG);
      setConfig(DEFAULT_COUNCIL_CONFIG);
      setHasChanges(false);
      toastService.info(
        'Configurações Restauradas',
        'Os parâmetros retornaram aos valores padrão do sistema.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <span>CONFIGURAÇÕES GERAIS & MÓDULOS REGULATÓRIOS</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold font-mono uppercase">
                {config.sigla}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalize parâmetros da autarquia, numeração cronológica, validações de documentos e regras municipais de Assistência Farmacêutica.
            </p>
          </div>
        </div>

        {activeTab === 'geral' && (
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs border border-slate-200 transition-colors uppercase"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESTAURAR PADRÃO</span>
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-semibold text-xs shadow-xs transition-all uppercase ${
                hasChanges 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 cursor-pointer' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>SALVAR ALTERAÇÕES</span>
            </button>
          </div>
        )}
      </div>

      {/* Navegação de Módulos de Configuração */}
      <div className="flex flex-col sm:flex-row border-b border-slate-200 bg-white p-1.5 rounded-2xl border gap-2 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('geral')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-bold text-xs uppercase transition-all ${
            activeTab === 'geral'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. Dados do Conselho, Numeração & Validações</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assistencia')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-bold text-xs uppercase transition-all ${
            activeTab === 'assistencia'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-4 h-4 text-teal-300" />
          <span>2. Assistência Farmacêutica por Município</span>
          <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-200 text-[10px] font-extrabold uppercase ml-1">
            MUNICÍPIOS
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('impedimentos_art')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-bold text-xs uppercase transition-all ${
            activeTab === 'impedimentos_art'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-300" />
          <span>3. Impedimentos de ART / RT</span>
          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-200 text-[10px] font-extrabold uppercase ml-1">
            REGRAS DE RT
          </span>
        </button>
      </div>

      {activeTab === 'assistencia' ? (
        <AssistenciaFarmaceuticaConfig />
      ) : activeTab === 'impedimentos_art' ? (
        <ImpedimentosArtConfig />
      ) : (
      <form onSubmit={handleSave} className="space-y-6">
        {/* Bloco 1: Numeração Cronológica Automática de Inscrições */}
        <div className="bg-white border-2 border-purple-200 bg-gradient-to-br from-white via-purple-50/20 to-purple-100/30 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <span>1. Numeração Cronológica, Zeros à Esquerda e Sufixos Opcionais</span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold">GERAÇÃO AUTOMÁTICA</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Configure prefixo, próximo sequencial, quantidade de dígitos (zeros à esquerda) e sufixos opcionais para PF e PJ. Se o sufixo ficar vazio, nada será exibido.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            {/* Bloco PF */}
            <div className="bg-white border border-purple-200/80 rounded-xl p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5 uppercase">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Inscrição de Profissionais (Pessoa Física - PF)</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md">
                  PF SEQUENCIAL
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase text-[10px]">
                    Prefixo:
                  </label>
                  <input
                    type="text"
                    value={config.prefixoInscricaoProfissional}
                    onChange={(e) => handleChange('prefixoInscricaoProfissional', e.target.value)}
                    placeholder="CRF-AM"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase text-[10px]">
                    Próximo Número *:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={config.proximoNumeroInscricaoProfissional}
                    onChange={(e) => handleChange('proximoNumeroInscricaoProfissional', parseInt(e.target.value, 10) || 1)}
                    className="w-full px-2.5 py-2 bg-purple-50/60 border border-purple-300 rounded-xl text-purple-900 font-mono font-bold text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase text-[10px]">
                    Zeros à Esquerda:
                  </label>
                  <select
                    value={config.digitosMinimosInscricaoProfissional ?? 4}
                    onChange={(e) => handleChange('digitosMinimosInscricaoProfissional', parseInt(e.target.value, 10))}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold text-[11px] uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={0}>SEM ZEROS (4150)</option>
                    <option value={4}>4 DÍGITOS (0150)</option>
                    <option value={5}>5 DÍGITOS (04150)</option>
                    <option value={6}>6 DÍGITOS (004150)</option>
                    <option value={7}>7 DÍGITOS (0004150)</option>
                    <option value={8}>8 DÍGITOS (00004150)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase text-[10px]">
                    Sufixo (Opcional):
                  </label>
                  <input
                    type="text"
                    value={config.sufixoInscricaoProfissional || ''}
                    onChange={(e) => handleChange('sufixoInscricaoProfissional', e.target.value.toUpperCase())}
                    placeholder="Vazio (nenhum)"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 text-xs"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wide block">Prévia da Próxima Inscrição PF:</span>
                  <span className="text-sm font-mono font-extrabold text-purple-900">{previewInscricaoPF}</span>
                </div>
                <div className="text-[10px] text-purple-600 bg-white px-2 py-1 rounded-lg border border-purple-200 font-semibold uppercase">
                  Incremento Automático (+1)
                </div>
              </div>
            </div>

            {/* Bloco PJ */}
            <div className="bg-white border border-blue-200/80 rounded-xl p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5 uppercase">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Inscrição de Empresas / Firmas (Pessoa Jurídica - PJ)</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                  PJ SEQUENCIAL
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase text-[10px]">
                    Prefixo:
                  </label>
                  <input
                    type="text"
                    value={config.prefixoInscricaoEmpresa}
                    onChange={(e) => handleChange('prefixoInscricaoEmpresa', e.target.value)}
                    placeholder="CRF-AM"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase text-[10px]">
                    Próximo Número *:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={config.proximoNumeroInscricaoEmpresa}
                    onChange={(e) => handleChange('proximoNumeroInscricaoEmpresa', parseInt(e.target.value, 10) || 1)}
                    className="w-full px-2.5 py-2 bg-blue-50/60 border border-blue-300 rounded-xl text-blue-900 font-mono font-bold text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase text-[10px]">
                    Zeros à Esquerda:
                  </label>
                  <select
                    value={config.digitosMinimosInscricaoEmpresa ?? 4}
                    onChange={(e) => handleChange('digitosMinimosInscricaoEmpresa', parseInt(e.target.value, 10))}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold text-[11px] uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>SEM ZEROS (1250)</option>
                    <option value={4}>4 DÍGITOS (0250)</option>
                    <option value={5}>5 DÍGITOS (01250)</option>
                    <option value={6}>6 DÍGITOS (001250)</option>
                    <option value={7}>7 DÍGITOS (0001250)</option>
                    <option value={8}>8 DÍGITOS (00001250)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase text-[10px]">
                    Sufixo (Opcional):
                  </label>
                  <input
                    type="text"
                    value={config.sufixoInscricaoEmpresa || ''}
                    onChange={(e) => handleChange('sufixoInscricaoEmpresa', e.target.value.toUpperCase())}
                    placeholder="Ex: -PJ ou vazio"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wide block">Prévia da Próxima Inscrição PJ:</span>
                  <span className="text-sm font-mono font-extrabold text-blue-900">{previewInscricaoPJ}</span>
                </div>
                <div className="text-[10px] text-blue-600 bg-white px-2 py-1 rounded-lg border border-blue-200 font-semibold uppercase">
                  Incremento Automático (+1)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 2: Controle de Validações & Preenchimento de CEP */}
        <div className="bg-white border-2 border-emerald-200 bg-gradient-to-br from-white via-emerald-50/20 to-emerald-100/30 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-emerald-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <span>2. Parâmetros de Validação Cadastral & Automação Via CEP</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">CONTROLE DE REGRAS</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Ative ou desative as validações matemáticas oficiais de documentos (CPF, CNPJ e CEP) e o preenchimento automático de endereços nos cadastros.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1 text-xs">
            {/* Toggle Validação CPF */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 uppercase text-[11px]">VALIDAÇÃO DE CPF</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${config.validarCPF ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {config.validarCPF ? 'ATIVADA' : 'DESATIVADA'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Aplica cálculo oficial de dígitos verificadores (Módulo 11) para CPF no cadastro de profissionais.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('validarCPF', !config.validarCPF)}
                className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all uppercase ${
                  config.validarCPF
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                }`}
              >
                {config.validarCPF ? <Check className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                <span>{config.validarCPF ? 'VALIDAR CPF (ATIVO)' : 'IGNORAR VALIDAÇÃO'}</span>
              </button>
            </div>

            {/* Toggle Validação CNPJ */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 uppercase text-[11px]">VALIDAÇÃO DE CNPJ</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${config.validarCNPJ ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {config.validarCNPJ ? 'ATIVADA' : 'DESATIVADA'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Verifica os dígitos verificadores do CNPJ no cadastro de empresas e estabelecimentos farmacêuticos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('validarCNPJ', !config.validarCNPJ)}
                className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all uppercase ${
                  config.validarCNPJ
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                }`}
              >
                {config.validarCNPJ ? <Check className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                <span>{config.validarCNPJ ? 'VALIDAR CNPJ (ATIVO)' : 'IGNORAR VALIDAÇÃO'}</span>
              </button>
            </div>

            {/* Toggle Validação CEP */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 uppercase text-[11px]">VALIDAÇÃO DE CEP</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${config.validarCEP ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {config.validarCEP ? 'ATIVADA' : 'DESATIVADA'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Exige formato válido de 8 dígitos de Código de Endereçamento Postal nos formulários de endereço.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('validarCEP', !config.validarCEP)}
                className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all uppercase ${
                  config.validarCEP
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                }`}
              >
                {config.validarCEP ? <Check className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                <span>{config.validarCEP ? 'VALIDAR CEP (ATIVO)' : 'IGNORAR VALIDAÇÃO'}</span>
              </button>
            </div>

            {/* Toggle Preenchimento Automático ViaCEP */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 uppercase text-[11px]">BUSCA AUTOMÁTICA CEP</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${config.autoPreencherEnderecoCEP ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {config.autoPreencherEnderecoCEP ? 'INTEGRADO' : 'MANUAL'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Ao digitar o CEP nos cadastros, preenche logradouro, bairro, cidade e UF automaticamente.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('autoPreencherEnderecoCEP', !config.autoPreencherEnderecoCEP)}
                className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all uppercase ${
                  config.autoPreencherEnderecoCEP
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                }`}
              >
                {config.autoPreencherEnderecoCEP ? <Sparkles className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                <span>{config.autoPreencherEnderecoCEP ? 'VIACEP AUTO (ATIVO)' : 'PREENCHIMENTO MANUAL'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bloco 3: Identificação Institucional */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              3. IDENTIFICAÇÃO INSTITUCIONAL DA AUTARQUIA
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
            <div className="md:col-span-8">
              <label className="block text-slate-700 font-semibold mb-1 uppercase">
                Razão Social / Nome Completo do Conselho de Classe *
              </label>
              <input
                type="text"
                required
                value={config.nomeCompleto}
                onChange={(e) => handleChange('nomeCompleto', e.target.value)}
                placeholder="CONSELHO REGIONAL DE FARMÁCIA DO ESTADO DO AMAZONAS"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium uppercase"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-slate-700 font-semibold mb-1 uppercase">
                Sigla Oficial *
              </label>
              <input
                type="text"
                required
                value={config.sigla}
                onChange={(e) => handleChange('sigla', e.target.value)}
                placeholder="CRF-AM"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono font-bold uppercase"
              />
            </div>

            <div className="md:col-span-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-semibold uppercase">
                  CNPJ da Autarquia *
                </label>
                {config.cnpj && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                    !config.validarCNPJ 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : isCnpjValid 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {!config.validarCNPJ ? 'VALIDAÇÃO DESATIVADA' : isCnpjValid ? '✓ CNPJ VÁLIDO' : '✕ CNPJ INVÁLIDO'}
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={config.cnpj || ''}
                onChange={handleCnpjChange}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 transition-all font-mono font-bold ${
                  config.validarCNPJ && config.cnpj && !isCnpjValid ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                }`}
              />
            </div>

            <div className="md:col-span-5">
              <label className="block text-slate-700 font-semibold mb-1 uppercase">
                Jurisdição Territorial
              </label>
              <input
                type="text"
                value={config.jurisdicao}
                onChange={(e) => handleChange('jurisdicao', e.target.value)}
                placeholder="AMAZONAS E RORAIMA"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all uppercase"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-slate-700 font-semibold mb-1 uppercase">
                UF Sede
              </label>
              <input
                type="text"
                maxLength={2}
                value={config.uf}
                onChange={(e) => handleChange('uf', e.target.value.toUpperCase())}
                placeholder="AM"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono font-bold uppercase"
              />
            </div>
          </div>
        </div>

        {/* Bloco 4: Endereço & Sede com Busca ViaCEP */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                4. ENDEREÇO DA SEDE & LOCALIZAÇÃO
              </h2>
            </div>
            {config.autoPreencherEnderecoCEP && (
              <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-bold uppercase">
                Preenchimento Automático por CEP Habilitado
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
            {/* CEP com Busca */}
            <div className="md:col-span-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-semibold uppercase">
                  CEP da Sede *
                </label>
                {config.cep && (
                  <span className="text-[9px] font-mono text-slate-400">
                    {validateCEP(config.cep) ? '8 DÍGITOS' : 'INCOMPLETO'}
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  maxLength={9}
                  value={config.cep || ''}
                  onChange={handleCepChange}
                  placeholder="00000-000"
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono font-bold uppercase"
                />
                <button
                  type="button"
                  onClick={() => searchCep()}
                  disabled={isSearchingCep}
                  className="px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold flex items-center space-x-1 transition-colors uppercase disabled:opacity-50"
                  title="BUSCAR ENDEREÇO VIA CEP"
                >
                  {isSearchingCep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span className="hidden sm:inline text-[10px]">BUSCAR</span>
                </button>
              </div>
            </div>

            <div className="md:col-span-8">
              <label className="block text-slate-700 font-semibold mb-1 uppercase">
                Logradouro e Número *
              </label>
              <input
                type="text"
                value={config.endereco || ''}
                onChange={(e) => handleChange('endereco', e.target.value)}
                placeholder="RUA RIO JUTAÍ, Nº 670, CONJUNTO VIEIRALVES"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all uppercase"
              />
            </div>

            <div className="md:col-span-5">
              <label className="block text-slate-700 font-semibold mb-1 uppercase">
                Bairro
              </label>
              <input
                type="text"
                value={config.bairro || ''}
                onChange={(e) => handleChange('bairro', e.target.value)}
                placeholder="NOSSA SENHORA DAS GRAÇAS"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all uppercase"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-slate-700 font-semibold mb-1 uppercase">
                Cidade Sede
              </label>
              <input
                type="text"
                value={config.cidadeSede}
                onChange={(e) => handleChange('cidadeSede', e.target.value)}
                placeholder="MANAUS"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all uppercase"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-slate-700 font-semibold mb-1 uppercase">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                maxLength={15}
                value={config.telefone || ''}
                onChange={handlePhoneChange}
                placeholder="(92) 3622-1088"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Bloco 5: Contatos e Diretoria */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contatos */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <Mail className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                5. CANAIS DE ATENDIMENTO
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase">E-mail Institucional</label>
                <input
                  type="email"
                  value={config.email || ''}
                  onChange={(e) => handleChange('email', e.target.value.toUpperCase())}
                  placeholder="CONTATO@CRF-AM.ORG.BR"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase">Portal Oficial / Website</label>
                <input
                  type="text"
                  value={config.site || ''}
                  onChange={(e) => handleChange('site', e.target.value.toUpperCase())}
                  placeholder="HTTPS://CRF-AM.ORG.BR"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all uppercase font-mono"
                />
              </div>
            </div>
          </div>

          {/* Diretoria Executiva */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                6. DIRETORIA & ASSINATURAS OFICIAIS
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase">Nome do(a) Presidente do Conselho</label>
                <input
                  type="text"
                  value={config.presidente}
                  onChange={(e) => handleChange('presidente', e.target.value)}
                  placeholder="DRA. LUANA SANTANA DA SILVA"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase">Nome do(a) Diretor(a) Tesoureiro(a)</label>
                <input
                  type="text"
                  value={config.tesoureiro}
                  onChange={(e) => handleChange('tesoureiro', e.target.value)}
                  placeholder="DR. VALTER SILVEIRA GOMES"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase">Nome do(a) Secretário(a)-Geral</label>
                <input
                  type="text"
                  value={config.secretarioGeral || ''}
                  onChange={(e) => handleChange('secretarioGeral', e.target.value)}
                  placeholder="DR. JORGE CAVALCANTE RAMOS"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 6: Parâmetros Financeiros & Anuidade */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <Coins className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              7. PARÂMETROS DE COBRANÇA & RESOLUÇÃO DE ANUIDADES
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1 uppercase">
                Resolução Federal Vigente de Anuidades
              </label>
              <input
                type="text"
                value={config.resolucaoAnuidade || ''}
                onChange={(e) => handleChange('resolucaoAnuidade', e.target.value)}
                placeholder="RESOLUÇÃO CFF Nº 750/2025"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all uppercase font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 uppercase">
                Anuidade Integral PF (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={config.valorAnuidadePF || 620}
                onChange={(e) => handleChange('valorAnuidadePF', parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 uppercase">
                Anuidade Integral PJ (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={config.valorAnuidadePJ || 1240}
                onChange={(e) => handleChange('valorAnuidadePJ', parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono font-bold"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-slate-700 font-semibold mb-1 uppercase">
                Chave Pix Oficial para Arrecadação de Anuidades
              </label>
              <input
                type="text"
                value={config.chavePix || ''}
                onChange={(e) => handleChange('chavePix', e.target.value.toUpperCase())}
                placeholder="FINANCEIRO@CRF-AM.ORG.BR"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono uppercase font-bold"
              />
            </div>
          </div>
        </div>

        {/* Bloco 8: Banco de Dados Supabase (PostgreSQL) */}
        <div className="bg-linear-to-br from-slate-900 via-teal-950 to-slate-900 border border-emerald-500/30 text-white rounded-2xl p-5 md:p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center space-x-2">
                  <span>8. BANCO DE DADOS SUPABASE (POSTGRESQL CLOUD)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                    PRODUÇÃO
                  </span>
                </h2>
                <p className="text-[11px] text-slate-300">
                  Gerenciamento da infraestrutura PostgreSQL, DDL de tabelas, sincronização e migração de registros do conselho.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSupabaseModalOpen(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span>Gerenciar Banco & Migração</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1">
              <div className="text-slate-400 font-semibold uppercase text-[10px]">Status da Conexão</div>
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{supabaseStatus.connected ? 'Conectado ao Cluster Supabase' : 'Aguardando Sincronização'}</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1">
              <div className="text-slate-400 font-semibold uppercase text-[10px]">Endpoint do Projeto</div>
              <div className="font-mono text-slate-200 truncate" title="https://ajcdrtsdozbjvsdyhdly.supabase.co">
                https://ajcdrtsdozbjvsdyhdly.supabase.co
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1">
              <div className="text-slate-400 font-semibold uppercase text-[10px]">Tabelas Integradas</div>
              <div className="font-semibold text-slate-200">
                10 Tabelas com RLS & Triggers
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors uppercase"
          >
            DESCARTAR
          </button>
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all uppercase"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>SALVAR TODAS AS CONFIGURAÇÕES</span>
          </button>
        </div>
      </form>
      )}

      <SupabaseManagerModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
};
