import { getTranslations } from "next-intl/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { isMainAdminEmail } from "@/lib/auth/main-admin";
import { ROLES } from "@/lib/auth/roles";
import { initialsOf } from "@/lib/initials";
import type { ROLE_FILTERS } from "@/services/admin/schemas";
import type { AdminUserDetail } from "@/services/admin/user-detail";
import { BanButton } from "./ban-button";
import { DeleteAccountButton } from "./delete-account-button";
import { EditAccountDialog } from "./edit-account-dialog";
import { RoleButton } from "./role-button";

const STATUS = "h-5 border-destructive/40 px-1.5 text-[10px] text-destructive";

/**
 * Who the account is, its status, and what the admin can do to it. Their own
 * account, other admins and deleted accounts get no actions.
 */
export async function UserHeader({
	user,
	adminId,
}: {
	user: AdminUserDetail;
	adminId: string;
}) {
	const t = await getTranslations("Admin");
	const manageable =
		user.id !== adminId && user.role !== ROLES.admin && !user.deleted;
	const name = user.deleted ? t("users.deletedName") : user.name;

	return (
		<div className="flex flex-wrap items-center gap-3">
			<Avatar className="h-12 w-12 border border-border">
				<AvatarImage
					src={user.image ?? undefined}
					alt=""
					className="object-cover"
				/>
				<AvatarFallback className="bg-primary/10 text-primary">
					{initialsOf(name)}
				</AvatarFallback>
			</Avatar>
			<div className="flex flex-1 flex-col gap-0.5">
				<h1 className="flex flex-wrap items-center gap-2 font-display text-xl font-bold tracking-tight">
					{name}
					<Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
						{t(`roles.${user.role as (typeof ROLE_FILTERS)[number]}`)}
					</Badge>
					{isMainAdminEmail(user.email) && (
						<Badge className="h-5 px-1.5 text-[10px]">{t("mainAdmin")}</Badge>
					)}
					{user.deleted ? (
						<Badge variant="outline" className={STATUS}>
							{t("users.deleted")}
						</Badge>
					) : (
						user.banned && (
							<Badge variant="outline" className={STATUS}>
								{t("users.suspended")}
							</Badge>
						)
					)}
				</h1>
				{user.banReason && (
					<p className="text-xs text-muted-foreground">
						{t("activity.reason", { reason: user.banReason })}
					</p>
				)}
			</div>
			{manageable && (
				<div className="flex flex-wrap items-center gap-1.5">
					<EditAccountDialog
						userId={user.id}
						initial={{ name: user.name, email: user.email, phone: user.phone }}
					/>
					<RoleButton userId={user.id} name={user.name} role={user.role} />
					<BanButton userId={user.id} name={user.name} banned={user.banned} />
					<DeleteAccountButton userId={user.id} name={user.name} />
				</div>
			)}
		</div>
	);
}
