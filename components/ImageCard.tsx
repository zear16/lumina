"use client";

import { useState, useEffect } from "react";
import { ImageIcon } from "lucide-react";

interface ImageCardProps {
  name: string;
  gcsKey: string;
  onClick: () => void;
}

export default function ImageCard({ name, gcsKey, onClick }: ImageCardProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sign?key=${encodeURIComponent(gcsKey)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setUrl(data.url ?? null);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => { cancelled = true; };
  }, [gcsKey]);

  return (
    <button
      onClick={onClick}
      className="group relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/30 transition-all"
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      ) : error ? (
        <div className="w-full h-full flex items-center justify-center text-gray-600">
          <ImageIcon size={32} />
        </div>
      ) : (
        <div className="w-full h-full animate-pulse bg-white/5" />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs text-gray-300 truncate">{name}</p>
      </div>
    </button>
  );
}
