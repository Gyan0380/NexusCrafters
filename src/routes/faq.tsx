import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";
import { cn } from "@/lib/utils";
import { useFaqs } from "@/lib/use-site-data";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Delivery, Pricing & Hosting | NexusCrafters" },
      {
        name: "description",
        content:
          "Answers about delivery times, source code, revisions, payments and why domain and hosting are not included in prices.",
      },
      { property: "og:title", content: "Frequently Asked Questions" },
      {
        property: "og:description",
        content: "Delivery times, source files, revisions, payments and hosting answered.",
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const { data: faqs = [] } = useFaqs();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(faqs.map((faq) => faq.category)))],
    [faqs],
  );

  const filtered = faqs.filter((faq) => {
    const matchesCategory = category === "all" || faq.category === category;
    const term = query.trim().toLowerCase();
    const matchesQuery =
      !term ||
      faq.question.toLowerCase().includes(term) ||
      faq.answer.toLowerCase().includes(term);
    return matchesCategory && matchesQuery;
  });

  return (
    <SiteLayout>
      <PageHero
        eyebrow="FAQ"
        title="Questions, answered"
        description="Search the questions we get asked most. Anything missing? Just reach out."
      />

      <section className="container-page py-12">
        <div className="mx-auto max-w-3xl">
          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search questions…"
              aria-label="Search FAQs"
              className="h-11 pl-10"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={cn(
                  "cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-all",
                  category === item
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>

          <Accordion type="single" collapsible className="mt-8 space-y-3">
            {filtered.map((faq) => (
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

          {!filtered.length ? (
            <p className="mt-10 text-center text-sm text-muted-foreground">
              No questions matched your search.
            </p>
          ) : null}

          <div className="mt-12 text-center">
            <Button asChild variant="hero">
              <Link to="/contact">Ask us directly</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
