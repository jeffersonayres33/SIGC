import React, { useState } from 'react';
import { 
  FileCheck, 
  Download, 
  Printer, 
  CheckSquare, 
  Square, 
  RotateCcw, 
  Filter, 
  ArrowUpDown, 
  Play, 
  Table, 
  FileSpreadsheet, 
  Layers, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { exportToCSV } from '../../services/exportService';
import { toastService } from '../../services/toastService';

interface FieldOption {
  key: string;
  label: string;
  defaultChecked: boolean;
}

const AVAILABLE_FIELDS: FieldOption[] = [
  { key: 'tipoAssociado', label: 'TP (Tipo)', defaultChecked: true },
  { key: 'inscricao', label: 'Inscrição', defaultChecked: true },
  { key: 'nome', label: 'Nome do Profissional', defaultChecked: true },
  { key: 'situacao', label: 'Situação', defaultChecked: true },
  { key: 'cpf', label: 'CPF', defaultChecked: true },
  { key: 'rg', label: 'RG / Órgão', defaultChecked: false },
  { key: 'dataNascimento', label: 'Dt. Nasc.', defaultChecked: false },
  { key: 'sexo', label: 'Sexo', defaultChecked: false },
  { key: 'naturalidade', label: 'Naturalidade', defaultChecked: false },
  { key: 'dataInscricao', label: 'Dt. Inscrição', defaultChecked: true },
  { key: 'dataColacaoGrau', label: 'Dt. Colação', defaultChecked: false },
  { key: 'faculdade', label: 'Faculdade / IES', defaultChecked: true },
  { key: 'emailPessoal', label: 'E-mail Pessoal', defaultChecked: false },
  { key: 'telefone', label: 'Telefone', defaultChecked: false },
  { key: 'celular', label: 'Celular', defaultChecked: true },
  { key: 'endereco', label: 'Endereço', defaultChecked: false },
  { key: 'bairro', label: 'Bairro', defaultChecked: false },
  { key: 'cidade', label: 'Cidade', defaultChecked: true },
  { key: 'uf', label: 'UF', defaultChecked: true },
  { key: 'statusFinanceiro', label: 'Status Financeiro', defaultChecked: true }
];

export const RelatoriosView: React.FC = () => {
  const [selectedFields, setSelectedFields] = useState<string[]>(
    AVAILABLE_FIELDS.filter(f => f.defaultChecked).map(f => f.key)
  );

  // Filters State
  const [targetType, setTargetType] = useState<'PROFISSIONAIS' | 'EMPRESAS'>('PROFISSIONAIS');
  const [filtroSituacao, setFiltroSituacao] = useState('Todos');
  const [filtroTipoAssociado, setFiltroTipoAssociado] = useState('Todos');
  const [filtroSexo, setFiltroSexo] = useState('Todos');
  const [filtroCidade, setFiltroCidade] = useState('');
  const [filtroStatusFin, setFiltroStatusFin] = useState('Todos');

  // Ordering
  const [ordem1, setOrdem1] = useState('nome');
  const [ordem1Dir, setOrdem1Dir] = useState<'ASC' | 'DESC'>('ASC');

  const [activeTab, setActiveTab] = useState<'CONFIG' | 'PREVIEW'>('CONFIG');
  const [generatedData, setGeneratedData] = useState<any[]>([]);

  const handleToggleField = (key: string) => {
    if (selectedFields.includes(key)) {
      setSelectedFields(selectedFields.filter(f => f !== key));
    } else {
      setSelectedFields([...selectedFields, key]);
    }
  };

  const handleSelectAllFields = () => {
    setSelectedFields(AVAILABLE_FIELDS.map(f => f.key));
  };

  const handleClearAllFields = () => {
    setSelectedFields([]);
  };

  const handleGenerateReport = () => {
    let raw = storageService.getProfissionaisPaginated(1, 300, {
      situacao: filtroSituacao,
      tipoAssociado: filtroTipoAssociado,
      statusFinanceiro: filtroStatusFin
    }).items;

    if (filtroCidade) {
      raw = raw.filter(p => p.cidade.toLowerCase().includes(filtroCidade.toLowerCase()) || p.bairro.toLowerCase().includes(filtroCidade.toLowerCase()));
    }
    if (filtroSexo !== 'Todos') {
      raw = raw.filter(p => p.sexo === filtroSexo);
    }

    // Sort
    raw.sort((a: any, b: any) => {
      const valA = a[ordem1] || '';
      const valB = b[ordem1] || '';
      return ordem1Dir === 'ASC' 
        ? String(valA).localeCompare(String(valB)) 
        : String(valB).localeCompare(String(valA));
    });

    setGeneratedData(raw);
    setActiveTab('PREVIEW');
    toastService.success(
      'Relatório Gerado',
      `${raw.length} registros processados conforme matriz analítica de campos.`
    );
  };

  const handleExportCSV = () => {
    const dataToExport = generatedData.map((item: any) => {
      const row: any = {};
      selectedFields.forEach(fieldKey => {
        const fieldMeta = AVAILABLE_FIELDS.find(f => f.key === fieldKey);
        if (fieldMeta) {
          row[fieldMeta.label] = item[fieldKey] || '';
        }
      });
      return row;
    });

    exportToCSV(`relatorio_conselho_${Date.now()}`, dataToExport);
    toastService.info('Download Iniciado', 'Planilha exportada com sucesso.');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>Módulo de Relatórios Analíticos & BI</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gerador customizado com seleção dinâmica de colunas, ordenação múltipla e exportação oficial.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'PREVIEW' && (
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar XLS / CSV</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab(activeTab === 'CONFIG' ? 'PREVIEW' : 'CONFIG')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>{activeTab === 'CONFIG' ? 'Visualizar Prévia' : 'Ajustar Filtros'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'CONFIG' && (
        <div className="space-y-5">
          {/* Matriz de Seleção de Campos */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. Seleção de Colunas / Campos no Relatório
                </h2>
                <p className="text-xs text-slate-500">Marque as colunas que devem constar no relatório final</p>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <button
                  onClick={handleSelectAllFields}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold border border-blue-200"
                >
                  Marcar Todos
                </button>
                <button
                  onClick={handleClearAllFields}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200"
                >
                  Desmarcar Todos
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {AVAILABLE_FIELDS.map((field) => {
                const isChecked = selectedFields.includes(field.key);
                return (
                  <button
                    key={field.key}
                    type="button"
                    onClick={() => handleToggleField(field.key)}
                    className={`flex items-center space-x-2 p-2.5 rounded-xl border text-left text-xs transition-all ${
                      isChecked 
                        ? 'bg-blue-50 text-blue-900 border-blue-300 font-bold shadow-xs' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isChecked ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                    <span className="truncate">{field.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtros e Ordenação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Filtros */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                2. Filtros e Parâmetros de Busca
              </h2>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Situação Cadastral</label>
                  <select
                    value={filtroSituacao}
                    onChange={(e) => setFiltroSituacao(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  >
                    <option value="Todos">Todas as Situações</option>
                    <option value="Definitivo">Definitivo</option>
                    <option value="Provisório">Provisório</option>
                    <option value="Transferido">Transferido</option>
                    <option value="Suspenso">Suspenso</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Habilitação (Tipo)</label>
                  <select
                    value={filtroTipoAssociado}
                    onChange={(e) => setFiltroTipoAssociado(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  >
                    <option value="Todos">Todas as Habilitações</option>
                    <option value="Farmacêutico">Farmacêutico</option>
                    <option value="Farmacêutico Bioquímico">Farmacêutico Bioquímico</option>
                    <option value="Técnico em Farmácia">Técnico em Farmácia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Financeiro</label>
                  <select
                    value={filtroStatusFin}
                    onChange={(e) => setFiltroStatusFin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  >
                    <option value="Todos">Todos os Status</option>
                    <option value="Adimplente">Adimplente</option>
                    <option value="Inadimplente">Inadimplente</option>
                    <option value="Parcelamento">Em Parcelamento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cidade / Bairro</label>
                  <input
                    type="text"
                    value={filtroCidade}
                    onChange={(e) => setFiltroCidade(e.target.value)}
                    placeholder="Filtrar por cidade..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Ordenação & Executar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  3. Critério de Ordenação
                </h2>
                <div className="grid grid-cols-2 gap-3 text-xs mt-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Ordenar por</label>
                    <select
                      value={ordem1}
                      onChange={(e) => setOrdem1(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                    >
                      <option value="nome">Nome do Profissional</option>
                      <option value="inscricao">Número de Inscrição</option>
                      <option value="dataInscricao">Data de Inscrição</option>
                      <option value="faculdade">Faculdade / IES</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Direção</label>
                    <select
                      value={ordem1Dir}
                      onChange={(e) => setOrdem1Dir(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                    >
                      <option value="ASC">Crescente (A-Z / Menor-Maior)</option>
                      <option value="DESC">Decrescente (Z-A / Maior-Menor)</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateReport}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Processar e Gerar Relatório</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'PREVIEW' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-0">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Registros Encontrados: {generatedData.length}
            </span>
            <span className="text-xs text-slate-500">
              {selectedFields.length} colunas selecionadas
            </span>
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100 z-10">
                <tr className="border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                  {selectedFields.map(fieldKey => {
                    const fieldMeta = AVAILABLE_FIELDS.find(f => f.key === fieldKey);
                    return (
                      <th key={fieldKey} className="py-3 px-3 whitespace-nowrap">
                        {fieldMeta?.label || fieldKey}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {generatedData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    {selectedFields.map(fieldKey => (
                      <td key={fieldKey} className="py-2.5 px-3 text-slate-800 whitespace-nowrap">
                        {item[fieldKey] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
