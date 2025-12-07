"use client";

import { useEffect, useState, useMemo } from "react";
import { useGamesStore } from "@/lib/stores/useGamesStore";
import GamerMBTI from "@/app/components/GamerMBTI";
import { Loader2 } from "lucide-react";
import { getCachedGameDetails, setCachedGameDetails } from "@/lib/cache";
import { useI18n } from "@/lib/i18n";
import { AIAnalysisGemini } from "@/components/ai-analysis-gemini";

interface GenreData {
  name: string;
  hours: number;
  gameCount: number;
}

interface GameStats {
  totalGames: number;
  playedGames: number;
  unplayedGames: number;
  totalPlaytimeHours: number;
  averagePlaytimeHours: number;
  topGenres: Array<{ name: string; hours: number; count: number }>;
  topGames: Array<{ name: string; hours: number }>;
  recentlyPlayed: number;
  oldestUnplayed: number;
  singlePlayerRatio: number;
  indieRatio: number;
  completionRate: number;
}

export default function PersonalityPage() {
  const games = useGamesStore((s) => s.games);
  const gamesLoading = useGamesStore((s) => s.gamesLoading);
  const { t } = useI18n();
  const [genreData, setGenreData] = useState<GenreData[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const [progress, setProgress] = useState(0);

  const stats = useMemo((): GameStats => {
    if (games.length === 0) {
      return {
        totalGames: 0,
        playedGames: 0,
        unplayedGames: 0,
        totalPlaytimeHours: 0,
        averagePlaytimeHours: 0,
        topGenres: [],
        topGames: [],
        recentlyPlayed: 0,
        oldestUnplayed: 0,
        singlePlayerRatio: 0,
        indieRatio: 0,
        completionRate: 0,
      };
    }

    const playedGames = games.filter((g) => g.playtime_forever > 0);
    const totalPlaytimeMinutes = games.reduce((sum, g) => sum + g.playtime_forever, 0);
    const totalPlaytimeHours = Math.round(totalPlaytimeMinutes / 60);

    const topGames = playedGames
      .sort((a, b) => b.playtime_forever - a.playtime_forever)
      .slice(0, 5)
      .map((g) => ({
        name: g.name,
        hours: Math.round(g.playtime_forever / 60),
      }));

    const topGenres = genreData.slice(0, 5).map((g) => ({
      name: g.name,
      hours: g.hours,
      count: g.gameCount,
    }));

    const averagePlaytimeHours =
      playedGames.length > 0 ? Math.round(totalPlaytimeHours / playedGames.length) : 0;

    const singlePlayerRatio = 0.7;
    const indieRatio = 0.3;
    const completionRate = 0.5;

    return {
      totalGames: games.length,
      playedGames: playedGames.length,
      unplayedGames: games.length - playedGames.length,
      totalPlaytimeHours,
      averagePlaytimeHours,
      topGenres,
      topGames,
      recentlyPlayed: 0,
      oldestUnplayed: 0,
      singlePlayerRatio,
      indieRatio,
      completionRate,
    };
  }, [games, genreData]);

  useEffect(() => {
    const fetchGenres = async () => {
      if (games.length === 0) return;

      setLoadingGenres(true);

      const topGames = [...games]
        .filter((g) => g.playtime_forever > 0)
        .sort((a, b) => b.playtime_forever - a.playtime_forever)
        .slice(0, 50);

      const genreMap = new Map<string, { hours: number; gameCount: number }>();
      let completed = 0;

      for (const game of topGames) {
        const cached = await getCachedGameDetails(game.appid);

        if (cached) {
          const hours = Math.round(game.playtime_forever / 60);
          cached.genres.forEach((genre) => {
            const existing = genreMap.get(genre) || { hours: 0, gameCount: 0 };
            genreMap.set(genre, {
              hours: existing.hours + hours,
              gameCount: existing.gameCount + 1,
            });
          });
        } else {
          try {
            const res = await fetch(`/api/steam/app/${game.appid}`);
            if (res.ok) {
              const data = await res.json();
              const genres = data.genres?.map((g: { description: string }) => g.description) || [];

              await setCachedGameDetails(
                game.appid,
                genres,
                data.price_overview?.final ? data.price_overview.final / 100 : data.is_free ? 0 : null,
                data.developers || [],
                data.metacritic || null
              );

              const hours = Math.round(game.playtime_forever / 60);
              genres.forEach((genre: string) => {
                const existing = genreMap.get(genre) || { hours: 0, gameCount: 0 };
                genreMap.set(genre, {
                  hours: existing.hours + hours,
                  gameCount: existing.gameCount + 1,
                });
              });
            }
            await new Promise((resolve) => setTimeout(resolve, 80));
          } catch (err) {
            console.error(`Failed to fetch genre for ${game.name}:`, err);
          }
        }

        completed++;
        setProgress(Math.round((completed / topGames.length) * 100));
      }

      const result = Array.from(genreMap.entries())
        .map(([name, data]) => ({ name, hours: data.hours, gameCount: data.gameCount }))
        .sort((a, b) => b.hours - a.hours);

      setGenreData(result);
      setLoadingGenres(false);
    };

    fetchGenres();
  }, [games]);

  if (gamesLoading || loadingGenres) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{t.personality.title}</h1>
          <p className="text-muted-foreground mt-1">{t.personality.subtitle}</p>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{t.common.loading}</p>
            {!gamesLoading && <p className="text-xs text-muted-foreground mt-1">{progress}%</p>}
          </div>
          {!gamesLoading && (
            <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t.personality.title}</h1>
        <p className="text-muted-foreground mt-1">{t.personality.subtitle}</p>
      </div>

      <GamerMBTI games={games} genreData={genreData} />

      <div className="mt-12 pt-8 border-t border-border">
        <h2 className="text-xl font-semibold mb-4">AI 游戏人格分析</h2>
        <AIAnalysisGemini stats={stats} />
      </div>
    </div>
  );
}
