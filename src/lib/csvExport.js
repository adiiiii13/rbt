// CSV export — universal flatten + Excel-friendly download
// Usage: exportToCSV(rows, [{key:'name', label:'Name'}], 'students.csv')

function formatCell(v) {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return v.toLocaleString('en-IN')
  // Firestore Timestamp
  if (v && typeof v === 'object' && typeof v.toDate === 'function') {
    try { return v.toDate().toLocaleString('en-IN') } catch { return '' }
  }
  if (Array.isArray(v)) {
    return v.map(item => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(' | ')
  }
  if (typeof v === 'object') return JSON.stringify(v)
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return String(v)
}

function escapeCSV(s) {
  const str = formatCell(s)
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

function getValue(row, key) {
  // Dot-path: a.b.c
  if (!key.includes('.')) return row[key]
  return key.split('.').reduce((o, k) => (o == null ? o : o[k]), row)
}

/**
 * @param {Array<Object>} rows - data
 * @param {Array<{key:string,label:string,format?:(v,row)=>any}>} columns - column defs
 * @param {string} filename - e.g. students_2026-05-23.csv
 */
export function exportToCSV(rows, columns, filename = 'export.csv') {
  if (!rows || !rows.length) {
    throw new Error('No data to export')
  }
  const cols = columns && columns.length
    ? columns
    : Object.keys(rows[0]).map(k => ({ key: k, label: k }))

  const header = cols.map(c => escapeCSV(c.label)).join(',')
  const body = rows.map(r =>
    cols.map(c => {
      const raw = c.format ? c.format(getValue(r, c.key), r) : getValue(r, c.key)
      return escapeCSV(raw)
    }).join(',')
  ).join('\n')

  // BOM for Excel UTF-8 recognition
  const csv = '﻿' + header + '\n' + body
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
