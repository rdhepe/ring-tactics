import type { ReactNode } from 'react'
import battleBackground from '../../assets/backgrounds/background-1.jpg'

interface BattleFieldProps {
  children: ReactNode
}

export function BattleField({ children }: BattleFieldProps) {
  return (
    <div
      className="relative flex-1 flex flex-col justify-center overflow-y-auto"
      style={{
        backgroundImage: `linear-gradient(rgba(9,11,22,.22), rgba(9,11,22,.22)), url(${battleBackground})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute"
          style={{
            inset: '8px auto 8px 8px',
            width: 'calc(50% - 34px)',
            background: 'linear-gradient(90deg, rgba(8,12,24,.9), rgba(13,18,33,.76))',
            border: '1px solid rgba(255,209,102,.34)',
            borderLeft: '4px solid #ffd166',
            boxShadow: '8px 0 24px rgba(0,0,0,.4), inset 0 0 28px rgba(255,209,102,.04)',
            backdropFilter: 'blur(2px)',
          }}
        />
        <div
          className="absolute"
          style={{
            inset: '8px 8px 8px auto',
            width: 'calc(50% - 34px)',
            background: 'linear-gradient(270deg, rgba(8,12,24,.9), rgba(13,18,33,.76))',
            border: '1px solid rgba(244,94,63,.34)',
            borderRight: '4px solid #f45e3f',
            boxShadow: '-8px 0 24px rgba(0,0,0,.4), inset 0 0 28px rgba(244,94,63,.04)',
            backdropFilter: 'blur(2px)',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col justify-center min-h-full">
        {children}
      </div>
    </div>
  )
}