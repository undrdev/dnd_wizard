import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { aiUsageLogger } from '@/lib/aiUsageLogging';
import type { AIUsageStats, AIUsageFilters, AIUsageLog } from '@/types';

interface AIUsageDashboardProps {
  campaignId?: string;
  userId?: string;
  className?: string;
}

export function AIUsageDashboard({ campaignId, userId, className = '' }: AIUsageDashboardProps) {
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AIUsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AIUsageFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate: new Date(),
    campaignId,
    userId,
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, logsData] = await Promise.all([
        aiUsageLogger.getUsageStats(filters),
        aiUsageLogger.getRecentLogs(20, filters)
      ]);
      setStats(statsData);
      setRecentLogs(logsData);
    } catch (error) {
      console.error('Failed to load usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  const getCommandTypeColor = (type: string) => {
    const colors = {
      campaign_generation: 'bg-purple-100 text-purple-800',
      npc_creation: 'bg-blue-100 text-blue-800',
      quest_creation: 'bg-green-100 text-green-800',
      location_creation: 'bg-yellow-100 text-yellow-800',
      content_generation: 'bg-indigo-100 text-indigo-800',
      suggestion: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const getFeedbackColor = (feedback: string) => {
    const colors = {
      accepted: 'text-green-600',
      rejected: 'text-red-600',
      modified: 'text-yellow-600',
    };
    return colors[feedback as keyof typeof colors] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <p className="text-gray-500 text-center">No usage data available</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ChartBarIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">AI Usage Analytics</h2>
          </div>
          
          {/* Date Range Filter */}
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={filters.startDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                startDate: e.target.value ? new Date(e.target.value) : undefined 
              }))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={filters.endDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                endDate: e.target.value ? new Date(e.target.value) : undefined 
              }))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Commands</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalCommands}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Total Cost</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalCost)}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Total Tokens</p>
                <p className="text-2xl font-bold text-purple-900">{formatTokens(stats.totalTokens)}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Success Rate</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Command Type Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Command Types</h3>
            <div className="space-y-3">
              {stats.mostUsedCommands.map((cmd) => (
                <div key={cmd.commandType} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${getCommandTypeColor(cmd.commandType)}`}></span>
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {cmd.commandType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{cmd.count}</p>
                    <p className="text-xs text-gray-500">{cmd.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Feedback */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Feedback</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm text-gray-700">Accepted</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {stats.userFeedbackStats.accepted}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <XCircleIcon className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-sm text-gray-700">Rejected</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {stats.userFeedbackStats.rejected}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-sm text-gray-700">Modified</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {stats.userFeedbackStats.modified}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                {stats.userFeedbackStats.totalWithFeedback} out of {stats.totalCommands} commands have feedback
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCommandTypeColor(log.commandType)}`}>
                    {log.commandType.replace('_', ' ')}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {log.command.substring(0, 50)}...
                    </p>
                    <p className="text-xs text-gray-500">
                      {log.createdAt.toLocaleDateString()} • {formatTokens(log.totalTokens)} tokens • {formatCurrency(log.estimatedCost)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {log.success ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-red-600" />
                  )}
                  {log.userFeedback && (
                    <span className={`text-xs font-medium ${getFeedbackColor(log.userFeedback)}`}>
                      {log.userFeedback}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
