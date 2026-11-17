import React, { useState, useEffect, useMemo } from 'react';
import {
  Palette,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Save,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Copy
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

const OPERADOR_OPTIONS: { id: ProtocoloCorOperador; label: string }[] = [
  { id: 'MENOR_IGUAL', label: 'Igual ou menor que (<=)' },
  { id: 'MENOR', label: 'Menor que (<)' },
  { id: 'IGUAL', label: 'Igual a (=)' },
  { id: 'MAIOR_IGUAL', label: 'Maior ou igual que (>=)' }
];

export const ProtocoloCoresConfig: React.FC = () => {
  const [regras, setRegras] = useState<ProtocoloCorRegra[]>(() => {
    const saved = storageService.getCouncilConfig().protocoloRegrasCores;
    return saved && saved.length > 0 ? saved.map(r => ({ ...r })) : DEFAULT_PROTOCOLO_COR_REGRAS.map(r => ({ ...r }));
  });
  const [hasChanges, setHasChanges] = useState(false);

  const [statusCadastrados, setStatusCadastrados] = useState<string[]>([]);
  const [setoresCadastrados, setSetoresCadastrados] = useState<string[]>([]);

  useEffect(() => {
    const loadAux = () => {
      const sts = storageService.getCadastrosBasicos('STATUS_PROTOCOLO').filter(s => s.ativo).map(s => s.nome);
      const sets = storageService.getCadastrosBasicos('SETOR_PROTOCOLO').filter(s => s.ativo).map(s => s.nome);
      setStatusCadastrados(sts.length > 0 ? sts : ['Em Análise', 'Pendente', 'Aguardando Documentação', 'Aprovado', 'Indeferido', 'Concluído']);
      setSetoresCadastrados(sets);
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

  const updateRegra = (id: string, patch: Partial<ProtocoloCorRegra>) => {
    setRegras(prev =>
      prev.map(r => {
        if (r.id !== id) return r;
        const merged = { ...r, ...patch };
        if (patch.condicao === 'PRAZO_RESTANTE' && merged.percentualLimite === undefined) {
          merged.percentualLimite = 30;
          merged.operador = merged.operador || 'MENOR_IGUAL';
        }
        if (patch.condicao === 'STATUS_IGUAL' && !merged.statusAlvo) {
          merged.statusAlvo = 'Concluído';
        }
        return merged;
      })
    );
    setHasChanges(true);
  };

  const handleAddRegra = () => {
    const nova: ProtocoloCorRegra = {
      id: `regra-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nome: `Nova Regra de Cor #${regras.length + 1}`,
      ativo: true,
      ordem: regras.length + 1,
      escopo: 'TODOS',
      condicao: 'PRAZO_RESTANTE',
      operador: 'MENOR_IGUAL',
      percentualLimite: 30,
      cor: 'laranja'
    };
    setRegras(prev => [...prev, nova]);
    setHasChanges(true);
  };

  const handleDuplicateRegra = (regra: ProtocoloCorRegra) => {
    const copia: ProtocoloCorRegra = {
      ...regra,
      id: `regra-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nome: `${regra.nome} (Cópia)`,
      ordem: regras.length + 1
    };
    setRegras(prev => [...prev, copia]);
    setHasChanges(true);
  };

  const handleRemoveRegra = (id: string) => {
    const filtered = orderedRegras.filter(r => r.id !== id).map((r, idx) => ({ ...r, ordem: idx + 1 }));
    setRegras(filtered);
    setHasChanges(true);
  };

  const handleMoveRegra = (index: number, delta: number) => {
    const targetIdx = index + delta;
    if (targetIdx < 0 || targetIdx >= orderedRegras.length) return;
    const copy = [...orderedRegras];
    const [item] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, item);
    setRegras(copy.map((r, idx) => ({ ...r, ordem: idx + 1 })));
    setHasChanges(true);
  };

  const handleResetDefaults = () => {
    const defaults = DEFAULT_PROTOCOLO_COR_REGRAS.map(r => ({ ...r }));
    setRegras(defaults);
    storageService.updateCouncilConfig({ protocoloRegrasCores: defaults });
    setHasChanges(false);
    toastService.info('Regras Restauradas', 'As regras padrão (Cinza para Concluído, Vermelho para Vencido e Amarelo para <= 30%) foram aplicadas.');
  };

  const handleSave = () => {
    const normalized = orderedRegras.map((r, idx) => ({
      ...r,
      ordem: idx + 1,
      nome: r.nome.trim() || `Regra #${idx + 1}`,
      percentualLimite: r.condicao === 'PRAZO_RESTANTE'
        ? Math.max(0, Math.min(100, Number(r.percentualLimite ?? 30)))
        : r.percentualLimite
    }));
    storageService.updateCouncilConfig({ protocoloRegrasCores: normalized });
    setRegras(normalized);
    setHasChanges(false);
    toastService.success('Configuração de Protocolo Salva', 'As cores dinâmicas já estão ativas na listagem de Protocolos.');
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
              Personalize como a tabela de Protocolos & Requerimentos destaca processos por vencimento, percentual de tempo restante ou status. As regras são avaliadas na ordem de prioridade (#1, #2, #3...).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>
          <button
            type="button"
            onClick={handleAddRegra}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Regra</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer ${
              hasChanges
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {hasChanges ? <Save className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>{hasChanges ? 'Salvar Regras de Cores' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>

      {/* Lista Editável de Regras */}
      <div className="space-y-3">
        {orderedRegras.map((regra, index) => {
          const corStyle = PROTOCOLO_COLOR_PALETTE[regra.cor] || PROTOCOLO_COLOR_PALETTE.cinza;

          return (
            <div
              key={regra.id}
              className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all shadow-2xs ${
                regra.ativo !== false ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              {/* Barra Superior da Regra */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs shrink-0">
                    #{index + 1}
                  </span>
                  <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${corStyle.dotClass}`} />
                  <input
                    type="text"
                    value={regra.nome}
                    onChange={(e) => updateRegra(regra.id, { nome: e.target.value })}
                    placeholder="Nome identificador da regra..."
                    className="flex-1 min-w-0 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center flex-wrap gap-1.5 shrink-0 text-xs">
                  <button
                    type="button"
                    onClick={() => updateRegra(regra.id, { ativo: !(regra.ativo !== false) })}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border cursor-pointer ${
                      regra.ativo !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {regra.ativo !== false ? 'Ativa' : 'Desativada'}
                  </button>
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveRegra(index, -1)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    title="Aumentar prioridade (subir)"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === orderedRegras.length - 1}
                    onClick={() => handleMoveRegra(index, 1)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    title="Diminuir prioridade (descer)"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicateRegra(regra)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                    title="Duplicar regra"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveRegra(regra.id)}
                    className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title="Excluir regra"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Construtor Dinâmico Interativo em Linguagem Natural */}
              <div className="pt-4 flex flex-wrap items-center gap-2 text-xs text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-500">Aplicar nos protocolos</span>

                {/* Escopo */}
                <select
                  value={regra.escopo}
                  onChange={(e) => updateRegra(regra.id, { escopo: e.target.value as ProtocoloCorEscopo, escopoValor: '' })}
                  className="px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg font-bold cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="TODOS">Todos os protocolos</option>
                  <option value="STATUS">Apenas com status...</option>
                  <option value="SETOR">Apenas do setor...</option>
                  <option value="TIPO_INTERESSADO">Apenas vínculo...</option>
                </select>

                {regra.escopo === 'STATUS' && (
                  <input
                    type="text"
                    list="protocolo-status-list"
                    value={regra.escopoValor || ''}
                    onChange={(e) => updateRegra(regra.id, { escopoValor: e.target.value })}
                    placeholder="Ex: Em Análise"
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 w-40"
                  />
                )}

                {regra.escopo === 'SETOR' && (
                  <select
                    value={regra.escopoValor || ''}
                    onChange={(e) => updateRegra(regra.id, { escopoValor: e.target.value })}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    <option value="">Selecione o setor...</option>
                    {setoresCadastrados.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}

                {regra.escopo === 'TIPO_INTERESSADO' && (
                  <select
                    value={regra.escopoValor || 'PROFISSIONAL'}
                    onChange={(e) => updateRegra(regra.id, { escopoValor: e.target.value })}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    <option value="PROFISSIONAL">Profissional (PF)</option>
                    <option value="EMPRESA">Empresa (PJ)</option>
                    <option value="PUBLICO">Público Geral</option>
                  </select>
                )}

                <span className="font-semibold text-slate-500">quando</span>

                {/* Condição */}
                <select
                  value={regra.condicao}
                  onChange={(e) => updateRegra(regra.id, { condicao: e.target.value as ProtocoloCorCondicao })}
                  className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg font-bold cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="VENCIDO">Estiver vencido (prazo expirado)</option>
                  <option value="PRAZO_RESTANTE">Prazo próximo ao vencimento</option>
                  <option value="STATUS_IGUAL">Estiver com o status</option>
                </select>

                {/* Variáveis de Prazo Restante */}
                {regra.condicao === 'PRAZO_RESTANTE' && (
                  <>
                    <select
                      value={regra.operador || 'MENOR_IGUAL'}
                      onChange={(e) => updateRegra(regra.id, { operador: e.target.value as ProtocoloCorOperador })}
                      className="px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg font-bold cursor-pointer"
                    >
                      {OPERADOR_OPTIONS.map(op => (
                        <option key={op.id} value={op.id}>{op.label}</option>
                      ))}
                    </select>

                    <div className="inline-flex items-center bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={regra.percentualLimite ?? 30}
                        onChange={(e) => updateRegra(regra.id, { percentualLimite: Number(e.target.value) })}
                        className="w-16 px-2 py-1.5 bg-transparent text-amber-950 font-mono font-extrabold text-center focus:outline-hidden"
                      />
                      <span className="pr-2.5 font-extrabold text-amber-800">%</span>
                    </div>

                    <span className="text-slate-500 font-medium">do tempo restante para o vencimento</span>
                  </>
                )}

                {/* Variável de Status */}
                {regra.condicao === 'STATUS_IGUAL' && (
                  <input
                    type="text"
                    list="protocolo-status-list"
                    value={regra.statusAlvo || ''}
                    onChange={(e) => updateRegra(regra.id, { statusAlvo: e.target.value })}
                    placeholder="Ex: Concluído"
                    className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-900 w-48 focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                )}

                <span className="font-semibold text-slate-500">→ destacar na cor</span>

                {/* Seleção de Cor */}
                <select
                  value={regra.cor}
                  onChange={(e) => updateRegra(regra.id, { cor: e.target.value as ProtocoloCorOpcao })}
                  className={`px-3 py-1.5 rounded-lg font-extrabold border cursor-pointer ${corStyle.legendClass}`}
                >
                  {COLOR_OPTIONS.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pré-visualização Dinâmica ao Vivo */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-extrabold uppercase text-slate-800 tracking-wide">
              Simulador ao Vivo na Tabela de Protocolos
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Visualize em tempo real como cada processo aparecerá com as regras atuais
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
                      {evaluation.metrics.prazoLabel && (
                        <span className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded border text-[10px] font-bold ${
                          evaluation.style ? evaluation.style.badgeClass : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
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
    </div>
  );
};
