import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  DocumentDuplicateIcon,
  StarIcon,
  FolderIcon,
  TagIcon
} from '@heroicons/react/24/outline';

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: 'npc' | 'quest' | 'location' | 'campaign' | 'general';
  tags: string[];
  isFavorite: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ContentTemplatesProps {
  onUseTemplate: (template: ContentTemplate) => void;
  onSaveTemplate?: (template: Omit<ContentTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onUpdateTemplate?: (templateId: string, updates: Partial<ContentTemplate>) => void;
  className?: string;
}

export function ContentTemplates({ 
  onUseTemplate, 
  onSaveTemplate, 
  onDeleteTemplate, 
  onUpdateTemplate, 
  className = '' 
}: ContentTemplatesProps) {
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContentTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ContentTemplate['category'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample templates - in a real app, these would come from a database
  useEffect(() => {
    const sampleTemplates: ContentTemplate[] = [
      {
        id: '1',
        name: 'Mysterious Merchant',
        description: 'Create a mysterious merchant NPC with hidden motives',
        prompt: 'Create a mysterious merchant NPC who travels between towns. They should have a hidden agenda and interesting backstory. Include their appearance, personality, motivations, and any secrets they might be hiding.',
        category: 'npc',
        tags: ['merchant', 'mysterious', 'traveler'],
        isFavorite: true,
        usageCount: 15,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
      },
      {
        id: '2',
        name: 'Ancient Ruins Quest',
        description: 'Generate a quest involving ancient ruins and lost artifacts',
        prompt: 'Create a quest that involves exploring ancient ruins to find a lost artifact. Include the quest giver, objectives, potential challenges, and rewards. Make it suitable for a mid-level party.',
        category: 'quest',
        tags: ['ruins', 'artifact', 'exploration'],
        isFavorite: false,
        usageCount: 8,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-18'),
      },
      {
        id: '3',
        name: 'Floating City',
        description: 'Design a magical floating city location',
        prompt: 'Create a detailed description of a magical floating city. Include its architecture, inhabitants, economy, politics, and any unique magical properties. Describe how it stays afloat and what makes it special.',
        category: 'location',
        tags: ['floating', 'magical', 'city'],
        isFavorite: true,
        usageCount: 12,
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-15'),
      },
    ];
    setTemplates(sampleTemplates);
  }, []);

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const sortedTemplates = filteredTemplates.sort((a, b) => {
    // Sort by favorite first, then by usage count
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return b.usageCount - a.usageCount;
  });

  const handleCreateTemplate = () => {
    setShowCreateForm(true);
    setEditingTemplate(null);
  };

  const handleEditTemplate = (template: ContentTemplate) => {
    setEditingTemplate(template);
    setShowCreateForm(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (onDeleteTemplate) {
      onDeleteTemplate(templateId);
    } else {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    }
  };

  const handleToggleFavorite = (templateId: string) => {
    const updatedTemplates = templates.map(template =>
      template.id === templateId 
        ? { ...template, isFavorite: !template.isFavorite }
        : template
    );
    setTemplates(updatedTemplates);
    
    if (onUpdateTemplate) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        onUpdateTemplate(templateId, { isFavorite: !template.isFavorite });
      }
    }
  };

  const getCategoryIcon = (category: ContentTemplate['category']) => {
    const icons = {
      npc: '👤',
      quest: '📜',
      location: '🏰',
      campaign: '🎭',
      general: '💡',
    };
    return icons[category];
  };

  const getCategoryColor = (category: ContentTemplate['category']) => {
    const colors = {
      npc: 'bg-blue-100 text-blue-800',
      quest: 'bg-purple-100 text-purple-800',
      location: 'bg-green-100 text-green-800',
      campaign: 'bg-yellow-100 text-yellow-800',
      general: 'bg-gray-100 text-gray-800',
    };
    return colors[category];
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Content Templates</h3>
        <button
          onClick={handleCreateTemplate}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          New Template
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <DocumentDuplicateIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'npc', 'quest', 'location', 'campaign', 'general'] as const).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'All' : (
                <>
                  <span className="mr-1">{getCategoryIcon(category)}</span>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Templates List */}
      <div className="p-4">
        {sortedTemplates.length === 0 ? (
          <div className="text-center py-8">
            <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">
              {searchQuery || selectedCategory !== 'all' 
                ? 'No templates match your search criteria.'
                : 'No templates available. Create your first template!'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTemplates.map(template => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getCategoryIcon(template.category)}</span>
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      {template.isFavorite && (
                        <StarIcon className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(template.category)}`}>
                        {template.category}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Used {template.usageCount} times</span>
                      <span>Created {template.createdAt.toLocaleDateString()}</span>
                    </div>

                    {/* Tags */}
                    {template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.tags.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                          >
                            <TagIcon className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 ml-4">
                    <button
                      onClick={() => handleToggleFavorite(template.id)}
                      className={`p-1 rounded ${
                        template.isFavorite 
                          ? 'text-yellow-500 hover:text-yellow-600' 
                          : 'text-gray-400 hover:text-yellow-500'
                      }`}
                      title={template.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <StarIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onUseTemplate(template)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Use
                    </button>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="Edit template"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="Delete template"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </h3>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  defaultValue={editingTemplate?.name || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Template name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  defaultValue={editingTemplate?.description || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  defaultValue={editingTemplate?.category || 'general'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="npc">NPC</option>
                  <option value="quest">Quest</option>
                  <option value="location">Location</option>
                  <option value="campaign">Campaign</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
                <textarea
                  defaultValue={editingTemplate?.prompt || ''}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter the AI prompt for this template..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  defaultValue={editingTemplate?.tags.join(', ') || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
