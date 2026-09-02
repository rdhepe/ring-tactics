interface HPBarProps {
  hp: number
  maxHp: number
  showNumbers?: boolean
  size?: 'sm' | 'md'
}

export function HPBar({ hp, maxHp, showNumbers = false, size = 'md' }: HPBarProps) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  const color =
    pct > 55 ? '#38d9a9' :
    pct > 28 ? '#ffd166' :
               '#f45e3f'
  const h = size === 'sm' ? 6 : 10
  return (
    <div className="w-full">
      <div
        className="w-full relative"
        style={{
          height: h,
          background: '#1d2235',
          border: '1px solid #2e3755',
          outline: '1px solid #0c0e1a',
        }}
      >
        <div
          className="absolute top-0 left-0 h-full transition-all duration-300"
          style={{ width: `${pct}%`, background: color }}
        />
        {/* pixel notches every 25% */}
        {[25, 50, 75].map(p => (
          <div
            key={p}
            className="absolute top-0 h-full w-px"
            style={{ left: `${p}%`, background: 'rgba(0,0,0,.4)' }}
          />
        ))}
      </div>
      {showNumbers && (
        <p className="text-right text-[10px] text-px-muted mt-0.5 font-bold"
           style={{ fontFamily: 'monospace' }}>
          {hp}<span className="text-px-dim">/{maxHp}</span>
        </p>
      )}
    </div>
  )
}
