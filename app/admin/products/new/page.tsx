import Link from 'next/link'
import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import ProductForm from '@/components/ProductForm'

async function Guard() {
  await requireAdmin()
  return <ProductForm />
}

export default function NewProductPage() {
  return (
    <main className="container-x flex flex-col gap-8 py-10 md:py-14">
      <div><Link href="/admin" className="eyebrow link-underline">← Dashboard</Link><h1 className="mt-4 text-3xl font-semibold tracking-tight">New product</h1></div>
      <Suspense><Guard /></Suspense>
    </main>
  )
}
