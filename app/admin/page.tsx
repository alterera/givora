import Link from 'next/link'
import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'

async function Dashboard() {
  await requireAdmin()
  const db = createAdminClient()
  const [{ data: products }, { data: orders }] = await Promise.all([
    db.from('products').select("id, title, slug, serial, price_inr, stock, sold, status, asset_path").order('created_at', { ascending: false }),
    db.from('orders').select('id, buyer_email, amount, status, is_gift, created_at, products(title)').order('created_at', { ascending: false }).limit(50),
  ])
  const paid = (orders ?? []).filter((o) => o.status === 'paid')
  const revenue = paid.reduce((s, o) => s + Number(o.amount), 0)
  const stats = [['Products', String(products?.length ?? 0)], ['Paid orders', String(paid.length)], ['Revenue', `₹${revenue.toLocaleString('en-IN')}`]]
  return (
    <>
      <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
        {stats.map(([k, v]) => <div key={k} className="bg-black p-5"><p className="eyebrow mb-2">{k}</p><p className="text-2xl font-semibold tracking-tight">{v}</p></div>)}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Products</h2>
          <div className="flex gap-2"><Link href="/admin/ledger" className="btn">Ledger and holds</Link><Link href="/admin/products/new" className="btn btn-primary">+ New product</Link></div>
        </div>
        <div className="panel overflow-x-auto">
          <table className="table">
            <thead><tr><th>Title</th><th>Serial</th><th>Price</th><th>Sold</th><th>Status</th><th /></tr></thead>
            <tbody>
              {products?.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}{p.asset_path === 'pending' && <span className="badge ml-2 text-amber-300">Media missing</span>}</td><td className="mono text-xs">{p.serial}</td><td className="mono">₹{p.price_inr}</td><td className="mono">{p.sold ? "yes" : "no"}</td>
                  <td><span className={`badge ${p.status === 'published' ? 'badge-live' : ''}`}>{p.status}</span></td>
                  <td className="text-right"><Link href={`/admin/products/${p.id}`} className="link-underline">Edit</Link></td>
                </tr>
              ))}
              {!products?.length && <tr><td colSpan={6} className="text-center text-[#6b6b6b]">No products yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Recent orders</h2>
        <div className="panel overflow-x-auto">
          <table className="table">
            <thead><tr><th>When</th><th>Product</th><th>Buyer</th><th>Amount</th><th>Status</th><th>Gift</th></tr></thead>
            <tbody>
              {orders?.map((o) => (
                <tr key={o.id}>
                  <td className="mono text-xs">{new Date(o.created_at).toLocaleString()}</td>
                  <td>{(o.products as unknown as { title: string })?.title}</td>
                  <td>{o.buyer_email}</td><td className="mono">₹{o.amount}</td>
                  <td><span className="badge">{o.status}</span></td><td>{o.is_gift ? 'Yes' : ''}</td>
                </tr>
              ))}
              {!orders?.length && <tr><td colSpan={6} className="text-center text-[#6b6b6b]">No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

export default function AdminPage() {
  return (
    <main className="container-x flex flex-col gap-10 py-10 md:py-14">
      <div><p className="eyebrow mb-3">Admin</p><h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1></div>
      <Suspense fallback={<div className="panel particle-skeleton relative h-64" />}><Dashboard /></Suspense>
    </main>
  )
}
