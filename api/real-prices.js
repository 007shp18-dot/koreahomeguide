function decodeXml(text) {
  return String(text || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`, "i"));
  return m ? decodeXml(m[1].trim()) : "";
}

function parseItems(xml, type) {
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  return blocks.map(block => {
    const year = tag(block, "dealYear");
    const month = tag(block, "dealMonth");
    const day = tag(block, "dealDay");

    const building =
      tag(block, "offiNm") ||
      tag(block, "mhouseNm") ||
      tag(block, "aptNm") ||
      tag(block, "buildingName") ||
      tag(block, "umdNm") ||
      "-";

    const area =
      tag(block, "excluUseAr") ||
      tag(block, "excluUseArea") ||
      tag(block, "totalFloorAr") ||
      "";

    const deposit =
      tag(block, "deposit") ||
      tag(block, "depositAmt") ||
      "0";

    const monthlyRent =
      tag(block, "monthlyRent") ||
      tag(block, "monthlyRentAmt") ||
      "0";

    return {
      building,
      area,
      deposit,
      monthlyRent,
      contractDate: year && month && day ? `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}` : "",
      type
    };
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawServiceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!rawServiceKey) {
    return res.status(500).json({
      error: "DATA_GO_KR_SERVICE_KEY is not configured in Vercel."
    });
  }

  // data.go.kr may show either an encoded or decoded service key.
  // Normalize it before URLSearchParams encodes the request once.
  let serviceKey = rawServiceKey.trim();
  try {
    if (/%[0-9A-Fa-f]{2}/.test(serviceKey)) {
      serviceKey = decodeURIComponent(serviceKey);
    }
  } catch (_) {
    // Keep the raw value if decoding fails.
  }

  const { type = "officetel", lawdCd, dealYmd } = req.query;

  if (!/^\d{5}$/.test(String(lawdCd || "")) || !/^\d{6}$/.test(String(dealYmd || ""))) {
    return res.status(400).json({ error: "Invalid lawdCd or dealYmd." });
  }

  const endpoints = {
    officetel: "https://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent",
    villa: "https://apis.data.go.kr/1613000/RTMSDataSvcRHRent/getRTMSDataSvcRHRent"
  };

  const endpoint = endpoints[type];
  if (!endpoint) {
    return res.status(400).json({ error: "Unsupported property type." });
  }

  const params = new URLSearchParams({
    serviceKey,
    LAWD_CD: String(lawdCd),
    DEAL_YMD: String(dealYmd),
    numOfRows: "100",
    pageNo: "1"
  });

  try {
    const upstream = await fetch(`${endpoint}?${params.toString()}`, {
      headers: { Accept: "application/xml,text/xml,*/*" }
    });

    const xml = await upstream.text();

    if (!upstream.ok) {
      return res.status(502).json({ error: `Public API returned HTTP ${upstream.status}.` });
    }

    const resultCode = tag(xml, "resultCode");
    const resultMsg = tag(xml, "resultMsg");

    if (resultCode && resultCode !== "00" && resultCode !== "000") {
      return res.status(502).json({
        error: resultMsg || `Public API error (${resultCode}).`
      });
    }

    const items = parseItems(xml, type);
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json({ items });
  } catch (e) {
    return res.status(500).json({
      error: "Failed to reach the public transaction API."
    });
  }
}
