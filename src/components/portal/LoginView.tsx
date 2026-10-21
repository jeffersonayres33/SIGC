import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  User, 
  CheckCircle2, 
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { AuthUser } from '../../types';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [documento, setDocumento] = useState(storageService.getRememberedDoc());
  const [senha, setSenha] = useState('');
  const [salvarDoc, setSalvarDoc] = useState(!!storageService.getRememberedDoc());
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulated network delay
    setTimeout(() => {
      const res = storageService.login(documento, senha, salvarDoc);
      
      if (res.success && res.user) {
        if (res.precisaTrocarSenha) {
          toastService.warning('Primeiro Acesso', 'Por favor, cadastre uma nova senha pessoal.');
          // Logic for forcing password change would go here
        }
        onLoginSuccess(res.user);
        toastService.success('Bem-vindo', `Olá, ${res.user.nome}!`);
      } else {
        toastService.error('Erro de Login', res.message);
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-slate-900 p-8 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-white">SIGC Cloud</h1>
          <p className="text-slate-400 text-xs mt-1">Sistema Integrado de Gestão de Conselhos</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              CPF ou CNPJ
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="000.000.000-00"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={salvarDoc}
                onChange={(e) => setSalvarDoc(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="text-[11px] font-semibold text-slate-600">Salvar CPF/CNPJ</span>
            </label>
            <button type="button" className="text-[11px] font-bold text-blue-600 hover:underline">
              Esqueci a senha
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center"
          >
            {isLoading ? 'Autenticando...' : 'ENTRAR NO SISTEMA'}
          </button>
        </form>

        <div className="px-8 pb-8 text-center text-[11px] text-slate-400">
          SIGC Cloud © 2026. Acesso restrito a profissionais, empresas e colaboradores autorizados.
        </div>
      </div>
    </div>
  );
};
