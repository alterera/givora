import { Suspense } from 'react'
import AuthForm from '@/components/AuthForm'
import AuthShell from '@/components/auth/AuthShell'

async function Form({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const { next, reset } = await searchParams
  return <AuthForm next={next ?? '/profile'} notice={reset === '1' ? 'Password updated. Log in with your new password.' : undefined} />
}

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <AuthShell eyebrow="Welcome back" title="Log in to Givora" subtitle="Your collection, certificates and gifts live here." social>
      <Suspense><Form searchParams={searchParams as Promise<{ next?: string; reset?: string }>} /></Suspense>
    </AuthShell>
  )
}
