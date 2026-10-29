import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./frontend/css/main.css";
import { t } from "./frontend/locales/i18n";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cairo:wght@400;600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap",
	},
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="ar" dir="rtl">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>{t("brand.metaTitle")}</title>
				<meta
					name="description"
					content={t("brand.metaDescription")}
				/>
				<meta property="og:title" content={t("brand.metaTitle")} />
				<meta
					property="og:description"
					content={t("brand.metaDescription")}
				/>
				<link rel="icon" type="image/x-icon" href="/favicon.ico" />
				<Meta />
				<Links />
			</head>
			<body className="min-h-screen bg-[#FCFBF8] text-stone-900 selection:bg-amber-100 selection:text-amber-900">
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = t("errors.general");
	let details = t("errors.general");
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? t("errors.notFoundTitle") : t("errors.general");
		details =
			error.status === 404
				? t("errors.notFoundDesc")
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-16 p-6 container mx-auto max-w-2xl text-center">
			<h1 className="text-3xl font-bold text-amber-950 mb-3">{message}</h1>
			<p className="text-stone-600 mb-6">{details}</p>
			{stack && (
				<pre className="p-4 bg-stone-100 text-stone-700 text-xs text-left overflow-x-auto rounded-lg">
					<code>{stack}</code>
				</pre>
			)}
			<a
				href="/"
				className="inline-block px-5 py-2.5 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors"
			>
				{t("errors.backHome")}
			</a>
		</main>
	);
}
