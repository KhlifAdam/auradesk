import { describe, expect, it } from "vitest";
import { cleanTranscript } from "@/lib/ai/assistant/transcript";

describe("cleanTranscript", () => {
	it("leaves a normal sentence alone", () => {
		expect(cleanTranscript("Envoie la facture à Karim.")).toBe(
			"Envoie la facture à Karim.",
		);
	});

	it("drops described noises", () => {
		expect(cleanTranscript("Send it. *thud*")).toBe("Send it.");
		expect(cleanTranscript("[Music] Bonjour [Applause]")).toBe("Bonjour");
	});

	it("drops trailing dots from a quiet ending", () => {
		expect(cleanTranscript("Confirme la demande.  ...")).toBe("Confirme la demande.");
		expect(cleanTranscript("Confirme la demande ...")).toBe("Confirme la demande");
		expect(cleanTranscript("Done.  .")).toBe("Done.");
	});

	it("keeps dots and stars that are part of what was said", () => {
		expect(cleanTranscript("Il a dit... non")).toBe("Il a dit... non");
		expect(cleanTranscript("2 * 3 et 4 * 5")).toBe("2 * 3 et 4 * 5");
	});

	it("tidies spacing before punctuation", () => {
		expect(cleanTranscript("Est-ce que c'est ok ?  Oui .")).toBe("Est-ce que c'est ok? Oui.");
	});
});
