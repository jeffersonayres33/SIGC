import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Camera, 
  Upload, 
  Key, 
  RotateCcw, 
  Clock, 
  Building2, 
  Briefcase, 
  Network, 
  Shield, 
  Check, 
  UserCheck, 
  Filter, 
  FileText, 
  ExternalLink,
  Lock,
  UserX,
  ArrowRight,
  Eye,
  Download
} from 'lucide-react';
import { Funcionario, UserRole, PermissoesAcoesModulo } from '../../types';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { maskCPF, maskPhone, sanitizeToUpper } from '../../utils/documentUtils';

interface FuncionariosViewProps {
  onNavigateToCadastrosBasicos?: () => void;
}

const MODULOS_DISPONIVEIS: { id: string; nome: string; descricao: string }[] = [
  { id: 'dashboard', nome: 'Painel Executivo / Dashboard', descricao: 'Indicadores gerais, gráficos e resumos' },
  { id: 'profissionais', nome: 'Profissionais (Pessoa Física)', descricao: 'Cadastro, carteira e dados de farmacêuticos' },
  { id: 'empresas', nome: 'Empresas (Pessoa Jurídica)', descricao: 'Estabelecimentos, farmácias, RTs e CRT' },
  { id: 'cadastros_basicos', nome: 'Cadastros Básicos & Auxiliares', descricao: 'Tipos, habilitações, cargos e setores' },
  { id: 'funcionarios', nome: 'Gestão de Funcionários', descricao: 'Cadastro de colaboradores e acessos' },
  { id: 'financeiro', nome: 'Financeiro & Anuidades', descricao: 'Boletos bancários, Pix e liquidação' },
  { id: 'cobranca_juridico', nome: 'Jurídico & Dívida Ativa', descricao: 'CDA, execuções e protestos' },
  { id: 'fiscalizacao', nome: 'Fiscalização de Campo', descricao: 'Autos de fiscalização, GPS e offline' },
  { id: 'protocolos', nome: 'Protocolos & Requerimentos', descricao: 'Processos e despachos administrativos' },
  { id: 'relatorios', nome: 'Relatórios & BI Diretoria', descricao: 'Exportações e inteligência de dados' },
  { id: 'formularios', nome: 'Formulários Dinâmicos', descricao: 'Criação e respostas de formulários' },
  { id: 'portal_inscrito', nome: 'Portal do Inscrito (PF/PJ)', descricao: 'Autoatendimento de profissionais e empresas' },
  { id: 'configuracoes', nome: 'Painel Admin / Configurações', descricao: 'Parâmetros do conselho e numerações' },
  { id: 'microsservicos', nome: 'Microsserviços & Cloud', descricao: 'Status dos serviços e gateway' }
];

export const FuncionariosView: React.FC<FuncionariosViewProps> = ({ onNavigateToCadastrosBasicos }) => {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>(storageService.getFuncionarios());
  const [searchTerm, setSearchTerm] = useState('');
  const [setorFilter, setSetorFilter] = useState('TODOS');
  const [cargoFilter, setCargoFilter] = useState('TODOS');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ATIVO' | 'INATIVO'>('TODOS');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFunc, setEditingFunc] = useState<Partial<Funcionario> | null>(null);
  const [modalTab, setModalTab] = useState<'dados_gerais' | 'acesso_login'>('dados_gerais');
  const [itemToDelete, setItemToDelete] = useState<Funcionario | null>(null);
  const [tempPassword, setTempPassword] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cadastros Básicos dinâmicos para vínculos com reatividade a mudanças no storage
  const [allCadastrosBasicos, setAllCadastrosBasicos] = useState(storageService.getCadastrosBasicos());
  const cargosCadastrados = allCadastrosBasicos.filter(c => c.categoria === 'CARGO_FUNCIONARIO' && c.ativo);
  const setoresCadastrados = allCadastrosBasicos.filter(c => c.categoria === 'SETOR_LOTACAO' && c.ativo);
  const gruposAcessoCadastrados = allCadastrosBasicos.filter(c => c.categoria === 'GRUPO_ACESSO_FUNCIONARIO' && c.ativo);

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setFuncionarios(storageService.getFuncionarios());
      setAllCadastrosBasicos(storageService.getCadastrosBasicos());
    });
    return () => unsub();
  }, []);

  const findMatchingRegraAcesso = (
    cargoId?: string, 
    setorId?: string, 
    cargoNome?: string, 
    setorNome?: string
  ) => {
    const regras = storageService.getCadastrosBasicos().filter(c => c.categoria === 'GRUPO_ACESSO_FUNCIONARIO' && c.ativo);
    if (!cargoId && !setorId && !cargoNome && !setorNome) return null;

    const normCargoNome = (cargoNome || '').toUpperCase().trim();
    const normSetorNome = (setorNome || '').toUpperCase().trim();

    // Verificador de correspondência do Cargo
    const matchesCargo = (r: typeof regras[0]) => {
      if (cargoId && r.cargoId && r.cargoId === cargoId) return true;
      if (normCargoNome && r.cargoNome && r.cargoNome.toUpperCase().trim() === normCargoNome) return true;
      if (normCargoNome && r.cargoNome && (r.cargoNome.toUpperCase().includes(normCargoNome) || normCargoNome.includes(r.cargoNome.toUpperCase()))) return true;
      return false;
    };

    // Verificador de correspondência do Setor
    const matchesSetor = (r: typeof regras[0]) => {
      if (setorId && r.setorId && r.setorId === setorId) return true;
      if (normSetorNome && r.setorNome && r.setorNome.toUpperCase().trim() === normSetorNome) return true;
      if (normSetorNome && r.setorNome && (r.setorNome.toUpperCase().includes(normSetorNome) || normSetorNome.includes(r.setorNome.toUpperCase()))) return true;
      return false;
    };

    const isWildcardCargo = (r: typeof regras[0]) => !r.cargoId || r.cargoId === 'TODOS' || r.cargoId === '';
    const isWildcardSetor = (r: typeof regras[0]) => !r.setorId || r.setorId === 'TODOS' || r.setorId === '';

    // 1. Correspondência exata Cargo + Setor
    let match = regras.find(r => matchesCargo(r) && matchesSetor(r));

    // 2. Correspondência por Cargo específico (Setor não configurado ou "TODOS")
    if (!match && (cargoId || normCargoNome)) {
      match = regras.find(r => matchesCargo(r) && isWildcardSetor(r));
    }

    // 3. Correspondência por Setor específico (Cargo não configurado ou "TODOS")
    if (!match && (setorId || normSetorNome)) {
      match = regras.find(r => matchesSetor(r) && isWildcardCargo(r));
    }

    // 4. Fallback por palavras-chave e códigos cadastrais
    if (!match) {
      const testStr = `${cargoId || ''} ${normCargoNome} ${setorId || ''} ${normSetorNome}`.toUpperCase();
      if (testStr.includes('FISC')) {
        match = regras.find(r => r.codigo === 'FISCAL');
      } else if (testStr.includes('JURID') || testStr.includes('ADV')) {
        match = regras.find(r => r.codigo === 'JURIDICO');
      } else if (testStr.includes('FINAN') || testStr.includes('CONT')) {
        match = regras.find(r => r.codigo === 'FINANCEIRO');
      } else if (testStr.includes('DEV') || testStr.includes('ARQUITETO')) {
        match = regras.find(r => r.codigo === 'DEVELOPER');
      } else if (testStr.includes('TI') || testStr.includes('SISTEMA')) {
        match = regras.find(r => r.codigo === 'ADMIN');
      } else if (testStr.includes('DIR') || testStr.includes('PLEN')) {
        match = regras.find(r => r.codigo === 'DIRETORIA');
      } else if (testStr.includes('SEC') || testStr.includes('SECRET')) {
        match = regras.find(r => r.codigo === 'SECRETARIA');
      }
    }

    return match || null;
  };

  const applyMatchingAcesso = (
    cargoId: string, 
    cargoNome: string, 
    setorId: string, 
    setorNome: string, 
    current: Partial<Funcionario>,
    notifyUser = true
  ): Partial<Funcionario> => {
    const match = findMatchingRegraAcesso(cargoId, setorId, cargoNome, setorNome);
    if (match && match.modulosPermitidos && match.modulosPermitidos.length > 0) {
      const cleanModulos = match.modulosPermitidos.map(m => String(m).toLowerCase().trim());
      if (notifyUser) {
        toastService.info(
          'Módulos Vinculados Automaticamente',
          `Carregados ${cleanModulos.length} módulos pré-definidos para o cargo "${cargoNome || 'Cargo'}" no setor "${setorNome || 'Setor'}". Você pode personalizar individualmente na Aba 2.`
        );
      }
      return {
        ...current,
        cargoId,
        cargoNome,
        setorId,
        setorNome,
        permissoesModulos: [...cleanModulos]
      };
    }
    return {
      ...current,
      cargoId,
      cargoNome,
      setorId,
      setorNome
    };
  };

  const handleOpenNew = () => {
    const defaultCargo = cargosCadastrados[0];
    const defaultSetor = setoresCadastrados[0];
    const initialRule = defaultCargo && defaultSetor 
      ? findMatchingRegraAcesso(defaultCargo.id, defaultSetor.id, defaultCargo.nome, defaultSetor.nome) 
      : null;

    setEditingFunc({
      id: '',
      nome: '',
      cpf: '',
      rg: '',
      matricula: storageService.peekNextMatriculaFuncionario(),
      email: '',
      telefone: '',
      celular: '',
      fotoUrl: '',
      cargoId: defaultCargo ? defaultCargo.id : '',
      cargoNome: defaultCargo ? defaultCargo.nome : 'Assistente Administrativo',
      setorId: defaultSetor ? defaultSetor.id : '',
      setorNome: defaultSetor ? defaultSetor.nome : 'Secretaria Geral',
      permissoesModulos: initialRule?.modulosPermitidos 
        ? initialRule.modulosPermitidos.map(m => String(m).toLowerCase().trim()) 
        : ['dashboard', 'protocolos', 'profissionais', 'empresas'],
      ativo: true,
      dataAdmissao: new Date().toISOString().split('T')[0],
      senhaHash: '123456',
      primeiroAcessoPendente: true,
      zerarSenhaPendente: false,
      ultimoAcesso: 'Nunca acessou',
      possuiInscricaoProfissional: false,
      numeroInscricaoProfissional: ''
    });
    setTempPassword('');
    setModalTab('dados_gerais');
    setIsModalOpen(true);
  };

  const handleClearForm = () => {
    const defaultCargo = cargosCadastrados[0];
    const defaultSetor = setoresCadastrados[0];
    const initialRule = defaultCargo && defaultSetor 
      ? findMatchingRegraAcesso(defaultCargo.id, defaultSetor.id, defaultCargo.nome, defaultSetor.nome) 
      : null;

    setEditingFunc({
      id: editingFunc?.id || '',
      nome: '',
      cpf: '',
      rg: '',
      matricula: editingFunc?.id ? (editingFunc.matricula || storageService.peekNextMatriculaFuncionario()) : storageService.peekNextMatriculaFuncionario(),
      email: '',
      telefone: '',
      celular: '',
      fotoUrl: '',
      cargoId: defaultCargo ? defaultCargo.id : '',
      cargoNome: defaultCargo ? defaultCargo.nome : 'Assistente Administrativo',
      setorId: defaultSetor ? defaultSetor.id : '',
      setorNome: defaultSetor ? defaultSetor.nome : 'Secretaria Geral',
      permissoesModulos: initialRule?.modulosPermitidos 
        ? initialRule.modulosPermitidos.map(m => String(m).toLowerCase().trim()) 
        : ['dashboard'],
      ativo: true,
      dataAdmissao: new Date().toISOString().split('T')[0],
      senhaHash: '123456',
      primeiroAcessoPendente: true,
      zerarSenhaPendente: false,
      ultimoAcesso: 'Nunca acessou',
      possuiInscricaoProfissional: false,
      numeroInscricaoProfissional: '',
      numeroInscricao: '',
      observacoes: ''
    });
    setTempPassword('');
    toastService.info('Formulário Limpo', 'Todos os campos foram resetados.');
  };

  const handleCpfChange = (rawVal: string) => {
    const masked = maskCPF(rawVal);
    const cleanDigits = rawVal.replace(/\D/g, '');

    if (cleanDigits.length === 11) {
      // 1. Verificar duplicidade em funcionários cadastrados
      const dupFunc = funcionarios.find(f => f.id !== editingFunc?.id && f.cpf.replace(/\D/g, '') === cleanDigits);
      if (dupFunc) {
        toastService.warning(
          'CPF Já Cadastrado em Funcionários!',
          `Já existe um colaborador cadastrado com este CPF (${maskCPF(cleanDigits)}): ${dupFunc.nome} (Matrícula: ${dupFunc.matricula}).`
        );
        setEditingFunc(prev => (prev ? { ...prev, cpf: masked } : null));
        return;
      }

      // 2. Verificar se existe cadastro de profissional para carregar dados
      const { profissional } = storageService.findCadastroByCpf(cleanDigits);
      if (profissional) {
        setEditingFunc(prev => {
          if (!prev) return null;
          return {
            ...prev,
            cpf: masked,
            nome: profissional.nome,
            rg: profissional.rg || '',
            telefone: profissional.telefone || '',
            celular: profissional.celular || '',
            email: profissional.emailPessoal || profissional.emailComercial || '',
            fotoUrl: profissional.fotoUrl || prev.fotoUrl,
            possuiInscricaoProfissional: true,
            numeroInscricaoProfissional: profissional.inscricao,
            numeroInscricao: profissional.inscricao
          };
        });
        toastService.info(
          'Profissional Inscrito Identificado!',
          `Dados de ${profissional.nome} (Inscrição: ${profissional.inscricao}) carregados automaticamente para o colaborador.`
        );
        return;
      } else {
        // Se o CPF digitado não pertence a um profissional, desvincula inscrição profissional
        setEditingFunc(prev => {
          if (!prev) return null;
          return {
            ...prev,
            cpf: masked,
            possuiInscricaoProfissional: false,
            numeroInscricaoProfissional: '',
            numeroInscricao: ''
          };
        });
        return;
      }
    }

    setEditingFunc(prev => (prev ? { ...prev, cpf: masked } : null));
  };

  const handleEmailBlur = (_emailVal: string) => {
    // E-mail compartilhado permitido
  };

  const handlePuxarDadosProfissional = (inscricao: string) => {
    if (!inscricao || !inscricao.trim()) {
      toastService.warning('Informe a Inscrição', 'Digite o número de inscrição do profissional no CRF.');
      return;
    }
    const prof = storageService.findProfissionalByInscricao(inscricao);
    if (prof) {
      setEditingFunc(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          nome: prev.nome || prof.nome,
          cpf: prev.cpf || prof.cpf,
          rg: prev.rg || prof.rg || '',
          telefone: prev.telefone || prof.telefone || '',
          celular: prev.celular || prof.celular || '',
          email: prev.email || prof.emailPessoal || prof.emailComercial || '',
          fotoUrl: prev.fotoUrl || prof.fotoUrl || '',
          possuiInscricaoProfissional: true,
          numeroInscricaoProfissional: prof.inscricao,
          numeroInscricao: prof.inscricao
        };
      });
      toastService.success(
        'Dados do Profissional Carregados!',
        `Profissional ${prof.nome} (${prof.inscricao}) vinculado com sucesso ao cadastro do funcionário.`
      );
    } else {
      toastService.warning(
        'Inscrição Não Localizada',
        `Nenhum profissional com a inscrição "${inscricao}" foi encontrado no cadastro do conselho.`
      );
    }
  };

  const handleOpenEdit = (func: Funcionario) => {
    setEditingFunc({ 
      ...func,
      possuiInscricaoProfissional: func.possuiInscricaoProfissional ?? Boolean(func.numeroInscricaoProfissional || func.numeroInscricao),
      numeroInscricaoProfissional: func.numeroInscricaoProfissional || func.numeroInscricao || '',
      permissoesModulos: (func.permissoesModulos || []).map(m => String(m).toLowerCase().trim())
    });
    setTempPassword('');
    setModalTab('dados_gerais');
    setIsModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toastService.warning('Arquivo Muito Grande', 'Selecione uma imagem de até 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingFunc(prev => prev ? ({ ...prev, fotoUrl: reader.result as string }) : null);
        toastService.success('Foto Carregada', 'Imagem do colaborador adicionada com sucesso.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleModulo = (moduloId: string) => {
    if (!editingFunc) return;
    const modNorm = moduloId.toLowerCase().trim();
    const current = (editingFunc.permissoesModulos || []).map(m => String(m).toLowerCase().trim());
    const exists = current.includes(modNorm);
    const updated = exists ? current.filter(m => m !== modNorm) : [...current, modNorm];
    
    const currentAcoes = { ...(editingFunc.permissoesAcoes || {}) };
    if (exists) {
      currentAcoes[modNorm] = { visualizar: false, editar: false, deletar: false };
    } else {
      currentAcoes[modNorm] = currentAcoes[modNorm] || { visualizar: true, editar: true, deletar: false };
      if (!currentAcoes[modNorm].visualizar) {
        currentAcoes[modNorm].visualizar = true;
      }
    }

    setEditingFunc({ 
      ...editingFunc, 
      permissoesModulos: updated,
      permissoesAcoes: currentAcoes
    });
  };

  const handleToggleAcaoModulo = (
    moduloId: string, 
    acao: 'visualizar' | 'editar' | 'deletar', 
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    if (!editingFunc) return;
    const modNorm = moduloId.toLowerCase().trim();
    const currentAcoes = { ...(editingFunc.permissoesAcoes || {}) };
    const modAcoes: PermissoesAcoesModulo = currentAcoes[modNorm] || {
      visualizar: (editingFunc.permissoesModulos || []).map(m => m.toLowerCase().trim()).includes(modNorm),
      editar: (editingFunc.permissoesModulos || []).map(m => m.toLowerCase().trim()).includes(modNorm),
      deletar: false
    };

    const nextVal = !modAcoes[acao];
    const updatedModAcoes: PermissoesAcoesModulo = {
      ...modAcoes,
      [acao]: nextVal
    };

    if ((acao === 'editar' || acao === 'deletar') && nextVal) {
      updatedModAcoes.visualizar = true;
    }
    if (acao === 'visualizar' && !nextVal) {
      updatedModAcoes.editar = false;
      updatedModAcoes.deletar = false;
    }

    const hasAny = updatedModAcoes.visualizar || updatedModAcoes.editar || updatedModAcoes.deletar;
    let nextModulos = [...(editingFunc.permissoesModulos || [])].map(m => m.toLowerCase().trim());
    if (hasAny && !nextModulos.includes(modNorm)) {
      nextModulos.push(modNorm);
    } else if (!hasAny && nextModulos.includes(modNorm)) {
      nextModulos = nextModulos.filter(m => m !== modNorm);
    }

    setEditingFunc({
      ...editingFunc,
      permissoesModulos: nextModulos,
      permissoesAcoes: {
        ...currentAcoes,
        [modNorm]: updatedModAcoes
      }
    });
  };

  const handlePresetAcoesColaborador = (preset: 'apenas_visualizar' | 'visualizar_editar' | 'acesso_total') => {
    if (!editingFunc) return;
    const currentModulos = (editingFunc.permissoesModulos && editingFunc.permissoesModulos.length > 0)
      ? editingFunc.permissoesModulos.map(m => m.toLowerCase().trim())
      : MODULOS_DISPONIVEIS.map(m => m.id.toLowerCase().trim());

    const newAcoes: Record<string, PermissoesAcoesModulo> = {};
    currentModulos.forEach(mId => {
      if (preset === 'apenas_visualizar') {
        newAcoes[mId] = { visualizar: true, editar: false, deletar: false };
      } else if (preset === 'visualizar_editar') {
        newAcoes[mId] = { visualizar: true, editar: true, deletar: false };
      } else {
        newAcoes[mId] = { visualizar: true, editar: true, deletar: true };
      }
    });

    setEditingFunc({
      ...editingFunc,
      permissoesModulos: currentModulos,
      permissoesAcoes: newAcoes
    });
  };

  const handleSelectAllModulos = () => {
    if (!editingFunc) return;
    const all = MODULOS_DISPONIVEIS.map(m => m.id.toLowerCase());
    const newAcoes: Record<string, PermissoesAcoesModulo> = {};
    all.forEach(mId => {
      newAcoes[mId] = { visualizar: true, editar: true, deletar: false };
    });
    setEditingFunc({ 
      ...editingFunc, 
      permissoesModulos: all,
      permissoesAcoes: newAcoes
    });
  };

  const handleClearAllModulos = () => {
    if (!editingFunc) return;
    setEditingFunc({ 
      ...editingFunc, 
      permissoesModulos: ['dashboard'],
      permissoesAcoes: { dashboard: { visualizar: true, editar: false, deletar: false } }
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFunc?.nome?.trim()) {
      toastService.warning('Campo Obrigatório', 'Informe o nome completo do funcionário.');
      return;
    }
    const cleanCpf = (editingFunc.cpf || '').replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      toastService.warning('CPF Inválido', 'O CPF deve conter exatamente 11 dígitos.');
      return;
    }

    // 1. Validação de duplicidade de CPF em funcionários
    const dupCpf = funcionarios.find(f => f.id !== editingFunc.id && f.cpf.replace(/\D/g, '') === cleanCpf);
    if (dupCpf) {
      toastService.warning(
        'CPF Já Cadastrado',
        `Não é possível salvar: já existe um colaborador cadastrado com este CPF (${maskCPF(cleanCpf)}): ${dupCpf.nome} (Matrícula: ${dupCpf.matricula}).`
      );
      return;
    }

    const matriculaFinal = (editingFunc.matricula && /^\d+$/.test(String(editingFunc.matricula).trim()))
      ? String(editingFunc.matricula).trim()
      : storageService.peekNextMatriculaFuncionario();

    const payload: Funcionario = {
      id: editingFunc.id || `func_${Date.now()}`,
      nome: editingFunc.nome.trim(),
      cpf: maskCPF(cleanCpf),
      rg: editingFunc.rg || '',
      matricula: matriculaFinal,
      email: editingFunc.email || '',
      telefone: editingFunc.telefone || '',
      celular: editingFunc.celular || '',
      fotoUrl: editingFunc.fotoUrl || '',
      cargoId: editingFunc.cargoId || '',
      cargoNome: editingFunc.cargoNome || 'Não informado',
      numeroInscricao: editingFunc.numeroInscricao ? editingFunc.numeroInscricao.trim().toUpperCase() : undefined,
      setorId: editingFunc.setorId || '',
      setorNome: editingFunc.setorNome || 'Não informado',
      permissoesModulos: editingFunc.permissoesModulos && editingFunc.permissoesModulos.length > 0 
        ? editingFunc.permissoesModulos 
        : ['dashboard'],
      permissoesAcoes: editingFunc.permissoesAcoes,
      ativo: editingFunc.ativo ?? true,
      dataAdmissao: editingFunc.dataAdmissao || new Date().toISOString().split('T')[0],
      senhaHash: tempPassword.trim() || editingFunc.senhaHash || '123456',
      primeiroAcessoPendente: editingFunc.primeiroAcessoPendente ?? false,
      zerarSenhaPendente: editingFunc.zerarSenhaPendente ?? false,
      ultimoAcesso: editingFunc.ultimoAcesso || 'Nunca acessou',
      observacoes: editingFunc.observacoes || '',
      possuiInscricaoProfissional: Boolean(editingFunc.possuiInscricaoProfissional),
      numeroInscricaoProfissional: editingFunc.numeroInscricaoProfissional || editingFunc.numeroInscricao || ''
    };

    const res = storageService.saveFuncionario(payload);
    if (!res.success) {
      toastService.warning('Aviso de Validação', res.message || 'Erro ao salvar funcionário.');
      return;
    }

    setIsModalOpen(false);
    setEditingFunc(null);
    toastService.success(
      editingFunc.id ? 'Funcionário Atualizado' : 'Novo Funcionário Cadastrado',
      `O colaborador "${payload.nome}" foi salvo com sucesso no conselho.`
    );
  };

  const handleZerarSenhaModal = () => {
    if (!editingFunc?.id) {
      setEditingFunc(prev => prev ? ({ ...prev, zerarSenhaPendente: true, primeiroAcessoPendente: true }) : null);
      toastService.info('Senha Zerada', 'O funcionário deverá cadastrar uma senha no primeiro login.');
      return;
    }
    const success = storageService.zerarSenha('FUNCIONARIO', editingFunc.id);
    if (success) {
      setEditingFunc(prev => prev ? ({ ...prev, zerarSenhaPendente: true, primeiroAcessoPendente: true, senhaHash: '' }) : null);
      toastService.success(
        'Senha Resetada com Sucesso',
        'O colaborador será obrigado a definir uma nova senha no momento em que efetuar o próximo login.'
      );
    }
  };

  const handleZerarSenhaDirect = (func: Funcionario) => {
    if (window.confirm(`Deseja zerar a senha do colaborador "${func.nome}"? Ele será obrigado a cadastrar uma nova senha no próximo login.`)) {
      storageService.zerarSenha('FUNCIONARIO', func.id);
      toastService.success(
        'Senha Zerada',
        `A senha de ${func.nome} foi zerada. Acesso pendente de nova senha.`
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const res = storageService.deleteFuncionario(itemToDelete.id);
    if (!res.success) {
      toastService.warning('Exclusão Bloqueada', res.message || 'Erro ao excluir funcionário.');
      return;
    }
    setItemToDelete(null);
    toastService.success('Registro Removido', `O funcionário "${itemToDelete.nome}" foi removido.`);
  };

  // Filtragem
  const filteredFuncionarios = funcionarios.filter(f => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = f.nome.toLowerCase().includes(q) ||
        f.cpf.includes(q) ||
        f.matricula.toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (setorFilter !== 'TODOS' && f.setorId !== setorFilter) return false;
    if (cargoFilter !== 'TODOS' && f.cargoId !== cargoFilter) return false;
    if (statusFilter === 'ATIVO' && !f.ativo) return false;
    if (statusFilter === 'INATIVO' && f.ativo) return false;
    return true;
  });

  const totalAtivos = funcionarios.filter(f => f.ativo).length;
  const totalInativos = funcionarios.filter(f => !f.ativo).length;

  return (
    <div className="space-y-6">
      {/* 1. Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                CADASTRO DE FUNCIONÁRIOS
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                {funcionarios.length} COLABORADORES
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestão de colaboradores, fiscais, assessores, cargos e níveis de acesso à plataforma SIGCON.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {onNavigateToCadastrosBasicos && (
            <button
              onClick={onNavigateToCadastrosBasicos}
              className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all uppercase shadow-2xs cursor-pointer"
              title="Parametrizar Cargos, Setores e Grupos de Acesso"
            >
              <Briefcase className="w-4 h-4 text-slate-500" />
              <span>CARGOS & SETORES</span>
            </button>
          )}

          <button
            onClick={handleOpenNew}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all uppercase shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>CADASTRAR FUNCIONÁRIO</span>
          </button>
        </div>
      </div>

      {/* 2. Cards de Estatísticas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total de Colaboradores</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{funcionarios.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Registrados na base</div>
        </div>
        <div className="bg-white border border-emerald-200 bg-emerald-50/20 p-4 rounded-2xl shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Colaboradores Ativos</div>
          <div className="text-2xl font-extrabold text-emerald-800 mt-1">{totalAtivos}</div>
          <div className="text-[10px] text-emerald-600 mt-1">Com acesso liberado</div>
        </div>
        <div className="bg-white border border-amber-200 bg-amber-50/20 p-4 rounded-2xl shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Inativos / Bloqueados</div>
          <div className="text-2xl font-extrabold text-amber-800 mt-1">{totalInativos}</div>
          <div className="text-[10px] text-amber-600 mt-1">Acesso desativado</div>
        </div>
        <div className="bg-white border border-purple-200 bg-purple-50/20 p-4 rounded-2xl shadow-xs">
          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Cargos Vinculados</div>
          <div className="text-2xl font-extrabold text-purple-800 mt-1">{cargosCadastrados.length}</div>
          <div className="text-[10px] text-purple-600 mt-1">Cadastros Básicos</div>
        </div>
      </div>

      {/* 3. Filtros & Barra de Busca */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar funcionário por nome, CPF, matrícula ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select
              value={setorFilter}
              onChange={(e) => setSetorFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="TODOS">Todos os Setores</option>
              {setoresCadastrados.map(s => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>

            <select
              value={cargoFilter}
              onChange={(e) => setCargoFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="TODOS">Todos os Cargos</option>
              {cargosCadastrados.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="TODOS">Status: Todos</option>
              <option value="ATIVO">Apenas Ativos</option>
              <option value="INATIVO">Apenas Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Tabela de Funcionários */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Colaborador / Foto</th>
                <th className="py-3 px-4">CPF / Matrícula</th>
                <th className="py-3 px-4">Cargo & Lotação</th>
                <th className="py-3 px-4">Módulos Liberados</th>
                <th className="py-3 px-4">Último Acesso / Status Senha</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFuncionarios.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold">Nenhum funcionário encontrado para os filtros selecionados.</p>
                  </td>
                </tr>
              ) : (
                filteredFuncionarios.map((func) => {
                  const precisaTrocar = func.primeiroAcessoPendente || func.zerarSenhaPendente || !func.senhaHash;
                  return (
                    <tr key={func.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          {func.fotoUrl ? (
                            <img
                              src={func.fotoUrl}
                              alt={func.nome}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 font-bold flex items-center justify-center shrink-0">
                              {func.nome.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 leading-snug">{func.nome}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span>{func.email || 'Sem e-mail'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-slate-800">{func.cpf}</div>
                        <div className="text-[11px] text-slate-400">{func.matricula}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                          <span>{func.cargoNome}</span>
                          {func.numeroInscricao && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {func.numeroInscricao}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Network className="w-3 h-3 text-slate-400" />
                          <span>{func.setorNome}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span>{func.permissoesModulos?.length || 0} / {MODULOS_DISPONIVEIS.length} MÓDULOS</span>
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 max-w-[200px] truncate" title={func.permissoesModulos?.join(', ')}>
                          {func.permissoesModulos?.length === MODULOS_DISPONIVEIS.length 
                            ? 'Acesso Global Completo' 
                            : func.permissoesModulos && func.permissoesModulos.length > 0 
                            ? func.permissoesModulos.slice(0, 3).join(', ') + (func.permissoesModulos.length > 3 ? '...' : '')
                            : 'Nenhum módulo vinculado'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-slate-600 font-medium">
                          {func.ultimoAcesso || 'Nunca acessou'}
                        </div>
                        {precisaTrocar ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mt-0.5 border border-amber-200">
                            <Key className="w-2.5 h-2.5" />
                            <span>Troca obrigatória no login</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                            <Check className="w-2.5 h-2.5" />
                            <span>Senha ativa</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          func.ativo 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {func.ativo ? 'ATIVO' : 'INATIVO'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleZerarSenhaDirect(func)}
                            title="Zerar Senha (obriga nova senha no próximo login)"
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(func)}
                            title="Editar Dados do Funcionário"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {func.id !== 'func-admin-master' && (
                            <button
                              onClick={() => setItemToDelete(func)}
                              title="Excluir Funcionário"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* 5. Modal de Cadastro / Edição Completa */}
      {isModalOpen && editingFunc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">
                    {editingFunc.id ? 'Editar Dados do Funcionário' : 'Novo Cadastro de Funcionário'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Colaboradores do Conselho Regional de Farmácia
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 hover:text-white hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 transition-all flex items-center space-x-1.5 cursor-pointer"
                  title="Limpar todos os campos deste formulário"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar Formulário</span>
                </button>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingFunc(null);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-3">
              <button
                type="button"
                onClick={() => setModalTab('dados_gerais')}
                className={`flex items-center space-x-2 pb-3 px-2 text-xs font-bold uppercase border-b-2 transition-all cursor-pointer ${
                  modalTab === 'dados_gerais'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>1. Dados Pessoais, Foto & Lotação</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('acesso_login')}
                className={`flex items-center space-x-2 pb-3 px-2 text-xs font-bold uppercase border-b-2 transition-all cursor-pointer ${
                  modalTab === 'acesso_login'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>2. Login, Senha & Módulos da Plataforma</span>
                {(editingFunc.primeiroAcessoPendente || editingFunc.zerarSenhaPendente) && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
              {modalTab === 'dados_gerais' ? (
                <div className="space-y-4">
                  {/* Foto & Identificação Básica */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="relative group shrink-0">
                      {editingFunc.fotoUrl ? (
                        <img
                          src={editingFunc.fotoUrl}
                          alt="Foto"
                          className="w-24 h-24 rounded-2xl object-cover border-2 border-white shadow-md"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-blue-100 text-blue-600 font-extrabold text-2xl flex items-center justify-center border-2 border-white shadow-md">
                          {editingFunc.nome ? editingFunc.nome.charAt(0).toUpperCase() : <Users className="w-8 h-8" />}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-transform hover:scale-105 cursor-pointer"
                        title="Alterar Foto do Funcionário"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="font-bold text-slate-800 text-sm">
                        Foto Oficial do Colaborador
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Insira a foto do funcionário para identificação no sistema, crachás digitais e relatórios de auditoria. Formatos suportados: JPG, PNG até 2MB.
                      </p>
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center space-x-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Selecionar Imagem</span>
                        </button>
                        {editingFunc.fotoUrl && (
                          <button
                            type="button"
                            onClick={() => setEditingFunc(prev => prev ? ({ ...prev, fotoUrl: '' }) : null)}
                            className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-bold text-[11px] cursor-pointer"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vínculo: Profissional com inscrição neste regional */}
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-emerald-600" />
                          Profissional com inscrição neste regional?
                        </span>
                        <p className="text-[11px] text-emerald-700/80">
                          Informe se este colaborador também é um profissional registrado neste Conselho Regional de Farmácia.
                        </p>
                      </div>
                      <div className="flex items-center space-x-4 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs shrink-0">
                        <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="possuiInscricaoProfissional"
                            checked={editingFunc.possuiInscricaoProfissional === true}
                            onChange={() => setEditingFunc(prev => prev ? ({ ...prev, possuiInscricaoProfissional: true }) : prev)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span>SIM</span>
                        </label>
                        <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="possuiInscricaoProfissional"
                            checked={!editingFunc.possuiInscricaoProfissional}
                            onChange={() => setEditingFunc(prev => prev ? ({ ...prev, possuiInscricaoProfissional: false, numeroInscricaoProfissional: '' }) : prev)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span>NÃO</span>
                        </label>
                      </div>
                    </div>

                    {editingFunc.possuiInscricaoProfissional && (
                      <div className="pt-2 border-t border-emerald-200/70 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-emerald-950 font-bold uppercase text-[10px] mb-1">
                            Número de Inscrição Profissional (CRF) *
                          </label>
                          <input
                            type="text"
                            value={editingFunc.numeroInscricaoProfissional || editingFunc.numeroInscricao || ''}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setEditingFunc(prev => prev ? ({ ...prev, numeroInscricaoProfissional: val, numeroInscricao: val }) : prev);
                            }}
                            placeholder="EX: CRF-AM 4150, CRF-AM 9999"
                            className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-mono font-bold text-emerald-950 uppercase text-xs focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePuxarDadosProfissional(editingFunc.numeroInscricaoProfissional || editingFunc.numeroInscricao || '')}
                          className="sm:mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Puxar Dados do Profissional</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Nome Completo e CPF */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-bold mb-1 uppercase">
                        Nome Completo do Funcionário <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="EX: DR. CARLOS EDUARDO NOGUEIRA"
                        value={editingFunc.nome || ''}
                        onChange={(e) => setEditingFunc({ ...editingFunc, nome: e.target.value.toUpperCase() })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold uppercase focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase">
                        CPF (11 Dígitos) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="000.000.000-00"
                        value={editingFunc.cpf || ''}
                        onChange={(e) => handleCpfChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* Matrícula, RG e Data de Admissão */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase">
                        Matrícula Funcional (Numérica)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="EX: 0"
                        value={editingFunc.matricula ?? ''}
                        onChange={(e) => setEditingFunc({ ...editingFunc, matricula: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase">
                        Documento RG
                      </label>
                      <input
                        type="text"
                        placeholder="EX: 1234567 SSP/AM"
                        value={editingFunc.rg || ''}
                        onChange={(e) => setEditingFunc({ ...editingFunc, rg: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase">
                        Data de Admissão
                      </label>
                      <input
                        type="date"
                        value={editingFunc.dataAdmissao || ''}
                        onChange={(e) => setEditingFunc({ ...editingFunc, dataAdmissao: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* Contato */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase">
                        E-mail Institucional
                      </label>
                      <input
                        type="email"
                        placeholder="colaborador@crfam.org.br"
                        value={editingFunc.email || ''}
                        onChange={(e) => setEditingFunc({ ...editingFunc, email: e.target.value.toLowerCase() })}
                        onBlur={(e) => handleEmailBlur(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase">
                        Telefone Fixo
                      </label>
                      <input
                        type="text"
                        placeholder="(00) 0000-0000"
                        value={editingFunc.telefone || ''}
                        onChange={(e) => setEditingFunc({ ...editingFunc, telefone: maskPhone(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase">
                        Celular / WhatsApp
                      </label>
                      <input
                        type="text"
                        placeholder="(00) 00000-0000"
                        value={editingFunc.celular || ''}
                        onChange={(e) => setEditingFunc({ ...editingFunc, celular: maskPhone(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* Lotação & Cargo (Lincado dinamicamente com Cadastros Básicos) */}
                  <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-blue-900 font-bold uppercase text-[11px]">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <span>Cargo e Lotação Institucional (Cadastros Básicos)</span>
                      </div>
                      {onNavigateToCadastrosBasicos && (
                        <button
                          type="button"
                          onClick={onNavigateToCadastrosBasicos}
                          className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Gerenciar Cargos & Setores</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1 uppercase">
                          Cargo / Função <span className="text-rose-500">*</span>
                        </label>
                        <select
                          required
                          value={editingFunc.cargoId || ''}
                          onChange={(e) => {
                            const newCargoId = e.target.value;
                            const cargoSel = cargosCadastrados.find(c => c.id === newCargoId);
                            const newCargoNome = cargoSel ? cargoSel.nome : '';
                            const updated = applyMatchingAcesso(
                              newCargoId,
                              newCargoNome,
                              editingFunc.setorId || '',
                              editingFunc.setorNome || '',
                              editingFunc,
                              true
                            );
                            setEditingFunc(updated);
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                        >
                          <option value="">Selecione o Cargo...</option>
                          {cargosCadastrados.map(c => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1 uppercase">
                          Setor de Lotação <span className="text-rose-500">*</span>
                        </label>
                        <select
                          required
                          value={editingFunc.setorId || ''}
                          onChange={(e) => {
                            const newSetorId = e.target.value;
                            const setorSel = setoresCadastrados.find(s => s.id === newSetorId);
                            const newSetorNome = setorSel ? setorSel.nome : '';
                            const updated = applyMatchingAcesso(
                              editingFunc.cargoId || '',
                              editingFunc.cargoNome || '',
                              newSetorId,
                              newSetorNome,
                              editingFunc,
                              true
                            );
                            setEditingFunc(updated);
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                        >
                          <option value="">Selecione o Setor...</option>
                          {setoresCadastrados.map(s => (
                            <option key={s.id} value={s.id}>{s.nome}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Campo Exclusivo: Número de Inscrição / CRF do Fiscal - EXCLUSIVO PARA O CARGO DE FISCAL */}
                    {(editingFunc.cargoNome || '').toLowerCase().includes('fiscal') && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl space-y-1.5 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <label className="block text-emerald-950 font-bold uppercase text-[11px] flex items-center space-x-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Número de Inscrição / CRF do Fiscal *</span>
                          </label>
                          <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                            Exclusivo Cargo Fiscal
                          </span>
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="EX: CRF-AM 4150"
                          value={editingFunc.numeroInscricao || ''}
                          onChange={(e) => setEditingFunc({ ...editingFunc, numeroInscricao: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg font-mono font-bold text-xs text-emerald-950 uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                        <p className="text-[10px] text-emerald-800">
                          Este número de inscrição do Farmacêutico Fiscal será inserido automaticamente na assinatura digital dos Termos de Inspeção, Notificações e Autos de Infração.
                        </p>
                      </div>
                    )}

                    {/* Indicador em tempo real dos Módulos Pré-Definidos Vinculados */}
                    {(() => {
                      const activeRule = findMatchingRegraAcesso(
                        editingFunc.cargoId || '', 
                        editingFunc.setorId || '',
                        editingFunc.cargoNome || '',
                        editingFunc.setorNome || ''
                      );
                      return (
                        <div className="p-3 bg-white rounded-xl border border-blue-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-[11px]">
                              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                              <span>Módulos Pré-Definidos Vinculados:</span>
                              <span className="text-blue-700 font-extrabold uppercase">
                                {activeRule ? activeRule.nome : 'Configuração Padrão do Sistema'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500">
                              {activeRule 
                                ? `${editingFunc.permissoesModulos?.length || 0} módulos liberados automaticamente para esta combinação de Cargo e Setor.`
                                : 'Você pode personalizar individualmente os módulos permitidos na Aba 2.'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setModalTab('acesso_login')}
                            className="flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-[11px] uppercase transition-colors shrink-0 cursor-pointer"
                          >
                            <span>Ver / Personalizar na Aba 2</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Status Ativo */}
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="ativoFuncCheckbox"
                      checked={editingFunc.ativo ?? true}
                      onChange={(e) => setEditingFunc({ ...editingFunc, ativo: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="ativoFuncCheckbox" className="text-slate-800 font-bold select-none cursor-pointer">
                      Colaborador Ativo (Com autorização para acesso às dependências e sistema do conselho)
                    </label>
                  </div>
                </div>
              ) : (
                /* Aba 2: Login, Nível de Acesso & Módulos da Plataforma */
                <div className="space-y-5">
                  {/* Card do Usuário (CPF Automático) */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Key className="w-4 h-4 text-blue-600" />
                        <h4 className="font-bold text-slate-900 uppercase">
                          Credenciais de Acesso à Plataforma
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        USUÁRIO AUTOMÁTICO = CPF
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 font-bold mb-1 uppercase text-[10px]">
                          Usuário do Sistema (Definido Automaticamente)
                        </label>
                        <div className="px-3.5 py-2.5 bg-slate-200/70 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 flex items-center justify-between">
                          <span>{editingFunc.cpf || 'Informe o CPF na aba anterior'}</span>
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          O funcionário sempre usará seu CPF para acessar o sistema.
                        </p>
                      </div>

                      <div>
                        <label className="block text-slate-500 font-bold mb-1 uppercase text-[10px]">
                          Data do Último Acesso
                        </label>
                        <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-700 flex items-center space-x-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{editingFunc.ultimoAcesso || 'Nunca acessou'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botão Zerar Senha */}
                    <div className="mt-2 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-800">Status de Senha do Usuário</div>
                        <div className="text-[11px] text-slate-500">
                          {editingFunc.primeiroAcessoPendente || editingFunc.zerarSenhaPendente ? (
                            <span className="text-amber-700 font-bold">
                              Obrigatório cadastrar nova senha no próximo acesso.
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold">
                              Senha cadastrada e ativa.
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={handleZerarSenhaModal}
                          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase shadow-sm transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>ZERAR SENHA</span>
                        </button>
                      </div>
                    </div>

                    {/* Opção para definir senha manualmente se desejado */}
                    <div className="pt-2">
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[11px]">
                        Definir Senha Manual Provisória (Opcional)
                      </label>
                      <input
                        type="password"
                        placeholder="Deixe em branco para manter a senha atual ou padrão"
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        className="w-full sm:w-1/2 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Regra de Acesso Baseada em Cargo & Setor */}
                  <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-blue-950 font-bold uppercase text-xs">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span>Regra de Acesso Vinculada ao Cargo & Setor</span>
                      </div>
                      <div className="text-[11px] text-slate-700">
                        <span className="font-bold text-slate-900">
                          Cargo: {editingFunc.cargoNome || 'Não definido'} | Setor: {editingFunc.setorNome || 'Não definido'}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Os módulos de acesso são gerados automaticamente pela combinação de Cargo e Setor de Lotação. Você pode personalizar e ajustar as permissões individuais abaixo.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = applyMatchingAcesso(
                          editingFunc.cargoId || '',
                          editingFunc.cargoNome || '',
                          editingFunc.setorId || '',
                          editingFunc.setorNome || '',
                          editingFunc,
                          true
                        );
                        setEditingFunc(updated);
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase shadow-sm transition-all cursor-pointer shrink-0"
                      title="Restaurar os módulos pré-definidos para este Cargo e Setor"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar Padrão</span>
                    </button>
                  </div>

                  {/* Seleção de Módulos da Plataforma Permitidos */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-slate-800 font-bold uppercase text-[11px] flex items-center gap-1.5">
                        <span>Módulos Permitidos na Plataforma</span>
                        <span className="text-blue-600 font-mono font-bold">
                          ({editingFunc.permissoesModulos?.length || 0} de {MODULOS_DISPONIVEIS.length})
                        </span>
                      </label>
                      <div className="flex items-center space-x-1.5 text-[11px] flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => handlePresetAcoesColaborador('apenas_visualizar')}
                          className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold text-[10px] cursor-pointer"
                          title="Definir apenas visualização para os módulos liberados"
                        >
                          👁️ Apenas Visualizar
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePresetAcoesColaborador('visualizar_editar')}
                          className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-[10px] cursor-pointer"
                          title="Definir visualização e edição para os módulos liberados"
                        >
                          ✏️ Visualizar & Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePresetAcoesColaborador('acesso_total')}
                          className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 font-bold text-[10px] cursor-pointer"
                          title="Definir acesso total (visualizar, editar, deletar) para os módulos"
                        >
                          ⚡ Acesso Total
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={handleSelectAllModulos}
                          className="font-bold text-blue-600 hover:underline cursor-pointer text-[10px]"
                        >
                          Todos Módulos
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={handleClearAllModulos}
                          className="font-bold text-slate-500 hover:underline cursor-pointer text-[10px]"
                        >
                          Mínimo
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {MODULOS_DISPONIVEIS.map((mod) => {
                        const isChecked = (editingFunc.permissoesModulos || [])
                          .map(m => String(m).toLowerCase().trim())
                          .includes(mod.id.toLowerCase().trim());

                        const modNorm = mod.id.toLowerCase().trim();
                        const acoes = (editingFunc.permissoesAcoes && editingFunc.permissoesAcoes[modNorm]) || {
                          visualizar: isChecked,
                          editar: isChecked,
                          deletar: false
                        };

                        return (
                          <div
                            key={mod.id}
                            className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                              isChecked
                                ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div 
                              onClick={() => handleToggleModulo(mod.id)}
                              className="flex items-start space-x-2.5 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // handled by parent div
                                className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 pointer-events-none"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className={`font-bold text-xs ${isChecked ? 'text-blue-900' : 'text-slate-700'}`}>
                                    {mod.nome}
                                  </div>
                                  {isChecked && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 uppercase">
                                      Ativo
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                                  {mod.descricao}
                                </p>
                              </div>
                            </div>

                            {/* Ações Granulares: Visualizar, Editar, Deletar */}
                            <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-end space-x-1.5">
                              {/* Visualizar */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleAcaoModulo(mod.id, 'visualizar', e)}
                                className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                                  acoes.visualizar
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'
                                }`}
                                title="Permissão para consultar/visualizar este módulo"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Visualizar</span>
                              </button>

                              {/* Editar */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleAcaoModulo(mod.id, 'editar', e)}
                                className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                                  acoes.editar
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'
                                }`}
                                title="Permissão para criar e editar registros neste módulo"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Editar</span>
                              </button>

                              {/* Deletar */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleAcaoModulo(mod.id, 'deletar', e)}
                                className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                                  acoes.deletar
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'
                                }`}
                                title="Permissão para excluir registros neste módulo"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Deletar</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold transition-colors uppercase text-xs cursor-pointer shadow-2xs"
                  title="Limpar todos os campos deste formulário"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar Formulário</span>
                </button>

                <div className="flex items-center space-x-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingFunc(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors uppercase cursor-pointer"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 transition-all uppercase cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>SALVAR FUNCIONÁRIO</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal de Confirmação de Exclusão */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 uppercase">
                    Confirmar Exclusão de Colaborador
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ação irreversível no cadastro
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Tem certeza que deseja excluir o cadastro do funcionário <strong>{itemToDelete.nome}</strong> (CPF: {itemToDelete.cpf})? O acesso deste colaborador à plataforma será revogado imediatamente.
              </p>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  Excluir Definitivamente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
