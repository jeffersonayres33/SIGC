import React, { useRef, useState, useEffect } from 'react';
import { PenTool, X, RotateCcw, Check, Trash2 } from 'lucide-react';

interface CapturaAssinaturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  cargo: string;
  nome: string;
  existingSignatureUrl?: string;
}

export const CapturaAssinaturaModal: React.FC<CapturaAssinaturaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cargo,
  nome,
  existingSignatureUrl
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [strokeColor, setStrokeColor] = useState<string>('#111827');
  const [strokeWidth, setStrokeWidth] = useState<number>(2.5);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 2;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear transparent
    ctx.clearRect(0, 0, rect.width, rect.height);

    // If there is an existing signature, draw it as reference
    if (existingSignatureUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 20, 10, rect.width - 40, rect.height - 20);
        setHasDrawn(true);
      };
      img.src = existingSignatureUrl;
    } else {
      setHasDrawn(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Pequeno timeout para o modal renderizar o tamanho do canvas
      const timer = setTimeout(() => {
        initCanvas();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, existingSignatureUrl]);

  if (!isOpen) return null;

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
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

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
  };

  const handleConfirmSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Export transparent PNG
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-70 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                Capturar Assinatura Digital
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {cargo}: <strong className="text-slate-800 uppercase">{nome || 'Não Informado'}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar de cores e espessura */}
        <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Cor da Tinta:</span>
            <button
              type="button"
              onClick={() => setStrokeColor('#111827')}
              className={`w-6 h-6 rounded-full bg-slate-900 border-2 cursor-pointer transition-all ${
                strokeColor === '#111827' ? 'ring-2 ring-emerald-500 ring-offset-1 border-white' : 'border-transparent'
              }`}
              title="Preto Cartorial"
            />
            <button
              type="button"
              onClick={() => setStrokeColor('#0f3ba2')}
              className={`w-6 h-6 rounded-full bg-blue-800 border-2 cursor-pointer transition-all ${
                strokeColor === '#0f3ba2' ? 'ring-2 ring-emerald-500 ring-offset-1 border-white' : 'border-transparent'
              }`}
              title="Azul Caneta"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Traço:</span>
            {[1.8, 2.5, 3.8].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setStrokeWidth(w)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                  strokeWidth === w
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {w === 1.8 ? 'Fino' : w === 2.5 ? 'Médio' : 'Grosso'}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas de Desenho */}
        <div className="relative bg-white border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden shadow-inner select-none touch-none">
          <canvas
            ref={canvasRef}
            className="w-full h-44 sm:h-52 cursor-crosshair block"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          {/* Linha guia de assinatura */}
          <div className="absolute bottom-10 left-8 right-8 pointer-events-none border-b border-dashed border-slate-300 flex items-center justify-between px-2">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
              Linha Guia de Assinatura
            </span>
            <span className="text-[9px] font-mono text-slate-400">✕</span>
          </div>

          {!hasDrawn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
              <PenTool className="w-8 h-8 mb-1.5 opacity-40 text-emerald-600 animate-bounce" />
              <p className="text-xs font-semibold">Assine aqui com o mouse, caneta ou toque na tela</p>
              <p className="text-[10px] text-slate-400 mt-0.5">O fundo será salvo com transparência oficial</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold uppercase transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar Tela</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors uppercase cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!hasDrawn}
              onClick={handleConfirmSave}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white uppercase shadow-md transition-all cursor-pointer ${
                hasDrawn
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-slate-300 cursor-not-allowed opacity-60 shadow-none'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Salvar Assinatura</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
