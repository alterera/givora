import Link from 'next/link'
import { Suspense } from 'react'
import { connection } from 'next/server'
import { requireAdmin, serverNow } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { markLedgerPaid, setFrozen, voidLedger } from '@/lib/actions/ledger'
import { fmtDate, inr } from '@/lib/format'

type Entry = {
  id: string; party: 'platform' | 'artist' | 'seller'; amount: number; status: 'held' | 'void' | 'paid'; release_at: string
  user_id: string | null; artist_name: string | null; orders: { products: { serial: string | null; title: string } } | null
}

async function Ledger() {
  await requireAdmin()
  await connection()
  const db = createAdminClient()
  const [{ data: entries }, { data: pieces }] = await Promise.all([
    db.from('ledger_entries').select('id, party, amount, status, release_at, user_id, artist_name, orders(products(serial, title))').order('created_at', { ascending: false }).limit(200),
    db.from('editions').select('id, frozen, owner_id, products(serial, title)').order('created_at', { ascending: false }).limit(100),
  ])
  const rows = (entries ?? []) as unknown as Entry[]
  const ids = [...new Set(rows.map((r) => r.user_id).filter((x): x is string => !!x))]
  const { data: profs } = ids.length ? await db.from('profiles').select('id, email').in('id', ids) : { data: [] }
  const email = new Map((profs ?? []).map((p) => [p.id, p.email]))
  const now = serverNow()
  const total = (status: string, party?: string) => rows.filter((r) => r.status === status && (!party || r.party === party)).reduce((s, r) => s + Number(r.amount), 0)

  return (
    <>
      <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
        {[['Held (cooling-off)', inr(total('held'))], ['Platform fees', inr(total('held', 'platform') + total('paid', 'platform'))], ['Paid out', inr(total('paid'))]].map(([k, v]) => (
          <div key={k} className="bg-black p-5"><p className="eyebrow mb-2">{k}</p><p className="text-2xl font-semibold tracking-tight">{v}</p></div>
        ))}
      </div>

      <section>
        <h2 className="mb-1 text-lg font-medium">Resale ledger</h2>
        <p className="mb-4 text-sm text-[#8f8f8f]">Entries are held 7 days after a sale. Pay sellers and artists outside the app, then mark them paid. Void an entry if the payment is refunded or disputed.</p>
        <div className="panel overflow-x-auto">
          <table className="table">
            <thead><tr><th>Piece</th><th>Party</th><th>To</th><th>Amount</th><th>Releases</th><th>Status</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => {
                const releasable = r.status === 'held' && new Date(r.release_at).getTime() <= now
                const p = r.orders?.products
                return (
                  <tr key={r.id}>
                    <td className="mono text-xs">{p?.serial ?? p?.title}</td>
                    <td>{r.party}</td>
                    <td className="text-xs text-[#a1a1a1]">{r.party === 'seller' ? email.get(r.user_id ?? '') : r.party === 'artist' ? r.artist_name : 'Givora'}</td>
                    <td className="mono">{inr(r.amount)}</td>
                    <td className="mono text-xs">{fmtDate(r.release_at)}</td>
                    <td><span className={`badge ${releasable ? 'badge-live' : ''}`}>{r.status === 'held' ? (releasable ? 'READY' : 'HELD') : r.status.toUpperCase()}</span></td>
                    <td className="flex justify-end gap-2">
                      {releasable && r.party !== 'platform' && <form action={markLedgerPaid}><input type="hidden" name="id" value={r.id} /><button className="btn">Mark paid</button></form>}
                      {r.status === 'held' && <form action={voidLedger}><input type="hidden" name="id" value={r.id} /><button className="btn btn-ghost">Void</button></form>}
                    </td>
                  </tr>
                )
              })}
              {!rows.length && <tr><td colSpan={7} className="text-center text-[#6b6b6b]">No resales yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-medium">Freeze a piece</h2>
        <p className="mb-4 text-sm text-[#8f8f8f]">Use when a payment is disputed or reversed. A frozen piece cannot be listed, bought or claimed, and its open listing is withdrawn.</p>
        <div className="panel overflow-x-auto">
          <table className="table">
            <thead><tr><th>Piece</th><th>Title</th><th>State</th><th /></tr></thead>
            <tbody>
              {(pieces ?? []).map((e) => {
                const p = e.products as unknown as { serial: string | null; title: string }
                return (
                  <tr key={e.id}>
                    <td className="mono text-xs">{p.serial}</td><td>{p.title}</td>
                    <td><span className={`badge ${e.frozen ? '' : 'badge-live'}`}>{e.frozen ? 'FROZEN' : 'ACTIVE'}</span></td>
                    <td className="text-right">
                      <form action={setFrozen}>
                        <input type="hidden" name="edition_id" value={e.id} />
                        <input type="hidden" name="frozen" value={e.frozen ? '0' : '1'} />
                        <button className="btn">{e.frozen ? 'Unfreeze' : 'Freeze'}</button>
                      </form>
                    </td>
                  </tr>
                )
              })}
              {!pieces?.length && <tr><td colSpan={4} className="text-center text-[#6b6b6b]">No sold pieces yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

export default function LedgerPage() {
  return (
    <main className="container-x flex flex-col gap-10 py-10 md:py-14">
      <div><Link href="/admin" className="eyebrow link-underline">← Dashboard</Link><h1 className="mt-4 text-3xl font-semibold tracking-tight">Ledger and holds</h1></div>
      <Suspense fallback={<div className="panel particle-skeleton relative h-64" />}><Ledger /></Suspense>
    </main>
  )
}
