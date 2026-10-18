"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { reveal } from "./animations";

const FAQ_ITEMS = [
	"trial",
	"migrate",
	"galleries",
	"commission",
	"team",
] as const;
const CONTACT_EMAIL = "hello@auradesk.co";

export function FAQ() {
	const t = useTranslations("Landing.faq");

	return (
		<section
			id="faq"
			className="mx-auto grid max-w-5xl gap-12 px-5 py-24 md:grid-cols-[.7fr_1.3fr] md:py-32"
		>
			<motion.div {...reveal}>
				<p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
					{t("eyebrow")}
				</p>
				<h2 className="mt-3 text-4xl font-semibold">{t("title")}</h2>
				<p className="mt-5 text-sm text-muted-foreground">
					{t("contactPrefix")}{" "}
					<a
						href={`mailto:${CONTACT_EMAIL}`}
						className="text-primary underline underline-offset-4"
					>
						{t("contactLink")}
					</a>
				</p>
			</motion.div>
			<motion.div {...reveal}>
				<Accordion type="single" collapsible>
					{FAQ_ITEMS.map((id) => (
						<AccordionItem key={id} value={id}>
							<AccordionTrigger className="py-5 text-base hover:no-underline">
								{t(`items.${id}.q`)}
							</AccordionTrigger>
							<AccordionContent className="max-w-xl pb-5 leading-6 text-muted-foreground">
								{t(`items.${id}.a`)}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</motion.div>
		</section>
	);
}
