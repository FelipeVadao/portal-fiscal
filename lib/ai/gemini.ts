import "server-only";
import { GoogleGenAI } from "@google/genai";

let cached: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (cached) return cached;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada. Veja .env.example.");
  cached = new GoogleGenAI({ apiKey });
  return cached;
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL ?? "gemini-flash-latest";
}
