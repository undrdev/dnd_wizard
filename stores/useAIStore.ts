import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AIProviderConfig, AIMessage } from '@/types';

interface AIStore {
  // State
  providers: AIProviderConfig;
  currentProvider: 'openai' | 'anthropic' | null;
  isGenerating: boolean;
  conversationHistory: AIMessage[];
  
  // Actions
  setProviders: (providers: AIProviderConfig) => void;
  setCurrentProvider: (provider: 'openai' | 'anthropic' | null) => void;
  setOpenAIConfig: (config: { apiKey: string; model: any }) => void;
  setAnthropicConfig: (config: { apiKey: string; model: any }) => void;
  setGenerating: (generating: boolean) => void;
  addMessage: (message: AIMessage) => void;
  clearHistory: () => void;
  
  // Getters
  hasValidProvider: () => boolean;
  getCurrentProviderConfig: () => any;
}

const initialState = {
  providers: {},
  currentProvider: null,
  isGenerating: false,
  conversationHistory: [],
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
