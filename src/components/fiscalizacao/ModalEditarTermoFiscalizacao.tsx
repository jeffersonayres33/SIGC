import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Calendar,
  FileText,
  AlertTriangle,
  AlertOctagon,
  User,
  Building
} from 'lucide-react';
import { TermoFiscalizacao } from '../../types';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';

interface ModalEditarTermoFiscalizacaoProps {
  termo: TermoFiscalizacao | null;
  onClose: () => void;
  onSaved?: (updatedTermo: TermoFiscalizacao) => void;
}

const getLocalDatetimeInputNow = (): string => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const formatDatetimeInputToBr = (isoLocal: string): string => {
  if (!isoLocal) return '';
  const [datePart, timePart] = isoLocal.split('T');
  if (!datePart) return isoLocal;
  const [y, m, d] = datePart.split('-');
  if (!y || !m || !d) return isoLocal;
  return `${d}/${m}/${y}${timePart ? ` ${timePart.slice(0, 5)}` : ''}`;
};

export const ModalEditarTermoFiscalizacao: React.FC<ModalEditarTermoFiscalizacaoProps> = ({
  termo,
  onClose,
  onSaved
}) => {
  const cadastrosBasicos = storageService.getCadastrosBasicos();
  const authUser = storageService.getCurrentAuthUser();

  const zonasDisponiveis = cadastrosBasicos
    .filter(i => i.categoria === 'ZONA_EMPRESA' && i.ativo)
    .map(i => i.nome)
    .sort((a, b) => a.localeCompare(b));

  const municipiosDisponiveis = cadastrosBasicos
    .filter(i => i.categoria === 'MUNICIPIO' && i.ativo)
    .map(i => i.nome)
    .sort((a, b) => a.localeCompare(b));

  const [dataEdicaoInput, setDataEdicaoInput] = useState(getLocalDatetimeInputNow());
  const [dataHora, setDataHora] = useState('');
  const [cidade, setCidade] = useState('');
  const [rota, setRota] = useState('');
  const [fiscalNome, setFiscalNome] = useState('');
  const [fiscalMatricula, setFiscalMatricula] = useState('');
  const [encontrava, setEncontrava] = useState<'Aberta' | 'Fechada'>('Aberta');
  const [motivoFechada, setMotivoFechada] = useState('Mot. Desconhecido');
  const [rtSituacao, setRtSituacao] = useState('Presente');
  const [respTecnicoNome, setRespTecnicoNome] = useState('');
  const [respTecnicoInscricao, setRespTecnicoInscricao] = useState('');
  const [atendenteNome, setAtendenteNome] = useState('');
  const [atendenteCargo, setAtendenteCargo] = useState('');
  const [observacao, setObservacao] = useState('');

  // Notificação
  const [notificacaoAtiva, setNotificacaoAtiva] = useState(false);
  const [numeroNotificacao, setNumeroNotificacao] = useState('');
  const [notificacaoTexto, setNotificacaoTexto] = useState('');

  // Intimação
  const [intimacaoAtiva, setIntimacaoAtiva] = useState(false);
  const [numeroIntimacao, setNumeroIntimacao] = useState('');
  const [intimacaoOutrasObservacoes, setIntimacaoOutrasObservacoes] = useState('');

  // Autuação
  const [autoInfracaoGerado, setAutoInfracaoGerado] = useState(false);
  const [numeroAutoInfracao, setNumeroAutoInfracao] = useState('');
  const [autuacaoAusente, setAutuacaoAusente] = useState(false);
  const [autuacaoSemRt, setAutuacaoSemRt] = useState(false);
  const [autuacaoChi, setAutuacaoChi] = useState(false);
  const [autuacaoSemSubstituto, setAutuacaoSemSubstituto] = useState(false);
  const [autuacaoIlegal, setAutuacaoIlegal] = useState(false);
  const [autuacaoPrivativas, setAutuacaoPrivativas] = useState(false);
  const [autuacaoOutrasObservacoes, setAutuacaoOutrasObservacoes] = useState('');

  const generatedNotifRef = useRef<string | null>(null);
  const generatedIntimRef = useRef<string | null>(null);
  const generatedAutoRef = useRef<string | null>(null);

  const FALLBACK_NOTIFICACAO_TEXTO =
    'A empresa foi encontrada aberta e em funcionamento em horário não declarado ao CRF/AM, com a presença no local de profissional farmacêutico que NÃO é responsável técnico (RT) no horário, não havendo farmacêutico RT averbado e legalmente habilitado da empresa no horário desta fiscalização. A empresa fica notificada a providenciar regularização do seu horário de funcionamento e averbação de farmacêutico responsável técnico em até 05 dias, sob pena de autuação no artigo 24 da lei federal 3820/1960.';

  const getOficialNotificacaoTexto = () =>
    storageService.getCouncilConfig().textoPadraoNotificacao?.trim() || FALLBACK_NOTIFICACAO_TEXTO;

  // Intimação checkboxes
  const [intimacaoCrtAtualizada, setIntimacaoCrtAtualizada] = useState(false);
  const [intimacaoCrtLocalVisivel, setIntimacaoCrtLocalVisivel] = useState(false);
  const [intimacaoAlteracaoSocial, setIntimacaoAlteracaoSocial] = useState(false);

  useEffect(() => {
    if (!termo) return;
    generatedNotifRef.current = null;
    generatedIntimRef.current = null;
    generatedAutoRef.current = null;

    setDataEdicaoInput(getLocalDatetimeInputNow());
    setDataHora(termo.dataHora || '');
    setCidade(termo.cidade || '');
    setRota(termo.rota || '');
    setFiscalNome(termo.fiscalNome || '');
    setFiscalMatricula(termo.fiscalMatricula || '');
    setEncontrava(termo.encontrava === 'Fechada' ? 'Fechada' : 'Aberta');
    setMotivoFechada(termo.motivoFechada || 'Mot. Desconhecido');
    setRtSituacao(termo.rtSituacao || (termo.presencaRT ? 'Presente' : 'Ausente'));
    setRespTecnicoNome(termo.respTecnicoSelecionadoNome || termo.rtPresenteNome || '');
    setRespTecnicoInscricao(termo.respTecnicoSelecionadoInscricao || termo.rtPresenteInscricao || '');
    setAtendenteNome(termo.atendenteNome || termo.nomeSignatarioNotificado || '');
    setAtendenteCargo(termo.atendenteCargo || termo.cargoSignatarioNotificado || '');
    setObservacao(termo.observacao || termo.outrasObservacoesGerais || '');

    setNotificacaoAtiva(Boolean(termo.notificacaoAtiva));
    setNumeroNotificacao(termo.numeroNotificacao || '');
    setNotificacaoTexto(termo.notificacaoTexto || '');

    setIntimacaoAtiva(Boolean(termo.intimacaoAtiva));
    setNumeroIntimacao(termo.numeroIntimacao || '');
    setIntimacaoCrtAtualizada(Boolean(termo.intimacaoCrtAtualizada));
    setIntimacaoCrtLocalVisivel(Boolean(termo.intimacaoCrtLocalVisivel));
    setIntimacaoAlteracaoSocial(Boolean(termo.intimacaoAlteracaoSocial));
    setIntimacaoOutrasObservacoes(termo.intimacaoOutrasObservacoes || '');

    const hasAuto = Boolean(termo.autoInfracaoGerado || termo.autuacaoAtiva);
    setAutoInfracaoGerado(hasAuto);
    setNumeroAutoInfracao(termo.numeroAutoInfracao || '');
    setAutuacaoAusente(Boolean(termo.autuacaoAusente));
    setAutuacaoSemRt(Boolean(termo.autuacaoSemRt));
    setAutuacaoChi(Boolean(termo.autuacaoChi));
    setAutuacaoSemSubstituto(Boolean(termo.autuacaoSemSubstituto));
    setAutuacaoIlegal(Boolean(termo.autuacaoIlegal));
    setAutuacaoPrivativas(Boolean(termo.autuacaoPrivativas));
    setAutuacaoOutrasObservacoes(termo.autuacaoOutrasObservacoes || '');
  }, [termo]);

  if (!termo) return null;

  const handleToggleNotificacao = (checked: boolean) => {
    setNotificacaoAtiva(checked);
    if (checked) {
      const currentNum = numeroNotificacao.trim();
      if (!currentNum || currentNum === 'S/N') {
        if (termo.numeroNotificacao && termo.numeroNotificacao !== 'S/N') {
          setNumeroNotificacao(termo.numeroNotificacao);
        } else {
          const num = storageService.getNextNumeroNotificacao();
          generatedNotifRef.current = num;
          setNumeroNotificacao(num);
        }
      }
      if (!notificacaoTexto.trim()) {
        setNotificacaoTexto(getOficialNotificacaoTexto());
      }
    } else if (generatedNotifRef.current) {
      storageService.rollbackNumeroNotificacao(generatedNotifRef.current);
      generatedNotifRef.current = null;
      setNumeroNotificacao('');
    }
  };

  const handleToggleIntimacao = (checked: boolean) => {
    setIntimacaoAtiva(checked);
    if (checked) {
      const currentNum = numeroIntimacao.trim();
      if (!currentNum || currentNum === 'S/N') {
        if (termo.numeroIntimacao && termo.numeroIntimacao !== 'S/N') {
          setNumeroIntimacao(termo.numeroIntimacao);
        } else {
          const num = storageService.getNextNumeroIntimacao();
          generatedIntimRef.current = num;
          setNumeroIntimacao(num);
        }
      }
    } else if (generatedIntimRef.current) {
      storageService.rollbackNumeroIntimacao(generatedIntimRef.current);
      generatedIntimRef.current = null;
      setNumeroIntimacao('');
    }
  };

  const handleToggleAutuacao = (checked: boolean) => {
    setAutoInfracaoGerado(checked);
    if (checked) {
      const currentNum = numeroAutoInfracao.trim();
      if (!currentNum || currentNum === 'S/N' || currentNum === 'AI-EDIT') {
        if (termo.numeroAutoInfracao && termo.numeroAutoInfracao !== 'S/N' && termo.numeroAutoInfracao !== 'AI-EDIT') {
          setNumeroAutoInfracao(termo.numeroAutoInfracao);
        } else {
          const num = storageService.getNextNumeroAutuacao();
          generatedAutoRef.current = num;
          setNumeroAutoInfracao(num);
        }
      }
    } else if (generatedAutoRef.current) {
      storageService.rollbackNumeroAutuacao(generatedAutoRef.current);
      generatedAutoRef.current = null;
      setNumeroAutoInfracao('');
    }
  };

  const handleCancel = () => {
    if (generatedNotifRef.current) {
      storageService.rollbackNumeroNotificacao(generatedNotifRef.current);
      generatedNotifRef.current = null;
    }
    if (generatedIntimRef.current) {
      storageService.rollbackNumeroIntimacao(generatedIntimRef.current);
      generatedIntimRef.current = null;
    }
    if (generatedAutoRef.current) {
      storageService.rollbackNumeroAutuacao(generatedAutoRef.current);
      generatedAutoRef.current = null;
    }
    onClose();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!dataEdicaoInput.trim()) {
      toastService.warning('Campo Obrigatório', 'Informe a Data da Edição antes de salvar.');
      return;
    }

    const finalNumNotif = notificacaoAtiva
      ? (numeroNotificacao.trim() && numeroNotificacao.trim() !== 'S/N'
          ? numeroNotificacao.trim()
          : storageService.getNextNumeroNotificacao())
      : undefined;

    const finalTextoNotif = notificacaoAtiva
      ? (notificacaoTexto.trim() || getOficialNotificacaoTexto())
      : undefined;

    const finalNumIntim = intimacaoAtiva
      ? (numeroIntimacao.trim() && numeroIntimacao.trim() !== 'S/N'
          ? numeroIntimacao.trim()
          : storageService.getNextNumeroIntimacao())
      : undefined;

    const finalNumAuto = autoInfracaoGerado
      ? (numeroAutoInfracao.trim() && numeroAutoInfracao.trim() !== 'S/N' && numeroAutoInfracao.trim() !== 'AI-EDIT'
          ? numeroAutoInfracao.trim()
          : storageService.getNextNumeroAutuacao())
      : undefined;

    const infracoes: string[] = [];
    if (autoInfracaoGerado) {
      if (autuacaoAusente) infracoes.push('Ausência de responsável técnico durante o horário de funcionamento (Art. 24 da Lei 3820/60)');
      if (autuacaoSemRt) infracoes.push('Estabelecimento funcionando sem assistência de farmacêutico RT averbado (Lei 13.021/2014)');
      if (autuacaoChi) infracoes.push('Carga horária insuficiente do farmacêutico (CHI)');
      if (autuacaoSemSubstituto) infracoes.push('Ausência de farmacêutico substituto declarado');
      if (autuacaoIlegal) infracoes.push('Exercício ilegal da profissão / Atuação por leigo');
      if (autuacaoPrivativas) infracoes.push('Realização de atividades privativas de farmacêutico sem presença do profissional');
      if (infracoes.length === 0 && termo.infracoesIdentificadas?.length) {
        infracoes.push(...termo.infracoesIdentificadas);
      } else if (infracoes.length === 0) {
        infracoes.push('Infração sanitária/profissional apurada em fiscalização');
      }
    }

    const formattedDataEdicao = formatDatetimeInputToBr(dataEdicaoInput);
    const updatedTermo: TermoFiscalizacao = {
      ...termo,
      dataHora: dataHora.trim() || termo.dataHora,
      dataEdicao: formattedDataEdicao,
      editadoPor: authUser?.nome || termo.editadoPor || 'Usuário do Sistema',
      cidade: cidade.trim() || termo.cidade,
      rota: rota.trim() || undefined,
      fiscalNome: fiscalNome.trim() || termo.fiscalNome,
      fiscalMatricula: fiscalMatricula.trim() || termo.fiscalMatricula,
      encontrava,
      motivoFechada: encontrava === 'Fechada' ? motivoFechada : undefined,
      rtSituacao,
      presencaRT: rtSituacao === 'Presente',
      rtPresente: rtSituacao === 'Presente',
      rtPresenteNome: rtSituacao === 'Presente' ? respTecnicoNome : undefined,
      rtPresenteInscricao: rtSituacao === 'Presente' ? respTecnicoInscricao : undefined,
      respTecnicoSelecionadoNome: respTecnicoNome || undefined,
      respTecnicoSelecionadoInscricao: respTecnicoInscricao || undefined,
      atendenteNome: atendenteNome.trim() || termo.atendenteNome,
      atendenteCargo: atendenteCargo.trim() || termo.atendenteCargo,
      observacao: observacao.trim() || undefined,
      outrasObservacoesGerais: observacao.trim() || undefined,
      notificacaoAtiva,
      numeroNotificacao: finalNumNotif,
      notificacaoTexto: finalTextoNotif,
      intimacaoAtiva,
      numeroIntimacao: finalNumIntim,
      intimacaoCrtAtualizada: intimacaoAtiva ? intimacaoCrtAtualizada : false,
      intimacaoCrtLocalVisivel: intimacaoAtiva ? intimacaoCrtLocalVisivel : false,
      intimacaoAlteracaoSocial: intimacaoAtiva ? intimacaoAlteracaoSocial : false,
      intimacaoOutrasObservacoes: intimacaoAtiva ? intimacaoOutrasObservacoes : undefined,
      autuacaoAtiva: autoInfracaoGerado,
      autoInfracaoGerado,
      numeroAutoInfracao: finalNumAuto,
      autuacaoAusente: autoInfracaoGerado ? autuacaoAusente : false,
      autuacaoSemRt: autoInfracaoGerado ? autuacaoSemRt : false,
      autuacaoChi: autoInfracaoGerado ? autuacaoChi : false,
      autuacaoSemSubstituto: autoInfracaoGerado ? autuacaoSemSubstituto : false,
      autuacaoIlegal: autoInfracaoGerado ? autuacaoIlegal : false,
      autuacaoPrivativas: autoInfracaoGerado ? autuacaoPrivativas : false,
      autuacaoOutrasObservacoes: autoInfracaoGerado ? autuacaoOutrasObservacoes : undefined,
      infracoesIdentificadas: infracoes,
      valorMultaPrevisto: autoInfracaoGerado ? Math.max(infracoes.length * 1500, termo.valorMultaPrevisto || 1500) : 0
    };

    generatedNotifRef.current = null;
    generatedIntimRef.current = null;
    generatedAutoRef.current = null;

    storageService.saveTermoFiscalizacao(updatedTermo);
    toastService.success(
      'Termo Atualizado',
      `Termo ${updatedTermo.numeroTermo} editado em ${formattedDataEdicao}.`
    );
    onSaved?.(updatedTermo);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={handleCancel}
    >
      <div
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-300 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-white truncate">
                Editar Termo de Inspeção nº {termo.numeroTermo}
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {termo.empresaNome} • CNPJ: {termo.cnpj}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-700">
          {/* Campo Obrigatório: Data da Edição */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-black text-amber-900 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>Data da Edição: *</span>
              </label>
              <input
                type="datetime-local"
                required
                value={dataEdicaoInput}
                onChange={(e) => setDataEdicaoInput(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Data/Hora Original da Fiscalização:</label>
              <input
                type="text"
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                placeholder="DD/MM/AAAA HH:mm"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-800"
              />
            </div>
          </div>

          {/* Localização & Fiscal */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              <span>Localização & Fiscal Responsável</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Município:</label>
                <input
                  type="text"
                  list="lista-municipios-termo"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                />
                <datalist id="lista-municipios-termo">
                  {municipiosDisponiveis.map(m => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Zona:</label>
                <input
                  type="text"
                  list="lista-zonas-termo"
                  value={rota}
                  onChange={(e) => setRota(e.target.value)}
                  placeholder="Selecione ou informe a zona"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                />
                <datalist id="lista-zonas-termo">
                  {zonasDisponiveis.map(z => (
                    <option key={z} value={z} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Fiscal Responsável:</label>
                <input
                  type="text"
                  value={fiscalNome}
                  onChange={(e) => setFiscalNome(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Matrícula do Fiscal:</label>
                <input
                  type="text"
                  value={fiscalMatricula}
                  onChange={(e) => setFiscalMatricula(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Situação no Atendimento & RT */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Condições da Inspeção & Responsável Técnico</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Situação do Estabelecimento:</label>
                <select
                  value={encontrava}
                  onChange={(e) => setEncontrava(e.target.value === 'Fechada' ? 'Fechada' : 'Aberta')}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-800"
                >
                  <option value="Aberta">Aberta</option>
                  <option value="Fechada">Fechada</option>
                </select>
              </div>
              {encontrava === 'Fechada' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Motivo (Fechada):</label>
                  <select
                    value={motivoFechada}
                    onChange={(e) => setMotivoFechada(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    <option value="Mot. Desconhecido">Mot. Desconhecido</option>
                    <option value="Em reforma">Em reforma</option>
                    <option value="Feriado">Feriado</option>
                    <option value="Horário de almoço">Horário de almoço</option>
                    <option value="Encerrada">Encerrada</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Situação do RT:</label>
                  <select
                    value={rtSituacao}
                    onChange={(e) => setRtSituacao(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    <option value="Presente">Presente</option>
                    <option value="Ausente">Ausente</option>
                    <option value="Não possui">Não possui</option>
                    <option value="Não possui Farm.Sub ou A.T">Não possui Farm.Sub ou A.T</option>
                    <option value="Fiscalização Realizada fora do HAT">Fiscalização Realizada fora do HAT</option>
                    <option value="Dentro do prazo de 30 dias">Dentro do prazo de 30 dias</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">RT Averbado / Selecionado:</label>
                <input
                  type="text"
                  value={respTecnicoNome}
                  onChange={(e) => setRespTecnicoNome(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Inscrição do RT:</label>
                <input
                  type="text"
                  value={respTecnicoInscricao}
                  onChange={(e) => setRespTecnicoInscricao(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Atendente no Local:</label>
                <input
                  type="text"
                  value={atendenteNome}
                  onChange={(e) => setAtendenteNome(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cargo do Atendente:</label>
                <input
                  type="text"
                  value={atendenteCargo}
                  onChange={(e) => setAtendenteCargo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Ocorrências Lavradas */}
          <div className="space-y-3">
            {/* Notificação */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center space-x-2 font-bold text-amber-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificacaoAtiva}
                    onChange={(e) => handleToggleNotificacao(e.target.checked)}
                    className="rounded border-amber-400 text-amber-600"
                  />
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Possui Notificação</span>
                </label>
                {notificacaoAtiva && numeroNotificacao && (
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                    Sequencial Anti-Duplicidade: {numeroNotificacao}
                  </span>
                )}
              </div>
              {notificacaoAtiva && (
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">
                      Número da Notificação (Anti-Duplicidade):
                    </label>
                    <input
                      type="text"
                      value={numeroNotificacao}
                      onChange={(e) => setNumeroNotificacao(e.target.value)}
                      placeholder="Gerado automaticamente (ex: NOT-2026-00001)"
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <label className="text-[11px] font-bold text-amber-900">
                        Teor Regulatório Oficial da Notificação:
                      </label>
                      <button
                        type="button"
                        onClick={() => setNotificacaoTexto(getOficialNotificacaoTexto())}
                        className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
                      >
                        Carregar texto padrão do administrador
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={notificacaoTexto}
                      onChange={(e) => setNotificacaoTexto(e.target.value)}
                      placeholder="Texto regulatório oficial da notificação..."
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-slate-800 leading-relaxed"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Intimação */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center space-x-2 font-bold text-blue-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={intimacaoAtiva}
                    onChange={(e) => handleToggleIntimacao(e.target.checked)}
                    className="rounded border-blue-400 text-blue-600"
                  />
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Possui Intimação</span>
                </label>
                {intimacaoAtiva && numeroIntimacao && (
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-300">
                    Sequencial Anti-Duplicidade: {numeroIntimacao}
                  </span>
                )}
              </div>
              {intimacaoAtiva && (
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-blue-900 mb-1">
                      Número da Intimação (Anti-Duplicidade):
                    </label>
                    <input
                      type="text"
                      value={numeroIntimacao}
                      onChange={(e) => setNumeroIntimacao(e.target.value)}
                      placeholder="Gerado automaticamente (ex: INT-2026-00001)"
                      className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-800">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="checkbox" checked={intimacaoCrtAtualizada} onChange={(e) => setIntimacaoCrtAtualizada(e.target.checked)} />
                      <span>Apresentar Certidão de Regularidade Técnica (CRT) atualizada</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="checkbox" checked={intimacaoCrtLocalVisivel} onChange={(e) => setIntimacaoCrtLocalVisivel(e.target.checked)} />
                      <span>Manter a CRT afixada em local visível ao público</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="checkbox" checked={intimacaoAlteracaoSocial} onChange={(e) => setIntimacaoAlteracaoSocial(e.target.checked)} />
                      <span>Regularizar alteração social / contratual ou de endereço</span>
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    value={intimacaoOutrasObservacoes}
                    onChange={(e) => setIntimacaoOutrasObservacoes(e.target.value)}
                    placeholder="Outras exigências/observações da Intimação..."
                    className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-slate-800"
                  />
                </div>
              )}
            </div>

            {/* Auto de Infração */}
            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center space-x-2 font-bold text-rose-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoInfracaoGerado}
                    onChange={(e) => handleToggleAutuacao(e.target.checked)}
                    className="rounded border-rose-400 text-rose-600"
                  />
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>Auto de Infração Gerado</span>
                </label>
                {autoInfracaoGerado && numeroAutoInfracao && (
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 border border-rose-300">
                    Sequencial Anti-Duplicidade: {numeroAutoInfracao}
                  </span>
                )}
              </div>
              {autoInfracaoGerado && (
                <div className="space-y-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-rose-900 mb-1">
                      Número do Auto de Infração (Anti-Duplicidade):
                    </label>
                    <input
                      type="text"
                      value={numeroAutoInfracao}
                      onChange={(e) => setNumeroAutoInfracao(e.target.value)}
                      placeholder="Gerado automaticamente (ex: AI-2026-00001)"
                      className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-lg font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="checkbox" checked={autuacaoAusente} onChange={(e) => setAutuacaoAusente(e.target.checked)} />
                      <span>RT Ausente</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="checkbox" checked={autuacaoSemRt} onChange={(e) => setAutuacaoSemRt(e.target.checked)} />
                      <span>Sem RT averbado</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="checkbox" checked={autuacaoChi} onChange={(e) => setAutuacaoChi(e.target.checked)} />
                      <span>Carga horária insuficiente (CHI)</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="checkbox" checked={autuacaoSemSubstituto} onChange={(e) => setAutuacaoSemSubstituto(e.target.checked)} />
                      <span>Sem substituto declarado</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="checkbox" checked={autuacaoIlegal} onChange={(e) => setAutuacaoIlegal(e.target.checked)} />
                      <span>Exercício ilegal</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="checkbox" checked={autuacaoPrivativas} onChange={(e) => setAutuacaoPrivativas(e.target.checked)} />
                      <span>Atividades privativas sem RT</span>
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    value={autuacaoOutrasObservacoes}
                    onChange={(e) => setAutuacaoOutrasObservacoes(e.target.value)}
                    placeholder="Observações do Auto de Infração..."
                    className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-slate-800"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Relato / Observação Fiscal */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Relato e Constatações da Fiscalização:</label>
            <textarea
              rows={3}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Descreva os fatos observados durante a inspeção..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
