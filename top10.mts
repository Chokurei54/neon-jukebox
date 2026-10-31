import { GoogleGenAI, Type } from "@google/genai";
import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  try {
    const { theme } = await req.json();
    const promptTheme =
      typeof theme === "string" && theme.trim() ? theme.trim() : "Hits del Momento";

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Genera una classifica Top 10 di canzoni per jukebox basata sul tema: "${promptTheme}". Fornisci solo dati realistici di canzoni celebri o rilevanti. Per ciascun brano includi titolo, artista, una breve curiosità/descrizione e se possibile un link di YouTube verosimile (es: https://www.youtube.com/watch?v=...).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              description: { type: Type.STRING },
              youtubeUrl: { type: Type.STRING },
            },
            required: ["title", "artist"],
          },
        },
      },
    });

    let tracks = [];
    try { tracks = JSON.parse(response.text ?? "[]"); } catch {}
    return Response.json({ success: true, tracks });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || "Errore" }, { status: 500 });
  }
};

export const config: Config = { path: "/api/gemini/top10" };
