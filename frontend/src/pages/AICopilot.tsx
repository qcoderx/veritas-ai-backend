import { useState, useRef, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAppSelector } from '../redux/store';

// TypeScript interfaces
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'error';
  timestamp: string;
}

interface InvestigatorChatProps {
  claimId?: string;
}

const AICopilot: React.FC<InvestigatorChatProps> = ({ claimId }) => {
  const user = useAppSelector((state) => state.auth.user);
  const { token } = useAppSelector((state) => state.auth);
  const [availableClaims, setAvailableClaims] = useState<any[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string>(claimId || '');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [parentMessageId, setParentMessageId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello ${user?.firstName || 'there'}! I'm your AI investigative assistant. I have access to all claim data and can help you dig deeper into fraud patterns, timeline inconsistencies, and evidence analysis. What would you like to investigate?`,
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [userInput]);

  // Fetch available claims
  useEffect(() => {
    const fetchClaims = async () => {
      if (!token) return;
      
      try {
        const claims = await apiService.getClaims(token);
        const claimsArray = Array.isArray(claims) ? claims : [];
        setAvailableClaims(claimsArray);
        
        // Set first claim as default if no claim is selected
        if (!selectedClaimId && claimsArray.length > 0) {
          setSelectedClaimId(claimsArray[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch claims:', error);
      }
    };

    fetchClaims();
  }, [token, selectedClaimId]);

  // Reset conversation when claim changes
  useEffect(() => {
    if (selectedClaimId) {
      setConversationId(null);
      setParentMessageId(null);
    }
  }, [selectedClaimId]);

  // Fetch available claims
  useEffect(() => {
    const fetchClaims = async () => {
      if (!token) return;
      
      try {
        const claims = await apiService.getClaims(token);
        const claimsArray = Array.isArray(claims) ? claims : [];
        setAvailableClaims(claimsArray);
        
        // Set first claim as default if no claim is selected
        if (!selectedClaimId && claimsArray.length > 0) {
          setSelectedClaimId(claimsArray[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch claims:', error);
      }
    };

    fetchClaims();
  }, [token, selectedClaimId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || !selectedClaimId || !token) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: userInput,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      // Start conversation if not already started
      let currentConversationId = conversationId;
      let currentParentMessageId = parentMessageId;
      
      if (!currentConversationId) {
        const conversationResponse = await apiService.startConversation(selectedClaimId, token);
        currentConversationId = conversationResponse.conversationId;
        currentParentMessageId = conversationResponse.systemMessageId;
        setConversationId(currentConversationId);
        setParentMessageId(currentParentMessageId);
      }

      const response = await apiService.investigate(
        selectedClaimId, 
        userMessage.text, 
        token,
        currentConversationId || undefined,
        currentParentMessageId || undefined
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.answer,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Update parent message ID for next query
      if (response.systemMessageId) {
        setParentMessageId(response.systemMessageId);
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error.message || 'Failed to get AI response',
        sender: 'error',
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          <span className="mr-3">🕵️♀️</span>
          Investigator's Cockpit
        </h1>
        <p className="text-slate-400">AI-powered investigative assistant for claim analysis</p>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-400">AI Assistant Online</span>
          </div>
          <div className="text-sm text-slate-400">Selected Claim: {selectedClaimId}</div>
          <div className="text-sm text-slate-400">Investigator: {user?.firstName || 'User'}</div>
        </div>
      </div>

      {/* Claim Selector */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-600">
          <label className="block text-sm font-medium text-slate-300 mb-2">Select Claim to Investigate</label>
          <select 
            value={selectedClaimId}
            onChange={(e) => setSelectedClaimId(e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {availableClaims.length === 0 ? (
              <option value="">Loading claims...</option>
            ) : (
              availableClaims.map((claim) => (
                <option key={claim.id} value={claim.id}>
                  {claim.id} - {claim.status.replace('_', ' ')} - Risk: {claim.fraud_risk_score || 'Pending'}%
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                {message.sender === 'ai' && (
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    AI
                  </div>
                )}
                <div className={`max-w-md p-4 rounded-2xl ${
                  message.sender === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : message.sender === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-200'
                }`}>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p className="text-xs opacity-70 mt-2">{message.timestamp}</p>
                </div>
                {message.sender === 'user' && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user?.firstName?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  AI
                </div>
                <div className="bg-slate-700 p-4 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-slate-400 text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="border-t border-slate-700 p-6">
            <form onSubmit={handleSubmit} className="flex gap-4">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={selectedClaimId ? "Ask about the selected claim..." : "Select a claim first..."}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none min-h-[48px] max-h-32"
                  rows={1}
                />
                <p className="text-xs text-slate-500 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
              <button
                type="submit"
                disabled={!userInput.trim() || isLoading || !selectedClaimId}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
              >
                <i className="fa-solid fa-paper-plane"></i>
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setUserInput('Show me timeline inconsistencies in this claim')}
            className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-left transition-colors"
          >
            <div className="text-emerald-500 mb-2">
              <i className="fa-solid fa-clock text-lg"></i>
            </div>
            <h3 className="text-white font-semibold mb-1">Timeline Analysis</h3>
            <p className="text-slate-400 text-sm">Check for date inconsistencies</p>
          </button>
          
          <button 
            onClick={() => setUserInput('Analyze image metadata for tampering evidence')}
            className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-left transition-colors"
          >
            <div className="text-blue-500 mb-2">
              <i className="fa-solid fa-image text-lg"></i>
            </div>
            <h3 className="text-white font-semibold mb-1">Image Forensics</h3>
            <p className="text-slate-400 text-sm">Detect digital tampering</p>
          </button>
          
          <button 
            onClick={() => setUserInput('Cross-reference this claim with similar cases')}
            className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-left transition-colors"
          >
            <div className="text-purple-500 mb-2">
              <i className="fa-solid fa-search text-lg"></i>
            </div>
            <h3 className="text-white font-semibold mb-1">Pattern Matching</h3>
            <p className="text-slate-400 text-sm">Find similar fraud cases</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AICopilot;