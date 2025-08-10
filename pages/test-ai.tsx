import React, { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function TestAI() {
  const [prompt, setPrompt] = useState('Generate a simple D&D character name and race.');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testAPI = async () => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: 'gpt-4-turbo',
          systemMessage: 'You are a helpful D&D assistant.',
          temperature: 0.7,
          maxTokens: 500,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Unknown error');
        return;
      }

      setResponse(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <SparklesIcon className="h-6 w-6 text-purple-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">OpenAI API Test</h1>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your test prompt..."
              />
            </div>

            <button
              onClick={testAPI}
              disabled={loading || !prompt.trim()}
              className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Testing API...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Test OpenAI API
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-sm font-medium text-red-800 mb-2">Error:</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {response && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="text-sm font-medium text-green-800 mb-2">Response:</h3>
                <p className="text-sm text-green-700 whitespace-pre-wrap">{response}</p>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Instructions:</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Make sure you have set your OpenAI API key in the .env.local file</li>
                <li>2. The API key should be set as: OPENAI_API_KEY=your_key_here</li>
                <li>3. Restart the development server after adding the API key</li>
                <li>4. This test page helps verify the API integration is working</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
