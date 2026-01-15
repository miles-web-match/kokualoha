
import { GoogleGenAI } from "@google/genai";

export const askConcierge = async (prompt: string) => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    console.error("API_KEY is not defined in the environment.");
    return { 
      text: "申し訳ありません。システム設定（APIキー）が完了していないため、現在AIアシスタントを利用できません。Cloudflare Pagesの設定を確認してください。", 
      sources: [] 
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = "あなたはハワイの高級コンシェルジュサービス『コクアロハ』のAIアシスタントです。ユーザーのハワイ滞在（観光、不動産、教育、医療、生活トラブルなど）に関する質問に、親切かつプロフェッショナルに、そして正確な現地の最新情報（Google Search使用）を交えて答えてください。回答は日本語で、敬語を使用してください。";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "申し訳ありません。回答を生成できませんでした。";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => chunk.web?.uri).filter(Boolean) || [];

    return { text, sources };
  } catch (error: any) {
    console.error("Gemini API error detail:", error);
    let errorMessage = "申し訳ありません。現在AIアシスタントに接続できません。";
    
    if (error.message?.includes("API key not valid")) {
      errorMessage = "APIキーが無効です。設定を確認してください。";
    }
    
    return { text: errorMessage, sources: [] };
  }
};
