import type { SVGProps } from 'react'

/**
 * Robot glyph, kept as a local SVG because Reicon has no robot icon.
 * Drawn after the Lucide "bot" shape (ISC), same 24 px grid and round caps
 * as the Reicon outline icons used elsewhere.
 */
export function BotIcon({ size = 24, strokeWidth = 1.5, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  )
}
