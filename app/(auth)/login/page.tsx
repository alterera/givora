import { Suspense } from 'react'
import AuthForm from '@/components/AuthForm'

async function Form({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const { next, reset } = await searchParams
  return <AuthForm next={next ?? '/profile'} notice={reset === '1' ? 'Password updated. Log in with your new password.' : undefined} />
}

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <main className="relative isolate flex flex-1 items-center justify-center px-5 py-16">
      <div className="absolute inset-0 -z-10 grid-bg opacity-50" />
      <div className="reveal panel w-full max-w-sm bg-black p-8">
        <p className="eyebrow mb-3">Welcome</p>
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">Log in to Givora</h1>
        <Suspense><Form searchParams={searchParams as Promise<{ next?: string; reset?: string }>} /></Suspense>
      </div>
    </main>
  )
}
