import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AIProviderConfig, AIMessage } from '@/types';
import { apiKeyStorage } from '@/lib/apiKeyStorage';

interface AIStore {
  // State
  providers: AIProviderConfig;
  currentProvider: 'openai' | 'anthropic' | null;
  isGenerating: boolean;
  conversationHistory: AIMessage[];
  isLoadingKeys: boolean;
  
  // Actions
  setProviders: (providers: AIProviderConfig) => void;
  setCurrentProvider: (provider: 'openai' | 'anthropic' | null) => void;
  setOpenAIConfig: (config: { apiKey: string; model: any }) => void;
  setAnthropicConfig: (config: { apiKey: string; model: any }) => void;
  setGenerating: (generating: boolean) => void;
  addMessage: (message: AIMessage) => void;
  clearHistory: () => void;
  loadAPIKeysFromFirebase: () => Promise<void>;
  saveAPIKeysToFirebase: () => Promise<boolean>;
  
  // Getters
  hasValidProvider: () => boolean;
  getCurrentProviderConfig: () => any;
}

const initialState = {
  providers: {},
  currentProvider: null,
  isGenerating: false,
  conversationHistory: [],
  isLoadingKeys: false,
};

export const useAIStore = create<AIStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setProviders: (providers) => set({ providers }),
        
        setCurrentProvider: (provider) => set({ currentProvider: provider }),
        
        setOpenAIConfig: (config) =>
          set((state) => ({
            providers: {
              ...state.providers,
              openai: config,
            },
          })),
        
        setAnthropicConfig: (config) =>
          set((state) => ({
            providers: {
              ...state.providers,
              anthropic: config,
            },
          })),
        
        setGenerating: (isGenerating) => set({ isGenerating }),
        
        addMessage: (message) =>
          set((state) => ({
            conversationHistory: [...state.conversationHistory, message],
          })),
        
        clearHistory: () => set({ conversationHistory: [] }),
        
        hasValidProvider: (): boolean => {
          const state = get();
          const provider = state.currentProvider;
          if (!provider) return false;

          const config = state.providers[provider];
          return Boolean(config && config.apiKey && config.model);
        },
        
        getCurrentProviderConfig: () => {
          const state = get();
          const provider = state.currentProvider;
          return provider ? state.providers[provider] : null;
        },
        
          loadAPIKeysFromFirebase: async () => {
    console.log('🔍 AI Store: Loading API keys from Firebase');
    set({ isLoadingKeys: true });
    try {
      // Add a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Loading timeout')), 10000)
      );
      
      const keysPromise = apiKeyStorage.loadAPIKeys();
      const keys = await Promise.race([keysPromise, timeoutPromise]) as any;
      
      console.log('🔍 AI Store: Keys loaded from Firebase:', keys ? 'Found' : 'Not found');
      
      if (keys) {
        const providers: AIProviderConfig = {};
        if (keys.openai) {
          console.log('🔍 AI Store: Found OpenAI keys');
          // Type-safe conversion for OpenAI models
          const openaiModel = keys.openai.model as 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
          providers.openai = {
            apiKey: keys.openai.apiKey,
            model: openaiModel
          };
        }
        if (keys.anthropic) {
          console.log('🔍 AI Store: Found Anthropic keys');
          // Type-safe conversion for Anthropic models
          const anthropicModel = keys.anthropic.model as 'claude-3-5-sonnet-20241022' | 'claude-3-5-haiku-20241022' | 'claude-3-opus-20240229';
          providers.anthropic = {
            apiKey: keys.anthropic.apiKey,
            model: anthropicModel
          };
        }
        console.log('🔍 AI Store: Setting providers:', Object.keys(providers));
        set({ providers, isLoadingKeys: false });
      } else {
        // No keys found, but still need to set loading to false
        console.log('🔍 AI Store: No API keys found in Firebase');
        set({ isLoadingKeys: false });
      }
    } catch (error) {
      console.error('❌ AI Store: Error loading API keys:', error);
      set({ isLoadingKeys: false });
    }
  },
        
          saveAPIKeysToFirebase: async () => {
    const state = get();
    console.log('🔍 AI Store: Saving API keys to Firebase');
    console.log('🔍 AI Store: Providers to save:', Object.keys(state.providers));
    try {
      const success = await apiKeyStorage.saveAPIKeys(state.providers);
      console.log('🔍 AI Store: Save result:', success);
      return success;
    } catch (error) {
      console.error('❌ AI Store: Error saving API keys:', error);
      return false;
    }
  },
      }),
      {
        name: 'dnd-wizard-ai-store',
        partialize: (state) => ({
          providers: state.providers,
          currentProvider: state.currentProvider,
        }),
      }
    ),
    { name: 'DnD Wizard AI Store' }
  )
);
