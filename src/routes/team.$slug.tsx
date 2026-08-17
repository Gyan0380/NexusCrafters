import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, AtSign, Instagram, MessageCircle, Phone, Send, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/Reveal";
import { SiteLayout } from "@/components/site/SiteLayout";
import { fetchTeamMemberBySlug } from "@/lib/cms";

export const Route = createFileRoute("/team/$slug")({
  head: () => ({
    meta: [
      { title: "Team Profile | NexusCrafters" },
      { name: "description", content: "Team member profile — bio, contact and social media." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: TeamProfile,
});

const PLATFORM_ICON: Record<string, typeof Instagram> = {
  Instagram: Instagram,
  Discord: MessageCircle,
  X: AtSign,
  Telegram: Send,
  WhatsApp: Phone,
};

function TeamProfile() {
  const { slug } = Route.useParams();
  const { data: member, isLoading } = useQuery({
    queryKey: ["team_member", slug],
    queryFn: () => fetchTeamMemberBySlug(slug),
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="container-page py-24 text-sm text-muted-foreground">Loading profile…</div>
      </SiteLayout>
    );
  }

  if (!member) {
    return (
      <SiteLayout>
        <div className="container-page py-24 text-center">
          <h1 className="text-3xl font-bold">Profile not found</h1>
          <p className="mt-3 text-muted-foreground">This profile may have been unpublished or moved.</p>
          <Button asChild variant="hero" className="mt-8">
            <Link to="/team">Back to team</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <article className="container-page py-14">
        <Link
          to="/team"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> All team members
        </Link>

        <Reveal>
          <div className="glass-panel mt-8 flex flex-col items-center gap-4 rounded-3xl p-8 text-center sm:p-12">
            <div className="grid size-32 place-items-center overflow-hidden rounded-full bg-secondary">
              {member.photo ? (
                <img src={member.photo} alt={member.name} className="size-full object-cover" />
              ) : (
                <UserRound className="size-14 text-muted-foreground" />
              )}
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">{member.name}</h1>
              {member.rank ? (
                <p className="mt-1 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  {member.rank}
                </p>
              ) : null}
            </div>

            {member.bio ? (
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{member.bio}</p>
            ) : null}

            {member.contact ? (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Contact:</span> {member.contact}
              </p>
            ) : null}

            {member.social_links.length ? (
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {member.social_links.map((link, index) => {
                  const Icon = PLATFORM_ICON[link.platform] ?? AtSign;
                  const isUrl = /^https?:\/\//i.test(link.handle);
                  return (
                    <a
                      key={index}
                      href={isUrl ? link.handle : undefined}
                      target={isUrl ? "_blank" : undefined}
                      rel={isUrl ? "noreferrer" : undefined}
                      className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      <Icon className="size-4" aria-hidden />
                      <span>{link.platform}</span>
                      <span className="text-muted-foreground">{link.handle}</span>
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>
        </Reveal>
      </article>
    </SiteLayout>
  );
}
