import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  Check, 
  Lock, 
  Unlock, 
  FileCheck2, 
  FileText, 
  Coins, 
  BadgeCheck, 
  IdCard, 
  Building,
  Edit3,
  Eye,
  QrCode,
  Receipt,
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Send,
  SlidersHorizontal
} from 'lucide-react';
import { storageService, DEFAULT_ACESSOS_INSCRITO_PF, DEFAULT_ACESSOS_INSCRITO_PJ } from '../../services/storageService';
import { RegraAcessoInscrito, RecursoConfigPortal } from '../../types';
import { toastService } from '../../services/toastService';

interface InscritosConfigProps {
  initialSubTab?: 'PF' | 'PJ';
}

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

  // Garante que o objeto recursosPortal exista e tenha defaults
  const getRecursoState = (key: string): RecursoConfigPortal => {
    const r = activeRegra.recursosPortal?.[key];
    if (r !== undefined) return r;
    return { liberado: true, permiteEditar: true, permiteEmitir: true };
  };

  const setRecursoField = (key: string, field: 'liberado' | 'permiteEditar' | 'permiteEmitir', value: boolean) => {
    setActiveRegra(prev => {
      const current = prev.recursosPortal?.[key] || { liberado: true, permiteEditar: true, permiteEmitir: true };
      const updatedRecurso: RecursoConfigPortal = {
        ...current,
        [field]: value
      };

      // Se desativou liberado, desativa também os sub-privilégios
      if (field === 'liberado' && !value) {
        updatedRecurso.permiteEditar = false;
        updatedRecurso.permiteEmitir = false;
      }
      // Se ativou editar ou emitir, obrigatoriamente ativa liberado
      if ((field === 'permiteEditar' || field === 'permiteEmitir') && value) {
        updatedRecurso.liberado = true;
      }

      const nextRecursos = {
        ...(prev.recursosPortal || {}),
        [key]: updatedRecurso
      };

      // Sincroniza com modulosPermitidos e recursosPermitidos para retrocompatibilidade
      const nextModulos = ['portal_inscrito'];
      if (nextRecursos.dadosCadastrais?.liberado || nextRecursos.dadosEstabelecimento?.liberado) {
        nextModulos.push('dados_cadastrais');
      }
      if (nextRecursos.anuidadeFinanceiro?.liberado) {
        nextModulos.push('anuidade');
      }
      if (nextRecursos.protocolosProcessos?.liberado) {
        nextModulos.push('protocolo');
      }
      if (nextRecursos.requerimentoEletronico?.liberado) {
        nextModulos.push('requerimento');
      }

      return {
        ...prev,
        recursosPortal: nextRecursos,
        modulosPermitidos: nextModulos,
        permissoesAcoes: {
          ...prev.permissoesAcoes,
          dados_cadastrais: {
            visualizar: Boolean(nextRecursos.dadosCadastrais?.liberado ?? nextRecursos.dadosEstabelecimento?.liberado),
            editar: Boolean(nextRecursos.dadosCadastrais?.permiteEditar),
            deletar: false
          },
          anuidade: {
            visualizar: Boolean(nextRecursos.anuidadeFinanceiro?.liberado),
            editar: Boolean(nextRecursos.anuidadeFinanceiro?.permiteEmitir),
            deletar: false
          },
          protocolo: {
            visualizar: Boolean(nextRecursos.protocolosProcessos?.liberado),
            editar: true,
            deletar: false
          },
          requerimento: {
            visualizar: Boolean(nextRecursos.requerimentoEletronico?.liberado),
            editar: Boolean(nextRecursos.requerimentoEletronico?.permiteEditar),
            deletar: false
          }
        },
        recursosPermitidos: {
          ...prev.recursosPermitidos,
          emissaoCertidaoQuitacao: Boolean(nextRecursos.certidaoQuitacao?.liberado),
          emissaoCrt: Boolean(nextRecursos.certidaoCrtDigital?.liberado),
          emissaoBoletosAnuidade: Boolean(nextRecursos.anuidadeFinanceiro?.permiteEmitir),
          geracaoPixInstantaneo: Boolean(nextRecursos.anuidadeFinanceiro?.permiteEmitir),
          atualizacaoCadastralEndereco: Boolean(nextRecursos.dadosCadastrais?.permiteEditar),
          envioProtocolosRequerimentos: Boolean(nextRecursos.requerimentoEletronico?.liberado)
        }
      };
    });
  };

  const handlePreset = (mode: 'todos_liberados' | 'apenas_consulta' | 'bloquear_todos') => {
    setActiveRegra(prev => {
      const isPF = subTab === 'PF';
      const newRecursos: Record<string, RecursoConfigPortal> = {};

      if (isPF) {
        newRecursos.dadosCadastrais = {
          liberado: mode !== 'bloquear_todos',
          permiteEditar: mode === 'todos_liberados'
        };
        newRecursos.vinculosProfissionais = {
          liberado: mode !== 'bloquear_todos'
        };
        newRecursos.certidaoQuitacao = {
          liberado: mode !== 'bloquear_todos',
          permiteEmitir: mode === 'todos_liberados'
        };
        newRecursos.anuidadeFinanceiro = {
          liberado: mode !== 'bloquear_todos',
          permiteEmitir: mode === 'todos_liberados'
        };
        newRecursos.protocolosProcessos = {
          liberado: mode !== 'bloquear_todos'
        };
        newRecursos.requerimentoEletronico = {
          liberado: mode !== 'bloquear_todos',
          permiteEditar: mode === 'todos_liberados'
        };
      } else {
        newRecursos.dadosEstabelecimento = {
          liberado: mode !== 'bloquear_todos',
          permiteEditar: false
        };
        newRecursos.certidaoCrtDigital = {
          liberado: mode !== 'bloquear_todos',
          permiteEmitir: mode === 'todos_liberados'
        };
        newRecursos.anuidadeFinanceiro = {
          liberado: mode !== 'bloquear_todos',
          permiteEmitir: mode === 'todos_liberados'
        };
        newRecursos.protocolosProcessos = {
          liberado: mode !== 'bloquear_todos'
        };
        newRecursos.requerimentoEletronico = {
          liberado: mode !== 'bloquear_todos',
          permiteEditar: mode === 'todos_liberados'
        };
      }

      return {
        ...prev,
        recursosPortal: newRecursos,
        modulosPermitidos: mode === 'bloquear_todos' ? [] : ['portal_inscrito', 'dados_cadastrais', 'anuidade', 'protocolo', 'requerimento']
      };
    });
  };

  const handleSave = () => {
    if (subTab === 'PF') {
      storageService.updateAcessosInscritoPF(regraPF);
      toastService.success(
        'Acessos PF Salvos com Sucesso',
        'As permissões dos recursos do Portal do Profissional (PF) foram sincronizadas com o banco de dados.'
      );
    } else {
      storageService.updateAcessosInscritoPJ(regraPJ);
      toastService.success(
        'Acessos PJ Salvos com Sucesso',
        'As permissões dos recursos do Portal da Empresa (PJ) foram sincronizadas com o banco de dados.'
      );
    }
    setHasChanges(false);
  };

  const handleResetToDefault = () => {
    if (window.confirm(`Deseja restaurar as permissões padrão para ${subTab === 'PF' ? 'Profissionais (Pessoa Física)' : 'Empresas (Pessoa Jurídica)'}?`)) {
      if (subTab === 'PF') {
        storageService.updateAcessosInscritoPF(DEFAULT_ACESSOS_INSCRITO_PF);
        setRegraPF(DEFAULT_ACESSOS_INSCRITO_PF);
      } else {
        storageService.updateAcessosInscritoPJ(DEFAULT_ACESSOS_INSCRITO_PJ);
        setRegraPJ(DEFAULT_ACESSOS_INSCRITO_PJ);
      }
      setHasChanges(false);
      toastService.info('Padrão Restaurado', 'As regras retornaram à configuração regulatória padrão.');
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
              Controle de Acessos — Portal do Inscrito ({subTab === 'PF' ? 'Profissional PF' : 'Empresa PJ'})
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {subTab === 'PF'
              ? 'Defina quais recursos e serviços do autoatendimento estarão liberados para os Farmacêuticos e Técnicos inscritos.'
              : 'Defina quais recursos e serviços do autoatendimento estarão liberados para as Farmácias, Drogarias e Estabelecimentos.'}
            {' '}<strong>Inscritos não acessam áreas internas administrativas do conselho.</strong>
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
                <span>Acesso ao Portal Liberado para {subTab === 'PF' ? 'Profissionais (Pessoa Física)' : 'Empresas (Pessoa Jurídica)'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                  activeRegra.permiteAcessoAoPortal ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {activeRegra.permiteAcessoAoPortal ? 'PORTAL HABILITADO' : 'PORTAL BLOQUEADO'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {activeRegra.permiteAcessoAoPortal
                  ? `Inscritos ${subTab} podem realizar login, consultar seus cadastros e utilizar os serviços do portal.`
                  : `O acesso via login para ${subTab} está temporariamente desativado por decisão administrativa.`}
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

      {/* Seção Única e Coesa: Recursos Existentes no Portal do Inscrito */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Recursos & Serviços Disponíveis no Portal {subTab === 'PF' ? 'do Profissional' : 'da Empresa'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cada item abaixo corresponde diretamente a uma tela ou ferramenta presente no Portal do Inscrito.
            </p>
          </div>

          {/* Atalhos Rápidos */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs font-bold">
            <span className="text-slate-400 text-[11px] uppercase mr-1">Ações Rápidas:</span>
            <button
              type="button"
              onClick={() => handlePreset('todos_liberados')}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] cursor-pointer"
            >
              ✅ Liberar Todos
            </button>
            <button
              type="button"
              onClick={() => handlePreset('apenas_consulta')}
              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[11px] cursor-pointer"
            >
              👁️ Apenas Consulta
            </button>
            <button
              type="button"
              onClick={() => handlePreset('bloquear_todos')}
              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[11px] cursor-pointer"
            >
              🚫 Bloquear Todos
            </button>
          </div>
        </div>

        {/* Lista de Recursos PF */}
        {subTab === 'PF' && (
          <div className="space-y-3">
            {/* 1. Dados Cadastrais & Perfil */}
            {(() => {
              const rec = getRecursoState('dadosCadastrais');
              return (
                <div className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  rec.liberado ? 'bg-slate-50 border-emerald-200' : 'bg-white border-slate-200 opacity-60'
                }`}>
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${rec.liberado ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-400'}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs uppercase text-slate-900">
                          1. Dados Cadastrais & Perfil do Profissional
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          rec.liberado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {rec.liberado ? 'Disponível no Portal' : 'Oculto'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Exibe nome, CPF, RG, número de inscrição CRF e situação do farmacêutico/técnico com dados oficiais do banco.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 pl-11 md:pl-0">
                    {/* Permite Editar Endereço/Contatos */}
                    <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(rec.permiteEditar)}
                        disabled={!rec.liberado}
                        onChange={(e) => setRecursoField('dadosCadastrais', 'permiteEditar', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <span>Permitir Alterar Endereço / Contatos</span>
                    </label>

                    {/* Toggle Ativar/Desativar */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rec.liberado}
                        onChange={(e) => setRecursoField('dadosCadastrais', 'liberado', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              );
            })()}

            {/* 2. Meus Vínculos com Estabelecimentos */}
            {(() => {
              const rec = getRecursoState('vinculosProfissionais');
              return (
                <div className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  rec.liberado ? 'bg-slate-50 border-emerald-200' : 'bg-white border-slate-200 opacity-60'
                }`}>
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${rec.liberado ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-400'}`}>
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs uppercase text-slate-900">
                          2. Vínculos com Estabelecimentos Farmacêuticos
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          rec.liberado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {rec.liberado ? 'Disponível no Portal' : 'Oculto'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Permite ao profissional consultar farmácias e drogarias onde é RT ou assistente, horários de assistência, CRT e situação sanitária.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 pl-11 md:pl-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rec.liberado}
                        onChange={(e) => setRecursoField('vinculosProfissionais', 'liberado', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              );
            })()}

            {/* 3. Certidão de Quitação e Regularidade */}
            {(() => {
              const rec = getRecursoState('certidaoQuitacao');
              return (
                <div className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  rec.liberado ? 'bg-slate-50 border-emerald-200' : 'bg-white border-slate-200 opacity-60'
                }`}>
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${rec.liberado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs uppercase text-slate-900">
                          3. Certidão de Quitação
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          rec.liberado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {rec.liberado ? 'Emissão Permitida' : 'Bloqueada'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Emissão instantânea da certidão negativa de débitos com validade jurídica e código de verificação digital.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 pl-11 md:pl-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rec.liberado}
                        onChange={(e) => setRecursoField('certidaoQuitacao', 'liberado', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              );
            })()}

            {/* 4. Anuidade & Posição Financeira */}
            {(() => {
              const rec = getRecursoState('anuidadeFinanceiro');
              return (
                <div className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  rec.liberado ? 'bg-slate-50 border-emerald-200' : 'bg-white border-slate-200 opacity-60'
                }`}>
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${rec.liberado ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400'}`}>
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs uppercase text-slate-900">
                          4. Anuidade & Posição Financeira
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          rec.liberado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {rec.liberado ? 'Disponível no Portal' : 'Oculto'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Permite consultar débitos em aberto, anuidades do exercício e histórico de pagamentos do profissional.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 pl-11 md:pl-0">
                    <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(rec.permiteEmitir)}
                        disabled={!rec.liberado}
                        onChange={(e) => setRecursoField('anuidadeFinanceiro', 'permiteEmitir', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <span>Permitir Emissão de Boletos e Pix</span>
                    </label>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rec.liberado}
                        onChange={(e) => setRecursoField('anuidadeFinanceiro', 'liberado', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              );
            })()}

            {/* 5. Protocolos & Processos em Andamento */}
            {(() => {
              const rec = getRecursoState('protocolosProcessos');
              return (
                <div className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  rec.liberado ? 'bg-slate-50 border-emerald-200' : 'bg-white border-slate-200 opacity-60'
                }`}>
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${rec.liberado ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-400'}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs uppercase text-slate-900">
                          5. Protocolos & Processos em Andamento
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          rec.liberado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {rec.liberado ? 'Disponível no Portal' : 'Oculto'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Permite ao profissional acompanhar processos, pareceres da diretoria e status de requerimentos protocolados.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 pl-11 md:pl-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rec.liberado}
                        onChange={(e) => setRecursoField('protocolosProcessos', 'liberado', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              );
            })()}

            {/* 6. Requerimento Eletrônico (Peticionamento) */}
            {(() => {
              const rec = getRecursoState('requerimentoEletronico');
              return (
                <div className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  rec.liberado ? 'bg-slate-50 border-emerald-200' : 'bg-white border-slate-200 opacity-60'
                }`}>
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${rec.liberado ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-400'}`}>
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs uppercase text-slate-900">
                          6. Requerimento Eletrônico (Peticionamento Online)
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          rec.liberado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {rec.liberado ? 'Disponível no Portal' : 'Oculto'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Permite abrir solicitações digitais com os assuntos regulamentares de PF (Cadastros Básicos) e justificativa.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 pl-11 md:pl-0">
                    <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(rec.permiteEditar)}
                        disabled={!rec.liberado}
                        onChange={(e) => setRecursoField('requerimentoEletronico', 'permiteEditar', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <span>Permitir Envio de Novos Requerimentos</span>
                    </label>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rec.liberado}
                        onChange={(e) => setRecursoField('requerimentoEletronico', 'liberado', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Lista de Recursos PJ */}
        {subTab === 'PJ' && (
          <div className="space-y-3">
            {/* 1. Dados do Estabelecimento & Condição Sanitária */}
            {(() => {
              const rec = getRecursoState('dadosEstabelecimento');
              return (
                <div className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  rec.liberado ? 'bg-slate-50 border-emerald-200' : 'bg-white border-slate-200 opacity-60'
                }`}>
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${rec.liberado ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-400'}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs uppercase text-slate-900">
                          1. Dados do Estabelecimento & Condição Sanitária
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          rec.liberado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {rec.liberado ? 'Disponível no Portal' : 'Oculto'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Exibe razão social, CNPJ, inscrição, tipo de estabelecimento, validade de CRT e condição cadastral da empresa.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 pl-11 md:pl-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rec.liberado}
                        onChange={(e) => setRecursoField('dadosEstabelecimento', 'liberado', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              );
            })()}

            {/* 2. Certidão de Regularidade Técnica (CRT Digital) */}
            {(() => {
              const rec = getRecursoState('certidaoCrtDigital');
              return (
                <div className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  rec.liberado ? 'bg-slate-50 border-emerald-200' : 'bg-white border-slate-200 opacity-60'
                }`}>
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${rec.liberado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs uppercase text-slate-900">
                          2. Certidão de Regularidade Técnica (CRT Digital)
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          rec.liberado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {rec.liberado ? 'Emissão Permitida' : 'Bloqueada'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Emissão e download da CRT com QR Code de autenticação, relação de Responsáveis Técnicos e horários de assistência.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 pl-11 md:pl-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rec.liberado}
                        onChange={(e) => setRecursoField('certidaoCrtDigital', 'liberado', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              );
            })()}

            {/* 3. Anuidade & Financeiro PJ */}
            {(() => {
              const rec = getRecursoState('anuidadeFinanceiro');
              return (
                <div className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  rec.liberado ? 'bg-slate-50 border-emerald-200' : 'bg-white border-slate-200 opacity-60'
                }`}>
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${rec.liberado ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400'}`}>
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs uppercase text-slate-900">
                          3. Anuidade & Débitos da Empresa
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          rec.liberado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {rec.liberado ? 'Disponível no Portal' : 'Oculto'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Permite à empresa consultar anuidades, taxas e débitos com emissão de boletos bancários e Pix Copia-e-Cola.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 pl-11 md:pl-0">
                    <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(rec.permiteEmitir)}
                        disabled={!rec.liberado}
                        onChange={(e) => setRecursoField('anuidadeFinanceiro', 'permiteEmitir', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <span>Permitir Boletos e Pix PJ</span>
                    </label>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rec.liberado}
                        onChange={(e) => setRecursoField('anuidadeFinanceiro', 'liberado', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              );
            })()}

            {/* 4. Protocolos & Processos da Empresa */}
            {(() => {
              const rec = getRecursoState('protocolosProcessos');
              return (
                <div className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  rec.liberado ? 'bg-slate-50 border-emerald-200' : 'bg-white border-slate-200 opacity-60'
                }`}>
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${rec.liberado ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-400'}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs uppercase text-slate-900">
                          4. Protocolos & Processos da Empresa
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          rec.liberado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {rec.liberado ? 'Disponível no Portal' : 'Oculto'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Acompanhamento de processos, juntada de documentos e andamento de petições da empresa.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 pl-11 md:pl-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rec.liberado}
                        onChange={(e) => setRecursoField('protocolosProcessos', 'liberado', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              );
            })()}

            {/* 5. Requerimento Eletrônico PJ */}
            {(() => {
              const rec = getRecursoState('requerimentoEletronico');
              return (
                <div className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  rec.liberado ? 'bg-slate-50 border-emerald-200' : 'bg-white border-slate-200 opacity-60'
                }`}>
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${rec.liberado ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-400'}`}>
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs uppercase text-slate-900">
                          5. Requerimento Eletrônico PJ (Peticionamento)
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          rec.liberado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {rec.liberado ? 'Disponível no Portal' : 'Oculto'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Permite ao representante legal abrir requerimentos corporativos vinculados a Cadastros Básicos PJ.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 pl-11 md:pl-0">
                    <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(rec.permiteEditar)}
                        disabled={!rec.liberado}
                        onChange={(e) => setRecursoField('requerimentoEletronico', 'permiteEditar', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <span>Permitir Envio de Novos Requerimentos</span>
                    </label>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rec.liberado}
                        onChange={(e) => setRecursoField('requerimentoEletronico', 'liberado', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
