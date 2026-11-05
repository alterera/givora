import { Suspense } from 'react'
import ResetPasswordForm from '@/components/ResetPasswordForm'

export const metadata = { title: 'Reset password' }

async function Form({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams
  return <ResetPasswordForm email={email ?? ''} />
}

export default function ResetPasswordPage({ searchParams }: PageProps<'/reset-password'>) {
  return (
    <main className="relative isolate flex flex-1 items-center justify-center px-5 py-16">
      <div className="absolute inset-0 -z-10 grid-bg opacity-50" />
      <div className="reveal panel w-full max-w-md bg-black p-6 sm:p-8">
        <p className="eyebrow mb-3">Account recovery</p>
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">Enter your code</h1>
        <p className="mb-8 text-sm text-[#8f8f8f]">If an account exists for that email, we have sent a 6-digit code. It expires in 10 minutes.</p>
        <Suspense><Form searchParams={searchParams as Promise<{ email?: string }>} /></Suspense>
      </div>
    </main>
  )
}
