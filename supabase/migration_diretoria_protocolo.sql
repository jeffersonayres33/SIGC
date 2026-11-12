-- ==============================================================================
-- SIGCON - SISTEMA INTEGRADO DE GESTÃO E FISCALIZAÇÃO PROFISSIONAL
-- MIGRATION: DIRETORIA (VICE-PRESIDENTE & ASSINATURAS) E PREFIXOS/SUFIXOS DE PROTOCOLO
-- ==============================================================================

-- Adiciona novas colunas para Vice-Presidente, Arquivamento de Assinaturas e Numeração de Protocolo Customizada
ALTER TABLE IF EXISTS public.council_config
  ADD COLUMN IF NOT EXISTS vice_presidente VARCHAR(150),
  ADD COLUMN IF NOT EXISTS assinatura_presidente_url TEXT,
  ADD COLUMN IF NOT EXISTS assinatura_vice_presidente_url TEXT,
  ADD COLUMN IF NOT EXISTS assinatura_tesoureiro_url TEXT,
  ADD COLUMN IF NOT EXISTS assinatura_secretario_geral_url TEXT,
  ADD COLUMN IF NOT EXISTS assinatura_certidao_papel VARCHAR(30) DEFAULT 'PRESIDENTE',
  ADD COLUMN IF NOT EXISTS protocolo_proximo_numero INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS protocolo_ultimo_ano INTEGER DEFAULT 2026,
  ADD COLUMN IF NOT EXISTS protocolo_reinicia_ano BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS protocolo_prefixo_interno VARCHAR(50) DEFAULT '',
  ADD COLUMN IF NOT EXISTS protocolo_sufixo_interno VARCHAR(50) DEFAULT '',
  ADD COLUMN IF NOT EXISTS protocolo_prefixo_inscrito VARCHAR(50) DEFAULT '',
  ADD COLUMN IF NOT EXISTS protocolo_sufixo_inscrito VARCHAR(50) DEFAULT '-INS',
  ADD COLUMN IF NOT EXISTS protocolo_prefixo_site VARCHAR(50) DEFAULT '',
  ADD COLUMN IF NOT EXISTS protocolo_sufixo_site VARCHAR(50) DEFAULT '-SITE';

-- Atualiza registro 'default' com padrões do conselho
UPDATE public.council_config
SET 
  vice_presidente = COALESCE(vice_presidente, 'DRA. VANESSA COSTA LIMA'),
  assinatura_certidao_papel = COALESCE(assinatura_certidao_papel, 'PRESIDENTE'),
  protocolo_proximo_numero = COALESCE(protocolo_proximo_numero, 1),
  protocolo_ultimo_ano = COALESCE(protocolo_ultimo_ano, 2026),
  protocolo_reinicia_ano = COALESCE(protocolo_reinicia_ano, TRUE),
  protocolo_prefixo_interno = COALESCE(protocolo_prefixo_interno, ''),
  protocolo_sufixo_interno = COALESCE(protocolo_sufixo_interno, ''),
  protocolo_prefixo_inscrito = COALESCE(protocolo_prefixo_inscrito, ''),
  protocolo_sufixo_inscrito = COALESCE(protocolo_sufixo_inscrito, '-INS'),
  protocolo_prefixo_site = COALESCE(protocolo_prefixo_site, ''),
  protocolo_sufixo_site = COALESCE(protocolo_sufixo_site, '-SITE')
WHERE id = 'default';
