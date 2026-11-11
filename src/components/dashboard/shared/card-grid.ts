/** The card grid shared by Services, Bookings and Photo books. */
export const CARD_GRID =
	"grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

/** A clickable card in that grid. */
export const CARD =
	"group flex w-full flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition-all duration-300 hover:border-primary/50 hover:shadow-luminous";

/** The 16:9 header of a card: its photo, or an icon on a muted fill. */
export const CARD_MEDIA =
	"relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-muted";
