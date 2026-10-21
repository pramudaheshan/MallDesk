import React, { FC, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Copy,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Send,
  Store as StoreIcon,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { AssistantResponse, Store } from '@/types';

function EmptyStore() {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <StoreIcon size={21} />
      </span>
      <h3>Select a store to begin</h3>
      <p>Your assigned stores will appear in the selector on the left.</p>
    </div>
  );
}

export interface AssistantPageProps {
  store: Store | null;
}

export const AssistantPage: FC<AssistantPageProps> = ({ store }) => {
  const [messages, setMessages] = useState<
    Array<{
      role: 'user' | 'assistant';
      text: string;
      timestamp?: string;
    }>
  >([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Pre-configured intelligent prompts
  const suggestedPrompts = [
    'Which products are low in stock?',
    'What is the total stock quantity?',
    'How many products are in this store?',
    'Show all products',
    'What products are priced over Rs. 50,000?',
    'Which products are running low?',
  ];

  // Dynamic typing suggestions based on user input
  const typingSuggestions = useMemo(() => {
    const query = input.trim().toLowerCase();
    if (!query) return [];
    return suggestedPrompts
      .filter((p) => p.toLowerCase().includes(query))
      .slice(0, 3);
  }, [input]);

  // Initial assistant welcome greeting
  const getInitialMessages = (storeName: string) => [
    {
      role: 'assistant' as const,
      text: `Hello! I'm your MallDesk Store Assistant for ${storeName}. Ask me anything about stock quantities, low-stock reorders, or selling prices.`,
      timestamp: 'Just now',
    },
  ];

  useEffect(() => {
    if (store) {
      setMessages(getInitialMessages(store.name));
      setError('');
    }
  }, [store?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text = input) => {
    if (!store || !text.trim() || loading) return;
    const question = text.trim();
    setInput('');
    setError('');
    setMessages((current) => [
      ...current,
      {
        role: 'user',
        text: question,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setLoading(true);

    try {
      const result = (await api.assistant(store.id, question)) as AssistantResponse;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(1200, 400 + result.answer.length * 6))
      );
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: result.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'The assistant could not answer right now. Please verify your connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!store) return <EmptyStore />;

  return (
    <div className="assistant-page">
      <div className="page-header">
        <div>
          <div className="eyebrow">STORE INTELLIGENCE</div>
          <h1>AI Assistant</h1>
          <p className="muted page-description">
            Ask about products, inventory levels, and prices in {store.name}.
          </p>
        </div>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => setMessages(getInitialMessages(store.name))}
          title="Reset conversation"
        >
          <RotateCcw size={15} />
          <span>Reset Chat</span>
        </button>
      </div>

      <div className="chat-card card">
        <div className="chat-context">
          <span className="assistant-orb small">
            <MessageSquare size={16} />
          </span>
          <div>
            <b>Store Assistant</b>
            <small>Grounded exclusively in {store.name} data</small>
          </div>
          <span className="live-dot">Live & Ready</span>
        </div>

        <div className="chat-body">
          <div className="messages">
            {messages.map((message, index) => (
              <div
                className={`message-row ${message.role}`}
                key={`${message.role}-${index}`}
              >
                <span className="message-avatar">
                  {message.role === 'assistant' ? <MessageSquare size={14} /> : 'Y'}
                </span>
                <div className="message-bubble-wrapper">
                  <div className="message-bubble">
                    <p>{message.text}</p>
                    {message.role === 'assistant' && (
                      <div className="message-bubble-actions">
                        {message.timestamp && (
                          <span className="message-time">{message.timestamp}</span>
                        )}
                        <button
                          type="button"
                          className="copy-message-btn"
                          onClick={() => copyToClipboard(message.text, index)}
                          title="Copy to clipboard"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check size={12} className="text-green" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="message-row assistant">
                <span className="message-avatar">
                  <MessageSquare size={14} />
                </span>
                <div className="typing">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            )}

            {/* Contextual Quick Followup Prompts */}
            {!loading && messages.length > 0 && (
              <div className="assistant-followup-chips">
                <button
                  type="button"
                  className="followup-chip"
                  onClick={() => send('Which products are low in stock?')}
                >
                  Low stock items
                </button>
                <button
                  type="button"
                  className="followup-chip"
                  onClick={() => send('What is the total stock quantity?')}
                >
                  Total stock
                </button>
                <button
                  type="button"
                  className="followup-chip"
                  onClick={() => send('Show all products')}
                >
                  All products
                </button>
                <button
                  type="button"
                  className="followup-chip"
                  onClick={() => send('How many products are in this store?')}
                >
                  Product count
                </button>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {error && (
            <div className="chat-error">
              <AlertTriangle size={15} />
              <span>{error}</span>
              <button
                type="button"
                onClick={() => send(messages[messages.length - 1]?.text || '')}
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Suggestions When Typing */}
        {typingSuggestions.length > 0 && (
          <div className="assistant-typeahead-suggestions">
            <span className="typeahead-title">Suggested questions:</span>
            {typingSuggestions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="typeahead-chip"
                onClick={() => {
                  setInput(prompt);
                  send(prompt);
                }}
              >
                <span>{prompt}</span>
                <ArrowRight size={12} />
              </button>
            ))}
          </div>
        )}

        {/* Chat Input */}
        <form
          className="chat-input"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about stock, products, or prices in this store…"
            disabled={loading}
          />
          <button
            type="submit"
            className="button button-primary"
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            <Send size={17} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AssistantPage;
