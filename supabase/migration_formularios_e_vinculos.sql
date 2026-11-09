-- ==============================================================================
-- SCRIPT DE MIGRAÇÃO CORRIGIDO E IDEMPOTENTE PARA O SUPABASE
-- Conselho Regional de Farmácia (SIGCON)
-- Corrige a falta da coluna "canal_origem" e colunas derivadas em tabelas existentes
-- Executar no Editor SQL do Dashboard do Supabase
-- ==============================================================================

-- 1. ESTRUTURA PARA FORMULÁRIOS DINÂMICOS
CREATE TABLE IF NOT EXISTS public.formularios_dinamicos (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT NOT NULL DEFAULT 'Responsabilidade Técnica',
    publico_alvo TEXT NOT NULL DEFAULT 'Profissionais',
    ativo BOOLEAN NOT NULL DEFAULT true,
    data_criacao TEXT,
    versao INTEGER NOT NULL DEFAULT 1,
    campos JSONB NOT NULL DEFAULT '[]'::jsonb,
    respostas_recebidas INTEGER NOT NULL DEFAULT 0,
    publicar_profissional BOOLEAN NOT NULL DEFAULT true,
    publicar_empresa BOOLEAN NOT NULL DEFAULT false,
    publicar_site BOOLEAN NOT NULL DEFAULT false,
    permite_anexos BOOLEAN NOT NULL DEFAULT false,
    tipos_anexos_permitidos JSONB NOT NULL DEFAULT '[]'::jsonb,
    tamanho_maximo_mb INTEGER NOT NULL DEFAULT 10,
    instrucoes_anexo TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar colunas se a tabela formularios_dinamicos já existir no Supabase
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='formularios_dinamicos' AND column_name='publicar_profissional') THEN
        ALTER TABLE public.formularios_dinamicos ADD COLUMN publicar_profissional BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='formularios_dinamicos' AND column_name='publicar_empresa') THEN
        ALTER TABLE public.formularios_dinamicos ADD COLUMN publicar_empresa BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='formularios_dinamicos' AND column_name='publicar_site') THEN
        ALTER TABLE public.formularios_dinamicos ADD COLUMN publicar_site BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='formularios_dinamicos' AND column_name='permite_anexos') THEN
        ALTER TABLE public.formularios_dinamicos ADD COLUMN permite_anexos BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='formularios_dinamicos' AND column_name='tipos_anexos_permitidos') THEN
        ALTER TABLE public.formularios_dinamicos ADD COLUMN tipos_anexos_permitidos JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='formularios_dinamicos' AND column_name='tamanho_maximo_mb') THEN
        ALTER TABLE public.formularios_dinamicos ADD COLUMN tamanho_maximo_mb INTEGER DEFAULT 10;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='formularios_dinamicos' AND column_name='instrucoes_anexo') THEN
        ALTER TABLE public.formularios_dinamicos ADD COLUMN instrucoes_anexo TEXT;
    END IF;
END $$;


-- 2. ESTRUTURA PARA SUBMISSÕES E RESPOSTAS DOS FORMULÁRIOS
CREATE TABLE IF NOT EXISTS public.respostas_formularios (
    id TEXT PRIMARY KEY,
    formulario_id TEXT,
    formulario_titulo TEXT,
    protocolo_gerado TEXT,
    autor_nome TEXT,
    autor_documento TEXT,
    autor_email TEXT,
    autor_telefone TEXT,
    canal_origem TEXT NOT NULL DEFAULT 'PORTAL_PROFISSIONAL',
    data_envio TEXT,
    status TEXT NOT NULL DEFAULT 'Pendente',
    respostas JSONB DEFAULT '{}'::jsonb,
    dados_campos JSONB DEFAULT '{}'::jsonb,
    anexos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Garantir a criação de TODAS as colunas na tabela respostas_formularios caso ela já existisse previamente
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='respostas_formularios' AND column_name='canal_origem') THEN
        ALTER TABLE public.respostas_formularios ADD COLUMN canal_origem TEXT NOT NULL DEFAULT 'PORTAL_PROFISSIONAL';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='respostas_formularios' AND column_name='autor_email') THEN
        ALTER TABLE public.respostas_formularios ADD COLUMN autor_email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='respostas_formularios' AND column_name='autor_telefone') THEN
        ALTER TABLE public.respostas_formularios ADD COLUMN autor_telefone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='respostas_formularios' AND column_name='anexos') THEN
        ALTER TABLE public.respostas_formularios ADD COLUMN anexos JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='respostas_formularios' AND column_name='dados_campos') THEN
        ALTER TABLE public.respostas_formularios ADD COLUMN dados_campos JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='respostas_formularios' AND column_name='respostas') THEN
        ALTER TABLE public.respostas_formularios ADD COLUMN respostas JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='respostas_formularios' AND column_name='status') THEN
        ALTER TABLE public.respostas_formularios ADD COLUMN status TEXT DEFAULT 'Pendente';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='respostas_formularios' AND column_name='protocolo_gerado') THEN
        ALTER TABLE public.respostas_formularios ADD COLUMN protocolo_gerado TEXT;
    END IF;
END $$;


-- 3. ESTRUTURA PARA HISTÓRICO DE VÍNCULOS PROFISSIONAIS
CREATE TABLE IF NOT EXISTS public.historico_vinculos_profissionais (
    id TEXT PRIMARY KEY,
    profissional_id TEXT NOT NULL,
    profissional_inscricao TEXT,
    profissional_nome TEXT,
    empresa_id TEXT NOT NULL,
    empresa_razao_social TEXT NOT NULL,
    empresa_nome_fantasia TEXT,
    empresa_cnpj TEXT NOT NULL,
    empresa_inscricao TEXT,
    cargo TEXT NOT NULL DEFAULT 'Farmacêutico RT',
    situacao_vinculo TEXT DEFAULT 'CTPS',
    carga_horaria_semanal NUMERIC(5,2) NOT NULL DEFAULT 0,
    data_inicio TEXT NOT NULL,
    data_baixa TEXT,
    motivo_baixa TEXT,
    protocolo_baixa TEXT,
    status TEXT NOT NULL DEFAULT 'Baixado',
    created_at TIMESTAMPTZ DEFAULT now()
);


-- 4. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_respostas_formulario_id ON public.respostas_formularios(formulario_id);
CREATE INDEX IF NOT EXISTS idx_respostas_protocolo ON public.respostas_formularios(protocolo_gerado);
CREATE INDEX IF NOT EXISTS idx_respostas_canal ON public.respostas_formularios(canal_origem);
CREATE INDEX IF NOT EXISTS idx_respostas_autor_doc ON public.respostas_formularios(autor_documento);

CREATE INDEX IF NOT EXISTS idx_hist_vinculos_prof ON public.historico_vinculos_profissionais(profissional_id, profissional_inscricao);
CREATE INDEX IF NOT EXISTS idx_hist_vinculos_emp ON public.historico_vinculos_profissionais(empresa_id, empresa_cnpj);


-- 5. HABILITAÇÃO E POLÍTICAS DE SEGURANÇA RLS
ALTER TABLE public.formularios_dinamicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_formularios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_vinculos_profissionais ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem para evitar duplicidade de nomes
DROP POLICY IF EXISTS "Permitir leitura pública de formulários ativos" ON public.formularios_dinamicos;
DROP POLICY IF EXISTS "Permitir envio de respostas de formulários" ON public.respostas_formularios;
DROP POLICY IF EXISTS "Permitir leitura autenticada de respostas" ON public.respostas_formularios;
DROP POLICY IF EXISTS "Permitir leitura de histórico de vínculos" ON public.historico_vinculos_profissionais;

-- Re-criar políticas RLS
CREATE POLICY "Permitir leitura pública de formulários ativos" ON public.formularios_dinamicos
    FOR SELECT USING (true);

CREATE POLICY "Permitir envio de respostas de formulários" ON public.respostas_formularios
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura autenticada de respostas" ON public.respostas_formularios
    FOR SELECT USING (true);

CREATE POLICY "Permitir leitura de histórico de vínculos" ON public.historico_vinculos_profissionais
    FOR SELECT USING (true);

-- FIM DO SCRIPT DE MIGRAÇÃO
