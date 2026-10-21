-- ==============================================================================
-- ATUALIZAÇÃO DO BANCO DE DADOS: USUÁRIO DESENVOLVEDOR MASTER & AUTENTICAÇÃO
-- Banco Alvo: PostgreSQL / Supabase
-- Autor: Sistema Integrado de Gestão de Conselhos (SIGC Cloud)
-- CPF do Desenvolvedor: 934.135.302-59
-- Compatibilidade: 100% resiliente com colunas id tipo UUID ou TEXT/VARCHAR
-- ==============================================================================

-- Extensões necessárias para UUID e criptografia
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Criação ou adaptação da tabela de Funcionários e Colaboradores
CREATE TABLE IF NOT EXISTS public.funcionarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(250) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    rg VARCHAR(50),
    matricula VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telefone VARCHAR(50),
    celular VARCHAR(50),
    foto_url TEXT,
    cargo_id VARCHAR(50),
    cargo_nome VARCHAR(150),
    setor_id VARCHAR(50),
    setor_nome VARCHAR(150),
    permissoes_modulos TEXT[] DEFAULT '{}',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_admissao VARCHAR(20),
    senha_hash VARCHAR(255),
    primeiro_acesso_pendente BOOLEAN NOT NULL DEFAULT TRUE,
    zerar_senha_pendente BOOLEAN NOT NULL DEFAULT FALSE,
    ultimo_acesso VARCHAR(50),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garante que todas as colunas necessárias existam caso a tabela já tenha sido criada anteriormente
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS cargo_id VARCHAR(50);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS cargo_nome VARCHAR(150);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS setor_id VARCHAR(50);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS setor_nome VARCHAR(150);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS permissoes_modulos TEXT[] DEFAULT '{}';
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS data_admissao VARCHAR(20);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS primeiro_acesso_pendente BOOLEAN DEFAULT TRUE;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS zerar_senha_pendente BOOLEAN DEFAULT FALSE;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS ultimo_acesso VARCHAR(50);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- 2. Inserção / Atualização idempotente do Usuário DESENVOLVEDOR MASTER (Jefferson Ayres)
-- Acesso Supremo Irrestrito acima do Administrador Geral
-- Nota: Usa UUID padronizado '00000000-0000-4000-a000-000000000001' (compatível tanto com coluna UUID quanto VARCHAR/TEXT)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.funcionarios WHERE cpf = '934.135.302-59') THEN
        UPDATE public.funcionarios SET
            nome = 'Jefferson Ayres (Desenvolvedor)',
            cargo_nome = 'Desenvolvedor Master / Arquiteto de Software',
            permissoes_modulos = ARRAY['dashboard', 'profissionais', 'empresas', 'cadastros_basicos', 'funcionarios', 'financeiro', 'cobranca_juridico', 'fiscalizacao', 'protocolos', 'relatorios', 'formularios', 'portal_inscrito', 'configuracoes', 'microsservicos', 'backup_restore', 'admin'],
            ativo = TRUE,
            observacoes = 'Superusuário Desenvolvedor com autoridade máxima e acesso irrestrito acima do Administrador.'
        WHERE cpf = '934.135.302-59';
    ELSE
        INSERT INTO public.funcionarios (
            id, nome, cpf, rg, matricula, email, telefone, celular, foto_url,
            cargo_id, cargo_nome, setor_id, setor_nome,
            permissoes_modulos, ativo, data_admissao, senha_hash,
            primeiro_acesso_pendente, zerar_senha_pendente, ultimo_acesso, observacoes
        ) VALUES (
            '00000000-0000-4000-a000-000000000001',
            'Jefferson Ayres (Desenvolvedor)',
            '934.135.302-59',
            'DEV-SYSTEM-MASTER',
            'DEV-001',
            'jeffersonayresjefferson@gmail.com',
            '(92) 99999-9999',
            '(92) 99999-9999',
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256',
            'crg-dev',
            'Desenvolvedor Master / Arquiteto de Software',
            'setlot-7',
            'Tecnologia da Informação e Engenharia de Software',
            ARRAY['dashboard', 'profissionais', 'empresas', 'cadastros_basicos', 'funcionarios', 'financeiro', 'cobranca_juridico', 'fiscalizacao', 'protocolos', 'relatorios', 'formularios', 'portal_inscrito', 'configuracoes', 'microsservicos', 'backup_restore', 'admin'],
            TRUE,
            '2020-01-01',
            NULL, -- Senha a ser cadastrada no 1º acesso
            TRUE,
            FALSE,
            'Aguardando primeiro acesso',
            'Superusuário Desenvolvedor com autoridade máxima e acesso irrestrito acima do Administrador.'
        );
    END IF;
END $$;

-- 3. Adiciona campos de autenticação web e primeiro acesso nas tabelas de profissionais e empresas
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS primeiro_acesso_pendente BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS zerar_senha_pendente BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS ultimo_acesso VARCHAR(50);

ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS primeiro_acesso_pendente BOOLEAN DEFAULT TRUE;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS zerar_senha_pendente BOOLEAN DEFAULT FALSE;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS ultimo_acesso VARCHAR(50);

-- 4. Habilita RLS e permissões de segurança na tabela funcionarios
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access funcionarios" ON public.funcionarios;
CREATE POLICY "Public access funcionarios" ON public.funcionarios FOR ALL USING (true) WITH CHECK (true);

-- 5. Trigger de updated_at para funcionarios (se a função handle_updated_at existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
        DROP TRIGGER IF EXISTS trg_update_funcionarios ON public.funcionarios;
        CREATE TRIGGER trg_update_funcionarios 
        BEFORE UPDATE ON public.funcionarios 
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- 6. Registro seguro de auditoria (compatível com qualquer versão da tabela historico_auditoria)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'historico_auditoria'
    ) THEN
        BEGIN
            INSERT INTO public.historico_auditoria (
                id, timestamp, target_id, target_tipo, target_nome, target_doc, 
                usuario_nome, usuario_papel, acao, campo_alterado, valor_anterior, valor_novo, motivo
            ) VALUES (
                gen_random_uuid()::text,
                TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI:SS'),
                '00000000-0000-4000-a000-000000000001',
                'FUNCIONARIO',
                'Jefferson Ayres (Desenvolvedor)',
                '934.135.302-59',
                'SISTEMA / SQL MIGRATION',
                'DEVELOPER',
                'CRIACAO_USUARIO_DEV',
                'USUARIO_DESENVOLVEDOR',
                NULL,
                'Usuário Desenvolvedor Jefferson Ayres configurado com sucesso',
                'Configuração do Usuário Supremo Desenvolvedor'
            );
        EXCEPTION WHEN others THEN
            NULL;
        END;
    END IF;
END $$;
