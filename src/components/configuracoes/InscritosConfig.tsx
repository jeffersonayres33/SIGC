import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  ShieldCheck, 
  Eye, 
  Edit3, 
  Trash2, 
  Save, 
  RotateCcw, 
  Check, 
  Lock, 
  Unlock, 
  FileCheck2, 
  FileText, 
  CreditCard, 
  QrCode, 
  BadgeCheck, 
  IdCard, 
  Layers, 
  CheckCircle2, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { storageService, CouncilConfig, DEFAULT_ACESSOS_INSCRITO_PF, DEFAULT_ACESSOS_INSCRITO_PJ } from '../../services/storageService';
import { RegraAcessoInscrito, PermissoesAcoesModulo } from '../../types';
import { toastService } from '../../services/toastService';

interface InscritosConfigProps {
  initialSubTab?: 'PF' | 'PJ';
}

const MODULOS_INSCRITO = [
  { 
    id: 'portal_inscrito', 
    nome: 'Portal do Inscrito (Autoatendimento)', 
    descricao: 'Acesso principal ao painel de certidões, financeiro e dados cadastrais',
    icon: IdCard
  },
  { 
    id: 'profissionais', 
    nome: 'Cadastro de Profissionais (PF)', 
    descricao: 'Visualização da ficha cadastral, histórico e habilitações do inscrito',
    icon: User
  },
  { 
    id: 'empresas', 
    nome: 'Cadastro de Empresas (PJ)', 
    descricao: 'Visualização de estabelecimentos, filiais, sócios e vínculos de RT',
    icon: Building2
  },
  { 
    id: 'protocolos', 
    nome: 'Protocolos & Requerimentos', 
    descricao: 'Abertura, acompanhamento e envio de petições e documentos ao conselho',
    icon: FileText
  },
  { 
    id: 'financeiro', 
    nome: 'Financeiro & Anuidades', 
    descricao: 'Emissão de boletos, guias Pix, extrato e histórico financeiro',
    icon: CreditCard
  },
  { 
    id: 'formularios', 
    nome: 'Formulários & Declarações Eletrônicas', 
    descricao: 'Preenchimento e assinatura digital de formulários normativos',
    icon: FileCheck2
  },
  { 
    id: 'dashboard', 
    nome: 'Painel Informativo Resumido', 
    descricao: 'Métricas, notícias e comunicados da autarquia para o inscrito',
    icon: Layers
  }
];

export const InscritosConfig: React.FC<InscritosConfigProps> = ({ initialSubTab = 'PF' }) => {
  const [subTab, setSubTab] = useState<'PF' | 'PJ'>(initialSubTab);
  const [regraPF, setRegraPF] = useState<RegraAcessoInscrito>(() => storageService.getAcessosInscritoPF());
  const [regraPJ, setRegraPJ] = useState<RegraAcessoInscrito>(() => storageService.getAcessosInscritoPJ());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setRegraPF(storageService.getAcessosInscritoPF());
      setRegraPJ(storageService.getAcessosInscritoPJ());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const activeRegra = subTab === 'PF' ? regraPF : regraPJ;
  const setActiveRegra = (updater: (prev: RegraAcessoInscrito) => RegraAcessoInscrito) => {
    if (subTab === 'PF') {
      setRegraPF(updater);
    } else {
      setRegraPJ(updater);
    }
    setHasChanges(true);
  };

  const handleToggleModulo = (moduloId: string) => {
    setActiveRegra(prev => {
      const exists = prev.modulosPermitidos.includes(moduloId);
      let newModulos: string[];
      let newAcoes = { ...prev.permissoesAcoes };

      if (exists) {
        newModulos = prev.modulosPermitidos.filter(m => m !== moduloId);
        newAcoes[moduloId] = { visualizar: false, editar: false, deletar: false };
      } else {
        newModulos = [...prev.modulosPermitidos, moduloId];
        newAcoes[moduloId] = newAcoes[moduloId] || { visualizar: true, editar: true, deletar: false };
        if (!newAcoes[moduloId].visualizar) {
          newAcoes[moduloId].visualizar = true;
        }
      }

      return {
        ...prev,
        modulosPermitidos: newModulos,
        permissoesAcoes: newAcoes
      };
    });
  };

  const handleToggleAcao = (moduloId: string, acao: 'visualizar' | 'editar' | 'deletar', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveRegra(prev => {
      const currentAcoes = prev.permissoesAcoes[moduloId] || { visualizar: false, editar: false, deletar: false };
      const nextVal = !currentAcoes[acao];
      const updatedAcao: PermissoesAcoesModulo = {
        ...currentAcoes,
        [acao]: nextVal
      };

      // Se ativou editar ou deletar, obrigatoriamente ativa visualizar
      if ((acao === 'editar' || acao === 'deletar') && nextVal) {
        updatedAcao.visualizar = true;
      }
      // Se desativou visualizar, desativa editar e deletar também
      if (acao === 'visualizar' && !nextVal) {
        updatedAcao.editar = false;
        updatedAcao.deletar = false;
      }

      // Se nenhuma ação ficou marcada, remove dos módulos permitidos
      const hasAny = updatedAcao.visualizar || updatedAcao.editar || updatedAcao.deletar;
      let nextModulos = [...prev.modulosPermitidos];
      if (hasAny && !nextModulos.includes(moduloId)) {
        nextModulos.push(moduloId);
      } else if (!hasAny && nextModulos.includes(moduloId)) {
        nextModulos = nextModulos.filter(m => m !== moduloId);
      }

      return {
        ...prev,
        modulosPermitidos: nextModulos,
        permissoesAcoes: {
          ...prev.permissoesAcoes,
          [moduloId]: updatedAcao
        }
      };
    });
  };

  const handlePresetAcoes = (preset: 'somente_leitura' | 'leitura_edicao' | 'acesso_total' | 'limpar') => {
    setActiveRegra(prev => {
      const newAcoes: Record<string, PermissoesAcoesModulo> = {};
      let newModulos: string[] = [];

      MODULOS_INSCRITO.forEach(mod => {
        if (preset === 'somente_leitura') {
          newAcoes[mod.id] = { visualizar: true, editar: false, deletar: false };
          newModulos.push(mod.id);
        } else if (preset === 'leitura_edicao') {
          newAcoes[mod.id] = { visualizar: true, editar: true, deletar: false };
          newModulos.push(mod.id);
        } else if (preset === 'acesso_total') {
          newAcoes[mod.id] = { visualizar: true, editar: true, deletar: true };
          newModulos.push(mod.id);
        } else {
          newAcoes[mod.id] = { visualizar: false, editar: false, deletar: false };
        }
      });

      return {
        ...prev,
        modulosPermitidos: newModulos,
        permissoesAcoes: newAcoes
      };
    });
  };

  const handleToggleRecurso = (recursoKey: string) => {
    setActiveRegra(prev => ({
      ...prev,
      recursosPermitidos: {
        ...prev.recursosPermitidos,
        [recursoKey]: !prev.recursosPermitidos[recursoKey]
      }
    }));
  };

  const handleSave = () => {
    if (subTab === 'PF') {
      storageService.updateAcessosInscritoPF(regraPF);
      toastService.success(
        'Permissões PF Atualizadas',
        'As regras de acesso para Inscritos Pessoa Física (PF) foram salvas e sincronizadas com sucesso.'
      );
    } else {
      storageService.updateAcessosInscritoPJ(regraPJ);
      toastService.success(
        'Permissões PJ Atualizadas',
        'As regras de acesso para Inscritos Pessoa Jurídica (PJ) foram salvas e sincronizadas com sucesso.'
      );
    }
    setHasChanges(false);
  };

  const handleResetToDefault = () => {
    if (window.confirm(`Deseja restaurar as permissões padrão para ${subTab === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}?`)) {
      if (subTab === 'PF') {
        storageService.updateAcessosInscritoPF(DEFAULT_ACESSOS_INSCRITO_PF);
        setRegraPF(DEFAULT_ACESSOS_INSCRITO_PF);
      } else {
        storageService.updateAcessosInscritoPJ(DEFAULT_ACESSOS_INSCRITO_PJ);
        setRegraPJ(DEFAULT_ACESSOS_INSCRITO_PJ);
      }
      setHasChanges(false);
      toastService.info('Restaurado Padrão', 'As permissões retornaram aos padrões regulatórios do conselho.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Exclusivo da Categoria Selecionada via Menu */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-800">
              Painel do Administrador
            </span>
            <span className="text-slate-400">/</span>
            <span className="text-xs font-bold text-slate-600 uppercase">Configuração</span>
            <span className="text-slate-400">/</span>
            <span className="text-xs font-black text-indigo-700 uppercase">Inscrito</span>
            <span className="text-slate-400">/</span>
            <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-md ${
              subTab === 'PF' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-teal-100 text-teal-800 border border-teal-300'
            }`}>
              {subTab === 'PF' ? 'Pessoa Física (PF)' : 'Pessoa Jurídica (PJ)'}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight flex items-center gap-2">
            {subTab === 'PF' ? (
              <User className="w-6 h-6 text-emerald-600" />
            ) : (
              <Building2 className="w-6 h-6 text-teal-600" />
            )}
            <span>
              Configuração de Acessos & Permissões — Inscrito {subTab === 'PF' ? 'Pessoa Física (PF)' : 'Pessoa Jurídica (PJ)'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {subTab === 'PF'
              ? 'Defina com precisão quais módulos e ações (Visualizar, Editar, Deletar) os Farmacêuticos e Técnicos poderão executar na plataforma.'
              : 'Defina com precisão quais módulos e ações (Visualizar, Editar, Deletar) as Farmácias, Drogarias e Estabelecimentos poderão executar na plataforma.'}
          </p>
        </div>

        {/* Botões Salvar e Reset */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-colors uppercase cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Padrão Regulatório</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all uppercase ${
              hasChanges 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 cursor-pointer' 
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Acessos {subTab}</span>
          </button>
        </div>
      </div>

      {/* Chave Mestre de Acesso ao Portal */}
      <div className={`p-4 rounded-2xl border transition-all ${
        activeRegra.permiteAcessoAoPortal
          ? 'bg-linear-to-r from-emerald-50 via-teal-50 to-white border-emerald-300'
          : 'bg-rose-50/70 border-rose-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
              activeRegra.permiteAcessoAoPortal ? 'bg-emerald-600' : 'bg-rose-600'
            }`}>
              {activeRegra.permiteAcessoAoPortal ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 uppercase flex items-center gap-2">
                <span>Acesso ao Sistema Liberado para {subTab === 'PF' ? 'Profissionais (Pessoa Física)' : 'Empresas (Pessoa Jurídica)'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                  activeRegra.permiteAcessoAoPortal ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {activeRegra.permiteAcessoAoPortal ? 'PORTAL HABILITADO' : 'PORTAL BLOQUEADO'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {activeRegra.permiteAcessoAoPortal
                  ? `Inscritos ${subTab} podem realizar primeiro acesso, criar senha e acessar o autoatendimento.`
                  : `O acesso via login para ${subTab} está temporariamente desativado por política da diretoria.`}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={activeRegra.permiteAcessoAoPortal}
              onChange={(e) => setActiveRegra(prev => ({ ...prev, permiteAcessoAoPortal: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>

      {/* Seção 1: Módulos Permitidos na Plataforma com Granularidade (Visualizar, Editar, Deletar) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Módulos Permitidos na Plataforma & Ações Detalhadas
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Marque o módulo para liberar o acesso e selecione os níveis de privilégio: <strong>Visualizar (👁️)</strong>, <strong>Editar (✏️)</strong> ou <strong>Deletar (🗑️)</strong>.
            </p>
          </div>

          {/* Atalhos Rápidos de Ações */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs font-bold">
            <span className="text-slate-400 text-[11px] uppercase mr-1">Atalhos:</span>
            <button
              type="button"
              onClick={() => handlePresetAcoes('somente_leitura')}
              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[11px] cursor-pointer"
              title="Apenas Visualizar em todos os módulos"
            >
              👁️ Apenas Visualizar
            </button>
            <button
              type="button"
              onClick={() => handlePresetAcoes('leitura_edicao')}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] cursor-pointer"
              title="Visualizar e Editar em todos os módulos"
            >
              ✏️ Leitura e Edição
            </button>
            <button
              type="button"
              onClick={() => handlePresetAcoes('acesso_total')}
              className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-[11px] cursor-pointer"
              title="Acesso total (Visualizar, Editar, Deletar)"
            >
              ⚡ Acesso Total
            </button>
            <button
              type="button"
              onClick={() => handlePresetAcoes('limpar')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 text-[11px] cursor-pointer"
              title="Remover todos os módulos"
            >
              🚫 Limpar
            </button>
          </div>
        </div>

        {/* Tabela / Grid Granular dos Módulos */}
        <div className="grid grid-cols-1 gap-3">
          {MODULOS_INSCRITO.map(mod => {
            const isModuloAtivo = activeRegra.modulosPermitidos.includes(mod.id);
            const acoes = activeRegra.permissoesAcoes[mod.id] || {
              visualizar: isModuloAtivo,
              editar: isModuloAtivo,
              deletar: false
            };
            const ModIcon = mod.icon;

            return (
              <div
                key={mod.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isModuloAtivo
                    ? 'bg-slate-50/80 border-indigo-200 shadow-2xs'
                    : 'bg-white border-slate-200 opacity-75 hover:opacity-100'
                }`}
              >
                {/* Checkbox Mestre & Descrição do Módulo */}
                <div 
                  onClick={() => handleToggleModulo(mod.id)}
                  className="flex items-start space-x-3 cursor-pointer flex-1"
                >
                  <input
                    type="checkbox"
                    checked={isModuloAtivo}
                    onChange={() => {}} // tratado pelo container
                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 pointer-events-none"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <ModIcon className={`w-4 h-4 ${isModuloAtivo ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className={`font-bold text-xs uppercase ${isModuloAtivo ? 'text-slate-900' : 'text-slate-600'}`}>
                        {mod.nome}
                      </span>
                      {isModuloAtivo && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold uppercase">
                          Liberado
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {mod.descricao}
                    </p>
                  </div>
                </div>

                {/* Opções Granulares: Visualizar, Editar, Deletar */}
                <div className="flex items-center space-x-2 pl-7 md:pl-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 shrink-0">
                  {/* Visualizar */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleAcao(mod.id, 'visualizar', e)}
                    className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      acoes.visualizar
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Permite consultar e visualizar este módulo"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualizar</span>
                  </button>

                  {/* Editar */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleAcao(mod.id, 'editar', e)}
                    className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      acoes.editar
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Permite criar, alterar ou preencher dados neste módulo"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  {/* Deletar */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleAcao(mod.id, 'deletar', e)}
                    className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      acoes.deletar
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Permite excluir/cancelar registros cadastrados neste módulo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Deletar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seção 2: Serviços & Documentos Específicos do Autoatendimento */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <BadgeCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Serviços de Autoatendimento & Emissão de Documentos Regulatórios
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Defina quais documentos e ferramentas digitais estarão disponíveis para o inscrito ({subTab}) emitir ou solicitar diretamente pelo portal.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Certidão de Regularidade */}
          <div 
            onClick={() => handleToggleRecurso('emissaoCertidaoRegularidade')}
            className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
              activeRegra.recursosPermitidos?.emissaoCertidaoRegularidade
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(activeRegra.recursosPermitidos?.emissaoCertidaoRegularidade)}
              onChange={() => {}}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 pointer-events-none"
            />
            <div>
              <div className="font-bold text-xs text-slate-800 uppercase">
                Certidão de Regularidade
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Emissão imediata com validação QR Code e autenticidade eletrônica
              </p>
            </div>
          </div>

          {/* Certidão de Quitação Eleitoral / Débitos */}
          <div 
            onClick={() => handleToggleRecurso('emissaoCertidaoQuitacao')}
            className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
              activeRegra.recursosPermitidos?.emissaoCertidaoQuitacao
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(activeRegra.recursosPermitidos?.emissaoCertidaoQuitacao)}
              onChange={() => {}}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 pointer-events-none"
            />
            <div>
              <div className="font-bold text-xs text-slate-800 uppercase">
                Certidão de Quitação Financeira
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Comprovante oficial de inexistência de débitos junto ao conselho
              </p>
            </div>
          </div>

          {/* Certidão de Regularidade Técnica (CRT - Especial PJ) */}
          <div 
            onClick={() => handleToggleRecurso('emissaoCrt')}
            className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
              activeRegra.recursosPermitidos?.emissaoCrt
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(activeRegra.recursosPermitidos?.emissaoCrt)}
              onChange={() => {}}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 pointer-events-none"
            />
            <div>
              <div className="font-bold text-xs text-slate-800 uppercase flex items-center gap-1">
                <span>Certidão CRT de Estabelecimento</span>
                <span className="text-[9px] bg-teal-100 text-teal-800 px-1 rounded font-bold">PJ</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Download da CRT oficial com os Responsáveis Técnicos e horários
              </p>
            </div>
          </div>

          {/* Anotação e Baixa de ART / RT */}
          <div 
            onClick={() => handleToggleRecurso('solicitacaoAnotacaoRT')}
            className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
              activeRegra.recursosPermitidos?.solicitacaoAnotacaoRT
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(activeRegra.recursosPermitidos?.solicitacaoAnotacaoRT)}
              onChange={() => {}}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 pointer-events-none"
            />
            <div>
              <div className="font-bold text-xs text-slate-800 uppercase">
                Averbação e Baixa de RT / ART
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Requerimento de responsabilidade técnica ou encerramento de vínculo
              </p>
            </div>
          </div>

          {/* Emissão de Boletos & Pix Instantâneo */}
          <div 
            onClick={() => handleToggleRecurso('emissaoBoletosAnuidade')}
            className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
              activeRegra.recursosPermitidos?.emissaoBoletosAnuidade
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(activeRegra.recursosPermitidos?.emissaoBoletosAnuidade)}
              onChange={() => {}}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 pointer-events-none"
            />
            <div>
              <div className="font-bold text-xs text-slate-800 uppercase">
                Boletos Bancários & Pix Copia-e-Cola
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Emissão da guia de anuidade do exercício e parcelas vigentes
              </p>
            </div>
          </div>

          {/* Carteira Digital (Virtual) */}
          <div 
            onClick={() => handleToggleRecurso('carteiraDigitalVirtual')}
            className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
              activeRegra.recursosPermitidos?.carteiraDigitalVirtual
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(activeRegra.recursosPermitidos?.carteiraDigitalVirtual)}
              onChange={() => {}}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 pointer-events-none"
            />
            <div>
              <div className="font-bold text-xs text-slate-800 uppercase flex items-center gap-1">
                <span>Carteira Digital Profissional</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">PF</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Exibição da cédula digital de identidade profissional com QR Code
              </p>
            </div>
          </div>

          {/* Atualização Cadastral de Endereço & Contatos */}
          <div 
            onClick={() => handleToggleRecurso('atualizacaoCadastralEndereco')}
            className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
              activeRegra.recursosPermitidos?.atualizacaoCadastralEndereco
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(activeRegra.recursosPermitidos?.atualizacaoCadastralEndereco)}
              onChange={() => {}}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 pointer-events-none"
            />
            <div>
              <div className="font-bold text-xs text-slate-800 uppercase">
                Atualização de Endereço & Contatos
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Permite ao inscrito atualizar seu e-mail, telefone e endereço
              </p>
            </div>
          </div>

          {/* Requerimentos e Petições Eletrônicas */}
          <div 
            onClick={() => handleToggleRecurso('envioProtocolosRequerimentos')}
            className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
              activeRegra.recursosPermitidos?.envioProtocolosRequerimentos
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(activeRegra.recursosPermitidos?.envioProtocolosRequerimentos)}
              onChange={() => {}}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 pointer-events-none"
            />
            <div>
              <div className="font-bold text-xs text-slate-800 uppercase">
                Abertura de Protocolos e Requerimentos
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Peticionamento online e upload de certidões e diplomas
              </p>
            </div>
          </div>

          {/* Formulários Dinâmicos Normativos */}
          <div 
            onClick={() => handleToggleRecurso('preenchimentoFormularios')}
            className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
              activeRegra.recursosPermitidos?.preenchimentoFormularios
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(activeRegra.recursosPermitidos?.preenchimentoFormularios)}
              onChange={() => {}}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 pointer-events-none"
            />
            <div>
              <div className="font-bold text-xs text-slate-800 uppercase">
                Formulários Normativos Dinâmicos
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Preenchimento e envio de questionários e declarações exigidas
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
