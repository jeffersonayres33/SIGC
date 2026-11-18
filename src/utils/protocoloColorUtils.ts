import {
  ProtocoloProcesso,
  ProtocoloCorRegra,
  ProtocoloCorOpcao
} from '../types';

export interface ProtocoloColorStyle {
  id: ProtocoloCorOpcao;
  label: string;
  hexPreview: string;
  rowClass: string;
  badgeClass: string;
  dotClass: string;
  legendClass: string;
}

export const PROTOCOLO_COLOR_PALETTE: Record<ProtocoloCorOpcao, ProtocoloColorStyle> = {
  vermelho: {
    id: 'vermelho',
    label: 'Vermelho',
    hexPreview: '#e11d48',
    rowClass: 'bg-rose-50/90 hover:bg-rose-100/80 border-l-4 border-l-rose-600',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    dotClass: 'bg-rose-600',
    legendClass: 'bg-rose-50 text-rose-800 border-rose-200'
  },
  amarelo: {
    id: 'amarelo',
    label: 'Amarelo',
    hexPreview: '#d97706',
    rowClass: 'bg-amber-50/90 hover:bg-amber-100/80 border-l-4 border-l-amber-500',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    dotClass: 'bg-amber-500',
    legendClass: 'bg-amber-50 text-amber-900 border-amber-200'
  },
  cinza: {
    id: 'cinza',
    label: 'Cinza',
    hexPreview: '#64748b',
    rowClass: 'bg-slate-100/95 hover:bg-slate-200/70 border-l-4 border-l-slate-500 text-slate-600',
    badgeClass: 'bg-slate-200 text-slate-700 border-slate-300',
    dotClass: 'bg-slate-500',
    legendClass: 'bg-slate-100 text-slate-700 border-slate-300'
  },
  laranja: {
    id: 'laranja',
    label: 'Laranja',
    hexPreview: '#ea580c',
    rowClass: 'bg-orange-50/90 hover:bg-orange-100/80 border-l-4 border-l-orange-500',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
    dotClass: 'bg-orange-500',
    legendClass: 'bg-orange-50 text-orange-900 border-orange-200'
  },
  verde: {
    id: 'verde',
    label: 'Verde',
    hexPreview: '#059669',
    rowClass: 'bg-emerald-50/85 hover:bg-emerald-100/75 border-l-4 border-l-emerald-600',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotClass: 'bg-emerald-600',
    legendClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  azul: {
    id: 'azul',
    label: 'Azul',
    hexPreview: '#2563eb',
    rowClass: 'bg-blue-50/85 hover:bg-blue-100/75 border-l-4 border-l-blue-600',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    dotClass: 'bg-blue-600',
    legendClass: 'bg-blue-50 text-blue-800 border-blue-200'
  },
  roxo: {
    id: 'roxo',
    label: 'Roxo',
    hexPreview: '#7c3aed',
    rowClass: 'bg-purple-50/85 hover:bg-purple-100/75 border-l-4 border-l-purple-600',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    dotClass: 'bg-purple-600',
    legendClass: 'bg-purple-50 text-purple-800 border-purple-200'
  }
};

export const DEFAULT_PROTOCOLO_COR_REGRAS: ProtocoloCorRegra[] = [
  {
    id: 'regra-status-concluido',
    nome: 'Protocolos Concluídos',
    ativo: true,
    ordem: 1,
    escopo: 'TODOS',
    condicao: 'STATUS_IGUAL',
    statusAlvo: 'Concluído',
    cor: 'cinza',
    mostrarLegendaDias: true
  },
  {
    id: 'regra-prazo-vencido',
    nome: 'Protocolos Vencidos',
    ativo: true,
    ordem: 2,
    escopo: 'TODOS',
    condicao: 'VENCIDO',
    cor: 'vermelho',
    mostrarLegendaDias: true
  },
  {
    id: 'regra-prazo-proximo',
    nome: 'Prazo Próximo ao Vencimento (<= 30%)',
    ativo: true,
    ordem: 3,
    escopo: 'TODOS',
    condicao: 'PRAZO_RESTANTE',
    operador: 'MENOR_IGUAL',
    percentualLimite: 30,
    cor: 'amarelo',
    mostrarLegendaDias: true
  }
];

export function normalizeProtocolText(val?: string | null): string {
  return String(val || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

export function parseProtocolDate(raw?: string | null): Date | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();

  // dd/MM/yyyy (opcionalmente seguido de hora)
  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    const day = parseInt(brMatch[1], 10);
    const month = parseInt(brMatch[2], 10) - 1;
    const year = parseInt(brMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }

  // yyyy-MM-dd
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }

  return null;
}

export interface ProtocoloDeadlineMetrics {
  openDate: Date | null;
  dueDate: Date | null;
  totalDays: number | null;
  remainingDays: number | null;
  remainingPct: number | null;
  isOverdue: boolean;
  prazoLabel: string | null;
}

export function computeProtocoloDeadlineMetrics(
  proc: Pick<ProtocoloProcesso, 'dataAbertura' | 'prazoResposta'>,
  referenceDate?: Date
): ProtocoloDeadlineMetrics {
  const openDate = parseProtocolDate(proc.dataAbertura);
  let dueDate = parseProtocolDate(proc.prazoResposta);

  // Suporte a strings relativas como "5 dias úteis" ou "30 dias"
  if (!dueDate && openDate && proc.prazoResposta) {
    const daysMatch = String(proc.prazoResposta).match(/(\d+)\s*dia/i);
    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10);
      if (!isNaN(days) && days >= 0) {
        dueDate = new Date(openDate.getTime() + days * 86400000);
        dueDate.setHours(0, 0, 0, 0);
      }
    }
  }

  if (!dueDate) {
    return {
      openDate,
      dueDate: null,
      totalDays: null,
      remainingDays: null,
      remainingPct: null,
      isOverdue: false,
      prazoLabel: proc.prazoResposta || null
    };
  }

  const today = referenceDate ? new Date(referenceDate.getTime()) : new Date();
  today.setHours(0, 0, 0, 0);

  const effectiveOpen = openDate || today;
  const totalDays = Math.max(1, Math.round((dueDate.getTime() - effectiveOpen.getTime()) / 86400000));
  const remainingDays = Math.round((dueDate.getTime() - today.getTime()) / 86400000);
  const isOverdue = remainingDays < 0;
  const remainingPct = isOverdue
    ? 0
    : Math.max(0, Math.min(100, Math.round((remainingDays / totalDays) * 100)));

  let prazoLabel: string;
  if (isOverdue) {
    const overdueDays = Math.abs(remainingDays);
    prazoLabel = overdueDays === 1 ? 'Vencido há 1 dia' : `Vencido há ${overdueDays} dias`;
  } else if (remainingDays === 0) {
    prazoLabel = 'Vence hoje (0%)';
  } else if (remainingDays === 1) {
    prazoLabel = `Falta 1 dia (${remainingPct}%)`;
  } else {
    prazoLabel = `Restam ${remainingDays} dias (${remainingPct}%)`;
  }

  return {
    openDate: effectiveOpen,
    dueDate,
    totalDays,
    remainingDays,
    remainingPct,
    isOverdue,
    prazoLabel
  };
}

export interface EvaluatedProtocoloColor {
  matchedRule: ProtocoloCorRegra | null;
  style: ProtocoloColorStyle | null;
  metrics: ProtocoloDeadlineMetrics;
}

export function evaluateProtocoloColorRule(
  proc: Pick<ProtocoloProcesso, 'status' | 'setorAtual' | 'tipoInteressado' | 'dataAbertura' | 'prazoResposta'>,
  regras?: ProtocoloCorRegra[],
  referenceDate?: Date
): EvaluatedProtocoloColor {
  const activeRules = (regras && regras.length > 0 ? regras : DEFAULT_PROTOCOLO_COR_REGRAS)
    .filter(r => r.ativo !== false)
    .slice()
    .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999));

  const metrics = computeProtocoloDeadlineMetrics(proc, referenceDate);
  const procStatusNorm = normalizeProtocolText(proc.status);
  const procSetorNorm = normalizeProtocolText(proc.setorAtual);
  const procTipoInterNorm = normalizeProtocolText(proc.tipoInteressado || 'PUBLICO');

  for (const regra of activeRules) {
    // 1. Verificar escopo
    if (regra.escopo === 'STATUS') {
      const valNorm = normalizeProtocolText(regra.escopoValor);
      if (valNorm && procStatusNorm !== valNorm && !procStatusNorm.includes(valNorm)) continue;
    } else if (regra.escopo === 'SETOR') {
      const valNorm = normalizeProtocolText(regra.escopoValor);
      if (valNorm && procSetorNorm !== valNorm) continue;
    } else if (regra.escopo === 'TIPO_INTERESSADO') {
      const valNorm = normalizeProtocolText(regra.escopoValor);
      if (valNorm && procTipoInterNorm !== valNorm) continue;
    }

    // 2. Verificar condição
    let matched = false;
    if (regra.condicao === 'STATUS_IGUAL') {
      const targetNorm = normalizeProtocolText(regra.statusAlvo || 'Concluído');
      if (targetNorm) {
        const targets = targetNorm.split(',').map(t => t.trim()).filter(Boolean);
        matched = targets.some(t => procStatusNorm === t || (t.length >= 4 && procStatusNorm.includes(t)));
      }
    } else if (regra.condicao === 'VENCIDO') {
      matched = metrics.isOverdue;
    } else if (regra.condicao === 'PRAZO_RESTANTE') {
      if (!metrics.isOverdue && metrics.remainingPct !== null) {
        const pct = metrics.remainingPct;
        const limit = Number(regra.percentualLimite ?? 30);
        const op = regra.operador || 'MENOR_IGUAL';
        if (op === 'MENOR_IGUAL') matched = pct <= limit;
        else if (op === 'MENOR') matched = pct < limit;
        else if (op === 'IGUAL') matched = pct === limit;
        else if (op === 'MAIOR_IGUAL') matched = pct >= limit;
      }
    }

    if (matched) {
      const style = PROTOCOLO_COLOR_PALETTE[regra.cor] || PROTOCOLO_COLOR_PALETTE.cinza;
      return { matchedRule: regra, style, metrics };
    }
  }

  return { matchedRule: null, style: null, metrics };
}
