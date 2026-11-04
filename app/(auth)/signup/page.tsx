import { Suspense } from 'react'
import SignupForm from '@/components/SignupForm'

export const metadata = { title: 'Sign up · Givora World' }

async function Form({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return <SignupForm next={next ?? '/profile'} />
}

export default function SignupPage({ searchParams }: PageProps<'/signup'>) {
  return (
    <main className="relative isolate flex flex-1 items-center justify-center px-5 py-12">
      <div className="absolute inset-0 -z-10 grid-bg opacity-50" />
      <div className="reveal panel w-full max-w-lg bg-black p-6 sm:p-8">
        <p className="eyebrow mb-3">Join</p>
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">Create your Givora account</h1>
        <Suspense><Form searchParams={searchParams as Promise<{ next?: string }>} /></Suspense>
      </div>
    </main>
  )
}
