import React, { useState, useEffect } from 'react';
import { 
  FormInput, 
  Plus, 
  Trash2, 
  Edit3,
  Save, 
  CheckCircle2, 
  Settings2, 
  Layers, 
  FileText, 
  X,
  Send,
  Eye,
  BarChart3,
  Calendar,
  Globe,
  User,
  Building2,
  Paperclip,
  Upload,
  Check,
  AlertCircle,
  FileCheck2,
  Download,
  Filter,
  FolderTree,
  MapPin,
  CheckSquare,
  Network,
  ArrowUp,
  ArrowDown,
  AlertTriangle
} from 'lucide-react';
import { FormularioDinamico, FormFieldConfig, RespostaFormulario } from '../../types';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';

export const FormulariosView: React.FC = () => {
  const [formularios, setFormularios] = useState<FormularioDinamico[]>(storageService.getFormularios());
  const [selectedForm, setSelectedForm] = useState<FormularioDinamico | null>(formularios[0] || null);
  const [activeMainTab, setActiveMainTab] = useState<'GESTAO' | 'ESTATISTICAS'>('GESTAO');

  // Modal State para Criar ou Editar Formulário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);

  // Form builder state
  const [formTitulo, setFormTitulo] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formCategoria, setFormCategoria] = useState('Responsabilidade Técnica');

  // Direcionamento e Tramitação Automática (Admin Only)
  const [formSetorTramitacaoId, setFormSetorTramitacaoId] = useState<string>('');
  const [formSetorTramitacaoNome, setFormSetorTramitacaoNome] = useState<string>('');
  const [formStatusProtocoloInicial, setFormStatusProtocoloInicial] = useState<string>('');
  const [formPrazoDiasConclusao, setFormPrazoDiasConclusao] = useState<number>(15);
  const [formPermiteAnonimo, setFormPermiteAnonimo] = useState<boolean>(false);
  
  // Publicação em canais
  const [publicarProfissional, setPublicarProfissional] = useState(true);
  const [publicarEmpresa, setPublicarEmpresa] = useState(false);
  const [publicarSite, setPublicarSite] = useState(false);

  // Configuração de Anexos
  const [permiteAnexos, setPermiteAnexos] = useState(false);
  const [tamanhoMaximoMb, setTamanhoMaximoMb] = useState(10);
  const [instrucoesAnexo, setInstrucoesAnexo] = useState('Anexe documentos comprobatórios em formato PDF, DOCX, JPG ou PNG (máx. 10MB).');

  // Campos do formulário
  const [campos, setCampos] = useState<FormFieldConfig[]>([]);

  // Preview & Simulação de Envio
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});
  const [previewAnexos, setPreviewAnexos] = useState<{ nome: string; tamanho: number; tipo: string; url?: string }[]>([]);

  // Filtros de Estatísticas
  const [filtroPeriodo, setFiltroPeriodo] = useState<'DIA' | 'MES' | 'ANO' | 'TODOS'>('MES');
  const [filtroFormularioId, setFiltroFormularioId] = useState<string>('TODOS');
  const [selectedRespostaModal, setSelectedRespostaModal] = useState<RespostaFormulario | null>(null);

  // Categorias, Setores e Status registrados em Cadastros Básicos
  const categoriasCadastradas = storageService.getCadastrosBasicos().filter(c => c.categoria === 'CATEGORIA_FORMULARIO_DINAMICO' && c.ativo);
  const setoresProtocolo = storageService.getCadastrosBasicos().filter(c => c.categoria === 'SETOR_PROTOCOLO' && c.ativo);
  const statusProtocoloList = storageService.getCadastrosBasicos().filter(c => c.categoria === 'STATUS_PROTOCOLO' && c.ativo);

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      const list = storageService.getFormularios();
      setFormularios(list);
      if (selectedForm) {
        const found = list.find(f => f.id === selectedForm.id);
        if (found) setSelectedForm(found);
      }
    });
    return () => unsub();
  }, [selectedForm]);

  const handleOpenCreateModal = () => {
    const defaultSetor = setoresProtocolo[0];
    const defaultStatus = statusProtocoloList[0];

    setEditingFormId(null);
    setFormTitulo('');
    setFormDescricao('');
    setFormCategoria(categoriasCadastradas[0]?.nome || 'Responsabilidade Técnica');
    setFormSetorTramitacaoId(defaultSetor?.id || '');
    setFormSetorTramitacaoNome(defaultSetor?.nome || 'SECRETARIA REGULATORIA');
    setFormStatusProtocoloInicial(defaultStatus?.nome || 'EM ANÁLISE PROTOCOLO');
    setFormPrazoDiasConclusao(15);
    setFormPermiteAnonimo(false);
    setPublicarProfissional(true);
    setPublicarEmpresa(false);
    setPublicarSite(false);
    setPermiteAnexos(false);
    setTamanhoMaximoMb(10);
    setInstrucoesAnexo('Anexe documentos em formato PDF, DOCX ou JPG (até 10MB).');
    setCampos([
      {
        id: 'c1',
        label: 'Nome Completo do Solicitante',
        tipo: 'text',
        obrigatorio: true,
        placeholder: 'Digite o nome completo',
        larguraCol: '12'
      },
      {
        id: 'c2',
        label: 'CPF do Solicitante',
        tipo: 'cpf',
        obrigatorio: true,
        placeholder: '000.000.000-00',
        larguraCol: '6'
      },
      {
        id: 'c3',
        label: 'E-mail para Notificação Eletrônica',
        tipo: 'email',
        obrigatorio: true,
        placeholder: 'exemplo@crfam.gov.br',
        larguraCol: '6'
      }
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (form: FormularioDinamico) => {
    setEditingFormId(form.id);
    setFormTitulo(form.titulo);
    setFormDescricao(form.descricao || '');
    setFormCategoria(form.categoria || categoriasCadastradas[0]?.nome || 'Responsabilidade Técnica');
    setFormSetorTramitacaoId(form.setorTramitacaoId || setoresProtocolo[0]?.id || '');
    setFormSetorTramitacaoNome(form.setorTramitacaoNome || form.categoria || setoresProtocolo[0]?.nome || 'SECRETARIA REGULATORIA');
    setFormStatusProtocoloInicial(form.statusProtocoloInicial || statusProtocoloList[0]?.nome || 'EM ANÁLISE PROTOCOLO');
    setFormPrazoDiasConclusao(form.prazoDiasConclusao || 15);
    setFormPermiteAnonimo(Boolean(form.permiteAnonimo));
    setPublicarProfissional(Boolean(form.publicarProfissional));
    setPublicarEmpresa(Boolean(form.publicarEmpresa));
    setPublicarSite(Boolean(form.publicarSite));
    setPermiteAnexos(Boolean(form.permiteAnexos));
    setTamanhoMaximoMb(form.tamanhoMaximoMb || 10);
    setInstrucoesAnexo(form.instrucoesAnexo || 'Anexe documentos em formato PDF, DOCX ou JPG (até 10MB).');
    setCampos(JSON.parse(JSON.stringify(form.campos || [])));
    setIsModalOpen(true);
  };

  const handleAddField = () => {
    const newField: FormFieldConfig = {
      id: `field-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      label: `Novo Campo ${campos.length + 1}`,
      tipo: 'text',
      obrigatorio: false,
      placeholder: '',
      larguraCol: '6'
    };
    setCampos([...campos, newField]);
  };

  const handleUpdateField = (id: string, updates: Partial<FormFieldConfig>) => {
    setCampos(campos.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleRemoveField = (id: string) => {
    setCampos(campos.filter(c => c.id !== id));
  };

  const handleMoveFieldUp = (index: number) => {
    if (index <= 0) return;
    const newCampos = [...campos];
    const temp = newCampos[index - 1];
    newCampos[index - 1] = newCampos[index];
    newCampos[index] = temp;
    setCampos(newCampos);
  };

  const handleMoveFieldDown = (index: number) => {
    if (index >= campos.length - 1) return;
    const newCampos = [...campos];
    const temp = newCampos[index + 1];
    newCampos[index + 1] = newCampos[index];
    newCampos[index] = temp;
    setCampos(newCampos);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim()) {
      toastService.warning('Título Obrigatório', 'Preencha o título do formulário.');
      return;
    }

    if (!publicarProfissional && !publicarEmpresa && !publicarSite) {
      toastService.warning('Canal Obrigatório', 'Selecione ao menos um canal para publicar este formulário.');
      return;
    }

    const currentVersao = selectedForm ? Number(selectedForm.versao || 1) : 1;
    const formSalvo: FormularioDinamico = {
      id: editingFormId || `form-${Date.now()}`,
      titulo: formTitulo.trim(),
      descricao: formDescricao.trim() || 'Formulário dinâmico parametrizado pelo setor regulatório',
      categoria: formCategoria,
      setorTramitacaoId: formSetorTramitacaoId,
      setorTramitacaoNome: formSetorTramitacaoNome,
      statusProtocoloInicial: formStatusProtocoloInicial,
      prazoDiasConclusao: formPrazoDiasConclusao,
      permiteAnonimo: formPermiteAnonimo,
      ativo: true,
      dataCriacao: editingFormId && selectedForm ? selectedForm.dataCriacao : new Date().toLocaleDateString('pt-BR'),
      versao: editingFormId ? currentVersao + 1 : 1,
      campos: [...campos],
      respostasRecebidas: editingFormId && selectedForm ? (selectedForm.respostasRecebidas || 0) : 0,
      publicarProfissional,
      publicarEmpresa,
      publicarSite,
      permiteAnexos,
      tiposAnexosPermitidos: ['.pdf', '.docx', '.jpg', '.jpeg', '.png'],
      tamanhoMaximoMb,
      instrucoesAnexo
    };

    storageService.saveFormulario(formSalvo);
    const updated = storageService.getFormularios();
    setFormularios(updated);
    setSelectedForm(formSalvo);
    setIsModalOpen(false);

    toastService.success(
      editingFormId ? 'Formulário Atualizado' : 'Formulário Publicado',
      `O formulário "${formSalvo.titulo}" foi salvo e sincronizado com os canais selecionados.`
    );
  };

  const [formToDelete, setFormToDelete] = useState<FormularioDinamico | null>(null);

  const handleConfirmDeleteForm = () => {
    if (!formToDelete) return;
    storageService.deleteFormulario(formToDelete.id);
    const updated = storageService.getFormularios();
    setFormularios(updated);
    if (selectedForm?.id === formToDelete.id) {
      setSelectedForm(updated[0] || null);
    }
    toastService.delete('Formulário Excluído', `O modelo "${formToDelete.titulo}" foi removido com sucesso.`);
    setFormToDelete(null);
  };

  const handleSimularUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const list = Array.from(files).map((f) => ({
      nome: f.name,
      tamanho: Number((f.size / (1024 * 1024)).toFixed(2)),
      tipo: f.name.split('.').pop()?.toUpperCase() || 'ARQ',
      url: '#'
    }));

    setPreviewAnexos([...previewAnexos, ...list]);
    toastService.info('Documento Anexado', `${list.length} arquivo(s) adicionado(s) para simulação de envio.`);
  };

  const handleSimularEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForm) return;

    const protocolo = storageService.generateNextProtocoloNumero();

    let autorNome = 'SOLICITANTE ANÔNIMO / CIDADÃO';
    let autorDoc = '000.000.000-00';
    let autorEmail = '';

    Object.entries(previewAnswers).forEach(([key, val]) => {
      const campo = selectedForm.campos.find(c => c.id === key);
      const label = (campo?.label || '').toLowerCase();
      if (typeof val === 'string' && val.trim()) {
        if (label.includes('nome')) autorNome = val.trim().toUpperCase();
        if (label.includes('cpf') || label.includes('cnpj') || label.includes('documento')) autorDoc = val.trim();
        if (label.includes('email') || label.includes('e-mail')) autorEmail = val.trim();
      }
    });

    const novaResposta: RespostaFormulario = {
      id: `resp-${Date.now()}`,
      formularioId: selectedForm.id,
      formularioTitulo: selectedForm.titulo,
      protocoloGerado: protocolo,
      autorNome,
      autorDocumento: autorDoc,
      autorEmail,
      canalOrigem: selectedForm.publicarSite ? 'SITE_PUBLICO' : (selectedForm.publicarEmpresa ? 'PORTAL_EMPRESA' : 'PORTAL_PROFISSIONAL'),
      dataEnvio: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'Pendente',
      dadosCampos: previewAnswers,
      anexos: previewAnexos
    };

    storageService.submitFormResponse(novaResposta);
    setPreviewAnswers({});
    setPreviewAnexos([]);

    toastService.success(
      'Solicitação Submetida',
      `Protocolo nº ${protocolo} gerado com sucesso para análise do conselho.`
    );
  };

  // Estatísticas calculadas
  const statsGerais = storageService.getEstatisticasFormularios();
  const allRespostas = storageService.getRespostasFormularios();

  // Filtro de Respostas por Período
  const hojeStr = new Date().toLocaleDateString('pt-BR');
  const mesAtualStr = '/' + String(new Date().getMonth() + 1).padStart(2, '0') + '/' + new Date().getFullYear();
  const anoAtualStr = '/' + new Date().getFullYear();

  const respostasFiltradas = allRespostas.filter(r => {
    if (filtroFormularioId !== 'TODOS' && r.formularioId !== filtroFormularioId) {
      return false;
    }
    if (filtroPeriodo === 'DIA') {
      return r.dataEnvio.startsWith(hojeStr);
    }
    if (filtroPeriodo === 'MES') {
      return r.dataEnvio.includes(mesAtualStr);
    }
    if (filtroPeriodo === 'ANO') {
      return r.dataEnvio.includes(anoAtualStr);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md">
            <FormInput className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>Formulários & Requerimentos Dinâmicos</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Crie modelos digitais com campos customizáveis (CPF, CNPJ, Endereço com CEP, Rádio, Checkbox), upload e publicação multicanal.
            </p>
          </div>
        </div>

        {/* Abas e Botão Criar */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveMainTab('GESTAO')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMainTab === 'GESTAO' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Modelos & Simulador</span>
            </button>
            <button
              onClick={() => setActiveMainTab('ESTATISTICAS')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMainTab === 'ESTATISTICAS' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Estatísticas & Envios ({allRespostas.length})</span>
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Formulário</span>
          </button>
        </div>
      </div>

      {/* ABA 1: GESTÃO E MODELOS */}
      {activeMainTab === 'GESTAO' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Col: List of Templates */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Modelos de Formulários ({formularios.length})
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                {formularios.filter(f => f.ativo).length} ativos
              </span>
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {formularios.map((form) => {
                const isSelected = selectedForm?.id === form.id;
                return (
                  <div
                    key={form.id}
                    onClick={() => setSelectedForm(form)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-400 shadow-xs ring-1 ring-blue-300'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {form.categoria}
                      </span>
                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEditModal(form)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition-colors"
                          title="Editar Formulário"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setFormToDelete(form)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors cursor-pointer"
                          title="Excluir Formulário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="font-bold text-slate-900 text-xs mt-1.5">{form.titulo}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{form.descricao}</div>

                    {/* Canais de Publicação */}
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {form.publicarProfissional && (
                        <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 font-bold text-[9px] flex items-center gap-0.5">
                          <User className="w-2.5 h-2.5" />
                          <span>Profissional</span>
                        </span>
                      )}
                      {form.publicarEmpresa && (
                        <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-[9px] flex items-center gap-0.5">
                          <Building2 className="w-2.5 h-2.5" />
                          <span>Empresa</span>
                        </span>
                      )}
                      {form.publicarSite && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[9px] flex items-center gap-0.5">
                          <Globe className="w-2.5 h-2.5" />
                          <span>Site Público</span>
                        </span>
                      )}
                      {form.permiteAnexos && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[9px] flex items-center gap-0.5">
                          <Paperclip className="w-2.5 h-2.5" />
                          <span>Anexos</span>
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 mt-2 font-mono flex items-center justify-between border-t border-slate-200/50 pt-1.5">
                      <span>{form.campos.length} campos</span>
                      <span className="font-semibold text-blue-700">{form.respostasRecebidas || 0} envios</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Col: Active Form Preview / Simulation */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            {selectedForm ? (
              <form onSubmit={handleSimularEnvio} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                        {selectedForm.categoria}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                        v{selectedForm.versao || 1}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mt-0.5">{selectedForm.titulo}</h2>
                    <p className="text-xs text-slate-500">{selectedForm.descricao}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(selectedForm)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar Modelo</span>
                    </button>
                  </div>
                </div>

                {/* Canais ativos deste formulário */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Canais de Publicação Habilitados:</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedForm.publicarProfissional ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-200 text-slate-400'}`}>
                      Portal PF
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedForm.publicarEmpresa ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-400'}`}>
                      Portal PJ
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedForm.publicarSite ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-400'}`}>
                      Site Público
                    </span>
                  </div>
                </div>

                {/* Renderização Dinâmica dos Campos Configurados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  {selectedForm.campos.map((campo) => (
                    <div 
                      key={campo.id} 
                      className={
                        campo.tipo === 'textarea' || campo.tipo === 'endereco_cep' || campo.larguraCol === '12' || campo.larguraCol === 12 
                          ? 'sm:col-span-2' 
                          : 'sm:col-span-1'
                      }
                    >
                      <DynamicFieldRenderer
                        campo={campo}
                        value={previewAnswers[campo.id]}
                        onChange={(val) => setPreviewAnswers(prev => ({ ...prev, [campo.id]: val }))}
                      />
                    </div>
                  ))}
                </div>

                {/* Seção de Anexo de Documentos se Habilitada */}
                {selectedForm.permiteAnexos && (
                  <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2.5">
                    <div className="flex items-center space-x-2">
                      <Paperclip className="w-4 h-4 text-amber-600" />
                      <span className="font-bold text-xs text-amber-900 uppercase">
                        Anexo de Documentos Comprobatórios (Opcional ou Obrigatório)
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      {selectedForm.instrucoesAnexo || 'Anexe documentos comprobatórios em formato PDF, DOCX ou JPG.'}
                    </p>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100/50 rounded-xl font-bold text-xs text-amber-900 cursor-pointer shadow-xs transition-all">
                        <Upload className="w-3.5 h-3.5 text-amber-700" />
                        <span>Selecionar Arquivo (Máx. {selectedForm.tamanhoMaximoMb || 10}MB)</span>
                        <input
                          type="file"
                          multiple
                          onChange={handleSimularUpload}
                          className="hidden"
                          accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                        />
                      </label>
                    </div>

                    {previewAnexos.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Arquivos Anexados:</span>
                        {previewAnexos.map((arq, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span className="font-medium text-slate-800">{arq.nome}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({arq.tamanho} MB)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPreviewAnexos(previewAnexos.filter((_, i) => i !== idx))}
                              className="text-rose-500 hover:text-rose-700 font-bold"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    className="flex items-center space-x-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Simular Submissão & Gerar Protocolo</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Selecione um formulário na lista à esquerda para visualizar.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 2: ESTATÍSTICAS E RELATÓRIO DE ENVIOS */}
      {activeMainTab === 'ESTATISTICAS' && (
        <div className="space-y-5">
          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total de Envios</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{statsGerais.totalGeral}</div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Submissões registradas</span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-cyan-600 block tracking-wider">Portal Profissional</span>
              <div className="text-2xl font-black text-cyan-700 mt-1">{statsGerais.porCanal.profissional}</div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Requerimentos por PF</span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-teal-600 block tracking-wider">Portal Empresa</span>
              <div className="text-2xl font-black text-teal-700 mt-1">{statsGerais.porCanal.empresa}</div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Requerimentos por PJ</span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-purple-600 block tracking-wider">Site Oficial Público</span>
              <div className="text-2xl font-black text-purple-700 mt-1">{statsGerais.porCanal.site}</div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Acessos da comunidade</span>
            </div>
          </div>

          {/* Filtros de Período e Formulário */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="font-bold text-slate-800">Filtrar Envios:</span>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setFiltroPeriodo('DIA')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    filtroPeriodo === 'DIA' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Hoje (Dia)
                </button>
                <button
                  onClick={() => setFiltroPeriodo('MES')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    filtroPeriodo === 'MES' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Este Mês
                </button>
                <button
                  onClick={() => setFiltroPeriodo('ANO')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    filtroPeriodo === 'ANO' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Este Ano
                </button>
                <button
                  onClick={() => setFiltroPeriodo('TODOS')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    filtroPeriodo === 'TODOS' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Geral (Todos)
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-500">Modelo:</span>
              <select
                value={filtroFormularioId}
                onChange={(e) => setFiltroFormularioId(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
              >
                <option value="TODOS">Todos os Modelos</option>
                {formularios.map(f => (
                  <option key={f.id} value={f.id}>{f.titulo}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabela de Envios / Respostas Recebidas */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Respostas & Protocolos Registrados ({respostasFiltradas.length})
              </h2>
            </div>

            {respostasFiltradas.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhuma resposta encontrada para o período selecionado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Protocolo</th>
                      <th className="p-3.5">Formulário / Assunto</th>
                      <th className="p-3.5">Interessado / Autor</th>
                      <th className="p-3.5">Canal de Origem</th>
                      <th className="p-3.5">Data / Hora</th>
                      <th className="p-3.5">Anexos</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {respostasFiltradas.map((resp) => (
                      <tr key={resp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold font-mono text-blue-700">{resp.protocoloGerado}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{resp.formularioTitulo}</td>
                        <td className="p-3.5">
                          <div className="font-medium text-slate-900">{resp.autorNome}</div>
                          {resp.autorEmail && (
                            <div className="text-[10px] text-slate-400">{resp.autorEmail}</div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            resp.canalOrigem === 'SITE_PUBLICO' 
                              ? 'bg-purple-100 text-purple-800' 
                              : (resp.canalOrigem === 'PORTAL_EMPRESA' ? 'bg-teal-100 text-teal-800' : 'bg-cyan-100 text-cyan-800')
                          }`}>
                            {resp.canalOrigem === 'SITE_PUBLICO' ? 'Site Público' : (resp.canalOrigem === 'PORTAL_EMPRESA' ? 'Portal Empresa' : 'Portal Profissional')}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 font-mono text-[11px]">{resp.dataEnvio}</td>
                        <td className="p-3.5">
                          {resp.anexos && resp.anexos.length > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1 w-max">
                              <Paperclip className="w-2.5 h-2.5" />
                              <span>{resp.anexos.length} arq</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Sem anexos</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-100 text-blue-800">
                            {resp.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedRespostaModal(resp)}
                            className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer"
                            title="Ver detalhes da resposta"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CRIAR / EDITAR FORMULÁRIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Settings2 className="w-4 h-4 text-blue-600" />
                <span>{editingFormId ? 'Editar Modelo de Formulário' : 'Novo Modelo de Formulário Digital'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Título do Formulário / Requerimento *</label>
                <input
                  type="text"
                  required
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ex: Assunção de Responsabilidade Técnica (RT)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Instruções / Descrição</label>
                <textarea
                  rows={2}
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Orientações aos requerentes sobre prazos e documentos..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Categoria Regulamentar (Vinculada aos Cadastros Básicos)
                </label>
                <select
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                >
                  {categoriasCadastradas.length > 0 ? (
                    categoriasCadastradas.map(c => (
                      <option key={c.id} value={c.nome}>{c.nome}</option>
                    ))
                  ) : (
                    <>
                      <option value="Responsabilidade Técnica">Responsabilidade Técnica</option>
                      <option value="Inscrição PF">Inscrição de Pessoa Física</option>
                      <option value="Inscrição PJ">Inscrição de Pessoa Jurídica</option>
                      <option value="Fiscalização & Defesas">Fiscalização & Defesas</option>
                      <option value="Ética & Disciplina">Ética & Disciplina</option>
                      <option value="Ouvidoria & Denúncias">Ouvidoria & Denúncias</option>
                    </>
                  )}
                </select>
              </div>

              {/* Onde publicar o formulário */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                <span className="font-bold text-blue-900 uppercase text-[11px] block">
                  Onde este formulário será publicado? *
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-blue-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={publicarProfissional}
                      onChange={(e) => setPublicarProfissional(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <div className="text-slate-800 font-bold text-[11px]">Portal Profissional (PF)</div>
                  </label>

                  <label className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-blue-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={publicarEmpresa}
                      onChange={(e) => setPublicarEmpresa(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <div className="text-slate-800 font-bold text-[11px]">Portal Empresas (PJ)</div>
                  </label>

                  <label className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-blue-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={publicarSite}
                      onChange={(e) => setPublicarSite(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <div className="text-slate-800 font-bold text-[11px]">Site Oficial (Público)</div>
                  </label>
                </div>
              </div>

              {/* Habilitar Anexo de Documentos */}
              <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permiteAnexos}
                      onChange={(e) => setPermiteAnexos(e.target.checked)}
                      className="rounded text-amber-600 w-4 h-4"
                    />
                    <span className="font-bold text-amber-900 text-xs">
                      Permitir que o usuário anexe documentos comprobatórios (PDF, DOCX, JPG, PNG)
                    </span>
                  </label>
                </div>

                {permiteAnexos && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-amber-200/60">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-amber-800 mb-1">Tamanho Máximo (MB)</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={tamanhoMaximoMb}
                        onChange={(e) => setTamanhoMaximoMb(Number(e.target.value) || 10)}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-900 font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] uppercase font-bold text-amber-800 mb-1">Instruções para o Anexo</label>
                      <input
                        type="text"
                        value={instrucoesAnexo}
                        onChange={(e) => setInstrucoesAnexo(e.target.value)}
                        placeholder="Ex: Anexe a CTPS e diploma digitalizados"
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Tramitação Automática & Direcionamento de Protocolo (Admin Only) */}
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                  <span className="font-bold text-xs text-purple-950 uppercase flex items-center space-x-1.5">
                    <Network className="w-4 h-4 text-purple-600" />
                    <span>Tramitação Automática & Direcionamento do Protocolo (Admin Only)</span>
                  </span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold uppercase">
                    Invisível ao Solicitante
                  </span>
                </div>
                <p className="text-[11px] text-purple-800">
                  Estes parâmetros configuram o direcionamento automático do protocolo gerado ao submeter o formulário:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                      Setor de Tramitação (Cadastros Básicos) *
                    </label>
                    <select
                      value={formSetorTramitacaoId}
                      onChange={(e) => {
                        const sid = e.target.value;
                        const sObj = setoresProtocolo.find(s => s.id === sid);
                        setFormSetorTramitacaoId(sid);
                        setFormSetorTramitacaoNome(sObj ? sObj.nome : '');
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold uppercase focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 cursor-pointer"
                    >
                      {setoresProtocolo.length > 0 ? (
                        setoresProtocolo.map(s => (
                          <option key={s.id} value={s.id}>{s.nome}</option>
                        ))
                      ) : (
                        <option value="">SECRETARIA REGULATORIA</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                      Status do Protocolo Inicial *
                    </label>
                    <select
                      value={formStatusProtocoloInicial}
                      onChange={(e) => setFormStatusProtocoloInicial(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold uppercase focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 cursor-pointer"
                    >
                      {statusProtocoloList.length > 0 ? (
                        statusProtocoloList.map(st => (
                          <option key={st.id} value={st.nome}>{st.nome}</option>
                        ))
                      ) : (
                        <option value="EM ANÁLISE PROTOCOLO">EM ANÁLISE PROTOCOLO</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                      Prazo Limite para Conclusão (Dias) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={formPrazoDiasConclusao}
                      onChange={(e) => setFormPrazoDiasConclusao(Math.max(1, parseInt(e.target.value, 10) || 15))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-950 font-bold font-mono text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-purple-200/60">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermiteAnonimo}
                      onChange={(e) => setFormPermiteAnonimo(e.target.checked)}
                      className="rounded text-purple-600 w-4 h-4"
                    />
                    <span className="font-bold text-purple-900 text-xs uppercase">
                      Permitir Envio Anônimo (Ideal para denúncias, ouvidoria e reclamações)
                    </span>
                  </label>
                </div>
              </div>

              {/* Construtor de Campos Dinâmicos */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 uppercase text-[11px]">
                    Campos do Formulário Escolhidos pelo Administrador ({campos.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Campo</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {campos.map((campo, index) => (
                    <div key={campo.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <div className="sm:col-span-2 flex items-center space-x-1.5">
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded shrink-0">
                            #{index + 1}
                          </span>
                          <input
                            type="text"
                            value={campo.label}
                            onChange={(e) => handleUpdateField(campo.id, { label: e.target.value })}
                            placeholder="Rótulo / Nome do Campo"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-xs"
                          />
                        </div>
                        <div>
                          <select
                            value={campo.tipo}
                            onChange={(e) => {
                              const newType = e.target.value as any;
                              const defaultOpts = (newType === 'radio' || newType === 'select') && (!campo.opcoes || campo.opcoes.length === 0)
                                ? ['Opção 1', 'Opção 2']
                                : campo.opcoes;
                              handleUpdateField(campo.id, { tipo: newType, opcoes: defaultOpts });
                            }}
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold text-xs"
                          >
                            <option value="text">Texto Simples</option>
                            <option value="number">Número</option>
                            <option value="email">E-mail</option>
                            <option value="date">Data</option>
                            <option value="textarea">Área de Texto (Longa)</option>
                            <option value="select">Dropdown (Seleção Única)</option>
                            <option value="radio">Botões de Rádio (Seleção Única)</option>
                            <option value="checkbox">Caixa de Seleção / Aceite</option>
                            <option value="cpf">CPF (com máscara e validação)</option>
                            <option value="cnpj">CNPJ (com máscara e validação)</option>
                            <option value="endereco_cep">Endereço Completo via CEP</option>
                            <option value="empresa_vinculada">Empresa(s) Vinculada(s) ao Peticionamento (Vínculos PF)</option>
                            <option value="profissional_vinculado">Profissional(is) Vinculado(s) ao Peticionamento (Vínculos PJ)</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center space-x-1 text-slate-600 text-[11px] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={campo.obrigatorio}
                              onChange={(e) => handleUpdateField(campo.id, { obrigatorio: e.target.checked })}
                              className="rounded text-blue-600"
                            />
                            <span>Obrigatório</span>
                          </label>

                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveFieldUp(index)}
                              className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 cursor-pointer"
                              title="Mover campo para cima"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === campos.length - 1}
                              onClick={() => handleMoveFieldDown(index)}
                              className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 cursor-pointer"
                              title="Mover campo para baixo"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveField(campo.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Excluir este campo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Opções Interativas para Select ou Radio */}
                      {(campo.tipo === 'select' || campo.tipo === 'radio') && (
                        <div className="pt-2 border-t border-slate-200/80 space-y-2 bg-white p-2.5 rounded-lg">
                          <div className="flex items-center justify-between">
                            <label className="block text-[10px] font-bold text-slate-700 uppercase">
                              Opções de Seleção ({campo.tipo === 'radio' ? 'Botões de Rádio' : 'Menu Dropdown'}):
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const current = campo.opcoes || [];
                                const newOpts = [...current, `Opção ${current.length + 1}`];
                                handleUpdateField(campo.id, { opcoes: newOpts });
                              }}
                              className="inline-flex items-center space-x-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Adicionar Opção</span>
                            </button>
                          </div>

                          {/* Lista de Opções Editáveis */}
                          <div className="space-y-1.5">
                            {(campo.opcoes || ['Opção 1', 'Opção 2']).map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center space-x-2">
                                <span className="text-[10px] font-mono font-bold text-slate-400 w-5">
                                  #{optIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const newOpts = [...(campo.opcoes || [])];
                                    newOpts[optIdx] = e.target.value;
                                    handleUpdateField(campo.id, { opcoes: newOpts });
                                  }}
                                  placeholder={`Digite o texto da opção ${optIdx + 1}`}
                                  className="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-md text-slate-900 text-xs font-medium focus:bg-white focus:border-blue-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = campo.opcoes || [];
                                    const newOpts = current.filter((_, i) => i !== optIdx);
                                    handleUpdateField(campo.id, { opcoes: newOpts });
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                  title="Remover esta opção"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Salvar & Publicar Formulário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALHES DE RESPOSTA */}
      {selectedRespostaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 font-mono">
                  {selectedRespostaModal.protocoloGerado}
                </span>
                <h2 className="text-base font-bold text-slate-900">{selectedRespostaModal.formularioTitulo}</h2>
              </div>
              <button
                onClick={() => setSelectedRespostaModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div><strong>Interessado:</strong> {selectedRespostaModal.autorNome}</div>
                <div><strong>Documento:</strong> {selectedRespostaModal.autorDocumento || 'Não informado'}</div>
                <div><strong>E-mail:</strong> {selectedRespostaModal.autorEmail || 'Não informado'}</div>
                <div><strong>Canal de Envio:</strong> {selectedRespostaModal.canalOrigem}</div>
                <div><strong>Data do Envio:</strong> {selectedRespostaModal.dataEnvio}</div>
                <div><strong>Status Atual:</strong> {selectedRespostaModal.status}</div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-2">Dados Preenchidos pelo Solicitante:</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  {Object.entries(selectedRespostaModal.dadosCampos || {}).map(([key, val]) => (
                    <div key={key} className="border-b border-slate-200/50 pb-1.5 last:border-0 last:pb-0">
                      <span className="text-slate-500 font-mono text-[10px] block">{key}</span>
                      <span className="text-slate-900 font-semibold">
                        {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRespostaModal.anexos && selectedRespostaModal.anexos.length > 0 && (
                <div>
                  <span className="font-bold text-slate-900 block mb-2">Arquivos Anexados ({selectedRespostaModal.anexos.length}):</span>
                  <div className="space-y-1.5">
                    {selectedRespostaModal.anexos.map((arq, idx) => (
                      <div key={idx} className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-amber-700" />
                          <span className="font-bold text-slate-800">{arq.nome}</span>
                          <span className="text-[10px] text-slate-400">({arq.tamanho || (arq as any).tamanhoMb || 1} MB)</span>
                        </div>
                        <span className="text-[10px] text-amber-800 font-bold bg-white px-2 py-0.5 rounded border border-amber-200">
                          Autenticado
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedRespostaModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Modelo de Formulário */}
      {formToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Excluir Modelo de Formulário</h3>
            <p className="text-xs text-slate-600 mt-2">
              Tem certeza que deseja excluir permanentemente o modelo <strong className="text-slate-900">{formToDelete.titulo}</strong>? Esta ação não poderá ser desfeita.
            </p>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setFormToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteForm}
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
