import { Suspense } from 'react'
import SignupForm from '@/components/SignupForm'
import AuthShell from '@/components/auth/AuthShell'

export const metadata = { title: 'Sign up' }

async function Form({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return <SignupForm next={next ?? '/profile'} />
}

export default function SignupPage({ searchParams }: PageProps<'/signup'>) {
  return (
    <AuthShell eyebrow="Join" title="Create your Givora account" subtitle="Collect one-of-one particle art and gift it to someone." social wide>
      <Suspense><Form searchParams={searchParams as Promise<{ next?: string }>} /></Suspense>
    </AuthShell>
  )
}
