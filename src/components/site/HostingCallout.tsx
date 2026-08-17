import { Check, Server } from "lucide-react";
import { pickText, useSettings } from "@/lib/use-site-data";

export function HostingCallout() {
  const { data: settings } = useSettings();
  const title = pickText(settings, "hosting", "title", "Domain & Hosting");
  const description = pickText(
    settings,
    "hosting",
    "description",
    "Domain and hosting are not included in service prices.",
  );

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <Server className="size-5" aria-hidden />
        </span>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-primary">Website deployment — FREE</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <ul className="mt-5 grid gap-2.5 text-sm sm:grid-cols-2">
        {[
          "Own domain + hosting → deployment is FREE",
          "No hosting? Complete project ZIP is FREE",
          "Free hosting used where suitable, at no cost",
          "Domain & hosting not included in prices",
        ].map((item) => (
          <li key={item} className="flex gap-2 text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
