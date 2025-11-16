"use client";

import { GenerateGuideParams, RepairGuide, TutorialStep } from "@/lib/types";

const GENERATE_PLAN_MODEL = "gemini-2.0-flash-exp";
const GENERATE_IMAGE_MODEL = "imagen-3.0-generate-001";
const GOOGLE_API_BASE =
	"https://generativelanguage.googleapis.com/v1beta/models";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const hasLiveApi = Boolean(apiKey);

interface GeminiPlanResponse {
	title: string;
	safety?: string;
	steps: Array<{
		title: string;
		description: string;
		tools?: string[];
		caution?: string;
	}>;
}

const FALLBACK_GUIDE: RepairGuide = {
	title: "Stabilize and Patch Damaged Panel",
	safety:
		"Disconnect power, wear cut-proof gloves, and secure the chassis on a flat surface before continuing.",
	steps: [
		{
			title: "Document the damage",
			description:
				"Capture reference photos and note any cracks or missing hardware so you can match replacements during reassembly.",
			tools: ["Camera", "Painter's tape"],
			caution:
				"Do not touch exposed wiring until you're certain the unit is de-energized.",
		},
		{
			title: "Clean and prep the surface",
			description:
				"Brush away debris and degrease the panel so structural adhesive bonds correctly.",
			tools: ["Nylon brush", "Isopropyl alcohol"],
		},
		{
			title: "Patch + clamp",
			description:
				"Butter epoxy putty across the fracture, press the backing plate into place, and clamp until cured.",
			tools: ["Epoxy putty", "Clamp", "Backing plate"],
		},
		{
			title: "Rebuild finish",
			description:
				"Feather-sand the repair, spot-prime, then apply thin coats of matching paint.",
			tools: ["1200 grit paper", "Primer pen", "Color-matched paint"],
		},
	],
};

export async function generateRepairGuide({
	description,
	imageFile,
	onStatus,
}: GenerateGuideParams): Promise<RepairGuide> {
	if (!description.trim()) {
		throw new Error("Describe the damage before generating a guide.");
	}

	const photoUrl = imageFile ? await fileToDataUrl(imageFile) : undefined;

	if (!hasLiveApi) {
		return buildGuideFromFallback(photoUrl);
	}

	const plan = await requestPlan(description, photoUrl, onStatus);
	const steps = await Promise.all(
		plan.steps.map(async (step) => {
			let image = photoUrl;
			if (photoUrl) {
				try {
					image = await requestStepImage(
						step.title,
						step.description,
						photoUrl,
						onStatus
					);
				} catch (error) {
					console.warn(
						"Imagen request failed, falling back to uploaded photo",
						error
					);
				}
			}

			return {
				...step,
				image,
			};
		})
	);

	return {
		title: plan.title,
		safety: plan.safety,
		steps,
	};
}

async function requestPlan(
	description: string,
	photoUrl?: string,
	onStatus?: (message: string) => void
): Promise<GeminiPlanResponse> {
	onStatus?.("Planning repair strategy with Gemini");

	const inlineImage = photoUrl ? dataUrlToInlinePart(photoUrl) : undefined;

	const payload = {
		contents: [
			{
				role: "user",
				parts: [
					inlineImage,
					{
						text: `You are a meticulous repair technician. Analyze the user's damage report and optional photo. Respond with strict JSON matching this TypeScript type: {"title": string; "safety"?: string; "steps": {"title": string; "description": string; "caution"?: string; "tools"?: string[]}[]}. Steps should be concise instructions tailored to household repairs. When unsure, make safe assumptions and mention them in the description. User report: ${description}`,
					},
				].filter(Boolean),
			},
		],
	};

	const res = await fetch(
		`${GOOGLE_API_BASE}/${GENERATE_PLAN_MODEL}:generateContent?key=${apiKey}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		}
	);

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Gemini request failed (${res.status}): ${text}`);
	}

	const data = await res.json();
	const parts = data?.candidates?.[0]?.content?.parts ?? [];
	const textBlock: string | undefined = parts
		.map((part: { text?: string }) => part.text)
		.find((value: string | undefined) => Boolean(value));

	if (!textBlock) {
		throw new Error("Gemini response did not include plan text.");
	}

	// Strip markdown code blocks if present (e.g., ```json ... ```)
	let cleanedText = textBlock.trim();
	const codeBlockMatch = cleanedText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
	if (codeBlockMatch) {
		cleanedText = codeBlockMatch[1].trim();
	}

	try {
		return JSON.parse(cleanedText) as GeminiPlanResponse;
	} catch (error) {
		console.warn("Unable to parse JSON plan", error, cleanedText);
		throw new Error(
			"Gemini returned an unexpected format. Check the response in the console."
		);
	}
}

async function requestStepImage(
	stepTitle: string,
	stepDescription: string,
	photoUrl: string,
	onStatus?: (message: string) => void
): Promise<string> {
	onStatus?.(`Generating imagery for “${stepTitle}”`);
	const inline = dataUrlToInlinePart(photoUrl);

	const payload = {
		contents: [
			{
				role: "user",
				parts: [
					inline,
					{
						text: `Generate an instructional product photo showing the result of this step. Keep the tool layout realistic. Step title: ${stepTitle}. Step details: ${stepDescription}.`,
					},
				],
			},
		],
	};

	const res = await fetch(
		`${GOOGLE_API_BASE}/${GENERATE_IMAGE_MODEL}:generateContent?key=${apiKey}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		}
	);

	if (!res.ok) {
		throw new Error(`Imagen request failed (${res.status})`);
	}

	const data = await res.json();
	const inlineData = data?.candidates?.[0]?.content?.parts?.find(
		(part: { inlineData?: { data?: string; mimeType?: string } }) =>
			part.inlineData
	)?.inlineData;

	if (!inlineData?.data) {
		throw new Error("Imagen response missing inline data");
	}

	const mime = inlineData.mimeType ?? "image/png";
	return `data:${mime};base64,${inlineData.data}`;
}

function dataUrlToInlinePart(dataUrl: string): {
	inlineData: { mimeType: string; data: string };
} {
	const [meta, data] = dataUrl.split(",");
	const mimeMatch = meta?.match(/data:(.*);base64/);
	const mimeType = mimeMatch?.[1] ?? "image/png";
	return {
		inlineData: {
			mimeType,
			data,
		},
	};
}

async function fileToDataUrl(file: File): Promise<string> {
	await validateFile(file);
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(new Error("Unable to read file"));
		reader.readAsDataURL(file);
	});
}

async function validateFile(file: File): Promise<void> {
	const maxBytes = 4 * 1024 * 1024; // 4 MB
	if (file.size > maxBytes) {
		throw new Error("Image must be 4 MB or smaller");
	}
}

function buildGuideFromFallback(photoUrl?: string): RepairGuide {
	const image = photoUrl ?? buildPlaceholderImage();
	const steps: TutorialStep[] = FALLBACK_GUIDE.steps.map((step, index) => ({
		...step,
		image: index % 2 === 0 ? image : buildPlaceholderImage(index),
	}));

	return {
		title: FALLBACK_GUIDE.title,
		safety: FALLBACK_GUIDE.safety,
		steps,
	};
}

function buildPlaceholderImage(seed = 0): string {
	const hue = (seed * 57) % 360;
	const canvas = document.createElement("canvas");
	canvas.width = 800;
	canvas.height = 480;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		return "";
	}

	const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
	gradient.addColorStop(0, `hsla(${hue}, 70%, 18%, 1)`);
	gradient.addColorStop(1, `hsla(${(hue + 40) % 360}, 85%, 32%, 1)`);
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "rgba(255,255,255,0.15)";
	ctx.font = "bold 48px 'Space Grotesk', sans-serif";
	ctx.fillText("RepairAll", 36, 96);
	ctx.font = "400 28px 'Space Grotesk', sans-serif";
	ctx.fillText("Image unavailable", 36, 146);

	return canvas.toDataURL("image/png");
}

export function hasGeminiCredentials(): boolean {
	return hasLiveApi;
}
