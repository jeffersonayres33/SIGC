import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  ExternalLink, 
  UploadCloud, 
  ShieldCheck, 
  X,
  Server,
  Layers,
  FileCode2,
  Check,
  Zap
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { checkSupabaseConnection, SupabaseHealthCheck } from '../../services/supabaseClient';

interface SupabaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseManagerModal: React.FC<SupabaseManagerModalProps> = ({ isOpen, onClose }) => {
  const [health, setHealth] = useState<SupabaseHealthCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'sql' | 'tables'>('status');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ajcdrtsdozbjvsdyhdly.supabase.co';

  useEffect(() => {
    if (isOpen) {
      handleCheckHealth();
    }
  }, [isOpen]);

  const handleCheckHealth = async () => {
    setLoading(true);
    const res = await storageService.testAndSyncSupabase();
    setHealth(res);
    setLoading(false);
  };

  const handleMigrate = async () => {
    setMigrating(true);
    setMigrationResult(null);
    const res = await storageService.migrateAllToSupabase();
    setMigrationResult(res);
    setMigrating(false);
    if (res.success) {
      handleCheckHealth();
    }
  };

  const handleCopySql = () => {
    fetch('/supabase/schema.sql')
      .then(res => res.text())
      .then(text => {
        navigator.clipboard.writeText(text);
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 3000);
      })
      .catch(() => {
        // Fallback SQL
        navigator.clipboard.writeText(SQL_SCHEMA_SNIPPET);
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 3000);
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-linear-to-r from-emerald-800 via-teal-800 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-400/30 text-emerald-300">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Integração com Banco Supabase</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  PostgreSQL
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">Conexão, sincronização e migração de dados em tempo real</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'status'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4" />
            Status da Conexão
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            Script SQL (DDL)
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'tables'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            Estrutura das Tabelas
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Endpoint Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Projeto Conectado</span>
                  <a 
                    href="https://supabase.com/dashboard/project/ajcdrtsdozbjvsdyhdly"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:underline"
                  >
                    Abrir Painel do Supabase <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 break-all">
                  <span className="text-slate-400 select-none">URL:</span>
                  <span className="font-bold text-emerald-700">{supabaseUrl}</span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                health?.connected && !health?.error
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : health?.connected && health?.error
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : 'bg-rose-50/80 border-rose-200 text-rose-900'
              }`}>
                {health?.connected && !health?.error ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                ) : health?.connected && health?.error ? (
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                )}

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm">
                      {health?.connected && !health?.error
                        ? 'Conexão Ativa com o Supabase'
                        : health?.connected && health?.error
                        ? 'Conectado ao Supabase (Requer Criação de Tabelas)'
                        : 'Falha na Conexão com o Supabase'}
                    </h4>
                    {health?.latencyMs && (
                      <span className="text-xs px-2 py-0.5 rounded bg-white/80 border text-slate-600 font-mono">
                        {health.latencyMs} ms
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1 text-slate-600">
                    {health?.error || 'O SISCON está autenticado e pronto para ler e persistir dados diretamente nas tabelas do PostgreSQL no Supabase.'}
                  </p>
                </div>
              </div>

              {/* Migration Action Box */}
              <div className="bg-linear-to-br from-slate-900 to-teal-950 rounded-xl p-5 text-white shadow-lg space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Sincronização & Migração de Dados (Seed Inicial)</h4>
                    <p className="text-xs text-slate-300">
                      Envia todos os Profissionais, Empresas, Lançamentos Financeiros, Autos de Fiscalização e Configurações para o seu banco Supabase.
                    </p>
                  </div>
                </div>

                {migrationResult && (
                  <div className={`p-3 rounded-lg text-xs font-medium ${
                    migrationResult.success 
                      ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-200' 
                      : 'bg-rose-500/20 border border-rose-400/40 text-rose-200'
                  }`}>
                    {migrationResult.message}
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    onClick={handleMigrate}
                    disabled={migrating}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    {migrating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Migrando Registros para o Supabase...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-emerald-200" />
                        Migrar Todos os Dados para o Supabase
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCheckHealth}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Testar Conexão
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" /> Como aplicar as tabelas no Supabase:
                </div>
                <ol className="list-decimal list-inside pl-1 space-y-1 text-amber-800">
                  <li>Clique no botão <strong>"Copiar Script SQL"</strong> abaixo;</li>
                  <li>Abra o <strong>SQL Editor</strong> do seu projeto Supabase (<a href="https://supabase.com/dashboard/project/ajcdrtsdozbjvsdyhdly/sql" target="_blank" rel="noreferrer" className="underline font-semibold">clique aqui</a>);</li>
                  <li>Cole o script e clique em <strong>Run</strong> (Executar);</li>
                  <li>Retorne aqui e clique em <strong>"Migrar Todos os Dados"</strong>.</li>
                </ol>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">DDL Completo do Banco (PostgreSQL)</span>
                  <button
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-200" />
                        Copiado para a Área de Transferência!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Script SQL Completo
                      </>
                    )}
                  </button>
                </div>

                <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono max-h-96 overflow-y-auto border border-slate-800 leading-relaxed select-all">
                  {SQL_SCHEMA_SNIPPET}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'tables' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TABLES_LIST.map((t, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      public.{t.name}
                    </span>
                    <span title="RLS Habilitado">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </span>
                  </div>
                  <h5 className="font-semibold text-sm text-slate-800 mt-2">{t.label}</h5>
                  <p className="text-xs text-slate-500 mt-1">{t.desc}</p>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Supabase Client JS v2 inicializado e pronto
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

const TABLES_LIST = [
  { name: 'council_config', label: 'Configurações do Conselho', desc: 'Dados do CRF-AM, presidente, tesoureiro, taxas e controle de numeração cronológica.' },
  { name: 'cadastros_basicos', label: 'Tabelas Auxiliares', desc: 'Tipos de Profissional, Especialidades/Habilitações, Situações e Tipos de Empresa.' },
  { name: 'profissionais', label: 'Cadastro de Profissionais', desc: 'Farmacêuticos, dados civis, filiação (mãe/pai), fotos, contato e endereços.' },
  { name: 'empresas', label: 'Pessoas Jurídicas (F协rmas)', desc: 'Farmácias, drogarias, laboratórios, QSA (Sócios) e Responsáveis Técnicos (RTs).' },
  { name: 'lancamentos_financeiros', label: 'Lançamentos & Anuidades', desc: 'Anuidades, taxas de CRT/ART, multas, boletos e PIX Copia e Cola.' },
  { name: 'processos_cobranca', label: 'Dívida Ativa & Cobrança', desc: 'Processos de execução fiscal, acordos, termos e Certidões de Dívida Ativa (CDA).' },
  { name: 'termos_fiscalizacao', label: 'Fiscalização & Autos de Infração', desc: 'Inspeções in loco, geolocalização, presenças de RT e assinaturas digitais.' },
  { name: 'protocolos_processos', label: 'Protocolo e Tramitação', desc: 'Processos administrativos, pareceres de relatores e decisões de plenário.' },
  { name: 'formularios_dinamicos', label: 'Formulários & Serviços Online', desc: 'Construtor de formulários, campos dinâmicos e fluxos de autoatendimento.' },
  { name: 'respostas_formularios', label: 'Submissões de Formulários', desc: 'Histórico de protocolos gerados pelo portal do cidadão/profissional.' }
];

const SQL_SCHEMA_SNIPPET = `-- ==============================================================================
-- SISCON - SISTEMA INTEGRADO DE GESTÃO E FISCALIZAÇÃO PROFISSIONAL
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS POSTGRESQL (SUPABASE)
-- Execute no SQL Editor do seu projeto Supabase
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CONFIGURAÇÃO DO CONSELHO
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

-- 2. CADASTROS BÁSICOS
CREATE TABLE IF NOT EXISTS public.cadastros_basicos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    categoria VARCHAR(50) NOT NULL,
    nome VARCHAR(150) NOT NULL,
    codigo VARCHAR(50),
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PROFISSIONAIS
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

-- 4. EMPRESAS
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

-- 5. LANÇAMENTOS FINANCEIROS
CREATE TABLE IF NOT EXISTS public.lancamentos_financeiros (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    target_id TEXT NOT NULL,
    target_tipo VARCHAR(20) NOT NULL,
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

-- 6. PROCESSOS DE COBRANÇA
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

-- 7. TERMOS FISCALIZAÇÃO
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

-- 8. PROTOCOLOS E FORMULÁRIOS
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

-- 9. HABILITAR ROW LEVEL SECURITY (RLS) E POLÍTICAS PÚBLICAS
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

CREATE POLICY "Public access council_config" ON public.council_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access cadastros_basicos" ON public.cadastros_basicos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access profissionais" ON public.profissionais FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access empresas" ON public.empresas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access lancamentos_financeiros" ON public.lancamentos_financeiros FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access processos_cobranca" ON public.processos_cobranca FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access termos_fiscalizacao" ON public.termos_fiscalizacao FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access protocolos_processos" ON public.protocolos_processos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access formularios_dinamicos" ON public.formularios_dinamicos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access respostas_formularios" ON public.respostas_formularios FOR ALL USING (true) WITH CHECK (true);
`;
