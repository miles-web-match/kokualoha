
import { GoogleGenAI } from "@google/genai";

export const askConcierge = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
  } catch (error) {
    console.error("Gemini API error:", error);
    return { text: "申し訳ありません。現在AIアシスタントに接続できません。", sources: [] };
  }
};
