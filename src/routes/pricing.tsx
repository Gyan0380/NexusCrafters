import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HostingCallout } from "@/components/site/HostingCallout";
import { PricingCard } from "@/components/site/PricingCard";
import { Reveal } from "@/components/site/Reveal";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";
import { cn } from "@/lib/utils";
import { usePackages, useServices } from "@/lib/use-site-data";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Websites, Bots, Servers & Extras | NexusCrafters" },
      {
        name: "description",
        content:
          "Transparent pricing for custom websites (₹120+), Discord bots (₹299+), Discord servers (₹99+) and extra services (₹30+).",
      },
      { property: "og:title", content: "Pricing — Websites, Bots, Servers & Extras" },
      {
        property: "og:description",
        content: "Fixed, transparent package pricing with free deployment and full source files.",
      },
    ],
  }),
  component: PricingPage,
});

const tabs = [
  { key: "websites", label: "Websites" },
  { key: "discord_bots", label: "Discord Bots" },
  { key: "discord_servers", label: "Discord Servers" },
  { key: "extras", label: "Extras" },
] as const;

function PricingPage() {
  const [active, setActive] = useState<string>("websites");
  const { data: services = [] } = useServices();
  const { data: packages = [] } = usePackages();

  const visibleServices = services.filter((service) => service.category === active);
  const availableTabs = tabs.filter((tab) =>
    services.some((service) => service.category === tab.key),
  );

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Pricing"
        title="Simple, honest pricing"
        description="Pick a package or ask for a custom quote. Prices are managed live — what you see is current."
      />

      <section className="container-page py-12">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Pricing categories">
          {(availableTabs.length ? availableTabs : tabs).map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active === tab.key}
              onClick={() => setActive(tab.key)}
              className={cn(
                "cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-all",
                active === tab.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-10 space-y-14">
          {visibleServices.map((service) => {
            const servicePackages = packages.filter((pkg) => pkg.service_id === service.id);
            if (!servicePackages.length) return null;
            return (
              <div key={service.id}>
                <h2 className="text-xl font-bold sm:text-2xl">{service.name}</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {service.description}
                </p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {servicePackages.map((pkg, index) => (
                    <Reveal key={pkg.id} delay={index * 50}>
                      <PricingCard
                        pkg={pkg}
                        serviceName={service.name}
                        compact={service.category === "extras" && pkg.features.length === 0}
                      />
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })}
          {!visibleServices.length ? (
            <p className="text-sm text-muted-foreground">No packages in this category yet.</p>
          ) : null}
        </div>
      </section>

      <section className="container-page py-8">
        <HostingCallout />
      </section>

      <section className="container-page py-16">
        <Reveal>
          <div className="glass-panel flex flex-col items-center gap-4 rounded-3xl px-6 py-12 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Need something custom?</h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Bigger builds are quoted on requirements. Send us the details and we will confirm a
              fixed price.
            </p>
            <Button asChild variant="hero" size="lg">
              <Link to="/contact">Request a Quote</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </SiteLayout>
  );
}
