import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Loader2, Plus, UserRound, X, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/lib/auth-context";
import {
  compressImageToBase64,
  fetchTeamMemberForUser,
  respondToAssignment,
  SOCIAL_PLATFORMS,
  updateOwnTeamProfile,
  type SocialLink,
} from "@/lib/cms";
import { useMemberAssignments } from "@/lib/use-site-data";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff Dashboard | NexusCrafters" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/", replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const { data: member, isLoading, refetch } = useQuery({
    queryKey: ["team_member_self", user?.uid],
    queryFn: () => fetchTeamMemberForUser(user!.uid, user!.email),
    enabled: Boolean(user),
  });

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [contact, setContact] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (member) {
      setName(member.name);
      setBio(member.bio ?? "");
      setContact(member.contact ?? "");
      setPhoto(member.photo ?? null);
      setLinks(member.social_links ?? []);
    }
  }, [member]);

  const { data: assignments = [], isLoading: assignmentsLoading } = useMemberAssignments(member?.id);

  const saveProfile = useMutation({
    mutationFn: () =>
      updateOwnTeamProfile(member!.id, {
        name: name.trim(),
        bio: bio.trim(),
        contact: contact.trim(),
        photo,
        social_links: links.filter((l) => l.handle.trim()),
      }),
    onSuccess: () => {
      toast.success("Profile updated");
      refetch();
    },
    onError: () => toast.error("Could not save your profile"),
  });

  const respond = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "accepted" | "rejected" }) =>
      respondToAssignment(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_assignments", "member", member?.id] });
    },
    onError: () => toast.error("Could not update this project"),
  });

  async function handlePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      setPhoto(await compressImageToBase64(file));
    } catch {
      toast.error("Could not process that photo");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function addLink() {
    setLinks([...links, { platform: "Instagram", handle: "" }]);
  }
  function updateLink(index: number, patch: Partial<SocialLink>) {
    setLinks(links.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }
  function removeLink(index: number) {
    setLinks(links.filter((_, i) => i !== index));
  }

  if (authLoading || isLoading) {
    return (
      <SiteLayout>
        <div className="container-page flex min-h-[60vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </SiteLayout>
    );
  }

  if (!member) {
    return (
      <SiteLayout>
        <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
          <h1 className="font-display text-2xl font-bold">No staff profile found</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Your account isn't linked to a team profile yet. Ask an admin to add you in the Team
            tab using this email: <span className="font-medium text-foreground">{user?.email}</span>
          </p>
          <Button asChild variant="hero" className="mt-2">
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const pending = assignments.filter((a) => a.status === "pending");
  const responded = assignments.filter((a) => a.status !== "pending");

  return (
    <SiteLayout>
      <section className="container-page py-12">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Staff dashboard</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome, {member.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Edit your public profile and manage the projects sent to you.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="glass-panel space-y-4 rounded-3xl p-6">
            <h2 className="font-display text-lg font-bold">Your profile</h2>

            <div className="flex items-center gap-4">
              <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-secondary">
                {photo ? (
                  <img src={photo} alt="" className="size-full object-cover" />
                ) : (
                  <UserRound className="size-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                <Button type="button" variant="glass" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : null}
                  {photo ? "Change photo" : "Upload photo"}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="me-name">Name</Label>
              <Input id="me-name" className="mt-2" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="me-contact">Contact</Label>
              <Input id="me-contact" className="mt-2" value={contact} onChange={(e) => setContact(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="me-bio">Bio</Label>
              <Textarea id="me-bio" className="mt-2" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Social media handles</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addLink}>
                  <Plus className="size-4" /> Add
                </Button>
              </div>
              {links.map((link, index) => (
                <div key={index} className="flex flex-wrap items-center gap-2">
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={link.platform}
                    onChange={(e) => updateLink(index, { platform: e.target.value })}
                  >
                    {SOCIAL_PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <Input
                    className="min-w-[160px] flex-1"
                    value={link.handle}
                    onChange={(e) => updateLink(index, { handle: e.target.value })}
                    placeholder="@handle or profile link"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(index)} aria-label="Remove">
                    <X className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <Button variant="hero" onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
              {saveProfile.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save profile
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="mb-3 font-display text-lg font-bold">Pending projects</h2>
              {assignmentsLoading ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : pending.length ? (
                <div className="space-y-3">
                  {pending.map((row) => (
                    <div key={row.id} className="glass-panel space-y-2 rounded-2xl p-4">
                      <p className="font-semibold">{row.project_title}</p>
                      {row.project_description ? (
                        <p className="text-sm text-muted-foreground">{row.project_description}</p>
                      ) : null}
                      {row.deadline ? (
                        <p className="text-xs text-muted-foreground">Deadline: {row.deadline}</p>
                      ) : null}
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="hero"
                          onClick={() => respond.mutate({ id: row.id, status: "accepted" })}
                          disabled={respond.isPending}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => respond.mutate({ id: row.id, status: "rejected" })}
                          disabled={respond.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No pending projects right now.</p>
              )}
            </div>

            <div>
              <h2 className="mb-3 font-display text-lg font-bold">Project history</h2>
              {responded.length ? (
                <div className="space-y-2">
                  {responded.map((row) => (
                    <div key={row.id} className="glass-panel flex items-center justify-between gap-3 rounded-2xl p-4">
                      <div>
                        <p className="font-medium">{row.project_title}</p>
                        {row.deadline ? (
                          <p className="text-xs text-muted-foreground">Deadline: {row.deadline}</p>
                        ) : null}
                      </div>
                      {row.status === "accepted" ? (
                        <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                          <CheckCircle2 className="size-4" /> Accepted
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-sm text-destructive">
                          <XCircle className="size-4" /> Rejected
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="size-4" /> Nothing here yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
