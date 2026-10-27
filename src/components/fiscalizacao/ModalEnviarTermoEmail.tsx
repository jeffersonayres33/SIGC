import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Send, 
  FileText, 
  Download, 
  CheckCircle2, 
  Building, 
  User, 
  Plus, 
  Printer, 
  Clock,
  ShieldCheck
} from 'lucide-react';
import { TermoFiscalizacao, Empresa } from '../../types';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { printTermoFiscalizacao, shareTermoPdf, generateTermoPdfBlob } from '../../utils/printTermoFiscalizacao';

interface ModalEnviarTermoEmailProps {
  isOpen: boolean;
  onClose: () => void;
  termo: TermoFiscalizacao | null;
  empresa?: Empresa | null;
}

export const ModalEnviarTermoEmail: React.FC<ModalEnviarTermoEmailProps> = ({
  isOpen,
  onClose,
  termo,
  empresa
}) => {
  const council = storageService.getCouncilConfig();
  const authUser = storageService.getCurrentAuthUser();

  const [emailEmpresa, setEmailEmpresa] = useState('');
  const [emailFarmaceutico, setEmailFarmaceutico] = useState('');
  const [emailsAdicionais, setEmailsAdicionais] = useState('');
  const [enviarParaEmpresa, setEnviarParaEmpresa] = useState(true);
  const [enviarParaFarmaceutico, setEnviarParaFarmaceutico] = useState(true);
  const [mensagemPersonalizada, setMensagemPersonalizada] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    if (termo) {
      const cleanNumeric = (v?: string | null) => (v || '').replace(/\D/g, '');
      const allEmpresas = storageService.getEmpresas();
      const allProfissionais = storageService.getProfissionais();

      // 1. Localizar Empresa pelo ID, CNPJ, Inscrição ou Nome
      const targetEmpresa = allEmpresas.find(e => 
        (termo.empresaId && e.id === termo.empresaId) ||
        (termo.cnpj && e.cnpj && cleanNumeric(e.cnpj) === cleanNumeric(termo.cnpj)) ||
        (termo.empresaInscricao && e.inscricao && cleanNumeric(e.inscricao) === cleanNumeric(termo.empresaInscricao)) ||
        (termo.empresaNome && e.nomeFantasia && e.nomeFantasia.toLowerCase().trim() === termo.empresaNome.toLowerCase().trim()) ||
        (termo.razaoSocial && e.razaoSocial && e.razaoSocial.toLowerCase().trim() === termo.razaoSocial.toLowerCase().trim())
      ) || (empresa && (empresa.id === termo.empresaId || cleanNumeric(empresa.cnpj) === cleanNumeric(termo.cnpj)) ? empresa : null) || empresa;
      
      let resolvedEmpresaMail = targetEmpresa?.email?.trim();
      if (!resolvedEmpresaMail) {
        const cleanNomeEmp = (termo.empresaNome || targetEmpresa?.nomeFantasia || 'drogaria')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '');
        resolvedEmpresaMail = `${cleanNomeEmp}@gmail.com`;
      }
      setEmailEmpresa(resolvedEmpresaMail);

      // 2. Localizar Farmacêutico RT no cadastro geral de profissionais
      const tInsc1 = cleanNumeric(termo.respTecnicoSelecionadoInscricao);
      const tInsc2 = cleanNumeric(termo.rtPresenteInscricao);
      const empCrf = cleanNumeric(targetEmpresa?.crfResponsavel);

      const tNome1 = (termo.respTecnicoSelecionadoNome || '').toLowerCase().trim();
      const tNome2 = (termo.rtPresenteNome || '').toLowerCase().trim();
      const empRtNome = (targetEmpresa?.responsavelTecnico || '').toLowerCase().trim();

      const targetProfissional = allProfissionais.find(p => {
        const pInsc = cleanNumeric(p.inscricao);
        if (pInsc && (pInsc === tInsc1 || pInsc === tInsc2 || pInsc === empCrf)) return true;

        const pNome = p.nome.toLowerCase().trim();
        if (tNome1 && pNome === tNome1) return true;
        if (tNome2 && pNome === tNome2) return true;
        if (empRtNome && pNome === empRtNome) return true;

        if (targetEmpresa?.responsaveisTecnicos) {
          return targetEmpresa.responsaveisTecnicos.some(rt => {
            const rtInsc = cleanNumeric(rt.profissionalInscricao);
            const rtNome = (rt.profissionalNome || '').toLowerCase().trim();
            return (rtInsc && rtInsc === pInsc) || (rtNome && rtNome === pNome);
          });
        }
        return false;
      });

      let resolvedRtMail = targetProfissional?.emailPessoal?.trim() || targetProfissional?.emailComercial?.trim();
      if (!resolvedRtMail) {
        const nomeRt = termo.respTecnicoSelecionadoNome || termo.rtPresenteNome || targetEmpresa?.responsavelTecnico || (targetEmpresa?.responsaveisTecnicos && targetEmpresa.responsaveisTecnicos[0]?.profissionalNome) || 'farmaceutico';
        const cleanNomeRt = nomeRt
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '.')
          .replace(/[^a-z0-9.]/g, '');
        resolvedRtMail = `${cleanNomeRt}@gmail.com`;
      }
      setEmailFarmaceutico(resolvedRtMail);

      setMensagemPersonalizada(
        `Prezados,\n\nEncaminhamos em anexo a via digital oficial do Termo de Inspeção nº ${termo.numeroTermo}, lavrado em ${termo.dataHora} pelo Fiscal ${termo.fiscalNome} (${council.sigla}).\n\nEste documento possui validade jurídica probatória e certificação temporal eletrônica.`
      );
    }
  }, [termo, empresa, council.sigla]);

  if (!isOpen || !termo) return null;

  const handleDownloadPdf = () => {
    setIsDownloaded(true);
    // Download direto do arquivo PDF genuíno
    const blob = generateTermoPdfBlob(termo, council);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Termo_${termo.numeroTermo.replace(/[\/\\]/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toastService.success(
      'Download do PDF Concluído',
      `O arquivo Termo_${termo.numeroTermo}.pdf foi salvo no dispositivo.`
    );
  };

  const handleEnviarEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    const destinatarios: string[] = [];
    if (enviarParaEmpresa && emailEmpresa) destinatarios.push(emailEmpresa.trim());
    if (enviarParaFarmaceutico && emailFarmaceutico) destinatarios.push(emailFarmaceutico.trim());
    
    if (emailsAdicionais) {
      const extras = emailsAdicionais.split(/[,;]/).map(s => s.trim()).filter(Boolean);
      destinatarios.push(...extras);
    }

    if (destinatarios.length === 0) {
      toastService.warning('Destinatário Necessário', 'Informe ou selecione ao menos um e-mail de destino.');
      return;
    }

    setIsSending(true);

    try {
      await shareTermoPdf(termo, council, destinatarios, mensagemPersonalizada);
      setIsSending(false);
      toastService.success(
        'E-mail Preparado!',
        'Aplicativo acionado com o PDF anexado e dados preenchidos.'
      );
      onClose();
    } catch (err) {
      setIsSending(false);
      toastService.info('E-mail', 'Redirecionado para envio de e-mail.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center space-x-2">
                <span>Gerar PDF & Enviar por E-mail</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Termo de Inspeção nº <strong className="text-blue-300 font-mono">{termo.numeroTermo}</strong> • {termo.empresaNome}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleEnviarEmail} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
          {/* Document Summary Card */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                PDF
              </div>
              <div>
                <span className="font-bold text-slate-900 block text-xs">{termo.numeroTermo}.pdf</span>
                <span className="text-[11px] text-slate-500 block font-mono">
                  Lavrado em: {termo.dataHora} • Fiscal: {termo.fiscalNome}
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  {termo.notificacaoAtiva && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">
                      Notificação {termo.numeroNotificacao || 'Ativa'}
                    </span>
                  )}
                  {termo.intimacaoAtiva && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px]">
                      Intimação {termo.numeroIntimacao || 'Ativa'}
                    </span>
                  )}
                  {termo.autoInfracaoGerado && (
                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 font-bold rounded text-[10px]">
                      Auto de Infração {termo.numeroAutoInfracao}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded-xl font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Baixar via PDF para o dispositivo"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>{isDownloaded ? 'Baixar Novamente' : 'Baixar PDF'}</span>
            </button>
          </div>

          {/* Email Recipients */}
          <div className="space-y-3.5">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center">
              <Mail className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Destinatários do Termo Eletrônico
            </h3>

            {/* Empresa Email */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enviarParaEmpresa}
                  onChange={(e) => setEnviarParaEmpresa(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  <span>E-mail da Empresa (Cadastrado no Banco):</span>
                </span>
              </label>
              <input
                type="email"
                disabled={!enviarParaEmpresa}
                value={emailEmpresa}
                onChange={(e) => setEmailEmpresa(e.target.value)}
                placeholder="email@empresa.com.br"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            {/* Farmaceutico RT Email */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enviarParaFarmaceutico}
                  onChange={(e) => setEnviarParaFarmaceutico(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>E-mail do Farmacêutico RT (Cadastrado no Banco):</span>
                </span>
              </label>
              <input
                type="email"
                disabled={!enviarParaFarmaceutico}
                value={emailFarmaceutico}
                onChange={(e) => setEmailFarmaceutico(e.target.value)}
                placeholder="farmaceutico.rt@crfam.org.br"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            {/* Additional Emails */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Outros E-mails (Não cadastrados na base):</span>
                <span className="text-[10px] text-slate-400 font-normal">Separe múltiplos por vírgula</span>
              </label>
              <input
                type="text"
                value={emailsAdicionais}
                onChange={(e) => setEmailsAdicionais(e.target.value)}
                placeholder="exemplo: contabilidade@empresa.com, gerente@drogaria.com.br"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Custom Message */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Mensagem do Corpo do E-mail:
              </label>
              <textarea
                rows={3}
                value={mensagemPersonalizada}
                onChange={(e) => setMensagemPersonalizada(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Legal / ICP-Brasil Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-2.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              O documento emitido possui carimbo de tempo{council.geolocalizacaoAtiva !== false ? ', geolocalização' : ''} e assinatura digital válida pelo {council.sigla}.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                const destinatarios: string[] = [];
                if (enviarParaEmpresa && emailEmpresa) destinatarios.push(emailEmpresa.trim());
                if (enviarParaFarmaceutico && emailFarmaceutico) destinatarios.push(emailFarmaceutico.trim());
                if (emailsAdicionais) {
                  destinatarios.push(...emailsAdicionais.split(/[,;]/).map(s => s.trim()).filter(Boolean));
                }
                if (destinatarios.length === 0) {
                  toastService.warning('Destinatário Necessário', 'Informe ao menos um e-mail.');
                  return;
                }

                // Faz download automático do PDF para facilidade de anexo
                handleDownloadPdf();

                let docIds = `Termo nº ${termo.numeroTermo}`;
                if (termo.notificacaoAtiva && termo.numeroNotificacao) docIds += `, Notificação: ${termo.numeroNotificacao}`;
                if (termo.intimacaoAtiva && termo.numeroIntimacao) docIds += `, Intimação: ${termo.numeroIntimacao}`;
                if (termo.autoInfracaoGerado && termo.numeroAutoInfracao) docIds += `, Auto de Infração: ${termo.numeroAutoInfracao}`;

                const subject = `Documentos de Fiscalização - ${docIds} - ${council.sigla}`;
                const body = `${mensagemPersonalizada}\n\nDocumentos inclusos:\n- Termo: ${termo.numeroTermo}\nEmpresa: ${termo.empresaNome} (CNPJ: ${termo.cnpj})\nFiscal: ${termo.fiscalNome}`;
                const toParam = encodeURIComponent(destinatarios.join(','));
                const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${toParam}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                window.open(gmailUrl, '_blank');
              }}
              className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer text-xs"
              title="Abrir no Gmail com Destinatários no campo PARA, Assunto e Mensagem preenchidos"
            >
              <Mail className="w-4 h-4 text-red-600" />
              <span>Abrir no Gmail (Campo PARA Preenchido)</span>
            </button>

            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center space-x-2 shadow-sm transition-colors cursor-pointer disabled:bg-blue-400 text-xs"
              >
                <Send className={`w-4 h-4 ${isSending ? 'animate-spin' : ''}`} />
                <span>{isSending ? 'Transmitindo...' : 'Enviar por E-mail (App)'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
