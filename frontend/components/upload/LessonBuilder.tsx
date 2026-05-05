'use client';

import { useState } from 'react';

export interface DraftLesson {
  title: string;
  file: File | null;
}

interface Props {
  lessons: DraftLesson[];
  onChange: (next: DraftLesson[]) => void;
}

export function LessonBuilder({ lessons, onChange }: Props) {
  const [title, setTitle] = useState('');

  const add = () => {
    if (!title.trim()) return;
    onChange([...lessons, { title: title.trim(), file: null }]);
    setTitle('');
  };

  const remove = (i: number) => {
    onChange(lessons.filter((_, idx) => idx !== i));
  };

  const setFile = (i: number, file: File) => {
    onChange(lessons.map((l, idx) => (idx === i ? { ...l, file } : l)));
  };

  return (
    <div>
      <div className="label mb-2">Lessons</div>
      {lessons.length === 0 && (
        <div className="mono text-[10px] text-muted py-2">No lessons yet — add the first one below.</div>
      )}
      {lessons.map((l, i) => (
        <div key={i} className="flex justify-between items-center py-2 row-divider">
          <div className="flex items-center gap-3">
            <span className="mono text-[10px] text-muted">{String(i + 1).padStart(2, '0')}</span>
            <span className="text-[11px]">{l.title}</span>
            {l.file ? (
              <span className="mono text-[9px] text-muted">[{l.file.name}]</span>
            ) : (
              <label className="mono text-[9px] underline cursor-pointer text-ink">
                attach file
                <input
                  type="file"
                  accept="video/mp4,application/pdf"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(i, f); }}
                />
              </label>
            )}
          </div>
          <button type="button" onClick={() => remove(i)} className="mono text-[10px] text-muted hover:text-ink">
            remove
          </button>
        </div>
      ))}
      <div className="flex items-center gap-3 mt-3">
        <input
          className="input-line flex-1"
          placeholder="Lesson title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <button type="button" onClick={add} className="btn-small">Add lesson</button>
      </div>
    </div>
  );
}
