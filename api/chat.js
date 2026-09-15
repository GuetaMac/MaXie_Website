// Vercel serverless function — /api/chat
//
// Keeps the Gemini API key server-side (set it as an env var in your Vercel
// project settings named GEMINI_API_KEY — NOT prefixed with VITE_, so it's
// never bundled into client code or visible in devtools).
//
// Get a free key at https://aistudio.google.com/apikey

const MODEL = "gemini-3.1-flash-lite"; // current stable free-tier model (Sept 2026)
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM_PROMPT = `Ikaw ay isang malapit, mapagmahal na AI na kilalang-kilala ang relasyon nina Macky at Trixie. Ang alam mo lang tungkol sa kanila ay ang totoong impormasyon sa CONTEXT sa ibaba — mga milestone ng kwento nila at ang mga tunay na notes/mensahe nilang dalawa sa isa't isa.

Panuntunan:
- Sumagot lang batay sa binigay na context. Kung wala kang sapat na impormasyon para sagutin nang tama, sabihin nang tapat na hindi mo alam o wala pa sa mga naitalang alaala — huwag kang gagawa-gawa (huwag mag-imbento) ng detalye.
- Ang tono mo ay malambing, casual, at parang isang taong tunay na nakakakilala sa kanila — hindi corporate o pormal.
- Sumagot sa parehong Taglish/Tagalog na estilo na ginagamit nila sa mga notes nila, maliban kung mismong nag-Ingles ang tanong.
- Panatilihing maikli at makatotohanan ang mga sagot — hindi kailangan ng mahabang sanaysay maliban kung hiniling.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res
      .status(500)
      .json({ error: "GEMINI_API_KEY is not configured on the server." });
    return;
  }

  const { message, history, context } = req.body || {};

  if (!message || typeof message !== "string") {
    res
      .status(400)
      .json({ error: "Missing 'message' string in request body." });
    return;
  }

  // `history` = [{ role: "user" | "model", text: "..." }, ...] from earlier
  // turns in this chat session (sent by the client, kept in memory there —
  // this function itself is stateless).
  const priorTurns = Array.isArray(history)
    ? history.map((turn) => ({
        role: turn.role === "model" ? "model" : "user",
        parts: [{ text: String(turn.text || "") }],
      }))
    : [];

  const contents = [
    ...priorTurns,
    { role: "user", parts: [{ text: message }] },
  ];

  const systemInstructionText = context
    ? `${SYSTEM_PROMPT}\n\n## CONTEXT\n\n${context}`
    : SYSTEM_PROMPT;

  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstructionText }] },
        contents,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 800,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      res.status(502).json({ error: "Gemini API request failed." });
      return;
    }

    const data = await geminiRes.json();
    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join("") || "Sorry, wala akong masabi ngayon — subukan mo ulit.";

    res.status(200).json({ reply });
  } catch (err) {
    console.error("Chat function error:", err);
    res.status(500).json({ error: "Something went wrong on the server." });
  }
}
