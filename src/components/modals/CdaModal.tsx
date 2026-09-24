import React from 'react';
import { X, Printer, Scale, ShieldCheck } from 'lucide-react';
import { ProcessoCobranca } from '../../types';
import { storageService } from '../../services/storageService';

interface CdaModalProps {
  cobranca: ProcessoCobranca | null;
  onClose: () => void;
}

export const CdaModal: React.FC<CdaModalProps> = ({ cobranca, onClose }) => {
  if (!cobranca) return null;
  const council = storageService.getCouncilConfig();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 text-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2 text-purple-700 font-bold">
            <Scale className="w-5 h-5" />
            <span className="text-sm">Certidão de Dívida Ativa (CDA) - Título Executivo Extrajudicial</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Official Printable CDA Document */}
        <div className="bg-slate-50 text-slate-950 p-6 sm:p-8 rounded-xl shadow-inner border border-slate-200 space-y-4 font-serif">
          <div className="text-center border-b-2 border-slate-900 pb-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-700">
              REPÚBLICA FEDERATIVA DO BRASIL • AUTARQUIA REGULADORA
            </div>
            <h2 className="text-sm font-bold uppercase text-slate-950 mt-1">
              {council.nomeCompleto} ({council.sigla})
            </h2>
            <div className="text-[12px] font-bold text-purple-950 mt-1 uppercase">
              CERTIDÃO DE DÍVIDA ATIVA Nº {cobranca.numeroCDA || 'CDA-2026/001'}
            </div>
            <div className="text-[10px] font-sans text-slate-500 mt-0.5">
              Inscrita no {cobranca.livroCDA || 'Livro 18-A'}, às {cobranca.folhaCDA || 'Fls. 142'} em {cobranca.dataCDA || new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>

          <div className="text-xs leading-relaxed text-justify space-y-2">
            <p>
              A PROCURADORIA JURÍDICA DO {council.nomeCompleto.toUpperCase()}, nos termos do art. 2º da Lei Federal nº 6.830/80 (Lei de Execução Fiscal) c/c Lei Federal nº 12.514/11 e art. 202 do Código Tributário Nacional (CTN), <strong>CERTIFICA</strong> que foi inscrito em Dívida Ativa o débito líquido, certo e exigível do devedor abaixo qualificado:
            </p>
          </div>

          {/* Devedor Box */}
          <div className="border border-slate-300 p-3.5 rounded-lg text-[11px] space-y-1 bg-white font-sans">
            <div><strong>Devedor:</strong> {cobranca.targetNome}</div>
            <div><strong>CPF / CNPJ:</strong> {cobranca.targetDoc}</div>
            <div><strong>Inscrição no Conselho:</strong> {cobranca.targetInscricao}</div>
            <div><strong>Fundamento Legal:</strong> Anuidades e Multas Inadimplidas (Art. 4º da Lei Federal 12.514/2011)</div>
            <div><strong>Valor Consolidado:</strong> <span className="font-mono font-bold text-rose-800 text-sm">R$ {cobranca.valorTotalDebito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span> (com juros moratórios, correção monetária pelo IPCA-E e encargos legais)</div>
          </div>

          <div className="text-[11px] leading-relaxed text-justify space-y-2">
            <p>
              Por ser expressão da verdade e constituir <strong>TÍTULO EXECUTIVO EXTRAJUDICIAL</strong> hábil para instruir Ação de Execução Fiscal perante a Justiça Federal da Seção Judiciária competente e Protesto Extrajudicial nos Tabelionatos de Notas e Protesto de Títulos, lavrou-se a presente Certidão.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-300 text-center font-sans text-[10px] space-y-1">
            <div className="font-bold uppercase text-slate-900">Procuradoria Geral do {council.sigla}</div>
            <div className="text-slate-500">Documento Assinado Eletronicamente com Certificado Digital ICP-Brasil</div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs">
            Fechar
          </button>
          <button
            onClick={() => window.print()}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Certidão (CDA)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
