"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Folder } from "lucide-react";

interface FolderCardProps {
  name: string;
  href: string;
  coverKey?: string;
}

export default function FolderCard({ name, href, coverKey }: FolderCardProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!coverKey) return;
    let cancelled = false;
    fetch(`/api/sign?key=${encodeURIComponent(coverKey)}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setCoverUrl(data.url ?? null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [coverKey]);

  return (
    <Link
      href={href}
      className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/30 transition-all group"
    >
      {/* Cover image */}
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {coverKey ? (
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          ) : (
            <Folder size={36} className="text-yellow-400" fill="currentColor" stroke="none" />
          )}
        </div>
      )}

      {/* Name overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pt-6 pb-2">
        <p className="text-xs text-white font-medium truncate">{name}</p>
      </div>
    </Link>
  );
}
