// Edit this list to change the announcement strip on the home page.
// Keep every line something you can stand behind: it is shown to customers as fact.
const MESSAGES = [
  'Every piece is one-of-one: sold once, then it lives on its owner’s account',
  'Each artwork is fingerprinted with SHA-256 at mint',
  'Gift a piece to anyone, with a personal message and an unwrap moment',
  'A public certificate and a hash-chained provenance for every piece',
  'Resell to collectors on the marketplace and the artist earns a royalty',
]

/** Slim green announcement strip with a seamless marquee. Home page only. */
export default function Topbar() {
  const row = (key: string) => (
    <div key={key} className="flex" aria-hidden={key !== 'a'}>
      {MESSAGES.map((m) => <span key={m} className="topbar-item">{m}</span>)}
    </div>
  )
  return (
    <div className="topbar" role="region" aria-label="Announcements">
      <div className="topbar-track">{row('a')}{row('b')}</div>
    </div>
  )
}
