export interface SentimentData {
  sentiment: string;
  confidence: number;
  reason: string;
}

export interface UrlEntry {
  id: string;
  url: string;
  upvotes: number;
  sentiment?: SentimentData;
  isAnalyzingSentiment?: boolean;
  sentimentError?: string;
}
