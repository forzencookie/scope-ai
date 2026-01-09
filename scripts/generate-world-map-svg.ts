/**
 * Script to generate static world map SVG dots
 * Run with: npx tsx scripts/generate-world-map-svg.ts
 */

import * as d3 from "d3-geo"
import { feature } from "topojson-client"
import type { Topology, GeometryCollection } from "topojson-specification"
import * as fs from "fs"
import * as path from "path"

const WORLD_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json"

async function generateWorldMapSVG() {
    console.log("Fetching world topology...")

    const response = await fetch(WORLD_TOPOJSON_URL)
    const topology = await response.json() as Topology<{ land: GeometryCollection }>

    const land = feature(topology, topology.objects.land)

    const width = 800
    const height = 450
    const gridSpacing = 3.5
    const dotRadius = 1.25

    const projection = d3.geoNaturalEarth1()
        .scale(160)
        .translate([width / 2, height / 2])

    const dots: { x: number; y: number }[] = []

    console.log("Generating dots...")

    for (let x = 0; x < width; x += gridSpacing) {
        for (let y = 0; y < height; y += gridSpacing) {
            const coords = projection.invert?.([x, y])
            if (coords) {
                // Exclude Antarctica
                if (coords[1] < -55) continue

                if (d3.geoContains(land, coords)) {
                    dots.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 })
                }
            }
        }
    }

    console.log(`Generated ${dots.length} dots`)

    // Generate SVG string
    const svgContent = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
${dots.map(dot => `  <circle cx="${dot.x}" cy="${dot.y}" r="${dotRadius}" />`).join('\n')}
</svg>`

    // Save to public folder
    const outputPath = path.join(process.cwd(), "public", "world-map-dots.svg")
    fs.writeFileSync(outputPath, svgContent)
    console.log(`Saved to ${outputPath}`)

    // Also generate a TypeScript component with embedded data
    const componentContent = `// Auto-generated static world map dots
// Generated with: npx tsx scripts/generate-world-map-svg.ts

import { cn } from "@/lib/utils"

interface StaticWorldMapProps {
    className?: string
    dotColor?: string
}

const dots = ${JSON.stringify(dots)}

export function StaticWorldMap({ className, dotColor = "#8b5cf6" }: StaticWorldMapProps) {
    return (
        <svg
            viewBox="0 0 800 450"
            className={cn("", className)}
            aria-label="World map illustration"
        >
            {dots.map((dot, i) => (
                <circle
                    key={i}
                    cx={dot.x}
                    cy={dot.y}
                    r={1.25}
                    fill={dotColor}
                />
            ))}
        </svg>
    )
}
`

    const componentPath = path.join(
        process.cwd(),
        "src",
        "components",
        "landing",
        "sections",
        "global-reach",
        "static-world-map.tsx"
    )
    fs.writeFileSync(componentPath, componentContent)
    console.log(`Saved component to ${componentPath}`)
}

generateWorldMapSVG().catch(console.error)
