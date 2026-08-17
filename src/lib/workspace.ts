/**
 * Workspace layer: projects, per-member team invitations, chats (with expiry),
 * files, timeline, notifications and help requests.
 *
 * Everything here writes to Firestore through the existing browser-only
 * `getDb()` helper — the same Firebase app used by auth and the CMS.
 * Security is enforced by firestore.rules; the UI only mirrors it.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  limit as fsLimit,
  type QueryConstraint,
} from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/lib/firebase";
import { logActivity, type TeamMember } from "@/lib/cms";

/* ---------------------------------- types --------------------------------- */

export const PROJECT_STATUSES = [
  "pending",
  "accepted",
  "in_progress",
  "review",
  "revision",
  "completed",
  "delivered",
  "cancelled",
  "rejected",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const REQUEST_STATUSES = [
  "new",
  "team_selection",
  "waiting_for_team",
  "ready_for_approval",
  "accepted",
  "rejected",
  "completed",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const INVITATION_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "expired",
  "removed",
] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const HELP_STATUSES = [
  "new",
  "reviewing",
  "assigned",
  "in_progress",
  "waiting_for_customer",
  "resolved",
  "closed",
] as const;
export type HelpStatus = (typeof HELP_STATUSES)[number];

export const HELP_CATEGORIES = [
  "bug",
  "website_issue",
  "revision",
  "download_problem",
  "question",
  "other",
] as const;
export type HelpCategory = (typeof HELP_CATEGORIES)[number];

export const FILE_AREAS = [
  "brief",
  "references",
  "work",
  "final_zip",
  "images",
  "documents",
] as const;
export type FileArea = (typeof FILE_AREAS)[number];

export type WorkspaceProject = {
  id: string;
  request_id: string | null;
  title: string;
  description: string;
  service_type: string;
  budget: string;
  deadline: string | null;
  priority: Priority;
  status: ProjectStatus;
  progress: number;
  internal_notes: string;
  customer_notes: string;
  requester_uid: string | null;
  requester_email: string | null;
  requester_name: string;
  /** Team member doc ids that are ACTIVE on the project (accepted + finalized). */
  member_ids: string[];
  /** Auth uids of active members — used by Firestore rules. */
  member_uids: string[];
  /** Requester only gets progress/chat/files once the admin finalizes. */
  requester_access: boolean;
  approved_at: string | null;
  completed_at: string | null;
  /** Final delivery */
  final_zip_url: string | null;
  final_zip_name: string | null;
  final_zip_approved: boolean;
  final_zip_status: "none" | "uploaded" | "approved" | "needs_revision";
  preview_url: string | null;
  final_notes: string;
  created_at: string;
  updated_at: string;
};

export type TeamInvitation = {
  id: string;
  project_id: string;
  request_id: string | null;
  project_title: string;
  team_member_id: string;
  team_member_name: string;
  member_uid: string | null;
  member_email: string | null;
  status: InvitationStatus;
  invited_at: string;
  responded_at: string | null;
  finalized_at: string | null;
};

export type TimelineEvent = {
  id: string;
  project_id: string;
  message: string;
  progress: number | null;
  status: ProjectStatus | null;
  author_name: string;
  visibility: "customer" | "internal";
  created_at: string;
};

export type ProjectFile = {
  id: string;
  project_id: string;
  area: FileArea;
  name: string;
  url: string;
  uploaded_by: string;
  customer_visible: boolean;
  created_at: string;
};

export type ChatKind = "project" | "internal" | "help" | "help_internal";

export type Chat = {
  id: string;
  kind: ChatKind;
  project_id: string | null;
  help_request_id: string | null;
  title: string;
  participant_uids: string[];
  requester_uid: string | null;
  expires_at: string | null;
  original_duration_hours: number;
  last_extended_at: string | null;
  last_extended_by: string | null;
  last_message: string;
  last_message_at: string | null;
  archived: boolean;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  chat_id: string;
  sender_uid: string | null;
  sender_name: string;
  sender_photo: string | null;
  body: string;
  attachment_url: string | null;
  attachment_name: string | null;
  system: boolean;
  read_by: string[];
  created_at: string;
};

export type ChatExpiryHistory = {
  id: string;
  chat_id: string;
  project_id: string | null;
  previous_expires_at: string | null;
  new_expires_at: string | null;
  extension_label: string;
  extended_by: string;
  created_at: string;
};

export type HelpRequest = {
  id: string;
  project_id: string;
  project_title: string;
  requester_uid: string | null;
  requester_name: string;
  requester_email: string | null;
  subject: string;
  category: HelpCategory;
  message: string;
  attachment_url: string | null;
  attachment_name: string | null;
  status: HelpStatus;
  priority: Priority;
  assigned_member_ids: string[];
  assigned_member_uids: string[];
  assigned_member_names: string[];
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export type AppNotification = {
  id: string;
  user_uid: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

/* --------------------------------- labels --------------------------------- */

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  in_progress: "In Progress",
  review: "Review",
  revision: "Revision",
  completed: "Completed",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
  new: "New",
  reviewing: "Reviewing",
  team_selection: "Team Selection",
  waiting_for_team: "Waiting for Team",
  ready_for_approval: "Ready for Admin Approval",
  assigned: "Assigned",
  waiting_for_customer: "Waiting for Customer",
  resolved: "Resolved",
  closed: "Closed",
  expired: "Expired",
  removed: "Removed",
  bug: "Bug",
  website_issue: "Website Issue",
  revision_help: "Revision",
  download_problem: "Download Problem",
  question: "Question",
  other: "Other",
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
  brief: "Brief",
  references: "References",
  work: "Work files",
  final_zip: "Final ZIP",
  images: "Images",
  documents: "Documents",
};

export function label(value: string | null | undefined) {
  if (!value) return "—";
  return STATUS_LABELS[value] ?? value.replace(/_/g, " ");
}

/* ------------------------------- collections ------------------------------ */

export const C = {
  projects: "workspace_projects",
  invitations: "project_team_invitations",
  timeline: "project_timeline",
  files: "project_files",
  chats: "chats",
  chatHistory: "chat_expiry_history",
  help: "help_requests",
  notifications: "notifications",
  requests: "contact_requests",
  team: "team_members",
} as const;

export function projectChatId(projectId: string) {
  return `project_${projectId}`;
}
export function internalChatId(projectId: string) {
  return `internal_${projectId}`;
}
export function helpChatId(helpId: string) {
  return `help_${helpId}`;
}
export function helpInternalChatId(helpId: string) {
  return `helpint_${helpId}`;
}

/* --------------------------------- utils ---------------------------------- */

export function toIso(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string" && value) return value;
  if (value instanceof Date) return value.toISOString();
  return null;
}

function nowIso() {
  return new Date().toISOString();
}

function mapDoc<T>(id: string, data: Record<string, unknown>, dateKeys: string[]): T {
  const out: Record<string, unknown> = { id, ...data };
  for (const key of dateKeys) out[key] = toIso(data[key]);
  return out as T;
}

const PROJECT_DATES = ["created_at", "updated_at", "approved_at", "completed_at"];
const INVITE_DATES = ["invited_at", "responded_at", "finalized_at"];

export function mapProject(id: string, data: Record<string, unknown>): WorkspaceProject {
  const project = mapDoc<WorkspaceProject>(id, data, PROJECT_DATES);
  return {
    ...project,
    created_at: project.created_at ?? nowIso(),
    updated_at: project.updated_at ?? project.created_at ?? nowIso(),
    member_ids: project.member_ids ?? [],
    member_uids: project.member_uids ?? [],
    progress: Number(project.progress ?? 0),
  };
}

export function isChatExpired(chat: Pick<Chat, "expires_at"> | null | undefined) {
  if (!chat?.expires_at) return false;
  return new Date(chat.expires_at).getTime() <= Date.now();
}

export function formatCountdown(target: string | null | undefined, from = Date.now()) {
  if (!target) return "No limit";
  const diff = new Date(target).getTime() - from;
  if (diff <= 0) return "Expired";
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function currentUser() {
  return getFirebaseAuth().currentUser;
}

/* -------------------------------- projects -------------------------------- */

export async function fetchProjectsForAdmin(): Promise<WorkspaceProject[]> {
  const snap = await getDocs(collection(getDb(), C.projects));
  return snap.docs
    .map((entry) => mapProject(entry.id, entry.data()))
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

export async function fetchProject(id: string): Promise<WorkspaceProject | null> {
  const snap = await getDoc(doc(getDb(), C.projects, id));
  return snap.exists() ? mapProject(snap.id, snap.data()) : null;
}

async function queryProjects(...constraints: QueryConstraint[]) {
  const snap = await getDocs(query(collection(getDb(), C.projects), ...constraints));
  return snap.docs
    .map((entry) => mapProject(entry.id, entry.data()))
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

/** Projects a team member is actively assigned to (after admin finalization). */
export function fetchProjectsForMemberUid(uid: string) {
  return queryProjects(where("member_uids", "array-contains", uid));
}

/** Projects visible to a requester — only after the admin granted access. */
export async function fetchProjectsForRequester(uid: string) {
  const rows = await queryProjects(where("requester_uid", "==", uid));
  return rows.filter((row) => row.requester_access);
}

export async function saveProject(
  values: Partial<WorkspaceProject> & { id?: string; title: string },
): Promise<string> {
  const db = getDb();
  const id = values.id || crypto.randomUUID();
  const { id: _ignore, created_at: _c, ...rest } = values;
  const existing = values.id ? await getDoc(doc(db, C.projects, id)) : null;
  const payload: Record<string, unknown> = {
    ...rest,
    updated_at: serverTimestamp(),
  };
  if (!existing?.exists()) {
    payload["created_at"] = serverTimestamp();
    payload["status"] = values.status ?? "pending";
    payload["progress"] = values.progress ?? 0;
    payload["priority"] = values.priority ?? "normal";
    payload["member_ids"] = values.member_ids ?? [];
    payload["member_uids"] = values.member_uids ?? [];
    payload["requester_access"] = values.requester_access ?? false;
    payload["final_zip_status"] = values.final_zip_status ?? "none";
    payload["final_zip_approved"] = false;
  }
  await setDoc(doc(db, C.projects, id), payload, { merge: true });
  await logActivity(values.id ? "Updated project" : "Created project", C.projects, id, values.title);
  return id;
}

export async function deleteProject(id: string) {
  await deleteDoc(doc(getDb(), C.projects, id));
  await logActivity("Deleted project", C.projects, id, id);
}

export async function updateProjectProgress(
  project: WorkspaceProject,
  values: { progress?: number; status?: ProjectStatus; message?: string; visibility?: "customer" | "internal" },
) {
  const db = getDb();
  const patch: Record<string, unknown> = { updated_at: serverTimestamp() };
  if (values.progress !== undefined) patch["progress"] = Math.max(0, Math.min(100, values.progress));
  if (values.status) patch["status"] = values.status;
  await updateDoc(doc(db, C.projects, project.id), patch);

  if (values.message?.trim() || values.progress !== undefined || values.status) {
    await addTimelineEvent(project.id, {
      message:
        values.message?.trim() ||
        `Progress updated${values.progress !== undefined ? ` to ${values.progress}%` : ""}${
          values.status ? ` · ${label(values.status)}` : ""
        }`,
      progress: values.progress ?? null,
      status: values.status ?? null,
      visibility: values.visibility ?? "customer",
    });
  }
}

export async function addTimelineEvent(
  projectId: string,
  values: {
    message: string;
    progress?: number | null;
    status?: ProjectStatus | null;
    visibility?: "customer" | "internal";
  },
) {
  const user = currentUser();
  const id = crypto.randomUUID();
  await setDoc(doc(getDb(), C.timeline, id), {
    project_id: projectId,
    message: values.message,
    progress: values.progress ?? null,
    status: values.status ?? null,
    author_name: user?.displayName || user?.email || "System",
    visibility: values.visibility ?? "customer",
    created_at: serverTimestamp(),
  });
  return id;
}

export async function fetchTimeline(projectId: string): Promise<TimelineEvent[]> {
  const snap = await getDocs(
    query(collection(getDb(), C.timeline), where("project_id", "==", projectId)),
  );
  return snap.docs
    .map((entry) => mapDoc<TimelineEvent>(entry.id, entry.data(), ["created_at"]))
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

/* ---------------------------------- files --------------------------------- */

export async function addProjectFile(values: {
  project_id: string;
  area: FileArea;
  name: string;
  url: string;
  customer_visible?: boolean;
}) {
  const user = currentUser();
  const id = crypto.randomUUID();
  await setDoc(doc(getDb(), C.files, id), {
    project_id: values.project_id,
    area: values.area,
    name: values.name,
    url: values.url,
    uploaded_by: user?.email ?? user?.uid ?? "unknown",
    customer_visible: values.customer_visible ?? false,
    created_at: serverTimestamp(),
  });
  return id;
}

export async function fetchProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const snap = await getDocs(
    query(collection(getDb(), C.files), where("project_id", "==", projectId)),
  );
  return snap.docs
    .map((entry) => mapDoc<ProjectFile>(entry.id, entry.data(), ["created_at"]))
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

export async function deleteProjectFile(id: string) {
  await deleteDoc(doc(getDb(), C.files, id));
}

/** Team uploads a final ZIP link; admin must approve before the requester sees it. */
export async function submitFinalZip(
  project: WorkspaceProject,
  values: { url: string; name: string; preview_url?: string; notes?: string },
) {
  await updateDoc(doc(getDb(), C.projects, project.id), {
    final_zip_url: values.url,
    final_zip_name: values.name,
    final_zip_status: "uploaded",
    final_zip_approved: false,
    preview_url: values.preview_url ?? project.preview_url ?? null,
    final_notes: values.notes ?? project.final_notes ?? "",
    status: project.status === "completed" ? project.status : "review",
    updated_at: serverTimestamp(),
  });
  await addTimelineEvent(project.id, {
    message: "Final delivery uploaded and sent for admin review",
    visibility: "internal",
  });
  await notifyAdminsOfProject(project, "Final ZIP submitted", `${project.title}: final delivery is awaiting review.`);
}

export async function reviewFinalZip(project: WorkspaceProject, approved: boolean, note?: string) {
  await updateDoc(doc(getDb(), C.projects, project.id), {
    final_zip_status: approved ? "approved" : "needs_revision",
    final_zip_approved: approved,
    status: approved ? "completed" : "revision",
    completed_at: approved ? serverTimestamp() : null,
    final_notes: note ?? project.final_notes ?? "",
    updated_at: serverTimestamp(),
  });
  await addTimelineEvent(project.id, {
    message: approved ? "Final delivery approved by admin" : `Needs revision${note ? `: ${note}` : ""}`,
    visibility: approved ? "customer" : "internal",
    status: approved ? "completed" : "revision",
  });
  if (approved && project.requester_uid) {
    await notify(project.requester_uid, "Project delivered", `${project.title} is ready to download.`, "/my-projects");
  }
}

export async function markProjectCompleted(project: WorkspaceProject) {
  await updateDoc(doc(getDb(), C.projects, project.id), {
    status: "completed",
    progress: 100,
    completed_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  await addTimelineEvent(project.id, { message: "Project marked completed", status: "completed", progress: 100 });
  if (project.requester_uid) {
    await notify(project.requester_uid, "Project completed", `${project.title} has been completed.`, "/my-projects");
  }
}

/* ------------------------------ notifications ----------------------------- */

export async function notify(uid: string | null | undefined, title: string, body: string, link?: string) {
  if (!uid) return;
  const id = crypto.randomUUID();
  try {
    await setDoc(doc(getDb(), C.notifications, id), {
      user_uid: uid,
      title,
      body,
      link: link ?? null,
      read: false,
      created_at: serverTimestamp(),
    });
  } catch {
    /* notifications are best-effort */
  }
}

async function notifyAdminsOfProject(project: WorkspaceProject, title: string, body: string) {
  try {
    const snap = await getDocs(query(collection(getDb(), "users"), where("role", "==", "admin")));
    await Promise.all(snap.docs.map((entry) => notify(entry.id, title, body, "/admin")));
  } catch {
    /* ignore */
  }
  void project;
}

export async function markNotificationRead(id: string) {
  await updateDoc(doc(getDb(), C.notifications, id), { read: true });
}

export function watchNotifications(uid: string, onData: (rows: AppNotification[]) => void) {
  return onSnapshot(
    query(collection(getDb(), C.notifications), where("user_uid", "==", uid), fsLimit(50)),
    (snap) => {
      const rows = snap.docs
        .map((entry) => mapDoc<AppNotification>(entry.id, entry.data(), ["created_at"]))
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
      onData(rows);
    },
    () => onData([]),
  );
}

/* ------------------------------- invitations ------------------------------ */

/**
 * Admin sends a project to team members. This does NOT activate the project
 * for the requester — each member gets their own pending invitation.
 */
export async function sendInvitations(project: WorkspaceProject, members: TeamMember[]) {
  const db = getDb();
  const existing = await fetchInvitationsForProject(project.id);
  for (const member of members) {
    const already = existing.find(
      (row) => row.team_member_id === member.id && ["pending", "accepted"].includes(row.status),
    );
    if (already) continue;
    const id = crypto.randomUUID();
    await setDoc(doc(db, C.invitations, id), {
      project_id: project.id,
      request_id: project.request_id ?? null,
      project_title: project.title,
      team_member_id: member.id,
      team_member_name: member.name,
      member_uid: member.uid ?? null,
      member_email: member.email ?? null,
      status: "pending",
      invited_at: serverTimestamp(),
      responded_at: null,
      finalized_at: null,
    });
    await notify(member.uid, "New project invitation", `${project.title} — respond in your Team Panel.`, "/team-panel");
  }
  await updateDoc(doc(db, C.projects, project.id), {
    status: "pending",
    updated_at: serverTimestamp(),
  });
  await logActivity("Sent project invitations", C.invitations, project.id, project.title);
}

export async function fetchInvitationsForProject(projectId: string): Promise<TeamInvitation[]> {
  const snap = await getDocs(
    query(collection(getDb(), C.invitations), where("project_id", "==", projectId)),
  );
  return snap.docs.map((entry) => mapDoc<TeamInvitation>(entry.id, entry.data(), INVITE_DATES));
}

export function watchInvitationsForProject(
  projectId: string,
  onData: (rows: TeamInvitation[]) => void,
) {
  return onSnapshot(
    query(collection(getDb(), C.invitations), where("project_id", "==", projectId)),
    (snap) => onData(snap.docs.map((entry) => mapDoc<TeamInvitation>(entry.id, entry.data(), INVITE_DATES))),
    () => onData([]),
  );
}

export function watchInvitationsForMember(memberId: string, onData: (rows: TeamInvitation[]) => void) {
  return onSnapshot(
    query(collection(getDb(), C.invitations), where("team_member_id", "==", memberId)),
    (snap) =>
      onData(
        snap.docs
          .map((entry) => mapDoc<TeamInvitation>(entry.id, entry.data(), INVITE_DATES))
          .sort((a, b) => (b.invited_at ?? "").localeCompare(a.invited_at ?? "")),
      ),
    () => onData([]),
  );
}

export async function fetchAllInvitations(): Promise<TeamInvitation[]> {
  const snap = await getDocs(collection(getDb(), C.invitations));
  return snap.docs.map((entry) => mapDoc<TeamInvitation>(entry.id, entry.data(), INVITE_DATES));
}

/** A member responds to their OWN invitation. Blocked once the admin finalized. */
export async function respondToInvitation(invitation: TeamInvitation, status: "accepted" | "rejected") {
  const project = await fetchProject(invitation.project_id);
  if (invitation.status !== "pending" || project?.approved_at) {
    throw new Error(
      "This project invitation has expired because the project has already been finalized by Admin.",
    );
  }
  await updateDoc(doc(getDb(), C.invitations, invitation.id), {
    status,
    responded_at: serverTimestamp(),
  });
  await logActivity(`Invitation ${status}`, C.invitations, invitation.id, invitation.project_title);
}

export function acceptanceSummary(rows: TeamInvitation[]) {
  const relevant = rows.filter((row) => row.status !== "removed");
  return {
    total: relevant.length,
    accepted: relevant.filter((row) => row.status === "accepted").length,
    pending: relevant.filter((row) => row.status === "pending").length,
    rejected: relevant.filter((row) => row.status === "rejected").length,
    expired: relevant.filter((row) => row.status === "expired").length,
  };
}

/**
 * Admin final approval: pending invitations expire, only accepted members
 * become active, the requester gains access, and both chats are created.
 */
export async function finalizeProjectApproval(
  project: WorkspaceProject,
  options: { chatHours?: number } = {},
) {
  const db = getDb();
  const invitations = await fetchInvitationsForProject(project.id);
  const accepted = invitations.filter((row) => row.status === "accepted");
  if (!accepted.length) {
    throw new Error("At least one team member must accept this project before it can be approved.");
  }

  for (const invite of invitations) {
    if (invite.status === "pending") {
      await updateDoc(doc(db, C.invitations, invite.id), {
        status: "expired",
        finalized_at: serverTimestamp(),
      });
    } else if (invite.status === "accepted") {
      await updateDoc(doc(db, C.invitations, invite.id), { finalized_at: serverTimestamp() });
    }
  }

  const memberIds = accepted.map((row) => row.team_member_id);
  const memberUids = accepted.map((row) => row.member_uid).filter((v): v is string => Boolean(v));

  await updateDoc(doc(db, C.projects, project.id), {
    member_ids: memberIds,
    member_uids: memberUids,
    status: "in_progress",
    requester_access: true,
    approved_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  const hours = options.chatHours ?? 24;
  const admins = await adminUids();

  await createChat({
    id: projectChatId(project.id),
    kind: "project",
    project_id: project.id,
    title: `${project.title} — project chat`,
    participant_uids: unique([...memberUids, ...admins, project.requester_uid].filter(Boolean) as string[]),
    requester_uid: project.requester_uid,
    hours,
  });

  await createChat({
    id: internalChatId(project.id),
    kind: "internal",
    project_id: project.id,
    title: `${project.title} — internal team chat`,
    participant_uids: unique([...memberUids, ...admins]),
    requester_uid: null,
    hours: null,
  });

  await addTimelineEvent(project.id, {
    message: "Project approved by admin and started",
    status: "in_progress",
    visibility: "customer",
  });

  if (project.request_id) {
    await setDoc(
      doc(db, C.requests, project.request_id),
      { status: "accepted", project_id: project.id },
      { merge: true },
    );
  }

  await notify(project.requester_uid, "Project approved", `${project.title} is now active — progress and chat are open.`, "/my-projects");
  for (const invite of accepted) {
    await notify(invite.member_uid, "Project started", `${project.title} is now active.`, "/team-panel");
  }
  await logActivity("Approved project", C.projects, project.id, project.title);
}

/** Admin manually adds a member after finalization — creates a fresh invitation. */
export async function addMemberAfterApproval(project: WorkspaceProject, member: TeamMember) {
  const id = crypto.randomUUID();
  await setDoc(doc(getDb(), C.invitations, id), {
    project_id: project.id,
    request_id: project.request_id ?? null,
    project_title: project.title,
    team_member_id: member.id,
    team_member_name: member.name,
    member_uid: member.uid ?? null,
    member_email: member.email ?? null,
    status: "accepted",
    invited_at: serverTimestamp(),
    responded_at: serverTimestamp(),
    finalized_at: serverTimestamp(),
  });
  const memberIds = unique([...project.member_ids, member.id]);
  const memberUids = unique([...project.member_uids, member.uid].filter(Boolean) as string[]);
  await updateDoc(doc(getDb(), C.projects, project.id), {
    member_ids: memberIds,
    member_uids: memberUids,
    updated_at: serverTimestamp(),
  });
  await addChatParticipant(projectChatId(project.id), member.uid);
  await addChatParticipant(internalChatId(project.id), member.uid);
  await notify(member.uid, "Added to a project", `${project.title} — you were added by an admin.`, "/team-panel");
}

export async function removeMemberFromProject(project: WorkspaceProject, memberId: string, memberUid: string | null) {
  const invitations = await fetchInvitationsForProject(project.id);
  for (const invite of invitations.filter((row) => row.team_member_id === memberId)) {
    await updateDoc(doc(getDb(), C.invitations, invite.id), { status: "removed" });
  }
  await updateDoc(doc(getDb(), C.projects, project.id), {
    member_ids: project.member_ids.filter((id) => id !== memberId),
    member_uids: project.member_uids.filter((uid) => uid !== memberUid),
    updated_at: serverTimestamp(),
  });
  await removeChatParticipant(projectChatId(project.id), memberUid);
  await removeChatParticipant(internalChatId(project.id), memberUid);
}

function unique<T>(rows: T[]) {
  return Array.from(new Set(rows));
}

export async function adminUids(): Promise<string[]> {
  try {
    const snap = await getDocs(query(collection(getDb(), "users"), where("role", "==", "admin")));
    return snap.docs.map((entry) => entry.id);
  } catch {
    const user = currentUser();
    return user ? [user.uid] : [];
  }
}

/* ---------------------------------- chats --------------------------------- */

export async function createChat(values: {
  id: string;
  kind: ChatKind;
  project_id?: string | null;
  help_request_id?: string | null;
  title: string;
  participant_uids: string[];
  requester_uid: string | null;
  hours: number | null;
}) {
  const expires = values.hours ? new Date(Date.now() + values.hours * 3600_000).toISOString() : null;
  await setDoc(
    doc(getDb(), C.chats, values.id),
    {
      kind: values.kind,
      project_id: values.project_id ?? null,
      help_request_id: values.help_request_id ?? null,
      title: values.title,
      participant_uids: values.participant_uids,
      requester_uid: values.requester_uid,
      expires_at: expires,
      original_duration_hours: values.hours ?? 0,
      last_extended_at: null,
      last_extended_by: null,
      last_message: "",
      last_message_at: null,
      archived: false,
      created_at: serverTimestamp(),
    },
    { merge: true },
  );
  await sendSystemMessage(values.id, "Chat opened.");
  return values.id;
}

export async function fetchChat(id: string): Promise<Chat | null> {
  const snap = await getDoc(doc(getDb(), C.chats, id));
  if (!snap.exists()) return null;
  return mapDoc<Chat>(snap.id, snap.data(), ["created_at", "last_message_at", "last_extended_at"]);
}

export function watchChat(id: string, onData: (chat: Chat | null) => void) {
  return onSnapshot(
    doc(getDb(), C.chats, id),
    (snap) =>
      onData(
        snap.exists()
          ? mapDoc<Chat>(snap.id, snap.data(), ["created_at", "last_message_at", "last_extended_at"])
          : null,
      ),
    () => onData(null),
  );
}

export function watchChatsForUser(uid: string, onData: (rows: Chat[]) => void) {
  return onSnapshot(
    query(collection(getDb(), C.chats), where("participant_uids", "array-contains", uid)),
    (snap) =>
      onData(
        snap.docs
          .map((entry) =>
            mapDoc<Chat>(entry.id, entry.data(), ["created_at", "last_message_at", "last_extended_at"]),
          )
          .sort((a, b) => (b.last_message_at ?? b.created_at ?? "").localeCompare(a.last_message_at ?? a.created_at ?? "")),
      ),
    () => onData([]),
  );
}

export function watchAllChats(onData: (rows: Chat[]) => void) {
  return onSnapshot(
    collection(getDb(), C.chats),
    (snap) =>
      onData(
        snap.docs
          .map((entry) =>
            mapDoc<Chat>(entry.id, entry.data(), ["created_at", "last_message_at", "last_extended_at"]),
          )
          .sort((a, b) => (b.last_message_at ?? b.created_at ?? "").localeCompare(a.last_message_at ?? a.created_at ?? "")),
      ),
    () => onData([]),
  );
}

export function watchMessages(chatId: string, onData: (rows: ChatMessage[]) => void) {
  return onSnapshot(
    query(collection(getDb(), C.chats, chatId, "messages"), orderBy("created_at", "asc"), fsLimit(300)),
    (snap) =>
      onData(
        snap.docs.map((entry) => ({
          ...mapDoc<ChatMessage>(entry.id, entry.data(), ["created_at"]),
          chat_id: chatId,
        })),
      ),
    () => onData([]),
  );
}

export async function sendMessage(
  chat: Chat,
  values: { body: string; attachment_url?: string | null; attachment_name?: string | null; senderName?: string; senderPhoto?: string | null },
) {
  if (isChatExpired(chat)) {
    throw new Error("This project chat has expired. Contact Admin if you need additional chat time.");
  }
  const user = currentUser();
  const id = crypto.randomUUID();
  await setDoc(doc(getDb(), C.chats, chat.id, "messages", id), {
    sender_uid: user?.uid ?? null,
    sender_name: values.senderName || user?.displayName || user?.email || "User",
    sender_photo: values.senderPhoto ?? null,
    body: values.body,
    attachment_url: values.attachment_url ?? null,
    attachment_name: values.attachment_name ?? null,
    system: false,
    read_by: user ? [user.uid] : [],
    created_at: serverTimestamp(),
  });
  await updateDoc(doc(getDb(), C.chats, chat.id), {
    last_message: values.body.slice(0, 120),
    last_message_at: serverTimestamp(),
  });
}

export async function sendSystemMessage(chatId: string, body: string) {
  const id = crypto.randomUUID();
  try {
    await setDoc(doc(getDb(), C.chats, chatId, "messages", id), {
      sender_uid: null,
      sender_name: "System",
      sender_photo: null,
      body,
      attachment_url: null,
      attachment_name: null,
      system: true,
      read_by: [],
      created_at: serverTimestamp(),
    });
  } catch {
    /* best effort */
  }
}

export async function markMessagesRead(chatId: string, messages: ChatMessage[], uid: string) {
  const unread = messages.filter((row) => !(row.read_by ?? []).includes(uid) && row.sender_uid !== uid);
  await Promise.all(
    unread.slice(0, 30).map((row) =>
      updateDoc(doc(getDb(), C.chats, chatId, "messages", row.id), {
        read_by: unique([...(row.read_by ?? []), uid]),
      }).catch(() => undefined),
    ),
  );
}

export function unreadCount(messages: ChatMessage[], uid: string) {
  return messages.filter((row) => !row.system && row.sender_uid !== uid && !(row.read_by ?? []).includes(uid)).length;
}

async function addChatParticipant(chatId: string, uid: string | null | undefined) {
  if (!uid) return;
  const chat = await fetchChat(chatId);
  if (!chat) return;
  await updateDoc(doc(getDb(), C.chats, chatId), {
    participant_uids: unique([...(chat.participant_uids ?? []), uid]),
  });
}

async function removeChatParticipant(chatId: string, uid: string | null | undefined) {
  if (!uid) return;
  const chat = await fetchChat(chatId);
  if (!chat) return;
  await updateDoc(doc(getDb(), C.chats, chatId), {
    participant_uids: (chat.participant_uids ?? []).filter((value) => value !== uid),
  });
}

export const EXTENSION_OPTIONS = [
  { label: "+6 Hours", hours: 6 },
  { label: "+12 Hours", hours: 12 },
  { label: "+24 Hours", hours: 24 },
  { label: "+48 Hours", hours: 48 },
  { label: "+7 Days", hours: 168 },
] as const;

/** Admin-only: pushes the chat expiry out and records an audit entry. */
export async function extendChat(chat: Chat, hours: number, optionLabel?: string) {
  const base = chat.expires_at && new Date(chat.expires_at).getTime() > Date.now()
    ? new Date(chat.expires_at).getTime()
    : Date.now();
  const next = new Date(base + hours * 3600_000).toISOString();
  const user = currentUser();
  await updateDoc(doc(getDb(), C.chats, chat.id), {
    expires_at: next,
    archived: false,
    last_extended_at: serverTimestamp(),
    last_extended_by: user?.email ?? user?.uid ?? "admin",
  });
  const id = crypto.randomUUID();
  await setDoc(doc(getDb(), C.chatHistory, id), {
    chat_id: chat.id,
    project_id: chat.project_id ?? null,
    previous_expires_at: chat.expires_at ?? null,
    new_expires_at: next,
    extension_label: optionLabel ?? `+${hours}h`,
    extended_by: user?.email ?? user?.uid ?? "admin",
    created_at: serverTimestamp(),
  });
  await sendSystemMessage(chat.id, `Chat time extended by ${optionLabel ?? `${hours}h`}.`);
  for (const uid of chat.participant_uids ?? []) {
    await notify(uid, "Chat time extended", `${chat.title}: new expiry ${new Date(next).toLocaleString()}.`);
  }
  await logActivity("Extended chat", C.chats, chat.id, optionLabel ?? `${hours}h`);
}

export async function fetchChatHistory(chatId: string): Promise<ChatExpiryHistory[]> {
  const snap = await getDocs(
    query(collection(getDb(), C.chatHistory), where("chat_id", "==", chatId)),
  );
  return snap.docs
    .map((entry) => mapDoc<ChatExpiryHistory>(entry.id, entry.data(), ["created_at", "previous_expires_at", "new_expires_at"]))
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

/* ------------------------------ help requests ----------------------------- */

export async function createHelpRequest(values: {
  project: WorkspaceProject;
  subject: string;
  category: HelpCategory;
  message: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
}) {
  const user = currentUser();
  const id = crypto.randomUUID();
  await setDoc(doc(getDb(), C.help, id), {
    project_id: values.project.id,
    project_title: values.project.title,
    requester_uid: values.project.requester_uid ?? user?.uid ?? null,
    requester_name: values.project.requester_name ?? user?.email ?? "Customer",
    requester_email: values.project.requester_email ?? user?.email ?? null,
    subject: values.subject,
    category: values.category,
    message: values.message,
    attachment_url: values.attachment_url ?? null,
    attachment_name: values.attachment_name ?? null,
    status: "new",
    priority: "normal",
    assigned_member_ids: [],
    assigned_member_uids: [],
    assigned_member_names: [],
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    resolved_at: null,
  });
  for (const uid of await adminUids()) {
    await notify(uid, "New help request", `${values.project.title}: ${values.subject}`, "/admin");
  }
  return id;
}

function mapHelp(id: string, data: Record<string, unknown>) {
  const row = mapDoc<HelpRequest>(id, data, ["created_at", "updated_at", "resolved_at"]);
  return {
    ...row,
    assigned_member_ids: row.assigned_member_ids ?? [],
    assigned_member_uids: row.assigned_member_uids ?? [],
    assigned_member_names: row.assigned_member_names ?? [],
  };
}

export function watchAllHelpRequests(onData: (rows: HelpRequest[]) => void) {
  return onSnapshot(
    collection(getDb(), C.help),
    (snap) =>
      onData(
        snap.docs
          .map((entry) => mapHelp(entry.id, entry.data()))
          .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")),
      ),
    () => onData([]),
  );
}

export function watchHelpRequestsForMember(uid: string, onData: (rows: HelpRequest[]) => void) {
  return onSnapshot(
    query(collection(getDb(), C.help), where("assigned_member_uids", "array-contains", uid)),
    (snap) =>
      onData(
        snap.docs
          .map((entry) => mapHelp(entry.id, entry.data()))
          .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")),
      ),
    () => onData([]),
  );
}

export function watchHelpRequestsForRequester(uid: string, onData: (rows: HelpRequest[]) => void) {
  return onSnapshot(
    query(collection(getDb(), C.help), where("requester_uid", "==", uid)),
    (snap) =>
      onData(
        snap.docs
          .map((entry) => mapHelp(entry.id, entry.data()))
          .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")),
      ),
    () => onData([]),
  );
}

export async function updateHelpRequest(id: string, values: Partial<HelpRequest>) {
  const { id: _ignore, ...rest } = values;
  await updateDoc(doc(getDb(), C.help, id), { ...rest, updated_at: serverTimestamp() });
}

/** Admin assigns members and opens the shared + internal help chats. */
export async function assignHelpRequest(help: HelpRequest, members: TeamMember[], hours = 24) {
  const admins = await adminUids();
  const uids = members.map((m) => m.uid).filter((v): v is string => Boolean(v));
  await updateDoc(doc(getDb(), C.help, help.id), {
    assigned_member_ids: members.map((m) => m.id),
    assigned_member_uids: uids,
    assigned_member_names: members.map((m) => m.name),
    status: "assigned",
    updated_at: serverTimestamp(),
  });

  await createChat({
    id: helpChatId(help.id),
    kind: "help",
    project_id: help.project_id,
    help_request_id: help.id,
    title: `Help: ${help.subject}`,
    participant_uids: unique([...uids, ...admins, help.requester_uid].filter(Boolean) as string[]),
    requester_uid: help.requester_uid,
    hours,
  });
  await createChat({
    id: helpInternalChatId(help.id),
    kind: "help_internal",
    project_id: help.project_id,
    help_request_id: help.id,
    title: `Help (internal): ${help.subject}`,
    participant_uids: unique([...uids, ...admins]),
    requester_uid: null,
    hours: null,
  });

  for (const member of members) {
    await notify(member.uid, "New help request assigned", help.subject, "/team-panel");
  }
  await notify(help.requester_uid, "Help request assigned", `Our team is on it: ${help.subject}`, "/my-projects");
}

export async function setHelpStatus(help: HelpRequest, status: HelpStatus) {
  await updateDoc(doc(getDb(), C.help, help.id), {
    status,
    resolved_at: status === "resolved" || status === "closed" ? serverTimestamp() : null,
    updated_at: serverTimestamp(),
  });
  await notify(help.requester_uid, "Help request updated", `${help.subject} → ${label(status)}`, "/my-projects");
}
