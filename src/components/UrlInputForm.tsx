import React, { useRef, useEffect } from 'react';

interface UrlInputFormProps {
  url: string;
  setUrl: (url: string) => void;
  title: string;
  setTitle: (title: string) => void;
  channel: string;
  setChannel: (channel: string) => void;
  screenshot: string | null;
  setScreenshot: (screenshot: string | null) => void;
  transcript: string;
  setTranscript: (transcript: string) => void;
  onAnalyze: (url: string, title: string, channel: string, screenshot: string | null, transcript: string) => void;
  isLoading: boolean;
}

const UrlInputForm: React.FC<UrlInputFormProps> = ({ 
    url, setUrl, 
    title, setTitle, 
    channel, setChannel, 
    screenshot, setScreenshot,
    transcript, setTranscript,
    onAnalyze, isLoading 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      // Allow pasting text in text fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
              setScreenshot(loadEvent.target?.result as string);
            };
            reader.readAsDataURL(blob);
            event.preventDefault();
            return; 
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [setScreenshot]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze(url, title, channel, screenshot, transcript);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setScreenshot(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }
  
  const hasTranscript = transcript.trim().length > 0;
  const submitButtonText = hasTranscript ? 'Transkript analysieren' : 'Analysieren';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=..."
        className="w-full bg-gray-800 border border-gray-600 rounded-md py-3 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
        disabled={isLoading}
      />
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Videotitel (optional, überschreibt autom. Erkennung)"
        className="w-full bg-gray-800 border border-gray-600 rounded-md py-3 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
        disabled={isLoading}
      />
      <input
        type="text"
        value={channel}
        onChange={(e) => setChannel(e.target.value)}
        placeholder="Kanalname (optional, überschreibt autom. Erkennung)"
        className="w-full bg-gray-800 border border-gray-600 rounded-md py-3 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
        disabled={isLoading}
      />

      {screenshot ? (
        <div className="relative group bg-gray-800 border border-gray-600 rounded-md p-2">
            <img src={screenshot} alt="Screenshot Vorschau" className="max-h-32 w-auto rounded-md" />
            <button 
                type="button" 
                onClick={handleRemoveScreenshot}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Screenshot entfernen"
                disabled={isLoading}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
      ) : (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                disabled={isLoading}
            />
            <button
                type="button"
                onClick={handleUploadClick}
                disabled={isLoading}
                className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-gray-300 font-medium py-3 px-4 rounded-md transition-colors duration-200 border border-dashed border-gray-500"
            >
                Screenshot hinzufügen (oder per Strg+V einfügen)
            </button>
        </>
      )}

        <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Transkript hier einfügen (optional) - für höchste Genauigkeit"
            className="w-full bg-gray-800 border border-gray-600 rounded-md py-3 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition h-32 resize-y"
            disabled={isLoading}
        />


      <button
        type="submit"
        disabled={isLoading}
        className="bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-md transition-all duration-300 ease-in-out flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verarbeite...
          </>
        ) : (
          submitButtonText
        )}
      </button>
    </form>
  );
};

export default UrlInputForm;
