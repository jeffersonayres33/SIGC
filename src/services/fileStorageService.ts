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
  folder: 'protocolos' | 'formularios' | 'site-publico' | 'portal' = 'protocolos'
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
