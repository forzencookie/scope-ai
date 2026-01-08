"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import * as d3 from "d3-geo"
import { feature } from "topojson-client"
import type { Topology, GeometryCollection } from "topojson-specification"

// Simplified world map TopoJSON - 110m resolution (lightweight)
const WORLD_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json"

interface DottedWorldMapProps {
    className?: string
    dotColor?: string
    dotRadius?: number
    gridSpacing?: number
}

export function DottedWorldMap({
    className,
    dotColor = "#a8a29e", // stone-400
    dotRadius = 1.25,
    gridSpacing = 3.5
}: DottedWorldMapProps) {
    const svgRef = useRef<SVGSVGElement>(null)
    const [dots, setDots] = useState<{ x: number; y: number }[]>([])
    const [isLoaded, setIsLoaded] = useState(false)

    // Higher resolution canvas for more detail
    const width = 800
    const height = 450

    useEffect(() => {
        const generateDots = async () => {
            try {
                // Fetch the world topology
                const response = await fetch(WORLD_TOPOJSON_URL)
                const topology = await response.json() as Topology<{ land: GeometryCollection }>

                // Convert TopoJSON to GeoJSON
                const land = feature(topology, topology.objects.land)

                // Create a projection (Natural Earth looks nice for decorative maps)
                const projection = d3.geoNaturalEarth1()
                    .scale(160)
                    .translate([width / 2, height / 2])

                // Create a path generator for hit testing
                const path = d3.geoPath(projection)

                // Generate a grid of points and test which ones are on land
                const landDots: { x: number; y: number }[] = []

                for (let x = 0; x < width; x += gridSpacing) {
                    for (let y = 0; y < height; y += gridSpacing) {
                        // Convert screen coords back to geo coords
                        const coords = projection.invert?.([x, y])
                        if (coords) {
                            // Exclude Antarctica (lat < -55 roughly)
                            if (coords[1] < -55) continue

                            // Check if this point is on land
                            const point: GeoJSON.Point = { type: "Point", coordinates: coords }
                            // Use d3.geoContains to check if point is inside land polygons
                            if (d3.geoContains(land, coords)) {
                                landDots.push({ x, y })
                            }
                        }
                    }
                }

                setDots(landDots)
                setIsLoaded(true)
            } catch (error) {
                console.error("Failed to load world map:", error)
            }
        }

        generateDots()
    }, [gridSpacing])

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className={cn("", className)}
            aria-label="World map illustration"
        >
            {dots.map((dot, i) => (
                <circle
                    key={i}
                    cx={dot.x}
                    cy={dot.y}
                    r={dotRadius}
                    fill={dotColor}
                    style={{
                        opacity: isLoaded ? 1 : 0,
                        transform: isLoaded ? "scale(1)" : "scale(0)",
                        transition: `all 0.3s ease-out ${i * 0.0005}s`
                    }}
                />
            ))}
        </svg>
    )
}
