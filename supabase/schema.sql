-- ==============================================================================
-- SISCON - SISTEMA INTEGRADO DE GESTÃO E FISCALIZAÇÃO PROFISSIONAL
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS POSTGRESQL (SUPABASE)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ==============================================================================

-- 1. Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABELA: CONFIGURAÇÃO DO CONSELHO REGIONAL (CRF)
-- ==============================================================================
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
    
    -- Controle de Inscrição Automática
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

-- ==============================================================================
-- 3. TABELA: CADASTROS BÁSICOS & TABELAS AUXILIARES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cadastros_basicos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    categoria VARCHAR(50) NOT NULL, -- 'TIPO_PROFISSIONAL', 'HABILITACAO', 'SITUACAO_PROFISSIONAL', 'TIPO_EMPRESA', 'SITUACAO_EMPRESA'
    nome VARCHAR(150) NOT NULL,
    codigo VARCHAR(50),
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cadastros_basicos_categoria ON public.cadastros_basicos(categoria);

-- ==============================================================================
-- 4. TABELA: PROFISSIONAIS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profissionais (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    inscricao VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(200) NOT NULL,
    cpf VARCHAR(18) NOT NULL UNIQUE,
    rg VARCHAR(30),
    orgao_expeditor VARCHAR(30),
    data_nascimento VARCHAR(20),
    sexo VARCHAR(20),
    nacionalidade VARCHAR(50) DEFAULT 'BRASILEIRA',
    naturalidade VARCHAR(100),
    nome_mae VARCHAR(200) NOT NULL,
    nome_pai VARCHAR(200),
    situacao VARCHAR(50) NOT NULL DEFAULT 'Definitivo',
    tipo_associado VARCHAR(100) NOT NULL DEFAULT 'Farmacêutico',
    habilitacoes TEXT[] DEFAULT '{}',
    data_inscricao VARCHAR(20),
    data_colacao_grau VARCHAR(20),
    data_exp_diploma VARCHAR(20),
    faculdade VARCHAR(200),
    email_comercial VARCHAR(150),
    email_pessoal VARCHAR(150),
    telefone VARCHAR(50),
    celular VARCHAR(50),
    endereco TEXT,
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf VARCHAR(2),
    cep VARCHAR(10),
    status_financeiro VARCHAR(50) DEFAULT 'Adimplente',
    carteira_profissional VARCHAR(50),
    foto_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profissionais_cpf ON public.profissionais(cpf);
CREATE INDEX IF NOT EXISTS idx_profissionais_inscricao ON public.profissionais(inscricao);
CREATE INDEX IF NOT EXISTS idx_profissionais_nome ON public.profissionais(nome);
CREATE INDEX IF NOT EXISTS idx_profissionais_situacao ON public.profissionais(situacao);

-- ==============================================================================
-- 5. TABELA: EMPRESAS (PESSOAS JURÍDICAS / ESTABELECIMENTOS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.empresas (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    cnpj VARCHAR(20) NOT NULL UNIQUE,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    inscricao VARCHAR(50) NOT NULL UNIQUE,
    inscricao_estadual VARCHAR(50),
    categoria VARCHAR(100),
    tipo_estabelecimento VARCHAR(100) NOT NULL,
    natureza_atividade TEXT,
    tipo_empresa VARCHAR(50) DEFAULT 'Matriz',
    condicao VARCHAR(50) DEFAULT 'Regular',
    situacao VARCHAR(50) DEFAULT 'Definitiva',
    capital_social NUMERIC(15,2) DEFAULT 0.00,
    assistencia_plena BOOLEAN DEFAULT TRUE,
    data_inscricao VARCHAR(20),
    validade_crt VARCHAR(20),
    numero_crt VARCHAR(50),
    numero_processo VARCHAR(50),
    endereco TEXT,
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf VARCHAR(2),
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
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON public.empresas(cnpj);
CREATE INDEX IF NOT EXISTS idx_empresas_inscricao ON public.empresas(inscricao);
CREATE INDEX IF NOT EXISTS idx_empresas_razao_social ON public.empresas(razao_social);

-- ==============================================================================
-- 6. TABELA: LANÇAMENTOS FINANCEIROS (ANUÍDADES, TAXAS, MULTAS, BOLETOS, PIX)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.lancamentos_financeiros (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    target_id TEXT NOT NULL,
    target_tipo VARCHAR(20) NOT NULL, -- 'PROFISSIONAL' ou 'EMPRESA'
    target_nome VARCHAR(255) NOT NULL,
    target_doc VARCHAR(20) NOT NULL,
    target_inscricao VARCHAR(50) NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_lancamentos_target_doc ON public.lancamentos_financeiros(target_doc);
CREATE INDEX IF NOT EXISTS idx_lancamentos_target_inscricao ON public.lancamentos_financeiros(target_inscricao);
CREATE INDEX IF NOT EXISTS idx_lancamentos_status ON public.lancamentos_financeiros(status);

-- ==============================================================================
-- 7. TABELA: PROCESSOS DE COBRANÇA & DÍVIDA ATIVA (CDA)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.processos_cobranca (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    target_id TEXT NOT NULL,
    target_tipo VARCHAR(20) NOT NULL,
    target_nome VARCHAR(255) NOT NULL,
    target_doc VARCHAR(20) NOT NULL,
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
    parcelas_acordo INTEGER,
    valor_parcela_acordo NUMERIC(12,2),
    historico_notificacoes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cobranca_target_doc ON public.processos_cobranca(target_doc);

-- ==============================================================================
-- 8. TABELA: TERMOS E AUTOS DE FISCALIZAÇÃO
-- ==============================================================================
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
    data_fiscalizacao VARCHAR(20),
    hora_fiscalizacao VARCHAR(20),
    data_hora VARCHAR(50),
    fiscal_id TEXT,
    fiscal_nome VARCHAR(150),
    fiscal_matricula VARCHAR(50),
    matricula_fiscal VARCHAR(50),
    fiscal_assinante_nome VARCHAR(150),
    fiscal_assinante_matricula VARCHAR(50),
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    endereco_geo TEXT,
    presenca_rt BOOLEAN DEFAULT FALSE,
    rt_presente BOOLEAN DEFAULT FALSE,
    rt_nome_presente VARCHAR(150),
    rt_presente_nome VARCHAR(150),
    rt_crf_presente VARCHAR(50),
    rt_presente_inscricao VARCHAR(50),
    motivo_ausencia_rt TEXT,
    documentos_verificados JSONB DEFAULT '{}'::jsonb,
    relato_fiscal TEXT,
    irregularidades_constatadas TEXT[] DEFAULT '{}',
    infracoes_identificadas TEXT[] DEFAULT '{}',
    artigos_incorridos TEXT[] DEFAULT '{}',
    auto_infracao_gerado BOOLEAN DEFAULT FALSE,
    valor_multa_previsto NUMERIC(12,2) DEFAULT 0.00,
    orientacoes_fiscais TEXT,
    observacoes_notificado TEXT,
    prazo_regularizacao_dias INTEGER,
    notificacao_prazo_dias INTEGER,
    status VARCHAR(50) DEFAULT 'Concluído e Assinado',
    status_sincronizacao VARCHAR(50) DEFAULT 'Sincronizado',
    assinatura_fiscal TEXT,
    assinatura_fiscal_data_hora VARCHAR(50),
    assinatura_responsavel TEXT,
    assinatura_notificado TEXT,
    assinatura_notificado_data_hora VARCHAR(50),
    recusa_assinatura BOOLEAN DEFAULT FALSE,
    motivo_recusa TEXT,
    tipo_signatario_notificado VARCHAR(50),
    nome_signatario_notificado VARCHAR(150),
    documento_signatario_notificado VARCHAR(50),
    inscricao_signatario_notificado VARCHAR(50),
    cargo_signatario_notificado VARCHAR(100),
    motivo_assinatura_terceiro TEXT,
    hash_validacao_digital VARCHAR(100),
    fotos_comprovantes TEXT[] DEFAULT '{}',
    foto_evidencias TEXT[] DEFAULT '{}',
    sincronizado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_termos_empresa_id ON public.termos_fiscalizacao(empresa_id);
CREATE INDEX IF NOT EXISTS idx_termos_numero ON public.termos_fiscalizacao(numero_termo);

-- ==============================================================================
-- 9. TABELA: PROTOCOLOS E PROCESSOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.protocolos_processos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    numero_protocolo VARCHAR(50) NOT NULL UNIQUE,
    tipo VARCHAR(100) NOT NULL,
    interessado VARCHAR(255) NOT NULL,
    documento_interessado VARCHAR(30) NOT NULL,
    data_inscricao VARCHAR(20),
    data_abertura VARCHAR(20) NOT NULL,
    data_ultima_atualizacao VARCHAR(20),
    prazo_resposta VARCHAR(20),
    status VARCHAR(50) DEFAULT 'Em Análise',
    setor_atual VARCHAR(100) DEFAULT 'Secretaria Geral',
    conselheiro_relator VARCHAR(150),
    parecer_relator TEXT,
    decisao_plenario TEXT,
    anexos TEXT[] DEFAULT '{}',
    historico JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_protocolos_numero ON public.protocolos_processos(numero_protocolo);
CREATE INDEX IF NOT EXISTS idx_protocolos_doc ON public.protocolos_processos(documento_interessado);

-- ==============================================================================
-- 10. TABELA: FORMULÁRIOS DINÂMICOS & RESPOSTAS
-- ==============================================================================
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

-- ==============================================================================
-- 11. HABILITAR ROW LEVEL SECURITY (RLS) E POLÍTICAS DE ACESSO
-- Permite leitura e escrita pelo client anon/autenticado da aplicação SISCON
-- ==============================================================================
ALTER TABLE public.council_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadastros_basicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termos_fiscalizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocolos_processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formularios_dinamicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_formularios ENABLE ROW LEVEL SECURITY;

-- Políticas públicas irrestritas (para uso com a anon key no frontend do SISCON)
DROP POLICY IF EXISTS "Public access council_config" ON public.council_config;
CREATE POLICY "Public access council_config" ON public.council_config FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access cadastros_basicos" ON public.cadastros_basicos;
CREATE POLICY "Public access cadastros_basicos" ON public.cadastros_basicos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access profissionais" ON public.profissionais;
CREATE POLICY "Public access profissionais" ON public.profissionais FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access empresas" ON public.empresas;
CREATE POLICY "Public access empresas" ON public.empresas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access lancamentos_financeiros" ON public.lancamentos_financeiros;
CREATE POLICY "Public access lancamentos_financeiros" ON public.lancamentos_financeiros FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access processos_cobranca" ON public.processos_cobranca;
CREATE POLICY "Public access processos_cobranca" ON public.processos_cobranca FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access termos_fiscalizacao" ON public.termos_fiscalizacao;
CREATE POLICY "Public access termos_fiscalizacao" ON public.termos_fiscalizacao FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access protocolos_processos" ON public.protocolos_processos;
CREATE POLICY "Public access protocolos_processos" ON public.protocolos_processos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access formularios_dinamicos" ON public.formularios_dinamicos;
CREATE POLICY "Public access formularios_dinamicos" ON public.formularios_dinamicos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access respostas_formularios" ON public.respostas_formularios;
CREATE POLICY "Public access respostas_formularios" ON public.respostas_formularios FOR ALL USING (true) WITH CHECK (true);
