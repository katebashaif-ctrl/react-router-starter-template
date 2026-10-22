import type { LoaderFunctionArgs } from "react-router";
import { Link } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const pathname = url.pathname.toLowerCase();

	// If a static asset or image is missing, return a clean 404 response instead of throwing route error
	if (
		pathname.endsWith(".jpg") ||
		pathname.endsWith(".jpeg") ||
		pathname.endsWith(".png") ||
		pathname.endsWith(".webp") ||
		pathname.endsWith(".svg") ||
		pathname.endsWith(".ico") ||
		pathname.endsWith(".gif")
	) {
		return new Response("Asset not found", {
			status: 404,
			headers: {
				"Content-Type": "text/plain",
				"Cache-Control": "no-cache",
			},
		});
	}

	return new Response(null, {
		status: 404,
		statusText: "Not Found",
	});
}

export default function CatchAll() {
	return (
		<div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6 text-right" dir="rtl">
			<div className="max-w-md w-full bg-white p-8 rounded-2xl border border-[#D6BE9F] shadow-xl text-center space-y-4">
				<div className="w-16 h-16 rounded-2xl bg-[#F5EFE6] text-amber-900 border border-[#D6BE9F] flex items-center justify-center mx-auto text-2xl font-bold font-serif">
					٤٠٤
				</div>
				<h2 className="font-serif text-2xl font-bold text-[#2C2014]">
					الصفحة غير موجودة
				</h2>
				<p className="text-xs text-stone-500 leading-relaxed">
					عذراً، لم نتمكن من العثور على الصفحة أو المورد الذي تبحث عنه.
				</p>
				<div className="pt-2">
					<Link
						to="/"
						className="inline-block px-6 py-2.5 bg-[#2C2014] text-amber-200 font-bold rounded-xl text-xs hover:bg-black transition-colors"
					>
						العودة إلى متجر خيرات الدار
					</Link>
				</div>
			</div>
		</div>
	);
}
