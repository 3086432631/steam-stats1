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
    const stats: GameStats = await request.json();
    
    // 检查 Gemini API 密钥
    const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const topGamesList = stats.topGames
      .map((g, i) => `${i + 1}. 《${g.name}》: ${g.hours}小时`)
      .join("\n");

    const topGenresList = stats.topGenres
      .map((g, i) => `${i + 1}. ${g.name}: ${g.hours}小时, ${g.count}款游戏`)
      .join("\n");

    // Format reviews if available
    let reviewsSection = "";
    if (stats.reviews && stats.reviews.reviews.length > 0) {
      const reviewsList = stats.reviews.reviews
        .map((r) => {
          const sentiment = r.recommended ? "👍 推荐" : "👎 不推荐";
          return `- 《${r.gameName}》(${r.hoursPlayed}小时) ${sentiment}\n  评测摘要: "${r.reviewText.slice(0, 100)}${r.reviewText.length > 100 ? "..." : ""}"`;
        })
        .join("\n");
      
      reviewsSection = `
### 玩家评测（重要！反映玩家的思维方式和表达风格）
- 评测总数：${stats.reviews.totalReviews}篇
${reviewsList}`;
    }

    const prompt = `
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

## 回复格式

请用中文回复，采用轻松有趣的语气，像是在为朋友做性格分析。每个结论都要有数据支撑，避免空泛的描述。最后可以给出一些个性化的游戏推荐建议。

回复结构：
1. 总体人格画像（200字左右）
2. 详细分析（按上述维度展开）
3. 个性化建议
4. 有趣的总结
`;

    // 调用 Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;

    return NextResponse.json({ 
      analysis: aiResponse,
      prompt: prompt, // 同时返回提示词供用户参考
      model: "gemini-2.5-flash-preview-09-2025"
    });

  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Failed to analyze personality" },
      { status: 500 }
    );
  }
}