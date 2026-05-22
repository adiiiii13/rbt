import { TableSkeleton } from '../../components/ui/Skeleton';
import { useState, useMemo, useRef } from 'react'
import { deleteItemSmart } from '../../lib/contentApi'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { addDocument, updateDocument, uploadFile } from '../../lib/firebaseHelpers'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'
import ExportButton from '../../components/ExportButton'

const DEFAULT_CATEGORIES = ['Campus', 'Labs', 'Events', 'Facilities', 'Students']

const emptyForm = { title: '', category: 'Campus', event: '', imageUrl: '', order: 0 }

export default function ManageGallery() {
  const { data: images, loading } = useRealtimeCollection('gallery')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [preview, setPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(null) // {done, total}
  const [filterCat, setFilterCat] = useState('all')
  const [filterEvent, setFilterEvent] = useState('all')
  const [customCats, setCustomCats] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gallery_custom_cats') || '[]'); } catch { return []; }
  })
  const [newCatInput, setNewCatInput] = useState('')
  const dragSrc = useRef(null)

  const allCategories = useMemo(() => {
    const set = new Set([...DEFAULT_CATEGORIES, ...customCats, ...images.map(i => i.category).filter(Boolean)])
    return Array.from(set)
  }, [customCats, images])

  const events = useMemo(() => {
    const set = new Set(images.map(i => i.event).filter(Boolean))
    return Array.from(set).sort()
  }, [images])

  const filtered = useMemo(() => {
    return images
      .filter(i => filterCat === 'all' || i.category === filterCat)
      .filter(i => filterEvent === 'all' || (i.event || '') === filterEvent)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [images, filterCat, filterEvent])

  // Group by event when event filter is 'all' but a category bundle is open
  const eventBuckets = useMemo(() => {
    const map = new Map()
    filtered.forEach(img => {
      const key = img.event || '(No event)'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(img)
    })
    return Array.from(map.entries())
  }, [filtered])

  const addCustomCat = () => {
    const v = newCatInput.trim()
    if (!v) return
    if (allCategories.includes(v)) { toast.error('Already exists'); return }
    const next = [...customCats, v]
    setCustomCats(next)
    localStorage.setItem('gallery_custom_cats', JSON.stringify(next))
    setNewCatInput('')
    toast.success(`Added "${v}"`)
  }

  const handleSingleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Images only'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return }
    setUploading(true)
    try {
      const path = `public/gallery/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
      const url = await uploadFile(path, file)
      setForm({ ...form, imageUrl: url })
      setPreview(url)
      toast.success('Uploaded')
    } catch (err) { toast.error(err.message) }
    finally { setUploading(false); e.target.value = '' }
  }

  const handleBulkUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (!form.category) { toast.error('Pick a category first'); return }
    setBulkProgress({ done: 0, total: files.length })
    const baseOrder = (images.filter(i => i.category === form.category).length) || 0
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} too big`); continue }
      try {
        const path = `public/gallery/${Date.now()}_${i}_${file.name.replace(/\s+/g, '_')}`
        const url = await uploadFile(path, file)
        await addDocument('gallery', {
          title: file.name.replace(/\.[^.]+$/, ''),
          category: form.category,
          event: form.event || '',
          imageUrl: url,
          order: baseOrder + i,
        })
      } catch (err) { console.error(file.name, err) }
      setBulkProgress({ done: i + 1, total: files.length })
    }
    toast.success(`Bulk uploaded ${files.length} images to ${form.category}`)
    setBulkProgress(null)
    setBulkMode(false)
    closeModal()
    e.target.value = ''
  }

  const save = async () => {
    if (!form.imageUrl) { toast.error('Upload or paste URL'); return }
    try {
      if (editing) {
        await updateDocument('gallery', editing.id, form)
        toast.success('Updated')
      } else {
        await addDocument('gallery', { ...form, order: form.order || images.length })
        toast.success('Added')
      }
      closeModal()
    } catch (err) { toast.error(err.message) }
  }

  const remove = async (id) => {
    if (!confirm('Delete?')) return
    try { await deleteItemSmart('gallery', id); toast.success('Deleted') }
    catch (err) { toast.error(err.message) }
  }

  const openEdit = (img) => {
    setEditing(img)
    setForm({ title: img.title || '', category: img.category || 'Campus', event: img.event || '', imageUrl: img.imageUrl, order: img.order || 0 })
    setPreview(img.imageUrl)
    setBulkMode(false)
    setModal(true)
  }

  const openCreate = () => { setEditing(null); setForm(emptyForm); setPreview(''); setBulkMode(false); setModal(true) }
  const openBulk = () => { setEditing(null); setForm(emptyForm); setBulkMode(true); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); setPreview(''); setBulkMode(false); setBulkProgress(null) }

  // Drag-and-drop reordering within current view
  const onDragStart = (img) => () => { dragSrc.current = img.id }
  const onDragOver = (e) => { e.preventDefault() }
  const onDrop = (target) => async (e) => {
    e.preventDefault()
    const srcId = dragSrc.current
    if (!srcId || srcId === target.id) return
    const src = images.find(i => i.id === srcId)
    if (!src) return
    try {
      await updateDocument('gallery', src.id, { order: target.order || 0 })
      await updateDocument('gallery', target.id, { order: (src.order || 0) + 0.5 })
      toast.success('Reordered')
    } catch (err) { toast.error(err.message) }
    dragSrc.current = null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Gallery</h1>
          <p className="text-sm text-slate-400">{images.length} images · {events.length} events</p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={images} filename="gallery" columns={[
            { key: 'title', label: 'Title' },
            { key: 'category', label: 'Category' },
            { key: 'event', label: 'Event' },
            { key: 'imageUrl', label: 'Image URL' },
            { key: 'order', label: 'Order' },
          ]} />
          <button onClick={openBulk} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm font-bold px-4 py-2 rounded-lg">📦 Bulk Upload</button>
          <button onClick={openCreate} className="btn-primary">+ Add Image</button>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="mb-3">
        <div className="text-xs text-slate-500 uppercase font-bold mb-2">Category</div>
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={() => setFilterCat('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${filterCat === 'all' ? 'bg-green-brand text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
            All ({images.length})
          </button>
          {allCategories.map(c => {
            const n = images.filter(i => i.category === c).length
            return (
              <button key={c} onClick={() => setFilterCat(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${filterCat === c ? 'bg-green-brand text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
                {c} ({n})
              </button>
            )
          })}
          <div className="flex items-center gap-1 bg-white/5 border border-dashed border-white/20 rounded-full pl-2 pr-1 py-0.5">
            <input value={newCatInput} onChange={e => setNewCatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomCat()}
              placeholder="+ custom"
              className="bg-transparent text-xs text-white outline-none w-20" />
            <button onClick={addCustomCat} className="text-xs bg-green-brand text-white rounded-full w-5 h-5 leading-none">+</button>
          </div>
        </div>
      </div>

      {/* Event filter chips */}
      {events.length > 0 && (
        <div className="mb-6">
          <div className="text-xs text-slate-500 uppercase font-bold mb-2">Event</div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilterEvent('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${filterEvent === 'all' ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
              All events
            </button>
            {events.map(ev => (
              <button key={ev} onClick={() => setFilterEvent(ev)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${filterEvent === ev ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
                {ev}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <TableSkeleton />}

      {!loading && filtered.length === 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-slate-400">No images in this view.</p>
        </div>
      )}

      {/* Bundled by event */}
      {filterEvent === 'all' && eventBuckets.length > 1 ? (
        <div className="space-y-8">
          {eventBuckets.map(([eventName, imgs]) => (
            <div key={eventName}>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-lg font-bold text-white">{eventName}</h2>
                <span className="text-xs text-slate-500">{imgs.length} images</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {imgs.map(img => <ImageCard key={img.id} img={img} openEdit={openEdit} remove={remove}
                  onDragStart={onDragStart(img)} onDragOver={onDragOver} onDrop={onDrop(img)} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(img => <ImageCard key={img.id} img={img} openEdit={openEdit} remove={remove}
            onDragStart={onDragStart(img)} onDragOver={onDragOver} onDrop={onDrop(img)} />)}
        </div>
      )}

      <Modal isOpen={modal} onClose={closeModal} title={bulkMode ? 'Bulk Upload' : (editing ? 'Edit Image' : 'Add Image')}>
        <div className="space-y-4">
          {bulkMode ? (
            <>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-200">
                <div className="font-bold mb-1">📦 Bulk Upload Mode</div>
                <div>Pick category + event, then select many images. All go to one folder at once.</div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Category *</label>
                <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {allCategories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Event name (optional, groups bundle)</label>
                <input className="input-field" value={form.event} onChange={e => setForm({ ...form, event: e.target.value })}
                  placeholder="e.g. Annual Day 2026" list="events-list" />
                <datalist id="events-list">
                  {events.map(ev => <option key={ev} value={ev} />)}
                </datalist>
              </div>
              <label className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-green-brand block">
                {bulkProgress ? (
                  <div>
                    <div className="text-green-brand font-bold mb-2">Uploading {bulkProgress.done}/{bulkProgress.total}</div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-green-brand h-2 rounded-full transition-all" style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-sm text-white font-medium">Select multiple images</p>
                    <p className="text-xs text-slate-500 mt-1">JPG/PNG · 5MB each</p>
                  </>
                )}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleBulkUpload} disabled={!!bulkProgress} />
              </label>
            </>
          ) : (
            <>
              <div><label className="text-sm font-medium text-slate-300 mb-1 block">Title</label>
                <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Category</label>
                  <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {allCategories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Event (optional)</label>
                  <input className="input-field" value={form.event} onChange={e => setForm({ ...form, event: e.target.value })}
                    placeholder="e.g. Annual Day" list="events-list-single" />
                  <datalist id="events-list-single">
                    {events.map(ev => <option key={ev} value={ev} />)}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Upload Image</label>
                <label className="border-2 border-dashed border-slate-600 rounded-xl p-4 text-center cursor-pointer hover:border-green-brand transition-colors block">
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full max-h-40 object-contain mx-auto rounded-lg" />
                  ) : (
                    <p className="text-sm text-slate-400">{uploading ? 'Uploading...' : 'Click to select image (max 5MB)'}</p>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleSingleUpload} disabled={uploading} />
                </label>
              </div>
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink-0 mx-3 text-slate-500 text-xs">or paste URL</span>
                <div className="flex-grow border-t border-slate-700"></div>
              </div>
              <input className="input-field" value={form.imageUrl}
                onChange={e => { setForm({ ...form, imageUrl: e.target.value }); setPreview(e.target.value); }}
                placeholder="https://..." />
              <button onClick={save} disabled={uploading} className="btn-primary w-full disabled:opacity-50">{editing ? 'Update' : 'Add'} Image</button>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

function ImageCard({ img, openEdit, remove, onDragStart, onDragOver, onDrop }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden group hover:border-green-brand/30 transition-all cursor-move"
    >
      <div className="aspect-video relative">
        <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button onClick={() => openEdit(img)} className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg">Edit</button>
          <button onClick={() => remove(img.id)} className="text-sm bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg">Delete</button>
        </div>
        <div className="absolute top-2 left-2 text-[10px] bg-black/60 text-white/60 px-1.5 py-0.5 rounded">⋮⋮ drag</div>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-white truncate">{img.title || '(untitled)'}</p>
        <div className="flex gap-1 mt-1 flex-wrap">
          <span className="badge badge-green text-[10px]">{img.category}</span>
          {img.event && <span className="badge badge-navy text-[10px]">{img.event}</span>}
        </div>
      </div>
    </div>
  )
}
