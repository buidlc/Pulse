interface Stat {
  label: string;
  value: string;
  sub?: string;
  tag?: string;
}

interface Props {
  stats: Stat[];
}

const DESKTOP_COL_CLASS: Record<number, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
};

export function StatsRow({ stats }: Props) {
  const cols = DESKTOP_COL_CLASS[stats.length] ?? 'md:grid-cols-4';
  return (
    <div className={`heavy-divider grid grid-cols-2 ${cols}`}>
      {stats.map((s, i) => {
        return (
          <div
            key={i}
            className="px-4 md:px-7 py-4 md:py-5"
          >
            <div className="label-tight mb-2">{s.label}</div>
            <div className="display text-[28px] md:text-[40px] leading-none">{s.value}</div>
            {s.sub && <div className="mono text-[10px] text-muted mt-1">{s.sub}</div>}
            {s.tag && <span className="tag-lime mt-2 inline-block">{s.tag}</span>}
          </div>
        );
      })}
    </div>
  );
}
