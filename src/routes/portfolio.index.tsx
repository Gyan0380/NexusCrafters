import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { MediaGallery } from "@/components/site/MediaGallery";
import { PortfolioCard } from "@/components/site/PortfolioCard";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";
import { CATEGORY_LABELS } from "@/lib/cms";
import { cn } from "@/lib/utils";
import { useProjects } from "@/lib/use-site-data";

export const Route = createFileRoute("/portfolio/")({
  head: () => ({
    meta: [
      { title: "Portfolio — Websites, Bots & Discord Servers | NexusCrafters" },
      {
        name: "description",
        content:
          "Browse delivered projects: custom websites, Discord bots and community servers with technologies, screenshots and live links.",
      },
      { property: "og:title", content: "Portfolio — Delivered Projects" },
      {
        property: "og:description",
        content: "Websites, Discord bots and Discord servers we have designed and built.",
      },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { data: projects = [], isLoading } = useProjects();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(projects.map((project) => project.category)))],
    [projects],
  );

  const featured = projects.filter((project) => project.featured);
  const filtered = projects.filter((project) => {
    const matchesCategory = category === "all" || project.category === category;
    const term = query.trim().toLowerCase();
    const matchesQuery =
      !term ||
      project.title.toLowerCase().includes(term) ||
      project.description.toLowerCase().includes(term) ||
      project.technologies.some((tech) => tech.toLowerCase().includes(term));
    return matchesCategory && matchesQuery;
  });

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Portfolio"
        title="Work we have shipped"
        description="Websites, Discord bots and community servers — search or filter by category."
      />

      {featured.length ? (
        <section className="container-page py-14">
          <SectionHeading align="left" eyebrow="Featured" title="Highlighted projects" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.slice(0, 3).map((project, index) => (
              <Reveal key={project.id} delay={index * 60}>
                <PortfolioCard project={project} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      <section className="container-page py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search
              className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects…"
              aria-label="Search projects"
              className="h-11 pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={cn(
                  "cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                  category === item
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {item === "all" ? "All" : (CATEGORY_LABELS[item] ?? item)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project, index) => (
            <Reveal key={project.id} delay={index * 50}>
              <PortfolioCard project={project} />
            </Reveal>
          ))}
        </div>

        {!filtered.length ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {isLoading ? "Loading projects…" : "No projects to show yet — check back soon."}
          </p>
        ) : null}
      </section>

      <MediaGallery />
    </SiteLayout>
  );
}
