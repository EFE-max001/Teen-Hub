import { Stars as DreiStars } from '@react-three/drei'

// Procedural starfield (drei's Stars is exactly the "procedural starfield,
// no heavy textures" primitive the design spec calls for). Count is adaptive
// — fewer points on mobile to protect the 60 FPS target.
export default function Stars({ isMobile = false }: { isMobile?: boolean }) {
  return (
    <DreiStars
      radius={70}
      depth={40}
      count={isMobile ? 700 : 1600}
      factor={2.2}
      saturation={0}
      fade
      speed={0.35}
    />
  )
}