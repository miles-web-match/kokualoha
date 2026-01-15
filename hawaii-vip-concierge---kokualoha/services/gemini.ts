
import { GoogleGenAI } from "@google/genai";

export const askConcierge = async (prompt: string) => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    return { 
      text: "APIキーが設定されていません。Cloudflare Pagesの環境変数設定を確認してください。", 
      sources: [] 
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = "あなたはハワイの高級コンシェルジュサービス『コクアロハ』のAIアシスタントです。ユーザーのハワイ滞在に関する質問に、親切かつプロフェッショナルに、日本語の敬語で答えてください。";

  try {
    // 1回目の試行: Google Search（グラウンディング）あり
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "回答を生成できませんでした。";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => chunk.web?.uri).filter(Boolean) || [];

    return { text, sources };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // 429エラー（利用制限）の場合
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      return { 
        text: "【利用制限エラー】Gemini APIの無料枠の上限に達したか、Google検索機能の制限を超えました。しばらく時間をおいてから再度お試しいただくか、Google AI Studioで支払い情報（Billing）の設定を確認してください。", 
        sources: [] 
      };
    }

    // その他のエラー
    return { 
      text: "申し訳ありません。現在AIアシスタントに接続できません。エラー詳細: " + (error.message || "Unknown error"), 
      sources: [] 
    };
  }
};
