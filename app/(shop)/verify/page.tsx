import CertificateLookup from '@/components/CertificateLookup'

export const metadata = { title: 'Certificate Check · Givora World' }

export default function VerifyPage() {
  return (
    <main className="container-x py-10 md:py-16">
      <p className="eyebrow reveal mb-3">Certificate check</p>
      <h1 className="reveal d1 max-w-2xl text-3xl font-semibold tracking-tight md:text-5xl"><span className="text-glow-green">Verify a piece.</span></h1>
      <p className="reveal d2 mt-5 max-w-xl text-[#a1a1a1]">Enter a serial to open the piece’s public certificate: artist, mint date, fingerprint, current owner and its full recorded history. On the certificate you can also check a file against the minted fingerprint, right in your browser.</p>
      <div className="reveal d3 mt-10 max-w-xl"><CertificateLookup /></div>
    </main>
  )
}
