import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const query = searchParams.get("q") || "repair,tools,electronics";
	const index = parseInt(searchParams.get("index") || "0", 10);

	console.log(`[Image API] Step ${index}: ${query}`);

	try {
		// Clean and build search query from keywords
		const keywords = query
			.split(",")
			.map((k) =>
				k
					.trim()
					.toLowerCase()
					.replace(/[^a-z0-9\s]/g, "")
			)
			.filter((k) => k.length > 0)
			.slice(0, 3)
			.join(" ");

		// Detect if this is laptop/computer related and adjust search
		const isLaptopRepair = keywords.match(
			/macbook|laptop|computer|screen|display|keyboard|trackpad|battery|logic|board/i
		);
		
		// Detect if this is phone/mobile related
		const isPhoneRepair = keywords.match(
			/phone|iphone|android|mobile|smartphone|cell/i
		);

		let searchQuery;
		if (isPhoneRepair) {
			searchQuery = `${keywords} smartphone mobile phone repair technician`;
		} else if (isLaptopRepair) {
			searchQuery = `${keywords} laptop computer repair technician`;
		} else {
			searchQuery = `${keywords} repair technology electronics tools`;
		}

		console.log(`[Pexels] Searching: "${searchQuery}"`);

		// Use Pexels API for high-quality, contextually relevant images
		const pexelsUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
			searchQuery
		)}&per_page=5&orientation=landscape`;

		const pexelsResponse = await fetch(pexelsUrl, {
			headers: {
				Authorization: process.env.PEXELS_API_KEY || "",
			},
			signal: AbortSignal.timeout(8000),
		});

		if (pexelsResponse.ok) {
			const data = await pexelsResponse.json();

			if (data.photos && data.photos.length > 0) {
				// Use different photo from results based on step index
				const photo = data.photos[index % data.photos.length];
				const imageUrl = photo.src.large; // 800x600 high quality

				console.log(
					`[Pexels] Found ${data.photos.length} photos, using photo by ${photo.photographer}`
				);
				console.log(`[Pexels] Fetching: ${imageUrl}`);

				// Fetch the actual image
				const imageResponse = await fetch(imageUrl, {
					signal: AbortSignal.timeout(8000),
				});

				if (imageResponse.ok) {
					const blob = await imageResponse.blob();
					const buffer = await blob.arrayBuffer();

					console.log(`[Pexels] ✓ Success: ${(blob.size / 1024).toFixed(1)}KB`);

					return new NextResponse(buffer, {
						status: 200,
						headers: {
							"Content-Type": blob.type || "image/jpeg",
							"Cache-Control": "public, max-age=86400",
						},
					});
				}
			} else {
				console.warn(`[Pexels] No photos found for "${searchQuery}"`);
			}
		} else {
			console.error(`[Pexels] API error: ${pexelsResponse.status}`);
		}

		// Fallback to placeholder with query text
		console.warn(`[Image API] Using placeholder for step ${index}`);
		throw new Error("Pexels API failed");
	} catch (error) {
		console.error(`[Image API] Error:`, error);

		// Clean placeholder with gradient
		const colors = ["#2B4C7E", "#E8642C", "#4A5568", "#D4552A", "#6B6B6B"];
		const color = colors[index % colors.length];

		const svg = `<svg width="800" height="480" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<linearGradient id="g${index}" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" style="stop-color:${color};stop-opacity:1" />
					<stop offset="100%" style="stop-color:${color}dd;stop-opacity:1" />
				</linearGradient>
			</defs>
			<rect width="800" height="480" fill="url(#g${index})"/>
		</svg>`;

		return new NextResponse(svg, {
			status: 200,
			headers: {
				"Content-Type": "image/svg+xml",
				"Cache-Control": "public, max-age=3600",
			},
		});
	}
}
