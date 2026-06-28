import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface BudgetRow {
  category: string
  allocated: number
  actual: number
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function exportBudgetToExcel(rows: BudgetRow[], eventName: string, pettyCashTotal = 0) {
  const dataRows = rows.map((r) => ({
    Category: r.category,
    'Allocated (₦)': r.allocated / 100,
    'Actual Spend (₦)': r.actual / 100,
    'Variance (₦)': (r.allocated - r.actual) / 100,
    '% Used': r.allocated > 0 ? `${Math.round((r.actual / r.allocated) * 100)}%` : '—',
  }))

  if (pettyCashTotal > 0) {
    dataRows.push({
      Category: 'Petty Cash',
      'Allocated (₦)': 0,
      'Actual Spend (₦)': pettyCashTotal / 100,
      'Variance (₦)': -pettyCashTotal / 100,
      '% Used': '—',
    })
  }

  const totalAllocated = rows.reduce((s, r) => s + r.allocated, 0)
  const totalActual = rows.reduce((s, r) => s + r.actual, 0) + pettyCashTotal
  const totalVariance = totalAllocated - totalActual
  dataRows.push({
    Category: 'GRAND TOTAL',
    'Allocated (₦)': totalAllocated / 100,
    'Actual Spend (₦)': totalActual / 100,
    'Variance (₦)': (totalAllocated - totalActual) / 100,
    '% Used': totalAllocated > 0 ? `${Math.round((totalActual / totalAllocated) * 100)}%` : '—',
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(dataRows)

  const colWidths = [
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 10 },
  ]
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, 'Budget')
  XLSX.writeFile(wb, `${eventName || 'Budget'}-Allocations.xlsx`)
}

export function exportBudgetToPDF(rows: BudgetRow[], eventName: string, pettyCashTotal = 0) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Header bar
  doc.setFillColor(17, 24, 39)
  doc.rect(0, 0, 210, 36, 'F')

  // Gold accent line
  doc.setFillColor(212, 160, 23)
  doc.rect(0, 36, 210, 2, 'F')

  // Title
  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('NaliGrid', 14, 16)

  doc.setFontSize(10)
  doc.setTextColor(156, 163, 175)
  doc.setFont('helvetica', 'normal')
  doc.text('Budget by Category', 14, 24)

  if (eventName) {
    doc.setFontSize(9)
    doc.setTextColor(107, 114, 128)
    doc.text(eventName, 14, 30)
  }

  // Date
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  doc.text(`Generated ${today}`, 196 - doc.getTextWidth(`Generated ${today}`), 30)

  // Summary row
  const totalAllocated = rows.reduce((s, r) => s + r.allocated, 0)
  const totalActual = rows.reduce((s, r) => s + r.actual, 0) + pettyCashTotal
  const totalVariance = totalAllocated - totalActual

  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total Allocated: ${formatNaira(totalAllocated)}`, 14, 48)
  doc.text(`Total Spent: ${formatNaira(totalActual)}`, 14, 56)
  doc.text(`Variance: ${formatNaira(totalVariance)}`, 14, 64)

  // Divider
  doc.setDrawColor(55, 65, 81)
  doc.line(14, 70, 196, 70)

  // Table
  const tableData = rows.map((r) => {
    const pct = r.allocated > 0 ? Math.round((r.actual / r.allocated) * 100) : 0
    return [
      r.category,
      formatNaira(r.allocated),
      formatNaira(r.actual),
      formatNaira(r.allocated - r.actual),
      r.allocated > 0 ? `${pct}%` : '—',
    ]
  })

  if (pettyCashTotal > 0) {
    tableData.push([
      'Petty Cash',
      formatNaira(0),
      formatNaira(pettyCashTotal),
      formatNaira(-pettyCashTotal),
      '—',
    ])
  }

  tableData.push([
    'GRAND TOTAL',
    formatNaira(totalAllocated),
    formatNaira(totalActual),
    formatNaira(totalVariance),
    totalAllocated > 0 ? `${Math.round((totalActual / totalAllocated) * 100)}%` : '—',
  ])

  ;(doc as any).autoTable({
    head: [['Category', 'Allocated', 'Actual Spend', 'Variance', '% Used']],
    body: tableData,
    startY: 74,
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: [55, 65, 81],
      lineWidth: 0.1,
      textColor: [255, 255, 255],
    },
    headStyles: {
      fillColor: [212, 160, 23],
      textColor: [17, 24, 39],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fillColor: [31, 41, 55],
    },
    alternateRowStyles: {
      fillColor: [17, 24, 39],
    },
    footStyles: {
      fillColor: [31, 41, 55],
    },
    didParseCell(data: any) {
      if (data.section === 'body' && data.column.index === 3) {
        const val = data.cell.raw as string
        if (val.startsWith('₦-')) {
          data.cell.textColor = [239, 68, 68]
        } else if (!val.startsWith('—')) {
          data.cell.textColor = [34, 197, 94]
        }
      }
      if (data.section === 'body' && data.row.index === tableData.length - 1) {
        data.cell.fontStyle = 'bold'
        data.cell.textColor = [212, 160, 23]
      }
    },
    margin: { left: 14, right: 14 },
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(75, 85, 99)
    doc.text(
      `NaliGrid — Page ${i} of ${pageCount}`,
      196 - doc.getTextWidth(`NaliGrid — Page ${i} of ${pageCount}`),
      294,
    )
  }

  doc.save(`${eventName || 'Budget'}-Allocations.pdf`)
}
