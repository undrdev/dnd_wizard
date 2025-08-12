import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, orderBy, limit as firestoreLimit, Timestamp } from 'firebase/firestore';
import type { AIUsageLog, AIUsageStats, AIUsageFilters } from '@/types';

// Cost per 1K tokens (as of 2024 - these should be updated regularly)
const COST_PER_1K_TOKENS = {
  openai: {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 },
  },
  anthropic: {
    'claude-3-opus': { input: 0.015, output: 0.075 },
    'claude-3-sonnet': { input: 0.003, output: 0.015 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125 },
    'claude-2.1': { input: 0.008, output: 0.024 },
    'claude-2.0': { input: 0.008, output: 0.024 },
  }
};

// Default costs for unknown models
const DEFAULT_COSTS = {
  openai: { input: 0.01, output: 0.03 },
  anthropic: { input: 0.003, output: 0.015 }
};

export class AIUsageLogger {
  private static instance: AIUsageLogger;
  
  private constructor() {}
  
  static getInstance(): AIUsageLogger {
    if (!AIUsageLogger.instance) {
      AIUsageLogger.instance = new AIUsageLogger();
    }
    return AIUsageLogger.instance;
  }

  /**
   * Calculate estimated cost for token usage
   */
  private calculateCost(
    provider: 'openai' | 'anthropic',
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    // Simplified cost calculation
    let inputCostPer1K = 0.01;
    let outputCostPer1K = 0.03;
    
    if (provider === 'openai') {
      if (model === 'gpt-4') {
        inputCostPer1K = 0.03;
        outputCostPer1K = 0.06;
      } else if (model === 'gpt-4-turbo') {
        inputCostPer1K = 0.01;
        outputCostPer1K = 0.03;
      } else if (model === 'gpt-3.5-turbo') {
        inputCostPer1K = 0.0015;
        outputCostPer1K = 0.002;
      }
    } else if (provider === 'anthropic') {
      if (model === 'claude-3-opus') {
        inputCostPer1K = 0.015;
        outputCostPer1K = 0.075;
      } else if (model === 'claude-3-sonnet') {
        inputCostPer1K = 0.003;
        outputCostPer1K = 0.015;
      } else if (model === 'claude-3-haiku') {
        inputCostPer1K = 0.00025;
        outputCostPer1K = 0.00125;
      }
    }
    
    const inputCost = (inputTokens / 1000) * inputCostPer1K;
    const outputCost = (outputTokens / 1000) * outputCostPer1K;
    
    return inputCost + outputCost;
  }

  /**
   * Determine command type from command string
   */
  private determineCommandType(command: string): AIUsageLog['commandType'] {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('campaign') || lowerCommand.includes('generate campaign')) {
      return 'campaign_generation';
    }
    if (lowerCommand.includes('npc') || lowerCommand.includes('character') || lowerCommand.includes('person')) {
      return 'npc_creation';
    }
    if (lowerCommand.includes('quest') || lowerCommand.includes('mission') || lowerCommand.includes('adventure')) {
      return 'quest_creation';
    }
    if (lowerCommand.includes('location') || lowerCommand.includes('place') || lowerCommand.includes('city') || lowerCommand.includes('town')) {
      return 'location_creation';
    }
    if (lowerCommand.includes('suggest') || lowerCommand.includes('idea')) {
      return 'suggestion';
    }
    if (lowerCommand.includes('generate') || lowerCommand.includes('create') || lowerCommand.includes('make')) {
      return 'content_generation';
    }
    
    return 'other';
  }

  /**
   * Log AI usage
   */
  async logUsage(params: {
    campaignId: string;
    userId: string;
    command: string;
    provider: 'openai' | 'anthropic';
    model: string;
    inputTokens: number;
    outputTokens: number;
    responseLength: number;
    success: boolean;
    errorType?: string;
    errorMessage?: string;
    processingTimeMs: number;
  }): Promise<string> {
    const {
      campaignId,
      userId,
      command,
      provider,
      model,
      inputTokens,
      outputTokens,
      responseLength,
      success,
      errorType,
      errorMessage,
      processingTimeMs
    } = params;

    const totalTokens = inputTokens + outputTokens;
    const estimatedCost = this.calculateCost(provider, model, inputTokens, outputTokens);
    const commandType = this.determineCommandType(command);

    const logEntry: Omit<AIUsageLog, 'id'> = {
      campaignId,
      userId,
      command,
      commandType,
      provider,
      model,
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost,
      currency: 'USD',
      responseLength,
      success,
      errorType,
      errorMessage,
      processingTimeMs,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const docRef = await addDoc(collection(db, 'aiUsageLogs'), {
        ...logEntry,
        createdAt: Timestamp.fromDate(logEntry.createdAt),
        updatedAt: Timestamp.fromDate(logEntry.updatedAt),
      });
      
      console.log('✅ AI Usage logged:', {
        id: docRef.id,
        commandType,
        tokens: totalTokens,
        cost: estimatedCost,
        success
      });
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to log AI usage:', error);
      throw error;
    }
  }

  /**
   * Update user feedback for a log entry
   */
  async updateUserFeedback(
    logId: string,
    feedback: 'accepted' | 'rejected' | 'modified',
    reason?: string
  ): Promise<void> {
    try {
      const logRef = doc(db, 'aiUsageLogs', logId);
      await updateDoc(logRef, {
        userFeedback: feedback,
        feedbackReason: reason,
        feedbackTimestamp: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      });
      
      console.log('✅ User feedback logged:', { logId, feedback, reason });
    } catch (error) {
      console.error('❌ Failed to update user feedback:', error);
      throw error;
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(filters: AIUsageFilters = {}): Promise<AIUsageStats> {
    try {
      let q = query(collection(db, 'aiUsageLogs'));
      
      // Apply filters
      if (filters.campaignId) {
        q = query(q, where('campaignId', '==', filters.campaignId));
      }
      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters.commandType) {
        q = query(q, where('commandType', '==', filters.commandType));
      }
      if (filters.provider) {
        q = query(q, where('provider', '==', filters.provider));
      }
      if (filters.model) {
        q = query(q, where('model', '==', filters.model));
      }
      if (filters.success !== undefined) {
        q = query(q, where('success', '==', filters.success));
      }
      if (filters.userFeedback) {
        q = query(q, where('userFeedback', '==', filters.userFeedback));
      }
      if (filters.startDate) {
        q = query(q, where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
      }
      if (filters.endDate) {
        q = query(q, where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
      }

      const querySnapshot = await getDocs(q);
      const logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AIUsageLog[];

      // Calculate statistics
      const totalCommands = logs.length;
      const totalTokens = logs.reduce((sum, log) => sum + log.totalTokens, 0);
      const totalCost = logs.reduce((sum, log) => sum + log.estimatedCost, 0);
      const successfulCommands = logs.filter(log => log.success).length;
      const successRate = totalCommands > 0 ? (successfulCommands / totalCommands) * 100 : 0;
      const averageTokensPerCommand = totalCommands > 0 ? totalTokens / totalCommands : 0;
      const averageCostPerCommand = totalCommands > 0 ? totalCost / totalCommands : 0;

      // Command type breakdown
      const commandTypeCounts = logs.reduce((acc, log) => {
        acc[log.commandType] = (acc[log.commandType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostUsedCommands = Object.entries(commandTypeCounts)
        .map(([type, count]) => ({
          commandType: type,
          count,
          percentage: (count / totalCommands) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // User feedback statistics
      const feedbackStats = logs.reduce((acc, log) => {
        if (log.userFeedback) {
          acc[log.userFeedback]++;
          acc.totalWithFeedback++;
        }
        return acc;
      }, {
        accepted: 0,
        rejected: 0,
        modified: 0,
        totalWithFeedback: 0
      });

      // Cost breakdown
      const costBreakdown = {
        byProvider: logs.reduce((acc, log) => {
          acc[log.provider] = (acc[log.provider] || 0) + log.estimatedCost;
          return acc;
        }, {} as Record<string, number>),
        byModel: logs.reduce((acc, log) => {
          acc[log.model] = (acc[log.model] || 0) + log.estimatedCost;
          return acc;
        }, {} as Record<string, number>),
        byCommandType: logs.reduce((acc, log) => {
          acc[log.commandType] = (acc[log.commandType] || 0) + log.estimatedCost;
          return acc;
        }, {} as Record<string, number>)
      };

      return {
        totalCommands,
        totalTokens,
        totalCost,
        successRate,
        averageTokensPerCommand,
        averageCostPerCommand,
        mostUsedCommands,
        userFeedbackStats: feedbackStats,
        costBreakdown
      };
    } catch (error) {
      console.error('❌ Failed to get usage stats:', error);
      throw error;
    }
  }

  /**
   * Get recent usage logs
   */
  async getRecentLogs(limit: number = 50, filters: AIUsageFilters = {}): Promise<AIUsageLog[]> {
    try {
      let q = query(
        collection(db, 'aiUsageLogs'),
        orderBy('createdAt', 'desc')
      );
      
      // Apply limit after other filters
      if (limit > 0) {
        q = query(q, firestoreLimit(limit));
      }
      
      // Apply filters (same as getUsageStats)
      if (filters.campaignId) {
        q = query(q, where('campaignId', '==', filters.campaignId));
      }
      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters.commandType) {
        q = query(q, where('commandType', '==', filters.commandType));
      }
      if (filters.provider) {
        q = query(q, where('provider', '==', filters.provider));
      }
      if (filters.success !== undefined) {
        q = query(q, where('success', '==', filters.success));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        feedbackTimestamp: doc.data().feedbackTimestamp?.toDate(),
      })) as AIUsageLog[];
    } catch (error) {
      console.error('❌ Failed to get recent logs:', error);
      throw error;
    }
  }

  /**
   * Estimate tokens for campaign generation
   */
  estimateCampaignGenerationTokens(campaignConcept: string): {
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
  } {
    // Rough estimation based on typical campaign generation
    const baseInputTokens = 200; // System prompt + user prompt
    const conceptTokens = Math.ceil(campaignConcept.length / 4); // Rough token estimation
    const inputTokens = baseInputTokens + conceptTokens;
    
    // Campaign generation typically produces 1000-2000 tokens
    const outputTokens = 1500;
    
    // Use GPT-4 as default for estimation
    const estimatedCost = this.calculateCost('openai', 'gpt-4', inputTokens, outputTokens);
    
    return {
      inputTokens,
      outputTokens,
      estimatedCost
    };
  }
}

// Export singleton instance
export const aiUsageLogger = AIUsageLogger.getInstance();
