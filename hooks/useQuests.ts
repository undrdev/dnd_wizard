import { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { QuestService } from '@/lib/firestore';
import type {
  EnhancedQuest,
  EnhancedQuestFormData,
  QuestSearchOptions,
  QuestProgress,
  QuestTimelineEvent,
  QuestMilestone,
} from '@/types';
import {
  validateQuestDependencies,
  calculateQuestProgress,
  generateQuestTimeline,
  filterQuests,
  sortQuests,
  canStartQuest,
  getDependentQuests,
  createMilestone,
} from '@/lib/questUtils';
import { v4 as uuidv4 } from 'uuid';

export function useQuests() {
  const {
    quests,
    npcs,
    locations,
    currentCampaign,
    addQuest,
    updateQuest,
    deleteQuest,
    setLoading,
    setError,
  } = useAppStore();

  const [searchOptions, setSearchOptions] = useState<QuestSearchOptions>({
    query: '',
    sortBy: 'title',
    sortOrder: 'asc',
  });

  // Convert basic quests to enhanced quests with default values
  const enhancedQuests = useMemo((): EnhancedQuest[] => {
    return quests.map(quest => ({
      ...quest,
      dependencies: [],
      milestones: [],
      xpReward: 0,
      goldReward: 0,
      itemRewards: [],
      playerNotes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      // Preserve any existing enhanced fields if they exist
      ...(quest as any),
    }));
  }, [quests]);

  // Get campaign quests
  const campaignQuests = useMemo(() => {
    if (!currentCampaign) return [];
    return enhancedQuests.filter(quest => quest.campaignId === currentCampaign.id);
  }, [enhancedQuests, currentCampaign]);

  // Apply search and filters
  const filteredQuests = useMemo(() => {
    let filtered = filterQuests(campaignQuests, searchOptions, npcs, locations);
    filtered = sortQuests(
      filtered,
      searchOptions.sortBy,
      searchOptions.sortOrder,
      campaignQuests
    );
    return filtered;
  }, [campaignQuests, searchOptions, npcs, locations]);

  // Calculate progress for all quests
  const questProgress = useMemo((): Record<string, QuestProgress> => {
    const progress: Record<string, QuestProgress> = {};
    campaignQuests.forEach(quest => {
      progress[quest.id] = calculateQuestProgress(quest, campaignQuests);
    });
    return progress;
  }, [campaignQuests]);

  // Create a new quest
  const createQuest = useCallback(async (formData: EnhancedQuestFormData) => {
    if (!currentCampaign) {
      setError('No campaign selected');
      return null;
    }

    setLoading(true);
    try {
      // Validate dependencies
      const validation = validateQuestDependencies(
        'temp-id',
        formData.dependencies,
        campaignQuests
      );

      if (!validation.isValid) {
        setError(`Circular dependency detected: ${validation.circularDependencies.join(', ')}`);
        return null;
      }

      // Create milestones with IDs
      const milestones: QuestMilestone[] = formData.milestones.map((milestone, index) => ({
        ...milestone,
        id: uuidv4(),
        order: index,
      }));

      const questData: Omit<EnhancedQuest, 'id'> = {
        campaignId: currentCampaign.id,
        title: formData.title,
        description: formData.description,
        importance: formData.importance,
        status: formData.status,
        startNpcId: formData.startNpcId,
        involvedNpcIds: formData.involvedNpcIds,
        locationIds: formData.locationIds,
        dependencies: formData.dependencies,
        milestones,
        xpReward: formData.xpReward,
        goldReward: formData.goldReward,
        itemRewards: formData.itemRewards,
        rewards: formData.rewards,
        notes: formData.notes,
        playerNotes: formData.playerNotes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const questId = await QuestService.createQuest(questData as any);
      const newQuest: EnhancedQuest = { ...questData, id: questId };
      
      addQuest(newQuest as any);
      return newQuest;
    } catch (error) {
      console.error('Error creating quest:', error);
      setError('Failed to create quest');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentCampaign, campaignQuests, addQuest, setLoading, setError]);

  // Update an existing quest
  const updateQuestData = useCallback(async (
    questId: string,
    formData: Partial<EnhancedQuestFormData>
  ) => {
    setLoading(true);
    try {
      // Validate dependencies if they're being updated
      if (formData.dependencies) {
        const validation = validateQuestDependencies(
          questId,
          formData.dependencies,
          campaignQuests
        );

        if (!validation.isValid) {
          setError(`Circular dependency detected: ${validation.circularDependencies.join(', ')}`);
          return false;
        }
      }

      // Update milestones with IDs if needed
      let milestones: QuestMilestone[] | undefined;
      if (formData.milestones) {
        milestones = formData.milestones.map((milestone, index) => ({
          ...milestone,
          id: (milestone as any).id || uuidv4(),
          order: index,
        }));
      }

      const updateData: Partial<EnhancedQuest> = {
        ...formData,
        milestones,
        updatedAt: new Date(),
      };

      // Add completedAt if status is being set to completed
      if (formData.status === 'completed' && !updateData.completedAt) {
        updateData.completedAt = new Date();
      }

      await QuestService.updateQuest(questId, updateData as any);
      updateQuest(questId, updateData as any);
      return true;
    } catch (error) {
      console.error('Error updating quest:', error);
      setError('Failed to update quest');
      return false;
    } finally {
      setLoading(false);
    }
  }, [campaignQuests, updateQuest, setLoading, setError]);

  // Complete a milestone
  const completeMilestone = useCallback(async (
    questId: string,
    milestoneId: string
  ) => {
    const quest = campaignQuests.find(q => q.id === questId);
    if (!quest) return false;

    const updatedMilestones = quest.milestones.map(milestone =>
      milestone.id === milestoneId
        ? { ...milestone, completed: true, completedAt: new Date() }
        : milestone
    );

    return updateQuestData(questId, { milestones: updatedMilestones });
  }, [campaignQuests, updateQuestData]);

  // Complete a quest
  const completeQuest = useCallback(async (questId: string) => {
    const quest = campaignQuests.find(q => q.id === questId);
    if (!quest) return false;

    // Check if quest can be completed (dependencies satisfied)
    if (!canStartQuest(quest, campaignQuests)) {
      setError('Cannot complete quest: dependencies not satisfied');
      return false;
    }

    return updateQuestData(questId, {
      status: 'completed',
    });
  }, [campaignQuests, updateQuestData, setError]);

  // Delete a quest
  const deleteQuestData = useCallback(async (questId: string) => {
    setLoading(true);
    try {
      // Check if other quests depend on this one
      const dependentQuests = getDependentQuests(questId, campaignQuests);
      if (dependentQuests.length > 0) {
        setError(`Cannot delete quest: ${dependentQuests.length} other quest(s) depend on it`);
        return false;
      }

      await QuestService.deleteQuest(questId);
      deleteQuest(questId);
      return true;
    } catch (error) {
      console.error('Error deleting quest:', error);
      setError('Failed to delete quest');
      return false;
    } finally {
      setLoading(false);
    }
  }, [campaignQuests, deleteQuest, setLoading, setError]);

  // Get quest timeline
  const getQuestTimeline = useCallback((questId: string): QuestTimelineEvent[] => {
    const quest = campaignQuests.find(q => q.id === questId);
    if (!quest) return [];
    return generateQuestTimeline(quest, campaignQuests);
  }, [campaignQuests]);

  // Search and filter functions
  const updateSearchOptions = useCallback((options: Partial<QuestSearchOptions>) => {
    setSearchOptions(prev => ({ ...prev, ...options }));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchOptions({
      query: '',
      sortBy: 'title',
      sortOrder: 'asc',
    });
  }, []);

  // Get quest by ID
  const getQuest = useCallback((questId: string): EnhancedQuest | undefined => {
    return campaignQuests.find(q => q.id === questId);
  }, [campaignQuests]);

  // Get available quests for dependencies (excluding the current quest and its dependents)
  const getAvailableQuestDependencies = useCallback((currentQuestId?: string): EnhancedQuest[] => {
    return campaignQuests.filter(quest => {
      if (currentQuestId && quest.id === currentQuestId) return false;
      if (currentQuestId && quest.dependencies.includes(currentQuestId)) return false;
      return true;
    });
  }, [campaignQuests]);

  return {
    // Data
    quests: filteredQuests,
    allQuests: campaignQuests,
    questProgress,
    searchOptions,

    // Actions
    createQuest,
    updateQuest: updateQuestData,
    deleteQuest: deleteQuestData,
    completeQuest,
    completeMilestone,

    // Search and filter
    updateSearchOptions,
    clearSearch,

    // Utilities
    getQuest,
    getQuestTimeline,
    getAvailableQuestDependencies,
    createMilestone,

    // Validation
    validateDependencies: (questId: string, dependencies: string[]) =>
      validateQuestDependencies(questId, dependencies, campaignQuests),
    canStartQuest: (questId: string) => {
      const quest = getQuest(questId);
      return quest ? canStartQuest(quest, campaignQuests) : false;
    },
  };
}
