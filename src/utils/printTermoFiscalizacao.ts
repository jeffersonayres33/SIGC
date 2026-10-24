import { TermoFiscalizacao } from '../types';
import { CouncilConfig } from '../services/storageService';
import { openDocumentInPrintTab } from './printDocumentInNewTab';

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
      <div class="sig-role">Farmacêutico Fiscal • Matrícula: ${termo.fiscalMatricula || termo.matriculaFiscal || 'MAT-402'}</div>
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
      <div><strong>Matrícula:</strong> ${termo.fiscalMatricula || 'MAT-402'}</div>
      <div><strong>Geolocalização GPS:</strong> Lat: ${termo.latitude || '-6.5338'}, Lng: ${termo.longitude || '-64.3833'}</div>
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
      <p style="margin: 3px 0;"><strong>Presença do RT no Momento:</strong> ${termo.presencaRT || termo.rtSituacao === 'Presente' ? 'SIM (Presente)' : 'NÃO (Ausente)'}</p>
      <p style="margin: 3px 0;"><strong>Atendimento da Fiscalização Realizado Por:</strong> ${termo.atendenteNome || termo.nomeSignatarioNotificado || 'Farmacêutico RT'} (${termo.atendenteCargo || termo.cargoSignatarioNotificado || 'Farmacêutico'})</p>
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
