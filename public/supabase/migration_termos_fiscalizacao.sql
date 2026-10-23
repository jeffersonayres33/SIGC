-- ==============================================================================
-- SCRIPT DE MIGRAÇÃO - TABELA TERMOS_FISCALIZACAO (SUPABASE / POSTGRESQL)
-- Adiciona todas as colunas necessárias para o Módulo de Fiscalização Eletrônica / Tablet
-- Executar no Editor SQL do Supabase
-- ==============================================================================

-- 1. Garantir que a tabela termos_fiscalizacao exista com colunas base
CREATE TABLE IF NOT EXISTS public.termos_fiscalizacao (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    numero_termo VARCHAR(50) NOT NULL,
    numero_auto_infracao VARCHAR(50),
    tipo_termo VARCHAR(50),
    tipo_visita VARCHAR(50),
    empresa_id TEXT NOT NULL,
    empresa_inscricao VARCHAR(50),
    empresa_razao_social VARCHAR(255),
    empresa_nome VARCHAR(255),
    empresa_cnpj VARCHAR(20),
    cnpj VARCHAR(20),
    endereco TEXT,
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf VARCHAR(2) DEFAULT 'AM',
    cep VARCHAR(10),
    data_fiscalizacao VARCHAR(20) NOT NULL,
    hora_fiscalizacao VARCHAR(20),
    fiscal_matricula VARCHAR(50),
    fiscal_nome VARCHAR(150),
    status VARCHAR(50) DEFAULT 'Concluído e Assinado',
    status_sincronizacao VARCHAR(50) DEFAULT 'Sincronizado',
    irregularidades JSONB DEFAULT '[]'::jsonb,
    prazos JSONB DEFAULT '[]'::jsonb,
    documentos_anexos JSONB DEFAULT '[]'::jsonb,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Adicionar todas as colunas adicionais utilizadas pelo sistema de fiscalização em campo
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS data_hora VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS fiscal_id TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS matricula_fiscal VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS fiscal_assinante_nome VARCHAR(150);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS fiscal_assinante_matricula VARCHAR(50);

ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS endereco_geo TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS rota VARCHAR(100);

ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS presenca_rt BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS rt_presente BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS rt_nome_presente VARCHAR(255);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS rt_presente_nome VARCHAR(255);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS rt_crf_presente VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS rt_presente_inscricao VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS motivo_ausencia_rt TEXT;

ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS documentos_verificados JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS relato_fiscal TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS irregularidades_constatadas JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS infracoes_identificadas JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS artigos_incorridos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS auto_infracao_gerado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS valor_multa_previsto NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS orientacoes_fiscais TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS observacoes_notificado TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS prazo_regularizacao_dias INTEGER;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS notificacao_prazo_dias INTEGER;

ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS assinatura_fiscal TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS assinatura_fiscal_data_hora VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS assinatura_responsavel TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS assinatura_notificado TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS assinatura_notificado_data_hora VARCHAR(50);

ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS recusa_assinatura BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS motivo_recusa TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS observacao_recusa TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS tipo_signatario_notificado VARCHAR(100);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS nome_signatario_notificado VARCHAR(255);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS documento_signatario_notificado VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS inscricao_signatario_notificado VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS cargo_signatario_notificado VARCHAR(100);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS motivo_assinatura_terceiro TEXT;

-- Campos específicos do Tablet de Fiscalização
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS encontrava VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS motivo_fechada TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS rt_situacao VARCHAR(150);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS resp_tecnico_selecionado_nome VARCHAR(255);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS resp_tecnico_selecionado_tipo VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS resp_tecnico_selecionado_inscricao VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS rt_presente_momento_nome VARCHAR(255);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS outras_observacoes_gerais TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS observacao TEXT;

-- Módulo de Notificação
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS notificacao_ativa BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS numero_notificacao VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS notificacao_texto TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS notificacao_observacoes TEXT;

-- Módulo de Intimação
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS intimacao_ativa BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS numero_intimacao VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS intimacao_crt_atualizada BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS intimacao_crt_local_visivel BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS intimacao_alteracao_social BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS intimacao_outras_observacoes TEXT;

-- Módulo de Autuação (Auto de Infração)
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS autuacao_ativa BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS autuacao_ausente BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS autuacao_sem_rt BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS autuacao_chi BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS autuacao_sem_substituto BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS autuacao_ilegal BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS autuacao_privativas BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS autuacao_outras_observacoes TEXT;

-- Atendimento / Signatário
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS atendente_cargo VARCHAR(100);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS atendente_nome VARCHAR(255);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS atendente_rg VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS atendente_cpf VARCHAR(20);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS atendente_inscricao VARCHAR(50);

-- Assinaturas Digitais e Evidências
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS assinatura_estabelecimento TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS assinatura_estabelecimento_data_hora VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS hash_validacao_digital TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS fotos_comprovantes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS foto_evidencias JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS sincronizado BOOLEAN DEFAULT TRUE;

-- 3. Índices de Desempenho
CREATE INDEX IF NOT EXISTS idx_termos_numero ON public.termos_fiscalizacao(numero_termo);
CREATE INDEX IF NOT EXISTS idx_termos_empresa ON public.termos_fiscalizacao(empresa_id);
CREATE INDEX IF NOT EXISTS idx_termos_status ON public.termos_fiscalizacao(status);
CREATE INDEX IF NOT EXISTS idx_termos_cidade ON public.termos_fiscalizacao(cidade);

-- 4. Habilitar RLS e Permissão de Acesso Público
ALTER TABLE public.termos_fiscalizacao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access termos_fiscalizacao" ON public.termos_fiscalizacao;
CREATE POLICY "Public access termos_fiscalizacao" ON public.termos_fiscalizacao FOR ALL USING (true) WITH CHECK (true);
