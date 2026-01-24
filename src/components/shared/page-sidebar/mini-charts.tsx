"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn, safeNumber, formatNumber } from "@/lib/utils"

// ============================================================================
// Types
// ============================================================================

export interface DataPoint {
    value: number
    label?: string
}

export interface DonutSegment {
    value: number
    label: string
    color: string
}

interface MiniChartBaseProps {
    title?: string
    description?: string
    className?: string
}

// ============================================================================
// Sparkline - Trend line for numeric data over time
// ============================================================================

interface SparklineProps extends MiniChartBaseProps {
    data: DataPoint[] | number[]
    height?: number
    color?: string
    showArea?: boolean
    showDots?: boolean
}

export function Sparkline({
    data,
    title,
    description,
    height = 40,
    color = "currentColor",
    showArea = true,
    showDots = false,
    className
}: SparklineProps) {
    const normalizedData = useMemo(() => {
        return data.map(d => typeof d === "number" ? { value: d } : d)
    }, [data])

    const path = useMemo(() => {
        if (normalizedData.length < 2) return null
        
        const values = normalizedData.map(d => safeNumber(d.value))
        const max = Math.max(...values)
        const min = Math.min(...values)
        const range = max - min || 1
        
        const width = 100
        const stepX = width / (values.length - 1)
        
        const points = values.map((v, i) => ({
            x: i * stepX,
            y: height - ((v - min) / range) * height
        }))
        
        // Create smooth curve using quadratic bezier
        let d = `M ${points[0].x} ${points[0].y}`
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1]
            const curr = points[i]
            const midX = (prev.x + curr.x) / 2
            d += ` Q ${prev.x} ${prev.y} ${midX} ${(prev.y + curr.y) / 2}`
        }
        d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`
        
        return { line: d, points }
    }, [normalizedData, height])

    if (normalizedData.length === 0) {
        return (
            <MiniChartCard title={title} description={description} className={className}>
                <div className="flex items-center justify-center h-10 text-xs text-muted-foreground">
                    Ingen data
                </div>
            </MiniChartCard>
        )
    }

    const chartContent = (
        <svg
            viewBox={`0 0 100 ${height}`}
            preserveAspectRatio="none"
            className="w-full"
            style={{ height }}
        >
            {showArea && path && (
                <path
                    d={`${path.line} L 100 ${height} L 0 ${height} Z`}
                    fill={color}
                    opacity={0.1}
                />
            )}
            {path && (
                <path
                    d={path.line}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                />
            )}
            {showDots && path?.points.map((p: { x: number; y: number }, i: number) => (
                <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={2}
                    fill={color}
                />
            ))}
        </svg>
    )

    if (title) {
        return (
            <MiniChartCard title={title} description={description} className={className}>
                {chartContent}
            </MiniChartCard>
        )
    }

    return chartContent
}

// ============================================================================
// DonutMini - Small donut chart for proportions
// ============================================================================

interface DonutMiniProps extends MiniChartBaseProps {
    data: DonutSegment[]
    size?: number
    strokeWidth?: number
    showLegend?: boolean
    centerLabel?: string
    centerValue?: string | number
}

export function DonutMini({
    data,
    title,
    description,
    size = 64,
    strokeWidth = 8,
    showLegend = true,
    centerLabel,
    centerValue,
    className
}: DonutMiniProps) {
    const segments = useMemo(() => {
        const total = data.reduce((sum, d) => sum + safeNumber(d.value), 0)
        if (total === 0) return []
        
        const radius = (size - strokeWidth) / 2
        const circumference = 2 * Math.PI * radius
        
        let offset = 0
        return data.map(d => {
            const percentage = safeNumber(d.value) / total
            const dashLength = percentage * circumference
            const segment = {
                ...d,
                percentage,
                dashArray: `${dashLength} ${circumference - dashLength}`,
                dashOffset: -offset,
                radius,
                circumference
            }
            offset += dashLength
            return segment
        })
    }, [data, size, strokeWidth])

    const total = data.reduce((sum, d) => sum + safeNumber(d.value), 0)

    if (segments.length === 0) {
        return (
            <MiniChartCard title={title} description={description} className={className}>
                <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
                    Ingen data
                </div>
            </MiniChartCard>
        )
    }

    const chartContent = (
        <div className="flex items-center gap-4">
            <div className="relative" style={{ width: size, height: size }}>
                <svg
                    viewBox={`0 0 ${size} ${size}`}
                    className="transform -rotate-90"
                >
                    {segments.map((segment, i) => (
                        <circle
                            key={i}
                            cx={size / 2}
                            cy={size / 2}
                            r={segment.radius}
                            fill="none"
                            stroke={segment.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={segment.dashArray}
                            strokeDashoffset={segment.dashOffset}
                        />
                    ))}
                </svg>
                {(centerLabel || centerValue !== undefined) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {centerValue !== undefined && (
                            <span className="text-sm font-semibold tabular-nums">
                                {typeof centerValue === "number" ? formatNumber(centerValue, "0") : centerValue}
                            </span>
                        )}
                        {centerLabel && (
                            <span className="text-[10px] text-muted-foreground">{centerLabel}</span>
                        )}
                    </div>
                )}
            </div>
            {showLegend && (
                <div className="flex-1 space-y-1">
                    {data.map((d, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                                <div
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: d.color }}
                                />
                                <span className="text-muted-foreground truncate">{d.label}</span>
                            </div>
                            <span className="font-medium tabular-nums">
                                {formatNumber(d.value)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )

    if (title) {
        return (
            <MiniChartCard title={title} description={description} className={className}>
                {chartContent}
            </MiniChartCard>
        )
    }

    return chartContent
}

// ============================================================================
// BarMini - Small horizontal bar chart
// ============================================================================

interface BarMiniItem {
    value: number
    label: string
    color?: string
}

interface BarMiniProps extends MiniChartBaseProps {
    data: BarMiniItem[]
    maxBars?: number
    showValues?: boolean
}

export function BarMini({
    data,
    title,
    description,
    maxBars = 5,
    showValues = true,
    className
}: BarMiniProps) {
    const displayData = data.slice(0, maxBars)
    const maxValue = Math.max(...displayData.map(d => safeNumber(d.value)), 1)

    if (displayData.length === 0) {
        return (
            <MiniChartCard title={title} description={description} className={className}>
                <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
                    Ingen data
                </div>
            </MiniChartCard>
        )
    }

    const chartContent = (
        <div className="space-y-2">
            {displayData.map((item, i) => {
                const width = (safeNumber(item.value) / maxValue) * 100
                return (
                    <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground truncate">{item.label}</span>
                            {showValues && (
                                <span className="font-medium tabular-nums shrink-0">
                                    {formatNumber(item.value)}
                                </span>
                            )}
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{
                                    width: `${width}%`,
                                    backgroundColor: item.color || "hsl(var(--primary))"
                                }}
                            />
                        </div>
                    </div>
                )
            })}
        </div>
    )

    if (title) {
        return (
            <MiniChartCard title={title} description={description} className={className}>
                {chartContent}
            </MiniChartCard>
        )
    }

    return chartContent
}

// ============================================================================
// Shared Card Wrapper
// ============================================================================

interface MiniChartCardProps {
    title?: string
    description?: string
    children: React.ReactNode
    className?: string
}

function MiniChartCard({ title, description, children, className }: MiniChartCardProps) {
    return (
        <Card className={cn("", className)}>
            {title && (
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">{title}</CardTitle>
                    {description && (
                        <CardDescription className="text-xs">{description}</CardDescription>
                    )}
                </CardHeader>
            )}
            <CardContent className={cn(title ? "pt-0" : "pt-4")}>
                {children}
            </CardContent>
        </Card>
    )
}
