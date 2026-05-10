interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export function PieChart({ data }: { data: ChartData[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  if (total === 0) {
    return (
      <div className="text-xs text-gray-400 text-center py-10">
        No sales data yet
      </div>
    );
  }

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
        {data.map((slice, i) => {
          const angle = (slice.value / total) * 360;
          const x1 = 50 + 50 * Math.cos((Math.PI * currentAngle) / 180);
          const y1 = 50 + 50 * Math.sin((Math.PI * currentAngle) / 180);
          const x2 = 50 + 50 * Math.cos((Math.PI * (currentAngle + angle)) / 180);
          const y2 = 50 + 50 * Math.sin((Math.PI * (currentAngle + angle)) / 180);
          const largeArc = angle > 180 ? 1 : 0;

          const path = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`;
          currentAngle += angle;

          return (
            <path
              key={i}
              d={path}
              fill={slice.color}
              stroke="white"
              strokeWidth="1"
            />
          );
        })}
      </svg>
    </div>
  );
}

export function Histogram({ data }: { data: ChartData[] }) {
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex items-end justify-between h-40 gap-2 pt-6">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
          <div className="relative w-full flex justify-center">
            <span className="absolute -top-6 text-[10px] bg-gray-800 text-white px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              ₦{item.value.toLocaleString()}
            </span>
            <div
              style={{ height: `${(item.value / max) * 100}%` }}
              className="w-full bg-[#0d2818] opacity-80 hover:opacity-100 transition-all rounded-t-sm min-h-[4px]"
            />
          </div>
          <span className="text-[10px] text-gray-400 rotate-0 truncate w-full text-center">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
