import React, { useState, useEffect } from "react";
import { useStore } from "../../context/StoreContext";
import type { McpServersConfig } from "../../types/store";
import { DEFAULT_MCP_CONFIG } from "../../data/initialData";
import {
	Server,
	Code2,
	CheckCircle2,
	AlertCircle,
	Copy,
	Check,
	RefreshCw,
	Play,
	Save,
	RotateCcw,
	ExternalLink,
	ShieldCheck,
	Zap,
	Terminal,
	Layers,
	Eye,
	Sliders,
} from "lucide-react";

interface ValidationResult {
	isValid: boolean;
	errorMessage?: string;
	parsedConfig?: McpServersConfig;
}

export const McpConfigSettings: React.FC = () => {
	const { mcpConfig, updateMcpConfig, resetMcpConfig, showToast } = useStore();

	// JSON text editor state
	const [jsonInput, setJsonInput] = useState<string>(
		JSON.stringify(mcpConfig || DEFAULT_MCP_CONFIG, null, 2)
	);
	const [validation, setValidation] = useState<ValidationResult>({ isValid: true });
	const [activeViewMode, setActiveViewMode] = useState<"json" | "form">("json");
	const [copiedKey, setCopiedKey] = useState<string | null>(null);

	// Visual Form State (mirrors the JSON)
	const currentMetaServer = mcpConfig?.mcpServers?.["meta-mcp"] || DEFAULT_MCP_CONFIG.mcpServers["meta-mcp"];
	const [formUrl, setFormUrl] = useState(currentMetaServer.url || "https://mcp.teenliwa.com/mcp");
	const [formTransport, setFormTransport] = useState(currentMetaServer.transport || "http");
	const [formAuthHeader, setFormAuthHeader] = useState(currentMetaServer.headers?.Authorization || "");

	// Live Connection Probe State
	const [isTestingConnection, setIsTestingConnection] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState<{
		tested: boolean;
		success?: boolean;
		statusCode?: number;
		latencyMs?: number;
		headers?: Record<string, string>;
		responseBody?: any;
		error?: string;
		timestamp?: string;
	}>({ tested: false });

	// Validate JSON on change
	useEffect(() => {
		validateConfig(jsonInput);
	}, [jsonInput]);

	// Keep json input in sync if mcpConfig in store changes externally
	useEffect(() => {
		if (mcpConfig) {
			const formatted = JSON.stringify(mcpConfig, null, 2);
			setJsonInput(formatted);
			const meta = mcpConfig.mcpServers?.["meta-mcp"];
			if (meta) {
				setFormUrl(meta.url || "");
				setFormTransport(meta.transport || "http");
				setFormAuthHeader(meta.headers?.Authorization || "");
			}
		}
	}, [mcpConfig]);

	const validateConfig = (text: string): ValidationResult => {
		if (!text.trim()) {
			const res = { isValid: false, errorMessage: "حقل الإعدادات فارغ. يرجى إدخال كائن JSON صالح." };
			setValidation(res);
			return res;
		}

		try {
			const parsed = JSON.parse(text);

			if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
				const res = { isValid: false, errorMessage: "يجب أن تكون الإعدادات كائن JSON (Object)." };
				setValidation(res);
				return res;
			}

			if (!parsed.mcpServers || typeof parsed.mcpServers !== "object") {
				const res = { isValid: false, errorMessage: "يجب أن يحتوي كائن JSON على المفتاح الرئيسي 'mcpServers'." };
				setValidation(res);
				return res;
			}

			const metaServer = parsed.mcpServers["meta-mcp"];
			if (!metaServer || typeof metaServer !== "object") {
				const res = { isValid: false, errorMessage: "يجب أن يحتوي 'mcpServers' على المفتاح 'meta-mcp'." };
				setValidation(res);
				return res;
			}

			if (!metaServer.url || typeof metaServer.url !== "string" || !metaServer.url.trim()) {
				const res = { isValid: false, errorMessage: "المفتاح 'url' مطلوب ويجب أن يكون رابط خادم صالح (URL)." };
				setValidation(res);
				return res;
			}

			if (!metaServer.url.startsWith("http://") && !metaServer.url.startsWith("https://")) {
				const res = { isValid: false, errorMessage: "يجب أن يبدأ عنوان الخادم بـ https:// أو http://" };
				setValidation(res);
				return res;
			}

			if (!metaServer.transport || typeof metaServer.transport !== "string") {
				const res = { isValid: false, errorMessage: "المفتاح 'transport' مطلوب (مثل 'http')." };
				setValidation(res);
				return res;
			}

			if (!metaServer.headers || typeof metaServer.headers !== "object") {
				const res = { isValid: false, errorMessage: "يجب تضمين كائن 'headers' يحتوي على ترويسة المصادقة 'Authorization'." };
				setValidation(res);
				return res;
			}

			if (!metaServer.headers.Authorization || typeof metaServer.headers.Authorization !== "string") {
				const res = { isValid: false, errorMessage: "يجب تحديد ترويسة 'Authorization' بصيغة 'Bearer <TOKEN>'." };
				setValidation(res);
				return res;
			}

			const res = { isValid: true, parsedConfig: parsed as McpServersConfig };
			setValidation(res);
			return res;
		} catch (err) {
			const res = {
				isValid: false,
				errorMessage: err instanceof Error ? `خطأ في بناء جملة JSON (Syntax Error): ${err.message}` : "صيغة JSON غير صالحة.",
			};
			setValidation(res);
			return res;
		}
	};

	const handleSave = () => {
		const result = validateConfig(jsonInput);
		if (!result.isValid || !result.parsedConfig) {
			showToast("خطأ في الإعدادات", result.errorMessage || "يرجى تصحيح أخطاء الـ JSON قبل الحفظ.", "warning");
			return;
		}

		updateMcpConfig(result.parsedConfig);
	};

	const handleReset = () => {
		resetMcpConfig();
		setJsonInput(JSON.stringify(DEFAULT_MCP_CONFIG, null, 2));
		setFormUrl(DEFAULT_MCP_CONFIG.mcpServers["meta-mcp"].url);
		setFormTransport(DEFAULT_MCP_CONFIG.mcpServers["meta-mcp"].transport);
		setFormAuthHeader(DEFAULT_MCP_CONFIG.mcpServers["meta-mcp"].headers?.Authorization || "");
	};

	// Synchronize visual form fields to JSON editor
	const handleFormChange = (newUrl: string, newTransport: string, newAuthHeader: string) => {
		setFormUrl(newUrl);
		setFormTransport(newTransport);
		setFormAuthHeader(newAuthHeader);

		const updated: McpServersConfig = {
			mcpServers: {
				"meta-mcp": {
					transport: newTransport,
					url: newUrl,
					headers: {
						Authorization: newAuthHeader,
					},
				},
			},
		};

		setJsonInput(JSON.stringify(updated, null, 2));
	};

	// Test real connection to the configured MCP server URL
	const handleTestConnection = async () => {
		const result = validateConfig(jsonInput);
		if (!result.isValid || !result.parsedConfig) {
			showToast("تنبيه", "يرجى إدخال إعدادات JSON صحيحة أولاً لاختبار الاتصال.", "warning");
			return;
		}

		const metaServer = result.parsedConfig.mcpServers["meta-mcp"];
		setIsTestingConnection(true);

		try {
			const res = await fetch("/api/meta/mcp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "test_custom_mcp",
					url: metaServer.url,
					transport: metaServer.transport,
					headers: metaServer.headers,
				}),
			});

			const data = (await res.json()) as any;
			setConnectionStatus({
				tested: true,
				success: data.success,
				statusCode: data.statusCode,
				latencyMs: data.latencyMs,
				headers: data.headers,
				responseBody: data.responseBody || data.rawResponse,
				error: data.error,
				timestamp: new Date().toLocaleTimeString("ar-AE"),
			});

			if (data.success) {
				showToast("نجح الاتصال بخادم MCP", `تم الاتصال بالخادم بنجاح (${data.statusCode}) بزمن استجابة ${data.latencyMs}ms.`);
			} else {
				showToast("استجابة الخادم", data.error || `أرجع الخادم رمز الحالة ${data.statusCode}`, "warning");
			}
		} catch (err) {
			setConnectionStatus({
				tested: true,
				success: false,
				error: err instanceof Error ? err.message : "فشل الاتصال بالشبكة",
				timestamp: new Date().toLocaleTimeString("ar-AE"),
			});
			showToast("خطأ شبكة", "تعذر الاتصال بعنوان خادم MCP المحدد.", "warning");
		} finally {
			setIsTestingConnection(false);
		}
	};

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		setCopiedKey(label);
		setTimeout(() => setCopiedKey(null), 2500);
		showToast("تم النسخ", `تم نسخ كود ${label} إلى الحافظة.`);
	};

	const claudeMcpSnippet = `claude mcp add --transport ${formTransport} meta-mcp "${formUrl}" --header "Authorization: ${formAuthHeader}"`;

	return (
		<div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8DCCB] shadow-sm space-y-6 text-right font-sans">
			{/* Top Header Card */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
				<div className="flex items-center gap-3.5">
					<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1877F2] to-[#0D5EC4] text-white flex items-center justify-center font-bold text-base shadow-md">
						<Server className="w-6 h-6 text-white" />
					</div>
					<div>
						<div className="flex items-center gap-2 flex-wrap">
							<h2 className="font-serif text-lg font-bold text-[#2C2014]">
								إعدادات خادم Model Context Protocol (MCP Settings)
							</h2>
							<span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-300 font-mono font-bold px-2 py-0.5 rounded-full">
								Custom MCP JSON
							</span>
						</div>
						<p className="text-xs text-stone-500 pt-0.5">
							تهيئة وإدارة خادم MCP المخصص لربط الحملات والتسوق بالذكاء الاصطناعي وبوابة teenliwa
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
					{/* Toggle View Mode */}
					<div className="bg-stone-100 p-1 rounded-xl flex items-center gap-1 border border-stone-200 text-xs">
						<button
							onClick={() => setActiveViewMode("json")}
							className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
								activeViewMode === "json"
									? "bg-white text-stone-900 shadow-sm"
									: "text-stone-600 hover:text-stone-900"
							}`}
						>
							<Code2 className="w-3.5 h-3.5" />
							<span>محرر JSON</span>
						</button>
						<button
							onClick={() => setActiveViewMode("form")}
							className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
								activeViewMode === "form"
									? "bg-white text-stone-900 shadow-sm"
									: "text-stone-600 hover:text-stone-900"
							}`}
						>
							<Sliders className="w-3.5 h-3.5" />
							<span>نموذج مرئي</span>
						</button>
					</div>
				</div>
			</div>

			{/* Expected Structure Explanation Card */}
			<div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 p-4 rounded-2xl border border-blue-200 text-xs space-y-2">
				<div className="flex items-center justify-between">
					<span className="font-bold text-[#1877F2] flex items-center gap-1.5 text-xs">
						<Zap className="w-4 h-4 text-[#1877F2]" />
						<span>البنية المعتمدة لإعدادات خادم MCP (Expected JSON Schema):</span>
					</span>
					<span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-blue-300 text-blue-800 font-bold">
						mcpServers.meta-mcp
					</span>
				</div>
				<p className="text-stone-600 text-[11px] leading-relaxed">
					يقبل النظام كائن JSON يحتوي على رابط الخادم <code className="font-mono text-blue-700 bg-white px-1 py-0.5 rounded" dir="ltr">https://mcp.teenliwa.com/mcp</code>، نوع النقل <code className="font-mono text-blue-700 bg-white px-1 py-0.5 rounded" dir="ltr">http</code>، وترويسة التخويل <code className="font-mono text-blue-700 bg-white px-1 py-0.5 rounded" dir="ltr">Authorization: Bearer ...</code>
				</p>
			</div>

			{/* VIEW 1: RAW JSON EDITOR */}
			{activeViewMode === "json" && (
				<div className="space-y-3 animate-fadeIn">
					<div className="flex items-center justify-between text-xs">
						<label className="font-bold text-stone-800 flex items-center gap-1.5">
							<Code2 className="w-4 h-4 text-blue-600" />
							<span>محرر كائن JSON للإعدادات:</span>
						</label>

						<div className="flex items-center gap-2">
							{validation.isValid ? (
								<span className="text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
									<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
									<span>صيغة JSON صحيحة ومطابقة</span>
								</span>
							) : (
								<span className="text-[11px] bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
									<AlertCircle className="w-3.5 h-3.5 text-rose-600" />
									<span>خطأ في بنية JSON</span>
								</span>
							)}
						</div>
					</div>

					{/* Code Area */}
					<div className="relative rounded-2xl overflow-hidden border border-stone-700 shadow-inner">
						<textarea
							value={jsonInput}
							onChange={(e) => setJsonInput(e.target.value)}
							rows={12}
							className="w-full p-4 bg-[#1E1E1E] text-emerald-400 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 block"
							dir="ltr"
							spellCheck={false}
							placeholder={`{\n  "mcpServers": {\n    "meta-mcp": {\n      "transport": "http",\n      "url": "https://mcp.teenliwa.com/mcp",\n      "headers": {\n        "Authorization": "Bearer ..."\n      }\n    }\n  }\n}`}
						/>

						<button
							onClick={() => copyToClipboard(jsonInput, "MCP Config JSON")}
							className="absolute top-3 right-3 p-1.5 bg-white/10 hover:bg-white/20 text-stone-200 rounded-lg flex items-center gap-1 text-[11px] backdrop-blur-sm"
							title="نسخ الـ JSON"
						>
							{copiedKey === "MCP Config JSON" ? (
								<Check className="w-3.5 h-3.5 text-emerald-400" />
							) : (
								<Copy className="w-3.5 h-3.5" />
							)}
							<span>{copiedKey === "MCP Config JSON" ? "تم النسخ" : "نسخ"}</span>
						</button>
					</div>

					{/* Validation Error Message */}
					{!validation.isValid && validation.errorMessage && (
						<div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-center gap-2 animate-fadeIn">
							<AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
							<span>{validation.errorMessage}</span>
						</div>
					)}
				</div>
			)}

			{/* VIEW 2: VISUAL FORM FIELDS */}
			{activeViewMode === "form" && (
				<div className="space-y-4 bg-stone-50 p-5 rounded-2xl border border-stone-200 text-xs animate-fadeIn">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Server URL */}
						<div className="space-y-1.5 md:col-span-2">
							<label className="font-semibold text-stone-800">
								عنوان خادم MCP المخصص (Server URL):
							</label>
							<input
								type="text"
								value={formUrl}
								onChange={(e) => handleFormChange(e.target.value, formTransport, formAuthHeader)}
								placeholder="https://mcp.teenliwa.com/mcp"
								className="w-full p-2.5 border border-stone-300 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-600 bg-white"
								dir="ltr"
							/>
						</div>

						{/* Transport */}
						<div className="space-y-1.5">
							<label className="font-semibold text-stone-800">
								بروتوكول النقل (Transport):
							</label>
							<select
								value={formTransport}
								onChange={(e) => handleFormChange(formUrl, e.target.value, formAuthHeader)}
								className="w-full p-2.5 border border-stone-300 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-600 bg-white"
							>
								<option value="http">http (Server-Sent HTTP / JSON-RPC)</option>
								<option value="sse">sse (Server-Sent Events)</option>
								<option value="stdio">stdio (Local Process)</option>
							</select>
						</div>

						{/* Key ID */}
						<div className="space-y-1.5">
							<label className="font-semibold text-stone-800">
								معرف الخادم الداخلي (Server ID):
							</label>
							<input
								type="text"
								value="meta-mcp"
								disabled
								className="w-full p-2.5 border border-stone-200 rounded-xl font-mono text-xs bg-stone-100 text-stone-500 cursor-not-allowed"
								dir="ltr"
							/>
						</div>

						{/* Authorization Header */}
						<div className="space-y-1.5 md:col-span-2">
							<label className="font-semibold text-stone-800">
								ترويسة التخويل (Authorization Header):
							</label>
							<input
								type="password"
								value={formAuthHeader}
								onChange={(e) => handleFormChange(formUrl, formTransport, e.target.value)}
								placeholder="Bearer eyJhbGciOiJIUzI1NiJ9..."
								className="w-full p-2.5 border border-stone-300 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-600 bg-white"
								dir="ltr"
							/>
						</div>
					</div>
				</div>
			)}

			{/* Primary Action Buttons Bar */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-stone-200">
				<div className="flex items-center gap-2 flex-wrap">
					{/* Save Button */}
					<button
						onClick={handleSave}
						disabled={!validation.isValid}
						className="px-5 py-2.5 bg-[#1877F2] hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
					>
						<Save className="w-4 h-4" />
						<span>حفظ وتفعيل إعدادات MCP</span>
					</button>

					{/* Test Connection Button */}
					<button
						onClick={handleTestConnection}
						disabled={isTestingConnection || !validation.isValid}
						className="px-4 py-2.5 bg-stone-900 hover:bg-black text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow"
					>
						{isTestingConnection ? (
							<>
								<RefreshCw className="w-3.5 h-3.5 animate-spin" />
								<span>جارِ فحص الاتصال...</span>
							</>
						) : (
							<>
								<Zap className="w-3.5 h-3.5 text-amber-400" />
								<span>اختبار الاتصال بالخادم الآن</span>
							</>
						)}
					</button>

					{/* Reset to Default */}
					<button
						onClick={handleReset}
						className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-stone-200"
						title="استعادة إعدادات teenliwa الافتراضية"
					>
						<RotateCcw className="w-3.5 h-3.5" />
						<span>استعادة teenliwa الافتراضية</span>
					</button>
				</div>

				<span className="text-[11px] text-stone-500 self-center">
					الخادم النشط: <strong className="font-mono text-stone-800" dir="ltr">{formUrl}</strong>
				</span>
			</div>

			{/* Live Connection Probe Result Banner */}
			{connectionStatus.tested && (
				<div
					className={`p-4 rounded-2xl text-xs space-y-2 animate-fadeIn border ${
						connectionStatus.success
							? "bg-emerald-50 border-emerald-300 text-emerald-900"
							: "bg-amber-50 border-amber-300 text-amber-900"
					}`}
				>
					<div className="flex items-center justify-between">
						<span className="font-bold flex items-center gap-2">
							{connectionStatus.success ? (
								<CheckCircle2 className="w-4 h-4 text-emerald-600" />
							) : (
								<AlertCircle className="w-4 h-4 text-amber-600" />
							)}
							<span>
								{connectionStatus.success
									? `تم الاتصال بنجاح بخادم MCP (${connectionStatus.statusCode || 200})`
									: `استجابة الخادم: ${connectionStatus.statusCode || "رمز حالة غير متوقع"}`}
							</span>
						</span>
						{connectionStatus.latencyMs && (
							<span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-stone-300 font-bold text-stone-700">
								{connectionStatus.latencyMs}ms
							</span>
						)}
					</div>

					<div className="text-[11px] font-mono bg-white/80 p-2.5 rounded-xl border border-stone-200 space-y-1" dir="ltr">
						<div>ENDPOINT: {formUrl}</div>
						{connectionStatus.headers?.["content-type"] && (
							<div>CONTENT-TYPE: {connectionStatus.headers["content-type"]}</div>
						)}
						{connectionStatus.responseBody && (
							<div className="pt-1">
								<span className="text-stone-500">RESPONSE:</span>
								<pre className="text-[10px] text-stone-800 max-h-32 overflow-y-auto">
									{typeof connectionStatus.responseBody === "object"
										? JSON.stringify(connectionStatus.responseBody, null, 2)
										: String(connectionStatus.responseBody)}
								</pre>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Claude Code CLI Integration Snippet */}
			<div className="pt-2 border-t border-stone-200 space-y-2">
				<div className="flex items-center justify-between text-xs">
					<span className="font-bold text-stone-800 flex items-center gap-1.5">
						<Terminal className="w-4 h-4 text-stone-700" />
						<span>أمر الربط المباشر مع Claude Code CLI:</span>
					</span>
					<button
						onClick={() => copyToClipboard(claudeMcpSnippet, "Claude CLI Command")}
						className="text-[11px] text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1"
					>
						{copiedKey === "Claude CLI Command" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
						<span>{copiedKey === "Claude CLI Command" ? "تم النسخ" : "نسخ الأمر"}</span>
					</button>
				</div>

				<div className="relative bg-[#1E1E1E] text-stone-200 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto border border-stone-700" dir="ltr">
					<pre className="truncate">{claudeMcpSnippet}</pre>
				</div>
			</div>
		</div>
	);
};
