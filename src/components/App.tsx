import React, { useState, useCallback } from 'react';
import { AnalysisData, Chapter } from './types';
import { analyzeVideoContent, fetchVideoMetadata, transcribeChapters } from './services/geminiService';
import UrlInputForm from './components/UrlInputForm';
import AnalysisDisplay from './components/AnalysisDisplay';
import Loader from './components/Loader';
import { YouTubeIcon } from './components/icons/YouTubeIcon';
import { parseYouTubeVideoId } from './utils/youtube';

const App: React.FC = () => {
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [channel, setChannel] = useState<string>('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [selectedChapters, setSelectedChapters] = useState<Set<Chapter>>(new Set());
  const [transcription, setTranscription] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const resetState = () => {
    setError('');
    setAnalysis(null);
    setTranscription('');
    setSelectedChapters(new Set());
  };

  const handleAnalyze = async (url: string, title: string, channelName: string, screenshotData: string | null, transcriptContent: string) => {
    if (!url && !transcriptContent.trim()) {
      setError('Bitte geben Sie eine YouTube-URL oder ein Transkript ein.');
      return;
    }
    
    resetState();
    setIsLoading(true);

    try {
      let finalTitle = title;
      let finalChannel = channelName;

      if (transcriptContent.trim()) {
        setLoadingMessage('Analysiere Transkript...');
        // Wenn ein Transkript vorhanden ist, verwenden wir das für die Analyse.
        finalTitle = title || "Aus Transkript";
        finalChannel = channelName || "Unbekannt";
      } else {
         // Der neue, robuste API-Workflow
        setLoadingMessage('Rufe Video-Informationen ab...');
        const videoId = parseYouTubeVideoId(url);
        if (!videoId) {
          throw new Error("Ungültige YouTube URL. Video-ID konnte nicht extrahiert werden.");
        }

        // Schritt 1: Metadaten über die sichere API-Route abrufen
        const videoInfo = await fetchVideoMetadata(videoId);
        finalTitle = videoInfo.title;
        finalChannel = videoInfo.channel;
        setLoadingMessage('Analysiere Video...');
      }
      
      // Schritt 2: Detaillierte Analyse mit den verifizierten Metadaten durchführen
      const result = await analyzeVideoContent(url, finalTitle, finalChannel, screenshotData, transcriptContent);
      setAnalysis(result);

    } catch (e: any) {
      console.error(e);
      setError(`Ein Fehler ist aufgetreten: ${e.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };


  const handleChapterToggle = useCallback((chapter: Chapter) => {
    setSelectedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapter)) {
        newSet.delete(chapter);
      } else {
        newSet.add(chapter);
      }
      return newSet;
    });
  }, []);

  const handleTranscribe = async () => {
    if (selectedChapters.size === 0 || !analysis) {
      setError('Bitte wählen Sie mindestens ein Kapitel zum Transkribieren aus.');
      return;
    }
    setIsTranscribing(true);
    setError('');
    setTranscription('');
    try {
      const result = await transcribeChapters(analysis.summary, Array.from(selectedChapters));
      setTranscription(result);
    } catch (e) {
      console.error(e);
      setError('Fehler bei der Transkription. Bitte versuchen Sie es erneut.');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <YouTubeIcon className="h-12 w-12 text-red-500" />
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
              YouTube Video Analyzer
            </h1>
          </div>
          <p className="text-lg text-gray-400">
            Fügen Sie eine YouTube-URL ein, um eine Zusammenfassung, Kapitel und Transkriptionen zu erhalten.
          </p>
        </header>

        <main>
          <UrlInputForm
            url={youtubeUrl}
            setUrl={setYoutubeUrl}
            title={videoTitle}
            setTitle={setVideoTitle}
            channel={channel}
            setChannel={setChannel}
            screenshot={screenshot}
            setScreenshot={setScreenshot}
            transcript={transcript}
            setTranscript={setTranscript}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
          />
          
          {error && <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">{error}</div>}
          
          {isLoading && (
            <div className="mt-8 flex justify-center">
              <Loader message={loadingMessage} />
            </div>
          )}
          
          {analysis && !isLoading && (
            <div className="mt-8 space-y-8">
              <AnalysisDisplay
                analysis={analysis}
                selectedChapters={selectedChapters}
                onChapterToggle={handleChapterToggle}
                onTranscribe={handleTranscribe}
                isTranscribing={isTranscribing}
                transcription={transcription}
              />
            </div>
          )}
        </main>
        <footer className="text-center mt-12 text-gray-500 text-sm">
            <p>Powered by Gemini & YouTube API</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
