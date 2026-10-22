import type { LoaderFunctionArgs } from "react-router";
import { INITIAL_PRODUCTS } from "../data/initialData";

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const format = url.searchParams.get("format") || "xml";
	const baseUrl = `${url.protocol}//${url.host}`;

	// Products from seed / memory
	const products = INITIAL_PRODUCTS;

	// 1. CSV Format for Meta Commerce Manager upload
	if (format === "csv") {
		const headers = [
			"id",
			"title",
			"description",
			"availability",
			"condition",
			"price",
			"link",
			"image_link",
			"brand",
			"google_product_category",
			"custom_label_0",
		];

		const rows = products.map((p) => {
			const cleanDesc = p.description.replace(/"/g, '""').replace(/\n/g, " ");
			const cleanName = p.name.replace(/"/g, '""');
			const imageUrl = p.image.startsWith("http")
				? p.image
				: `${baseUrl}${p.image}`;
			const productLink = `${baseUrl}/#prod-${p.id}`;
			const avail = p.inStock ? "in stock" : "out of stock";
			const priceFormatted = `${p.price}.00 AED`;

			return [
				`"${p.id}"`,
				`"${cleanName}"`,
				`"${cleanDesc}"`,
				`"${avail}"`,
				`"new"`,
				`"${priceFormatted}"`,
				`"${productLink}"`,
				`"${imageUrl}"`,
				`"خيرات الدار"`,
				`"Food, Beverages & Tobacco > Food Items > Fresh Produce"`,
				`"${p.origin.replace(/"/g, '""')}"`,
			].join(",");
		});

		const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
		return new Response(csvContent, {
			headers: {
				"Content-Type": "text/csv; charset=utf-8",
				"Content-Disposition": 'attachment; filename="meta_facebook_catalog.csv"',
				"Cache-Control": "max-age=3600, s-maxage=3600",
			},
		});
	}

	// 2. JSON format
	if (format === "json") {
		const items = products.map((p) => ({
			id: p.id,
			title: p.name,
			title_en: p.nameEn,
			description: p.description,
			availability: p.inStock ? "in stock" : "out of stock",
			condition: "new",
			price: `${p.price} AED`,
			link: `${baseUrl}/#prod-${p.id}`,
			image_link: p.image.startsWith("http") ? p.image : `${baseUrl}${p.image}`,
			brand: "خيرات الدار",
			category: p.category,
			origin: p.origin,
		}));

		return Response.json({
			success: true,
			store: "خيرات الدار الإماراتية",
			currency: "AED",
			items_count: items.length,
			items,
		});
	}

	// 3. XML RSS 2.0 Feed for Meta Commerce Manager Data Feed URL
	const itemsXml = products
		.map((p) => {
			const imageUrl = p.image.startsWith("http")
				? p.image
				: `${baseUrl}${p.image}`;
			const productLink = `${baseUrl}/#prod-${p.id}`;
			const avail = p.inStock ? "in stock" : "out of stock";

			return `    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${p.description}]]></g:description>
      <g:link>${productLink}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:brand>خيرات الدار</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${avail}</g:availability>
      <g:price>${p.price}.00 AED</g:price>
      <g:google_product_category>Food, Beverages &amp; Tobacco &gt; Food Items &gt; Fresh &amp; Frozen Food &gt; Fresh Produce</g:google_product_category>
      <g:custom_label_0><![CDATA[${p.origin}]]></g:custom_label_0>
      <g:custom_label_1><![CDATA[${p.season}]]></g:custom_label_1>
    </item>`;
		})
		.join("\n");

	const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>خيرات الدار | متجر الرطب والتين والفقع الإماراتي</title>
    <link>${baseUrl}</link>
    <description>خلاصة منتجات ومحاصيل خيرات الدار المتكاملة مع إعلانات Meta وFacebook Ads وInstagram Shopping</description>
${itemsXml}
  </channel>
</rss>`;

	return new Response(rssXml, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "max-age=3600, s-maxage=3600",
		},
	});
}
