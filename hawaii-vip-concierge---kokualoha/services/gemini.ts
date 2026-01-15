
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
  
  // 高級コンシェルジュらしい、記号に頼らない美しいフォーマットを指示
  const systemInstruction = `あなたはハワイの高級コンシェルジュサービス『コクアロハ』の専属AIアシスタントです。
以下のガイドラインに従って、美しく読みやすい回答を作成してください：

1. **記号の制限**: 太字記号（**）を多用しないでください。重要なキーワードに絞るか、代わりに改行や箇条書き（・）を活用してください。
2. **視覚的な余白**: セクションごとに必ず1行空け、読み手が疲れないレイアウトにしてください。
3. **おもてなしの構造**: 
   - 冒頭：丁寧な挨拶と共感の言葉
   - 本文：項目ごとに整理（適宜、ハワイを感じる絵文字を添える）
   - 結び：さらにサポートが必要な場合の案内
4. **トーン**: プロフェッショナルかつ温かみのある日本語（敬語）で。

最新の現地情報が必要な場合は、Google Searchを使用して正確なデータを提供してください。`;

  try {
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
    
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      return { 
        text: "【利用制限】現在アクセスが集中しております。1分ほどおいてから再度お試しいただくか、Google AI Studioの支払い設定をご確認ください。", 
        sources: [] 
      };
    }

    return { 
      text: "申し訳ありません。現在AIコンシェルジュが席を外しております。時間をおいて再度お声がけください。", 
      sources: [] 
    };
  }
};
