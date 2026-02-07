import React, { useEffect, useMemo, useRef, useState } from 'react'

export default function MultiSelect({ options, value, onChange, placeholder = 'Select...', className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Map for easy label lookup
  const labelMap = useMemo(() => {
    const m = new Map()
    for (const opt of options || []) m.set(String(opt.value), opt.label)
    return m
  }, [options])

  const selectedLabels = (value || []).map(v => labelMap.get(String(v)) || String(v))

  useEffect(() => {
    const onDocClick = (e) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const toggleValue = (val) => {
    const s = new Set((value || []).map(String))
    const key = String(val)
    if (s.has(key)) s.delete(key)
    else s.add(key)
    onChange(Array.from(s))
  }

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button type="button" className="border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 w-full text-left bg-white dark:bg-slate-700" onClick={() => setOpen(o => !o)}>
        {selectedLabels.length ? (
          <div className="flex flex-wrap gap-1">
            {selectedLabels.map((lbl, idx) => (
              <span key={idx} className="inline-flex items-center rounded bg-slate-200 dark:bg-slate-600 px-2 py-0.5 text-xs dark:text-white">{lbl}</span>
            ))}
          </div>
        ) : (
          <span className="text-slate-500 dark:text-slate-400">{placeholder}</span>
        )}
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg">
          {(options || []).filter(opt => opt && opt.value !== undefined).map((opt, idx) => {
            const checked = (value || []).map(String).includes(String(opt.value))
            return (
              <label key={`${opt.value}-${idx}`} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer select-none">
                <input type="checkbox" className="accent-blue-600 dark:accent-[#F0B429]" checked={checked} onChange={() => toggleValue(opt.value)} />
                <span className="text-sm dark:text-white">{opt.label}</span>
              </label>
            )
          })}
          {(!options || options.length === 0) && (
            <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">No options</div>
          )}
        </div>
      )}
    </div>
  )
}
