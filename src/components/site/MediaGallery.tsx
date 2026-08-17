import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { CATEGORY_LABELS } from "@/lib/cms";
import { cn } from "@/lib/utils";
import { usePortfolioMedia } from "@/lib/use-site-data";

/** Converts common YouTube URL shapes into an embeddable URL; returns null otherwise. */
function youtubeEmbedUrl(url: string): string | null {
  const patterns = [/youtu\.be\/([\w-]+)/, /youtube\.com\/watch\?v=([\w-]+)/, /youtube\.com\/embed\/([\w-]+)/];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
}

/** Public gallery of photos and videos uploaded from the admin panel. */
export function MediaGallery() {
  const { data: media = [], isLoading } = usePortfolioMedia();
  const [filter, setFilter] = useState("all");

  if (isLoading) {
    return (
      <div className="flex justify-center py-14">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!media.length) return null;

  const categories = ["all", ...Array.from(new Set(media.map((item) => item.category)))];
  const visible = filter === "all" ? media : media.filter((item) => item.category === filter);

  return (
    <section className="container-page py-14">
      <SectionHeading
        eyebrow="Gallery"
        title="Photos & videos"
        description="A closer look at recent work, straight from our studio gallery."
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setFilter(category)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              filter === category
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {category === "all" ? "All" : (CATEGORY_LABELS[category] ?? category)}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item, index) => (
          <Reveal key={item.id} delay={index * 60}>
            <figure className="glass-panel overflow-hidden rounded-3xl">
              <div className="aspect-video bg-secondary">
                {item.type === "video" ? (
                  youtubeEmbedUrl(item.url) ? (
                    <iframe
                      src={youtubeEmbedUrl(item.url) ?? undefined}
                      title={item.title}
                      className="size-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={item.url}
                      controls
                      preload="metadata"
                      className="size-full object-cover"
                    />
                  )
                ) : (
                  <img
                    src={item.url}
                    alt={item.title}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                )}
              </div>
              <figcaption className="p-4">
                <p className="font-medium">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                ) : null}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
