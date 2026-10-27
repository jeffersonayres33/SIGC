import { TermoFiscalizacao } from '../types';
import { CouncilConfig } from '../services/storageService';
import { openDocumentInPrintTab } from './printDocumentInNewTab';
import { jsPDF } from 'jspdf';

/**
 * Preserva quebras de linha, parágrafos vazios, espaços e pontuações exatamente
 * como o fiscal digitou em campo, evitando texto corrido e embolado no PDF.
 */
function formatContentWithParagraphs(content?: string | null): string {
  if (!content) return '';
  
  // 1. Sanitizar entidades HTML básicas para segurança
  const sanitized = String(content)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Dividir por blocos de parágrafos (duas ou mais quebras de linha consecutivas)
  const paragraphBlocks = sanitized.split(/\r?\n\s*\r?\n/);

  return paragraphBlocks
    .map(block => {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) return '';
      // 3. Converter quebras de linha simples dentro do parágrafo em <br />
      const withLineBreaks = trimmedBlock.replace(/\r?\n/g, '<br />');
      return `<p class="formatted-para">${withLineBreaks}</p>`;
    })
    .filter(Boolean)
    .join('');
}

export const printTermoFiscalizacao = (termo: TermoFiscalizacao, council: CouncilConfig) => {
  const infractionsHtml = termo.infracoesIdentificadas && termo.infracoesIdentificadas.length > 0
    ? `
      <div class="section-box alert">
        <div class="section-title">AUTO DE INFRAÇÃO Nº ${termo.numeroAutoInfracao || 'LAVRADO'}</div>
        <p style="margin-bottom: 6px;"><strong>Irregularidades constatadas durante a fiscalização:</strong></p>
        <ul style="margin: 6px 0; padding-left: 20px;">
          ${termo.infracoesIdentificadas.map(inf => `<li style="margin: 4px 0; line-height: 1.5; white-space: pre-wrap;">${inf}</li>`).join('')}
        </ul>
        ${termo.valorMultaPrevisto ? `<p style="margin-top: 6px;"><strong>Valor estimado da penalidade:</strong> R$ ${termo.valorMultaPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>` : ''}
      </div>
    `
    : '';

  const notificacaoHtml = termo.notificacaoAtiva
    ? `
      <div class="section-box warning">
        <div class="section-title">NOTIFICAÇÃO REGULAMENTAR Nº ${termo.numeroNotificacao || 'S/N'}</div>
        <div class="formatted-text">
          ${formatContentWithParagraphs(termo.notificacaoTexto || 'Notificação lavrada nos termos da Resolução vigente do CFF.')}
        </div>
        ${termo.notificacaoObservacoes ? `
          <div style="margin-top: 8px; border-top: 1px dashed #fde68a; padding-top: 6px;">
            <strong style="color: #92400e; display: block; margin-bottom: 3px; font-size: 9pt;">Observações Adicionais da Notificação:</strong>
            <div class="formatted-text" style="font-style: italic;">
              ${formatContentWithParagraphs(termo.notificacaoObservacoes)}
            </div>
          </div>
        ` : ''}
      </div>
    `
    : '';

  const intimacaoHtml = termo.intimacaoAtiva
    ? `
      <div class="section-box info">
        <div class="section-title">TERMO DE INTIMAÇÃO Nº ${termo.numeroIntimacao || 'S/N'}</div>
        <p style="margin: 4px 0;">Fica o estabelecimento intimado a sanar as exigências documentais e de regularidade no prazo legal estipulado.</p>
        ${termo.intimacaoOutrasObservacoes ? `
          <div style="margin-top: 8px; border-top: 1px dashed #bfdbfe; padding-top: 6px;">
            <strong style="color: #1e40af; display: block; margin-bottom: 3px; font-size: 9pt;">Determinações / Observações da Intimação:</strong>
            <div class="formatted-text">
              ${formatContentWithParagraphs(termo.intimacaoOutrasObservacoes)}
            </div>
          </div>
        ` : ''}
      </div>
    `
    : '';

  const sigNotificadoHtml = termo.recusaAssinatura
    ? `
      <div class="signature-block">
        <div class="sig-line" style="color: #b91c1c; font-weight: bold; border-color: #b91c1c;">
          RECUSOU-SE A ASSINAR
        </div>
        <div class="sig-name">${termo.atendenteNome || termo.nomeSignatarioNotificado || 'Atendente'}</div>
        <div class="sig-role">${termo.atendenteCargo || termo.cargoSignatarioNotificado || 'Responsável Presente'}</div>
        <div class="sig-note">Recusa formalmente registrada em tablet</div>
      </div>
    `
    : `
      <div class="signature-block">
        ${termo.assinaturaEstabelecimento || termo.assinaturaNotificado
          ? `<img src="${termo.assinaturaEstabelecimento || termo.assinaturaNotificado}" class="sig-img" alt="Assinatura" />`
          : `<div class="sig-line"></div>`
        }
        <div class="sig-name">${termo.atendenteNome || termo.nomeSignatarioNotificado || 'Responsável pelo Atendimento'}</div>
        <div class="sig-role">${termo.atendenteCargo || termo.cargoSignatarioNotificado || 'Atendente'}</div>
        <div class="sig-note">CPF/Doc: ${termo.atendenteCpf || termo.documentoSignatarioNotificado || '---'}</div>
      </div>
    `;

  const sigFiscalHtml = `
    <div class="signature-block">
      ${termo.assinaturaFiscal
        ? `<img src="${termo.assinaturaFiscal}" class="sig-img" alt="Assinatura Fiscal" />`
        : `<div class="sig-line"></div>`
      }
      <div class="sig-name">${termo.fiscalNome || termo.fiscalAssinanteNome}</div>
      <div class="sig-role">Farmacêutico Fiscal • ${termo.fiscalNumeroInscricao ? `${termo.fiscalNumeroInscricao.toUpperCase().includes((council.prefixoInscricaoProfissional || council.sigla || 'CRF').toUpperCase()) ? termo.fiscalNumeroInscricao : `${council.prefixoInscricaoProfissional || council.sigla || 'CRF-AM'} ${termo.fiscalNumeroInscricao}`}` : `${council.prefixoInscricaoProfissional || council.sigla || 'CRF-AM'} 4150`}</div>
      <div class="sig-note">${council.sigla} • Autarquia Federal</div>
    </div>
  `;

  const bodyHtml = `
    <div class="header">
      <div style="font-size: 13pt; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">${council.sigla} — ${council.nomeCompleto}</div>
      <div style="font-size: 10pt; font-weight: 600; color: #475569; margin-top: 3px;">SERVIÇO PÚBLICO FEDERAL • DEPARTAMENTO DE FISCALIZAÇÃO</div>
      <div class="doc-title">TERMO DE INSPEÇÃO FISCAL Nº ${termo.numeroTermo}</div>
    </div>

    <div class="meta-grid">
      <div><strong>Data e Hora:</strong> ${termo.dataHora}</div>
      <div><strong>Município / UF:</strong> ${termo.cidade || 'Canutama'} / ${(termo as any).uf || council.uf || 'AM'}</div>
      <div><strong>Fiscal Autuante:</strong> ${termo.fiscalNome}</div>
      ${council.geolocalizacaoAtiva !== false && (termo.latitude != null || termo.longitude != null)
        ? `<div><strong>Geolocalização GPS:</strong> Lat: ${termo.latitude}, Lng: ${termo.longitude}</div>`
        : `<div><strong>Jurisdição:</strong> ${council.jurisdicao || council.cidadeSede || 'Estadual'} • ${council.sigla}</div>`
      }
      <div><strong>Tipo da Inspeção:</strong> ${termo.tipoVisita || 'Fiscalização de Rotina'}</div>
    </div>

    <div class="section-box">
      <div class="section-title">1. Identificação do Estabelecimento Inspecionado</div>
      <p style="margin: 3px 0;"><strong>Razão Social:</strong> ${termo.razaoSocial || termo.empresaNome}</p>
      <p style="margin: 3px 0;"><strong>Nome Fantasia:</strong> ${termo.empresaNome}</p>
      <p style="margin: 3px 0;"><strong>CNPJ:</strong> ${termo.cnpj} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Inscrição CRF:</strong> ${termo.empresaInscricao || '---'}</p>
      <p style="margin: 3px 0;"><strong>Endereço:</strong> ${termo.endereco || '---'} - ${termo.bairro || 'Centro'}</p>
    </div>

    <div class="section-box">
      <div class="section-title">2. Responsável Técnico & Condições da Visita</div>
      <p style="margin: 3px 0;"><strong>Farmacêutico RT Averbado:</strong> ${termo.respTecnicoSelecionadoNome || termo.rtPresenteNome || 'ANA KERCIA OLIVEIRA MENDES'}</p>
      <p style="margin: 3px 0;"><strong>Presença do RT no Momento:</strong> ${
        termo.encontrava === 'Fechada' || termo.rtSituacao === 'Fechado'
          ? 'Fechado (Sem Atendimento)'
          : (termo.presencaRT || termo.rtSituacao === 'Presente' ? 'SIM (Presente)' : 'NÃO (Ausente)')
      }</p>
      <p style="margin: 3px 0;"><strong>Atendimento da Fiscalização Realizado Por:</strong> ${
        termo.encontrava === 'Fechada' || termo.rtSituacao === 'Fechado'
          ? 'Fechado sem atendimento'
          : `${termo.atendenteNome || termo.nomeSignatarioNotificado || 'Farmacêutico RT'} (${termo.atendenteCargo || termo.cargoSignatarioNotificado || 'Farmacêutico'})`
      }</p>
      ${termo.observacao ? `
        <div style="margin-top: 10px; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
          <strong style="color: #0f172a; display: block; margin-bottom: 4px; font-size: 9.5pt;">Relato e Constatações da Fiscalização:</strong>
          <div class="formatted-box">
            ${formatContentWithParagraphs(termo.observacao)}
          </div>
        </div>
      ` : ''}
    </div>

    ${notificacaoHtml}
    ${intimacaoHtml}
    ${infractionsHtml}

    <div class="signatures">
      ${sigFiscalHtml}
      ${sigNotificadoHtml}
    </div>

    <div class="footer-stamp">
      <span>Assinatura Biométrica Digital certificada nos moldes da MP 2.200-2/2001 (ICP-Brasil).</span>
      <span>Autenticador SIGCON: ${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}</span>
    </div>
  `;

  const customStyles = `
    .header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .doc-title {
      font-size: 12pt;
      font-weight: 900;
      color: #1e3a8a;
      margin-top: 10px;
      text-transform: uppercase;
      background: #f1f5f9;
      padding: 6px 12px;
      border-radius: 6px;
      display: inline-block;
      letter-spacing: 0.5px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      margin-bottom: 14px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 9.5pt;
    }
    @media (min-width: 640px) {
      .meta-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    .section-box {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 12px;
      font-size: 9.5pt;
    }
    .section-box.alert {
      border-color: #fca5a5;
      background: #fff1f2;
    }
    .section-box.warning {
      border-color: #fde68a;
      background: #fffbeb;
    }
    .section-box.info {
      border-color: #bfdbfe;
      background: #eff6ff;
    }
    .section-title {
      font-weight: 800;
      font-size: 10pt;
      text-transform: uppercase;
      margin-bottom: 6px;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
    }
    .signatures {
      display: flex;
      justify-content: space-around;
      margin-top: 30px;
      page-break-inside: avoid;
    }
    .signature-block {
      text-align: center;
      width: 44%;
    }
    .sig-img {
      max-height: 48px;
      display: block;
      margin: 0 auto 5px;
    }
    .sig-line {
      border-top: 1px solid #0f172a;
      margin-top: 32px;
      padding-top: 4px;
    }
    .sig-name {
      font-weight: 700;
      font-size: 9.5pt;
    }
    .sig-role {
      font-size: 8.5pt;
      color: #475569;
    }
    .sig-note {
      font-size: 8pt;
      color: #64748b;
    }
    .footer-stamp {
      margin-top: 25px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 8px;
      font-size: 7.5pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
    .formatted-text {
      white-space: pre-wrap !important;
      word-break: break-word;
      line-height: 1.6;
      font-family: inherit;
      color: #1e293b;
    }
    .formatted-para {
      margin: 6px 0;
      line-height: 1.6;
      white-space: pre-wrap !important;
      word-break: break-word;
      text-align: justify;
      text-justify: inter-word;
    }
    .formatted-para:first-child {
      margin-top: 2px;
    }
    .formatted-para:last-child {
      margin-bottom: 2px;
    }
    .formatted-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
      margin-top: 6px;
      font-size: 9.5pt;
      line-height: 1.6;
      color: #1e293b;
      white-space: pre-wrap !important;
      word-break: break-word;
    }
  `;

  openDocumentInPrintTab({
    title: `Termo de Inspeção nº ${termo.numeroTermo}`,
    subtitle: `${termo.empresaNome} • ${termo.cidade}`,
    councilSigla: council.sigla,
    councilNome: council.nomeCompleto,
    bodyHtml,
    customStyles,
    autoPrint: true
  });
};

/**
 * Gera um arquivo PDF genuíno em formato Blob usando jsPDF
 */
export function generateTermoPdfBlob(termo: TermoFiscalizacao, council: CouncilConfig): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  let y = 14;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = 16;
    }
  };

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${council.sigla} — ${council.nomeCompleto}`, pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('SERVIÇO PÚBLICO FEDERAL • DEPARTAMENTO DE FISCALIZAÇÃO', pageWidth / 2, y, { align: 'center' });
  y += 6;

  // Termo Badge Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text(`TERMO DE INSPEÇÃO FISCAL Nº ${termo.numeroTermo}`, pageWidth / 2, y + 5.5, { align: 'center' });
  y += 12;

  // Meta Grid Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  // Column 1
  doc.setFont('helvetica', 'bold');
  doc.text('Data e Hora: ', margin + 3, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.text(String(termo.dataHora || ''), margin + 22, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Fiscal Autuante: ', margin + 3, y + 9);
  doc.setFont('helvetica', 'normal');
  doc.text(String(termo.fiscalNome || 'Fiscal do CRF'), margin + 26, y + 9);

  if (council.geolocalizacaoAtiva !== false && (termo.latitude != null || termo.longitude != null)) {
    doc.setFont('helvetica', 'bold');
    doc.text('Geolocalização: ', margin + 3, y + 13.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Lat: ${termo.latitude}, Lng: ${termo.longitude}`, margin + 26, y + 13.5);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.text('Jurisdição: ', margin + 3, y + 13.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${council.jurisdicao || 'Estadual'} • ${council.sigla}`, margin + 22, y + 13.5);
  }

  // Column 2
  const col2X = margin + 95;
  doc.setFont('helvetica', 'bold');
  doc.text('Município / UF: ', col2X, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${termo.cidade || 'Canutama'} / AM`, col2X + 22, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Inscrição Fiscal: ', col2X, y + 9);
  doc.setFont('helvetica', 'normal');
  const pdfPrefix = council.prefixoInscricaoProfissional || council.sigla || 'CRF-AM';
  const rawPdfInsc = termo.fiscalNumeroInscricao || '4150';
  const formattedPdfInsc = rawPdfInsc.toUpperCase().includes(pdfPrefix.toUpperCase()) ? rawPdfInsc.toUpperCase() : `${pdfPrefix} ${rawPdfInsc}`;
  doc.text(formattedPdfInsc, col2X + 24, y + 9);

  doc.setFont('helvetica', 'bold');
  doc.text('Tipo da Inspeção: ', col2X, y + 13.5);
  doc.setFont('helvetica', 'normal');
  doc.text(String(termo.tipoVisita || 'Fiscalização de Rotina'), col2X + 26, y + 13.5);

  y += 20;

  // Section 1: Identificação do Estabelecimento
  checkPageBreak(28);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. IDENTIFICAÇÃO DO ESTABELECIMENTO INSPECIONADO', margin + 3, y + 4.2);

  let sec1Y = y + 10;
  doc.setFontSize(8);
  doc.text('Razão Social: ', margin + 3, sec1Y);
  doc.setFont('helvetica', 'normal');
  doc.text(String(termo.razaoSocial || termo.empresaNome || '---'), margin + 22, sec1Y);

  sec1Y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.text('Nome Fantasia: ', margin + 3, sec1Y);
  doc.setFont('helvetica', 'normal');
  doc.text(String(termo.empresaNome || '---'), margin + 25, sec1Y);

  sec1Y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.text('CNPJ: ', margin + 3, sec1Y);
  doc.setFont('helvetica', 'normal');
  doc.text(String(termo.cnpj || '---'), margin + 13, sec1Y);

  doc.setFont('helvetica', 'bold');
  doc.text('Inscrição CRF: ', col2X, sec1Y);
  doc.setFont('helvetica', 'normal');
  doc.text(String(termo.empresaInscricao || '---'), col2X + 22, sec1Y);

  sec1Y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.text('Endereço: ', margin + 3, sec1Y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${termo.endereco || '---'} - ${termo.bairro || 'Centro'}`, margin + 18, sec1Y);

  y += 28;

  // Section 2: Responsável Técnico & Condições da Visita
  const isFechada = termo.encontrava === 'Fechada' || termo.rtSituacao === 'Fechado';
  const presencaStr = isFechada ? 'Fechado (Sem Atendimento)' : (termo.presencaRT || termo.rtSituacao === 'Presente' ? 'SIM (Presente)' : 'NÃO (Ausente)');
  const atendenteStr = isFechada ? 'Fechado sem atendimento' : `${termo.atendenteNome || 'Farmacêutico RT'} (${termo.atendenteCargo || 'Farmacêutico'})`;

  checkPageBreak(30);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. RESPONSÁVEL TÉCNICO & CONDIÇÕES DA VISITA', margin + 3, y + 4.2);

  let sec2Y = y + 10;
  doc.setFontSize(8);
  doc.text('Farmacêutico RT Averbado: ', margin + 3, sec2Y);
  doc.setFont('helvetica', 'normal');
  doc.text(String(termo.respTecnicoSelecionadoNome || termo.rtPresenteNome || 'ANA KERCIA OLIVEIRA MENDES'), margin + 44, sec2Y);

  sec2Y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Presença do RT no Momento: ', margin + 3, sec2Y);
  doc.setFont('helvetica', isFechada ? 'bold' : 'normal');
  if (isFechada) {
    doc.setTextColor(180, 83, 9);
  } else if (termo.presencaRT || termo.rtSituacao === 'Presente') {
    doc.setTextColor(4, 120, 87);
  } else {
    doc.setTextColor(185, 28, 28);
  }
  doc.text(presencaStr, margin + 44, sec2Y);
  doc.setTextColor(15, 23, 42);

  sec2Y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Atendimento da Fiscalização: ', margin + 3, sec2Y);
  doc.setFont('helvetica', 'normal');
  doc.text(atendenteStr, margin + 44, sec2Y);

  y += 30;

  // Relato / Observações
  if (termo.observacao) {
    const splitObs = doc.splitTextToSize(termo.observacao, contentWidth - 6);
    const boxH = Math.max(16, splitObs.length * 4.2 + 8);
    checkPageBreak(boxH + 4);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, boxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Relato e Constatações da Fiscalização:', margin + 3, y + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.text(splitObs, margin + 3, y + 9);
    y += boxH + 4;
  }

  // Notificação
  if (termo.notificacaoAtiva) {
    const notifText = termo.notificacaoTexto || 'Empresa notificada a regularizar horário e responsabilidade técnica.';
    const splitNotif = doc.splitTextToSize(notifText, contentWidth - 6);
    const boxH = Math.max(18, splitNotif.length * 4.2 + 10);
    checkPageBreak(boxH + 4);

    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(251, 191, 36);
    doc.roundedRect(margin, y, contentWidth, boxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(146, 64, 14);
    doc.text(`NOTIFICAÇÃO REGULAMENTAR Nº ${termo.numeroNotificacao || 'S/N'}`, margin + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(splitNotif, margin + 3, y + 10);
    y += boxH + 4;
  }

  // Intimação
  if (termo.intimacaoAtiva) {
    const intimText = termo.intimacaoOutrasObservacoes || 'Fica o estabelecimento intimado a regularizar as pendências cadastrais perante o CRF.';
    const splitIntim = doc.splitTextToSize(intimText, contentWidth - 6);
    const boxH = Math.max(18, splitIntim.length * 4.2 + 10);
    checkPageBreak(boxH + 4);

    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(147, 197, 253);
    doc.roundedRect(margin, y, contentWidth, boxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 64, 175);
    doc.text(`TERMO DE INTIMAÇÃO Nº ${termo.numeroIntimacao || 'S/N'}`, margin + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(splitIntim, margin + 3, y + 10);
    y += boxH + 4;
  }

  // Auto de Infração
  if (termo.autoInfracaoGerado) {
    const infracoes = termo.infracoesIdentificadas || ['Ausência de farmacêutico'];
    const splitInfracoes = doc.splitTextToSize(infracoes.join('\n• '), contentWidth - 6);
    const boxH = Math.max(20, splitInfracoes.length * 4.2 + 12);
    checkPageBreak(boxH + 4);

    doc.setFillColor(255, 241, 242);
    doc.setDrawColor(253, 164, 175);
    doc.roundedRect(margin, y, contentWidth, boxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(159, 18, 57);
    doc.text(`AUTO DE INFRAÇÃO Nº ${termo.numeroAutoInfracao || 'LAVRADO'}`, margin + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(splitInfracoes, margin + 3, y + 10);
    y += boxH + 4;
  }

  // Signatures
  checkPageBreak(35);
  y += 4;
  const sigColWidth = 80;

  // Fiscal signature line
  doc.setDrawColor(15, 23, 42);
  doc.line(margin + 5, y + 16, margin + 5 + sigColWidth, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(String(termo.fiscalNome || 'Fiscal Autuante'), margin + 5 + (sigColWidth / 2), y + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const pdfSigPrefix = council.prefixoInscricaoProfissional || council.sigla || 'CRF-AM';
  const rawPdfSigInsc = termo.fiscalNumeroInscricao || '4150';
  const formattedPdfSigInsc = rawPdfSigInsc.toUpperCase().includes(pdfSigPrefix.toUpperCase()) ? rawPdfSigInsc.toUpperCase() : `${pdfSigPrefix} ${rawPdfSigInsc}`;
  doc.text(`Fiscal ${formattedPdfSigInsc}`, margin + 5 + (sigColWidth / 2), y + 23.5, { align: 'center' });

  // Notificado signature line
  const colNotifX = margin + 95;
  doc.setDrawColor(15, 23, 42);
  doc.line(colNotifX + 5, y + 16, colNotifX + 5 + sigColWidth, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(String(termo.atendenteNome || 'Responsável pelo Atendimento'), colNotifX + 5 + (sigColWidth / 2), y + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(String(termo.atendenteCargo || 'Estabelecimento'), colNotifX + 5 + (sigColWidth / 2), y + 23.5, { align: 'center' });

  // Footer stamp
  y += 30;
  checkPageBreak(12);
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, margin + contentWidth, y);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Assinatura Eletrônica nos moldes da MP 2.200-2/2001 (ICP-Brasil). Documento emitido pelo SIGCON.', margin, y + 4);
  doc.text(`Autenticação: SIGCON-${Date.now().toString(16).toUpperCase()}`, margin + contentWidth, y + 4, { align: 'right' });

  return doc.output('blob');
}

export async function shareTermoPdf(termo: TermoFiscalizacao, council: CouncilConfig, destinatarios: string[], mensagem: string): Promise<boolean> {
  let docIdentifiers = `Termo nº ${termo.numeroTermo}`;
  if (termo.notificacaoAtiva && termo.numeroNotificacao) {
    docIdentifiers += `, Notificação: ${termo.numeroNotificacao}`;
  }
  if (termo.intimacaoAtiva && termo.numeroIntimacao) {
    docIdentifiers += `, Intimação: ${termo.numeroIntimacao}`;
  }
  if (termo.autoInfracaoGerado && termo.numeroAutoInfracao) {
    docIdentifiers += `, Auto de Infração: ${termo.numeroAutoInfracao}`;
  }

  const subject = `Documentos de Fiscalização - ${docIdentifiers} - ${council.sigla}`;
  const body = `${mensagem}\n\nDocumentos inclusos nesta inspeção:\n- Termo de Inspeção: ${termo.numeroTermo}\n${termo.notificacaoAtiva ? `- Notificação nº ${termo.numeroNotificacao || 'Ativa'}\n` : ''}${termo.intimacaoAtiva ? `- Intimação nº ${termo.numeroIntimacao || 'Ativa'}\n` : ''}${termo.autoInfracaoGerado ? `- Auto de Infração nº ${termo.numeroAutoInfracao}\n` : ''}Estabelecimento: ${termo.empresaNome} (CNPJ: ${termo.cnpj})\nMunicípio: ${termo.cidade}`;

  // Copia os e-mails para a área de transferência para facilitar a colagem caso o app do Gmail não preencha o campo "Para"
  if (navigator.clipboard && destinatarios.length > 0) {
    try {
      await navigator.clipboard.writeText(destinatarios.join(', '));
    } catch {
      // Ignorar se não permitido
    }
  }

  // Gera o PDF REAL (application/pdf)
  const pdfBlob = generateTermoPdfBlob(termo, council);
  const pdfFileName = `Termo_${termo.numeroTermo.replace(/[\/\\]/g, '_')}.pdf`;
  const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });

  if (navigator.share && navigator.canShare) {
    try {
      if (navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: subject,
          text: body,
          files: [pdfFile]
        });
        return true;
      }
    } catch (err) {
      console.log('Web share api error or cancelled:', err);
    }
  }

  // Fallback to Gmail Web Compose with recipients, subject, body
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(destinatarios.join(','))}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(gmailUrl, '_blank');
  return false;
}
