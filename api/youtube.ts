// This is the only file that should be in your `youtube-api-proxy` repository.
// It acts as a secure backend function on Vercel.

export const config = {
  runtime: 'edge',
};

// This function handles requests to /api/youtube
export default async function handler(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');
  const apiKey = process.env.YOUTUBE_API_KEY; // Securely loaded from Vercel environment variables

  // Input validation
  if (!videoId) {
    return new Response(JSON.stringify({ error: 'The videoId parameter is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!apiKey) {
    // This error indicates a server configuration issue.
    return new Response(JSON.stringify({ error: 'The YouTube API key is not configured on the server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const snippet = data.items[0].snippet;
      const videoInfo = {
        title: snippet.title,
        channel: snippet.channelTitle,
      };
      // Success: Return the video metadata
      return new Response(JSON.stringify(videoInfo), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // The video ID was not found by the YouTube API
      return new Response(JSON.stringify({ error: 'Video not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error fetching from YouTube API:', error);
    return new Response(JSON.stringify({ error: 'An internal error occurred while fetching from the YouTube API.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
