'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbProps {
  /** Override auto-generated segment labels with custom text */
  customLabels?: Record<string, string>
  /** Hide the component when on the root path "/" */
  hideOnHome?: boolean
  /** Additional Tailwind classes for the nav container */
  className?: string
}

/** Converts a URL segment to a human-readable label.
 *  "user-settings" → "User Settings"
 *  "my_profile"    → "My Profile"
 */
function segmentToLabel(segment: string): string {
  return segment
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

interface Crumb {
  label: string
  href: string
}

/**
 * Breadcrumb navigation component.
 *
 * Reads the current route automatically via `usePathname()` and builds a
 * crumb trail from the path segments.  On small screens (< md) the middle
 * crumbs are collapsed and replaced by a "…" button that expands on tap.
 */
export default function Breadcrumb({
  customLabels,
  hideOnHome = false,
  className,
}: BreadcrumbProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)

  // Optionally hide on the root path
  if (hideOnHome && (pathname === '/' || pathname === '')) return null

  // Build the full crumb list
  const segments = pathname.split('/').filter(Boolean)

  const crumbs: Crumb[] = [
    { label: 'Home', href: '/' },
    ...segments.map((seg, i) => ({
      label: customLabels?.[seg] ?? segmentToLabel(seg),
      href: '/' + segments.slice(0, i + 1).join('/'),
    })),
  ]

  // On mobile, collapse middle crumbs when there are more than 2 total.
  // `null` acts as a sentinel for the "…" ellipsis button.
  const shouldCollapse = crumbs.length > 2 && !expanded

  type VisibleItem = Crumb | null
  const visibleCrumbs: VisibleItem[] = shouldCollapse
    ? [crumbs[0], null, crumbs[crumbs.length - 1]]
    : crumbs

  return (
    <nav aria-label="breadcrumb" className={cn('py-2', className)}>
      <ol className="flex items-center gap-1 text-sm flex-wrap">
        {visibleCrumbs.map((crumb, index) => {
          // ── Ellipsis button (mobile collapsed state) ──────────────────────
          if (crumb === null) {
            return (
              <li key="ellipsis" className="flex items-center gap-1">
                <ChevronRight
                  className="w-4 h-4 text-gray-400"
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  aria-label="Show full breadcrumb path"
                  className="text-gray-500 hover:text-gray-800 transition-colors px-1 md:hidden"
                >
                  &hellip;
                </button>
              </li>
            )
          }

          const isFirst = index === 0
          const isLast = crumb === crumbs[crumbs.length - 1]

          return (
            <li key={crumb.href} className="flex items-center gap-1">
              {/* Separator — skip before the first item */}
              {!isFirst && (
                <ChevronRight
                  className="w-4 h-4 text-gray-400"
                  aria-hidden="true"
                />
              )}

              {isLast ? (
                // ── Current page — non-clickable ──────────────────────────
                <span
                  aria-current="page"
                  className="text-gray-900 font-medium flex items-center gap-1"
                >
                  {crumb.label === 'Home' && (
                    <House className="w-4 h-4 inline" aria-hidden="true" />
                  )}
                  {crumb.label}
                </span>
              ) : (
                // ── Ancestor crumb — clickable link ───────────────────────
                <Link
                  href={crumb.href}
                  aria-label={`Navigate to ${crumb.label}`}
                  className="text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1"
                >
                  {crumb.label === 'Home' && (
                    <House className="w-4 h-4 inline" aria-hidden="true" />
                  )}
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
