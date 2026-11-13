import React, { useState, useEffect } from 'react';
import { 
  User, 
  X, 
  Lock, 
  MapPin, 
  Mail, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  Save, 
  Building2, 
  ShieldCheck,
  Search,
  Loader2,
  Building,
  Briefcase,
  Info
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { maskCEP, fetchAddressByCEP, maskPhone } from '../../utils/documentUtils';
import { AuthUser } from '../../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUser: AuthUser | null;
  onUserUpdated?: (user: AuthUser) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  authUser,
  onUserUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'endereco' | 'senha'>('endereco');
  
  // Address & Contact states
  const [nomeDisplay, setNomeDisplay] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Password change states
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  useEffect(() => {
    if (!authUser || !isOpen) return;

    setNomeDisplay(authUser.nome || '');

    // Carrega dados detalhados conforme o tipo de usuário
    if (authUser.tipo === 'PROFISSIONAL') {
      const profs = storageService.getProfissionais();
      const prof = profs.find(p => p.cpf === authUser.documento || p.id === authUser.id) as any;
      if (prof) {
        setEmail(prof.emailPessoal || prof.emailComercial || authUser.email || '');
        setTelefone(prof.celular || prof.telefone || '');
        setCep(prof.cep || '');
        setLogradouro(prof.endereco || '');
        setNumero(prof.numero || '');
        setComplemento(prof.complemento || '');
        setBairro(prof.bairro || '');
        setCidade(prof.cidade || 'MANAUS');
        setUf(prof.uf || 'AM');
      } else {
        setEmail(authUser.email || '');
      }
    } else if (authUser.tipo === 'EMPRESA') {
      const emps = storageService.getEmpresas();
      const emp = emps.find(e => e.cnpj === authUser.documento || e.id === authUser.id) as any;
      if (emp) {
        setEmail(emp.email || authUser.email || '');
        setTelefone(emp.telefone || '');
        setCep(emp.cep || '');
        setLogradouro(emp.logradouro || emp.endereco || '');
        setNumero(emp.numero || '');
        setComplemento(emp.complemento || '');
        setBairro(emp.bairro || '');
        setCidade(emp.cidade || 'MANAUS');
        setUf(emp.uf || 'AM');
      } else {
        setEmail(authUser.email || '');
      }
    } else {
      // FUNCIONARIO / ADMIN
      const funcs = storageService.getFuncionarios();
      const func = funcs.find(f => f.cpf === authUser.documento || f.id === authUser.id) as any;
      if (func) {
        setEmail(func.email || authUser.email || '');
        setTelefone(func.celular || func.telefone || '');
        setCep(func.cep || '');
        setLogradouro(func.endereco || '');
        setNumero(func.numero || '');
        setComplemento(func.complemento || '');
        setBairro(func.bairro || '');
        setCidade(func.cidade || 'MANAUS');
        setUf(func.uf || 'AM');
      } else {
        setEmail(authUser.email || '');
      }
    }
  }, [authUser, isOpen]);

  if (!isOpen || !authUser) return null;

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const masked = maskCEP(raw);
    setCep(masked);
    const clean = raw.replace(/\D/g, '');
    if (clean.length === 8) {
      setIsSearchingCep(true);
      const addr = await fetchAddressByCEP(masked);
      setIsSearchingCep(false);
      if (addr && !addr.erro) {
        setLogradouro(addr.logradouro || logradouro);
        setBairro(addr.bairro || bairro);
        setCidade(addr.localidade ? addr.localidade.toUpperCase() : cidade);
        setUf(addr.uf ? addr.uf.toUpperCase() : uf);
        toastService.success('CEP Encontrado', `Endereço localizado para o CEP ${masked}.`);
      }
    }
  };

  const handleSaveEndereco = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProfile(true);

    if (authUser.tipo === 'PROFISSIONAL') {
      const profs = storageService.getProfissionais();
      const target = profs.find(p => p.cpf === authUser.documento || p.id === authUser.id) as any;
      if (target) {
        target.emailPessoal = email;
        target.celular = telefone;
        target.cep = cep;
        target.endereco = logradouro;
        target.numero = numero;
        target.complemento = complemento;
        target.bairro = bairro;
        target.cidade = cidade;
        target.uf = uf;
        storageService.saveProfissional(target);
      }
    } else if (authUser.tipo === 'EMPRESA') {
      const emps = storageService.getEmpresas();
      const target = emps.find(e => e.cnpj === authUser.documento || e.id === authUser.id) as any;
      if (target) {
        target.email = email;
        target.telefone = telefone;
        target.cep = cep;
        target.logradouro = logradouro;
        target.endereco = logradouro;
        target.numero = numero;
        target.complemento = complemento;
        target.bairro = bairro;
        target.cidade = cidade;
        target.uf = uf;
        storageService.saveEmpresa(target);
      }
    } else {
      const funcs = storageService.getFuncionarios();
      const target = funcs.find(f => f.cpf === authUser.documento || f.id === authUser.id) as any;
      if (target) {
        target.email = email;
        target.celular = telefone;
        target.cep = cep;
        target.endereco = logradouro;
        target.numero = numero;
        target.complemento = complemento;
        target.bairro = bairro;
        target.cidade = cidade;
        target.uf = uf;
        storageService.saveFuncionario(target);
      }
    }

    // Atualiza a sessão de autenticação ativa
    const updatedUser: AuthUser = { 
      ...authUser, 
      email 
    };
    storageService.setCurrentAuthUser(updatedUser);
    if (onUserUpdated) onUserUpdated(updatedUser);

    setIsSubmittingProfile(false);
    toastService.success(
      'Perfil Atualizado com Sucesso!',
      'Endereço e dados de contato foram armazenados com sucesso.'
    );
    onClose();
  };

  const handleSaveSenha = (e: React.FormEvent) => {
    e.preventDefault();

    if (!novaSenha || novaSenha.length < 6) {
      toastService.warning('Senha Curta', 'A nova senha deve possuir no mínimo 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmaSenha) {
      toastService.warning('Senhas Divergentes', 'A confirmação de senha não coincide com a nova senha digitada.');
      return;
    }

    setIsSubmittingPassword(true);
    const docOrId = authUser.documento || authUser.id;
    const res = storageService.redefinirSenha(docOrId, novaSenha);
    setIsSubmittingPassword(false);

    if (res.success) {
      toastService.success(
        'Senha Alterada com Sucesso!',
        'Sua nova senha de acesso foi salva. Utilize-a no seu próximo login.'
      );
      setNovaSenha('');
      setConfirmaSenha('');
      onClose();
    } else {
      toastService.error('Falha ao Alterar Senha', res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header do Perfil */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:12px_12px] opacity-20 pointer-events-none"></div>
          
          <div className="flex items-center space-x-3.5 z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              {authUser.tipo === 'EMPRESA' ? (
                <Building2 className="w-6 h-6 text-teal-300" />
              ) : authUser.tipo === 'PROFISSIONAL' ? (
                <User className="w-6 h-6 text-cyan-300" />
              ) : (
                <Briefcase className="w-6 h-6 text-purple-300" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  {authUser.tipo === 'EMPRESA' ? 'Pessoa Jurídica' : authUser.tipo === 'PROFISSIONAL' ? 'Profissional Inscrito' : 'Colaborador Interno'}
                </span>
                {authUser.numeroInscricao && (
                  <span className="text-[10px] font-mono font-bold text-amber-300">
                    Reg: {authUser.numeroInscricao}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white truncate mt-0.5">
                {nomeDisplay}
              </h2>
              <p className="text-xs text-slate-300 font-mono truncate">
                Doc: {authUser.documento} • {authUser.cargoOuTitulo || authUser.role}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-10 cursor-pointer"
            title="Fechar Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas de Navegação no Perfil */}
        <div className="bg-slate-100 p-1.5 border-b border-slate-200 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('endereco')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'endereco'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Endereço & Contato</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('senha')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'senha'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4 text-purple-600" />
            <span>Alterar Senha</span>
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'endereco' && (
            <form onSubmit={handleSaveEndereco} className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start space-x-2.5 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Mantenha seu endereço e e-mail sempre atualizados para receber notificações, certidões eletrônicas e comunicados oficiais do Conselho.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                    E-mail Oficial *:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@exemplo.com.br"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                    Telefone / Celular:
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={telefone}
                      onChange={(e) => setTelefone(maskPhone(e.target.value))}
                      placeholder="(92) 99111-2233"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                    CEP *:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cep}
                      onChange={handleCepChange}
                      placeholder="69000-000"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 uppercase"
                    />
                    {isSearchingCep && (
                      <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 animate-spin" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                    Bairro *:
                  </label>
                  <input
                    type="text"
                    required
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value.toUpperCase())}
                    placeholder="CENTRO"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 uppercase"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                    Logradouro / Endereço *:
                  </label>
                  <input
                    type="text"
                    required
                    value={logradouro}
                    onChange={(e) => setLogradouro(e.target.value.toUpperCase())}
                    placeholder="RUA, AVENIDA OU ALAMEDA..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                    Número:
                  </label>
                  <input
                    type="text"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value.toUpperCase())}
                    placeholder="123 OU S/N"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                    Complemento:
                  </label>
                  <input
                    type="text"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value.toUpperCase())}
                    placeholder="APT 101 / BLOCO B"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                    Cidade *:
                  </label>
                  <input
                    type="text"
                    required
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value.toUpperCase())}
                    placeholder="MANAUS"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                    UF *:
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={uf}
                    onChange={(e) => setUf(e.target.value.toUpperCase())}
                    placeholder="AM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProfile}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {isSubmittingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Salvar Endereço</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'senha' && (
            <form onSubmit={handleSaveSenha} className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-start space-x-2.5 text-xs text-purple-900">
                <Key className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <p>
                  Sua nova senha deve conter no mínimo <strong>6 caracteres</strong>. Por segurança, não compartilhe sua senha com terceiros.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                    Nova Senha (Mínimo 6 caracteres) *:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                    Confirmar Nova Senha *:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmaSenha}
                      onChange={(e) => setConfirmaSenha(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold uppercase shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                >
                  {isSubmittingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Atualizar Minha Senha</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
