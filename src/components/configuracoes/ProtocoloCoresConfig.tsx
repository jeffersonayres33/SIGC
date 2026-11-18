import React, { useState, useEffect, useMemo } from 'react';
import {
  Palette,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Copy,
  Edit3,
  X,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  ProtocoloCorRegra,
  ProtocoloCorOpcao,
  ProtocoloCorEscopo,
  ProtocoloCorCondicao,
  ProtocoloCorOperador
} from '../../types';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import {
  DEFAULT_PROTOCOLO_COR_REGRAS,
  PROTOCOLO_COLOR_PALETTE,
  evaluateProtocoloColorRule
} from '../../utils/protocoloColorUtils';

const COLOR_OPTIONS: { id: ProtocoloCorOpcao; label: string }[] = [
  { id: 'vermelho', label: 'Vermelho' },
  { id: 'amarelo', label: 'Amarelo' },
  { id: 'cinza', label: 'Cinza' },
  { id: 'laranja', label: 'Laranja' },
  { id: 'verde', label: 'Verde' },
  { id: 'azul', label: 'Azul' },
  { id: 'roxo', label: 'Roxo' }
];

const OPERADOR_OPTIONS: { id: ProtocoloCorOperador; label: string; shortLabel: string }[] = [
  { id: 'MENOR_IGUAL', label: 'Igual ou menor que (<=)', shortLabel: '<=' },
  { id: 'MENOR', label: 'Menor que (<)', shortLabel: '<' },
  { id: 'IGUAL', label: 'Igual a (=)', shortLabel: '=' },
  { id: 'MAIOR_IGUAL', label: 'Maior ou igual que (>=)', shortLabel: '>=' }
];

const buildRuleSummary = (regra: ProtocoloCorRegra): string => {
  let escopoDesc = 'Todos os protocolos';
  if (regra.escopo === 'STATUS') {
    escopoDesc = `Protocolos com status "${regra.escopoValor || 'Não definido'}"`;
  } else if (regra.escopo === 'SETOR') {
    escopoDesc = `Protocolos do setor "${regra.escopoValor || 'Não definido'}"`;
  } else if (regra.escopo === 'TIPO_INTERESSADO') {
    const tipoLabel =
      regra.escopoValor === 'EMPRESA'
        ? 'Empresa (PJ)'
        : regra.escopoValor === 'PUBLICO'
        ? 'Público Geral'
        : 'Profissional (PF)';
    escopoDesc = `Protocolos de ${tipoLabel}`;
  }

  let condDesc = '';
  if (regra.condicao === 'VENCIDO') {
    condDesc = 'estiverem vencidos (prazo expirado)';
  } else if (regra.condicao === 'PRAZO_RESTANTE') {
    const op = OPERADOR_OPTIONS.find(o => o.id === (regra.operador || 'MENOR_IGUAL'))?.label || 'Igual ou menor que (<=)';
    condDesc = `tiverem prazo restante ${op} ${regra.percentualLimite ?? 30}%`;
  } else if (regra.condicao === 'STATUS_IGUAL') {
    condDesc = `estiverem com o status "${regra.statusAlvo || 'Concluído'}"`;
  }

  const corLabel = PROTOCOLO_COLOR_PALETTE[regra.cor]?.label || regra.cor;
  const legendaStatus = regra.mostrarLegendaDias !== false ? '• [Com legenda de dias]' : '• [Sem legenda de dias]';
  return `${escopoDesc} quando ${condDesc} → destacar em ${corLabel} ${legendaStatus}`;
};

export const ProtocoloCoresConfig: React.FC = () => {
  const [regras, setRegras] = useState<ProtocoloCorRegra[]>(() => {
    const saved = storageService.getCouncilConfig().protocoloRegrasCores;
    return saved && saved.length > 0 ? saved.map(r => ({ ...r })) : DEFAULT_PROTOCOLO_COR_REGRAS.map(r => ({ ...r }));
  });

  // Modal de Nova Regra / Editar Regra
  const [ruleModal, setRuleModal] = useState<{
    mode: 'create' | 'edit';
    regra: ProtocoloCorRegra;
  } | null>(null);

  // Modal de Confirmação de Exclusão
  const [regraToDelete, setRegraToDelete] = useState<ProtocoloCorRegra | null>(null);

  const [statusCadastrados, setStatusCadastrados] = useState<string[]>([]);
  const [setoresCadastrados, setSetoresCadastrados] = useState<string[]>([]);

  useEffect(() => {
    const loadAux = () => {
      const sts = storageService.getCadastrosBasicos('STATUS_PROTOCOLO').filter(s => s.ativo).map(s => s.nome);
      const sets = storageService.getCadastrosBasicos('SETOR_PROTOCOLO').filter(s => s.ativo).map(s => s.nome);
      setStatusCadastrados(sts.length > 0 ? sts : ['Em Análise', 'Pendente', 'Aguardando Documentação', 'Aprovado', 'Indeferido', 'Concluído']);
      setSetoresCadastrados(sets);

      const cfg = storageService.getCouncilConfig();
      if (cfg.protocoloRegrasCores && cfg.protocoloRegrasCores.length > 0) {
        setRegras(cfg.protocoloRegrasCores.map(r => ({ ...r })));
      }
    };
    loadAux();

    const unsub = storageService.subscribe(() => {
      loadAux();
    });
    return () => unsub();
  }, []);

  const orderedRegras = useMemo(() => {
    return [...regras].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  }, [regras]);

  const persistRegras = (nextList: ProtocoloCorRegra[]) => {
    const normalized = nextList
      .slice()
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      .map((r, idx) => ({
        ...r,
        ordem: idx + 1,
        nome: r.nome.trim() || `Regra #${idx + 1}`,
        percentualLimite:
          r.condicao === 'PRAZO_RESTANTE'
            ? Math.max(0, Math.min(100, Number(r.percentualLimite ?? 30)))
            : r.percentualLimite,
        mostrarLegendaDias: r.mostrarLegendaDias !== false
      }));
    setRegras(normalized);
    storageService.updateCouncilConfig({ protocoloRegrasCores: normalized });
  };

  // Abrir Modal de Nova Regra de Cores
  const handleOpenCreateModal = () => {
    const nova: ProtocoloCorRegra = {
      id: `regra-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nome: '',
      ativo: true,
      ordem: orderedRegras.length + 1,
      escopo: 'TODOS',
      condicao: 'PRAZO_RESTANTE',
      operador: 'MENOR_IGUAL',
      percentualLimite: 30,
      cor: 'laranja',
      mostrarLegendaDias: true
    };
    setRuleModal({ mode: 'create', regra: nova });
  };

  // Abrir Modal de Edição
  const handleOpenEditModal = (regra: ProtocoloCorRegra) => {
    setRuleModal({
      mode: 'edit',
      regra: { ...regra, mostrarLegendaDias: regra.mostrarLegendaDias !== false }
    });
  };

  const updateModalRegra = (patch: Partial<ProtocoloCorRegra>) => {
    setRuleModal(prev => {
      if (!prev) return null;
      const merged: ProtocoloCorRegra = { ...prev.regra, ...patch };
      if (patch.condicao === 'PRAZO_RESTANTE' && merged.percentualLimite === undefined) {
        merged.percentualLimite = 30;
        merged.operador = merged.operador || 'MENOR_IGUAL';
      }
      if (patch.condicao === 'STATUS_IGUAL' && !merged.statusAlvo) {
        merged.statusAlvo = 'Concluído';
      }
      return { ...prev, regra: merged };
    });
  };

  const handleSaveModalRegra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleModal) return;

    const draft = ruleModal.regra;
    if (!draft.nome.trim()) {
      toastService.warning('Nome Obrigatório', 'Informe um nome identificador para a regra de cores.');
      return;
    }

    if (draft.escopo === 'STATUS' && !draft.escopoValor?.trim()) {
      toastService.warning('Status do Escopo Obrigatório', 'Informe o status alvo do escopo da regra.');
      return;
    }
    if (draft.escopo === 'SETOR' && !draft.escopoValor?.trim()) {
      toastService.warning('Setor Obrigatório', 'Selecione o setor para aplicar esta regra.');
      return;
    }
    if (draft.condicao === 'STATUS_IGUAL' && !draft.statusAlvo?.trim()) {
      toastService.warning('Status Obrigatório', 'Informe o status que ativará esta cor.');
      return;
    }

    const sanitizedDraft: ProtocoloCorRegra = {
      ...draft,
      nome: draft.nome.trim(),
      percentualLimite:
        draft.condicao === 'PRAZO_RESTANTE'
          ? Math.max(0, Math.min(100, Number(draft.percentualLimite ?? 30)))
          : draft.percentualLimite,
      mostrarLegendaDias: draft.mostrarLegendaDias !== false
    };

    if (ruleModal.mode === 'create') {
      persistRegras([...orderedRegras, { ...sanitizedDraft, ordem: orderedRegras.length + 1 }]);
      toastService.success('Regra Criada', `A regra "${sanitizedDraft.nome}" foi adicionada e aplicada ao sistema.`);
    } else {
      const updated = orderedRegras.map(r => (r.id === sanitizedDraft.id ? sanitizedDraft : r));
      persistRegras(updated);
      toastService.success('Regra Atualizada', `As alterações na regra "${sanitizedDraft.nome}" foram salvas.`);
    }

    setRuleModal(null);
  };

  const handleToggleRegraAtiva = (regra: ProtocoloCorRegra) => {
    const updated = orderedRegras.map(r =>
      r.id === regra.id ? { ...r, ativo: !(r.ativo !== false) } : r
    );
    persistRegras(updated);
  };

  const handleToggleRegraLegendaDias = (regra: ProtocoloCorRegra) => {
    const currentVal = regra.mostrarLegendaDias !== false;
    const updated = orderedRegras.map(r =>
      r.id === regra.id ? { ...r, mostrarLegendaDias: !currentVal } : r
    );
    persistRegras(updated);
    toastService.info(
      !currentVal ? 'Legenda de Dias Ativada' : 'Legenda de Dias Ocultada',
      !currentVal
        ? `A regra "${regra.nome}" agora exibirá a quantidade de dias restantes/vencido.`
        : `A legenda de dias da regra "${regra.nome}" foi ocultada.`
    );
  };

  const handleDuplicateRegra = (regra: ProtocoloCorRegra) => {
    const copia: ProtocoloCorRegra = {
      ...regra,
      id: `regra-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nome: `${regra.nome} (Cópia)`,
      ordem: orderedRegras.length + 1
    };
    persistRegras([...orderedRegras, copia]);
    toastService.success('Regra Duplicada', `Cópia de "${regra.nome}" criada com sucesso.`);
  };

  const handleConfirmDeleteRegra = () => {
    if (!regraToDelete) return;
    const removedName = regraToDelete.nome;
    const filtered = orderedRegras
      .filter(r => r.id !== regraToDelete.id)
      .map((r, idx) => ({ ...r, ordem: idx + 1 }));
    persistRegras(filtered);
    setRegraToDelete(null);
    toastService.delete('Regra Excluída', `A regra de cor "${removedName}" foi removida permanentemente.`);
  };

  const handleMoveRegra = (index: number, delta: number) => {
    const targetIdx = index + delta;
    if (targetIdx < 0 || targetIdx >= orderedRegras.length) return;
    const copy = [...orderedRegras];
    const [item] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, item);
    persistRegras(copy.map((r, idx) => ({ ...r, ordem: idx + 1 })));
  };

  const handleResetDefaults = () => {
    const defaults = DEFAULT_PROTOCOLO_COR_REGRAS.map(r => ({ ...r, mostrarLegendaDias: true }));
    setRegras(defaults);
    storageService.updateCouncilConfig({ protocoloRegrasCores: defaults });
    toastService.info(
      'Regras Restauradas',
      'As regras padrão (Cinza para Concluído, Vermelho para Vencido e Amarelo para <= 30%) com legendas de dias ativadas foram restauradas.'
    );
  };

  // Amostras em tempo real para pré-visualização imediata das regras configuradas
  const sampleProtocols = useMemo(() => {
    const fmt = (offsetDays: number) => new Date(Date.now() + offsetDays * 86400000).toLocaleDateString('pt-BR');
    return [
      {
        id: 'sim-1',
        numeroProtocolo: '2026/00041',
        interessado: 'FARMÁCIA MODELO AMAZONAS LTDA',
        tipo: 'RENOVAÇÃO DE CRT',
        setorAtual: setoresCadastrados[0] || 'SECRETARIA GERAL',
        status: 'Em Análise',
        dataAbertura: fmt(-15),
        prazoResposta: fmt(-3),
        tipoInteressado: 'EMPRESA' as const
      },
      {
        id: 'sim-2',
        numeroProtocolo: '2026/00042',
        interessado: 'DRA. MARIANA SOUZA LIMA',
        tipo: 'ANOTAÇÃO DE RT',
        setorAtual: setoresCadastrados[1] || 'FISCALIZAÇÃO',
        status: 'Em Análise',
        dataAbertura: fmt(-8),
        prazoResposta: fmt(2),
        tipoInteressado: 'PROFISSIONAL' as const
      },
      {
        id: 'sim-3',
        numeroProtocolo: '2026/00043',
        interessado: 'JOÃO CARLOS FERREIRA',
        tipo: 'INSCRIÇÃO DEFINITIVA',
        setorAtual: setoresCadastrados[0] || 'ATENDIMENTO',
        status: 'Em Análise',
        dataAbertura: fmt(-2),
        prazoResposta: fmt(18),
        tipoInteressado: 'PROFISSIONAL' as const
      },
      {
        id: 'sim-4',
        numeroProtocolo: '2026/00044',
        interessado: 'DROGARIA CENTRAL NORTE',
        tipo: 'BAIXA DE RESPONSABILIDADE',
        setorAtual: setoresCadastrados[0] || 'JURÍDICO',
        status: 'Concluído',
        dataAbertura: fmt(-25),
        prazoResposta: fmt(-5),
        tipoInteressado: 'EMPRESA' as const
      }
    ];
  }, [setoresCadastrados]);

  return (
    <div className="space-y-6">
      <datalist id="protocolo-status-list">
        {statusCadastrados.map(st => (
          <option key={st} value={st} />
        ))}
      </datalist>

      {/* Cabeçalho da Seção */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
              Regras Dinâmicas de Cores e Prazos dos Protocolos
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed max-w-2xl">
              Personalize como a tabela de Protocolos & Requerimentos destaca processos por vencimento, percentual de tempo restante ou status. Para cada regra, você pode escolher se deseja exibir ou ocultar individualmente a legenda de dias restantes/vencidos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Regra de Cores</span>
          </button>
        </div>
      </div>

      {/* Lista de Regras Configuradas */}
      <div className="space-y-3">
        {orderedRegras.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-3">
            <Palette className="w-9 h-9 text-slate-300 mx-auto" />
            <div>
              <h3 className="text-sm font-bold text-slate-700">Nenhuma regra de cores configurada</h3>
              <p className="text-xs text-slate-500 mt-1">
                Clique em <strong>Nova Regra de Cores</strong> ou restaure o padrão do sistema.
              </p>
            </div>
          </div>
        ) : (
          orderedRegras.map((regra, index) => {
            const corStyle = PROTOCOLO_COLOR_PALETTE[regra.cor] || PROTOCOLO_COLOR_PALETTE.cinza;
            const mostraLegenda = regra.mostrarLegendaDias !== false;

            return (
              <div
                key={regra.id}
                className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all shadow-2xs ${
                  regra.ativo !== false ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 opacity-65 bg-slate-50'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3 min-w-0 flex-1">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs shrink-0 mt-0.5">
                      #{index + 1}
                    </span>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[11px] font-extrabold ${corStyle.legendClass}`}>
                          <span className={`w-2 h-2 rounded-full ${corStyle.dotClass}`} />
                          <span>{corStyle.label}</span>
                        </span>
                        <h3 className="text-sm font-extrabold text-slate-900 truncate">
                          {regra.nome}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleToggleRegraAtiva(regra)}
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase border cursor-pointer transition-colors ${
                            regra.ativo !== false
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Clique para ativar ou desativar esta regra"
                        >
                          {regra.ativo !== false ? 'Ativa' : 'Desativada'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleRegraLegendaDias(regra)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase border cursor-pointer transition-colors ${
                            mostraLegenda
                              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Clique para mostrar ou ocultar a legenda de dias para esta regra"
                        >
                          {mostraLegenda ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{mostraLegenda ? 'Legenda Dias: Sim' : 'Legenda Dias: Não'}</span>
                        </button>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {buildRuleSummary(regra)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-1.5 shrink-0 text-xs">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveRegra(index, -1)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
                      title="Aumentar prioridade (subir)"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === orderedRegras.length - 1}
                      onClick={() => handleMoveRegra(index, 1)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
                      title="Diminuir prioridade (descer)"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicateRegra(regra)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                      title="Duplicar regra"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(regra)}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs cursor-pointer transition-colors"
                      title="Editar regra de cores"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegraToDelete(regra)}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer transition-colors"
                      title="Excluir regra de cores"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pré-visualização Dinâmica ao Vivo */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-extrabold uppercase text-slate-800 tracking-wide">
              Simulador ao Vivo na Tabela de Protocolos
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            A legenda de dias em cada linha respeita individualmente a configuração de cada regra
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <th className="py-2.5 px-4">Protocolo</th>
                <th className="py-2.5 px-4">Interessado</th>
                <th className="py-2.5 px-4">Abertura / Prazo</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Regra Aplicada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sampleProtocols.map((sample) => {
                const evaluation = evaluateProtocoloColorRule(sample, regras);
                const mostraLegendaDestaRegra = evaluation.matchedRule ? evaluation.matchedRule.mostrarLegendaDias !== false : true;
                return (
                  <tr
                    key={sample.id}
                    className={evaluation.style ? evaluation.style.rowClass : 'hover:bg-slate-50'}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {sample.numeroProtocolo}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {sample.interessado}
                      <span className="block text-[10px] font-normal text-slate-500">{sample.tipo}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-[11px] text-slate-700 block">
                        {sample.dataAbertura} → {sample.prazoResposta}
                      </span>
                      {mostraLegendaDestaRegra && evaluation.metrics.prazoLabel && (
                        <span
                          className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded border text-[10px] font-bold ${
                            evaluation.style ? evaluation.style.badgeClass : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <Clock className="w-2.5 h-2.5" />
                          {evaluation.metrics.prazoLabel}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white/80 border border-slate-300 text-slate-800">
                        {sample.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {evaluation.matchedRule && evaluation.style ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${evaluation.style.badgeClass}`}>
                          <span className={`w-2 h-2 rounded-full ${evaluation.style.dotClass}`} />
                          <span>{evaluation.matchedRule.nome}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Sem destaque (cor padrão)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota sobre prioridade */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-blue-900">
        <AlertTriangle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Dica de Prioridade:</strong> A regra <strong>#1 (Status Concluído → Cinza)</strong> fica acima da regra de vencimento para que processos já concluídos permaneçam destacados em cinza mesmo depois que a data limite original passar. Você pode alterar livremente a ordem usando os botões de seta acima.
        </p>
      </div>

      {/* Modal de Nova Regra de Cores / Editar Regra de Cores */}
      {ruleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            {/* Header do Modal */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                  {ruleModal.mode === 'create' ? <Plus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {ruleModal.mode === 'create' ? 'Nova Regra de Cores' : 'Editar Regra de Cores'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {ruleModal.mode === 'create'
                      ? 'Configure os critérios de vencimento, prazo ou status, a cor de destaque e se exibe a legenda de dias.'
                      : 'Altere os parâmetros desta regra de cor dinâmica e salve para aplicar imediatamente.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRuleModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="Fechar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário do Modal */}
            <form onSubmit={handleSaveModalRegra} className="p-6 space-y-5 text-xs">
              {/* Nome e Ativo e Legenda de Dias Individual */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                    Nome da Regra / Legenda *
                  </label>
                  <input
                    type="text"
                    required
                    value={ruleModal.regra.nome}
                    onChange={(e) => updateModalRegra({ nome: e.target.value })}
                    placeholder="Ex: Prazo Crítico (<= 15%), Protocolos Vencidos..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                    Situação
                  </label>
                  <button
                    type="button"
                    onClick={() => updateModalRegra({ ativo: !(ruleModal.regra.ativo !== false) })}
                    className={`w-full px-3 py-2.5 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      ruleModal.regra.ativo !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-slate-100 text-slate-500 border-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{ruleModal.regra.ativo !== false ? 'Ativa' : 'Inativa'}</span>
                  </button>
                </div>
              </div>

              {/* Checkbox / Toggle individual para Legenda de Dias */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-slate-900 block">
                    Mostrar legenda com a quantidade de dias restantes / vencidos nesta regra
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Quando ativado, os processos atingidos por esta regra exibirão o selo com contagem de dias.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateModalRegra({ mostrarLegendaDias: !(ruleModal.regra.mostrarLegendaDias !== false) })}
                  className={`px-3 py-2 rounded-xl font-bold text-xs border flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 ${
                    ruleModal.regra.mostrarLegendaDias !== false
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {ruleModal.regra.mostrarLegendaDias !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{ruleModal.regra.mostrarLegendaDias !== false ? 'Mostrar Legenda' : 'Ocultar Legenda'}</span>
                </button>
              </div>

              {/* Escopo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                    Escopo de Aplicação
                  </label>
                  <select
                    value={ruleModal.regra.escopo}
                    onChange={(e) =>
                      updateModalRegra({ escopo: e.target.value as ProtocoloCorEscopo, escopoValor: '' })
                    }
                    className="w-full px-3.5 py-2.5 bg-blue-50/70 border border-blue-200 text-blue-950 rounded-xl font-bold cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="TODOS">Todos os protocolos</option>
                    <option value="STATUS">Apenas com status...</option>
                    <option value="SETOR">Apenas do setor...</option>
                    <option value="TIPO_INTERESSADO">Apenas vínculo...</option>
                  </select>
                </div>

                {ruleModal.regra.escopo === 'STATUS' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                      Status do Escopo *
                    </label>
                    <input
                      type="text"
                      list="protocolo-status-list"
                      value={ruleModal.regra.escopoValor || ''}
                      onChange={(e) => updateModalRegra({ escopoValor: e.target.value })}
                      placeholder="Ex: Em Análise"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                )}

                {ruleModal.regra.escopo === 'SETOR' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                      Setor Alvo *
                    </label>
                    <select
                      value={ruleModal.regra.escopoValor || ''}
                      onChange={(e) => updateModalRegra({ escopoValor: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-600"
                    >
                      <option value="">Selecione o setor...</option>
                      {setoresCadastrados.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}

                {ruleModal.regra.escopo === 'TIPO_INTERESSADO' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                      Tipo de Interessado *
                    </label>
                    <select
                      value={ruleModal.regra.escopoValor || 'PROFISSIONAL'}
                      onChange={(e) => updateModalRegra({ escopoValor: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-600"
                    >
                      <option value="PROFISSIONAL">Profissional (PF)</option>
                      <option value="EMPRESA">Empresa (PJ)</option>
                      <option value="PUBLICO">Público Geral</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Condição */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={ruleModal.regra.condicao === 'VENCIDO' ? 'sm:col-span-3' : ''}>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                    Condição de Disparo
                  </label>
                  <select
                    value={ruleModal.regra.condicao}
                    onChange={(e) => updateModalRegra({ condicao: e.target.value as ProtocoloCorCondicao })}
                    className="w-full px-3.5 py-2.5 bg-indigo-50/70 border border-indigo-200 text-indigo-950 rounded-xl font-bold cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="VENCIDO">Estiver vencido (prazo expirado)</option>
                    <option value="PRAZO_RESTANTE">Prazo próximo ao vencimento</option>
                    <option value="STATUS_IGUAL">Estiver com o status</option>
                  </select>
                </div>

                {ruleModal.regra.condicao === 'PRAZO_RESTANTE' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                        Operador
                      </label>
                      <select
                        value={ruleModal.regra.operador || 'MENOR_IGUAL'}
                        onChange={(e) => updateModalRegra({ operador: e.target.value as ProtocoloCorOperador })}
                        className="w-full px-3 py-2.5 bg-amber-50/80 border border-amber-200 text-amber-950 rounded-xl font-bold cursor-pointer"
                      >
                        {OPERADOR_OPTIONS.map(op => (
                          <option key={op.id} value={op.id}>{op.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                        Tempo Restante (%)
                      </label>
                      <div className="flex items-center bg-amber-50/80 border border-amber-200 rounded-xl overflow-hidden">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={ruleModal.regra.percentualLimite ?? 30}
                          onChange={(e) => updateModalRegra({ percentualLimite: Number(e.target.value) })}
                          className="w-full px-3 py-2.5 bg-transparent text-amber-950 font-mono font-extrabold text-center focus:outline-hidden"
                        />
                        <span className="pr-3.5 font-extrabold text-amber-800">%</span>
                      </div>
                    </div>
                  </>
                )}

                {ruleModal.regra.condicao === 'STATUS_IGUAL' && (
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                      Status Alvo *
                    </label>
                    <input
                      type="text"
                      list="protocolo-status-list"
                      value={ruleModal.regra.statusAlvo || ''}
                      onChange={(e) => updateModalRegra({ statusAlvo: e.target.value })}
                      placeholder="Ex: Concluído (ou separe por vírgula)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                )}
              </div>

              {/* Cor de Destaque */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-2">
                  Cor de Destaque na Linha e Legenda
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COLOR_OPTIONS.map(c => {
                    const palette = PROTOCOLO_COLOR_PALETTE[c.id];
                    const selected = ruleModal.regra.cor === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => updateModalRegra({ cor: c.id })}
                        className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                          selected
                            ? `${palette.legendClass} ring-2 ring-offset-1 ring-blue-500 shadow-xs`
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full shrink-0 ${palette.dotClass}`} />
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resumo em Tempo Real */}
              <div className={`p-3.5 rounded-xl border text-xs font-semibold ${PROTOCOLO_COLOR_PALETTE[ruleModal.regra.cor]?.legendClass || 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <span className="block text-[10px] uppercase font-extrabold opacity-75 mb-0.5">
                  Prévia da Regra Configurada
                </span>
                <span>{buildRuleSummary(ruleModal.regra)}</span>
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRuleModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{ruleModal.mode === 'create' ? 'Salvar Regra' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão (Padrão do Aplicativo) */}
      {regraToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Excluir Regra de Cores</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Tem certeza que deseja excluir permanentemente a regra <strong className="text-slate-900">{regraToDelete.nome}</strong>? Os protocolos passarão a seguir as demais regras ativas ou a cor padrão. Esta ação não poderá ser desfeita.
            </p>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setRegraToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRegra}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
