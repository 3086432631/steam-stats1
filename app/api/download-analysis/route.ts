import { NextRequest, NextResponse } from "next/server";

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

export async function POST(request: NextRequest) {
  try {
    const { stats, aiAnalysis, model }: {
      stats: GameStats;
      aiAnalysis: string;
      model: string;
    } = await request.json();

    // 生成分析数据文本
    const analysisText = generateAnalysisText(stats, aiAnalysis, model);

    // 返回下载响应
    return new NextResponse(analysisText, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="steam-personality-analysis.txt"',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error("Download generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate analysis file" },
      { status: 500 }
    );
  }
}

function generateAnalysisText(stats: GameStats, aiAnalysis: string, model: string): string {
  const topGamesList = stats.topGames
    .map((g, i) => `${i + 1}. 《${g.name}》: ${g.hours}小时`)
    .join("\n");

  const topGenresList = stats.topGenres
    .map((g, i) => `${i + 1}. ${g.name}: ${g.hours}小时, ${g.count}款游戏`)
    .join("\n");

  let reviewsSection = "";
  if (stats.reviews && stats.reviews.reviews.length > 0) {
    const reviewsList = stats.reviews.reviews
      .map((r) => {
        const sentiment = r.recommended ? "👍 推荐" : "👎 不推荐";
        return `- 《${r.gameName}》(${r.hoursPlayed}小时) ${sentiment}\n  评测: "${r.reviewText}"`;
      })
      .join("\n");
    
    reviewsSection = `
## 玩家评测
- 评测总数：${stats.reviews.totalReviews}篇
${reviewsList}`;
  }

  const promptForAI = `
基于以下Steam游戏数据，请分析这位玩家的游戏人格特征、性格特点和心理倾向。

## 游戏数据统计

### 基本信息
- 总游戏数：${stats.totalGames}款
- 已玩游戏：${stats.playedGames}款
- 未玩游戏：${stats.unplayedGames}款
- 总游戏时长：${stats.totalPlaytimeHours}小时
- 平均游戏时长：${stats.averagePlaytimeHours}小时

### 游戏偏好分析
- 单人游戏比例：${Math.round(stats.singlePlayerRatio * 100)}%
- 独立游戏比例：${Math.round(stats.indieRatio * 100)}%
- 游戏完成率：${Math.round(stats.completionRate * 100)}%

### 热门游戏排行
${topGamesList}

### 偏爱的游戏类型
${topGenresList}
${reviewsSection}

## 分析要求

请从以下维度进行深入分析，每个维度都要有具体的数据支撑：

1. **游戏人格类型**：根据游戏偏好判断玩家属于哪种游戏人格类型
2. **性格特征分析**：
   - 冒险精神 vs 稳健保守
   - 社交倾向 vs 独立独行
   - 完美主义 vs 随性体验
   - 怀旧情怀 vs 追求新潮
3. **认知模式**：通过游戏选择偏好推断认知特点
4. **情感表达**：从游戏类型和评测风格分析情感特征
5. **生活方式暗示**：游戏习惯反映的生活态度和价值观

请用中文回复，采用轻松有趣的语气，像是在为朋友做性格分析。每个结论都要有数据支撑，避免空泛的描述。最后可以给出一些个性化的游戏推荐建议。
`;

  return `Steam 游戏人格分析报告
==============================
生成时间: ${new Date().toLocaleString('zh-CN')}
分析模型: ${model}

数据概览
--------
- 总游戏数: ${stats.totalGames}款
- 已玩游戏: ${stats.playedGames}款  
- 未玩游戏: ${stats.unplayedGames}款
- 总游戏时长: ${stats.totalPlaytimeHours}小时
- 平均游戏时长: ${stats.averagePlaytimeHours}小时

游戏偏好
--------
- 单人游戏比例: ${Math.round(stats.singlePlayerRatio * 100)}%
- 独立游戏比例: ${Math.round(stats.indieRatio * 100)}%
- 游戏完成率: ${Math.round(stats.completionRate * 100)}%

热门游戏排行
------------
${topGamesList}

偏爱的游戏类型
--------------
${topGenresList}
${reviewsSection}

AI 人格分析结果
===============
${aiAnalysis}

用于分析的提示词
================
如果您想自己分析这些数据，可以使用以下提示词：

${promptForAI}

使用说明
--------
1. 您可以将上述提示词发送给任何AI助手进行分析
2. 数据包含您的Steam游戏统计信息
3. 分析结果仅供参考和娱乐

数据隐私
--------
此文件包含您的个人游戏数据，请妥善保管。
`;
}