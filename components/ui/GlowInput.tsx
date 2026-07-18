import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'

interface GlowInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

interface GlowTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

interface GlowSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: { value: string; label: string }[]
}

const inputBase = `
  w-full bg-black/50 border text-slate-200 text-sm font-rajdhani
  px-4 py-3 transition-all duration-200
  focus:outline-none placeholder:text-slate-600
  appearance-none
`

const inputNormal = `border-cyan-500/25 focus:border-cyan-400/70 focus:shadow-[0_0_18px_rgba(34,211,238,0.18),inset_0_0_10px_rgba(34,211,238,0.04)]`
const inputError  = `border-red-500/60 focus:border-red-400 focus:shadow-[0_0_18px_rgba(220,38,38,0.2)]`

function CornerAccents() {
  return (
    <>
      <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50 pointer-events-none" />
      <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/50 pointer-events-none" />
      <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/50 pointer-events-none" />
      <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50 pointer-events-none" />
    </>
  )
}

export function GlowInput({ label, error, hint, className = '', ...props }: GlowInputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-[10px] font-orbitron tracking-[0.25em] text-cyan-300/70 uppercase">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={`${inputBase} ${error ? inputError : inputNormal} ${className}`}
          {...props}
        />
        <CornerAccents />
      </div>
      {hint && !error && (
        <p className="text-[11px] text-slate-600 font-rajdhani">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-red-400 font-rajdhani flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
}

export function GlowTextarea({ label, error, hint, className = '', ...props }: GlowTextareaProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-[10px] font-orbitron tracking-[0.25em] text-cyan-300/70 uppercase">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          className={`${inputBase} ${error ? inputError : inputNormal} resize-none ${className}`}
          {...props}
        />
        <CornerAccents />
      </div>
      {hint && !error && (
        <p className="text-[11px] text-slate-600 font-rajdhani">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-red-400 font-rajdhani flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
}

export function GlowSelect({ label, error, hint, options, className = '', ...props }: GlowSelectProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-[10px] font-orbitron tracking-[0.25em] text-cyan-300/70 uppercase">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`${inputBase} ${error ? inputError : inputNormal} cursor-pointer ${className}`}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-[#0d0017] text-slate-200">
              {opt.label}
            </option>
          ))}
        </select>
        {/* Custom dropdown arrow */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400/60 pointer-events-none text-xs">▼</span>
        <CornerAccents />
      </div>
      {hint && !error && (
        <p className="text-[11px] text-slate-600 font-rajdhani">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-red-400 font-rajdhani flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
}

export default GlowInput