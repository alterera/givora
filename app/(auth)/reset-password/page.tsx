import { Suspense } from 'react'
import ResetPasswordForm from '@/components/ResetPasswordForm'
import AuthShell from '@/components/auth/AuthShell'

export const metadata = { title: 'Reset password' }

async function Form({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams
  return <ResetPasswordForm email={email ?? ''} />
}

export default function ResetPasswordPage({ searchParams }: PageProps<'/reset-password'>) {
  return (
    <AuthShell eyebrow="Account recovery" title="Enter your code" subtitle="If an account exists for that email, we sent a 6-digit code. It expires in 10 minutes.">
      <Suspense><Form searchParams={searchParams as Promise<{ email?: string }>} /></Suspense>
    </AuthShell>
  )
}
