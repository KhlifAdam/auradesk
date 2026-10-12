import { getTranslations } from "next-intl/server";
import { InviteStatusBadge } from "@/components/dashboard/projects/invite-status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initialsOf } from "@/lib/initials";
import type { TeamMemberSummary } from "@/services/team/types";
import { RemoveMemberButton } from "./remove-member-button";

/** Team rows: who, what they do, how many projects, invitation state. */
export async function MemberList({
	members,
}: {
	members: TeamMemberSummary[];
}) {
	const t = await getTranslations("Team.list");

	return (
		<ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
			{members.map((member) => (
				<li key={member.id} className="flex items-center gap-3 px-3 py-2.5">
					<Avatar className="h-8 w-8 border border-border">
						<AvatarFallback className="bg-primary/10 text-xs text-primary">
							{initialsOf(member.name)}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium">
							{member.name}
							{member.specialty && (
								<span className="font-normal text-muted-foreground">
									{" "}
									· {member.specialty}
								</span>
							)}
						</p>
						<p className="truncate text-xs text-muted-foreground">
							{member.email}
						</p>
					</div>
					<span className="hidden text-xs text-muted-foreground sm:inline">
						{t("projects", { count: member.projectCount })}
					</span>
					<InviteStatusBadge status={member.status} />
					<RemoveMemberButton memberId={member.id} name={member.name} />
				</li>
			))}
		</ul>
	);
}
