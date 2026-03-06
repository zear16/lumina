import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listObjects } from "@/lib/gcs";
import GalleryGrid from "@/components/GalleryGrid";

export default async function GalleryRootPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const items = await listObjects("");

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Photos</h1>
      <GalleryGrid items={items} pathSegments={[]} />
    </main>
  );
}
