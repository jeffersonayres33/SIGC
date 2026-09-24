import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  UserCheck, 
  Briefcase, 
  Sparkles, 
  RotateCcw, 
  Calendar,
  Building2,
  Copy,
  Info,
  AlertTriangle,
  Lock,
  Ban
} from 'lucide-react';
import { Profissional, ResponsavelTecnico, HorarioTrabalhoRT, HorarioFuncionamentoItem } from '../../types';
import { storageService, calculateIntervalHours, calculateDayTotalHours, DEFAULT_HORARIOS_RT, calculateRtWeeklyHours, DEFAULT_HORARIOS_FUNCIONAMENTO } from '../../services/storageService';
import { maskCPF } from '../../utils/documentUtils';
import { toastService } from '../../services/toastService';

interface ResponsavelTecnicoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rt: ResponsavelTecnico) => void;
  initialData?: ResponsavelTecnico | null;
  empresaFuncionamento?: HorarioFuncionamentoItem[];
  cidade?: string;
  tipoEstabelecimento?: string;
}

const DIAS_SEMANA_ORDEM = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Feriados'];

interface CompanyDayInfo {
  isOperating: boolean;
  rangeSummary: string;
  minTime: string;
  maxTime: string;
  funcItem?: HorarioFuncionamentoItem;
}

export const getCompanyDayInfo = (diaNome: string, empresaFuncionamento?: HorarioFuncionamentoItem[]): CompanyDayInfo => {
  const funcionamentoToUse = (empresaFuncionamento && empresaFuncionamento.length > 0)
    ? empresaFuncionamento
    : DEFAULT_HORARIOS_FUNCIONAMENTO;

  const func = funcionamentoToUse.find((f: HorarioFuncionamentoItem) => f.dia.toLowerCase().startsWith(diaNome.toLowerCase().slice(0, 3)));
  if (!func || func.ativo === false || (!func.inicio1 && !func.inicio2)) {
    return {
      isOperating: false,
      rangeSummary: 'Empresa Fechada',
      minTime: '',
      maxTime: '',
      funcItem: func
    };
  }

  const minTime = func.inicio1 || '08:00';
  const maxTime = func.fim2 || func.fim1 || '18:00';

  let rangeSummary = `${func.inicio1} às ${func.fim1}`;
  if (func.inicio2 && func.fim2) {
    rangeSummary += ` e ${func.inicio2} às ${func.fim2}`;
  }

  return {
    isOperating: true,
    rangeSummary,
    minTime,
    maxTime,
    funcItem: func
  };
};

const timeToMinutes = (t?: string): number => {
  if (!t) return -1;
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return -1;
  return h * 60 + m;
};

export const validateDayRtTimes = (
  item: HorarioTrabalhoRT,
  empresaFuncionamento?: HorarioFuncionamentoItem[]
): { valid: boolean; error?: string } => {
  if (!item.ativo) return { valid: true };

  const info = getCompanyDayInfo(item.dia, empresaFuncionamento);

  if (!info.isOperating) {
    return {
      valid: false,
      error: `A empresa está FECHADA aos(às) ${item.dia}s. Não é permitido vincular assistência neste dia.`
    };
  }

  if (!item.inicio1 || !item.fim1) {
    return {
      valid: false,
      error: `Preencha o horário de entrada e saída do 1º turno para ${item.dia}.`
    };
  }

  const tInit1 = timeToMinutes(item.inicio1);
  const tFim1 = timeToMinutes(item.fim1);
  const tCompMin = timeToMinutes(info.minTime);
  const tCompMax = timeToMinutes(info.maxTime);

  if (tInit1 >= tFim1) {
    return {
      valid: false,
      error: `Em ${item.dia}, o horário de início (1º turno: ${item.inicio1}) deve ser anterior ao de término (${item.fim1}).`
    };
  }

  if (tInit1 < tCompMin || tFim1 > tCompMax) {
    return {
      valid: false,
      error: `Horário de 1º turno em ${item.dia} (${item.inicio1} às ${item.fim1}) excede o funcionamento da empresa (${info.rangeSummary}).`
    };
  }

  if (item.inicio2 || item.fim2) {
    if (!item.inicio2 || !item.fim2) {
      return {
        valid: false,
        error: `Preencha o horário de entrada e saída completo do 2º turno para ${item.dia}.`
      };
    }
    const tInit2 = timeToMinutes(item.inicio2);
    const tFim2 = timeToMinutes(item.fim2);

    if (tInit2 <= tFim1) {
      return {
        valid: false,
        error: `Em ${item.dia}, o 2º turno (${item.inicio2}) deve iniciar após o término do 1º turno (${item.fim1}).`
      };
    }

    if (tInit2 >= tFim2) {
      return {
        valid: false,
        error: `Em ${item.dia}, o início do 2º turno (${item.inicio2}) deve ser anterior ao seu término (${item.fim2}).`
      };
    }

    if (tInit2 < tCompMin || tFim2 > tCompMax) {
      return {
        valid: false,
        error: `Horário de 2º turno em ${item.dia} (${item.inicio2} às ${item.fim2}) excede o funcionamento da empresa (${info.rangeSummary}).`
      };
    }
  }

  return { valid: true };
};

export const ResponsavelTecnicoEditorModal: React.FC<ResponsavelTecnicoEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  empresaFuncionamento,
  cidade,
  tipoEstabelecimento
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('Todos');
  const [situacaoFilter, setSituacaoFilter] = useState('Todos');
  const [page, setPage] = useState(1);
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);

  // Form State
  const [cargo, setCargo] = useState<string>('RESPONSÁVEL TÉCNICO');
  const [situacaoVinculo, setSituacaoVinculo] = useState<string>('CTPS');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [horarios, setHorarios] = useState<HorarioTrabalhoRT[]>([]);

  // Cadastros Basicos
  const cadastrosTipos = storageService.getCadastrosBasicos('TIPO_PROFISSIONAL').filter(i => i.ativo);
  const cadastrosSituacoes = storageService.getCadastrosBasicos('SITUACAO_PROFISSIONAL').filter(i => i.ativo);
  const cadastrosSituacoesVinculo = storageService.getCadastrosBasicos('SITUACAO_VINCULO').filter(i => i.ativo);

  // Regra de Assistência Farmacêutica para verificação de modalidade SEM_HORA_DEFINIDA
  const regrasAssistencia = storageService.getRegrasAssistencia();
  const normCidade = (cidade || '').trim().toUpperCase();
  const normTipo = (tipoEstabelecimento || '').trim().toUpperCase();
  const regraAssistencia = regrasAssistencia.find(r => 
    r.ativo &&
    (r.municipio.toUpperCase() === normCidade || r.municipio.toUpperCase().includes('TODOS') || r.municipio === '*') &&
    (r.tipoEstabelecimento.toUpperCase() === normTipo || normTipo.includes(r.tipoEstabelecimento.toUpperCase()) || r.tipoEstabelecimento.toUpperCase().includes(normTipo))
  );
  const isSemHoraDefinida = regraAssistencia?.tipoExigencia === 'SEM_HORA_DEFINIDA';

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Mode: Edit existing RT
        setCargo(initialData.cargo || 'RESPONSÁVEL TÉCNICO');
        setSituacaoVinculo(initialData.situacaoVinculo || 'CTPS');
        setDataInicio(initialData.dataInicio || new Date().toLocaleDateString('pt-BR'));
        
        // Find existing professional
        const prof = storageService.getProfissionalById(initialData.profissionalId) || 
                     storageService.findProfissionalByInscricao(initialData.profissionalInscricao);
        if (prof) {
          setSelectedProfissional(prof);
        } else {
          setSelectedProfissional({
            id: initialData.profissionalId,
            inscricao: initialData.profissionalInscricao,
            nome: initialData.profissionalNome,
            cpf: '000.000.000-00',
            rg: '',
            orgaoExpeditor: 'SSP',
            dataNascimento: '1985-01-01',
            sexo: 'M',
            nacionalidade: 'Brasileira',
            naturalidade: 'Manaus',
            nomeMae: '',
            situacao: 'Definitiva',
            tipoAssociado: 'Farmacêutico',
            dataInscricao: '01/01/2020',
            dataColacaoGrau: '01/01/2020',
            dataExpDiploma: '01/01/2020',
            faculdade: 'UFAM',
            emailComercial: '',
            emailPessoal: '',
            telefone: '',
            celular: '',
            endereco: '',
            bairro: '',
            cidade: 'MANAUS',
            uf: 'AM',
            cep: '69000-000',
            habilitacoes: []
          });
        }

        if (initialData.horarios && initialData.horarios.length > 0) {
          // Normalize days, respecting company operating days
          const merged = DIAS_SEMANA_ORDEM.map(diaNome => {
            const existing = initialData.horarios?.find(h => h.dia.toLowerCase().startsWith(diaNome.toLowerCase().slice(0, 3)));
            const companyInfo = getCompanyDayInfo(diaNome, empresaFuncionamento);

            if (!companyInfo.isOperating) {
              return {
                dia: diaNome,
                ativo: false,
                inicio1: '',
                fim1: '',
                inicio2: '',
                fim2: '',
                totalHorasDia: 0
              };
            }

            if (existing) {
              return {
                dia: diaNome,
                ativo: existing.ativo ?? (!!existing.inicio1 && !!existing.fim1),
                inicio1: existing.inicio1 || '',
                fim1: existing.fim1 || '',
                inicio2: existing.inicio2 || '',
                fim2: existing.fim2 || '',
                totalHorasDia: calculateDayTotalHours(existing)
              };
            }
            return {
              dia: diaNome,
              ativo: false,
              inicio1: '',
              fim1: '',
              inicio2: '',
              fim2: '',
              totalHorasDia: 0
            };
          });
          setHorarios(merged);
        } else {
          setHorarios(buildDefaultScheduleAlignedWithCompany(empresaFuncionamento));
        }
      } else {
        // Mode: New RT
        setSelectedProfissional(null);
        setSearchTerm('');
        setPage(1);
        setCargo('RESPONSÁVEL TÉCNICO');
        setSituacaoVinculo('CTPS');
        setDataInicio(new Date().toLocaleDateString('pt-BR'));
        setHorarios(buildDefaultScheduleAlignedWithCompany(empresaFuncionamento));
      }
    }
  }, [isOpen, initialData, empresaFuncionamento]);

  if (!isOpen) return null;

  const queryResult = storageService.getProfissionaisPaginated(page, 8, {
    search: searchTerm,
    tipoAssociado: tipoFilter,
    situacao: situacaoFilter
  });

  const handleUpdateDay = (index: number, field: keyof HorarioTrabalhoRT, value: any) => {
    const updated = [...horarios];
    const dayItem = updated[index];
    const companyInfo = getCompanyDayInfo(dayItem.dia, empresaFuncionamento);

    // If company does not operate on this day, disallow activating
    if (field === 'ativo' && value === true && !companyInfo.isOperating) {
      toastService.warning(
        'Dia Bloqueado',
        `A empresa não funciona aos(às) ${dayItem.dia}s. Não é permitido adicionar horário de assistência neste dia.`
      );
      return;
    }

    updated[index] = { ...updated[index], [field]: value };
    updated[index].totalHorasDia = calculateDayTotalHours(updated[index]);
    setHorarios(updated);
  };

  const totalHorasSemanaisCalculadas = calculateRtWeeklyHours(horarios);

  const handleCopyFuncionamento = () => {
    if (!empresaFuncionamento || empresaFuncionamento.length === 0) {
      toastService.warning('Sem Horários', 'A empresa ainda não possui grade de funcionamento configurada.');
      return;
    }
    const copied: HorarioTrabalhoRT[] = DIAS_SEMANA_ORDEM.map(diaNome => {
      const func = empresaFuncionamento.find(f => f.dia.toLowerCase().startsWith(diaNome.toLowerCase().slice(0, 3)));
      if (func && func.ativo !== false && (func.inicio1 || func.inicio2)) {
        return {
          dia: diaNome,
          ativo: true,
          inicio1: func.inicio1 || '',
          fim1: func.fim1 || '',
          inicio2: func.inicio2 || '',
          fim2: func.fim2 || '',
          totalHorasDia: calculateDayTotalHours(func)
        };
      }
      return {
        dia: diaNome,
        ativo: false,
        inicio1: '',
        fim1: '',
        inicio2: '',
        fim2: '',
        totalHorasDia: 0
      };
    });
    setHorarios(copied);
    toastService.success('Grade Sincronizada', 'Horários do RT ajustados estritamente ao funcionamento da empresa.');
  };

  const applyPresetSafely = (rawSchedule: HorarioTrabalhoRT[], presetName: string) => {
    const updated: HorarioTrabalhoRT[] = DIAS_SEMANA_ORDEM.map(diaNome => {
      const raw = rawSchedule.find(h => h.dia.toLowerCase().startsWith(diaNome.toLowerCase().slice(0, 3)));
      const info = getCompanyDayInfo(diaNome, empresaFuncionamento);

      if (!info.isOperating || !raw || !raw.ativo) {
        return {
          dia: diaNome,
          ativo: false,
          inicio1: '',
          fim1: '',
          inicio2: '',
          fim2: '',
          totalHorasDia: 0
        };
      }

      // Clip to company hours if needed
      const tCompMin = timeToMinutes(info.minTime);
      const tCompMax = timeToMinutes(info.maxTime);
      let init1 = raw.inicio1;
      let fim1 = raw.fim1;
      let init2 = raw.inicio2 || '';
      let fim2 = raw.fim2 || '';

      if (timeToMinutes(init1) < tCompMin) init1 = info.minTime;
      if (timeToMinutes(fim1) > tCompMax) fim1 = info.maxTime;

      const item: HorarioTrabalhoRT = {
        dia: diaNome,
        ativo: true,
        inicio1: init1,
        fim1: fim1,
        inicio2: init2,
        fim2: fim2
      };
      item.totalHorasDia = calculateDayTotalHours(item);
      return item;
    });

    setHorarios(updated);
    toastService.info('Modelo Aplicado', `${presetName} ajustado respeitando o horário de funcionamento da firma.`);
  };

  const applyPreset40h = () => {
    applyPresetSafely([
      { dia: 'Domingo', ativo: false, inicio1: '', fim1: '', totalHorasDia: 0 },
      { dia: 'Segunda', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
      { dia: 'Terça', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
      { dia: 'Quarta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
      { dia: 'Quinta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
      { dia: 'Sexta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
      { dia: 'Sábado', ativo: false, inicio1: '', fim1: '', totalHorasDia: 0 },
      { dia: 'Feriados', ativo: false, inicio1: '', fim1: '', totalHorasDia: 0 }
    ], 'Seg a Sex (40h)');
  };

  const applyPreset44h = () => {
    applyPresetSafely([
      { dia: 'Domingo', ativo: false, inicio1: '', fim1: '', totalHorasDia: 0 },
      { dia: 'Segunda', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
      { dia: 'Terça', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
      { dia: 'Quarta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
      { dia: 'Quinta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
      { dia: 'Sexta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
      { dia: 'Sábado', ativo: true, inicio1: '08:00', fim1: '12:00', totalHorasDia: 4 },
      { dia: 'Feriados', ativo: false, inicio1: '', fim1: '', totalHorasDia: 0 }
    ], 'Seg a Sáb (44h)');
  };

  const applyPreset4hDia = () => {
    applyPresetSafely([
      { dia: 'Domingo', ativo: false, inicio1: '', fim1: '', totalHorasDia: 0 },
      { dia: 'Segunda', ativo: true, inicio1: '11:00', fim1: '15:00', totalHorasDia: 4 },
      { dia: 'Terça', ativo: true, inicio1: '11:00', fim1: '15:00', totalHorasDia: 4 },
      { dia: 'Quarta', ativo: true, inicio1: '11:00', fim1: '15:00', totalHorasDia: 4 },
      { dia: 'Quinta', ativo: true, inicio1: '11:00', fim1: '15:00', totalHorasDia: 4 },
      { dia: 'Sexta', ativo: true, inicio1: '11:00', fim1: '15:00', totalHorasDia: 4 },
      { dia: 'Sábado', ativo: true, inicio1: '11:00', fim1: '15:00', totalHorasDia: 4 },
      { dia: 'Feriados', ativo: false, inicio1: '', fim1: '', totalHorasDia: 0 }
    ], 'Turno 4h/Dia');
  };

  const handleSelectProfissional = (prof: Profissional) => {
    const check = storageService.isProfissionalImpedidoRT(prof);
    if (check.impedido) {
      toastService.warning(
        'Profissional Impedido de Assumir RT',
        `${check.motivo} Altere a situação do profissional ou revise as configurações do CRF.`
      );
      return;
    }
    setSelectedProfissional(prof);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfissional) {
      toastService.warning('Selecione um Farmacêutico', 'Por favor, selecione o profissional farmacêutico na lista.');
      return;
    }

    // Impediment validation for RT
    const checkImpedimento = storageService.isProfissionalImpedidoRT(selectedProfissional);
    if (checkImpedimento.impedido) {
      toastService.error(
        'Assunção de RT Bloqueada pelo Conselho',
        checkImpedimento.motivo || `O profissional encontra-se na situação "${selectedProfissional.situacao}", impeditiva para Responsabilidade Técnica.`
      );
      return;
    }

    // Comprehensive Validation against Company Operating Hours (dispensada se modalidade técnica for SEM_HORA_DEFINIDA)
    if (!isSemHoraDefinida) {
      for (const item of horarios) {
        if (item.ativo) {
          const validation = validateDayRtTimes(item, empresaFuncionamento);
          if (!validation.valid) {
            toastService.warning(
              'Horário Incompatível com a Empresa',
              validation.error || `O horário cadastrado para ${item.dia} ultrapassa a faixa de funcionamento da empresa.`
            );
            return;
          }
        }
      }
    }

    const payload: ResponsavelTecnico = {
      profissionalId: selectedProfissional.id,
      profissionalInscricao: selectedProfissional.inscricao,
      profissionalNome: selectedProfissional.nome,
      tipo: 'F',
      cargo: cargo as any,
      situacaoVinculo: situacaoVinculo as any,
      dataInicio: dataInicio || new Date().toLocaleDateString('pt-BR'),
      cargaHorariaSemanal: totalHorasSemanaisCalculadas,
      horarios: horarios
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full my-6 max-h-[94vh] overflow-y-auto shadow-2xl p-4 sm:p-6 text-xs space-y-4 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase">
                {initialData ? 'EDITAR FARMACÊUTICO & HORÁRIO DE ASSISTÊNCIA' : 'VINCULAR FARMACÊUTICO & DEFINIR HORÁRIOS'}
              </h3>
              <p className="text-[11px] text-slate-500 uppercase">
                Defina a função e os dias/horários de assistência respeitando a grade de funcionamento da empresa.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* SEÇÃO 1: SELEÇÃO DE FARMACÊUTICO */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>1. SELECIONE O PROFISSIONAL FARMACÊUTICO (CRF):</span>
              </span>
              {selectedProfissional && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase">
                  ✓ PROFISSIONAL SELECIONADO
                </span>
              )}
            </div>

            {selectedProfissional ? (
              <div className={`p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs border ${
                storageService.isProfissionalImpedidoRT(selectedProfissional).impedido
                  ? 'bg-rose-50 border-rose-300'
                  : 'bg-emerald-50/90 border-emerald-300'
              }`}>
                <div>
                  <div className="font-bold text-slate-900 uppercase text-xs flex items-center gap-2">
                    <span>{selectedProfissional.nome}</span>
                    <span className="px-2 py-0.5 rounded bg-white text-slate-900 border border-slate-200 font-mono font-bold text-[10px]">
                      {selectedProfissional.inscricao}
                    </span>
                    {storageService.isProfissionalImpedidoRT(selectedProfissional).impedido && (
                      <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-bold text-[9px] flex items-center gap-1 uppercase">
                        <Lock className="w-3 h-3 text-rose-700" />
                        <span>IMPEDIDO DE ASSUMIR RT ({selectedProfissional.situacao})</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium uppercase mt-0.5 flex flex-wrap gap-2">
                    <span>CPF: {maskCPF(selectedProfissional.cpf)}</span>
                    <span>•</span>
                    <span>CATEGORIA: {selectedProfissional.tipoAssociado || 'FARMACÊUTICO'}</span>
                    <span>•</span>
                    <span className={`font-bold ${
                      storageService.isProfissionalImpedidoRT(selectedProfissional).impedido
                        ? 'text-rose-700'
                        : 'text-emerald-800'
                    }`}>
                      SITUAÇÃO: {selectedProfissional.situacao}
                    </span>
                  </div>
                  {storageService.isProfissionalImpedidoRT(selectedProfissional).impedido && (
                    <div className="mt-1.5 p-1.5 bg-rose-100 border border-rose-300 rounded text-[10px] text-rose-900 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                      <span>{storageService.isProfissionalImpedidoRT(selectedProfissional).motivo}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProfissional(null)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold text-[10px] uppercase cursor-pointer"
                >
                  Trocar Farmacêutico
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Search Bar & Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-6 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="BUSCAR POR NOME, CPF OU Nº CRF (EX: LUCAS OU 4150)..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs uppercase font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <select
                      value={tipoFilter}
                      onChange={(e) => {
                        setTipoFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs"
                    >
                      <option value="Todos">TODOS OS TIPOS</option>
                      {cadastrosTipos.map(t => (
                        <option key={t.id} value={t.nome}>{t.nome.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <select
                      value={situacaoFilter}
                      onChange={(e) => {
                        setSituacaoFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs"
                    >
                      <option value="Todos">TODAS SITUAÇÕES</option>
                      {cadastrosSituacoes.map(s => (
                        <option key={s.id} value={s.nome}>{s.nome.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pharmacists Grid */}
                {queryResult.items.length === 0 ? (
                  <div className="p-6 text-center bg-white border border-dashed border-slate-200 rounded-xl text-slate-400">
                    <p className="font-bold uppercase">Nenhum farmacêutico encontrado com esses critérios.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {queryResult.items.map((prof) => {
                      const impedimento = storageService.isProfissionalImpedidoRT(prof);

                      return (
                        <div
                          key={prof.id}
                          onClick={() => handleSelectProfissional(prof)}
                          className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between border ${
                            impedimento.impedido
                              ? 'bg-rose-50/40 hover:bg-rose-50 border-rose-200 hover:border-rose-400'
                              : 'bg-white hover:bg-emerald-50/50 border-slate-200 hover:border-emerald-400'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-slate-900 uppercase text-xs truncate max-w-[220px]">
                              {prof.nome}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                {prof.inscricao}
                              </span>
                              <span className="font-mono text-slate-500">
                                {maskCPF(prof.cpf)}
                              </span>
                            </div>
                            <div className="mt-1">
                              {impedimento.impedido ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded uppercase">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>IMPEDIDO DE ART ({prof.situacao})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 uppercase">
                                  <UserCheck className="w-2.5 h-2.5" />
                                  <span>{prof.situacao} (APTO)</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 pl-2">
                            {impedimento.impedido ? (
                              <span className="px-2 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
                                <Lock className="w-3 h-3 text-rose-600" />
                                <span>Bloqueado</span>
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase shadow-xs">
                                Selecionar
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {queryResult.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 font-bold uppercase cursor-pointer"
                    >
                      Anterior
                    </button>
                    <span className="font-semibold text-slate-500 uppercase">
                      Página {page} de {queryResult.totalPages} ({queryResult.total} profissionais)
                    </span>
                    <button
                      type="button"
                      disabled={page >= queryResult.totalPages}
                      onClick={() => setPage(p => Math.min(queryResult.totalPages, p + 1))}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 font-bold uppercase cursor-pointer"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SEÇÃO 2: DADOS DO CARGO & VÍNCULO */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="font-bold text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <span>2. CARGO TÉCNICO & REGIME DE CONTRATAÇÃO:</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Cargo Técnico no Estabelecimento *</label>
                <select
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs"
                >
                  <option value="RT PRINCIPAL">RT PRINCIPAL</option>
                  <option value="RESPONSÁVEL TÉCNICO">RESPONSÁVEL TÉCNICO</option>
                  <option value="RT SUBSTITUTO">RT SUBSTITUTO</option>
                  <option value="RT ASSISTENTE">RT ASSISTENTE</option>
                  <option value="RT PLANTONISTA">RT PLANTONISTA</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Situação do Vínculo (Cadastro Básico) *</label>
                <select
                  value={situacaoVinculo}
                  onChange={(e) => setSituacaoVinculo(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs"
                >
                  {cadastrosSituacoesVinculo.length > 0 ? (
                    cadastrosSituacoesVinculo.map(s => (
                      <option key={s.id} value={s.nome}>
                        {s.nome.toUpperCase()} {s.descricao ? `- ${s.descricao}` : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="CTPS">CTPS (CARTEIRA DE TRABALHO)</option>
                      <option value="CONTRATO SOCIAL">CONTRATO SOCIAL / SÓCIO</option>
                      <option value="PRESTADOR DE SERVIÇOS">PRESTADOR DE SERVIÇOS</option>
                      <option value="ESTATUTÁRIO">ESTATUTÁRIO / CONCURSADO</option>
                      <option value="CARGO EM COMISSÃO">CARGO EM COMISSÃO</option>
                    </>
                  )}
                  {situacaoVinculo && !cadastrosSituacoesVinculo.some(s => s.nome.toLowerCase() === situacaoVinculo.toLowerCase()) && (
                    <option value={situacaoVinculo}>{situacaoVinculo.toUpperCase()} (Atual)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Data de Assunção / Início</label>
                <input
                  type="text"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-semibold text-xs"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: GRADE DE DIAS E HORÁRIOS DESTE FARMACÊUTICO */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            {isSemHoraDefinida && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 flex items-start space-x-2">
                <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-[11px]">
                  <strong className="uppercase font-bold">MODALIDADE TÉCNICA: SEM HORA DEFINIDA</strong>
                  <p className="mt-0.5 text-purple-800">
                    Para este município ({cidade || 'Jurisdição'}) e estabelecimento ({tipoEstabelecimento || 'Geral'}), a exigência técnica está configurada como <strong>Sem Hora Definida</strong>. Nesta situação é permitido cadastrar qualquer horário livremente, não sendo obrigatório informar o horário de assistência do farmacêutico.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>
                    {isSemHoraDefinida 
                      ? '3. DIAS DA SEMANA E HORÁRIOS (SEM HORA DEFINIDA - HORÁRIO NÃO OBRIGATÓRIO / LIVRE):' 
                      : '3. DIAS DA SEMANA E HORÁRIO DESTE FARMACÊUTICO (OBRIGATÓRIO OBEDECER AO FUNCIONAMENTO):'}
                  </span>
                </span>
                <p className="text-[10px] text-slate-500">
                  {isSemHoraDefinida
                    ? 'Nesta modalidade, você pode cadastrar qualquer horário desejado ou deixar os horários em branco, sem obrigatoriedade de assistência pré-fixada.'
                    : 'Os horários cadastrados devem obrigatoriamente coincidir com os dias e a faixa em que a empresa está aberta.'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Carga do RT:</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs shadow-xs">
                  {totalHorasSemanaisCalculadas}h / semana
                </span>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-600 uppercase mr-1">Modelos Rápidos:</span>
              {empresaFuncionamento && (
                <button
                  type="button"
                  onClick={handleCopyFuncionamento}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-400 text-slate-700 font-semibold text-[10px] uppercase flex items-center space-x-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3 text-emerald-600" />
                  <span>Copiar Funcionamento da Firma</span>
                </button>
              )}
              <button
                type="button"
                onClick={applyPreset40h}
                className="px-2 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-[10px] uppercase cursor-pointer"
              >
                Seg a Sex (40h)
              </button>
              <button
                type="button"
                onClick={applyPreset44h}
                className="px-2 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-[10px] uppercase cursor-pointer"
              >
                Seg a Sáb (44h)
              </button>
              <button
                type="button"
                onClick={applyPreset4hDia}
                className="px-2 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-[10px] uppercase cursor-pointer"
              >
                4h/Dia
              </button>
            </div>

            {/* Grid Table with Company Constraint Indicators */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                    <th className="py-2 px-3 w-12 text-center">Ativo</th>
                    <th className="py-2 px-3 w-36">Dia da Semana & Limite Firma</th>
                    <th className="py-2 px-3">1º Turno (Entrada / Saída)</th>
                    <th className="py-2 px-3">2º Turno (Entrada / Saída)</th>
                    <th className="py-2 px-3 w-20 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {horarios.map((item, idx) => {
                    const companyInfo = getCompanyDayInfo(item.dia, empresaFuncionamento);
                    const validation = validateDayRtTimes(item, empresaFuncionamento);
                    const hasError = !isSemHoraDefinida && item.ativo && !validation.valid;
                    const canEditDay = isSemHoraDefinida || companyInfo.isOperating;

                    return (
                      <tr 
                        key={idx} 
                        className={`transition-colors ${
                          !canEditDay
                            ? 'bg-slate-100/60 opacity-60'
                            : hasError
                            ? 'bg-rose-50/60'
                            : item.ativo
                            ? 'hover:bg-slate-50/80'
                            : 'bg-slate-50/40 opacity-70'
                        }`}
                      >
                        <td className="py-2 px-3 text-center">
                          {canEditDay ? (
                            <input
                              type="checkbox"
                              checked={item.ativo}
                              onChange={(e) => handleUpdateDay(idx, 'ativo', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            />
                          ) : (
                            <div title="Empresa Fechada neste dia: Não é permitido adicionar assistência farmacêutica." className="flex justify-center">
                              <Ban className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                        </td>

                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-800 uppercase text-[11px]">
                            {item.dia}
                          </div>
                          <div className="mt-0.5">
                            {companyInfo.isOperating ? (
                              <span className="text-[9px] font-mono font-semibold text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 inline-block truncate max-w-[140px]" title={`Horário de Funcionamento da Empresa: ${companyInfo.rangeSummary}`}>
                                Firma: {companyInfo.rangeSummary}
                              </span>
                            ) : isSemHoraDefinida ? (
                              <span className="text-[9px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 inline-block">
                                Sem Hora Definida
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 inline-flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" />
                                <span>Firma Fechada</span>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2 px-3">
                          {canEditDay ? (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1.5">
                                <input
                                  type="time"
                                  disabled={!item.ativo}
                                  min={isSemHoraDefinida ? undefined : companyInfo.minTime}
                                  max={isSemHoraDefinida ? undefined : companyInfo.maxTime}
                                  value={item.inicio1 || ''}
                                  onChange={(e) => handleUpdateDay(idx, 'inicio1', e.target.value)}
                                  className={`px-2 py-1 bg-slate-50 border rounded-lg text-slate-900 font-mono font-bold text-xs disabled:bg-slate-100 disabled:text-slate-400 ${
                                    hasError ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-300'
                                  }`}
                                />
                                <span className="text-slate-400 font-bold text-[10px]">às</span>
                                <input
                                  type="time"
                                  disabled={!item.ativo}
                                  min={isSemHoraDefinida ? undefined : companyInfo.minTime}
                                  max={isSemHoraDefinida ? undefined : companyInfo.maxTime}
                                  value={item.fim1 || ''}
                                  onChange={(e) => handleUpdateDay(idx, 'fim1', e.target.value)}
                                  className={`px-2 py-1 bg-slate-50 border rounded-lg text-slate-900 font-mono font-bold text-xs disabled:bg-slate-100 disabled:text-slate-400 ${
                                    hasError ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-300'
                                  }`}
                                />
                              </div>
                              {hasError && (
                                <p className="text-[9px] text-rose-600 font-semibold">
                                  {validation.error}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">Sem atividade da firma</span>
                          )}
                        </td>

                        <td className="py-2 px-3">
                          {canEditDay ? (
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="time"
                                disabled={!item.ativo}
                                min={isSemHoraDefinida ? undefined : companyInfo.minTime}
                                max={isSemHoraDefinida ? undefined : companyInfo.maxTime}
                                value={item.inicio2 || ''}
                                onChange={(e) => handleUpdateDay(idx, 'inicio2', e.target.value)}
                                className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-xs disabled:bg-slate-100 disabled:text-slate-400"
                              />
                              <span className="text-slate-400 font-bold text-[10px]">às</span>
                              <input
                                type="time"
                                disabled={!item.ativo}
                                min={isSemHoraDefinida ? undefined : companyInfo.minTime}
                                max={isSemHoraDefinida ? undefined : companyInfo.maxTime}
                                value={item.fim2 || ''}
                                onChange={(e) => handleUpdateDay(idx, 'fim2', e.target.value)}
                                className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-xs disabled:bg-slate-100 disabled:text-slate-400"
                              />
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">-</span>
                          )}
                        </td>

                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                          {item.ativo && canEditDay ? `${calculateDayTotalHours(item).toFixed(1)}h` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{initialData ? 'SALVAR HORÁRIOS DO RT' : 'CONFIRMAR VÍNCULO DO RT'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const buildDefaultScheduleAlignedWithCompany = (empresaFuncionamento?: HorarioFuncionamentoItem[]): HorarioTrabalhoRT[] => {
  return DIAS_SEMANA_ORDEM.map(diaNome => {
    const info = getCompanyDayInfo(diaNome, empresaFuncionamento);
    if (!info.isOperating) {
      return {
        dia: diaNome,
        ativo: false,
        inicio1: '',
        fim1: '',
        inicio2: '',
        fim2: '',
        totalHorasDia: 0
      };
    }
    // If company operates, defaults:
    if (diaNome === 'Domingo' || diaNome === 'Feriados') {
      return {
        dia: diaNome,
        ativo: false,
        inicio1: '',
        fim1: '',
        totalHorasDia: 0
      };
    }
    return {
      dia: diaNome,
      ativo: true,
      inicio1: info.minTime || '08:00',
      fim1: info.funcItem?.fim1 || '12:00',
      inicio2: info.funcItem?.inicio2 || '14:00',
      fim2: info.maxTime || '18:00',
      totalHorasDia: calculateDayTotalHours({
        ativo: true,
        inicio1: info.minTime || '08:00',
        fim1: info.funcItem?.fim1 || '12:00',
        inicio2: info.funcItem?.inicio2 || '14:00',
        fim2: info.maxTime || '18:00'
      })
    };
  });
};
