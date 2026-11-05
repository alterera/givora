import ForgotPasswordForm from '@/components/ForgotPasswordForm'
import AuthShell from '@/components/auth/AuthShell'

export const metadata = { title: 'Forgot password' }

export default function ForgotPasswordPage() {
  return (
    <AuthShell eyebrow="Account recovery" title="Forgot your password?" subtitle="Enter your email and we will send you a 6-digit code to reset it.">
      <ForgotPasswordForm />
    </AuthShell>
  )
}
