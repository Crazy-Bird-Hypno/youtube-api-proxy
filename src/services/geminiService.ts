import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisData, Chapter, VideoInfo } from '../types';

let ai: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (ai) {
    return ai;
  }
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai;
  }
  throw new Error("Gemini API-Schlüssel ist nicht konfiguriert. Bitte stellen Sie sicher, dass die Umgebungsvariable API_KEY gesetzt ist.");
}


const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Eine detaillierte, aber prägnante Zusammenfassung des Video-Hauptinhalts, ohne Sponsoren oder Werbung."
    },
    creator: {
      type: Type.STRING,
      description: "Der Name des Erstellers oder Hauptmoderators des Videos. Falls nicht ersichtlich, den Kanalnamen verwenden."
    },
    channel: {
      type: Type.STRING,
      description: "Der Name des YouTube-Kanals."
    },
    chapters: {
      type: Type.ARRAY,
      description: "Eine Liste der Videokapitel, die sich auf den Hauptinhalt konzentrieren, mit Zeitstempeln und Titeln.",
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: {
            type: Type.STRING,
            description: "Der Startzeitstempel des Kapitels im Format MM:SS oder HH:MM:SS."
          },
          title: {
            type: Type.STRING,
            description: "Der Titel des Kapitels."
          }
        },
        required: ["timestamp", "title"]
      }
    }
  },
  required: ["summary", "creator", "channel", "chapters"]
};

/**
 * Ruft Metadaten von der YouTube Data API über einen sicheren Backend-Proxy ab.
 * @param videoId Die eindeutige ID des YouTube-Videos.
 * @returns Ein Promise, das zu einem VideoInfo-Objekt mit Titel und Kanal auflöst.
 */
export async function fetchVideoMetadata(videoId: string): Promise<VideoInfo> {
    try {
        const proxyUrl = `https://youtube-api-proxy-dusky.vercel.app/api/youtube?videoId=${videoId}`;
        
        const response = await fetch(proxyUrl);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `Fehler vom Server: ${response.status}` }));
            throw new Error(errorData.error || `Fehler vom Server: ${response.status}`);
        }
        const data = await response.json();
        return data as VideoInfo;
    } catch (error) {
        console.error("Fehler beim Abrufen der YouTube-Metadaten:", error);
        throw new Error("Konnte Video-Informationen nicht abrufen. Ist der Backend-Proxy korrekt konfiguriert und die URL in geminiService.ts angepasst?");
    }
}


export async function analyzeVideoContent(
    url: string, 
    title: string, 
    channel: string, 
    screenshotDataUrl?: string | null,
    transcript?: string
): Promise<AnalysisData> {
  
  const promptParts: (string|any)[] = [];
  let contents: any;

  if (transcript && transcript.trim().length > 0) {
    promptParts.push(`Sie sind ein Experte für Inhaltsanalyse. Basierend AUSSCHLIESSLICH auf dem folgenden Transkript, erstellen Sie eine Zusammenfassung und eine detaillierte Kapitelaufteilung.`);
    promptParts.push(`Der Titel lautet "${title}" und der Kanal ist "${channel}", falls relevant.`);
    promptParts.push(`TRANSKRIPT:\n\n${transcript}`);
    contents = promptParts.join('\n\n');
  } else {
    promptParts.push(`Analysieren Sie das YouTube-Video unter der URL "${url}".`);
    promptParts.push(`Das Video wurde via API als **"${title}"** vom Kanal **"${channel}"** identifiziert. Dies ist die 100% korrekte Information.`);
    
    if (screenshotDataUrl) {
      promptParts.push(`Ein Screenshot wurde zur Verfügung gestellt, um den visuellen Kontext zu geben.`);
    }
    
    promptParts.push(`
**Ihre Aufgabe:**
1.  **Fokus:** Konzentrieren Sie sich auf den Inhalt des Videos.
2.  **Filtern:** Ignorieren Sie rigoros Sponsoren, Werbung, und Bitten um Likes/Abonnements.
3.  **Erstellen:** Erstellen Sie eine Zusammenfassung und Kapitel gemäß dem JSON-Schema. Der Kanalname MUSS "${channel}" sein.`);
    
    const textPrompt = promptParts.join('\n\n');
    
    if (screenshotDataUrl) {
        const [meta, base64Data] = screenshotDataUrl.split(',');
        const mimeType = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';
        const imagePart = { inlineData: { mimeType, data: base64Data } };
        const textPart = { text: textPrompt };
        contents = { parts: [imagePart, textPart] };
    } else {
        contents = textPrompt;
    }
  }

  try {
    const localAi = getAiClient();
    const response = await localAi.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
        },
    });

    const jsonString = response.text.trim();
    const cleanedJson = jsonString.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const parsedData = JSON.parse(cleanedJson);

    if (!parsedData.summary || !parsedData.chapters || !Array.isArray(parsedData.chapters)) {
        throw new Error("Ungültige Datenstruktur von der API empfangen.");
    }
    return parsedData as AnalysisData;
  } catch (error) {
    console.error("Fehler bei der Inhaltsanalyse:", error);
    throw new Error(`Video konnte nicht analysiert werden: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function transcribeChapters(summary: string, chapters: Chapter[]): Promise<string> {
    const chapterTitles = chapters.map(c => `"${c.title}" bei ${c.timestamp}`).join(', ');
    const prompt = `Sie sind ein KI-Transkriptionsdienst. Basierend auf der folgenden Videozusammenfassung, erstellen Sie bitte eine detaillierte, plausible Transkription NUR für die ausgewählten Kapitel.
    
Video-Zusammenfassung: "${summary}"

Ausgewählte Kapitel zur Transkription: ${chapterTitles}

Formatieren Sie die Ausgabe als Markdown, das für Obsidian geeignet ist. Jedes Kapitel sollte eine Überschrift der Ebene 2 (##) sein, gefolgt von der Transkription. Der Text sollte gut strukturiert und lesbar sein. Fügen Sie keine zusätzlichen Kommentare hinzu, sondern nur die formatierten Transkriptionen.`;

    try {
        const localAi = getAiClient();
        const response = await localAi.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Fehler bei der Transkription der Kapitel:", error);
        throw new Error(`Kapitel konnten nicht transkribiert werden: ${error instanceof Error ? error.message : String(error)}`);
    }
}
