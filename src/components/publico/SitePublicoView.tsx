import React, { useState } from 'react';
import { 
  Globe, 
  FileText, 
  Upload, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Newspaper, 
  Calendar, 
  Search, 
  ChevronRight, 
  ShieldCheck, 
  Building2, 
  User, 
  HelpCircle, 
  Paperclip, 
  X,
  ExternalLink,
  Clock,
  Sparkles
} from 'lucide-react';
import { FormularioDinamico, FormFieldConfig, RespostaFormulario } from '../../types';
import { storageService, CouncilConfig } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { SIGCON_LOGO } from '../../constants/assets';
import { DynamicFieldRenderer } from '../formularios/DynamicFieldRenderer';

interface SitePublicoViewProps {
  councilConfig?: CouncilConfig;
  onNavigateToPortal?: (view: string) => void;
}

interface NoticiaPublica {
  id: string;
  titulo: string;
  resumo: string;
  categoria: 'Fiscalização' | 'Institucional' | 'Legislação' | 'Educação';
  data: string;
  autor: string;
  imagem: string;
  destaque?: boolean;
}

const NOTICIAS_PADRAO: NoticiaPublica[] = [
  {
    id: 'not-1',
    titulo: 'CRF intensifica operações de fiscalização noturna em drogarias da capital e interior',
    resumo: 'Equipes do DEFIS utilizam tablets com assinatura eletrônica e verificação em tempo real da presença de Farmacêutico Responsável Técnico.',
    categoria: 'Fiscalização',
    data: '05/11/2026',
    autor: 'Assessoria de Comunicação',
    imagem: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600',
    destaque: true
  },
  {
    id: 'not-2',
    titulo: 'Nova Resolução Regulamenta Procedimentos de Assistência Farmacêutica Plena',
    resumo: 'Diretrizes aprovadas em Plenário modernizam as normas de assistência e renovação eletrônica de Certidão de Regularidade Técnica (CRT).',
    categoria: 'Legislação',
    data: '01/11/2026',
    autor: 'Comissão Parlamentar e Jurídica',
    imagem: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'not-3',
    titulo: 'Abertura de Canal Público de Ouvidoria e Peticionamento Eletrônico para a Sociedade',
    resumo: 'Cidadãos e pacientes podem protocolar manifestações, pedidos da Lei de Acesso à Informação e consultas diretamente pela internet.',
    categoria: 'Institucional',
    data: '28/10/2026',
    autor: 'Ouvidoria Geral do Conselho',
    imagem: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=600'
  }
];

export const SitePublicoView: React.FC<SitePublicoViewProps> = ({ 
  councilConfig = storageService.getCouncilConfig(),
  onNavigateToPortal
}) => {
  const [activeTab, setActiveTab] = useState<'noticias' | 'formularios'>('formularios');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('TODOS');
  
  // Formulários com publicação no site público
  const allFormularios = storageService.getFormularios();
  const formulariosPublicos = allFormularios.filter(f => f.ativo && (f.publicarSite || f.publicoAlvo === 'Público Geral' || f.publicoAlvo === 'Cidadão' || f.publicoAlvo === 'Ambos'));

  // Estado do modal de preenchimento de formulário
  const [activeFormModal, setActiveFormModal] = useState<FormularioDinamico | null>(null);
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [solicitanteNome, setSolicitanteNome] = useState('');
  const [solicitanteDoc, setSolicitanteDoc] = useState('');
  const [solicitanteEmail, setSolicitanteEmail] = useState('');
  const [solicitanteTelefone, setSolicitanteTelefone] = useState('');
  const [anexosSelecionados, setAnexosSelecionados] = useState<{ nome: string; tamanho: number; tipo: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [protocoloSucesso, setProtocoloSucesso] = useState<string | null>(null);

  const handleOpenForm = (form: FormularioDinamico) => {
    setActiveFormModal(form);
    setFormResponses({});
    setSolicitanteNome('');
    setSolicitanteDoc('');
    setSolicitanteEmail('');
    setSolicitanteTelefone('');
    setAnexosSelecionados([]);
    setProtocoloSucesso(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Url = reader.result as string;
        const tamanhoKB = Math.round(file.size / 1024);
        setAnexosSelecionados(prev => [
          ...prev,
          {
            nome: file.name,
            tamanho: tamanhoKB,
            tipo: file.type || 'documento',
            url: base64Url
          } as any
        ]);
      };
      reader.readAsDataURL(file);
    });

    toastService.info('Anexo Adicionado', `${files.length} arquivo(s) selecionado(s) com sucesso.`);
    e.target.value = '';
  };

  const handleRemoveAnexo = (index: number) => {
    setAnexosSelecionados(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitPublicForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFormModal) return;

    // Tenta encontrar campos de identificação nos campos preenchidos
    let nomeFinal = 'CIDADÃO / SOLICITANTE';
    let docFinal = 'NÃO INFORMADO';
    let emailFinal = '';
    let telFinal = '';

    Object.entries(formResponses).forEach(([key, val]) => {
      const campo = activeFormModal.campos.find(c => c.id === key);
      const label = (campo?.label || '').toLowerCase();
      if (typeof val === 'string' && val.trim()) {
        if (label.includes('nome')) nomeFinal = val.trim().toUpperCase();
        if (label.includes('cpf') || label.includes('cnpj') || label.includes('documento')) docFinal = val.trim();
        if (label.includes('email') || label.includes('e-mail')) emailFinal = val.trim();
        if (label.includes('telefone') || label.includes('celular') || label.includes('whatsapp')) telFinal = val.trim();
      }
    });

    // Valida campos obrigatórios
    for (const campo of activeFormModal.campos) {
      const v = formResponses[campo.id];
      if (campo.obrigatorio && (v === undefined || v === null || v === '' || v === false)) {
        toastService.warning('Campo Obrigatório', `Por favor preencha o campo: "${campo.label}"`);
        return;
      }
    }

    setIsSubmitting(true);

    const protNum = storageService.generateNextProtocoloNumero();

    const novaResposta: RespostaFormulario = {
      id: `resp-pub-${Date.now()}`,
      formularioId: activeFormModal.id,
      formularioTitulo: activeFormModal.titulo,
      autorNome: nomeFinal,
      autorDocumento: docFinal,
      autorEmail: emailFinal,
      autorTelefone: telFinal,
      canalOrigem: 'SITE',
      protocoloGerado: protNum,
      dataEnvio: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      respostas: formResponses,
      dadosCampos: formResponses,
      anexos: anexosSelecionados,
      status: 'Em Análise'
    };

    storageService.submitFormResponse(novaResposta);

    setTimeout(() => {
      setIsSubmitting(false);
      setProtocoloSucesso(protNum);
      toastService.success(
        'Solicitação Enviada com Sucesso!',
        `Seu protocolo foi gerado: ${protNum}. Guarde este número para acompanhamento.`
      );
    }, 400);
  };

  const filteredFormularios = formulariosPublicos.filter(f => {
    const matchesSearch = f.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoriaFilter === 'TODOS' || f.categoria === categoriaFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Institucional do Site Oficial */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 text-white shadow-xl border border-blue-900/40">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-15"></div>
        <div className="relative p-6 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Portal Oficial de Notícias & Acesso Público</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {councilConfig.sigla} • {councilConfig.nomeCompleto}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Serviços de autoatendimento, transparência regulatória, formulários eletrônicos para o cidadão e comunicados em defesa da saúde pública e da profissão farmacêutica.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <span className="block text-[11px] text-blue-200 uppercase font-bold">Autoatendimento Liberado</span>
              <span className="text-xl font-extrabold text-white">{formulariosPublicos.length} Formulários</span>
              <span className="block text-[10px] text-emerald-300 font-medium mt-0.5">● Disponíveis para Envio</span>
            </div>
          </div>
        </div>

        {/* Abas Superiores do Site */}
        <div className="bg-slate-950/60 px-6 sm:px-10 border-t border-white/10 flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('formularios')}
            className={`px-5 py-3 font-bold text-xs uppercase transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
              activeTab === 'formularios'
                ? 'border-cyan-400 text-cyan-300 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Formulários & Serviços Online ({formulariosPublicos.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('noticias')}
            className={`px-5 py-3 font-bold text-xs uppercase transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
              activeTab === 'noticias'
                ? 'border-blue-400 text-blue-300 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Newspaper className="w-4 h-4 text-blue-400" />
            <span>Notícias & Editais Regulatórios</span>
          </button>
        </div>
      </div>

      {/* Conteúdo Aba: Formulários e Serviços Online */}
      {activeTab === 'formularios' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Barra de Filtros e Busca de Formulários */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <span className="font-bold text-slate-700 uppercase text-[11px]">Categoria:</span>
              {['TODOS', 'Ouvidoria', 'Fiscalização', 'Responsabilidade Técnica', 'Inscrição PF'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase transition-colors cursor-pointer ${
                    categoriaFilter === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar serviço ou formulário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Grid de Formulários Públicos */}
          {filteredFormularios.length === 0 ? (
            <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm uppercase">Nenhum formulário público localizado</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Não foram encontrados formulários com os termos pesquisados. Limpe os filtros ou tente outra busca.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFormularios.map((form) => (
                <div 
                  key={form.id}
                  className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                        {form.categoria}
                      </span>
                      {form.permiteAnexos && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200" title="Permite envio de arquivos anexos">
                          <Paperclip className="w-3 h-3" />
                          <span>Anexo Liberado</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm uppercase group-hover:text-blue-600 transition-colors line-clamp-2">
                        {form.titulo}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                        {form.descricao}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[10px] text-slate-400 font-mono">
                      <span>{form.campos.length} campos • Versão {form.versao}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenForm(form)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all uppercase cursor-pointer"
                    >
                      <span>Preencher</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo Aba: Notícias & Editais Regulatórios */}
      {activeTab === 'noticias' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {NOTICIAS_PADRAO.map((not) => (
              <div key={not.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <img src={not.imagem} alt={not.titulo} className="w-full h-44 object-cover" />
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold text-blue-600 uppercase">{not.categoria}</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>{not.data}</span>
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug uppercase">
                      {not.titulo}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {not.resumo}
                    </p>
                  </div>
                </div>
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                  Publicado por: {not.autor}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Preenchimento Público */}
      {activeFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-auto flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            {/* Header Modal */}
            <div className="px-6 py-4 bg-linear-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-5 h-5 text-blue-200" />
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wide">
                    {activeFormModal.titulo}
                  </h3>
                  <p className="text-[10px] text-blue-200 font-mono">
                    Canal: Acesso Público Oficial • Protocolo Digital Instantâneo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveFormModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Formulário */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {protocoloSucesso ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3.5">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-emerald-950 text-base uppercase">
                      Solicitação Protocolada com Sucesso!
                    </h4>
                    <p className="text-xs text-emerald-800 mt-1">
                      Seu requerimento foi inserido no sistema de protocolos do Conselho e encaminhado para triagem.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-emerald-300 rounded-xl inline-block font-mono font-extrabold text-sm text-emerald-900">
                    Número do Protocolo: {protocoloSucesso}
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveFormModal(null)}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase shadow-sm cursor-pointer"
                    >
                      Fechar Janela
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitPublicForm} className="space-y-4">
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 leading-relaxed">
                    <strong className="block font-bold mb-0.5 uppercase">Finalidade do Atendimento:</strong>
                    <span>{activeFormModal.descricao}</span>
                  </div>

                  {/* Campos Dinâmicos Escolhidos pelo Usuário/Administrador */}
                  <div className="space-y-4 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {activeFormModal.campos.map((campo) => (
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
                            value={formResponses[campo.id]}
                            onChange={(val) => setFormResponses(prev => ({ ...prev, [campo.id]: val }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Seção de Anexo de Documentos se habilitado */}
                  {activeFormModal.permiteAnexos && (
                    <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-purple-900 uppercase flex items-center gap-1.5">
                          <Paperclip className="w-4 h-4 text-purple-600" />
                          <span>Anexo de Documentos Comprobatórios (PDF, DOCX, Imagens)</span>
                        </span>
                        <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-mono font-bold">
                          Até {activeFormModal.tamanhoMaximoMb || 15} MB
                        </span>
                      </div>

                      {activeFormModal.instrucoesAnexo && (
                        <p className="text-[11px] text-purple-800">
                          {activeFormModal.instrucoesAnexo}
                        </p>
                      )}

                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs uppercase cursor-pointer transition-colors shadow-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Escolher Arquivos</span>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[11px] text-slate-500">
                          Formatos aceitos: PDF, Word (DOCX), Imagens (JPG, PNG)
                        </span>
                      </div>

                      {anexosSelecionados.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {anexosSelecionados.map((anexo, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-white border border-purple-200 rounded-xl text-xs">
                              <span className="font-semibold text-slate-800 truncate max-w-sm flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                <span>{anexo.nome} ({anexo.tamanho} KB)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveAnexo(idx)}
                                className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                                title="Remover anexo"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botões do Rodapé */}
                  <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setActiveFormModal(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs uppercase shadow-md transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Enviando...' : 'Enviar Solicitação & Gerar Protocolo'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
