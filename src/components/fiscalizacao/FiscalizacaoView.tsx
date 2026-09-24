import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  MapPin, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  PenTool, 
  FileText, 
  Save, 
  Clock, 
  UserCheck, 
  UserX, 
  Search, 
  X, 
  Send, 
  Download, 
  Eye, 
  Crosshair, 
  Tablet, 
  ShieldCheck,
  Printer,
  Info,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { TermoFiscalizacao, Empresa, TipoSignatarioNotificado } from '../../types';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { AssinaturaTabletModal } from './AssinaturaTabletModal';
import { TermoFiscalizacaoModal } from '../modals/TermoFiscalizacaoModal';

export const FiscalizacaoView: React.FC = () => {
  const [termos, setTermos] = useState<TermoFiscalizacao[]>(storageService.getTermosFiscalizacao());
  const [network, setNetwork] = useState(storageService.getNetworkStatus());
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>({
    lat: -3.10719,
    lng: -60.01328
  });
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [isNewTermoModal, setIsNewTermoModal] = useState(false);
  const [selectedTermo, setSelectedTermo] = useState<TermoFiscalizacao | null>(null);
  const [termoToSign, setTermoToSign] = useState<TermoFiscalizacao | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'autuados' | 'pendente_assinatura'>('todos');

  const empresas = storageService.getEmpresas();

  // Signature canvas state inside New Term Modal
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState<'#1e3a8a' | '#0f172a'>('#1e3a8a');

  // New Term Form State
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>(empresas[0]?.id || '');
  const [motivo, setMotivo] = useState<'Rotina' | 'Denúncia' | 'Reinspeção' | 'Solicitação Judicial'>('Rotina');
  const [farmaceuticoPresente, setFarmaceuticoPresente] = useState(true);
  const [farmaceuticoNome, setFarmaceuticoNome] = useState('Dr. Rodrigo Barbosa (CRF-AM 4120)');
  const [irregularidades, setIrregularidades] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState('Estabelecimento inspecionado durante horário regular de funcionamento. Documentação sanitária verificada.');
  const [autoInfracao, setAutoInfracao] = useState(false);

  // New Term Signer specifics
  const [tipoSignatario, setTipoSignatario] = useState<TipoSignatarioNotificado>('Farmacêutico RT Titular');
  const [nomeSignatario, setNomeSignatario] = useState('Dr. Rodrigo Barbosa');
  const [documentoSignatario, setDocumentoSignatario] = useState('012.345.678-90');
  const [cargoSignatario, setCargoSignatario] = useState('Farmacêutico Responsável Técnico');
  const [motivoTerceiro, setMotivoTerceiro] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setNetwork(storageService.getNetworkStatus());
      setTermos(storageService.getTermosFiscalizacao());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // When changing farmaceuticoPresente, auto adjust default role
  useEffect(() => {
    if (farmaceuticoPresente) {
      setTipoSignatario('Farmacêutico RT Titular');
      setNomeSignatario(farmaceuticoNome);
      setCargoSignatario('Farmacêutico Responsável Técnico');
      setMotivoTerceiro('');
    } else {
      setTipoSignatario('Gerente / Administrador');
      setNomeSignatario('Sr(a). Gerente da Unidade');
      setCargoSignatario('Gerente Operacional da Loja');
      setMotivoTerceiro('Ausência do Responsável Técnico no horário fiscalizado.');
    }
  }, [farmaceuticoPresente]);

  const handleCaptureGPS = () => {
    setIsGettingGps(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentCoords({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5))
          });
          setIsGettingGps(false);
          toastService.success('GPS Capturado com Sucesso', `Lat: ${pos.coords.latitude.toFixed(5)}, Lng: ${pos.coords.longitude.toFixed(5)}`);
        },
        () => {
          setCurrentCoords({ lat: -3.10719, lng: -60.01328 });
          setIsGettingGps(false);
          toastService.info('GPS Local Padrão', 'Coordenadas: Lat: -3.10719, Lng: -60.01328');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setIsGettingGps(false);
    }
  };

  const handleToggleIrregularidade = (item: string) => {
    if (irregularidades.includes(item)) {
      setIrregularidades(irregularidades.filter(i => i !== item));
    } else {
      setIrregularidades([...irregularidades, item]);
      setAutoInfracao(true);
    }
  };

  // Canvas Handlers for New Term Modal
  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (tipoSignatario === 'Recusa de Assinatura') return;
    if ('touches' in e && e.cancelable) e.preventDefault();

    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if ('touches' in e && e.cancelable) e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const handleStopDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureDataUrl(canvas.toDataURL('image/png'));
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl(null);
  };

  const handleSaveTermo = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmpresa = empresas.find(e => e.id === selectedEmpresaId) || empresas[0];
    const termoNumero = `TF-2026/${Math.floor(1000 + Math.random() * 9000)}`;
    const agora = new Date().toLocaleString('pt-BR');
    const isRecusa = tipoSignatario === 'Recusa de Assinatura';

    const hashCripto = `SHA256:${Date.now().toString(16).slice(-6)}-${Math.random().toString(16).slice(2, 8)}-ICPBR`.toUpperCase();

    const newTermo: TermoFiscalizacao = {
      id: `termo-${Date.now()}`,
      numeroTermo: termoNumero,
      empresaId: targetEmpresa.id,
      empresaNome: targetEmpresa.razaoSocial,
      cnpj: targetEmpresa.cnpj,
      endereco: targetEmpresa.endereco || 'Av. Djalma Batista, 1000',
      bairro: targetEmpresa.bairro || 'Nossa Senhora das Graças',
      cidade: targetEmpresa.cidade || 'Manaus',
      fiscalId: 'fisc-01',
      fiscalNome: 'Dr. Márcio Ramos',
      matriculaFiscal: 'MAT-9042',
      dataHora: agora,
      tipoVisita: (motivo === 'Denúncia' ? 'Denúncia' : motivo === 'Reinspeção' ? 'Reinspeção' : 'Rotina') as any,
      presencaRT: farmaceuticoPresente,
      rtPresenteNome: farmaceuticoPresente ? farmaceuticoNome : undefined,
      rtPresenteInscricao: farmaceuticoPresente ? 'CRF-AM 4120' : undefined,
      motivoAusenciaRT: !farmaceuticoPresente ? (motivoTerceiro || 'Ausência de profissional farmacêutico no horário inspecionado') : undefined,
      documentosVerificados: {
        crtAfixada: true,
        licencaSanitariaVigente: true,
        sngpcRegular: !irregularidades.includes('Irregularidade no SNGPC / Psicotrópicos'),
        livroPsicotropicos: true,
        escalaHorariosVisivel: true
      },
      infracoesIdentificadas: irregularidades,
      autoInfracaoGerado: autoInfracao,
      numeroAutoInfracao: autoInfracao ? `AI-2026/${Math.floor(100 + Math.random() * 900)}` : undefined,
      valorMultaPrevisto: autoInfracao ? (irregularidades.length * 1425.00) : undefined,
      relatoFiscal: observacoes || 'Inspeção fiscal realizada no estabelecimento comercial.',
      observacoesNotificado: '',
      fotoEvidencias: [],
      
      // Assinatura Fiscal
      assinaturaFiscal: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10 25 Q 30 5, 50 25 T 90 20" stroke="black" fill="transparent"/></svg>',
      fiscalAssinanteNome: 'Dr. Márcio Ramos',
      fiscalAssinanteMatricula: 'MAT-9042',
      assinaturaFiscalDataHora: agora,

      // Assinatura Notificado
      tipoSignatarioNotificado: tipoSignatario,
      nomeSignatarioNotificado: nomeSignatario,
      documentoSignatarioNotificado: documentoSignatario,
      cargoSignatarioNotificado: cargoSignatario,
      motivoAssinaturaTerceiro: tipoSignatario !== 'Farmacêutico RT Titular' ? motivoTerceiro : undefined,
      assinaturaNotificado: !isRecusa ? (signatureDataUrl || undefined) : undefined,
      assinaturaNotificadoDataHora: agora,
      recusaAssinatura: isRecusa,
      motivoRecusa: isRecusa ? 'Responsável recusou-se expressamente a apor assinatura no tablet.' : undefined,

      hashValidacaoDigital: hashCripto,
      latitude: currentCoords?.lat || -3.10719,
      longitude: currentCoords?.lng || -60.01328,
      statusSincronizacao: network.isOnline ? 'Sincronizado' : 'Pendente Offline'
    };

    storageService.submitTermoFiscalizacao(newTermo);
    setTermos(storageService.getTermosFiscalizacao());
    setIsNewTermoModal(false);

    if (network.isOnline) {
      toastService.success(
        'Termo e Assinaturas Gravados',
        `Termo nº ${termoNumero} lavrado e autenticado digitalmente com sucesso.`
      );
    } else {
      toastService.warning(
        'Gravado em Modo Offline',
        `Termo nº ${termoNumero} armazenado no tablet com assinaturas criptografadas.`
      );
    }
  };

  const filteredTermos = termos.filter(t => {
    const matchesSearch = 
      (t.numeroTermo && t.numeroTermo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.empresaNome && t.empresaNome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.empresaRazaoSocial && t.empresaRazaoSocial.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.cnpj && t.cnpj.includes(searchTerm)) ||
      (t.empresaCnpj && t.empresaCnpj.includes(searchTerm));
    
    if (!matchesSearch) return false;

    if (statusFilter === 'autuados') return t.autoInfracaoGerado;
    if (statusFilter === 'pendente_assinatura') return !t.assinaturaNotificado && !t.recusaAssinatura;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>Módulo dos Fiscais de Campo (Offline & Tablet)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Lavratura de termos de inspeção, autos de infração e captura de assinatura digital no tablet para RTs, gerentes e funcionários.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCaptureGPS}
            disabled={isGettingGps}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors"
          >
            <Crosshair className={`w-3.5 h-3.5 text-blue-600 ${isGettingGps ? 'animate-spin' : ''}`} />
            <span>{isGettingGps ? 'Obtendo GPS...' : 'Localizar GPS'}</span>
          </button>
          <button
            onClick={() => setIsNewTermoModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm shadow-purple-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Lavrar Novo Termo</span>
          </button>
        </div>
      </div>

      {/* GPS & Network Status Card */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className={`p-2.5 rounded-xl border ${network.isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
            {network.isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs">
              {network.isOnline ? 'Modo Online (Conectado à Base do Conselho)' : 'Modo Offline (Operação de Campo no Tablet)'}
            </div>
            <div className="text-[11px] text-slate-500">
              {network.queueSize > 0 ? `${network.queueSize} termos pendentes de sincronização` : 'Todos os dados locais sincronizados'}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-rose-500" />
          <span>Lat: {currentCoords?.lat || -3.10719}, Lng: {currentCoords?.lng || -60.01328}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por termo, auto, estabelecimento ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'todos' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({termos.length})
          </button>
          <button
            onClick={() => setStatusFilter('autuados')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'autuados' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Autos de Infração ({termos.filter(t => t.autoInfracaoGerado).length})
          </button>
          <button
            onClick={() => setStatusFilter('pendente_assinatura')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'pendente_assinatura' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Assinatura Pendente ({termos.filter(t => !t.assinaturaNotificado && !t.recusaAssinatura).length})
          </button>
        </div>
      </div>

      {/* Table of Fiscal Inspections */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <span>Histórico de Termos, Autos e Assinaturas ({filteredTermos.length})</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Termo / Auto Nº</th>
                <th className="py-3 px-4">Estabelecimento / Inscrição</th>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Motivo</th>
                <th className="py-3 px-4">Assistência RT</th>
                <th className="py-3 px-4">Status da Assinatura Digital</th>
                <th className="py-3 px-4">Resultado</th>
                <th className="py-3 px-4 text-right">Ações no Tablet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTermos.map((t) => {
                const hasNotificadoSignature = Boolean(t.assinaturaNotificado || t.recusaAssinatura);
                const hasFiscalSignature = Boolean(t.assinaturaFiscal);

                return (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-purple-700">{t.numeroTermo}</div>
                      {t.numeroAutoInfracao && (
                        <div className="text-[10px] text-rose-600 font-bold font-mono">{t.numeroAutoInfracao}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{t.empresaNome}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{t.cnpj}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {t.dataHora}
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-medium">
                      {t.tipoVisita}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {t.presencaRT ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                          Presente ({t.rtPresenteNome || 'RT Titular'})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold text-[10px] border border-rose-200">
                          Ausente / Sem RT
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {t.recusaAssinatura ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Recusa Certificada</span>
                        </span>
                      ) : t.assinaturaNotificado ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>
                            {t.tipoSignatarioNotificado?.includes('Farmacêutico') 
                              ? 'Assinado pelo RT' 
                              : `Assinado (${t.tipoSignatarioNotificado?.split('/')[0] || 'Representante'})`}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                          <Clock className="w-3 h-3" />
                          <span>Aguardando Assinatura</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {t.autoInfracaoGerado ? (
                        <span className="text-rose-600 font-bold text-[11px] flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Autuado</span>
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium text-[11px] flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Conforme</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => setTermoToSign(t)}
                        className={`p-1.5 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition-colors ${
                          hasNotificadoSignature
                            ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-xs'
                        }`}
                        title="Capturar ou Atualizar Assinatura Digital no Tablet"
                      >
                        <Tablet className="w-3.5 h-3.5" />
                        <span className="text-[10px]">{hasNotificadoSignature ? 'Ver Assinaturas' : 'Assinar no Tablet'}</span>
                      </button>

                      <button
                        onClick={() => setSelectedTermo(t)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors inline-flex items-center"
                        title="Visualizar e Imprimir Termo Completo"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Visualização e Impressão de Termo */}
      {selectedTermo && (
        <TermoFiscalizacaoModal
          termo={selectedTermo}
          onClose={() => setSelectedTermo(null)}
          onOpenSignature={(t) => {
            setSelectedTermo(null);
            setTermoToSign(t);
          }}
        />
      )}

      {/* Modal Dedicado de Assinatura no Tablet */}
      {termoToSign && (
        <AssinaturaTabletModal
          termo={termoToSign}
          onClose={() => setTermoToSign(null)}
          onSuccess={(atualizado) => {
            setTermos(storageService.getTermosFiscalizacao());
            setTermoToSign(null);
            setSelectedTermo(atualizado);
          }}
        />
      )}

      {/* Modal Lavrar Novo Termo */}
      {isNewTermoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Lavratura de Termo de Fiscalização em Campo
                </h2>
              </div>
              <button
                onClick={() => setIsNewTermoModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTermo} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Selecione o Estabelecimento Farmacêutico *</label>
                <select
                  value={selectedEmpresaId}
                  onChange={(e) => setSelectedEmpresaId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                >
                  {empresas.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.razaoSocial} ({emp.inscricao} - {emp.bairro})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Motivo da Vistoria</label>
                  <select
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  >
                    <option value="Rotina">Rotina Semestral</option>
                    <option value="Denúncia">Apurar Denúncia de Cidadão</option>
                    <option value="Reinspeção">Reinspeção de Notificação</option>
                    <option value="Solicitação Judicial">Solicitação Judicial / Ministério Público</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assistência Técnica (RT)</label>
                  <select
                    value={farmaceuticoPresente ? 'sim' : 'nao'}
                    onChange={(e) => setFarmaceuticoPresente(e.target.value === 'sim')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  >
                    <option value="sim">Farmacêutico Presente no Local</option>
                    <option value="nao">Ausente / Sem Assistência Profissional</option>
                  </select>
                </div>
              </div>

              {farmaceuticoPresente ? (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nome / Inscrição do Farmacêutico Presente</label>
                  <input
                    type="text"
                    value={farmaceuticoNome}
                    onChange={(e) => setFarmaceuticoNome(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  />
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                  <div className="font-bold flex items-center space-x-1 text-amber-800">
                    <Info className="w-4 h-4" />
                    <span>Registro de Ausência de RT:</span>
                  </div>
                  <p className="text-[11px]">
                    O termo e o eventual auto de infração serão lavrados colhendo a assinatura do preposto, gerente ou funcionário presente no estabelecimento.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold">Irregularidades Constatadas</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'Ausência de Farmacêutico no Horário Obrigatório',
                    'Falta de CRT Afixada em Local Visível',
                    'Irregularidade no SNGPC / Psicotrópicos',
                    'Medicamentos Fracionados em Desconformidade',
                    'Desvio de Função / Medicamentos Sem Procedência'
                  ].map((item) => (
                    <label key={item} className="flex items-center space-x-2 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={irregularidades.includes(item)}
                        onChange={() => handleToggleIrregularidade(item)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-[11px] text-slate-700 font-medium">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Parecer Circunstanciado do Fiscal</label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              {/* Qualificação do Signatário */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 text-xs">
                  Qualificação do Signatário no Local (Tablet)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-600 text-[11px] font-bold mb-1">Papel de quem assina:</label>
                    <select
                      value={tipoSignatario}
                      onChange={(e) => setTipoSignatario(e.target.value as TipoSignatarioNotificado)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-semibold"
                    >
                      <option value="Farmacêutico RT Titular">Farmacêutico RT Titular</option>
                      <option value="Farmacêutico RT Substituto">Farmacêutico RT Substituto</option>
                      <option value="Gerente / Administrador">Gerente / Administrador (Falta do RT)</option>
                      <option value="Proprietário / Sócio">Proprietário / Sócio (Falta do RT)</option>
                      <option value="Balconista / Funcionário Presente">Balconista (Falta do RT)</option>
                      <option value="Testemunha no Local">Testemunha Presencial</option>
                      <option value="Recusa de Assinatura">Recusa Formal de Assinatura</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 text-[11px] font-bold mb-1">Nome do Signatário:</label>
                    <input
                      type="text"
                      value={nomeSignatario}
                      onChange={(e) => setNomeSignatario(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-[11px] font-bold mb-1">Documento (CPF / RG):</label>
                    <input
                      type="text"
                      value={documentoSignatario}
                      onChange={(e) => setDocumentoSignatario(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                    />
                  </div>
                </div>

                {tipoSignatario !== 'Recusa de Assinatura' ? (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-700 font-bold text-[11px] flex items-center space-x-1">
                        <PenTool className="w-3.5 h-3.5 text-purple-600" />
                        <span>Captura de Assinatura no Tablet</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleClearSignature}
                        className="text-[10px] text-rose-600 font-bold hover:underline"
                      >
                        Limpar Assinatura
                      </button>
                    </div>
                    <div className="border border-slate-300 rounded-xl bg-white overflow-hidden touch-none">
                      <canvas
                        ref={canvasRef}
                        style={{ touchAction: 'none' }}
                        width={600}
                        height={90}
                        onMouseDown={handleStartDraw}
                        onMouseMove={handleDraw}
                        onMouseUp={handleStopDraw}
                        onTouchStart={handleStartDraw}
                        onTouchMove={handleDraw}
                        onTouchEnd={handleStopDraw}
                        className="w-full h-24 bg-white cursor-crosshair block"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-[11px]">
                    <strong>Certidão de Recusa:</strong> Será gerada a certidão administrativa de recusa de aposição de assinatura pelo fiscal nos termos da lei.
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTermoModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/20 flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Gravar Termo & Autenticar no Tablet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
