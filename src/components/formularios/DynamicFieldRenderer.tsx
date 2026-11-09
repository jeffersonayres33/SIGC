import React, { useState } from 'react';
import { FormFieldConfig } from '../../types';
import { maskCPF, maskCNPJ, maskCEP, validateCPF, validateCNPJ, fetchAddressByCEP } from '../../utils/documentUtils';
import { Check, AlertCircle, Loader2, MapPin, Search, Building2, UserCheck, Briefcase } from 'lucide-react';
import { toastService } from '../../services/toastService';
import { storageService } from '../../services/storageService';

interface DynamicFieldRendererProps {
  campo: FormFieldConfig;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  campo,
  value,
  onChange,
  disabled = false
}) => {
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Tratamento do tipo 'empresa_vinculada' (Empresas vinculadas ao profissional logado)
  if (campo.tipo === 'empresa_vinculada') {
    const authUser = storageService.getAuthUser();
    const allEmpresas = storageService.getEmpresas();
    const allVinculos = storageService.getHistoricoVinculosProfissionais();

    let linkedEmpresas: { id: string; razaoSocial: string; cnpj: string; inscricao: string; tipo: string }[] = [];

    if (authUser && (authUser.tipo === 'PROFISSIONAL' || authUser.role === 'PORTAL_PROFISSIONAL')) {
      const docClean = authUser.documentoLimpo || authUser.documento?.replace(/\D/g, '') || '';
      const inscricaoClean = authUser.numeroInscricao || '';

      linkedEmpresas = allEmpresas.filter(emp => {
        const isRT = emp.responsaveisTecnicos?.some(rt => 
          (inscricaoClean && rt.profissionalInscricao === inscricaoClean) || 
          rt.profissionalNome?.toUpperCase() === authUser.nome.toUpperCase()
        );
        const isSocio = emp.socios?.some(s => s.cpf?.replace(/\D/g, '') === docClean);
        const hasVinculo = allVinculos.some(v => 
          (v.profissionalInscricao === inscricaoClean || v.profissionalNome?.toUpperCase() === authUser.nome.toUpperCase()) && 
          v.empresaCnpj?.replace(/\D/g, '') === emp.cnpj.replace(/\D/g, '') &&
          v.status === 'Ativo'
        );
        return isRT || isSocio || hasVinculo;
      }).map(e => ({
        id: e.id,
        razaoSocial: e.razaoSocial,
        cnpj: e.cnpj,
        inscricao: e.inscricao,
        tipo: e.tipoEstabelecimento || 'Estabelecimento Registrado'
      }));
    }

    // Fallback de pré-visualização no admin ou simulação de envio
    if (linkedEmpresas.length === 0) {
      linkedEmpresas = allEmpresas.map(e => ({
        id: e.id,
        razaoSocial: e.razaoSocial,
        cnpj: e.cnpj,
        inscricao: e.inscricao,
        tipo: e.tipoEstabelecimento || 'Estabelecimento Registrado'
      }));
    }

    return (
      <div className="space-y-1">
        <label className="block text-slate-700 font-bold text-xs flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{campo.label || 'Empresa(s) Vinculada(s) ao Peticionamento'}</span> {campo.obrigatorio && <span className="text-rose-500">*</span>}
        </label>
        <select
          disabled={disabled}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={campo.obrigatorio}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold uppercase focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
        >
          <option value="">Selecione a empresa vinculada...</option>
          {linkedEmpresas.map(emp => (
            <option key={emp.id} value={`${emp.razaoSocial} (CNPJ: ${emp.cnpj})`}>
              {emp.razaoSocial} — CNPJ: {emp.cnpj} ({emp.tipo})
            </option>
          ))}
        </select>
        <p className="text-[10px] text-slate-400">
          Mostra todos os estabelecimentos farmacêuticos ou empresas vinculados ao profissional autenticado.
        </p>
        {campo.ajuda && <p className="text-[10px] text-slate-400">{campo.ajuda}</p>}
      </div>
    );
  }

  // Tratamento do tipo 'profissional_vinculado' (Profissionais vinculados à empresa logada)
  if (campo.tipo === 'profissional_vinculado') {
    const authUser = storageService.getAuthUser();
    const allProfs = storageService.getProfissionais();
    const allEmpresas = storageService.getEmpresas();
    const allVinculos = storageService.getHistoricoVinculosProfissionais();

    let linkedProfs: { id: string; nome: string; cpf: string; inscricao: string; tipo: string }[] = [];

    if (authUser && (authUser.tipo === 'EMPRESA' || authUser.role === 'PORTAL_EMPRESA')) {
      const cnpjClean = authUser.documentoLimpo || authUser.documento?.replace(/\D/g, '') || '';
      const emp = allEmpresas.find(e => e.cnpj.replace(/\D/g, '') === cnpjClean);

      if (emp && emp.responsaveisTecnicos) {
        emp.responsaveisTecnicos.forEach(rt => {
          linkedProfs.push({
            id: rt.profissionalId || `rt-${rt.profissionalInscricao}`,
            nome: rt.profissionalNome,
            cpf: '',
            inscricao: rt.profissionalInscricao,
            tipo: rt.cargo || 'Responsável Técnico'
          });
        });
      }

      allVinculos.filter(v => v.empresaCnpj.replace(/\D/g, '') === cnpjClean && v.status === 'Ativo').forEach(v => {
        if (!linkedProfs.some(p => p.inscricao === v.profissionalInscricao)) {
          linkedProfs.push({
            id: v.profissionalId,
            nome: v.profissionalNome || 'Profissional',
            cpf: '',
            inscricao: v.profissionalInscricao || '-',
            tipo: v.cargo || 'Assistente Farmacêutico'
          });
        }
      });
    }

    // Fallback de pré-visualização no admin ou simulação de envio
    if (linkedProfs.length === 0) {
      linkedProfs = allProfs.map(p => ({
        id: p.id,
        nome: p.nome,
        cpf: p.cpf,
        inscricao: p.inscricao,
        tipo: p.tipoAssociado || 'Farmacêutico'
      }));
    }

    return (
      <div className="space-y-1">
        <label className="block text-slate-700 font-bold text-xs flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-purple-600" />
          <span>{campo.label || 'Profissional(is) Vinculado(s) ao Peticionamento'}</span> {campo.obrigatorio && <span className="text-rose-500">*</span>}
        </label>
        <select
          disabled={disabled}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={campo.obrigatorio}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold uppercase focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
        >
          <option value="">Selecione o profissional vinculado...</option>
          {linkedProfs.map(prof => (
            <option key={prof.id} value={`${prof.nome} (CRF: ${prof.inscricao})`}>
              {prof.nome} — CRF: {prof.inscricao} ({prof.tipo})
            </option>
          ))}
        </select>
        <p className="text-[10px] text-slate-400">
          Mostra todos os profissionais e responsáveis técnicos vinculados ao estabelecimento autenticado.
        </p>
        {campo.ajuda && <p className="text-[10px] text-slate-400">{campo.ajuda}</p>}
      </div>
    );
  }

  // Tratamento do tipo 'cpf'
  if (campo.tipo === 'cpf') {
    const rawVal = typeof value === 'string' ? value : '';
    const formatted = maskCPF(rawVal);
    const cleanDigits = rawVal.replace(/\D/g, '');
    const isValid = cleanDigits.length === 11 ? validateCPF(cleanDigits) : null;

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-slate-700 font-bold text-xs">
            {campo.label} {campo.obrigatorio && <span className="text-rose-500">*</span>}
          </label>
          {isValid !== null && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {isValid ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              <span>{isValid ? 'CPF Válido' : 'CPF Inválido'}</span>
            </span>
          )}
        </div>
        <input
          type="text"
          disabled={disabled}
          maxLength={14}
          value={formatted}
          onChange={(e) => onChange(maskCPF(e.target.value))}
          placeholder={campo.placeholder || '000.000.000-00'}
          required={campo.obrigatorio}
          className={`w-full px-3 py-2 border rounded-xl font-mono text-xs ${
            isValid === false 
              ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold' 
              : 'bg-slate-50 border-slate-300 text-slate-900 font-semibold'
          }`}
        />
        {campo.ajuda && <p className="text-[10px] text-slate-400">{campo.ajuda}</p>}
      </div>
    );
  }

  // Tratamento do tipo 'cnpj'
  if (campo.tipo === 'cnpj') {
    const rawVal = typeof value === 'string' ? value : '';
    const formatted = maskCNPJ(rawVal);
    const cleanDigits = rawVal.replace(/\D/g, '');
    const isValid = cleanDigits.length === 14 ? validateCNPJ(cleanDigits) : null;

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-slate-700 font-bold text-xs">
            {campo.label} {campo.obrigatorio && <span className="text-rose-500">*</span>}
          </label>
          {isValid !== null && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {isValid ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              <span>{isValid ? 'CNPJ Válido' : 'CNPJ Inválido'}</span>
            </span>
          )}
        </div>
        <input
          type="text"
          disabled={disabled}
          maxLength={18}
          value={formatted}
          onChange={(e) => onChange(maskCNPJ(e.target.value))}
          placeholder={campo.placeholder || '00.000.000/0000-00'}
          required={campo.obrigatorio}
          className={`w-full px-3 py-2 border rounded-xl font-mono text-xs ${
            isValid === false 
              ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold' 
              : 'bg-slate-50 border-slate-300 text-slate-900 font-semibold'
          }`}
        />
        {campo.ajuda && <p className="text-[10px] text-slate-400">{campo.ajuda}</p>}
      </div>
    );
  }

  // Tratamento do tipo 'endereco_cep' (Endereço Completo com consulta ViaCEP)
  if (campo.tipo === 'endereco_cep') {
    const addr = typeof value === 'object' && value !== null ? value : {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: ''
    };

    const handleCepChange = async (cepValue: string) => {
      const maskedCep = maskCEP(cepValue);
      const updated = { ...addr, cep: maskedCep };
      onChange(updated);

      const cleanCep = maskedCep.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        setIsSearchingCep(true);
        try {
          const res = await fetchAddressByCEP(cleanCep);
          if (res) {
            onChange({
              ...updated,
              logradouro: (res.logradouro || '').toUpperCase(),
              bairro: (res.bairro || '').toUpperCase(),
              cidade: (res.localidade || (res as any).cidade || '').toUpperCase(),
              uf: (res.uf || '').toUpperCase()
            });
            toastService.success('CEP Encontrado', `${res.logradouro}, ${res.localidade} - ${res.uf}`);
          }
        } catch (e) {
          toastService.warning('CEP Não Localizado', 'Preencha os campos do endereço manualmente.');
        } finally {
          setIsSearchingCep(false);
        }
      }
    };

    return (
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 col-span-full">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
          <span className="font-bold text-slate-800 text-xs uppercase flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>{campo.label || 'Endereço Completo com CEP'}</span> {campo.obrigatorio && <span className="text-rose-500">*</span>}
          </span>
          {isSearchingCep && (
            <span className="text-[10px] text-blue-600 flex items-center gap-1 font-semibold">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Buscando ViaCEP...</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">CEP</label>
            <div className="relative">
              <input
                type="text"
                disabled={disabled}
                maxLength={9}
                value={addr.cep || ''}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Rua / Av / Travessa (Logradouro)</label>
            <input
              type="text"
              disabled={disabled}
              value={addr.logradouro || ''}
              onChange={(e) => onChange({ ...addr, logradouro: e.target.value.toUpperCase() })}
              placeholder="Ex: Av. Djalma Batista"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 uppercase"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Número</label>
            <input
              type="text"
              disabled={disabled}
              value={addr.numero || ''}
              onChange={(e) => onChange({ ...addr, numero: e.target.value })}
              placeholder="Ex: 1230"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Complemento</label>
            <input
              type="text"
              disabled={disabled}
              value={addr.complemento || ''}
              onChange={(e) => onChange({ ...addr, complemento: e.target.value.toUpperCase() })}
              placeholder="Ex: Sala 402"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 uppercase"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Bairro</label>
            <input
              type="text"
              disabled={disabled}
              value={addr.bairro || ''}
              onChange={(e) => onChange({ ...addr, bairro: e.target.value.toUpperCase() })}
              placeholder="Ex: Chapada"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 uppercase"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Cidade</label>
              <input
                type="text"
                disabled={disabled}
                value={addr.cidade || ''}
                onChange={(e) => onChange({ ...addr, cidade: e.target.value.toUpperCase() })}
                placeholder="Manaus"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 uppercase"
              />
            </div>
            <div className="w-16">
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">UF</label>
              <input
                type="text"
                disabled={disabled}
                maxLength={2}
                value={addr.uf || ''}
                onChange={(e) => onChange({ ...addr, uf: e.target.value.toUpperCase() })}
                placeholder="AM"
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-center uppercase"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tratamento do tipo 'radio' (Botões de Rádio)
  if (campo.tipo === 'radio') {
    const opcoes = campo.opcoes && campo.opcoes.length > 0 ? campo.opcoes : ['Opção 1', 'Opção 2'];

    return (
      <div className="space-y-1.5">
        <label className="block text-slate-700 font-bold text-xs">
          {campo.label} {campo.obrigatorio && <span className="text-rose-500">*</span>}
        </label>
        <div className="flex flex-wrap gap-2.5 pt-0.5">
          {opcoes.map((opt, idx) => (
            <label 
              key={idx} 
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                String(value) === opt 
                  ? 'bg-blue-50 border-blue-400 text-blue-900 ring-1 ring-blue-300' 
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <input
                type="radio"
                name={campo.id}
                disabled={disabled}
                checked={String(value) === opt}
                onChange={() => onChange(opt)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        {campo.ajuda && <p className="text-[10px] text-slate-400">{campo.ajuda}</p>}
      </div>
    );
  }

  // Tratamento do tipo 'checkbox' (Caixa de Seleção Única / Aceite)
  if (campo.tipo === 'checkbox') {
    return (
      <div className="pt-1">
        <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors text-xs font-semibold text-slate-800">
          <input
            type="checkbox"
            disabled={disabled}
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 shrink-0"
          />
          <span>{campo.label} {campo.obrigatorio && <span className="text-rose-500">*</span>}</span>
        </label>
        {campo.ajuda && <p className="text-[10px] text-slate-400 mt-1">{campo.ajuda}</p>}
      </div>
    );
  }

  // Tratamento do tipo 'select'
  if (campo.tipo === 'select') {
    return (
      <div className="space-y-1">
        <label className="block text-slate-700 font-bold text-xs">
          {campo.label} {campo.obrigatorio && <span className="text-rose-500">*</span>}
        </label>
        <select
          disabled={disabled}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={campo.obrigatorio}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium"
        >
          <option value="">Selecione uma opção...</option>
          {campo.opcoes?.map((opt, idx) => (
            <option key={idx} value={opt}>{opt}</option>
          ))}
        </select>
        {campo.ajuda && <p className="text-[10px] text-slate-400">{campo.ajuda}</p>}
      </div>
    );
  }

  // Tratamento do tipo 'textarea'
  if (campo.tipo === 'textarea') {
    return (
      <div className="space-y-1">
        <label className="block text-slate-700 font-bold text-xs">
          {campo.label} {campo.obrigatorio && <span className="text-rose-500">*</span>}
        </label>
        <textarea
          rows={3}
          disabled={disabled}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={campo.placeholder}
          required={campo.obrigatorio}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs"
        />
        {campo.ajuda && <p className="text-[10px] text-slate-400">{campo.ajuda}</p>}
      </div>
    );
  }

  // Fallback padrão: input text, number, email, date
  return (
    <div className="space-y-1">
      <label className="block text-slate-700 font-bold text-xs">
        {campo.label} {campo.obrigatorio && <span className="text-rose-500">*</span>}
      </label>
      <input
        type={campo.tipo === 'email' ? 'email' : campo.tipo === 'number' ? 'number' : campo.tipo === 'date' ? 'date' : 'text'}
        disabled={disabled}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={campo.placeholder}
        required={campo.obrigatorio}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs"
      />
      {campo.ajuda && <p className="text-[10px] text-slate-400">{campo.ajuda}</p>}
    </div>
  );
};
