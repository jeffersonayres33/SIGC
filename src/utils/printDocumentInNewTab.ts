/**
 * Opens a dedicated, beautifully formatted print/PDF tab with floating action controls,
 * identical to modern web apps (such as FinancaPessoalDJ).
 * 
 * Features:
 * - Opens a clean new tab (target="_blank")
 * - Features a floating toolbar with "Imprimir / Salvar em PDF" and "Fechar Guia" (hidden on actual print output)
 * - Renders official styling, high-contrast typography, and A4 page layout
 * - Triggers native browser print dialog automatically after document render
 * - If popup blockers prevent window.open, falls back gracefully to a seamless print
 */

export interface PrintDocumentOptions {
  title: string;
  subtitle?: string;
  councilSigla?: string;
  councilNome?: string;
  bodyHtml: string;
  customStyles?: string;
  autoPrint?: boolean;
}

export function openDocumentInPrintTab(options: PrintDocumentOptions) {
  const {
    title,
    subtitle = 'Documento Oficial Autenticado',
    councilSigla = 'CRF',
    councilNome = 'Conselho Regional',
    bodyHtml,
    customStyles = '',
    autoPrint = false
  } = options;

  const printWindow = window.open('', '_blank');

  // Fallback if popup blocker blocked window.open
  if (!printWindow) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(generateFullHtml(options, false));
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          if (autoPrint) iframe.contentWindow?.print();
        } catch {
          if (autoPrint) window.print();
        } finally {
          setTimeout(() => document.body.removeChild(iframe), 2000);
        }
      }, 300);
    } else {
      if (autoPrint) window.print();
    }
    return;
  }

  printWindow.document.open();
  printWindow.document.write(generateFullHtml(options, true));
  printWindow.document.close();

  if (autoPrint) {
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        console.error('Error invoking print dialog in new window:', e);
      }
    }, 450);
  }
}

function generateFullHtml(options: PrintDocumentOptions, includeToolbar: boolean): string {
  const { title, subtitle, councilSigla, councilNome, bodyHtml, customStyles = '' } = options;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${councilSigla || 'SIGCON'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #1e3a8a;
      --primary-dark: #0f172a;
      --text: #0f172a;
      --text-muted: #475569;
      --border: #cbd5e1;
      --bg-page: #f8fafc;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background-color: var(--bg-page);
      color: var(--text);
      line-height: 1.45;
      font-size: 10.5pt;
    }

    /* Floating action toolbar (hidden on paper print) */
    .print-toolbar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(12px);
      color: white;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: space-between;
      gap: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    @media (min-width: 640px) {
      .print-toolbar {
        flex-direction: row;
        align-items: center;
        padding: 10px 20px;
      }
    }

    .toolbar-info {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .toolbar-badge {
      background: #2563eb;
      color: white;
      font-size: 9px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    .toolbar-title {
      font-size: 11.5px;
      font-weight: 700;
      color: #f1f5f9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    @media (min-width: 640px) {
      .toolbar-title {
        font-size: 13px;
      }
    }

    .toolbar-sub {
      font-size: 10px;
      color: #94a3b8;
    }
    @media (min-width: 640px) {
      .toolbar-sub {
        font-size: 11px;
      }
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      flex-shrink: 0;
    }

    .btn-print {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    @media (min-width: 640px) {
      .btn-print {
        padding: 7px 16px;
        font-size: 12px;
      }
    }

    .btn-print:hover {
      background: linear-gradient(135deg, #1d4ed8, #1e40af);
      transform: translateY(-1px);
    }

    .btn-close {
      background: rgba(255, 255, 255, 0.1);
      color: #e2e8f0;
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    @media (min-width: 640px) {
      .btn-close {
        padding: 7px 14px;
        font-size: 12px;
      }
    }

    .btn-close:hover {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    /* Screen Document Container */
    .doc-page {
      max-width: 840px;
      margin: 12px auto 30px;
      background: white;
      padding: 16px 16px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.05);
      border: 1px solid #e2e8f0;
    }
    @media (min-width: 640px) {
      .doc-page {
        margin: 24px auto 40px;
        padding: 36px 44px;
        border-radius: 16px;
      }
    }

    /* Print media rules */
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 12mm 14mm;
    }

    @media print {
      .no-print, .print-toolbar {
        display: none !important;
      }
      body {
        background: white !important;
        font-size: 10pt;
      }
      .doc-page {
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
      }
    }

    ${customStyles}
  </style>
</head>
<body>
  ${includeToolbar ? `
    <div class="print-toolbar no-print">
      <div class="toolbar-info">
        <span class="toolbar-badge">PDF / Impressão</span>
        <div>
          <div class="toolbar-title">${title}</div>
          <div class="toolbar-sub">${subtitle} • ${councilSigla}</div>
        </div>
      </div>
      <div class="toolbar-actions">
        <button class="btn-print" onclick="window.print()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Imprimir / Salvar em PDF
        </button>
        <button class="btn-close" onclick="window.close()">✕ Fechar Guia</button>
      </div>
    </div>
  ` : ''}

  <div class="doc-page">
    ${bodyHtml}
  </div>
</body>
</html>`;
}
