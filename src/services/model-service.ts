import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { supabase } from "../lib/supabase.js";

export interface AIModel {
  id: string;
  model_name: string;
  display_name: string;
  provider: string;
  is_active: boolean;
}

export class ModelService {
  private static modelCache = new Map<string, AIModel>();

  static async getModel(modelId?: string): Promise<AIModel> {
    // If no model ID provided, use Gemini 2.5 Pro as default
    if (!modelId) {
      const { data: model, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('id', 'fc96ce93-b98f-4606-92fc-8fe2c4db1ef6') // Gemini 2.5 Pro default
        .eq('is_active', true)
        .single();

      if (error || !model) {
        throw new Error('Default model (Gemini 2.5 Pro) not found or not active');
      }

      return model as AIModel;
    }

    // Check cache first
    if (this.modelCache.has(modelId)) {
      return this.modelCache.get(modelId)!;
    }

    // Fetch from database
    const { data: model, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('id', modelId)
      .eq('is_active', true)
      .single();

    if (error || !model) {
      throw new Error(`Model ${modelId} not found or not active`);
    }

    // Cache the model
    this.modelCache.set(modelId, model as AIModel);
    return model as AIModel;
  }

  static getModelProvider(model: AIModel) {
    // Currently only supporting OpenRouter
    if (model.provider === 'openrouter') {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY environment variable is not set');
      }

      const openrouter = createOpenRouter({
        apiKey: apiKey,
      });
      return openrouter(model.model_name);
    }

    throw new Error(`Unsupported provider: ${model.provider}`);
  }

  static clearCache() {
    this.modelCache.clear();
  }
}