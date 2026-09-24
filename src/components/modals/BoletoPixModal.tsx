import React, { useState } from 'react';
import { X, Printer, Copy, CheckCircle2, QrCode } from 'lucide-react';
import { LancamentoFinanceiro } from '../../types';
import { storageService } from '../../services/storageService';

interface BoletoPixModalProps {
  lancamento: LancamentoFinanceiro | null;
  onClose: () => void;
}

export const BoletoPixModal: React.FC<BoletoPixModalProps> = ({ lancamento, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!lancamento) return null;
  const council = storageService.getCouncilConfig();

  const handleCopyPix = () => {
    navigator.clipboard.writeText(lancamento.pixCopiaECola);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 text-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2 text-amber-700 font-bold">
            <QrCode className="w-5 h-5" />
            <span className="text-sm">Guia de Arrecadação - Boleto FEBRABAN & Pix</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pix Section */}
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 text-center space-y-3">
          <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
            Pagamento Instantâneo via Pix (Baixa Automática)
          </span>

          <div className="w-36 h-36 bg-white p-2 rounded-xl mx-auto flex items-center justify-center shadow-xs border border-amber-200">
            <QrCode className="w-32 h-32 text-slate-900" />
          </div>

          <div className="space-y-0.5">
            <div className="text-xs text-slate-500">Valor do documento:</div>
            <div className="text-2xl font-bold font-mono text-amber-900">
              R$ {lancamento.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={lancamento.pixCopiaECola}
              className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-[10px] text-slate-600 font-mono"
            />
            <button
              onClick={handleCopyPix}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center space-x-1 whitespace-nowrap shadow-xs"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Pix'}</span>
            </button>
          </div>
        </div>

        {/* Boleto Section */}
        <div className="bg-slate-50 text-slate-900 p-4 rounded-xl space-y-3 font-sans border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="font-bold text-xs uppercase">Banco do Brasil S.A. | 001-9</div>
            <div className="font-mono text-[10px] font-bold text-slate-700">{lancamento.linhaDigitavel}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] border-b border-slate-200 pb-2">
            <div><strong>Beneficiário:</strong> {council.nomeCompleto} ({council.cnpj})</div>
            <div><strong>Vencimento:</strong> {lancamento.dataVencimento}</div>
            <div><strong>Sacado:</strong> {lancamento.targetNome} ({lancamento.targetDoc})</div>
            <div><strong>Valor Cobrado:</strong> R$ {lancamento.valorTotal.toFixed(2)}</div>
          </div>

          {/* Barcode visual */}
          <div className="pt-1 text-center font-mono text-xs tracking-widest bg-white border border-slate-200 p-2 rounded-lg">
            ||| | |||| | |||||| || |||||||| | |||| | |||||||||||| ||||
            <div className="text-[9px] text-slate-500 tracking-normal mt-0.5">{lancamento.codigoBarras}</div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold">
            Fechar
          </button>
          <button
            onClick={() => window.print()}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Boleto Bancário</span>
          </button>
        </div>
      </div>
    </div>
  );
};
