export default function SimpleBarChart({ data, heightClassName = 'h-40' }) {
  const normalized = Array.isArray(data) ? data : [];
  const max = normalized.reduce((acc, d) => Math.max(acc, Number(d.value) || 0), 0);

  return (
    <div className={`w-full ${heightClassName}`}>
      <div className="flex h-full items-end gap-3">
        {normalized.map((d) => {
          const value = Number(d.value) || 0;
          const ratio = max > 0 ? value / max : 0;
          const barHeight = Math.max(4, Math.round(ratio * 100));
          return (
            <div key={d.key ?? d.label} className="flex h-full flex-1 flex-col items-center gap-2">
              <div className="flex h-full w-full items-end">
                <div
                  title={`${d.label}: ${value}`}
                  className="w-full rounded bg-slate-400"
                  style={{ height: `${barHeight}%` }}
                />
              </div>
              <div className="max-w-[90px] truncate text-center text-xs text-slate-700">{d.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

