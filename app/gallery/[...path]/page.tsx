import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listObjects } from "@/lib/gcs";
import GalleryGrid from "@/components/GalleryGrid";
import Breadcrumb from "@/components/Breadcrumb";

interface Props {
  params: { path: string[] };
}

export default async function GalleryPathPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const segments = params.path.map((s) => decodeURIComponent(s));
  const prefix = segments.join("/");
  const items = await listObjects(prefix);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb segments={segments} />
      <h1 className="text-2xl font-semibold mb-6">{segments[segments.length - 1]}</h1>
      <GalleryGrid items={items} pathSegments={segments} />
    </main>
  );
}
