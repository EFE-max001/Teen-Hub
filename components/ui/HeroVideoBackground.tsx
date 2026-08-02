// Teen-Hub/components/ui/HeroVideoBackground.tsx
// components/ui/HeroVideoBackground.tsx
//
// The "starter background" video, generated from the prompt written for
// this — sits behind the interactive 3D scene (portal/butterflies/roots)
// in the hero only. Deliberately NOT position:fixed the way SentinelBackground
// is: that fixed layer is what was bleeding through every section below the
// hero and hurting text legibility (ticker, "The Path Forward" heading).
// This is `absolute` inside the hero <section>, so it scrolls away with it
// like any other hero layer instead of persisting behind the whole page.
export default function HeroVideoBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-45"
        src="/videos/glowing-portal-forest.mp4"
        poster="/videos/glowing-portal-forest-poster.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />
      {/* Darken + fade toward the bottom edge so the ticker/next section
          transition stays clean regardless of how bright a given frame
          of the video is */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(3,6,10,0.35) 0%, rgba(3,6,10,0.15) 40%, rgba(3,6,10,0.75) 100%)',
        }}
      />
    </div>
  )
}