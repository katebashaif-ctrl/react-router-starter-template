import type { ActionFunctionArgs } from "react-router";
import { GoogleGenAI } from "@google/genai";

// Initialize official @google/genai SDK server-side
const ai = new GoogleGenAI({
	apiKey: process.env.GEMINI_API_KEY || "",
	httpOptions: {
		headers: {
			"User-Agent": "aistudio-build",
		},
	},
});

export async function action({ request }: ActionFunctionArgs) {
	try {
		const body = (await request.json()) as {
			action: "generate_ad_copy" | "analyze_lead" | "generate_whatsapp_reply" | "suggest_strategy";
			productName?: string;
			productCategory?: string;
			objective?: string;
			season?: string;
			leadData?: {
				customerName: string;
				phone: string;
				emirate: string;
				interestedProduct: string;
				quantityEstimated: string;
				notes?: string;
			};
		};

		// 1. Generate Ad Copy with AI for Meta Facebook Ads
		if (body.action === "generate_ad_copy") {
			const prompt = `أنت خبير تسويق رقمي إماراتي وإعلانات Meta Ads (Facebook & Instagram) متخصص في المنتجات الزراعية والمحاصيل التراثية الإماراتية الفاخرة (رطب النخيل، تين المزارع العضوي، فقع الصحراء الزبيدي والخلاسي).
أنشئ 3 نسخ إعلانية جذابة وموجهة للجمهور الإماراتي وأصحاب المجالس والضيافة.
تفاصيل المنتج المطلوب الإعلان له:
- المنتج: ${body.productName || "محاصيل خيرات الدار (رطب، تين، فقع)"}
- الفئة: ${body.productCategory || "عام"}
- هدف الحملة في Meta: ${body.objective || "مبيعات الكتالوج واستقطاب العملاء"}
- الموسم: ${body.season || "موسم القيظ وفقع الوسم"}

المطلوب إرجاع رد بصيغة JSON حصراً بالتنسيق التالي:
{
  "variants": [
    {
      "angle": "اسم الزاوية الإعلانية (مثلاً: زاوية الضيافة والمجالس / زاوية بشاير القيظ / زاوية الندرة والفخامة)",
      "headline": "عنوان الإعلان الجذاب (لا يتجاوز 6 كلمات)",
      "primaryText": "نص الإعلان الإماراتي المؤثر (مفردات إماراتية راقية، نبرة كرم وفخر، دعوة للشراء والتوصيل المبرد)",
      "callToAction": "SHOP_NOW أو GET_QUOTE أو ORDER_NOW",
      "targetEmirates": ["أبوظبي", "دبي", "العين"],
      "recommendedInterests": ["اهتمامات استهداف مقترحة لفيسبوك وانستغرام"],
      "hook": "الجملة الافتتاحية المؤثرة (Hook) في أول ثانيتين للفيديو أو الصورة"
    }
  ],
  "marketingTip": "نصيحة ذهبية لزيادة عائد الإنفاق الإعلاني ROAS لهذه الحملة في الإمارات"
}`;

			let resultText = "";
			if (process.env.GEMINI_API_KEY) {
				try {
					const response = await ai.models.generateContent({
						model: "gemini-3.8-flash",
						contents: prompt,
						config: {
							responseMimeType: "application/json",
						},
					});
					resultText = response.text || "";
				} catch (err) {
					console.warn("Gemini API call failed, using fallback:", err);
				}
			}

			// Parse response or fallback
			if (resultText) {
				try {
					const parsed = JSON.parse(resultText);
					return Response.json({ success: true, data: parsed });
				} catch (e) {}
			}

			// Fallback authentic Emirati AI copies
			const fallbackCopies = {
				variants: [
					{
						angle: "زاوية كرم الضيافة والمجالس الإماراتية",
						headline: `بشاير ${body.productName || "رطب وفقع الدار"} وصلت مجالسكم`,
						primaryText: `يا حي الله بالضيافة وسلوم الأجداد.. ${body.productName || "نوادر محاصيلنا"} مجنيّة على الفجر من أطيب مزارع الإمارات، مبردة ومصفوفة بسحاحير ومخاريف خشبية تبيّض الوجه. اطلبها الآن وتوصلك لبيتك مبردة بأعلى جودة.`,
						callToAction: "ORDER_NOW",
						targetEmirates: ["أبوظبي", "دبي", "الشارقة", "العين"],
						recommendedInterests: ["مجالس الضيافة", "أكلات إماراتية", "رطب وتمور فاخرة"],
						hook: "تبي ضيافة مجلسك تفرّق وتبيّض الوجه؟ شوف قطاف اليوم!",
					},
					{
						angle: "زاوية الندرة والقطاف الحصري المحدود",
						headline: "كميات محدودة من أندر محاصيل الموسم",
						primaryText: `لأهل الذوق الرفيع والنوادر.. ${body.productName || "محصولنا"} قطاف طازج يومي من قلب واحات ليوا ومزارع الذيد، نضمن لك الحبة النظيفة والطعم العسلي الأصيل. التوصيل مجاني للطلبات فوق ٢٥٠ درهم.`,
						callToAction: "SHOP_NOW",
						targetEmirates: ["أبوظبي", "دبي", "عجمان", "رأس الخيمة"],
						recommendedInterests: ["فواكه طبيعية", "المزارع العضوية", "تراث الإمارات"],
						hook: "الموسم قصير والكمية تنفد سريعاً.. لا يفوتك قطاف هالأسبوع!",
					},
					{
						angle: "زاوية الإهداء الفاخر والتوزيعات",
						headline: "إهداء يليق بأحبابكم من خيرات أرض زايد",
						primaryText: `صناديق خشبية محفورة بعبق التراث، تحتوي أصفى وأجود ما جادت به أرض الإمارات. خيارك الأمثل لهدايا كبار الشخصيات والزيارات العائلية. نوفر بطاقة إهداء مخصصة باسمك.`,
						callToAction: "GET_QUOTE",
						targetEmirates: ["دبي", "أبوظبي", "الشارقة"],
						recommendedInterests: ["هدايا فاخرة", "المناسبات العائلية", "الضيافة الملكية"],
						hook: "هدية تراثية أصيلة تترك أثراً طيباً في قلوب أحبابكم.",
					},
				],
				marketingTip:
					"استهدف حملات Instagram Reels في أوقات ما قبل المغرب (بين الساعة ٤ عصراً و٨ مساءً) حيث تكون استجابة العائلات الإماراتية للطلبات الطازجة في أعلى مستوياتها.",
			};

			return Response.json({ success: true, data: fallbackCopies });
		}

		// 2. Analyze Lead & Generate Customized WhatsApp Reply
		if (body.action === "analyze_lead" || body.action === "generate_whatsapp_reply") {
			const lead = body.leadData;
			if (!lead) {
				return Response.json({ success: false, error: "Missing leadData" }, { status: 400 });
			}

			const prompt = `أنت مساعد مبيعات ذكي ومستشار علاقات عملاء لمتجر «خيرات الدار» الإماراتي للرطب والتين والفقع.
حلل العميل المحتمل (Lead) القادم من إعلانات Meta:
- الاسم: ${lead.customerName}
- الإمارة: ${lead.emirate}
- المحصول المهتم به: ${lead.interestedProduct}
- الكمية التقديرية: ${lead.quantityEstimated}
- ملاحظات العميل: ${lead.notes || "لا توجد"}

المطلوب إرجاع JSON:
{
  "aiScore": "high أو medium أو low",
  "scoreReason": "سبب تقييم العميل باختصار (مثلاً: رغبة شرائية عالية لمجلس، كمية ضيافة كبيرة)",
  "recommendedAction": "الخطوة التالية الموصى بها لإتمام الصفقة (مثل: عرض خصم على الصندوق الإضافي، إرسال فيديو للقطاف اليومي)",
  "whatsappReply": "رسالة واتساب احترافية ومرحبة بالعميل بأسلوب إماراتي ودود ومحترم (مرحباً بك يا طويل العمر / يا أخي الكريم.. تأكيد توفر المحصول الطازج وإبراز التوصيل المبرد وطرح السؤال لإتمام الطلب والعنوان)"
}`;

			let resultText = "";
			if (process.env.GEMINI_API_KEY) {
				try {
					const response = await ai.models.generateContent({
						model: "gemini-3.8-flash",
						contents: prompt,
						config: { responseMimeType: "application/json" },
					});
					resultText = response.text || "";
				} catch (err) {
					console.warn("Gemini lead analysis fallback:", err);
				}
			}

			if (resultText) {
				try {
					const parsed = JSON.parse(resultText);
					return Response.json({ success: true, data: parsed });
				} catch (e) {}
			}

			// Fallback AI Lead Qualification
			const fallbackAnalysis = {
				aiScore: lead.quantityEstimated.includes("صناديق") || lead.quantityEstimated.includes("كجم") ? "high" : "medium",
				scoreReason: `طلب مهتم بمحصول ${lead.interestedProduct} في إمارة ${lead.emirate}. العميل يبحث عن جودة ممتازة وتوصيل مبرد.`,
				recommendedAction: "أرسل له رسالة الواتساب الترحيبية مع تأكيد موعد التوصيل المبرد غداً وعرض خيار الدفع عند الاستلام.",
				whatsappReply: `مرحباً بك يا ${lead.customerName} الكريم، طاب مساؤك بكل خير من متجر «خيرات الدار» 🌴🇦🇪

وصلنا اهتمامك الكريم بـ *${lead.interestedProduct}* (${lead.quantityEstimated}).
نود إبلاغك بأن قطاف اليوم وصل من مزارعنا ونظيف تماماً بنخب أول مجهز بسحاحير الضيافة.

توصيلنا مبرد لباب بيتك في ${lead.emirate} خلال ٢٤ ساعة، مع إمكانية الدفع عند الاستلام نقداً أو بالبطاقة.

هل ترغب في تأكيد الطلب وتزويدنا بموقع التوصيل المناسب لتجهيزه لكم فوراً؟ 📦✨`,
			};

			return Response.json({ success: true, data: fallbackAnalysis });
		}

		return Response.json({ success: false, error: "Invalid action" }, { status: 400 });
	} catch (error) {
		return Response.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "AI marketing action failed",
			},
			{ status: 500 },
		);
	}
}
