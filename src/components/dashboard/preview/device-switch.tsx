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
				const Icon = DEVICES[id].icon;
				return {
					value: id,
					label: <Icon className="h-3.5 w-3.5" />,
					ariaLabel: t(id),
				};
			})}
		/>
	);
}
