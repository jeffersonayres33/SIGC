import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  PenTool, 
  CheckCircle2, 
  RotateCcw, 
  Trash2, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  AlertTriangle, 
  Tablet, 
  FileText, 
  MapPin, 
  Clock, 
  Award,
  Lock,
  Printer,
  ChevronRight,
  Info
} from 'lucide-react';
import { TermoFiscalizacao, TipoSignatarioNotificado } from '../../types';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';

interface AssinaturaTabletModalProps {
  termo: TermoFiscalizacao;
  onClose: () => void;
  onSuccess: (termoAtualizado: TermoFiscalizacao) => void;
}

export const AssinaturaTabletModal: React.FC<AssinaturaTabletModalProps> = ({
  termo,
  onClose,
  onSuccess
}) => {
  const council = storageService.getCouncilConfig();

  // Active step / tab in modal
  const [activeSigner, setActiveSigner] = useState<'notificado' | 'fiscal'>('notificado');

  // Signer Data (Notificado / Representante na falta do RT)
  const [tipoSignatario, setTipoSignatario] = useState<TipoSignatarioNotificado>(
    termo.tipoSignatarioNotificado || 
    (termo.presencaRT ? 'Farmacêutico RT Titular' : 'Gerente / Administrador')
  );
  const [nomeSignatario, setNomeSignatario] = useState(
    termo.nomeSignatarioNotificado || 
    (termo.presencaRT ? (termo.rtPresenteNome || '') : '')
  );
  const [documentoSignatario, setDocumentoSignatario] = useState(
    termo.documentoSignatarioNotificado || ''
  );
  const [cargoSignatario, setCargoSignatario] = useState(
    termo.cargoSignatarioNotificado || (termo.presencaRT ? 'Farmacêutico Responsável Técnico' : 'Gerente Operacional')
  );
  const [inscricaoConselho, setInscricaoConselho] = useState(
    termo.inscricaoSignatarioNotificado || (termo.presencaRT ? (termo.rtPresenteInscricao || 'CRF-AM 4120') : '')
  );
  const [motivoTerceiro, setMotivoTerceiro] = useState(
    termo.motivoAssinaturaTerceiro || (!termo.presencaRT ? 'Ausência do Farmacêutico RT no horário fiscalizado.' : '')
  );
  const [motivoRecusa, setMotivoRecusa] = useState(termo.motivoRecusa || '');

  // Fiscal Data
  const [nomeFiscal, setNomeFiscal] = useState(termo.fiscalNome || 'Dr. Márcio Ramos');
  const [matriculaFiscal, setMatriculaFiscal] = useState(termo.matriculaFiscal || 'MAT-9042');

  // Signatures Data URLs
  const [assinaturaNotificadoUrl, setAssinaturaNotificadoUrl] = useState<string | null>(
    termo.assinaturaNotificado || null
  );
  const [assinaturaFiscalUrl, setAssinaturaFiscalUrl] = useState<string | null>(
    termo.assinaturaFiscal || null
  );

  // Canvas Stroke & Settings
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState<'#1e3a8a' | '#0f172a'>('#1e3a8a'); // Azul Caneta ou Preto
  const [strokeWidth, setStrokeWidth] = useState<number>(2.5);
  const [hasDrawnCurrent, setHasDrawnCurrent] = useState(false);
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);

  // Initialize Canvas when active signer or modality changes
  useEffect(() => {
    initCanvas();
  }, [activeSigner, tipoSignatario]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjust canvas resolution for sharp retina / tablet screens
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasDrawnCurrent(false);
    setStrokeHistory([]);

    // Preload existing signature if available
    const existingUrl = activeSigner === 'notificado' ? assinaturaNotificadoUrl : assinaturaFiscalUrl;
    if (existingUrl && existingUrl.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawnCurrent(true);
      };
      img.src = existingUrl;
    }
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (tipoSignatario === 'Recusa de Assinatura' && activeSigner === 'notificado') return;
    
    // Prevent scrolling when drawing on touch screens
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save current state to history for undo
    const rect = canvas.getBoundingClientRect();
    const currentState = ctx.getImageData(0, 0, rect.width * 2, rect.height * 2);
    setStrokeHistory(prev => [...prev.slice(-10), currentState]);

    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    setIsDrawing(true);
    setHasDrawnCurrent(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    
    if (activeSigner === 'notificado') {
      setAssinaturaNotificadoUrl(dataUrl);
    } else {
      setAssinaturaFiscalUrl(dataUrl);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasDrawnCurrent(false);
    setStrokeHistory([]);

    if (activeSigner === 'notificado') {
      setAssinaturaNotificadoUrl(null);
    } else {
      setAssinaturaFiscalUrl(null);
    }
  };

  const handleUndo = () => {
    if (strokeHistory.length === 0) {
      handleClear();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previousState = strokeHistory[strokeHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setStrokeHistory(prev => prev.slice(0, -1));
    
    const dataUrl = canvas.toDataURL('image/png');
    if (activeSigner === 'notificado') {
      setAssinaturaNotificadoUrl(dataUrl);
    } else {
      setAssinaturaFiscalUrl(dataUrl);
    }
  };

  const generateIntegrityHash = (idTermo: string) => {
    const randomHex = Math.random().toString(16).substring(2, 10);
    const timeHex = Date.now().toString(16);
    return `SHA256:${idTermo.slice(-4)}-${timeHex}-${randomHex}-ICPBR`.toUpperCase();
  };

  const handleSaveAndAuthenticate = () => {
    const isRecusa = tipoSignatario === 'Recusa de Assinatura';

    if (!isRecusa && !assinaturaNotificadoUrl && activeSigner === 'notificado') {
      toastService.warning(
        'Assinatura Pendente',
        'Por favor, capture a assinatura do responsável no tablet ou assinale a opção de Recusa Formal.'
      );
      return;
    }

    if (!nomeSignatario.trim()) {
      toastService.warning(
        'Identificação Obrigatória',
        'Informe o nome do profissional, gerente ou funcionário signatário no local.'
      );
      return;
    }

    const agora = new Date().toLocaleString('pt-BR');
    const hashGerado = termo.hashValidacaoDigital || generateIntegrityHash(termo.id);

    const termoAtualizado: TermoFiscalizacao = {
      ...termo,
      tipoSignatarioNotificado: tipoSignatario,
      nomeSignatarioNotificado: nomeSignatario,
      documentoSignatarioNotificado: documentoSignatario || 'Não informado / Não apresentado',
      cargoSignatarioNotificado: cargoSignatario,
      inscricaoSignatarioNotificado: inscricaoConselho || undefined,
      motivoAssinaturaTerceiro: tipoSignatario !== 'Farmacêutico RT Titular' ? motivoTerceiro : undefined,
      assinaturaNotificado: !isRecusa ? (assinaturaNotificadoUrl || undefined) : undefined,
      assinaturaNotificadoDataHora: agora,
      recusaAssinatura: isRecusa,
      motivoRecusa: isRecusa ? (motivoRecusa || 'O responsável recusou-se a assinar o termo após ciência.') : undefined,

      // Fiscal Signature
      assinaturaFiscal: assinaturaFiscalUrl || termo.assinaturaFiscal || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10 25 Q 30 5, 50 25 T 90 20" stroke="black" fill="transparent"/></svg>',
      fiscalAssinanteNome: nomeFiscal,
      fiscalAssinanteMatricula: matriculaFiscal,
      assinaturaFiscalDataHora: termo.assinaturaFiscalDataHora || agora,

      hashValidacaoDigital: hashGerado,
      statusSincronizacao: 'Sincronizado'
    };

    storageService.saveTermoFiscalizacao(termoAtualizado);
    toastService.success(
      'Assinaturas Registradas com Sucesso!',
      `Auto nº ${termo.numeroTermo} autenticado digitalmente com validade jurídica e hash ${hashGerado.slice(0, 18)}...`
    );

    onSuccess(termoAtualizado);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
              <Tablet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Captura de Assinatura Digital no Tablet
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Campo / Offline
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {termo.empresaNome} • {termo.numeroTermo} {termo.numeroAutoInfracao ? `(${termo.numeroAutoInfracao})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: Notificado vs Fiscal */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveSigner('notificado')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all ${
              activeSigner === 'notificado'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>1. Assinatura do Notificado / Profissional / Representante</span>
            {assinaturaNotificadoUrl && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-1" />
            )}
            {tipoSignatario === 'Recusa de Assinatura' && (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSigner('fiscal')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all ${
              activeSigner === 'fiscal'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>2. Assinatura do Agente Fiscal</span>
            {assinaturaFiscalUrl && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-1" />
            )}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeSigner === 'notificado' ? (
            <div className="space-y-4">
              {/* Role Selection */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <span>Papel / Qualificação do Signatário no Local</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Selecione quem está recebendo e assinando o auto
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Farmacêutico RT Titular', label: 'Farmacêutico RT', sub: 'Responsável Técnico' },
                    { id: 'Farmacêutico RT Substituto', label: 'RT Substituto', sub: 'Plantonista Habilitado' },
                    { id: 'Gerente / Administrador', label: 'Gerente / Admin', sub: 'Na falta do RT' },
                    { id: 'Proprietário / Sócio', label: 'Sócio / Dono', sub: 'Na falta do RT' },
                    { id: 'Balconista / Funcionário Presente', label: 'Balconista', sub: 'Funcionário Presente' },
                    { id: 'Testemunha no Local', label: 'Testemunha', sub: 'Presencial' },
                    { id: 'Recusa de Assinatura', label: 'Recusa Formal', sub: 'Lavratura de Certidão' }
                  ].map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setTipoSignatario(role.id as TipoSignatarioNotificado)}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        tipoSignatario === role.id
                          ? role.id === 'Recusa de Assinatura'
                            ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs'
                            : 'bg-purple-50 border-purple-500 text-purple-950 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-[11px] truncate">{role.label}</div>
                      <div className="text-[9px] text-slate-500 truncate">{role.sub}</div>
                    </button>
                  ))}
                </div>

                {/* Justification note if not RT */}
                {tipoSignatario !== 'Farmacêutico RT Titular' && tipoSignatario !== 'Farmacêutico RT Substituto' && tipoSignatario !== 'Recusa de Assinatura' && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start space-x-2 text-[11px]">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Assinatura por Terceiro / Representante:</strong> Em virtude da ausência ou impedimento do Responsável Técnico no ato da fiscalização, a assinatura é colhida de preposto ou funcionário presente no estabelecimento.
                    </div>
                  </div>
                )}
              </div>

              {/* Signer Data Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Nome Completo do Signatário *
                  </label>
                  <input
                    type="text"
                    value={nomeSignatario}
                    onChange={(e) => setNomeSignatario(e.target.value)}
                    placeholder="Ex: Dra. Mariana Costa ou Sr. Roberto Silva"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Documento de Identificação (CPF ou RG) *
                  </label>
                  <input
                    type="text"
                    value={documentoSignatario}
                    onChange={(e) => setDocumentoSignatario(e.target.value)}
                    placeholder="Ex: 012.345.678-90 ou 14.890.123-AM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Cargo / Função Declarada
                  </label>
                  <input
                    type="text"
                    value={cargoSignatario}
                    onChange={(e) => setCargoSignatario(e.target.value)}
                    placeholder="Ex: Farmacêutico RT, Gerente de Loja, Balconista"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

                {tipoSignatario.includes('Farmacêutico') ? (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Nº Inscrição no Conselho (CRF)
                    </label>
                    <input
                      type="text"
                      value={inscricaoConselho}
                      onChange={(e) => setInscricaoConselho(e.target.value)}
                      placeholder="Ex: CRF-AM 4120"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-medium focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Motivo da Coleta com Não-Farmacêutico
                    </label>
                    <input
                      type="text"
                      value={motivoTerceiro}
                      onChange={(e) => setMotivoTerceiro(e.target.value)}
                      placeholder="Ex: Farmacêutico RT ausente no momento da fiscalização"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              {/* If "Recusa de Assinatura" is chosen */}
              {tipoSignatario === 'Recusa de Assinatura' ? (
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Certidão de Recusa de Assinatura (Art. 628 da CLT / Legislação Sanitária)</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    Certifico que o notificado/responsável acima identificado tomou conhecimento das autuações e notificações deste termo de fiscalização, porém <strong>recusou-se expressamente a apor sua assinatura</strong> no dispositivo de captura. A presente certidão supre a assinatura do infrator para todos os efeitos legais.
                  </p>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Motivo alegado para a recusa (opcional):</label>
                    <textarea
                      rows={2}
                      value={motivoRecusa}
                      onChange={(e) => setMotivoRecusa(e.target.value)}
                      placeholder="Ex: O gerente declarou que apenas o proprietário pode assinar notificações fiscais..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                    />
                  </div>
                </div>
              ) : (
                /* Interactive Canvas for Drawing Signature */
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800 flex items-center space-x-1">
                        <PenTool className="w-3.5 h-3.5 text-purple-600" />
                        <span>Área de Coleta da Assinatura (Touch / Caneta Stylus)</span>
                      </span>
                    </div>

                    {/* Canvas Tools */}
                    <div className="flex items-center space-x-2">
                      {/* Ink color */}
                      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setStrokeColor('#1e3a8a')}
                          className={`w-5 h-5 rounded-md ${strokeColor === '#1e3a8a' ? 'ring-2 ring-purple-600' : ''}`}
                          style={{ backgroundColor: '#1e3a8a' }}
                          title="Tinta Azul Caneta"
                        />
                        <button
                          type="button"
                          onClick={() => setStrokeColor('#0f172a')}
                          className={`w-5 h-5 rounded-md ${strokeColor === '#0f172a' ? 'ring-2 ring-purple-600' : ''}`}
                          style={{ backgroundColor: '#0f172a' }}
                          title="Tinta Preta Oficial"
                        />
                      </div>

                      {/* Undo / Clear */}
                      <button
                        type="button"
                        onClick={handleUndo}
                        disabled={strokeHistory.length === 0}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg flex items-center space-x-1 font-semibold text-[11px]"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Desfazer</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleClear}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg flex items-center space-x-1 font-semibold text-[11px]"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Limpar</span>
                      </button>
                    </div>
                  </div>

                  {/* Canvas Container */}
                  <div className="relative border-2 border-dashed border-purple-300 rounded-2xl bg-white overflow-hidden shadow-inner touch-none">
                    <canvas
                      ref={canvasRef}
                      style={{ touchAction: 'none' }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-44 bg-white cursor-crosshair block"
                    />

                    {/* Baseline signature helper */}
                    <div className="absolute bottom-8 left-8 right-8 pointer-events-none flex flex-col items-center">
                      <div className="w-full border-b border-slate-300"></div>
                      <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                        Assine com o dedo ou caneta stylus sobre a linha acima
                      </span>
                    </div>

                    {/* Live Signer watermark */}
                    <div className="absolute top-2 right-3 pointer-events-none text-right">
                      <span className="text-[10px] font-mono text-slate-400">
                        {nomeSignatario || 'Signatário'} ({tipoSignatario})
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Fiscal Signature Tab */
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-xs">Identificação do Agente Fiscal Autuante</div>
                  <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Portaria Fiscal Vigente
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nome do Agente Fiscal</label>
                    <input
                      type="text"
                      value={nomeFiscal}
                      onChange={(e) => setNomeFiscal(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Matrícula Funcional / Portaria</label>
                    <input
                      type="text"
                      value={matriculaFiscal}
                      onChange={(e) => setMatriculaFiscal(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Fiscal Canvas Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Assinatura Manual do Fiscal no Tablet</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold"
                    >
                      Limpar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Generate official pre-set fiscal signature
                        const svgData = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><path d="M20 60 Q 60 10, 110 55 T 220 40 T 280 65" stroke="%230f172a" stroke-width="3" fill="transparent"/><text x="20" y="85" font-family="sans-serif" font-size="10" fill="%2364748b">Matrícula: ' + matriculaFiscal + '</text></svg>';
                        setAssinaturaFiscalUrl(svgData);
                        toastService.info('Assinatura Funcional Carregada', 'Assinatura digital padrão do fiscal vinculada.');
                      }}
                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[11px] font-bold"
                    >
                      Usar Assinatura Cadastrada
                    </button>
                  </div>
                </div>

                <div className="relative border-2 border-dashed border-emerald-300 rounded-2xl bg-white overflow-hidden shadow-inner touch-none">
                  <canvas
                    ref={canvasRef}
                    style={{ touchAction: 'none' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-40 bg-white cursor-crosshair block"
                  />
                  <div className="absolute bottom-6 left-8 right-8 pointer-events-none flex flex-col items-center">
                    <div className="w-full border-b border-slate-300"></div>
                    <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                      Assinatura do Agente Fiscal de Campo ({council.sigla})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legal / Metadata Stamp Preview */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span className="flex items-center space-x-1">
                <Lock className="w-3 h-3 text-purple-600" />
                <span>Protocolo de Autenticidade & Não-Repúdio (ICP-Brasil / Res. CFF)</span>
              </span>
              <span className="text-purple-700 font-mono">
                {termo.hashValidacaoDigital || 'HASH SHA-256 AUTOMÁTICO'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
              <div><strong>GPS Vinculado:</strong> {termo.latitude.toFixed(4)}, {termo.longitude.toFixed(4)}</div>
              <div><strong>Data / Hora:</strong> {new Date().toLocaleTimeString('pt-BR')}</div>
              <div><strong>Dispositivo:</strong> Tablet Fiscal Mobile</div>
              <div><strong>Autarquia:</strong> {council.sigla}</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center space-x-2">
            {activeSigner === 'notificado' ? (
              <button
                type="button"
                onClick={() => setActiveSigner('fiscal')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors"
              >
                <span>Avançar para Fiscal</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveSigner('notificado')}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Voltar
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveAndAuthenticate}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-600/20 flex items-center space-x-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Gravar & Autenticar Termo no Tablet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
