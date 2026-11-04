import type { ReactNode } from "react";

/** Everything under /client is the client space: it takes the client's colour. */
export default function ClientAuthLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<div data-space="client" className="contents">
			{children}
		</div>
	);
}
