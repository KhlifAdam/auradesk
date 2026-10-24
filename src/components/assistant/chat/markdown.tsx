"use client";

import "streamdown/styles.css";
import Link from "next/link";
import type { ComponentProps } from "react";
import { type Components, Streamdown } from "streamdown";

/** In-app links stay in the app; anything else opens in a new tab. */
function MarkdownLink({ href = "", children }: ComponentProps<"a">) {
	const className =
		"font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary";
	if (href.startsWith("/"))
		return (
			<Link href={href} className={className}>
				{children}
			</Link>
		);
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className={className}
		>
			{children}
		</a>
	);
}

const components = {
	a: MarkdownLink,
	p: ({ children }) => <p className="leading-relaxed">{children}</p>,
	strong: ({ children }) => (
		<strong className="font-semibold text-foreground">{children}</strong>
	),
	ul: ({ children }) => (
		<ul className="flex list-disc flex-col gap-1 pl-4 marker:text-primary/70">
			{children}
		</ul>
	),
	ol: ({ children }) => (
		<ol className="flex list-decimal flex-col gap-1 pl-4 marker:text-muted-foreground">
			{children}
		</ol>
	),
	h1: ({ children }) => (
		<h3 className="font-display text-sm font-semibold">{children}</h3>
	),
	h2: ({ children }) => (
		<h3 className="font-display text-sm font-semibold">{children}</h3>
	),
	h3: ({ children }) => <h4 className="text-sm font-semibold">{children}</h4>,
	blockquote: ({ children }) => (
		<blockquote className="border-l-2 border-primary/40 pl-3 text-muted-foreground">
			{children}
		</blockquote>
	),
	hr: () => <hr className="border-border" />,
} as Components;

/** The assistant's prose, formatted as it streams in. */
export function Markdown({
	text,
	streaming,
}: {
	text: string;
	streaming: boolean;
}) {
	return (
		<Streamdown
			className="flex flex-col gap-2 text-sm [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-px [&_code]:text-[0.85em] [&_table]:text-xs"
			components={components}
			controls={false}
			linkSafety={{ enabled: false }}
			isAnimating={streaming}
			animated
		>
			{text}
		</Streamdown>
	);
}
