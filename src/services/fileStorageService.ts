import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface StoredAttachment {
  nome: string;
  tamanho: number; // Em MB (padronizado)
  tamanhoBytes?: number;
  tipo: string;
  url: string;
  storagePath?: string;
  armazenamento?: 'SUPABASE_STORAGE' | 'DATA_URL';
  dataUpload?: string;
}

const STORAGE_BUCKET = 'sigcon-documentos';

function sanitizeStorageFileName(fileName: string): string {
  const parts = fileName.split('.');
  const ext = parts.length > 1 ? '.' + parts.pop() : '';
  const base = parts
    .join('.')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80);
  return `${base || 'documento'}${ext.replace(/[^a-zA-Z0-9.]/g, '')}`;
}

export function readFileAsExactDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error(`Falha ao ler arquivo ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/**
 * Normaliza apenas o cabeçalho `DATA:...;BASE64,` caso algum registro antigo tenha sido
 * corrompido por sanitizeToUpper antes da correção, sem alterar os bytes quando íntegros.
 */
export function normalizeDataUrlHeader(url?: string): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  if (/^DATA:/i.test(url)) {
    const commaIdx = url.indexOf(',');
    if (commaIdx > 0) {
      const header = url.slice(0, commaIdx).toLowerCase();
      return `${header}${url.slice(commaIdx)}`;
    }
  }
  return url;
}

export function isValidDownloadableUrl(url?: string): boolean {
  if (!url || url === '#') return false;
  const normalized = normalizeDataUrlHeader(url.trim());
  return (
    normalized.startsWith('data:') ||
    normalized.startsWith('blob:') ||
    normalized.startsWith('http://') ||
    normalized.startsWith('https://')
  );
}

export function formatAttachmentSize(arq: { tamanho?: number; tamanhoMb?: number; tamanhoBytes?: number }): string {
  if (typeof arq.tamanhoBytes === 'number' && arq.tamanhoBytes > 0) {
    if (arq.tamanhoBytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(arq.tamanhoBytes / 1024))} KB`;
    }
    return `${(arq.tamanhoBytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  const val = Number(arq.tamanhoMb ?? arq.tamanho ?? 0);
  if (!val || isNaN(val)) return 'Tamanho não informado';
  if (val >= 25) {
    // Registros antigos que gravaram KB em `tamanho`
    return val >= 1024 ? `${(val / 1024).toFixed(2)} MB` : `${Math.round(val)} KB`;
  }
  return `${val.toFixed(2)} MB`;
}

/**
 * Envia o arquivo binário original SEM QUALQUER ALTERAÇÃO para o Supabase Storage (bucket `sigcon-documentos`).
 * Caso o bucket ainda não tenha sido criado no Supabase ou esteja offline, preserva o binário intacto via Data URL.
 */
export async function uploadOriginalFile(
  file: File,
  folder: 'protocolos' | 'formularios' | 'site-publico' | 'portal' | 'website' | 'transparencia' = 'protocolos'
): Promise<StoredAttachment> {
  const tamanhoMb = Number((file.size / (1024 * 1024)).toFixed(2));
  const mime = file.type || 'application/octet-stream';
  const nowIso = new Date().toISOString();

  if (isSupabaseConfigured && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      const safeName = sanitizeStorageFileName(file.name);
      const uniqueKey = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(uniqueKey, file, {
          contentType: mime,
          cacheControl: '31536000',
          upsert: false
        });

      if (!error && data?.path) {
        const { data: pubData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);
        if (pubData?.publicUrl) {
          return {
            nome: file.name,
            tamanho: tamanhoMb || 0.01,
            tamanhoBytes: file.size,
            tipo: mime,
            url: pubData.publicUrl,
            storagePath: data.path,
            armazenamento: 'SUPABASE_STORAGE',
            dataUpload: nowIso
          };
        }
      }
    } catch (err) {
      console.warn('Supabase Storage indisponível; preservando arquivo via Data URL intacta:', err);
    }
  }

  const dataUrl = await readFileAsExactDataUrl(file);
  return {
    nome: file.name,
    tamanho: tamanhoMb || 0.01,
    tamanhoBytes: file.size,
    tipo: mime,
    url: dataUrl,
    armazenamento: 'DATA_URL',
    dataUpload: nowIso
  };
}

/**
 * Converte Data URLs (especialmente PDFs em base64 que o Chrome bloqueia dentro de <iframe>)
 * e arquivos remotos em Blob Object URLs de mesma origem para pré-visualização segura.
 */
export function dataUrlToBlob(dataUrl: string, fallbackMime?: string): Blob | null {
  try {
    const normalized = normalizeDataUrlHeader(dataUrl);
    const commaIdx = normalized.indexOf(',');
    if (commaIdx === -1) return null;

    const header = normalized.slice(0, commaIdx);
    const payload = normalized.slice(commaIdx + 1);
    const mimeMatch = header.match(/^data:([^;]+)/i);
    const mime = mimeMatch?.[1] || fallbackMime || 'application/octet-stream';
    const isBase64 = /;base64/i.test(header);

    if (isBase64) {
      const cleanBase64 = payload.replace(/\s/g, '');
      const binaryStr = atob(cleanBase64);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return new Blob([bytes], { type: mime });
    }

    const decoded = decodeURIComponent(payload);
    return new Blob([decoded], { type: mime });
  } catch (err) {
    console.warn('Falha ao converter Data URL para Blob:', err);
    return null;
  }
}

export async function resolveSafePreviewUrl(
  rawUrl?: string,
  mimeType?: string,
  fileName?: string
): Promise<{ url: string; revoke?: () => void }> {
  const normalized = normalizeDataUrlHeader(rawUrl?.trim());
  if (!isValidDownloadableUrl(normalized)) {
    return { url: '' };
  }

  const lowerName = (fileName || '').toLowerCase();
  const isPdf =
    normalized.startsWith('data:application/pdf') ||
    (mimeType || '').toLowerCase() === 'application/pdf' ||
    /\.pdf(\?.*)?$/i.test(lowerName);

  if (normalized.startsWith('data:')) {
    const blob = dataUrlToBlob(normalized, isPdf ? 'application/pdf' : mimeType);
    if (blob) {
      const objectUrl = URL.createObjectURL(blob);
      return {
        url: objectUrl,
        revoke: () => URL.revokeObjectURL(objectUrl)
      };
    }
    return { url: normalized };
  }

  if (isPdf && (normalized.startsWith('http://') || normalized.startsWith('https://'))) {
    try {
      const res = await fetch(normalized);
      if (res.ok) {
        const rawBlob = await res.blob();
        const pdfBlob = rawBlob.type === 'application/pdf' ? rawBlob : new Blob([rawBlob], { type: 'application/pdf' });
        const objectUrl = URL.createObjectURL(pdfBlob);
        return {
          url: objectUrl,
          revoke: () => URL.revokeObjectURL(objectUrl)
        };
      }
    } catch {
      // Fallback para URL original se CORS impedir fetch direto
    }
  }

  return { url: normalized };
}

/**
 * Faz o download do arquivo original exatamente como foi enviado (sem gerar PDFs substitutos).
 */
export async function downloadOriginalAttachment(arq: { nome: string; url?: string; tipo?: string }): Promise<{ ok: boolean; reason?: string }> {
  const rawUrl = normalizeDataUrlHeader(arq.url);
  if (!isValidDownloadableUrl(rawUrl)) {
    return {
      ok: false,
      reason: 'Este registro não possui os bytes originais salvos (apenas metadados/nome de arquivo legado).'
    };
  }

  try {
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      const response = await fetch(rawUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = arq.nome;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
      return { ok: true };
    }

    if (rawUrl.startsWith('data:')) {
      const blob = dataUrlToBlob(rawUrl, arq.tipo);
      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = arq.nome;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
        return { ok: true };
      }
    }

    const a = document.createElement('a');
    a.href = rawUrl;
    a.download = arq.nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return { ok: true };
  } catch (err: any) {
    return {
      ok: false,
      reason: err?.message || 'Não foi possível baixar o arquivo original.'
    };
  }
}
