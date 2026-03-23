export default function StatCard({ title, value, hint }) {
  return (
    <div className="rounded border border-slate-200 bg-white/70 p-4">
      <div className="text-sm text-slate-600">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

