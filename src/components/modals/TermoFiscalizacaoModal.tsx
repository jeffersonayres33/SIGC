import React from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Tablet, 
  Lock, 
  FileText, 
  Calendar,
  User,
  Scale
} from 'lucide-react';
import { TermoFiscalizacao } from '../../types';
import { storageService } from '../../services/storageService';

interface TermoFiscalizacaoModalProps {
  termo: TermoFiscalizacao | null;
  onClose: () => void;
  onOpenSignature: (termo: TermoFiscalizacao) => void;
}

export const TermoFiscalizacaoModal: React.FC<TermoFiscalizacaoModalProps> = ({
  termo,
  onClose,
  onOpenSignature
}) => {
  if (!termo) return null;
  const council = storageService.getCouncilConfig();

  const isAutuado = termo.autoInfracaoGerado;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isAutuado ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isAutuado ? 'Auto de Infração & Notificação Fiscal' : 'Termo de Inspeção e Visita Fiscal'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {termo.numeroTermo} {termo.numeroAutoInfracao ? `• ${termo.numeroAutoInfracao}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onOpenSignature(termo)}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors border border-purple-200"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>{termo.assinaturaNotificado || termo.recusaAssinatura ? 'Revisar Assinaturas' : 'Coletar Assinatura no Tablet'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Document Sheet */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs text-slate-800">
          <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-xs space-y-5 font-sans">
            {/* Header / Republic Stamp */}
            <div className="text-center border-b-2 border-slate-900 pb-3 space-y-1">
              <div className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">
                REPÚBLICA FEDERATIVA DO BRASIL • DEPARTAMENTO DE FISCALIZAÇÃO
              </div>
              <h1 className="text-sm font-black text-slate-950 uppercase tracking-tight">
                {council.nomeCompleto} ({council.sigla})
              </h1>
              <div className="text-xs font-bold text-purple-900 uppercase">
                {isAutuado ? `AUTO DE INFRAÇÃO Nº ${termo.numeroAutoInfracao || termo.numeroTermo}` : `TERMO DE INSPEÇÃO FISCAL Nº ${termo.numeroTermo}`}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Lavrado em {termo.dataHora} • GPS: {termo.latitude.toFixed(5)}, {termo.longitude.toFixed(5)}
              </div>
            </div>

            {/* 1. Identificação do Estabelecimento */}
            <div className="space-y-1.5">
              <div className="font-bold text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center justify-between">
                <span>1. Dados do Estabelecimento Inspecionado</span>
                <span className="text-[10px] font-mono text-slate-500 font-normal">Tipo: {termo.tipoVisita}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg text-[11px]">
                <div><strong>Razão Social:</strong> {termo.empresaNome}</div>
                <div><strong>CNPJ:</strong> {termo.cnpj}</div>
                <div><strong>Endereço:</strong> {termo.endereco}</div>
                <div><strong>Bairro / Cidade:</strong> {termo.bairro}, {termo.cidade} - {council.uf}</div>
              </div>
            </div>

            {/* 2. Responsabilidade Técnica e Presença */}
            <div className="space-y-1.5">
              <div className="font-bold text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                2. Assistência Técnica Farmacêutica
              </div>
              <div className={`p-3 rounded-lg border text-[11px] space-y-1 ${
                termo.presencaRT ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-rose-50/70 border-rose-200 text-rose-950'
              }`}>
                <div className="flex items-center space-x-2 font-bold">
                  {termo.presencaRT ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Farmacêutico Responsável Técnico PRESENTE no ato da inspeção</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Farmacêutico Responsável Técnico AUSENTE no ato da fiscalização</span>
                    </>
                  )}
                </div>
                {termo.presencaRT ? (
                  <div className="pl-6 text-slate-700">
                    <strong>Profissional Presente:</strong> {termo.rtPresenteNome || 'Farmacêutico RT'} ({termo.rtPresenteInscricao || 'CRF-AM'})
                  </div>
                ) : (
                  <div className="pl-6 text-slate-700">
                    <strong>Constatação:</strong> {termo.motivoAusenciaRT || 'Estabelecimento funcionando sem a presença e assistência do profissional farmacêutico.'}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Documentos e Regularidade Sanitária */}
            <div className="space-y-1.5">
              <div className="font-bold text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                3. Verificação de Documentos Obrigatórios
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                <div className="flex items-center space-x-1.5 p-2 bg-slate-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${termo.documentosVerificados?.crtAfixada ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span>CRT em Local Visível: <strong>{termo.documentosVerificados?.crtAfixada ? 'Sim' : 'Não'}</strong></span>
                </div>
                <div className="flex items-center space-x-1.5 p-2 bg-slate-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${termo.documentosVerificados?.licencaSanitariaVigente ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span>Licença Sanitária: <strong>{termo.documentosVerificados?.licencaSanitariaVigente ? 'Vigente' : 'Irregular'}</strong></span>
                </div>
                <div className="flex items-center space-x-1.5 p-2 bg-slate-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${termo.documentosVerificados?.sngpcRegular ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span>SNGPC / Psicotrópicos: <strong>{termo.documentosVerificados?.sngpcRegular ? 'Regular' : 'Irregular'}</strong></span>
                </div>
              </div>
            </div>

            {/* 4. Parecer e Infrações */}
            <div className="space-y-1.5">
              <div className="font-bold text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                4. Relato e Parecer Conclusivo do Fiscal
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-slate-800 leading-relaxed text-[11px]">
                {termo.relatoFiscal || 'Vistoria fiscal realizada no estabelecimento sem ocorrências graves constatadas.'}
              </div>

              {termo.infracoesIdentificadas && termo.infracoesIdentificadas.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1 text-rose-950 text-[11px]">
                  <div className="font-bold flex items-center space-x-1 text-rose-800">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Infrações Tipificadas / Dispositivos Violados:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[10px] pl-1">
                    {termo.infracoesIdentificadas.map((inf, i) => (
                      <li key={i}>{inf}</li>
                    ))}
                  </ul>
                  {termo.valorMultaPrevisto && (
                    <div className="pt-1 text-xs font-bold text-rose-900">
                      Penalidade Pecuniária Prevista: R$ {termo.valorMultaPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 5. QUADRO DE ASSINATURAS DIGITAIS */}
            <div className="space-y-2 pt-2 border-t-2 border-slate-900">
              <div className="font-bold text-[11px] uppercase tracking-wider text-slate-900 flex items-center justify-between">
                <span>5. Assinaturas Digitais & Autenticação Eletrônica</span>
                <span className="text-[10px] text-purple-700 font-mono">
                  {termo.hashValidacaoDigital || 'VALIDAÇÃO ICP-BRASIL'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Assinatura do Notificado / Profissional / Representante na falta do RT */}
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 flex flex-col justify-between min-h-[140px]">
                  <div className="text-[10px] font-bold uppercase text-slate-600 border-b border-slate-200 pb-1 flex items-center justify-between">
                    <span>Notificado / Representante no Local</span>
                    <span className="text-purple-700 font-semibold">{termo.tipoSignatarioNotificado || 'Signatário'}</span>
                  </div>

                  {/* Render Signature Image or Recusa Stamp */}
                  <div className="py-2 flex items-center justify-center flex-1">
                    {termo.recusaAssinatura ? (
                      <div className="p-2 border border-rose-300 bg-rose-50 text-rose-800 rounded-lg text-center text-[10px] font-bold">
                        <AlertTriangle className="w-4 h-4 mx-auto mb-0.5 text-rose-600" />
                        RECUSA FORMAL DE ASSINATURA CERTIFICADA
                        <div className="text-[9px] font-normal text-rose-700 mt-0.5">{termo.motivoRecusa}</div>
                      </div>
                    ) : termo.assinaturaNotificado ? (
                      <img 
                        src={termo.assinaturaNotificado} 
                        alt="Assinatura do Notificado" 
                        className="max-h-16 max-w-full object-contain filter contrast-125"
                      />
                    ) : (
                      <div className="text-slate-400 italic text-[11px] text-center">
                        Assinatura pendente de coleta no tablet
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-1 text-[10px] text-slate-600 text-center">
                    <div className="font-bold text-slate-900 truncate">{termo.nomeSignatarioNotificado || termo.rtPresenteNome || 'Responsável Presente'}</div>
                    <div className="text-[9px] text-slate-500">
                      Doc: {termo.documentoSignatarioNotificado || 'Apresentado no ato'} • Cargo: {termo.cargoSignatarioNotificado || (termo.presencaRT ? 'Farmacêutico RT' : 'Gerente/Preposto')}
                    </div>
                  </div>
                </div>

                {/* Assinatura do Fiscal Autuante */}
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 flex flex-col justify-between min-h-[140px]">
                  <div className="text-[10px] font-bold uppercase text-slate-600 border-b border-slate-200 pb-1 flex items-center justify-between">
                    <span>Agente Fiscal Autuante</span>
                    <span className="text-emerald-700 font-semibold">Portaria {council.sigla}</span>
                  </div>

                  <div className="py-2 flex items-center justify-center flex-1">
                    {termo.assinaturaFiscal ? (
                      termo.assinaturaFiscal.startsWith('data:image/svg') ? (
                        <div className="text-center">
                          <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                          <span className="text-[9px] font-mono text-emerald-800 font-bold block mt-0.5">Assinado Digitalmente</span>
                        </div>
                      ) : (
                        <img 
                          src={termo.assinaturaFiscal} 
                          alt="Assinatura Fiscal" 
                          className="max-h-16 max-w-full object-contain filter contrast-125"
                        />
                      )
                    ) : (
                      <div className="text-center">
                        <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                        <span className="text-[9px] font-mono text-emerald-800 font-bold block mt-0.5">Assinatura Certificada</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-1 text-[10px] text-slate-600 text-center">
                    <div className="font-bold text-slate-900">{termo.fiscalAssinanteNome || termo.fiscalNome}</div>
                    <div className="text-[9px] text-slate-500">
                      Matrícula: {termo.fiscalAssinanteMatricula || termo.matriculaFiscal} • Agente de Fiscalização {council.sigla}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cryptographic Hash Bar */}
              <div className="p-2 bg-slate-100 rounded-lg text-[9px] font-mono text-slate-600 flex flex-wrap items-center justify-between gap-1 border border-slate-200">
                <span className="flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-purple-600" />
                  <span>Hash Criptográfico: {termo.hashValidacaoDigital || 'SHA256:7FA8-902B-C421-ICPBR'}</span>
                </span>
                <span>Validação Eletrônica em {council.site}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs"
          >
            Fechar
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onOpenSignature(termo)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Tablet className="w-4 h-4" />
              <span>Assinar no Tablet</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Termo / Auto</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
