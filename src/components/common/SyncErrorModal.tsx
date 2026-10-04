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

  const sqlScript = `-- SCRIPT DE CORREÇÃO AUTOMÁTICA DE COLUNAS DO BANCO DE DADOS (SUPABASE)
-- Execute este script no SQL Editor do seu projeto Supabase para resolver erros de campos ausentes!

-- 1. Colunas adicionais de Profissionais (PF) se não existirem:
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS inscricao_anterior VARCHAR(50);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS inscricao_definitiva_anterior VARCHAR(50);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS dt_inicio_insc_provisoria VARCHAR(20);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS dt_venc_insc_provisoria VARCHAR(20);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS data_solicitacao_baixa VARCHAR(20);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS data_reabilitacao VARCHAR(20);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS data_conversao_definitiva VARCHAR(20);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS transferido_outro_regional BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS nr_inscricao_regional_origem VARCHAR(50);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS anuid_ref_ano_insc_em_dia BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS uf_regional_origem VARCHAR(2);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS dt_vencto_militar VARCHAR(20);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS data_mandato_seguranca VARCHAR(20);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS orgao_mandato_seguranca VARCHAR(150);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS observacao_mandato TEXT;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS forma_envio_boleto_parcelamento VARCHAR(100);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS grupo_sanguineo VARCHAR(5);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS fator_rh VARCHAR(5);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS doador_orgaos_tecidos BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS participou_curso_qualifarma VARCHAR(100);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS rg_data_expedicao VARCHAR(20);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS rg_data_vencimento VARCHAR(20);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS titulo_eleitoral VARCHAR(50);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS titulo_zona VARCHAR(20);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS titulo_secao VARCHAR(20);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS titulo_uf_exp VARCHAR(2);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS reservista VARCHAR(50);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS cart_trabalho VARCHAR(50);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS cart_trabalho_serie VARCHAR(30);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS cart_trabalho_uf_exp VARCHAR(2);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS cart_trabalho_data_exp VARCHAR(20);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS nome_social VARCHAR(200);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS anuidade_reduzida BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS isento_anuidade BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS e_votante BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS e_militar BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(50);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS motivo_bloqueio VARCHAR(150);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS data_bloqueio VARCHAR(20);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS data_desbloqueio_prevista VARCHAR(20);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS usuario_bloqueio VARCHAR(150);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS observacoes_bloqueio TEXT;

-- 2. Colunas adicionais de Empresas (PJ) se não existirem:
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS inscricao_anterior VARCHAR(50);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS inscricao_definitiva_anterior VARCHAR(50);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS dt_inicio_insc_provisoria VARCHAR(20);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS dt_venc_insc_provisoria VARCHAR(20);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS data_conversao_definitiva VARCHAR(20);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS motivo_bloqueio VARCHAR(150);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS data_bloqueio VARCHAR(20);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS data_desbloqueio_prevista VARCHAR(20);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS usuario_bloqueio VARCHAR(150);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS observacoes_bloqueio TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS categoria_empresa VARCHAR(100);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS isento_anuidade BOOLEAN DEFAULT FALSE;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS anuidade_reduzida BOOLEAN DEFAULT FALSE;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS recadastrado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS data_recadastramento VARCHAR(20);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS isento_taxa_certificado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS horario_plantao VARCHAR(50);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS horas_tolerancia VARCHAR(20);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS horarios_funcionamento JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS horarios_assistencia JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS carga_horaria_funcionamento_semanal INTEGER DEFAULT 0;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS carga_horaria_assistencia_semanal INTEGER DEFAULT 0;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS assistencia_plena BOOLEAN DEFAULT TRUE;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS justificativa_condicao TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS regra_assistencia_aplicada VARCHAR(150);

-- 3. Tabela de Histórico de Auditoria & Alterações se não existir:
CREATE TABLE IF NOT EXISTS public.historico_auditoria (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    target_id TEXT NOT NULL,
    target_tipo VARCHAR(50) NOT NULL,
    usuario VARCHAR(150) NOT NULL,
    data_formatada VARCHAR(50) NOT NULL,
    campo VARCHAR(150) NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.historico_auditoria ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'historico_auditoria' AND policyname = 'Public Access for historico_auditoria'
    ) THEN
        CREATE POLICY "Public Access for historico_auditoria" ON public.historico_auditoria
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
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
                Se os erros no monitor mencionarem colunas ausentes (e.g., <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">column "..." of relation "profissionais" does not exist</code>), isso significa que a sua estrutura de tabelas no Supabase está desatualizada. Copie o script SQL abaixo e execute-o no editor de SQL do Supabase para corrigir.
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
