import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Save, Trash2, UserRound, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  compressImageToBase64,
  deleteTeamMember,
  isTeamMemberPublic,
  saveTeamMember,
  slugify,
  SOCIAL_PLATFORMS,
  type SocialLink,
  type TeamMember,
} from "@/lib/cms";
import { useTeamMembers } from "@/lib/use-site-data";

type Draft = {
  id?: string;
  name: string;
  rank: string;
  photo: string | null;
  bio: string;
  contact: string;
  email: string;
  social_links: SocialLink[];
  active: boolean;
  display_order: number;
};

const EMPTY_DRAFT: Draft = {
  name: "",
  rank: "",
  photo: null,
  bio: "",
  contact: "",
  email: "",
  social_links: [],
  active: true,
  display_order: 0,
};

function memberToDraft(member: TeamMember): Draft {
  return {
    id: member.id,
    name: member.name,
    rank: member.rank ?? "",
    photo: member.photo ?? null,
    bio: member.bio ?? "",
    contact: member.contact ?? "",
    email: member.email ?? "",
    social_links: member.social_links ?? [],
    active: member.active !== false,
    display_order: member.display_order ?? 0,
  };
}

export function AdminTeamTab() {
  const { data: members = [], isLoading } = useTeamMembers(true);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["team_members"] });

  const persist = useMutation({
    mutationFn: async (value: Draft) => {
      if (!value.name.trim()) throw new Error("Name is required");
      await saveTeamMember({
        id: value.id,
        slug: value.id ? undefined : slugify(value.name),
        name: value.name.trim(),
        rank: value.rank.trim(),
        photo: value.photo,
        bio: value.bio.trim(),
        contact: value.contact.trim(),
        email: value.email.trim() || null,
        uid: value.id ? (members.find((m) => m.id === value.id)?.uid ?? null) : null,
        social_links: value.social_links.filter((link) => link.handle.trim()),
        active: value.active,
        display_order: value.display_order,
      });
    },
    onSuccess: () => {
      toast.success("Team member saved");
      setDraft(null);
      refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTeamMember(id),
    onSuccess: () => {
      toast.success("Team member removed");
      refresh();
    },
  });

  async function handlePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !draft) return;
    setUploading(true);
    try {
      const base64 = await compressImageToBase64(file);
      setDraft({ ...draft, photo: base64 });
    } catch {
      toast.error("Could not process that photo");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function addLink() {
    if (!draft) return;
    setDraft({ ...draft, social_links: [...draft.social_links, { platform: "Instagram", handle: "" }] });
  }

  function updateLink(index: number, patch: Partial<SocialLink>) {
    if (!draft) return;
    const social_links = draft.social_links.map((link, i) => (i === index ? { ...link, ...patch } : link));
    setDraft({ ...draft, social_links });
  }

  function removeLink(index: number) {
    if (!draft) return;
    setDraft({ ...draft, social_links: draft.social_links.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Team structure</h2>
          <p className="text-sm text-muted-foreground">
            Add unlimited team members with a name, rank, photo and social media handles. A
            member only appears on the public /team page once they have a name AND at least one
            social handle — until then only admins can see them here.
          </p>
        </div>
        <Button variant="hero" onClick={() => setDraft({ ...EMPTY_DRAFT })}>
          <Plus className="size-4" /> Add member
        </Button>
      </div>

      {draft ? (
        <div className="glass-panel space-y-4 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">{draft.id ? "Edit member" : "New member"}</h3>
            <Button variant="ghost" size="icon" onClick={() => setDraft(null)} aria-label="Cancel">
              <X className="size-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-secondary">
              {draft.photo ? (
                <img src={draft.photo} alt="" className="size-full object-cover" />
              ) : (
                <UserRound className="size-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhoto}
              />
              <Button
                type="button"
                variant="glass"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : null}
                {draft.photo ? "Change photo" : "Upload photo"}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tm-name">Name</Label>
              <Input
                id="tm-name"
                className="mt-2"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label htmlFor="tm-rank">Rank / role</Label>
              <Input
                id="tm-rank"
                className="mt-2"
                value={draft.rank}
                onChange={(event) => setDraft({ ...draft, rank: event.target.value })}
                placeholder="e.g. Founder, Developer, Moderator"
              />
            </div>
            <div>
              <Label htmlFor="tm-contact">Contact</Label>
              <Input
                id="tm-contact"
                className="mt-2"
                value={draft.contact}
                onChange={(event) => setDraft({ ...draft, contact: event.target.value })}
                placeholder="Phone / email shown on their public profile"
              />
            </div>
            <div>
              <Label htmlFor="tm-email">Login email (for their staff dashboard)</Label>
              <Input
                id="tm-email"
                className="mt-2"
                value={draft.email}
                onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                placeholder="The email they sign in with"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tm-bio">Bio</Label>
            <Textarea
              id="tm-bio"
              className="mt-2"
              rows={3}
              value={draft.bio}
              onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
              placeholder="Short bio shown on their public profile"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Social media handles</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addLink}>
                <Plus className="size-4" /> Add handle
              </Button>
            </div>
            {draft.social_links.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No handles yet — this member stays hidden from the public team page until you add
                at least one.
              </p>
            ) : null}
            {draft.social_links.map((link, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={link.platform}
                  onChange={(event) => updateLink(index, { platform: event.target.value })}
                >
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
                <Input
                  className="min-w-[180px] flex-1"
                  value={link.handle}
                  onChange={(event) => updateLink(index, { handle: event.target.value })}
                  placeholder="@handle or profile link"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLink(index)}
                  aria-label="Remove handle"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
              />
              Active team member
            </label>
            <Button variant="hero" onClick={() => persist.mutate(draft)} disabled={persist.isPending}>
              {persist.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save member
            </Button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : members.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <div key={member.id} className="glass-panel space-y-3 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary">
                  {member.photo ? (
                    <img src={member.photo} alt="" className="size-full object-cover" />
                  ) : (
                    <UserRound className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{member.name || "Unnamed"}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.rank || "No rank set"}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {isTeamMemberPublic(member) ? "Visible on /team" : "Hidden — needs name + a social handle"}
                {member.active === false ? " · inactive" : ""}
              </p>
              <div className="flex gap-2">
                <Button variant="glass" size="sm" className="flex-1" onClick={() => setDraft(memberToDraft(member))}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${member.name}`}
                  onClick={() => remove.mutate(member.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No team members yet — add your first one above.</p>
      )}
    </div>
  );
}
