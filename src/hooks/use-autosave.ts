"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	type FieldValues,
	type UseFormReturn,
	useWatch,
} from "react-hook-form";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

const DEFAULT_DELAY_MS = 900;

/**
 * Saves a react-hook-form form on its own once the user pauses typing.
 * `save` returns whether it worked. Invalid values wait until they are fixed;
 * what was typed while a save ran is kept and saved next. Call `flush` to save
 * right away (on blur, say).
 */
export function useAutosave<T extends FieldValues>(
	form: UseFormReturn<T>,
	save: (values: T) => Promise<boolean>,
	delay = DEFAULT_DELAY_MS,
) {
	const [status, setStatus] = useState<AutosaveStatus>("idle");
	const saving = useRef(false);
	/** Values whose save failed: not retried until something changes. */
	const failed = useRef<string | null>(null);
	const values = useWatch({ control: form.control });
	const { isDirty } = form.formState;

	const flush = useCallback(async () => {
		if (saving.current || !form.formState.isDirty) return;
		if (!(await form.trigger())) return;
		saving.current = true;
		setStatus("saving");
		const current = form.getValues();
		const ok = await save(current);
		saving.current = false;
		failed.current = ok ? null : JSON.stringify(current);
		if (ok) form.reset(current, { keepValues: true });
		setStatus(ok ? "saved" : "error");
	}, [form, save]);

	// `status` is a dependency so anything typed during a save is picked up after it.
	useEffect(() => {
		if (!isDirty || failed.current === JSON.stringify(values)) return;
		const timer = window.setTimeout(flush, delay);
		return () => window.clearTimeout(timer);
	}, [values, isDirty, status, delay, flush]);

	return { status, flush };
}
