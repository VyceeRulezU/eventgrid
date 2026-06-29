import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface GroupedSection {
  category: string
  description: string
  amount: number
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

export function generateExcelBase64(grouped: GroupedSection[], totalAmount: number): string {
  const dataRows = grouped.map((g) => ({
    Category: g.category,
    Description: g.description || 'Proposed service cost',
    'Amount (₦)': g.amount / 100,
    '% of Total': totalAmount > 0 ? `${Math.round((g.amount / totalAmount) * 100)}%` : '—',
  }))

  dataRows.push({
    Category: 'GRAND TOTAL',
    Description: '',
    'Amount (₦)': totalAmount / 100,
    '% of Total': '100%',
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(dataRows)

  const colWidths = [
    { wch: 22 },
    { wch: 45 },
    { wch: 18 },
    { wch: 12 },
  ]
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, 'Proposal')
  return XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
}

export function generatePDFDocument(grouped: GroupedSection[], title: string, totalAmount: number, description?: string): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Header bar
  doc.setFillColor(17, 24, 39)
  doc.rect(0, 0, 210, 36, 'F')

  // Gold accent line
  doc.setFillColor(212, 160, 23)
  doc.rect(0, 36, 210, 2, 'F')

  // Title
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('NaliGrid', 14, 16)

  doc.setFontSize(10)
  doc.setTextColor(156, 163, 175)
  doc.setFont('helvetica', 'normal')
  doc.text('Client Proposal & Quote Spec Sheet', 14, 23)

  // Document details
  doc.setFontSize(11)
  doc.setTextColor(31, 41, 55)
  doc.setFont('helvetica', 'bold')
  doc.text('Proposal Title:', 14, 48)
  doc.setFont('helvetica', 'normal')
  doc.text(title, 45, 48)

  doc.setFont('helvetica', 'bold')
  doc.text('Date Issued:', 14, 54)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date().toLocaleDateString('en-NG'), 45, 54)

  if (description) {
    doc.setFont('helvetica', 'bold')
    doc.text('Introduction:', 14, 62)
    doc.setFont('helvetica', 'normal')
    const splitDesc = doc.splitTextToSize(description, 180)
    doc.text(splitDesc, 14, 68)
  }

  const tableStartY = description ? 85 : 65

  // Table header & rows
  const tableHeaders = [['Category', 'Proposed Services Spec', 'Price', '% of Total']]
  const tableRows = grouped.map((g) => [
    g.category,
    g.description || 'Proposed service spec details.',
    formatNaira(g.amount),
    totalAmount > 0 ? `${Math.round((g.amount / totalAmount) * 100)}%` : '—',
  ])

  // Add Grand Total row
  tableRows.push([
    'GRAND TOTAL',
    'Combined proposed total specification cost',
    formatNaira(totalAmount),
    '100%',
  ])

  ;(doc as any).autoTable({
    startY: tableStartY,
    head: tableHeaders,
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [17, 24, 39], textColor: [255, 255, 255], fontStyle: 'bold' },
    footStyles: { fillColor: [229, 231, 235], textColor: [17, 24, 39], fontStyle: 'bold' },
    columnStyles: {
      0: { width: 40, fontStyle: 'bold' },
      1: { width: 95 },
      2: { width: 30, halign: 'right' },
      3: { width: 20, halign: 'right' },
    },
    styles: { fontSize: 9, font: 'helvetica' },
    didDrawPage: () => {
      // Footer
      doc.setFontSize(8)
      doc.setTextColor(156, 163, 175)
      doc.text('NaliGrid Services. All rights reserved.', 14, 287)
      doc.text(`Page ${doc.getNumberOfPages()}`, 190, 287)
    },
  })

  return doc
}

export function exportProposalToExcel(grouped: GroupedSection[], title: string, totalAmount: number) {
  const b64 = generateExcelBase64(grouped, totalAmount)
  const bin = atob(b64)
  const buf = new ArrayBuffer(bin.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i)
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.replace(/\s+/g, '_')}_Quote.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportProposalToPDF(grouped: GroupedSection[], title: string, totalAmount: number, description?: string) {
  const doc = generatePDFDocument(grouped, title, totalAmount, description)
  doc.save(`${title.replace(/\s+/g, '_')}_Quote.pdf`)
}
