"use client";

import { motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";
import { BrandMark } from "./brand-mark";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";

/**
 * Section ids double as the message keys under `Landing.header`. Links point
 * at the landing page so they also work from the legal pages.
 */
const NAV_SECTIONS = ["features", "workflow", "pricing", "faq"] as const;

export function Header() {
	const t = useTranslations("Landing.header");
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<header className="fixed inset-x-0 top-4 z-50 px-4">
			<nav className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-xl border border-border/70 bg-background/75 px-3 shadow-lg backdrop-blur-xl md:px-5">
				{/* The brand leads back to the hub where visitors pick their side. */}
				<Link
					href="/"
					className="flex items-center gap-2.5 font-display text-sm font-bold"
				>
					<BrandMark /> {BRAND_NAME}
				</Link>
				<div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
					{NAV_SECTIONS.map((id) => (
						<a
							key={id}
							className="transition-colors hover:text-foreground"
							href={`/photographers#${id}`}
						>
							{t(id)}
						</a>
					))}
				</div>
				<div className="flex items-center gap-1.5">
					<LanguageSwitcher />
					<ThemeToggle />
					<Button size="sm" className="hidden sm:inline-flex" asChild>
						<Link href="/login">
							{t("getStarted")} <ArrowRight />
						</Link>
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setMenuOpen(!menuOpen)}
						aria-label={t("toggleMenu")}
						className="md:hidden"
					>
						{menuOpen ? <X /> : <Menu />}
					</Button>
				</div>
			</nav>
			{menuOpen && (
				<motion.div
					initial={{ opacity: 0, y: -8 }}
					animate={{ opacity: 1, y: 0 }}
					className="mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-xl border border-border bg-background p-3 shadow-xl md:hidden"
				>
					{NAV_SECTIONS.map((id) => (
						<a
							key={id}
							onClick={() => setMenuOpen(false)}
							href={`/photographers#${id}`}
							className="rounded-lg px-3 py-2 text-sm hover:bg-accent"
						>
							{t(id)}
						</a>
					))}
				</motion.div>
			)}
		</header>
	);
}
