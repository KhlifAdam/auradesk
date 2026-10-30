"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Sets or clears (`null`) URL search params and goes back to page 1. */
export function useUpdateSearchParams() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	return (patch: Record<string, string | null>) => {
		const params = new URLSearchParams(searchParams);
		params.delete("page");
		for (const [key, value] of Object.entries(patch)) {
			if (value) params.set(key, value);
			else params.delete(key);
		}
		router.replace(`${pathname}?${params}`, { scroll: false });
	};
}
