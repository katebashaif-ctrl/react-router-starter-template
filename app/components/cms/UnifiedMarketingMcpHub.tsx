import { cmsT, cmsFormat } from "../../frontend/locales/cmsI18n";
import React, { useState } from "react";
import { useStore } from "../../context/StoreContext";
import { McpConfigSettings } from "./McpConfigSettings";
import { MetaCampaignsManager } from "./MetaCampaignsManager";
import {
	Megaphone,
	Server,
	Layers,
	Share2,
	Play,
	CheckCircle2,
	AlertCircle,
	ExternalLink,
	Copy,
	Check,
	RefreshCw,
	Sparkles,
	Terminal,
	Code2,
	ShoppingBag,
	Zap,
	ShieldCheck,
	SlidersHorizontal,
	Radio,
} from "lucide-react";

export const UnifiedMarketingMcpHub: React.FC = () => {
	const {
		mcpConfig,
		metaCampaigns,
		products,
		showToast,
		settings,
	} = useStore();

	const [activeSubTab, setActiveSubTab] = useState<"config" | "campaigns" | "catalog" | "runner">("config");
	const [copiedText, setCopiedText] = useState<string | null>(null);

	// Direct MCP Tool Runner State
	const [selectedTool, setSelectedTool] = useState<string>("tools/list");
	const [customToolArgs, setCustomToolArgs] = useState<string>("{}");
	const [isExecutingTool, setIsExecutingTool] = useState(false);
	const [toolExecutionResult, setToolExecutionResult] = useState<any | null>(null);

	const activeServer = mcpConfig?.mcpServers?.["meta-mcp"] || {
		transport: "http",
		url: "https://mcp.teenliwa.com/mcp",
		headers: {
			Authorization: "Bearer ...",
		},
	};

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		setCopiedText(label);
		showToast(cmsT("cms_108"), cmsFormat("cms_467", [label]));
		setTimeout(() => setCopiedText(null), 2500);
	};

	// Execute Live MCP Tool via custom endpoint
	const handleExecuteTool = async () => {
		setIsExecutingTool(true);
		setToolExecutionResult(null);

		try {
			let parsedArgs = {};
			try {
				parsedArgs = JSON.parse(customToolArgs);
			} catch (err) {
				showToast(cmsT("cms_468"), cmsT("cms_469"), "warning");
				setIsExecutingTool(false);
				return;
			}

			const payload = {
				action: "test_custom_mcp",
				url: activeServer.url || "https://mcp.teenliwa.com/mcp",
				headers: activeServer.headers || {},
				method: selectedTool,
				params: parsedArgs,
			};

			const res = await fetch("/api/meta/mcp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const data = (await res.json()) as any;
			setToolExecutionResult({
				timestamp: new Date().toLocaleTimeString("ar-AE"),
				...(data && typeof data === "object" ? data : {}),
			});

			if (data.success) {
				showToast(cmsT("cms_470"), cmsFormat("cms_471", [data.latencyMs || 0]));
			} else {
				showToast(cmsT("cms_472"), data.error || cmsFormat("cms_473", [data.statusCode]), "warning");
			}
		} catch (error) {
			setToolExecutionResult({
				timestamp: new Date().toLocaleTimeString("ar-AE"),
				success: false,
				error: error instanceof Error ? error.message : cmsT("cms_474"),
			});
			showToast(cmsT("cms_475"), cmsT("cms_476"), "warning");
		} finally {
			setIsExecutingTool(false);
		}
	};

	return (
		<div className="space-y-6 text-right pb-12">
			{/* Hub Hero Banner */}
			<div className="bg-gradient-to-l from-[#2C2014] via-[#3d2b1a] to-[#2C2014] text-white p-6 sm:p-8 rounded-3xl border border-amber-900/40 shadow-xl relative overflow-hidden">
				<div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
				<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
					<div className="space-y-2">
						<div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold border border-amber-500/30">
							<Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
							<span>{cmsT("cms_477")}</span>
							<span className="text-stone-400">|</span>
							<span className="font-mono" dir="ltr">{activeServer.url}</span>
						</div>
						<h2 className="font-serif text-2xl sm:text-3xl font-bold text-amber-100">
							
							{cmsT("cms_478")}
						</h2>
						<p className="text-stone-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
							
							{cmsT("cms_479")}{" "}
							<span className="font-mono text-amber-300" dir="ltr">mcp.teenliwa.com</span>.
						</p>
					</div>

					<div className="bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-2 min-w-[280px]">
						<div className="text-[11px] text-stone-400 font-semibold flex items-center justify-between">
							<span>{cmsT("cms_480")}</span>
							<span className="text-emerald-400 font-mono text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
								HTTP Bearer
							</span>
						</div>
						<div className="font-mono text-xs text-amber-200 truncate" dir="ltr">
							{activeServer.url}
						</div>
						<div className="text-[10px] text-stone-400 truncate font-mono" dir="ltr">
							Auth: {activeServer.headers?.Authorization ? `${activeServer.headers.Authorization.substring(0, 22)}...` : "None"}
						</div>
					</div>
				</div>
			</div>

			{/* Unified Sub-Tabs Navigation (All Marketing in One Place) */}
			<div className="bg-white p-2 rounded-2xl border border-[#E8DCCB] shadow-sm flex flex-wrap gap-2">
				<button
					onClick={() => setActiveSubTab("config")}
					className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
						activeSubTab === "config"
							? "bg-[#2C2014] text-amber-300 shadow-md"
							: "text-stone-700 hover:bg-stone-100"
					}`}
				>
					<Code2 className="w-4 h-4 text-amber-400" />
					<span>{cmsT("cms_481")}</span>
				</button>

				<button
					onClick={() => setActiveSubTab("campaigns")}
					className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
						activeSubTab === "campaigns"
							? "bg-[#2C2014] text-amber-300 shadow-md"
							: "text-stone-700 hover:bg-stone-100"
					}`}
				>
					<Megaphone className="w-4 h-4 text-amber-400" />
					<span>{cmsT("cms_482")}{metaCampaigns.length})</span>
				</button>

				<button
					onClick={() => setActiveSubTab("catalog")}
					className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
						activeSubTab === "catalog"
							? "bg-[#2C2014] text-amber-300 shadow-md"
							: "text-stone-700 hover:bg-stone-100"
					}`}
				>
					<Share2 className="w-4 h-4 text-blue-400" />
					<span>{cmsT("cms_483")}</span>
				</button>

				<button
					onClick={() => setActiveSubTab("runner")}
					className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
						activeSubTab === "runner"
							? "bg-[#2C2014] text-amber-300 shadow-md"
							: "text-stone-700 hover:bg-stone-100"
					}`}
				>
					<Terminal className="w-4 h-4 text-emerald-500" />
					<span>{cmsT("cms_484")}</span>
				</button>
			</div>

			{/* Sub-Tab 1: MCP Config Settings (JSON and Visual Editor) */}
			{activeSubTab === "config" && (
				<div className="space-y-4">
					<McpConfigSettings />
				</div>
			)}

			{/* Sub-Tab 2: Meta Marketing Campaigns Manager */}
			{activeSubTab === "campaigns" && (
				<div className="space-y-4">
					<MetaCampaignsManager />
				</div>
			)}

			{/* Sub-Tab 3: Product Catalog & Pixel Settings */}
			{activeSubTab === "catalog" && (
				<div className="space-y-6">
					<div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DCCB] shadow-sm space-y-6">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
							<div>
								<h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
									<Share2 className="w-5 h-5 text-blue-600" />
									<span>{cmsT("cms_485")}</span>
								</h3>
								<p className="text-xs text-stone-600 mt-1">
									
									{cmsT("cms_486")}
								</p>
							</div>
							<div className="flex items-center gap-2">
								<a
									href="/api/catalog/meta"
									target="_blank"
									rel="noreferrer"
									className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
								>
									<span>{cmsT("cms_487")}</span>
									<ExternalLink className="w-3.5 h-3.5" />
								</a>
								<button
									onClick={() => copyToClipboard(`${window.location.origin}/api/catalog/meta`, cmsT("cms_488"))}
									className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
								>
									{copiedText === cmsT("cms_488") ? (
										<Check className="w-3.5 h-3.5 text-emerald-600" />
									) : (
										<Copy className="w-3.5 h-3.5" />
									)}
									<span>{cmsT("cms_149")}</span>
								</button>
							</div>
						</div>

						{/* Feed Specs */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
								<div className="text-xs text-stone-500 font-semibold">{cmsT("cms_489")}</div>
								<div className="text-2xl font-bold font-serif text-stone-900 mt-1">
									{products.length}  {cmsT("cms_490")}
								</div>
								<div className="text-[11px] text-emerald-600 mt-0.5">{cmsT("cms_491")}</div>
							</div>
							<div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
								<div className="text-xs text-stone-500 font-semibold">{cmsT("cms_492")}</div>
								<div className="text-2xl font-bold font-mono text-stone-900 mt-1">
									XML / RSS 2.0
								</div>
								<div className="text-[11px] text-stone-500 mt-0.5">Google &amp; Meta Product Catalog</div>
							</div>
							<div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
								<div className="text-xs text-stone-500 font-semibold">{cmsT("cms_493")}</div>
								<div className="text-2xl font-bold font-serif text-amber-900 mt-1">
									
									{cmsT("cms_494")}
								</div>
								<div className="text-[11px] text-stone-500 mt-0.5">{cmsT("cms_495")}</div>
							</div>
						</div>

						{/* Products in Feed Table */}
						<div className="border border-stone-200 rounded-xl overflow-hidden">
							<div className="bg-[#FAF7F2] px-4 py-3 border-b border-stone-200 flex items-center justify-between">
								<span className="font-semibold text-xs text-stone-800">
									
									{cmsT("cms_496")}{products.length})
								</span>
								<span className="text-[11px] text-stone-500">
									
									{cmsT("cms_497")}
								</span>
							</div>
							<div className="overflow-x-auto max-h-80">
								<table className="w-full text-right text-xs">
									<thead className="bg-stone-50 border-b border-stone-200 text-stone-600 sticky top-0">
										<tr>
											<th className="py-2.5 px-3 font-semibold">{cmsT("cms_498")}</th>
											<th className="py-2.5 px-3 font-semibold">{cmsT("cms_499")}</th>
											<th className="py-2.5 px-3 font-semibold">{cmsT("cms_46")}</th>
											<th className="py-2.5 px-3 font-semibold">{cmsT("cms_500")}</th>
											<th className="py-2.5 px-3 font-semibold">{cmsT("cms_501")}</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-stone-100">
										{products.map((p) => (
											<tr key={p.id} className="hover:bg-stone-50">
												<td className="py-2.5 px-3 font-mono text-stone-800" dir="ltr">{p.id}</td>
												<td className="py-2.5 px-3 font-bold text-stone-900">{p.name}</td>
												<td className="py-2.5 px-3">
													<span
														className={`px-2 py-0.5 rounded text-[10px] font-bold ${
															p.inStock
																? "bg-emerald-100 text-emerald-800"
																: "bg-rose-100 text-rose-800"
														}`}
													>
														{p.inStock ? cmsT("cms_502") : cmsT("cms_503")}
													</span>
												</td>
												<td className="py-2.5 px-3 font-bold text-amber-900 tabular-nums">
													{p.price}  {cmsT("cms_55")}
												</td>
												<td className="py-2.5 px-3 text-stone-600">{p.origin}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Sub-Tab 4: Live MCP Tools Console */}
			{activeSubTab === "runner" && (
				<div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DCCB] shadow-sm space-y-6">
					<div>
						<h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
							<Terminal className="w-5 h-5 text-emerald-600" />
							<span>{cmsT("cms_504")}</span>
						</h3>
						<p className="text-xs text-stone-600 mt-1">
							
							{cmsT("cms_505")}{" "}
							<span className="font-mono text-stone-800" dir="ltr">{activeServer.url}</span>.
						</p>
					</div>

					{/* Tool Selection */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-xs font-semibold text-stone-800 mb-1">
								
								{cmsT("cms_506")}
							</label>
							<select
								value={selectedTool}
								onChange={(e) => setSelectedTool(e.target.value)}
								className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-800 focus:outline-none focus:border-amber-800"
							>
								<option value="tools/list">{cmsT("cms_507")}</option>
								<option value="initialize">{cmsT("cms_508")}</option>
								<option value="prompts/list">{cmsT("cms_509")}</option>
								<option value="resources/list">{cmsT("cms_510")}</option>
							</select>
						</div>

						<div>
							<label className="block text-xs font-semibold text-stone-800 mb-1">
								
								{cmsT("cms_511")}
							</label>
							<input
								type="text"
								value={customToolArgs}
								onChange={(e) => setCustomToolArgs(e.target.value)}
								placeholder="{}"
								className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-800 focus:outline-none focus:border-amber-800"
								dir="ltr"
							/>
						</div>
					</div>

					<div className="flex items-center justify-between pt-2">
						<button
							onClick={handleExecuteTool}
							disabled={isExecutingTool}
							className="px-5 py-2.5 bg-[#2C2014] hover:bg-[#3d2b1a] text-amber-300 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-60 shadow"
						>
							{isExecutingTool ? (
								<>
									<RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
									<span>{cmsT("cms_512")}</span>
								</>
							) : (
								<>
									<Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
									<span>{cmsT("cms_513")}</span>
								</>
							)}
						</button>

						<span className="text-[11px] text-stone-500 font-mono" dir="ltr">
							Target: {activeServer.url}
						</span>
					</div>

					{/* Tool Execution Result Console */}
					{toolExecutionResult && (
						<div className="border border-stone-300 rounded-xl bg-stone-900 text-white p-4 space-y-3 font-mono text-xs overflow-hidden">
							<div className="flex items-center justify-between border-b border-stone-800 pb-2 text-[11px]">
								<div className="flex items-center gap-2">
									<span className={`w-2.5 h-2.5 rounded-full ${toolExecutionResult.success ? "bg-emerald-400" : "bg-rose-400"}`} />
									<span className="text-stone-300 font-bold">
										
										{cmsT("cms_514")} {toolExecutionResult.statusCode || (toolExecutionResult.success ? 200 : cmsT("cms_14"))}
									</span>
								</div>
								<div className="text-stone-400 text-[10px]">
									{toolExecutionResult.latencyMs ? `${toolExecutionResult.latencyMs}ms` : ""} · {toolExecutionResult.timestamp}
								</div>
							</div>

							<div className="overflow-x-auto max-h-96 scrollbar-thin">
								<pre className="text-amber-200 text-[11px] whitespace-pre-wrap leading-relaxed" dir="ltr">
									{JSON.stringify(toolExecutionResult.responseBody || toolExecutionResult, null, 2)}
								</pre>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
};
