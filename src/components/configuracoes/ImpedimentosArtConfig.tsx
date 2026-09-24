import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  RotateCcw, 
  Save, 
  Search, 
  Plus, 
  SlidersHorizontal,
  Info,
  Scale,
  Building2,
  FileCheck2,
  Sparkles,
  UserX,
  UserCheck
} from 'lucide-react';
import { storageService, CouncilConfig, DEFAULT_COUNCIL_CONFIG } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { ItemCadastroBasico } from '../../types';

// Descrições e fundamentações padrão para situações conhecidas
const SITUACOES_METADATA: Record<string, { descricao: string; baseLegal: string; recomendacaoCff: boolean }> = {
  'Suspenso': {
    descricao: 'Profissional sob penalidade disciplinar ética ou suspensão administrativa de registro.',
    baseLegal: 'Art. 30 da Lei 3.820/60 e Código de Processo Ético Farmacêutico (Res. CFF)',
    recomendacaoCff: true
  },
  'Cancelado': {
    descricao: 'Inscrição cancelada voluntariamente a pedido ou cancelamento de ofício.',
    baseLegal: 'Art. 15 da Lei 3.820/60 - Perda da habilitação de exercício da profissão',
    recomendacaoCff: true
  },
  'Falecido': {
    descricao: 'Registro encerrado definitivamente por certidão de óbito arquivada.',
    baseLegal: 'Extinção de personalidade civil e capacidade técnica',
    recomendacaoCff: true
  },
  'Baixado': {
    descricao: 'Baixa de inscrição no conselho por encerramento de atividades ou aposentadoria.',
    baseLegal: 'Resolução CFF sobre Baixa de Inscrição Profissional',
    recomendacaoCff: true
  },
  'Licenciado': {
    descricao: 'Licença temporária deferida com suspensão temporária do exercício da profissão.',
    baseLegal: 'Resolução CFF sobre Licença Temporária de Exercício',
    recomendacaoCff: true
  },
  'Transferido': {
    descricao: 'Inscrição transferida para outro Conselho Regional de Farmácia.',
    baseLegal: 'Art. 16 da Lei 3.820/60 - Transferência de jurisdição regional',
    recomendacaoCff: true
  },
  'Definitivo': {
    descricao: 'Registro regular definitivo pleno após colação de grau e diploma homologado.',
    baseLegal: 'Art. 15 da Lei 3.820/60 - Plena aptidão para assunção de RT',
    recomendacaoCff: false
  },
  'Provisório': {
    descricao: 'Inscrição provisória regular com certidão de conclusão de curso válida.',
    baseLegal: 'Resolução CFF sobre Registro Provisório de Egressos',
    recomendacaoCff: false
  },
  'Secundário': {
    descricao: 'Registro secundário para atuação concomitante em mais de um estado federativo.',
    baseLegal: 'Resolução CFF sobre Inscrição Secundária',
    recomendacaoCff: false
  },
  'Remido': {
    descricao: 'Profissional remido por tempo de contribuição e idade, com registro ativo.',
    baseLegal: 'Resolução CFF sobre Inscrição Remida',
    recomendacaoCff: false
  },
  'Jubilado': {
    descricao: 'Profissional com honraria por jubilamento e atividade continuada.',
    baseLegal: 'Resolução CFF sobre Jubilamento Profissional',
    recomendacaoCff: false
  },
  'Temporário': {
    descricao: 'Registro com prazo determinado para contratos temporários ou missões.',
    baseLegal: 'Normativa CRF para registros temporários',
    recomendacaoCff: false
  }
};

export const ImpedimentosArtConfig: React.FC = () => {
  const [councilConfig, setCouncilConfig] = useState<CouncilConfig>(storageService.getCouncilConfig());
  const [selectedImpedidas, setSelectedImpedidas] = useState<string[]>(
    councilConfig.situacoesImpedidasRT || DEFAULT_COUNCIL_CONFIG.situacoesImpedidasRT || []
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'todos' | 'impedidos' | 'permitidos'>('todos');

  // Load registered situations from Cadastros Basicos
  const [cadastrosSituacoes, setCadastrosSituacoes] = useState<ItemCadastroBasico[]>(() => {
    return storageService.getCadastrosBasicos('SITUACAO_PROFISSIONAL');
  });

  // Modal / Form state to add new situation if needed
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSitNome, setNewSitNome] = useState('');
  const [newSitCodigo, setNewSitCodigo] = useState('');
  const [newSitDescricao, setNewSitDescricao] = useState('');
  const [newSitImpedida, setNewSitImpedida] = useState(true);

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      const cfg = storageService.getCouncilConfig();
      setCouncilConfig(cfg);
      if (!hasChanges) {
        setSelectedImpedidas(cfg.situacoesImpedidasRT || DEFAULT_COUNCIL_CONFIG.situacoesImpedidasRT || []);
      }
      setCadastrosSituacoes(storageService.getCadastrosBasicos('SITUACAO_PROFISSIONAL'));
    });
    return () => unsub();
  }, [hasChanges]);

  // Combine situations from cadastros básicos and any default list
  const allSituacoesList = useMemo(() => {
    const map = new Map<string, { nome: string; codigo?: string; descricao?: string }>();

    // 1. Known Situations metadata
    Object.keys(SITUACOES_METADATA).forEach(name => {
      map.set(name.toLowerCase(), {
        nome: name,
        codigo: name.slice(0, 4).toUpperCase(),
        descricao: SITUACOES_METADATA[name].descricao
      });
    });

    // 2. Cadastros Basicos
    cadastrosSituacoes.forEach(item => {
      if (item.nome) {
        map.set(item.nome.toLowerCase(), {
          nome: item.nome,
          codigo: item.codigo,
          descricao: item.descricao || SITUACOES_METADATA[item.nome]?.descricao || 'Situação cadastral de profissional'
        });
      }
    });

    // 3. Any situation currently in councilConfig.situacoesImpedidasRT
    selectedImpedidas.forEach(name => {
      if (!map.has(name.toLowerCase())) {
        map.set(name.toLowerCase(), {
          nome: name,
          codigo: name.slice(0, 4).toUpperCase(),
          descricao: 'Situação com restrição configurada'
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [cadastrosSituacoes, selectedImpedidas]);

  const isImpedida = (nome: string): boolean => {
    return selectedImpedidas.some(item => item.trim().toLowerCase() === nome.trim().toLowerCase());
  };

  const toggleImpedimento = (nome: string) => {
    setSelectedImpedidas(prev => {
      const exists = prev.some(item => item.trim().toLowerCase() === nome.trim().toLowerCase());
      let next: string[];
      if (exists) {
        next = prev.filter(item => item.trim().toLowerCase() !== nome.trim().toLowerCase());
      } else {
        next = [...prev, nome];
      }
      setHasChanges(true);
      return next;
    });
  };

  const handleApplyPresetCff = () => {
    const preset = ['Suspenso', 'Cancelado', 'Falecido', 'Baixado', 'Licenciado', 'Transferido'];
    setSelectedImpedidas(preset);
    setHasChanges(true);
    toastService.info('Modelo Padrão CFF Aplicado', 'Situações recomendadas pelo CFF foram marcadas como impeditivas para ART.');
  };

  const handleApplyPresetSevereOnly = () => {
    const preset = ['Suspenso', 'Cancelado', 'Falecido'];
    setSelectedImpedidas(preset);
    setHasChanges(true);
    toastService.info('Modelo Restrito Aplicado', 'Apenas situações de inaptidão severa (Suspenso, Cancelado, Falecido) foram bloqueadas.');
  };

  const handleApplyAllowOnlyRegulars = () => {
    // Block everything except Definitivo, Provisório, Secundário, Remido
    const allowed = ['definitivo', 'provisório', 'provisorio', 'secundário', 'secundario', 'remido', 'jubilado'];
    const toBlock = allSituacoesList
      .filter(s => !allowed.includes(s.nome.trim().toLowerCase()))
      .map(s => s.nome);
    setSelectedImpedidas(toBlock);
    setHasChanges(true);
    toastService.info('Modelo Rigoroso Aplicado', 'Apenas registros regulares ativos estão autorizados a assumir RT.');
  };

  const handleClearAll = () => {
    setSelectedImpedidas([]);
    setHasChanges(true);
    toastService.warning('Bloqueios Limpos', 'Nenhuma situação está configurada como impeditiva para ART.');
  };

  const handleSave = () => {
    const updated: CouncilConfig = {
      ...councilConfig,
      situacoesImpedidasRT: selectedImpedidas
    };
    storageService.updateCouncilConfig(updated);
    setCouncilConfig(updated);
    setHasChanges(false);
    toastService.success(
      'Regras de ART Atualizadas',
      `As situações impeditivas para Responsabilidade Técnica foram salvas. O sistema agora bloqueará automaticamente a inclusão de RTs em qualquer uma das ${selectedImpedidas.length} situações configuradas.`
    );
  };

  const handleCreateNewSituation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSitNome.trim()) {
      toastService.warning('Nome Obrigatório', 'Informe o nome da nova situação profissional.');
      return;
    }

    const newItem: ItemCadastroBasico = {
      id: `sitp-${Date.now()}`,
      categoria: 'SITUACAO_PROFISSIONAL',
      nome: newSitNome.trim(),
      codigo: newSitCodigo.trim().toUpperCase() || newSitNome.trim().slice(0, 4).toUpperCase(),
      descricao: newSitDescricao.trim() || 'Situação cadastral personalizada',
      ativo: true
    };

    storageService.saveCadastroBasico(newItem);

    if (newSitImpedida) {
      setSelectedImpedidas(prev => [...prev, newItem.nome]);
      setHasChanges(true);
    }

    setNewSitNome('');
    setNewSitCodigo('');
    setNewSitDescricao('');
    setIsAddingNew(false);
    toastService.success('Situação Cadastrada', `A situação "${newItem.nome}" foi incluída na base de cadastros.`);
  };

  // Filtered List
  const filteredSituacoes = useMemo(() => {
    return allSituacoesList.filter(sit => {
      const matchSearch = sit.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (sit.codigo && sit.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (sit.descricao && sit.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchSearch) return false;

      const impedido = isImpedida(sit.nome);
      if (filterMode === 'impedidos') return impedido;
      if (filterMode === 'permitidos') return !impedido;
      return true;
    });
  }, [allSituacoesList, searchTerm, filterMode, selectedImpedidas]);

  const countTotal = allSituacoesList.length;
  const countImpedidos = allSituacoesList.filter(s => isImpedida(s.nome)).length;
  const countPermitidos = countTotal - countImpedidos;

  return (
    <div className="space-y-6">
      {/* Banner Principal com Identificação e Base Legal */}
      <div className="bg-gradient-to-br from-rose-900 via-slate-900 to-rose-950 text-white rounded-3xl p-6 shadow-xl border border-rose-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>MÓDULO DE CONTROLE REGULATÓRIO DE ART / RT</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-[10px] font-mono font-bold">
                {councilConfig.sigla || 'CRF'}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">
              Situações com Impedimento para Responsabilidade Técnica (ART)
            </h2>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Defina abaixo quais situações cadastrais do farmacêutico impedem legalmente a assunção ou homologação de 
              <strong> Anotação de Responsabilidade Técnica (ART)</strong> e inclusão como Responsável Técnico (RT) em estabelecimentos farmacêuticos.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-rose-200">
              <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg">
                <Scale className="w-3.5 h-3.5 text-rose-400" />
                <span>Lei Federal nº 3.820/60 (Art. 24)</span>
              </span>
              <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg">
                <Building2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Lei Federal nº 13.021/14</span>
              </span>
              <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg">
                <FileCheck2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Resoluções Normativas do CFF</span>
              </span>
            </div>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges}
              className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center space-x-2 transition-all cursor-pointer ${
                hasChanges
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-900/40 animate-pulse'
                  : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Salvar Impedimentos</span>
            </button>
            {hasChanges && (
              <span className="text-[11px] font-bold text-amber-300 animate-bounce">
                ● Alterações pendentes de gravação
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cards de Métricas & Estado Atual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-500 block">Total de Situações</span>
            <span className="text-2xl font-black text-slate-900">{countTotal}</span>
            <span className="text-[10px] text-slate-400 block">Cadastradas no sistema SIGC</span>
          </div>
        </div>

        <div className="bg-white border-2 border-rose-200 bg-rose-50/20 p-4 rounded-2xl shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase text-rose-700 block">Impedidas de Assumir RT</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-rose-900">{countImpedidos}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-200 text-rose-800 rounded-full">
                BLOQUEIO ATIVO
              </span>
            </div>
            <span className="text-[10px] text-rose-600 block">Vínculo de RT vetado</span>
          </div>
        </div>

        <div className="bg-white border-2 border-emerald-200 bg-emerald-50/20 p-4 rounded-2xl shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase text-emerald-700 block">Autorizadas para RT</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-900">{countPermitidos}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-full">
                HABILITADAS
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 block">Aptas para assunção de ART</span>
          </div>
        </div>
      </div>

      {/* Modelos Rápidos de Preenchimento e Presets */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-black uppercase text-slate-800">
              Modelos Rápidos e Configurações Pré-definidas do Conselho
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Clique para aplicar padrões normativos em 1 clique
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleApplyPresetCff}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Padrão Recomendado CFF (Suspenso, Cancelado, Falecido, Baixado, Licenciado, Transferido)</span>
          </button>

          <button
            type="button"
            onClick={handleApplyPresetSevereOnly}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-rose-600" />
            <span>Bloqueio Restrito (Apenas Suspenso, Cancelado, Falecido)</span>
          </button>

          <button
            type="button"
            onClick={handleApplyAllowOnlyRegulars}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Permitir Apenas Definitivo & Provisório</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs uppercase flex items-center space-x-1.5 cursor-pointer transition-colors ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Desmarcar Todos</span>
          </button>
        </div>
      </div>

      {/* Barra de Busca, Filtros e Botão de Nova Situação */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar situação por nome ou código..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Filtro de Estado */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setFilterMode('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                filterMode === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({countTotal})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('impedidos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center space-x-1 ${
                filterMode === 'impedidos' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <Lock className="w-3 h-3" />
              <span>Impedidos ({countImpedidos})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('permitidos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center space-x-1 ${
                filterMode === 'permitidos' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Permitidos ({countPermitidos})</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Situação</span>
        </button>
      </div>

      {/* Formulário de Nova Situação (Colapsável) */}
      {isAddingNew && (
        <form onSubmit={handleCreateNewSituation} className="bg-blue-50/50 border-2 border-blue-200 p-4 rounded-2xl shadow-xs space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-blue-200 pb-2">
            <span className="font-extrabold uppercase text-blue-950 text-xs flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Nova Situação Cadastral de Profissional</span>
            </span>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-xs text-blue-700 hover:underline font-bold"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">Nome da Situação (Cadastro Básico) *</label>
              <select
                value={newSitNome}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewSitNome(val);
                  const found = cadastrosSituacoes.find(s => s.nome.toLowerCase() === val.toLowerCase());
                  if (found) {
                    if (found.codigo) setNewSitCodigo(found.codigo);
                    if (found.descricao) setNewSitDescricao(found.descricao);
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold uppercase"
                required
              >
                <option value="">SELECIONE A SITUAÇÃO...</option>
                {cadastrosSituacoes.map(sit => (
                  <option key={sit.id} value={sit.nome}>{sit.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">Código Abreviado</label>
              <input
                type="text"
                value={newSitCodigo}
                onChange={(e) => setNewSitCodigo(e.target.value)}
                placeholder="Ex: INT_CAUT"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold uppercase"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">Classificação para ART</label>
              <select
                value={newSitImpedida ? 'IMPEDIDA' : 'PERMITIDA'}
                onChange={(e) => setNewSitImpedida(e.target.value === 'IMPEDIDA')}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold uppercase"
              >
                <option value="IMPEDIDA">IMPEDIDA (BLOQUEIA ART)</option>
                <option value="PERMITIDA">PERMITIDA (APTA PARA ART)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">Descrição / Justificativa</label>
            <input
              type="text"
              value={newSitDescricao}
              onChange={(e) => setNewSitDescricao(e.target.value)}
              placeholder="Ex: Medida cautelar administrativa preventiva que suspende o exercício temporariamente."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl uppercase shadow-xs cursor-pointer"
            >
              Salvar Situação no Banco
            </button>
          </div>
        </form>
      )}

      {/* Grade de Situações com Switches e Detalhes de Regra */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-600" />
            <h3 className="font-black text-xs uppercase text-slate-800">
              Grade de Situações Cadastrais & Regras de Assunção de RT
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {filteredSituacoes.length} situações listadas
          </span>
        </div>

        {filteredSituacoes.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <UserX className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">Nenhuma situação encontrada</p>
            <p className="text-xs text-slate-400">Tente ajustar os termos de pesquisa ou o filtro selecionado.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSituacoes.map((sit) => {
              const impedido = isImpedida(sit.nome);
              const meta = SITUACOES_METADATA[sit.nome];

              return (
                <div 
                  key={sit.nome}
                  className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    impedido ? 'bg-rose-50/30 hover:bg-rose-50/50' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {sit.codigo || 'SIT'}
                      </span>
                      <span className="font-extrabold text-sm uppercase text-slate-900">
                        {sit.nome}
                      </span>
                      
                      {impedido ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-extrabold uppercase flex items-center gap-1 shadow-2xs">
                          <Lock className="w-3 h-3 text-rose-600" />
                          <span>IMPEDIDO DE ASSUMIR ART / RT</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold uppercase flex items-center gap-1 shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>HABILITADO PARA ASSUMIR RT</span>
                        </span>
                      )}

                      {meta?.recomendacaoCff && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-bold uppercase">
                          Recomendação CFF
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {sit.descricao || meta?.descricao || 'Sem descrição detalhada cadastrada.'}
                    </p>

                    {meta?.baseLegal && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                        <Info className="w-3 h-3 text-slate-400" />
                        <span>Fundamentação: {meta.baseLegal}</span>
                      </div>
                    )}
                  </div>

                  {/* Controle de Toggle Interativo */}
                  <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                    <div className="text-right">
                      <span className={`block text-[11px] font-bold uppercase ${
                        impedido ? 'text-rose-700' : 'text-emerald-700'
                      }`}>
                        {impedido ? 'Bloquear RT' : 'Permitir RT'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {impedido ? 'Ação negada' : 'Ação deferida'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleImpedimento(sit.nome)}
                      className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        impedido ? 'bg-rose-600' : 'bg-slate-300'
                      }`}
                      title={impedido ? 'Clique para desmarcar o impedimento' : 'Clique para marcar esta situação como impeditiva para ART'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                          impedido ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      >
                        {impedido ? (
                          <Lock className="w-3.5 h-3.5 text-rose-600" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rodapé Informativo */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Ao marcar uma situação como impeditiva, qualquer tentativa de vincular o profissional como Responsável Técnico na aba de <strong>Empresas</strong> ou emitir CRT para uma firma com RT nesta condição será automaticamente barrada pelo sistema.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
