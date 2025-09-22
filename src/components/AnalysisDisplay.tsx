import React from 'react';
import { AnalysisData, Chapter } from '../types';
import CopyButton from './CopyButton';
import Loader from './Loader';

interface AnalysisDisplayProps {
  analysis: AnalysisData;
  selectedChapters: Set<Chapter>;
  onChapterToggle: (chapter: Chapter) => void;
  onTranscribe: () => void;
  isTranscribing: boolean;
  transcription: string;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
    <h3 className="text-xl font-semibold text-red-400 mb-3">{title}</h3>
    <div className="text-gray-300 prose prose-invert max-w-none">{children}</div>
  </div>
);

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({
  analysis,
  selectedChapters,
  onChapterToggle,
  onTranscribe,
  isTranscribing,
  transcription,
}) => {
  return (
    <div className="space-y-8">
      {/* Summary and Creator Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <InfoCard title="Zusammenfassung">
          <p>{analysis.summary}</p>
        </InfoCard>
        <InfoCard title="Kanalinformationen">
          <p><strong>Ersteller:</strong> {analysis.creator}</p>
          <p><strong>Kanal:</strong> {analysis.channel}</p>
        </InfoCard>
      </div>

      {/* Chapters Section */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-red-400 mb-4">Kapitel</h3>
        <p className="text-gray-400 mb-4">Wählen Sie die Passagen aus, die transkribiert werden sollen.</p>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {analysis.chapters.map((chapter, index) => (
            <label
              key={index}
              className="flex items-center p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedChapters.has(chapter)}
                onChange={() => onChapterToggle(chapter)}
                className="h-5 w-5 rounded bg-gray-800 border-gray-600 text-red-500 focus:ring-red-600"
              />
              <span className="ml-4 font-mono text-sm text-red-300">{chapter.timestamp}</span>
              <span className="ml-4 text-gray-200">{chapter.title}</span>
            </label>
          ))}
        </div>
        <div className="mt-6">
          <button
            onClick={onTranscribe}
            disabled={isTranscribing || selectedChapters.size === 0}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-md transition-all duration-300 ease-in-out flex items-center justify-center"
          >
            {isTranscribing ? 'Transkribiere...' : `Ausgewählte Kapitel transkribieren (${selectedChapters.size})`}
          </button>
        </div>
      </div>
      
      {isTranscribing && <div className="flex justify-center pt-4"><Loader /></div>}

      {transcription && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
           <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-red-400">Transkription für Obsidian</h3>
                <CopyButton textToCopy={transcription} />
           </div>
          <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono text-sm text-gray-300">
            <code>{transcription}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

export default AnalysisDisplay;
