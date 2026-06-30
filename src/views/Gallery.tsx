import { useEffect, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { supabase, syncEnabled } from '../lib/supabase'
import { getHouseholdId } from '../lib/storage'
import {
  Photo,
  PhotoTag,
  TAGS,
  TAG_LABEL,
  listPhotos,
  uploadPhoto,
  updatePhoto,
  deletePhoto,
} from '../lib/photos'

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

export default function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<PhotoTag | 'all'>('all')
  const [uploadTag, setUploadTag] = useState<PhotoTag>('bump')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<Photo | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function refresh() {
    setLoading(true)
    setPhotos(await listPhotos())
    setLoading(false)
  }

  useEffect(() => {
    refresh()

    // Live updates: when your partner adds/edits/removes a photo, refresh the grid.
    const sb = supabase
    const hid = getHouseholdId()
    if (!sb || !hid) return
    const channel = sb
      .channel('gallery-' + hid)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'photos', filter: `household_id=eq.${hid}` },
        () => refresh(),
      )
      .subscribe()
    return () => {
      sb.removeChannel(channel)
    }
  }, [])

  // Local-only mode (no account): gallery needs the cloud, so explain that.
  if (!syncEnabled) {
    return (
      <div className="view">
        <h1 className="page-title">Gallery</h1>
        <div className="card">
          <div className="card__title">Sign-in needed</div>
          <p className="muted">Photos sync between both phones, so the gallery turns on once you're signed in.</p>
        </div>
      </div>
    )
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setBusy(true)
    setError(null)
    try {
      for (const file of Array.from(files)) {
        await uploadPhoto(file, { tag: uploadTag, takenOn: todayISO(), caption: '' })
      }
      await refresh()
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const shown = photos.filter((p) => filter === 'all' || p.tag === filter)

  // Group by month of the photo's date.
  const groups = new Map<string, Photo[]>()
  for (const p of shown) {
    const key = p.takenOn ? format(parseISO(p.takenOn), 'MMMM yyyy') : 'Undated'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(p)
  }

  return (
    <div className="view">
      <h1 className="page-title">Gallery</h1>

      <div className="uploader">
        <label className="upload-tag">
          Add to
          <select value={uploadTag} onChange={(e) => setUploadTag(e.target.value as PhotoTag)}>
            {TAGS.map((t) => (
              <option key={t} value={t}>
                {TAG_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn--on" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? 'Uploading…' : '+ Add photo'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>
      {error && <p className="auth__msg">{error}</p>}

      <div className="chips">
        <button className={'chip' + (filter === 'all' ? ' chip--on' : '')} onClick={() => setFilter('all')}>
          All
        </button>
        {TAGS.map((t) => (
          <button key={t} className={'chip' + (filter === t ? ' chip--on' : '')} onClick={() => setFilter(t)}>
            {TAG_LABEL[t]}
          </button>
        ))}
      </div>

      {loading && <p className="muted">Loading photos…</p>}
      {!loading && shown.length === 0 && (
        <p className="muted">
          No photos yet. Add ultrasounds, bump pics, and snapshots of documents — they'll show up on both phones.
        </p>
      )}

      {[...groups.entries()].map(([month, items]) => (
        <section key={month} className="photo-group">
          <h2 className="section-title">{month}</h2>
          <div className="photo-grid">
            {items.map((p) => (
              <button key={p.id} className="photo-cell" onClick={() => setOpen(p)}>
                <img src={p.url} alt={p.caption ?? 'photo'} loading="lazy" />
              </button>
            ))}
          </div>
        </section>
      ))}

      {open && (
        <PhotoDetail
          photo={open}
          onClose={() => setOpen(null)}
          onChanged={refresh}
        />
      )}
    </div>
  )
}

function PhotoDetail({
  photo,
  onClose,
  onChanged,
}: {
  photo: Photo
  onClose: () => void
  onChanged: () => Promise<void>
}) {
  const [caption, setCaption] = useState(photo.caption ?? '')
  const [tag, setTag] = useState<PhotoTag>(photo.tag ?? 'bump')
  const [takenOn, setTakenOn] = useState(photo.takenOn ?? '')

  async function save() {
    await updatePhoto(photo.id, { caption, tag, takenOn })
    await onChanged()
    onClose()
  }

  async function remove() {
    await deletePhoto(photo)
    await onChanged()
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2>Photo</h2>
          <button className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <img className="photo-full" src={photo.url} alt={caption || 'photo'} />

        <div className="field">
          <label>Caption</label>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Add a note…" />
        </div>
        <div className="field">
          <label>Tag</label>
          <select value={tag} onChange={(e) => setTag(e.target.value as PhotoTag)}>
            {TAGS.map((t) => (
              <option key={t} value={t}>
                {TAG_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={takenOn} onChange={(e) => setTakenOn(e.target.value)} />
        </div>

        <div className="actions">
          <button className="btn btn--on" onClick={save}>
            Save
          </button>
          <button className="btn" onClick={remove}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
