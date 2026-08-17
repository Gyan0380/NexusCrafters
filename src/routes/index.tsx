import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, MessageSquare, Rocket, Send, Sparkles } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { DynamicIcon } from "@/components/site/DynamicIcon";
import { HostingCallout } from "@/components/site/HostingCallout";
import { PortfolioCard } from "@/components/site/PortfolioCard";
import { PricingCard } from "@/components/site/PricingCard";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { SiteLayout } from "@/components/site/SiteLayout";
import { CATEGORY_LABELS, formatPrice } from "@/lib/cms";
import {
  pickList,
  pickText,
  useFaqs,
  usePackages,
  useProjects,
  useServices,
  useSettings,
} from "@/lib/use-site-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Custom Websites, Discord Bots & Servers | NexusCrafters" },
      {
        name: "description",
        content:
          "Build. Launch. Grow. Custom websites, Discord bots and professional Discord servers built to your requirements, from ₹99.",
      },
      { property: "og:title", content: "Custom Websites, Discord Bots & Servers" },
      {
        property: "og:description",
        content:
          "Custom websites, Discord bots and professional Discord servers built to your requirements.",
      },
    ],
  }),
  component: Home,
});

const steps = [
  {
    icon: MessageSquare,
    title: "Share your idea",
    description: "Tell us what you need — a site, a bot or a full server structure.",
  },
  {
    icon: Sparkles,
    title: "Get a fixed quote",
    description: "We confirm scope, package and final price before anything starts.",
  },
  {
    icon: Rocket,
    title: "We build it",
    description: "Custom build with progress updates and revisions along the way.",
  },
  {
    icon: Send,
    title: "Delivery & deploy",
    description: "You get the full source files. Deployment is free with your hosting.",
  },
];

type WhyFeature = { title: string; description: string };

function Home() {
  const { data: settings } = useSettings();
  const { data: services = [] } = useServices();
  const { data: packages = [] } = usePackages();
  const { data: projects = [] } = useProjects();
  const { data: faqs = [] } = useFaqs();

  const heroTitle = pickText(settings, "hero", "title", "Build. Launch. Grow.");
  const heroSubtitle = pickText(
    settings,
    "hero",
    "subtitle",
    "Custom websites, Discord bots and professional Discord servers built according to your requirements.",
  );
  const eyebrow = pickText(settings, "hero", "eyebrow", "Digital development studio");
  const whyHeading = pickText(settings, "why_us", "heading", "Why choose us");
  const whyDescription = pickText(
    settings,
    "why_us",
    "description",
    "Straightforward pricing, fast delivery and code you actually own.",
  );
  const whyFeatures = pickList<WhyFeature>(settings, "why_us", "features", []);
  const aboutTitle = pickText(settings, "about", "title", "A small studio with a sharp focus");
  const aboutDescription = pickText(
    settings,
    "about",
    "description",
    "We build custom websites, Discord bots and Discord servers to your requirements.",
  );

  const serviceById = new Map(services.map((service) => [service.id, service]));
  const previewPackages = packages
    .filter((pkg) => {
      const service = pkg.service_id ? serviceById.get(pkg.service_id) : undefined;
      return service && service.category !== "extras" && pkg.popular;
    })
    .slice(0, 3);
  const extras = packages.filter((pkg) => {
    const service = pkg.service_id ? serviceById.get(pkg.service_id) : undefined;
    return service?.category === "extras";
  });
  const featuredProjects = [...projects].sort(
    (a, b) => Number(b.featured) - Number(a.featured),
  ).slice(0, 3);

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="hero-surface relative overflow-hidden">
        <div className="container-page relative py-20 sm:py-28">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" /> {eyebrow}
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
              {heroTitle.split(" ").map((word, index) => (
                <span key={`${word}-${index}`} className={index === 2 ? "text-gradient" : ""}>
                  {word}{" "}
                </span>
              ))}
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {heroSubtitle}
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/services">
                  View Services <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="glass" size="lg">
                <Link to="/portfolio">View Portfolio</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link to="/contact">Get Started</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <dl className="mt-14 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                { label: "Starting from", value: "₹99" },
                { label: "Typical delivery", value: "1–5 days" },
                { label: "Source files", value: "Always" },
                { label: "Deployment", value: "Free" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 font-display text-xl font-bold">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* Intro */}
      <section className="container-page py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <SectionHeading align="left" eyebrow="Introduction" title={aboutTitle} description={aboutDescription} />
          <Reveal delay={100}>
            <HostingCallout />
          </Reveal>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="container-page py-12">
        <SectionHeading
          eyebrow="Services"
          title="What we build"
          description="Every service is custom-built and delivered with complete source files."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <Reveal key={service.id} delay={index * 70}>
              <article className="hover-lift flex h-full flex-col rounded-2xl border border-border bg-card p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
                  <DynamicIcon name={service.icon} />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{service.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {service.features.slice(0, 4).map((feature) => (
                    <li key={feature} className="flex gap-2 text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm text-muted-foreground">
                  From <span className="font-display text-lg font-bold text-foreground">{service.starting_price}</span>
                </p>
              </article>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild variant="glass">
            <Link to="/services">
              All services & packages <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="container-page py-20">
        <SectionHeading
          eyebrow="Pricing"
          title="Most popular packages"
          description="Transparent, fixed pricing. Full pricing for every category is on the pricing page."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {previewPackages.map((pkg, index) => (
            <Reveal key={pkg.id} delay={index * 70}>
              <PricingCard
                pkg={pkg}
                serviceName={pkg.service_id ? serviceById.get(pkg.service_id)?.name : undefined}
              />
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild variant="hero">
            <Link to="/pricing">See full pricing</Link>
          </Button>
        </div>
      </section>

      {/* Why choose us */}
      <section className="border-y border-border bg-surface/40 py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Why us" title={whyHeading} description={whyDescription} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {whyFeatures.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 60}>
                <div className="hover-lift h-full rounded-2xl border border-border bg-card p-6">
                  <h3 className="text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio preview */}
      {featuredProjects.length ? (
        <section className="container-page py-20">
          <SectionHeading
            eyebrow="Portfolio"
            title="Recent work"
            description="A selection of websites, bots and servers we have shipped."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProjects.map((project, index) => (
              <Reveal key={project.id} delay={index * 70}>
                <PortfolioCard project={project} />
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild variant="glass">
              <Link to="/portfolio">Browse portfolio</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {/* How it works */}
      <section className="container-page py-12">
        <SectionHeading eyebrow="Process" title="How it works" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Reveal key={step.title} delay={index * 70}>
              <div className="hover-lift h-full rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                    <step.icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-display text-2xl font-bold text-muted-foreground/40">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Extras */}
      {extras.length ? (
        <section className="container-page py-20">
          <SectionHeading
            eyebrow="Add-ons"
            title="Extra services"
            description="Add pages, features, revisions or urgent delivery to any project."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {extras.map((pkg, index) => (
              <Reveal key={pkg.id} delay={index * 40}>
                <div className="hover-lift h-full rounded-2xl border border-border bg-card p-5">
                  <p className="text-sm font-semibold">{pkg.name}</p>
                  <p className="mt-2 font-display text-2xl font-bold text-gradient">
                    {formatPrice(pkg)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {pkg.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      {faqs.length ? (
        <section className="container-page py-12">
          <SectionHeading eyebrow="FAQ" title="Common questions" />
          <div className="mx-auto mt-10 max-w-3xl">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.slice(0, 5).map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="rounded-xl border border-border bg-card px-5"
                >
                  <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <div className="mt-8 text-center">
              <Button asChild variant="ghost">
                <Link to="/faq">All questions</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {/* CTA */}
      <section className="container-page py-20">
        <Reveal>
          <div className="hero-surface glass-panel rounded-3xl px-6 py-14 text-center sm:px-12">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold sm:text-4xl">
              Ready to build something worth showing off?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Tell us what you need and get a fixed quote — usually the same day.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/contact">Request a Quote</Link>
              </Button>
              <Button asChild variant="glass" size="lg">
                <Link to="/pricing">View pricing</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Categories: {Object.values(CATEGORY_LABELS).slice(0, 4).join(" · ")}
            </p>
          </div>
        </Reveal>
      </section>
    </SiteLayout>
  );
}
