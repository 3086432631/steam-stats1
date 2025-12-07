"use client";

import { useState } from "react";
import { GameStats, AIAnalysisGeminiProps } from "./ai-analysis-types";

export function AIAnalysisGemini({ stats, onAnalysisComplete }: AIAnalysisGeminiProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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
      
      alert("AI分析完成！");
    } catch (error) {
      console.error("分析错误:", error);
      alert("分析失败，请重试");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadAnalysis = async () => {
    if (!analysis) {
      alert("请先进行AI分析");
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

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `steam-personality-analysis-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert("分析报告已下载！");
    } catch (error) {
      console.error("下载错误:", error);
      alert("下载失败，请重试");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyPrompt = async () => {
    if (!aiPrompt) return;
    
    try {
      await navigator.clipboard.writeText(aiPrompt);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      alert("复制失败，请手动复制");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleGeminiAnalysis}
          disabled={isAnalyzing}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin mr-2">⏳</span>
              AI分析中...
            </span>
          ) : (
            <span>🧠 使用 Gemini 分析游戏人格</span>
          )}
        </button>

        {analysis && (
          <button
            onClick={handleDownloadAnalysis}
            disabled={isDownloading}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⏳</span>
                准备下载...
              </span>
            ) : (
              <span>📥 下载分析报告</span>
            )}
          </button>
        )}
      </div>

      {aiPrompt && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="font-medium mb-2">💡 提示词已生成</p>
          <p className="text-sm text-gray-600 mb-3">
            您可以复制这个提示词，发送给任何AI助手进行分析
          </p>
          <button
            onClick={handleCopyPrompt}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            {copySuccess ? "✅ 已复制！" : "复制提示词"}
          </button>
          <pre className="mt-3 p-3 bg-white rounded text-xs overflow-auto max-h-40">
            {aiPrompt}
          </pre>
        </div>
      )}

      {analysis && (
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">🎮 AI 游戏人格分析</h3>
          <p className="text-sm text-gray-500 mb-4">基于 Google Gemini 2.0 Flash 模型分析结果</p>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {analysis}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
