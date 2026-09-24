/**
 * Utilitários de Validação e Formatação de Documentos e Textos em Caixa Alta (SIGC)
 */

/**
 * Remove todos os caracteres não numéricos
 */
export function cleanNumeric(val: string | undefined | null): string {
  if (!val) return '';
  return String(val).replace(/\D/g, '');
}

/**
 * Aplica máscara de CPF: 000.000.000-00
 */
export function maskCPF(value: string): string {
  const digits = cleanNumeric(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Aplica máscara de CNPJ: 00.000.000/0000-00
 */
export function maskCNPJ(value: string): string {
  const digits = cleanNumeric(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Aplica máscara inteligente para CPF (11 dígitos) ou CNPJ (14 dígitos)
 */
export function maskCPFOrCNPJ(value: string): string {
  const digits = cleanNumeric(value);
  if (digits.length <= 11) {
    return maskCPF(digits);
  }
  return maskCNPJ(digits);
}

/**
 * Aplica máscara de CEP: 00000-000
 */
export function maskCEP(value: string): string {
  const digits = cleanNumeric(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

/**
 * Aplica máscara de Telefone: (00) 0000-0000 ou (00) 00000-0000
 */
export function maskPhone(value: string): string {
  const digits = cleanNumeric(value).slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Validação do Algoritmo Oficial de CPF (Dígitos Verificadores)
 */
export function validateCPF(cpfInput: string | undefined | null): boolean {
  const cpf = cleanNumeric(cpfInput);
  if (cpf.length !== 11) return false;

  // Rejeita padrões com todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Validação do 1º Dígito Verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (10 - i);
  }
  let rest = 11 - (sum % 11);
  let digit1 = rest === 10 || rest === 11 ? 0 : rest;
  if (digit1 !== parseInt(cpf.charAt(9), 10)) return false;

  // Validação do 2º Dígito Verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (11 - i);
  }
  rest = 11 - (sum % 11);
  let digit2 = rest === 10 || rest === 11 ? 0 : rest;
  return digit2 === parseInt(cpf.charAt(10), 10);
}

/**
 * Validação do Algoritmo Oficial de CNPJ (Dígitos Verificadores)
 */
export function validateCNPJ(cnpjInput: string | undefined | null): boolean {
  const cnpj = cleanNumeric(cnpjInput);
  if (cnpj.length !== 14) return false;

  // Rejeita padrões com todos os dígitos iguais
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  // Validação do 1º Dígito Verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i), 10) * weights1[i];
  }
  let rest = sum % 11;
  let digit1 = rest < 2 ? 0 : 11 - rest;
  if (digit1 !== parseInt(cnpj.charAt(12), 10)) return false;

  // Validação do 2º Dígito Verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj.charAt(i), 10) * weights2[i];
  }
  rest = sum % 11;
  let digit2 = rest < 2 ? 0 : 11 - rest;
  return digit2 === parseInt(cnpj.charAt(13), 10);
}

/**
 * Aplica máscara de RG: 0000000-SSP/UF
 */
export function maskRG(value: string): string {
  if (!value) return '';
  return value.toUpperCase().trim();
}

/**
 * Validação simples de formato de CEP (8 dígitos)
 */
export function validateCEP(cepInput: string | undefined | null): boolean {
  const digits = cleanNumeric(cepInput);
  return digits.length === 8;
}

export interface ViaCEPResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean;
}

/**
 * Busca de endereço automático pelo serviço público ViaCEP
 */
export async function fetchAddressByCEP(cepInput: string): Promise<ViaCEPResponse | null> {
  const clean = cleanNumeric(cepInput);
  if (clean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) return null;
    const data: ViaCEPResponse = await res.json();
    if (data.erro) return { erro: true };
    return {
      cep: maskCEP(data.cep || clean),
      logradouro: (data.logradouro || '').toUpperCase(),
      complemento: (data.complemento || '').toUpperCase(),
      bairro: (data.bairro || '').toUpperCase(),
      localidade: (data.localidade || '').toUpperCase(),
      uf: (data.uf || '').toUpperCase(),
      ibge: data.ibge,
      ddd: data.ddd
    };
  } catch (err) {
    console.warn('Erro ao consultar ViaCEP:', err);
    return null;
  }
}

/**
 * Formata um número com zeros à esquerda
 */
export function formatNumeroInscricao(num: number | string, digitosMinimos: number = 0): string {
  const cleanNum = String(num ?? '').trim();
  if (!digitosMinimos || digitosMinimos <= cleanNum.length) {
    return cleanNum;
  }
  return cleanNum.padStart(digitosMinimos, '0');
}

/**
 * Monta a inscrição completa (Prefixo + Número com zeros à esquerda + Sufixo opcional)
 * Se o sufixo estiver vazio, nada é adicionado.
 */
export function formatInscricaoCompleta(
  prefixo: string,
  numero: number | string,
  sufixo: string | undefined | null,
  digitosMinimos: number = 0
): string {
  const pref = (prefixo || '').trim();
  const numFormatted = formatNumeroInscricao(numero, digitosMinimos);
  const suf = (sufixo || '').trim();
  
  let base = pref ? `${pref} ${numFormatted}` : numFormatted;
  if (suf) {
    if (suf.startsWith('-') || suf.startsWith('/') || suf.startsWith('.')) {
      base = `${base}${suf}`;
    } else {
      base = `${base} ${suf}`;
    }
  }
  return base.trim().toUpperCase();
}

/**
 * Converte recursivamente todas as strings de um objeto ou texto para CAIXA ALTA (UPPERCASE)
 */
export function toUpperString(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).toUpperCase();
}

/**
 * Transforma campos textuais de um objeto para CAIXA ALTA preservando campos numéricos, booleanos e de IDs
 */
export function sanitizeToUpper<T extends Record<string, any>>(obj: T, ignoreKeys: string[] = ['id', 'fotoUrl', 'assinaturaFiscal', 'assinaturaNotificado']): T {
  const result: any = Array.isArray(obj) ? [] : {};

  for (const [key, val] of Object.entries(obj)) {
    if (ignoreKeys.includes(key)) {
      result[key] = val;
    } else if (typeof val === 'string') {
      result[key] = val.toUpperCase().trim();
    } else if (typeof val === 'object' && val !== null) {
      result[key] = sanitizeToUpper(val, ignoreKeys);
    } else {
      result[key] = val;
    }
  }

  return result as T;
}
