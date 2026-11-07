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
  Check
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { LancamentoFinanceiro, Empresa, Profissional } from '../../types';
import { toastService } from '../../services/toastService';
import { maskCEP, fetchAddressByCEP, maskPhone } from '../../utils/documentUtils';

interface PortalViewProps {
  defaultTab?: 'PROFISSIONAL' | 'EMPRESA';
  onOpenBoletoPix?: (lanc: LancamentoFinanceiro) => void;
  onOpenCrtModal?: (empresa: Empresa) => void;
}

export const PortalView: React.FC<PortalViewProps> = ({ defaultTab = 'PROFISSIONAL', onOpenBoletoPix, onOpenCrtModal }) => {
  const [activeSubTab, setActiveSubTab] = useState<'PROFISSIONAL' | 'EMPRESA'>(defaultTab);
  
  // Professional state
  const authUser = storageService.getCurrentAuthUser();
  const allProfs = storageService.getProfissionais();
  const initialProf = allProfs.find(p => p.cpf === authUser?.documento || p.inscricao === authUser?.numeroInscricao || p.emailPessoal === authUser?.email) || allProfs[0];
  const [profData, setProfData] = useState<Profissional>(initialProf ? JSON.parse(JSON.stringify(initialProf)) : {
    id: 'prof-demo',
    inscricao: 'CRF-AM 1000',
    nome: 'DRA. MARCELA SILVA',
    cpf: '934.135.302-59',
    rg: '123456 SSP/AM',
    orgaoExpeditor: 'SSP/AM',
    dataNascimento: '01/01/1990',
    sexo: 'F',
    nacionalidade: 'Brasileira',
    naturalidade: 'Manaus - AM',
    nomeMae: 'MARIA SILVA',
    tipoAssociado: 'Farmacêutico',
    situacao: 'Definitiva',
    statusFinanceiro: 'Adimplente',
    emailPessoal: 'marcela.silva@crfam.org.br',
    emailComercial: 'contato@farmacia.com',
    telefone: '(92) 3232-1234',
    celular: '(92) 99111-2233',
    cep: '69000-000',
    endereco: 'AV. DJALMA BATISTA',
    complemento: 'SALA 101',
    bairro: 'CHAPADA',
    cidade: 'MANAUS',
    uf: 'AM',
    dataInscricao: '01/01/2020',
    dataColacaoGrau: '01/01/2019',
    dataExpDiploma: '01/06/2019',
    faculdade: 'UFAM'
  });
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Enterprise state
  const allEmpresas = storageService.getEmpresas();
  const empresaLogada = allEmpresas[0];

  // Petition subjects from Cadastros Básicos
  const assuntosPF = storageService.getCadastrosBasicos('ASSUNTO_REQUERIMENTO_PF').filter(i => i.ativo);
  const assuntosPJ = storageService.getCadastrosBasicos('ASSUNTO_REQUERIMENTO_PJ').filter(i => i.ativo);

  const [protocoloAssuntoPF, setProtocoloAssuntoPF] = useState(assuntosPF[0]?.nome || 'Assunção de Responsabilidade Técnica (RT)');
  const [protocoloDetalhesPF, setProtocoloDetalhesPF] = useState('');

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
      'Suas informações de contato e endereço foram salvas com sucesso no sistema do CRF.'
    );
  };

  const handleCreateProtocoloPF = (e: React.FormEvent) => {
    e.preventDefault();
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
      vinculoDetalhes: protocoloDetalhesPF,
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
          descricao: `Requerimento protocolado via Portal PF: ${protocoloAssuntoPF}. Detalhes: ${protocoloDetalhesPF}`,
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
          setor: 'Portal do Inscrito PJ',
          descricao: `Requerimento protocolado via Portal PJ: ${protocoloAssuntoPJ}. Detalhes: ${protocoloDetalhesPJ}`,
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

  // Posição financeira do profissional
  const posicaoFinProf = storageService.getPosicaoFinanceira(profData.cpf || profData.inscricao, 'PROFISSIONAL');

  // Vínculos do profissional com estabelecimentos
  const meusVinculos = allEmpresas.filter(emp => 
    emp.responsaveisTecnicos?.some(rt => 
      rt.profissionalId === profData.id || 
      rt.profissionalInscricao === profData.inscricao ||
      rt.profissionalNome?.toLowerCase() === profData.nome?.toLowerCase()
    )
  );

  return (
    <div className="space-y-6">
      {/* Header com Abas de Seleção de Portal Desvinculadas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white flex items-center justify-center shadow-md">
            {activeSubTab === 'PROFISSIONAL' ? <UserCheck className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>{activeSubTab === 'PROFISSIONAL' ? 'Portal do Inscrito (Profissional PF)' : 'Portal da Empresa (Estabelecimento PJ)'}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeSubTab === 'PROFISSIONAL' 
                ? 'Ambiente restrito ao farmacêutico para alteração de contato, consulta de vínculos, posições financeiras e peticionamento.' 
                : 'Ambiente restrito ao estabelecimento para emissão de CRT Digital, QSA e peticionamento corporativo.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('PROFISSIONAL')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'PROFISSIONAL'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Portal Profissional (PF)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('EMPRESA')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'EMPRESA'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Portal Empresa (PJ)</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'PROFISSIONAL' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Esquerda: Perfil do Profissional (Campos Institucionais Bloqueados + Contato/Endereço Editáveis) */}
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
                    Dados Institucionais (Bloqueados para Edição)
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
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold">RG / Orgão</label>
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
                  <span className="text-[10px] font-bold text-cyan-900 uppercase tracking-wider block flex items-center space-x-1">
                    <span>Campos Permitidos para Atualização (Endereço e Contato)</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-700 font-bold mb-1">E-mail</label>
                      <input
                        type="email"
                        value={profData.emailPessoal}
                        onChange={(e) => setProfData({ ...profData, emailPessoal: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 lowercase font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-700 font-bold mb-1">Telefone / Celular</label>
                      <input
                        type="text"
                        value={profData.celular}
                        onChange={(e) => setProfData({ ...profData, celular: maskPhone(e.target.value) })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-700 font-bold mb-1">CEP</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={profData.cep}
                          onChange={handleCepChange}
                          placeholder="00000-000"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                        />
                        {isSearchingCep && (
                          <div className="absolute right-2 top-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-600" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-700 font-bold mb-1">Logradouro / Endereço</label>
                      <input
                        type="text"
                        value={profData.endereco}
                        onChange={(e) => setProfData({ ...profData, endereco: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-700 font-bold mb-1">Complemento</label>
                      <input
                        type="text"
                        value={profData.complemento || ''}
                        onChange={(e) => setProfData({ ...profData, complemento: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 uppercase"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-700 font-bold mb-1">Bairro</label>
                      <input
                        type="text"
                        value={profData.bairro}
                        onChange={(e) => setProfData({ ...profData, bairro: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-700 font-bold mb-1">Cidade</label>
                      <input
                        type="text"
                        value={profData.cidade}
                        onChange={(e) => setProfData({ ...profData, cidade: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-700 font-bold mb-1">UF</label>
                      <input
                        type="text"
                        maxLength={2}
                        value={profData.uf}
                        onChange={(e) => setProfData({ ...profData, uf: e.target.value.toUpperCase() })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 uppercase font-mono text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md shadow-cyan-500/20 uppercase transition-all cursor-pointer"
                  >
                    Salvar Alterações Cadastrais
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Direita: Posições Financeiras, Vínculos Ativos/Inativos & Peticionamento PF */}
          <div className="lg:col-span-2 space-y-5">
            {/* Vínculos do Usuário (Ativo / Inativo / Bloqueado) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <Building className="w-4 h-4 text-cyan-600" />
                  <span>Meus Vínculos com Estabelecimentos Farmacêuticos ({meusVinculos.length})</span>
                </h3>
                <span className="text-[10px] text-slate-500">Histórico completo de atuação RT</span>
              </div>

              {meusVinculos.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500 text-xs">
                  Nenhum estabelecimento vinculado a este profissional no momento.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {meusVinculos.map((emp) => {
                    const rtItem = emp.responsaveisTecnicos?.find(r => 
                      r.profissionalId === profData.id || 
                      r.profissionalInscricao === profData.inscricao
                    );
                    const isBlocked = emp.bloqueado;
                    return (
                      <div key={emp.id} className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        isBlocked ? 'bg-rose-50/80 border-rose-300' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div>
                          <div className="font-bold text-slate-900 uppercase flex items-center gap-2">
                            <span>{emp.razaoSocial}</span>
                            {isBlocked && (
                              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[9px] uppercase">
                                Estabelecimento Bloqueado
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            CNPJ: {emp.cnpj} | CRT: {emp.numeroCRT} | CARGO: {rtItem?.cargo || 'RT'} | CARGA HORÁRIA: {rtItem?.cargaHorariaSemanal || 0}h/sem
                          </div>
                          <div className="text-[10px] text-slate-600 mt-1">
                            Endereço: {emp.endereco}, {emp.bairro} - {emp.cidade}/{emp.uf}
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase ${
                          emp.condicao === 'Regular' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {emp.condicao}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Posições Financeiras & Certidão de Quitação */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>Posições Financeiras & Anuidade PF</span>
                </h3>
                <button
                  type="button"
                  onClick={handleEmitirQuitacao}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Emitir Certidão de Quitação</span>
                </button>
              </div>

              <div className="space-y-2">
                {posicaoFinProf.lancamentos.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500 text-xs">
                    Nenhum débito pendente encontrado. Você está em dia com o CRF!
                  </div>
                ) : (
                  posicaoFinProf.lancamentos.map((lanc) => (
                    <div key={lanc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 uppercase">{lanc.descricao}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          VENCIMENTO: {lanc.dataVencimento} | EXERCÍCIO: {lanc.exercicio}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-bold text-slate-900">R$ {lanc.valorTotal.toFixed(2)}</span>
                        {onOpenBoletoPix && lanc.status !== 'Pago' && (
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

            {/* Peticionamento Eletrônico & Requerimentos Online (Vinculado a Cadastros Básicos • Profissionais PF) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Peticionamento Eletrônico & Requerimentos Online (Profissional PF)
              </h3>

              <form onSubmit={handleCreateProtocoloPF} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Assunto do Requerimento (Cadastros Básicos • Profissionais PF)
                  </label>
                  <select
                    value={protocoloAssuntoPF}
                    onChange={(e) => setProtocoloAssuntoPF(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  >
                    {assuntosPF.map((ass) => (
                      <option key={ass.id} value={ass.nome}>{ass.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Justificativa e Detalhes da Solicitação</label>
                  <textarea
                    rows={3}
                    required
                    value={protocoloDetalhesPF}
                    onChange={(e) => setProtocoloDetalhesPF(e.target.value)}
                    placeholder="Descreva detalhadamente a sua solicitação..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="flex items-center space-x-1.5 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Protocolar Requerimento Digital</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Portal da Empresa (PJ) */
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 uppercase">{empresaLogada?.razaoSocial}</h2>
                <p className="text-xs text-slate-500 font-mono">CNPJ: {empresaLogada?.cnpj} • INSCRIÇÃO: {empresaLogada?.inscricao}</p>
              </div>
              {onOpenCrtModal && (
                empresaLogada?.condicao === 'Regular' ? (
                  <button
                    onClick={() => onOpenCrtModal(empresaLogada)}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>Emitir CRT Digital (Com QR Code)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenCrtModal(empresaLogada)}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    <FileCheck2 className="w-4 h-4 text-rose-600" />
                    <span>CRT Bloqueada ({empresaLogada?.condicao?.toUpperCase()})</span>
                  </button>
                )
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

          {/* Peticionamento Eletrônico PJ (Vinculado a Cadastros Básicos • Empresas PJ) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Peticionamento Eletrônico & Requerimentos Online (Empresa PJ)
            </h3>

            <form onSubmit={handleCreateProtocoloPJ} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Assunto do Requerimento (Cadastros Básicos • Empresas PJ)
                </label>
                <select
                  value={protocoloAssuntoPJ}
                  onChange={(e) => setProtocoloAssuntoPJ(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
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
                  value={protocoloDetalhesPJ}
                  onChange={(e) => setProtocoloDetalhesPJ(e.target.value)}
                  placeholder="Descreva a solicitação da empresa..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Protocolar Requerimento PJ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
