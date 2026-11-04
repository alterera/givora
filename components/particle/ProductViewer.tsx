'use client'

import dynamic from 'next/dynamic'
import type { ParticleViewerProps } from './ParticleViewer'

const ParticleViewer = dynamic(() => import('./ParticleViewer'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', background: '#000' }} />,
})

export default function ProductViewer(props: ParticleViewerProps) {
  return <ParticleViewer {...props} />
}
