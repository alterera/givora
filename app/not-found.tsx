import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="text-4xl font-semibold tracking-tighter">Nothing here.</h1>
      <p className="text-[#a1a1a1]">The page you are looking for does not exist or is no longer available.</p>
      <Link href="/" className="btn btn-primary mt-2">Back to Givora</Link>
    </main>
  )
}
