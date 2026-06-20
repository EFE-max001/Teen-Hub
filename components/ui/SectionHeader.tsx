interface SectionHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  centered?: boolean
}

export default function SectionHeader({ eyebrow, title, subtitle, centered = true }: SectionHeaderProps) {
  return (
    <div className={`mb-10 md:mb-14 ${centered ? 'text-center' : ''}`}>
      {eyebrow && (
        <div className={`inline-flex items-center gap-3 mb-3 ${centered ? 'justify-center' : ''}`}>
          <div className="w-6 h-px bg-purple-500/50" />
          <span className="font-orbitron text-[10px] text-purple-400 tracking-[0.4em] uppercase">
            {eyebrow}
          </span>
          <div className="w-6 h-px bg-purple-500/50" />
        </div>
      )}
      <h2 className="font-orbitron font-black text-2xl sm:text-3xl md:text-4xl text-white leading-tight">
        {title}
      </h2>
      <div className={`w-14 h-0.5 bg-gradient-to-r from-purple-600 to-purple-400 mt-3 mb-4 ${centered ? 'mx-auto' : ''}`} />
      {subtitle && (
        <p className="font-rajdhani text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}