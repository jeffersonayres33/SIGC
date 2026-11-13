import React, { useState } from 'react';
import { 
  UserCheck, 
  FileCheck2, 
  Coins, 
  FileText, 
  Plus, 
  Building2, 
  QrCode, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Send, 
  Printer,
  Sparkles,
  CreditCard,
  Lock,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Receipt,
  Building,
  ShieldAlert,
  Loader2,
  Check,
  Clock,
  History,
  Calendar,
  Paperclip,
  Upload,
  Info
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { LancamentoFinanceiro, Empresa, Profissional, HistoricoVinculoProfissional, FormularioDinamico, RespostaFormulario } from '../../types';
import { toastService } from '../../services/toastService';
import { maskCEP, fetchAddressByCEP, maskPhone } from '../../utils/documentUtils';
import { isRecursoPFLiberado, isRecursoPJLiberado } from '../../utils/permissionUtils';

interface PortalViewProps {
  viewMode?: 'PROFISSIONAL' | 'EMPRESA' | 'ANUIDADE_PF' | 'PROTOCOLO_PF' | 'REQUERIMENTO_PF' | 'FORMULARIOS_PF' | 'ANUIDADE_PJ' | 'PROTOCOLO_PJ' | 'REQUERIMENTO_PJ' | 'FORMULARIOS_PJ';
  onOpenBoletoPix?: (lanc: LancamentoFinanceiro) => void;
  onOpenCrtModal?: (empresa: Empresa) => void;
}

export const PortalView: React.FC<PortalViewProps> = ({ viewMode = 'PROFISSIONAL', onOpenBoletoPix, onOpenCrtModal }) => {
  // Professional state initialized with real database data
  const authUser = storageService.getCurrentAuthUser();
  const allProfs = storageService.getProfissionais();
  const initialProf = allProfs.find(p => p.cpf === authUser?.documento || p.inscricao === authUser?.numeroInscricao || p.emailPessoal === authUser?.email) || allProfs[0];
  const [profData, setProfData] = useState<Profissional>(initialProf ? JSON.parse(JSON.stringify(initialProf)) : allProfs[0]);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [abaVinculos, setAbaVinculos] = useState<'ATIVOS' | 'HISTORICO'>('ATIVOS');

  // Modal para preenchimento de formulário dinâmico no portal
  const [formDinamicoAtivo, setFormDinamicoAtivo] = useState<FormularioDinamico | null>(null);
  const [respostasForm, setRespostasForm] = useState<Record<string, any>>({});
  const [anexosForm, setAnexosForm] = useState<{ nome: string; tamanhoMb: number; tipo: string; url: string }[]>([]);
  const [buscaForm, setBuscaForm] = useState('');
  const [isAnonimoSubmit, setIsAnonimoSubmit] = useState(false);

  // Permission flags based on Council Configuration
  const regraPF = storageService.getAcessosInscritoPF();
  const regraPJ = storageService.getAcessosInscritoPJ();
  const podeEditarPF = regraPF.recursosPortal?.dadosCadastrais?.permiteEditar ?? true;
  const podeEmitirQuitacao = isRecursoPFLiberado('certidaoQuitacao');
  const vinculosLiberados = isRecursoPFLiberado('vinculosProfissionais');
  const podeEmitirBoletoPixPF = regraPF.recursosPortal?.anuidadeFinanceiro?.permiteEmitir ?? true;
  const podeEmitirBoletoPixPJ = regraPJ.recursosPortal?.anuidadeFinanceiro?.permiteEmitir ?? true;
  const podeEnviarReqPF = regraPF.recursosPortal?.requerimentoEletronico?.permiteEditar ?? true;
  const podeEnviarReqPJ = regraPJ.recursosPortal?.requerimentoEletronico?.permiteEditar ?? true;
  const podeEmitirCrtPJ = isRecursoPJLiberado('certidaoCrtDigital');

  // Enterprise state
  const allEmpresas = storageService.getEmpresas();
  const empresaLogada = allEmpresas[0];

  // Petition subjects from Cadastros Básicos
  const assuntosPF = storageService.getCadastrosBasicos('ASSUNTO_REQUERIMENTO_PF').filter(i => i.ativo);
  const assuntosPJ = storageService.getCadastrosBasicos('ASSUNTO_REQUERIMENTO_PJ').filter(i => i.ativo);

  const [protocoloAssuntoPF, setProtocoloAssuntoPF] = useState(assuntosPF[0]?.nome || 'Assunção de Responsabilidade Técnica (RT)');
  const [protocoloDetalhesPF, setProtocoloDetalhesPF] = useState('');
  const [empresasSelecionadasPF, setEmpresasSelecionadasPF] = useState<string[]>([]);

  const [protocoloAssuntoPJ, setProtocoloAssuntoPJ] = useState(assuntosPJ[0]?.nome || 'Renovação de CRT');
  const [protocoloDetalhesPJ, setProtocoloDetalhesPJ] = useState('');

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const masked = maskCEP(raw);
    setProfData(prev => ({ ...prev, cep: masked }));
    if (raw.replace(/\D/g, '').length === 8) {
      setIsSearchingCep(true);
      const res = await fetchAddressByCEP(masked);
      setIsSearchingCep(false);
      if (res && !res.erro) {
        setProfData(prev => ({
          ...prev,
          endereco: res.logradouro || prev.endereco,
          bairro: res.bairro || prev.bairro,
          cidade: res.localidade ? res.localidade.toUpperCase() : prev.cidade,
          uf: res.uf || prev.uf
        }));
        toastService.success('Endereço Localizado', `CEP ${masked} preenchido automaticamente.`);
      }
    }
  };

  const handleSaveProfissional = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveProfissional(profData);
    toastService.success(
      'Cadastro Atualizado',
      'Suas informações de contato e endereço foram salvas com sucesso no banco de dados do CRF.'
    );
  };

  const handleCreateProtocoloPF = (e: React.FormEvent) => {
    e.preventDefault();

    const assuntoAtual = assuntosPF.find(a => a.nome === protocoloAssuntoPF);
    const exigeEmpresa = Boolean(assuntoAtual?.selecionarEmpresaVinculada);

    if (exigeEmpresa && meusVinculos.length > 0 && empresasSelecionadasPF.length === 0) {
      toastService.warning(
        'Empresa Vinculada Obrigatória',
        'Por favor, selecione ao menos uma empresa vinculada ao seu registro para protocolar este requerimento.'
      );
      return;
    }

    const empresasVinculadasInfo = meusVinculos
      .filter(emp => empresasSelecionadasPF.includes(emp.id))
      .map(emp => `${emp.razaoSocial} (CNPJ: ${emp.cnpj} | Insc: ${emp.inscricao})`);

    const vinculoDetalhesFinal = empresasVinculadasInfo.length > 0
      ? `EMPRESA(S) VINCULADA(S): ${empresasVinculadasInfo.join('; ')} | DETALHES: ${protocoloDetalhesPF}`
      : protocoloDetalhesPF;

    const protNum = `PROT-PF-2026/${Math.floor(1000 + Math.random() * 9000)}`;
    const novoProt = {
      id: `prot-${Date.now()}`,
      numeroProtocolo: protNum,
      tipo: protocoloAssuntoPF,
      assunto: protocoloAssuntoPF,
      interessado: profData.nome,
      documentoInteressado: profData.cpf,
      tipoInteressado: 'PROFISSIONAL' as const,
      vinculoId: profData.id,
      vinculoInscricao: profData.inscricao,
      vinculoDetalhes: vinculoDetalhesFinal,
      contatoEmail: profData.emailPessoal,
      contatoTelefone: profData.celular,
      dataInscricao: new Date().toLocaleDateString('pt-BR'),
      dataAbertura: new Date().toLocaleDateString('pt-BR'),
      dataUltimaAtualizacao: new Date().toLocaleDateString('pt-BR'),
      prazoResposta: '5 dias úteis',
      status: 'Em Análise',
      setorAtual: 'Atendimento PF',
      anexos: [],
      historico: [
        {
          data: new Date().toLocaleDateString('pt-BR'),
          setor: 'Portal do Inscrito',
          descricao: `Requerimento protocolado via Profissional: ${protocoloAssuntoPF}.${empresasVinculadasInfo.length > 0 ? ` Empresas: ${empresasVinculadasInfo.join(', ')}.` : ''} Detalhes: ${protocoloDetalhesPF}`,
          responsavel: profData.nome
        }
      ]
    };
    storageService.saveProtocolo(novoProt);
    toastService.success(
      'Requerimento Digital Protocolado',
      `Assunto: "${protocoloAssuntoPF}". Protocolo gerado: ${protNum}.`
    );
    setProtocoloDetalhesPF('');
    setEmpresasSelecionadasPF([]);
  };

  const handleCreateProtocoloPJ = (e: React.FormEvent) => {
    e.preventDefault();
    const protNum = `PROT-PJ-2026/${Math.floor(1000 + Math.random() * 9000)}`;
    const novoProt = {
      id: `prot-${Date.now()}`,
      numeroProtocolo: protNum,
      tipo: protocoloAssuntoPJ,
      assunto: protocoloAssuntoPJ,
      interessado: empresaLogada?.razaoSocial || 'Empresa',
      documentoInteressado: empresaLogada?.cnpj || '',
      tipoInteressado: 'EMPRESA' as const,
      vinculoId: empresaLogada?.id,
      vinculoInscricao: empresaLogada?.inscricao,
      vinculoDetalhes: protocoloDetalhesPJ,
      contatoEmail: empresaLogada?.email,
      contatoTelefone: empresaLogada?.telefone,
      dataInscricao: new Date().toLocaleDateString('pt-BR'),
      dataAbertura: new Date().toLocaleDateString('pt-BR'),
      dataUltimaAtualizacao: new Date().toLocaleDateString('pt-BR'),
      prazoResposta: '5 dias úteis',
      status: 'Em Análise',
      setorAtual: 'Atendimento PJ',
      anexos: [],
      historico: [
        {
          data: new Date().toLocaleDateString('pt-BR'),
          setor: 'Portal da Empresa',
          descricao: `Requerimento protocolado via Empresa: ${protocoloAssuntoPJ}. Detalhes: ${protocoloDetalhesPJ}`,
          responsavel: empresaLogada?.razaoSocial || 'Empresa'
        }
      ]
    };
    storageService.saveProtocolo(novoProt);
    toastService.success(
      'Requerimento da Empresa Protocolado',
      `Assunto: "${protocoloAssuntoPJ}". Protocolo gerado: ${protNum}.`
    );
    setProtocoloDetalhesPJ('');
  };

  const handleEmitirQuitacao = () => {
    toastService.success(
      'Certidão de Quitação Gerada',
      `Certidão Negativa de Débitos de ${profData.nome} emitida com sucesso com código de autenticidade digital.`
    );
  };

  // Posição financeira
  const posicaoFinProf = storageService.getPosicaoFinanceira(profData.cpf || profData.inscricao, 'PROFISSIONAL');
  const posicaoFinEmp = storageService.getPosicaoFinanceira(empresaLogada?.cnpj || empresaLogada?.inscricao || '', 'EMPRESA');

  // Vínculos do profissional
  const meusVinculos = allEmpresas.filter(emp => 
    emp.responsaveisTecnicos?.some(rt => 
      rt.profissionalId === profData.id || 
      rt.profissionalInscricao === profData.inscricao ||
      rt.profissionalNome?.toLowerCase() === profData.nome?.toLowerCase()
    )
  );

  const meusProtocolos = storageService.getProtocolos().filter(p => 
    p.documentoInteressado === profData.cpf || 
    p.documentoInteressado === empresaLogada?.cnpj ||
    p.vinculoInscricao === profData.inscricao ||
    p.vinculoInscricao === empresaLogada?.inscricao
  );

  return (
    <div className="space-y-6">
      {/* Header do Portal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white flex items-center justify-center shadow-md">
            {(viewMode === 'PROFISSIONAL' || viewMode === 'ANUIDADE_PF' || viewMode === 'PROTOCOLO_PF' || viewMode === 'REQUERIMENTO_PF') && <UserCheck className="w-5 h-5" />}
            {(viewMode === 'EMPRESA' || viewMode === 'ANUIDADE_PJ' || viewMode === 'PROTOCOLO_PJ' || viewMode === 'REQUERIMENTO_PJ') && <Building2 className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>
                {viewMode === 'PROFISSIONAL' && 'Profissional • Dados Cadastrais & Vínculos'}
                {viewMode === 'ANUIDADE_PF' && 'Profissional • Anuidade & Posição Financeira'}
                {viewMode === 'PROTOCOLO_PF' && 'Profissional • Protocolos'}
                {viewMode === 'REQUERIMENTO_PF' && 'Profissional • Requerimento Eletrônico'}
                {viewMode === 'EMPRESA' && 'Empresa • Dados do Estabelecimento & CRT'}
                {viewMode === 'ANUIDADE_PJ' && 'Empresa • Anuidade & Posição Financeira'}
                {viewMode === 'PROTOCOLO_PJ' && 'Empresa • Protocolos'}
                {viewMode === 'REQUERIMENTO_PJ' && 'Empresa • Requerimento Eletrônico'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Ambiente restrito integrado ao banco de dados do Conselho Regional de Farmácia.
            </p>
          </div>
        </div>
      </div>

      {viewMode === 'PROFISSIONAL' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Perfil do Profissional com Dados Reais do BD */}
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-xs font-mono">
                    PF
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm uppercase">{profData.nome}</h2>
                    <span className="text-xs text-slate-500 font-mono">{profData.inscricao}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-lg border border-emerald-200">
                  {profData.situacao}
                </span>
              </div>

              <form onSubmit={handleSaveProfissional} className="space-y-3.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Dados Institucionais (Registrados no Conselho)
                  </span>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-semibold">Nome Completo</label>
                    <input 
                      type="text" 
                      disabled 
                      value={profData.nome} 
                      className="w-full px-2.5 py-1.5 bg-slate-200/70 border border-slate-300 rounded-lg text-slate-700 font-bold cursor-not-allowed"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold">CPF</label>
                      <input 
                        type="text" 
                        disabled 
                        value={profData.cpf} 
                        className="w-full px-2.5 py-1.5 bg-slate-200/70 border border-slate-300 rounded-lg text-slate-700 font-mono cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold">RG</label>
                      <input 
                        type="text" 
                        disabled 
                        value={profData.rg} 
                        className="w-full px-2.5 py-1.5 bg-slate-200/70 border border-slate-300 rounded-lg text-slate-700 font-mono cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-cyan-50/50 rounded-xl border border-cyan-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-cyan-900 uppercase tracking-wider block">
                      Informações Atuais (Pré-preenchidas do Banco de Dados)
                    </span>
                    {!podeEditarPF && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        Somente Leitura
                      </span>
                    )}
                  </div>

                  {!podeEditarPF && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>Alteração cadastral desabilitada pelo Conselho para autoatendimento.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-700 font-bold mb-1">E-mail</label>
                      <input
                        type="email"
                        disabled={!podeEditarPF}
                        value={profData.emailPessoal || ''}
                        onChange={(e) => setProfData({ ...profData, emailPessoal: e.target.value })}
                        className={`w-full px-2.5 py-1.5 border rounded-lg lowercase font-mono ${
                          podeEditarPF ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-700 font-bold mb-1">Telefone / Celular</label>
                      <input
                        type="text"
                        disabled={!podeEditarPF}
                        value={profData.celular || ''}
                        onChange={(e) => setProfData({ ...profData, celular: maskPhone(e.target.value) })}
                        className={`w-full px-2.5 py-1.5 border rounded-lg font-mono ${
                          podeEditarPF ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-700 font-bold mb-1">CEP</label>
                      <div className="relative">
                        <input
                          type="text"
                          disabled={!podeEditarPF}
                          value={profData.cep || ''}
                          onChange={handleCepChange}
                          placeholder="00000-000"
                          className={`w-full px-2.5 py-1.5 border rounded-lg font-mono ${
                            podeEditarPF ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                          }`}
                        />
                        {isSearchingCep && (
                          <div className="absolute right-2 top-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-600" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-700 font-bold mb-1">Endereço</label>
                      <input
                        type="text"
                        disabled={!podeEditarPF}
                        value={profData.endereco || ''}
                        onChange={(e) => setProfData({ ...profData, endereco: e.target.value })}
                        className={`w-full px-2.5 py-1.5 border rounded-lg uppercase ${
                          podeEditarPF ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-700 font-bold mb-1">Complemento</label>
                      <input
                        type="text"
                        disabled={!podeEditarPF}
                        value={profData.complemento || ''}
                        onChange={(e) => setProfData({ ...profData, complemento: e.target.value })}
                        className={`w-full px-2.5 py-1.5 border rounded-lg uppercase ${
                          podeEditarPF ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-700 font-bold mb-1">Bairro</label>
                      <input
                        type="text"
                        disabled={!podeEditarPF}
                        value={profData.bairro || ''}
                        onChange={(e) => setProfData({ ...profData, bairro: e.target.value })}
                        className={`w-full px-2.5 py-1.5 border rounded-lg uppercase ${
                          podeEditarPF ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-700 font-bold mb-1">Cidade</label>
                      <input
                        type="text"
                        disabled={!podeEditarPF}
                        value={profData.cidade || ''}
                        onChange={(e) => setProfData({ ...profData, cidade: e.target.value })}
                        className={`w-full px-2.5 py-1.5 border rounded-lg uppercase ${
                          podeEditarPF ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-700 font-bold mb-1">UF</label>
                      <input
                        type="text"
                        maxLength={2}
                        disabled={!podeEditarPF}
                        value={profData.uf || ''}
                        onChange={(e) => setProfData({ ...profData, uf: e.target.value.toUpperCase() })}
                        className={`w-full px-2.5 py-1.5 border rounded-lg uppercase font-mono text-center ${
                          podeEditarPF ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {podeEditarPF && (
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md shadow-cyan-500/20 uppercase transition-all cursor-pointer"
                    >
                      Salvar Alterações Cadastrais
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Vínculos & Histórico & Formulários */}
          <div className="lg:col-span-2 space-y-5">
            {vinculosLiberados && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                      <Building className="w-4 h-4 text-cyan-600" />
                      <span>Meus Vínculos com Estabelecimentos Farmacêuticos</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Controle regulatório de vínculos ativos, carga horária declarada e histórico de baixas no Conselho.
                    </p>
                  </div>

                  {/* Switcher de Abas: Ativos vs Histórico */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setAbaVinculos('ATIVOS')}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        abaVinculos === 'ATIVOS'
                          ? 'bg-white text-cyan-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Vínculos Ativos ({meusVinculos.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAbaVinculos('HISTORICO')}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        abaVinculos === 'HISTORICO'
                          ? 'bg-white text-cyan-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <History className="w-3.5 h-3.5 text-blue-600" />
                      <span>Histórico de Vínculos ({storageService.getHistoricoVinculosProfissional(profData.id || profData.inscricao).length})</span>
                    </button>
                  </div>
                </div>

                {/* ABA 1: VÍNCULOS ATIVOS */}
                {abaVinculos === 'ATIVOS' && (
                  <div className="space-y-3">
                    {/* Resumo de Carga Horária Exclusiva do Profissional Logado */}
                    {(() => {
                      const cargaTotal = storageService.getCargaHorariaProfissional(profData.id || profData.inscricao);
                      return (
                        <div className="p-3.5 bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold shadow-xs">
                              <Clock className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-cyan-700 tracking-wider block">
                                Carga Horária Semanal Exclusiva do Profissional Logado
                              </span>
                              <div className="text-xs text-slate-700 font-medium">
                                Total acumulado em estabelecimentos regulamentados no Conselho
                              </div>
                            </div>
                          </div>
                          <div className="text-right self-end sm:self-auto">
                            <span className="text-lg font-black text-cyan-900 font-mono">
                              {cargaTotal.totalSemanal}h
                            </span>
                            <span className="text-[10px] text-cyan-700 font-semibold block">/semana</span>
                          </div>
                        </div>
                      );
                    })()}

                    {meusVinculos.length === 0 ? (
                      <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-xs space-y-1">
                        <Building2 className="w-6 h-6 text-slate-400 mx-auto" />
                        <div className="font-bold text-slate-700">Nenhum vínculo ativo registrado</div>
                        <p className="text-[11px] text-slate-400">
                          Este profissional não possui registros de Responsabilidade Técnica (RT) ativos no momento.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {meusVinculos.map((emp) => {
                          const rtItem = emp.responsaveisTecnicos?.find(r => 
                            r.profissionalId === profData.id || 
                            r.profissionalInscricao === profData.inscricao ||
                            r.profissionalNome?.toLowerCase() === profData.nome?.toLowerCase()
                          );
                          const cargaIndividual = storageService.getCargaHorariaProfissional(profData.id || profData.inscricao, emp.id);
                          const isBlocked = emp.bloqueado;

                          return (
                            <div 
                              key={emp.id} 
                              className={`p-4 rounded-xl border transition-all ${
                                isBlocked 
                                  ? 'bg-rose-50/80 border-rose-300' 
                                  : 'bg-slate-50 border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/20'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-900 text-xs uppercase">{emp.razaoSocial}</span>
                                    {emp.nomeFantasia && (
                                      <span className="text-[11px] text-slate-500 font-normal">({emp.nomeFantasia})</span>
                                    )}
                                    {isBlocked && (
                                      <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[9px] uppercase">
                                        Estabelecimento Bloqueado
                                      </span>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-600 font-mono mt-1">
                                    <div className="bg-white/80 px-2 py-1 rounded border border-slate-200/60">
                                      <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">CNPJ</span>
                                      <span>{emp.cnpj}</span>
                                    </div>
                                    <div className="bg-white/80 px-2 py-1 rounded border border-slate-200/60">
                                      <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">CRT Digital</span>
                                      <span>{emp.numeroCRT || 'CRT-VIGENTE'}</span>
                                    </div>
                                    <div className="bg-white/80 px-2 py-1 rounded border border-slate-200/60">
                                      <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">Cargo / Função</span>
                                      <span className="font-semibold text-slate-800 font-sans">{rtItem?.cargo || 'Farmacêutico RT'}</span>
                                    </div>
                                    <div className="bg-cyan-50 px-2 py-1 rounded border border-cyan-200">
                                      <span className="text-[9px] uppercase font-bold text-cyan-800 block font-sans">Carga Horária (Sua)</span>
                                      <span className="font-bold text-cyan-900 font-mono text-xs">
                                        {cargaIndividual.totalSemanal}h/semana
                                      </span>
                                    </div>
                                  </div>

                                  {rtItem?.horarios && (
                                    <div className="text-[10px] text-slate-500 bg-white/60 p-1.5 rounded border border-slate-200/50 mt-1 flex items-center gap-1.5">
                                      <Clock className="w-3 h-3 text-cyan-600 shrink-0" />
                                      <span>Horário Declarado: <strong>{
                                        typeof rtItem.horarios === 'string'
                                          ? rtItem.horarios
                                          : Array.isArray(rtItem.horarios)
                                          ? (rtItem.horarios as any[]).map(h => typeof h === 'string' ? h : `${h.diaSemana || ''}: ${h.entrada1 || ''}-${h.saida1 || ''}`).join(', ')
                                          : ''
                                      }</strong></span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                                  <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase border ${
                                    emp.condicao === 'Regular' 
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}>
                                    {emp.condicao}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Vínculo Vigente
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ABA 2: HISTÓRICO DE VÍNCULOS ANTERIORES */}
                {abaVinculos === 'HISTORICO' && (
                  <div className="space-y-3">
                    {(() => {
                      const historico = storageService.getHistoricoVinculosProfissional(profData.id || profData.inscricao);

                      if (historico.length === 0) {
                        return (
                          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-xs space-y-1">
                            <History className="w-6 h-6 text-slate-400 mx-auto" />
                            <div className="font-bold text-slate-700">Nenhum histórico de baixa arquivado</div>
                            <p className="text-[11px] text-slate-400">
                              Não constam registros de baixas de vínculos ou termos de encerramento anteriores para este cadastro.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2.5">
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 px-1">
                            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Relação oficial de vínculos anteriores encerrados com termo de baixa homologado pelo Conselho:</span>
                          </div>

                          {historico.map((vinc) => (
                            <div 
                              key={vinc.id}
                              className="p-4 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2.5 transition-all"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                                <div>
                                  <div className="font-bold text-slate-900 text-xs uppercase flex items-center gap-2">
                                    <span>{vinc.empresaRazaoSocial}</span>
                                    {vinc.empresaNomeFantasia && (
                                      <span className="text-[11px] text-slate-500 font-normal">({vinc.empresaNomeFantasia})</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    CNPJ: {vinc.empresaCnpj} {vinc.empresaInscricao ? `• CRF: ${vinc.empresaInscricao}` : ''}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                  <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase bg-slate-200 text-slate-700 border border-slate-300">
                                    {vinc.status || 'Baixado'}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                                <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Função / Cargo</span>
                                  <span className="font-semibold text-slate-800">{vinc.cargo}</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Carga Horária</span>
                                  <span className="font-bold text-slate-800 font-mono">{vinc.cargaHorariaSemanal}h/sem</span>
                                </div>
                                <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-200/60">
                                  <span className="text-[9px] uppercase font-bold text-emerald-700 block flex items-center gap-1">
                                    <Calendar className="w-2.5 h-2.5" />
                                    Data de Início
                                  </span>
                                  <span className="font-bold text-emerald-900 font-mono">{vinc.dataInicio}</span>
                                </div>
                                <div className="bg-rose-50/60 p-2 rounded-lg border border-rose-200/60">
                                  <span className="text-[9px] uppercase font-bold text-rose-700 block flex items-center gap-1">
                                    <Calendar className="w-2.5 h-2.5" />
                                    Data da Baixa
                                  </span>
                                  <span className="font-bold text-rose-900 font-mono">{vinc.dataBaixa || 'Não informada'}</span>
                                </div>
                              </div>

                              {(vinc.motivoBaixa || vinc.protocoloBaixa) && (
                                <div className="p-2.5 bg-white rounded-lg border border-slate-200/70 text-[11px] space-y-1">
                                  {vinc.motivoBaixa && (
                                    <div className="text-slate-600">
                                      <strong className="text-slate-800">Motivo da Baixa:</strong> {vinc.motivoBaixa}
                                    </div>
                                  )}
                                  {vinc.protocoloBaixa && (
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      PROTOCOLO REGULATÓRIO DE HOMOLOGAÇÃO: <strong>{vinc.protocoloBaixa}</strong>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'EMPRESA' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase">{empresaLogada?.razaoSocial}</h2>
              <p className="text-xs text-slate-500 font-mono">CNPJ: {empresaLogada?.cnpj} • INSCRIÇÃO: {empresaLogada?.inscricao}</p>
            </div>
            {onOpenCrtModal && podeEmitirCrtPJ && (
              <button
                onClick={() => onOpenCrtModal(empresaLogada)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Emitir CRT Digital (Com QR Code)</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Condição Sanitária</span>
              <strong className="text-emerald-700 text-sm">{empresaLogada?.condicao}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Validade CRT Vigente</span>
              <strong className="text-slate-900 text-sm font-mono">{empresaLogada?.validadeCRT}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Assistência Farmacêutica</span>
              <strong className="text-teal-700 text-sm">{empresaLogada?.assistenciaPlena ? 'Plena (Integral)' : 'Parcial'}</strong>
            </div>
          </div>
        </div>
      )}

      {(viewMode === 'ANUIDADE_PF' || viewMode === 'ANUIDADE_PJ') && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center space-x-2">
              <Coins className="w-4 h-4 text-amber-600" />
              <span>Anuidades & Lançamentos Financeiros</span>
            </h3>

            <div className="space-y-2">
              {(viewMode === 'ANUIDADE_PF' ? posicaoFinProf.lancamentos : posicaoFinEmp.lancamentos).length === 0 ? (
                <div className="p-5 bg-slate-50 rounded-xl text-center text-slate-500 text-xs">
                  Nenhum débito pendente encontrado. Adimplente!
                </div>
              ) : (
                (viewMode === 'ANUIDADE_PF' ? posicaoFinProf.lancamentos : posicaoFinEmp.lancamentos).map((lanc) => (
                  <div key={lanc.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 uppercase">{lanc.descricao}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        VENCIMENTO: {lanc.dataVencimento} | EXERCÍCIO: {lanc.exercicio}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-slate-900">R$ {lanc.valorTotal.toFixed(2)}</span>
                      {onOpenBoletoPix && lanc.status !== 'Pago' && (viewMode === 'ANUIDADE_PF' ? podeEmitirBoletoPixPF : podeEmitirBoletoPixPJ) && (
                        <button
                          type="button"
                          onClick={() => onOpenBoletoPix(lanc)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] uppercase flex items-center space-x-1 cursor-pointer shadow-xs"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Boleto / Pix</span>
                        </button>
                      )}
                      {lanc.status === 'Pago' && (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[10px] uppercase">
                          Pago
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Emissão da Certidão de Quitação (Profissional) */}
          {viewMode === 'ANUIDADE_PF' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <span>Certidão de Quitação</span>
                </h3>
                {podeEmitirQuitacao ? (
                  <button
                    type="button"
                    onClick={handleEmitirQuitacao}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>Emitir Certidão</span>
                  </button>
                ) : (
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg font-bold">
                    Emissão Suspensa
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">
                {podeEmitirQuitacao 
                  ? 'Emita sua certidão negativa de débitos com validade jurídica instantânea com QR Code de autenticidade.'
                  : 'A emissão de certidões online está temporariamente desativada pelo Conselho para autoatendimento.'}
              </p>
            </div>
          )}
        </div>
      )}

      {(viewMode === 'PROTOCOLO_PF' || viewMode === 'PROTOCOLO_PJ') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Protocolos & Processos em Andamento</span>
          </h3>

          {meusProtocolos.length === 0 ? (
            <div className="p-5 bg-slate-50 rounded-xl text-center text-slate-500 text-xs">
              Nenhum protocolo encontrado.
            </div>
          ) : (
            <div className="space-y-2.5">
              {meusProtocolos.map((prot) => (
                <div key={prot.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 font-mono">{prot.numeroProtocolo}</span>
                    <span className="px-2.5 py-0.5 rounded-lg font-bold text-[10px] bg-blue-100 text-blue-800">
                      {prot.status}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800 uppercase">{prot.tipo}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    ABERTURA: {prot.dataAbertura} | SETOR ATUAL: {prot.setorAtual}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === 'REQUERIMENTO_PF' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Requerimento Eletrônico (Profissional)
          </h3>

          {!podeEnviarReqPF && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>O envio de novos requerimentos está temporariamente desativado pelo Conselho.</span>
            </div>
          )}

          <form onSubmit={handleCreateProtocoloPF} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Assunto do Requerimento (Cadastros Básicos • Profissionais PF)
              </label>
              <select
                disabled={!podeEnviarReqPF}
                value={protocoloAssuntoPF}
                onChange={(e) => {
                  setProtocoloAssuntoPF(e.target.value);
                  setEmpresasSelecionadasPF([]);
                }}
                className={`w-full px-3 py-2 border rounded-xl text-slate-900 font-medium ${
                  podeEnviarReqPF ? 'bg-slate-50 border-slate-300' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                {assuntosPF.map((ass) => (
                  <option key={ass.id} value={ass.nome}>{ass.nome}</option>
                ))}
              </select>
            </div>

            {/* Seleção de Empresa(s) Vinculada(s) quando o assunto cadastrado exigir */}
            {(() => {
              const assuntoAtual = assuntosPF.find(a => a.nome === protocoloAssuntoPF);
              const exigeEmpresa = Boolean(assuntoAtual?.selecionarEmpresaVinculada);

              if (!exigeEmpresa) return null;

              return (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-cyan-600" />
                        <span className="font-bold text-xs text-slate-900 uppercase">
                          Empresa(s) Vinculada(s) ao Peticionamento
                        </span>
                        <span className="text-[10px] bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full font-bold">
                          Múltipla Seleção
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Este assunto exige a identificação do estabelecimento. Selecione uma ou mais empresas vinculadas ao seu registro:
                      </p>
                    </div>

                    {meusVinculos.length > 0 && podeEnviarReqPF && (
                      <div className="flex items-center space-x-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setEmpresasSelecionadasPF(meusVinculos.map(e => e.id))}
                          className="font-bold text-cyan-700 hover:underline cursor-pointer"
                        >
                          Selecionar Todas
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setEmpresasSelecionadasPF([])}
                          className="font-bold text-slate-500 hover:underline cursor-pointer"
                        >
                          Limpar
                        </button>
                      </div>
                    )}
                  </div>

                  {meusVinculos.length === 0 ? (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Nenhum vínculo com empresa encontrado:</strong>
                        <span>Seu cadastro profissional não possui empresas vinculadas ativas no momento no Conselho. Caso sua solicitação seja referente a uma nova contratação ou assunção, você pode descrever os dados do estabelecimento no campo de justificativa abaixo.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {meusVinculos.map((emp) => {
                        const isSelected = empresasSelecionadasPF.includes(emp.id);
                        return (
                          <label
                            key={emp.id}
                            className={`flex items-start space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-50/70 border-cyan-300 ring-1 ring-cyan-400/30'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={!podeEnviarReqPF}
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEmpresasSelecionadasPF(prev => [...prev, emp.id]);
                                } else {
                                  setEmpresasSelecionadasPF(prev => prev.filter(id => id !== emp.id));
                                }
                              }}
                              className="w-4 h-4 mt-0.5 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 cursor-pointer shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-900 uppercase truncate">
                                  {emp.razaoSocial}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                                  emp.condicao === 'Regular' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {emp.condicao}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                CNPJ: {emp.cnpj} • INSCRIÇÃO: {emp.inscricao}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            <div>
              <label className="block text-slate-700 font-bold mb-1">Justificativa e Detalhes da Solicitação</label>
              <textarea
                rows={3}
                required
                disabled={!podeEnviarReqPF}
                value={protocoloDetalhesPF}
                onChange={(e) => setProtocoloDetalhesPF(e.target.value)}
                placeholder={podeEnviarReqPF ? "Descreva detalhadamente a sua solicitação..." : "Envio de novos requerimentos suspenso."}
                className={`w-full px-3 py-2 border rounded-xl text-slate-900 ${
                  podeEnviarReqPF ? 'bg-slate-50 border-slate-300' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              />
            </div>

            {podeEnviarReqPF && (
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Protocolar Requerimento Digital</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {viewMode === 'REQUERIMENTO_PJ' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Requerimento Eletrônico (Empresa)
          </h3>

          {!podeEnviarReqPJ && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>O envio de novos requerimentos da empresa está temporariamente desativado pelo Conselho.</span>
            </div>
          )}

          <form onSubmit={handleCreateProtocoloPJ} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Assunto do Requerimento (Cadastros Básicos • Empresas PJ)
              </label>
              <select
                disabled={!podeEnviarReqPJ}
                value={protocoloAssuntoPJ}
                onChange={(e) => setProtocoloAssuntoPJ(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl text-slate-900 font-medium ${
                  podeEnviarReqPJ ? 'bg-slate-50 border-slate-300' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                {assuntosPJ.map((ass) => (
                  <option key={ass.id} value={ass.nome}>{ass.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Justificativa e Detalhes da Solicitação Corporativa</label>
              <textarea
                rows={3}
                required
                disabled={!podeEnviarReqPJ}
                value={protocoloDetalhesPJ}
                onChange={(e) => setProtocoloDetalhesPJ(e.target.value)}
                placeholder={podeEnviarReqPJ ? "Descreva a solicitação da empresa..." : "Envio de novos requerimentos suspenso."}
                className={`w-full px-3 py-2 border rounded-xl text-slate-900 ${
                  podeEnviarReqPJ ? 'bg-slate-50 border-slate-300' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              />
            </div>

            {podeEnviarReqPJ && (
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Protocolar Requerimento PJ</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {(viewMode === 'FORMULARIOS_PF' || viewMode === 'FORMULARIOS_PJ') && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-cyan-600" />
                  <span>Formulários & Requerimentos Dinâmicos ({viewMode === 'FORMULARIOS_PF' ? 'Pessoa Física' : 'Pessoa Jurídica'})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecione um dos formulários oficiais homologados pelo Conselho para preenchimento online.
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={buscaForm}
                  onChange={(e) => setBuscaForm(e.target.value)}
                  placeholder="Buscar formulário..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {(() => {
              const todosFormularios = storageService.getFormularios();
              const disponiveis = todosFormularios.filter(f => {
                if (!f.ativo) return false;
                if (viewMode === 'FORMULARIOS_PF') {
                  return f.publicarProfissional !== false || f.publicoAlvo === 'PROFISSIONAL' || f.publicoAlvo === 'TODOS' || !f.publicoAlvo;
                } else {
                  return f.publicarEmpresa !== false || f.publicoAlvo === 'EMPRESA' || f.publicoAlvo === 'TODOS' || !f.publicoAlvo;
                }
              }).filter(f => 
                !buscaForm || 
                f.titulo.toLowerCase().includes(buscaForm.toLowerCase()) || 
                f.descricao.toLowerCase().includes(buscaForm.toLowerCase()) ||
                f.categoria.toLowerCase().includes(buscaForm.toLowerCase())
              );

              if (disponiveis.length === 0) {
                return (
                  <div className="p-8 text-center text-slate-500 space-y-2 bg-slate-50 rounded-xl border border-slate-200">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="font-bold text-slate-700 text-sm">Nenhum formulário dinâmico disponível</div>
                    <p className="text-xs text-slate-400">
                      Não foram encontrados formulários ativos para preenchimento no momento.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {disponiveis.map((form) => (
                    <div key={form.id} className="p-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-cyan-300 rounded-2xl transition-all shadow-xs flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-800">
                            {form.categoria || 'Geral'}
                          </span>
                          {form.prazoDiasConclusao && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{form.prazoDiasConclusao} dias</span>
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{form.titulo}</h4>
                        <p className="text-xs text-slate-600 line-clamp-2">{form.descricao}</p>
                        <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 pt-1">
                          {form.permiteAnonimo && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-semibold">
                              Permite Anônimo
                            </span>
                          )}
                          {form.permiteAnexos && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                              Permite Anexos ({form.tamanhoMaximoMb || 10}MB)
                            </span>
                          )}
                          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                            {form.campos?.length || 0} campos
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setFormDinamicoAtivo(form);
                          setRespostasForm({});
                          setAnexosForm([]);
                          setIsAnonimoSubmit(false);
                        }}
                        className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Preencher Formulário</span>
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal para Preenchimento de Formulário Dinâmico */}
      {formDinamicoAtivo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-100 text-cyan-800">
                  {formDinamicoAtivo.categoria || 'Formulário Oficial'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{formDinamicoAtivo.titulo}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{formDinamicoAtivo.descricao}</p>
              </div>
              <button
                type="button"
                onClick={() => setFormDinamicoAtivo(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const autorNome = isAnonimoSubmit ? 'Anônimo / Manifestante' : (viewMode.includes('PF') ? profData.nome : empresaLogada?.razaoSocial || 'Inscrito');
                const autorDoc = isAnonimoSubmit ? 'ANÔNIMO' : (viewMode.includes('PF') ? profData.cpf : empresaLogada?.cnpj || '000.000.000-00');
                
                const protNum = `PROT-2026/${Math.floor(100000 + Math.random() * 900000)}`;

                const novaResp: RespostaFormulario = {
                  id: `resp-${Date.now()}`,
                  formularioId: formDinamicoAtivo.id,
                  formularioTitulo: formDinamicoAtivo.titulo,
                  autorNome,
                  autorDocumento: autorDoc,
                  autorEmail: isAnonimoSubmit ? undefined : (viewMode.includes('PF') ? profData.emailPessoal : empresaLogada?.email),
                  canalOrigem: viewMode.includes('PF') ? 'PROFISSIONAL' : 'EMPRESA',
                  protocoloGerado: protNum,
                  dataEnvio: new Date().toLocaleString('pt-BR'),
                  respostas: respostasForm,
                  anexos: anexosForm.map(a => ({ nome: a.nome, tamanho: Math.round(a.tamanhoMb * 1024), tipo: a.tipo, url: a.url })),
                  status: 'Em Análise'
                };

                storageService.submitFormResponse(novaResp);

                // Gerar protocolo automático
                const novoProt = {
                  id: `prot-${Date.now()}`,
                  numeroProtocolo: protNum,
                  tipo: formDinamicoAtivo.titulo,
                  assunto: formDinamicoAtivo.titulo,
                  interessado: autorNome,
                  documentoInteressado: autorDoc,
                  tipoInteressado: (viewMode.includes('PF') ? 'PROFISSIONAL' : 'EMPRESA') as any,
                  vinculoInscricao: isAnonimoSubmit ? undefined : (viewMode.includes('PF') ? profData.inscricao : empresaLogada?.inscricao),
                  contatoEmail: novaResp.autorEmail,
                  dataInscricao: new Date().toLocaleDateString('pt-BR'),
                  dataAbertura: new Date().toLocaleDateString('pt-BR'),
                  dataUltimaAtualizacao: new Date().toLocaleDateString('pt-BR'),
                  prazoResposta: `${formDinamicoAtivo.prazoDiasConclusao || 5} dias úteis`,
                  status: 'Em Análise',
                  setorAtual: formDinamicoAtivo.setorTramitacaoNome || 'Atendimento Geral',
                  anexos: anexosForm.map(a => a.nome),
                  historico: [
                    {
                      data: new Date().toLocaleDateString('pt-BR'),
                      setor: 'Portal do Inscrito',
                      descricao: `Formulário "${formDinamicoAtivo.titulo}" preenchido e protocolado online.`,
                      responsavel: autorNome
                    }
                  ]
                };
                storageService.saveProtocolo(novoProt);

                toastService.success(
                  'Formulário Protocolado',
                  `Suas respostas foram salvas com sucesso. Protocolo gerado: ${protNum}.`
                );
                setFormDinamicoAtivo(null);
              }}
              className="space-y-4 text-xs"
            >
              {/* Opção de Envio Anônimo se permitido */}
              {formDinamicoAtivo.permiteAnonimo && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-purple-900 block">Deseja enviar de forma anônima?</span>
                    <span className="text-[11px] text-purple-700">Usado para denúncias ou manifestações sem identificação.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAnonimoSubmit}
                    onChange={(e) => setIsAnonimoSubmit(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-purple-300 cursor-pointer"
                  />
                </div>
              )}

              {/* Renderização dinâmica dos campos */}
              <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-2">
                {formDinamicoAtivo.campos?.map((campo) => (
                  <div key={campo.id} className="space-y-1">
                    <label className="block text-slate-700 font-bold">
                      {campo.label} {campo.obrigatorio && <span className="text-rose-600">*</span>}
                    </label>
                    {campo.ajuda && <p className="text-[11px] text-slate-500">{campo.ajuda}</p>}

                    {campo.tipo === 'select' ? (
                      <select
                        required={campo.obrigatorio}
                        value={respostasForm[campo.id] || ''}
                        onChange={(e) => setRespostasForm({ ...respostasForm, [campo.id]: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                      >
                        <option value="">Selecione uma opção...</option>
                        {campo.opcoes?.map(op => <option key={op} value={op}>{op}</option>)}
                      </select>
                    ) : campo.tipo === 'textarea' ? (
                      <textarea
                        rows={3}
                        required={campo.obrigatorio}
                        placeholder={campo.placeholder}
                        value={respostasForm[campo.id] || ''}
                        onChange={(e) => setRespostasForm({ ...respostasForm, [campo.id]: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                      />
                    ) : (
                      <input
                        type={campo.tipo === 'number' ? 'number' : campo.tipo === 'date' ? 'date' : 'text'}
                        required={campo.obrigatorio}
                        placeholder={campo.placeholder}
                        value={respostasForm[campo.id] || ''}
                        onChange={(e) => setRespostasForm({ ...respostasForm, [campo.id]: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                      />
                    )}
                  </div>
                ))}

                {/* Anexos de Arquivos se o formulário permitir */}
                {formDinamicoAtivo.permiteAnexos && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                        <Paperclip className="w-4 h-4 text-cyan-600" />
                        <span>Anexo de Documentos ({formDinamicoAtivo.tiposAnexosPermitidos?.join(', ') || 'PDF, DOCX, JPG, PNG'})</span>
                      </span>
                      <span className="text-[10px] text-slate-500">Máx: {formDinamicoAtivo.tamanhoMaximoMb || 10} MB</span>
                    </div>

                    <input
                      type="file"
                      multiple
                      accept={formDinamicoAtivo.tiposAnexosPermitidos?.join(',') || '.pdf,.docx,.jpg,.png'}
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        Array.from(files).forEach(file => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setAnexosForm(prev => [
                              ...prev,
                              {
                                nome: file.name,
                                tamanhoMb: Number((file.size / (1024 * 1024)).toFixed(2)),
                                tipo: file.type || 'documento',
                                url: reader.result as string
                              }
                            ]);
                          };
                          reader.readAsDataURL(file);
                        });
                        toastService.info('Anexo Adicionado', `${files.length} arquivo(s) carregado(s).`);
                        e.target.value = '';
                      }}
                      className="w-full text-xs text-slate-600 cursor-pointer"
                    />

                    {anexosForm.length > 0 && (
                      <div className="space-y-1 pt-1">
                        {anexosForm.map((anx, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs">
                            <span className="truncate max-w-xs text-slate-800 font-medium">{anx.nome} ({anx.tamanhoMb} MB)</span>
                            <button
                              type="button"
                              onClick={() => setAnexosForm(prev => prev.filter((_, i) => i !== idx))}
                              className="text-rose-600 hover:text-rose-800 font-bold px-1 cursor-pointer"
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFormDinamicoAtivo(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar & Gerar Protocolo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
