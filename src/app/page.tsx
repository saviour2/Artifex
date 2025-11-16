"use client";

import Image from "next/image";
import {
	ChangeEvent,
	ReactNode,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
import {
	generateRepairGuide,
	hasGeminiCredentials,
} from "@/services/geminiService";
import type { RepairGuide } from "@/lib/types";

const hasAuth0Config = Boolean(
	process.env.NEXT_PUBLIC_AUTH0_DOMAIN &&
		process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID
);

export default function Home() {
	if (!hasAuth0Config) {
		return <MissingConfig />;
	}

	return <AuthShell />;
}

function AuthShell() {
	const { isAuthenticated, isLoading, error, loginWithRedirect, logout, user } =
		useAuth0();

	if (isLoading) {
		return <CenteredCard title="Checking your session" body="Hold tight…" />;
	}

	if (error) {
		return (
			<CenteredCard
				title="Auth error"
				body={error.message ?? "Auth0 rejected the current session."}
			>
				<button
					onClick={() =>
						logout({ logoutParams: { returnTo: window.location.origin } })
					}
					className="btn-secondary-craft"
				>
					Clear session
				</button>
			</CenteredCard>
		);
	}

	if (!isAuthenticated) {
		return (
			<CenteredCard
				title="Sign in to RepairAll"
				body="Auth0 protects the playground. Log in to generate a repair guide."
			>
				<button
					onClick={() => loginWithRedirect()}
					className="btn-craft w-full"
				>
					Continue with Auth0
				</button>
			</CenteredCard>
		);
	}

	return (
		<RepairWorkspace
			technician={user?.name ?? user?.email ?? "Technician"}
			onLogout={() =>
				logout({ logoutParams: { returnTo: window.location.origin } })
			}
		/>
	);
}

function RepairWorkspace({
	technician,
	onLogout,
}: {
	technician: string;
	onLogout: () => void;
}) {
	const [description, setDescription] = useState("");
	const [photo, setPhoto] = useState<File | null>(null);
	const [preview, setPreview] = useState<string | null>(null);
	const [status, setStatus] = useState("Idle");
	const [error, setError] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [guide, setGuide] = useState<RepairGuide | null>(null);

	const canSubmit =
		description.trim().length > 10 && Boolean(photo) && !isGenerating;
	const geminiReady = hasGeminiCredentials();

	const guidance = useMemo(() => {
		if (!geminiReady) {
			return "Gemini key missing. Falling back to local sample guide.";
		}
		return status;
	}, [status, geminiReady]);

	// GSAP animations on mount
	useEffect(() => {
		// Animate cards on page load
		gsap.fromTo(
			".reveal",
			{
				y: 60,
				opacity: 0,
				scale: 0.9,
			},
			{
				y: 0,
				opacity: 1,
				scale: 1,
				duration: 0.8,
				stagger: 0.15,
				ease: "power3.out",
			}
		);

		// Setup scroll-triggered animations for results
		gsap.utils.toArray(".reveal").forEach((elem) => {
			gsap.fromTo(
				elem as gsap.TweenTarget,
				{
					opacity: 0,
					y: 40,
				},
				{
					opacity: 1,
					y: 0,
					duration: 1,
					ease: "power3.out",
					scrollTrigger: {
						trigger: elem as gsap.DOMTarget,
						start: "top 85%",
						toggleActions: "play none none reverse",
					},
				}
			);
		});
	}, [guide]);

	async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
		setError(null);
		const file = event.target.files?.[0];
		if (!file) {
			setPhoto(null);
			setPreview(null);
			return;
		}

		if (file.size > 4 * 1024 * 1024) {
			setError("Image must be 4 MB or less.");
			return;
		}

		setPhoto(file);
		setPreview(URL.createObjectURL(file));
	}

	async function handleGenerate() {
		if (!canSubmit || !photo) {
			return;
		}

		setError(null);
		setGuide(null);
		setIsGenerating(true);
		setStatus("Preparing request");

		try {
			const result = await generateRepairGuide({
				description,
				imageFile: photo,
				onStatus: setStatus,
			});
			setGuide(result);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to generate guide");
		} finally {
			setIsGenerating(false);
		}
	}

	function resetGuide() {
		setDescription("");
		setPhoto(null);
		setPreview(null);
		setGuide(null);
		setError(null);
		setStatus("Idle");
	}

	return (
		<div className="page-shell">
			<header className="page-header">
				<div>
					<p className="eyebrow">RepairAll</p>
					<h1>Turn field damage into a visual repair plan.</h1>
					<p className="subtext">
						Describe the issue, add a reference photo, and let Gemini + Imagen
						stage-by-stage instructions.
					</p>
				</div>
				<div className="tech-chip">
					<div>
						<p className="chip-label">Technician</p>
						<p className="chip-value">{technician}</p>
					</div>
					<button onClick={onLogout} className="btn-secondary-craft text-sm">
						Sign out
					</button>
				</div>
			</header>

			<section className="card-grid">
				<div className="card card-layered reveal">
					<h2>Describe the repair</h2>
					<textarea
						value={description}
						onChange={(event) => setDescription(event.target.value)}
						placeholder="Ex: Alum frame got dented near hinge after a fall…"
						rows={6}
					/>

					<label className="upload">
						<span>Attach a reference photo</span>
						<input type="file" accept="image/*" onChange={handleFileChange} />
					</label>
					{preview && (
						<Image
							src={preview}
							alt="Uploaded preview"
							className="preview"
							width={640}
							height={360}
							unoptimized
						/>
					)}
				</div>

				<div className="card card-layered reveal status-card">
					<div className="status-line">
						<p className="eyebrow">Status</p>
						<span className={`status-dot ${isGenerating ? "pulse" : "idle"}`} />
					</div>
					<p className="status-text">{guidance}</p>
					<p className="status-subtext">
						{geminiReady
							? "Gemini 2.5 Pro handles the JSON plan and Imagen drafts step imagery."
							: "Provide NEXT_PUBLIC_GEMINI_API_KEY to enable live calls."}
					</p>
					<div className="cta-row">
						<button
							onClick={handleGenerate}
							disabled={!canSubmit}
							className="btn-craft flex-1"
						>
							Generate guide
						</button>
						<button
							onClick={resetGuide}
							className="btn-ghost-craft"
							disabled={isGenerating}
						>
							Reset
						</button>
					</div>
					{error && <p className="error-text">{error}</p>}
				</div>
			</section>

			{guide && <GuideResults guide={guide} />}
		</div>
	);
}

function GuideResults({ guide }: { guide: RepairGuide }) {
	return (
		<section className="results">
			<header>
				<p className="eyebrow">Generated guide</p>
				<h2>{guide.title}</h2>
				{guide.safety && <p className="safety">⚠️ {guide.safety}</p>}
			</header>
			<div className="steps">
				{guide.steps.map((step, index) => (
					<article
						key={step.title + index}
						className="step-card card-layered reveal"
					>
						<div>
							<p className="eyebrow">Step {index + 1}</p>
							<h3>{step.title}</h3>
							<p>{step.description}</p>
							{step.tools && step.tools.length > 0 && (
								<p className="tools">Tools: {step.tools.join(", ")}</p>
							)}
							{step.caution && <p className="caution">⚠️ {step.caution}</p>}
						</div>
						{step.image && (
							<Image
								src={step.image}
								alt={step.title}
								className="step-image"
								width={640}
								height={360}
								unoptimized
							/>
						)}
					</article>
				))}
			</div>
		</section>
	);
}

function CenteredCard({
	title,
	body,
	children,
}: {
	title: string;
	body: string;
	children?: ReactNode;
}) {
	return (
		<div className="page-shell center">
			<div className="card card-layered w-full max-w-md text-center">
				<p className="eyebrow mb-2">RepairAll</p>
				<h1>{title}</h1>
				<p className="subtext">{body}</p>
				{children && <div className="mt-6 flex justify-center">{children}</div>}
			</div>
		</div>
	);
}

function MissingConfig() {
	return (
		<CenteredCard
			title="Configure Auth0"
			body="Set NEXT_PUBLIC_AUTH0_DOMAIN and NEXT_PUBLIC_AUTH0_CLIENT_ID in .env.local to unlock the app."
		>
			<pre className="env-hint">
				NEXT_PUBLIC_AUTH0_DOMAIN=dev-xxxxx.auth0.com
				NEXT_PUBLIC_AUTH0_CLIENT_ID=YOUR_CLIENT_ID
				NEXT_PUBLIC_GEMINI_API_KEY=YOUR_KEY
			</pre>
		</CenteredCard>
	);
}
