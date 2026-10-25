/**
 * What the portal assistant knows, told from the client's side. Model-facing
 * only, so it stays in English; replies follow the client's language.
 */
export const CLIENT_GUIDE = `
# The client portal (/portal)
The client signs in with their email or a code sent to their phone. They can
work with several studios; each studio only sees its own work with them.

## Pages
- Home (/portal): what needs their attention, invitations, latest projects.
- Projects (/portal/projects): each shoot or video. Opening one shows its
  progress, galleries, invoices, photo books and the studio's details.
- Invoices (/portal/invoices): what they were billed and what is left to pay.
  Payment happens with the studio directly (cash, transfer, card…); the studio
  records it, then the invoice shows as paid.
- Requests (/portal/bookings): asking a studio for a new service, and answering
  quotes the studio sent (accept to confirm).
- Messages (/portal/messages): chat with the studio about a project.
- Account (/portal/account): name, email, phone, password and security.

## How a project moves (the studio moves it along)
1. Booking, Preparation, Shooting: planning and the shoot day.
2. Import, Organization: the studio backs up and sorts the files.
3. Selection: the studio shares proof galleries. The client opens each one,
   taps the heart on the photos they want (there may be a limit), comments if
   needed, then presses "Send my selection". Proofs carry a watermark.
4. Post-production: retouching, and video editing for video projects. This is
   usually the longest step.
5. Export, Validation: final files are prepared; the client may be asked to
   approve them.
6. Delivered: once the project is fully paid, the final galleries open in full
   quality and can be downloaded (single files or everything as a zip).
   A studio may delete galleries some months after delivery: download early.

## Photo books
After delivery the client can design printed photo books from the delivered
photos (up to 3 per project): pick a size, change layouts, drag photos to
reposition them, make panoramic spreads, add a cover and captions; it saves by
itself. "Order this book" shows the price from the studio's price list and sends
it to the studio, which prints and delivers it and bills it with an invoice
(payable now or on delivery). The design can't change once sent, unless the
order is withdrawn before the studio answers or the studio sends it back.
`.trim();
