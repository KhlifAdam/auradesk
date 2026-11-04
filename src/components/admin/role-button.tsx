"use client";

import { Loader2, UserCog } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLES } from "@/lib/auth/roles";
import { setUserRole } from "@/services/admin/account-actions";
import { ASSIGNABLE_ROLES } from "@/services/admin/schemas";
import { useAdminAction } from "./use-admin-action";

type Role = (typeof ASSIGNABLE_ROLES)[number];

/** Picks a new role (photographer, client or team member), then asks to confirm. */
export function RoleButton({
	userId,
	name,
	role,
}: {
	userId: string;
	name: string;
	role: string;
}) {
	const t = useTranslations("Admin");
	const [next, setNext] = useState<Role | null>(null);
	const { isPending, run } = useAdminAction();

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						size="sm"
						variant="outline"
						className="h-7 gap-1.5 text-xs"
						disabled={isPending}
					>
						{isPending ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<UserCog className="h-3.5 w-3.5" />
						)}
						{t("role.button")}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel className="text-xs">
						{t("role.label")}
					</DropdownMenuLabel>
					<DropdownMenuRadioGroup
						value={role}
						onValueChange={(value) => value !== role && setNext(value as Role)}
					>
						{ASSIGNABLE_ROLES.map((option) => (
							<DropdownMenuRadioItem
								key={option}
								value={option}
								className="text-xs"
							>
								{t(`roles.${option}`)}
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<AlertDialog
				open={next !== null}
				onOpenChange={(open) => !open && setNext(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("role.title", { name, role: next ? t(`roles.${next}`) : "" })}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("role.description")}
							{role === ROLES.photographer && ` ${t("role.siteOffline")}`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("role.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								next &&
								run(() => setUserRole({ userId, role: next }), t("role.done"))
							}
						>
							{t("role.confirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
