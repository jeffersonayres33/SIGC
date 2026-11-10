-- ==============================================================================
-- ATUALIZAÇÃO DO SUPABASE: MÓDULO DE PROTOCOLOS E FORMULÁRIOS DINÂMICOS
-- Execute este script no SQL Editor do seu Supabase Dashboard para garantir
-- que todas as colunas de protocolos, formulários e respostas persistam 100%.
-- ==============================================================================

-- 1. ADICIONAR COLUNAS COMPLETAS NA TABELA DE PROTOCOLOS E PROCESSOS
ALTER TABLE public.protocolos_processos 
    ADD COLUMN IF NOT EXISTS assunto TEXT,
    ADD COLUMN IF NOT EXISTS tipo_interessado VARCHAR(30) DEFAULT 'PUBLICO',
    ADD COLUMN IF NOT EXISTS vinculo_id TEXT,
    ADD COLUMN IF NOT EXISTS vinculo_inscricao VARCHAR(50),
    ADD COLUMN IF NOT EXISTS vinculo_detalhes TEXT,
    ADD COLUMN IF NOT EXISTS contato_email VARCHAR(150),
    ADD COLUMN IF NOT EXISTS contato_telefone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS anexos_detalhados JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS conteudo_completo_formulario JSONB DEFAULT '{}'::jsonb;

-- Ajustar tipo do documento para aceitar formatos longos (CNPJ, CPF com máscara ou texto)
ALTER TABLE public.protocolos_processos 
    ALTER COLUMN documento_interessado TYPE VARCHAR(100);

-- 2. ADICIONAR COLUNAS COMPLETAS NA TABELA DE FORMULÁRIOS DINÂMICOS
ALTER TABLE public.formularios_dinamicos 
    ADD COLUMN IF NOT EXISTS publicar_profissional BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS publicar_empresa BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS publicar_site BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS permite_anexos BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS tipos_anexos_permitidos JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS tamanho_maximo_mb INTEGER DEFAULT 15,
    ADD COLUMN IF NOT EXISTS instrucoes_anexo TEXT,
    ADD COLUMN IF NOT EXISTS setor_tramitacao_id TEXT,
    ADD COLUMN IF NOT EXISTS setor_tramitacao_nome VARCHAR(100),
    ADD COLUMN IF NOT EXISTS status_protocolo_inicial VARCHAR(50),
    ADD COLUMN IF NOT EXISTS vincular_empresas_profissional BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS vincular_profissionais_empresa BOOLEAN DEFAULT false;

-- 3. ADICIONAR COLUNAS COMPLETAS NA TABELA DE RESPOSTAS DE FORMULÁRIOS
ALTER TABLE public.respostas_formularios 
    ADD COLUMN IF NOT EXISTS canal_origem VARCHAR(50) DEFAULT 'PROFISSIONAL',
    ADD COLUMN IF NOT EXISTS autor_email VARCHAR(150),
    ADD COLUMN IF NOT EXISTS autor_telefone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS anexos JSONB DEFAULT '[]'::jsonb;

-- 4. ÍNDICES DE ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_protocolos_numero ON public.protocolos_processos(numero_protocolo);
CREATE INDEX IF NOT EXISTS idx_protocolos_status ON public.protocolos_processos(status);
CREATE INDEX IF NOT EXISTS idx_protocolos_interessado ON public.protocolos_processos(documento_interessado);
CREATE INDEX IF NOT EXISTS idx_respostas_protocolo ON public.respostas_formularios(protocolo_gerado);
CREATE INDEX IF NOT EXISTS idx_respostas_formulario_id ON public.respostas_formularios(formulario_id);

-- 5. REGRAS DE RLS (ROW LEVEL SECURITY) RE-EXECUTÁVEIS
ALTER TABLE public.protocolos_processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formularios_dinamicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_formularios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access protocolos_processos" ON public.protocolos_processos;
CREATE POLICY "Public access protocolos_processos" ON public.protocolos_processos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access formularios_dinamicos" ON public.formularios_dinamicos;
CREATE POLICY "Public access formularios_dinamicos" ON public.formularios_dinamicos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access respostas_formularios" ON public.respostas_formularios;
CREATE POLICY "Public access respostas_formularios" ON public.respostas_formularios FOR ALL USING (true) WITH CHECK (true);
