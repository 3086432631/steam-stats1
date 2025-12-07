// components/ai-analysis-types.ts
export interface GameStats {
  totalGames: number;
  playedGames: number;
  unplayedGames: number;
  totalPlaytimeHours: number;
  averagePlaytimeHours: number;
  topGenres: Array<{
    name: string;
    hours: number;
    count: number;
  }>;
  topGames: Array<{
    name: string;
    hours: number;
  }>;
  recentlyPlayed: number;
  oldestUnplayed: number;
  singlePlayerRatio: number;
  indieRatio: number;
  completionRate: number;
  reviews?: {
    totalReviews: number;
    reviews: Array<{
      gameName: string;
      recommended: boolean;
      reviewText: string;
      hoursPlayed: string;
    }>;
  };
}

export interface AIAnalysisGeminiProps {
  stats: GameStats;
  onAnalysisComplete?: (analysis: string) => void;
}
