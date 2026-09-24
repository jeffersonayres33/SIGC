import React, { useState } from 'react';
import { 
  FormInput, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Settings2, 
  Layers, 
  FileText, 
  X,
  Send,
  Eye
} from 'lucide-react';
import { FormularioDinamico, FormFieldConfig, RespostaFormulario } from '../../types';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';

export const FormulariosView: React.FC = () => {
  const [formularios, setFormularios] = useState<FormularioDinamico[]>(storageService.getFormularios());
  const [selectedForm, setSelectedForm] = useState<FormularioDinamico | null>(formularios[0] || null);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});

  // New form builder state
  const [newFormTitulo, setNewFormTitulo] = useState('');
  const [newFormDescricao, setNewFormDescricao] = useState('');
  const [newFormCategoria, setNewFormCategoria] = useState<'Fiscalização' | 'Inscrição PJ' | 'Inscrição PF' | 'Responsabilidade Técnica' | 'Ética' | 'Ouvidoria'>('Responsabilidade Técnica');
  const [newFormPublico, setNewFormPublico] = useState<'Profissionais' | 'Empresas' | 'Fiscais' | 'Público Geral'>('Profissionais');
  const [campos, setCampos] = useState<FormFieldConfig[]>([
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
      label: 'E-mail para Notificação Eletrônica',
      tipo: 'email',
      obrigatorio: true,
      placeholder: 'exemplo@dominio.com.br',
      larguraCol: '6'
    }
  ]);

  const handleAddField = () => {
    const newField: FormFieldConfig = {
      id: `field-${Date.now()}`,
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

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormTitulo) {
      toastService.warning('Título Obrigatório', 'Preencha o título do formulário.');
      return;
    }

    const novoFormulario: FormularioDinamico = {
      id: `form-${Date.now()}`,
      titulo: newFormTitulo,
      descricao: newFormDescricao || 'Formulário dinâmico parametrizado pelo setor regulatório',
      categoria: newFormCategoria,
      publicoAlvo: newFormPublico,
      ativo: true,
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
      versao: 1,
      campos: [...campos],
      respostasRecebidas: 0
    };

    storageService.saveFormulario(novoFormulario);
    const updated = storageService.getFormularios();
    setFormularios(updated);
    setSelectedForm(novoFormulario);
    setIsCreatingForm(false);
    toastService.success(
      'Formulário Criado',
      `O formulário "${novoFormulario.titulo}" foi publicado para os usuários.`
    );
  };

  const handleSimularEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForm) return;

    const protocolo = `PROT-2026/${Math.floor(1000 + Math.random() * 9000)}`;

    const novaResposta: RespostaFormulario = {
      id: `resp-${Date.now()}`,
      formularioId: selectedForm.id,
      formularioTitulo: selectedForm.titulo,
      protocoloGerado: protocolo,
      autorNome: previewAnswers['c1'] || 'Dr. Carlos Eduardo Lima (CRF-AM 4120)',
      autorDocumento: '012.345.678-90',
      dataEnvio: new Date().toLocaleString('pt-BR'),
      status: 'Pendente',
      dadosCampos: previewAnswers
    };

    storageService.submitFormResponse(novaResposta);
    setPreviewAnswers({});

    toastService.success(
      'Solicitação Submetida',
      `Protocolo nº ${protocolo} gerado com sucesso para análise do conselho.`
    );
  };

  const handleDeleteForm = (formId: string) => {
    storageService.deleteFormulario(formId);
    const updated = storageService.getFormularios();
    setFormularios(updated);
    setSelectedForm(updated[0] || null);
    toastService.delete('Formulário Excluído', 'O modelo de formulário dinâmico foi removido.');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
            <FormInput className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>Formulários & Requerimentos Dinâmicos</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Parametrize campos e fluxos digitais de entrada para o portal do profissional e empresas.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setNewFormTitulo('');
            setNewFormDescricao('');
            setIsCreatingForm(true);
          }}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Novo Formulário</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Col: List of Templates */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Modelos de Formulários Ativos ({formularios.length})
          </h2>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {formularios.map((form) => {
              const isSelected = selectedForm?.id === form.id;
              return (
                <div
                  key={form.id}
                  onClick={() => setSelectedForm(form)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-blue-300 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {form.categoria}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteForm(form.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Excluir Formulário"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="font-bold text-slate-900 text-xs mt-1.5">{form.titulo}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{form.descricao}</div>
                  <div className="text-[10px] text-slate-400 mt-2 font-mono flex items-center justify-between">
                    <span>{form.campos.length} campos</span>
                    <span>{form.respostasRecebidas || 0} submissões</span>
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
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  {selectedForm.categoria} • Público: {selectedForm.publicoAlvo}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">{selectedForm.titulo}</h2>
                <p className="text-xs text-slate-500">{selectedForm.descricao}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {selectedForm.campos.map((campo) => (
                  <div 
                    key={campo.id} 
                    className={campo.larguraCol === '12' ? 'sm:col-span-2 space-y-1' : 'space-y-1'}
                  >
                    <label className="block text-slate-700 font-bold">
                      {campo.label} {campo.obrigatorio && <span className="text-rose-500">*</span>}
                    </label>
                    {campo.tipo === 'select' ? (
                      <select
                        value={previewAnswers[campo.id] || ''}
                        onChange={(e) => setPreviewAnswers({ ...previewAnswers, [campo.id]: e.target.value })}
                        required={campo.obrigatorio}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                      >
                        <option value="">Selecione uma opção...</option>
                        {campo.opcoes?.map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : campo.tipo === 'textarea' ? (
                      <textarea
                        rows={3}
                        value={previewAnswers[campo.id] || ''}
                        onChange={(e) => setPreviewAnswers({ ...previewAnswers, [campo.id]: e.target.value })}
                        placeholder={campo.placeholder}
                        required={campo.obrigatorio}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                      />
                    ) : (
                      <input
                        type={campo.tipo}
                        value={previewAnswers[campo.id] || ''}
                        onChange={(e) => setPreviewAnswers({ ...previewAnswers, [campo.id]: e.target.value })}
                        placeholder={campo.placeholder}
                        required={campo.obrigatorio}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Solicitação / Gerar Protocolo</span>
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

      {/* Modal Criar Novo Formulário */}
      {isCreatingForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Settings2 className="w-4 h-4 text-blue-600" />
                <span>Construtor de Formulário Digital</span>
              </h2>
              <button
                onClick={() => setIsCreatingForm(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Título do Requerimento *</label>
                <input
                  type="text"
                  required
                  value={newFormTitulo}
                  onChange={(e) => setNewFormTitulo(e.target.value)}
                  placeholder="Ex: Assunção de Responsabilidade Técnica (RT)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Instruções / Descrição</label>
                <textarea
                  rows={2}
                  value={newFormDescricao}
                  onChange={(e) => setNewFormDescricao(e.target.value)}
                  placeholder="Orientações aos requerentes sobre prazos e documentos..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Categoria Regulamentar</label>
                  <select
                    value={newFormCategoria}
                    onChange={(e) => setNewFormCategoria(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  >
                    <option value="Responsabilidade Técnica">Responsabilidade Técnica</option>
                    <option value="Inscrição PF">Inscrição de Pessoa Física</option>
                    <option value="Inscrição PJ">Inscrição de Pessoa Jurídica</option>
                    <option value="Fiscalização">Fiscalização & Defesas</option>
                    <option value="Ética">Processo Ético-Disciplinar</option>
                    <option value="Ouvidoria">Ouvidoria & Denúncias</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Público-Alvo</label>
                  <select
                    value={newFormPublico}
                    onChange={(e) => setNewFormPublico(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  >
                    <option value="Profissionais">Profissionais Inscritos</option>
                    <option value="Empresas">Empresas e Drogarias</option>
                    <option value="Fiscais">Fiscais do Conselho</option>
                    <option value="Público Geral">Público Geral / Cidadão</option>
                  </select>
                </div>
              </div>

              {/* Construtor de Campos */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 uppercase text-[11px]">Campos do Formulário ({campos.length})</span>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Campo</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {campos.map((campo, index) => (
                    <div key={campo.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={campo.label}
                          onChange={(e) => handleUpdateField(campo.id, { label: e.target.value })}
                          placeholder="Rótulo do Campo"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium text-xs"
                        />
                      </div>
                      <div>
                        <select
                          value={campo.tipo}
                          onChange={(e) => handleUpdateField(campo.id, { tipo: e.target.value as any })}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                        >
                          <option value="text">Texto Simples</option>
                          <option value="number">Número</option>
                          <option value="email">E-mail</option>
                          <option value="date">Data</option>
                          <option value="textarea">Área de Texto</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-1 text-slate-600 text-[11px]">
                          <input
                            type="checkbox"
                            checked={campo.obrigatorio}
                            onChange={(e) => handleUpdateField(campo.id, { obrigatorio: e.target.checked })}
                            className="rounded text-blue-600"
                          />
                          <span>Obrigatório</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(campo.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatingForm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Salvar & Publicar Formulário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
