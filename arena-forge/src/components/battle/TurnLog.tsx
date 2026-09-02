import { useEffect, useRef } from 'react'

interface TurnLogProps { log: string[] }

export function TurnLog({ log }: TurnLogProps) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { ref.current?.scrollTo(0, ref.current.scrollHeight) }, [log])

  return (
    <div className="flex flex-col" style={{ borderTop: '2px solid #2e3755' }}>
      <div className="px-3 py-1.5 flex items-center gap-2"
           style={{ background: '#141726', borderBottom: '1px solid #2e3755' }}>
        <span className="text-px-dim text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: 'monospace' }}>Battle Log</span>
      </div>
      <div ref={ref} className="overflow-y-auto px-3 py-2 flex flex-col gap-0.5" style={{ maxHeight: 120, background: '#0c0e1a' }}>
        {log.map((line, i) => {
          const isSep = line.startsWith('───')
          const isResult = line.startsWith('🏆') || line.startsWith('💀')
          return (
            <p key={i}
               className="text-xs leading-relaxed"
               style={{
                 color: isSep ? '#4a5578' : isResult ? '#ffd166' : '#8892b8',
                 fontFamily: isSep ? 'monospace' : 'inherit',
                 fontSize: isSep ? 9 : 12,
               }}>
              {line}
            </p>
          )
        })}
      </div>
    </div>
  )
}
