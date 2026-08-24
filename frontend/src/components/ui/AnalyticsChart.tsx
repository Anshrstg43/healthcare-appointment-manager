import React from 'react';

interface BarChartProps {
  title: string;
  subtitle?: string;
  data: Array<{ label: string; value: number; color?: string }>;
  maxValue?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ title, subtitle, data, maxValue }) => {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="card space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="space-y-3 pt-2">
        {data.map((item, idx) => {
          const percentage = Math.min(Math.round((item.value / max) * 100), 100);
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="text-foreground font-semibold">{item.value}</span>
              </div>
              <div className="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.color || 'bg-primary'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  title: string;
  subtitle?: string;
  data: DonutSegment[];
  totalLabel?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({ title, subtitle, data, totalLabel = 'Total' }) => {
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  let cumulativePercent = 0;

  return (
    <div className="card space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
        {/* SVG Donut */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg viewBox="0 0 36 36" className="w-32 h-32 transform -rotate-90">
            {data.map((segment, idx) => {
              const percent = (segment.value / total) * 100;
              const strokeDasharray = `${percent} ${100 - percent}`;
              const strokeDashoffset = -cumulativePercent;
              cumulativePercent += percent;

              return (
                <circle
                  key={idx}
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke={segment.color}
                  strokeWidth="3.8"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold text-foreground">{total}</span>
            <span className="text-[10px] text-muted-foreground uppercase">{totalLabel}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 text-xs">
          {data.map((segment, idx) => {
            const percent = Math.round((segment.value / total) * 100);
            return (
              <div key={idx} className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-muted-foreground min-w-[90px]">{segment.label}</span>
                <span className="font-semibold text-foreground">{segment.value}</span>
                <span className="text-[11px] text-muted-foreground/80">({percent}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
