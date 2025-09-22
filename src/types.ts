export interface Chapter {
  timestamp: string;
  title: string;
}

export interface AnalysisData {
  summary: string;
  creator: string;
  channel: string;
  chapters: Chapter[];
}

export interface VideoInfo {
  title: string;
  channel: string;
}
