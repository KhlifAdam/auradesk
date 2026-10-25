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
- Photo books (/dashboard/books): clients design a printed album from their
  delivered photos in the portal (or the studio designs it for them) and send
  it as an order. Prices come from the studio's price list (/dashboard/books/prices).
  Accepting bills it with an invoice; the studio can print before being paid and
  collect on delivery. Steps: SUBMITTED, ACCEPTED, IN_PRODUCTION, READY, DELIVERED.
- Money to collect (on the Overview): what each client still owes, overdue
  amounts, and what to chase first.
- Smart estimate (on each project and in the calendar as "Expected delivery"):
  hours of work left (import, culling, retouching, video editing, export), client
  waiting time, expected finish date and deadline risk. Video projects have a
  video editing step (POST_PRODUCTION is "video editing" for them).
- Equipment (/dashboard/equipment): gear, its status, and bookings on projects or rentals.
- Team (/dashboard/team): collaborators invited by email, assigned to projects
  with a role (editor, drone pilot…). They only see their assigned projects.
- Messages (/dashboard/messages): chat with clients who share a project.
- Website: portfolio albums, services (packages), site profile and appearance.
- Subscription (/dashboard/subscription): one free month, then STARTER, PRO or STUDIO.
Money is in Tunisian dinars (TND).

## Client portal
Clients sign in with email or a phone code, see their projects, galleries and
invoices, choose photos, design and order photo books, message the studio and
request new services. They have their own assistant for questions.
`.trim();
