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
    fetch('./supabase/schema.sql')
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
                    {health?.error || 'O SIGCON está autenticado e pronto para ler e persistir dados diretamente nas tabelas do PostgreSQL no Supabase.'}
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
  { name: 'council_config', label: 'Configurações do Conselho', desc: 'Dados do CRF, diretoria, assinaturas, numeração de protocolos e inscrições.' },
  { name: 'cadastros_basicos', label: 'Tabelas Auxiliares', desc: 'Setores, cargos, perfis de acesso, tipos de profissional/empresa e assuntos.' },
  { name: 'regras_assistencia', label: 'Regras de Assistência', desc: 'Regras de assistência farmacêutica e carga horária por município e estabelecimento.' },
  { name: 'profissionais', label: 'Cadastro de Profissionais', desc: 'Farmacêuticos, dados civis, filiação, habilitações, fotos e endereços.' },
  { name: 'empresas', label: 'Pessoas Jurídicas (Empresas)', desc: 'Farmácias, drogarias, laboratórios, QSA (Sócios) e Responsáveis Técnicos (RTs).' },
  { name: 'lancamentos_financeiros', label: 'Lançamentos & Anuidades', desc: 'Anuidades, taxas de CRT/ART, multas, boletos e PIX Copia e Cola.' },
  { name: 'processos_cobranca', label: 'Dívida Ativa & Cobrança', desc: 'Processos de execução fiscal, acordos, termos e Certidões de Dívida Ativa (CDA).' },
  { name: 'termos_fiscalizacao', label: 'Fiscalização & Autos de Infração', desc: 'Inspeções in loco, geolocalização, presenças de RT e assinaturas digitais.' },
  { name: 'protocolos_processos', label: 'Protocolo e Tramitação', desc: 'Processos administrativos, pareceres, anexos e dados de formulários submetidos.' },
  { name: 'formularios_dinamicos', label: 'Formulários & Serviços Online', desc: 'Construtor de formulários, campos dinâmicos, canais e setor de tramitação.' },
  { name: 'respostas_formularios', label: 'Submissões de Formulários', desc: 'Histórico de submissões multicanal vinculadas aos protocolos gerados.' },
  { name: 'historico_vinculos_profissionais', label: 'Histórico de Vínculos RT', desc: 'Registro completo de entradas, cargas horárias e baixas de responsabilidade técnica.' },
  { name: 'historico_auditoria', label: 'Auditoria e Logs', desc: 'Trilha de auditoria de alterações em cadastros e processos.' },
  { name: 'funcionarios', label: 'Funcionários & Usuários', desc: 'Colaboradores do Conselho, setores de lotação, senhas e permissões de protocolo.' },
  { name: 'perfis_permissoes_usuario', label: 'Permissões de Acesso (RBAC)', desc: 'Matriz granular de módulos e ações por perfil de usuário.' }
];

const SQL_SCHEMA_SNIPPET = `-- ==============================================================================
-- SIGCON - SCRIPT MESTRE DE ATUALIZAÇÃO DO BANCO SUPABASE (100% IDEMPOTENTE)
-- Use o botão "Copiar Script SQL Completo" acima para copiar a versão integral.
-- ==============================================================================

-- Atualização crítica para Formulários Dinâmicos e Protocolos (Site Público & Portais):
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
ALTER TABLE public.respostas_formularios ALTER COLUMN autor_documento TYPE VARCHAR(100);`;
