"use client"

import * as React from "react"

// ============================================================================
// PixelDog - Interactive pixel art dog SVG component
// ============================================================================

interface PixelDogProps {
  className?: string
}

export function PixelDog({ className }: PixelDogProps) {
  const handleClick = () => {
    // Little bark animation
    const dog = document.getElementById('pixel-dog')
    if (dog) {
      dog.classList.add('animate-bounce')
      setTimeout(() => dog.classList.remove('animate-bounce'), 500)
    }
  }

  return (
    <div className={className} onClick={handleClick}>
      <svg id="pixel-dog" width="48" height="48" viewBox="0 0 16 16" shapeRendering="crispEdges" className="cursor-pointer">
        {/* Ears - wiggle on hover */}
        <rect x="2" y="2" width="2" height="3" className="fill-amber-600 dark:fill-amber-500 origin-bottom group-hover/dog:animate-pulse" />
        <rect x="12" y="2" width="2" height="3" className="fill-amber-600 dark:fill-amber-500 origin-bottom group-hover/dog:animate-pulse" />
        {/* Head */}
        <rect x="3" y="4" width="10" height="6" className="fill-amber-400 dark:fill-amber-300" />
        {/* Face markings */}
        <rect x="5" y="5" width="6" height="4" className="fill-amber-100 dark:fill-amber-50" />
        {/* Eyes - visible by default, hidden on hover */}
        <g className="group-hover/dog:hidden">
          <rect x="5" y="6" width="2" height="2" className="fill-gray-800 dark:fill-gray-900" />
          <rect x="9" y="6" width="2" height="2" className="fill-gray-800 dark:fill-gray-900" />
          <rect x="5" y="6" width="1" height="1" className="fill-white" />
          <rect x="9" y="6" width="1" height="1" className="fill-white" />
        </g>

        {/* Closed Eyes (^ ^) - hidden by default, visible on hover */}
        <g className="hidden group-hover/dog:block">
          {/* Left Eye ^ */}
          <rect x="5" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
          <rect x="6" y="6" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
          <rect x="7" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />

          {/* Right Eye ^ */}
          <rect x="9" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
          <rect x="10" y="6" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
          <rect x="11" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
        </g>
        {/* Nose */}
        <rect x="7" y="8" width="2" height="1" className="fill-gray-800 dark:fill-gray-900" />
        {/* Tongue - always visible for happy face */}
        <rect x="7" y="9" width="2" height="1" className="fill-pink-400" />
        {/* Body */}
        <rect x="4" y="10" width="8" height="4" className="fill-amber-400 dark:fill-amber-300" />
        {/* Chest */}
        <rect x="6" y="10" width="4" height="3" className="fill-amber-100 dark:fill-amber-50" />
        {/* Tail - static */}
        <rect x="12" y="11" width="2" height="2" className="fill-amber-600 dark:fill-amber-500 origin-left" />
        {/* Feet */}
        <rect x="4" y="14" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
        <rect x="10" y="14" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
      </svg>
    </div>
  )
}
