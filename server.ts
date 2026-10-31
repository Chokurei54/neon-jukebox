import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Top 10 Jukebox generation endpoint
app.post('/api/gemini/top10', async (req: Request, res: Response) => {
  try {
    const { theme } = req.body;
    const promptTheme = (theme && typeof theme === 'string' && theme.trim().length > 0)
      ? theme.trim()
      : 'Hits del Momento';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Genera una classifica Top 10 di canzoni per jukebox basata sul tema: "${promptTheme}". Fornisci solo dati realistici di canzoni celebri o rilevanti. Per ciascun brano includi titolo, artista, una breve curiosità/descrizione e se possibile un link di YouTube verosimile (es: https://www.youtube.com/watch?v=...).`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Titolo della canzone' },
              artist: { type: Type.STRING, description: "Nome dell'artista" },
              description: { type: Type.STRING, description: 'Una breve curiosità sulla canzone' },
              youtubeUrl: { type: Type.STRING, description: 'Un link verosimile di YouTube (opzionale)' }
            },
            required: ['title', 'artist']
          }
        }
      }
    });

    const text = response.text ?? '[]';
    let data = [];
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError, text);
    }

    res.json({ success: true, tracks: data });
  } catch (error: any) {
    console.error('Gemini Top10 Generation Error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Errore durante la generazione della classifica'
    });
  }
});

// Generic text generation endpoint for future extension
app.post('/api/gemini/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Gemini Generate Error:', error);
    res.status(500).json({ error: error?.message || 'Error generating content' });
  }
});

// Streaming generation endpoint (SSE)
app.post('/api/gemini/stream', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    for await (const chunk of stream) {
      const text = chunk.text || '';
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Gemini Stream Error:', error);
    res.write(`data: ${JSON.stringify({ error: error?.message || 'Stream error' })}\n\n`);
    res.end();
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
