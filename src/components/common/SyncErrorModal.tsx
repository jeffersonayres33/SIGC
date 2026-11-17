import React from 'react';
import { 
  X, 
  AlertOctagon, 
  Copy, 
  Check, 
  Database, 
  RefreshCw, 
  Trash2,
  FileCode,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';

interface SyncErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: any[];
}

export const SyncErrorModal: React.FC<SyncErrorModalProps> = ({ isOpen, onClose, errors }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const sqlScript = `-- SCRIPT DE CORREÇÃO AUTOMÁTICA DO BANCO DE DADOS (SUPABASE) - 100% IDEMPOTENTE
-- Execute este script no SQL Editor do seu projeto Supabase para corrigir:
--  • Erros "invalid input syntax for type uuid" (converte colunas UUID legadas para TEXT)
--  • Colunas ausentes em Funcionários, Protocolos, Formulários, Respostas, Profissionais e Empresas
--  • Permissões RLS e restrições legadas de Auditoria

-- 0. CONVERSÃO AUTOMÁTICA DE COLUNAS LEGADAS UUID -> TEXT EM TODAS AS TABELAS:
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
        SELECT tablename, policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = ANY(target_tables)
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, pol.tablename);
    END LOOP;

    FOR fk IN
        SELECT tc.table_name, tc.constraint_name FROM information_schema.table_constraints tc
        WHERE tc.table_schema = 'public' AND tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = ANY(target_tables)
    LOOP
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I;', fk.table_name, fk.constraint_name);
    END LOOP;

    FOR col IN
        SELECT c.table_name, c.column_name FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.data_type = 'uuid' AND c.table_name = ANY(target_tables)
    LOOP
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP DEFAULT;', col.table_name, col.column_name);
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE TEXT USING %I::text;', col.table_name, col.column_name, col.column_name);
        IF col.column_name = 'id' AND col.table_name <> 'council_config' THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;', col.table_name);
        END IF;
    END LOOP;
END $$;

-- 1. Funcionários (Setores, Responsáveis e Permissões):
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'FUNCIONARIO';
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS possui_inscricao_profissional BOOLEAN DEFAULT FALSE;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS numero_inscricao_profissional VARCHAR(50);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS setor_permissao_protocolos VARCHAR(50) DEFAULT 'APENAS_MEU';
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS setores_permitidos_protocolos TEXT[] DEFAULT '{}';
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS responsavel_permissao_protocolos VARCHAR(50) DEFAULT 'TODOS';

-- 2. Protocolos, Formulários Dinâmicos e Respostas:
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

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'protocolos_processos' AND column_name = 'anexos' AND data_type = 'ARRAY'
    ) THEN
        ALTER TABLE public.protocolos_processos ALTER COLUMN anexos DROP DEFAULT;
        ALTER TABLE public.protocolos_processos ALTER COLUMN anexos TYPE JSONB USING to_jsonb(anexos);
        ALTER TABLE public.protocolos_processos ALTER COLUMN anexos SET DEFAULT '[]'::jsonb;
    END IF;
END $$;

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

ALTER TABLE public.respostas_formularios ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Em Análise';
ALTER TABLE public.respostas_formularios ADD COLUMN IF NOT EXISTS canal_origem VARCHAR(50) DEFAULT 'PROFISSIONAL';
ALTER TABLE public.respostas_formularios ADD COLUMN IF NOT EXISTS autor_email VARCHAR(150);
ALTER TABLE public.respostas_formularios ADD COLUMN IF NOT EXISTS autor_telefone VARCHAR(50);
ALTER TABLE public.respostas_formularios ADD COLUMN IF NOT EXISTS anexos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.respostas_formularios ALTER COLUMN autor_documento TYPE VARCHAR(100);

-- 3. Colunas adicionais de Profissionais (PF) e Empresas (PJ):
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS recadastrado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS data_recadastramento VARCHAR(20);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS dt_inicio_insc VARCHAR(20);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS e_colaborador_crf BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS matricula_colaborador VARCHAR(50);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS recadastrado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS data_recadastramento VARCHAR(20);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS dt_inicio_insc VARCHAR(20);
ALTER TABLE public.empresas ALTER COLUMN carga_horaria_funcionamento_semanal TYPE NUMERIC(10,2) USING carga_horaria_funcionamento_semanal::numeric;
ALTER TABLE public.empresas ALTER COLUMN carga_horaria_assistencia_semanal TYPE NUMERIC(10,2) USING carga_horaria_assistencia_semanal::numeric;
ALTER TABLE public.council_config ADD COLUMN IF NOT EXISTS protocolo_regras_cores JSONB DEFAULT '[]'::jsonb;

-- 4. Módulo WebSITE & Portal Transparência:
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

-- 5. RLS nas tabelas existentes e novas:
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
        IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Public access %I" ON public.%I;', tbl, tbl);
            EXECUTE format('CREATE POLICY "Public access %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
        END IF;
    END LOOP;
END $$;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    toastService.success('Copiado!', 'Script SQL copiado para a área de transferência.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearErrors = () => {
    storageService.clearSyncErrors();
    toastService.success('Erros Limpos', 'O histórico de falhas de sincronização foi redefinido.');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-rose-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
            <div>
              <h2 className="font-extrabold text-sm uppercase tracking-wider">Monitor de Erros e Banco de Dados</h2>
              <p className="text-[10px] text-rose-100 uppercase font-bold">Diagnóstico de Falhas de Persistência e Sincronismo</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg bg-rose-700/50 hover:bg-rose-700 hover:text-white transition-colors cursor-pointer"
            title="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Quick Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start space-x-3 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-bold uppercase block">Causa Provável de Erros de Sincronização</span>
              <p className="mt-0.5 text-amber-800">
                Se os erros no monitor mencionarem colunas ausentes (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded">column "..." does not exist</code>) ou incompatibilidade de UUID (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded">invalid input syntax for type uuid</code>), sua estrutura de tabelas no Supabase está desatualizada. Copie o script SQL abaixo e execute-o no SQL Editor do Supabase para corrigir.
              </p>
            </div>
          </div>

          {errors.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50 border border-slate-200 rounded-2xl border-dashed">
              <Database className="w-10 h-10 mx-auto text-emerald-500 opacity-60 mb-2.5" />
              <span className="font-bold uppercase text-xs block text-slate-700">Tudo operando normalmente</span>
              <p className="text-[11px] text-slate-500 mt-1 uppercase">Nenhum erro de salvamento ou sincronismo foi registrado nas últimas operações.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase">{errors.length} Falhas Registradas:</span>
                <button
                  onClick={handleClearErrors}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-[10px] font-bold uppercase rounded-lg border border-slate-200 hover:border-rose-200 flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar Registro de Erros</span>
                </button>
              </div>

              {/* Errors Scrollable List */}
              <div className="max-h-[35vh] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {errors.map((err) => (
                  <div key={err.id} className="p-3.5 bg-rose-50/20 hover:bg-rose-50/40 transition-colors flex items-start space-x-3 text-xs">
                    <AlertOctagon className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold uppercase text-rose-800 text-[10px] bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                          {err.target} • {err.recordName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">{err.timestamp}</span>
                      </div>
                      <p className="font-medium text-slate-800 uppercase">{err.errorMessage}</p>
                      {err.fieldName && (
                        <p className="text-[10px] font-mono bg-white border border-slate-200 p-1.5 rounded-md text-slate-600 uppercase">
                          <strong className="text-slate-800">Detalhes do erro:</strong> {err.fieldName}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SQL Recovery Tools */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold uppercase text-[11px] text-slate-700 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-slate-500" />
                <span>Script de Correção Rápida (Executar no Supabase)</span>
              </span>
              <button
                onClick={handleCopySql}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-bold uppercase rounded-lg border border-slate-200 hover:border-slate-300 flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Script SQL'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 text-slate-100 font-mono text-[9px] overflow-x-auto max-h-[18vh] rounded-b-2xl">
              {sqlScript}
            </pre>
          </div>

          {/* Troubleshoot checklist */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <span className="font-bold text-[11px] uppercase text-slate-700 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-500" />
              <span>Dicas de Solução para Outros Problemas</span>
            </span>
            <ul className="list-disc pl-5 text-[10px] text-slate-600 space-y-1.5 uppercase font-medium">
              <li>
                <strong>Verifique a conexão de internet:</strong> Se a rede estiver inativa, as alterações serão enfileiradas localmente no seu navegador e sincronizadas automaticamente quando reestabelecida.
              </li>
              <li>
                <strong>Restrições de CPF ou CNPJ duplicados:</strong> O banco de dados rejeitará cadastros que possuam o mesmo CPF ou CNPJ de registros que já existem na base central.
              </li>
              <li>
                <strong>Chaves primárias conflituosas:</strong> A numeração sequencial garante que IDs de profissionais PF e CNPJ/Inscrições PJ não se sobreponham. Use a aba de Sincronização do painel se houver inconsistências.
              </li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Fechar Monitor
          </button>
        </div>

      </div>
    </div>
  );
};
