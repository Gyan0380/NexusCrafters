import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Star } from "lucide-react";
import { CATEGORY_LABELS, type PortfolioProject } from "@/lib/cms";

export function PortfolioCard({ project }: { project: PortfolioProject }) {
  return (
    <Link
      to="/portfolio/$slug"
      params={{ slug: project.slug }}
      className="hover-lift group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="relative aspect-16/10 overflow-hidden bg-surface-2">
        {project.main_image ? (
          <img
            src={project.main_image}
            alt={project.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="hero-surface grid size-full place-items-center font-display text-2xl font-bold text-muted-foreground">
            {project.title.slice(0, 2).toUpperCase()}
          </div>
        )}
        {project.featured ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
            <Star className="size-3" aria-hidden /> Featured
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
            {CATEGORY_LABELS[project.category] ?? project.category}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(project.project_date).toLocaleDateString("en-IN", {
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <h3 className="mt-3 text-base font-semibold">{project.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {project.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.technologies.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
          View project <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
