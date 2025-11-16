# Artifex · AI Repair Assistant

**🔗 Live Demo:** [https://artifexrepairs.vercel.app/](https://artifexrepairs.vercel.app/)

Transform field damage photos into professional, step-by-step repair guides powered by Google Gemini AI. Artifex combines secure authentication, intelligent image analysis, and contextual visual references to deliver premium repair documentation in seconds.

---

## ✨ Features

### 🔐 Secure Authentication
Auth0-powered login gate ensures only authorized technicians access the AI repair assistant. Session management with one-click logout keeps your workflow secure.

### 📸 Smart Damage Analysis
Upload photos up to 4MB with instant visual preview. AI analyzes device type, damage patterns, and repair complexity to generate tailored guidance.

### 🤖 Gemini AI Integration
- **Gemini 2.5 Pro** analyzes damage and generates structured repair plans
- **Contextual Image Generation** via Pexels API delivers device-specific repair photos (laptops, phones, electronics)
- Intelligent step sequencing with safety warnings and tool recommendations

### 🎨 Premium Crafted Interface
- **3D Depth Cards** with layered shadows and hover effects
- **Custom Animated Cursors** – Mirrored wrench default, rotating gear during AI generation
- **14 Floating Elements** – Geometric shapes and tool icons with GSAP animations
- **Bold Visual Design** – Strong shadows, visible grid patterns, premium button interactions
- **Auto-Scroll Navigation** – Smooth transitions to results after generation

### 📋 Detailed Repair Guides
Each guide includes:
- ⚠️ Safety warnings and caution callouts
- 🛠️ Required tools and materials lists
- 📸 High-quality contextual repair images
- 📝 Step-by-step instructions with difficulty ratings
- ⏱️ Estimated time and skill level indicators

### 🎯 Real-Time Progress Tracking
Live status updates with animated indicators:
- "Planning repair strategy..."
- "Analyzing damage patterns..."
- "Generating visual references..."
- "Finalizing repair guide..."

### 🔄 Session Management
- **Reset Button** – Start new repairs instantly
- **Technician Chip** – Quick profile access and logout
- **Persistent Auth** – Seamless session handling across page refreshes

### ⚡ Performance Optimized
- Vercel Speed Insights integration for real-time Core Web Vitals
- Image optimization and CDN delivery
- Serverless API routes for scalable AI processing

---

## 🎯 Use Cases

- **Field Technicians** – Generate repair plans on-site with photo uploads
- **Repair Shops** – Standardize documentation across team members
- **Training Programs** – Create consistent learning materials for new technicians
- **Quality Assurance** – Ensure thorough repair procedures with safety compliance

---

## 🚀 Tech Stack

- **Framework:** Next.js 16 with App Router & Turbopack
- **Styling:** Tailwind CSS v4 with custom inline theme
- **Authentication:** Auth0 SPA SDK
- **AI Services:** Google Generative AI (Gemini 2.5 Pro)
- **Image API:** Pexels (contextual repair photography)
- **Animations:** GSAP 3.x + ScrollTrigger
- **Icons:** lucide-react
- **Deployment:** Vercel with automatic CI/CD

---

## 🌐 Live Application

**Experience Artifex in production:** [https://artifexrepairs.vercel.app/](https://artifexrepairs.vercel.app/)

Try it with any device repair scenario – the AI adapts to laptops, smartphones, tablets, and general electronics.
