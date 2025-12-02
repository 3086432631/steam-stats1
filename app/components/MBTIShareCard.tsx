"use client";

import { forwardRef } from "react";
import { Gamepad2, Sparkles } from "lucide-react";

interface MBTIResult {
  mbtiType: string;
  confidence: number;
  dimensions: {
    EI: { result: string; score: number; reason: string };
    SN: { result: string; score: number; reason: string };
    TF: { result: string; score: number; reason: string };
    JP: { result: string; score: number; reason: string };
  };
  personality: {
    title: string;
    subtitle: string;
    description: string;
    strengths: string[];
    signatureGames: Array<{ name: string; reason: string; genre?: string; category?: string }>;
    gamingStyle: {
      playtimePattern: string;
      decisionMaking: string;
      socialPreference: string;
    };
  };
}

interface GameIconMap {
  [gameName: string]: {
    appid: number;
    iconUrl: string;
  };
}

interface MBTIShareCardProps {
  result: MBTIResult;
  totalGames: number;
  totalHours: number;
  userName?: string;
  userAvatar?: string;
  steamId?: string;
  gameIcons?: GameIconMap;
}

// 16personalities official styling - exported for use in other components
export const MBTI_CONFIG: Record<string, {
  name: string;
  slug: string;
  color: string;
  bgColor: string;
  group: string;
  groupColor: string;
}> = {
  // Analysts - Purple
  INTJ: { name: "建筑师", slug: "intj-architect", color: "#88619a", bgColor: "#f3ebf6", group: "分析家", groupColor: "#88619a" },
  INTP: { name: "逻辑学家", slug: "intp-logician", color: "#88619a", bgColor: "#f3ebf6", group: "分析家", groupColor: "#88619a" },
  ENTJ: { name: "指挥官", slug: "entj-commander", color: "#88619a", bgColor: "#f3ebf6", group: "分析家", groupColor: "#88619a" },
  ENTP: { name: "辩论家", slug: "entp-debater", color: "#88619a", bgColor: "#f3ebf6", group: "分析家", groupColor: "#88619a" },
  // Diplomats - Green
  INFJ: { name: "提倡者", slug: "infj-advocate", color: "#33a474", bgColor: "#e8f6ef", group: "外交家", groupColor: "#33a474" },
  INFP: { name: "调停者", slug: "infp-mediator", color: "#33a474", bgColor: "#e8f6ef", group: "外交家", groupColor: "#33a474" },
  ENFJ: { name: "主人公", slug: "enfj-protagonist", color: "#33a474", bgColor: "#e8f6ef", group: "外交家", groupColor: "#33a474" },
  ENFP: { name: "竞选者", slug: "enfp-campaigner", color: "#33a474", bgColor: "#e8f6ef", group: "外交家", groupColor: "#33a474" },
  // Sentinels - Blue
  ISTJ: { name: "物流师", slug: "istj-logistician", color: "#4298b4", bgColor: "#e8f4f8", group: "守护者", groupColor: "#4298b4" },
  ISFJ: { name: "守卫者", slug: "isfj-defender", color: "#4298b4", bgColor: "#e8f4f8", group: "守护者", groupColor: "#4298b4" },
  ESTJ: { name: "总经理", slug: "estj-executive", color: "#4298b4", bgColor: "#e8f4f8", group: "守护者", groupColor: "#4298b4" },
  ESFJ: { name: "执政官", slug: "esfj-consul", color: "#4298b4", bgColor: "#e8f4f8", group: "守护者", groupColor: "#4298b4" },
  // Explorers - Yellow
  ISTP: { name: "鉴赏家", slug: "istp-virtuoso", color: "#e4ae3a", bgColor: "#fdf6e3", group: "探险家", groupColor: "#e4ae3a" },
  ISFP: { name: "探险家", slug: "isfp-adventurer", color: "#e4ae3a", bgColor: "#fdf6e3", group: "探险家", groupColor: "#e4ae3a" },
  ESTP: { name: "企业家", slug: "estp-entrepreneur", color: "#e4ae3a", bgColor: "#fdf6e3", group: "探险家", groupColor: "#e4ae3a" },
  ESFP: { name: "表演者", slug: "esfp-entertainer", color: "#e4ae3a", bgColor: "#fdf6e3", group: "探险家", groupColor: "#e4ae3a" },
};

const MBTIShareCard = forwardRef<HTMLDivElement, MBTIShareCardProps>(
  ({ result, totalGames, totalHours, userName, userAvatar, steamId, gameIcons }, ref) => {
    const config = MBTI_CONFIG[result.mbtiType] || MBTI_CONFIG.INTJ;
    const avatarUrl = `/mbti/${config.slug}.svg`;

    return (
      <div
        ref={ref}
        className="w-[480px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ 
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#ffffff",
        }}
      >
        {/* Header */}
        <div 
          className="relative overflow-hidden"
          style={{ background: config.bgColor }}
        >
          {/* Background pattern */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle at 100% 0%, ${config.color}22 0%, transparent 50%)`,
            }}
          />
          
          <div className="relative p-6">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-4">
              <div 
                className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
                style={{ background: config.color, color: "white" }}
              >
                {config.group}
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: config.color }}>
                <Gamepad2 className="h-4 w-4" />
                <span className="font-medium">Steam Stats</span>
              </div>
            </div>

            {/* Main content */}
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative">
                <img 
                  src={avatarUrl}
                  alt={result.mbtiType}
                  className="w-28 h-28 object-contain"
                />
              </div>
              
              {/* Info */}
              <div className="flex-1">
                <h1 
                  className="text-4xl font-bold tracking-wide mb-1"
                  style={{ color: config.color }}
                >
                  {result.mbtiType}
                </h1>
                <p className="text-xl font-semibold text-gray-800 mb-1">
                  {config.name}
                </p>
                <p className="text-sm text-gray-500">
                  {result.personality.title}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div className="px-6 py-4 bg-white border-b border-gray-100">
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(result.dimensions).map(([key, dim]) => {
              const leftLetter = key[0];
              const rightLetter = key[1];
              const isLeft = dim.result === leftLetter;
              
              return (
                <div key={key} className="text-center">
                  <div className="flex justify-center gap-1 mb-1">
                    <span 
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ 
                        background: isLeft ? config.color : "#e5e7eb",
                        color: isLeft ? "white" : "#9ca3af",
                      }}
                    >
                      {leftLetter}
                    </span>
                    <span 
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ 
                        background: !isLeft ? config.color : "#e5e7eb",
                        color: !isLeft ? "white" : "#9ca3af",
                      }}
                    >
                      {rightLetter}
                    </span>
                  </div>
                  <div 
                    className="text-lg font-bold"
                    style={{ color: config.color }}
                  >
                    {dim.score}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Signature Games */}
        {result.personality.signatureGames?.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Gamepad2 className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                代表游戏
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {result.personality.signatureGames.slice(0, 4).map((game, i) => {
                const iconInfo = gameIcons?.[game.name];
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white border border-gray-100 shadow-sm"
                  >
                    {game.category && (
                      <span 
                        className="text-[8px] px-1.5 py-0.5 rounded text-white font-medium mb-0.5"
                        style={{ background: config.color }}
                      >
                        {game.category}
                      </span>
                    )}
                    {iconInfo?.iconUrl ? (
                      <img 
                        src={iconInfo.iconUrl} 
                        alt={game.name}
                        className="w-9 h-9 rounded-lg shadow-sm"
                      />
                    ) : (
                      <div 
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: config.color }}
                      >
                        {game.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-[9px] font-medium text-gray-700 text-center leading-tight line-clamp-2">
                      {game.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Strengths */}
        {result.personality.strengths?.length > 0 && (
          <div className="px-6 py-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                游戏优势
              </span>
            </div>
            <ul className="space-y-2">
              {result.personality.strengths.slice(0, 3).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span 
                    className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                    style={{ background: config.color }}
                  />
                  <span className="line-clamp-1">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div 
          className="px-6 py-3 flex items-center justify-between"
          style={{ background: config.color }}
        >
          <div className="flex items-center gap-3">
            {userAvatar && (
              <img 
                src={userAvatar} 
                alt={userName || "User"} 
                className="w-8 h-8 rounded-full border-2 border-white/30"
              />
            )}
            <div>
              {userName && (
                <p className="text-sm font-medium text-white">{userName}</p>
              )}
              {steamId && (
                <p className="text-[10px] text-white/60">ID: {steamId}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-white/80">
              <Gamepad2 className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">steamstats.app</span>
            </div>
            <p className="text-[10px] text-white/60 mt-0.5">
              {totalGames} games · {totalHours.toLocaleString()}h
            </p>
          </div>
        </div>
      </div>
    );
  }
);

MBTIShareCard.displayName = "MBTIShareCard";

export default MBTIShareCard;
