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
import {
	Wrench,
	Upload,
	CheckCircle,
	AlertCircle,
	ArrowRight,
	Hammer,
	Settings,
	Zap,
	Cog,
	Scissors,
} from "lucide-react";

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
					className="btn-secondary"
				>
					Clear session
				</button>
			</CenteredCard>
		);
	}

	if (!isAuthenticated) {
		return (
			<CenteredCard
				title="Sign in to Artifex"
				body="Auth0 protects the playground. Log in to generate a repair guide."
			>
				<button
					onClick={() => loginWithRedirect()}
					className="btn-premium w-full"
				>
					<ArrowRight size={20} />
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
	const resultsRef = useRef<HTMLElement>(null);
	const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

	const canSubmit =
		description.trim().length > 10 && Boolean(photo) && !isGenerating;
	const geminiReady = hasGeminiCredentials();

	const guidance = useMemo(() => {
		if (!geminiReady) {
			return "Gemini key missing. Falling back to local sample guide.";
		}
		return status;
	}, [status, geminiReady]);

	// Toggle loading cursor class
	useEffect(() => {
		if (isGenerating) {
			document.body.classList.add("loading");
		} else {
			document.body.classList.remove("loading");
		}
		return () => document.body.classList.remove("loading");
	}, [isGenerating]);

	// Track mouse position for custom cursor
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			setCursorPos({ x: e.clientX, y: e.clientY });
		};
		window.addEventListener("mousemove", handleMouseMove);
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, []);

	// Auto-scroll to results when guide is generated
	useEffect(() => {
		if (guide && resultsRef.current) {
			setTimeout(() => {
				resultsRef.current?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			}, 300);
		}
	}, [guide]);

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
			{/* Custom cursor */}
			{isGenerating && (
				<div
					className={`custom-cursor ${isGenerating ? "loading" : ""}`}
					style={{
						left: `${cursorPos.x}px`,
						top: `${cursorPos.y}px`,
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#2B4C7E"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						style={{
							transform: "translate(-50%, -50%)",
							position: "absolute",
							left: "0",
							top: "0",
						}}
					>
						<circle cx="12" cy="12" r="3" />
						<path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
					</svg>
				</div>
			)}

			{/* Floating decorative shapes */}
			<div
				className="floating-shape circle orange animate-float"
				style={{
					width: "120px",
					height: "120px",
					top: "10%",
					left: "5%",
				}}
			/>
			<div
				className="floating-shape square navy animate-float-delayed"
				style={{
					width: "80px",
					height: "80px",
					top: "60%",
					right: "8%",
				}}
			/>
			<div
				className="floating-shape circle navy animate-float"
				style={{
					width: "60px",
					height: "60px",
					bottom: "15%",
					left: "10%",
				}}
			/>
			<div
				className="floating-shape square orange animate-fade-drift"
				style={{
					width: "50px",
					height: "50px",
					top: "30%",
					right: "15%",
				}}
			/>
			<div
				className="floating-shape circle orange animate-pulse-fade"
				style={{
					width: "90px",
					height: "90px",
					top: "75%",
					left: "40%",
				}}
			/>
			<div
				className="floating-shape square navy animate-float-spin"
				style={{
					width: "70px",
					height: "70px",
					top: "45%",
					left: "25%",
				}}
			/>
			<div
				className="floating-shape circle navy animate-fade-drift-delayed"
				style={{
					width: "100px",
					height: "100px",
					bottom: "35%",
					right: "20%",
				}}
			/>
			<div
				className="floating-shape square orange animate-pulse-fade"
				style={{
					width: "55px",
					height: "55px",
					bottom: "50%",
					left: "70%",
				}}
			/>

			<header style={{ marginBottom: "3rem" }}>
				<div className="logo-wrapper">
					<Wrench size={32} color="#E8642C" />
					<span className="logo-text">ARTIFEX</span>
				</div>
				<div className="two-col-grid" style={{ marginTop: "2rem" }}>
					<div>
						<h1>Turn field damage into a visual repair plan.</h1>
						<p
							style={{
								color: "#6B6B6B",
								fontSize: "1.125rem",
								lineHeight: "1.8",
								marginTop: "1rem",
							}}
						>
							Describe the issue, add a reference photo, and let Gemini + Imagen
							generate stage-by-stage instructions.
						</p>
					</div>
					<div
						style={{
							display: "flex",
							justifyContent: "flex-end",
							alignItems: "flex-start",
						}}
					>
						<div className="user-chip">
							<div>
								<p className="user-chip-label">Technician</p>
								<p className="user-chip-value">{technician}</p>
							</div>
							<button
								onClick={onLogout}
								className="btn-secondary"
								style={{ padding: "0.75rem 1.5rem" }}
							>
								Sign out
							</button>
						</div>
					</div>
				</div>
			</header>

			<section className="two-col-grid">
				<div className="card-3d reveal">
					<h2>Describe the repair</h2>
					<textarea
						value={description}
						onChange={(event) => setDescription(event.target.value)}
						placeholder="Ex: Aluminum frame got dented near hinge after a fall…"
						rows={6}
						style={{ marginBottom: "1.5rem" }}
					/>

					<label
						className="label-text"
						style={{ display: "block", marginBottom: "0.75rem" }}
					>
						Attach a reference photo
					</label>
					<div
						className={`upload-area ${photo ? "has-file" : ""}`}
						onClick={() => document.getElementById("file-input")?.click()}
					>
						<Upload
							size={32}
							color="#4A5568"
							style={{ margin: "0 auto 0.75rem" }}
						/>
						<p style={{ color: "#6B6B6B", fontSize: "0.875rem" }}>
							{photo ? photo.name : "Click to upload image (max 4MB)"}
						</p>
						<input
							id="file-input"
							type="file"
							accept="image/*"
							onChange={handleFileChange}
							style={{ display: "none" }}
						/>
					</div>
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

				<div className="card-3d reveal status-card">
					<div className="status-header">
						<span className="eyebrow">Status</span>
						<span className={`status-dot ${isGenerating ? "pulse" : ""}`} />
					</div>
					<p className="status-text">{guidance}</p>
					<p className="status-subtext">
						{geminiReady
							? "Gemini 2.5 Pro handles the JSON plan and Imagen drafts step imagery."
							: "Provide NEXT_PUBLIC_GEMINI_API_KEY to enable live calls."}
					</p>
					<div className="button-group">
						<button
							onClick={handleGenerate}
							disabled={!canSubmit}
							className="btn-premium"
						>
							{isGenerating ? (
								<>Processing...</>
							) : (
								<>
									<CheckCircle size={20} />
									Generate guide
								</>
							)}
						</button>
						<button
							onClick={resetGuide}
							className="btn-secondary"
							disabled={isGenerating}
						>
							Reset
						</button>
					</div>
					{error && (
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.5rem",
								marginTop: "1rem",
							}}
						>
							<AlertCircle size={18} color="#E8642C" />
							<p className="error-text">{error}</p>
						</div>
					)}
				</div>
			</section>

			{guide && <GuideResults guide={guide} resultsRef={resultsRef} />}
		</div>
	);
}

function GuideResults({
	guide,
	resultsRef,
}: {
	guide: RepairGuide;
	resultsRef: React.RefObject<HTMLElement | null>;
}) {
	return (
		<section className="results-section" ref={resultsRef}>
			<header className="results-header">
				<span className="eyebrow">Generated guide</span>
				<h2>{guide.title}</h2>
				{guide.safety && (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "0.75rem",
							marginTop: "1rem",
						}}
					>
						<AlertCircle size={24} color="#E8642C" />
						<p style={{ color: "#E8642C", fontWeight: 600 }}>{guide.safety}</p>
					</div>
				)}
			</header>
			<div className="steps-grid">
				{guide.steps.map((step, index) => (
					<article key={step.title + index} className="step-card reveal">
						<p className="step-number">Step {index + 1}</p>
						<h3 className="step-title">{step.title}</h3>
						<p className="step-description">{step.description}</p>
						{step.tools && step.tools.length > 0 && (
							<p className="step-tools">
								<Wrench
									size={16}
									style={{ display: "inline", marginRight: "0.5rem" }}
								/>
								Tools: {step.tools.join(", ")}
							</p>
						)}
						{step.caution && (
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
									marginTop: "0.75rem",
								}}
							>
								<AlertCircle size={16} color="#E8642C" />
								<p className="step-caution">{step.caution}</p>
							</div>
						)}
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
			<div className="card-3d w-full max-w-md text-center">
				<span className="eyebrow mb-2">ARTIFEX</span>
				<h1>{title}</h1>
				<p style={{ color: "#6B6B6B", marginTop: "1rem", lineHeight: "1.6" }}>
					{body}
				</p>
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
			<pre
				style={{
					background: "rgba(245, 241, 232, 0.6)",
					padding: "1rem",
					border: "2px solid #4A5568",
					textAlign: "left",
					fontSize: "0.75rem",
					lineHeight: "1.5",
					marginTop: "1rem",
				}}
			>
				NEXT_PUBLIC_AUTH0_DOMAIN=dev-xxxxx.auth0.com{"\n"}
				NEXT_PUBLIC_AUTH0_CLIENT_ID=YOUR_CLIENT_ID{"\n"}
				NEXT_PUBLIC_GEMINI_API_KEY=YOUR_KEY
			</pre>
		</CenteredCard>
	);
}
