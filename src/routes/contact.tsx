import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";
import { createContactRequest } from "@/lib/cms";
import { pickText, usePackages, useServices, useSettings } from "@/lib/use-site-data";

const searchSchema = z.object({
  service: z.string().max(120).optional(),
  package: z.string().max(120).optional(),
});

export const Route = createFileRoute("/contact")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Contact & Request a Quote | NexusCrafters" },
      {
        name: "description",
        content:
          "Tell us about your website, Discord bot or server project and get a fixed quote — usually the same day.",
      },
      { property: "og:title", content: "Contact & Request a Quote" },
      {
        property: "og:description",
        content: "Send your requirements and get a fixed price quote for your project.",
      },
    ],
  }),
  component: ContactPage,
});

const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  service: z.string().trim().max(120).optional(),
  package: z.string().trim().max(120).optional(),
  budget: z.string().trim().max(60).optional(),
  requirements: z.string().trim().max(2000).optional(),
  message: z.string().trim().max(2000).optional(),
});

const budgets = ["Under ₹200", "₹200 – ₹500", "₹500 – ₹1,000", "₹1,000+", "Not sure yet"];

function ContactPage() {
  const search = Route.useSearch();
  const { data: settings } = useSettings();
  const { data: services = [] } = useServices();
  const { data: packages = [] } = usePackages();
  const email = pickText(settings, "footer", "email", "hello@novacraft.studio");

  const [form, setForm] = useState({
    name: "",
    email: "",
    service: search.service ?? "",
    package: search.package ?? "",
    budget: "",
    requirements: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const selectedService = services.find((service) => service.name === form.service);
  const servicePackages = selectedService
    ? packages.filter((pkg) => pkg.service_id === selectedService.id)
    : packages;

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof inquirySchema>) => {
      await createContactRequest({
        name: values.name,
        email: values.email,
        service: values.service || null,
        package: values.package || null,
        budget: values.budget || null,
        requirements: values.requirements || null,
        message: values.message || null,
      });
    },
    onSuccess: () => {
      setSent(true);
      toast.success("Request sent — we'll reply by email shortly.");
    },
    onError: () => toast.error("Could not send your request. Please try again."),
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = inquirySchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value })),
  });

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Get started"
        title="Tell us what you need"
        description="Share your requirements and we will reply with a fixed quote. No automatic payments — nothing is charged from this form."
      />

      <section className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          {sent ? (
            <div className="glass-panel flex flex-col items-start gap-4 rounded-3xl p-8">
              <CheckCircle2 className="size-10 text-primary" aria-hidden />
              <h2 className="text-2xl font-bold">Request received</h2>
              <p className="text-sm text-muted-foreground">
                Thanks {form.name.split(" ")[0]} — we have your requirements and will reply to{" "}
                {form.email} shortly with a fixed quote.
              </p>
              <Button variant="glass" onClick={() => setSent(false)}>
                Send another request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 sm:p-8" noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" maxLength={100} className="mt-2" {...field("name")} />
                  {errors["name"] ? (
                    <p className="mt-1.5 text-xs text-destructive">{errors["name"]}</p>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    maxLength={255}
                    className="mt-2"
                    {...field("email")}
                  />
                  {errors["email"] ? (
                    <p className="mt-1.5 text-xs text-destructive">{errors["email"]}</p>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="service">Service</Label>
                  <select
                    id="service"
                    value={form.service}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        service: event.target.value,
                        package: "",
                      }))
                    }
                    className="mt-2 h-9 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select a service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.name}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="package">Package</Label>
                  <select
                    id="package"
                    value={form.package}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, package: event.target.value }))
                    }
                    className="mt-2 h-9 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select a package</option>
                    {servicePackages.map((pkg) => (
                      <option key={pkg.id} value={pkg.name}>
                        {pkg.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="budget">Budget</Label>
                  <select
                    id="budget"
                    value={form.budget}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, budget: event.target.value }))
                    }
                    className="mt-2 h-9 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select a budget range</option>
                    {budgets.map((budget) => (
                      <option key={budget} value={budget}>
                        {budget}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    rows={4}
                    maxLength={2000}
                    placeholder="Pages, features, systems, references…"
                    className="mt-2"
                    {...field("requirements")}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={3}
                    maxLength={2000}
                    placeholder="Anything else we should know?"
                    className="mt-2"
                    {...field("message")}
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="mt-7 w-full sm:w-auto"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Sending…" : "Request a Quote"}
              </Button>
            </form>
          )}

          <aside className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold">Prefer email?</h2>
              <a
                href={`mailto:${email}`}
                className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Mail className="size-4" aria-hidden /> {email}
              </a>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold">What happens next</h2>
              <ol className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                <li>1. We review your requirements.</li>
                <li>2. You get a fixed quote and timeline.</li>
                <li>3. We start once you confirm.</li>
              </ol>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Domain and hosting are not included in service prices. Deployment is free when you
              provide your own domain and hosting.
            </div>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}
