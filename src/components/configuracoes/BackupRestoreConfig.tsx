import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  CheckSquare, 
  Square, 
  FileCode, 
  FileText, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  ShieldCheck, 
  HardDrive, 
  Layers, 
  RefreshCw,
  Search,
  Users,
  Building2,
  Coins,
  Gavel,
  Scale,
  FormInput,
  Compass,
  FileCheck,
  Building,
  History,
  Info
} from 'lucide-react';
import { storageService, CouncilConfig } from '../../services/storageService';
import { toastService } from '../../services/toastService';

interface TableDef {
  id: string;
  name: string;
  techName: string;
  category: 'cadastros' | 'financeiro' | 'fiscalizacao' | 'sistema';
  icon: React.ElementType;
  description: string;
}

const AVAILABLE_TABLES: TableDef[] = [
  {
    id: 'profissionais',
    name: 'Profissionais Inscritos (PF)',
    techName: 'public.profissionais',
    category: 'cadastros',
    icon: Users,
    description: 'Cadastros de farmacêuticos, técnicos, dados de contato, situação e recadastramento.'
  },
  {
    id: 'empresas',
    name: 'Empresas & Estabelecimentos (PJ)',
    techName: 'public.empresas',
    category: 'cadastros',
    icon: Building2,
    description: 'Farmácias, drogarias, distribuidoras, sócios, RTs e horários de assistência.'
  },
  {
    id: 'cadastros_basicos',
    name: 'Tabelas Auxiliares & Cadastros Básicos',
    techName: 'public.cadastros_basicos',
    category: 'cadastros',
    icon: Layers,
    description: 'Categorias profissionais, tipos de estabelecimentos, cursos e vias de documentos.'
  },
  {
    id: 'regras_assistencia',
    name: 'Regras de Assistência Farmacêutica',
    techName: 'public.regras_assistencia',
    category: 'fiscalizacao',
    icon: Scale,
    description: 'Horas mínimas de assistência exigidas por município e tipo de estabelecimento.'
  },
  {
    id: 'lancamentos_financeiros',
    name: 'Lançamentos Financeiros & Boletos',
    techName: 'public.lancamentos_financeiros',
    category: 'financeiro',
    icon: Coins,
    description: 'Anuidades, taxas de certidão, parcelamentos, códigos de barras e status de liquidação.'
  },
  {
    id: 'processos_cobranca',
    name: 'Processos de Cobrança & Dívida Ativa',
    techName: 'public.processos_cobranca',
    category: 'financeiro',
    icon: Gavel,
    description: 'Tramitações de cobrança, notificações administrativas e emissões de CDA.'
  },
  {
    id: 'termos_fiscalizacao',
    name: 'Termos e Autos de Fiscalização',
    techName: 'public.termos_fiscalizacao',
    category: 'fiscalizacao',
    icon: Compass,
    description: 'Termos de inspeção, autos de infração lavrados, irregularidades e prazos concedidos.'
  },
  {
    id: 'protocolos_processos',
    name: 'Protocolos & Processos Administrativos',
    techName: 'public.protocolos_processos',
    category: 'sistema',
    icon: FileCheck,
    description: 'Requerimentos de inscrição, transferências, defesas e histórico de despachos.'
  },
  {
    id: 'formularios_dinamicos',
    name: 'Modelos de Formulários Dinâmicos',
    techName: 'public.formularios_dinamicos',
    category: 'sistema',
    icon: FormInput,
    description: 'Estruturas de formulários customizados, pesquisas e requerimentos configurados.'
  },
  {
    id: 'respostas_formularios',
    name: 'Respostas Submetidas de Formulários',
    techName: 'public.respostas_formularios',
    category: 'sistema',
    icon: FileText,
    description: 'Submissões efetuadas por profissionais e empresas pelo autoatendimento.'
  },
  {
    id: 'council_config',
    name: 'Parâmetros e Configuração da Autarquia',
    techName: 'public.council_config',
    category: 'sistema',
    icon: Building,
    description: 'Dados institucionais do conselho, regras de sequencial, sufixos e validações.'
  },
  {
    id: 'historico_auditoria',
    name: 'Trilha de Auditoria & Logs de Ação',
    techName: 'public.historico_auditoria',
    category: 'sistema',
    icon: History,
    description: 'Registros cronológicos de alterações, bloqueios, inclusões e exclusões de dados.'
  }
];

export const BackupRestoreConfig: React.FC = () => {
  const [selectedTables, setSelectedTables] = useState<string[]>(AVAILABLE_TABLES.map(t => t.id));
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [activeSubTab, setActiveSubTab] = useState<'export' | 'import' | 'snapshots'>('export');
  const [isExporting, setIsExporting] = useState(false);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [syncSupabaseOnRestore, setSyncSupabaseOnRestore] = useState(true);
  const [importedFile, setImportedFile] = useState<{ name: string; content: any } | null>(null);
  const [importPreview, setImportPreview] = useState<{
    date?: string;
    council?: string;
    version?: string;
    tablesFound: { id: string; name: string; count: number }[];
    totalRecords: number;
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshCounts = () => {
    const counts = storageService.getTableCounts();
    setTableCounts(counts);
    setSnapshots(storageService.getLocalSnapshots());
  };

  useEffect(() => {
    refreshCounts();
    const unsub = storageService.subscribe(() => {
      refreshCounts();
    });
    return () => unsub();
  }, []);

  const totalSelectedRecords = selectedTables.reduce((acc, tableId) => {
    return acc + (tableCounts[tableId] || 0);
  }, 0);

  const totalSystemRecords = Object.values(tableCounts).reduce((a, b) => a + b, 0);

  const isAllSelected = selectedTables.length === AVAILABLE_TABLES.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedTables([]);
    } else {
      setSelectedTables(AVAILABLE_TABLES.map(t => t.id));
    }
  };

  const toggleTable = (id: string) => {
    setSelectedTables(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  // 1. Download de Backup JSON
  const handleExportJson = () => {
    if (selectedTables.length === 0) {
      toastService.warning('Nenhuma Tabela Selecionada', 'Selecione ao menos uma tabela para gerar o backup.');
      return;
    }

    setIsExporting(true);
    try {
      const data = storageService.getBackupData(selectedTables);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '-');
      a.href = url;
      a.download = `backup_siscon_${isAllSelected ? 'completo' : 'personalizado'}_${dateStr}_${timeStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toastService.success(
        'Backup JSON Concluído',
        `${selectedTables.length} tabela(s) exportadas com ${totalSelectedRecords} registro(s).`
      );
    } catch (err: any) {
      toastService.error('Erro no Backup', err?.message || 'Falha ao gerar arquivo JSON');
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Download de Backup SQL (PostgreSQL / Supabase DUMP)
  const handleExportSql = () => {
    if (selectedTables.length === 0) {
      toastService.warning('Nenhuma Tabela Selecionada', 'Selecione ao menos uma tabela para exportar em SQL.');
      return;
    }

    setIsExporting(true);
    try {
      const sql = storageService.generateSqlBackup(selectedTables);
      const blob = new Blob([sql], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `backup_siscon_${isAllSelected ? 'completo' : 'personalizado'}_${dateStr}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toastService.success(
        'Script SQL Gerado',
        'Arquivo de comandos SQL INSERT pronto para execução no Supabase/PostgreSQL.'
      );
    } catch (err: any) {
      toastService.error('Erro no SQL', err?.message || 'Falha ao gerar script SQL');
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Processamento do arquivo de restore
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const sourceData = parsed.dados || parsed.tables || parsed;

        if (!sourceData || typeof sourceData !== 'object') {
          throw new Error('O arquivo carregado não contém uma estrutura de dados válida.');
        }

        const tablesFound: { id: string; name: string; count: number }[] = [];
        let totalCount = 0;

        AVAILABLE_TABLES.forEach(tbl => {
          const rows = sourceData[tbl.id] || (tbl.id === 'lancamentos_financeiros' ? sourceData.lancamentos : undefined);
          if (Array.isArray(rows)) {
            tablesFound.push({
              id: tbl.id,
              name: tbl.name,
              count: rows.length
            });
            totalCount += rows.length;
          } else if (tbl.id === 'council_config' && sourceData.council_config) {
            tablesFound.push({
              id: tbl.id,
              name: tbl.name,
              count: 1
            });
            totalCount += 1;
          }
        });

        setImportedFile({ name: file.name, content: parsed });
        setImportPreview({
          date: parsed.exportadoEm ? new Date(parsed.exportadoEm).toLocaleString('pt-BR') : 'Data não informada',
          council: parsed.conselho || 'Conselho',
          version: parsed.versao || '2.0',
          tablesFound,
          totalRecords: totalCount
        });

        toastService.info('Arquivo Analisado', `${tablesFound.length} tabela(s) localizadas no backup.`);
      } catch (err: any) {
        toastService.error('Arquivo Inválido', err?.message || 'O arquivo fornecido não é um JSON válido.');
        setImportedFile(null);
        setImportPreview(null);
      }
    };
    reader.readAsText(file);
  };

  // 4. Execução da Restauração
  const handleExecuteRestore = async () => {
    if (!importedFile || !importedFile.content) {
      toastService.warning('Nenhum Arquivo Selecionado', 'Carregue um arquivo JSON de backup válido.');
      return;
    }

    const confirmMsg = restoreMode === 'replace'
      ? 'ATENÇÃO: O modo Substituição Total irá SOBRESCREVER os dados atuais pelas informações do arquivo de backup. Deseja continuar?'
      : 'Deseja iniciar a restauração por Mesclagem (Merge)? Os registros atuais serão atualizados e novos serão inseridos.';

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setIsRestoring(true);
    try {
      // Cria snapshot de segurança automático antes da restauração
      storageService.createLocalSnapshot(`Backup Automático Pré-Restore (${new Date().toLocaleTimeString('pt-BR')})`);

      const res = await storageService.restoreBackup(importedFile.content, {
        mode: restoreMode,
        syncSupabase: syncSupabaseOnRestore
      });

      if (res.success) {
        toastService.success(
          'Restauração Concluída!',
          `Dados restaurados com sucesso em ${Object.keys(res.details).length} tabela(s).`
        );
        refreshCounts();
        setImportedFile(null);
        setImportPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        toastService.error('Falha na Restauração', res.errors.join('; '));
      }
    } catch (err: any) {
      toastService.error('Erro Crítico', err?.message || 'Falha ao restaurar dados');
    } finally {
      setIsRestoring(false);
    }
  };

  // 5. Criar Snapshot Rápido
  const handleCreateSnapshot = () => {
    try {
      const snap = storageService.createLocalSnapshot(snapshotLabel.trim() || undefined);
      setSnapshotLabel('');
      refreshCounts();
      toastService.success(
        'Snapshot Criado',
        `Ponto de restauração salvo com ${snap.totalRecords} registros.`
      );
    } catch (err: any) {
      toastService.error('Erro no Snapshot', err?.message || 'Não foi possível salvar o snapshot local.');
    }
  };

  const handleRestoreSnapshot = async (id: string) => {
    if (!window.confirm('Deseja restaurar este Snapshot local? Os dados atuais da sessão serão substituídos pelos salvos no snapshot.')) {
      return;
    }

    try {
      const ok = await storageService.restoreLocalSnapshot(id);
      if (ok) {
        toastService.success('Snapshot Restaurado', 'Os dados do ponto selecionado foram recarregados com sucesso.');
        refreshCounts();
      } else {
        toastService.error('Falha ao Restaurar', 'Snapshot não localizado ou corrompido.');
      }
    } catch (err: any) {
      toastService.error('Erro na Restauração', err?.message || 'Falha ao restaurar');
    }
  };

  const handleDeleteSnapshot = (id: string) => {
    storageService.deleteLocalSnapshot(id);
    refreshCounts();
    toastService.info('Snapshot Removido', 'Ponto de restauração excluído da memória local.');
  };

  return (
    <div className="space-y-6">
      {/* Banner Principal com Estatísticas */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                <span>CENTRAL DE BACKUP & RESTAURAÇÃO DE DADOS</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                  EXPORT / RESTORE
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Faça o download de cópias completas ou seletivas em JSON ou SQL para segurança e migração, ou restaure backups anteriores.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total de Registros</span>
              <span className="text-base font-extrabold text-blue-700 font-mono">{totalSystemRecords.toLocaleString('pt-BR')}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tabelas do Sistema</span>
              <span className="text-base font-extrabold text-indigo-700 font-mono">{AVAILABLE_TABLES.length}</span>
            </div>
          </div>
        </div>

        {/* Navegação entre Ações */}
        <div className="flex space-x-2 pt-4">
          <button
            type="button"
            onClick={() => setActiveSubTab('export')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
              activeSubTab === 'export'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>1. Exportar Backup (Download)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('import')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
              activeSubTab === 'import'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>2. Restaurar Dados (Restore)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('snapshots')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
              activeSubTab === 'snapshots'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>3. Snapshots Rápidos ({snapshots.length})</span>
          </button>
        </div>
      </div>

      {/* ABA 1: EXPORTAR BACKUP */}
      {activeSubTab === 'export' && (
        <div className="space-y-5">
          {/* Barra de Controle de Seleção */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={toggleSelectAll}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors uppercase ${
                  isAllSelected
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                    : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                {isAllSelected ? (
                  <>
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    <span>Todas Selecionadas ({AVAILABLE_TABLES.length})</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 text-slate-400" />
                    <span>Selecionar Todas (Backup Completo)</span>
                  </>
                )}
              </button>

              <span className="text-xs text-slate-500">
                <strong className="text-slate-800 font-mono">{selectedTables.length}</strong> de {AVAILABLE_TABLES.length} tabelas ({totalSelectedRecords.toLocaleString('pt-BR')} registros)
              </span>
            </div>

            <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleExportSql}
                disabled={isExporting || selectedTables.length === 0}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all uppercase disabled:opacity-50"
                title="Gera um script com comandos INSERT INTO para importar direto no Supabase ou PostgreSQL"
              >
                <FileCode className="w-4 h-4 text-indigo-600" />
                <span>Exportar DUMP SQL</span>
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                disabled={isExporting || selectedTables.length === 0}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all uppercase disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isAllSelected ? 'BAIXAR BACKUP COMPLETO (JSON)' : 'BAIXAR BACKUP SELECIONADO (JSON)'}</span>
              </button>
            </div>
          </div>

          {/* Grade de Tabelas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {AVAILABLE_TABLES.map((table) => {
              const isSelected = selectedTables.includes(table.id);
              const count = tableCounts[table.id] || 0;
              const IconComp = table.icon;

              return (
                <div
                  key={table.id}
                  onClick={() => toggleTable(table.id)}
                  className={`cursor-pointer rounded-2xl p-4 border transition-all select-none flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-400/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">
                            {table.name}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400">
                            {table.techName}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 pt-0.5">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-2.5 line-clamp-2">
                      {table.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Registros
                    </span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs ${
                      count > 0 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {count.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 2: RESTAURAR DADOS (RESTORE) */}
      {activeSubTab === 'import' && (
        <div className="space-y-6">
          {/* Seletor / Dropzone */}
          <div className="bg-white border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-8 text-center transition-all bg-gradient-to-b from-white to-slate-50/50">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="backup-file-input"
            />
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100 shadow-xs">
              <Upload className="w-7 h-7" />
            </div>

            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Selecione o Arquivo de Backup JSON (.json)
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Clique no botão abaixo ou arraste o arquivo gerado previamente pelo SISCON para restaurar os registros.
            </p>

            <label
              htmlFor="backup-file-input"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-md shadow-blue-500/20 transition-all uppercase"
            >
              <Upload className="w-4 h-4" />
              <span>Escolher Arquivo do Computador</span>
            </label>
          </div>

          {/* Preview dos Dados Carregados */}
          {importPreview && importedFile && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase">
                      Arquivo Pronto para Restauração: {importedFile.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Gerado em: <strong>{importPreview.date}</strong> • Conselho: <strong>{importPreview.council}</strong> • Total no arquivo: <strong>{importPreview.totalRecords}</strong> registros
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setImportedFile(null);
                    setImportPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold uppercase"
                >
                  Cancelar Arquivo
                </button>
              </div>

              {/* Tabela de Preview */}
              <div>
                <h5 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Tabelas Identificadas no Arquivo
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {importPreview.tablesFound.map(tbl => (
                    <div key={tbl.id} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 truncate mr-2" title={tbl.name}>
                        {tbl.name}
                      </span>
                      <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        {tbl.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opções de Restauração */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
                <h5 className="text-xs font-bold uppercase text-slate-800 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Método de Restauração</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`cursor-pointer rounded-xl p-3 border flex items-start space-x-3 transition-all ${
                    restoreMode === 'merge' ? 'bg-white border-blue-400 shadow-xs ring-1 ring-blue-400/20' : 'bg-white/50 border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="restoreMode"
                      value="merge"
                      checked={restoreMode === 'merge'}
                      onChange={() => setRestoreMode('merge')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Mesclar & Atualizar (Merge / Upsert) - Recomendado
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Atualiza os registros que tiverem mesmo ID/CPF/CNPJ e adiciona os novos. Preserva o que já existe no sistema.
                      </span>
                    </div>
                  </label>

                  <label className={`cursor-pointer rounded-xl p-3 border flex items-start space-x-3 transition-all ${
                    restoreMode === 'replace' ? 'bg-rose-50/50 border-rose-300 shadow-xs ring-1 ring-rose-400/20' : 'bg-white/50 border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="restoreMode"
                      value="replace"
                      checked={restoreMode === 'replace'}
                      onChange={() => setRestoreMode('replace')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-rose-900 block">
                        Substituição Total (Replace)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Limpa os dados das tabelas correspondentes e insere exclusivamente os dados presentes no arquivo.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="pt-2">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncSupabaseOnRestore}
                      onChange={(e) => setSyncSupabaseOnRestore(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-700">
                      Sincronizar e migrar os dados restaurados para o banco de dados Supabase em segundo plano
                    </span>
                  </label>
                </div>
              </div>

              {/* Botão de Ação Final */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleExecuteRestore}
                  disabled={isRestoring}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase shadow-md transition-all ${
                    restoreMode === 'replace'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  }`}
                >
                  {isRestoring ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processando Restauração...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Confirmar e Restaurar Dados</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 3: SNAPSHOTS RÁPIDOS */}
      {activeSubTab === 'snapshots' && (
        <div className="space-y-5">
          {/* Criar Novo Snapshot */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex-1 w-full sm:w-auto">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Nome ou Motivo do Snapshot (Opcional)
              </label>
              <input
                type="text"
                value={snapshotLabel}
                onChange={(e) => setSnapshotLabel(e.target.value)}
                placeholder="Ex: Antes da importação da folha de março..."
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="button"
              onClick={handleCreateSnapshot}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all uppercase whitespace-nowrap self-end sm:self-auto"
            >
              <HardDrive className="w-4 h-4" />
              <span>Criar Snapshot em 1 Clique</span>
            </button>
          </div>

          {/* Lista de Snapshots Salvos */}
          <div className="space-y-3">
            {snapshots.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Nenhum snapshot salvo localmente no momento.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Clique no botão acima para criar pontos de restauração instantâneos armazenados em cache.
                </p>
              </div>
            ) : (
              snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold font-mono">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{snap.nome}</h4>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                        <span>{new Date(snap.criadoEm).toLocaleString('pt-BR')}</span>
                        <span>•</span>
                        <span className="font-mono font-bold text-purple-700">{snap.totalRecords} registros</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleRestoreSnapshot(snap.id)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors uppercase"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSnapshot(snap.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Excluir Snapshot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
