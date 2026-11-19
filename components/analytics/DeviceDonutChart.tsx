// components/analytics/DeviceDonutChart.tsx
'use client'

import { Smartphone, Monitor, Tablet } from 'lucide-react'

interface DeviceCounts {
  mobile: number
  desktop: number
  tablet: number
}

interface DeviceDonutChartProps {
  devices: DeviceCounts
}

export function DeviceDonutChart({ devices }: DeviceDonutChartProps) {
  const total = (devices.mobile || 0) + (devices.desktop || 0) + (devices.tablet || 0)

  const mobilePct = total > 0 ? Math.round((devices.mobile / total) * 100) : 0
  const desktopPct = total > 0 ? Math.round((devices.desktop / total) * 100) : 0
  const tabletPct = total > 0 ? Math.max(0, 100 - mobilePct - desktopPct) : 0

  return (
    <div className="space-y-4">
      {/* Barre de répartition horizontale visuelle */}
      <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
        {mobilePct > 0 && (
          <div
            style={{ width: `${mobilePct}%` }}
            className="bg-[#2563EB] transition-all duration-500"
            title={`Mobile: ${mobilePct}%`}
          />
        )}
        {desktopPct > 0 && (
          <div
            style={{ width: `${desktopPct}%` }}
            className="bg-[#06B6D4] transition-all duration-500"
            title={`Desktop: ${desktopPct}%`}
          />
        )}
        {tabletPct > 0 && (
          <div
            style={{ width: `${tabletPct}%` }}
            className="bg-[#F59E0B] transition-all duration-500"
            title={`Tablette: ${tabletPct}%`}
          />
        )}
      </div>

      {/* Détails par appareil */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center text-center">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center mb-1.5">
            <Smartphone className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Mobile</span>
          <span className="text-sm font-extrabold text-slate-900 mt-0.5">{mobilePct}%</span>
          <span className="text-[10px] text-slate-400">({devices.mobile})</span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center text-center">
          <div className="w-8 h-8 rounded-lg bg-cyan-50 text-[#06B6D4] flex items-center justify-center mb-1.5">
            <Monitor className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Desktop</span>
          <span className="text-sm font-extrabold text-slate-900 mt-0.5">{desktopPct}%</span>
          <span className="text-[10px] text-slate-400">({devices.desktop})</span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center text-center">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#F59E0B] flex items-center justify-center mb-1.5">
            <Tablet className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Tablette</span>
          <span className="text-sm font-extrabold text-slate-900 mt-0.5">{tabletPct}%</span>
          <span className="text-[10px] text-slate-400">({devices.tablet})</span>
        </div>
      </div>
    </div>
  )
}

