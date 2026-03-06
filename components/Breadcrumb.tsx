"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbProps {
  segments: string[]; // e.g. ["trips", "2024", "tokyo"]
}

export default function Breadcrumb({ segments }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-gray-400 mb-6 flex-wrap">
      <Link href="/gallery" className="flex items-center gap-1 hover:text-white transition-colors">
        <Home size={14} />
        <span>Home</span>
      </Link>
      {segments.map((seg, i) => {
        const href = "/gallery/" + segments.slice(0, i + 1).map((s) => encodeURIComponent(s)).join("/");
        const isLast = i === segments.length - 1;
        return (
          <span key={href} className="flex items-center gap-1">
            <ChevronRight size={14} />
            {isLast ? (
              <span className="text-white">{seg}</span>
            ) : (
              <Link href={href} className="hover:text-white transition-colors">{seg}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
