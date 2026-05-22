import { exportToCSV, todayStr } from '../lib/csvExport'
import toast from 'react-hot-toast'

/**
 * Generic CSV export button for admin pages.
 * Props:
 *  - data: array of rows
 *  - columns: [{key, label, format?}]
 *  - filename: base name (without date / ext)
 *  - label: button text (default "Export CSV")
 *  - className: optional override
 */
export default function ExportButton({ data, columns, filename = 'export', label = 'Export CSV', className = '' }) {
  const handle = () => {
    try {
      if (!data || !data.length) {
        toast.error('Nothing to export')
        return
      }
      exportToCSV(data, columns, `${filename}_${todayStr()}.csv`)
      toast.success(`Exported ${data.length} row${data.length !== 1 ? 's' : ''}`)
    } catch (err) {
      toast.error(err.message || 'Export failed')
    }
  }

  return (
    <button
      onClick={handle}
      className={className || 'px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-slate-700 text-slate-200 text-sm font-medium cursor-pointer transition-colors flex items-center gap-2'}
      title="Download data as CSV (Excel compatible)"
    >
      <span>⬇</span>
      <span>{label}</span>
      {data?.length > 0 && <span className="text-xs text-slate-500">({data.length})</span>}
    </button>
  )
}
