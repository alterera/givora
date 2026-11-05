import ForgotPasswordForm from '@/components/ForgotPasswordForm'

export const metadata = { title: 'Forgot password' }

export default function ForgotPasswordPage() {
  return (
    <main className="relative isolate flex flex-1 items-center justify-center px-5 py-16">
      <div className="absolute inset-0 -z-10 grid-bg opacity-50" />
      <div className="reveal panel w-full max-w-sm bg-black p-8">
        <p className="eyebrow mb-3">Account recovery</p>
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">Forgot your password?</h1>
        <p className="mb-8 text-sm text-[#8f8f8f]">Enter your email and we’ll send you a link to reset it.</p>
        <ForgotPasswordForm />
      </div>
    </main>
  )
}
