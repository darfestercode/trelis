import { put } from '@vercel/blob'
import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth'
import { NextRequest } from 'next/server'

const MAX_SIZE = 50 * 1024 * 1024 // 50 MB

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token || !verifyJWT(token)) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return Response.json({ error: 'No file' }, { status: 400 })
  if (file.size > MAX_SIZE) return Response.json({ error: 'File too large (max 50 MB)' }, { status: 413 })

  const mime = file.type
  let type: string
  if (mime.startsWith('image/'))      type = 'image'
  else if (mime.startsWith('video/')) type = 'video'
  else                                type = 'file'

  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `chat/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  try {
    const blob = await put(path, file, { access: 'public', contentType: mime })
    return Response.json({ url: blob.url, type, name: file.name })
  } catch (err) {
    console.error('Blob upload error:', err)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}
