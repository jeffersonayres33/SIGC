export type UserRole = 
  | 'ADMIN'
  | 'FISCAL'
  | 'JURIDICO'
  | 'FINANCEIRO'
  | 'DIRETORIA'
  | 'PORTAL_PROFISSIONAL'
  | 'PORTAL_EMPRESA';

export type SituacaoProfissional = 
  | 'Definitivo'
  | 'Provisório'
  | 'Transferido'
  | 'Falecido'
  | 'Jubilado'
  | 'Secundário'
  | 'Temporário'
  | 'Cancelado'
  | 'Baixado'
  | 'Licenciado'
  | 'Suspenso'
  | 'Remido'
  | string;

export type TipoAssociado = 
  | 'Farmacêutico'
  | 'Farmacêutico Bioquímico'
  | 'Farmacêutico Industrial'
  | 'Técnico em Farmácia'
  | 'Técnico em Análises Clínicas'
  | 'Não Farmacêutico'
  | string;

export type CondicaoFirma = 
  | 'Regular'
  | 'Irregular'
  | 'Ilegal'
  | 'Inativa'
  | 'Interditada'
  | 'Em Processo'
  | string;

export type TipoEmpresa = 
  | 'Matriz'
  | 'Filial'
  | 'Privado'
  | 'Público'
  | 'Filantrópico'
  | string;

export type SituacaoFirma = 
  | 'Definitiva'
  | 'Provisória'
  | 'Fechada Mot. Desc.'
  | 'Extinta'
  | 'Temporária'
  | 'Baixada'
  | 'Suspensa'
  | string;

export type TipoSignatarioNotificado = 
  | 'RT' 
  | 'PROPRIETARIO' 
  | 'GERENTE' 
  | 'FUNCIONARIO' 
  | 'OUTRO' 
  | string;

export type CategoriaCadastroBasico = 
  | 'TIPO_PROFISSIONAL'
  | 'HABILITACAO'
  | 'SITUACAO_PROFISSIONAL'
  | 'TIPO_EMPRESA'
  | 'SITUACAO_EMPRESA'
  | 'MUNICIPIO'
  | 'NATUREZA_ATIVIDADE'
  | 'SITUACAO_VINCULO'
  | 'TIPO_REQUERIMENTO_PROTOCOLO'
  | 'SETOR_PROTOCOLO'
  | 'STATUS_PROTOCOLO';

export interface ItemCadastroBasico {
  id: string;
  categoria: CategoriaCadastroBasico;
  nome: string;
  codigo?: string;
  descricao?: string;
  ativo: boolean;
  ordem?: number;
}

export type TipoExigenciaAssistencia = 'ASSISTENCIA_PLENA' | 'HORAS_DIARIAS' | 'HORAS_SEMANAIS' | 'SEM_HORA_DEFINIDA';

export interface RegraAssistenciaFarmaceutica {
  id: string;
  municipio: string;
  tipoEstabelecimento: string;
  tipoExigencia: TipoExigenciaAssistencia;
  horasMinimas: number;
  descricao?: string;
  baseLegal?: string;
  ativo: boolean;
}

export interface HorarioFuncionamentoItem {
  dia: 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo' | 'Feriados' | string;
  ativo: boolean;
  inicio1: string;
  fim1: string;
  inicio2?: string;
  fim2?: string;
  totalHorasDia?: number;
}

export interface HorarioAssistenciaItem {
  dia: 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo' | 'Feriados' | string;
  ativo: boolean;
  inicio1: string;
  fim1: string;
  inicio2?: string;
  fim2?: string;
  profissionalNome?: string;
  profissionalInscricao?: string;
  totalHorasDia?: number;
}

export interface Socio {
  nome: string;
  cpf: string;
  rg?: string;
  participacaoPct: number;
  tipo: 'Administrador' | 'Cotista' | 'Investidor' | string;
}

export interface HorarioTrabalhoRT {
  dia: 'Domingo' | 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Feriados' | string;
  ativo?: boolean;
  inicio1: string;
  fim1: string;
  inicio2?: string;
  fim2?: string;
  totalHorasDia?: number;
}

export interface ResponsavelTecnico {
  profissionalId: string;
  profissionalInscricao: string;
  profissionalNome: string;
  tipo?: 'F' | 'O' | string; // F = Farmacêutico
  cargo: 'RESPONSÁVEL TÉCNICO' | 'RT PRINCIPAL' | 'RT SUBSTITUTO' | 'RT ASSISTENTE' | 'RT PLANTONISTA' | string;
  situacaoVinculo?: 'CTPS' | 'CONTRATO SOCIAL' | 'PRESTADOR DE SERVIÇOS' | 'ESTATUTÁRIO' | string;
  dataInicio: string;
  cargaHorariaSemanal: number;
  horarios?: HorarioTrabalhoRT[];
}

export interface Profissional {
  id: string;
  inscricao: string;
  nome: string;
  cpf: string;
  rg: string;
  orgaoExpeditor: string;
  dataNascimento: string;
  sexo: 'M' | 'F' | 'Outro';
  nacionalidade: string;
  naturalidade: string;
  nomeMae: string;
  nomePai?: string;
  situacao: SituacaoProfissional;
  tipoAssociado: TipoAssociado;
  habilitacoes?: string[];
  dataInscricao: string;
  dataColacaoGrau: string;
  dataExpDiploma: string;
  faculdade: string;
  emailComercial: string;
  emailPessoal: string;
  telefone: string;
  celular: string;
  endereco: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  statusFinanceiro?: 'Adimplente' | 'Inadimplente' | 'Isento' | 'Parcelamento' | string;
  carteiraProfissional?: string;
  fotoUrl?: string;
  observacoes?: string;
}

export interface Empresa {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  inscricao: string;
  inscricaoEstadual?: string;
  categoria: string;
  tipoEstabelecimento: string;
  naturezaAtividade?: string;
  tipoEmpresa: TipoEmpresa;
  condicao: CondicaoFirma;
  situacao: SituacaoFirma;
  capitalSocial?: number;
  assistenciaPlena: boolean;
  dataInscricao: string;
  validadeCRT?: string;
  numeroCRT?: string;
  numeroProcesso?: string;
  endereco: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  rota?: string;
  area?: string;
  telefone: string;
  email: string;
  socios?: Socio[];
  responsaveisTecnicos?: ResponsavelTecnico[];
  statusFinanceiro?: 'Adimplente' | 'Inadimplente' | 'Em Cobrança' | string;
  latitude?: number;
  longitude?: number;
  ultimaFiscalizacao?: string;
  resultadoUltimaFiscalizacao?: 'Regular' | 'Notificado' | 'Autuado' | string;
  horariosFuncionamento?: HorarioFuncionamentoItem[];
  horariosAssistencia?: HorarioAssistenciaItem[];
  cargaHorariaFuncionamentoSemanal?: number;
  cargaHorariaAssistenciaSemanal?: number;
  justificativaCondicao?: string;
  regraAssistenciaAplicada?: string;
}

export interface LancamentoFinanceiro {
  id: string;
  targetId: string;
  targetTipo: 'PROFISSIONAL' | 'EMPRESA';
  targetNome: string;
  targetDoc: string;
  targetInscricao: string;
  descricao: string;
  tipo: 'Anuidade' | 'Taxa ART' | 'Taxa CRT' | 'Taxa Inscrição' | 'Auto de Multa' | 'Certidão' | 'Parcelamento' | string;
  exercicio: number;
  parcela?: string;
  valorOriginal: number;
  desconto: number;
  jurosMulta: number;
  valorTotal: number;
  dataEmissao: string;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'Pendente' | 'Pago' | 'Vencido' | 'Cancelado' | 'Parcelado' | 'Em Cobrança Judicial' | string;
  codigoBarras: string;
  linhaDigitavel: string;
  pixCopiaECola: string;
}

export interface ProcessoCobranca {
  id: string;
  targetId: string;
  targetTipo: 'PROFISSIONAL' | 'EMPRESA';
  targetNome: string;
  targetDoc: string;
  targetInscricao: string;
  valorTotalDebito: number;
  qtdLancamentos: number;
  faseCobranca: 'Notificação Amigável' | 'Carta de 30 Dias' | 'Notificação Extrajudicial' | 'Inscrição Dívida Ativa' | 'Protesto em Cartório' | 'Execução Fiscal' | string;
  dataInicio: string;
  dataUltimaNotificacao: string;
  dataLimiteDefesa: string;
  numeroCDA?: string;
  livroCDA?: string;
  folhaCDA?: string;
  dataCDA?: string;
  statusAcordo: 'Sem Acordo' | 'Acordo Solicitado' | 'Acordo Firmado' | 'Acordo Rompido' | string;
  parcelasAcordo?: number;
  valorParcelaAcordo?: number;
  historicoNotificacoes: {
    data: string;
    tipo: string;
    descricao: string;
    usuario: string;
  }[];
}

export interface TermoFiscalizacao {
  id: string;
  numeroTermo: string;
  numeroAutoInfracao?: string;
  tipoTermo?: string;
  tipoVisita?: string;
  empresaId: string;
  empresaInscricao?: string;
  empresaRazaoSocial?: string;
  empresaNome?: string;
  empresaCnpj?: string;
  cnpj?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  dataFiscalizacao?: string;
  horaFiscalizacao?: string;
  dataHora?: string;
  fiscalId?: string;
  fiscalNome?: string;
  fiscalMatricula?: string;
  matriculaFiscal?: string;
  fiscalAssinanteNome?: string;
  fiscalAssinanteMatricula?: string;
  latitude: number;
  longitude: number;
  enderecoGeo?: string;
  presencaRT?: boolean;
  rtPresente?: boolean;
  rtNomePresente?: string;
  rtPresenteNome?: string;
  rtCrfPresente?: string;
  rtPresenteInscricao?: string;
  motivoAusenciaRT?: string;
  documentosVerificados?: {
    crtAfixada?: boolean;
    manualBoasPraticas?: boolean;
    livroControlados?: boolean;
    autorizacaoAnvisa?: boolean;
    alvaraSanitario?: boolean;
    licencaAmbiental?: boolean;
    [key: string]: boolean | undefined;
  };
  relatoFiscal?: string;
  irregularidadesConstatadas?: string[];
  infracoesIdentificadas?: string[];
  artigosIncorridos?: string[];
  autoInfracaoGerado?: boolean;
  valorMultaPrevisto?: number;
  orientacoesFiscais?: string;
  observacoesNotificado?: string;
  prazoRegularizacaoDias?: number;
  notificacaoPrazoDias?: number;
  status?: string;
  statusSincronizacao?: string;
  assinaturaFiscal?: string;
  assinaturaFiscalDataHora?: string;
  assinaturaResponsavel?: string;
  assinaturaNotificado?: string;
  assinaturaNotificadoDataHora?: string;
  recusaAssinatura?: boolean;
  motivoRecusa?: string;
  tipoSignatarioNotificado?: string;
  nomeSignatarioNotificado?: string;
  documentoSignatarioNotificado?: string;
  inscricaoSignatarioNotificado?: string;
  cargoSignatarioNotificado?: string;
  motivoAssinaturaTerceiro?: string;
  hashValidacaoDigital?: string;
  fotosComprovantes?: string[];
  fotoEvidencias?: string[];
  sincronizado?: boolean;
}

export interface RelatorioFiltro {
  tipo: 'profissionais' | 'empresas' | 'financeiro' | 'fiscalizacao' | 'juridico';
  dataInicio?: string;
  dataFim?: string;
  situacao?: string;
  categoria?: string;
  municipio?: string;
  formato: 'PDF' | 'EXCEL' | 'CSV';
}

export interface ProtocoloProcesso {
  id: string;
  numeroProtocolo: string;
  tipo: string;
  interessado: string;
  documentoInteressado: string;
  dataInscricao: string;
  dataAbertura: string;
  dataUltimaAtualizacao: string;
  prazoResposta: string;
  status: 'Em Análise' | 'Aguardando Documentação' | 'Aprovado' | 'Indeferido' | 'Concluído' | string;
  setorAtual: string;
  conselheiroRelator?: string;
  parecerRelator?: string;
  decisaoPlenario?: string;
  anexos: string[];
  historico: {
    data: string;
    setor: string;
    descricao: string;
    responsavel: string;
  }[];
}

export interface FormFieldConfig {
  id: string;
  label: string;
  tipo: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'file' | 'signature' | 'gps' | 'cpf_cnpj' | string;
  obrigatorio: boolean;
  opcoes?: string[];
  placeholder?: string;
  ajuda?: string;
  larguraCol?: number | string;
}

export type FormularioCampo = FormFieldConfig;

export interface FormularioDinamico {
  id: string;
  titulo: string;
  categoria: string;
  descricao: string;
  publicoAlvo: 'Profissionais' | 'Empresas' | 'Ambos' | 'Cidadão' | 'Fiscais' | 'Público Geral' | string;
  versao: string | number;
  ativo: boolean;
  campos: FormFieldConfig[];
  respostasRecebidas: number;
  dataCriacao: string;
}

export interface RespostaFormulario {
  id: string;
  formularioId: string;
  formularioTitulo: string;
  autorNome: string;
  autorDocumento: string;
  protocoloGerado: string;
  dataEnvio: string;
  respostas?: Record<string, any>;
  dadosCampos?: Record<string, any>;
  status: 'Em Análise' | 'Aprovado' | 'Indeferido' | 'Concluído' | 'Pendente' | string;
}

export interface MicrosservicoStatus {
  id: string;
  nome: string;
  descricao: string;
  rota?: string;
  rotaGateway?: string;
  status: 'ONLINE' | 'DEGRADADO' | 'OFFLINE' | 'HEALTHY' | string;
  versao: string;
  latenciaMediaMs: number;
  uptimePct?: number;
  requisicoesHoje?: number;
  rps?: number;
  cpuPct?: number;
  memoriaPct?: number;
  memoriaMb?: number;
  instanciasAtivas?: number;
  tecnologias?: string[];
  [key: string]: any;
}
