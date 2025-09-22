/**
 * Extrahiert die YouTube-Video-ID aus verschiedenen URL-Formaten.
 * @param url Die YouTube-URL.
 * @returns Die Video-ID als String oder null, wenn keine gefunden wurde.
 */
export function parseYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,      // Standard watch URL
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-P_-]{11})/,                // Shortened youtu.be URL
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,         // Embed URL
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,             // v URL
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/         // Shorts URL
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Fallback für einfache IDs, die direkt eingefügt werden
  if (url.length === 11 && !url.includes('/') && !url.includes('?')) {
    return url;
  }

  return null;
}
