'use client';

import { useRef, useState } from 'react';

interface Props {
  label: string;
  hint: string;
  accept?: string;
  onFile: (file: File) => void;
  selected?: string | null;
}

export function DropZone({ label, hint, accept, onFile, selected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
      className={`p-9 text-center cursor-pointer transition ${
        drag ? 'bg-faint' : 'bg-hover'
      }`}
    >
      <div className="text-[12px] font-medium mb-1">{selected ?? label}</div>
      <div className="mono text-[10px] text-muted mb-3">{hint}</div>
      <button type="button" className="btn-small">Choose file</button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </div>
  );
}
