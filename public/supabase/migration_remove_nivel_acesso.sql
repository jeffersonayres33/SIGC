-- ==============================================================================
-- MIGRAÇÃO SUPABASE: REMOÇÃO DE 'NIVEL_ACESSO' E VINCULAÇÃO A CARGO E SETOR
-- Sistema: SIGC Cloud - Conselho Regional de Farmácia
-- Objetivo: Alinhar o banco de dados com a regra de acesso por Cargo e Setor
-- ==============================================================================

-- 1. Garante que os campos de Cargo, Setor e Permissões de Módulos existam na tabela funcionarios
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS cargo_id VARCHAR(50);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS cargo_nome VARCHAR(150);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS setor_id VARCHAR(50);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS setor_nome VARCHAR(150);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS permissoes_modulos TEXT[] DEFAULT '{}';

-- 2. Remove com segurança a coluna legada 'nivel_acesso' da tabela de funcionários
ALTER TABLE public.funcionarios DROP COLUMN IF EXISTS nivel_acesso;

-- 3. Caso a tabela de cadastros básicos possua a coluna 'nivel_acesso_padrao', remove com segurança
ALTER TABLE public.cadastros_basicos DROP COLUMN IF EXISTS nivel_acesso_padrao;

-- 4. Atualiza o usuário Desenvolvedor Master para garantir acesso irrestrito aos módulos
DO $$
BEGIN
    UPDATE public.funcionarios
    SET 
        cargo_nome = 'Desenvolvedor Master / Arquiteto de Software',
        permissoes_modulos = ARRAY[
            'dashboard', 'profissionais', 'empresas', 'cadastros_basicos', 
            'funcionarios', 'financeiro', 'cobranca_juridico', 'fiscalizacao', 
            'protocolos', 'relatorios', 'formularios', 'portal_inscrito', 
            'configuracoes', 'microsservicos', 'backup_restore', 'admin'
        ],
        ativo = TRUE
    WHERE cpf = '934.135.302-59';
END $$;

-- 5. Garante que funcionários existentes sem módulos definidos recebam ao menos o módulo dashboard
UPDATE public.funcionarios 
SET permissoes_modulos = ARRAY['dashboard']
WHERE permissoes_modulos IS NULL OR cardinality(permissoes_modulos) = 0;
