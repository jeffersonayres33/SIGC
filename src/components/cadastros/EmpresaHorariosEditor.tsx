import React from 'react';
import { 
  Clock, 
  Building2, 
  RotateCcw, 
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { HorarioFuncionamentoItem, CondicaoFirma, RegraAssistenciaFarmaceutica } from '../../types';
import { calculateDayTotalHours } from '../../services/storageService';
import { toastService } from '../../services/toastService';

interface EmpresaHorariosEditorProps {
  horariosFuncionamento: HorarioFuncionamentoItem[];
  onChangeFuncionamento: (items: HorarioFuncionamentoItem[]) => void;
  avaliacao?: {
    condicao: CondicaoFirma;
    regraAplicada: RegraAssistenciaFarmaceutica | null;
    horasFuncionamentoSemanais: number;
    horasAssistenciaSemanais: number;
    justificativa: string;
  };
  cidade: string;
  tipoEstabelecimento: string;
}

export const EmpresaHorariosEditor: React.FC<EmpresaHorariosEditorProps> = ({
  horariosFuncionamento,
  onChangeFuncionamento,
  avaliacao,
  cidade,
  tipoEstabelecimento
}) => {
  const handleUpdateFuncDay = (index: number, field: keyof HorarioFuncionamentoItem, value: any) => {
    const updated = [...horariosFuncionamento];
    updated[index] = { ...updated[index], [field]: value };
    updated[index].totalHorasDia = calculateDayTotalHours(updated[index]);
    onChangeFuncionamento(updated);
  };

  const applyPresetComercial = () => {
    const preset: HorarioFuncionamentoItem[] = [
      { dia: 'Domingo', ativo: false, inicio1: '', fim1: '', totalHorasDia: 0 },
      { dia: 'Segunda', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
      { dia: 'Terça', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
      { dia: 'Quarta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
      { dia: 'Quinta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
      { dia: 'Sexta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
      { dia: 'Sábado', ativo: true, inicio1: '08:00', fim1: '12:00', totalHorasDia: 4 },
      { dia: 'Feriados', ativo: false, inicio1: '', fim1: '', totalHorasDia: 0 }
    ];
    onChangeFuncionamento(preset);
    toastService.info('Modelo Aplicado', 'Grade comercial (44h semanais) configurada.');
  };

  const applyPresetContinuo15h = () => {
    const preset: HorarioFuncionamentoItem[] = [
      { dia: 'Domingo', ativo: false, inicio1: '', fim1: '', totalHorasDia: 0 },
      { dia: 'Segunda', ativo: true, inicio1: '06:00', fim1: '21:00', totalHorasDia: 15 },
      { dia: 'Terça', ativo: true, inicio1: '06:00', fim1: '21:00', totalHorasDia: 15 },
      { dia: 'Quarta', ativo: true, inicio1: '06:00', fim1: '21:00', totalHorasDia: 15 },
      { dia: 'Quinta', ativo: true, inicio1: '06:00', fim1: '21:00', totalHorasDia: 15 },
      { dia: 'Sexta', ativo: true, inicio1: '06:00', fim1: '21:00', totalHorasDia: 15 },
      { dia: 'Sábado', ativo: true, inicio1: '06:00', fim1: '21:00', totalHorasDia: 15 },
      { dia: 'Feriados', ativo: false, inicio1: '', fim1: '', totalHorasDia: 0 }
    ];
    onChangeFuncionamento(preset);
    toastService.info('Modelo Aplicado', 'Grade contínua de 06:00 às 21:00 (90h semanais) configurada.');
  };

  const applyPreset12h = () => {
    const preset: HorarioFuncionamentoItem[] = [
      { dia: 'Domingo', ativo: false, inicio1: '', fim1: '', totalHorasDia: 0 },
      { dia: 'Segunda', ativo: true, inicio1: '08:00', fim1: '20:00', totalHorasDia: 12 },
      { dia: 'Terça', ativo: true, inicio1: '08:00', fim1: '20:00', totalHorasDia: 12 },
      { dia: 'Quarta', ativo: true, inicio1: '08:00', fim1: '20:00', totalHorasDia: 12 },
      { dia: 'Quinta', ativo: true, inicio1: '08:00', fim1: '20:00', totalHorasDia: 12 },
      { dia: 'Sexta', ativo: true, inicio1: '08:00', fim1: '20:00', totalHorasDia: 12 },
      { dia: 'Sábado', ativo: true, inicio1: '08:00', fim1: '20:00', totalHorasDia: 12 },
      { dia: 'Feriados', ativo: false, inicio1: '', fim1: '', totalHorasDia: 0 }
    ];
    onChangeFuncionamento(preset);
    toastService.info('Modelo Aplicado', 'Grade de 12 horas diárias (72h semanais) configurada.');
  };

  const applyPreset24h = () => {
    const preset: HorarioFuncionamentoItem[] = [
      { dia: 'Domingo', ativo: true, inicio1: '00:00', fim1: '24:00', totalHorasDia: 24 },
      { dia: 'Segunda', ativo: true, inicio1: '00:00', fim1: '24:00', totalHorasDia: 24 },
      { dia: 'Terça', ativo: true, inicio1: '00:00', fim1: '24:00', totalHorasDia: 24 },
      { dia: 'Quarta', ativo: true, inicio1: '00:00', fim1: '24:00', totalHorasDia: 24 },
      { dia: 'Quinta', ativo: true, inicio1: '00:00', fim1: '24:00', totalHorasDia: 24 },
      { dia: 'Sexta', ativo: true, inicio1: '00:00', fim1: '24:00', totalHorasDia: 24 },
      { dia: 'Sábado', ativo: true, inicio1: '00:00', fim1: '24:00', totalHorasDia: 24 },
      { dia: 'Feriados', ativo: true, inicio1: '00:00', fim1: '24:00', totalHorasDia: 24 }
    ];
    onChangeFuncionamento(preset);
    toastService.info('Modelo Aplicado', 'Grade 24 horas ininterruptas (168h semanais) configurada.');
  };

  const totalHorasFuncionamento = horariosFuncionamento.reduce((acc, h) => acc + (calculateDayTotalHours(h) || 0), 0);

  return (
    <div className="space-y-4">
      {/* Banner Informativo & Total de Horas da Empresa */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold uppercase text-xs sm:text-sm text-slate-900 flex items-center gap-2">
              <span>Horário de Funcionamento do Estabelecimento</span>
            </h4>
            <p className="text-[11px] text-slate-600">
              Período em que as portas da empresa/drogaria ficam abertas para atendimento ao público.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-slate-600 uppercase">Total Aberto:</span>
          <span className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-mono font-bold text-sm shadow-xs">
            {Number(totalHorasFuncionamento.toFixed(1))}h / semana
          </span>
        </div>
      </div>

      {/* Toolbar com Modelos Rápidos */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
        <span className="font-bold text-slate-700 uppercase text-[11px]">Modelos de Horário da Firma:</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={applyPresetComercial}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-[10px] uppercase shadow-2xs transition-colors cursor-pointer"
          >
            Comercial (44h)
          </button>
          <button
            type="button"
            onClick={applyPresetContinuo15h}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-[10px] uppercase shadow-2xs transition-colors cursor-pointer"
          >
            06:00 às 21:00 (90h)
          </button>
          <button
            type="button"
            onClick={applyPreset12h}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-[10px] uppercase shadow-2xs transition-colors cursor-pointer"
          >
            12 Horas / Dia
          </button>
          <button
            type="button"
            onClick={applyPreset24h}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-[10px] uppercase shadow-2xs transition-colors cursor-pointer"
          >
            24 Horas
          </button>
        </div>
      </div>

      {/* Tabela de Dias de Funcionamento */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">Aberto</th>
              <th className="py-2.5 px-3 w-32">Dia da Semana</th>
              <th className="py-2.5 px-3 text-center">1º Turno (Início às Fim)</th>
              <th className="py-2.5 px-3 text-center">2º Turno (Início às Fim)</th>
              <th className="py-2.5 px-3 w-24 text-right">Horas / Dia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {horariosFuncionamento.map((item, idx) => {
              const dayTotal = calculateDayTotalHours(item);

              return (
                <tr key={item.dia} className={`hover:bg-slate-50/80 transition-colors ${!item.ativo ? 'bg-slate-50/50 opacity-60' : ''}`}>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={item.ativo}
                      onChange={(e) => handleUpdateFuncDay(idx, 'ativo', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>

                  <td className="py-2.5 px-3 font-bold text-slate-800 uppercase text-[11px]">
                    {item.dia}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <div className="inline-flex items-center space-x-1.5">
                      <input
                        type="time"
                        disabled={!item.ativo}
                        value={item.inicio1 || ''}
                        onChange={(e) => handleUpdateFuncDay(idx, 'inicio1', e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-xs disabled:bg-slate-100 disabled:text-slate-400"
                      />
                      <span className="text-slate-400 font-bold text-[10px]">às</span>
                      <input
                        type="time"
                        disabled={!item.ativo}
                        value={item.fim1 || ''}
                        onChange={(e) => handleUpdateFuncDay(idx, 'fim1', e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-xs disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <div className="inline-flex items-center space-x-1.5">
                      <input
                        type="time"
                        disabled={!item.ativo}
                        value={item.inicio2 || ''}
                        onChange={(e) => handleUpdateFuncDay(idx, 'inicio2', e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-xs disabled:bg-slate-100 disabled:text-slate-400"
                      />
                      <span className="text-slate-400 font-bold text-[10px]">às</span>
                      <input
                        type="time"
                        disabled={!item.ativo}
                        value={item.fim2 || ''}
                        onChange={(e) => handleUpdateFuncDay(idx, 'fim2', e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-xs disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                    {item.ativo ? `${dayTotal.toFixed(1)}h` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-center space-x-2">
        <span>💡</span>
        <span>
          <strong>Nota de Regulação:</strong> Os horários de assistência farmacêutica de cada profissional são vinculados e gerenciados individualmente na <strong>Aba 3: Profissionais (RT)</strong>.
        </span>
      </div>
    </div>
  );
};
