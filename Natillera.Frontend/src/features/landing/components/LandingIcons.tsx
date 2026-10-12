import type { ReactNode } from 'react'

const A = '#dcf5e8'

const base = (viewBox: string, defaultClass: string, children: ReactNode) =>
  function LandingSvg({ className = defaultClass }: { className?: string }) {
    return (
      <svg viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable={false} className={className}>
        {children}
      </svg>
    )
  }

export const LandingIcon = {
  Cuota: base('0 0 48 48', 'w-10 h-10', <>
    <circle cx="24" cy="15" r="9" fill={A} />
    <path d="M24 10v10M26.5 12h-3.5a1.75 1.75 0 000 3.5h2a1.75 1.75 0 010 3.5H21.5" />
    <path d="M24 27v3" />
    <rect x="9" y="32" width="30" height="9" rx="3" />
    <path d="M18 36.5h12" />
  </>),
  Presta: base('0 0 48 48', 'w-10 h-10', <>
    <circle cx="31" cy="14" r="7" fill={A} />
    <path d="M31 10.5v7" />
    <rect x="5" y="29" width="7" height="13" rx="1.5" />
    <path d="M12 31h7.5c1.5 0 3 .6 4 1.5l1.5 1.5h5a3 3 0 010 6H22" />
    <path d="M12 40.5l9.5 2.5c1.4.4 2.9.2 4.2-.4L41 36a3 3 0 00-2.6-5.4l-8 3.4" />
  </>),
  Reparto: base('0 0 48 48', 'w-10 h-10', <>
    <circle cx="24" cy="12" r="6.5" fill={A} />
    <path d="M19.5 18l-6 9M24 19v11M28.5 18l6 9" />
    <circle cx="11" cy="33" r="4" />
    <path d="M5 43a6 6 0 0112 0" />
    <circle cx="24" cy="35" r="4" />
    <path d="M18 45a6 6 0 0112 0" />
    <circle cx="37" cy="33" r="4" />
    <path d="M31 43a6 6 0 0112 0" />
  </>),
  Venta: base('0 0 48 48', 'w-10 h-10', <>
    <path d="M11 17h26l-2 24H13z" fill={A} />
    <path d="M18 17v-3a6 6 0 0112 0v3" />
    <path d="M24 36V25M19.5 29.5L24 25l4.5 4.5" />
  </>),
  Libreta: base('0 0 48 48', 'w-10 h-10', <>
    <rect x="9" y="6" width="24" height="34" rx="2" />
    <path d="M6 12h6M6 20h6M6 28h6M6 36h6" />
    <path d="M15 14h12M15 20h12M15 26h7" />
    <circle cx="34" cy="35" r="8" fill={A} />
    <path d="M30.5 35l2.5 2.5 5-5" />
  </>),
  Caja: base('0 0 48 48', 'w-10 h-10', <>
    <rect x="6" y="12" width="34" height="28" rx="3" />
    <path d="M6 19h24" />
    <rect x="28" y="21" width="14" height="10" rx="2" fill={A} />
    <circle cx="33" cy="26" r="1.5" />
  </>),
  Ahorro: base('0 0 48 48', 'w-10 h-10', <>
    <rect x="6" y="34" width="18" height="6" rx="2" fill={A} />
    <rect x="6" y="27" width="18" height="6" rx="2" fill={A} />
    <rect x="6" y="20" width="18" height="6" rx="2" fill={A} />
    <path d="M29 38l5-6 3 3 6-9" />
    <path d="M38 26h5v5" />
  </>),
  Aviso: base('0 0 48 48', 'w-10 h-10', <>
    <rect x="6" y="10" width="28" height="28" rx="3" />
    <path d="M6 18h28M13 6v8M27 6v8" />
    <circle cx="35" cy="35" r="8" fill={A} />
    <path d="M35 31v4.5l3 2" />
  </>),
  Movimientos: base('0 0 48 48', 'w-10 h-10', <>
    <circle cx="31" cy="13" r="6" fill={A} />
    <path d="M17 40V9M10 16l7-7 7 7" />
    <path d="M31 8v31M24 32l7 7 7-7" />
  </>),
  Trofeo: base('0 0 48 48', 'w-10 h-10', <>
    <path d="M15 8h18v10a9 9 0 01-18 0z" fill={A} />
    <path d="M15 12H9a5 5 0 005 7M33 12h6a5 5 0 01-5 7" />
    <path d="M24 27v6" />
    <rect x="17" y="33" width="14" height="7" rx="1.5" />
  </>),
  Flecha: base('0 0 48 16', 'w-12 h-4', <path d="M2 8h42M37 2l7 6-7 6" />),
}
