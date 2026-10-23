-- ==============================================================================
-- SISCON - SISTEMA INTEGRADO DE GESTÃO E FISCALIZAÇÃO PROFISSIONAL
-- SCRIPT MESTRE DE BANCO DE DADOS POSTGRESQL (SUPABASE) - 100% IDEMPOTENTE
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função de gatilho para atualização automática da coluna updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. CONFIGURAÇÃO DO CONSELHO
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.council_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    sigla VARCHAR(20) NOT NULL DEFAULT 'CRF-AM',
    nome_completo VARCHAR(255) NOT NULL,
    jurisdicao VARCHAR(100) NOT NULL,
    cidade_sede VARCHAR(100) NOT NULL,
    uf VARCHAR(2) NOT NULL,
    cnpj VARCHAR(20) NOT NULL,
    endereco TEXT,
    bairro VARCHAR(100),
    cep VARCHAR(10),
    telefone VARCHAR(50),
    email VARCHAR(150),
    site VARCHAR(150),
    presidente VARCHAR(150),
    tesoureiro VARCHAR(150),
    secretario_geral VARCHAR(150),
    resolucao_anuidade VARCHAR(100),
    valor_anuidade_pf NUMERIC(10,2) DEFAULT 620.00,
    valor_anuidade_pj NUMERIC(10,2) DEFAULT 1240.00,
    chave_pix VARCHAR(150),
    total_profissionais_registrados INTEGER DEFAULT 11480,
    total_empresas_registradas INTEGER DEFAULT 1340,
    proximo_numero_inscricao_profissional INTEGER DEFAULT 4150,
    prefixo_inscricao_profissional VARCHAR(20) DEFAULT 'CRF-AM',
    sufixo_inscricao_profissional VARCHAR(20) DEFAULT '',
    digitos_minimos_inscricao_profissional INTEGER DEFAULT 4,
    proximo_numero_inscricao_empresa INTEGER DEFAULT 1250,
    prefixo_inscricao_empresa VARCHAR(20) DEFAULT 'CRF-AM',
    sufixo_inscricao_empresa VARCHAR(20) DEFAULT '-PJ',
    digitos_minimos_inscricao_empresa INTEGER DEFAULT 4,
    validar_cpf BOOLEAN DEFAULT TRUE,
    validar_cnpj BOOLEAN DEFAULT TRUE,
    validar_cep BOOLEAN DEFAULT TRUE,
    auto_preencher_endereco_cep BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 2. CADASTROS BÁSICOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cadastros_basicos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    categoria VARCHAR(50) NOT NULL,
    nome VARCHAR(150) NOT NULL,
    codigo VARCHAR(50),
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cadastros_basicos_cat ON public.cadastros_basicos(categoria);

-- ------------------------------------------------------------------------------
-- 3. REGRAS DE ASSISTÊNCIA FARMACÊUTICA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.regras_assistencia (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    municipio VARCHAR(100) NOT NULL,
    tipo_estabelecimento VARCHAR(100) NOT NULL,
    horas_minimas INTEGER NOT NULL DEFAULT 40,
    dias_semana TEXT[] DEFAULT '{}',
    ativo BOOLEAN DEFAULT true,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_regras_municipio_tipo ON public.regras_assistencia(municipio, tipo_estabelecimento);

-- ------------------------------------------------------------------------------
-- 4. PROFISSIONAIS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profissionais (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    inscricao VARCHAR(50) NOT NULL,
    inscricao_anterior VARCHAR(50),
    inscricao_definitiva_anterior VARCHAR(50),
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(20) NOT NULL,
    rg VARCHAR(50),
    orgao_expeditor VARCHAR(30),
    data_nascimento VARCHAR(20),
    sexo VARCHAR(20),
    nacionalidade VARCHAR(50) DEFAULT 'BRASILEIRA',
    naturalidade VARCHAR(100),
    nome_mae VARCHAR(200) NOT NULL,
    nome_pai VARCHAR(200),
    situacao VARCHAR(50) NOT NULL DEFAULT 'Definitivo',
    status VARCHAR(50) DEFAULT 'Ativo',
    motivo_situacao VARCHAR(150),
    dt_inicio_insc_provisoria VARCHAR(20),
    dt_venc_insc_provisoria VARCHAR(20),
    data_solicitacao_baixa VARCHAR(20),
    data_reabilitacao VARCHAR(20),
    data_conversao_definitiva VARCHAR(20),
    anuidade_reduzida BOOLEAN DEFAULT FALSE,
    isento_anuidade BOOLEAN DEFAULT FALSE,
    e_votante BOOLEAN DEFAULT TRUE,
    e_militar BOOLEAN DEFAULT FALSE,
    estado_civil VARCHAR(50),
    transferido_outro_regional BOOLEAN DEFAULT FALSE,
    nr_inscricao_regional_origem VARCHAR(50),
    anuid_ref_ano_insc_em_dia BOOLEAN DEFAULT FALSE,
    uf_regional_origem VARCHAR(2),
    dt_vencto_militar VARCHAR(20),
    data_mandato_seguranca VARCHAR(20),
    orgao_mandato_seguranca VARCHAR(150),
    observacao_mandato TEXT,
    forma_envio_boleto_parcelamento VARCHAR(100),
    grupo_sanguineo VARCHAR(5),
    fator_rh VARCHAR(5),
    doador_orgaos_tecidos BOOLEAN DEFAULT FALSE,
    participou_curso_qualifarma VARCHAR(100),
    rg_data_expedicao VARCHAR(20),
    rg_data_vencimento VARCHAR(20),
    titulo_eleitoral VARCHAR(50),
    titulo_zona VARCHAR(20),
    titulo_secao VARCHAR(20),
    titulo_uf_exp VARCHAR(2),
    reservista VARCHAR(50),
    cart_trabalho VARCHAR(50),
    cart_trabalho_serie VARCHAR(30),
    cart_trabalho_uf_exp VARCHAR(2),
    cart_trabalho_data_exp VARCHAR(20),
    nome_social VARCHAR(200),
    recadastrado BOOLEAN DEFAULT FALSE,
    data_recadastramento VARCHAR(20),
    tipo_associado VARCHAR(100) NOT NULL DEFAULT 'Farmacêutico',
    categoria VARCHAR(100) DEFAULT 'Farmacêutico',
    especialidade VARCHAR(100),
    habilitacoes TEXT[] DEFAULT '{}',
    data_inscricao VARCHAR(20),
    dt_inicio_insc VARCHAR(20),
    data_colacao_grau VARCHAR(20),
    data_exp_diploma VARCHAR(20),
    faculdade VARCHAR(200),
    email_comercial VARCHAR(150),
    email_pessoal VARCHAR(150),
    email VARCHAR(150),
    telefone VARCHAR(50),
    celular VARCHAR(50),
    endereco TEXT,
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf VARCHAR(2) DEFAULT 'AM',
    cep VARCHAR(10),
    status_financeiro VARCHAR(50) DEFAULT 'Adimplente',
    carteira_profissional VARCHAR(50),
    foto_url TEXT,
    observacoes TEXT,
    bloqueado BOOLEAN DEFAULT FALSE,
    motivo_bloqueio VARCHAR(150),
    data_bloqueio VARCHAR(20),
    data_desbloqueio_prevista VARCHAR(20),
    usuario_bloqueio VARCHAR(150),
    observacoes_bloqueio TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir colunas em profissionais para tabelas pré-existentes
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Ativo';
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS situacao VARCHAR(50) DEFAULT 'Definitivo';
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS status_financeiro VARCHAR(50) DEFAULT 'Adimplente';
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS recadastrado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS data_recadastramento VARCHAR(20);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS dt_inicio_insc VARCHAR(20);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS categoria VARCHAR(100) DEFAULT 'Farmacêutico';
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS especialidade VARCHAR(100);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS email VARCHAR(150);

-- Garantir restrições UNIQUE para CPF e Inscrição
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profissionais_cpf_key') THEN
        ALTER TABLE public.profissionais ADD CONSTRAINT profissionais_cpf_key UNIQUE (cpf);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profissionais_inscricao_key') THEN
        ALTER TABLE public.profissionais ADD CONSTRAINT profissionais_inscricao_key UNIQUE (inscricao);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profissionais_cpf ON public.profissionais(cpf);
CREATE INDEX IF NOT EXISTS idx_profissionais_inscricao ON public.profissionais(inscricao);
CREATE INDEX IF NOT EXISTS idx_profissionais_nome ON public.profissionais(nome);
CREATE INDEX IF NOT EXISTS idx_profissionais_situacao ON public.profissionais(situacao);
CREATE INDEX IF NOT EXISTS idx_profissionais_status ON public.profissionais(status);
CREATE INDEX IF NOT EXISTS idx_profissionais_cidade ON public.profissionais(cidade);

-- ------------------------------------------------------------------------------
-- 5. EMPRESAS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.empresas (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    cnpj VARCHAR(20) NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    inscricao VARCHAR(50) NOT NULL,
    inscricao_anterior VARCHAR(50),
    inscricao_definitiva_anterior VARCHAR(50),
    dt_inicio_insc_provisoria VARCHAR(20),
    dt_venc_insc_provisoria VARCHAR(20),
    data_conversao_definitiva VARCHAR(20),
    inscricao_estadual VARCHAR(50),
    categoria VARCHAR(100),
    categoria_empresa VARCHAR(100),
    tipo VARCHAR(50),
    tipo_estabelecimento VARCHAR(100) NOT NULL,
    natureza_atividade TEXT,
    tipo_empresa VARCHAR(50) DEFAULT 'PRIVADO',
    condicao VARCHAR(50) DEFAULT 'Regular',
    situacao VARCHAR(50) DEFAULT 'Definitiva',
    status VARCHAR(50) DEFAULT 'Regular',
    motivo_situacao VARCHAR(150),
    capital_social NUMERIC(15,2) DEFAULT 0.00,
    assistencia_plena BOOLEAN DEFAULT TRUE,
    isento_anuidade BOOLEAN DEFAULT FALSE,
    anuidade_reduzida BOOLEAN DEFAULT FALSE,
    recadastrado BOOLEAN DEFAULT FALSE,
    data_recadastramento VARCHAR(20),
    isento_taxa_certificado BOOLEAN DEFAULT FALSE,
    horario_plantao VARCHAR(50),
    horas_tolerancia VARCHAR(20),
    data_inscricao VARCHAR(20),
    dt_inicio_insc VARCHAR(20),
    validade_crt VARCHAR(20),
    numero_crt VARCHAR(50),
    numero_processo VARCHAR(50),
    endereco TEXT,
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf VARCHAR(2) DEFAULT 'AM',
    cep VARCHAR(10),
    rota VARCHAR(100),
    area VARCHAR(100),
    telefone VARCHAR(50),
    email VARCHAR(150),
    status_financeiro VARCHAR(50) DEFAULT 'Adimplente',
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    ultima_fiscalizacao VARCHAR(30),
    resultado_ultima_fiscalizacao VARCHAR(50),
    socios JSONB DEFAULT '[]'::jsonb,
    responsaveis_tecnicos JSONB DEFAULT '[]'::jsonb,
    horarios_funcionamento JSONB DEFAULT '[]'::jsonb,
    horarios_assistencia JSONB DEFAULT '[]'::jsonb,
    carga_horaria_funcionamento_semanal INTEGER DEFAULT 0,
    carga_horaria_assistencia_semanal INTEGER DEFAULT 0,
    justificativa_condicao TEXT,
    regra_assistencia_aplicada VARCHAR(150),
    bloqueado BOOLEAN DEFAULT FALSE,
    motivo_bloqueio VARCHAR(150),
    data_bloqueio VARCHAR(20),
    data_desbloqueio_prevista VARCHAR(20),
    usuario_bloqueio VARCHAR(150),
    observacoes_bloqueio TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir colunas em empresas para tabelas pré-existentes
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Regular';
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS condicao VARCHAR(50) DEFAULT 'Regular';
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS situacao VARCHAR(50) DEFAULT 'Definitiva';
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS status_financeiro VARCHAR(50) DEFAULT 'Adimplente';
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS recadastrado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS data_recadastramento VARCHAR(20);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS dt_inicio_insc VARCHAR(20);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'empresas_cnpj_key') THEN
        ALTER TABLE public.empresas ADD CONSTRAINT empresas_cnpj_key UNIQUE (cnpj);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'empresas_inscricao_key') THEN
        ALTER TABLE public.empresas ADD CONSTRAINT empresas_inscricao_key UNIQUE (inscricao);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON public.empresas(cnpj);
CREATE INDEX IF NOT EXISTS idx_empresas_inscricao ON public.empresas(inscricao);
CREATE INDEX IF NOT EXISTS idx_empresas_condicao ON public.empresas(condicao);
CREATE INDEX IF NOT EXISTS idx_empresas_status ON public.empresas(status);
CREATE INDEX IF NOT EXISTS idx_empresas_cidade ON public.empresas(cidade);

-- ------------------------------------------------------------------------------
-- 6. LANÇAMENTOS FINANCEIROS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lancamentos_financeiros (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    target_id TEXT NOT NULL,
    target_tipo VARCHAR(20) NOT NULL,
    target_nome VARCHAR(255) NOT NULL,
    target_doc VARCHAR(20) NOT NULL,
    target_inscricao VARCHAR(50) NOT NULL,
    cpf_cnpj VARCHAR(20),
    tipo_documento VARCHAR(50),
    numero_documento VARCHAR(50),
    nome_sacado VARCHAR(255),
    tipo_sacado VARCHAR(20),
    valor_nominal NUMERIC(12,2),
    valor_pago NUMERIC(12,2) DEFAULT 0.00,
    descricao TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    exercicio INTEGER NOT NULL,
    parcela VARCHAR(20),
    valor_original NUMERIC(12,2) NOT NULL,
    desconto NUMERIC(12,2) DEFAULT 0.00,
    juros_multa NUMERIC(12,2) DEFAULT 0.00,
    valor_total NUMERIC(12,2) NOT NULL,
    data_emissao VARCHAR(20) NOT NULL,
    data_vencimento VARCHAR(20) NOT NULL,
    data_pagamento VARCHAR(20),
    status VARCHAR(50) DEFAULT 'Pendente',
    codigo_barras TEXT,
    linha_digitavel TEXT,
    pix_copia_e_cola TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.lancamentos_financeiros ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pendente';
ALTER TABLE public.lancamentos_financeiros ADD COLUMN IF NOT EXISTS cpf_cnpj VARCHAR(20);
ALTER TABLE public.lancamentos_financeiros ADD COLUMN IF NOT EXISTS data_vencimento VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_lancamentos_target_doc ON public.lancamentos_financeiros(target_doc);
CREATE INDEX IF NOT EXISTS idx_lancamentos_status ON public.lancamentos_financeiros(status);

-- ------------------------------------------------------------------------------
-- 7. PROCESSOS DE COBRANÇA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.processos_cobranca (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    target_id TEXT NOT NULL,
    target_tipo VARCHAR(20) NOT NULL,
    target_nome VARCHAR(255) NOT NULL,
    target_doc VARCHAR(20) NOT NULL,
    cpf_cnpj VARCHAR(20),
    target_inscricao VARCHAR(50) NOT NULL,
    valor_total_debito NUMERIC(12,2) NOT NULL,
    qtd_lancamentos INTEGER DEFAULT 1,
    fase_cobranca VARCHAR(100) NOT NULL,
    data_inicio VARCHAR(20) NOT NULL,
    data_ultima_notificacao VARCHAR(20),
    data_limite_defesa VARCHAR(20),
    numero_cda VARCHAR(50),
    livro_cda VARCHAR(20),
    folha_cda VARCHAR(20),
    data_cda VARCHAR(20),
    status_acordo VARCHAR(50) DEFAULT 'Sem Acordo',
    status VARCHAR(50) DEFAULT 'Em Andamento',
    parcelas_acordo INTEGER,
    valor_parcela_acordo NUMERIC(12,2),
    historico_notificacoes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.processos_cobranca ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Em Andamento';
ALTER TABLE public.processos_cobranca ADD COLUMN IF NOT EXISTS status_acordo VARCHAR(50) DEFAULT 'Sem Acordo';
ALTER TABLE public.processos_cobranca ADD COLUMN IF NOT EXISTS fase_cobranca VARCHAR(100) DEFAULT 'Notificação Inicial';

CREATE INDEX IF NOT EXISTS idx_cobranca_target_doc ON public.processos_cobranca(target_doc);
CREATE INDEX IF NOT EXISTS idx_cobranca_fase ON public.processos_cobranca(fase_cobranca);
CREATE INDEX IF NOT EXISTS idx_cobranca_status ON public.processos_cobranca(status);

-- ------------------------------------------------------------------------------
-- 8. TERMOS DE FISCALIZAÇÃO
-- ------------------------------------------------------------------------------
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

ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Concluído e Assinado';
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS status_sincronizacao VARCHAR(50) DEFAULT 'Sincronizado';
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
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS encontrava VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS motivo_fechada TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS rt_situacao VARCHAR(150);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS resp_tecnico_selecionado_nome VARCHAR(255);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS resp_tecnico_selecionado_tipo VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS resp_tecnico_selecionado_inscricao VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS rt_presente_momento_nome VARCHAR(255);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS outras_observacoes_gerais TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS observacao TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS notificacao_ativa BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS numero_notificacao VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS notificacao_texto TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS notificacao_observacoes TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS intimacao_ativa BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS numero_intimacao VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS intimacao_crt_atualizada BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS intimacao_crt_local_visivel BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS intimacao_alteracao_social BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS intimacao_outras_observacoes TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS autuacao_ativa BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS autuacao_ausente BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS autuacao_sem_rt BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS autuacao_chi BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS autuacao_sem_substituto BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS autuacao_ilegal BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS autuacao_privativas BOOLEAN DEFAULT FALSE;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS autuacao_outras_observacoes TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS atendente_cargo VARCHAR(100);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS atendente_nome VARCHAR(255);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS atendente_rg VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS atendente_cpf VARCHAR(20);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS atendente_inscricao VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS assinatura_estabelecimento TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS assinatura_estabelecimento_data_hora VARCHAR(50);
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS hash_validacao_digital TEXT;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS fotos_comprovantes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS foto_evidencias JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.termos_fiscalizacao ADD COLUMN IF NOT EXISTS sincronizado BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_termos_numero ON public.termos_fiscalizacao(numero_termo);
CREATE INDEX IF NOT EXISTS idx_termos_status ON public.termos_fiscalizacao(status);

-- ------------------------------------------------------------------------------
-- 9. PROTOCOLOS E PROCESSOS ADMINISTRATIVOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.protocolos_processos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    numero_protocolo VARCHAR(50) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    interessado VARCHAR(255) NOT NULL,
    documento_interessado VARCHAR(20) NOT NULL,
    data_inscricao VARCHAR(20),
    data_abertura VARCHAR(20) NOT NULL,
    data_ultima_atualizacao VARCHAR(20),
    prazo_resposta VARCHAR(20),
    status VARCHAR(50) DEFAULT 'Em Análise',
    setor_atual VARCHAR(100) DEFAULT 'Secretaria Geral',
    conselheiro_relator VARCHAR(150),
    parecer_relator TEXT,
    decisao_plenario TEXT,
    anexos JSONB DEFAULT '[]'::jsonb,
    historico JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.protocolos_processos ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Em Análise';

CREATE INDEX IF NOT EXISTS idx_protocolos_numero ON public.protocolos_processos(numero_protocolo);
CREATE INDEX IF NOT EXISTS idx_protocolos_status ON public.protocolos_processos(status);

-- ------------------------------------------------------------------------------
-- 10. FORMULÁRIOS DINÂMICOS E RESPOSTAS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.formularios_dinamicos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    titulo VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    descricao TEXT,
    publico_alvo VARCHAR(50) DEFAULT 'Ambos',
    versao VARCHAR(20) DEFAULT '1.0',
    ativo BOOLEAN DEFAULT TRUE,
    campos JSONB NOT NULL DEFAULT '[]'::jsonb,
    respostas_recebidas INTEGER DEFAULT 0,
    data_criacao VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.respostas_formularios (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    formulario_id TEXT NOT NULL,
    formulario_titulo VARCHAR(255) NOT NULL,
    autor_nome VARCHAR(255) NOT NULL,
    autor_documento VARCHAR(30) NOT NULL,
    protocolo_gerado VARCHAR(50) NOT NULL,
    data_envio VARCHAR(30) NOT NULL,
    respostas JSONB DEFAULT '{}'::jsonb,
    dados_campos JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'Em Análise',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.respostas_formularios ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Em Análise';

-- ------------------------------------------------------------------------------
-- 11. HISTÓRICO DE AUDITORIA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.historico_auditoria (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    timestamp VARCHAR(30) NOT NULL,
    target_id TEXT NOT NULL,
    target_tipo VARCHAR(20) NOT NULL,
    target_nome VARCHAR(255) NOT NULL,
    target_doc VARCHAR(30) NOT NULL,
    usuario_nome VARCHAR(100) NOT NULL,
    usuario_papel VARCHAR(50) NOT NULL,
    acao VARCHAR(100) NOT NULL,
    campo_alterado VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    motivo TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- TRIGGERS DE ATUALIZAÇÃO
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN (
            'council_config', 'cadastros_basicos', 'regras_assistencia', 
            'profissionais', 'empresas', 'lancamentos_financeiros', 
            'processos_cobranca', 'termos_fiscalizacao', 'protocolos_processos', 
            'formularios_dinamicos', 'respostas_formularios'
          )
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_update_%I ON public.%I;', t, t);
        EXECUTE format('CREATE TRIGGER trg_update_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();', t, t);
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) & POLÍTICAS PÚBLICAS RE-EXECUTÁVEIS
-- ------------------------------------------------------------------------------
ALTER TABLE public.council_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadastros_basicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regras_assistencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termos_fiscalizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocolos_processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formularios_dinamicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_formularios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_auditoria ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'council_config', 'cadastros_basicos', 'regras_assistencia', 
            'profissionais', 'empresas', 'lancamentos_financeiros', 
            'processos_cobranca', 'termos_fiscalizacao', 'protocolos_processos', 
            'formularios_dinamicos', 'respostas_formularios', 'historico_auditoria', 'funcionarios'
        ])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public access %I" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Public access %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- TABELA DE FUNCIONÁRIOS E USUÁRIO DESENVOLVEDOR MASTER
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.funcionarios (
    id VARCHAR(100) PRIMARY KEY,
    nome VARCHAR(250) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    rg VARCHAR(50),
    matricula VARCHAR(50) NOT NULL UNIQUE,
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

ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access funcionarios" ON public.funcionarios;
CREATE POLICY "Public access funcionarios" ON public.funcionarios FOR ALL USING (true) WITH CHECK (true);

-- Usuário Desenvolvedor Supremo: Jefferson Ayres (CPF: 934.135.302-59)
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
    NULL,
    TRUE,
    FALSE,
    'Aguardando primeiro acesso',
    'Desenvolvedor Master com autoridade máxima acima do Administrador.'
)
ON CONFLICT (cpf) DO UPDATE SET
    nome = EXCLUDED.nome,
    cargo_nome = EXCLUDED.cargo_nome,
    permissoes_modulos = EXCLUDED.permissoes_modulos,
    ativo = TRUE;

