import "server-only";

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import OpenAI from "openai";
import { z } from "zod";
import { BRAND_NAME } from "@/lib/brand";

/** The model the assistants use for vision checks: cheap while testing. */
export const VISION_MODEL = "google/gemma-3-12b-it";

/** The chat assistant's model: cheap, but reliable at calling tools. */
const ASSISTANT_MODEL =
	process.env.ASSISTANT_MODEL || "mistralai/ministral-8b-2512";

/**
 * Turns voice notes into text for the assistant's composer. A chat model that
 * hears audio, not Whisper: it doesn't tack "Thank you." onto the end.
 */
export const TRANSCRIBE_MODEL = "google/gemini-2.5-flash-lite";

/** The assistant's model through the AI SDK, or null without an API key. */
export function getAssistantModel() {
	const apiKey = process.env.OPENROUTER_API_KEY;
	if (!apiKey) return null;
	const openrouter = createOpenRouter({
		apiKey,
		headers: { "X-Title": BRAND_NAME },
	});
	return openrouter(ASSISTANT_MODEL);
}

let client: OpenAI | null | undefined;

/** The OpenRouter client, or null when no API key is configured (vision checks are skipped). */
export function getOpenRouter() {
	const apiKey = process.env.OPENROUTER_API_KEY;
	client ??= apiKey
		? new OpenAI({
				apiKey,
				baseURL: "https://openrouter.ai/api/v1",
				defaultHeaders: { "X-Title": BRAND_NAME },
			})
		: null;
	return client;
}

export const isVisionEnabled = () => getOpenRouter() !== null;

/** A JPEG as an image part of a chat message. */
export function jpegPart(
	image: Buffer,
): OpenAI.Chat.ChatCompletionContentPartImage {
	return {
		type: "image_url",
		image_url: { url: `data:image/jpeg;base64,${image.toString("base64")}` },
	};
}

/**
 * Sends one message to the vision model and returns its JSON reply checked
 * against `schema`. Null when no key is set, the model refuses, or the reply
 * doesn't match; network and API errors are thrown to the caller.
 */
export async function askVision<T extends z.ZodType>(
	name: string,
	schema: T,
	content: OpenAI.Chat.ChatCompletionContentPart[],
): Promise<z.infer<T> | null> {
	const openrouter = getOpenRouter();
	if (!openrouter) return null;

	const { $schema: _, ...jsonSchema } = z.toJSONSchema(schema);
	const response = await openrouter.chat.completions.create({
		model: VISION_MODEL,
		max_tokens: 1024,
		messages: [{ role: "user", content }],
		response_format: {
			type: "json_schema",
			json_schema: { name, strict: true, schema: jsonSchema },
		},
	});
	const message = response.choices[0]?.message;
	if (!message?.content || message.refusal) return null;

	const parsed = schema.safeParse(JSON.parse(message.content));
	return parsed.success ? parsed.data : null;
}
