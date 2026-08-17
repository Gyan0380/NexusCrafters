import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicIcon } from "@/components/site/DynamicIcon";
import { HostingCallout } from "@/components/site/HostingCallout";
import { PricingCard } from "@/components/site/PricingCard";
import { Reveal } from "@/components/site/Reveal";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";
import { formatPrice } from "@/lib/cms";
import { usePackages, useServices } from "@/lib/use-site-data";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Websites, Discord Bots & Servers | NexusCrafters" },
      {
        name: "description",
        content:
          "Custom websites from ₹120, Discord bots from ₹299 and Discord servers from ₹99 — every package with full source files.",
      },
      { property: "og:title", content: "Services — Websites, Discord Bots & Servers" },
      {
        property: "og:description",
        content: "Custom websites, Discord bots and Discord servers with complete source files.",
      },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { data: services = [] } = useServices();
  const { data: packages = [] } = usePackages();

  const mainServices = services.filter((service) => service.category !== "extras");
  const extrasService = services.find((service) => service.category === "extras");
  const extras = packages.filter((pkg) => pkg.service_id === extrasService?.id);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Services"
        title="Everything we build, in detail"
        description="Fixed packages for websites, Discord bots and Discord servers — plus add-ons and free deployment."
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="hero">
            <Link to="/contact">Get Started</Link>
          </Button>
          <Button asChild variant="glass">
            <Link to="/pricing">Compare pricing</Link>
          </Button>
        </div>
      </PageHero>

      {mainServices.map((service) => {
        const servicePackages = packages.filter((pkg) => pkg.service_id === service.id);
        return (
          <section key={service.id} className="container-page py-16">
            <Reveal>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-2xl">
                  <span className="mb-4 grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
                    <DynamicIcon name={service.icon} />
                  </span>
                  <h2 className="text-2xl font-bold sm:text-3xl">{service.name}</h2>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {service.description}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Starting at{" "}
                  <span className="font-display text-2xl font-bold text-gradient">
                    {service.starting_price}
                  </span>
                </p>
              </div>
            </Reveal>

            {servicePackages.length ? (
              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {servicePackages.map((pkg, index) => (
                  <Reveal key={pkg.id} delay={index * 60}>
                    <PricingCard pkg={pkg} serviceName={service.name} />
                  </Reveal>
                ))}
              </div>
            ) : service.features.length ? (
              <ul className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {service.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        );
      })}

      <section id="hosting" className="container-page py-8">
        <HostingCallout />
      </section>

      {extras.length ? (
        <section className="container-page py-16">
          <Reveal>
            <h2 className="text-2xl font-bold sm:text-3xl">Extra services</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Add-ons available for any project, before or after delivery.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
    </SiteLayout>
  );
}
