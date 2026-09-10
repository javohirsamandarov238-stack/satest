/**
 * One icon family: 16px box, 1.5 stroke, round caps, currentColor.
 * Kept deliberately plain so the answer bubbles stay the only expressive shape.
 */

interface IconProps {
  size?: number
  className?: string
}

function Svg({ size = 16, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export const IconOverview = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h7" />
  </Svg>
)

export const IconPractice = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="5.5" />
    <circle cx="8" cy="8" r="1.75" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconTest = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="9" r="5.5" />
    <path d="M8 6.25V9l2 1.25M6.25 1.5h3.5" />
  </Svg>
)

export const IconReview = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 2.5h10v11l-5-2.5-5 2.5z" />
    <path d="M6 6.5l1.5 1.5L10 5.5" />
  </Svg>
)

export const IconProgress = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 13.5h11" />
    <path d="M4.5 11V7.5M8 11V3.5M11.5 11V6" />
  </Svg>
)

export const IconFlag = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Svg {...p}>
    <path d="M4 14.5V2.5" />
    <path d="M4 3h8l-1.75 2.75L12 8.5H4z" fill={filled ? 'currentColor' : 'none'} />
  </Svg>
)

export const IconDoc = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 1.75h5l3 3v9.5H4z" />
    <path d="M9 1.75v3h3" />
  </Svg>
)

export const IconMoon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13 9.5A5.5 5.5 0 016.5 3a5.5 5.5 0 106.5 6.5z" />
  </Svg>
)

export const IconSun = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="3" />
    <path d="M8 1v1.5M8 13.5V15M15 8h-1.5M2.5 8H1M12.95 3.05l-1.06 1.06M4.11 11.89l-1.06 1.06M12.95 12.95l-1.06-1.06M4.11 4.11L3.05 3.05" />
  </Svg>
)

export const IconLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 3L5 8l5 5" />
  </Svg>
)

export const IconRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3l5 5-5 5" />
  </Svg>
)

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 8.5L6.5 12 13 4.5" />
  </Svg>
)

export const IconClose = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </Svg>
)

/** The product mark: a 2×2 answer grid with the first bubble filled in. */
export function Monogram({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="4.25" fill="currentColor" />
      <circle cx="18" cy="8" r="4.25" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
      <circle cx="8" cy="18" r="4.25" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
      <circle cx="18" cy="18" r="4.25" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
    </svg>
  )
}

/** Trailing arrow used on primary actions. */
export const IconArrow = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 8h11M9.5 4l4 4-4 4" />
  </Svg>
)
