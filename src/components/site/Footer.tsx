import { Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { pickList, pickText, useSettings } from "@/lib/use-site-data";

type Social = { label: string; url: string };

export function Footer() {
  const { data: settings } = useSettings();
  const brand = pickText(settings, "footer", "business_name", "NexusCrafters");
  const description = pickText(
    settings,
    "footer",
    "description",
    "Custom websites, Discord bots and professional Discord servers.",
  );
  const email = pickText(settings, "footer", "email", "hello@novacraft.studio");
  const phone = pickText(settings, "footer", "phone", "");
  const socials = pickList<Social>(settings, "footer", "socials", []);

  return (
    <footer className="mt-24 border-t border-border bg-surface/40">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <img
              src={pickText(settings, "footer", "logo_url", "/nexus-crafters-logo.png")}
              alt={`${brand} logo`}
              className="size-8 rounded-lg object-cover"
            />
            <span className="font-display text-base font-bold">{brand}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Services</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              <Link to="/services" className="transition-colors hover:text-foreground">
                Custom Websites
              </Link>
            </li>
            <li>
              <Link to="/services" className="transition-colors hover:text-foreground">
                Custom Discord Bots
              </Link>
            </li>
            <li>
              <Link to="/services" className="transition-colors hover:text-foreground">
                Custom Discord Servers
              </Link>
            </li>
            <li>
              <Link to="/services" className="transition-colors hover:text-foreground">
                Domain &amp; Hosting
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Quick links</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              <Link to="/pricing" className="transition-colors hover:text-foreground">
                Pricing
              </Link>
            </li>
            <li>
              <Link to="/portfolio" className="transition-colors hover:text-foreground">
                Portfolio
              </Link>
            </li>
            <li>
              <Link to="/about" className="transition-colors hover:text-foreground">
                About
              </Link>
            </li>
            <li>
              <Link to="/faq" className="transition-colors hover:text-foreground">
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Contact</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-primary" aria-hidden />
              <a href={`mailto:${email}`} className="transition-colors hover:text-foreground">
                {email}
              </a>
            </li>
            {phone ? <li>{phone}</li> : null}
            <li>
              <Link to="/contact" className="transition-colors hover:text-foreground">
                Request a quote
              </Link>
            </li>
          </ul>
          {socials.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.url || "#"}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                >
                  {social.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="divider-glow" />
      <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row">
        <p>
          © {new Date().getFullYear()} {brand}. All rights reserved.
        </p>
        <p>Domain &amp; hosting are not included in service prices.</p>
      </div>
    </footer>
  );
}
