import React, { useRef } from 'react';
import { X, Printer, ShieldCheck, AlertTriangle, Lock } from 'lucide-react';
import { Empresa, HorarioFuncionamentoItem, HorarioTrabalhoRT } from '../../types';
import { storageService } from '../../services/storageService';

interface CrtModalProps {
  empresa: Empresa | null;
  onClose: () => void;
}

const DIAS_SEMANA_CRT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const formatHorarioStr = (item?: { ativo?: boolean; inicio1?: string; fim1?: string; inicio2?: string; fim2?: string }): string => {
  if (!item || item.ativo === false || (!item.inicio1 && !item.inicio2)) {
    return '**************';
  }
  const parts: string[] = [];
  if (item.inicio1 && item.fim1) {
    parts.push(`${item.inicio1} AS ${item.fim1}`);
  }
  if (item.inicio2 && item.fim2) {
    parts.push(`${item.inicio2} AS ${item.fim2}`);
  }
  return parts.length > 0 ? parts.join(' / ') : '**************';
};

export const CrtModal: React.FC<CrtModalProps> = ({ empresa, onClose }) => {
  if (!empresa) return null;
  const council = storageService.getCouncilConfig();
  const documentRef = useRef<HTMLDivElement>(null);

  const isRegular = empresa.condicao === 'Regular';

  const handlePrint = () => {
    if (!isRegular) return;
    window.print();
  };

  const hoje = new Date();
  const diasSemana = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  
  const diaSemanaExtenso = diasSemana[hoje.getDay()];
  const diaExtenso = hoje.getDate();
  const mesExtenso = meses[hoje.getMonth()];
  const anoExtenso = hoje.getFullYear();
  const cidadeExtenso = (empresa.cidade || council.cidadeSede || 'MANAUS').toUpperCase();
  const dataExtensoFormatada = `${cidadeExtenso} , ${diaSemanaExtenso}, ${diaExtenso} de ${mesExtenso} de ${anoExtenso}`;

  const currentYear = anoExtenso;

  // Horários de Funcionamento
  const horariosFuncMap = new Map<string, HorarioFuncionamentoItem>();
  (empresa.horariosFuncionamento || []).forEach(h => {
    const key = h.dia.toLowerCase().slice(0, 3);
    horariosFuncMap.set(key, h);
  });

  const getFuncForDia = (diaNome: string) => {
    const key = diaNome.toLowerCase().slice(0, 3);
    return horariosFuncMap.get(key);
  };

  const getRtHorarioForDia = (rtHorarios: HorarioTrabalhoRT[] | undefined, diaNome: string) => {
    if (!rtHorarios) return undefined;
    const key = diaNome.toLowerCase().slice(0, 3);
    return rtHorarios.find(h => h.dia.toLowerCase().slice(0, 3) === key);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Modal Container */}
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full my-4 max-h-[96vh] overflow-y-auto shadow-2xl p-4 sm:p-6 text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0 print:max-h-none print:overflow-visible">
        
        {/* Modal Toolbar (Hidden during Print) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isRegular ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}>
              {isRegular ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm uppercase">Certidão de Regularidade Técnica (CRT) - {currentYear}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  isRegular ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  Condição: {empresa.condicao}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                {empresa.razaoSocial} • INSCRIÇÃO: {empresa.inscricao} • VALIDADE: 31/12/{currentYear}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isRegular ? (
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase shadow-sm flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Certidão Oficial</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs uppercase flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                <span>Emissão Vedada (Irregular)</span>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Blocking Alert when Company is NOT Regular */}
        {!isRegular && (
          <div className="mb-4 p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl shadow-xs print:hidden">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-extrabold text-rose-900 uppercase text-sm flex items-center gap-2">
                  <span>EMISSÃO DE CERTIDÃO DE REGULARIDADE BLOQUEADA</span>
                  <span className="px-2 py-0.5 bg-rose-200 text-rose-900 text-[10px] rounded font-mono">
                    STATUS: {empresa.condicao.toUpperCase()}
                  </span>
                </div>
                <p className="text-rose-800 font-medium leading-relaxed">
                  Conforme os artigos 22 e 24 da Lei Federal nº 3.820/60 e Lei Federal nº 13.021/2014, a <strong>Certidão de Regularidade Técnica (CRT)</strong> é um documento oficial comprobatório exclusivo para estabelecimentos na condição <strong>REGULAR</strong>.
                </p>
                <div className="p-2.5 bg-white/80 border border-rose-200 rounded-xl text-rose-950 font-semibold mt-2">
                  <span className="text-[10px] font-bold uppercase text-rose-700 block mb-0.5">Motivo / Auditoria de Irregularidade:</span>
                  {empresa.justificativaCondicao || 'O estabelecimento não atende aos requisitos de assistência farmacêutica plena/obrigatória ou encontra-se sem farmacêutico responsável técnico devidamente homologado.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PÁGINA 1 DA CERTIDÃO DE REGULARIDADE (LAYOUT FEDERAL CFF / CRF)           */}
        {/* ========================================================================= */}
        <div 
          ref={documentRef}
          className={`bg-white text-black p-6 sm:p-8 border-2 border-black max-w-[820px] mx-auto shadow-sm print:border-none print:shadow-none print:p-0 print:max-w-none text-[11px] leading-tight font-sans select-text relative ${
            !isRegular ? 'opacity-75' : ''
          }`}
          style={{ fontFamily: 'Arial, Helvetica, sans-serif', pageBreakAfter: 'always' }}
        >
          {/* Watermark for Non-Regular */}
          {!isRegular && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
              <div className="transform -rotate-25 border-4 border-dashed border-rose-600/60 text-rose-600/60 bg-rose-50/70 p-6 rounded-3xl text-center shadow-lg backdrop-blur-xs">
                <span className="block text-2xl sm:text-3xl font-black uppercase tracking-widest">
                  DOCUMENTO INVÁLIDO
                </span>
                <span className="block text-xs sm:text-sm font-bold uppercase tracking-wider mt-1">
                  ESTABELECIMENTO {empresa.condicao.toUpperCase()} • EMISSÃO VEDADA
                </span>
              </div>
            </div>
          )}

          {/* CABEÇALHO FEDERAL COM DOIS LOGOS (BRASÃO REPÚBLICA + SÍMBOLO FARMÁCIA) */}
          <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-3 relative">
            {/* Esquerda: Brasão da República */}
            <div className="w-16 flex justify-center">
              <svg className="w-14 h-14 text-slate-900" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="46" stroke="#000" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx="50" cy="50" r="41" stroke="#000" strokeWidth="1.5" />
                <polygon points="50,14 59,38 85,38 64,54 72,78 50,63 28,78 36,54 15,38 41,38" fill="#fff" stroke="#000" strokeWidth="2" />
                <circle cx="50" cy="49" r="16" fill="#1e293b" stroke="#000" strokeWidth="1.5" />
                <circle cx="50" cy="40" r="1.8" fill="#fff" />
                <circle cx="50" cy="56" r="1.8" fill="#fff" />
                <circle cx="43" cy="48" r="1.8" fill="#fff" />
                <circle cx="57" cy="47" r="1.8" fill="#fff" />
                <line x1="50" y1="8" x2="50" y2="90" stroke="#000" strokeWidth="2" />
                <rect x="42" y="80" width="16" height="4" fill="#000" rx="1" />
              </svg>
            </div>

            {/* Centro: Títulos Federais */}
            <div className="text-center flex-1 px-2">
              <h1 className="text-[11px] font-bold tracking-wider uppercase text-black">
                SERVIÇO PÚBLICO FEDERAL
              </h1>
              <h2 className="text-[11px] font-bold tracking-wider uppercase text-black">
                CONSELHO FEDERAL DE FARMÁCIA
              </h2>
              <h3 className="text-[14px] font-extrabold uppercase mt-1 tracking-tight text-black">
                CERTIDÃO DE REGULARIDADE
              </h3>
              <div className="text-[24px] font-black tracking-tight text-black mt-0.5" style={{ fontFamily: 'Times New Roman, serif' }}>
                {currentYear}
              </div>
            </div>

            {/* Direita: Símbolo / Brasão da Farmácia (Taça de Hígia) */}
            <div className="w-16 flex justify-center">
              <svg className="w-14 h-14 text-emerald-800" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="46" stroke="#065f46" strokeWidth="2" />
                <path d="M32 28 H68 V44 C68 60 56 68 50 78 C44 68 32 60 32 44 Z" fill="#065f46" />
                <path d="M40 28 H60 V22 H40 Z" fill="#065f46" />
                <path d="M50 38 Q60 48 40 58 Q60 68 50 76" stroke="#fff" strokeWidth="3.5" fill="none" />
              </svg>
            </div>
          </div>

          {/* TABELA DE IDENTIFICAÇÃO DO ESTABELECIMENTO E QR CODE */}
          <div className="border-2 border-black mb-3">
            {/* Linha 1: Cadastro + Regional + QR Code Box */}
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-8 flex flex-col justify-between">
                <div className="grid grid-cols-12 border-b border-black">
                  <div className="col-span-8 p-1.5 border-r border-black">
                    <span className="block font-bold text-[9px] uppercase text-black">CADASTRO NO CRF SOB Nº</span>
                    <span className="font-bold text-[12px] font-mono text-black">
                      {empresa.inscricao.replace(/[^0-9]/g, '') || empresa.inscricao}
                    </span>
                  </div>
                  <div className="col-span-4 p-1.5">
                    <span className="block font-bold text-[9px] uppercase text-black">REGIONAL</span>
                    <span className="font-bold text-[12px] uppercase text-black">{empresa.uf || council.uf || 'AM'}</span>
                  </div>
                </div>

                <div className="p-1.5 border-b border-black">
                  <span className="block font-bold text-[9px] uppercase text-black">RAZÃO/DENOMINAÇÃO SOCIAL</span>
                  <span className="font-bold text-[11px] uppercase text-black">{empresa.razaoSocial}</span>
                </div>

                <div className="p-1.5">
                  <span className="block font-bold text-[9px] uppercase text-black">NOME DE FANTASIA</span>
                  <span className="font-bold text-[11px] uppercase text-black">{empresa.nomeFantasia || empresa.razaoSocial}</span>
                </div>
              </div>

              {/* Box QR Code Oficial com Repositório */}
              <div className="col-span-4 border-l border-black p-2 flex flex-col items-center justify-center text-center bg-slate-50/50">
                <span className="text-[7.5px] font-bold uppercase text-slate-900 leading-tight mb-1 text-center">
                  Confira a validade deste documento, escaneando o código
                </span>
                
                {/* QR Code Visual Oficial */}
                <div className="w-18 h-18 bg-white border border-black p-1 flex items-center justify-center shadow-xs">
                  <svg className="w-full h-full" viewBox="0 0 100 100" fill="black">
                    <rect x="0" y="0" width="28" height="28" fill="black" />
                    <rect x="4" y="4" width="20" height="20" fill="white" />
                    <rect x="8" y="8" width="12" height="12" fill="black" />

                    <rect x="72" y="0" width="28" height="28" fill="black" />
                    <rect x="76" y="4" width="20" height="20" fill="white" />
                    <rect x="80" y="8" width="12" height="12" fill="black" />

                    <rect x="0" y="72" width="28" height="28" fill="black" />
                    <rect x="4" y="76" width="20" height="20" fill="white" />
                    <rect x="8" y="80" width="12" height="12" fill="black" />

                    <rect x="34" y="8" width="6" height="6" />
                    <rect x="46" y="8" width="6" height="6" />
                    <rect x="58" y="8" width="6" height="6" />
                    <rect x="34" y="20" width="6" height="6" />
                    <rect x="46" y="20" width="6" height="6" />
                    <rect x="8" y="34" width="6" height="6" />
                    <rect x="20" y="34" width="6" height="6" />
                    <rect x="34" y="34" width="6" height="6" />
                    <rect x="46" y="34" width="6" height="6" />
                    <rect x="58" y="34" width="6" height="6" />
                    <rect x="70" y="34" width="6" height="6" />
                    <rect x="82" y="34" width="6" height="6" />
                    <rect x="8" y="46" width="6" height="6" />
                    <rect x="26" y="46" width="6" height="6" />
                    <rect x="38" y="46" width="6" height="6" />
                    <rect x="50" y="46" width="6" height="6" />
                    <rect x="62" y="46" width="6" height="6" />
                    <rect x="74" y="46" width="6" height="6" />
                    <rect x="86" y="46" width="6" height="6" />
                    <rect x="8" y="58" width="6" height="6" />
                    <rect x="20" y="58" width="6" height="6" />
                    <rect x="34" y="58" width="6" height="6" />
                    <rect x="46" y="58" width="6" height="6" />
                    <rect x="58" y="58" width="6" height="6" />
                    <rect x="70" y="58" width="6" height="6" />
                    <rect x="34" y="70" width="6" height="6" />
                    <rect x="46" y="70" width="6" height="6" />
                    <rect x="70" y="70" width="6" height="6" />
                    <rect x="82" y="70" width="6" height="6" />
                    <rect x="34" y="82" width="6" height="6" />
                    <rect x="46" y="82" width="6" height="6" />
                    <rect x="58" y="82" width="6" height="6" />
                    <rect x="70" y="82" width="6" height="6" />
                    <rect x="82" y="82" width="6" height="6" />
                  </svg>
                </div>

                <div className="mt-1 text-center">
                  <span className="block font-bold text-[8px] uppercase text-black">Repositório</span>
                  <span className="font-mono font-bold text-[8.5px] text-slate-800">468fd23bc862407</span>
                </div>
              </div>
            </div>

            {/* Linha: Tipo de Estabelecimento */}
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-12 p-1.5">
                <span className="block font-bold text-[9px] uppercase text-black">TIPO DE ESTABELECIMENTO</span>
                <span className="font-bold text-[10px] uppercase text-black">{empresa.tipoEstabelecimento || 'DROGARIA / FARMÁCIA'}</span>
              </div>
            </div>

            {/* Linha: Natureza de Atividade */}
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-12 p-1.5">
                <span className="block font-bold text-[9px] uppercase text-black">NATUREZA DE ATIVIDADE</span>
                <span className="font-bold text-[10px] uppercase text-black">{empresa.naturezaAtividade || 'DISPENSAÇÃO DE MEDICAMENTOS'}</span>
              </div>
            </div>

            {/* Linha: Endereço & CNPJ */}
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-8 p-1.5 border-r border-black">
                <span className="block font-bold text-[9px] uppercase text-black">ENDEREÇO</span>
                <span className="font-bold text-[10px] uppercase text-black">{empresa.endereco}</span>
              </div>
              <div className="col-span-4 p-1.5">
                <span className="block font-bold text-[9px] uppercase text-black">CNPJ</span>
                <span className="font-bold text-[10px] font-mono text-black">{empresa.cnpj}</span>
              </div>
            </div>

            {/* Linha: Localidade (Bairro) & Cidade/UF */}
            <div className="grid grid-cols-12">
              <div className="col-span-6 p-1.5 border-r border-black">
                <span className="block font-bold text-[9px] uppercase text-black">LOCALIDADE</span>
                <span className="font-bold text-[10px] uppercase text-black">{empresa.bairro || 'CENTRO'}</span>
              </div>
              <div className="col-span-6 p-1.5">
                <span className="block font-bold text-[9px] uppercase text-black">CIDADE</span>
                <span className="font-bold text-[10px] uppercase text-black">
                  {empresa.cidade || 'MANAUS'} - {empresa.uf || 'AM'}
                </span>
              </div>
            </div>
          </div>

          {/* TABELA: HORÁRIO FUNCIONAMENTO */}
          <div className="border-2 border-black mb-3">
            <div className="bg-white border-b border-black py-1 text-center font-black uppercase text-[11px] tracking-wider text-black">
              HORÁRIO FUNCIONAMENTO
            </div>
            
            <div className="grid grid-cols-7 border-b border-black text-center font-bold text-[9px] uppercase bg-slate-50/50">
              {DIAS_SEMANA_CRT.map((dia, idx) => (
                <div key={dia} className={`p-1 ${idx < 6 ? 'border-r border-black' : ''}`}>
                  {dia}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 text-center font-mono font-bold text-[9px] text-black">
              {DIAS_SEMANA_CRT.map((dia, idx) => {
                const item = getFuncForDia(dia);
                return (
                  <div key={dia} className={`p-1.5 flex items-center justify-center min-h-[28px] ${idx < 6 ? 'border-r border-black' : ''}`}>
                    {formatHorarioStr(item)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* TABELA: RESPONSÁVEL(IS) TÉCNICO(S) */}
          <div className="border-2 border-black mb-4">
            <div className="bg-white border-b border-black py-1 text-center font-black uppercase text-[11px] tracking-wider text-black">
              RESPONSÁVEL(IS) TÉCNICO(S)
            </div>

            {(!empresa.responsaveisTecnicos || empresa.responsaveisTecnicos.length === 0) ? (
              <div className="p-4 text-center text-[10px] font-bold uppercase text-red-600">
                NENHUM RESPONSÁVEL TÉCNICO HOMOLOGADO REGULARMENTE
              </div>
            ) : (
              empresa.responsaveisTecnicos.map((rt, rtIdx) => (
                <div key={rtIdx} className={rtIdx > 0 ? 'border-t-2 border-black' : ''}>
                  {/* Cabeçalho do RT */}
                  <div className="grid grid-cols-12 border-b border-black text-center font-bold text-[8px] uppercase bg-slate-50/60">
                    <div className="col-span-1 p-1 border-r border-black">TIPO</div>
                    <div className="col-span-2 p-1 border-r border-black">INSCRIÇÃO</div>
                    <div className="col-span-5 p-1 border-r border-black text-left px-2">NOME</div>
                    <div className="col-span-2 p-1 border-r border-black">FUNÇÃO</div>
                    <div className="col-span-2 p-1">SITUAÇÃO</div>
                  </div>

                  {/* Dados do RT */}
                  <div className="grid grid-cols-12 border-b border-black text-center font-bold text-[10px] text-black">
                    <div className="col-span-1 p-1.5 border-r border-black font-mono">
                      {rt.tipo || 'F'}
                    </div>
                    <div className="col-span-2 p-1.5 border-r border-black font-mono text-left px-2">
                      {rt.profissionalInscricao.replace(/[^0-9]/g, '') || rt.profissionalInscricao}
                    </div>
                    <div className="col-span-5 p-1.5 border-r border-black text-left px-2 uppercase truncate">
                      {rt.profissionalNome}
                    </div>
                    <div className="col-span-2 p-1.5 border-r border-black uppercase text-[9px] truncate">
                      {rt.cargo || 'RESPONSÁVEL TÉCNICO'}
                    </div>
                    <div className="col-span-2 p-1.5 uppercase text-[9px]">
                      {rt.situacaoVinculo || 'CTPS'}
                    </div>
                  </div>

                  {/* Dias da Semana para este RT */}
                  <div className="grid grid-cols-7 border-b border-black text-center font-bold text-[8px] uppercase bg-slate-50/40">
                    {DIAS_SEMANA_CRT.map((dia, idx) => (
                      <div key={dia} className={`p-1 ${idx < 6 ? 'border-r border-black' : ''}`}>
                        {dia}
                      </div>
                    ))}
                  </div>

                  {/* Grade de Horário de Assistência deste RT */}
                  <div className="grid grid-cols-7 text-center font-mono font-bold text-[9px] text-black">
                    {DIAS_SEMANA_CRT.map((dia, idx) => {
                      const item = getRtHorarioForDia(rt.horarios, dia);
                      return (
                        <div key={dia} className={`p-1.5 flex items-center justify-center min-h-[26px] ${idx < 6 ? 'border-r border-black' : ''}`}>
                          {formatHorarioStr(item)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DESPACHO, ASSINATURA E AVISOS */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row justify-between items-end gap-2 text-[10px]">
              <div className="font-bold text-[10px] uppercase text-black">
                {council.nomeCompleto} - {council.sigla}
              </div>
              <div className="font-bold uppercase text-[10px] text-black text-right">
                {dataExtensoFormatada}
              </div>
            </div>

            {/* Bloco de Assinatura do Presidente */}
            <div className="flex justify-end pt-2">
              <div className="w-64 text-center">
                <div className="h-10 flex items-center justify-center relative">
                  <svg className="w-44 h-9 text-slate-900 opacity-90" viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 28 C 30 10, 50 35, 75 18 C 90 8, 105 32, 130 15 C 145 5, 160 38, 190 20" stroke="#000" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M40 32 C 60 25, 90 28, 120 22" stroke="#000" strokeWidth="1.2" />
                  </svg>
                </div>
                <div className="border-t border-black pt-1">
                  <div className="font-bold uppercase text-[10px] text-black">
                    {council.presidente || 'REGINALDO DA SILVA COSTA'}
                  </div>
                  <div className="text-[9px] uppercase font-semibold text-slate-700">
                    PRESIDENTE DO {council.sigla}
                  </div>
                </div>
              </div>
            </div>

            {/* Aviso em Destaque */}
            <div className="bg-black text-white text-center font-black py-1.5 px-3 uppercase text-[10px] tracking-wider">
              ESTA CERTIDÃO DEVE SER AFIXADA EM UM LUGAR BEM VISÍVEL AO PÚBLICO
            </div>

            {/* Texto Legal de Certificação */}
            <div className="text-[8.5px] leading-snug text-justify text-slate-800 space-y-1">
              <p>
                Certificamos que o estabelecimento a que se refere esta Certidão de Regularidade está registrado neste Conselho Regional de Farmácia, atendendo o que dispõem os artigos 22, parágrafo único e 24, da Lei no 3.820/60. Tratando-se de Farmácia e Drogaria, certificamos que está regularizada em sua atividade durante os horários estabelecidos pelo(s) Farmacêutico(s) Responsável(is) Técnico(s), de acordo com os artigos 2º, 3º Caput, 5º, 6º Inciso I, todos da Lei 13.021/14.
              </p>
              <p>
                Por ocasião de mudanças no quadro de assistência farmacêutica, este documento deverá ser retirado pelo Responsável Técnico interessado e encaminhado para o respectivo CRF para as devidas alterações.
              </p>
            </div>

            {/* Paginação */}
            <div className="flex justify-between text-[8.5px] font-mono text-slate-600 pt-1">
              <span className="font-semibold">VALIDADE EXCLUSIVA PARA O EXERCÍCIO DE {currentYear} (EXPIRA EM 31/12/{currentYear})</span>
              <span>Página 1 de 2</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PÁGINA 2 DA CERTIDÃO DE REGULARIDADE (TERMO DE DEVOLUÇÃO E ÉTICA)         */}
        {/* ========================================================================= */}
        <div 
          className="bg-white text-black p-6 sm:p-8 border-2 border-black max-w-[820px] mx-auto shadow-sm print:border-none print:shadow-none print:p-0 print:max-w-none text-[11px] leading-tight font-sans select-text mt-8 print:mt-0"
          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        >
          {/* Observações */}
          <div className="border border-black rounded-lg p-3 mb-4 space-y-1.5">
            <span className="font-bold uppercase block text-[10px] text-black">Observações:</span>
            <p className="text-[9.5px] leading-relaxed text-slate-800">
              <strong>1</strong> - Por infração a qualquer norma relativa à atividade profissional, perderá este documento seu valor, podendo o Conselho Regional de Farmácia determinar o seu recolhimento.
            </p>
            <p className="text-[9.5px] leading-relaxed text-slate-800">
              <strong>2</strong> - A baixa de Responsabilidade Técnica (RT) deverá ser comunicada pelo profissional ao Conselho Regional de Farmácia e à Vigilância Sanitária correspondente.
            </p>
            <p className="text-[9.5px] leading-relaxed text-slate-800">
              <strong>3</strong> - Na baixa de Responsabilidade Técnica (RT) será obrigatória a devolução deste documento ao Conselho Regional de Farmácia.
            </p>
          </div>

          {/* Termo de Devolução */}
          <div className="border border-black rounded-lg p-3 mb-4 space-y-3">
            <div className="font-bold uppercase text-[10px] text-black border-b border-black pb-1">
              Termo de Devolução:
            </div>
            <div className="text-[9.5px] leading-relaxed space-y-2">
              <p>
                Ao CRF – <span className="font-mono font-bold">{council.sigla || 'CRF-AM'}</span>
              </p>
              <p>
                Eu, <span className="underline decoration-dotted font-bold">___________________________________________________</span>, inscrito(a) neste órgão sob o nº <span className="underline decoration-dotted font-mono font-bold">__________</span>, comunico que a partir desta data de demissão <span className="underline decoration-dotted font-mono">___/___/_____</span>, deixo de exercer a função de <span className="underline decoration-dotted font-bold">__________________</span> pelo estabelecimento de razão social <span className="underline decoration-dotted font-bold">{empresa.razaoSocial}</span>, recolhendo e devolvendo esta CRT para as providências cabíveis do Conselho Regional de Farmácia.
              </p>
            </div>

            <div className="grid grid-cols-3 pt-6 text-center text-[9px] font-bold">
              <div className="border-t border-black pt-1 mx-2">Local</div>
              <div className="border-t border-black pt-1 mx-2">Data da Comunicação</div>
              <div className="border-t border-black pt-1 mx-2">Assinatura do Farmacêutico</div>
            </div>
          </div>

          {/* Declaração de Motivo */}
          <div className="border border-black rounded-lg p-3 mb-4 space-y-2">
            <span className="font-bold uppercase text-[9.5px] text-black block">
              Declaro, ainda, que deixo esta responsabilidade pelo seguinte motivo:
            </span>
            <div className="space-y-3 pt-2">
              <div className="border-b border-dotted border-black h-4"></div>
              <div className="border-b border-dotted border-black h-4"></div>
              <div className="border-b border-dotted border-black h-4"></div>
            </div>
          </div>

          {/* Código de Ética Farmacêutica */}
          <div className="border border-black rounded-lg p-3 mb-3 space-y-2 bg-slate-50/40">
            <div className="text-center font-bold uppercase text-[10px] text-black tracking-wider">
              CÓDIGO DE ÉTICA FARMACÊUTICA
            </div>
            <div className="text-center font-semibold uppercase text-[9px] text-slate-700">
              Resolução CFF 724/2022
            </div>

            <div className="text-[8.5px] leading-tight text-justify text-slate-800 space-y-1.5 pt-1">
              <p>
                <strong>Art. 15</strong> - Todos os inscritos em um CRF, independentemente de estar ou não no exercício efetivo da profissão, devem:
              </p>
              <p className="pl-3">
                <strong>(...)</strong>
              </p>
              <p className="pl-3">
                <strong>V</strong> - comunicar ao CRF e às autoridades competentes a recusa em se submeter à prática de atividade contrária à lei ou regulamento, bem como a desvinculação do cargo, função ou emprego, motivada pela necessidade de preservar os legítimos interesses da profissão e da saúde;
              </p>
              <p className="pl-3">
                <strong>XII</strong> - comunicar formalmente ao CRF, em até 5 (cinco) dias úteis, o encerramento de seu vínculo profissional de qualquer natureza, independentemente de retenção de documentos pelo empregador;
              </p>
              <p className="pt-1">
                <strong>Art. 16</strong> - O farmacêutico deve comunicar formalmente ao CRF, pelas maneiras disponíveis definidas pelo respectivo regional, o seu afastamento temporário das atividades profissionais pelas quais detém responsabilidade/ assistência técnica, quando não houver outro farmacêutico que, legalmente, o substitua. <strong>§ 1º</strong> - Na hipótese de afastamento por motivo de doença, acidente pessoal, licença maternidade, óbito de familiar ou por outro imprevisível, que requeira avaliação pelo CRF, a comunicação formal e documentada deverá ocorrer em até 5 (cinco) dias úteis após o fato, acompanhada de documentos comprobatórios válidos pela legislação vigente.
              </p>
              <p>
                <strong>§ 2º</strong> - Quando o afastamento ocorrer por motivo previamente agendado, como férias, congressos e cursos de aperfeiçoamento relacionados à área de atuação farmacêutica, a comunicação ao CRF deverá ocorrer com antecedência mínima de 12 (doze) horas.
              </p>
            </div>
          </div>

          {/* Paginação Página 2 */}
          <div className="flex justify-between text-[8.5px] font-mono text-slate-600 pt-1">
            <span className="font-semibold">CERTIDÃO DE REGULARIDADE TÉCNICA - EXERCÍCIO {currentYear}</span>
            <span>Página 2 de 2</span>
          </div>
        </div>

        {/* Footer Buttons (Hidden during Print) */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200 mt-4 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase cursor-pointer"
          >
            Fechar
          </button>
          
          {isRegular ? (
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Certidão Oficial</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-rose-700 font-bold uppercase">
                Impossível emitir: Estabelecimento {empresa.condicao}
              </span>
              <button
                type="button"
                disabled
                className="px-5 py-2.5 bg-slate-200 text-slate-400 rounded-xl font-bold text-xs uppercase flex items-center space-x-1.5 cursor-not-allowed"
              >
                <Lock className="w-4 h-4" />
                <span>Impressão Bloqueada</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
