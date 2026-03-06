"use client";

import { useState } from "react";
import type { GCSItem } from "@/lib/gcs";
import FolderCard from "./FolderCard";
import ImageCard from "./ImageCard";
import Lightbox from "./Lightbox";

interface GalleryGridProps {
  items: GCSItem[];
  pathSegments: string[];
}

export default function GalleryGrid({ items, pathSegments }: GalleryGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const folders = items.filter((i) => i.type === "folder");
  const images = items.filter((i) => i.type === "image");

  const basePath = pathSegments.length > 0 ? `/gallery/${pathSegments.join("/")}` : "/gallery";

  if (items.length === 0) {
    return (
      <div className="text-center text-gray-500 py-24">
        <p className="text-lg">No files here yet</p>
      </div>
    );
  }

  return (
    <>
      {folders.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Folders</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {folders.map((f) => (
              <FolderCard
                key={f.key}
                name={f.name}
                href={`${basePath}/${encodeURIComponent(f.name)}`}
                coverKey={f.coverKey}
              />
            ))}
          </div>
        </section>
      )}

      {images.length > 0 && (
        <section>
          {folders.length > 0 && (
            <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Photos</h2>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {images.map((img, i) => (
              <ImageCard
                key={img.key}
                name={img.name}
                gcsKey={img.key}
                onClick={() => setLightboxIndex(i)}
              />
            ))}
          </div>
        </section>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
