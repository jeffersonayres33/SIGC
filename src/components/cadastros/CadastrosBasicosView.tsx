import React, { useState } from 'react';
import { 
  FolderTree, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Award, 
  UserCheck, 
  Building2, 
  Layers, 
  ShieldAlert, 
  Users,
  Building,
  ArrowRight,
  ShieldCheck,
  Check,
  Hash,
  FileText,
  Files,
  Network,
  Clock,
  MapPin,
  Briefcase,
  FileSpreadsheet
} from 'lucide-react';
import { ItemCadastroBasico, CategoriaCadastroBasico } from '../../types';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { sanitizeToUpper } from '../../utils/documentUtils';
import { exportToCSV, exportToPDF } from '../../services/exportService';

type MainGroup = 'PROFISSIONAIS' | 'EMPRESAS' | 'PROTOCOLOS';

interface SubGroupConfig {
  key: CategoriaCadastroBasico;
  label: string;
  icon: any;
  singular: string;
  description: string;
  linkInfo: string;
  badgeColor: string;
}

const SUBGROUPS_PROFISSIONAIS: SubGroupConfig[] = [
  {
    key: 'TIPO_PROFISSIONAL',
    label: 'Tipos de Profissionais',
    icon: UserCheck,
    singular: 'Tipo de Profissional',
    description: 'Títulos e categorias profissionais regulamentados (ex: Farmacêutico, Farmacêutico Bioquímico, Técnico em Farmácia).',
    linkInfo: 'Vinculado diretamente ao formulário de Cadastro de Profissionais (PF).',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    key: 'HABILITACAO',
    label: 'Habilitações e Especialidades',
    icon: Award,
    singular: 'Habilitação / Especialidade',
    description: 'Áreas de atuação e títulos de especialização averbados no cadastro profissional.',
    linkInfo: 'Disponível para averbação múltipla no cadastro e carteira do profissional.',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    key: 'SITUACAO_PROFISSIONAL',
    label: 'Situações Cadastrais',
    icon: Layers,
    singular: 'Situação Cadastral',
    description: 'Estados do registro profissional perante o conselho (ex: Definitivo, Provisório, Remido, Suspenso).',
    linkInfo: 'Controla a aptidão do profissional para emissão de certidões e assunção de RT.',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  }
];

const SUBGROUPS_EMPRESAS: SubGroupConfig[] = [
  {
    key: 'TIPO_EMPRESA',
    label: 'Tipos de Empresas',
    icon: Building2,
    singular: 'Tipo de Empresa',
    description: 'Ramos de atividades e tipos de estabelecimentos comerciais, industriais ou hospitalares.',
    linkInfo: 'Vinculado ao cadastro de Pessoa Jurídica (PJ) e roteiro de fiscalização.',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    key: 'NATUREZA_ATIVIDADE',
    label: 'Natureza de Atividade',
    icon: Layers,
    singular: 'Natureza de Atividade',
    description: 'Naturezas e finalidades de atividade econômica das empresas registradas.',
    linkInfo: 'Vinculado diretamente ao formulário de Cadastro de Empresas (PJ).',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  },
  {
    key: 'SITUACAO_VINCULO',
    label: 'Situação do Vínculo',
    icon: Briefcase,
    singular: 'Situação do Vínculo',
    description: 'Modalidades de vínculo empregatício e contratual do Responsável Técnico com a empresa (ex: CTPS, Contrato Social, Prestador de Serviços, Estatutário).',
    linkInfo: 'Vinculado à tela de cadastro de empresas e assunção de Responsáveis Técnicos (RT).',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  {
    key: 'SITUACAO_EMPRESA',
    label: 'Situações de Empresas',
    icon: ShieldAlert,
    singular: 'Situação de Empresa',
    description: 'Status operacional e regulatório dos estabelecimentos registrados (ex: Definitiva, Provisória, Baixada).',
    linkInfo: 'Utilizado no controle de regularidade de CRT e licenciamento sanitário.',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    key: 'MUNICIPIO',
    label: 'Municípios da Jurisdição',
    icon: MapPin,
    singular: 'Município',
    description: 'Municípios pertencentes ao estado da jurisdição cadastrado nas configurações do conselho.',
    linkInfo: 'Base de dados para cálculo de carga horária mínima de Assistência Farmacêutica e endereçamento de empresas.',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
  }
];

const SUBGROUPS_PROTOCOLOS: SubGroupConfig[] = [
  {
    key: 'TIPO_REQUERIMENTO_PROTOCOLO',
    label: 'Tipos de Requerimento',
    icon: FileText,
    singular: 'Tipo de Requerimento',
    description: 'Modalidades de peticionamento e solicitações oficiais (ex: Inscrição Definitiva, Transferência, Averbação, CRT).',
    linkInfo: 'Disponível na abertura de novos protocolos e processos no módulo de cadastros.',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  {
    key: 'SETOR_PROTOCOLO',
    label: 'Setores de Tramitação',
    icon: Network,
    singular: 'Setor',
    description: 'Departamentos e comissões para onde os processos são despachados (ex: Secretaria, DEFIS, Jurídico, Diretoria).',
    linkInfo: 'Utilizado no fluxo de movimentações, despachos e distribuição de processos.',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200'
  },
  {
    key: 'STATUS_PROTOCOLO',
    label: 'Status do Protocolo',
    icon: Clock,
    singular: 'Status',
    description: 'Fases e pareceres conclusivos de processos (ex: Em Análise, Aguardando Documentação, Deferido, Indeferido).',
    linkInfo: 'Controla a situação em tempo real de cada protocolo e prazos de resposta.',
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200'
  }
];

export const CadastrosBasicosView: React.FC = () => {
  const [activeMainGroup, setActiveMainGroup] = useState<MainGroup>('PROFISSIONAIS');
  const [selectedCategory, setSelectedCategory] = useState<CategoriaCadastroBasico>('TIPO_PROFISSIONAL');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ItemCadastroBasico> | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ItemCadastroBasico | null>(null);
  const [deleteBlockedInfo, setDeleteBlockedInfo] = useState<{ count: number; reason: string } | null>(null);

  const allItems = storageService.getCadastrosBasicos();

  // Switch main group helper
  const handleSelectMainGroup = (group: MainGroup) => {
    setActiveMainGroup(group);
    if (group === 'PROFISSIONAIS') {
      setSelectedCategory('TIPO_PROFISSIONAL');
    } else if (group === 'EMPRESAS') {
      setSelectedCategory('TIPO_EMPRESA');
    } else {
      setSelectedCategory('TIPO_REQUERIMENTO_PROTOCOLO');
    }
  };

  const getSubgroupsForCurrentGroup = () => {
    switch (activeMainGroup) {
      case 'PROFISSIONAIS':
        return SUBGROUPS_PROFISSIONAIS;
      case 'EMPRESAS':
        return SUBGROUPS_EMPRESAS;
      case 'PROTOCOLOS':
        return SUBGROUPS_PROTOCOLOS;
    }
  };

  const activeSubgroups = getSubgroupsForCurrentGroup();
  const currentSubgroupConfig = activeSubgroups.find(s => s.key === selectedCategory) || activeSubgroups[0];

  const filteredItems = allItems.filter(item => {
    if (item.categoria !== selectedCategory) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        item.nome.toLowerCase().includes(q) ||
        (item.codigo && item.codigo.toLowerCase().includes(q)) ||
        (item.descricao && item.descricao.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const countProfissionais = allItems.filter(i => 
    i.categoria === 'TIPO_PROFISSIONAL' || 
    i.categoria === 'HABILITACAO' || 
    i.categoria === 'SITUACAO_PROFISSIONAL'
  ).length;

  const countEmpresas = allItems.filter(i => 
    i.categoria === 'TIPO_EMPRESA' || 
    i.categoria === 'SITUACAO_EMPRESA'
  ).length;

  const countProtocolos = allItems.filter(i => 
    i.categoria === 'TIPO_REQUERIMENTO_PROTOCOLO' || 
    i.categoria === 'SETOR_PROTOCOLO' || 
    i.categoria === 'STATUS_PROTOCOLO'
  ).length;

  const handleOpenNew = () => {
    setEditingItem({
      id: '',
      nome: '',
      codigo: '',
      descricao: '',
      categoria: selectedCategory,
      ativo: true,
      ordem: filteredItems.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ItemCadastroBasico) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.nome?.trim()) {
      toastService.warning('Campo Obrigatório', 'Informe o nome do item para cadastro.');
      return;
    }

    const cat = editingItem.categoria || selectedCategory;
    const nomeTrimmed = editingItem.nome.trim();

    // Verificação de duplicidade de nome na mesma categoria
    const isDuplicate = storageService.checkCadastroBasicoDuplicity(cat, nomeTrimmed, editingItem.id);
    if (isDuplicate) {
      toastService.warning(
        'Duplicidade Detectada',
        `Já existe um item cadastrado com o nome "${nomeTrimmed.toUpperCase()}" nesta categoria.`
      );
      return;
    }

    const rawItem: ItemCadastroBasico = {
      id: editingItem.id || `cb-${Date.now()}`,
      nome: nomeTrimmed,
      codigo: editingItem.codigo?.trim() || '',
      descricao: editingItem.descricao?.trim() || '',
      categoria: cat,
      ativo: editingItem.ativo ?? true,
      ordem: editingItem.ordem || 1
    };

    const finalItem = sanitizeToUpper(rawItem, ['id']);
    const res = storageService.saveCadastroBasico(finalItem);
    
    if (!res.success) {
      toastService.warning('Aviso de Validação', res.message || 'Erro ao salvar registro.');
      return;
    }

    setIsModalOpen(false);
    setEditingItem(null);

    toastService.success(
      editingItem.id ? 'Item Atualizado' : 'Novo Item Cadastrado',
      `O registro "${finalItem.nome}" foi salvo com sucesso nos Cadastros Básicos.`
    );
  };

  const handleAttemptDelete = (item: ItemCadastroBasico) => {
    const check = storageService.canDeleteCadastroBasico(item.id);
    if (!check.canDelete) {
      setDeleteBlockedInfo({
        count: check.count,
        reason: check.reason || 'Este item possui cadastros vinculados e não pode ser excluído.'
      });
      setItemToDelete(item);
    } else {
      setDeleteBlockedInfo(null);
      setItemToDelete(item);
    }
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const res = storageService.deleteCadastroBasico(itemToDelete.id);
    if (res.success) {
      toastService.delete(
        'Item Excluído',
        `O item "${itemToDelete.nome}" foi removido dos Cadastros Básicos.`
      );
      setItemToDelete(null);
      setDeleteBlockedInfo(null);
    } else {
      toastService.warning('Exclusão Bloqueada', res.message || 'Não foi possível excluir o registro.');
    }
  };

  const handleExportCSV = () => {
    if (!filteredItems.length) {
      toastService.warning('Sem Dados', 'Nenhum item encontrado para os filtros selecionados.');
      return;
    }
    const dataToExport = filteredItems.map(item => ({
      'CATEGORIA': currentSubgroupConfig.label,
      'CÓDIGO': item.codigo || '-',
      'NOME': item.nome,
      'DETALHAMENTO': item.descricao || '-',
      'ORDEM': item.ordem || 1,
      'STATUS': item.ativo ? 'ATIVO' : 'INATIVO'
    }));
    exportToCSV(`cadastros_basicos_${selectedCategory.toLowerCase()}_${Date.now()}`, dataToExport);
    toastService.info('Exportação Excel Concluída', `${filteredItems.length} itens exportados para planilha Excel/CSV.`);
  };

  const handleExportPDF = () => {
    if (!filteredItems.length) {
      toastService.warning('Sem Dados', 'Nenhum item encontrado para os filtros selecionados.');
      return;
    }
    const headers = ['Código', 'Nome / Título', 'Detalhamento Técnico', 'Ordem', 'Status'];
    const rows = filteredItems.map(item => [
      item.codigo || '-',
      item.nome,
      item.descricao || '-',
      item.ordem || 1,
      item.ativo ? 'Ativo' : 'Inativo'
    ]);
    const councilConfig = storageService.getCouncilConfig();
    exportToPDF({
      title: `Cadastros Básicos - ${currentSubgroupConfig.label}`,
      subtitle: `${filteredItems.length} registros filtrados | Grupo: ${activeMainGroup} | SISCON Cloud`,
      filename: `cadastros_basicos_${selectedCategory.toLowerCase()}_${Date.now()}`,
      headers,
      rows,
      orientation: 'portrait',
      councilName: councilConfig.nomeCompleto || 'Conselho Regional de Farmácia',
      councilUF: councilConfig.uf || 'AM'
    });
    toastService.info('Exportação PDF Concluída', `${filteredItems.length} itens exportados para documento PDF oficial.`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                CADASTROS BÁSICOS
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                {allItems.length} ITENS CADASTRADOS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Padronização e parametrização dos grupos de Profissionais (PF), Empresas (PJ) e Protocolos/Processos.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 font-bold text-xs transition-all uppercase shadow-2xs cursor-pointer"
            title="Exportar itens para planilha Excel/CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>EXPORTAR EXCEL</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 text-slate-700 hover:text-rose-800 font-bold text-xs transition-all uppercase shadow-2xs cursor-pointer"
            title="Exportar itens para relatório em PDF Oficial"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>EXPORTAR PDF</span>
          </button>
          <button
            onClick={handleOpenNew}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all uppercase shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>INSERIR NOVO ITEM</span>
          </button>
        </div>
      </div>

      {/* 2. Seleção dos 3 Grupos Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Grupo 1: Profissionais */}
        <button
          type="button"
          onClick={() => handleSelectMainGroup('PROFISSIONAIS')}
          className={`p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
            activeMainGroup === 'PROFISSIONAIS'
              ? 'bg-linear-to-br from-blue-500/10 via-white to-blue-500/5 border-blue-600 shadow-md ring-2 ring-blue-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activeMainGroup === 'PROFISSIONAIS' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-600'
                }`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                    PROFISSIONAIS
                    {activeMainGroup === 'PROFISSIONAIS' && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Pessoa Física (PF)</p>
                </div>
              </div>

              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                activeMainGroup === 'PROFISSIONAIS'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {countProfissionais} itens
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-3">
              Tipos de profissionais, especialidades/habilitações averbadas e situações cadastrais.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>3 Subgrupos</span>
            </div>
            <span className={`flex items-center gap-1 ${activeMainGroup === 'PROFISSIONAIS' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
              {activeMainGroup === 'PROFISSIONAIS' ? 'Selecionado' : 'Selecionar'}
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </button>

        {/* Card Grupo 2: Empresas */}
        <button
          type="button"
          onClick={() => handleSelectMainGroup('EMPRESAS')}
          className={`p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
            activeMainGroup === 'EMPRESAS'
              ? 'bg-linear-to-br from-emerald-500/10 via-white to-emerald-500/5 border-emerald-600 shadow-md ring-2 ring-emerald-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activeMainGroup === 'EMPRESAS' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                    EMPRESAS
                    {activeMainGroup === 'EMPRESAS' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Pessoa Jurídica (PJ)</p>
                </div>
              </div>

              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                activeMainGroup === 'EMPRESAS'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {countEmpresas} itens
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-3">
              Tipos de estabelecimentos (drogarias, manipulação, laboratórios) e situações de empresas.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>2 Subgrupos</span>
            </div>
            <span className={`flex items-center gap-1 ${activeMainGroup === 'EMPRESAS' ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
              {activeMainGroup === 'EMPRESAS' ? 'Selecionado' : 'Selecionar'}
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </button>

        {/* Card Grupo 3: Protocolos */}
        <button
          type="button"
          onClick={() => handleSelectMainGroup('PROTOCOLOS')}
          className={`p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
            activeMainGroup === 'PROTOCOLOS'
              ? 'bg-linear-to-br from-indigo-500/10 via-white to-indigo-500/5 border-indigo-600 shadow-md ring-2 ring-indigo-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activeMainGroup === 'PROTOCOLOS' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                    PROTOCOLOS
                    {activeMainGroup === 'PROTOCOLOS' && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Processos & Requerimentos</p>
                </div>
              </div>

              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                activeMainGroup === 'PROTOCOLOS'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {countProtocolos} itens
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-3">
              Tipos de requerimento, setores de tramitação e status de acompanhamento processual.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span>3 Subgrupos</span>
            </div>
            <span className={`flex items-center gap-1 ${activeMainGroup === 'PROTOCOLOS' ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
              {activeMainGroup === 'PROTOCOLOS' ? 'Selecionado' : 'Selecionar'}
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </button>
      </div>

      {/* 3. Barra de Subgrupos do Grupo Ativo */}
      <div className="bg-white border border-slate-200 p-2 rounded-2xl shadow-xs">
        <div className="flex flex-wrap gap-2">
          {activeSubgroups.map((sub) => {
            const Icon = sub.icon;
            const isSelected = selectedCategory === sub.key;
            const count = allItems.filter(i => i.categoria === sub.key).length;

            return (
              <button
                key={sub.key}
                onClick={() => setSelectedCategory(sub.key)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer ${
                  isSelected
                    ? activeMainGroup === 'PROFISSIONAIS'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : activeMainGroup === 'EMPRESAS'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{sub.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${
                  isSelected ? 'bg-black/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Banner Informativo do Subgrupo e Barra de Busca */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            activeMainGroup === 'PROFISSIONAIS' 
              ? 'bg-blue-50 text-blue-600 border border-blue-200' 
              : activeMainGroup === 'EMPRESAS'
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
          }`}>
            {React.createElement(currentSubgroupConfig.icon, { className: 'w-5 h-5' })}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 uppercase text-sm">{currentSubgroupConfig.label}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                {currentSubgroupConfig.singular}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{currentSubgroupConfig.description}</p>
            <p className="text-[11px] text-blue-600 font-semibold mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{currentSubgroupConfig.linkInfo}</span>
            </p>
          </div>
        </div>

        <div className="w-full md:w-80 relative min-w-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="PESQUISAR NOME OU CÓDIGO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all uppercase text-xs font-medium"
          />
        </div>
      </div>

      {/* Barra Informativa de Itens Filtrados */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wide shadow-2xs">
            <FolderTree className="w-3.5 h-3.5 text-blue-600" />
            <span>{filteredItems.length} registros filtrados</span>
          </span>
          <span className="text-xs text-slate-500 font-medium">
            (em {currentSubgroupConfig.label})
          </span>
        </div>
      </div>

      {/* 5. Tabela de Registros do Subgrupo */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-24">CÓDIGO</th>
                <th className="py-3.5 px-4">NOME / TÍTULO DO REGISTRO</th>
                <th className="py-3.5 px-4">DETALHAMENTO TÉCNICO</th>
                <th className="py-3.5 px-4 text-center">VÍNCULOS NO SISTEMA</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 px-4 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FolderTree className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold uppercase">Nenhum registro encontrado</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Clique no botão "Inserir Novo Item" acima para cadastrar nesta categoria.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const check = storageService.canDeleteCadastroBasico(item.id);
                  const inUseCount = check.count;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {item.codigo || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 uppercase">{item.nome}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {item.id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-600 uppercase max-w-md line-clamp-2">
                          {item.descricao || 'Sem detalhamento complementar.'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                          inUseCount > 0 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {inUseCount} {inUseCount === 1 ? 'VÍNCULO ATIVO' : 'VÍNCULOS ATIVOS'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          item.ativo
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {item.ativo ? 'ATIVO' : 'INATIVO'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Editar registro"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAttemptDelete(item)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Excluir registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Modal de Criação / Edição */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className={`px-6 py-4.5 text-white flex items-center justify-between ${
              activeMainGroup === 'PROFISSIONAIS'
                ? 'bg-linear-to-r from-blue-700 via-blue-800 to-slate-900'
                : activeMainGroup === 'EMPRESAS'
                ? 'bg-linear-to-r from-emerald-700 via-teal-800 to-slate-900'
                : 'bg-linear-to-r from-indigo-700 via-purple-800 to-slate-900'
            }`}>
              <div className="flex items-center space-x-2.5">
                <FolderTree className="w-5 h-5 text-white" />
                <h3 className="font-bold text-sm uppercase tracking-wide">
                  {editingItem.id ? 'EDITAR CADASTRO BÁSICO' : 'NOVO CADASTRO BÁSICO'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingItem(null);
                }}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveItem} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase">
                  Grupo & Subgrupo
                </label>
                <select
                  value={editingItem.categoria}
                  onChange={(e) => setEditingItem({ ...editingItem, categoria: e.target.value as CategoriaCadastroBasico })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold uppercase focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <optgroup label="1. PROFISSIONAIS (PESSOA FÍSICA)">
                    {SUBGROUPS_PROFISSIONAIS.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="2. EMPRESAS (PESSOA JURÍDICA)">
                    {SUBGROUPS_EMPRESAS.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="3. PROTOCOLOS & PROCESSOS">
                    {SUBGROUPS_PROTOCOLOS.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase">
                  Nome / Título do Registro <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: FARMACÊUTICO HOSPITALAR OU REQUERIMENTO..."
                  value={editingItem.nome || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, nome: e.target.value.toUpperCase() })}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 font-semibold uppercase focus:bg-white focus:ring-2 transition-all ${
                    editingItem.nome?.trim() && storageService.checkCadastroBasicoDuplicity(editingItem.categoria || selectedCategory, editingItem.nome.trim(), editingItem.id)
                      ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-600 bg-rose-50/30'
                      : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                  }`}
                />
                {editingItem.nome?.trim() && storageService.checkCadastroBasicoDuplicity(editingItem.categoria || selectedCategory, editingItem.nome.trim(), editingItem.id) && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-rose-600 text-[11px] font-bold uppercase">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Atenção: Já existe um registro com este nome nesta categoria. Duplicidade bloqueada.</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase">
                    Código / Sigla (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="EX: FARM-HOSP / REQ-01"
                    value={editingItem.codigo || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, codigo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold uppercase focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.ordem || 1}
                    onChange={(e) => setEditingItem({ ...editingItem, ordem: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase">
                  Detalhamento Técnico / Observações
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva a finalidade ou fundamentação legal desta opção..."
                  value={editingItem.descricao || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, descricao: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="ativoCheckbox"
                  checked={editingItem.ativo ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, ativo: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="ativoCheckbox" className="text-slate-800 font-bold select-none cursor-pointer">
                  Item Ativo (Disponível nos formulários de cadastro do sistema)
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors uppercase cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={Boolean(editingItem.nome?.trim() && storageService.checkCadastroBasicoDuplicity(editingItem.categoria || selectedCategory, editingItem.nome.trim(), editingItem.id))}
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold shadow-md shadow-blue-500/20 transition-all uppercase cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>SALVAR REGISTRO</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal de Exclusão Segura */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  deleteBlockedInfo ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-600'
                }`}>
                  {deleteBlockedInfo ? <AlertTriangle className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 uppercase">
                    {deleteBlockedInfo ? 'Exclusão Bloqueada (Vínculos Ativos)' : 'Confirmar Exclusão'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Item: <span className="font-bold text-slate-800">{itemToDelete.nome}</span>
                  </p>
                </div>
              </div>

              {deleteBlockedInfo ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Regra de Integridade Referencial:</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    {deleteBlockedInfo.reason}
                  </p>
                  <p className="text-[11px] text-amber-800 font-semibold">
                    Para excluir este item, você deve primeiro alterar os cadastros vinculados para outra opção ou desativar o item.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-600">
                  Tem certeza que deseja excluir permanentemente o item <strong className="text-slate-900">{itemToDelete.nome}</strong>? Esta ação não poderá ser desfeita.
                </p>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setItemToDelete(null);
                    setDeleteBlockedInfo(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors uppercase cursor-pointer"
                >
                  {deleteBlockedInfo ? 'ENTENDIDO / FECHAR' : 'CANCELAR'}
                </button>
                {!deleteBlockedInfo && (
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all uppercase cursor-pointer"
                  >
                    CONFIRMAR EXCLUSÃO
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
