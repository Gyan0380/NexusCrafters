import { createFileRoute, Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";
import { useTeamMembers } from "@/lib/use-site-data";

export const Route = createFileRoute("/team/")({
  head: () => ({
    meta: [
      { title: "Our Team | NexusCrafters" },
      {
        name: "description",
        content: "Meet the team behind NexusCrafters — ranks, roles and social profiles.",
      },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { data: members = [], isLoading } = useTeamMembers();

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Team"
        title="Meet the people behind the work"
        description="Tap a profile to see their bio, contact details and social media."
      />

      <section className="container-page py-10 pb-20">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Loading team…</p>
        ) : members.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member, index) => (
              <Reveal key={member.id} delay={index * 50}>
                <Link
                  to="/team/$slug"
                  params={{ slug: member.slug }}
                  className="glass-panel group flex flex-col items-center gap-3 rounded-3xl p-6 text-center transition-transform hover:-translate-y-1"
                >
                  <div className="grid size-24 place-items-center overflow-hidden rounded-full bg-secondary ring-2 ring-transparent transition-colors group-hover:ring-primary">
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="size-full object-cover" />
                    ) : (
                      <UserRound className="size-10 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold">{member.name}</p>
                    {member.rank ? (
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                        {member.rank}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No team profiles published yet — check back soon.
          </p>
        )}
      </section>
    </SiteLayout>
  );
}
