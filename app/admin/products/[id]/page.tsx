import Link from 'next/link'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import ProductForm from '@/components/ProductForm'

async function Edit({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const { data } = await createAdminClient().from('products').select('*').eq('id', id).single()
  if (!data) notFound()
  return <ProductForm initial={data} />
}

export default function EditProductPage({ params }: PageProps<'/admin/products/[id]'>) {
  return (
    <main className="container-x flex flex-col gap-8 py-10 md:py-14">
      <div><Link href="/admin" className="eyebrow link-underline">← Dashboard</Link><h1 className="mt-4 text-3xl font-semibold tracking-tight">Edit product</h1></div>
      <Suspense><Edit params={params} /></Suspense>
    </main>
  )
}
