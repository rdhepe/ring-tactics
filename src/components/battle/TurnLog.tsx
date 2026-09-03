import { useEffect, useRef } from 'react'

interface TurnLogProps { log: string[]; maxHeight?: string | number }

export function TurnLog({ log, maxHeight = 'min(28vh, 220px)' }: TurnLogProps) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { ref.current?.scrollTo(0, ref.current.scrollHeight) }, [log])

  return (
    <div className="flex flex-col" style={{ borderTop: '2px solid #2e3755' }}>
      <div className="px-3 py-1.5 flex items-center gap-2"
           style={{ background: '#141726', borderBottom: '1px solid #2e3755' }}>
        <span className="text-px-dim text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: 'monospace' }}>Battle Log</span>
      </div>
      <div ref={ref} className="overflow-y-auto px-3 py-2 flex flex-col gap-0.5" style={{ maxHeight, background: '#0c0e1a' }}>
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

export function BattleLogModal({ log, onClose }: { log: string[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.72)' }} role="dialog" aria-modal="true" aria-label="Battle log">
      <div className="flex w-full max-w-2xl flex-col" style={{ maxHeight: '80vh', background: '#0c0e1a', border: '2px solid #445180', boxShadow: '0 8px 32px rgba(0,0,0,.9)' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ background: '#141726', borderBottom: '2px solid #2e3755' }}>
          <span className="text-px-gold font-bold uppercase" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10 }}>Battle Log</span>
          <button type="button" onClick={onClose} aria-label="Close battle log" className="flex h-7 w-7 items-center justify-center font-bold" style={{ background: '#1d2235', border: '1px solid #445180', color: '#e2e8ff' }}>x</button>
        </div>
        <TurnLog log={log} maxHeight="calc(80vh - 58px)" />
      </div>
    </div>
  )
}
