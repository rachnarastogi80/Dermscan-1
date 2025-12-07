
export enum SafetyLevel {
  SAFE = 'Safe',
  MODERATE = 'Moderate',
  AVOID = 'Avoid',
  UNKNOWN = 'Unknown'
}

export interface IngredientSource {
  title: string;
  url?: string;
}

export interface Ingredient {
  name: string;
  functions: string[];
  safetyLevel: SafetyLevel;
  confidence: 'High' | 'Medium' | 'Low';
  description: string;
  ewgScore?: number;
  restrictionFlags?: string[];
  sources?: (string | IngredientSource)[];
}

export interface SkinSuitability {
  oily: 'Great' | 'Good' | 'Average' | 'Poor' | 'Avoid';
  dry: 'Great' | 'Good' | 'Average' | 'Poor' | 'Avoid';
  sensitive: 'Great' | 'Good' | 'Average' | 'Poor' | 'Avoid';
  combination: 'Great' | 'Good' | 'Average' | 'Poor' | 'Avoid';
  reasoning: string;
}

export interface AnalysisResult {
  productName?: string;
  overallScore: number; // 0 to 100
  summary: string;
  skinSuitability?: SkinSuitability;
  ingredients: Ingredient[];
}

export interface SavedAnalysis {
  id: string;
  name: string;
  timestamp: number;
  result: AnalysisResult;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  image?: string;
  analysis?: AnalysisResult;
  isError?: boolean;
}
