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
    
    if (ext === 'txt') {
      return buffer.toString('utf-8');
    }

    // Attempt to use officeparser
    const result: any = await parseOffice(buffer, {
      fileType: ext as any,
      ignoreNotes: true,
      newline_delimiter: "\n"
    });
    
    if (result && typeof result.toText === 'function') {
      return result.toText() || "";
    }
    
    return typeof result === 'string' ? result : "";
  } catch (error) {
    console.error("[extractTextFromFile] Error:", error);
    return "";
  }
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimes: Record<string, string> = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'heic': 'image/heic',
    'heif': 'image/heif',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'mp4': 'video/mp4',
    'mpeg': 'video/mpeg',
    'mov': 'video/mov',
    'avi': 'video/avi',
    'webm': 'video/webm',
    'mp3': 'audio/mp3',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac'
  };
  return mimes[ext] || 'application/octet-stream';
}

export async function generateFileDescription(buffer: Buffer, filename: string, apiKey: string): Promise<string | null> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const mimeType = getMimeType(filename);
    const isNativeSupported = ['image/', 'application/pdf', 'video/', 'audio/', 'text/plain'].some(prefix => mimeType.startsWith(prefix));
    
    const prompt = `Bạn là một trợ lý ảo thông minh. 
Nhiệm vụ: Phân tích tài liệu / tệp đính kèm có tên "${filename}" và viết một đoạn mô tả (description) ngắn gọn, súc tích và chuyên nghiệp (khoảng 2-4 câu) để tóm tắt nội dung chính.
LƯU Ý QUAN TRỌNG:
- Chỉ trả về duy nhất đoạn văn bản mô tả, không thêm bình luận, không dùng markdown in đậm/nghiêng.`;

    let result;
    // Sử dụng inlineData cho các file được Gemini hỗ trợ trực tiếp (dung lượng < 19MB)
    if (isNativeSupported && buffer.length < 19 * 1024 * 1024) {
       result = await model.generateContent([
         prompt,
         {
           inlineData: {
             data: buffer.toString("base64"),
             mimeType
           }
         }
       ]);
    } else {
       // Fallback: trích xuất text cho file Word, Excel, PowerPoint hoặc file quá lớn
       const text = await extractTextFromFile(buffer, filename);
       if (!text || text.trim().length < 10) return null;
       const truncatedText = text.substring(0, 50000);
       result = await model.generateContent([
         `${prompt}\n\nNội dung văn bản trích xuất:\n"""\n${truncatedText}\n"""`
       ]);
    }

    const response = await result.response;
    let description = response.text().trim();
    
    // Loại bỏ markdown dư thừa
    description = description.replace(/\*\*/g, "").replace(/#/g, "");
    
    return description;
  } catch (error) {
    console.error("[generateFileDescription] Error:", error);
    return null;
  }
}
