-- ==============================================================================
-- MIGRAÇÃO SUPABASE: SELEÇÃO DE EMPRESA VINCULADA NOS ASSUNTOS DE PETICIONAMENTO
-- SIGCON - Sistema Integrado de Gestão de Conselho
-- ==============================================================================

-- 1. Adiciona a coluna selecionar_empresa_vinculada na tabela cadastros_basicos (se não existir)
ALTER TABLE public.cadastros_basicos 
ADD COLUMN IF NOT EXISTS selecionar_empresa_vinculada BOOLEAN DEFAULT FALSE;

-- 2. Atualiza os assuntos padrão de peticionamento da Pessoa Física (PF) que exigem vínculo com empresa:
--    - Assunção de Responsabilidade Técnica (RT)
--    - Baixa de Responsabilidade Técnica
--    - Defesa Prévia de Notificação / Auto de Fiscalização
UPDATE public.cadastros_basicos 
SET selecionar_empresa_vinculada = TRUE,
    updated_at = timezone('utc'::text, now())
WHERE categoria = 'ASSUNTO_REQUERIMENTO_PF' 
  AND (
    codigo IN ('ASS_RT', 'BAIXA_RT', 'DEF_FISC')
    OR nome ILIKE '%Responsabilidade Técnica%'
    OR nome ILIKE '%Baixa de RT%'
    OR nome ILIKE '%Assunção%'
    OR nome ILIKE '%Auto de Fiscalização%'
  );

-- 3. Confirmação dos dados atualizados
SELECT id, categoria, codigo, nome, ativo, selecionar_empresa_vinculada 
FROM public.cadastros_basicos 
WHERE categoria = 'ASSUNTO_REQUERIMENTO_PF'
ORDER BY ordem ASC;
