import { 
  Profissional, 
  Empresa, 
  LancamentoFinanceiro, 
  ProcessoCobranca, 
  TermoFiscalizacao, 
  ProtocoloProcesso, 
  FormularioDinamico, 
  MicrosservicoStatus,
  SituacaoProfissional,
  TipoAssociado,
  CondicaoFirma,
  SituacaoFirma
} from '../types';

// Deterministic seed generation helper
function pseudoRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const NOMES_PRIMEIROS = [
  'Carlos', 'Ana', 'Juliana', 'Marcos', 'Lucas', 'Fernanda', 'Rodrigo', 'Patricia',
  'Gustavo', 'Camila', 'Felipe', 'Mariana', 'Thiago', 'Beatriz', 'Diego', 'Larissa',
  'Eduardo', 'Renata', 'Leonardo', 'Bruna', 'Gabriel', 'Aline', 'Rafael', 'Amanda',
  'Bruno', 'Carla', 'Danilo', 'Vanessa', 'Fabio', 'Jessica', 'Alexandre', 'Daniela',
  'Jefferson', 'Leticia', 'Marcelo', 'Tatiane', 'Vinicius', 'Priscila', 'Andre', 'Bianca'
];

const SOBRENOMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
  'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes',
  'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade',
  'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas', 'Cardoso', 'Ramos'
];

const BAIRROS_MANAUS = [
  'Adrianópolis', 'Ponta Negra', 'Centro', 'Flores', 'Parque 10 de Novembro',
  'Aleixo', 'Chapada', 'Dom Pedro', 'São Geraldo', 'Cidade Nova',
  'Nossa Senhora das Graças', 'Tarumã', 'Japiim', 'Coroado', 'Praça 14 de Janeiro'
];

const RUAS = [
  'Av. Djalma Batista', 'Av. Constantino Nery', 'Av. André Araújo', 'Av. das Torres',
  'Rua Maceió', 'Av. Mário Ypiranga', 'Av. Coronel Teixeira', 'Av. Brasil',
  'Rua Recife', 'Av. 7 de Setembro', 'Rua Pará', 'Av. Darcy Vargas'
];

const FACULDADES = [
  'Universidade Federal do Amazonas (UFAM)',
  'Universidade do Estado do Amazonas (UEA)',
  'Centro Universitário do Norte (UniNorte)',
  'Centro Universitário Nilton Lins',
  'Faculdade Metropolitana de Manaus (FAMETRO)',
  'Centro Universitário Fametro'
];

const NOMES_FANTASIA = [
  'Drogaria Santo Remédio', 'Farmácia Pague Menos', 'Drogaria São Paulo',
  'Farmácia Preço Popular', 'Droga Raia', 'FarmaBem Popular',
  'Farmácia Magistral Viva', 'BioFórmula Manipulação', 'Drogarias FarmaVida',
  'Farmácia Central Amazonas', 'Drogaria Econômica', 'Farmácia do Povo',
  'Manipula & Cura Farmácia', 'Distribuidora Farmacêutica Norte',
  'Hospital e Farmácia Samel', 'Laboratório Sabin Análises', 'PharmaCare Manipulação'
];

// Generate single realistic Professional
export function generateSingleProfissional(index: number): Profissional {
  const seed = index + 100;
  const pRand1 = pseudoRandom(seed);
  const pRand2 = pseudoRandom(seed * 2);
  const pRand3 = pseudoRandom(seed * 3);
  const pRand4 = pseudoRandom(seed * 4);

  const nome = `${NOMES_PRIMEIROS[Math.floor(pRand1 * NOMES_PRIMEIROS.length)]} ${SOBRENOMES[Math.floor(pRand2 * SOBRENOMES.length)]} ${SOBRENOMES[Math.floor(pRand3 * SOBRENOMES.length)]}`;
  const inscricaoNum = 1000 + index;
  const inscricao = `CRF-AM ${inscricaoNum}`;
  
  const situacoes: SituacaoProfissional[] = ['Definitivo', 'Definitivo', 'Definitivo', 'Provisório', 'Transferido', 'Jubilado', 'Secundário', 'Suspenso', 'Cancelado', 'Baixado'];
  const situacao = situacoes[Math.floor(pRand4 * situacoes.length)];
  
  const tipos: TipoAssociado[] = ['Farmacêutico', 'Farmacêutico', 'Farmacêutico Bioquímico', 'Técnico em Farmácia', 'Técnico em Análises Clínicas'];
  const tipoAssociado = tipos[Math.floor(pRand1 * tipos.length)];
  
  const sexo = pRand2 > 0.52 ? 'F' : 'M';
  const cpfNum = 10000000000 + (index * 7919) % 89999999999;
  const cpfFormatted = cpfNum.toString().replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  const rgFormatted = `${Math.floor(1000000 + pRand3 * 8999999)}-SSP/AM`;
  
  const anoNasc = 1965 + Math.floor(pRand1 * 35);
  const mesNasc = String(1 + Math.floor(pRand2 * 12)).padStart(2, '0');
  const diaNasc = String(1 + Math.floor(pRand3 * 28)).padStart(2, '0');
  
  const anoInsc = Math.min(2026, anoNasc + 23 + Math.floor(pRand4 * 10));
  const anoColacao = anoInsc;
  
  const faculdade = FACULDADES[Math.floor(pRand1 * FACULDADES.length)];
  const bairro = BAIRROS_MANAUS[Math.floor(pRand3 * BAIRROS_MANAUS.length)];
  const rua = RUAS[Math.floor(pRand4 * RUAS.length)];
  const numEndereco = Math.floor(10 + pRand2 * 900);
  
  const statusFin: Profissional['statusFinanceiro'] = pRand4 > 0.85 ? 'Inadimplente' : (pRand4 > 0.75 ? 'Parcelamento' : 'Adimplente');

  return {
    id: `prof-${index + 1}`,
    inscricao,
    nome,
    cpf: cpfFormatted,
    rg: rgFormatted,
    orgaoExpeditor: 'SSP/AM',
    dataNascimento: `${diaNasc}/${mesNasc}/${anoNasc}`,
    sexo,
    nacionalidade: 'Brasileira',
    naturalidade: 'Manaus - AM',
    nomeMae: `Maria ${SOBRENOMES[Math.floor(pRand3 * SOBRENOMES.length)]} ${SOBRENOMES[Math.floor(pRand1 * SOBRENOMES.length)]}`,
    nomePai: `José ${SOBRENOMES[Math.floor(pRand2 * SOBRENOMES.length)]} ${SOBRENOMES[Math.floor(pRand4 * SOBRENOMES.length)]}`,
    situacao,
    tipoAssociado,
    dataInscricao: `15/03/${anoInsc}`,
    dataColacaoGrau: `20/12/${anoColacao - 1}`,
    dataExpDiploma: `10/02/${anoColacao}`,
    faculdade,
    emailComercial: `${nome.toLowerCase().replace(/\s+/g, '.')}.crf@saude.am.gov.br`,
    emailPessoal: `${nome.toLowerCase().replace(/\s+/g, '')}${anoNasc}@gmail.com`,
    telefone: `(92) 3${Math.floor(100 + pRand1 * 899)}-${Math.floor(1000 + pRand2 * 8999)}`,
    celular: `(92) 98${Math.floor(100 + pRand3 * 899)}-${Math.floor(1000 + pRand4 * 8999)}`,
    endereco: `${rua}, nº ${numEndereco}`,
    complemento: pRand1 > 0.5 ? `Apto ${Math.floor(101 + pRand2 * 400)}` : 'Sala 1',
    bairro,
    cidade: 'Manaus',
    uf: 'AM',
    cep: '69050-000',
    statusFinanceiro: statusFin,
    carteiraProfissional: `CFF-${100000 + index}`,
    fotoUrl: `https://images.unsplash.com/photo-${sexo === 'F' ? '1573496359142-b8d87734a5a2' : '1534528741775-53994a69daeb'}?w=150&auto=format&fit=crop&q=80`
  };
}

// Memory pool of initial detailed professionals for fast rich UI
export const INITIAL_PROFISSIONAIS: Profissional[] = Array.from({ length: 120 }, (_, i) => generateSingleProfissional(i));

// Pre-seeded Rich Companies (PJ)
export const INITIAL_EMPRESAS: Empresa[] = [
  {
    id: 'emp-1',
    cnpj: '04.582.914/0001-82',
    razaoSocial: 'DROGARIA SANTO REMEDIO AMAZONAS LTDA',
    nomeFantasia: 'Drogaria Santo Remédio - Adrianópolis',
    inscricao: 'CRF-AM 0842-PJ',
    inscricaoEstadual: '04.128.491-0',
    categoria: 'Comércio Varejista de Medicamentos',
    tipoEstabelecimento: 'Drogaria',
    naturezaAtividade: 'Dispensação e Aplicação de Injetáveis',
    tipoEmpresa: 'Privado',
    condicao: 'Regular',
    situacao: 'Definitiva',
    capitalSocial: 450000,
    assistenciaPlena: true,
    dataInscricao: '10/04/2012',
    validadeCRT: '31/03/2027',
    numeroProcesso: 'PROT-2024/0912',
    endereco: 'Av. Mario Ypiranga, 1300',
    complemento: 'Loja 01 e 02',
    bairro: 'Adrianópolis',
    cidade: 'Manaus',
    uf: 'AM',
    cep: '69057-002',
    rota: 'Rota Norte 04',
    area: 'Área Fiscal Central II',
    telefone: '(92) 3633-9000',
    email: 'regulacao@santoremedio.com.br',
    socios: [
      { nome: 'Roberto Albuquerque Lima', cpf: '412.890.123-09', participacaoPct: 60, tipo: 'Administrador' },
      { nome: 'Luciana Martins Lima', cpf: '523.901.234-11', participacaoPct: 40, tipo: 'Cotista' }
    ],
    responsaveisTecnicos: [
      {
        profissionalId: 'prof-1',
        profissionalInscricao: 'CRF-AM 1000',
        profissionalNome: 'Dra. Juliana Ribeiro Costa',
        cargo: 'RT Principal',
        situacaoVinculo: 'CTPS',
        dataInicio: '01/02/2020',
        cargaHorariaSemanal: 44,
        horarios: [
          { dia: 'Segunda', inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00' },
          { dia: 'Terça', inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00' },
          { dia: 'Quarta', inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00' },
          { dia: 'Quinta', inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00' },
          { dia: 'Sexta', inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00' },
          { dia: 'Sábado', inicio1: '08:00', fim1: '12:00' }
        ]
      },
      {
        profissionalId: 'prof-4',
        profissionalInscricao: 'CRF-AM 1003',
        profissionalNome: 'Dr. Lucas Ferreira Santos',
        cargo: 'RT Substituto',
        situacaoVinculo: 'PRESTADOR DE SERVIÇOS',
        dataInicio: '15/06/2022',
        cargaHorariaSemanal: 20,
        horarios: [
          { dia: 'Sábado', inicio1: '13:00', fim1: '21:00' },
          { dia: 'Domingo', inicio1: '08:00', fim1: '20:00' }
        ]
      }
    ],
    statusFinanceiro: 'Adimplente',
    latitude: -3.10719,
    longitude: -60.01328,
    horariosFuncionamento: [
      { dia: 'Domingo', ativo: false, inicio1: '', fim1: '', inicio2: '', fim2: '', totalHorasDia: 0 },
      { dia: 'Segunda', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '18:00', totalHorasDia: 9 },
      { dia: 'Terça', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '18:00', totalHorasDia: 9 },
      { dia: 'Quarta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '18:00', totalHorasDia: 9 },
      { dia: 'Quinta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '18:00', totalHorasDia: 9 },
      { dia: 'Sexta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '17:00', totalHorasDia: 8 },
      { dia: 'Sábado', ativo: false, inicio1: '', fim1: '', totalHorasDia: 0 },
      { dia: 'Feriados', ativo: false, inicio1: '', fim1: '', totalHorasDia: 0 }
    ],
    ultimaFiscalizacao: '12/08/2026',
    resultadoUltimaFiscalizacao: 'Regular'
  },
  {
    id: 'emp-2',
    cnpj: '18.940.112/0001-44',
    razaoSocial: 'BIOFORMULA MANIPULACAO E DERMOCOSMETICOS LTDA',
    nomeFantasia: 'BioFórmula Farmácia Magistral',
    inscricao: 'CRF-AM 0612-PJ',
    categoria: 'Farmácia Magistral (Manipulação)',
    tipoEstabelecimento: 'Farmácia de Manipulação',
    naturezaAtividade: 'Manipulação Alopática e Homeopática',
    tipoEmpresa: 'Privado',
    condicao: 'Regular',
    situacao: 'Definitiva',
    capitalSocial: 280000,
    assistenciaPlena: true,
    dataInscricao: '05/08/2016',
    validadeCRT: '31/03/2027',
    numeroProcesso: 'PROT-2023/1844',
    endereco: 'Rua Maceió, 450',
    bairro: 'Nossa Senhora das Graças',
    cidade: 'Manaus',
    uf: 'AM',
    cep: '69053-150',
    rota: 'Rota Centro 01',
    area: 'Área Fiscal Centro I',
    telefone: '(92) 3234-8822',
    email: 'contato@bioformulafarma.com.br',
    socios: [
      { nome: 'Dra. Beatriz Soares Vieira', cpf: '302.119.845-00', participacaoPct: 100, tipo: 'Administrador' }
    ],
    responsaveisTecnicos: [
      {
        profissionalId: 'prof-2',
        profissionalInscricao: 'CRF-AM 1001',
        profissionalNome: 'Dra. Beatriz Soares Vieira',
        cargo: 'RT Principal',
        situacaoVinculo: 'CONTRATO SOCIAL',
        dataInicio: '05/08/2016',
        cargaHorariaSemanal: 44,
        horarios: [
          { dia: 'Segunda', inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '17:00' },
          { dia: 'Terça', inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '17:00' },
          { dia: 'Quarta', inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '17:00' },
          { dia: 'Quinta', inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '17:00' },
          { dia: 'Sexta', inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '17:00' },
          { dia: 'Sábado', inicio1: '08:00', fim1: '12:00' }
        ]
      }
    ],
    statusFinanceiro: 'Adimplente',
    latitude: -3.11892,
    longitude: -60.01944,
    ultimaFiscalizacao: '05/09/2026',
    resultadoUltimaFiscalizacao: 'Regular'
  },
  {
    id: 'emp-3',
    cnpj: '29.340.551/0001-90',
    razaoSocial: 'FARMACIA POPULAR DO NORTE EIRELI',
    nomeFantasia: 'Farmácia Preço Popular - Flores',
    inscricao: 'CRF-AM 1198-PJ',
    categoria: 'Comércio Varejista',
    tipoEstabelecimento: 'Drogaria',
    naturezaAtividade: 'Dispensação de Medicamentos',
    tipoEmpresa: 'Privado',
    condicao: 'Irregular',
    situacao: 'Definitiva',
    capitalSocial: 120000,
    assistenciaPlena: false,
    dataInscricao: '14/11/2021',
    validadeCRT: '15/01/2026',
    numeroProcesso: 'PROT-2025/4410',
    endereco: 'Av. Desembargador João Machado, 890',
    bairro: 'Flores',
    cidade: 'Manaus',
    uf: 'AM',
    cep: '69058-000',
    rota: 'Rota Centro-Oeste 03',
    area: 'Área Fiscal Oeste',
    telefone: '(92) 3648-1120',
    email: 'gerencia@precopopularam.com.br',
    socios: [
      { nome: 'Marcio Fontes Barbosa', cpf: '698.441.229-87', participacaoPct: 100, tipo: 'Administrador' }
    ],
    responsaveisTecnicos: [], // Sem RT ativo no momento!
    statusFinanceiro: 'Inadimplente',
    latitude: -3.07845,
    longitude: -60.02781,
    ultimaFiscalizacao: '10/09/2026',
    resultadoUltimaFiscalizacao: 'Autuado'
  },
  {
    id: 'emp-4',
    cnpj: '06.221.789/0001-33',
    razaoSocial: 'HOSPITAL E MATERNIDADE SAMEL S/A',
    nomeFantasia: 'Farmácia Hospitalar Samel',
    inscricao: 'CRF-AM 0340-PJ',
    categoria: 'Farmácia Hospitalar',
    tipoEstabelecimento: 'Farmácia Hospitalar',
    naturezaAtividade: 'Dispensação Hospitalar e Farmacovigilância',
    tipoEmpresa: 'Privado',
    condicao: 'Regular',
    situacao: 'Definitiva',
    capitalSocial: 12500000,
    assistenciaPlena: true,
    dataInscricao: '20/01/2005',
    validadeCRT: '31/03/2027',
    numeroProcesso: 'PROT-2024/0019',
    endereco: 'Av. Joaquim Nabuco, 1755',
    bairro: 'Centro',
    cidade: 'Manaus',
    uf: 'AM',
    cep: '69020-030',
    rota: 'Rota Centro 01',
    area: 'Área Fiscal Centro I',
    telefone: '(92) 2129-2200',
    email: 'farmacia.central@samel.com.br',
    socios: [
      { nome: 'Luis Alberto Nicolau', cpf: '112.334.556-78', participacaoPct: 50, tipo: 'Administrador' },
      { nome: 'Beto Nicolau', cpf: '223.445.667-89', participacaoPct: 50, tipo: 'Administrador' }
    ],
    responsaveisTecnicos: [
      {
        profissionalId: 'prof-3',
        profissionalInscricao: 'CRF-AM 1002',
        profissionalNome: 'Dr. Carlos Eduardo Martins',
        cargo: 'RT Principal',
        situacaoVinculo: 'ESTATUTÁRIO',
        dataInicio: '10/03/2018',
        cargaHorariaSemanal: 40,
        horarios: [
          { dia: 'Segunda', inicio1: '07:00', fim1: '13:00', inicio2: '14:00', fim2: '16:00' },
          { dia: 'Terça', inicio1: '07:00', fim1: '13:00', inicio2: '14:00', fim2: '16:00' },
          { dia: 'Quarta', inicio1: '07:00', fim1: '13:00', inicio2: '14:00', fim2: '16:00' },
          { dia: 'Quinta', inicio1: '07:00', fim1: '13:00', inicio2: '14:00', fim2: '16:00' },
          { dia: 'Sexta', inicio1: '07:00', fim1: '13:00', inicio2: '14:00', fim2: '16:00' }
        ]
      }
    ],
    statusFinanceiro: 'Adimplente',
    latitude: -3.12567,
    longitude: -60.02112,
    ultimaFiscalizacao: '18/07/2026',
    resultadoUltimaFiscalizacao: 'Regular'
  },
  {
    id: 'emp-5',
    cnpj: '01.992.834/0001-50',
    razaoSocial: 'DISTRIBUIDORA DE PRODUTOS FARMACEUTICOS DA AMAZONIA LTDA',
    nomeFantasia: 'Norte Farma Distribuidora',
    inscricao: 'CRF-AM 0455-PJ',
    categoria: 'Distribuidora de Medicamentos',
    tipoEstabelecimento: 'Distribuidora de Medicamentos',
    naturezaAtividade: 'Armazenamento e Transporte de Medicamentos e Correlatos',
    tipoEmpresa: 'Privado',
    condicao: 'Regular',
    situacao: 'Definitiva',
    capitalSocial: 3200000,
    assistenciaPlena: true,
    dataInscricao: '18/09/2010',
    validadeCRT: '31/03/2027',
    numeroProcesso: 'PROT-2023/1109',
    endereco: 'Av. das Torres, 4500 - Galpão 4',
    bairro: 'Parque 10 de Novembro',
    cidade: 'Manaus',
    uf: 'AM',
    cep: '69055-010',
    rota: 'Rota Leste 02',
    area: 'Área Fiscal Leste',
    telefone: '(92) 3642-7700',
    email: 'diretoria@nortefarmadist.com.br',
    socios: [
      { nome: 'Fernando Albuquerque Costa', cpf: '445.667.889-01', participacaoPct: 70, tipo: 'Administrador' },
      { nome: 'Paula Mendes Costa', cpf: '556.778.990-12', participacaoPct: 30, tipo: 'Cotista' }
    ],
    responsaveisTecnicos: [
      {
        profissionalId: 'prof-5',
        profissionalInscricao: 'CRF-AM 1004',
        profissionalNome: 'Dra. Fernanda Lima Carvalho',
        cargo: 'RT Principal',
        situacaoVinculo: 'CTPS',
        dataInicio: '01/04/2021',
        cargaHorariaSemanal: 44,
        horarios: [
          { dia: 'Segunda', inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '17:00' },
          { dia: 'Terça', inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '17:00' },
          { dia: 'Quarta', inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '17:00' },
          { dia: 'Quinta', inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '17:00' },
          { dia: 'Sexta', inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '17:00' }
        ]
      }
    ],
    statusFinanceiro: 'Adimplente',
    latitude: -3.07211,
    longitude: -59.99341,
    ultimaFiscalizacao: '20/06/2026',
    resultadoUltimaFiscalizacao: 'Regular'
  }
];

// Generate dynamic companies to reach realistic volume (>50 active detailed companies)
for (let i = 6; i <= 60; i++) {
  const seed = i * 47;
  const p1 = pseudoRandom(seed);
  const p2 = pseudoRandom(seed + 1);
  const p3 = pseudoRandom(seed + 2);
  
  const tipoEst = [
    'Drogaria', 'Drogaria', 'Farmácia de Manipulação', 'Farmácia Hospitalar',
    'Laboratório de Análises', 'Distribuidora de Medicamentos', 'Unidade Básica de Saúde'
  ][Math.floor(p1 * 7)] as Empresa['tipoEstabelecimento'];
  
  const bairro = BAIRROS_MANAUS[Math.floor(p2 * BAIRROS_MANAUS.length)];
  const nomeFant = `${NOMES_FANTASIA[Math.floor(p1 * NOMES_FANTASIA.length)]} - ${bairro}`;
  const condicoes: CondicaoFirma[] = ['Regular', 'Regular', 'Regular', 'Irregular', 'Inativa'];
  const condicao = condicoes[Math.floor(p3 * condicoes.length)];
  const inscricao = `CRF-AM ${String(800 + i).padStart(4, '0')}-PJ`;
  
  INITIAL_EMPRESAS.push({
    id: `emp-${i}`,
    cnpj: `${String(10 + (i % 80)).padStart(2, '0')}.${String(100 + i * 7).padStart(3, '0')}.${String(200 + i * 3).padStart(3, '0')}/0001-${String(10 + (i % 89)).padStart(2, '0')}`,
    razaoSocial: `${nomeFant.toUpperCase()} EIRELI`,
    nomeFantasia: nomeFant,
    inscricao,
    inscricaoEstadual: `04.${100000 + i * 111}-1`,
    categoria: tipoEst,
    tipoEstabelecimento: tipoEst,
    naturezaAtividade: 'Atividades de Serviços Farmacêuticos e Saúde',
    tipoEmpresa: p1 > 0.85 ? 'Público' : 'Privado',
    condicao,
    situacao: condicao === 'Inativa' ? 'Baixada' : 'Definitiva',
    capitalSocial: 100000 + Math.floor(p2 * 900000),
    assistenciaPlena: condicao === 'Regular',
    dataInscricao: `12/0${1 + Math.floor(p1 * 9)}/20${15 + (i % 11)}`,
    validadeCRT: condicao === 'Regular' ? '31/03/2027' : '15/02/2026',
    numeroProcesso: `PROT-2024/${1000 + i}`,
    endereco: `${RUAS[Math.floor(p3 * RUAS.length)]}, ${100 + i * 12}`,
    bairro,
    cidade: 'Manaus',
    uf: 'AM',
    cep: '69050-000',
    rota: `Rota ${['Norte', 'Sul', 'Centro', 'Leste', 'Oeste'][i % 5]} 0${1 + (i % 4)}`,
    area: `Área Fiscal ${['Centro', 'Norte', 'Leste', 'Oeste'][i % 4]}`,
    telefone: `(92) 36${String(10 + (i % 80)).padStart(2, '0')}-${String(1000 + i * 23).slice(-4)}`,
    email: `contato@empresa${i}.com.br`,
    socios: [
      { nome: `Sócio ${NOMES_PRIMEIROS[i % NOMES_PRIMEIROS.length]} ${SOBRENOMES[i % SOBRENOMES.length]}`, cpf: `7${String(i).padStart(2, '0')}.890.123-00`, participacaoPct: 100, tipo: 'Administrador' }
    ],
    horariosFuncionamento: [
      { dia: 'Domingo', ativo: false, inicio1: '', fim1: '', inicio2: '', fim2: '', totalHorasDia: 0 },
      { dia: 'Segunda', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '18:00', totalHorasDia: 9 },
      { dia: 'Terça', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '18:00', totalHorasDia: 9 },
      { dia: 'Quarta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '18:00', totalHorasDia: 9 },
      { dia: 'Quinta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '18:00', totalHorasDia: 9 },
      { dia: 'Sexta', ativo: true, inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '17:00', totalHorasDia: 8 },
      { dia: 'Sábado', ativo: false, inicio1: '', fim1: '', totalHorasDia: 0 },
      { dia: 'Feriados', ativo: false, inicio1: '', fim1: '', totalHorasDia: 0 }
    ],
    responsaveisTecnicos: condicao === 'Regular' ? [
      {
        profissionalId: `prof-${i}`,
        profissionalInscricao: `CRF-AM ${1000 + i}`,
        profissionalNome: `Dr(a). ${NOMES_PRIMEIROS[i % NOMES_PRIMEIROS.length]} ${SOBRENOMES[(i * 2) % SOBRENOMES.length]}`,
        cargo: 'RT Principal',
        situacaoVinculo: (['CTPS', 'CONTRATO SOCIAL', 'PRESTADOR DE SERVIÇOS', 'ESTATUTÁRIO'] as const)[i % 4],
        dataInicio: '01/01/2023',
        cargaHorariaSemanal: 40,
        horarios: [
          { dia: 'Segunda', inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '17:00' },
          { dia: 'Terça', inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '17:00' },
          { dia: 'Quarta', inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '17:00' },
          { dia: 'Quinta', inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '17:00' },
          { dia: 'Sexta', inicio1: '08:00', fim1: '12:00', inicio2: '13:00', fim2: '17:00' }
        ]
      }
    ] : [],
    statusFinanceiro: condicao === 'Regular' ? 'Adimplente' : 'Inadimplente',
    latitude: -3.10000 + (p1 - 0.5) * 0.08,
    longitude: -60.02000 + (p2 - 0.5) * 0.08,
    ultimaFiscalizacao: `${10 + (i % 18)}/0${1 + (i % 8)}/2026`,
    resultadoUltimaFiscalizacao: condicao === 'Regular' ? 'Regular' : (condicao === 'Irregular' ? 'Autuado' : 'Notificado')
  });
}

// Pre-seeded Financial Transactions
export const INITIAL_LANCAMENTOS: LancamentoFinanceiro[] = [
  {
    id: 'lan-1',
    targetId: 'prof-1',
    targetTipo: 'PROFISSIONAL',
    targetNome: 'Dra. Juliana Ribeiro Costa',
    targetDoc: '412.890.123-09',
    targetInscricao: 'CRF-AM 1000',
    descricao: 'Anuidade Exercício 2026 - Farmacêutico',
    tipo: 'Anuidade',
    exercicio: 2026,
    parcela: 'Cota Única',
    valorOriginal: 645.80,
    desconto: 64.58,
    jurosMulta: 0,
    valorTotal: 581.22,
    dataEmissao: '05/01/2026',
    dataVencimento: '31/03/2026',
    dataPagamento: '28/02/2026',
    status: 'Pago',
    codigoBarras: '00190000090123456789012345678901234567890123',
    linhaDigitavel: '00190.00009 01234.567890 12345.678901 2 96780000058122',
    pixCopiaECola: '00020126580014br.gov.bcb.pix0136crfam-financeiro-pix-key-20265204000053039865405581.225802BR5915CRF AMAZONAS6006MANAUS62070503***6304E8A1'
  },
  {
    id: 'lan-2',
    targetId: 'emp-1',
    targetTipo: 'EMPRESA',
    targetNome: 'DROGARIA SANTO REMEDIO AMAZONAS LTDA',
    targetDoc: '04.582.914/0001-82',
    targetInscricao: 'CRF-AM 0842-PJ',
    descricao: 'Anuidade PJ 2026 - Faixa Capital R$ 450k',
    tipo: 'Anuidade',
    exercicio: 2026,
    parcela: 'Cota Única',
    valorOriginal: 1890.40,
    desconto: 0,
    jurosMulta: 0,
    valorTotal: 1890.40,
    dataEmissao: '05/01/2026',
    dataVencimento: '31/03/2026',
    dataPagamento: '15/03/2026',
    status: 'Pago',
    codigoBarras: '00190000090123456789012345678901234567890124',
    linhaDigitavel: '00190.00009 01234.567890 12345.678901 3 96780000189040',
    pixCopiaECola: '00020126580014br.gov.bcb.pix0136crfam-financeiro-pix-key-202652040000530398654061890.405802BR5915CRF AMAZONAS6006MANAUS62070503***6304A7B2'
  },
  {
    id: 'lan-3',
    targetId: 'emp-3',
    targetTipo: 'EMPRESA',
    targetNome: 'FARMACIA POPULAR DO NORTE EIRELI',
    targetDoc: '29.340.551/0001-90',
    targetInscricao: 'CRF-AM 1198-PJ',
    descricao: 'Auto de Multa Fiscal nº 2025/0894 - Ausência de RT',
    tipo: 'Auto de Multa',
    exercicio: 2025,
    parcela: '1/1',
    valorOriginal: 3450.00,
    desconto: 0,
    jurosMulta: 690.00,
    valorTotal: 4140.00,
    dataEmissao: '15/10/2025',
    dataVencimento: '15/11/2025',
    status: 'Vencido',
    codigoBarras: '00190000090123456789012345678901234567890125',
    linhaDigitavel: '00190.00009 01234.567890 12345.678901 4 96780000414000',
    pixCopiaECola: '00020126580014br.gov.bcb.pix0136crfam-financeiro-pix-key-202652040000530398654064140.005802BR5915CRF AMAZONAS6006MANAUS62070503***6304F19C'
  },
  {
    id: 'lan-4',
    targetId: 'emp-3',
    targetTipo: 'EMPRESA',
    targetNome: 'FARMACIA POPULAR DO NORTE EIRELI',
    targetDoc: '29.340.551/0001-90',
    targetInscricao: 'CRF-AM 1198-PJ',
    descricao: 'Anuidade PJ 2025 - Vencida',
    tipo: 'Anuidade',
    exercicio: 2025,
    parcela: 'Cota Única',
    valorOriginal: 1240.00,
    desconto: 0,
    jurosMulta: 320.00,
    valorTotal: 1560.00,
    dataEmissao: '10/01/2025',
    dataVencimento: '31/03/2025',
    status: 'Em Cobrança Judicial',
    codigoBarras: '00190000090123456789012345678901234567890126',
    linhaDigitavel: '00190.00009 01234.567890 12345.678901 5 96780000156000',
    pixCopiaECola: '00020126580014br.gov.bcb.pix0136crfam-financeiro-pix-key-202652040000530398654061560.005802BR5915CRF AMAZONAS6006MANAUS62070503***6304C441'
  },
  {
    id: 'lan-5',
    targetId: 'prof-8',
    targetTipo: 'PROFISSIONAL',
    targetNome: 'Dr. Gustavo Barbosa Lima',
    targetDoc: '512.334.889-10',
    targetInscricao: 'CRF-AM 1007',
    descricao: 'Anuidade Exercício 2026 - Pendente',
    tipo: 'Anuidade',
    exercicio: 2026,
    parcela: 'Cota Única',
    valorOriginal: 645.80,
    desconto: 0,
    jurosMulta: 0,
    valorTotal: 645.80,
    dataEmissao: '05/01/2026',
    dataVencimento: '31/03/2026',
    status: 'Pendente',
    codigoBarras: '00190000090123456789012345678901234567890127',
    linhaDigitavel: '00190.00009 01234.567890 12345.678901 6 96780000064580',
    pixCopiaECola: '00020126580014br.gov.bcb.pix0136crfam-financeiro-pix-key-20265204000053039865405645.805802BR5915CRF AMAZONAS6006MANAUS62070503***6304D1E3'
  }
];

// Pre-seeded Cobrança e Execução Extrajudicial Processes
export const INITIAL_COBRANCAS: ProcessoCobranca[] = [
  {
    id: 'cob-1',
    targetId: 'emp-3',
    targetTipo: 'EMPRESA',
    targetNome: 'FARMACIA POPULAR DO NORTE EIRELI',
    targetDoc: '29.340.551/0001-90',
    targetInscricao: 'CRF-AM 1198-PJ',
    valorTotalDebito: 5700.00,
    qtdLancamentos: 2,
    faseCobranca: 'Inscrição Dívida Ativa',
    dataInicio: '10/06/2025',
    dataUltimaNotificacao: '15/08/2026',
    dataLimiteDefesa: '15/09/2026',
    numeroCDA: 'CDA-2026/0419',
    livroCDA: 'Livro 18-A',
    folhaCDA: 'Fls. 142',
    dataCDA: '20/08/2026',
    statusAcordo: 'Sem Acordo',
    historicoNotificacoes: [
      { data: '15/06/2025', tipo: 'Carta de 30 Dias', descricao: 'Notificação amigável de débito enviada via AR e Domicílio Eletrônico', usuario: 'Setor de Cobrança' },
      { data: '20/08/2025', tipo: 'Notificação Extrajudicial', descricao: 'Notificação com prazo de 15 dias sob pena de CDA e Protesto', usuario: 'Assessoria Jurídica' },
      { data: '20/08/2026', tipo: 'Inscrição em Dívida Ativa', descricao: 'Lavratura da CDA nº 2026/0419 no Livro 18-A Fls. 142', usuario: 'Procuradoria Jurídica' }
    ]
  },
  {
    id: 'cob-2',
    targetId: 'emp-14',
    targetTipo: 'EMPRESA',
    targetNome: 'DROGARIA FLORESTA LTDA',
    targetDoc: '15.441.902/0001-22',
    targetInscricao: 'CRF-AM 0910-PJ',
    valorTotalDebito: 8420.00,
    qtdLancamentos: 3,
    faseCobranca: 'Execução Fiscal',
    dataInicio: '14/01/2025',
    dataUltimaNotificacao: '01/07/2026',
    dataLimiteDefesa: '01/08/2026',
    numeroCDA: 'CDA-2025/1102',
    livroCDA: 'Livro 17',
    folhaCDA: 'Fls. 88',
    dataCDA: '15/03/2025',
    statusAcordo: 'Acordo Firmado',
    parcelasAcordo: 12,
    valorParcelaAcordo: 701.66,
    historicoNotificacoes: [
      { data: '15/03/2025', tipo: 'Inscrição em Dívida Ativa', descricao: 'CDA lavrada para cobrança executiva', usuario: 'Procuradoria' },
      { data: '10/05/2025', tipo: 'Protesto em Cartório', descricao: 'Apontamento de CDA no 2º Ofício de Protestos de Manaus', usuario: 'Setor de Cobrança' },
      { data: '05/08/2026', tipo: 'Acordo Refis', descricao: 'Termo de Parcelamento homologado em 12 parcelas', usuario: 'Diretoria Financeira' }
    ]
  }
];

// Pre-seeded Field Inspection Records (Termos de Fiscalização)
export const INITIAL_TERMOS_FISCALIZACAO: TermoFiscalizacao[] = [
  {
    id: 'term-1',
    numeroTermo: 'TV-2026/0451',
    empresaId: 'emp-1',
    empresaNome: 'Drogaria Santo Remédio - Adrianópolis',
    cnpj: '04.582.914/0001-82',
    endereco: 'Av. Mario Ypiranga, 1300 - Adrianópolis',
    bairro: 'Adrianópolis',
    cidade: 'Manaus',
    fiscalId: 'fisc-01',
    fiscalNome: 'Dr. Valdir M. Albuquerque',
    matriculaFiscal: 'FISC-0442',
    dataHora: '21/09/2026 09:30',
    tipoVisita: 'Rotina',
    presencaRT: true,
    rtPresenteNome: 'Dra. Juliana Ribeiro Costa',
    rtPresenteInscricao: 'CRF-AM 1000',
    documentosVerificados: {
      crtAfixada: true,
      licencaSanitariaVigente: true,
      sngpcRegular: true,
      livroPsicotropicos: true,
      escalaHorariosVisivel: true
    },
    infracoesIdentificadas: [],
    autoInfracaoGerado: false,
    relatoFiscal: 'Estabelecimento em plena conformidade sanitária e profissional. Farmacêutica Responsável Técnica presente cumprindo horário regulamentar declarado na CRT. Livro SNGPC devidamente escriturado.',
    fotoEvidencias: ['https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&auto=format&fit=crop&q=80'],
    assinaturaFiscal: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10 25 Q 30 5, 50 25 T 90 20" stroke="black" fill="transparent"/></svg>',
    assinaturaNotificado: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10 20 Q 40 35, 70 15 T 95 30" stroke="blue" fill="transparent"/></svg>',
    latitude: -3.10719,
    longitude: -60.01328,
    statusSincronizacao: 'Sincronizado'
  },
  {
    id: 'term-2',
    numeroTermo: 'TV-2026/0452',
    empresaId: 'emp-3',
    empresaNome: 'Farmácia Preço Popular - Flores',
    cnpj: '29.340.551/0001-90',
    endereco: 'Av. Desembargador João Machado, 890 - Flores',
    bairro: 'Flores',
    cidade: 'Manaus',
    fiscalId: 'fisc-01',
    fiscalNome: 'Dr. Valdir M. Albuquerque',
    matriculaFiscal: 'FISC-0442',
    dataHora: '21/09/2026 10:45',
    tipoVisita: 'Denúncia',
    presencaRT: false,
    motivoAusenciaRT: 'Ausência sem substituto legal; atendente alegou que farmacêutico estava em intervalo não previsto.',
    documentosVerificados: {
      crtAfixada: false,
      licencaSanitariaVigente: true,
      sngpcRegular: false,
      livroPsicotropicos: false,
      escalaHorariosVisivel: false
    },
    infracoesIdentificadas: [
      'Ausência de Responsável Técnico no horário obrigatório (Lei 13.021/2014, Art. 5º e 6º)',
      'Certidão de Regularidade Técnica (CRT) vencida e não afixada em local visível ao público',
      'Desconformidade na escrituração de antimicrobianos e medicamentos de controle especial'
    ],
    autoInfracaoGerado: true,
    numeroAutoInfracao: 'AI-2026/0189',
    artigosIncorridos: ['Lei 3.820/60 Art. 24', 'Lei 13.021/14 Art. 5º, 6º', 'Resolução CFF 700/21'],
    valorMultaPrevisto: 4200.00,
    notificacaoPrazoDias: 30,
    relatoFiscal: 'Em inspeção fiscal motivada por denúncia de funcionamento sem assistência farmacêutica, constatou-se que o estabelecimento encontrava-se aberto ao público comercializando medicamentos sem a presença de farmacêutico habilitado. Lavrado Auto de Infração e Notificação de 30 dias para regularização da RT.',
    fotoEvidencias: ['https://images.unsplash.com/photo-1586015555751-63c230676fa1?w=300&auto=format&fit=crop&q=80'],
    latitude: -3.07845,
    longitude: -60.02781,
    statusSincronizacao: 'Sincronizado'
  }
];

// Pre-seeded Protocols & Processes
export const INITIAL_PROTOCOLOS: ProtocoloProcesso[] = [
  {
    id: 'prot-1',
    numeroProtocolo: 'PROT-2026/08901',
    tipo: 'Renovação de Certidão de Regularidade (CRT)',
    interessado: 'Drogaria Santo Remédio - Adrianópolis',
    documentoInteressado: '04.582.914/0001-82',
    dataInscricao: '10/04/2012',
    dataAbertura: '15/09/2026',
    dataUltimaAtualizacao: '19/09/2026',
    prazoResposta: '30/09/2026',
    status: 'Em Análise',
    setorAtual: 'Secretaria Geral',
    conselheiroRelator: 'Dra. Tatiana Medeiros (Conselheira Efetiva)',
    anexos: ['Contrato_Social_Atualizado.pdf', 'Comprovante_Taxa_CRT.pdf'],
    historico: [
      { data: '15/09/2026 14:20', setor: 'Protocolo Central', descricao: 'Protocolo aberto digitalmente pela empresa', responsavel: 'Sistema Automático' },
      { data: '16/09/2026 09:10', setor: 'Secretaria Geral', descricao: 'Triagem de documentos concluída com sucesso', responsavel: 'Aline Mendonça' },
      { data: '19/09/2026 11:30', setor: 'Secretaria Geral', descricao: 'Distribuído ao Conselheiro Relator para parecer', responsavel: 'Secretaria Geral' }
    ]
  },
  {
    id: 'prot-2',
    numeroProtocolo: 'PROT-2026/08740',
    tipo: 'Assunção / Baixa de Responsabilidade Técnica (RT)',
    interessado: 'Dr. Lucas Ferreira Santos (CRF-AM 1003)',
    documentoInteressado: '512.980.123-44',
    dataInscricao: '15/03/2022',
    dataAbertura: '10/09/2026',
    dataUltimaAtualizacao: '18/09/2026',
    prazoResposta: '25/09/2026',
    status: 'Deferido / Aprovado',
    setorAtual: 'Departamento de Fiscalização (DEFIS)',
    conselheiroRelator: 'Dr. Marcelo Paiva (Conselheiro)',
    parecerRelator: 'Parecer FAVORÁVEL: O profissional cumpre todos os requisitos éticos e horários compatíveis.',
    decisaoPlenario: 'Deferido por unanimidade na 480ª Sessão Plenária Ordinária.',
    anexos: ['Declaracao_Horario_RT.pdf', 'Contrato_Trabalho_CTPS.pdf'],
    historico: [
      { data: '10/09/2026 10:00', setor: 'Protocolo Central', descricao: 'Requerimento de assunção de RT submetido', responsavel: 'Dr. Lucas F. Santos' },
      { data: '14/09/2026 15:40', setor: 'Departamento de Fiscalização (DEFIS)', descricao: 'Análise de compatibilidade de horário aprovada', responsavel: 'Coordenação Fiscal' },
      { data: '18/09/2026 17:00', setor: 'Plenário / Diretoria', descricao: 'Homologação plenária concedida', responsavel: 'Presidente do Conselho' }
    ]
  }
];

// Pre-seeded Dynamic Forms
export const INITIAL_DYNAMIC_FORMS: FormularioDinamico[] = [
  {
    id: 'form-1',
    titulo: 'Requerimento de Assunção de Responsabilidade Técnica (RT)',
    descricao: 'Formulário oficial para profissional declarar assunção de RT em estabelecimento farmacêutico com horários de trabalho e ciência das obrigações da Lei 13.021/14.',
    categoria: 'Responsabilidade Técnica',
    publicoAlvo: 'Profissionais',
    ativo: true,
    dataCriacao: '10/01/2026',
    versao: 2,
    respostasRecebidas: 148,
    campos: [
      { id: 'f1_empresa_cnpj', label: 'CNPJ do Estabelecimento', tipo: 'cpf_cnpj', obrigatorio: true, larguraCol: '6', placeholder: '00.000.000/0000-00' },
      { id: 'f1_empresa_nome', label: 'Razão Social / Nome Fantasia', tipo: 'text', obrigatorio: true, larguraCol: '6', placeholder: 'Ex: Drogaria Popular Ltda' },
      { id: 'f1_cargo_rt', label: 'Cargo de Responsabilidade', tipo: 'select', obrigatorio: true, larguraCol: '4', opcoes: ['RT Principal', 'RT Substituto', 'RT Assistente'] },
      { id: 'f1_ch_semanal', label: 'Carga Horária Semanal (Horas)', tipo: 'number', obrigatorio: true, larguraCol: '4', placeholder: 'Ex: 40' },
      { id: 'f1_data_inicio', label: 'Data Início das Atividades', tipo: 'date', obrigatorio: true, larguraCol: '4' },
      { id: 'f1_escala_detalhada', label: 'Quadro Detalhado de Horários (Seg a Dom)', tipo: 'textarea', obrigatorio: true, larguraCol: '12', placeholder: 'Ex: Seg a Sex: 08h às 12h e 14h às 18h | Sáb: 08h às 12h' },
      { id: 'f1_outros_vinculos', label: 'Possui outro vínculo profissional ativo?', tipo: 'checkbox', obrigatorio: false, larguraCol: '6' },
      { id: 'f1_comprovante_ctps', label: 'Anexo de CTPS ou Contrato Social / Prestação de Serviço', tipo: 'file', obrigatorio: true, larguraCol: '6' },
      { id: 'f1_assinatura_digital', label: 'Assinatura Digital do Profissional', tipo: 'signature', obrigatorio: true, larguraCol: '12' }
    ]
  },
  {
    id: 'form-2',
    titulo: 'Auto de Vistoria e Fiscalização Especial em Campo',
    descricao: 'Formulário dinâmico utilizado pelos fiscais em tablets com captura de geolocalização e fotos.',
    categoria: 'Fiscalização',
    publicoAlvo: 'Fiscais',
    ativo: true,
    dataCriacao: '01/02/2026',
    versao: 1,
    respostasRecebidas: 532,
    campos: [
      { id: 'f2_gps', label: 'Coordenadas GPS no Local', tipo: 'gps', obrigatorio: true, larguraCol: '6' },
      { id: 'f2_tipo_visita', label: 'Tipo de Fiscalização', tipo: 'select', obrigatorio: true, larguraCol: '6', opcoes: ['Rotina Periódica', 'Denúncia do Cidadão', 'Reinspeção de Notificação', 'Abertura de Estabelecimento'] },
      { id: 'f2_rt_presente', label: 'O Farmacêutico RT está presente no ato?', tipo: 'checkbox', obrigatorio: false, larguraCol: '6' },
      { id: 'f2_nome_atendente', label: 'Nome do Responsável / Atendente Presente', tipo: 'text', obrigatorio: true, larguraCol: '6' },
      { id: 'f2_relato_fiscal', label: 'Descrição Circunstanciada das Condições Sanitárias', tipo: 'textarea', obrigatorio: true, larguraCol: '12' },
      { id: 'f2_anexo_fotos', label: 'Fotografias das Instalações e CRT Afixada', tipo: 'file', obrigatorio: false, larguraCol: '12' },
      { id: 'f2_assinatura', label: 'Assinatura do Notificado no Local', tipo: 'signature', obrigatorio: true, larguraCol: '12' }
    ]
  }
];

// Pre-seeded Microservices Topology Status
export const INITIAL_MICROSERVICES: MicrosservicoStatus[] = [
  {
    id: 'ms-gateway',
    nome: 'API Gateway & Security Hub',
    descricao: 'Roteamento reverso, balanceamento L7, autenticação JWT/OAuth2 e rate limiting.',
    rotaGateway: '/api/v1/*',
    versao: 'v2.4.1',
    status: 'HEALTHY',
    rps: 1240,
    latenciaMediaMs: 4.2,
    cpuPct: 18,
    memoriaMb: 256,
    instanciasAtivas: 4,
    tecnologias: ['Express', 'Node.js 22', 'Redis Cluster', 'Nginx Proxy']
  },
  {
    id: 'ms-registry',
    nome: 'Member & Company Registry Microservice',
    descricao: 'Gestão de 10k+ profissionais, 1.2k+ empresas, sócios, vínculos e histórico cadastral.',
    rotaGateway: '/api/v1/cadastros/*',
    versao: 'v3.1.0',
    status: 'HEALTHY',
    rps: 620,
    latenciaMediaMs: 6.8,
    cpuPct: 24,
    memoriaMb: 512,
    instanciasAtivas: 6,
    tecnologias: ['TypeScript', 'Indexed Cache', 'PostgreSQL', 'ElasticSearch']
  },
  {
    id: 'ms-finance',
    nome: 'Billing & Financial Operations Service',
    descricao: 'Emissão de anuidades, taxas, Pix dinâmico (Banco Central), boletos FEBRABAN e conciliação bancária.',
    rotaGateway: '/api/v1/financeiro/*',
    versao: 'v2.8.4',
    status: 'HEALTHY',
    rps: 310,
    latenciaMediaMs: 8.5,
    cpuPct: 15,
    memoriaMb: 384,
    instanciasAtivas: 3,
    tecnologias: ['Node.js', 'Pix Engine', 'Kafka Event Bus', 'Drizzle ORM']
  },
  {
    id: 'ms-legal',
    nome: 'Legal Extrajudicial & Compliance Service',
    descricao: 'Autos de infração, certidões de dívida ativa (CDA), intimações e processos de ética.',
    rotaGateway: '/api/v1/juridico/*',
    versao: 'v1.9.2',
    status: 'HEALTHY',
    rps: 145,
    latenciaMediaMs: 5.1,
    cpuPct: 12,
    memoriaMb: 256,
    instanciasAtivas: 2,
    tecnologias: ['Node.js', 'Digital Signature Engine', 'PDF Generation Worker']
  },
  {
    id: 'ms-field',
    nome: 'Field Inspection & GPS Sync Engine',
    descricao: 'Sincronização bidirecional offline, persistência em fila local, geolocalização e check-in.',
    rotaGateway: '/api/v1/fiscalizacao/*',
    versao: 'v2.1.2',
    status: 'HEALTHY',
    rps: 280,
    latenciaMediaMs: 7.0,
    cpuPct: 21,
    memoriaMb: 320,
    instanciasAtivas: 4,
    tecnologias: ['WebSocket', 'IndexedDB Sync', 'GeoJSON Spatial Index', 'PWA Worker']
  },
  {
    id: 'ms-forms',
    nome: 'Dynamic Form Engine & Submissions Service',
    descricao: 'Construtor dinâmico de formulários no-code com schema JSON e workflows de aprovação.',
    rotaGateway: '/api/v1/formularios/*',
    versao: 'v1.5.0',
    status: 'HEALTHY',
    rps: 190,
    latenciaMediaMs: 3.9,
    cpuPct: 10,
    memoriaMb: 192,
    instanciasAtivas: 2,
    tecnologias: ['JSON Schema Engine', 'Node.js', 'Document Storage']
  },
  {
    id: 'ms-bi',
    nome: 'Analytics & Plenary BI Service',
    descricao: 'Processamento analítico em tempo real para relatórios de diretoria e gráficos estatísticos.',
    rotaGateway: '/api/v1/relatorios/*',
    versao: 'v2.0.0',
    status: 'HEALTHY',
    rps: 95,
    latenciaMediaMs: 11.4,
    cpuPct: 32,
    memoriaMb: 768,
    instanciasAtivas: 3,
    tecnologias: ['OLAP Engine', 'Recharts Aggregator', 'Streaming Excel Exporter']
  }
];
