import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicIcon } from "@/components/site/DynamicIcon";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";
import { pickList, pickText, useServices, useSettings } from "@/lib/use-site-data";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Our Studio | NexusCrafters" },
      {
        name: "description",
        content:
          "A small development studio building custom websites, Discord bots and Discord servers with clean code and honest pricing.",
      },
      { property: "og:title", content: "About Our Studio" },
      {
        property: "og:description",
        content: "How we work: custom builds, fast delivery and source files you own.",
      },
    ],
  }),
  component: AboutPage,
});

type WhyFeature = { title: string; description: string };

const workflow = [
  { title: "Discovery", description: "We collect your requirements, references and must-haves." },
  { title: "Quote & scope", description: "A fixed price and package confirmed in writing." },
  { title: "Build", description: "Custom development with progress updates." },
  { title: "Review", description: "You test it; revisions are included in every package." },
  { title: "Handover", description: "Full source files, ZIP and setup documentation." },
  { title: "Aftercare", description: "Add features or revisions any time as add-ons." },
];

function AboutPage() {
  const { data: settings } = useSettings();
  const { data: services = [] } = useServices();
  const title = pickText(settings, "about", "title", "A small studio with a sharp focus");
  const description = pickText(
    settings,
    "about",
    "description",
    "We build custom websites, Discord bots and Discord servers to your requirements.",
  );
  const whyFeatures = pickList<WhyFeature>(settings, "why_us", "features", []);

  return (
    <SiteLayout>
      <PageHero eyebrow="About" title={title} description={description} />

      <section className="container-page py-16">
        <SectionHeading
          align="left"
          eyebrow="What we do"
          title="Services built for creators and small businesses"
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <Reveal key={service.id} delay={index * 60}>
              <div className="hover-lift h-full rounded-2xl border border-border bg-card p-6">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                  <DynamicIcon name={service.icon} />
                </span>
                <h3 className="mt-4 text-base font-semibold">{service.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface/40 py-16">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Approach"
              title="How we develop"
              description="No templates, no page builders, no bloat. Everything is written by hand and handed over in full."
            />
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Custom code, built for your exact requirements",
                "Mobile-first responsive design on every project",
                "Performance and accessibility considered from the start",
                "Clear file structure so you can maintain it later",
                "Complete ZIP or source repository at delivery",
              ].map((item) => (
                <li key={item} className="flex gap-2.5 text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {whyFeatures.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 50}>
                <div className="hover-lift h-full rounded-2xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <SectionHeading eyebrow="Workflow" title="From idea to handover" />
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {workflow.map((step, index) => (
            <Reveal key={step.title} delay={index * 60}>
              <li className="hover-lift h-full rounded-2xl border border-border bg-card p-6">
                <span className="font-display text-sm font-bold text-primary">
                  Step {index + 1}
                </span>
                <h3 className="mt-2 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="container-page pb-20">
        <Reveal>
          <div className="hero-surface glass-panel flex flex-col items-center gap-4 rounded-3xl px-6 py-12 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Let's build your project</h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Share your requirements and get a fixed quote — usually the same day.
            </p>
            <Button asChild variant="hero" size="lg">
              <Link to="/contact">Get Started</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </SiteLayout>
  );
}
