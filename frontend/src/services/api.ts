const API_BASE_URL = 'https://veritas-ai-backend-db28.onrender.com/api/v1';

export const apiService = {
  // Root endpoint
  getRoot: async () => {
    const response = await fetch(`${API_BASE_URL}/`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'API not available');
    }
    return data;
  },

  // Authentication endpoints
  signup: async (userData: { email: string; password: string; full_name: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Signup failed');
    }
    return data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    formData.append('grant_type', 'password');
    
    const response = await fetch(`${API_BASE_URL}/auth/token`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Login failed');
    }
    return data;
  },

  // Claims endpoints
  getClaims: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/claims/`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to fetch claims');
    }
    return data;
  },

  getClaimById: async (claimId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/claims/${claimId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to fetch claim');
    }
    return data;
  },

  createClaim: async (fileCount: number, additionalInfo: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/claims/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        file_count: fileCount,
        additional_info: additionalInfo
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to create claim');
    }
    return data;
  },

  // Trigger forensic analysis
  triggerAnalysis: async (claimId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/claims/${claimId}/trigger-analysis`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}` 
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to trigger analysis');
    }
    return data;
  },

  // Start conversation with Amazon Q
  startConversation: async (claimId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/investigate/${claimId}/start-conversation`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}` 
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to start conversation');
    }
    return data;
  },

  // AI Co-pilot endpoint with conversation context
  investigate: async (claimId: string, query: string, token: string, conversationId?: string, parentMessageId?: string) => {
    const response = await fetch(`${API_BASE_URL}/investigate/${claimId}/query`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ 
        query,
        ...(conversationId && { conversationId }),
        ...(parentMessageId && { parentMessageId })
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to get AI response');
    }
    return data;
  },

  // File upload to S3 presigned URL (matches working HTML client pattern)
  uploadFileToS3: async (file: File, uploadData: any) => {
    const formData = new FormData();
    
    // Add all the required S3 fields first
    Object.keys(uploadData.fields).forEach(key => {
      formData.append(key, uploadData.fields[key]);
    });
    
    // Add the file last (S3 requirement)
    formData.append('file', file);
    
    const response = await fetch(uploadData.url, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload ${file.name}`);
    }
    return response;
  }
};