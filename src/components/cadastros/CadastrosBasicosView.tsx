import React, { useState, useEffect } from 'react';
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

export type MainGroup = 'PROFISSIONAIS' | 'EMPRESAS' | 'PROTOCOLOS' | 'FUNCIONARIOS' | 'ADMIN';

const LISTA_MODULOS_SISTEMA: { id: string; nome: string }[] = [
  { id: 'dashboard', nome: 'Painel Executivo / Dashboard' },
  { id: 'profissionais', nome: 'Profissionais (Pessoa Física)' },
  { id: 'empresas', nome: 'Empresas (Pessoa Jurídica)' },
  { id: 'cadastros_basicos', nome: 'Cadastros Básicos & Auxiliares' },
  { id: 'funcionarios', nome: 'Gestão de Funcionários' },
  { id: 'financeiro', nome: 'Financeiro & Anuidades' },
  { id: 'cobranca_juridico', nome: 'Jurídico & Dívida Ativa' },
  { id: 'fiscalizacao', nome: 'Fiscalização de Campo' },
  { id: 'protocolos', nome: 'Protocolos & Requerimentos' },
  { id: 'relatorios', nome: 'Relatórios & BI Diretoria' },
  { id: 'formularios', nome: 'Formulários Dinâmicos' },
  { id: 'portal_inscrito', nome: 'Portal do Inscrito (PF/PJ)' },
  { id: 'configuracoes', nome: 'Painel Admin / Configurações' },
  { id: 'microsservicos', nome: 'Microsserviços & Cloud' },
];

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
  },
  {
    key: 'MOTIVO_SITUACAO_PROFISSIONAL',
    label: 'Motivos de Situação (PF)',
    icon: Layers,
    singular: 'Motivo de Situação',
    description: 'Motivos cadastrais de alteração de situação dos profissionais (ex: Falecimento, Transferência, Jubilação).',
    linkInfo: 'Vinculado ao formulário de Cadastro de Profissionais.',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
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
    key: 'MOTIVO_SITUACAO_EMPRESA',
    label: 'Motivos de Situação (PJ)',
    icon: Layers,
    singular: 'Motivo de Situação',
    description: 'Motivos cadastrais de alteração de situação ou condição dos estabelecimentos (ex: Fechamento, Suspensão).',
    linkInfo: 'Vinculado ao formulário de Cadastro de Empresas (PJ).',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
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

const SUBGROUPS_FUNCIONARIOS: SubGroupConfig[] = [
  {
    key: 'CARGO_FUNCIONARIO',
    label: 'Cargos de Funcionários',
    icon: Briefcase,
    singular: 'Cargo',
    description: 'Cargos e funções exercidas pelos colaboradores do conselho (ex: Fiscal de Farmácia, Procurador Jurídico, Analista Financeiro).',
    linkInfo: 'Vinculado diretamente ao Cadastro de Funcionários.',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    key: 'SETOR_LOTACAO',
    label: 'Setores de Lotação',
    icon: Network,
    singular: 'Setor de Lotação',
    description: 'Departamentos e setores internos do conselho onde os funcionários são lotados (ex: DEFIS, Jurídico, Financeiro, Diretoria).',
    linkInfo: 'Utilizado na lotação de colaboradores e tramitação de processos.',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    key: 'GRUPO_ACESSO_FUNCIONARIO',
    label: 'Níveis de Acesso & Permissões',
    icon: ShieldCheck,
    singular: 'Nível de Acesso',
    description: 'Grupos de acesso e definição dos módulos da plataforma permitidos para cada perfil de colaborador.',
    linkInfo: 'Vinculado ao nível de acesso do cadastro de funcionários.',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  }
];

const SUBGROUPS_ADMIN: SubGroupConfig[] = [
  {
    key: 'ADMIN_PARAMETRO',
    label: 'Parâmetros Administrativos & Segurança',
    icon: ShieldAlert,
    singular: 'Parâmetro Administrativo',
    description: 'Políticas de auditoria, exigência de troca de senha no 1º acesso e diretrizes gerais de governança.',
    linkInfo: 'Configurações de governança corporativa e segurança da informação.',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  }
];

interface CadastrosBasicosViewProps {
  initialGroup?: MainGroup;
  onNavigateToFuncionarios?: () => void;
}

export const CadastrosBasicosView: React.FC<CadastrosBasicosViewProps> = ({ 
  initialGroup = 'PROFISSIONAIS',
  onNavigateToFuncionarios 
}) => {
  const [activeMainGroup, setActiveMainGroup] = useState<MainGroup>(initialGroup);
  const [selectedCategory, setSelectedCategory] = useState<CategoriaCadastroBasico>('TIPO_PROFISSIONAL');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ItemCadastroBasico> | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ItemCadastroBasico | null>(null);
  const [deleteBlockedInfo, setDeleteBlockedInfo] = useState<{ count: number; reason: string } | null>(null);

  const allItems = storageService.getCadastrosBasicos();

  useEffect(() => {
    if (initialGroup) {
      handleSelectMainGroup(initialGroup);
    }
  }, [initialGroup]);

  // Switch main group helper
  const handleSelectMainGroup = (group: MainGroup) => {
    setActiveMainGroup(group);
    if (group === 'PROFISSIONAIS') {
      setSelectedCategory('TIPO_PROFISSIONAL');
    } else if (group === 'EMPRESAS') {
      setSelectedCategory('TIPO_EMPRESA');
    } else if (group === 'PROTOCOLOS') {
      setSelectedCategory('TIPO_REQUERIMENTO_PROTOCOLO');
    } else if (group === 'FUNCIONARIOS') {
      setSelectedCategory('CARGO_FUNCIONARIO');
    } else if (group === 'ADMIN') {
      setSelectedCategory('ADMIN_PARAMETRO');
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
      case 'FUNCIONARIOS':
        return SUBGROUPS_FUNCIONARIOS;
      case 'ADMIN':
        return SUBGROUPS_ADMIN;
      default:
        return SUBGROUPS_PROFISSIONAIS;
    }
  };

  const getGroupInfo = (group: MainGroup) => {
    switch (group) {
      case 'PROFISSIONAIS':
        return {
          title: 'Cadastros Básicos • Profissionais (PF)',
          subtitle: 'Tabelas auxiliares: tipos de profissionais, habilitações, situações cadastrais e motivos.',
          icon: Users,
          color: 'blue',
          headerBg: 'from-blue-700 via-blue-800 to-slate-900',
          badgeText: 'PROFISSIONAIS (PESSOA FÍSICA)',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'EMPRESAS':
        return {
          title: 'Cadastros Básicos • Empresas (PJ)',
          subtitle: 'Tabelas auxiliares: tipos de empresas, naturezas de atividade, vínculos, situações e municípios.',
          icon: Building2,
          color: 'emerald',
          headerBg: 'from-emerald-700 via-teal-800 to-slate-900',
          badgeText: 'EMPRESAS (PESSOA JURÍDICA)',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'PROTOCOLOS':
        return {
          title: 'Cadastros Básicos • Protocolo e Processo',
          subtitle: 'Tabelas auxiliares: tipos de requerimento, setores de tramitação e status do processo.',
          icon: FileText,
          color: 'indigo',
          headerBg: 'from-indigo-700 via-purple-800 to-slate-900',
          badgeText: 'PROTOCOLO E PROCESSO',
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
        };
      case 'FUNCIONARIOS':
        return {
          title: 'Cadastros Básicos • Funcionários',
          subtitle: 'Tabelas auxiliares: cargos de funcionários, setores de lotação e níveis de acesso & permissões.',
          icon: Briefcase,
          color: 'purple',
          headerBg: 'from-purple-700 via-indigo-800 to-slate-900',
          badgeText: 'FUNCIONÁRIOS',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
        };
      case 'ADMIN':
        return {
          title: 'Cadastros Básicos • Governança & Segurança',
          subtitle: 'Políticas de auditoria, segurança e diretrizes gerais de governança corporativa.',
          icon: ShieldAlert,
          color: 'rose',
          headerBg: 'from-rose-700 via-slate-800 to-slate-900',
          badgeText: 'GOVERNANÇA & SEGURANÇA',
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
        };
      default:
        return {
          title: 'Cadastros Básicos',
          subtitle: 'Padronização e parametrizações do conselho.',
          icon: FolderTree,
          color: 'blue',
          headerBg: 'from-blue-700 via-blue-800 to-slate-900',
          badgeText: 'CADASTROS BÁSICOS',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
        };
    }
  };

  const activeSubgroups = getSubgroupsForCurrentGroup();
  const currentSubgroupConfig = activeSubgroups.find(s => s.key === selectedCategory) || activeSubgroups[0];
  const currentGroupInfo = getGroupInfo(activeMainGroup);

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
    i.categoria === 'SITUACAO_PROFISSIONAL' ||
    i.categoria === 'MOTIVO_SITUACAO_PROFISSIONAL'
  ).length;

  const countEmpresas = allItems.filter(i => 
    i.categoria === 'TIPO_EMPRESA' || 
    i.categoria === 'NATUREZA_ATIVIDADE' ||
    i.categoria === 'SITUACAO_VINCULO' ||
    i.categoria === 'SITUACAO_EMPRESA' ||
    i.categoria === 'MOTIVO_SITUACAO_EMPRESA' ||
    i.categoria === 'MUNICIPIO'
  ).length;

  const countProtocolos = allItems.filter(i => 
    i.categoria === 'TIPO_REQUERIMENTO_PROTOCOLO' || 
    i.categoria === 'SETOR_PROTOCOLO' || 
    i.categoria === 'STATUS_PROTOCOLO'
  ).length;

  const countFuncionarios = allItems.filter(i => 
    i.categoria === 'CARGO_FUNCIONARIO' || 
    i.categoria === 'SETOR_LOTACAO' || 
    i.categoria === 'GRUPO_ACESSO_FUNCIONARIO'
  ).length;

  const handleOpenNew = () => {
    const subList = getSubgroupsForCurrentGroup();
    const defaultCat = subList.some(s => s.key === selectedCategory) 
      ? selectedCategory 
      : subList[0].key;

    const defaultCargo = allItems.find(i => i.categoria === 'CARGO_FUNCIONARIO' && i.ativo);
    const defaultSetor = allItems.find(i => i.categoria === 'SETOR_LOTACAO' && i.ativo);

    setEditingItem({
      id: '',
      nome: '',
      codigo: '',
      descricao: '',
      categoria: defaultCat,
      ativo: true,
      ordem: filteredItems.length + 1,
      cargoId: defaultCat === 'GRUPO_ACESSO_FUNCIONARIO' ? defaultCargo?.id : undefined,
      cargoNome: defaultCat === 'GRUPO_ACESSO_FUNCIONARIO' ? defaultCargo?.nome : undefined,
      setorId: defaultCat === 'GRUPO_ACESSO_FUNCIONARIO' ? defaultSetor?.id : undefined,
      setorNome: defaultCat === 'GRUPO_ACESSO_FUNCIONARIO' ? defaultSetor?.nome : undefined,
      modulosPermitidos: defaultCat === 'GRUPO_ACESSO_FUNCIONARIO' ? ['dashboard', 'fiscalizacao', 'protocolos', 'empresas'] : undefined
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ItemCadastroBasico) => {
    setEditingItem({ 
      ...item,
      modulosPermitidos: item.modulosPermitidos 
        ? item.modulosPermitidos.map(m => String(m).toLowerCase().trim()) 
        : undefined
    });
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
      ordem: editingItem.ordem || 1,
      modulosPermitidos: editingItem.modulosPermitidos 
        ? editingItem.modulosPermitidos.map(m => String(m).toLowerCase().trim()) 
        : (cat === 'GRUPO_ACESSO_FUNCIONARIO' ? ['dashboard', 'protocolos', 'profissionais'] : undefined),
      cargoId: editingItem.cargoId || undefined,
      cargoNome: editingItem.cargoNome || undefined,
      setorId: editingItem.setorId || undefined,
      setorNome: editingItem.setorNome || undefined
    };

    const finalItem = sanitizeToUpper(rawItem, ['id', 'cargoId', 'setorId', 'modulosPermitidos']);
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
      {/* 1. Header Dedicado do Grupo Ativo (Acesso Exclusivo via Menu de Navegação) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-xs shrink-0 ${
            activeMainGroup === 'PROFISSIONAIS'
              ? 'bg-blue-50 border-blue-100 text-blue-600'
              : activeMainGroup === 'EMPRESAS'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
              : activeMainGroup === 'PROTOCOLOS'
              ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
              : activeMainGroup === 'FUNCIONARIOS'
              ? 'bg-purple-50 border-purple-100 text-purple-600'
              : 'bg-rose-50 border-rose-100 text-rose-600'
          }`}>
            <currentGroupInfo.icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Menu de Navegação • 4. Cadastros Básicos
              </span>
              <span className="text-slate-300">•</span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${currentGroupInfo.badgeColor}`}>
                {currentGroupInfo.badgeText}
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {currentGroupInfo.title}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentGroupInfo.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {activeMainGroup === 'FUNCIONARIOS' && onNavigateToFuncionarios && (
            <button
              type="button"
              onClick={onNavigateToFuncionarios}
              className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs transition-all uppercase shadow-2xs cursor-pointer"
              title="Acessar o Cadastro de Funcionários completo"
            >
              <Users className="w-4 h-4 text-purple-600" />
              <span>Ver Fichas de Funcionários</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
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
            className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all uppercase shrink-0 cursor-pointer ${
              activeMainGroup === 'PROFISSIONAIS'
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                : activeMainGroup === 'EMPRESAS'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                : activeMainGroup === 'PROTOCOLOS'
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                : activeMainGroup === 'FUNCIONARIOS'
                ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>INSERIR NOVO ITEM</span>
          </button>
        </div>
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
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20'
                      : activeMainGroup === 'EMPRESAS'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500/20'
                      : activeMainGroup === 'PROTOCOLOS'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/20'
                      : activeMainGroup === 'FUNCIONARIOS'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-500/20'
                      : 'bg-rose-600 text-white shadow-md shadow-rose-500/25 ring-2 ring-rose-500/20'
                    : 'text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
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
              : activeMainGroup === 'PROTOCOLOS'
              ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
              : activeMainGroup === 'FUNCIONARIOS'
              ? 'bg-purple-50 text-purple-600 border border-purple-200'
              : 'bg-rose-50 text-rose-600 border border-rose-200'
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
                        {item.categoria === 'GRUPO_ACESSO_FUNCIONARIO' && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {item.cargoNome ? (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                                <Briefcase className="w-3 h-3" />
                                <span>Cargo: {item.cargoNome}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                                Qualquer Cargo
                              </span>
                            )}
                            {item.setorNome ? (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                                <Building2 className="w-3 h-3" />
                                <span>Setor: {item.setorNome}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                                Qualquer Setor
                              </span>
                            )}
                            {item.modulosPermitidos && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                {item.modulosPermitidos.length} módulos
                              </span>
                            )}
                          </div>
                        )}
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

      {/* 6. Modal de Criação / Edição Responsivo */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-auto flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            {/* Modal Header Fixo */}
            <div className={`px-6 py-4 text-white flex items-center justify-between bg-linear-to-r shrink-0 ${currentGroupInfo.headerBg}`}>
              <div className="flex items-center space-x-2.5">
                <FolderTree className="w-5 h-5 text-white" />
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wide">
                    {editingItem.id ? 'EDITAR CADASTRO BÁSICO' : 'NOVO CADASTRO BÁSICO'}
                  </h3>
                  <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider">
                    Grupo: {currentGroupInfo.badgeText}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingItem(null);
                }}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form com Corpo Rolável e Ações Fixas no Rodapé */}
            <form onSubmit={handleSaveItem} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
                {/* Grupo e Subgrupo - Grupo pré-selecionado pelo sistema e Subgrupo exclusivo da tela atual */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. Grupo Correspondente selecionado pelo sistema */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase text-[11px]">
                      Grupo (Definido pela Tela Atual)
                    </label>
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-800 font-bold uppercase text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <currentGroupInfo.icon className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate">{currentGroupInfo.badgeText}</span>
                      </div>
                      <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                        FIXO
                      </span>
                    </div>
                  </div>

                  {/* 2. Subgrupo exclusivo deste grupo selecionado */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase text-[11px]">
                      Subgrupo <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={editingItem.categoria}
                      onChange={(e) => setEditingItem({ ...editingItem, categoria: e.target.value as CategoriaCadastroBasico })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold uppercase text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                    >
                      {activeSubgroups.map(s => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase">
                    Nome / Título do Registro <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="EX: FARMACÊUTICO HOSPITALAR OU FISCAL DE CAMPO..."
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
                      placeholder="EX: FARM-HOSP / CARGO_FISC"
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
                    rows={2}
                    placeholder="Descreva a finalidade ou fundamentação legal desta opção..."
                    value={editingItem.descricao || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, descricao: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                {/* Seleção de Nível, Cargo, Setor e Módulos para GRUPO_ACESSO_FUNCIONARIO */}
                {editingItem.categoria === 'GRUPO_ACESSO_FUNCIONARIO' && (
                  <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3.5">
                    <div className="flex items-center justify-between border-b border-purple-200/70 pb-2">
                      <span className="font-bold text-xs text-purple-900 uppercase flex items-center space-x-1.5">
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <span>Configuração de Nível de Acesso & Módulos da Plataforma</span>
                      </span>
                      <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-bold">
                        VÍNCULO: CARGO + SETOR
                      </span>
                    </div>

                    {/* Vínculo de Cargo e Setor de Lotação */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px] flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                          <span>Cargo de Funcionário Vinculado</span>
                        </label>
                        <select
                          value={editingItem.cargoId || ''}
                          onChange={(e) => {
                            const cid = e.target.value;
                            const cObj = allItems.find(i => i.id === cid);
                            const newCargoNome = cObj ? cObj.nome : '';
                            const autoNome = newCargoNome && editingItem.setorNome 
                              ? `${newCargoNome} - ${editingItem.setorNome}` 
                              : (!editingItem.nome ? newCargoNome : editingItem.nome);
                            setEditingItem({
                              ...editingItem,
                              cargoId: cid,
                              cargoNome: newCargoNome,
                              nome: autoNome
                            });
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold uppercase focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 cursor-pointer"
                        >
                          <option value="">Qualquer Cargo / Todos os Cargos</option>
                          {allItems.filter(i => i.categoria === 'CARGO_FUNCIONARIO' && i.ativo).map(c => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Ex: Fiscal de Farmácia, Assistente Administrativo...
                        </p>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px] flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-purple-600" />
                          <span>Setor de Lotação Vinculado</span>
                        </label>
                        <select
                          value={editingItem.setorId || ''}
                          onChange={(e) => {
                            const sid = e.target.value;
                            const sObj = allItems.find(i => i.id === sid);
                            const newSetorNome = sObj ? sObj.nome : '';
                            const autoNome = editingItem.cargoNome && newSetorNome 
                              ? `${editingItem.cargoNome} - ${newSetorNome}` 
                              : (!editingItem.nome ? newSetorNome : editingItem.nome);
                            setEditingItem({
                              ...editingItem,
                              setorId: sid,
                              setorNome: newSetorNome,
                              nome: autoNome
                            });
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold uppercase focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 cursor-pointer"
                        >
                          <option value="">Qualquer Setor / Todos os Setores</option>
                          {allItems.filter(i => i.categoria === 'SETOR_LOTACAO' && i.ativo).map(s => (
                            <option key={s.id} value={s.id}>{s.nome}</option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Ex: DEFIS (Fiscalização), Jurídico, Financeiro...
                        </p>
                      </div>
                    </div>

                    {/* Módulos Permitidos na Plataforma */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-slate-700 font-bold uppercase text-[10px]">
                          Módulos Permitidos na Plataforma ({editingItem.modulosPermitidos?.length || 0} de {LISTA_MODULOS_SISTEMA.length}):
                        </label>
                        <div className="flex items-center space-x-2 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setEditingItem({ ...editingItem, modulosPermitidos: LISTA_MODULOS_SISTEMA.map(m => m.id) })}
                            className="font-bold text-purple-700 hover:underline cursor-pointer"
                          >
                            Marcar Todos
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setEditingItem({ ...editingItem, modulosPermitidos: ['dashboard'] })}
                            className="font-bold text-slate-500 hover:underline cursor-pointer"
                          >
                            Desmarcar
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2.5 bg-white border border-purple-200 rounded-xl">
                        {LISTA_MODULOS_SISTEMA.map((mod) => {
                          const currentMods = (editingItem.modulosPermitidos || []).map(m => String(m).toLowerCase().trim());
                          const isChecked = currentMods.includes(mod.id.toLowerCase());

                          return (
                            <label key={mod.id} className={`flex items-center space-x-2 text-xs p-1.5 rounded-lg border cursor-pointer transition-colors ${
                              isChecked ? 'bg-purple-50/70 border-purple-200 text-purple-900 font-medium' : 'border-transparent text-slate-700 hover:bg-slate-50'
                            }`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const modNorm = mod.id.toLowerCase().trim();
                                  const newMods = e.target.checked
                                    ? [...currentMods.filter(m => m !== modNorm), modNorm]
                                    : currentMods.filter(m => m !== modNorm);
                                  setEditingItem({ ...editingItem, modulosPermitidos: newMods });
                                }}
                                className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                              />
                              <span className="text-[11px] select-none truncate">{mod.nome}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

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
              </div>

              {/* Modal Actions Fixo no Rodapé */}
              <div className="flex items-center justify-end space-x-2.5 p-4 sm:px-6 bg-slate-50 border-t border-slate-200 shrink-0">
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
