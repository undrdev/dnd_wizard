// AI Error Types and Handling
export interface AIError {
  type: 'authentication' | 'quota' | 'model' | 'network' | 'rate_limit' | 'content_filter' | 'unknown';
  message: string;
  userMessage: string;
  provider: 'openai' | 'anthropic' | 'unknown';
  statusCode?: number;
  retryable: boolean;
}

export interface AIProviderError {
  status: number;
  statusText: string;
  body: string;
  provider: 'openai' | 'anthropic';
}

// Parse OpenAI API errors
export function parseOpenAIError(error: AIProviderError): AIError {
  const { status, body } = error;
  
  try {
    const errorData = JSON.parse(body);
    const errorMessage = errorData.error?.message || errorData.message || 'Unknown error';
    
    switch (status) {
      case 401:
        return {
          type: 'authentication',
          message: errorMessage,
          userMessage: 'Your API key is invalid or has expired. Please check your OpenAI API key in the AI settings.',
          provider: 'openai',
          statusCode: status,
          retryable: false,
        };
        
      case 403:
        if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
          return {
            type: 'quota',
            message: errorMessage,
            userMessage: 'You have exceeded your OpenAI API quota or billing limit. Please check your OpenAI account billing.',
            provider: 'openai',
            statusCode: status,
            retryable: false,
          };
        }
        return {
          type: 'authentication',
          message: errorMessage,
          userMessage: 'Access denied. Please check your OpenAI API key permissions.',
          provider: 'openai',
          statusCode: status,
          retryable: false,
        };
        
      case 404:
        if (errorMessage.includes('model')) {
          return {
            type: 'model',
            message: errorMessage,
            userMessage: 'The specified AI model was not found. Please check your model selection in AI settings.',
            provider: 'openai',
            statusCode: status,
            retryable: false,
          };
        }
        return {
          type: 'unknown',
          message: errorMessage,
          userMessage: 'The requested resource was not found. Please try again.',
          provider: 'openai',
          statusCode: status,
          retryable: false,
        };
        
      case 429:
        return {
          type: 'rate_limit',
          message: errorMessage,
          userMessage: 'Rate limit exceeded. Please wait a moment and try again.',
          provider: 'openai',
          statusCode: status,
          retryable: true,
        };
        
      case 400:
        if (errorMessage.includes('content_filter')) {
          return {
            type: 'content_filter',
            message: errorMessage,
            userMessage: 'The generated content was filtered by OpenAI\'s content policy. Please try with a different prompt.',
            provider: 'openai',
            statusCode: status,
            retryable: true,
          };
        }
        if (errorMessage.includes('max_tokens')) {
          return {
            type: 'quota',
            message: errorMessage,
            userMessage: 'The request is too long. Please try with a shorter prompt.',
            provider: 'openai',
            statusCode: status,
            retryable: true,
          };
        }
        return {
          type: 'unknown',
          message: errorMessage,
          userMessage: 'Invalid request. Please check your input and try again.',
          provider: 'openai',
          statusCode: status,
          retryable: false,
        };
        
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: 'network',
          message: errorMessage,
          userMessage: 'OpenAI service is temporarily unavailable. Please try again in a few moments.',
          provider: 'openai',
          statusCode: status,
          retryable: true,
        };
        
      default:
        return {
          type: 'unknown',
          message: errorMessage,
          userMessage: 'An unexpected error occurred with OpenAI. Please try again.',
          provider: 'openai',
          statusCode: status,
          retryable: false,
        };
    }
  } catch (parseError) {
    // Fallback if we can't parse the error response
    return {
      type: 'unknown',
      message: body || 'Unknown error',
      userMessage: `OpenAI API error (${status}). Please try again.`,
      provider: 'openai',
      statusCode: status,
      retryable: status >= 500,
    };
  }
}

// Parse Anthropic API errors
export function parseAnthropicError(error: AIProviderError): AIError {
  const { status, body } = error;
  
  try {
    const errorData = JSON.parse(body);
    const errorMessage = errorData.error?.message || errorData.message || 'Unknown error';
    
    switch (status) {
      case 401:
        return {
          type: 'authentication',
          message: errorMessage,
          userMessage: 'Your API key is invalid or has expired. Please check your Anthropic API key in the AI settings.',
          provider: 'anthropic',
          statusCode: status,
          retryable: false,
        };
        
      case 403:
        if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
          return {
            type: 'quota',
            message: errorMessage,
            userMessage: 'You have exceeded your Anthropic API quota or billing limit. Please check your Anthropic account billing.',
            provider: 'anthropic',
            statusCode: status,
            retryable: false,
          };
        }
        return {
          type: 'authentication',
          message: errorMessage,
          userMessage: 'Access denied. Please check your Anthropic API key permissions.',
          provider: 'anthropic',
          statusCode: status,
          retryable: false,
        };
        
      case 404:
        if (errorMessage.includes('model')) {
          return {
            type: 'model',
            message: errorMessage,
            userMessage: 'The specified AI model was not found. Please check your model selection in AI settings.',
            provider: 'anthropic',
            statusCode: status,
            retryable: false,
          };
        }
        return {
          type: 'unknown',
          message: errorMessage,
          userMessage: 'The requested resource was not found. Please try again.',
          provider: 'anthropic',
          statusCode: status,
          retryable: false,
        };
        
      case 429:
        return {
          type: 'rate_limit',
          message: errorMessage,
          userMessage: 'Rate limit exceeded. Please wait a moment and try again.',
          provider: 'anthropic',
          statusCode: status,
          retryable: true,
        };
        
      case 400:
        if (errorMessage.includes('content_filter')) {
          return {
            type: 'content_filter',
            message: errorMessage,
            userMessage: 'The generated content was filtered by Anthropic\'s content policy. Please try with a different prompt.',
            provider: 'anthropic',
            statusCode: status,
            retryable: true,
          };
        }
        if (errorMessage.includes('max_tokens')) {
          return {
            type: 'quota',
            message: errorMessage,
            userMessage: 'The request is too long. Please try with a shorter prompt.',
            provider: 'anthropic',
            statusCode: status,
            retryable: true,
          };
        }
        return {
          type: 'unknown',
          message: errorMessage,
          userMessage: 'Invalid request. Please check your input and try again.',
          provider: 'anthropic',
          statusCode: status,
          retryable: false,
        };
        
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: 'network',
          message: errorMessage,
          userMessage: 'Anthropic service is temporarily unavailable. Please try again in a few moments.',
          provider: 'anthropic',
          statusCode: status,
          retryable: true,
        };
        
      default:
        return {
          type: 'unknown',
          message: errorMessage,
          userMessage: 'An unexpected error occurred with Anthropic. Please try again.',
          provider: 'anthropic',
          statusCode: status,
          retryable: false,
        };
    }
  } catch (parseError) {
    // Fallback if we can't parse the error response
    return {
      type: 'unknown',
      message: body || 'Unknown error',
      userMessage: `Anthropic API error (${status}). Please try again.`,
      provider: 'anthropic',
      statusCode: status,
      retryable: status >= 500,
    };
  }
}

// Parse generic network errors
export function parseNetworkError(error: Error): AIError {
  const message = error.message.toLowerCase();
  
  if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
    return {
      type: 'network',
      message: error.message,
      userMessage: 'Network connection error. Please check your internet connection and try again.',
      provider: 'unknown',
      retryable: true,
    };
  }
  
  if (message.includes('timeout')) {
    return {
      type: 'network',
      message: error.message,
      userMessage: 'Request timed out. Please try again.',
      provider: 'unknown',
      retryable: true,
    };
  }
  
  return {
    type: 'unknown',
    message: error.message,
    userMessage: 'An unexpected error occurred. Please try again.',
    provider: 'unknown',
    retryable: false,
  };
}

// Get error icon based on error type
export function getErrorIcon(type: AIError['type']) {
  switch (type) {
    case 'authentication':
      return '🔑';
    case 'quota':
      return '💰';
    case 'model':
      return '🤖';
    case 'network':
      return '🌐';
    case 'rate_limit':
      return '⏱️';
    case 'content_filter':
      return '🚫';
    case 'unknown':
    default:
      return '❌';
  }
}

// Get error color based on error type
export function getErrorColor(type: AIError['type']) {
  switch (type) {
    case 'authentication':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'quota':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'model':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'network':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'rate_limit':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'content_filter':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    case 'unknown':
    default:
      return 'text-red-600 bg-red-50 border-red-200';
  }
}

// Get retry suggestion based on error type
export function getRetrySuggestion(error: AIError): string | null {
  if (!error.retryable) return null;
  
  switch (error.type) {
    case 'rate_limit':
      return 'Wait 1-2 minutes before trying again';
    case 'network':
      return 'Check your internet connection and try again';
    case 'content_filter':
      return 'Try rephrasing your request';
    case 'quota':
      return 'Try with a shorter prompt';
    default:
      return 'Try again in a few moments';
  }
}
