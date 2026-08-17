import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/lib/firebase";
import {
  DEFAULT_FAQS,
  DEFAULT_PACKAGES,
  DEFAULT_SERVICES,
  DEFAULT_SETTINGS,
} from "@/lib/default-content";

export type Service = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  starting_price: string;
  features: string[];
  active: boolean;
  display_order: number;
};

export type PricingPackage = {
  id: string;
  service_id: string | null;
  name: string;
  price: number;
  price_suffix: string;
  description: string;
  features: string[];
  popular: boolean;
  active: boolean;
  display_order: number;
};

export type PortfolioProject = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  main_image: string | null;
  images: string[];
  technologies: string[];
  project_url: string | null;
  github_url: string | null;
  featured: boolean;
  published: boolean;
  status: string;
  project_date: string;
  display_order: number;
};

/**
 * A photo or video shown in the admin panel / public gallery.
 * Photos: `url` is a compressed base64 data URL stored directly in Firestore.
 * Videos: `url` is an external link (YouTube, Google Drive, direct .mp4, etc.) —
 * videos are too large to store as base64 inside a Firestore document (1MB limit).
 */
export type PortfolioMedia = {
  id: string;
  title: string;
  description: string;
  type: "image" | "video";
  url: string;
  category: string;
  published: boolean;
  created_at: string;
};

export type ContactRequest = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  package: string | null;
  budget: string | null;
  requirements: string | null;
  message: string | null;
  created_at: string;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  active: boolean;
  display_order: number;
};

/** A single social media handle on a team member's profile (unlimited per member). */
export type SocialLink = {
  platform: string;
  handle: string;
};

/** Preset platforms shown as quick-picks in the admin panel — "Other" allows any custom platform. */
export const SOCIAL_PLATFORMS = [
  "Instagram",
  "Discord",
  "X",
  "Telegram",
  "WhatsApp",
  "Other",
] as const;

export type TeamMember = {
  id: string;
  slug: string;
  name: string;
  rank: string;
  photo: string | null;
  bio: string;
  contact: string;
  social_links: SocialLink[];
  /** Email used to match this member to their account the first time they sign in. */
  email: string | null;
  /** Set automatically once the matching account signs in — powers the staff dashboard. */
  uid: string | null;
  active: boolean;
  display_order: number;
};

export type ProjectAssignment = {
  id: string;
  project_id: string;
  project_title: string;
  project_description: string;
  deadline: string | null;
  member_id: string;
  member_name: string;
  member_uid: string | null;
  member_email: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  responded_at: string | null;
};

export type ActivityLog = {
  id: string;
  user_email: string | null;
  action: string;
  target_type: string | null;
  target_label: string | null;
  created_at: string;
};

export const CATEGORY_LABELS: Record<string, string> = {
  websites: "Websites",
  discord_bots: "Discord Bots",
  discord_servers: "Discord Servers",
  hosting: "Domain & Hosting",
  extras: "Extras",
  other: "Other Projects",
};

export const PORTFOLIO_CATEGORIES = [
  "websites",
  "discord_bots",
  "discord_servers",
  "other",
] as const;

export const SERVICE_CATEGORIES = [
  "websites",
  "discord_bots",
  "discord_servers",
  "hosting",
  "extras",
  "other",
] as const;

export function formatPrice(pkg: Pick<PricingPackage, "price" | "price_suffix">) {
  if (Number(pkg.price) === 0) return "FREE";
  return `₹${Number(pkg.price).toLocaleString("en-IN")}${pkg.price_suffix ?? ""}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ---------- firestore helpers ---------- */

const COLLECTIONS = {
  services: "services",
  packages: "pricing_packages",
  projects: "portfolio_projects",
  media: "portfolio_media",
  faqs: "faqs",
  settings: "site_settings",
  requests: "contact_requests",
  activity: "activity_logs",
  team: "team_members",
  assignments: "project_assignments",
} as const;

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

async function readAll<T>(name: string): Promise<T[]> {
  const snapshot = await getDocs(collection(getDb(), name));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as T);
}

function byOrder<T extends { display_order?: number }>(rows: T[]) {
  return [...rows].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
}

/* ---------- public reads ---------- */

export async function fetchServices(includeInactive = false) {
  const rows = await readAll<Service>(COLLECTIONS.services);
  const list = rows.length ? byOrder(rows) : DEFAULT_SERVICES;
  return includeInactive ? list : list.filter((row) => row.active !== false);
}

export async function fetchPackages(includeInactive = false) {
  const rows = await readAll<PricingPackage>(COLLECTIONS.packages);
  const list = rows.length ? byOrder(rows) : DEFAULT_PACKAGES;
  return includeInactive ? list : list.filter((row) => row.active !== false);
}

export async function fetchFaqs(includeInactive = false) {
  const rows = await readAll<Faq>(COLLECTIONS.faqs);
  const list = rows.length ? byOrder(rows) : DEFAULT_FAQS;
  return includeInactive ? list : list.filter((row) => row.active !== false);
}

export async function fetchProjects(includeUnpublished = false) {
  const rows = byOrder(await readAll<PortfolioProject>(COLLECTIONS.projects));
  return includeUnpublished ? rows : rows.filter((row) => row.published !== false);
}

export async function fetchProjectBySlug(slug: string) {
  const rows = await fetchProjects(true);
  return rows.find((row) => row.slug === slug) ?? null;
}

export async function fetchSettings() {
  const rows = await readAll<{ id: string } & Record<string, unknown>>(COLLECTIONS.settings);
  const map: Record<string, Record<string, unknown>> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    const { id, ...value } = row;
    map[id] = { ...(map[id] ?? {}), ...value };
  }

  // Migrate the old starter branding at read time so existing projects
  // immediately use the NexusCrafters identity without requiring a manual CMS save.
  if (map.footer?.business_name === "NovaCraft Studio" || map.footer?.business_name === "NovaCraft") {
    map.footer.business_name = "NexusCrafters";
  }
  if (!map.footer?.logo_url) {
    map.footer.logo_url = "/nexus-crafters-logo.png";
  }

  return map;
}

export async function saveSetting(key: string, value: Record<string, unknown>) {
  await setDoc(doc(getDb(), COLLECTIONS.settings, key), value, { merge: true });
  await logActivity("Updated website content", "site_settings", key, key);
}

/* ---------- services / packages / faqs writes ---------- */

export async function saveService(service: Omit<Service, "id"> & { id?: string }) {
  const id = service.id || slugify(service.name) || crypto.randomUUID();
  const { id: _ignored, ...data } = { ...service, id };
  await setDoc(doc(getDb(), COLLECTIONS.services, id), data, { merge: true });
  await logActivity("Saved service", "services", id, service.name);
  return id;
}

export async function deleteService(id: string) {
  await deleteDoc(doc(getDb(), COLLECTIONS.services, id));
  await logActivity("Deleted service", "services", id, id);
}

export async function savePackage(pkg: Omit<PricingPackage, "id"> & { id?: string }) {
  const id = pkg.id || crypto.randomUUID();
  const { id: _ignored, ...data } = { ...pkg, id };
  await setDoc(doc(getDb(), COLLECTIONS.packages, id), data, { merge: true });
  await logActivity("Saved offer", "pricing_packages", id, pkg.name);
  return id;
}

export async function deletePackage(id: string) {
  await deleteDoc(doc(getDb(), COLLECTIONS.packages, id));
  await logActivity("Deleted offer", "pricing_packages", id, id);
}

/* ---------- contact requests ---------- */

export async function createContactRequest(values: {
  name: string;
  email: string;
  phone?: string | null;
  service?: string | null;
  package?: string | null;
  budget?: string | null;
  requirements?: string | null;
  message?: string | null;
}) {
  const id = crypto.randomUUID();
  await setDoc(doc(getDb(), COLLECTIONS.requests, id), {
    name: values.name,
    email: values.email,
    phone: values.phone ?? null,
    service: values.service ?? null,
    package: values.package ?? null,
    budget: values.budget ?? null,
    requirements: values.requirements ?? null,
    message: values.message ?? null,
    created_at: serverTimestamp(),
  });
  return id;
}

export async function fetchContactRequests() {
  const rows = await readAll<ContactRequest>(COLLECTIONS.requests);
  return rows
    .map((row) => ({ ...row, created_at: toIso(row.created_at) }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function deleteContactRequest(id: string) {
  await deleteDoc(doc(getDb(), COLLECTIONS.requests, id));
  await logActivity("Deleted contact request", "contact_requests", id, id);
}

/* ---------- base64 image uploads (no Firebase Storage — Spark/free plan safe) ---------- */

/** Firestore hard-caps a document at 1MB. Stay well under that after base64's ~33% overhead. */
const MAX_BASE64_BYTES = 700_000;

/**
 * Compresses an image in the browser (via <canvas>) and returns it as a base64
 * data URL small enough to store directly in a Firestore document field.
 * Progressively lowers quality/size until it fits under MAX_BASE64_BYTES.
 */
export async function compressImageToBase64(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  let maxDim = 1600;
  let quality = 0.8;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(bitmap, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    // Rough byte size of a base64 data URL: chars * 0.75
    const approxBytes = dataUrl.length * 0.75;
    if (approxBytes <= MAX_BASE64_BYTES || attempt === 5) {
      return dataUrl;
    }
    maxDim = Math.round(maxDim * 0.75);
    quality = Math.max(0.4, quality - 0.15);
  }

  throw new Error("Could not compress image small enough for Firestore");
}

export async function uploadLogo(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Logo must be an image");
  const base64 = await compressImageToBase64(file);
  await saveSetting("footer", { logo_url: base64 });
  return base64;
}

/* ---------- portfolio media ---------- */

/**
 * Photos: compressed and stored as base64 directly in Firestore.
 * Videos: cannot be embedded (Firestore's 1MB document limit) — pass a
 * `videoUrl` (YouTube, Google Drive share link, direct .mp4, etc.) instead
 * of a file. Use `addPortfolioVideoLink` for that.
 */
export async function uploadPortfolioMedia(
  file: File,
  meta: { title?: string; description?: string; category?: string },
) {
  if (!file.type.startsWith("image/")) {
    throw new Error(
      "Videos can't be stored in Firestore (1MB document limit). Paste a video link instead.",
    );
  }
  const url = await compressImageToBase64(file);
  const id = crypto.randomUUID();
  await setDoc(doc(getDb(), COLLECTIONS.media, id), {
    title: meta.title?.trim() || file.name.replace(/\.[^.]+$/, ""),
    description: meta.description ?? "",
    type: "image",
    url,
    category: meta.category ?? "other",
    published: true,
    created_at: serverTimestamp(),
  });
  await logActivity("Uploaded portfolio media", "portfolio_media", id, file.name);
  return id;
}

/** Adds a video to the gallery by link (YouTube, Drive, direct .mp4, etc.) instead of a file upload. */
export async function addPortfolioVideoLink(
  videoUrl: string,
  meta: { title?: string; description?: string; category?: string },
) {
  const id = crypto.randomUUID();
  await setDoc(doc(getDb(), COLLECTIONS.media, id), {
    title: meta.title?.trim() || "Video",
    description: meta.description ?? "",
    type: "video",
    url: videoUrl.trim(),
    category: meta.category ?? "other",
    published: true,
    created_at: serverTimestamp(),
  });
  await logActivity("Added portfolio video link", "portfolio_media", id, videoUrl);
  return id;
}

export async function fetchPortfolioMedia(includeUnpublished = false) {
  const rows = await readAll<PortfolioMedia>(COLLECTIONS.media);
  return rows
    .map((row) => ({ ...row, created_at: toIso(row.created_at) }))
    .filter((row) => (includeUnpublished ? true : row.published !== false))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function deletePortfolioMedia(item: Pick<PortfolioMedia, "id">) {
  await deleteDoc(doc(getDb(), COLLECTIONS.media, item.id));
  await logActivity("Deleted portfolio media", "portfolio_media", item.id, item.id);
}

export async function updatePortfolioMedia(id: string, values: Partial<PortfolioMedia>) {
  await setDoc(doc(getDb(), COLLECTIONS.media, id), values, { merge: true });
}

/* ---------- starter content ---------- */

export async function seedDefaultContent() {
  const db = getDb();
  for (const service of DEFAULT_SERVICES) {
    const { id, ...data } = service;
    await setDoc(doc(db, COLLECTIONS.services, id), data, { merge: true });
  }
  for (const pkg of DEFAULT_PACKAGES) {
    const { id, ...data } = pkg;
    await setDoc(doc(db, COLLECTIONS.packages, id), data, { merge: true });
  }
  for (const faq of DEFAULT_FAQS) {
    const { id, ...data } = faq;
    await setDoc(doc(db, COLLECTIONS.faqs, id), data, { merge: true });
  }
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await setDoc(doc(db, COLLECTIONS.settings, key), value, { merge: true });
  }
  await logActivity("Loaded starter content", "site_settings", "seed", "starter content");
}

/* ---------- activity log ---------- */

export async function logActivity(
  action: string,
  targetType: string,
  targetId?: string,
  targetLabel?: string,
) {
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user) return;
    const id = crypto.randomUUID();
    await setDoc(doc(getDb(), COLLECTIONS.activity, id), {
      user_id: user.uid,
      user_email: user.email ?? null,
      action,
      target_type: targetType,
      target_id: targetId ?? null,
      target_label: targetLabel ?? null,
      created_at: serverTimestamp(),
    });
  } catch {
    /* activity logging is best-effort */
  }
}

export async function fetchActivity() {
  const rows = await readAll<ActivityLog>(COLLECTIONS.activity);
  return rows
    .map((row) => ({ ...row, created_at: toIso(row.created_at) }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 100);
}

/* ---------- roles ---------- */

export async function fetchUserRole(uid: string) {
  const snapshot = await getDoc(doc(getDb(), "users", uid));
  const role = snapshot.exists() ? (snapshot.data()["role"] as string | undefined) : undefined;
  return role ?? "user";
}

export async function ensureUserDocument(uid: string, email: string | null, isOwner: boolean) {
  await setDoc(
    doc(getDb(), "users", uid),
    {
      email,
      last_login: serverTimestamp(),
      ...(isOwner ? { role: "admin" } : {}),
    },
    { merge: true },
  );
}

/* ---------- team & social profiles ---------- */

/**
 * A team member only appears on the public /team page once an admin has given
 * them a name AND at least one social media handle — until then they're only
 * visible inside the admin panel.
 */
export function isTeamMemberPublic(
  member: Pick<TeamMember, "name" | "social_links" | "active">,
): boolean {
  return Boolean(member.name?.trim()) && (member.social_links?.length ?? 0) > 0 && member.active !== false;
}

export async function fetchTeamMembers(includeHidden = false) {
  const rows = byOrder(await readAll<TeamMember>(COLLECTIONS.team));
  return includeHidden ? rows : rows.filter(isTeamMemberPublic);
}

export async function fetchTeamMemberBySlug(slug: string) {
  const rows = await fetchTeamMembers(true);
  const member = rows.find((row) => row.slug === slug) ?? null;
  return member && isTeamMemberPublic(member) ? member : null;
}

export async function saveTeamMember(
  member: Omit<TeamMember, "id" | "slug"> & { id?: string; slug?: string },
) {
  const id = member.id || crypto.randomUUID();
  const slug = member.slug || slugify(member.name) || id;
  const { id: _ignored, ...data } = { ...member, id, slug };
  await setDoc(doc(getDb(), COLLECTIONS.team, id), data, { merge: true });
  await logActivity("Saved team member", "team_members", id, member.name);
  return id;
}

export async function deleteTeamMember(id: string) {
  await deleteDoc(doc(getDb(), COLLECTIONS.team, id));
  await logActivity("Removed team member", "team_members", id, id);
}

/**
 * Finds the team member doc for the signed-in account: first by uid, then by
 * matching email (and links the uid to that doc the first time it happens).
 */
export async function fetchTeamMemberForUser(uid: string, email: string | null) {
  const rows = await fetchTeamMembers(true);
  let member = rows.find((row) => row.uid === uid) ?? null;
  if (!member && email) {
    member = rows.find((row) => row.email?.toLowerCase() === email.toLowerCase()) ?? null;
    if (member && !member.uid) {
      await setDoc(doc(getDb(), COLLECTIONS.team, member.id), { uid }, { merge: true });
      member = { ...member, uid };
    }
  }
  return member;
}

/** Fields a staff member may edit on their own profile from the dashboard. */
export async function updateOwnTeamProfile(
  id: string,
  values: Partial<Pick<TeamMember, "name" | "photo" | "bio" | "contact" | "social_links">>,
) {
  await setDoc(doc(getDb(), COLLECTIONS.team, id), values, { merge: true });
}

/* ---------- project assignments (admin sends work to the team) ---------- */

/** Sends one project to a set of team members (pass every active member for "send to all"). */
export async function sendProjectToTeam(
  data: { title: string; description: string; deadline?: string | null },
  members: TeamMember[],
) {
  const projectId = crypto.randomUUID();
  const db = getDb();
  for (const member of members) {
    const id = crypto.randomUUID();
    await setDoc(doc(db, COLLECTIONS.assignments, id), {
      project_id: projectId,
      project_title: data.title,
      project_description: data.description,
      deadline: data.deadline ?? null,
      member_id: member.id,
      member_name: member.name,
      member_uid: member.uid ?? null,
      member_email: member.email ?? null,
      status: "pending",
      created_at: serverTimestamp(),
      responded_at: null,
    });
  }
  await logActivity("Sent project to team", "project_assignments", projectId, data.title);
  return projectId;
}

export async function fetchAllAssignments() {
  const rows = await readAll<ProjectAssignment>(COLLECTIONS.assignments);
  return rows
    .map((row) => ({ ...row, created_at: toIso(row.created_at) }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function fetchAssignmentsForMember(memberId: string) {
  const snapshot = await getDocs(
    query(collection(getDb(), COLLECTIONS.assignments), where("member_id", "==", memberId)),
  );
  return snapshot.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }) as ProjectAssignment)
    .map((row) => ({ ...row, created_at: toIso(row.created_at) }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function respondToAssignment(id: string, status: "accepted" | "rejected") {
  await setDoc(
    doc(getDb(), COLLECTIONS.assignments, id),
    { status, responded_at: serverTimestamp() },
    { merge: true },
  );
  await logActivity(`Project ${status}`, "project_assignments", id, id);
}

export async function deleteAssignment(id: string) {
  await deleteDoc(doc(getDb(), COLLECTIONS.assignments, id));
}

/* ---------- string helpers ---------- */

export function textToList(value: string) {
  return value
    .split("\n")
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
}

export function listToText(value: string[] | null | undefined) {
  return (value ?? []).join("\n");
}
