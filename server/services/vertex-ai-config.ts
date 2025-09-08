import { GoogleAuth } from 'google-auth-library';
import { OpenAI } from 'openai';

export interface VertexAIConfig {
  projectId: string;
  region: string;
  endpointId: string;
  apiKey?: string;
  credentialsPath?: string;
  oauthClientCredentialsPath?: string;
  oauthAccessToken?: string;
}

export interface VertexAIClient {
  client: OpenAI;
  refreshToken: () => Promise<void>;
  isAvailable: () => boolean;
}

export class VertexAIService {
  private auth: GoogleAuth | null = null;
  private config: VertexAIConfig;
  private client: OpenAI | null = null;
  private lastTokenRefresh: number = 0;
  private tokenExpiryBuffer: number = 300000; // 5 minutes before expiry
  private initializationError: string | null = null;

  constructor(config?: Partial<VertexAIConfig>) {
    this.config = {
      projectId: config?.projectId || process.env.GCP_PROJECT_ID || '',
      region: config?.region || process.env.GCP_REGION || 'asia-southeast1',
      endpointId: config?.endpointId || process.env.GCP_ENDPOINT_ID || '',
      apiKey: config?.apiKey || process.env.GOOGLE_API_KEY,
      credentialsPath: config?.credentialsPath || process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
      oauthClientCredentialsPath: config?.oauthClientCredentialsPath || process.env.GOOGLE_OAUTH_CLIENT_CREDENTIALS,
      oauthAccessToken: config?.oauthAccessToken || process.env.GOOGLE_OAUTH_ACCESS_TOKEN
    };

    // Validate configuration
    if (!this.config.projectId || !this.config.endpointId) {
      this.initializationError = 'Missing required GCP configuration: PROJECT_ID and ENDPOINT_ID are required';
      console.error('Vertex AI initialization failed:', this.initializationError);
      return;
    }

    // Initialize Google Auth based on available credentials
    try {
      // Define comprehensive scopes for ML and Vertex AI operations
      const vertexAIScopes = [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/cloud-platform.read-only',
        'https://www.googleapis.com/auth/aiplatform'
      ];

      if (this.config.credentialsPath) {
        console.log('Using service account credentials file:', this.config.credentialsPath);
        this.auth = new GoogleAuth({
          scopes: vertexAIScopes,
          keyFilename: this.config.credentialsPath
        });
      } else if (this.config.apiKey) {
        console.log('Using Google API Key authentication');
        // We'll handle this in initializeClient() - no GoogleAuth needed for API key
      } else if (this.config.oauthAccessToken) {
        console.log('Using OAuth access token authentication');
        // We'll handle this in initializeClient()
      } else if (this.config.oauthClientCredentialsPath) {
        console.log('Using OAuth client credentials file:', this.config.oauthClientCredentialsPath);
        this.auth = new GoogleAuth({
          scopes: vertexAIScopes,
          keyFilename: this.config.oauthClientCredentialsPath
        });
      } else {
        console.log('Using default application credentials');
        this.auth = new GoogleAuth({
          scopes: vertexAIScopes
        });
      }

      console.log('Vertex AI service initialized successfully');
      console.log('Project:', this.config.projectId);
      console.log('Region:', this.config.region);
      console.log('Endpoint:', this.config.endpointId);
    } catch (error) {
      this.initializationError = `Failed to initialize Google Auth: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('Vertex AI initialization failed:', this.initializationError);
    }
  }

  /**
   * Get the base URL for the Vertex AI endpoint
   * Fixed format for custom model endpoints
   */
  private getBaseUrl(): string {
    // Updated endpoint format for Vertex AI custom models
    return `https://${this.config.region}-aiplatform.googleapis.com/v1/projects/${this.config.projectId}/locations/${this.config.region}/endpoints/${this.config.endpointId}:predict`;
  }

  /**
   * Initialize or refresh the OpenAI client with current auth token
   */
  private async initializeClient(): Promise<void> {
    if (this.initializationError) {
      throw new Error(this.initializationError);
    }

    try {
      let accessToken: string;

      // Handle different authentication methods
      if (this.config.apiKey) {
        // Use Google API Key directly - no token refresh needed
        accessToken = this.config.apiKey;
        console.log('Using Google API Key');
      } else if (this.config.oauthAccessToken) {
        // Use provided OAuth access token directly
        accessToken = this.config.oauthAccessToken;
        console.log('Using provided OAuth access token');
      } else if (this.auth) {
        // Use GoogleAuth to get token (works for service accounts and OAuth client credentials)
        const authClient = await this.auth.getClient();
        const tokenResponse = await authClient.getAccessToken();
        
        if (!tokenResponse.token) {
          throw new Error('Failed to obtain access token from Google Cloud. Verify service account permissions.');
        }
        
        accessToken = tokenResponse.token;
        console.log('✅ Obtained access token via GoogleAuth');
      } else {
        throw new Error('No authentication method configured. Ensure GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_API_KEY is set.');
      }

      // Create OpenAI client with Vertex AI endpoint
      this.client = new OpenAI({
        apiKey: accessToken,
        baseURL: this.getBaseUrl(),
        defaultHeaders: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      this.lastTokenRefresh = Date.now();
      console.log('✅ Vertex AI client initialized with authentication');
      console.log('🔗 Endpoint:', this.getBaseUrl());

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to initialize Vertex AI client:', errorMessage);
      throw new Error(`Vertex AI authentication failed: ${errorMessage}`);
    }
  }

  /**
   * Check if token needs refresh (tokens expire after 1 hour, but API keys don't expire)
   */
  private needsTokenRefresh(): boolean {
    // API keys don't expire, so no refresh needed
    if (this.config.apiKey) {
      return !this.client;
    }

    if (!this.client || !this.lastTokenRefresh) {
      return true;
    }
    
    const now = Date.now();
    const timeSinceRefresh = now - this.lastTokenRefresh;
    const oneHourMinusBuffer = 3600000 - this.tokenExpiryBuffer; // 55 minutes
    
    return timeSinceRefresh >= oneHourMinusBuffer;
  }

  /**
   * Get the OpenAI client, refreshing token if necessary
   */
  async getClient(): Promise<OpenAI> {
    if (this.needsTokenRefresh()) {
      await this.initializeClient();
    }

    if (!this.client) {
      throw new Error('Vertex AI client is not initialized');
    }

    return this.client;
  }

  /**
   * Test connection to Vertex AI endpoint
   */
  async testConnection(): Promise<{ success: boolean; message: string; endpoint?: string }> {
    try {
      const client = await this.getClient();
      
      // Test with a simple completion request
      const completion = await client.chat.completions.create({
        model: 'test', // The model name isn't used in Vertex AI endpoint calls
        messages: [
          { role: 'user', content: 'Hello! Please respond with "Connection successful"' }
        ],
        max_tokens: 50,
        temperature: 0.1
      });

      const response = completion.choices[0]?.message?.content?.trim() || '';
      
      return {
        success: true,
        message: 'Vertex AI connection successful',
        endpoint: this.getBaseUrl()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Vertex AI connection test failed:', errorMessage);
      
      return {
        success: false,
        message: `Vertex AI connection failed: ${errorMessage}`,
        endpoint: this.getBaseUrl()
      };
    }
  }

  /**
   * Check if Vertex AI is available and properly configured
   */
  isAvailable(): boolean {
    return this.initializationError === null && 
           !!this.config.projectId && 
           !!this.config.endpointId &&
           (!!this.config.apiKey || !!this.config.oauthAccessToken || !!this.config.credentialsPath || !!this.config.oauthClientCredentialsPath);
  }

  /**
   * Get current configuration
   */
  getConfig(): VertexAIConfig {
    return { ...this.config };
  }

  /**
   * Force refresh the authentication token
   */
  async refreshToken(): Promise<void> {
    await this.initializeClient();
  }

  /**
   * Generic method for generating responses using Vertex AI
   */
  async generateResponse(options: {
    messages: Array<{ role: string; content: string }>;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
  }): Promise<string> {
    try {
      const client = await this.getClient();
      
      const completion = await client.chat.completions.create({
        model: 'vertex-ai-model', // Model name is ignored by Vertex AI endpoint
        messages: options.messages as any,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        stream: false
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in Vertex AI response');
      }

      return content.trim();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Enhanced error logging for debugging
      if (error && typeof error === 'object' && 'status' in error) {
        const statusError = error as any;
        console.error('🚨 Vertex AI error details:', {
          status: statusError.status,
          statusText: statusError.statusText,
          message: errorMessage,
          endpoint: this.getBaseUrl(),
          hasAuth: !!this.client,
          tokenAge: this.lastTokenRefresh ? Date.now() - this.lastTokenRefresh : 'No token'
        });
        
        if (statusError.status === 401) {
          console.error('❌ 401 Unauthorized: Token might be expired or service account lacks permissions');
          console.error('💡 Troubleshooting: Check service account has Vertex AI User role');
        } else if (statusError.status === 404) {
          console.error('❌ 404 Not Found: Endpoint might not exist or is incorrectly formatted');
          console.error('💡 Check GCP_ENDPOINT_ID and ensure the model is deployed');
        }
      } else {
        console.error('🚨 Vertex AI response generation failed:', errorMessage);
      }
      
      throw new Error(`Vertex AI generation failed: ${errorMessage}`);
    }
  }
}

// Export singleton instance
let vertexAIService: VertexAIService;

export function getVertexAIService(): VertexAIService {
  if (!vertexAIService) {
    vertexAIService = new VertexAIService();
  }
  return vertexAIService;
}

export { vertexAIService };