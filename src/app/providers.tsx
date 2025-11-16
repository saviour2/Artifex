"use client";

import { Auth0Provider } from "@auth0/auth0-react";
import { ReactNode, useMemo } from "react";

const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;

export default function Providers({ children }: { children: ReactNode }) {
	const redirectUri = useMemo(
		() => (typeof window !== "undefined" ? window.location.origin : undefined),
		[]
	);

	if (!domain || !clientId) {
		return <>{children}</>;
	}

	return (
		<Auth0Provider
			domain={domain}
			clientId={clientId}
			authorizationParams={{ redirect_uri: redirectUri }}
			cacheLocation="localstorage"
		>
			{children}
		</Auth0Provider>
	);
}
