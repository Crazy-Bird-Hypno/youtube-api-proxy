// De// In der Datei: /api/youtube.ts
export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');
  // Sicher aus Vercel Umgebungsvariablen geladen
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!videoId) {
    return new Response(JSON.stringify({ error: 'videoId ist erforderlich' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API-Schlüssel nicht auf dem Server konfiguriert' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`YouTube API antwortete mit Status: ${response.status}`);
    }
    const data = await response.json();

    if (data.items?.length > 0) {
      const { title, channelTitle } = data.items[0].snippet;
      return new Response(JSON.stringify({ title, channel: channelTitle }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } else {
      return new Response(JSON.stringify({ error: 'Video nicht gefunden' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    console.error("Fehler im API-Proxy:", error);
    return new Response(JSON.stringify({ error: 'Fehler beim Abrufen von der YouTube-API' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
