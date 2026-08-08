// Shared PDF / Excel export helpers for DALABplus+
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface ExportOptions {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  fileName: string;
  summary?: { label: string; value: string }[];
}

/** Renders a table into an existing jsPDF doc (jspdf-autotable v5 functional API). */
export const renderTable = (doc: jsPDF, options: Parameters<typeof autoTable>[1]) => {
  autoTable(doc, options);
};

export const exportToPdf = ({ title, subtitle, headers, rows, fileName, summary }: ExportOptions) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  if (subtitle) doc.text(subtitle, 14, 25);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, subtitle ? 31 : 25);

  let startY = subtitle ? 38 : 32;
  if (summary?.length) {
    doc.setTextColor(30);
    summary.forEach((s, i) => {
      doc.text(`${s.label}: ${s.value}`, 14 + (i % 3) * 62, startY + Math.floor(i / 3) * 6);
    });
    startY += Math.ceil(summary.length / 3) * 6 + 4;
  }

  autoTable(doc, {
    startY,
    head: [headers],
    body: rows.map(r => r.map(c => String(c))),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 252] },
  });

  doc.save(`${fileName}.pdf`);
};

export const exportToExcel = ({ title, headers, rows, fileName }: Omit<ExportOptions, "subtitle" | "summary">) => {
  const sheet = XLSX.utils.aoa_to_sheet([[title], [], headers, ...rows]);
  sheet["!cols"] = headers.map(() => ({ wch: 18 }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Report");
  XLSX.writeFile(book, `${fileName}.xlsx`);
};
