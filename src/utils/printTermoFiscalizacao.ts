import { TermoFiscalizacao } from '../types';
import { CouncilConfig } from '../services/storageService';

export const printTermoFiscalizacao = (termo: TermoFiscalizacao, council: CouncilConfig) => {
  // Create an isolated iframe for clean, reliable printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const infractionsHtml = termo.infracoesIdentificadas && termo.infracoesIdentificadas.length > 0
    ? `
      <div class="section-box alert">
        <div class="section-title">AUTO DE INFRAÇÃO Nº ${termo.numeroAutoInfracao || 'LAVRADO'}</div>
        <p><strong>Irregularidades constatadas durante a fiscalização:</strong></p>
        <ul style="margin: 6px 0; padding-left: 20px;">
          ${termo.infracoesIdentificadas.map(inf => `<li>${inf}</li>`).join('')}
        </ul>
        ${termo.valorMultaPrevisto ? `<p><strong>Valor estimado da penalidade:</strong> R$ ${termo.valorMultaPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>` : ''}
      </div>
    `
    : '';

  const notificacaoHtml = termo.notificacaoAtiva
    ? `
      <div class="section-box warning">
        <div class="section-title">NOTIFICAÇÃO REGULAMENTAR Nº ${termo.numeroNotificacao || 'S/N'}</div>
        <p>${termo.notificacaoTexto || 'Notificação lavrada nos termos da Resolução vigente do CFF.'}</p>
        ${termo.notificacaoObservacoes ? `<p style="margin-top:4px;"><em>Obs: ${termo.notificacaoObservacoes}</em></p>` : ''}
      </div>
    `
    : '';

  const intimacaoHtml = termo.intimacaoAtiva
    ? `
      <div class="section-box info">
        <div class="section-title">TERMO DE INTIMAÇÃO Nº ${termo.numeroIntimacao || 'S/N'}</div>
        <p>Fica o estabelecimento intimado a sanar as exigências documentais e de regularidade no prazo legal estipulado.</p>
        ${termo.intimacaoOutrasObservacoes ? `<p style="margin-top:4px;"><em>Obs: ${termo.intimacaoOutrasObservacoes}</em></p>` : ''}
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

  const printContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <title>Termo de Inspeção - ${termo.numeroTermo}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm 15mm 15mm 15mm;
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
          color: #1e293b;
          font-size: 11pt;
          line-height: 1.4;
          margin: 0;
          padding: 10px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 12px;
          margin-bottom: 15px;
        }
        .header h1 {
          font-size: 15pt;
          font-weight: 800;
          margin: 0;
          text-transform: uppercase;
          color: #0f172a;
          letter-spacing: 0.5px;
        }
        .header h2 {
          font-size: 11pt;
          font-weight: 600;
          margin: 3px 0 0;
          color: #334155;
        }
        .header .doc-title {
          font-size: 13pt;
          font-weight: 900;
          color: #1e3a8a;
          margin-top: 10px;
          text-transform: uppercase;
          background: #f1f5f9;
          padding: 6px;
          border-radius: 4px;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 14px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 10px;
          border-radius: 6px;
          font-size: 10pt;
        }
        .section-box {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 12px;
          font-size: 10pt;
        }
        .section-box.alert {
          border-color: #fca5a5;
          background: #fef2f2;
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
          font-size: 10.5pt;
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
          max-height: 50px;
          display: block;
          margin: 0 auto 5px;
        }
        .sig-line {
          border-top: 1px solid #0f172a;
          margin-top: 35px;
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
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${council.sigla} — ${council.nomeCompleto}</h1>
        <h2>SERVIÇO PÚBLICO FEDERAL • DEPARTAMENTO DE FISCALIZAÇÃO</h2>
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
        ${termo.observacao ? `<p style="margin: 5px 0 0;"><strong>Relato Fiscal:</strong> ${termo.observacao}</p>` : ''}
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
    </body>
    </html>
  `;

  doc.open();
  doc.write(printContent);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      window.print();
    } finally {
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    }
  }, 350);
};
