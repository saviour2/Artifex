## Artifex · AI Repair Assistant

This Next.js build delivers a premium, bold repair guide generator: Auth0-gated authentication, a text + photo intake form, and a two-step Gemini pipeline that returns a structured repair tutorial. When the Gemini key is missing, the UI falls back to a deterministic sample guide so teammates can still explore the UX.

## Features

- **Auth0 Login Gate** – SPA-style flow using `@auth0/auth0-react`. Missing environment variables render a helpful configuration screen so new contributors know how to configure `.env.local`.
- **Describe & Upload** – Rich textarea, file picker with visual upload area, inline preview, and guardrails for the 4 MB limit.
- **Live Status** – Progress text updates (`Planning repair…`, `Generating imagery…`) fed from the service layer to the UI with animated status indicators.
- **Guide Rendering** – Bold 3D cards with caution callouts, tool lists, and inline base64 images (Imagen output when keys exist, canvas placeholders otherwise).
- **Reset + Session Controls** – Clear button to start a new run plus a technician chip with one-click sign out.
- **Premium Interface** – Bold, confident design with 3D depth, floating geometric shapes, strong shadows, and GSAP-powered entrance animations.

## Configuration

Create `.env.local` and provide:

```
NEXT_PUBLIC_AUTH0_DOMAIN=dev-yourtenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=abc123yourclientid
NEXT_PUBLIC_GEMINI_API_KEY=sk-your-gemini-key
```

- Without Auth0 vars the app shows a configuration screen.
- Without the Gemini key, `generateRepairGuide` returns the curated fallback guide so demos still work.

## Scripts

| Command         | Purpose                                                   |
| --------------- | --------------------------------------------------------- |
| `npm run dev`   | Launch the Next.js dev server on <http://localhost:3000>. |
| `npm run build` | Create a production bundle (required before deployment).  |
| `npm run start` | Serve the production build locally.                       |
| `npm run lint`  | Run ESLint with the Next.js config.                       |

## Key Files

- `src/app/page.tsx` – Auth0 gating + Artifex UI shell with premium components.
- `src/app/providers.tsx` – wraps the app in `Auth0Provider` when env vars exist.
- `src/app/globals.css` – comprehensive Premium Crafted Interface styling with 3D cards, premium buttons, grid backgrounds, and animations.
- `src/lib/types.ts` – shared TypeScript contracts for guides/steps.
- `src/services/geminiService.ts` – client-side Gemini plan + Imagen render workflow with fallback generation.

## Workflow Overview

1. User signs in with Auth0 (or sees guidance to configure it).
2. They describe the damage, attach a ≤4 MB image, and click **Generate guide**.
3. `generateRepairGuide` encodes the photo, calls Gemini 2.5 Pro for a JSON plan, then calls Imagen 4 for per-step imagery (or generates placeholders).
4. The UI streams progress updates with animated status indicators and finally renders the `RepairGuide` object in bold 3D cards.

## Notes

- API calls happen browser-side just like the original prototype. Move them behind a proxy before production to keep keys private.
- All UI is intentionally single-page so Auth0 + AI experimentation stays straightforward.
- Design features bold, confident aesthetics with NO subtle effects – strong shadows, visible grid patterns, prominent animations, and premium button interactions.
