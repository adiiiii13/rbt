import { useState, useRef } from 'react'
import { uploadFile } from '../lib/firebaseHelpers'

export default function FileUpload({ path, accept, onUpload, label = 'Upload File', currentUrl = null }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(currentUrl)
  const fileRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    setError('')
    const isImage = accept?.includes('image')
    const maxSize = isImage ? 5 : 10 // MB
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File too large. Max ${maxSize}MB.`)
      return
    }
    setUploading(true)
    setProgress(30)
    try {
      const filePath = `${path}/${Date.now()}_${file.name}`
      const url = await uploadFile(filePath, file)
      setProgress(100)
      setPreview(url)
      onUpload(url, filePath)
    } catch (err) {
      setError('Upload failed. Try again.')
      console.error(err)
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const handleChange = (e) => {
    const file = e.target.files[0]
    handleFile(file)
  }

  const isImage = accept?.includes('image')

  return (
    <div>
      <label className="text-sm font-medium text-slate-300 mb-1 block">{label}</label>
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          uploading
            ? 'border-green-brand/50 bg-green-brand/5'
            : error
            ? 'border-red-500/50 bg-red-500/5 hover:border-red-500'
            : 'border-slate-600 hover:border-green-brand hover:bg-white/5'
        }`}
        onClick={() => fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        {uploading ? (
          <div className="space-y-2">
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-green-brand h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-green-brand">Uploading...</p>
          </div>
        ) : preview && isImage ? (
          <div className="space-y-2">
            <img src={preview} alt="Preview" className="w-32 h-20 object-cover rounded-lg mx-auto" />
            <p className="text-xs text-slate-400">Click to replace</p>
          </div>
        ) : preview ? (
          <div className="space-y-2">
            <p className="text-sm text-green-brand break-all">{preview.split('/').pop().split('?')[0]}</p>
            <p className="text-xs text-slate-400">Click to replace</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-slate-400">
              Drag & drop or <span className="text-green-brand font-medium">browse</span>
            </p>
            <p className="text-xs text-slate-500">
              {isImage ? 'JPG, PNG, WebP (max 5MB)' : 'PDF (max 10MB)'}
            </p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
