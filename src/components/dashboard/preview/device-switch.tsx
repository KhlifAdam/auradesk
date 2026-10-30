"use client";

import { useTranslations } from "next-intl";
import { SegmentedControl } from "@/components/dashboard/shared/segmented-control";
import { DEVICE_IDS, DEVICES, type Device } from "./devices";

/** Desktop / tablet / phone toggle for the site previews. */
export function DeviceSwitch({
	value,
	onChange,
}: {
	value: Device;
	onChange: (device: Device) => void;
}) {
	const t = useTranslations("Preview.device");

	return (
		<SegmentedControl
			value={value}
			onChange={onChange}
			options={DEVICE_IDS.map((id) => {
				const { icon: Icon, iconClass } = DEVICES[id];
				return {
					value: id,
					label: (
						<span title={t(id)} className="flex items-center">
							<Icon className={iconClass} />
						</span>
					),
					ariaLabel: t(id),
				};
			})}
		/>
	);
}
