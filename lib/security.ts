/**
 * Security Utilities and Validation
 * Provides input sanitization, XSS prevention, and security validation
 */

export interface SecurityResult {
  isSecure: boolean;
  threats: string[];
  sanitized?: string;
}

export interface SecurityConfig {
  allowHtml?: boolean;
  allowedTags?: string[];
  allowedAttributes?: string[];
  maxLength?: number;
  preventXSS?: boolean;
  preventSQLInjection?: boolean;
  preventCommandInjection?: boolean;
}

class SecurityService {
  private readonly defaultConfig: SecurityConfig = {
    allowHtml: false,
    allowedTags: [],
    allowedAttributes: [],
    maxLength: 10000,
    preventXSS: true,
    preventSQLInjection: true,
    preventCommandInjection: true
  };

  // XSS patterns to detect and prevent
  private readonly xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
    /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /on\w+\s*=/gi, // Event handlers like onclick, onload, etc.
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /@import/gi,
    /binding\s*:/gi
  ];

  // SQL injection patterns
  private readonly sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(\b(UNION|OR|AND)\b.*\b(SELECT|INSERT|UPDATE|DELETE)\b)/gi,
    /(--|\/\*|\*\/)/g,
    /(\b(CHAR|NCHAR|VARCHAR|NVARCHAR)\b\s*\(\s*\d+\s*\))/gi,
    /(\b(CAST|CONVERT)\b\s*\()/gi,
    /(0x[0-9A-F]+)/gi,
    /(\b(WAITFOR|DELAY)\b)/gi,
    /(\b(sp_|xp_)\w+)/gi
  ];

  // Command injection patterns
  private readonly commandInjectionPatterns = [
    /[;&|`$(){}[\]]/g,
    /\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig|ping|wget|curl|nc|telnet|ssh|ftp|chmod|chown|rm|mv|cp|mkdir|rmdir)\b/gi,
    /(\.\.\/|\.\.\\)/g,
    /(\$\{|\$\()/g,
    /(\|\s*(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig|ping|wget|curl|nc|telnet|ssh|ftp|chmod|chown|rm|mv|cp|mkdir|rmdir))/gi
  ];

  // Path traversal patterns
  private readonly pathTraversalPatterns = [
    /(\.\.\/|\.\.\\)/g,
    /(%2e%2e%2f|%2e%2e%5c)/gi,
    /(%252e%252e%252f|%252e%252e%255c)/gi,
    /(\.\.%2f|\.\.%5c)/gi,
    /(%2e%2e\/|%2e%2e\\)/gi
  ];

  /**
   * Sanitize input string to prevent XSS and other attacks
   */
  sanitizeInput(input: string, config: SecurityConfig = {}): string {
    if (typeof input !== 'string') {
      return '';
    }

    const mergedConfig = { ...this.defaultConfig, ...config };
    let sanitized = input;

    // Trim and limit length
    sanitized = sanitized.trim();
    if (mergedConfig.maxLength && sanitized.length > mergedConfig.maxLength) {
      sanitized = sanitized.substring(0, mergedConfig.maxLength);
    }

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Remove XSS patterns first
    if (mergedConfig.preventXSS) {
      sanitized = this.removeXSSPatterns(sanitized);
    }

    // Remove SQL injection patterns
    if (mergedConfig.preventSQLInjection) {
      sanitized = this.removeSQLInjectionPatterns(sanitized);
    }

    // Remove command injection patterns
    if (mergedConfig.preventCommandInjection) {
      sanitized = this.removeCommandInjectionPatterns(sanitized);
    }

    // Handle HTML content after pattern removal
    if (!mergedConfig.allowHtml) {
      // Escape HTML entities
      sanitized = this.escapeHtml(sanitized);
    } else {
      // Sanitize HTML while preserving allowed tags
      sanitized = this.sanitizeHtml(sanitized, mergedConfig);
    }

    return sanitized;
  }

  /**
   * Check if input contains security threats
   */
  checkSecurity(input: string, config: SecurityConfig = {}): SecurityResult {
    if (typeof input !== 'string') {
      return { isSecure: false, threats: ['Invalid input type'] };
    }

    const mergedConfig = { ...this.defaultConfig, ...config };
    const threats: string[] = [];

    // Check length
    if (mergedConfig.maxLength && input.length > mergedConfig.maxLength) {
      threats.push(`Input exceeds maximum length of ${mergedConfig.maxLength} characters`);
    }

    // Check for null bytes
    if (input.includes('\0')) {
      threats.push('Null byte detected');
    }

    // Check for XSS
    if (mergedConfig.preventXSS && this.detectXSS(input)) {
      threats.push('Potential XSS attack detected');
    }

    // Check for SQL injection
    if (mergedConfig.preventSQLInjection && this.detectSQLInjection(input)) {
      threats.push('Potential SQL injection detected');
    }

    // Check for command injection
    if (mergedConfig.preventCommandInjection && this.detectCommandInjection(input)) {
      threats.push('Potential command injection detected');
    }

    // Check for path traversal
    if (this.detectPathTraversal(input)) {
      threats.push('Path traversal attempt detected');
    }

    const sanitized = threats.length > 0 ? this.sanitizeInput(input, config) : input;

    return {
      isSecure: threats.length === 0,
      threats,
      sanitized
    };
  }

  /**
   * Validate file upload security
   */
  validateFileUpload(file: File, allowedTypes: string[] = [], maxSize: number = 5 * 1024 * 1024): SecurityResult {
    const threats: string[] = [];

    // Check file size
    if (file.size > maxSize) {
      threats.push(`File size exceeds maximum of ${maxSize} bytes`);
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      threats.push(`File type ${file.type} is not allowed`);
    }

    // Check file name for suspicious patterns
    const fileName = file.name;
    if (this.detectPathTraversal(fileName)) {
      threats.push('Suspicious file name detected');
    }

    // Check for double extensions
    const extensions = fileName.split('.').slice(1);
    if (extensions.length > 1) {
      threats.push('Multiple file extensions detected');
    }

    // Check for executable extensions
    const executableExtensions = ['exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar', 'php', 'asp', 'jsp'];
    const fileExtension = extensions[extensions.length - 1]?.toLowerCase();
    if (fileExtension && executableExtensions.includes(fileExtension)) {
      threats.push('Executable file type detected');
    }

    return {
      isSecure: threats.length === 0,
      threats
    };
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    // Use crypto.getRandomValues if available (browser)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
    } else {
      // Fallback to Math.random (less secure)
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    
    return result;
  }

  /**
   * Hash password securely (client-side pre-hashing)
   */
  async hashPassword(password: string, salt?: string): Promise<string> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new Error('Web Crypto API not available');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(password + (salt || ''));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    isStrong: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password should be at least 8 characters long');
    }

    if (password.length >= 12) {
      score += 1;
    }

    // Character variety checks
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain uppercase letters');
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain numbers');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain special characters');
    }

    // Common password check
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.includes(password.toLowerCase())) {
      score = 0;
      feedback.push('Password is too common');
    }

    return {
      isStrong: score >= 4,
      score,
      feedback
    };
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  private sanitizeHtml(html: string, config: SecurityConfig): string {
    // Basic HTML sanitization - in production, use a library like DOMPurify
    let sanitized = html;
    
    // Remove script tags and their content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove dangerous attributes
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\s*javascript\s*:/gi, '');
    
    return sanitized;
  }

  private removeXSSPatterns(input: string): string {
    let cleaned = input;
    this.xssPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    return cleaned;
  }

  private removeSQLInjectionPatterns(input: string): string {
    let cleaned = input;
    this.sqlInjectionPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    return cleaned;
  }

  private removeCommandInjectionPatterns(input: string): string {
    let cleaned = input;
    this.commandInjectionPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    return cleaned;
  }

  private detectXSS(input: string): boolean {
    return this.xssPatterns.some(pattern => pattern.test(input));
  }

  private detectSQLInjection(input: string): boolean {
    return this.sqlInjectionPatterns.some(pattern => pattern.test(input));
  }

  private detectCommandInjection(input: string): boolean {
    return this.commandInjectionPatterns.some(pattern => pattern.test(input));
  }

  private detectPathTraversal(input: string): boolean {
    return this.pathTraversalPatterns.some(pattern => pattern.test(input));
  }
}

// Export singleton instance
export const securityService = new SecurityService();

// Convenience functions
export const sanitizeInput = (input: string, config?: SecurityConfig) => 
  securityService.sanitizeInput(input, config);

export const checkSecurity = (input: string, config?: SecurityConfig) => 
  securityService.checkSecurity(input, config);

export const validateFileUpload = (file: File, allowedTypes?: string[], maxSize?: number) => 
  securityService.validateFileUpload(file, allowedTypes, maxSize);

export const generateSecureToken = (length?: number) => 
  securityService.generateSecureToken(length);

export const validatePasswordStrength = (password: string) => 
  securityService.validatePasswordStrength(password);

export default securityService;
