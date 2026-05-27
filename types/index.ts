export interface User {
  id: number
  email: string
  name: string
  university: string | null
  major: string | null
  year: number | null
  country: string | null
  bio: string | null
  profile_photo_url: string | null
  created_at: string
  tags?: Tag[]
}

export interface Message {
  id: number
  sender_id: number
  recipient_id: number
  message_text: string | null
  attachment_url: string | null
  attachment_type: 'image' | 'video' | 'file' | 'code' | null
  attachment_name: string | null
  is_read: boolean
  created_at: string
  sender_name?: string
  recipient_name?: string
}

export interface Conversation {
  other_user_id: number
  other_user_name: string
  latest_message: string
  latest_time: string
  unread_count: number
}

export interface Tag {
  id: number
  name: string
  category: string
}

export interface AuthResponse {
  user: User
}
