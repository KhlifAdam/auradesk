/** One choice in a search picker. */
export interface PickerOption {
	id: string;
	label: string;
	/** A second line, e.g. brand and model, or a date. */
	detail: string;
}
