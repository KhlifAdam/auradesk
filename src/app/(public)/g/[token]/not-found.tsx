import { NotFoundCard } from "@/components/status/not-found-card";

/** Stopped, expired or wrong link: say so, without telling which. */
export default function ShareLinkNotFound() {
	return <NotFoundCard namespace="NotFound.shareLink" href="/" />;
}
