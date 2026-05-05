import type { Lesson } from '@shared/types';

interface Props {
  lessons: Lesson[];
  hasAccess: boolean;
}

export function LessonList({ lessons, hasAccess }: Props) {
  if (lessons.length === 0) {
    return <div className="mono text-[10px] text-muted py-4">No lessons defined.</div>;
  }
  return (
    <div>
      {lessons.map((l, i) => (
        <div key={l.id} className="flex justify-between items-center py-2 row-divider">
          <div className="flex items-center gap-3">
            <span className="mono text-[10px] text-muted">{String(i + 1).padStart(2, '0')}</span>
            <span className="text-[11px]">{l.title}</span>
          </div>
          {i === 0 ? (
            <span className="tag-lime">Free preview</span>
          ) : hasAccess ? (
            <span className="tag-outline">Unlocked</span>
          ) : (
            <span className="mono text-[9px] uppercase text-muted tracking-[0.05em]">Locked</span>
          )}
        </div>
      ))}
    </div>
  );
}
