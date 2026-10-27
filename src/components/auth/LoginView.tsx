import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Key, 
  HelpCircle, 
  Sparkles,
  Mail,
  Send,
  X,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { storageService, CouncilConfig } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { maskCPF, maskCNPJ } from '../../utils/documentUtils';
import { AuthUser } from '../../types';
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

  // Modal de Primeiro Acesso por E-mail (Funcionários, Profissionais e Empresas)
  const [showPrimeiroAcessoModal, setShowPrimeiroAcessoModal] = useState(false);
  const [primeiroAcessoStep, setPrimeiroAcessoStep] = useState<'email' | 'link_enviado' | 'senha'>('email');
  const [primeiroAcessoEmail, setPrimeiroAcessoEmail] = useState('');
  const [primeiroAcessoLoading, setPrimeiroAcessoLoading] = useState(false);
  const [primeiroAcessoErro, setPrimeiroAcessoErro] = useState('');
  const [generatedActivationLink, setGeneratedActivationLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [primeiroAcessoData, setPrimeiroAcessoData] = useState<{
    token: string;
    targetNome: string;
    targetTipo: string;
    targetDoc: string;
    email: string;
  } | null>(null);
  const [primeiroAcessoNovaSenha, setPrimeiroAcessoNovaSenha] = useState('');
  const [primeiroAcessoConfirmaSenha, setPrimeiroAcessoConfirmaSenha] = useState('');
  const [showPrimeiroAcessoPass, setShowPrimeiroAcessoPass] = useState(false);

  // Modal de Esqueci Minha Senha
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotDoc, setForgotDoc] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    // 1. Carregar documento salvo se houver
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

    // 2. Verificar se a página foi acessada via link de e-mail com token de primeiro acesso (?token=... ou ?action=primeiro-acesso&token=...)
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (token) {
        const validation = storageService.validarTokenPrimeiroAcesso(token);
        if (validation.success && validation.token) {
          setPrimeiroAcessoData({
            token: validation.token,
            targetNome: validation.targetNome || '',
            targetTipo: validation.targetTipo || '',
            targetDoc: validation.targetDoc || '',
            email: validation.email || ''
          });
          setPrimeiroAcessoStep('senha');
          setShowPrimeiroAcessoModal(true);
          toastService.info(
            'Link de Primeiro Acesso Validado',
            `Identificado: ${validation.targetNome}. Crie sua senha de no mínimo 6 caracteres.`
          );
        } else {
          toastService.error('Link Inválido', validation.message);
        }
      }
    } catch (e) {
      console.error('Erro ao ler token da URL:', e);
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
      setIsLoading(false);

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      if (result.precisaTrocarSenha) {
        setErrorMessage('Senha não cadastrada ou primeiro acesso pendente. Utilize a opção "Primeiro Acesso ao Sistema" abaixo para cadastrar sua senha por e-mail com segurança.');
        return;
      }

      if (result.user) {
        toastService.success(
          `Bem-vindo(a), ${result.user.nome}!`,
          `Autenticado com sucesso como ${result.user.cargoOuTitulo || result.user.tipo}.`
        );
        onLoginSuccess(result.user);
      }
    }, 350);
  };

  const handleSolicitarPrimeiroAcesso = (e: React.FormEvent) => {
    e.preventDefault();
    setPrimeiroAcessoErro('');

    const cleanEmail = (primeiroAcessoEmail || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setPrimeiroAcessoErro('Informe um e-mail válido para continuar.');
      return;
    }

    setPrimeiroAcessoLoading(true);

    setTimeout(() => {
      const res = storageService.solicitarPrimeiroAcesso(cleanEmail);
      setPrimeiroAcessoLoading(false);

      if (!res.success) {
        setPrimeiroAcessoErro(res.message);
        return;
      }

      const token = res.token || '';
      const activationLink = `${window.location.origin}${window.location.pathname}?token=${token}&action=primeiro-acesso`;

      setPrimeiroAcessoData({
        token,
        targetNome: res.targetNome || '',
        targetTipo: res.targetTipo || '',
        targetDoc: res.targetDoc || '',
        email: res.email || cleanEmail
      });
      setGeneratedActivationLink(activationLink);
      
      // NÃO abre a tela de senha imediatamente! Avança para o aviso de e-mail enviado com o link
      setPrimeiroAcessoStep('link_enviado');
      
      toastService.success(
        'E-mail Enviado!',
        `Link para criação de senha enviado para ${cleanEmail}.`
      );
    }, 450);
  };

  const handleCopyActivationLink = () => {
    if (!generatedActivationLink) return;
    navigator.clipboard.writeText(generatedActivationLink);
    setCopiedLink(true);
    toastService.success('Link Copiado', 'Link de primeiro acesso copiado para a área de transferência.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenInGmail = () => {
    if (!primeiroAcessoData?.email || !generatedActivationLink) return;
    const subject = 'SIGCON - Primeiro Acesso e Criação de Senha';
    const body = `Olá, ${primeiroAcessoData.targetNome}!\n\nVocê solicitou o primeiro acesso ao sistema SIGCON (${primeiroAcessoData.targetTipo} - Doc: ${primeiroAcessoData.targetDoc}).\n\nPara cadastrar sua nova senha pessoal de acesso (mínimo de 6 caracteres), clique no link de segurança abaixo:\n\n${generatedActivationLink}\n\nSe você não solicitou este acesso, desconsidere esta mensagem.`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(primeiroAcessoData.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  const handleOpenLinkFromEmail = () => {
    // Simula a ação do usuário ao clicar no link recebido em seu e-mail
    if (primeiroAcessoData?.token) {
      const validation = storageService.validarTokenPrimeiroAcesso(primeiroAcessoData.token);
      if (validation.success) {
        setPrimeiroAcessoStep('senha');
        toastService.info(
          'Link do E-mail Acessado',
          'Identidade confirmada! Crie agora a sua nova senha pessoal de no mínimo 6 caracteres.'
        );
      } else {
        setPrimeiroAcessoErro(validation.message);
      }
    }
  };

  const handleConcluirPrimeiroAcesso = (e: React.FormEvent) => {
    e.preventDefault();
    setPrimeiroAcessoErro('');

    if (!primeiroAcessoNovaSenha || primeiroAcessoNovaSenha.length < 6) {
      setPrimeiroAcessoErro('A nova senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (primeiroAcessoNovaSenha !== primeiroAcessoConfirmaSenha) {
      setPrimeiroAcessoErro('A confirmação de senha não coincide com a nova senha digitada.');
      return;
    }

    const key = primeiroAcessoData?.token || primeiroAcessoEmail;
    const res = storageService.concluirPrimeiroAcesso(key, primeiroAcessoNovaSenha);

    if (!res.success) {
      setPrimeiroAcessoErro(res.message);
      return;
    }

    // Limpar parâmetros da URL se houver token
    try {
      if (window.location.search.includes('token=')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {}

    toastService.success(
      'Senha Cadastrada com Sucesso!',
      'Sua senha de no mínimo 6 caracteres foi salva. Você já pode fazer login no sistema.'
    );

    // Ajusta o documento no formulário de login
    if (res.documento) {
      const cleanDoc = res.documento.replace(/\D/g, '');
      if (cleanDoc.length === 14) {
        setDocType('CNPJ');
        setDocumento(maskCNPJ(res.documento));
      } else {
        setDocType('CPF');
        setDocumento(maskCPF(res.documento));
      }
    }
    setSenha('');
    setShowPrimeiroAcessoModal(false);
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
                <div className="flex items-center space-x-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      setPrimeiroAcessoEmail('');
                      setPrimeiroAcessoErro('');
                      setPrimeiroAcessoStep('email');
                      setPrimeiroAcessoData(null);
                      setGeneratedActivationLink('');
                      setPrimeiroAcessoNovaSenha('');
                      setPrimeiroAcessoConfirmaSenha('');
                      setShowPrimeiroAcessoModal(true);
                    }}
                    className="text-emerald-700 hover:text-emerald-900 font-extrabold hover:underline cursor-pointer flex items-center space-x-0.5"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Primeiro Acesso</span>
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                  >
                    Esqueci minha senha
                  </button>
                </div>
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

            {/* Botão Destaque: Primeiro Acesso por E-mail */}
            <button
              type="button"
              onClick={() => {
                setPrimeiroAcessoEmail('');
                setPrimeiroAcessoErro('');
                setPrimeiroAcessoStep('email');
                setPrimeiroAcessoData(null);
                setGeneratedActivationLink('');
                setPrimeiroAcessoNovaSenha('');
                setPrimeiroAcessoConfirmaSenha('');
                setShowPrimeiroAcessoModal(true);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-linear-to-r from-emerald-50 via-teal-50 to-blue-50 hover:from-emerald-100 hover:to-blue-100 border border-emerald-300 text-emerald-900 text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-2xs group"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>Primeiro Acesso ao Sistema? Criar Minha Senha</span>
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400">
          SIGCON • Conectado à Rede Oficial do Conselho Regional
        </div>
      </div>

      {/* MODAL: PRIMEIRO ACESSO POR E-MAIL (PROFISSIONAIS, FUNCIONÁRIOS E EMPRESAS) */}
      {showPrimeiroAcessoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-blue-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider">
                    Primeiro Acesso ao Sistema
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    {primeiroAcessoStep === 'email' && 'Etapa 1 de 2: Validação de E-mail'}
                    {primeiroAcessoStep === 'link_enviado' && 'Link de Ativação Enviado'}
                    {primeiroAcessoStep === 'senha' && 'Etapa 2 de 2: Criação da Senha de Acesso'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrimeiroAcessoModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* ETAPA 1: DIGITAÇÃO DO E-MAIL */}
              {primeiroAcessoStep === 'email' && (
                <form onSubmit={handleSolicitarPrimeiroAcesso} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed space-y-1">
                    <p className="font-bold text-slate-900 text-[11px] uppercase flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Informe seu e-mail cadastrado</span>
                    </p>
                    <p>
                      Para realizar o primeiro acesso com segurança, informe o e-mail cadastrado junto ao conselho. O sistema validará se o e-mail consta na base de dados e enviará um link seguro para você cadastrar sua senha.
                    </p>
                  </div>

                  {primeiroAcessoErro && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2 animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="font-bold leading-snug">{primeiroAcessoErro}</div>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">
                      E-mail Cadastrado no Conselho *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        autoFocus
                        value={primeiroAcessoEmail}
                        onChange={(e) => {
                          setPrimeiroAcessoEmail(e.target.value);
                          setPrimeiroAcessoErro('');
                        }}
                        placeholder="exemplo@dominio.com.br"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Válido para Funcionários/Fiscais, Profissionais Inscritos (PF) e Empresas (PJ).
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowPrimeiroAcessoModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs uppercase hover:bg-slate-100 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={primeiroAcessoLoading}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase shadow-md shadow-emerald-500/25 transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {primeiroAcessoLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Verificando...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar Link para o E-mail</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* ETAPA INTERMEDIÁRIA: LINK ENVIADO AO E-MAIL */}
              {primeiroAcessoStep === 'link_enviado' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="text-center py-2 space-y-2">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                      <Mail className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900">
                      Link de Ativação Enviado!
                    </h4>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                      Enviamos um link com código de segurança para o e-mail:
                    </p>
                    <div className="inline-block px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-800">
                      {primeiroAcessoData?.email}
                    </div>
                  </div>

                  {/* Informações do Cadastro Localizado */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Titular Identificado na Base de Dados:
                    </div>
                    <div className="font-bold text-slate-900">{primeiroAcessoData?.targetNome}</div>
                    <div className="text-[11px] text-slate-600">
                      {primeiroAcessoData?.targetTipo === 'FUNCIONARIO' && 'Colaborador / Fiscal do Conselho'}
                      {primeiroAcessoData?.targetTipo === 'PROFISSIONAL' && 'Profissional Inscrito (Pessoa Física)'}
                      {primeiroAcessoData?.targetTipo === 'EMPRESA' && 'Empresa / Estabelecimento (Pessoa Jurídica)'}
                      {' • Documento: '}<span className="font-mono">{primeiroAcessoData?.targetDoc}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1">
                    <p className="font-bold text-[11px] uppercase flex items-center space-x-1 text-amber-800">
                      <span>⚠️ Como prosseguir:</span>
                    </p>
                    <p>
                      Abra a caixa de entrada do seu e-mail e <strong>clique no link recebido</strong> para validar sua titularidade e criar a sua nova senha pessoal de <strong>no mínimo 6 caracteres</strong>.
                    </p>
                  </div>

                  {/* Acesso Direto / Simulação do Clique do E-mail */}
                  <div className="p-3 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider flex items-center space-x-1">
                        <ExternalLink className="w-3 h-3 text-emerald-600" />
                        <span>Acessar Link Recebido no E-mail</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyActivationLink}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 cursor-pointer"
                        title="Copiar URL do link de ativação"
                      >
                        {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleOpenInGmail}
                        className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs shadow-2xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                        title="Abrir o Gmail com a mensagem e o link preenchidos"
                      >
                        <Mail className="w-3.5 h-3.5 text-rose-600" />
                        <span>Abrir no Gmail Web</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenLinkFromEmail}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase shadow-sm transition-all flex items-center justify-center space-x-1 cursor-pointer"
                        title="Simular o clique no link recebido por e-mail"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Criar Senha Agora</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setPrimeiroAcessoStep('email');
                        setPrimeiroAcessoErro('');
                      }}
                      className="text-xs text-slate-500 hover:text-slate-700 font-bold hover:underline cursor-pointer"
                    >
                      ← Enviar para outro e-mail
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPrimeiroAcessoModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs uppercase hover:bg-slate-100 cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}

              {/* ETAPA 2: CRIAÇÃO DA NOVA SENHA (APÓS CLICAR NO LINK) */}
              {primeiroAcessoStep === 'senha' && (
                <form onSubmit={handleConcluirPrimeiroAcesso} className="space-y-4 animate-in fade-in">
                  {/* Confirmação e dados identificados */}
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1.5">
                    <div className="flex items-center space-x-1.5 font-black text-xs text-emerald-800 uppercase">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Link do E-mail Validado com Sucesso</span>
                    </div>
                    <div className="text-[11px] leading-relaxed text-slate-700 bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                      <div><strong>Titular:</strong> {primeiroAcessoData?.targetNome}</div>
                      <div><strong>Categoria:</strong> <span className="font-mono text-emerald-800 font-bold">{primeiroAcessoData?.targetTipo}</span></div>
                      <div><strong>Documento:</strong> <span className="font-mono font-bold">{primeiroAcessoData?.targetDoc}</span></div>
                      <div><strong>E-mail:</strong> <span className="font-mono">{primeiroAcessoData?.email}</span></div>
                    </div>
                    <p className="text-[11px] text-emerald-800 font-semibold">
                      Defina sua senha pessoal definitiva abaixo (mínimo de 6 caracteres):
                    </p>
                  </div>

                  {primeiroAcessoErro && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2 animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="font-bold leading-snug">{primeiroAcessoErro}</div>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">
                      Nova Senha Pessoal * (no mínimo 6 caracteres)
                    </label>
                    <div className="relative">
                      <input
                        type={showPrimeiroAcessoPass ? 'text' : 'password'}
                        required
                        minLength={6}
                        autoFocus
                        value={primeiroAcessoNovaSenha}
                        onChange={(e) => {
                          setPrimeiroAcessoNovaSenha(e.target.value);
                          setPrimeiroAcessoErro('');
                        }}
                        placeholder="Mínimo de 6 caracteres"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPrimeiroAcessoPass(!showPrimeiroAcessoPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        {showPrimeiroAcessoPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      A senha deve conter pelo menos 6 caracteres para garantir a segurança da sua conta.
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">
                      Confirmação da Nova Senha *
                    </label>
                    <input
                      type={showPrimeiroAcessoPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={primeiroAcessoConfirmaSenha}
                      onChange={(e) => {
                        setPrimeiroAcessoConfirmaSenha(e.target.value);
                        setPrimeiroAcessoErro('');
                      }}
                      placeholder="Repita a senha de no mínimo 6 caracteres"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowPrimeiroAcessoModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs uppercase hover:bg-slate-100 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase shadow-md shadow-emerald-500/25 transition-all cursor-pointer flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Cadastrar Senha & Ativar Conta</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ESQUECI MINHA SENHA */}
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
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold uppercase cursor-pointer"
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
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase shadow-xs cursor-pointer"
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
                    Se preferir redefinição imediata, utilize a opção <strong>"Primeiro Acesso ao Sistema"</strong> informando seu e-mail cadastrado.
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
    </div>
  );
};
