import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Lock, 
  User, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Key, 
  HelpCircle, 
  Sparkles,
  Users,
  Compass,
  Scale,
  Briefcase,
  Check,
  X
} from 'lucide-react';
import { storageService, CouncilConfig } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { maskCPF, maskCNPJ, validateCPF, validateCNPJ } from '../../utils/documentUtils';
import { AuthUser, UserRole } from '../../types';
import { SIGCON_LOGO } from '../../constants/assets';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
  councilConfig: CouncilConfig;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, councilConfig }) => {
  const [docType, setDocType] = useState<'CPF' | 'CNPJ'>('CPF');
  const [documento, setDocumento] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [salvarDoc, setSalvarDoc] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modal de Primeiro Acesso / Troca Obrigatória de Senha
  const [showFirstAccessModal, setShowFirstAccessModal] = useState(false);
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Modal de Esqueci Minha Senha
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotDoc, setForgotDoc] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Modal de Script SQL para o Desenvolvedor
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    // Carregar documento salvo se houver
    const saved = storageService.getRememberedDoc();
    if (saved) {
      const clean = saved.replace(/\D/g, '');
      if (clean.length === 14) {
        setDocType('CNPJ');
        setDocumento(maskCNPJ(saved));
      } else {
        setDocType('CPF');
        setDocumento(maskCPF(saved));
      }
      setSalvarDoc(true);
    }
  }, []);

  const handleDocumentoChange = (val: string) => {
    setErrorMessage('');
    if (docType === 'CPF') {
      setDocumento(maskCPF(val));
    } else {
      setDocumento(maskCNPJ(val));
    }
  };

  const handleSwitchDocType = (type: 'CPF' | 'CNPJ') => {
    setDocType(type);
    setDocumento('');
    setErrorMessage('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanDoc = documento.replace(/\D/g, '');
    if (!cleanDoc) {
      setErrorMessage(`Informe o ${docType} para continuar.`);
      return;
    }

    if (docType === 'CPF' && cleanDoc.length !== 11) {
      setErrorMessage('O CPF deve conter exatamente 11 dígitos.');
      return;
    }

    if (docType === 'CNPJ' && cleanDoc.length !== 14) {
      setErrorMessage('O CNPJ deve conter exatamente 14 dígitos.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = storageService.login(documento, senha, salvarDoc);

      if (!result.success) {
        setIsLoading(false);
        setErrorMessage(result.message);
        return;
      }

      if (result.precisaTrocarSenha && result.user) {
        setIsLoading(false);
        setPendingUser(result.user);
        setShowFirstAccessModal(true);
        toastService.info(
          'Primeiro Acesso Detectado',
          'Por segurança, cadastre sua senha pessoal de acesso para continuar.'
        );
        return;
      }

      setIsLoading(false);
      if (result.user) {
        toastService.success(
          `Bem-vindo(a), ${result.user.nome}!`,
          `Autenticado com sucesso como ${result.user.cargoOuTitulo || result.user.tipo}.`
        );
        onLoginSuccess(result.user);
      }
    }, 350);
  };

  const handleSaveFirstAccessPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;

    if (!novaSenha || novaSenha.length < 4) {
      toastService.warning('Senha Curta', 'A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }

    if (novaSenha !== confirmaSenha) {
      toastService.warning('Senhas Não Conferem', 'A confirmação de senha não coincide com a nova senha digitada.');
      return;
    }

    const res = storageService.redefinirSenha(pendingUser.documento, novaSenha);
    if (!res.success) {
      toastService.warning('Falha ao Salvar Senha', res.message);
      return;
    }

    // Atualiza o objeto de autenticação
    const updatedUser: AuthUser = {
      ...pendingUser,
      precisaTrocarSenha: false,
      ultimoAcesso: new Date().toLocaleString('pt-BR')
    };

    storageService.setCurrentAuthUser(updatedUser);
    setShowFirstAccessModal(false);
    toastService.success(
      'Senha Cadastrada com Sucesso!',
      'Sua credencial de acesso foi ativada. Bem-vindo(a) ao sistema.'
    );
    onLoginSuccess(updatedUser);
  };

  const handleQuickLogin = (cpfOrCnpj: string, pass: string, type: 'CPF' | 'CNPJ') => {
    setDocType(type);
    setDocumento(type === 'CPF' ? maskCPF(cpfOrCnpj) : maskCNPJ(cpfOrCnpj));
    setSenha(pass);
    setErrorMessage('');
  };

  const SQL_UPDATE_SCRIPT = `-- ==============================================================================
-- ATUALIZAÇÃO DO BANCO DE DADOS: USUÁRIO DESENVOLVEDOR MASTER & AUTENTICAÇÃO
-- Banco Alvo: PostgreSQL / Supabase
-- Autor: Sistema Integrado de Gestão de Conselho (SIGCON)
-- CPF do Desenvolvedor: 934.135.302-59
-- Compatibilidade: 100% resiliente com colunas id tipo UUID ou TEXT/VARCHAR
-- ==============================================================================

-- Extensões necessárias para UUID e criptografia
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Criação ou adaptação da tabela de Funcionários e Colaboradores
CREATE TABLE IF NOT EXISTS public.funcionarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(250) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    rg VARCHAR(50),
    matricula VARCHAR(50) NOT NULL,
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

-- Garante que todas as colunas necessárias existam caso a tabela já tenha sido criada anteriormente
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS cargo_id VARCHAR(50);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS cargo_nome VARCHAR(150);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS setor_id VARCHAR(50);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS setor_nome VARCHAR(150);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS permissoes_modulos TEXT[] DEFAULT '{}';
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS data_admissao VARCHAR(20);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS primeiro_acesso_pendente BOOLEAN DEFAULT TRUE;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS zerar_senha_pendente BOOLEAN DEFAULT FALSE;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS ultimo_acesso VARCHAR(50);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- 2. Inserção / Atualização idempotente do Usuário DESENVOLVEDOR MASTER (Jefferson Ayres)
-- Acesso Supremo Irrestrito acima do Administrador Geral
-- Nota: Usa UUID padronizado '00000000-0000-4000-a000-000000000001' (compatível tanto com coluna UUID quanto VARCHAR/TEXT)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.funcionarios WHERE cpf = '934.135.302-59') THEN
        UPDATE public.funcionarios SET
            nome = 'Jefferson Ayres (Desenvolvedor)',
            cargo_nome = 'Desenvolvedor Master / Arquiteto de Software',
            permissoes_modulos = ARRAY['dashboard', 'profissionais', 'empresas', 'cadastros_basicos', 'funcionarios', 'financeiro', 'cobranca_juridico', 'fiscalizacao', 'protocolos', 'relatorios', 'formularios', 'portal_inscrito', 'configuracoes', 'microsservicos', 'backup_restore', 'admin'],
            ativo = TRUE,
            observacoes = 'Superusuário Desenvolvedor com autoridade máxima e acesso irrestrito acima do Administrador.'
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
            'DEVELOPER',
            ARRAY['dashboard', 'profissionais', 'empresas', 'cadastros_basicos', 'funcionarios', 'financeiro', 'cobranca_juridico', 'fiscalizacao', 'protocolos', 'relatorios', 'formularios', 'portal_inscrito', 'configuracoes', 'microsservicos', 'backup_restore', 'admin'],
            TRUE,
            '2020-01-01',
            NULL, -- Senha a ser cadastrada no 1º acesso
            TRUE,
            FALSE,
            'Aguardando primeiro acesso',
            'Superusuário Desenvolvedor com autoridade máxima e acesso irrestrito acima do Administrador.'
        );
    END IF;
END $$;

-- 3. Adiciona campos de autenticação web e primeiro acesso nas tabelas de profissionais e empresas
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255);
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS primeiro_acesso_pendente BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS zerar_senha_pendente BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS ultimo_acesso VARCHAR(50);

ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS primeiro_acesso_pendente BOOLEAN DEFAULT TRUE;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS zerar_senha_pendente BOOLEAN DEFAULT FALSE;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS ultimo_acesso VARCHAR(50);

-- 4. Habilita RLS e permissões de segurança na tabela funcionarios
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access funcionarios" ON public.funcionarios;
CREATE POLICY "Public access funcionarios" ON public.funcionarios FOR ALL USING (true) WITH CHECK (true);

-- 5. Registro seguro de auditoria (compatível com qualquer versão da tabela historico_auditoria)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'historico_auditoria'
    ) THEN
        BEGIN
            INSERT INTO public.historico_auditoria (
                id, timestamp, target_id, target_tipo, target_nome, target_doc, 
                usuario_nome, usuario_papel, acao, campo_alterado, valor_anterior, valor_novo, motivo
            ) VALUES (
                gen_random_uuid()::text,
                TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI:SS'),
                '00000000-0000-4000-a000-000000000001',
                'FUNCIONARIO',
                'Jefferson Ayres (Desenvolvedor)',
                '934.135.302-59',
                'SISTEMA / SQL MIGRATION',
                'DEVELOPER',
                'CRIACAO_USUARIO_DEV',
                'USUARIO_DESENVOLVEDOR',
                NULL,
                'Usuário Desenvolvedor Jefferson Ayres configurado com sucesso',
                'Configuração do Usuário Supremo Desenvolvedor'
            );
        EXCEPTION WHEN others THEN
            NULL;
        END;
    END IF;
END $$;
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_UPDATE_SCRIPT);
    setCopiedSql(true);
    toastService.success('SQL Copiado', 'Script SQL copiado para a área de transferência.');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Background Decor Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-slate-200/50 rounded-full blur-3xl" />
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Oficial do Conselho com Logo */}
        <div className="p-6 text-center border-b border-slate-100 bg-white">
          <img 
            src={SIGCON_LOGO} 
            alt="SIGCON Icon" 
            className="h-14 w-14 object-contain mx-auto mb-3 shadow-sm rounded-2xl p-1 bg-white border border-slate-200 transition-transform hover:scale-105"
          />
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            SIGCON <span className="text-blue-600 font-semibold text-sm">Enterprise</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
            Sistema Integrado de Gestão de Conselho
          </p>
          <div className="mt-2.5 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 font-mono">
            <span>{councilConfig.sigla || 'CRF-AM'}</span>
            <span>•</span>
            <span className="truncate max-w-[220px]">{councilConfig.nomeCompleto || 'Conselho Regional'}</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-slate-900">Acesso Unificado ao Sistema</h2>
            <p className="text-xs text-slate-500">
              Colaboradores, Profissionais Inscritos e Estabelecimentos
            </p>
          </div>

          {/* Toggle CPF vs CNPJ */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleSwitchDocType('CPF')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                docType === 'CPF'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Pessoa Física (CPF)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchDocType('CNPJ')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                docType === 'CNPJ'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Empresa (CNPJ)</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Campo Documento */}
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">
                {docType === 'CPF' ? 'CPF (Colaborador ou Profissional) *' : 'CNPJ da Empresa / Estabelecimento *'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={documento}
                  onChange={(e) => handleDocumentoChange(e.target.value)}
                  placeholder={docType === 'CPF' ? '000.000.000-00' : '00.000.000/0001-00'}
                  className="w-full pl-3 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {docType === 'CPF' 
                  ? 'O usuário é definido automaticamente pelo seu CPF' 
                  : 'O usuário da empresa é definido pelo CNPJ do cadastro'}
              </span>
            </div>

            {/* Campo Senha */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-bold uppercase text-[10px]">
                  Senha de Acesso *
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox Salvar Documento */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-slate-600 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={salvarDoc}
                  onChange={(e) => setSalvarDoc(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <span>Salvar {docType} neste dispositivo</span>
              </label>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase shadow-md shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Acessos Rápidos de Demonstração:
              </span>
              <button
                type="button"
                onClick={() => setShowSqlModal(true)}
                className="text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 flex items-center space-x-1 cursor-pointer"
                title="Visualizar script SQL para o banco de dados"
              >
                <span>📜 Ver SQL Atualização</span>
              </button>
            </div>

            {/* Destaque para o Desenvolvedor Jefferson Ayres */}
            <button
              type="button"
              onClick={() => handleQuickLogin('93413530259', '', 'CPF')}
              className="w-full p-2.5 rounded-xl bg-linear-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-300 text-left hover:border-purple-500 transition-all cursor-pointer flex items-center justify-between shadow-2xs group"
            >
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  👑
                </span>
                <div>
                  <div className="text-xs font-extrabold text-purple-900 group-hover:text-purple-700">
                    Desenvolvedor Master (Jefferson Ayres)
                  </div>
                  <div className="text-[10px] text-purple-700 font-mono font-semibold">
                    CPF: 934.135.302-59 • 1º Acesso Obrigatório
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-200 text-purple-900 font-extrabold text-[9px] uppercase">
                Acesso Total
              </span>
            </button>

            {/* Outros perfis demo */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => handleQuickLogin('00000000000', 'admin', 'CPF')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-left cursor-pointer flex items-center space-x-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">Admin Geral</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('11111111111', '123456', 'CPF')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-left cursor-pointer flex items-center space-x-1.5"
              >
                <Compass className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Fiscal Campo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const prof = storageService.getProfissionais()[0];
                  if (prof) handleQuickLogin(prof.cpf, '123456', 'CPF');
                }}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-left cursor-pointer flex items-center space-x-1.5"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">Profissional (PF)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const emp = storageService.getEmpresas()[0];
                  if (emp) handleQuickLogin(emp.cnpj, '123456', 'CNPJ');
                }}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-left cursor-pointer flex items-center space-x-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="truncate">Empresa (PJ)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400">
          SIGCON • Conectado à Rede Oficial do Conselho Regional
        </div>
      </div>

      {/* MODAL 1: PRIMEIRO ACESSO / CADASTRO OBRIGATÓRIO DE SENHA */}
      {showFirstAccessModal && pendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 p-5 text-white">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider">
                    Definição Obrigatória de Senha
                  </h3>
                  <p className="text-[11px] text-amber-100">
                    Primeiro Acesso ou Senha Zerada pelo Administrador
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveFirstAccessPassword} className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                <div className="font-bold uppercase text-[11px] mb-1 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Olá, {pendingUser.nome}!</span>
                </div>
                <p>
                  Por diretriz de segurança do conselho, o seu usuário é o seu <strong>{pendingUser.documento}</strong>. 
                  Você deve agora cadastrar uma senha pessoal definitiva para utilizar o sistema.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">
                  Nova Senha Pessoal * (mínimo 4 caracteres)
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Digite sua nova senha"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">
                  Confirmação da Nova Senha *
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={4}
                  value={confirmaSenha}
                  onChange={(e) => setConfirmaSenha(e.target.value)}
                  placeholder="Repita a nova senha para confirmação"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowFirstAccessModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs uppercase hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase shadow-md shadow-amber-500/25 transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Senha & Entrar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ESQUECI MINHA SENHA */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-extrabold uppercase">Recuperação de Senha</h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowForgotModal(false); setForgotSent(false); }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {!forgotSent ? (
                <>
                  <p className="text-slate-600 leading-relaxed">
                    Informe o seu <strong>CPF</strong> (para pessoa física/colaborador) ou <strong>CNPJ</strong> (para empresa) 
                    para solicitar o reset de credencial ou validação com a diretoria do conselho:
                  </p>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">
                      Documento (CPF ou CNPJ) *
                    </label>
                    <input
                      type="text"
                      value={forgotDoc}
                      onChange={(e) => setForgotDoc(e.target.value)}
                      placeholder="Digite seu documento"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:bg-white"
                    />
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1">
                    <span className="font-bold uppercase text-[10px] block">Opção do Administrador:</span>
                    <span>
                      Você também pode solicitar que qualquer Administrador do conselho utilize a função 
                      <strong> "Zerar Senha"</strong> na sua ficha cadastral para permitir o cadastro imediato de uma nova senha.
                    </span>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold uppercase"
                    >
                      Fechar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!forgotDoc) {
                          toastService.warning('Informe o Documento', 'Digite seu CPF ou CNPJ para continuar.');
                          return;
                        }
                        setForgotSent(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase shadow-xs"
                    >
                      Solicitar Redefinição
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-3 py-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Solicitação Enviada!</h4>
                  <p className="text-slate-600 leading-relaxed">
                    A solicitação para o documento <strong>{forgotDoc}</strong> foi encaminhada ao setor de TI/Cadastro. 
                    Se preferir redefinição imediata, solicite a um operador que clique no botão <strong>"Zerar Senha"</strong> 
                    na aba de Login da sua ficha cadastral.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(false); setForgotSent(false); }}
                    className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl uppercase text-xs cursor-pointer shadow-xs"
                  >
                    Entendido
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SCRIPT SQL PARA O DESENVOLVEDOR */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">📜</span>
                <div>
                  <h3 className="text-xs font-extrabold uppercase">Script SQL de Atualização do Banco</h3>
                  <p className="text-[10px] text-slate-400">PostgreSQL / Supabase • Usuário Desenvolvedor Master & Autenticação</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] overflow-y-auto flex-1 leading-relaxed">
              <pre>{SQL_UPDATE_SCRIPT}</pre>
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Script pronto para execução no SQL Editor do Supabase ou PostgreSQL.
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  {copiedSql ? <Check className="w-4 h-4" /> : <Key className="w-4 h-4" />}
                  <span>{copiedSql ? 'Copiado!' : 'Copiar Script SQL'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs uppercase hover:bg-slate-200 cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
