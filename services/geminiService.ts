import { VideoTrack } from "../types";

export const getAIGeneratedTop10 = async (theme: string): Promise<Partial<VideoTrack>[]> => {
  const response = await fetch('/api/gemini/top10', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ theme }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${response.status}: Failed to generate Top 10`);
  }

  const result = await response.json();
  return result.tracks || [];
};
