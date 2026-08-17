import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/Reveal";
import { SiteLayout } from "@/components/site/SiteLayout";
import { CATEGORY_LABELS, fetchProjectBySlug } from "@/lib/cms";

export const Route = createFileRoute("/portfolio/$slug")({
  head: () => ({
    meta: [
      { title: "Project Details | NexusCrafters Portfolio" },
      {
        name: "description",
        content:
          "Project details: category, description, technologies, screenshots and links for work delivered by our studio.",
      },
      { property: "og:title", content: "Project Details" },
      {
        property: "og:description",
        content: "Category, technologies, screenshots and links for this delivered project.",
      },
    ],
  }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { slug } = Route.useParams();
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", slug],
    queryFn: () => fetchProjectBySlug(slug),
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="container-page py-24 text-sm text-muted-foreground">Loading project…</div>
      </SiteLayout>
    );
  }

  if (!project) {
    return (
      <SiteLayout>
        <div className="container-page py-24 text-center">
          <h1 className="text-3xl font-bold">Project not found</h1>
          <p className="mt-3 text-muted-foreground">
            This project may have been unpublished or moved.
          </p>
          <Button asChild variant="hero" className="mt-8">
            <Link to="/portfolio">Back to portfolio</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <article className="container-page py-14">
        <Link
          to="/portfolio"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> All projects
        </Link>

        <header className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border px-2.5 py-1">
                {CATEGORY_LABELS[project.category] ?? project.category}
              </span>
              <span className="rounded-full border border-border px-2.5 py-1 capitalize">
                {project.status}
              </span>
              <span>
                {new Date(project.project_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold sm:text-5xl">{project.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.project_url ? (
              <Button asChild variant="hero">
                <a href={project.project_url} target="_blank" rel="noreferrer noopener">
                  Live project <ExternalLink className="size-4" aria-hidden />
                </a>
              </Button>
            ) : null}
            {project.github_url ? (
              <Button asChild variant="glass">
                <a href={project.github_url} target="_blank" rel="noreferrer noopener">
                  <Github className="size-4" aria-hidden /> Source
                </a>
              </Button>
            ) : null}
          </div>
        </header>

        {project.main_image ? (
          <Reveal className="mt-10">
            <img
              src={project.main_image}
              alt={project.title}
              className="w-full rounded-3xl border border-border object-cover"
            />
          </Reveal>
        ) : null}

        <div className="mt-12 grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="text-xl font-bold">About this project</h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
              {project.description}
            </p>
          </div>
          <aside className="glass-panel h-fit rounded-2xl p-6">
            <h2 className="text-sm font-semibold">Technologies</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.technologies.length ? (
                project.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground"
                  >
                    {tech}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Not listed</span>
              )}
            </div>
            <div className="divider-glow my-5" />
            <h2 className="text-sm font-semibold">Want something like this?</h2>
            <Button asChild variant="hero" className="mt-3 w-full">
              <Link to="/contact">Request a Quote</Link>
            </Button>
          </aside>
        </div>

        {project.images.length ? (
          <section className="mt-14">
            <h2 className="text-xl font-bold">Screenshots</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {project.images.map((image, index) => (
                <Reveal key={image} delay={index * 60}>
                  <img
                    src={image}
                    alt={`${project.title} screenshot ${index + 1}`}
                    loading="lazy"
                    className="w-full rounded-2xl border border-border object-cover transition-transform duration-500 hover:scale-[1.01]"
                  />
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </SiteLayout>
  );
}
