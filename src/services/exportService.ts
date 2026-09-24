import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  orientation?: 'portrait' | 'landscape';
  councilName?: string;
  councilUF?: string;
}

/**
 * Exporta dados para planilha Excel (.csv com BOM UTF-8 e delimitador ';')
 */
export function exportToCSV(filename: string, rows: Record<string, any>[], selectedColumns?: string[]) {
  if (!rows || !rows.length) return;

  const headers = selectedColumns && selectedColumns.length > 0
    ? selectedColumns
    : Object.keys(rows[0]);

  // CSV content with UTF-8 BOM so Excel opens it with proper Portuguese accents
  const bom = '\uFEFF';
  const headerLine = headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(';');
  
  const bodyLines = rows.map(row => {
    return headers.map(header => {
      let val = row[header];
      if (val === null || val === undefined) {
        val = '';
      } else if (typeof val === 'object') {
        val = JSON.stringify(val);
      } else {
        val = String(val);
      }
      return `"${val.replace(/"/g, '""')}"`;
    }).join(';');
  });

  const csvContent = bom + [headerLine, ...bodyLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta dados formatados para documento PDF Oficial
 */
export function exportToPDF({
  title,
  subtitle,
  filename,
  headers,
  rows,
  orientation = 'landscape',
  councilName = 'CONSELHO REGIONAL DE FARMÁCIA',
  councilUF = 'AM'
}: PDFExportOptions) {
  if (!rows || !rows.length) return;

  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Cabeçalho institucional escuro
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 48, 'F');

  // Linha dourada institucional
  doc.setFillColor(217, 119, 6); // amber-600
  doc.rect(0, 48, pageWidth, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${councilName} (${councilUF})`, 30, 22);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  doc.text(`SISCON Cloud - Sistema Integrado de Gestão do Conselho | Gerado em ${dateStr}`, 30, 36);

  // Título e Subtítulo
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 30, 74);

  let startY = 82;
  if (subtitle) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(subtitle, 30, startY);
    startY += 14;
  }

  // Tabela autoTable
  autoTable(doc, {
    startY: startY + 4,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 4
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 3.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    styles: {
      overflow: 'linebreak',
      cellWidth: 'auto',
      valign: 'middle'
    },
    margin: { left: 30, right: 30, bottom: 35 },
    didDrawPage: (data) => {
      // Rodapé em cada página
      const str = `Página ${data.pageNumber} | Total de registros: ${rows.length}`;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(str, 30, pageHeight - 12);
      doc.text('Documento gerado automaticamente pelo SISCON Cloud', pageWidth - 30, pageHeight - 12, { align: 'right' });
    }
  });

  doc.save(`${filename}.pdf`);
}

export function printElement(elementId: string) {
  const elem = document.getElementById(elementId);
  if (!elem) {
    window.print();
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>Impressão Oficial - SISCON Cloud</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #111; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
          .footer { margin-top: 30px; font-size: 10px; text-align: center; color: #666; }
          @page { margin: 1.5cm; }
        </style>
      </head>
      <body>
        ${elem.innerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
}
