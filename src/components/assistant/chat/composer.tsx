"use client";

import { ArrowUp, Loader2, Mic, Square } from "lucide-react";
import { useTranslations } from "next-intl";
import {
	type FormEvent,
	type KeyboardEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ASSISTANT_LIMITS } from "@/lib/ai/assistant/limits";
import { cn } from "@/lib/utils";
import { useAssistant } from "../assistant-provider";
import { useVoiceRecorder, type VoiceError } from "./use-voice-recorder";

interface ComposerProps {
	onSend: (text: string) => void;
	onStop: () => void;
	/** The assistant is answering: the send button becomes a stop button. */
	answering: boolean;
	/** A card waits for Confirm or Cancel; new questions wait too. */
	blocked: boolean;
	autoFocus?: boolean;
}

/** The question box: type, or dictate (the transcript lands here to check first). */
export function Composer({
	onSend,
	onStop,
	answering,
	blocked,
	autoFocus,
}: ComposerProps) {
	const t = useTranslations("Assistant.composer");
	const [text, setText] = useState("");
	const box = useRef<HTMLTextAreaElement>(null);
	/** What was typed before dictating; the spoken words go after it. */
	const typed = useRef("");

	const withSpoken = (spoken: string) =>
		typed.current.trim() ? `${typed.current.trimEnd()} ${spoken}` : spoken;
	const insert = useCallback((spoken: string) => {
		setText(withSpoken(spoken));
		box.current?.focus();
	}, []);
	const fail = useCallback((error: VoiceError) => toast.error(t(error)), [t]);
	const voice = useVoiceRecorder({ onText: insert, onError: fail });
	const { liveText } = voice;

	// The words so far show up as you speak; the final reading replaces them.
	useEffect(() => {
		if (liveText) setText(withSpoken(liveText));
	}, [liveText]);
	const startVoice = () => {
		typed.current = text;
		void voice.start();
	};
	const toggleVoice = () => {
		if (voice.state === "recording") void voice.stop();
		else if (voice.state === "idle") startVoice();
	};

	// The keyboard shortcut starts and stops dictation (see AssistantProvider).
	const { dictationTick, consumeDictationOnOpen } = useAssistant();
	const toggleRef = useRef(toggleVoice);
	toggleRef.current = toggleVoice;
	const seenTick = useRef(dictationTick);
	useEffect(() => {
		if (seenTick.current === dictationTick) return;
		seenTick.current = dictationTick;
		toggleRef.current();
	}, [dictationTick]);
	// The shortcut also opened the panel: this box wasn't there for the key press.
	useEffect(() => {
		if (consumeDictationOnOpen()) toggleRef.current();
	}, [consumeDictationOnOpen]);

	const canSend = text.trim().length > 0 && !answering && !blocked;
	const submit = (event?: FormEvent) => {
		event?.preventDefault();
		if (!canSend) return;
		onSend(text.trim());
		setText("");
	};
	const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (
			event.key === "Enter" &&
			!event.shiftKey &&
			!event.nativeEvent.isComposing
		) {
			event.preventDefault();
			submit();
		}
	};
	const recording = voice.state === "recording";

	return (
		<form onSubmit={submit} className="flex flex-col gap-1.5">
			{blocked && (
				<p className="px-1 text-[11px] text-muted-foreground">
					{t("pendingAction")}
				</p>
			)}
			<div
				className={cn(
					"flex items-end gap-1.5 rounded-2xl border border-border bg-card p-1.5 shadow-sm transition-all duration-300 focus-within:border-primary/50 focus-within:shadow-luminous",
					recording && "border-destructive/50",
				)}
			>
				<textarea
					ref={box}
					value={text}
					onChange={(event) => setText(event.target.value)}
					readOnly={voice.state !== "idle"}
					onKeyDown={onKeyDown}
					rows={1}
					maxLength={ASSISTANT_LIMITS.messageChars}
					// biome-ignore lint/a11y/noAutofocus: opening the assistant means typing next.
					autoFocus={autoFocus}
					placeholder={
						recording
							? t("listening", { seconds: voice.seconds })
							: t("placeholder")
					}
					aria-label={t("placeholder")}
					className="field-sizing-content max-h-40 min-h-8 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
				/>
				<Button
					type="button"
					size="icon"
					variant="ghost"
					className={cn(
						"h-8 w-8 shrink-0 rounded-xl",
						recording && "bg-destructive/10 text-destructive",
					)}
					disabled={voice.state === "transcribing"}
					aria-label={t(recording ? "stopRecording" : "record")}
					title={`${t(recording ? "stopRecording" : "record")} (Ctrl+Shift+Space)`}
					onClick={recording ? () => void voice.stop() : startVoice}
				>
					{voice.state === "transcribing" ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : recording ? (
						<span className="flex h-4 items-center gap-px">
							{voice.levels.map((level, i) => (
								<span
									// biome-ignore lint/suspicious/noArrayIndexKey: fixed set of bars.
									key={i}
									className="w-0.5 rounded-full bg-current transition-all duration-100"
									style={{ height: `${25 + level * 75}%` }}
								/>
							))}
						</span>
					) : (
						<Mic className="h-4 w-4" />
					)}
				</Button>
				{answering ? (
					<Button
						type="button"
						size="icon"
						variant="secondary"
						className="h-8 w-8 shrink-0 rounded-xl"
						aria-label={t("stop")}
						onClick={onStop}
					>
						<Square className="h-3.5 w-3.5 fill-current" />
					</Button>
				) : (
					<Button
						type="submit"
						size="icon"
						className="h-8 w-8 shrink-0 rounded-xl"
						disabled={!canSend}
						aria-label={t("send")}
					>
						<ArrowUp className="h-4 w-4" />
					</Button>
				)}
			</div>
		</form>
	);
}
