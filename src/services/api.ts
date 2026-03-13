import { GoogleGenAI } from "@google/genai";
import { DetectedObject, ScanResult } from "../types";

// ─── API Key ────────────────────────────────────────────────────────────────
const apiKey =
  (import.meta as any).env?.VITE_GEMINI_API_KEY ||
  (import.meta as any).env?.GEMINI_API_KEY ||
  (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : "") ||
  "";

if (!apiKey) {
  console.error(
    "[SmartSight] GEMINI_API_KEY is not set. Add VITE_GEMINI_API_KEY=your_key to your .env file"
  );
}

const genAI = new GoogleGenAI({ apiKey });

// ─── Safety Instruction ──────────────────────────────────────────────────────
const SAFETY_INSTRUCTION = `
You are SmartSight AI, an educational assistant.
CRITICAL: Do NOT process sensitive documents (IDs, passports, credit cards), explicit content, or illegal material.
If detected, set "safetyViolation": true in your JSON response.
`;

// ─── Utilities ───────────────────────────────────────────────────────────────

/** Convert File to Gemini inline data part */
async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(",")[1];
      if (!base64Data) { reject(new Error("Failed to read file data.")); return; }
      resolve({ inlineData: { data: base64Data, mimeType: file.type } });
    };
    reader.onerror = () => reject(new Error("File read error."));
    reader.readAsDataURL(file);
  });
}

/** Parse JSON from model output safely */
function parseJSON<T>(text: string): T {
  // Strip markdown code blocks if present
  const clean = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON object found in response.");
  return JSON.parse(jsonMatch[0]) as T;
}

/** Normalise API errors into user-friendly messages */
function handleAPIError(error: unknown, context: string): never {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`[SmartSight] ${context}:`, msg);

  if (!apiKey || msg.includes("API key") || msg.includes("401") || msg.includes("403")) {
    throw new Error(
      "Invalid or missing API key. Please add your VITE_GEMINI_API_KEY to the .env file."
    );
  }
  if (msg.includes("429") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota")) {
    throw new Error("API rate limit reached. Please wait a moment and try again.");
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    throw new Error("Network error. Please check your internet connection and try again.");
  }
  throw new Error(`${context} failed: ${msg}`);
}

// ─── Object Detection ────────────────────────────────────────────────────────
export const detectObject = async (
  imageFile: File,
  language = "English"
): Promise<DetectedObject> => {
  if (!imageFile) throw new Error("No image file provided.");
  if (imageFile.size > 10 * 1024 * 1024) throw new Error("Image file is too large. Please use an image under 10 MB.");

  const base64Data = await fileToGenerativePart(imageFile);

  const prompt = `
Identify the main object in this image.
Provide a clear, educational explanation suitable for a student.

CRITICAL: Respond entirely in ${language}.

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "name": "Object Name in ${language}",
  "confidence": 0.95,
  "explanation": "Educational explanation in ${language}...",
  "safetyViolation": false
}`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [base64Data, { text: prompt }] }],
      config: {
        systemInstruction:
          SAFETY_INSTRUCTION + `\nALL OUTPUT MUST BE IN ${language.toUpperCase()}.`,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI returned an empty response.");

    let result: any;
    try {
      result = parseJSON<any>(text);
    } catch {
      // Graceful fallback: return raw text as explanation
      return { name: "Analysis Result", confidence: 0.9, explanation: text };
    }

    if (result.safetyViolation) {
      throw new Error(result.explanation || "This content was blocked by the safety filter.");
    }

    return {
      name: result.name || "Unknown Object",
      confidence: Math.min(1, Math.max(0, result.confidence ?? 0.5)),
      explanation: result.explanation || "No explanation available.",
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("This content was blocked")) throw error;
    handleAPIError(error, "Object detection");
  }
};

// ─── Notes Scanner ───────────────────────────────────────────────────────────
export const scanNotes = async (
  file: File,
  language = "English"
): Promise<ScanResult> => {
  if (!file) throw new Error("No file provided.");

  const SUPPORTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
  if (!SUPPORTED.includes(file.type)) {
    throw new Error("Unsupported file type. Please upload a JPEG, PNG, WebP, or PDF.");
  }
  if (file.size > 20 * 1024 * 1024) throw new Error("File is too large. Please use a file under 20 MB.");

  const base64Data = await fileToGenerativePart(file);

  const prompt = `
You are an expert OCR and note-taking assistant.
Carefully extract ALL visible text from this image exactly as written, preserving structure and formatting.
Then create a clear, comprehensive summary of the key concepts.

CRITICAL: Respond entirely in ${language}.

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "extractedText": "All text found in the image, transcribed accurately...",
  "summary": "A detailed point-wise summary using markdown bullet points (- ) covering all key ideas...",
  "safetyViolation": false
}`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [base64Data, { text: prompt }] }],
      config: {
        systemInstruction:
          SAFETY_INSTRUCTION + `\nALL OUTPUT MUST BE IN ${language.toUpperCase()}.`,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI returned an empty response.");

    let result: any;
    try {
      result = parseJSON<any>(text);
    } catch {
      return { extractedText: "Text extracted (parsing error)", summary: text };
    }

    if (result.safetyViolation) {
      throw new Error("This content was blocked by the safety filter.");
    }

    return {
      extractedText: result.extractedText || "No text could be extracted.",
      summary: result.summary || "No summary available.",
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("This content was blocked")) throw error;
    handleAPIError(error, "Notes scanning");
  }
};

// ─── Chat ────────────────────────────────────────────────────────────────────
export const sendChatMessage = async (
  message: string,
  language = "English"
): Promise<string> => {
  if (!message.trim()) throw new Error("Message cannot be empty.");

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: message }] }],
      config: {
        systemInstruction:
          SAFETY_INSTRUCTION +
          `\nYou are a helpful, encouraging AI Tutor for students. Provide clear, educational answers.\nCRITICAL: Respond entirely in ${language}.\nDecline politely if asked about prohibited topics.`,
      },
    });
    const text = response.text;
    if (!text) throw new Error("AI returned an empty response.");
    return text;
  } catch (error) {
    handleAPIError(error, "Chat message");
  }
};

export const sendChatMessageStream = async (
  message: string,
  language = "English",
  onChunk: (text: string) => void
): Promise<string> => {
  if (!message.trim()) throw new Error("Message cannot be empty.");

  try {
    const response = await genAI.models.generateContentStream({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: message }] }],
      config: {
        systemInstruction:
          SAFETY_INSTRUCTION +
          `\nYou are a helpful, encouraging AI Tutor for students. Provide clear, educational answers.\nCRITICAL: Respond entirely in ${language}.\nDecline politely if asked about prohibited topics.`,
      },
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    if (!fullText) throw new Error("AI returned an empty response.");
    return fullText;
  } catch (error) {
    handleAPIError(error, "Chat stream");
  }
};
