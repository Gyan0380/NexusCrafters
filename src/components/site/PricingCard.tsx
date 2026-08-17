import { Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPrice, type PricingPackage } from "@/lib/cms";

export function PricingCard({
  pkg,
  serviceName,
  compact = false,
}: {
  pkg: PricingPackage;
  serviceName?: string | undefined;
  compact?: boolean | undefined;
}) {
  return (
    <article
      className={cn(
        "hover-lift relative flex h-full flex-col rounded-2xl border border-border bg-card p-6",
        pkg.popular && "border-primary/60 bg-surface-2",
      )}
    >
      {pkg.popular ? (
        <span className="absolute -top-3 right-5 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          <Sparkles className="size-3" aria-hidden /> Popular
        </span>
      ) : null}

      {serviceName ? (
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {serviceName}
        </p>
      ) : null}
      <h3 className="mt-2 text-lg font-semibold">{pkg.name}</h3>
      <p className="mt-3 font-display text-3xl font-bold text-gradient">{formatPrice(pkg)}</p>
      {pkg.description ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pkg.description}</p>
      ) : null}

      {!compact && pkg.features.length ? (
        <ul className="mt-5 flex-1 space-y-2.5 text-sm">
          {pkg.features.map((feature) => (
            <li key={feature} className="flex gap-2.5 text-muted-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex-1" />
      )}

      <Button
        asChild
        variant={pkg.popular ? "hero" : "glass"}
        className="mt-6 w-full"
        aria-label={`Get started with ${pkg.name}`}
      >
        <Link to="/contact" search={{ package: pkg.name, service: serviceName ?? "" }}>
          Get Started
        </Link>
      </Button>
    </article>
  );
}
