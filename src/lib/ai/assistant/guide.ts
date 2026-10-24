/**
 * What the assistant knows about AuraDesk itself, for "how do I…" questions.
 * Model-facing only, so it stays in English; replies follow the user's language.
 */
export const APP_GUIDE = `
# AuraDesk in short
AuraDesk is a studio manager for photographers and videographers. It has a
private dashboard (this app) and a public website per studio.

## Dashboard pages
- Overview (/dashboard): today's reminders, statistics for a period.
- Calendar (/dashboard/calendar): shoots, meetings, availability. Project dates show up automatically.
- Bookings (/dashboard/bookings): requests and quotes. Statuses: NEW, DISCUSSION,
  QUOTE_SENT (proposal sent to the client), CONFIRMED, DECLINED. Requests come
  from the public site, the client portal or are typed in by the photographer
  (Instagram, WhatsApp, phone…).
- Clients (/dashboard/clients): people who accepted at least one project, with private notes.
- Projects (/dashboard/projects): the work itself. Only confirming a booking (or
  creating a project by hand) makes a project; a request alone never does.
  Workflow stages, in order: BOOKING, PREP, SHOOTING, IMPORT, ORGANIZATION,
  SELECTION, POST_PRODUCTION, EXPORT, VALIDATION, DELIVERY. A client is invited
  to a project by email or phone and sees it in their portal once they accept.
- Galleries (inside a project): PROOFS for the client to choose from, FINAL for
  delivery. Sharing a gallery notifies the client; they can pick and comment
  from the SELECTION stage on. The AI photo assistant flags blur, bad exposure,
  closed eyes and near-duplicates; the video assistant splits clips into scenes.
- Invoices (/dashboard/invoices): DRAFT, SENT, PAID, CANCELLED; OVERDUE is a sent
  invoice past its due date. Sending emails the client. Payments can be partial.
- Equipment (/dashboard/equipment): gear, its status, and bookings on projects or rentals.
- Team (/dashboard/team): collaborators invited by email, assigned to projects
  with a role (editor, drone pilot…). They only see their assigned projects.
- Messages (/dashboard/messages): chat with clients who share a project.
- Website: portfolio albums, services (packages), site profile and appearance.
- Subscription (/dashboard/subscription): one free month, then STARTER, PRO or STUDIO.
Money is in Tunisian dinars (TND).

## Client portal
Clients sign in with email or a phone code, see their projects, galleries and
invoices, choose photos, message the studio and request new services.
`.trim();
