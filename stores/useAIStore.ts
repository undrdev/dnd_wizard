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
          set({ isLoadingKeys: true });
          try {
            const keys = await apiKeyStorage.loadAPIKeys();
            if (keys) {
              const providers: AIProviderConfig = {};
              if (keys.openai) {
                providers.openai = keys.openai;
              }
              if (keys.anthropic) {
                providers.anthropic = keys.anthropic;
              }
              set({ providers, isLoadingKeys: false });
            }
          } catch (error) {
            console.error('Error loading API keys:', error);
            set({ isLoadingKeys: false });
          }
        },
        
        saveAPIKeysToFirebase: async () => {
          const state = get();
          try {
            const success = await apiKeyStorage.saveAPIKeys(state.providers);
            return success;
          } catch (error) {
            console.error('Error saving API keys:', error);
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
