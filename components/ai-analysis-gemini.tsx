"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Download, Brain } from "lucide-react";
import { toast } from "sonner";

interface GameStats {
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

interface AIAnalysisGeminiProps {
  stats: GameStats;
  onAnalysisComplete?: (analysis: string) => void;
}

export function AIAnalysisGemini({ stats, onAnalysisComplete }: AIAnalysisGeminiProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleGeminiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze-personality-gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stats),
      });

      if (!response.ok) {
        throw new Error("分析失败");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setAiPrompt(data.prompt);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(data.analysis);
      }
      
      toast.success("AI分析完成！");
    } catch (error) {
      console.error("分析错误:", error);
      toast.error("分析失败，请重试");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadAnalysis = async () => {
    if (!analysis) {
      toast.error("请先进行AI分析");
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch("/api/download-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stats,
          aiAnalysis: analysis,
          model: "Google Gemini 2.0 Flash"
        }),
      });

      if (!response.ok) {
        throw new Error("下载失败");
      }

      // 创建下载链接
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `steam-personality-analysis-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("分析报告已下载！");
    } catch (error) {
      console.error("下载错误:", error);
      toast.error("下载失败，请重试");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyPrompt = () => {
    if (aiPrompt) {
      navigator.clipboard.writeText(aiPrompt);
      toast.success("提示词已复制到剪贴板！");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleGeminiAnalysis}
          disabled={isAnalyzing}
          className="flex-1"
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              AI分析中...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              使用 Gemini 分析游戏人格
            </>
          )}
        </Button>

        {analysis && (
          <Button
            onClick={handleDownloadAnalysis}
            disabled={isDownloading}
            variant="outline"
            size="lg"
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                准备下载...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                下载分析报告
              </>
            )}
          </Button>
        )}
      </div>

      {aiPrompt && (
        <Alert>
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">💡 提示词已生成</p>
              <p className="text-sm text-muted-foreground">
                您可以复制这个提示词，发送给任何AI助手进行分析
              </p>
              <Button
                onClick={handleCopyPrompt}
                variant="ghost"
                size="sm"
                className="mt-2"
              >
                复制提示词
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>🎮 AI 游戏人格分析</CardTitle>
            <CardDescription>
              基于 Google Gemini 2.0 Flash 模型分析结果
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {analysis}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}