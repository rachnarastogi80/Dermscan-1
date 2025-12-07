import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    productName: {
      type: Type.STRING,
      description: "Identify the exact commercial product name. STRICT MATCHING LOGIC: 1. Search for products containing these exact ingredients. 2. CRITICAL: The FIRST 10 INGREDIENTS must appear in the EXACT SAME ORDER as the input list. 3. Cross-reference with INCI Decoder, Sephora, Ulta, Nykaa, and Amazon. If unsure, provide a descriptive generic name.",
    },
    overallScore: {
      type: Type.NUMBER,
      description: "A safety score from 0 (toxic) to 100 (very clean/safe).",
    },
    summary: {
      type: Type.STRING,
      description: "A concise summary of the product's safety profile and key functions.",
    },
    skinSuitability: {
      type: Type.OBJECT,
      properties: {
        oily: { type: Type.STRING, enum: ["Great", "Good", "Average", "Poor", "Avoid"] },
        dry: { type: Type.STRING, enum: ["Great", "Good", "Average", "Poor", "Avoid"] },
        sensitive: { type: Type.STRING, enum: ["Great", "Good", "Average", "Poor", "Avoid"] },
        combination: { type: Type.STRING, enum: ["Great", "Good", "Average", "Poor", "Avoid"] },
        reasoning: { type: Type.STRING, description: "A one-sentence explanation of why it fits/doesn't fit these skin types." }
      },
      required: ["oily", "dry", "sensitive", "combination", "reasoning"],
      description: "Assessment of how well this product suits different skin types."
    },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "INCI Name. CRITICAL: If text says 'Water and Glycerin', create two separate objects: 'Water' and 'Glycerin'." },
          functions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of functions (e.g., Preservative, Emollient)",
          },
          safetyLevel: {
            type: Type.STRING,
            enum: ["Safe", "Moderate", "Avoid", "Unknown"],
            description: "Safety assessment category.",
          },
          confidence: {
            type: Type.STRING,
            enum: ["High", "Medium", "Low"],
            description: "Confidence in the assessment based on amount of scientific data available. High = well studied, Low = ambiguous or lack of data.",
          },
          ewgScore: {
            type: Type.INTEGER,
            description: "The specific EWG Skin Deep score (1-10). If the ingredient has a range (e.g., 3-6), use the MAXIMUM/WORST score. Return 0 if completely unknown.",
          },
          restrictionFlags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List names of major clean standards that ban/restrict this ingredient (e.g., 'Credo Dirty List', 'Sephora Clean', 'Beauty Heroes', 'Made Safe'). Empty if none.",
          },
          description: {
            type: Type.STRING,
            description: "A detailed 2-3 sentence explanation of the ingredient's function, mechanism of action, and specific safety concerns or benefits.",
          },
          sources: {
            type: Type.ARRAY,
            items: { 
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "The exact title of the scientific paper, CIR report, or SCCS opinion." },
              },
              required: ["title"]
            },
            description: "List of 1-3 specific scientific references. Prioritize CIR Final Reports and SCCS Opinions.",
          }
        },
        required: ["name", "functions", "safetyLevel", "confidence", "description", "ewgScore", "restrictionFlags"],
      },
    },
  },
  required: ["overallScore", "summary", "ingredients", "skinSuitability", "productName"],
};

export const analyzeIngredients = async (
  textInput?: string,
  imageBase64?: string
): Promise<AnalysisResult> => {
  const model = "gemini-2.5-flash";
  
  const parts: any[] = [];

  if (imageBase64) {
    // Determine mime type roughly or default to png if unknown, Gemini is flexible
    const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
    const mimeType = matches ? matches[1] : 'image/jpeg';
    const data = matches ? matches[2] : imageBase64;

    parts.push({
      inlineData: {
        mimeType,
        data,
      },
    });
    parts.push({
      text: "Analyze the ingredient list visible in this image. Read the label exactly as written. If no specific ingredients are visible, describe what you see but return an empty ingredient list. CRITICAL: Separate ingredients listed together (e.g. 'Retinol and Polysorbate 20' must be two separate items).",
    });
  }

  if (textInput) {
    parts.push({
      text: `Analyze this list of cosmetic ingredients: "${textInput}". TREAT "AND", "&", "WITH" AS SEPARATORS. For example, "Phenoxyethanol and Ethylhexylglycerin" must be split into two separate ingredient entries.`,
    });
  }

  parts.push({
    text: "Provide a strict safety assessment based on modern clean beauty standards. \n\n1. PRODUCT MATCHING: Identify the exact commercial product. \n   - RULE: The FIRST 10 INGREDIENTS in the input MUST match the product's formula in the EXACT order.\n   - REFERENCE: Check INCI Decoder, Sephora, Ulta, Nykaa, and Amazon.\n2. EWG SCORING: Provide the exact EWG Skin Deep score (1-10). If a range exists (e.g., 3-5), use the HIGHEST value (5).\n3. RETAILER STANDARDS: Check against 'Dirty Lists' from Credo Beauty, Sephora Clean, Beauty Heroes, and Made Safe.\n4. SOURCES: Cite verifiable scientific titles.",
  });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        role: "user",
        parts: parts,
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are an expert cosmetic chemist. You are extremely precise with EWG scores. If an ingredient has a known EWG score, you must provide it. You MUST separate combined ingredients into individual entries (e.g. 'X & Y' -> 'X', 'Y'). You also identify ingredients banned by major retailers (Credo, Sephora, etc). You rely on the scientific consensus from CIR and SCCS. When identifying the product, you act like a detective: you MUST match the ingredient order (especially the first 10) against databases like INCI Decoder to find the correct product.",
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from AI");
    }

    const data = JSON.parse(resultText) as AnalysisResult;
    return data;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};