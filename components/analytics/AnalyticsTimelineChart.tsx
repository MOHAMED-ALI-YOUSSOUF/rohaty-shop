// components/analytics/AnalyticsTimelineChart.tsx
'use client'

import { useState } from 'react'

export interface TimelineDataPoint {
  date: string
  label: string
  visits: number
  whatsapp: number
  product_views?: number
}

interface AnalyticsTimelineChartProps {
  data: TimelineDataPoint[]
  showProductViews?: boolean
  className?: string
}

export function AnalyticsTimelineChart({
  data,
  showProductViews = true,
  className = '',
}: AnalyticsTimelineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        Aucune donnée disponible pour cette période
      </div>
    )
  }

  // Calcul du max pour mise à l'échelle
  const maxVisits = Math.max(...data.map((d) => d.visits), 1)
  const maxWhatsapp = Math.max(...data.map((d) => d.whatsapp), 1)
  const maxProdViews = showProductViews ? Math.max(...data.map((d) => d.product_views || 0), 1) : 1
  const maxValue = Math.max(maxVisits, maxWhatsapp, maxProdViews, 5)

  const height = 220
  const paddingBottom = 30
  const paddingTop = 20
  const usableHeight = height - paddingBottom - paddingTop

  // Coordonnées X réparties uniformément
  const pointsCount = data.length
  const getX = (index: number, width: number) => {
    if (pointsCount <= 1) return width / 2
    return (index / (pointsCount - 1)) * (width - 40) + 20
  }

  const getY = (val: number) => {
    return height - paddingBottom - (val / maxValue) * usableHeight
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Légende */}
      <div className="flex items-center gap-6 mb-4 text-xs font-semibold flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#2563EB]" />
          <span className="text-slate-700">Visites</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#10B981]" />
          <span className="text-slate-700">Clics WhatsApp</span>
        </div>
        {showProductViews && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
            <span className="text-slate-700">Fiches produits vues</span>
          </div>
        )}
      </div>

      {/* Graphique SVG responsive */}
      <div className="relative w-full h-[240px] select-none">
        <svg
          viewBox={`0 0 600 ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="gradientVisits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradientWhatsapp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Lignes horizontales de repère */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = height - paddingBottom - pct * usableHeight
            const val = Math.round(pct * maxValue)
            return (
              <g key={pct}>
                <line
                  x1="10"
                  y1={y}
                  x2="590"
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x="15"
                  y={y - 4}
                  fill="#94A3B8"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {val}
                </text>
              </g>
            )
          })}

          {/* Tracer les surfaces et lignes */}
          {(() => {
            const width = 600
            const visitsPoints = data.map((d, i) => `${getX(i, width)},${getY(d.visits)}`).join(' ')
            const whatsappPoints = data.map((d, i) => `${getX(i, width)},${getY(d.whatsapp)}`).join(' ')
            const prodPoints = showProductViews
              ? data.map((d, i) => `${getX(i, width)},${getY(d.product_views || 0)}`).join(' ')
              : ''

            const firstX = getX(0, width)
            const lastX = getX(data.length - 1, width)
            const bottomY = height - paddingBottom

            const visitsArea = `${firstX},${bottomY} ${visitsPoints} ${lastX},${bottomY}`
            const whatsappArea = `${firstX},${bottomY} ${whatsappPoints} ${lastX},${bottomY}`

            return (
              <>
                {/* Surface Visits */}
                <polygon points={visitsArea} fill="url(#gradientVisits)" />
                {/* Surface WhatsApp */}
                <polygon points={whatsappArea} fill="url(#gradientWhatsapp)" />

                {/* Ligne Visites */}
                <polyline
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={visitsPoints}
                />

                {/* Ligne WhatsApp */}
                <polyline
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={whatsappPoints}
                />

                {/* Ligne Produits Vus */}
                {showProductViews && (
                  <polyline
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={prodPoints}
                  />
                )}

                {/* Points interactifs */}
                {data.map((d, i) => {
                  const cx = getX(i, width)
                  const cyVisits = getY(d.visits)
                  const cyWhatsapp = getY(d.whatsapp)
                  const isHovered = hoveredIndex === i

                  return (
                    <g key={d.date} className="cursor-pointer">
                      {/* Cercle Visites */}
                      <circle
                        cx={cx}
                        cy={cyVisits}
                        r={isHovered ? 5 : 3.5}
                        fill="#2563EB"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        className="transition-all duration-150"
                      />
                      {/* Cercle WhatsApp */}
                      <circle
                        cx={cx}
                        cy={cyWhatsapp}
                        r={isHovered ? 5 : 3.5}
                        fill="#10B981"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        className="transition-all duration-150"
                      />

                      {/* Label axe X */}
                      <text
                        x={cx}
                        y={height - 8}
                        textAnchor="middle"
                        fill={isHovered ? '#0F172A' : '#64748B'}
                        fontSize="10"
                        fontWeight={isHovered ? 'bold' : 'normal'}
                      >
                        {d.label}
                      </text>

                      {/* Zone invisible large pour déclencher le hover */}
                      <rect
                        x={cx - 15}
                        y={0}
                        width={30}
                        height={height}
                        fill="transparent"
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    </g>
                  )
                })}
              </>
            )
          })()}
        </svg>

        {/* Tooltip flottant au hover */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900/95 backdrop-blur text-white text-xs rounded-xl p-3 shadow-xl border border-slate-700 min-w-[150px] transition-all transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(hoveredIndex / (data.length - 1 || 1)) * 100}%`,
              top: '40px',
            }}
          >
            <p className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-2">
              {data[hoveredIndex].label}
            </p>
            <div className="space-y-1">
              <div className="flex justify-between items-center gap-3">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Visites:
                </span>
                <span className="font-bold">{data[hoveredIndex].visits}</span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> WhatsApp:
                </span>
                <span className="font-bold">{data[hoveredIndex].whatsapp}</span>
              </div>
              {showProductViews && data[hoveredIndex].product_views !== undefined && (
                <div className="flex justify-between items-center gap-3">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Produits:
                  </span>
                  <span className="font-bold">{data[hoveredIndex].product_views}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

