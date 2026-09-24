import { 
  Profissional, 
  Empresa, 
  LancamentoFinanceiro, 
  ProcessoCobranca, 
  TermoFiscalizacao, 
  ProtocoloProcesso, 
  FormularioDinamico, 
  RespostaFormulario,
  MicrosservicoStatus,
  ItemCadastroBasico,
  CategoriaCadastroBasico,
  ResponsavelTecnico,
  HorarioTrabalhoRT,
  Socio,
  RegraAssistenciaFarmaceutica,
  TipoExigenciaAssistencia,
  HorarioFuncionamentoItem,
  HorarioAssistenciaItem,
  CondicaoFirma
} from '../types';
import { 
  INITIAL_PROFISSIONAIS, 
  INITIAL_EMPRESAS, 
  INITIAL_LANCAMENTOS, 
  INITIAL_COBRANCAS, 
  INITIAL_TERMOS_FISCALIZACAO, 
  INITIAL_PROTOCOLOS, 
  INITIAL_DYNAMIC_FORMS, 
  INITIAL_MICROSERVICES,
  generateSingleProfissional 
} from './mockDataGenerator';
import { sanitizeToUpper, formatInscricaoCompleta } from '../utils/documentUtils';
import { supabase, checkSupabaseConnection, SupabaseHealthCheck } from './supabaseClient';

const STORAGE_KEYS = {
  PROFISSIONAIS: 'siscon_profissionais_custom',
  EMPRESAS: 'siscon_empresas_v1',
  LANCAMENTOS: 'siscon_lancamentos_v1',
  COBRANCAS: 'siscon_cobrancas_v1',
  TERMOS_FISCALIZACAO: 'siscon_termos_fisc_v1',
  PROTOCOLOS: 'siscon_protocolos_v1',
  FORMULARIOS: 'siscon_forms_v1',
  RESPOSTAS_FORMS: 'siscon_respostas_forms_v1',
  OFFLINE_QUEUE: 'siscon_offline_queue_v1',
  COUNCIL_CONFIG: 'siscon_council_config_v1',
  CADASTROS_BASICOS: 'siscon_cadastros_basicos_v1',
  REGRAS_ASSISTENCIA: 'siscon_regras_assistencia_v1',
  SUPABASE_SYNC_ENABLED: 'siscon_supabase_sync_enabled'
};

function runBackgroundSupabase(queryPromise: any) {
  Promise.resolve(queryPromise).catch((e: any) => {
    console.warn('Supabase sync background notice:', e);
  });
}

export interface CouncilConfig {
  sigla: string;
  nomeCompleto: string;
  jurisdicao: string;
  cidadeSede: string;
  uf: string;
  cnpj: string;
  endereco: string;
  bairro: string;
  cep: string;
  telefone: string;
  email: string;
  site: string;
  presidente: string;
  tesoureiro: string;
  secretarioGeral: string;
  resolucaoAnuidade: string;
  valorAnuidadePF: number;
  valorAnuidadePJ: number;
  chavePix: string;
  totalProfissionaisRegistrados: number;
  totalEmpresasRegistradas: number;
  
  // Numeração Cronológica Automática de Inscrições
  proximoNumeroInscricaoProfissional: number;
  prefixoInscricaoProfissional: string;
  sufixoInscricaoProfissional: string;
  digitosMinimosInscricaoProfissional: number;

  proximoNumeroInscricaoEmpresa: number;
  prefixoInscricaoEmpresa: string;
  sufixoInscricaoEmpresa: string;
  digitosMinimosInscricaoEmpresa: number;

  // Configurações de Validação de Documentos e CEP
  validarCPF: boolean;
  validarCNPJ: boolean;
  validarCEP: boolean;
  autoPreencherEnderecoCEP: boolean;

  // Situações que impedem o profissional de assumir Responsabilidade Técnica (ART)
  situacoesImpedidasRT: string[];
}

export const DEFAULT_COUNCIL_CONFIG: CouncilConfig = {
  sigla: 'CRF-AM',
  nomeCompleto: 'CONSELHO REGIONAL DE FARMÁCIA DO ESTADO DO AMAZONAS',
  jurisdicao: 'AMAZONAS E RORAIMA',
  cidadeSede: 'MANAUS',
  uf: 'AM',
  cnpj: '04.382.491/0001-20',
  endereco: 'RUA RIO JUTAÍ, Nº 670, CONJUNTO VIEIRALVES',
  bairro: 'NOSSA SENHORA DAS GRAÇAS',
  cep: '69053-020',
  telefone: '(92) 3622-1088',
  email: 'CONTATO@CRF-AM.ORG.BR',
  site: 'HTTPS://CRF-AM.ORG.BR',
  presidente: 'DRA. LUANA SANTANA DA SILVA',
  tesoureiro: 'DR. VALTER SILVEIRA GOMES',
  secretarioGeral: 'DR. JORGE CAVALCANTE RAMOS',
  resolucaoAnuidade: 'RESOLUÇÃO CFF Nº 750/2025',
  valorAnuidadePF: 620.00,
  valorAnuidadePJ: 1240.00,
  chavePix: 'FINANCEIRO@CRF-AM.ORG.BR',
  totalProfissionaisRegistrados: 11480,
  totalEmpresasRegistradas: 1340,

  proximoNumeroInscricaoProfissional: 4150,
  prefixoInscricaoProfissional: 'CRF-AM',
  sufixoInscricaoProfissional: '',
  digitosMinimosInscricaoProfissional: 4,

  proximoNumeroInscricaoEmpresa: 1250,
  prefixoInscricaoEmpresa: 'CRF-AM',
  sufixoInscricaoEmpresa: '-PJ',
  digitosMinimosInscricaoEmpresa: 4,

  validarCPF: true,
  validarCNPJ: true,
  validarCEP: true,
  autoPreencherEnderecoCEP: true,

  situacoesImpedidasRT: [
    'Suspenso',
    'Cancelado',
    'Falecido',
    'Baixado',
    'Licenciado',
    'Transferido'
  ]
};

export const DEFAULT_HORARIOS_FUNCIONAMENTO: HorarioFuncionamentoItem[] = [
  { dia: 'Segunda', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
  { dia: 'Terça', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
  { dia: 'Quarta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
  { dia: 'Quinta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
  { dia: 'Sexta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
  { dia: 'Sábado', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '', fim2: '', totalHorasDia: 4 },
  { dia: 'Domingo', ativo: false, inicio1: '', fim1: '', inicio2: '', fim2: '', totalHorasDia: 0 },
  { dia: 'Feriados', ativo: false, inicio1: '', fim1: '', inicio2: '', fim2: '', totalHorasDia: 0 }
];

export const DEFAULT_HORARIOS_ASSISTENCIA: HorarioAssistenciaItem[] = [
  { dia: 'Segunda', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
  { dia: 'Terça', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
  { dia: 'Quarta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
  { dia: 'Quinta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
  { dia: 'Sexta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
  { dia: 'Sábado', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '', fim2: '', totalHorasDia: 4 },
  { dia: 'Domingo', ativo: false, inicio1: '', fim1: '', inicio2: '', fim2: '', totalHorasDia: 0 },
  { dia: 'Feriados', ativo: false, inicio1: '', fim1: '', inicio2: '', fim2: '', totalHorasDia: 0 }
];

export const DEFAULT_HORARIOS_RT: HorarioTrabalhoRT[] = [
  { dia: 'Domingo', ativo: false, inicio1: '', fim1: '', totalHorasDia: 0 },
  { dia: 'Segunda', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
  { dia: 'Terça', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
  { dia: 'Quarta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
  { dia: 'Quinta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
  { dia: 'Sexta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
  { dia: 'Sábado', ativo: false, inicio1: '', fim1: '', totalHorasDia: 0 },
  { dia: 'Feriados', ativo: false, inicio1: '', fim1: '', totalHorasDia: 0 }
];

export const calculateRtWeeklyHours = (horarios?: HorarioTrabalhoRT[]): number => {
  if (!horarios || horarios.length === 0) return 0;
  return Number(horarios.reduce((acc, h) => acc + calculateDayTotalHours(h), 0).toFixed(2));
};

export const calculateIntervalHours = (inicio?: string, fim?: string): number => {
  if (!inicio || !fim) return 0;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fim.split(':').map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
  const t1 = h1 * 60 + m1;
  const t2 = h2 * 60 + m2;
  if (t2 <= t1) return 0;
  return Number(((t2 - t1) / 60).toFixed(2));
};

export const calculateDayTotalHours = (item: { ativo?: boolean; inicio1?: string; fim1?: string; inicio2?: string; fim2?: string }): number => {
  if (item.ativo === false) return 0;
  const part1 = calculateIntervalHours(item.inicio1, item.fim1);
  const part2 = calculateIntervalHours(item.inicio2, item.fim2);
  return Number((part1 + part2).toFixed(2));
};

export const INITIAL_REGRAS_ASSISTENCIA: RegraAssistenciaFarmaceutica[] = [
  {
    id: 'regra-1',
    municipio: 'MANACAPURU',
    tipoEstabelecimento: 'Farmácia sem Manipulação',
    tipoExigencia: 'HORAS_DIARIAS',
    horasMinimas: 5,
    descricao: 'Carga horária mínima exigida de 5 horas/dia de assistência farmacêutica.',
    baseLegal: 'Deliberação Plenária CRF - Polo Interior Manacapuru',
    ativo: true
  },
  {
    id: 'regra-manacapuru-drogaria',
    municipio: 'MANACAPURU',
    tipoEstabelecimento: 'Drogaria',
    tipoExigencia: 'HORAS_DIARIAS',
    horasMinimas: 5,
    descricao: 'Carga horária mínima exigida de 5 horas/dia de assistência farmacêutica para drogarias.',
    baseLegal: 'Deliberação Plenária CRF - Polo Interior Manacapuru',
    ativo: true
  },
  {
    id: 'regra-2',
    municipio: 'MANACAPURU',
    tipoEstabelecimento: 'Farmácia com Manipulação',
    tipoExigencia: 'ASSISTENCIA_PLENA',
    horasMinimas: 0,
    descricao: 'Assistência farmacêutica plena (100% do horário de funcionamento).',
    baseLegal: 'Lei Federal 13.021/2014 & RDC Anvisa 67/2007 (Magistral)',
    ativo: true
  },
  {
    id: 'regra-3',
    municipio: 'MANAUS',
    tipoEstabelecimento: 'Farmácia sem Manipulação',
    tipoExigencia: 'ASSISTENCIA_PLENA',
    horasMinimas: 0,
    descricao: 'Assistência farmacêutica plena (100% do horário de funcionamento) na Capital.',
    baseLegal: 'Lei Federal nº 13.021/2014 - Assistência Integral na Capital',
    ativo: true
  },
  {
    id: 'regra-4',
    municipio: 'MANAUS',
    tipoEstabelecimento: 'Drogaria',
    tipoExigencia: 'ASSISTENCIA_PLENA',
    horasMinimas: 0,
    descricao: 'Assistência farmacêutica plena (100% do horário de funcionamento) na Capital.',
    baseLegal: 'Lei Federal nº 13.021/2014 - Assistência Integral na Capital',
    ativo: true
  },
  {
    id: 'regra-5',
    municipio: 'MANAUS',
    tipoEstabelecimento: 'Distribuidora de Produtos para Saúde',
    tipoExigencia: 'HORAS_SEMANAIS',
    horasMinimas: 5,
    descricao: 'Mínimo de 5 horas semanais de responsabilidade técnica farmacêutica.',
    baseLegal: 'Resolução CFF & Deliberação Plenária CRF - Distribuidoras Correlatos',
    ativo: true
  },
  {
    id: 'regra-6',
    municipio: 'TODOS OS MUNICÍPIOS',
    tipoEstabelecimento: 'Farmácia com Manipulação',
    tipoExigencia: 'ASSISTENCIA_PLENA',
    horasMinimas: 0,
    descricao: 'Assistência plena integral durante todo o período de funcionamento/manipulação.',
    baseLegal: 'Lei Federal 13.021/2014 & RDC 67/2007',
    ativo: true
  },
  {
    id: 'regra-7',
    municipio: 'TODOS OS MUNICÍPIOS',
    tipoEstabelecimento: 'Farmácia Hospitalar',
    tipoExigencia: 'ASSISTENCIA_PLENA',
    horasMinimas: 0,
    descricao: 'Assistência farmacêutica plena ininterrupta no hospital ou clínica.',
    baseLegal: 'Resolução CFF nº 492/2008 & Lei 13.021/2014',
    ativo: true
  }
];

export const INITIAL_CADASTROS_BASICOS: ItemCadastroBasico[] = [
  // TIPOS DE PROFISSIONAL
  { id: 'tp-1', categoria: 'TIPO_PROFISSIONAL', nome: 'Farmacêutico', codigo: 'FARM', descricao: 'Graduado em Farmácia com registro pleno definitivo', ativo: true, ordem: 1 },
  { id: 'tp-2', categoria: 'TIPO_PROFISSIONAL', nome: 'Farmacêutico Bioquímico', codigo: 'BIOQ', descricao: 'Habilitado em Análises Clínicas e Toxicológicas', ativo: true, ordem: 2 },
  { id: 'tp-3', categoria: 'TIPO_PROFISSIONAL', nome: 'Farmacêutico Industrial', codigo: 'IND', descricao: 'Habilitado para Indústria de Fármacos e Cosméticos', ativo: true, ordem: 3 },
  { id: 'tp-4', categoria: 'TIPO_PROFISSIONAL', nome: 'Técnico em Farmácia', codigo: 'TECFARM', descricao: 'Nível Médio Técnico em Farmácia', ativo: true, ordem: 4 },
  { id: 'tp-5', categoria: 'TIPO_PROFISSIONAL', nome: 'Técnico em Análises Clínicas', codigo: 'TECLAB', descricao: 'Nível Médio Técnico em Patologia Clínica', ativo: true, ordem: 5 },
  { id: 'tp-6', categoria: 'TIPO_PROFISSIONAL', nome: 'Não Farmacêutico', codigo: 'NAOFARM', descricao: 'Prático e oficial de farmácia provisionado', ativo: true, ordem: 6 },

  // HABILITAÇÕES & ESPECIALIDADES
  { id: 'hab-1', categoria: 'HABILITACAO', nome: 'Farmácia Comunitária e Dispensação', codigo: 'HAB-01', descricao: 'Atuação em Drogarias e Farmácias de Atendimento Direto', ativo: true, ordem: 1 },
  { id: 'hab-2', categoria: 'HABILITACAO', nome: 'Análises Clínicas e Diagnóstico Laboratorial', codigo: 'HAB-02', descricao: 'Exames laboratoriais, bioquímica clínica e hematologia', ativo: true, ordem: 2 },
  { id: 'hab-3', categoria: 'HABILITACAO', nome: 'Farmácia Hospitalar e Serviços de Saúde', codigo: 'HAB-03', descricao: 'Gestão hospitalar, UTI, farmácia clínica e comissões', ativo: true, ordem: 3 },
  { id: 'hab-4', categoria: 'HABILITACAO', nome: 'Farmácia Magistral (Manipulação)', codigo: 'HAB-04', descricao: 'Manipulação alopática, fitoterápica e homeopática', ativo: true, ordem: 4 },
  { id: 'hab-5', categoria: 'HABILITACAO', nome: 'Farmácia Oncológica e Antineoplásicos', codigo: 'HAB-05', descricao: 'Preparo e manipulação de quimioterápicos', ativo: true, ordem: 5 },
  { id: 'hab-6', categoria: 'HABILITACAO', nome: 'Estética Farmacêutica', codigo: 'HAB-06', descricao: 'Procedimentos estéticos injetáveis e cosmetologia', ativo: true, ordem: 6 },
  { id: 'hab-7', categoria: 'HABILITACAO', nome: 'Acupuntura e Práticas Integrativas', codigo: 'HAB-07', descricao: 'Medicina tradicional e práticas integrativas em saúde', ativo: true, ordem: 7 },
  { id: 'hab-8', categoria: 'HABILITACAO', nome: 'Indústria Farmacêutica e Cosmética', codigo: 'HAB-08', descricao: 'Controle de qualidade e produção industrial farmacêutica', ativo: true, ordem: 8 },

  // SITUAÇÃO CADASTRAL DO PROFISSIONAL
  { id: 'sitp-1', categoria: 'SITUACAO_PROFISSIONAL', nome: 'Definitivo', codigo: 'DEF', descricao: 'Inscrição definitiva ativa regular', ativo: true, ordem: 1 },
  { id: 'sitp-2', categoria: 'SITUACAO_PROFISSIONAL', nome: 'Provisório', codigo: 'PROV', descricao: 'Registro aguardando diploma original ou revalidação', ativo: true, ordem: 2 },
  { id: 'sitp-3', categoria: 'SITUACAO_PROFISSIONAL', nome: 'Secundário', codigo: 'SEC', descricao: 'Registro em outra jurisdição regional atuando no estado', ativo: true, ordem: 3 },
  { id: 'sitp-4', categoria: 'SITUACAO_PROFISSIONAL', nome: 'Transferido', codigo: 'TRANSF', descricao: 'Profissional com transferência para outro CRF', ativo: true, ordem: 4 },
  { id: 'sitp-5', categoria: 'SITUACAO_PROFISSIONAL', nome: 'Licenciado', codigo: 'LIC', descricao: 'Licença temporária de exercício profissional', ativo: true, ordem: 5 },
  { id: 'sitp-6', categoria: 'SITUACAO_PROFISSIONAL', nome: 'Remido', codigo: 'REM', descricao: 'Inscrição remida por tempo de contribuição e idade', ativo: true, ordem: 6 },
  { id: 'sitp-7', categoria: 'SITUACAO_PROFISSIONAL', nome: 'Suspenso', codigo: 'SUSP', descricao: 'Suspensão ética ou administrativa', ativo: true, ordem: 7 },
  { id: 'sitp-8', categoria: 'SITUACAO_PROFISSIONAL', nome: 'Cancelado', codigo: 'CANC', descricao: 'Registro cancelado a pedido ou ex-officio', ativo: true, ordem: 8 },
  { id: 'sitp-9', categoria: 'SITUACAO_PROFISSIONAL', nome: 'Falecido', codigo: 'FALEC', descricao: 'Profissional com certidão de óbito arquivada', ativo: true, ordem: 9 },

  // TIPOS DE EMPRESA (PJ)
  { id: 'te-1', categoria: 'TIPO_EMPRESA', nome: 'Drogaria', codigo: 'DROG', descricao: 'Comércio de medicamentos em suas embalagens originais', ativo: true, ordem: 1 },
  { id: 'te-2', categoria: 'TIPO_EMPRESA', nome: 'Farmácia sem Manipulação', codigo: 'FARM_SEM_MANIP', descricao: 'Farmácia comunitária de dispensação sem manipulação de fórmulas', ativo: true, ordem: 2 },
  { id: 'te-3', categoria: 'TIPO_EMPRESA', nome: 'Farmácia com Manipulação', codigo: 'FARM_MAG', descricao: 'Manipulação de fórmulas magistrais e oficinais', ativo: true, ordem: 3 },
  { id: 'te-4', categoria: 'TIPO_EMPRESA', nome: 'Distribuidora de Produtos para Saúde', codigo: 'DIST_SAUDE', descricao: 'Comércio e distribuição de correlatos e produtos para saúde', ativo: true, ordem: 4 },
  { id: 'te-5', categoria: 'TIPO_EMPRESA', nome: 'Distribuidora de Medicamentos', codigo: 'DIST_MED', descricao: 'Comércio atacadista de medicamentos e correlatos', ativo: true, ordem: 5 },
  { id: 'te-6', categoria: 'TIPO_EMPRESA', nome: 'Farmácia Hospitalar', codigo: 'FARM_HOSP', descricao: 'Dispensação privativa em unidade hospitalar ou clínica', ativo: true, ordem: 6 },
  { id: 'te-7', categoria: 'TIPO_EMPRESA', nome: 'Laboratório de Análises Clínicas', codigo: 'LAB_AC', descricao: 'Realização de exames e análises patológicas', ativo: true, ordem: 7 },
  { id: 'te-8', categoria: 'TIPO_EMPRESA', nome: 'Indústria Farmacêutica', codigo: 'IND_FARM', descricao: 'Fabricação industrial de medicamentos e imunobiológicos', ativo: true, ordem: 8 },
  { id: 'te-9', categoria: 'TIPO_EMPRESA', nome: 'Unidade Básica de Saúde', codigo: 'UBS', descricao: 'Postos de saúde e farmácias públicas municipais/estaduais', ativo: true, ordem: 9 },

  // SITUAÇÕES DE EMPRESA
  { id: 'site-1', categoria: 'SITUACAO_EMPRESA', nome: 'Definitiva', codigo: 'PJ_DEF', descricao: 'Registro cadastral pleno no conselho', ativo: true, ordem: 1 },
  { id: 'site-2', categoria: 'SITUACAO_EMPRESA', nome: 'Provisória', codigo: 'PJ_PROV', descricao: 'Em fase de regularização documental ou vistoria', ativo: true, ordem: 2 },
  { id: 'site-3', categoria: 'SITUACAO_EMPRESA', nome: 'Baixada', codigo: 'PJ_BAIX', descricao: 'Encerramento de atividades comerciais', ativo: true, ordem: 3 },
  { id: 'site-4', categoria: 'SITUACAO_EMPRESA', nome: 'Suspensa', codigo: 'PJ_SUSP', descricao: 'Suspensão cautelar de atividades sanitárias', ativo: true, ordem: 4 },

  // NATUREZA DE ATIVIDADE
  { id: 'nat-1', categoria: 'NATUREZA_ATIVIDADE', nome: 'Dispensação de Medicamentos e Drogarias', codigo: 'NAT-01', descricao: 'Atendimento e dispensação ao público de medicamentos', ativo: true, ordem: 1 },
  { id: 'nat-2', categoria: 'NATUREZA_ATIVIDADE', nome: 'Manipulação Alopática e Homeopática', codigo: 'NAT-02', descricao: 'Manipulação de fórmulas magistrais e oficinais', ativo: true, ordem: 2 },
  { id: 'nat-3', categoria: 'NATUREZA_ATIVIDADE', nome: 'Distribuição e Atacado de Medicamentos', codigo: 'NAT-03', descricao: 'Armazenamento e distribuição atacadista', ativo: true, ordem: 3 },
  { id: 'nat-4', categoria: 'NATUREZA_ATIVIDADE', nome: 'Farmácia Hospitalar e Oncológica', codigo: 'NAT-04', descricao: 'Assistência farmacêutica hospitalar privativa', ativo: true, ordem: 4 },
  { id: 'nat-5', categoria: 'NATUREZA_ATIVIDADE', nome: 'Comércio Varejista de Insumos e Correlatos', codigo: 'NAT-05', descricao: 'Comércio de produtos para saúde e correlatos', ativo: true, ordem: 5 },
  { id: 'nat-6', categoria: 'NATUREZA_ATIVIDADE', nome: 'Indústria de Medicamentos e Cosméticos', codigo: 'NAT-06', descricao: 'Fabricação industrial de insumos e fármacos', ativo: true, ordem: 6 },

  // SITUAÇÃO DO VÍNCULO (RT - EMPRESA)
  { id: 'sv-1', categoria: 'SITUACAO_VINCULO', nome: 'CTPS', codigo: 'VINC_CTPS', descricao: 'Carteira de Trabalho e Previdência Social (CLT)', ativo: true, ordem: 1 },
  { id: 'sv-2', categoria: 'SITUACAO_VINCULO', nome: 'Contrato Social', codigo: 'VINC_SOCIO', descricao: 'Sócio / Proprietário conforme Contrato Social', ativo: true, ordem: 2 },
  { id: 'sv-3', categoria: 'SITUACAO_VINCULO', nome: 'Prestador de Serviços', codigo: 'VINC_PREST', descricao: 'Prestador Autônomo ou Contrato PJ de Prestação de Serviços', ativo: true, ordem: 3 },
  { id: 'sv-4', categoria: 'SITUACAO_VINCULO', nome: 'Estatutário', codigo: 'VINC_ESTAT', descricao: 'Servidor Público Efetivo / Concursado', ativo: true, ordem: 4 },
  { id: 'sv-5', categoria: 'SITUACAO_VINCULO', nome: 'Cargo em Comissão', codigo: 'VINC_COMIS', descricao: 'Cargo comissionado ou designação especial em órgão público', ativo: true, ordem: 5 },
  { id: 'sv-6', categoria: 'SITUACAO_VINCULO', nome: 'Contrato Temporário', codigo: 'VINC_TEMP', descricao: 'Contrato por tempo determinado ou substituição', ativo: true, ordem: 6 },

  // MUNICÍPIOS JURISDICIONADOS
  { id: 'mun-1', categoria: 'MUNICIPIO', nome: 'Manaus', codigo: 'MN-01', descricao: 'Capital do Estado e Polo Central da Jurisdição', ativo: true, ordem: 1 },
  { id: 'mun-2', categoria: 'MUNICIPIO', nome: 'Manacapuru', codigo: 'MN-02', descricao: 'Região Metropolitana - Polo Rio Negro/Solimões', ativo: true, ordem: 2 },
  { id: 'mun-3', categoria: 'MUNICIPIO', nome: 'Parintins', codigo: 'MN-03', descricao: 'Polo Baixo Amazonas', ativo: true, ordem: 3 },
  { id: 'mun-4', categoria: 'MUNICIPIO', nome: 'Itacoatiara', codigo: 'MN-04', descricao: 'Polo Médio Amazonas', ativo: true, ordem: 4 },
  { id: 'mun-5', categoria: 'MUNICIPIO', nome: 'Coari', codigo: 'MN-05', descricao: 'Polo Médio Solimões', ativo: true, ordem: 5 },
  { id: 'mun-6', categoria: 'MUNICIPIO', nome: 'Tefé', codigo: 'MN-06', descricao: 'Polo Alto Solimões e Triângulo Juruá', ativo: true, ordem: 6 },
  { id: 'mun-7', categoria: 'MUNICIPIO', nome: 'Tabatinga', codigo: 'MN-07', descricao: 'Polo Tríplice Fronteira Amazônica', ativo: true, ordem: 7 },
  { id: 'mun-8', categoria: 'MUNICIPIO', nome: 'Maués', codigo: 'MN-08', descricao: 'Região do Baixo Amazonas', ativo: true, ordem: 8 },
  { id: 'mun-9', categoria: 'MUNICIPIO', nome: 'Iranduba', codigo: 'MN-09', descricao: 'Região Metropolitana', ativo: true, ordem: 9 },
  { id: 'mun-10', categoria: 'MUNICIPIO', nome: 'Humaitá', codigo: 'MN-10', descricao: 'Polo Sul do Amazonas', ativo: true, ordem: 10 },
  { id: 'mun-11', categoria: 'MUNICIPIO', nome: 'Presidente Figueiredo', codigo: 'MN-11', descricao: 'Polo Norte da Jurisdição', ativo: true, ordem: 11 },
  { id: 'mun-12', categoria: 'MUNICIPIO', nome: 'São Gabriel da Cachoeira', codigo: 'MN-12', descricao: 'Polo Alto Rio Negro', ativo: true, ordem: 12 },

  // GRUPO PROTOCOLOS: TIPOS DE REQUERIMENTO
  { id: 'req-1', categoria: 'TIPO_REQUERIMENTO_PROTOCOLO', nome: 'Inscrição Definitiva', codigo: 'REQ_INSC_DEF', descricao: 'Requerimento de registro e inscrição definitiva de profissional', ativo: true, ordem: 1 },
  { id: 'req-2', categoria: 'TIPO_REQUERIMENTO_PROTOCOLO', nome: 'Transferência de Jurisdição', codigo: 'REQ_TRANSF', descricao: 'Transferência de inscrição entre Conselhos Regionais (CRF)', ativo: true, ordem: 2 },
  { id: 'req-3', categoria: 'TIPO_REQUERIMENTO_PROTOCOLO', nome: 'Averbação de Habilitação / Especialidade', codigo: 'REQ_AVERB', descricao: 'Averbação de pós-graduação, título de especialista ou nova habilitação', ativo: true, ordem: 3 },
  { id: 'req-4', categoria: 'TIPO_REQUERIMENTO_PROTOCOLO', nome: 'Renovação de Certidão de Regularidade (CRT)', codigo: 'REQ_CRT', descricao: 'Emissão e renovação de Certidão de Regularidade Técnica', ativo: true, ordem: 4 },
  { id: 'req-5', categoria: 'TIPO_REQUERIMENTO_PROTOCOLO', nome: 'Assunção / Baixa de Responsabilidade Técnica (RT)', codigo: 'REQ_RT', descricao: 'Entrada ou saída de farmacêutico como RT / Substituto', ativo: true, ordem: 5 },
  { id: 'req-6', categoria: 'TIPO_REQUERIMENTO_PROTOCOLO', nome: 'Cancelamento de Inscrição Profissional', codigo: 'REQ_CANC', descricao: 'Encerramento voluntário de exercício da profissão', ativo: true, ordem: 6 },
  { id: 'req-7', categoria: 'TIPO_REQUERIMENTO_PROTOCOLO', nome: 'Segunda Via de Carteira / Cédula de Identidade', codigo: 'REQ_2VIA', descricao: 'Emissão de 2ª via por perda, roubo ou danificação', ativo: true, ordem: 7 },
  { id: 'req-8', categoria: 'TIPO_REQUERIMENTO_PROTOCOLO', nome: 'Defesa / Recurso de Fiscalização', codigo: 'REQ_DEF_FISC', descricao: 'Defesa administrativa contra Auto de Notificação ou Auto de Infração', ativo: true, ordem: 8 },

  // GRUPO PROTOCOLOS: SETORES DE TRAMITAÇÃO
  { id: 'set-1', categoria: 'SETOR_PROTOCOLO', nome: 'Secretaria Geral', codigo: 'SET_SEC', descricao: 'Triagem de documentos e recepção inicial de requerimentos', ativo: true, ordem: 1 },
  { id: 'set-2', categoria: 'SETOR_PROTOCOLO', nome: 'Protocolo Central', codigo: 'SET_PROT', descricao: 'Atendimento presencial e recebimento de petições', ativo: true, ordem: 2 },
  { id: 'set-3', categoria: 'SETOR_PROTOCOLO', nome: 'Assessoria Jurídica', codigo: 'SET_JUR', descricao: 'Emissão de pareceres técnicos-jurídicos e instrução', ativo: true, ordem: 3 },
  { id: 'set-4', categoria: 'SETOR_PROTOCOLO', nome: 'Departamento de Fiscalização (DEFIS)', codigo: 'SET_FISC', descricao: 'Análise de vistorias, laudos de inspeção e assunção de RT', ativo: true, ordem: 4 },
  { id: 'set-5', categoria: 'SETOR_PROTOCOLO', nome: 'Setor Financeiro / Cobrança', codigo: 'SET_FIN', descricao: 'Verificação de taxas, quitação de anuidades e parcelamentos', ativo: true, ordem: 5 },
  { id: 'set-6', categoria: 'SETOR_PROTOCOLO', nome: 'Plenário / Diretoria', codigo: 'SET_DIR', descricao: 'Julgamento em sessão plenária e homologação de processos', ativo: true, ordem: 6 },
  { id: 'set-7', categoria: 'SETOR_PROTOCOLO', nome: 'Comissão de Ética Profissional', codigo: 'SET_ETICA', descricao: 'Instrução e julgamento de Processos Ético-Disciplinares (PAD)', ativo: true, ordem: 7 },

  // GRUPO PROTOCOLOS: STATUS DO PROTOCOLO
  { id: 'stat-1', categoria: 'STATUS_PROTOCOLO', nome: 'Em Análise', codigo: 'ST_ANALISE', descricao: 'Processo sob análise documental no setor competente', ativo: true, ordem: 1 },
  { id: 'stat-2', categoria: 'STATUS_PROTOCOLO', nome: 'Aguardando Documentação', codigo: 'ST_AG_DOC', descricao: 'Notificado para juntada de documentos complementares', ativo: true, ordem: 2 },
  { id: 'stat-3', categoria: 'STATUS_PROTOCOLO', nome: 'Em Tramitação', codigo: 'ST_TRAMIT', descricao: 'Encaminhado para parecer técnico ou relatoria', ativo: true, ordem: 3 },
  { id: 'stat-4', categoria: 'STATUS_PROTOCOLO', nome: 'Deferido / Aprovado', codigo: 'ST_APROV', descricao: 'Requerimento julgado e aprovado com sucesso', ativo: true, ordem: 4 },
  { id: 'stat-5', categoria: 'STATUS_PROTOCOLO', nome: 'Indeferido', codigo: 'ST_INDEF', descricao: 'Requerimento negado após fundamentação legal', ativo: true, ordem: 5 },
  { id: 'stat-6', categoria: 'STATUS_PROTOCOLO', nome: 'Concluído / Arquivado', codigo: 'ST_CONCL', descricao: 'Processo finalizado e arquivado definitivamente', ativo: true, ordem: 6 }
];

class StorageService {
  private customProfissionais: Profissional[] = [];
  private empresas: Empresa[] = [];
  private lancamentos: LancamentoFinanceiro[] = [];
  private cobrancas: ProcessoCobranca[] = [];
  private termosFiscalizacao: TermoFiscalizacao[] = [];
  private protocolos: ProtocoloProcesso[] = [];
  private formularios: FormularioDinamico[] = [];
  private respostasForms: RespostaFormulario[] = [];
  private offlineQueue: TermoFiscalizacao[] = [];
  private cadastrosBasicos: ItemCadastroBasico[] = INITIAL_CADASTROS_BASICOS;
  private regrasAssistencia: RegraAssistenciaFarmaceutica[] = INITIAL_REGRAS_ASSISTENCIA;
  private councilConfig: CouncilConfig = DEFAULT_COUNCIL_CONFIG;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSupabaseConnected: boolean = false;
  private isSupabaseSyncing: boolean = false;
  private lastSupabaseStatus: SupabaseHealthCheck | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notify();
        this.syncWithSupabase();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notify();
      });
      setTimeout(() => {
        this.testAndSyncSupabase();
      }, 500);
    }
  }

  private normalizeCadBasicoKey(str: string): string {
    return (str || '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }

  private deduplicateCadastrosBasicos(items: ItemCadastroBasico[]): ItemCadastroBasico[] {
    const seen = new Map<string, ItemCadastroBasico>();
    for (const item of items) {
      if (!item || !item.nome) continue;
      const key = `${item.categoria}::${this.normalizeCadBasicoKey(item.nome)}`;
      if (!seen.has(key)) {
        seen.set(key, item);
      } else {
        const existing = seen.get(key)!;
        // Merge optional fields if the existing item lacked them
        if (!existing.codigo && item.codigo) {
          existing.codigo = item.codigo;
        }
        if (!existing.descricao && item.descricao) {
          existing.descricao = item.descricao;
        }
      }
    }
    return Array.from(seen.values());
  }

  private init() {
    try {
      const savedEmpresas = localStorage.getItem(STORAGE_KEYS.EMPRESAS);
      this.empresas = savedEmpresas ? JSON.parse(savedEmpresas) : INITIAL_EMPRESAS;

      const savedLancamentos = localStorage.getItem(STORAGE_KEYS.LANCAMENTOS);
      this.lancamentos = savedLancamentos ? JSON.parse(savedLancamentos) : INITIAL_LANCAMENTOS;

      const savedCobrancas = localStorage.getItem(STORAGE_KEYS.COBRANCAS);
      this.cobrancas = savedCobrancas ? JSON.parse(savedCobrancas) : INITIAL_COBRANCAS;

      const savedTermos = localStorage.getItem(STORAGE_KEYS.TERMOS_FISCALIZACAO);
      this.termosFiscalizacao = savedTermos ? JSON.parse(savedTermos) : INITIAL_TERMOS_FISCALIZACAO;

      const savedProtocolos = localStorage.getItem(STORAGE_KEYS.PROTOCOLOS);
      this.protocolos = savedProtocolos ? JSON.parse(savedProtocolos) : INITIAL_PROTOCOLOS;

      const savedForms = localStorage.getItem(STORAGE_KEYS.FORMULARIOS);
      this.formularios = savedForms ? JSON.parse(savedForms) : INITIAL_DYNAMIC_FORMS;

      const savedQueue = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      this.offlineQueue = savedQueue ? JSON.parse(savedQueue) : [];

      const savedCadastrosBasicos = localStorage.getItem(STORAGE_KEYS.CADASTROS_BASICOS);
      if (savedCadastrosBasicos) {
        const loaded = JSON.parse(savedCadastrosBasicos) as ItemCadastroBasico[];
        // Ensure new default categories exist even if old list was stored
        const existingKeys = new Set(loaded.map(item => `${item.categoria}::${this.normalizeCadBasicoKey(item.nome)}`));
        const missingDefaults = INITIAL_CADASTROS_BASICOS.filter(
          item => !existingKeys.has(`${item.categoria}::${this.normalizeCadBasicoKey(item.nome)}`)
        );
        this.cadastrosBasicos = this.deduplicateCadastrosBasicos([...loaded, ...missingDefaults]);
      } else {
        this.cadastrosBasicos = this.deduplicateCadastrosBasicos(INITIAL_CADASTROS_BASICOS);
      }
      // Save deduplicated back to storage to ensure clean state
      try {
        localStorage.setItem(STORAGE_KEYS.CADASTROS_BASICOS, JSON.stringify(this.cadastrosBasicos));
      } catch (e) {}

      const savedCouncil = localStorage.getItem(STORAGE_KEYS.COUNCIL_CONFIG);
      if (savedCouncil) {
        const parsed = JSON.parse(savedCouncil);
        this.councilConfig = {
          ...DEFAULT_COUNCIL_CONFIG,
          ...parsed,
          proximoNumeroInscricaoProfissional: parsed.proximoNumeroInscricaoProfissional ?? DEFAULT_COUNCIL_CONFIG.proximoNumeroInscricaoProfissional,
          prefixoInscricaoProfissional: parsed.prefixoInscricaoProfissional ?? DEFAULT_COUNCIL_CONFIG.prefixoInscricaoProfissional,
          sufixoInscricaoProfissional: parsed.sufixoInscricaoProfissional ?? DEFAULT_COUNCIL_CONFIG.sufixoInscricaoProfissional,
          digitosMinimosInscricaoProfissional: parsed.digitosMinimosInscricaoProfissional ?? DEFAULT_COUNCIL_CONFIG.digitosMinimosInscricaoProfissional,
          proximoNumeroInscricaoEmpresa: parsed.proximoNumeroInscricaoEmpresa ?? DEFAULT_COUNCIL_CONFIG.proximoNumeroInscricaoEmpresa,
          prefixoInscricaoEmpresa: parsed.prefixoInscricaoEmpresa ?? DEFAULT_COUNCIL_CONFIG.prefixoInscricaoEmpresa,
          sufixoInscricaoEmpresa: parsed.sufixoInscricaoEmpresa ?? DEFAULT_COUNCIL_CONFIG.sufixoInscricaoEmpresa,
          digitosMinimosInscricaoEmpresa: parsed.digitosMinimosInscricaoEmpresa ?? DEFAULT_COUNCIL_CONFIG.digitosMinimosInscricaoEmpresa,
          validarCPF: parsed.validarCPF ?? DEFAULT_COUNCIL_CONFIG.validarCPF,
          validarCNPJ: parsed.validarCNPJ ?? DEFAULT_COUNCIL_CONFIG.validarCNPJ,
          validarCEP: parsed.validarCEP ?? DEFAULT_COUNCIL_CONFIG.validarCEP,
          autoPreencherEnderecoCEP: parsed.autoPreencherEnderecoCEP ?? DEFAULT_COUNCIL_CONFIG.autoPreencherEnderecoCEP,
          situacoesImpedidasRT: Array.isArray(parsed.situacoesImpedidasRT) ? parsed.situacoesImpedidasRT : DEFAULT_COUNCIL_CONFIG.situacoesImpedidasRT
        };
      }

      const savedRegras = localStorage.getItem(STORAGE_KEYS.REGRAS_ASSISTENCIA);
      if (savedRegras) {
        const loadedRegras = JSON.parse(savedRegras) as RegraAssistenciaFarmaceutica[];
        // Ensure defaults are present
        const existingIds = new Set(loadedRegras.map(r => r.id));
        const missing = INITIAL_REGRAS_ASSISTENCIA.filter(r => !existingIds.has(r.id));
        this.regrasAssistencia = [...loadedRegras, ...missing];
      } else {
        this.regrasAssistencia = INITIAL_REGRAS_ASSISTENCIA;
      }
      try {
        localStorage.setItem(STORAGE_KEYS.REGRAS_ASSISTENCIA, JSON.stringify(this.regrasAssistencia));
      } catch (e) {}

      const savedCustomProf = localStorage.getItem(STORAGE_KEYS.PROFISSIONAIS);
      if (savedCustomProf) {
        const loaded: Profissional[] = JSON.parse(savedCustomProf);
        const map = new Map<string, Profissional>();
        INITIAL_PROFISSIONAIS.forEach(p => map.set(p.id, p));
        loaded.forEach(p => map.set(p.id, p));
        this.customProfissionais = Array.from(map.values());
      } else {
        this.customProfissionais = [...INITIAL_PROFISSIONAIS];
      }

      // Migração automática dos dados atuais de empresas (Situação do Vínculo e Natureza de Atividade)
      this.migrateEmpresaDataToCadastrosBasicos();
    } catch (e) {
      console.warn('Storage fallback to in-memory datasets', e);
      this.empresas = INITIAL_EMPRESAS;
      this.lancamentos = INITIAL_LANCAMENTOS;
      this.cobrancas = INITIAL_COBRANCAS;
      this.termosFiscalizacao = INITIAL_TERMOS_FISCALIZACAO;
      this.protocolos = INITIAL_PROTOCOLOS;
      this.formularios = INITIAL_DYNAMIC_FORMS;
      this.cadastrosBasicos = INITIAL_CADASTROS_BASICOS;
      this.migrateEmpresaDataToCadastrosBasicos();
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // SUPABASE INTEGRATION & HEALTH
  public async testAndSyncSupabase(): Promise<SupabaseHealthCheck> {
    const status = await checkSupabaseConnection();
    this.lastSupabaseStatus = status;
    this.isSupabaseConnected = status.connected;
    if (status.connected && !status.error) {
      this.fetchDataFromSupabase();
    }
    this.notify();
    return status;
  }

  public getSupabaseStatus(): { connected: boolean; status: SupabaseHealthCheck | null; isSyncing: boolean } {
    return {
      connected: this.isSupabaseConnected,
      status: this.lastSupabaseStatus,
      isSyncing: this.isSupabaseSyncing
    };
  }

  public async fetchDataFromSupabase() {
    try {
      this.isSupabaseSyncing = true;
      this.notify();

      // Fetch Cadastros Basicos
      const { data: cbData } = await supabase.from('cadastros_basicos').select('*').order('ordem', { ascending: true });
      if (cbData && cbData.length > 0) {
        this.cadastrosBasicos = cbData.map(c => ({
          id: c.id,
          categoria: c.categoria as CategoriaCadastroBasico,
          nome: c.nome,
          codigo: c.codigo,
          descricao: c.descricao,
          ativo: c.ativo,
          ordem: c.ordem
        }));
        localStorage.setItem(STORAGE_KEYS.CADASTROS_BASICOS, JSON.stringify(this.cadastrosBasicos));
      }

      // Fetch Profissionais
      const { data: profData } = await supabase.from('profissionais').select('*');
      if (profData && profData.length > 0) {
        this.customProfissionais = profData.map(p => ({
          id: p.id,
          inscricao: p.inscricao,
          nome: p.nome,
          cpf: p.cpf,
          rg: p.rg,
          orgaoExpeditor: p.orgao_expeditor,
          dataNascimento: p.data_nascimento,
          sexo: p.sexo,
          nacionalidade: p.nacionalidade,
          naturalidade: p.naturalidade,
          nomeMae: p.nome_mae,
          nomePai: p.nome_pai,
          situacao: p.situacao,
          tipoAssociado: p.tipo_associado,
          habilitacoes: p.habilitacoes || [],
          dataInscricao: p.data_inscricao,
          dataColacaoGrau: p.data_colacao_grau,
          dataExpDiploma: p.data_exp_diploma,
          faculdade: p.faculdade,
          emailComercial: p.email_comercial,
          emailPessoal: p.email_pessoal,
          telefone: p.telefone,
          celular: p.celular,
          endereco: p.endereco,
          complemento: p.complemento,
          bairro: p.bairro,
          cidade: p.cidade,
          uf: p.uf,
          cep: p.cep,
          statusFinanceiro: p.status_financeiro,
          carteiraProfissional: p.carteira_profissional,
          fotoUrl: p.foto_url,
          observacoes: p.observacoes
        }));
        localStorage.setItem(STORAGE_KEYS.PROFISSIONAIS, JSON.stringify(this.customProfissionais));
      }

      // Fetch Empresas
      const { data: empData } = await supabase.from('empresas').select('*');
      if (empData && empData.length > 0) {
        this.empresas = empData.map(e => ({
          id: e.id,
          cnpj: e.cnpj,
          razaoSocial: e.razao_social,
          nomeFantasia: e.nome_fantasia || '',
          inscricao: e.inscricao,
          inscricaoEstadual: e.inscricao_estadual,
          categoria: e.categoria || '',
          tipoEstabelecimento: e.tipo_estabelecimento,
          naturezaAtividade: e.natureza_atividade,
          tipoEmpresa: e.tipo_empresa,
          condicao: e.condicao,
          situacao: e.situacao,
          capitalSocial: Number(e.capital_social) || 0,
          assistenciaPlena: Boolean(e.assistencia_plena),
          dataInscricao: e.data_inscricao,
          validadeCRT: e.validade_crt,
          numeroCRT: e.numero_crt,
          numeroProcesso: e.numero_processo,
          endereco: e.endereco,
          complemento: e.complemento,
          bairro: e.bairro,
          cidade: e.cidade,
          uf: e.uf,
          cep: e.cep,
          rota: e.rota,
          area: e.area,
          telefone: e.telefone,
          email: e.email,
          statusFinanceiro: e.status_financeiro,
          latitude: e.latitude,
          longitude: e.longitude,
          ultimaFiscalizacao: e.ultima_fiscalizacao,
          resultadoUltimaFiscalizacao: e.resultado_ultima_fiscalizacao,
          socios: e.socios || [],
          responsaveisTecnicos: e.responsaveis_tecnicos || []
        }));
        localStorage.setItem(STORAGE_KEYS.EMPRESAS, JSON.stringify(this.empresas));
      }

      // Fetch Lancamentos
      const { data: lancData } = await supabase.from('lancamentos_financeiros').select('*');
      if (lancData && lancData.length > 0) {
        this.lancamentos = lancData.map(l => ({
          id: l.id,
          targetId: l.target_id,
          targetTipo: l.target_tipo,
          targetNome: l.target_nome,
          targetDoc: l.target_doc,
          targetInscricao: l.target_inscricao,
          descricao: l.descricao,
          tipo: l.tipo,
          exercicio: l.exercicio,
          parcela: l.parcela,
          valorOriginal: Number(l.valor_original),
          desconto: Number(l.desconto) || 0,
          jurosMulta: Number(l.juros_multa) || 0,
          valorTotal: Number(l.valor_total),
          dataEmissao: l.data_emissao,
          dataVencimento: l.data_vencimento,
          dataPagamento: l.data_pagamento,
          status: l.status,
          codigoBarras: l.codigo_barras,
          linhaDigitavel: l.linha_digitavel,
          pixCopiaECola: l.pix_copia_e_cola
        }));
        localStorage.setItem(STORAGE_KEYS.LANCAMENTOS, JSON.stringify(this.lancamentos));
      }

      // Fetch Council Config
      const { data: cfgData } = await supabase.from('council_config').select('*').limit(1).maybeSingle();
      if (cfgData) {
        this.councilConfig = {
          ...this.councilConfig,
          sigla: cfgData.sigla || this.councilConfig.sigla,
          nomeCompleto: cfgData.nome_completo || this.councilConfig.nomeCompleto,
          jurisdicao: cfgData.jurisdicao || this.councilConfig.jurisdicao,
          cidadeSede: cfgData.cidade_sede || this.councilConfig.cidadeSede,
          uf: cfgData.uf || this.councilConfig.uf,
          cnpj: cfgData.cnpj || this.councilConfig.cnpj,
          endereco: cfgData.endereco || this.councilConfig.endereco,
          bairro: cfgData.bairro || this.councilConfig.bairro,
          cep: cfgData.cep || this.councilConfig.cep,
          telefone: cfgData.telefone || this.councilConfig.telefone,
          email: cfgData.email || this.councilConfig.email,
          site: cfgData.site || this.councilConfig.site,
          presidente: cfgData.presidente || this.councilConfig.presidente,
          tesoureiro: cfgData.tesoureiro || this.councilConfig.tesoureiro,
          secretarioGeral: cfgData.secretario_geral || this.councilConfig.secretarioGeral,
          resolucaoAnuidade: cfgData.resolucao_anuidade || this.councilConfig.resolucaoAnuidade,
          valorAnuidadePF: Number(cfgData.valor_anuidade_pf) || this.councilConfig.valorAnuidadePF,
          valorAnuidadePJ: Number(cfgData.valor_anuidade_pj) || this.councilConfig.valorAnuidadePJ,
          chavePix: cfgData.chave_pix || this.councilConfig.chavePix,
          totalProfissionaisRegistrados: cfgData.total_profissionais_registrados ?? this.councilConfig.totalProfissionaisRegistrados,
          totalEmpresasRegistradas: cfgData.total_empresas_registradas ?? this.councilConfig.totalEmpresasRegistradas,
          proximoNumeroInscricaoProfissional: cfgData.proximo_numero_inscricao_profissional ?? this.councilConfig.proximoNumeroInscricaoProfissional,
          prefixoInscricaoProfissional: cfgData.prefixo_inscricao_profissional ?? this.councilConfig.prefixoInscricaoProfissional,
          sufixoInscricaoProfissional: cfgData.sufixo_inscricao_profissional ?? this.councilConfig.sufixoInscricaoProfissional,
          digitosMinimosInscricaoProfissional: cfgData.digitos_minimos_inscricao_profissional ?? this.councilConfig.digitosMinimosInscricaoProfissional,
          proximoNumeroInscricaoEmpresa: cfgData.proximo_numero_inscricao_empresa ?? this.councilConfig.proximoNumeroInscricaoEmpresa,
          prefixoInscricaoEmpresa: cfgData.prefixo_inscricao_empresa ?? this.councilConfig.prefixoInscricaoEmpresa,
          sufixoInscricaoEmpresa: cfgData.sufixo_inscricao_empresa ?? this.councilConfig.sufixoInscricaoEmpresa,
          digitosMinimosInscricaoEmpresa: cfgData.digitos_minimos_inscricao_empresa ?? this.councilConfig.digitosMinimosInscricaoEmpresa,
          validarCPF: cfgData.validar_cpf ?? this.councilConfig.validarCPF,
          validarCNPJ: cfgData.validar_cnpj ?? this.councilConfig.validarCNPJ,
          validarCEP: cfgData.validar_cep ?? this.councilConfig.validarCEP,
          autoPreencherEnderecoCEP: cfgData.auto_preencher_endereco_cep ?? this.councilConfig.autoPreencherEnderecoCEP
        };
        localStorage.setItem(STORAGE_KEYS.COUNCIL_CONFIG, JSON.stringify(this.councilConfig));
      }
    } catch (err) {
      console.warn('Supabase fetch failed, continuing with local dataset', err);
    } finally {
      this.isSupabaseSyncing = false;
      this.notify();
    }
  }

  public async migrateAllToSupabase(): Promise<{ success: boolean; message: string; details?: any }> {
    this.isSupabaseSyncing = true;
    this.notify();

    try {
      // 1. Council config
      const cfg = this.councilConfig;
      const { error: cfgErr } = await supabase.from('council_config').upsert({
        id: 'default',
        sigla: cfg.sigla,
        nome_completo: cfg.nomeCompleto,
        jurisdicao: cfg.jurisdicao,
        cidade_sede: cfg.cidadeSede,
        uf: cfg.uf,
        cnpj: cfg.cnpj,
        endereco: cfg.endereco,
        bairro: cfg.bairro,
        cep: cfg.cep,
        telefone: cfg.telefone,
        email: cfg.email,
        site: cfg.site,
        presidente: cfg.presidente,
        tesoureiro: cfg.tesoureiro,
        secretario_geral: cfg.secretarioGeral,
        resolucao_anuidade: cfg.resolucaoAnuidade,
        valor_anuidade_pf: cfg.valorAnuidadePF,
        valor_anuidade_pj: cfg.valorAnuidadePJ,
        chave_pix: cfg.chavePix,
        total_profissionais_registrados: cfg.totalProfissionaisRegistrados,
        total_empresas_registradas: cfg.totalEmpresasRegistradas,
        proximo_numero_inscricao_profissional: cfg.proximoNumeroInscricaoProfissional,
        prefixo_inscricao_profissional: cfg.prefixoInscricaoProfissional,
        sufixo_inscricao_profissional: cfg.sufixoInscricaoProfissional,
        digitos_minimos_inscricao_profissional: cfg.digitosMinimosInscricaoProfissional,
        proximo_numero_inscricao_empresa: cfg.proximoNumeroInscricaoEmpresa,
        prefixo_inscricao_empresa: cfg.prefixoInscricaoEmpresa,
        sufixo_inscricao_empresa: cfg.sufixoInscricaoEmpresa,
        digitos_minimos_inscricao_empresa: cfg.digitosMinimosInscricaoEmpresa,
        validar_cpf: cfg.validarCPF,
        validar_cnpj: cfg.validarCNPJ,
        validar_cep: cfg.validarCEP,
        auto_preencher_endereco_cep: cfg.autoPreencherEnderecoCEP
      });

      if (cfgErr) throw new Error(`Falha ao migrar Council Config: ${cfgErr.message}`);

      // 2. Cadastros Basicos
      const cbRows = this.cadastrosBasicos.map(c => ({
        id: c.id,
        categoria: c.categoria,
        nome: c.nome,
        codigo: c.codigo || null,
        descricao: c.descricao || null,
        ativo: c.ativo,
        ordem: c.ordem || 0
      }));
      if (cbRows.length > 0) {
        const { error: cbErr } = await supabase.from('cadastros_basicos').upsert(cbRows, { onConflict: 'id' });
        if (cbErr) throw new Error(`Falha ao migrar Cadastros Básicos: ${cbErr.message}`);
      }

      // 3. Profissionais
      const allProfs = [...this.customProfissionais, ...INITIAL_PROFISSIONAIS];
      const uniqueProfs = Array.from(new Map(allProfs.map(p => [p.cpf, p])).values());
      const profRows = uniqueProfs.map(p => ({
        id: p.id,
        inscricao: p.inscricao,
        nome: p.nome,
        cpf: p.cpf,
        rg: p.rg || '',
        orgao_expeditor: p.orgaoExpeditor || '',
        data_nascimento: p.dataNascimento || '',
        sexo: p.sexo || 'M',
        nacionalidade: p.nacionalidade || 'BRASILEIRA',
        naturalidade: p.naturalidade || '',
        nome_mae: p.nomeMae || '',
        nome_pai: p.nomePai || null,
        situacao: p.situacao,
        tipo_associado: p.tipoAssociado,
        habilitacoes: p.habilitacoes || [],
        data_inscricao: p.dataInscricao || '',
        data_colacao_grau: p.dataColacaoGrau || '',
        data_exp_diploma: p.dataExpDiploma || '',
        faculdade: p.faculdade || '',
        email_comercial: p.emailComercial || '',
        email_pessoal: p.emailPessoal || '',
        telefone: p.telefone || '',
        celular: p.celular || '',
        endereco: p.endereco || '',
        complemento: p.complemento || null,
        bairro: p.bairro || '',
        cidade: p.cidade || '',
        uf: p.uf || 'AM',
        cep: p.cep || '',
        status_financeiro: p.statusFinanceiro || 'Adimplente',
        carteira_profissional: p.carteiraProfissional || null,
        foto_url: p.fotoUrl || null,
        observacoes: p.observacoes || null
      }));

      if (profRows.length > 0) {
        const { error: pErr } = await supabase.from('profissionais').upsert(profRows, { onConflict: 'cpf' });
        if (pErr) throw new Error(`Falha ao migrar Profissionais: ${pErr.message}`);
      }

      // 4. Empresas
      const empRows = this.empresas.map(e => ({
        id: e.id,
        cnpj: e.cnpj,
        razao_social: e.razaoSocial,
        nome_fantasia: e.nomeFantasia || '',
        inscricao: e.inscricao,
        inscricao_estadual: e.inscricaoEstadual || null,
        categoria: e.categoria || '',
        tipo_estabelecimento: e.tipoEstabelecimento,
        natureza_atividade: e.naturezaAtividade || null,
        tipo_empresa: e.tipoEmpresa || 'Matriz',
        condicao: e.condicao || 'Regular',
        situacao: e.situacao || 'Definitiva',
        capital_social: e.capitalSocial || 0,
        assistencia_plena: e.assistenciaPlena ?? true,
        data_inscricao: e.dataInscricao || '',
        validade_crt: e.validadeCRT || null,
        numero_crt: e.numeroCRT || null,
        numero_processo: e.numeroProcesso || null,
        endereco: e.endereco || '',
        complemento: e.complemento || null,
        bairro: e.bairro || '',
        cidade: e.cidade || '',
        uf: e.uf || 'AM',
        cep: e.cep || '',
        rota: e.rota || null,
        area: e.area || null,
        telefone: e.telefone || '',
        email: e.email || '',
        status_financeiro: e.statusFinanceiro || 'Adimplente',
        latitude: e.latitude || null,
        longitude: e.longitude || null,
        ultima_fiscalizacao: e.ultimaFiscalizacao || null,
        resultado_ultima_fiscalizacao: e.resultadoUltimaFiscalizacao || null,
        socios: e.socios || [],
        responsaveis_tecnicos: e.responsaveisTecnicos || []
      }));

      if (empRows.length > 0) {
        const { error: eErr } = await supabase.from('empresas').upsert(empRows, { onConflict: 'cnpj' });
        if (eErr) throw new Error(`Falha ao migrar Empresas: ${eErr.message}`);
      }

      // 5. Lancamentos Financeiros
      const lancRows = this.lancamentos.map(l => ({
        id: l.id,
        target_id: l.targetId,
        target_tipo: l.targetTipo,
        target_nome: l.targetNome,
        target_doc: l.targetDoc,
        target_inscricao: l.targetInscricao,
        descricao: l.descricao,
        tipo: l.tipo,
        exercicio: l.exercicio,
        parcela: l.parcela || null,
        valor_original: l.valorOriginal,
        desconto: l.desconto || 0,
        juros_multa: l.jurosMulta || 0,
        valor_total: l.valorTotal,
        data_emissao: l.dataEmissao,
        data_vencimento: l.dataVencimento,
        data_pagamento: l.dataPagamento || null,
        status: l.status,
        codigo_barras: l.codigoBarras || null,
        linha_digitavel: l.linhaDigitavel || null,
        pix_copia_e_cola: l.pixCopiaECola || null
      }));

      if (lancRows.length > 0) {
        const { error: lErr } = await supabase.from('lancamentos_financeiros').upsert(lancRows, { onConflict: 'id' });
        if (lErr) throw new Error(`Falha ao migrar Lançamentos: ${lErr.message}`);
      }

      // 6. Termos Fiscalização
      const termoRows = this.termosFiscalizacao.map(t => ({
        id: t.id,
        numero_termo: t.numeroTermo,
        numero_auto_infracao: t.numeroAutoInfracao || null,
        tipo_termo: t.tipoTermo || null,
        tipo_visita: t.tipoVisita || null,
        empresa_id: t.empresaId,
        empresa_inscricao: t.empresaInscricao || null,
        empresa_razao_social: t.empresaRazaoSocial || null,
        empresa_nome: t.empresaNome || null,
        empresa_cnpj: t.empresaCnpj || null,
        cnpj: t.cnpj || null,
        endereco: t.endereco || null,
        bairro: t.bairro || null,
        cidade: t.cidade || null,
        data_fiscalizacao: t.dataFiscalizacao || null,
        hora_fiscalizacao: t.horaFiscalizacao || null,
        data_hora: t.dataHora || null,
        fiscal_id: t.fiscalId || null,
        fiscal_nome: t.fiscalNome || null,
        fiscal_matricula: t.fiscalMatricula || null,
        matricula_fiscal: t.matriculaFiscal || null,
        fiscal_assinante_nome: t.fiscalAssinanteNome || null,
        fiscal_assinante_matricula: t.fiscalAssinanteMatricula || null,
        latitude: t.latitude || null,
        longitude: t.longitude || null,
        endereco_geo: t.enderecoGeo || null,
        presenca_rt: t.presencaRT ?? t.rtPresente ?? false,
        rt_presente: t.rtPresente ?? t.presencaRT ?? false,
        rt_nome_presente: t.rtNomePresente || t.rtPresenteNome || null,
        rt_presente_nome: t.rtPresenteNome || t.rtNomePresente || null,
        rt_crf_presente: t.rtCrfPresente || t.rtPresenteInscricao || null,
        rt_presente_inscricao: t.rtPresenteInscricao || t.rtCrfPresente || null,
        motivo_ausencia_rt: t.motivoAusenciaRT || null,
        documentos_verificados: t.documentosVerificados || {},
        relato_fiscal: t.relatoFiscal || null,
        irregularidades_constatadas: t.irregularidadesConstatadas || [],
        infracoes_identificadas: t.infracoesIdentificadas || [],
        artigos_incorridos: t.artigosIncorridos || [],
        auto_infracao_gerado: t.autoInfracaoGerado || false,
        valor_multa_previsto: t.valorMultaPrevisto || 0,
        orientacoes_fiscais: t.orientacoesFiscais || null,
        observacoes_notificado: t.observacoesNotificado || null,
        prazo_regularizacao_dias: t.prazoRegularizacaoDias || null,
        notificacao_prazo_dias: t.notificacaoPrazoDias || null,
        status: t.status || 'Concluído e Assinado',
        status_sincronizacao: 'Sincronizado',
        assinatura_fiscal: t.assinaturaFiscal || null,
        assinatura_fiscal_data_hora: t.assinaturaFiscalDataHora || null,
        assinatura_responsavel: t.assinaturaResponsavel || null,
        assinatura_notificado: t.assinaturaNotificado || null,
        assinatura_notificado_data_hora: t.assinaturaNotificadoDataHora || null,
        recusa_assinatura: t.recusaAssinatura || false,
        motivo_recusa: t.motivoRecusa || null,
        tipo_signatario_notificado: t.tipoSignatarioNotificado || null,
        nome_signatario_notificado: t.nomeSignatarioNotificado || null,
        documento_signatario_notificado: t.documentoSignatarioNotificado || null,
        inscricao_signatario_notificado: t.inscricaoSignatarioNotificado || null,
        cargo_signatario_notificado: t.cargoSignatarioNotificado || null,
        motivo_assinatura_terceiro: t.motivoAssinaturaTerceiro || null,
        hash_validacao_digital: t.hashValidacaoDigital || null,
        fotos_comprovantes: t.fotosComprovantes || [],
        foto_evidencias: t.fotoEvidencias || [],
        sincronizado: true
      }));

      if (termoRows.length > 0) {
        const { error: tErr } = await supabase.from('termos_fiscalizacao').upsert(termoRows, { onConflict: 'id' });
        if (tErr) throw new Error(`Falha ao migrar Fiscalização: ${tErr.message}`);
      }

      this.isSupabaseConnected = true;
      this.lastSupabaseStatus = { connected: true };
      return {
        success: true,
        message: 'Todos os registros foram migrados e sincronizados com sucesso no Supabase!'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Erro durante a sincronização com o Supabase'
      };
    } finally {
      this.isSupabaseSyncing = false;
      this.notify();
    }
  }

  public async syncWithSupabase() {
    if (this.isOnline && this.isSupabaseConnected) {
      await this.fetchDataFromSupabase();
    }
  }

  public getNetworkStatus() {
    return {
      isOnline: this.isOnline,
      queueSize: this.offlineQueue.length,
      isSupabaseConnected: this.isSupabaseConnected
    };
  }

  public setSimulatedOffline(offline: boolean) {
    this.isOnline = !offline;
    this.notify();
  }

  public getCouncilConfig(): CouncilConfig {
    return { ...this.councilConfig };
  }

  public updateCouncilConfig(cfg: Partial<CouncilConfig>) {
    this.councilConfig = { ...this.councilConfig, ...cfg };
    try {
      localStorage.setItem(STORAGE_KEYS.COUNCIL_CONFIG, JSON.stringify(this.councilConfig));
      if (this.isOnline) {
        runBackgroundSupabase(
          supabase.from('council_config').upsert({
            id: 'default',
            sigla: this.councilConfig.sigla,
            nome_completo: this.councilConfig.nomeCompleto,
            jurisdicao: this.councilConfig.jurisdicao,
            cidade_sede: this.councilConfig.cidadeSede,
            uf: this.councilConfig.uf,
            cnpj: this.councilConfig.cnpj,
            endereco: this.councilConfig.endereco,
            bairro: this.councilConfig.bairro,
            cep: this.councilConfig.cep,
            telefone: this.councilConfig.telefone,
            email: this.councilConfig.email,
            site: this.councilConfig.site,
            presidente: this.councilConfig.presidente,
            tesoureiro: this.councilConfig.tesoureiro,
            secretario_geral: this.councilConfig.secretarioGeral,
            resolucao_anuidade: this.councilConfig.resolucaoAnuidade,
            valor_anuidade_pf: this.councilConfig.valorAnuidadePF,
            valor_anuidade_pj: this.councilConfig.valorAnuidadePJ,
            chave_pix: this.councilConfig.chavePix,
            total_profissionais_registrados: this.councilConfig.totalProfissionaisRegistrados,
            total_empresas_registradas: this.councilConfig.totalEmpresasRegistradas,
            proximo_numero_inscricao_profissional: this.councilConfig.proximoNumeroInscricaoProfissional,
            prefixo_inscricao_profissional: this.councilConfig.prefixoInscricaoProfissional,
            sufixo_inscricao_profissional: this.councilConfig.sufixoInscricaoProfissional,
            digitos_minimos_inscricao_profissional: this.councilConfig.digitosMinimosInscricaoProfissional,
            proximo_numero_inscricao_empresa: this.councilConfig.proximoNumeroInscricaoEmpresa,
            prefixo_inscricao_empresa: this.councilConfig.prefixoInscricaoEmpresa,
            sufixo_inscricao_empresa: this.councilConfig.sufixoInscricaoEmpresa,
            digitos_minimos_inscricao_empresa: this.councilConfig.digitosMinimosInscricaoEmpresa,
            validar_cpf: this.councilConfig.validarCPF,
            validar_cnpj: this.councilConfig.validarCNPJ,
            validar_cep: this.councilConfig.validarCEP,
            auto_preencher_endereco_cep: this.councilConfig.autoPreencherEnderecoCEP
          })
        );
      }
    } catch (e) {}
    this.notify();
  }

  // REGRAS DE IMPEDIMENTO DE RESPONSABILIDADE TÉCNICA (ART / RT)
  public getSituacoesImpedidasRT(): string[] {
    return this.councilConfig.situacoesImpedidasRT || DEFAULT_COUNCIL_CONFIG.situacoesImpedidasRT || [];
  }

  public setSituacoesImpedidasRT(situacoes: string[]) {
    const updated: CouncilConfig = {
      ...this.councilConfig,
      situacoesImpedidasRT: situacoes
    };
    this.updateCouncilConfig(updated);
  }

  public isProfissionalImpedidoRT(profissionalOuSituacao: Partial<Profissional> | string | undefined | null): {
    impedido: boolean;
    situacao?: string;
    motivo?: string;
    baseLegal?: string;
  } {
    if (!profissionalOuSituacao) {
      return { impedido: false };
    }

    let situacaoStr = '';
    if (typeof profissionalOuSituacao === 'string') {
      situacaoStr = profissionalOuSituacao.trim();
    } else if (profissionalOuSituacao.situacao) {
      situacaoStr = profissionalOuSituacao.situacao.trim();
    }

    if (!situacaoStr) {
      return { impedido: false };
    }

    const impedidas = this.getSituacoesImpedidasRT();
    const isImpedida = impedidas.some(
      item => item.trim().toLowerCase() === situacaoStr.toLowerCase()
    );

    if (isImpedida) {
      return {
        impedido: true,
        situacao: situacaoStr,
        motivo: `O profissional está na situação "${situacaoStr}", configurada no CRF como impeditiva para Anotação de Responsabilidade Técnica (ART).`,
        baseLegal: 'Art. 24 da Lei Federal nº 3.820/60 c/c Lei Federal nº 13.021/14 e Normativas do CFF'
      };
    }

    return { impedido: false, situacao: situacaoStr };
  }

  // MIGRAÇÃO DE DADOS DE EMPRESAS PARA CADASTROS BÁSICOS (SITUAÇÃO DO VÍNCULO E NATUREZA DE ATIVIDADE)
  public migrateEmpresaDataToCadastrosBasicos(): { migratedVinculos: number; migratedNaturezas: number } {
    let countVinculos = 0;
    let countNaturezas = 0;
    const currentList = [...this.cadastrosBasicos];
    const existingKeys = new Set(
      currentList.map(item => `${item.categoria}::${this.normalizeCadBasicoKey(item.nome)}`)
    );

    // Varrer todas as empresas (persistidas e modelo inicial)
    const allEmpresas = [...this.empresas, ...INITIAL_EMPRESAS];

    allEmpresas.forEach(empresa => {
      // 1. Migração de Situações do Vínculo de RT
      if (empresa.responsaveisTecnicos && Array.isArray(empresa.responsaveisTecnicos)) {
        empresa.responsaveisTecnicos.forEach(rt => {
          if (rt.situacaoVinculo && typeof rt.situacaoVinculo === 'string' && rt.situacaoVinculo.trim()) {
            const raw = rt.situacaoVinculo.trim();
            const key = `SITUACAO_VINCULO::${this.normalizeCadBasicoKey(raw)}`;
            if (!existingKeys.has(key)) {
              existingKeys.add(key);
              const order = currentList.filter(i => i.categoria === 'SITUACAO_VINCULO').length + 1;
              currentList.push({
                id: `sv-mig-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                categoria: 'SITUACAO_VINCULO',
                nome: raw,
                codigo: `VINC_${raw.slice(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
                descricao: `Migrado automaticamente do vínculo de RT da empresa (${empresa.nomeFantasia || empresa.razaoSocial})`,
                ativo: true,
                ordem: order
              });
              countVinculos++;
            }
          }
        });
      }

      // 2. Migração de Naturezas de Atividade
      if (empresa.naturezaAtividade && typeof empresa.naturezaAtividade === 'string' && empresa.naturezaAtividade.trim()) {
        const rawNat = empresa.naturezaAtividade.trim();
        const key = `NATUREZA_ATIVIDADE::${this.normalizeCadBasicoKey(rawNat)}`;
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          const order = currentList.filter(i => i.categoria === 'NATUREZA_ATIVIDADE').length + 1;
          currentList.push({
            id: `nat-mig-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            categoria: 'NATUREZA_ATIVIDADE',
            nome: rawNat,
            codigo: `NAT_${rawNat.slice(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
            descricao: `Migrado automaticamente do cadastro da empresa (${empresa.nomeFantasia || empresa.razaoSocial})`,
            ativo: true,
            ordem: order
          });
          countNaturezas++;
        }
      }
    });

    if (countVinculos > 0 || countNaturezas > 0) {
      this.cadastrosBasicos = this.deduplicateCadastrosBasicos(currentList);
      try {
        localStorage.setItem(STORAGE_KEYS.CADASTROS_BASICOS, JSON.stringify(this.cadastrosBasicos));
      } catch (err) {
        console.warn('Erro ao persistir cadastros básicos migrados:', err);
      }
      this.notify();
    }

    return { migratedVinculos: countVinculos, migratedNaturezas: countNaturezas };
  }

  // CADASTROS BÁSICOS CRUD COM PREVENÇÃO DE DUPLICIDADE & DEPENDÊNCIAS
  public getCadastrosBasicos(categoria?: CategoriaCadastroBasico): ItemCadastroBasico[] {
    if (categoria) {
      return this.cadastrosBasicos.filter(i => i.categoria === categoria);
    }
    return [...this.cadastrosBasicos];
  }

  public checkCadastroBasicoDuplicity(categoria: CategoriaCadastroBasico, nome: string, excludeId?: string): boolean {
    const targetKey = this.normalizeCadBasicoKey(nome);
    return this.cadastrosBasicos.some(item => 
      item.categoria === categoria && 
      this.normalizeCadBasicoKey(item.nome) === targetKey && 
      item.id !== excludeId
    );
  }

  public saveCadastroBasico(item: ItemCadastroBasico): { success: boolean; message?: string } {
    const sanitized = sanitizeToUpper(item, ['id']);
    const targetKey = this.normalizeCadBasicoKey(sanitized.nome);

    // Verificação de segurança anti-duplicidade
    const duplicate = this.cadastrosBasicos.find(i => 
      i.categoria === sanitized.categoria && 
      this.normalizeCadBasicoKey(i.nome) === targetKey && 
      i.id !== sanitized.id
    );

    if (duplicate) {
      return { 
        success: false, 
        message: `Já existe um registro cadastrado com o nome "${sanitized.nome}" nesta mesma categoria.` 
      };
    }

    const idx = this.cadastrosBasicos.findIndex(i => i.id === sanitized.id);
    if (idx >= 0) {
      this.cadastrosBasicos[idx] = sanitized;
    } else {
      this.cadastrosBasicos.push(sanitized);
    }

    this.cadastrosBasicos = this.deduplicateCadastrosBasicos(this.cadastrosBasicos);

    try {
      localStorage.setItem(STORAGE_KEYS.CADASTROS_BASICOS, JSON.stringify(this.cadastrosBasicos));
      if (this.isOnline) {
        runBackgroundSupabase(
          supabase.from('cadastros_basicos').upsert({
            id: sanitized.id,
            categoria: sanitized.categoria,
            nome: sanitized.nome,
            codigo: sanitized.codigo || null,
            descricao: sanitized.descricao || null,
            ativo: sanitized.ativo,
            ordem: sanitized.ordem || 0
          })
        );
      }
    } catch (e) {}
    this.notify();
    return { success: true };
  }

  public canDeleteCadastroBasico(id: string): { canDelete: boolean; count: number; reason?: string } {
    const item = this.cadastrosBasicos.find(i => i.id === id);
    if (!item) return { canDelete: true, count: 0 };

    let count = 0;
    const itemName = item.nome.toUpperCase();

    const profMap = new Map<string, Profissional>();
    INITIAL_PROFISSIONAIS.forEach(p => profMap.set(p.id, p));
    this.customProfissionais.forEach(p => profMap.set(p.id, p));
    const allProfs = Array.from(profMap.values());

    if (item.categoria === 'TIPO_PROFISSIONAL') {
      const pCount = allProfs.filter(p => p.tipoAssociado?.toUpperCase() === itemName).length;
      count += pCount;
      if (count > 0) return { canDelete: false, count, reason: `Existem ${count} profissionais cadastrados com este Tipo.` };
    }

    if (item.categoria === 'HABILITACAO') {
      const pCount = allProfs.filter(p => p.habilitacoes?.some(h => h.toUpperCase() === itemName)).length;
      count += pCount;
      if (count > 0) return { canDelete: false, count, reason: `Existem ${count} profissionais com esta Habilitação averbada.` };
    }

    if (item.categoria === 'SITUACAO_PROFISSIONAL') {
      const pCount = allProfs.filter(p => p.situacao?.toUpperCase() === itemName).length;
      count += pCount;
      if (count > 0) return { canDelete: false, count, reason: `Existem ${count} profissionais com esta Situação Cadastral.` };
    }

    if (item.categoria === 'TIPO_EMPRESA') {
      const eCount = this.empresas.filter(e => e.tipoEstabelecimento?.toUpperCase() === itemName).length;
      count += eCount;
      if (count > 0) return { canDelete: false, count, reason: `Existem ${count} empresas com este Ramo/Tipo de Estabelecimento.` };
    }

    if (item.categoria === 'SITUACAO_EMPRESA') {
      const eCount = this.empresas.filter(e => e.situacao?.toUpperCase() === itemName).length;
      count += eCount;
      if (count > 0) return { canDelete: false, count, reason: `Existem ${count} empresas com esta Situação de Firma.` };
    }

    if (item.categoria === 'TIPO_REQUERIMENTO_PROTOCOLO') {
      const pCount = this.protocolos.filter(p => p.tipo?.toUpperCase() === itemName).length;
      count += pCount;
      if (count > 0) return { canDelete: false, count, reason: `Existem ${count} protocolos/processos cadastrados com este Tipo de Requerimento.` };
    }

    if (item.categoria === 'SETOR_PROTOCOLO') {
      const pCount = this.protocolos.filter(p => p.setorAtual?.toUpperCase() === itemName).length;
      count += pCount;
      if (count > 0) return { canDelete: false, count, reason: `Existem ${count} protocolos em tramitação neste Setor.` };
    }

    if (item.categoria === 'STATUS_PROTOCOLO') {
      const pCount = this.protocolos.filter(p => p.status?.toUpperCase() === itemName).length;
      count += pCount;
      if (count > 0) return { canDelete: false, count, reason: `Existem ${count} protocolos com este Status.` };
    }

    if (item.categoria === 'MUNICIPIO') {
      const eCount = this.empresas.filter(e => (e.cidade || '').toUpperCase() === itemName).length;
      count += eCount;
      if (count > 0) return { canDelete: false, count, reason: `Existem ${count} empresas cadastradas no município de ${item.nome}.` };
    }

    return { canDelete: true, count: 0 };
  }

  public deleteCadastroBasico(id: string): { success: boolean; message?: string } {
    const check = this.canDeleteCadastroBasico(id);
    if (!check.canDelete) {
      return { success: false, message: check.reason };
    }

    this.cadastrosBasicos = this.cadastrosBasicos.filter(i => i.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.CADASTROS_BASICOS, JSON.stringify(this.cadastrosBasicos));
      if (this.isOnline) {
        runBackgroundSupabase(
          supabase.from('cadastros_basicos').delete().eq('id', id)
        );
      }
    } catch (e) {}
    this.notify();
    return { success: true };
  }

  // MÓDULO DE ASSISTÊNCIA FARMACÊUTICA: REGRAS E AVALIAÇÃO
  public getRegrasAssistencia(): RegraAssistenciaFarmaceutica[] {
    return [...this.regrasAssistencia];
  }

  public saveRegraAssistencia(regra: RegraAssistenciaFarmaceutica) {
    const sanitized: RegraAssistenciaFarmaceutica = {
      ...regra,
      municipio: (regra.municipio || '').trim().toUpperCase(),
      tipoEstabelecimento: (regra.tipoEstabelecimento || '').trim(),
      descricao: regra.descricao?.trim(),
      baseLegal: regra.baseLegal?.trim()
    };

    const idx = this.regrasAssistencia.findIndex(r => r.id === sanitized.id);
    if (idx >= 0) {
      this.regrasAssistencia[idx] = sanitized;
    } else {
      this.regrasAssistencia.unshift(sanitized);
    }

    try {
      localStorage.setItem(STORAGE_KEYS.REGRAS_ASSISTENCIA, JSON.stringify(this.regrasAssistencia));
    } catch (e) {}
    this.notify();
  }

  public deleteRegraAssistencia(id: string) {
    this.regrasAssistencia = this.regrasAssistencia.filter(r => r.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.REGRAS_ASSISTENCIA, JSON.stringify(this.regrasAssistencia));
    } catch (e) {}
    this.notify();
  }

  public resetRegrasAssistencia() {
    this.regrasAssistencia = INITIAL_REGRAS_ASSISTENCIA;
    try {
      localStorage.setItem(STORAGE_KEYS.REGRAS_ASSISTENCIA, JSON.stringify(this.regrasAssistencia));
    } catch (e) {}
    this.notify();
  }

  public avaliarRegularidadeAssistencia(empresa: Partial<Empresa>): {
    condicao: CondicaoFirma;
    regraAplicada: RegraAssistenciaFarmaceutica | null;
    horasFuncionamentoSemanais: number;
    horasAssistenciaSemanais: number;
    justificativa: string;
  } {
    const cidade = (empresa.cidade || '').trim().toUpperCase();
    const tipoEstabelecimento = (empresa.tipoEstabelecimento || '').trim().toUpperCase();
    
    // 1. Horários de Funcionamento da Empresa
    const horariosFunc = empresa.horariosFuncionamento && empresa.horariosFuncionamento.length > 0 
      ? empresa.horariosFuncionamento 
      : DEFAULT_HORARIOS_FUNCIONAMENTO;
    
    let horasFuncSemanais = 0;
    horariosFunc.forEach(h => {
      if (h.ativo !== false) {
        const h1 = calculateIntervalHours(h.inicio1, h.fim1);
        const h2 = calculateIntervalHours(h.inicio2, h.fim2);
        horasFuncSemanais += (h1 + h2);
      }
    });
    horasFuncSemanais = Number(horasFuncSemanais.toFixed(2));

    // 2. Horários de Assistência Farmacêutica por RTs vinculados
    let horasAssistSemanais = 0;
    if (empresa.responsaveisTecnicos && empresa.responsaveisTecnicos.length > 0) {
      empresa.responsaveisTecnicos.forEach(rt => {
        if (rt.horarios && rt.horarios.length > 0) {
          horasAssistSemanais += calculateRtWeeklyHours(rt.horarios);
        } else {
          horasAssistSemanais += (rt.cargaHorariaSemanal || 0);
        }
      });
    } else if (empresa.horariosAssistencia && empresa.horariosAssistencia.length > 0) {
      empresa.horariosAssistencia.forEach(h => {
        if (h.ativo !== false) {
          const h1 = calculateIntervalHours(h.inicio1, h.fim1);
          const h2 = calculateIntervalHours(h.inicio2, h.fim2);
          horasAssistSemanais += (h1 + h2);
        }
      });
    }
    horasAssistSemanais = Number(horasAssistSemanais.toFixed(2));

    // Ausência total de RT
    if (!empresa.responsaveisTecnicos || empresa.responsaveisTecnicos.length === 0) {
      return {
        condicao: 'Irregular',
        regraAplicada: null,
        horasFuncionamentoSemanais: horasFuncSemanais,
        horasAssistenciaSemanais: 0,
        justificativa: `ESTABELECIMENTO IRREGULAR: Não há nenhum Farmacêutico Responsável Técnico (RT) vinculado ao estabelecimento perante o CRF. É obrigatória a vinculação de farmacêutico com ART ativa (Lei 13.021/2014, Art. 5º e 6º).`
      };
    }

    // Verificação de impedimento dos RTs vinculados
    const profsMap = new Map<string, Profissional>(this.getProfissionais().map((p: Profissional) => [p.id, p]));
    const impededRts = empresa.responsaveisTecnicos.filter(rt => {
      const prof = profsMap.get(rt.profissionalId);
      return prof ? this.isProfissionalImpedidoRT(prof).impedido : false;
    });

    if (impededRts.length > 0 && impededRts.length === empresa.responsaveisTecnicos.length) {
      const rtsNames = impededRts.map(rt => {
        const profObj = profsMap.get(rt.profissionalId);
        const sit = profObj?.situacao || 'Impedido';
        return `${rt.profissionalNome} (${sit})`;
      }).join(', ');
      return {
        condicao: 'Irregular',
        regraAplicada: null,
        horasFuncionamentoSemanais: horasFuncSemanais,
        horasAssistenciaSemanais: 0,
        justificativa: `ESTABELECIMENTO IRREGULAR: Todos os Responsáveis Técnicos cadastrados encontram-se em situação impeditiva perante o CRF (${rtsNames}). É necessária a assunção de novo farmacêutico regular.`
      };
    }

    const normalizeDay = (d: string) => {
      if (!d) return '';
      return d.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .slice(0, 3);
    };

    // Função auxiliar para obter a assistência farmacêutica total prestada em um dia específico estritamente pelos RTs vinculados
    const getDiaAssistenciaTotal = (diaNome: string): number => {
      let total = 0;
      const targetNorm = normalizeDay(diaNome);
      if (empresa.responsaveisTecnicos && empresa.responsaveisTecnicos.length > 0) {
        empresa.responsaveisTecnicos.forEach(rt => {
          if (rt.horarios && rt.horarios.length > 0) {
            const h = rt.horarios.find(item => normalizeDay(item.dia) === targetNorm);
            if (h && h.ativo !== false) {
              total += calculateIntervalHours(h.inicio1, h.fim1) + calculateIntervalHours(h.inicio2, h.fim2);
            }
          }
        });
      }
      return Number(total.toFixed(2));
    };

    // 3. Localização da regra aplicável por Município e Tipo de Estabelecimento
    const normCidade = this.normalizeCadBasicoKey(cidade);
    const normTipo = this.normalizeCadBasicoKey(tipoEstabelecimento);

    let regra = this.regrasAssistencia.find(r => 
      r.ativo && 
      this.normalizeCadBasicoKey(r.municipio) === normCidade && 
      this.normalizeCadBasicoKey(r.tipoEstabelecimento) === normTipo
    );

    // Tentativa parcial / sinônimos
    if (!regra) {
      regra = this.regrasAssistencia.find(r => 
        r.ativo && 
        this.normalizeCadBasicoKey(r.municipio) === normCidade && 
        (normTipo.includes(this.normalizeCadBasicoKey(r.tipoEstabelecimento)) || this.normalizeCadBasicoKey(r.tipoEstabelecimento).includes(normTipo))
      );
    }

    // Tentativa regra coringa 'TODOS' para o tipo
    if (!regra) {
      regra = this.regrasAssistencia.find(r => 
        r.ativo && 
        (r.municipio.toUpperCase().includes('TODOS') || r.municipio === '*') && 
        (this.normalizeCadBasicoKey(r.tipoEstabelecimento) === normTipo || normTipo.includes(this.normalizeCadBasicoKey(r.tipoEstabelecimento)))
      );
    }

    // Fallback padrão se não houver regra específica cadastrada
    if (!regra) {
      const isMagistralOuHosp = normTipo.includes('MANIPULAC') || normTipo.includes('HOSPITAL');
      regra = {
        id: 'regra-fallback',
        municipio: empresa.cidade || 'Jurisdição Geral',
        tipoEstabelecimento: empresa.tipoEstabelecimento || 'Estabelecimento Geral',
        tipoExigencia: isMagistralOuHosp ? 'ASSISTENCIA_PLENA' : 'HORAS_DIARIAS',
        horasMinimas: isMagistralOuHosp ? 0 : 5,
        descricao: isMagistralOuHosp ? 'Assistência Plena' : 'Mínimo de 5h/dia',
        baseLegal: 'Lei Federal nº 13.021/2014 & Normas CFF',
        ativo: true
      };
    }

    // 4. Avaliação das Condições conforme Regra (Intervalo a Intervalo / Dia a Dia)
    const diasInconformes: string[] = [];
    let diasSemNenhumaAssistência = 0;

    if (regra.tipoExigencia === 'SEM_HORA_DEFINIDA') {
      if (empresa.responsaveisTecnicos && empresa.responsaveisTecnicos.length > 0) {
        return {
          condicao: 'Regular',
          regraAplicada: regra,
          horasFuncionamentoSemanais: horasFuncSemanais,
          horasAssistenciaSemanais: horasAssistSemanais,
          justificativa: `REGULAR: Estabelecimento regular na modalidade Sem Hora Definida. Possui Responsável Técnico vinculado (${empresa.responsaveisTecnicos.map(r => r.profissionalNome).join(', ')}). [Base Legal: ${regra.baseLegal || 'Resolução CRF'}]`
        };
      } else {
        return {
          condicao: 'Irregular',
          regraAplicada: regra,
          horasFuncionamentoSemanais: horasFuncSemanais,
          horasAssistenciaSemanais: horasAssistSemanais,
          justificativa: `IRREGULAR: Modalidade requer RT vinculado, porém o estabelecimento não possui nenhum Farmacêutico Responsável Técnico. [Base Legal: ${regra.baseLegal || 'Resolução CRF'}]`
        };
      }
    }

    horariosFunc.forEach(hf => {
      if (hf.ativo !== false) {
        const hFuncDay = calculateIntervalHours(hf.inicio1, hf.fim1) + calculateIntervalHours(hf.inicio2, hf.fim2);
        if (hFuncDay > 0) {
          // Operating intervals for this day
          const opIntervals: [number, number][] = [];
          if (hf.inicio1 && hf.fim1) {
            const [h1, m1] = hf.inicio1.split(':').map(Number);
            const [h2, m2] = hf.fim1.split(':').map(Number);
            opIntervals.push([h1 * 60 + m1, h2 * 60 + m2]);
          }
          if (hf.inicio2 && hf.fim2) {
            const [h1, m1] = hf.inicio2.split(':').map(Number);
            const [h2, m2] = hf.fim2.split(':').map(Number);
            opIntervals.push([h1 * 60 + m1, h2 * 60 + m2]);
          }

          // RT intervals on this day across all RTs
          const targetNorm = normalizeDay(hf.dia);
          const rtIntervals: [number, number][] = [];
          (empresa.responsaveisTecnicos || []).forEach(rt => {
            (rt.horarios || []).forEach(rth => {
              if (normalizeDay(rth.dia) === targetNorm) {
                if (rth.inicio1 && rth.fim1) {
                  const [h1, m1] = rth.inicio1.split(':').map(Number);
                  const [h2, m2] = rth.fim1.split(':').map(Number);
                  rtIntervals.push([h1 * 60 + m1, h2 * 60 + m2]);
                }
                if (rth.inicio2 && rth.fim2) {
                  const [h1, m1] = rth.inicio2.split(':').map(Number);
                  const [h2, m2] = rth.fim2.split(':').map(Number);
                  rtIntervals.push([h1 * 60 + m1, h2 * 60 + m2]);
                }
              }
            });
          });

          // Merge overlapping RT intervals
          rtIntervals.sort((a, b) => a[0] - b[0]);
          const mergedRt: [number, number][] = [];
          for (const interval of rtIntervals) {
            if (mergedRt.length === 0 || mergedRt[mergedRt.length - 1][1] < interval[0]) {
              mergedRt.push([...interval]);
            } else {
              mergedRt[mergedRt.length - 1][1] = Math.max(mergedRt[mergedRt.length - 1][1], interval[1]);
            }
          }

          if (mergedRt.length === 0) {
            diasSemNenhumaAssistência++;
            diasInconformes.push(`${hf.dia} (Aberto das ${hf.inicio1 || '00:00'} às ${hf.fim1 || hf.fim2 || '00:00'} sem nenhum farmacêutico RT coberto)`);
          } else if (regra.tipoExigencia === 'ASSISTENCIA_PLENA') {
            const formatTime = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
            const uncoveredParts: string[] = [];

            for (const [opStart, opEnd] of opIntervals) {
              let cursor = opStart;
              for (const [rtStart, rtEnd] of mergedRt) {
                if (rtEnd <= cursor) continue;
                if (rtStart > cursor) {
                  const gapEnd = Math.min(rtStart, opEnd);
                  if (cursor < gapEnd) {
                    uncoveredParts.push(`${formatTime(cursor)} às ${formatTime(gapEnd)}`);
                  }
                  cursor = Math.max(cursor, rtEnd);
                } else {
                  cursor = Math.max(cursor, rtEnd);
                }
                if (cursor >= opEnd) break;
              }
              if (cursor < opEnd) {
                uncoveredParts.push(`${formatTime(cursor)} às ${formatTime(opEnd)}`);
              }
            }

            if (uncoveredParts.length > 0) {
              diasInconformes.push(`${hf.dia} (Horário descoberto sem farmacêutico: ${uncoveredParts.join(', ')})`);
            }
          } else if (regra.tipoExigencia === 'HORAS_DIARIAS') {
            const hAssDay = getDiaAssistenciaTotal(hf.dia);
            const requiredDayHours = Math.min(regra.horasMinimas, hFuncDay);
            if (hFuncDay > 0 && hAssDay === 0) {
              diasSemNenhumaAssistência++;
              diasInconformes.push(`${hf.dia} (Funcionamento de ${hFuncDay}h sem nenhuma assistência farmacêutica prestada - exigido mínimo de ${requiredDayHours}h)`);
            } else if (hAssDay < requiredDayHours) {
              diasInconformes.push(`${hf.dia} (${hAssDay}h de assistência prestadas vs ${requiredDayHours}h exigidas para o funcionamento de ${hFuncDay}h)`);
            }
          }
        }
      }
    });

    // Se houver algum dia de funcionamento sem assistência alguma ou déficit nas exigências diárias/plena
    if (diasSemNenhumaAssistência > 0) {
      return {
        condicao: 'Irregular',
        regraAplicada: regra,
        horasFuncionamentoSemanais: horasFuncSemanais,
        horasAssistenciaSemanais: horasAssistSemanais,
        justificativa: `ESTABELECIMENTO IRREGULAR: O estabelecimento possui dias de funcionamento sem nenhuma assistência farmacêutica cadastrada (${diasInconformes.join(', ')}). Conforme a Lei Federal nº 13.021/2014, é obrigatória a presença de farmacêutico responsável técnico durante todo o horário de funcionamento.`
      };
    }

    if (regra.tipoExigencia === 'ASSISTENCIA_PLENA') {
      if (diasInconformes.length === 0 && horasAssistSemanais >= horasFuncSemanais && horasFuncSemanais > 0) {
        return {
          condicao: 'Regular',
          regraAplicada: regra,
          horasFuncionamentoSemanais: horasFuncSemanais,
          horasAssistenciaSemanais: horasAssistSemanais,
          justificativa: `REGULAR: Cumpre 100% da ASSISTÊNCIA FARMACÊUTICA PLENA exigida para ${empresa.tipoEstabelecimento || 'o estabelecimento'} em ${empresa.cidade || 'neste município'}, com cobertura rigorosa dia a dia e hora a hora em todos os horários de funcionamento. Cobertura técnica de ${horasAssistSemanais}h semanais para ${horasFuncSemanais}h de funcionamento. [Base Legal: ${regra.baseLegal || 'Lei 13.021/2014'}]`
        };
      } else {
        return {
          condicao: 'Irregular',
          regraAplicada: regra,
          horasFuncionamentoSemanais: horasFuncSemanais,
          horasAssistenciaSemanais: horasAssistSemanais,
          justificativa: `IRREGULAR: Exigência de ASSISTÊNCIA FARMACÊUTICA PLENA (integral e contínua em todos os dias e horários). Inconformidades detectadas: ${diasInconformes.join(', ')}. Funcionamento: ${horasFuncSemanais}h/sem vs RT: ${horasAssistSemanais}h/sem. [Base Legal: ${regra.baseLegal || 'Lei 13.021/2014'}]`
        };
      }
    } else if (regra.tipoExigencia === 'HORAS_DIARIAS') {
      const minHorasDia = regra.horasMinimas;

      if (diasInconformes.length === 0 && horasAssistSemanais > 0) {
        return {
          condicao: 'Regular',
          regraAplicada: regra,
          horasFuncionamentoSemanais: horasFuncSemanais,
          horasAssistenciaSemanais: horasAssistSemanais,
          justificativa: `REGULAR: Atende ao piso mínimo exigido de ${minHorasDia} horas/dia de assistência farmacêutica em todos os dias de funcionamento para ${empresa.tipoEstabelecimento} no município de ${empresa.cidade} (Total: ${horasAssistSemanais}h semanais de RT). [Base Legal: ${regra.baseLegal || 'Deliberação Plenária CRF'}]`
        };
      } else {
        return {
          condicao: 'Irregular',
          regraAplicada: regra,
          horasFuncionamentoSemanais: horasFuncSemanais,
          horasAssistenciaSemanais: horasAssistSemanais,
          justificativa: `IRREGULAR: Carga horária de assistência farmacêutica inferior ao mínimo exigido de ${minHorasDia} horas/dia ou com lacunas de RT para ${empresa.tipoEstabelecimento} em ${empresa.cidade}. Inconformidades: ${diasInconformes.join(', ')}. [Base Legal: ${regra.baseLegal || 'Deliberação Plenária CRF'}]`
        };
      }
    } else {
      // HORAS_SEMANAIS
      const minHorasSemana = regra.horasMinimas;
      if (diasInconformes.length === 0 && horasAssistSemanais >= minHorasSemana) {
        return {
          condicao: 'Regular',
          regraAplicada: regra,
          horasFuncionamentoSemanais: horasFuncSemanais,
          horasAssistenciaSemanais: horasAssistSemanais,
          justificativa: `REGULAR: Atende ao piso mínimo exigido de ${minHorasSemana} horas semanais e cobre todos os horários de funcionamento para ${empresa.tipoEstabelecimento} no município de ${empresa.cidade} (Total prestado: ${horasAssistSemanais}h/semana). [Base Legal: ${regra.baseLegal || 'Resolução CFF / CRF'}]`
        };
      } else {
        return {
          condicao: 'Irregular',
          regraAplicada: regra,
          horasFuncionamentoSemanais: horasFuncSemanais,
          horasAssistenciaSemanais: horasAssistSemanais,
          justificativa: `IRREGULAR: Carga horária semanal insuficiente ou lacunas sem cobertura de RT (${diasInconformes.join(', ')}; ${horasAssistSemanais}h prestadas vs ${minHorasSemana}h exigidas) para ${empresa.tipoEstabelecimento} em ${empresa.cidade}. [Base Legal: ${regra.baseLegal || 'Resolução CFF / CRF'}]`
        };
      }
    }
  }

  // Profissionais API
  public getProfissionaisPaginated(page = 1, pageSize = 20, filters?: {
    search?: string;
    situacao?: string;
    tipoAssociado?: string;
    statusFinanceiro?: string;
    bairro?: string;
    cep?: string;
    endereco?: string;
    complemento?: string;
    habilitacao?: string;
  }) {
    const profMap = new Map<string, Profissional>();
    INITIAL_PROFISSIONAIS.forEach(p => profMap.set(p.id, p));
    this.customProfissionais.forEach(p => profMap.set(p.id, p));
    const allProfissionais = Array.from(profMap.values());
    let filtered = allProfissionais;

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.nome.toLowerCase().includes(q) ||
        p.cpf.includes(q) ||
        p.inscricao.toLowerCase().includes(q) ||
        (p.carteiraProfissional && p.carteiraProfissional.toLowerCase().includes(q)) ||
        (p.cep && p.cep.toLowerCase().includes(q)) ||
        (p.endereco && p.endereco.toLowerCase().includes(q)) ||
        (p.complemento && p.complemento.toLowerCase().includes(q))
      );
    }

    if (filters?.situacao && filters.situacao !== 'Todos') {
      filtered = filtered.filter(p => p.situacao === filters.situacao);
    }

    if (filters?.tipoAssociado && filters.tipoAssociado !== 'Todos') {
      filtered = filtered.filter(p => p.tipoAssociado === filters.tipoAssociado);
    }

    if (filters?.statusFinanceiro && filters.statusFinanceiro !== 'Todos') {
      filtered = filtered.filter(p => p.statusFinanceiro === filters.statusFinanceiro);
    }

    if (filters?.bairro && filters.bairro !== 'Todos') {
      filtered = filtered.filter(p => p.bairro === filters.bairro);
    }

    if (filters?.cep && filters.cep !== 'Todos') {
      const q = filters.cep.toLowerCase();
      filtered = filtered.filter(p => p.cep && p.cep.toLowerCase().includes(q));
    }

    if (filters?.endereco && filters.endereco !== 'Todos') {
      const q = filters.endereco.toLowerCase();
      filtered = filtered.filter(p => p.endereco && p.endereco.toLowerCase().includes(q));
    }

    if (filters?.complemento && filters.complemento !== 'Todos') {
      const q = filters.complemento.toLowerCase();
      filtered = filtered.filter(p => p.complemento && p.complemento.toLowerCase().includes(q));
    }

    if (filters?.habilitacao && filters.habilitacao !== 'Todos') {
      const q = filters.habilitacao.toLowerCase();
      filtered = filtered.filter(p => p.habilitacoes && p.habilitacoes.some(h => h.toLowerCase().includes(q)));
    }

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      items: filtered.slice(startIndex, endIndex),
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize)
    };
  }

  public getProfissionais(): Profissional[] {
    const profMap = new Map<string, Profissional>();
    INITIAL_PROFISSIONAIS.forEach(p => profMap.set(p.id, p));
    this.customProfissionais.forEach(p => profMap.set(p.id, p));
    return Array.from(profMap.values());
  }

  public getProfissionalById(id: string): Profissional | undefined {
    const found = this.customProfissionais.find(p => p.id === id) || INITIAL_PROFISSIONAIS.find(p => p.id === id);
    if (found) return found;
    const match = id.match(/prof-(\d+)/);
    if (match) {
      const idx = parseInt(match[1], 10) - 1;
      return generateSingleProfissional(idx);
    }
    return undefined;
  }

  public findProfissionalByInscricao(inscricao: string): Profissional | undefined {
    if (!inscricao) return undefined;
    const clean = inscricao.trim().toUpperCase();
    return this.customProfissionais.find(p => p.inscricao?.trim().toUpperCase() === clean) ||
           INITIAL_PROFISSIONAIS.find(p => p.inscricao?.trim().toUpperCase() === clean);
  }

  public findProfissionalById(id: string): Profissional | undefined {
    return this.getProfissionalById(id);
  }

  public peekNextInscricaoProfissional(): string {
    const prefix = this.councilConfig.prefixoInscricaoProfissional || this.councilConfig.sigla || 'CRF-AM';
    const num = this.councilConfig.proximoNumeroInscricaoProfissional || 4150;
    const suffix = this.councilConfig.sufixoInscricaoProfissional ?? '';
    const minDigits = this.councilConfig.digitosMinimosInscricaoProfissional ?? 0;
    return formatInscricaoCompleta(prefix, num, suffix, minDigits);
  }

  public getNextInscricaoProfissional(autoIncrement: boolean = true): string {
    const formatted = this.peekNextInscricaoProfissional();
    if (autoIncrement) {
      this.councilConfig.proximoNumeroInscricaoProfissional = (this.councilConfig.proximoNumeroInscricaoProfissional || 4150) + 1;
      this.councilConfig.totalProfissionaisRegistrados = (this.councilConfig.totalProfissionaisRegistrados || 11480) + 1;
      this.updateCouncilConfig(this.councilConfig);
    }
    return formatted;
  }

  public peekNextInscricaoEmpresa(): string {
    const prefix = this.councilConfig.prefixoInscricaoEmpresa || this.councilConfig.sigla || 'CRF-AM';
    const num = this.councilConfig.proximoNumeroInscricaoEmpresa || 1250;
    const suffix = this.councilConfig.sufixoInscricaoEmpresa ?? '';
    const minDigits = this.councilConfig.digitosMinimosInscricaoEmpresa ?? 0;
    return formatInscricaoCompleta(prefix, num, suffix, minDigits);
  }

  public getNextInscricaoEmpresa(autoIncrement: boolean = true): string {
    const formatted = this.peekNextInscricaoEmpresa();
    if (autoIncrement) {
      this.councilConfig.proximoNumeroInscricaoEmpresa = (this.councilConfig.proximoNumeroInscricaoEmpresa || 1250) + 1;
      this.councilConfig.totalEmpresasRegistradas = (this.councilConfig.totalEmpresasRegistradas || 1340) + 1;
      this.updateCouncilConfig(this.councilConfig);
    }
    return formatted;
  }

  public saveProfissional(prof: Profissional) {
    const sanitized = sanitizeToUpper(prof, ['id', 'fotoUrl', 'emailComercial', 'emailPessoal']);
    const idx = this.customProfissionais.findIndex(p => p.id === sanitized.id || p.cpf === sanitized.cpf);
    if (idx >= 0) {
      this.customProfissionais[idx] = sanitized;
    } else {
      this.customProfissionais.unshift(sanitized);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.PROFISSIONAIS, JSON.stringify(this.customProfissionais));
      if (this.isOnline) {
        runBackgroundSupabase(
          supabase.from('profissionais').upsert({
            id: sanitized.id,
            inscricao: sanitized.inscricao,
            nome: sanitized.nome,
            cpf: sanitized.cpf,
            rg: sanitized.rg || '',
            orgao_expeditor: sanitized.orgaoExpeditor || '',
            data_nascimento: sanitized.dataNascimento || '',
            sexo: sanitized.sexo || 'M',
            nacionalidade: sanitized.nacionalidade || 'BRASILEIRA',
            naturalidade: sanitized.naturalidade || '',
            nome_mae: sanitized.nomeMae || '',
            nome_pai: sanitized.nomePai || null,
            situacao: sanitized.situacao,
            tipo_associado: sanitized.tipoAssociado,
            habilitacoes: sanitized.habilitacoes || [],
            data_inscricao: sanitized.dataInscricao || '',
            data_colacao_grau: sanitized.dataColacaoGrau || '',
            data_exp_diploma: sanitized.dataExpDiploma || '',
            faculdade: sanitized.faculdade || '',
            email_comercial: sanitized.emailComercial || '',
            email_pessoal: sanitized.emailPessoal || '',
            telefone: sanitized.telefone || '',
            celular: sanitized.celular || '',
            endereco: sanitized.endereco || '',
            complemento: sanitized.complemento || null,
            bairro: sanitized.bairro || '',
            cidade: sanitized.cidade || '',
            uf: sanitized.uf || 'AM',
            cep: sanitized.cep || '',
            status_financeiro: sanitized.statusFinanceiro || 'Adimplente',
            carteira_profissional: sanitized.carteiraProfissional || null,
            foto_url: sanitized.fotoUrl || null,
            observacoes: sanitized.observacoes || null
          }, { onConflict: 'cpf' })
        );
      }
    } catch (e) {}
    this.notify();
  }

  public deleteProfissional(id: string) {
    this.customProfissionais = this.customProfissionais.filter(p => p.id !== id);
    if (this.councilConfig.totalProfissionaisRegistrados > 0) {
      this.councilConfig.totalProfissionaisRegistrados -= 1;
    }
    try {
      localStorage.setItem(STORAGE_KEYS.PROFISSIONAIS, JSON.stringify(this.customProfissionais));
      if (this.isOnline) {
        runBackgroundSupabase(
          supabase.from('profissionais').delete().eq('id', id)
        );
      }
    } catch (e) {}
    this.notify();
  }

  // Empresas API
  public getEmpresas(filters?: {
    search?: string;
    condicao?: string;
    situacao?: string;
    tipoEstabelecimento?: string;
    bairro?: string;
    cep?: string;
    endereco?: string;
    socio?: string;
    profissional?: string;
    naturezaAtividade?: string;
  }): Empresa[] {
    let list = this.empresas.map(e => ({
      ...e,
      horariosFuncionamento: e.horariosFuncionamento && e.horariosFuncionamento.length > 0 ? e.horariosFuncionamento : [...DEFAULT_HORARIOS_FUNCIONAMENTO]
    }));
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(e => 
        e.razaoSocial.toLowerCase().includes(q) || 
        e.nomeFantasia.toLowerCase().includes(q) || 
        e.cnpj.includes(q) || 
        e.inscricao.toLowerCase().includes(q)
      );
    }
    if (filters?.condicao && filters.condicao !== 'Todos') {
      list = list.filter(e => e.condicao === filters.condicao);
    }
    if (filters?.situacao && filters.situacao !== 'Todos') {
      list = list.filter(e => e.situacao === filters.situacao);
    }
    if (filters?.tipoEstabelecimento && filters.tipoEstabelecimento !== 'Todos') {
      list = list.filter(e => e.tipoEstabelecimento === filters.tipoEstabelecimento);
    }
    if (filters?.bairro && filters.bairro !== 'Todos') {
      list = list.filter(e => e.bairro?.toLowerCase().includes(filters.bairro!.toLowerCase()));
    }
    if (filters?.cep && filters.cep.trim()) {
      const q = filters.cep.replace(/\D/g, '');
      list = list.filter(e => e.cep && e.cep.replace(/\D/g, '').includes(q));
    }
    if (filters?.endereco && filters.endereco.trim()) {
      const q = filters.endereco.toLowerCase().trim();
      list = list.filter(e => 
        (e.endereco && e.endereco.toLowerCase().includes(q)) || 
        (e.bairro && e.bairro.toLowerCase().includes(q)) ||
        (e.complemento && e.complemento.toLowerCase().includes(q))
      );
    }
    if (filters?.socio && filters.socio.trim()) {
      const q = filters.socio.toLowerCase().trim();
      list = list.filter(e => e.socios && e.socios.some(s => 
        s.nome.toLowerCase().includes(q) || 
        s.cpf.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
      ));
    }
    if (filters?.profissional && filters.profissional.trim()) {
      const q = filters.profissional.toLowerCase().trim();
      list = list.filter(e => e.responsaveisTecnicos && e.responsaveisTecnicos.some(rt => 
        rt.profissionalNome.toLowerCase().includes(q) || 
        rt.profissionalInscricao.toLowerCase().includes(q)
      ));
    }
    if (filters?.naturezaAtividade && filters.naturezaAtividade !== 'Todos' && filters.naturezaAtividade.trim()) {
      const q = filters.naturezaAtividade.toLowerCase().trim();
      list = list.filter(e => e.naturezaAtividade && e.naturezaAtividade.toLowerCase().includes(q));
    }
    return list;
  }

  public getEmpresaById(id: string): Empresa | undefined {
    return this.empresas.find(e => e.id === id);
  }

  public saveEmpresa(empresa: Empresa) {
    const sanitized = sanitizeToUpper(empresa, ['id', 'email']);
    
    // Auto-avaliação da condição sanitária/legal de Assistência Farmacêutica
    const avaliacao = this.avaliarRegularidadeAssistencia(sanitized);
    sanitized.condicao = avaliacao.condicao;
    sanitized.justificativaCondicao = avaliacao.justificativa;
    sanitized.regraAssistenciaAplicada = avaliacao.regraAplicada?.baseLegal || avaliacao.regraAplicada?.descricao || '';
    sanitized.cargaHorariaFuncionamentoSemanal = avaliacao.horasFuncionamentoSemanais;
    sanitized.cargaHorariaAssistenciaSemanal = avaliacao.horasAssistenciaSemanais;
    sanitized.assistenciaPlena = avaliacao.regraAplicada?.tipoExigencia === 'ASSISTENCIA_PLENA' && avaliacao.condicao === 'Regular';

    const idx = this.empresas.findIndex(e => e.id === sanitized.id || e.cnpj === sanitized.cnpj);
    if (idx >= 0) {
      this.empresas[idx] = sanitized;
    } else {
      this.empresas.unshift(sanitized);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.EMPRESAS, JSON.stringify(this.empresas));
      if (this.isOnline) {
        runBackgroundSupabase(
          supabase.from('empresas').upsert({
            id: sanitized.id,
            cnpj: sanitized.cnpj,
            razao_social: sanitized.razaoSocial,
            nome_fantasia: sanitized.nomeFantasia || '',
            inscricao: sanitized.inscricao,
            inscricao_estadual: sanitized.inscricaoEstadual || null,
            categoria: sanitized.categoria || '',
            tipo_estabelecimento: sanitized.tipoEstabelecimento,
            natureza_atividade: sanitized.naturezaAtividade || null,
            tipo_empresa: sanitized.tipoEmpresa || 'Matriz',
            condicao: sanitized.condicao || 'Regular',
            situacao: sanitized.situacao || 'Definitiva',
            capital_social: sanitized.capitalSocial || 0,
            assistencia_plena: sanitized.assistenciaPlena ?? true,
            data_inscricao: sanitized.dataInscricao || '',
            validade_crt: sanitized.validadeCRT || null,
            numero_crt: sanitized.numeroCRT || null,
            numero_processo: sanitized.numeroProcesso || null,
            endereco: sanitized.endereco || '',
            complemento: sanitized.complemento || null,
            bairro: sanitized.bairro || '',
            cidade: sanitized.cidade || '',
            uf: sanitized.uf || 'AM',
            cep: sanitized.cep || '',
            rota: sanitized.rota || null,
            area: sanitized.area || null,
            telefone: sanitized.telefone || '',
            email: sanitized.email || '',
            status_financeiro: sanitized.statusFinanceiro || 'Adimplente',
            latitude: sanitized.latitude || null,
            longitude: sanitized.longitude || null,
            ultima_fiscalizacao: sanitized.ultimaFiscalizacao || null,
            resultado_ultima_fiscalizacao: sanitized.resultadoUltimaFiscalizacao || null,
            socios: sanitized.socios || [],
            responsaveis_tecnicos: sanitized.responsaveisTecnicos || []
          }, { onConflict: 'cnpj' })
        );
      }
    } catch (e) {}
    this.migrateEmpresaDataToCadastrosBasicos();
    this.notify();
  }

  public deleteEmpresa(id: string) {
    this.empresas = this.empresas.filter(e => e.id !== id);
    if (this.councilConfig.totalEmpresasRegistradas > 0) {
      this.councilConfig.totalEmpresasRegistradas -= 1;
    }
    try {
      localStorage.setItem(STORAGE_KEYS.EMPRESAS, JSON.stringify(this.empresas));
      if (this.isOnline) {
        runBackgroundSupabase(
          supabase.from('empresas').delete().eq('id', id)
        );
      }
    } catch (e) {}
    this.notify();
  }

  // VÍNCULOS DE RT (PROFISSIONAL <-> EMPRESA)
  public getEmpresasVinculadasAoProfissional(profissionalIdOuInscricao: string): { empresa: Empresa; vinculo: ResponsavelTecnico }[] {
    const matches: { empresa: Empresa; vinculo: ResponsavelTecnico }[] = [];
    const target = (profissionalIdOuInscricao || '').toUpperCase().trim();
    
    this.empresas.forEach(emp => {
      emp.responsaveisTecnicos?.forEach(rt => {
        if (
          rt.profissionalId === target ||
          rt.profissionalInscricao.toUpperCase().trim() === target ||
          rt.profissionalNome.toUpperCase().includes(target)
        ) {
          matches.push({ empresa: emp, vinculo: rt });
        }
      });
    });
    return matches;
  }

  public vincularProfissionalAEmpresa(empresaId: string, vinculo: ResponsavelTecnico) {
    const emp = this.empresas.find(e => e.id === empresaId);
    if (!emp) return;
    if (!emp.responsaveisTecnicos) emp.responsaveisTecnicos = [];
    
    const existingIdx = emp.responsaveisTecnicos.findIndex(rt => 
      rt.profissionalId === vinculo.profissionalId || 
      rt.profissionalInscricao === vinculo.profissionalInscricao
    );
    if (existingIdx >= 0) {
      emp.responsaveisTecnicos[existingIdx] = vinculo;
    } else {
      emp.responsaveisTecnicos.push(vinculo);
    }
    this.saveEmpresa(emp);
  }

  public desvincularProfissionalDeEmpresa(empresaId: string, profissionalId: string) {
    const emp = this.empresas.find(e => e.id === empresaId);
    if (!emp || !emp.responsaveisTecnicos) return;
    emp.responsaveisTecnicos = emp.responsaveisTecnicos.filter(rt => 
      rt.profissionalId !== profissionalId && rt.profissionalInscricao !== profissionalId
    );
    this.saveEmpresa(emp);
  }

  // POSIÇÃO FINANCEIRA
  public getPosicaoFinanceira(documentoOuInscricao: string, tipo: 'PROFISSIONAL' | 'EMPRESA') {
    const docLimpo = (documentoOuInscricao || '').replace(/\D/g, '');
    const inscLimpa = (documentoOuInscricao || '').toUpperCase().trim();

    const lancs = this.lancamentos.filter(l => {
      const lDocLimpo = l.targetDoc.replace(/\D/g, '');
      const lInscLimpa = l.targetInscricao.toUpperCase().trim();
      return (
        (docLimpo && lDocLimpo === docLimpo) ||
        (inscLimpa && lInscLimpa === inscLimpa)
      );
    });

    const abertos = lancs.filter(l => l.status === 'Pendente' || l.status === 'Vencido' || l.status === 'Em Cobrança Judicial');
    const valorTotalAberto = abertos.reduce((acc, curr) => acc + curr.valorTotal, 0);
    const valorTotalPago = lancs.filter(l => l.status === 'Pago').reduce((acc, curr) => acc + curr.valorTotal, 0);

    return {
      lancamentos: lancs,
      abertos,
      valorTotalAberto,
      valorTotalPago,
      isAdimplente: valorTotalAberto === 0
    };
  }

  // Financeiro
  public getLancamentos(): LancamentoFinanceiro[] {
    return [...this.lancamentos];
  }

  public addLancamento(lanc: LancamentoFinanceiro) {
    this.saveLancamento(lanc);
  }

  public saveLancamento(lanc: LancamentoFinanceiro) {
    const idx = this.lancamentos.findIndex(l => l.id === lanc.id);
    if (idx >= 0) {
      this.lancamentos[idx] = lanc;
    } else {
      this.lancamentos.unshift(lanc);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.LANCAMENTOS, JSON.stringify(this.lancamentos));
      if (this.isOnline) {
        runBackgroundSupabase(
          supabase.from('lancamentos_financeiros').upsert({
            id: lanc.id,
            target_id: lanc.targetId,
            target_tipo: lanc.targetTipo,
            target_nome: lanc.targetNome,
            target_doc: lanc.targetDoc,
            target_inscricao: lanc.targetInscricao,
            descricao: lanc.descricao,
            tipo: lanc.tipo,
            exercicio: lanc.exercicio,
            parcela: lanc.parcela || null,
            valor_original: lanc.valorOriginal,
            desconto: lanc.desconto || 0,
            juros_multa: lanc.jurosMulta || 0,
            valor_total: lanc.valorTotal,
            data_emissao: lanc.dataEmissao,
            data_vencimento: lanc.dataVencimento,
            data_pagamento: lanc.dataPagamento || null,
            status: lanc.status,
            codigo_barras: lanc.codigoBarras || null,
            linha_digitavel: lanc.linhaDigitavel || null,
            pix_copia_e_cola: lanc.pixCopiaECola || null
          }, { onConflict: 'id' })
        );
      }
    } catch (e) {}
    this.notify();
  }

  public baixarLancamento(id: string, formaPagamento: string = 'PIX Instantâneo') {
    const lanc = this.lancamentos.find(l => l.id === id);
    if (lanc) {
      lanc.status = 'Pago';
      lanc.dataPagamento = new Date().toLocaleDateString('pt-BR');
      this.saveLancamento(lanc);
    }
  }

  public payLancamento(id: string, formaPagamento: string = 'PIX Instantâneo') {
    this.baixarLancamento(id, formaPagamento);
  }

  // Cobrança & Dívida Ativa
  public getCobrancas(): ProcessoCobranca[] {
    return [...this.cobrancas];
  }

  public saveCobranca(proc: ProcessoCobranca) {
    const idx = this.cobrancas.findIndex(c => c.id === proc.id);
    if (idx >= 0) {
      this.cobrancas[idx] = proc;
    } else {
      this.cobrancas.unshift(proc);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.COBRANCAS, JSON.stringify(this.cobrancas));
      if (this.isOnline) {
        runBackgroundSupabase(
          supabase.from('processos_cobranca').upsert({
            id: proc.id,
            target_id: proc.targetId,
            target_tipo: proc.targetTipo,
            target_nome: proc.targetNome,
            target_doc: proc.targetDoc,
            target_inscricao: proc.targetInscricao,
            valor_total_debito: proc.valorTotalDebito,
            qtd_lancamentos: proc.qtdLancamentos,
            fase_cobranca: proc.faseCobranca,
            data_inicio: proc.dataInicio,
            data_ultima_notificacao: proc.dataUltimaNotificacao || null,
            data_limite_defesa: proc.dataLimiteDefesa || null,
            numero_cda: proc.numeroCDA || null,
            livro_cda: proc.livroCDA || null,
            folha_cda: proc.folhaCDA || null,
            data_cda: proc.dataCDA || null,
            status_acordo: proc.statusAcordo,
            parcelas_acordo: proc.parcelasAcordo || null,
            valor_parcela_acordo: proc.valorParcelaAcordo || null,
            historico_notificacoes: proc.historicoNotificacoes || []
          }, { onConflict: 'id' })
        );
      }
    } catch (e) {}
    this.notify();
  }

  public gerarCDA(processoId: string, livro: string = '04-A', folha: string = '112'): ProcessoCobranca | null {
    const proc = this.cobrancas.find(c => c.id === processoId);
    if (!proc) return null;
    const ano = new Date().getFullYear();
    const sequencial = Math.floor(1000 + Math.random() * 9000);
    proc.numeroCDA = `${sequencial}/${ano}-CRFAM`;
    proc.livroCDA = livro;
    proc.folhaCDA = folha;
    proc.dataCDA = new Date().toLocaleDateString('pt-BR');
    proc.faseCobranca = 'Inscrição Dívida Ativa';
    proc.historicoNotificacoes.push({
      data: new Date().toLocaleDateString('pt-BR'),
      tipo: 'Inscrição em Dívida Ativa',
      descricao: `CDA nº ${proc.numeroCDA} lavrada no Livro ${livro}, Fls. ${folha}.`,
      usuario: 'Assessoria Jurídica'
    });
    this.saveCobranca(proc);
    return proc;
  }

  // Fiscalização
  public getTermosFiscalizacao(): TermoFiscalizacao[] {
    return [...this.termosFiscalizacao];
  }

  public saveTermoFiscalizacao(termo: TermoFiscalizacao) {
    const idx = this.termosFiscalizacao.findIndex(t => t.id === termo.id);
    if (idx >= 0) {
      this.termosFiscalizacao[idx] = termo;
    } else {
      this.termosFiscalizacao.unshift(termo);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.TERMOS_FISCALIZACAO, JSON.stringify(this.termosFiscalizacao));
      if (this.isOnline) {
        runBackgroundSupabase(
          supabase.from('termos_fiscalizacao').upsert({
            id: termo.id,
            numero_termo: termo.numeroTermo,
            numero_auto_infracao: termo.numeroAutoInfracao || null,
            tipo_termo: termo.tipoTermo || null,
            tipo_visita: termo.tipoVisita || null,
            empresa_id: termo.empresaId,
            empresa_inscricao: termo.empresaInscricao || null,
            empresa_razao_social: termo.empresaRazaoSocial || null,
            empresa_nome: termo.empresaNome || null,
            empresa_cnpj: termo.empresaCnpj || null,
            cnpj: termo.cnpj || null,
            endereco: termo.endereco || null,
            bairro: termo.bairro || null,
            cidade: termo.cidade || null,
            data_fiscalizacao: termo.dataFiscalizacao || null,
            hora_fiscalizacao: termo.horaFiscalizacao || null,
            data_hora: termo.dataHora || null,
            fiscal_id: termo.fiscalId || null,
            fiscal_nome: termo.fiscalNome || null,
            fiscal_matricula: termo.fiscalMatricula || null,
            matricula_fiscal: termo.matriculaFiscal || null,
            fiscal_assinante_nome: termo.fiscalAssinanteNome || null,
            fiscal_assinante_matricula: termo.fiscalAssinanteMatricula || null,
            latitude: termo.latitude || null,
            longitude: termo.longitude || null,
            endereco_geo: termo.enderecoGeo || null,
            presenca_rt: termo.presencaRT ?? termo.rtPresente ?? false,
            rt_presente: termo.rtPresente ?? termo.presencaRT ?? false,
            rt_nome_presente: termo.rtNomePresente || termo.rtPresenteNome || null,
            rt_presente_nome: termo.rtPresenteNome || termo.rtNomePresente || null,
            rt_crf_presente: termo.rtCrfPresente || termo.rtPresenteInscricao || null,
            rt_presente_inscricao: termo.rtPresenteInscricao || termo.rtCrfPresente || null,
            motivo_ausencia_rt: termo.motivoAusenciaRT || null,
            documentos_verificados: termo.documentosVerificados || {},
            relato_fiscal: termo.relatoFiscal || null,
            irregularidades_constatadas: termo.irregularidadesConstatadas || [],
            infracoes_identificadas: termo.infracoesIdentificadas || [],
            artigos_incorridos: termo.artigosIncorridos || [],
            auto_infracao_gerado: termo.autoInfracaoGerado || false,
            valor_multa_previsto: termo.valorMultaPrevisto || 0,
            orientacoes_fiscais: termo.orientacoesFiscais || null,
            observacoes_notificado: termo.observacoesNotificado || null,
            prazo_regularizacao_dias: termo.prazoRegularizacaoDias || null,
            notificacao_prazo_dias: termo.notificacaoPrazoDias || null,
            status: termo.status || 'Concluído e Assinado',
            status_sincronizacao: termo.statusSincronizacao || 'Sincronizado',
            assinatura_fiscal: termo.assinaturaFiscal || null,
            assinatura_fiscal_data_hora: termo.assinaturaFiscalDataHora || null,
            assinatura_responsavel: termo.assinaturaResponsavel || null,
            assinatura_notificado: termo.assinaturaNotificado || null,
            assinatura_notificado_data_hora: termo.assinaturaNotificadoDataHora || null,
            recusa_assinatura: termo.recusaAssinatura || false,
            motivo_recusa: termo.motivoRecusa || null,
            tipo_signatario_notificado: termo.tipoSignatarioNotificado || null,
            nome_signatario_notificado: termo.nomeSignatarioNotificado || null,
            documento_signatario_notificado: termo.documentoSignatarioNotificado || null,
            inscricao_signatario_notificado: termo.inscricaoSignatarioNotificado || null,
            cargo_signatario_notificado: termo.cargoSignatarioNotificado || null,
            motivo_assinatura_terceiro: termo.motivoAssinaturaTerceiro || null,
            hash_validacao_digital: termo.hashValidacaoDigital || null,
            fotos_comprovantes: termo.fotosComprovantes || [],
            foto_evidencias: termo.fotoEvidencias || [],
            sincronizado: termo.sincronizado ?? true
          }, { onConflict: 'id' })
        );
      }
    } catch (e) {}
    this.notify();
  }

  public submitTermoFiscalizacao(termo: any): { success: boolean; offline: boolean } {
    if (!this.isOnline) {
      termo.statusSincronizacao = 'Pendente Offline';
      this.offlineQueue.push(termo);
      try {
        localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(this.offlineQueue));
      } catch (e) {}
      this.notify();
      return { success: true, offline: true };
    }

    termo.statusSincronizacao = 'Sincronizado';
    this.saveTermoFiscalizacao(termo);
    
    const emp = this.empresas.find(e => e.id === termo.empresaId);
    if (emp) {
      emp.ultimaFiscalizacao = termo.dataHora?.split(' ')[0] || new Date().toLocaleDateString('pt-BR');
      emp.resultadoUltimaFiscalizacao = termo.autoInfracaoGerado ? 'Autuado' : (termo.infracoesIdentificadas?.length > 0 ? 'Notificado' : 'Regular');
      if (termo.autoInfracaoGerado) {
        emp.condicao = 'Irregular';
      }
      this.saveEmpresa(emp);
    }

    if (termo.autoInfracaoGerado && termo.valorMultaPrevisto) {
      const novoLanc: LancamentoFinanceiro = {
        id: `lan-fisc-${Date.now()}`,
        targetId: termo.empresaId,
        targetTipo: 'EMPRESA',
        targetNome: termo.empresaNome || emp?.razaoSocial || 'EMPRESA',
        targetDoc: termo.cnpj || emp?.cnpj || '00.000.000/0001-00',
        targetInscricao: emp?.inscricao || 'CRF-PJ',
        descricao: `Auto de Multa nº ${termo.numeroAutoInfracao || 'AI-2026'}`,
        tipo: 'Auto de Multa',
        exercicio: 2026,
        valorOriginal: termo.valorMultaPrevisto,
        desconto: 0,
        jurosMulta: 0,
        valorTotal: termo.valorMultaPrevisto,
        dataEmissao: new Date().toLocaleDateString('pt-BR'),
        dataVencimento: new Date(Date.now() + 30 * 86400000).toLocaleDateString('pt-BR'),
        status: 'Pendente',
        codigoBarras: '00190000090' + Date.now().toString().slice(-10),
        linhaDigitavel: '00190.00009 01234.567890 12345.678901 8 ' + String(termo.valorMultaPrevisto * 100).padStart(14, '0'),
        pixCopiaECola: `00020126580014br.gov.bcb.pix0136crfam-multa-${Date.now()}5204000053039865405${termo.valorMultaPrevisto}5802BR5915CRF AMAZONAS6006MANAUS62070503***6304`
      };
      this.addLancamento(novoLanc);
    }

    return { success: true, offline: false };
  }

  public syncOfflineQueue(): number {
    if (!this.isOnline || this.offlineQueue.length === 0) return 0;
    const itemsToSync = [...this.offlineQueue];
    this.offlineQueue = [];
    
    itemsToSync.forEach(item => {
      item.sincronizado = true;
      item.status = 'Concluído e Assinado';
      item.statusSincronizacao = 'Sincronizado';
      this.saveTermoFiscalizacao(item);
    });

    try {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(this.offlineQueue));
    } catch (e) {}
    this.notify();
    return itemsToSync.length;
  }

  // Protocolos
  public getProtocolos(): any[] {
    return [...this.protocolos];
  }

  public saveProtocolo(prot: any) {
    const idx = this.protocolos.findIndex(p => p.id === prot.id);
    if (idx >= 0) {
      this.protocolos[idx] = prot;
    } else {
      this.protocolos.unshift(prot);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.PROTOCOLOS, JSON.stringify(this.protocolos));
      if (this.isOnline) {
        runBackgroundSupabase(
          supabase.from('protocolos_processos').upsert({
            id: prot.id,
            numero_protocolo: prot.numeroProtocolo,
            tipo: prot.tipo,
            interessado: prot.interessado,
            documento_interessado: prot.documentoInteressado,
            data_inscricao: prot.dataInscricao || null,
            data_abertura: prot.dataAbertura,
            data_ultima_atualizacao: prot.dataUltimaAtualizacao || null,
            prazo_resposta: prot.prazoResposta || null,
            status: prot.status || 'Em Análise',
            setor_atual: prot.setorAtual || 'Secretaria Geral',
            conselheiro_relator: prot.conselheiroRelator || null,
            parecer_relator: prot.parecerRelator || null,
            decisao_plenario: prot.decisaoPlenario || null,
            anexos: prot.anexos || [],
            historico: prot.historico || []
          }, { onConflict: 'id' })
        );
      }
    } catch (e) {}
    this.notify();
  }

  public deleteProtocolo(id: string) {
    this.protocolos = this.protocolos.filter(p => p.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.PROTOCOLOS, JSON.stringify(this.protocolos));
      if (this.isOnline) {
        runBackgroundSupabase(
          supabase.from('protocolos_processos').delete().eq('id', id)
        );
      }
    } catch (e) {}
    this.notify();
  }

  // Formulários Dinâmicos
  public getFormularios(): any[] {
    return [...this.formularios];
  }

  public saveFormulario(form: any) {
    const idx = this.formularios.findIndex(f => f.id === form.id);
    if (idx >= 0) {
      this.formularios[idx] = form;
    } else {
      this.formularios.unshift(form);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.FORMULARIOS, JSON.stringify(this.formularios));
      if (this.isOnline) {
        runBackgroundSupabase(
          supabase.from('formularios_dinamicos').upsert({
            id: form.id,
            titulo: form.titulo,
            categoria: form.categoria,
            descricao: form.descricao || null,
            publico_alvo: form.publicoAlvo || 'Ambos',
            versao: String(form.versao || '1.0'),
            ativo: form.ativo ?? true,
            campos: form.campos || [],
            respostas_recebidas: form.respostasRecebidas || 0,
            data_criacao: form.dataCriacao || null
          }, { onConflict: 'id' })
        );
      }
    } catch (e) {}
    this.notify();
  }

  public deleteFormulario(id: string) {
    this.formularios = this.formularios.filter(f => f.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.FORMULARIOS, JSON.stringify(this.formularios));
      if (this.isOnline) {
        runBackgroundSupabase(
          supabase.from('formularios_dinamicos').delete().eq('id', id)
        );
      }
    } catch (e) {}
    this.notify();
  }

  public submitFormResponse(resposta: any) {
    this.respostasForms.unshift(resposta);
    const form = this.formularios.find(f => f.id === resposta.formularioId);
    if (form) {
      form.respostasRecebidas = (form.respostasRecebidas || 0) + 1;
      this.saveFormulario(form);
    }
    const novoProt: any = {
      id: `prot-${Date.now()}`,
      numeroProtocolo: resposta.protocoloGerado,
      tipo: form?.categoria || 'Processo Administrativo',
      interessado: resposta.autorNome,
      documentoInteressado: resposta.autorDocumento,
      dataInscricao: new Date().toLocaleDateString('pt-BR'),
      dataAbertura: new Date().toLocaleDateString('pt-BR'),
      dataUltimaAtualizacao: new Date().toLocaleDateString('pt-BR'),
      prazoResposta: new Date(Date.now() + 15 * 86400000).toLocaleDateString('pt-BR'),
      status: 'Em Análise',
      setorAtual: 'Secretaria Geral',
      anexos: ['Formulario_Submetido.json'],
      historico: [
        {
          data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR').slice(0, 5),
          setor: 'Portal de Autoatendimento',
          descricao: `Submissão do formulário: ${form?.titulo}`,
          responsavel: resposta.autorNome
        }
      ]
    };
    this.saveProtocolo(novoProt);

    if (this.isOnline) {
      runBackgroundSupabase(
        supabase.from('respostas_formularios').insert({
          id: resposta.id || `resp-${Date.now()}`,
          formulario_id: resposta.formularioId,
          formulario_titulo: resposta.formularioTitulo,
          autor_nome: resposta.autorNome,
          autor_documento: resposta.autorDocumento,
          protocolo_gerado: resposta.protocoloGerado,
          data_envio: resposta.dataEnvio || new Date().toISOString(),
          respostas: resposta.respostas || {},
          dados_campos: resposta.dadosCampos || {},
          status: resposta.status || 'Em Análise'
        })
      );
    }

    this.notify();
  }

  public getMicroservices(): MicrosservicoStatus[] {
    return INITIAL_MICROSERVICES;
  }
}

export const storageService = new StorageService();
