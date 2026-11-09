-- ==============================================================================
-- MIGRATION: CONTROLE EXCLUSIVO DE ACESSOS E RECURSOS DO PORTAL DO INSCRITO (PF / PJ)
-- ==============================================================================

-- 1. Garante a criação das colunas de acessos de inscritos em council_config
ALTER TABLE IF EXISTS public.council_config
ADD COLUMN IF NOT EXISTS acessos_inscrito_pf JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS acessos_inscrito_pj JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.council_config.acessos_inscrito_pf IS 'Configuração de acessos e recursos reais do Portal do Profissional (PF)';
COMMENT ON COLUMN public.council_config.acessos_inscrito_pj IS 'Configuração de acessos e recursos reais do Portal da Empresa (PJ)';

-- 2. Inicializa os dados padrão caso estejam vazios ou nulos
UPDATE public.council_config
SET 
  acessos_inscrito_pf = COALESCE(
    NULLIF(acessos_inscrito_pf, '{}'::jsonb),
    '{
      "permiteAcessoAoPortal": true,
      "recursosPortal": {
        "dadosCadastrais": { "liberado": true, "permiteEditar": true },
        "vinculosProfissionais": { "liberado": true },
        "certidaoQuitacao": { "liberado": true, "permiteEmitir": true },
        "anuidadeFinanceiro": { "liberado": true, "permiteEmitir": true },
        "protocolosProcessos": { "liberado": true },
        "requerimentoEletronico": { "liberado": true, "permiteEditar": true }
      },
      "modulosPermitidos": ["portal_inscrito", "dados_cadastrais", "anuidade", "protocolo", "requerimento"]
    }'::jsonb
  ),
  acessos_inscrito_pj = COALESCE(
    NULLIF(acessos_inscrito_pj, '{}'::jsonb),
    '{
      "permiteAcessoAoPortal": true,
      "recursosPortal": {
        "dadosEstabelecimento": { "liberado": true, "permiteEditar": false },
        "certidaoCrtDigital": { "liberado": true, "permiteEmitir": true },
        "anuidadeFinanceiro": { "liberado": true, "permiteEmitir": true },
        "protocolosProcessos": { "liberado": true },
        "requerimentoEletronico": { "liberado": true, "permiteEditar": true }
      },
      "modulosPermitidos": ["portal_inscrito", "dados_cadastrais", "anuidade", "protocolo", "requerimento"]
    }'::jsonb
  )
WHERE id = 'default' OR id IS NOT NULL;
