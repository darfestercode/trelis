import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyJWT } from '@/lib/auth'
import SignupForm from './SignupForm'

export default async function SignupPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (token && verifyJWT(token)) redirect('/dashboard')

  return <SignupForm />
}
