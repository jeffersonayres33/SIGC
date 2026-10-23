import React, { useState } from 'react';
import { Database, Copy, Check, X, ShieldAlert, Sparkles, FileCode2 } from 'lucide-react';
import { toastService } from '../../services/toastService';

interface ModalSqlDatabaseFiscalizacaoProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SQL_FISCALIZACAO_SCRIPT = `-- ==============================================================================
-- SIGCON - SISTEMA INTEGRADO DE GESTÃO DE CONSELHO
-- ESTRUTURA DO BANCO DE DADOS: MÓDULO DOS FISCAIS DE CAMPO (OFFLINE & TABLET)
-- Banco Alvo: PostgreSQL / Supabase
-- Tabelas Vinculadas: empresas, profissionais, funcionarios, termos_inspecao
-- Colunas Específicas: Notificação, Intimação, Auto de Infração e Assinaturas
-- ==============================================================================

-- 1. Extensões essenciais para UUID e Criptografia
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela Principal de Termos de Inspeção e Fiscalização de Campo
CREATE TABLE IF NOT EXISTS public.termos_inspecao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_termo VARCHAR(50) NOT NULL UNIQUE,
    data_hora VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Vinculação com a Empresa Fiscalizada
    empresa_id UUID,
    empresa_inscricao VARCHAR(50),
    empresa_razao_social VARCHAR(250) NOT NULL,
    empresa_nome_fantasia VARCHAR(250),
    empresa_cnpj VARCHAR(20) NOT NULL,
    endereco VARCHAR(250),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    rota VARCHAR(100),

    -- Vinculação com o Fiscal Autuante (Tabela Funcionários)
    fiscal_id UUID,
    fiscal_nome VARCHAR(250) NOT NULL,
    fiscal_matricula VARCHAR(50) NOT NULL,

    -- Estado Operacional do Estabelecimento no Momento da Inspeção
    encontrava VARCHAR(50) DEFAULT 'Aberta', -- 'Aberta' ou 'Fechada'
    motivo_fechada VARCHAR(100), -- 'Mot. Desconhecido', 'Em reforma', 'Feriado', 'Horário de almoço', 'Encerrada'
    
    -- Situação do Responsável Técnico (RT)
    rt_situacao VARCHAR(100) DEFAULT 'Presente', -- 'Presente', 'Ausente', 'Não possui', 'Não possui Farm.Sub ou A.T', 'Fiscalização Realizada fora do HAT', 'Dentro do prazo de 30 dias'
    rt_nome VARCHAR(250),
    rt_inscricao VARCHAR(50),
    rt_tipo VARCHAR(100), -- 'DIRETOR TÉCNICO', 'RESPONSÁVEL TÉCNICO', 'SUBSTITUTO', 'ASSISTENTE TÉCNICO'
    rt_presente_momento_nome VARCHAR(250),
    outras_observacoes_gerais TEXT,

    -- --------------------------------------------------------------------------
    -- BLOCO 1: NOTIFICAÇÃO (SEQUENCIAL ÚNICO)
    -- --------------------------------------------------------------------------
    notificacao_ativa BOOLEAN DEFAULT FALSE,
    numero_notificacao VARCHAR(50),
    notificacao_texto TEXT,
    notificacao_prazo_dias INTEGER DEFAULT 5,
    notificacao_observacoes TEXT,

    -- --------------------------------------------------------------------------
    -- BLOCO 2: INTIMAÇÃO (SEQUENCIAL ÚNICO)
    -- --------------------------------------------------------------------------
    intimacao_ativa BOOLEAN DEFAULT FALSE,
    numero_intimacao VARCHAR(50),
    intimacao_crt_atualizada BOOLEAN DEFAULT FALSE, -- 'Providenciar a Certidão de Regularidade Técnica atualizada'
    intimacao_crt_local_visivel BOOLEAN DEFAULT FALSE, -- 'Afixar a Certidão de Regularidade Técnica em local visível'
    intimacao_alteracao_social BOOLEAN DEFAULT FALSE, -- 'Averbar dados da última alteração social no CRF/AM'
    intimacao_outras_observacoes TEXT,

    -- --------------------------------------------------------------------------
    -- BLOCO 3: AUTUAÇÃO (AUTO DE INFRAÇÃO)
    -- --------------------------------------------------------------------------
    autuacao_ativa BOOLEAN DEFAULT FALSE,
    numero_auto_infracao VARCHAR(50),
    autuacao_ausente BOOLEAN DEFAULT FALSE, -- 'Não comprova que as atividades são exercidas por farmacêutico com RT anotada no CRF, para o horário declarado (ausente)'
    autuacao_sem_rt BOOLEAN DEFAULT FALSE, -- 'Não comprova que as atividades são exercidas por farmacêutico com RT anotada no CRF, (sem RT)'
    autuacao_chi BOOLEAN DEFAULT FALSE, -- 'Não comprova que as atividades são exercidas por farmacêutico com RT anotada no CRF, para todo o horário de funcionamento (carga horária insuficiente/CHI)'
    autuacao_sem_substituto BOOLEAN DEFAULT FALSE, -- 'Não comprova que as atividades são exercidas por farmacêutico com RT anotada no CRF, como substituto (sem substituto)'
    autuacao_ilegal BOOLEAN DEFAULT FALSE, -- 'Não comprova que as atividades são exercidas por farmacêutico com RT anotada no CRF, e com empresa registrada no CRF/AM (ilegal)'
    autuacao_privativas BOOLEAN DEFAULT FALSE, -- 'Não comprova que as atividades privativas são exercidas por farmacêutico com RT anotada no CRF (atividades privativas)'
    autuacao_outras_observacoes TEXT,
    valor_multa NUMERIC(10,2) DEFAULT 0.00,

    -- --------------------------------------------------------------------------
    -- IDENTIFICAÇÃO DO PREPOSTO / ATENDENTE NO LOCAL
    -- --------------------------------------------------------------------------
    atendente_cargo VARCHAR(100), -- 'Farmacêutico', 'Gerente', 'Proprietário', 'Balconista', 'Sem atendimento'
    atendente_nome VARCHAR(250),
    atendente_rg VARCHAR(50),
    atendente_cpf VARCHAR(14),
    atendente_inscricao VARCHAR(50),
    observacao TEXT,

    -- --------------------------------------------------------------------------
    -- ASSINATURAS DIGITAIS COLETADAS NO TABLET & METADADOS DE INTEGRIDADE
    -- --------------------------------------------------------------------------
    assinatura_estabelecimento TEXT, -- Base64 PNG ou Vetor SVG da assinatura capturada no tablet
    assinatura_estabelecimento_data_hora VARCHAR(50),
    recusa_assinatura BOOLEAN DEFAULT FALSE,
    motivo_recusa TEXT,

    assinatura_fiscal TEXT,
    assinatura_fiscal_data_hora VARCHAR(50),

    -- Auditoria Criptográfica e Geolocalização GPS de Campo
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    hash_validacao_digital VARCHAR(255),
    status_sincronizacao VARCHAR(50) DEFAULT 'Sincronizado'
);

-- 3. Índices para Otimização de Consultas Rápidas no Tablet / Web
CREATE INDEX IF NOT EXISTS idx_termos_empresa_id ON public.termos_inspecao(empresa_id);
CREATE INDEX IF NOT EXISTS idx_termos_empresa_cnpj ON public.termos_inspecao(empresa_cnpj);
CREATE INDEX IF NOT EXISTS idx_termos_cidade ON public.termos_inspecao(cidade);
CREATE INDEX IF NOT EXISTS idx_termos_numero ON public.termos_inspecao(numero_termo);
CREATE INDEX IF NOT EXISTS idx_termos_numero_notificacao ON public.termos_inspecao(numero_notificacao);
CREATE INDEX IF NOT EXISTS idx_termos_numero_intimacao ON public.termos_inspecao(numero_intimacao);

-- Garantir colunas em tabelas pré-existentes
ALTER TABLE IF EXISTS public.termos_inspecao ADD COLUMN IF NOT EXISTS numero_notificacao VARCHAR(50);
ALTER TABLE IF EXISTS public.termos_inspecao ADD COLUMN IF NOT EXISTS numero_intimacao VARCHAR(50);
ALTER TABLE IF EXISTS public.termos_inspecao ADD COLUMN IF NOT EXISTS atendente_inscricao VARCHAR(50);
ALTER TABLE IF EXISTS public.termos_inspecao ADD COLUMN IF NOT EXISTS observacao TEXT;

-- 4. Habilitação de Políticas de Segurança (Row Level Security - RLS)
ALTER TABLE public.termos_inspecao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura dos termos para usuários autenticados" ON public.termos_inspecao;
CREATE POLICY "Permitir leitura dos termos para usuários autenticados" 
ON public.termos_inspecao FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção e atualização de termos pelos fiscais" ON public.termos_inspecao;
CREATE POLICY "Permitir inserção e atualização de termos pelos fiscais" 
ON public.termos_inspecao FOR ALL USING (true) WITH CHECK (true);

-- 5. Trigger para Atualização Automática de 'updated_at'
CREATE OR REPLACE FUNCTION public.handle_termos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_termos_updated_at ON public.termos_inspecao;
CREATE TRIGGER trigger_termos_updated_at
BEFORE UPDATE ON public.termos_inspecao
FOR EACH ROW EXECUTE FUNCTION public.handle_termos_updated_at();

-- 6. Compatibilidade de Precisão Decimal em Empresas (Correção do Erro 22P02: carga horária decimal como "88.98")
ALTER TABLE IF EXISTS public.empresas ADD COLUMN IF NOT EXISTS carga_horaria_funcionamento_semanal NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE IF EXISTS public.empresas ADD COLUMN IF NOT EXISTS carga_horaria_assistencia_semanal NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE IF EXISTS public.empresas ALTER COLUMN carga_horaria_funcionamento_semanal TYPE NUMERIC(10,2) USING carga_horaria_funcionamento_semanal::numeric;
ALTER TABLE IF EXISTS public.empresas ALTER COLUMN carga_horaria_assistencia_semanal TYPE NUMERIC(10,2) USING carga_horaria_assistencia_semanal::numeric;

-- ==============================================================================
-- FIM DO SCRIPT DE ATUALIZAÇÃO
-- ==============================================================================
`;

export const ModalSqlDatabaseFiscalizacao: React.FC<ModalSqlDatabaseFiscalizacaoProps> = ({
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_FISCALIZACAO_SCRIPT);
    setCopied(true);
    toastService.success('Script SQL Copiado!', 'O script foi copiado para a área de transferência.');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 p-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center space-x-2">
                <span>Script SQL de Atualização: Módulo de Fiscalização</span>
                <span className="bg-purple-800 text-purple-200 text-[9px] px-1.5 py-0.5 rounded font-mono">
                  PostgreSQL / Supabase
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">
                Tabela termos_inspecao com suporte a Notificação, Intimação, Auto de Infração e Assinaturas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Banner */}
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 text-blue-900 text-[11px] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Copie o código abaixo e execute diretamente no <strong>SQL Editor</strong> do Supabase ou em seu banco PostgreSQL.
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs uppercase flex items-center space-x-1 shadow-xs cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] overflow-y-auto flex-1 leading-relaxed selection:bg-purple-600 selection:text-white">
          <pre>{SQL_FISCALIZACAO_SCRIPT}</pre>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Totalmente idempotente: pode ser executado com segurança múltiplas vezes sem perda de dados.
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'SQL Copiado com Sucesso' : 'Copiar Script SQL'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs uppercase hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
