import { Send, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { InsightConversationMessage } from '../../lib/insightsApi';

interface Props {
  messages: InsightConversationMessage[];
  onAsk: (question: string) => Promise<void>;
  loading?: boolean;
  suggestedPrompt: string;
}

export default function InsightConversationPanel({ messages, onAsk, loading, suggestedPrompt }: Props) {
  const [question, setQuestion] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    await onAsk(trimmed);
    setQuestion('');
  };

  return (
    <section className="card-raised" style={{ padding: '1.25rem', display: 'grid', gap: '1rem', height: '100%' }}>
      <div>
        <div className="badge" style={{ background: 'rgba(22,163,74,0.08)', color: 'var(--brand)', marginBottom: '0.75rem' }}>
          <Sparkles size={13} />
          Ask the analyst
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Conversational business assistant</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', margin: '0.2rem 0 0' }}>{suggestedPrompt}</p>
      </div>

      <div style={{ display: 'grid', gap: '0.75rem', minHeight: 260, maxHeight: 520, overflowY: 'auto', paddingRight: '0.25rem' }}>
        {messages.length === 0 ? (
          <div className="empty-state" style={{ minHeight: 220 }}>
            <div className="empty-state-icon"><Sparkles size={20} color="var(--text-3)" /></div>
            <p style={{ fontWeight: 700, margin: 0 }}>Ask a business question to get started</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', margin: '0.15rem 0 0' }}>Try revenue, customers, products, restock, or sales strategy.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={`${message.role}-${index}`} style={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '88%',
                padding: '0.85rem 0.95rem',
                borderRadius: message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: message.role === 'user' ? 'var(--brand)' : 'var(--bg)',
                color: message.role === 'user' ? '#fff' : 'var(--text)',
                border: message.role === 'user' ? 'none' : '1px solid var(--border)',
                whiteSpace: 'pre-line',
                lineHeight: 1.6,
                boxShadow: 'var(--shadow-xs)',
              }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, marginBottom: '0.35rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {message.role === 'user' ? 'Merchant' : 'AI analyst'}
                </div>
                {message.content}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={submit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <input
          className="input"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Ask about sales, restock, customers, or revenue..."
          style={{ flex: 1 }}
        />
        <button className="btn-primary" type="submit" disabled={loading || !question.trim()}>
          <Send size={14} />
          Ask
        </button>
      </form>
    </section>
  );
}