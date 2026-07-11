import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseOffice } from "officeparser";
import { prisma } from "@/lib/prisma";

export async function getGeminiKey(): Promise<string | null> {
  const setting = await prisma.appSetting.findUnique({ where: { key: "gemini_api_key" } });
  return setting?.value || null;
}

export async function extractTextFromFile(buffer: Buffer, filename: string): Promise<string> {
  try {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    // Attempt to use officeparser
    const text = await parseOffice(buffer, {
      fileType: ext as any,
      ignoreNotes: true,
      newline_delimiter: "\n"
    });
    
    return text || "";
  } catch (error) {
    console.error("[extractTextFromFile] Error:", error);
    return "";
  }
}

export async function generateFileDescription(buffer: Buffer, filename: string, apiKey: string): Promise<string | null> {
  try {
    const text = await extractTextFromFile(buffer, filename);
    if (!text || text.trim().length < 20) {
      // Return null if text is too short or empty
      return null;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Limit text to avoid exceeding token limit (Gemini 1.5 flash has 1M context, but let's be safe and send max 50,000 characters)
    const truncatedText = text.substring(0, 50000);

    const prompt = `
Bạn là một trợ lý ảo thông minh. Dưới đây là nội dung văn bản được trích xuất từ tài liệu "${filename}".
Hãy đọc nội dung này và viết một đoạn mô tả (description) ngắn gọn, súc tích và chuyên nghiệp (khoảng 2-4 câu) để tóm tắt nội dung chính của tài liệu này. 
LƯU Ý QUAN TRỌNG: 
- Chỉ trả về duy nhất đoạn văn bản mô tả, không thêm bất kỳ bình luận, tiêu đề hay lời chào hỏi nào khác.
- Không dùng markdown in đậm in nghiêng, chỉ dùng plain text.

Nội dung tài liệu:
"""
${truncatedText}
"""
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let description = response.text().trim();
    
    // Remove markdown formatting if the model still adds it
    description = description.replace(/\*\*/g, "").replace(/#/g, "");
    
    return description;
  } catch (error) {
    console.error("[generateFileDescription] Error:", error);
    return null;
  }
}
