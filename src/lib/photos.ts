// Photo gallery backed by Supabase Storage (private bucket "photos"). Files live
// under <household_id>/<uuid> so storage RLS can check household membership from the
// path. Each file has a row in the `photos` table with its tag, date, and caption.
// Unlike task state, the gallery is loaded on demand (it's not needed offline).

import { supabase } from './supabase'
import { getHouseholdId } from './storage'

export type PhotoTag = 'ultrasound' | 'bump' | 'us' | 'baby' | 'document'

export const TAG_LABEL: Record<PhotoTag, string> = {
  ultrasound: 'Ultrasounds',
  bump: 'Bump',
  us: 'Us',
  baby: 'Baby',
  document: 'Documents',
}

export const TAGS: PhotoTag[] = ['ultrasound', 'bump', 'us', 'baby', 'document']

export interface Photo {
  id: string
  storagePath: string
  takenOn: string | null
  tag: PhotoTag | null
  caption: string | null
  url: string // temporary signed URL for display
}

export async function listPhotos(): Promise<Photo[]> {
  const hid = getHouseholdId()
  if (!supabase || !hid) return []

  const { data, error } = await supabase
    .from('photos')
    .select('id,storage_path,taken_on,tag,caption')
    .eq('household_id', hid)
    .order('taken_on', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error || !data) {
    if (error) console.warn('[photos] could not load:', error.message)
    return []
  }

  // Private bucket → fetch short-lived signed URLs in one batch.
  const paths = data.map((d) => d.storage_path)
  const signed = paths.length
    ? (await supabase.storage.from('photos').createSignedUrls(paths, 3600)).data ?? []
    : []
  const urlByPath = new Map(signed.map((s) => [s.path, s.signedUrl]))

  return data.map((d) => ({
    id: d.id,
    storagePath: d.storage_path,
    takenOn: d.taken_on,
    tag: d.tag as PhotoTag | null,
    caption: d.caption,
    url: urlByPath.get(d.storage_path) ?? '',
  }))
}

export async function uploadPhoto(
  file: File,
  meta: { tag: PhotoTag; takenOn: string; caption: string },
): Promise<void> {
  const hid = getHouseholdId()
  if (!supabase || !hid) throw new Error('You need to be signed in to add photos.')

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${hid}/${crypto.randomUUID()}.${ext}`

  const { error: upErr } = await supabase.storage.from('photos').upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  })
  if (upErr) throw upErr

  const { error: insErr } = await supabase.from('photos').insert({
    household_id: hid,
    storage_path: path,
    taken_on: meta.takenOn || null,
    tag: meta.tag,
    caption: meta.caption || null,
  })
  if (insErr) throw insErr
}

export async function updatePhoto(
  id: string,
  patch: { caption?: string; tag?: PhotoTag; takenOn?: string },
): Promise<void> {
  if (!supabase) return
  const row: Record<string, unknown> = {}
  if (patch.caption !== undefined) row.caption = patch.caption || null
  if (patch.tag !== undefined) row.tag = patch.tag
  if (patch.takenOn !== undefined) row.taken_on = patch.takenOn || null
  const { error } = await supabase.from('photos').update(row).eq('id', id)
  if (error) console.warn('[photos] could not save:', error.message)
}

export async function deletePhoto(p: Photo): Promise<void> {
  if (!supabase) return
  await supabase.storage.from('photos').remove([p.storagePath])
  await supabase.from('photos').delete().eq('id', p.id)
}
