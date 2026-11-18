-- ==============================================================================
-- SIGCON - SISTEMA INTEGRADO DE GESTÃO E FISCALIZAÇÃO PROFISSIONAL
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
-- 0. MIGRAÇÃO AUTOMÁTICA DE COLUNAS LEGADAS UUID -> TEXT (COMPATIBILIDADE TOTAL)
-- Garante que IDs textuais (ex: 'func-admin-master', 'func_179...', 'prot-...')
-- não falhem com "invalid input syntax for type uuid" em bancos já existentes.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    pol RECORD;
    fk RECORD;
    col RECORD;
    target_tables text[] := ARRAY[
        'council_config', 'cadastros_basicos', 'regras_assistencia',
        'profissionais', 'empresas', 'lancamentos_financeiros',
        'processos_cobranca', 'termos_fiscalizacao', 'protocolos_processos',
        'formularios_dinamicos', 'respostas_formularios', 'historico_vinculos_profissionais',
        'historico_auditoria', 'funcionarios', 'perfis_permissoes_usuario'
    ];
BEGIN
    FOR pol IN
        SELECT tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = ANY(target_tables)
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, pol.tablename);
    END LOOP;

    FOR fk IN
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.table_schema = 'public'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = ANY(target_tables)
    LOOP
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I;', fk.table_name, fk.constraint_name);
    END LOOP;

    FOR col IN
        SELECT c.table_name, c.column_name
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.data_type = 'uuid'
          AND c.table_name = ANY(target_tables)
    LOOP
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP DEFAULT;', col.table_name, col.column_name);
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE TEXT USING %I::text;', col.table_name, col.column_name, col.column_name);
        IF col.column_name = 'id' AND col.table_name <> 'council_config' THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;', col.table_name);
        END IF;
    END LOOP;
END $$;

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
    vice_presidente VARCHAR(150),
    tesoureiro VARCHAR(150),
    secretario_geral VARCHAR(150),
    assinatura_presidente_url TEXT,
    assinatura_vice_presidente_url TEXT,
    assinatura_tesoureiro_url TEXT,
    assinatura_secretario_geral_url TEXT,
    assinatura_certidao_papel VARCHAR(50) DEFAULT 'PRESIDENTE',
    resolucao_anuidade VARCHAR(100),
    valor_anuidade_pf NUMERIC(10,2) DEFAULT 620.00,
    valor_anuidade_pj NUMERIC(10,2) DEFAULT 1240.00,
    chave_pix VARCHAR(150),
    total_profissionais_registrados INTEGER DEFAULT 11480,
    total_empresas_registradas INTEGER DEFAULT 1340,
    protocolo_proximo_numero INTEGER DEFAULT 1,
    protocolo_ultimo_ano INTEGER DEFAULT 2026,
    protocolo_reinicia_ano BOOLEAN DEFAULT TRUE,
    protocolo_prefixo_interno VARCHAR(30) DEFAULT '',
    protocolo_sufixo_interno VARCHAR(30) DEFAULT '',
    protocolo_prefixo_inscrito VARCHAR(30) DEFAULT '',
    protocolo_sufixo_inscrito VARCHAR(30) DEFAULT '-INS',
    protocolo_prefixo_site VARCHAR(30) DEFAULT '',
    protocolo_sufixo_site VARCHAR(30) DEFAULT '-SITE',
    proximo_numero_inscricao_profissional INTEGER DEFAULT 4150,
    prefixo_inscricao_profissional VARCHAR(20) DEFAULT 'CRF-AM',
    sufixo_inscricao_profissional VARCHAR(20) DEFAULT '',
    digitos_minimos_inscricao_profissional INTEGER DEFAULT 4,
    proximo_numero_inscricao_empresa INTEGER DEFAULT 1250,
    prefixo_inscricao_empresa VARCHAR(20) DEFAULT 'CRF-AM',
    sufixo_inscricao_empresa VARCHAR(20) DEFAULT '-PJ',
    digitos_minimos_inscricao_empresa INTEGER DEFAULT 4,
    proximo_numero_inscricao_provisoria_profissional INTEGER DEFAULT 1,
    prefixo_inscricao_provisoria_profissional VARCHAR(20) DEFAULT 'PROV-PF',
    sufixo_inscricao_provisoria_profissional VARCHAR(20) DEFAULT '',
    digitos_minimos_inscricao_provisoria_profissional INTEGER DEFAULT 4,
    proximo_numero_inscricao_provisoria_empresa INTEGER DEFAULT 1,
    prefixo_inscricao_provisoria_empresa VARCHAR(20) DEFAULT 'PROV-PJ',
    sufixo_inscricao_provisoria_empresa VARCHAR(20) DEFAULT '',
    digitos_minimos_inscricao_provisoria_empresa INTEGER DEFAULT 4,
    validade_provisoria_meses_profissional INTEGER DEFAULT 12,
    validade_provisoria_meses_empresa INTEGER DEFAULT 12,
    validar_cpf BOOLEAN DEFAULT TRUE,
    validar_cnpj BOOLEAN DEFAULT TRUE,
    validar_cep BOOLEAN DEFAULT TRUE,
    auto_preencher_endereco_cep BOOLEAN DEFAULT TRUE,
    tamanho_maximo_anexo_mb INTEGER DEFAULT 10,
    situacoes_impedidas_rt JSONB DEFAULT '[]'::jsonb,
    texto_padrao_notificacao TEXT,
    proximo_numero_notificacao INTEGER DEFAULT 1,
    proximo_numero_intimacao INTEGER DEFAULT 1,
    proximo_numero_termo INTEGER DEFAULT 1,
    proximo_numero_autuacao INTEGER DEFAULT 1,
    geolocalizacao_ativa BOOLEAN DEFAULT TRUE,
    acessos_inscrito_pf JSONB DEFAULT '{}'::jsonb,
    acessos_inscrito_pj JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS vice_presidente VARCHAR(150);
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS assinatura_presidente_url TEXT;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS assinatura_vice_presidente_url TEXT;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS assinatura_tesoureiro_url TEXT;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS assinatura_secretario_geral_url TEXT;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS assinatura_certidao_papel VARCHAR(50) DEFAULT 'PRESIDENTE';
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS protocolo_proximo_numero INTEGER DEFAULT 1;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS protocolo_ultimo_ano INTEGER DEFAULT 2026;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS protocolo_reinicia_ano BOOLEAN DEFAULT TRUE;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS protocolo_prefixo_interno VARCHAR(30) DEFAULT '';
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS protocolo_sufixo_interno VARCHAR(30) DEFAULT '';
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS protocolo_prefixo_inscrito VARCHAR(30) DEFAULT '';
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS protocolo_sufixo_inscrito VARCHAR(30) DEFAULT '-INS';
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS protocolo_prefixo_site VARCHAR(30) DEFAULT '';
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS protocolo_sufixo_site VARCHAR(30) DEFAULT '-SITE';
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS proximo_numero_inscricao_provisoria_profissional INTEGER DEFAULT 1;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS prefixo_inscricao_provisoria_profissional VARCHAR(20) DEFAULT 'PROV-PF';
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS sufixo_inscricao_provisoria_profissional VARCHAR(20) DEFAULT '';
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS digitos_minimos_inscricao_provisoria_profissional INTEGER DEFAULT 4;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS proximo_numero_inscricao_provisoria_empresa INTEGER DEFAULT 1;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS prefixo_inscricao_provisoria_empresa VARCHAR(20) DEFAULT 'PROV-PJ';
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS sufixo_inscricao_provisoria_empresa VARCHAR(20) DEFAULT '';
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS digitos_minimos_inscricao_provisoria_empresa INTEGER DEFAULT 4;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS validade_provisoria_meses_profissional INTEGER DEFAULT 12;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS validade_provisoria_meses_empresa INTEGER DEFAULT 12;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS tamanho_maximo_anexo_mb INTEGER DEFAULT 10;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS situacoes_impedidas_rt JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS texto_padrao_notificacao TEXT;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS proximo_numero_notificacao INTEGER DEFAULT 1;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS proximo_numero_intimacao INTEGER DEFAULT 1;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS proximo_numero_termo INTEGER DEFAULT 1;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS proximo_numero_autuacao INTEGER DEFAULT 1;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS geolocalizacao_ativa BOOLEAN DEFAULT TRUE;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS acessos_inscrito_pf JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS acessos_inscrito_pj JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS protocolo_regras_cores JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS protocolo_mostrar_legenda_dias BOOLEAN DEFAULT TRUE;

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
    ordem NUMERIC(10,2) DEFAULT 0,
    selecionar_empresa_vinculada BOOLEAN DEFAULT FALSE,
    cargo_id VARCHAR(50),
    cargo_nome VARCHAR(150),
    setor_id VARCHAR(50),
    setor_nome VARCHAR(150),
    modulos_permitidos TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.cadastros_basicos ADD COLUMN IF NOT EXISTS selecionar_empresa_vinculada BOOLEAN DEFAULT FALSE;
ALTER TABLE public.cadastros_basicos ADD COLUMN IF NOT EXISTS cargo_id VARCHAR(50);
ALTER TABLE public.cadastros_basicos ADD COLUMN IF NOT EXISTS cargo_nome VARCHAR(150);
ALTER TABLE public.cadastros_basicos ADD COLUMN IF NOT EXISTS setor_id VARCHAR(50);
ALTER TABLE public.cadastros_basicos ADD COLUMN IF NOT EXISTS setor_nome VARCHAR(150);
ALTER TABLE public.cadastros_basicos ADD COLUMN IF NOT EXISTS modulos_permitidos TEXT[] DEFAULT '{}';
ALTER TABLE public.cadastros_basicos ALTER COLUMN ordem TYPE NUMERIC(10,2) USING ordem::numeric;

CREATE INDEX IF NOT EXISTS idx_cadastros_basicos_cat ON public.cadastros_basicos(categoria);

-- ------------------------------------------------------------------------------
-- 3. REGRAS DE ASSISTÊNCIA FARMACÊUTICA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.regras_assistencia (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    municipio VARCHAR(100) NOT NULL,
    tipo_estabelecimento VARCHAR(100) NOT NULL,
    tipo_exigencia VARCHAR(100) DEFAULT 'ASSISTENCIA_PLENA',
    horas_minimas NUMERIC(10,2) NOT NULL DEFAULT 40,
    dias_semana TEXT[] DEFAULT '{}',
    descricao TEXT,
    base_legal TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.regras_assistencia ADD COLUMN IF NOT EXISTS tipo_exigencia VARCHAR(100) DEFAULT 'ASSISTENCIA_PLENA';
ALTER TABLE public.regras_assistencia ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE public.regras_assistencia ADD COLUMN IF NOT EXISTS base_legal TEXT;
ALTER TABLE public.regras_assistencia ALTER COLUMN horas_minimas TYPE NUMERIC(10,2) USING horas_minimas::numeric;

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
    e_colaborador_crf BOOLEAN DEFAULT FALSE,
    matricula_colaborador VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Ativo';
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS situacao VARCHAR(50) DEFAULT 'Definitivo';
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS status_financeiro VARCHAR(50) DEFAULT 'Adimplente';
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS recadastrado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS data_recadastramento VARCHAR(20);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS dt_inicio_insc VARCHAR(20);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS categoria VARCHAR(100) DEFAULT 'Farmacêutico';
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS especialidade VARCHAR(100);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS email VARCHAR(150);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS e_colaborador_crf BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS matricula_colaborador VARCHAR(50);

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
    carga_horaria_funcionamento_semanal NUMERIC(10,2) DEFAULT 0.00,
    carga_horaria_assistencia_semanal NUMERIC(10,2) DEFAULT 0.00,
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

ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Regular';
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS condicao VARCHAR(50) DEFAULT 'Regular';
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS situacao VARCHAR(50) DEFAULT 'Definitiva';
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS status_financeiro VARCHAR(50) DEFAULT 'Adimplente';
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS recadastrado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS data_recadastramento VARCHAR(20);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS dt_inicio_insc VARCHAR(20);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS carga_horaria_funcionamento_semanal NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS carga_horaria_assistencia_semanal NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.empresas ALTER COLUMN carga_horaria_funcionamento_semanal TYPE NUMERIC(10,2) USING carga_horaria_funcionamento_semanal::numeric;
ALTER TABLE public.empresas ALTER COLUMN carga_horaria_assistencia_semanal TYPE NUMERIC(10,2) USING carga_horaria_assistencia_semanal::numeric;

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
    assunto TEXT,
    interessado VARCHAR(255) NOT NULL,
    documento_interessado VARCHAR(100) NOT NULL,
    tipo_interessado VARCHAR(30) DEFAULT 'PUBLICO',
    vinculo_id TEXT,
    vinculo_inscricao VARCHAR(50),
    vinculo_detalhes TEXT,
    contato_email VARCHAR(150),
    contato_telefone VARCHAR(50),
    data_inscricao VARCHAR(20),
    data_abertura VARCHAR(20) NOT NULL,
    data_ultima_atualizacao VARCHAR(20),
    prazo_resposta VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Em Análise',
    setor_atual VARCHAR(100) DEFAULT 'Secretaria Geral',
    conselheiro_relator VARCHAR(150),
    parecer_relator TEXT,
    decisao_plenario TEXT,
    anexos JSONB DEFAULT '[]'::jsonb,
    anexos_detalhados JSONB DEFAULT '[]'::jsonb,
    conteudo_completo_formulario JSONB DEFAULT '{}'::jsonb,
    historico JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.protocolos_processos ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Em Análise';
ALTER TABLE public.protocolos_processos ADD COLUMN IF NOT EXISTS assunto TEXT;
ALTER TABLE public.protocolos_processos ADD COLUMN IF NOT EXISTS tipo_interessado VARCHAR(30) DEFAULT 'PUBLICO';
ALTER TABLE public.protocolos_processos ADD COLUMN IF NOT EXISTS vinculo_id TEXT;
ALTER TABLE public.protocolos_processos ADD COLUMN IF NOT EXISTS vinculo_inscricao VARCHAR(50);
ALTER TABLE public.protocolos_processos ADD COLUMN IF NOT EXISTS vinculo_detalhes TEXT;
ALTER TABLE public.protocolos_processos ADD COLUMN IF NOT EXISTS contato_email VARCHAR(150);
ALTER TABLE public.protocolos_processos ADD COLUMN IF NOT EXISTS contato_telefone VARCHAR(50);
ALTER TABLE public.protocolos_processos ADD COLUMN IF NOT EXISTS anexos_detalhados JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.protocolos_processos ADD COLUMN IF NOT EXISTS conteudo_completo_formulario JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.protocolos_processos ALTER COLUMN documento_interessado TYPE VARCHAR(100);
ALTER TABLE public.protocolos_processos ALTER COLUMN prazo_resposta TYPE VARCHAR(50);

-- Converter anexos de text[] legado para JSONB com segurança
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'protocolos_processos'
          AND column_name = 'anexos'
          AND data_type = 'ARRAY'
    ) THEN
        ALTER TABLE public.protocolos_processos ALTER COLUMN anexos DROP DEFAULT;
        ALTER TABLE public.protocolos_processos ALTER COLUMN anexos TYPE JSONB USING to_jsonb(anexos);
        ALTER TABLE public.protocolos_processos ALTER COLUMN anexos SET DEFAULT '[]'::jsonb;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'protocolos_processos_numero_protocolo_key')
       AND NOT EXISTS (SELECT 1 FROM public.protocolos_processos GROUP BY numero_protocolo HAVING COUNT(*) > 1) THEN
        ALTER TABLE public.protocolos_processos ADD CONSTRAINT protocolos_processos_numero_protocolo_key UNIQUE (numero_protocolo);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_protocolos_numero ON public.protocolos_processos(numero_protocolo);
CREATE INDEX IF NOT EXISTS idx_protocolos_status ON public.protocolos_processos(status);
CREATE INDEX IF NOT EXISTS idx_protocolos_interessado ON public.protocolos_processos(documento_interessado);

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
    publicar_profissional BOOLEAN DEFAULT FALSE,
    publicar_empresa BOOLEAN DEFAULT FALSE,
    publicar_site BOOLEAN DEFAULT FALSE,
    permite_anexos BOOLEAN DEFAULT TRUE,
    tipos_anexos_permitidos JSONB DEFAULT '[]'::jsonb,
    tamanho_maximo_mb INTEGER DEFAULT 15,
    instrucoes_anexo TEXT,
    setor_tramitacao_id TEXT,
    setor_tramitacao_nome VARCHAR(100),
    status_protocolo_inicial VARCHAR(50),
    prazo_dias_conclusao INTEGER DEFAULT 15,
    permite_anonimo BOOLEAN DEFAULT FALSE,
    vincular_empresas_profissional BOOLEAN DEFAULT FALSE,
    vincular_profissionais_empresa BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.formularios_dinamicos ADD COLUMN IF NOT EXISTS publicar_profissional BOOLEAN DEFAULT FALSE;
ALTER TABLE public.formularios_dinamicos ADD COLUMN IF NOT EXISTS publicar_empresa BOOLEAN DEFAULT FALSE;
ALTER TABLE public.formularios_dinamicos ADD COLUMN IF NOT EXISTS publicar_site BOOLEAN DEFAULT FALSE;
ALTER TABLE public.formularios_dinamicos ADD COLUMN IF NOT EXISTS permite_anexos BOOLEAN DEFAULT TRUE;
ALTER TABLE public.formularios_dinamicos ADD COLUMN IF NOT EXISTS tipos_anexos_permitidos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.formularios_dinamicos ADD COLUMN IF NOT EXISTS tamanho_maximo_mb INTEGER DEFAULT 15;
ALTER TABLE public.formularios_dinamicos ADD COLUMN IF NOT EXISTS instrucoes_anexo TEXT;
ALTER TABLE public.formularios_dinamicos ADD COLUMN IF NOT EXISTS setor_tramitacao_id TEXT;
ALTER TABLE public.formularios_dinamicos ADD COLUMN IF NOT EXISTS setor_tramitacao_nome VARCHAR(100);
ALTER TABLE public.formularios_dinamicos ADD COLUMN IF NOT EXISTS status_protocolo_inicial VARCHAR(50);
ALTER TABLE public.formularios_dinamicos ADD COLUMN IF NOT EXISTS prazo_dias_conclusao INTEGER DEFAULT 15;
ALTER TABLE public.formularios_dinamicos ADD COLUMN IF NOT EXISTS permite_anonimo BOOLEAN DEFAULT FALSE;
ALTER TABLE public.formularios_dinamicos ADD COLUMN IF NOT EXISTS vincular_empresas_profissional BOOLEAN DEFAULT FALSE;
ALTER TABLE public.formularios_dinamicos ADD COLUMN IF NOT EXISTS vincular_profissionais_empresa BOOLEAN DEFAULT FALSE;
ALTER TABLE public.formularios_dinamicos ALTER COLUMN versao TYPE VARCHAR(20) USING versao::text;

CREATE TABLE IF NOT EXISTS public.respostas_formularios (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    formulario_id TEXT NOT NULL,
    formulario_titulo VARCHAR(255) NOT NULL,
    autor_nome VARCHAR(255) NOT NULL,
    autor_documento VARCHAR(100) NOT NULL,
    protocolo_gerado VARCHAR(50) NOT NULL,
    data_envio VARCHAR(30) NOT NULL,
    respostas JSONB DEFAULT '{}'::jsonb,
    dados_campos JSONB DEFAULT '{}'::jsonb,
    canal_origem VARCHAR(50) DEFAULT 'PROFISSIONAL',
    autor_email VARCHAR(150),
    autor_telefone VARCHAR(50),
    anexos JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'Em Análise',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.respostas_formularios ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Em Análise';
ALTER TABLE public.respostas_formularios ADD COLUMN IF NOT EXISTS canal_origem VARCHAR(50) DEFAULT 'PROFISSIONAL';
ALTER TABLE public.respostas_formularios ADD COLUMN IF NOT EXISTS autor_email VARCHAR(150);
ALTER TABLE public.respostas_formularios ADD COLUMN IF NOT EXISTS autor_telefone VARCHAR(50);
ALTER TABLE public.respostas_formularios ADD COLUMN IF NOT EXISTS anexos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.respostas_formularios ALTER COLUMN autor_documento TYPE VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_respostas_form_id ON public.respostas_formularios(formulario_id);
CREATE INDEX IF NOT EXISTS idx_respostas_protocolo ON public.respostas_formularios(protocolo_gerado);

-- ------------------------------------------------------------------------------
-- 11. HISTÓRICO DE VÍNCULOS PROFISSIONAIS (RT)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.historico_vinculos_profissionais (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    profissional_id TEXT NOT NULL,
    profissional_inscricao VARCHAR(50),
    profissional_nome VARCHAR(255),
    empresa_id TEXT NOT NULL,
    empresa_razao_social VARCHAR(255) NOT NULL,
    empresa_nome_fantasia VARCHAR(255),
    empresa_cnpj VARCHAR(20) NOT NULL,
    empresa_inscricao VARCHAR(50),
    cargo VARCHAR(150) NOT NULL,
    situacao_vinculo VARCHAR(100) DEFAULT 'CTPS',
    carga_horaria_semanal NUMERIC(10,2) DEFAULT 0.00,
    data_inicio VARCHAR(20) NOT NULL,
    data_baixa VARCHAR(20),
    motivo_baixa TEXT,
    protocolo_baixa VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Ativo',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hist_vinculos_prof ON public.historico_vinculos_profissionais(profissional_id);
CREATE INDEX IF NOT EXISTS idx_hist_vinculos_emp ON public.historico_vinculos_profissionais(empresa_id);

-- ------------------------------------------------------------------------------
-- 12. HISTÓRICO DE AUDITORIA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.historico_auditoria (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    target_id TEXT NOT NULL,
    target_tipo VARCHAR(20) NOT NULL,
    usuario VARCHAR(150),
    data_formatada VARCHAR(30),
    campo VARCHAR(100),
    timestamp VARCHAR(30),
    target_nome VARCHAR(255),
    target_doc VARCHAR(50),
    usuario_nome VARCHAR(150),
    usuario_papel VARCHAR(50),
    acao VARCHAR(100),
    campo_alterado VARCHAR(100),
    valor_anterior TEXT,
    valor_novo TEXT,
    motivo TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.historico_auditoria ADD COLUMN IF NOT EXISTS usuario VARCHAR(150);
ALTER TABLE public.historico_auditoria ADD COLUMN IF NOT EXISTS data_formatada VARCHAR(30);
ALTER TABLE public.historico_auditoria ADD COLUMN IF NOT EXISTS campo VARCHAR(100);
ALTER TABLE public.historico_auditoria ADD COLUMN IF NOT EXISTS timestamp VARCHAR(30);
ALTER TABLE public.historico_auditoria ADD COLUMN IF NOT EXISTS target_nome VARCHAR(255);
ALTER TABLE public.historico_auditoria ADD COLUMN IF NOT EXISTS target_doc VARCHAR(50);
ALTER TABLE public.historico_auditoria ADD COLUMN IF NOT EXISTS usuario_nome VARCHAR(150);
ALTER TABLE public.historico_auditoria ADD COLUMN IF NOT EXISTS usuario_papel VARCHAR(50);
ALTER TABLE public.historico_auditoria ADD COLUMN IF NOT EXISTS acao VARCHAR(100);
ALTER TABLE public.historico_auditoria ADD COLUMN IF NOT EXISTS campo_alterado VARCHAR(100);

DO $$
DECLARE
    col text;
BEGIN
    FOREACH col IN ARRAY ARRAY['timestamp', 'target_nome', 'target_doc', 'usuario_nome', 'usuario_papel', 'acao', 'campo_alterado']
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'historico_auditoria'
              AND column_name = col
              AND is_nullable = 'NO'
        ) THEN
            EXECUTE format('ALTER TABLE public.historico_auditoria ALTER COLUMN %I DROP NOT NULL;', col);
        END IF;
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 13. FUNCIONÁRIOS E USUÁRIO DESENVOLVEDOR MASTER
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
    role VARCHAR(50) DEFAULT 'FUNCIONARIO',
    permissoes_modulos TEXT[] DEFAULT '{}',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_admissao VARCHAR(20),
    senha_hash VARCHAR(255),
    primeiro_acesso_pendente BOOLEAN NOT NULL DEFAULT TRUE,
    zerar_senha_pendente BOOLEAN NOT NULL DEFAULT FALSE,
    ultimo_acesso VARCHAR(50),
    observacoes TEXT,
    possui_inscricao_profissional BOOLEAN DEFAULT FALSE,
    numero_inscricao_profissional VARCHAR(50),
    setor_permissao_protocolos VARCHAR(50) DEFAULT 'APENAS_MEU',
    setores_permitidos_protocolos TEXT[] DEFAULT '{}',
    responsavel_permissao_protocolos VARCHAR(50) DEFAULT 'TODOS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'FUNCIONARIO';
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS possui_inscricao_profissional BOOLEAN DEFAULT FALSE;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS numero_inscricao_profissional VARCHAR(50);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS setor_permissao_protocolos VARCHAR(50) DEFAULT 'APENAS_MEU';
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS setores_permitidos_protocolos TEXT[] DEFAULT '{}';
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS responsavel_permissao_protocolos VARCHAR(50) DEFAULT 'TODOS';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.funcionarios WHERE cpf = '934.135.302-59') THEN
        UPDATE public.funcionarios SET
            nome = 'Jefferson Ayres (Desenvolvedor)',
            cargo_nome = 'Desenvolvedor Master / Arquiteto de Software',
            permissoes_modulos = ARRAY['dashboard', 'profissionais', 'empresas', 'cadastros_basicos', 'funcionarios', 'financeiro', 'cobranca_juridico', 'fiscalizacao', 'protocolos', 'relatorios', 'formularios', 'website', 'transparencia', 'portal_inscrito', 'configuracoes', 'microsservicos', 'backup_restore', 'admin'],
            ativo = TRUE
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
            ARRAY['dashboard', 'profissionais', 'empresas', 'cadastros_basicos', 'funcionarios', 'financeiro', 'cobranca_juridico', 'fiscalizacao', 'protocolos', 'relatorios', 'formularios', 'website', 'transparencia', 'portal_inscrito', 'configuracoes', 'microsservicos', 'backup_restore', 'admin'],
            TRUE,
            '2020-01-01',
            NULL,
            TRUE,
            FALSE,
            'Aguardando primeiro acesso',
            'Desenvolvedor Master com autoridade máxima acima do Administrador.'
        );
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 14. TABELA DE PERMISSÕES E PERFIS DE USUÁRIOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.perfis_permissoes_usuario (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    usuario_id VARCHAR(100),
    documento VARCHAR(20),
    tipo_perfil VARCHAR(50),
    nome VARCHAR(255),
    cargo_ou_titulo VARCHAR(150),
    matricula VARCHAR(50),
    numero_inscricao VARCHAR(50),
    modulos_permitidos TEXT[] DEFAULT '{}',
    permissoes_acoes JSONB DEFAULT '{}'::jsonb,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.perfis_permissoes_usuario ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(100);
ALTER TABLE public.perfis_permissoes_usuario ADD COLUMN IF NOT EXISTS documento VARCHAR(20);
ALTER TABLE public.perfis_permissoes_usuario ADD COLUMN IF NOT EXISTS tipo_perfil VARCHAR(50);
ALTER TABLE public.perfis_permissoes_usuario ADD COLUMN IF NOT EXISTS nome VARCHAR(255);
ALTER TABLE public.perfis_permissoes_usuario ADD COLUMN IF NOT EXISTS cargo_ou_titulo VARCHAR(150);
ALTER TABLE public.perfis_permissoes_usuario ADD COLUMN IF NOT EXISTS matricula VARCHAR(50);
ALTER TABLE public.perfis_permissoes_usuario ADD COLUMN IF NOT EXISTS numero_inscricao VARCHAR(50);
ALTER TABLE public.perfis_permissoes_usuario ADD COLUMN IF NOT EXISTS modulos_permitidos TEXT[] DEFAULT '{}';
ALTER TABLE public.perfis_permissoes_usuario ADD COLUMN IF NOT EXISTS permissoes_acoes JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.perfis_permissoes_usuario ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
ALTER TABLE public.perfis_permissoes_usuario ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.perfis_permissoes_usuario ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'perfis_permissoes_usuario'
          AND column_name = 'cpf'
    ) THEN
        UPDATE public.perfis_permissoes_usuario
        SET documento = COALESCE(documento, cpf)
        WHERE documento IS NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_perfis_permissoes_doc ON public.perfis_permissoes_usuario(documento);
CREATE INDEX IF NOT EXISTS idx_perfis_permissoes_tipo ON public.perfis_permissoes_usuario(tipo_perfil);

-- ------------------------------------------------------------------------------
-- 15. MÓDULO WEBSITE (CONFIGURAÇÃO, NOTÍCIAS, BANNERS) & PORTAL TRANSPARÊNCIA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.website_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    noticias_por_pagina INTEGER DEFAULT 6,
    logo_url TEXT DEFAULT '',
    titulo_site VARCHAR(255) DEFAULT '',
    subtitulo_site TEXT DEFAULT '',
    menus JSONB DEFAULT '[]'::jsonb,
    transparencia_menus JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.website_config ADD COLUMN IF NOT EXISTS noticias_por_pagina INTEGER DEFAULT 6;
ALTER TABLE public.website_config ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '';
ALTER TABLE public.website_config ADD COLUMN IF NOT EXISTS titulo_site VARCHAR(255) DEFAULT '';
ALTER TABLE public.website_config ADD COLUMN IF NOT EXISTS subtitulo_site TEXT DEFAULT '';
ALTER TABLE public.website_config ADD COLUMN IF NOT EXISTS menus JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.website_config ADD COLUMN IF NOT EXISTS transparencia_menus JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.website_noticias (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    titulo VARCHAR(255) NOT NULL,
    resumo TEXT,
    conteudo TEXT,
    categoria VARCHAR(100) DEFAULT 'Institucional',
    data_publicacao VARCHAR(30),
    autor VARCHAR(150) DEFAULT 'Assessoria de Comunicação',
    imagem_url TEXT,
    destaque BOOLEAN DEFAULT FALSE,
    publicado BOOLEAN DEFAULT TRUE,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.website_noticias ADD COLUMN IF NOT EXISTS destaque BOOLEAN DEFAULT FALSE;
ALTER TABLE public.website_noticias ADD COLUMN IF NOT EXISTS publicado BOOLEAN DEFAULT TRUE;
ALTER TABLE public.website_noticias ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_website_noticias_publicado ON public.website_noticias(publicado);
CREATE INDEX IF NOT EXISTS idx_website_noticias_ordem ON public.website_noticias(ordem);

CREATE TABLE IF NOT EXISTS public.website_banners (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    titulo VARCHAR(255) NOT NULL,
    subtitulo TEXT,
    imagem_url TEXT,
    texto_botao VARCHAR(100),
    link_destino TEXT,
    ordem INTEGER DEFAULT 1,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.website_banners ADD COLUMN IF NOT EXISTS texto_botao VARCHAR(100);
ALTER TABLE public.website_banners ADD COLUMN IF NOT EXISTS link_destino TEXT;
ALTER TABLE public.website_banners ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 1;
ALTER TABLE public.website_banners ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_website_banners_ativo ON public.website_banners(ativo);
CREATE INDEX IF NOT EXISTS idx_website_banners_ordem ON public.website_banners(ordem);

CREATE TABLE IF NOT EXISTS public.transparencia_documentos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100) NOT NULL,
    exercicio INTEGER NOT NULL,
    competencia VARCHAR(100),
    data_publicacao VARCHAR(30),
    valor_total NUMERIC(14,2),
    responsavel VARCHAR(150),
    numero_documento VARCHAR(100),
    arquivo_nome VARCHAR(255),
    arquivo_tipo VARCHAR(150),
    arquivo_tamanho NUMERIC(12,2),
    arquivo_tamanho_bytes BIGINT,
    arquivo_url TEXT,
    storage_path TEXT,
    publicado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transparencia_documentos ADD COLUMN IF NOT EXISTS competencia VARCHAR(100);
ALTER TABLE public.transparencia_documentos ADD COLUMN IF NOT EXISTS valor_total NUMERIC(14,2);
ALTER TABLE public.transparencia_documentos ADD COLUMN IF NOT EXISTS responsavel VARCHAR(150);
ALTER TABLE public.transparencia_documentos ADD COLUMN IF NOT EXISTS numero_documento VARCHAR(100);
ALTER TABLE public.transparencia_documentos ADD COLUMN IF NOT EXISTS arquivo_nome VARCHAR(255);
ALTER TABLE public.transparencia_documentos ADD COLUMN IF NOT EXISTS arquivo_tipo VARCHAR(150);
ALTER TABLE public.transparencia_documentos ADD COLUMN IF NOT EXISTS arquivo_tamanho NUMERIC(12,2);
ALTER TABLE public.transparencia_documentos ADD COLUMN IF NOT EXISTS arquivo_tamanho_bytes BIGINT;
ALTER TABLE public.transparencia_documentos ADD COLUMN IF NOT EXISTS arquivo_url TEXT;
ALTER TABLE public.transparencia_documentos ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.transparencia_documentos ADD COLUMN IF NOT EXISTS publicado BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_transparencia_exercicio ON public.transparencia_documentos(exercicio);
CREATE INDEX IF NOT EXISTS idx_transparencia_categoria ON public.transparencia_documentos(categoria);
CREATE INDEX IF NOT EXISTS idx_transparencia_publicado ON public.transparencia_documentos(publicado);

-- ------------------------------------------------------------------------------
-- 16. TRIGGERS DE ATUALIZAÇÃO E ROW LEVEL SECURITY (RLS) 100% IDEMPOTENTE
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'council_config', 'cadastros_basicos', 'regras_assistencia',
        'profissionais', 'empresas', 'lancamentos_financeiros',
        'processos_cobranca', 'termos_fiscalizacao', 'protocolos_processos',
        'formularios_dinamicos', 'respostas_formularios', 'historico_vinculos_profissionais',
        'historico_auditoria', 'funcionarios', 'perfis_permissoes_usuario',
        'website_config', 'website_noticias', 'website_banners', 'transparencia_documentos'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public access %I" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Public access %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);

        IF tbl <> 'historico_auditoria' THEN
            EXECUTE format('DROP TRIGGER IF EXISTS trg_update_%I ON public.%I;', tbl, tbl);
            EXECUTE format('CREATE TRIGGER trg_update_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();', tbl, tbl);
        END IF;
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 16. OBJECT STORAGE PARA ARQUIVOS ORIGINAIS (BUCKET `sigcon-documentos`)
-- Preserva os arquivos exatamente como enviados sem inflar o PostgreSQL
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('storage.buckets') IS NOT NULL THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES ('sigcon-documentos', 'sigcon-documentos', true, 52428800, NULL)
        ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800;

        DROP POLICY IF EXISTS "Public access sigcon-documentos" ON storage.objects;
        CREATE POLICY "Public access sigcon-documentos" ON storage.objects
            FOR ALL USING (bucket_id = 'sigcon-documentos') WITH CHECK (bucket_id = 'sigcon-documentos');
    END IF;
END $$;

