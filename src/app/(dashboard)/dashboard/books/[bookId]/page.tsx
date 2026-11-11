import {
	ArrowLeft,
	Lock,
	MessageSquareText,
	PencilRuler,
	Receipt,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { BookEditor } from "@/components/books/book-editor";
import { BookStatusBadge } from "@/components/books/book-status-badge";
import { QuoteSummary } from "@/components/books/quote-summary";
import { SpreadGallery } from "@/components/books/spread-gallery";
import { BookPaymentCard } from "@/components/dashboard/books/book-payment-card";
import { DownloadPdfButton } from "@/components/dashboard/books/download-pdf-button";
import { OrderWorkflow } from "@/components/dashboard/books/order-workflow";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { Button } from "@/components/ui/button";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { pageCount } from "@/lib/books/design";
import { getBookOrder } from "@/services/books/order-queries";
import { getStudioDraft } from "@/services/books/queries";
import { formatMoney } from "@/services/projects/money";

/** One order: what the client chose, what it costs, and the steps to deliver it. */
export default async function BookOrderPage({
	params,
}: {
	params: Promise<{ bookId: string }>;
}) {
	const { bookId } = await params;
	const t = await getTranslations("BookOrders.detail");
	const { photographerId } = await requirePhotographer();
	const draft = await getStudioDraft(photographerId, bookId);
	if (draft) return <BookEditor book={draft} mode="studio" />;
	const book = await getBookOrder(photographerId, bookId);
	if (!book) notFound();
	const { order, design, client } = book;
	const { invoice } = order;
	// The studio can still change the design until printing starts.
	const editable = order.status === "SUBMITTED" || order.status === "ACCEPTED";
	const locale = await getLocale();

	return (
		<PageShell>
			<header className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex min-w-0 flex-col gap-1">
					<Link
						href="/dashboard/books"
						className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
					>
						<ArrowLeft className="h-3.5 w-3.5" />
						{t("back")}
					</Link>
					<h1 className="truncate font-display text-xl font-bold tracking-tight">
						{design.title}
					</h1>
					<p className="text-xs text-muted-foreground">
						<Link
							href={`/dashboard/clients/${client.id}`}
							className="hover:underline"
						>
							{client.name}
						</Link>
						{" · "}
						<Link
							href={`/dashboard/projects/${book.projectId}`}
							className="hover:underline"
						>
							{book.projectTitle}
						</Link>
					</p>
				</div>
				<div className="flex flex-col items-end gap-1.5">
					<div className="flex items-center gap-2">
						<BookStatusBadge
							status={order.status}
							awaitingApproval={order.awaitingApproval}
						/>
						{editable && (
							<Button asChild size="sm" className="h-8 gap-1.5 text-xs">
								<Link href={`/dashboard/books/${book.id}/edit`}>
									<PencilRuler className="h-3.5 w-3.5" />
									{t("editDesign")}
								</Link>
							</Button>
						)}
					</div>
					{!editable && (
						<p className="flex items-center gap-1 text-[11px] text-muted-foreground">
							<Lock className="h-3 w-3" />
							{t("lockedHint")}
						</p>
					)}
				</div>
			</header>

			{order.changeRequest && (
				<p className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
					<MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
					<span className="whitespace-pre-wrap">
						{t("changeRequest", {
							client: client.name,
							note: order.changeRequest,
						})}
					</span>
				</p>
			)}
			<section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
				<OrderWorkflow
					bookId={book.id}
					status={order.status}
					calculated={order.quote?.total ?? 0}
					invoicePaid={invoice?.status === "PAID"}
					awaitingApproval={order.awaitingApproval}
					balance={formatMoney(
						invoice ? Math.max(0, invoice.total - invoice.paid) : 0,
						locale,
					)}
				/>
			</section>

			<div className="grid gap-4 md:grid-cols-2">
				<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
					<h2 className="text-sm font-semibold">{t("price")}</h2>
					{order.quote && (
						<QuoteSummary
							quote={order.quote}
							format={design.format}
							pages={pageCount(design)}
							charged={order.total}
						/>
					)}
					{invoice && <BookPaymentCard bookId={book.id} invoice={invoice} />}
					{invoice && (
						<Button
							asChild
							variant="outline"
							size="sm"
							className="w-fit gap-1.5"
						>
							<Link href={`/dashboard/invoices/${invoice.id}`}>
								<Receipt className="h-3.5 w-3.5" />
								{t("invoice", {
									number: invoice.number,
									status: t(`invoiceStatus.${invoice.status}`),
								})}
							</Link>
						</Button>
					)}
				</section>
				<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
					<h2 className="text-sm font-semibold">{t("client")}</h2>
					<dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
						<dt className="text-muted-foreground">{t("name")}</dt>
						<dd>{client.name}</dd>
						{client.email && (
							<>
								<dt className="text-muted-foreground">{t("email")}</dt>
								<dd className="break-all">{client.email}</dd>
							</>
						)}
						{client.phone && (
							<>
								<dt className="text-muted-foreground">{t("phone")}</dt>
								<dd>{client.phone}</dd>
							</>
						)}
					</dl>
					{order.clientNote && (
						<p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-2.5 text-xs">
							{order.clientNote}
						</p>
					)}
					<DownloadPdfButton bookId={book.id} />
				</section>
			</div>

			<SpreadGallery design={design} photos={book.photos} />
		</PageShell>
	);
}
