"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import type { GCSItem } from "@/lib/gcs";

interface LightboxProps {
  images: GCSItem[];
  initialIndex: number;
  onClose: () => void;
}

export default function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [url, setUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const hasDragged = useRef(false);
  const cache = useRef<Map<number, string>>(new Map());

  const current = images[index];

  const fetchUrl = useCallback(async (idx: number): Promise<string> => {
    if (cache.current.has(idx)) return cache.current.get(idx)!;
    const res = await fetch(`/api/sign?key=${encodeURIComponent(images[idx].key)}`);
    const data = await res.json();
    cache.current.set(idx, data.url);
    return data.url;
  }, [images]);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    fetchUrl(index).then((u) => { if (!cancelled) setUrl(u); });
    if (index + 1 < images.length) fetchUrl(index + 1);
    if (index - 1 >= 0) fetchUrl(index - 1);
    return () => { cancelled = true; };
  }, [index, fetchUrl, images.length]);

  // Navigate — preserve zoom & offset
  const goTo = useCallback((next: number) => {
    setIndex(next);
  }, []);

  const prev = useCallback(() => {
    if (index > 0) goTo(index - 1);
  }, [index, goTo]);

  const next = useCallback(() => {
    if (index < images.length - 1) goTo(index + 1);
  }, [index, images.length, goTo]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  // Scroll-wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(5, Math.max(1, z - e.deltaY * 0.001)));
  };

  // Mouse drag pan
  const handleMouseDown = (e: React.MouseEvent) => {
    hasDragged.current = false;
    if (zoom <= 1) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasDragged.current = true;
    setOffset({
      x: dragStart.current.ox + dx,
      y: dragStart.current.oy + dy,
    });
  };
  const handleMouseUp = () => setDragging(false);

  // Click on image: left half → prev, right half → next
  const handleImageClick = (e: React.MouseEvent) => {
    if (hasDragged.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) prev();
    else next();
  };

  // Touch: swipe to navigate (zoom=1) or drag to pan (zoom>1)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (zoom > 1) {
        dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, ox: offset.x, oy: offset.y };
      }
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (zoom > 1 && dragStart.current && e.touches.length === 1) {
      e.preventDefault();
      setOffset({
        x: dragStart.current.ox + e.touches[0].clientX - dragStart.current.x,
        y: dragStart.current.oy + e.touches[0].clientY - dragStart.current.y,
      });
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || zoom > 1) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      // swipe
      if (dx < 0) next();
      else prev();
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      // tap — navigate by position
      const x = e.changedTouches[0].clientX;
      if (x < window.innerWidth / 2) prev();
      else next();
    }
    touchStart.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent z-20">
        <span className="text-sm text-gray-400">
          {index + 1} / {images.length}
          <span className="ml-3 text-gray-500">{current.name}</span>
        </span>
        <div className="flex items-center gap-3">
          <button onClick={() => setZoom((z) => Math.min(5, z + 0.5))} className="text-gray-400 hover:text-white transition-colors">
            <ZoomIn size={20} />
          </button>
          <button onClick={() => setZoom((z) => Math.max(1, z - 0.5))} className="text-gray-400 hover:text-white transition-colors">
            <ZoomOut size={20} />
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Left tap zone */}
      {index > 0 && (
        <div
          onClick={prev}
          className="absolute left-0 top-0 w-1/3 h-full z-10 cursor-pointer flex items-center justify-start pl-3"
        >
          <div className="bg-black/40 hover:bg-black/70 rounded-full p-2 text-white transition-colors opacity-0 hover:opacity-100">
            <ChevronLeft size={28} />
          </div>
        </div>
      )}

      {/* Right tap zone */}
      {index < images.length - 1 && (
        <div
          onClick={next}
          className="absolute right-0 top-0 w-1/3 h-full z-10 cursor-pointer flex items-center justify-end pr-3"
        >
          <div className="bg-black/40 hover:bg-black/70 rounded-full p-2 text-white transition-colors opacity-0 hover:opacity-100">
            <ChevronRight size={28} />
          </div>
        </div>
      )}

      {/* Close zone (center) */}
      <div
        className="absolute inset-0 z-0"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      />

      {/* Image */}
      <div
        className="select-none relative z-10"
        style={{
          transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
          transition: dragging ? "none" : "transform 0.15s ease",
          cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default",
        }}
        onMouseDown={handleMouseDown}
        onClick={handleImageClick}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={current.name}
            className="max-h-dvh max-w-[100vw] w-auto h-auto object-contain"
            draggable={false}
          />
        ) : (
          <div className="w-64 h-64 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
