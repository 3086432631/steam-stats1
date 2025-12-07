"use client";

import { useEffect, useState, useMemo } from "react";
import { useGamesStore } from "@/lib/stores/useGamesStore";
import GamerMBTI from "@/app/components/GamerMBTI";
import { Loader2 } from "lucide-react";
import { getCachedGameDetails, setCachedGameDetails } from "@/lib/cache";
import { useI18n } from "@/lib/i18n";
import { AIAnalysisGemini } from "@/components/ai-analysis-gemini";
// 引入正确的类型定义
import { GameStats, GenreData } from "@/components/ai-analysis-types";

export default function PersonalityPage() {
  const games = useGamesStore((s) => s.games);
  const gamesLoading = useGamesStore((s) => s.gamesLoading);
  const { t } = useI18n();
  const [genreData, setGenreData] = useState<GenreData[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const [progress, setProgress] = useState(0);
}
  // 构建符合 GameStats 接口的数据
  const stats = useMemo((): GameStats => {
    // 1. 处理空数据情况
    if (games.length === 0) {
      return {
        totalGames: 0,
        totalHours: "0",
        mostPlayedGame: { name: "无", hours: "0" },
        favoriteGenre: { genre: "无", percentage: "0%" },
        recentActivity: "无",
        completionRate: "0%",
        genreBreakdown: []
      };
    }

    // 2. 计算基础数据
    const playedGames = games.filter((g) => g.playtime_forever > 0);
    const totalPlaytimeMinutes = games.reduce((sum, g) => sum + g.playtime_forever, 0);
    const totalPlaytimeHours = Math.round(totalPlaytimeMinutes / 60);

    // 3. 计算最常玩的游戏
    const sortedByPlaytime = [...playedGames].sort((a, b) => b.playtime_forever - a.playtime_forever);
    const mostPlayed = sortedByPlaytime[0] 
      ? { 
          name: sortedByPlaytime[0].name, 
          hours: Math.round(sortedByPlaytime[0].playtime_forever / 60).toString() 
        }
      : { name: "无", hours: "0" };

    // 4. 计算最爱类型
    const favGenre = genreData[0] 
      ? {
          genre: genreData[0].name,
          percentage: totalPlaytimeHours > 0 
            ? Math.round((genreData[0].hours / totalPlaytimeHours) * 100) + "%" 
            : "0%"
        }
      : { genre: "无", percentage: "0%" };

    // 5. 返回符合接口规范的对象
    return {
      totalGames: games.length,
      totalHours: totalPlaytimeHours.toString(),
      mostPlayedGame: mostPlayed,
      favoriteGenre: favGenre,
      recentActivity: "最近活跃", // 这里可以根据实际需求完善逻辑
      completionRate: "50%",     // 这里可以根据实际需求完善逻辑
      genreBreakdown: genreData,
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
            // 避免请求过快
            await new Promise((resolve) => setTimeout(resolve, 80));
          } catch (err) {
            console.error(`Failed to fetch genre for ${game.name}:`, err);
          }
        }

        completed++;
        setProgress(Math.round((completed / topGames.length) * 100));
      }

      // 转换为数组并排序
      const result = Array.from(genreMap.entries())
        。map(([name， data]) => ({ name， hours: data.hours， gameCount: data.gameCount }))
        。sort((a， b) => b.hours - a.hours);

      setGenreData(result);
      setLoadingGenres(false);
    };

    fetchGenres();
  }， [games]);

  if (gamesLoading || loadingGenres) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{t.personality。title}</h1>
          <p className="text-muted-foreground mt-1">{t.personality。subtitle}</p>
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
