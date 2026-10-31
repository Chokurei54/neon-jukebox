import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";

const reply = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

const clip = (v: unknown, max: number) => String(v ?? "").slice(0, max);

export default async (req: Request) => {
  try {
    const store = getStore("jukebox");
    const secret = process.env.ADMIN_PASSWORD;
    const isAdmin = !!secret && req.headers.get("x-admin-password") === secret;

    // Tutti possono LEGGERE la classifica
    if (req.method === "GET") {
      const tracks = await store.get("tracks", { type: "json" });
      return reply({ tracks: tracks ?? null });
    }

    // Controllo password (login)
    if (req.method === "POST") {
      return isAdmin ? reply({ ok: true }) : reply({ error: "Password errata" }, 401);
    }

    // Solo l'admin può SALVARE
    if (req.method === "PUT") {
      if (!isAdmin) return reply({ error: "Non autorizzato" }, 401);
      const body = await req.json();
      if (!Array.isArray(body?.tracks) || body.tracks.length > 100) {
        return reply({ error: "Dati non validi" }, 400);
      }
      const clean = body.tracks.map((t: any, i: number) => ({
        id: clip(t?.id, 64) || crypto.randomUUID(),
        rank: i + 1,
        title: clip(t?.title, 200),
        artist: clip(t?.artist, 200),
        youtubeUrl: clip(t?.youtubeUrl, 500),
        description: clip(t?.description, 1000),
      }));
      await store.setJSON("tracks", clean);
      return reply({ ok: true });
    }

    return reply({ error: "Method not allowed" }, 405);
  } catch (e: any) {
    console.error("ERRORE TRACKS:", e);
    return reply({ error: e?.message || "Errore" }, 500);
  }
};

export const config: Config = { path: "/api/tracks" };
