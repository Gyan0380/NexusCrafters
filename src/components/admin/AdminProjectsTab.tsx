import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Loader2, Send, UserRound, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendProjectToTeam, type TeamMember } from "@/lib/cms";
import { useAllAssignments, useTeamMembers } from "@/lib/use-site-data";

const STATUS_STYLES: Record<string, string> = {
  pending: "text-amber-600",
  accepted: "text-emerald-600",
  rejected: "text-destructive",
};

const STATUS_ICON: Record<string, typeof Clock> = {
  pending: Clock,
  accepted: CheckCircle2,
  rejected: XCircle,
};

export function AdminProjectsTab() {
  const { data: members = [] } = useTeamMembers(true);
  const { data: assignments = [], isLoading } = useAllAssignments();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(false);

  const activeMembers = useMemo(() => members.filter((m) => m.active !== false), [members]);

  const send = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Give the project a title");
      const targets: TeamMember[] = sendToAll
        ? activeMembers
        : activeMembers.filter((m) => selected.includes(m.id));
      if (!targets.length) throw new Error("Pick at least one team member, or send to all");
      await sendProjectToTeam({ title: title.trim(), description: description.trim(), deadline: deadline || null }, targets);
    },
    onSuccess: () => {
      toast.success("Project sent to the team");
      setTitle("");
      setDescription("");
      setDeadline("");
      setSelected([]);
      setSendToAll(false);
      queryClient.invalidateQueries({ queryKey: ["project_assignments"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not send project"),
  });

  function toggleMember(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  const grouped = useMemo(() => {
    const map = new Map<string, typeof assignments>();
    for (const row of assignments) {
      const list = map.get(row.project_id) ?? [];
      list.push(row);
      map.set(row.project_id, list);
    }
    return Array.from(map.values());
  }, [assignments]);

  return (
    <div className="space-y-8">
      <div className="glass-panel space-y-4 rounded-3xl p-6">
        <h2 className="font-display text-xl font-bold">Send a project to the team</h2>
        <p className="text-sm text-muted-foreground">
          Choose specific team members or send it to everyone. Each recipient sees it on their
          staff dashboard and can accept or reject it.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="proj-title">Project title</Label>
            <Input id="proj-title" className="mt-2" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="proj-deadline">Deadline (optional)</Label>
            <Input
              id="proj-deadline"
              type="date"
              className="mt-2"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="proj-desc">Description / brief</Label>
          <Textarea
            id="proj-desc"
            className="mt-2"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Send to</Label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sendToAll} onChange={(e) => setSendToAll(e.target.checked)} />
              Everyone on the team ({activeMembers.length})
            </label>
          </div>
          {!sendToAll ? (
            activeMembers.length ? (
              <div className="flex flex-wrap gap-2">
                {activeMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMember(member.id)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      selected.includes(member.id)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <UserRound className="size-3.5" />
                    {member.name || "Unnamed"}
                    {member.rank ? <span className="opacity-70">· {member.rank}</span> : null}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Add team members in the Team tab first.
              </p>
            )
          ) : null}
        </div>

        <Button variant="hero" onClick={() => send.mutate()} disabled={send.isPending}>
          {send.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Send project
        </Button>
      </div>

      <div>
        <h2 className="mb-4 font-display text-xl font-bold">Sent projects</h2>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : grouped.length ? (
          <div className="space-y-4">
            {grouped.map((rows) => (
              <div key={rows[0].project_id} className="glass-panel space-y-3 rounded-2xl p-5">
                <div>
                  <p className="font-semibold">{rows[0].project_title}</p>
                  {rows[0].project_description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{rows[0].project_description}</p>
                  ) : null}
                  {rows[0].deadline ? (
                    <p className="mt-1 text-xs text-muted-foreground">Deadline: {rows[0].deadline}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {rows.map((row) => {
                    const Icon = STATUS_ICON[row.status] ?? Clock;
                    return (
                      <span
                        key={row.id}
                        className={`flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs ${STATUS_STYLES[row.status] ?? ""}`}
                      >
                        <Icon className="size-3.5" />
                        {row.member_name} · {row.status}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No projects sent yet.</p>
        )}
      </div>
    </div>
  );
}
