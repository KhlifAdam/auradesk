"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useErrorMessage } from "@/hooks/use-error-message";
import {
	ATTACHMENT_MAX_BYTES,
	isAllowedMime,
	type SentAttachment,
} from "@/services/messages/attachments";
import type { MessageRole } from "@/services/messages/viewer";
import { AttachmentError, uploadAttachment } from "./upload-attachment";
import { useVoiceRecorder, type VoiceRecording } from "./use-voice-recorder";

type Send = (
	body: string,
	attachment: SentAttachment | null,
) => Promise<string | null>;

/**
 * What the composer sends besides text: the picked file (uploaded on send)
 * and voice messages (uploaded and sent as soon as recording stops).
 */
export function useComposerMedia(role: MessageRole, onSend: Send) {
	const t = useTranslations("Messages.composer");
	const errorMessage = useErrorMessage();
	const [file, setFile] = useState<File | null>(null);
	const [progress, setProgress] = useState<number | null>(null);
	const [voiceSending, setVoiceSending] = useState(false);
	const recorder = useVoiceRecorder((recording) => void sendVoice(recording));

	const { state: micState, reset: resetMic } = recorder;
	useEffect(() => {
		if (micState !== "denied" && micState !== "unsupported") return;
		toast.error(t(micState === "denied" ? "micDenied" : "micUnsupported"));
		resetMic();
	}, [micState, resetMic, t]);

	/** Uploads, then sends; false (after a toast) if anything failed. */
	async function deliver(
		text: string,
		source: { blob: Blob; name: string; voice: VoiceRecording | null } | null,
	) {
		let attachment: SentAttachment | null = null;
		try {
			if (source)
				attachment = await uploadAttachment(
					role,
					source.blob,
					source.name,
					source.voice && { durationMs: source.voice.durationMs },
					setProgress,
				);
		} catch (error) {
			toast.error(
				errorMessage(error instanceof AttachmentError ? error.message : ""),
			);
			return false;
		} finally {
			setProgress(null);
		}
		const error = await onSend(text, attachment);
		if (error) toast.error(errorMessage(error));
		return !error;
	}

	/** Sends the text with the picked file, if any; clears the file once sent. */
	async function sendWithFile(text: string) {
		const sent = await deliver(
			text,
			file ? { blob: file, name: file.name, voice: null } : null,
		);
		if (sent) setFile(null);
		return sent;
	}

	async function sendVoice(recording: VoiceRecording | null) {
		if (!recording) return;
		setVoiceSending(true);
		await deliver("", {
			blob: recording.blob,
			name: recording.filename,
			voice: recording,
		});
		setVoiceSending(false);
	}

	/** Keeps a picked or pasted file, if it can be sent. */
	function pick(picked: File | undefined) {
		if (!picked) return false;
		const problem =
			picked.size > ATTACHMENT_MAX_BYTES
				? "tooLarge"
				: picked.type && !isAllowedMime(picked.type)
					? "unsupportedType"
					: null;
		if (problem) {
			toast.error(errorMessage(problem));
			return false;
		}
		setFile(picked);
		return true;
	}

	return {
		file,
		progress,
		pick,
		removeFile: () => setFile(null),
		sendWithFile,
		recorder,
		recording: recorder.state === "recording" || voiceSending,
		voiceSending,
		stopAndSend: () => void recorder.stop().then(sendVoice),
	};
}
