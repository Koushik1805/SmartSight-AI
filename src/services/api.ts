import { GoogleGenAI, Type } from "@google/genai";
import { DetectedObject, ScanResult } from "../types";

// Initialize the Gemini API
const apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.error('GEMINI_API_KEY is not set. Add VITE_GEMINI_API_KEY=your_key to your .env file');
}

const genAI = new GoogleGenAI({ apiKey });

const SAFETY_INSTRUCTION = `
You are SmartSight AI. 
CRITICAL: Do NOT process sensitive documents (IDs, credit cards), explicit content, or illegal material. 
If detected, set "safetyViolation": true in your JSON response.
`;

export const detectObject = async (imageFile: File, language: string = 'English'): Promise<DetectedObject> => {
  const model = "gemini-2.5-flash";
  
  const base64Data = await fileToGenerativePart(imageFile);

  const prompt = `
    Identify the main object in this image. 
    Provide a clear, educational explanation for a student.
    
    CRITICAL: You MUST respond entirely in ${language}.
    
    Return ONLY a JSON object:
    {
      "name": "Object Name in ${language}",
      "confidence": 0.95,
      "explanation": "Educational explanation in ${language}...",
      "safetyViolation": false
    }
  `;

  try {
    const response = await genAI.models.generateContent({
      model,
      contents: [{ parts: [base64Data, { text: prompt }] }],
      config: {
        systemInstruction: SAFETY_INSTRUCTION + `\nIMPORTANT: ALL OUTPUT MUST BE IN ${language.toUpperCase()}.`,
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI returned an empty response.");
    
    let result;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      result = JSON.parse(jsonStr.replace(/```json/g, "").replace(/```/g, "").trim());
    } catch (e) {
      console.error("JSON Parse Error. Raw text:", text);
      // Fallback if JSON parsing fails
      return {
        name: "Analysis Result",
        confidence: 0.9,
        explanation: text
      };
    }
    
    if (result.safetyViolation) {
      throw new Error(result.explanation || "Safety filter blocked this content.");
    }

    return {
      name: result.name || "Unknown",
      confidence: result.confidence || 0.5,
      explanation: result.explanation || "No explanation available."
    };
  } catch (error: any) {
    console.error('Gemini Error (detectObject):', error);
    const msg = error?.message || String(error);
    if (msg.includes('API key') || msg.includes('401') || msg.includes('403')) {
      throw new Error('Invalid or missing API key. Please check your VITE_GEMINI_API_KEY in the .env file.');
    }
    throw new Error('AI analysis failed: ' + msg);
  }
};

export const scanNotes = async (file: File, language: string = 'English'): Promise<ScanResult> => {
  const model = "gemini-2.5-flash";
  const base64Data = await fileToGenerativePart(file);

  const prompt = `
    You are an expert OCR and note-taking assistant.
    Carefully extract ALL visible text from this image exactly as written, preserving structure.
    Then create a clear, comprehensive summary of the key concepts.
    
    CRITICAL: You MUST respond entirely in ${language}.
    
    Return ONLY a valid JSON object (no markdown, no extra text):
    {
      "extractedText": "All text found in the image, transcribed accurately in ${language}...",
      "summary": "A detailed point-wise summary using markdown bullet points (- ) covering all key ideas in ${language}...",
      "safetyViolation": false
    }
  `;

  try {
    const response = await genAI.models.generateContent({
      model,
      contents: [{ parts: [base64Data, { text: prompt }] }],
      config: {
        systemInstruction: SAFETY_INSTRUCTION + `\nIMPORTANT: ALL OUTPUT MUST BE IN ${language.toUpperCase()}.`,
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI returned an empty response.");

    let result;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      result = JSON.parse(jsonStr.replace(/```json/g, "").replace(/```/g, "").trim());
    } catch (e) {
      console.error("JSON Parse Error. Raw text:", text);
      return {
        extractedText: "Text extracted (Parsing error)",
        summary: text
      };
    }

    if (result.safetyViolation) {
      throw new Error("Safety filter blocked this content.");
    }

    return {
      extractedText: result.extractedText || "",
      summary: result.summary || "No summary available."
    };
  } catch (error: any) {
    console.error('Gemini Error (scanNotes):', error);
    const msg = error?.message || String(error);
    if (msg.includes('API key') || msg.includes('401') || msg.includes('403')) {
      throw new Error('Invalid or missing API key. Please check your VITE_GEMINI_API_KEY in the .env file.');
    }
    throw new Error('Failed to scan notes: ' + msg);
  }
};

export const sendChatMessage = async (message: string, language: string = 'English'): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  const response = await genAI.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction: SAFETY_INSTRUCTION + `\nYou are a helpful AI Tutor. Provide clear, encouraging, and educational answers. \n\nCRITICAL: You MUST respond entirely in ${language}. \n\nIf the user asks about sensitive or prohibited topics, politely decline.`,
    }
  });

  return response.text ?? '';
};

export const sendChatMessageStream = async (message: string, language: string = 'English', onChunk: (text: string) => void) => {
  const model = "gemini-2.5-flash";
  
  const response = await genAI.models.generateContentStream({
    model,
    contents: [{ role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction: SAFETY_INSTRUCTION + `\nYou are a helpful AI Tutor. Provide clear, encouraging, and educational answers. \n\nCRITICAL: You MUST respond entirely in ${language}. \n\nIf the user asks about sensitive or prohibited topics, politely decline.`,
    }
  });

  let fullText = "";
  for await (const chunk of response) {
    const text = chunk.text;
    if (text) {
      fullText += text;
      onChunk(fullText);
    }
  }
  return fullText;
};

async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string, mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}