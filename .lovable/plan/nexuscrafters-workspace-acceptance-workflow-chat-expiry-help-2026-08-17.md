# NexusCrafters — Workspace, Acceptance Workflow, Chat Expiry & Help Center

## What the three documents ask for

**1. Team Workspace & Project Management**
Role-based system with three actors: Admin/Owner, Team Member, Requester. A protected `/team-panel` (Overview, My Projects, Project Progress, Chats, Completed Projects, Profile), admin control over which members get panel access, a much richer project record (budget, deadline, priority, status, progress %, internal vs customer notes, files), per-project private chat plus a separate internal team chat, requester-facing progress timeline, completed-project ZIP delivery with admin approval, and Firestore rules enforcing every boundary server-side.

**2. Team Acceptance Workflow (changes the request flow)**
Assigning members no longer activates the project. Each selected member gets an individual invitation (`pending / accepted / rejected / expired / removed`). Admin sees a live "4 / 5 Accepted" counter. On final approval, pending invites auto-expire, only accepted members become project members, and only then does the requester gain progress + chat access. Approval is blocked if zero members accepted. Request status and invitation status are tracked separately.

**3. Chat Expiry, Delivery & Help Center**
Project chat gets a 24h expiry stored in Firestore (enforced by rules, not just UI), with a live countdown, archive-on-expiry, admin extension (+6h/+12h/+24h/+48h/+7d/custom) and an extension audit history. After completion the requester gets a Delivery view (approved ZIP, preview URL, notes) and a "HELP HERE" button that opens a help request (subject, category, message, attachment). Help requests get their own admin dashboard, team assignment, team panel view, a shared help chat, an internal help chat, and their own expiry.

## Existing code I'll build on (not rebuild)

The uploaded app already has: Firebase auth (Google + email link) in `auth-context.tsx`, `cms.ts` data helpers, admin tabs (CMS, Portfolio, Services, Team, Projects, Requests), `/dashboard`, and `firestore.rules` with `users`, `team_members`, `contact_requests`, `project_assignments`. The acceptance workflow extends `project_assignments` into per-member invitations; the rest slots into the existing collections.

## Proposed build order

**Phase 0 — Restore**
Bring the uploaded codebase into this project, install deps, confirm it builds and runs. Firebase stays as the backend (I'll need your Firebase config values if the existing ones aren't in the zip).

**Phase 1 — Foundations**
Role/permission layer (`admin | team | requester`), `team_panel_access` toggle in Admin → Team, protected `/team-panel` route shell, extended project + request data models, notifications collection.

**Phase 2 — Acceptance workflow**
`project_team_invitations`, admin "send to team" flow, member Accept/Reject in Team Panel, real-time acceptance counter, final-approval confirmation dialog with auto-expiry of pending members, hard block at zero acceptances, requester activation gated on approval.

**Phase 3 — Chats**
Project chat + internal team chat with realtime listeners, unread badges, system messages, file attachments; admin chat console with filters.

**Phase 4 — Progress, files & delivery**
Progress/timeline updates, Firebase Storage file areas (brief/references/work/final ZIP), admin ZIP review (Approve / Needs Revision), requester Project Delivery view.

**Phase 5 — Chat expiry**
`project_chat_settings`, countdown, expiry lock + archive, admin extension menu, `chat_expiry_history` audit.

**Phase 6 — Help Center**
`help_requests` + admin dashboard (stats, filters, search), assignment to members, team panel Help Requests with Accept/Reject/Start/Resolve, help chat + internal help chat, help chat expiry.

**Phase 7 — Security & QA**
Full `firestore.rules` rewrite covering every new collection, then the access-control test matrix (admin / enabled team / disabled team / requester / signed-out), build, lint, route validation.

## Technical notes

- Firestore rules do the real enforcement; React route guards are UX only.
- Files go to Firebase Storage with metadata/URLs in Firestore — no base64 ZIPs.
- Chat expiry is a stored `expiresAt` timestamp checked in rules on message create.
- Invitations live in their own collection so each member has an independent status.
- Existing auth, admin panel, public site pages and visual identity stay untouched.

## Scope note

This is a large build — realistically several phases across multiple turns rather than one shot. I suggest shipping and verifying each phase before moving to the next.
