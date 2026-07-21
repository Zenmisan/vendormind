interface Props {
  questions: string[];
  onPick: (question: string) => void;
}

export default function InsightQuestionChips({ questions, onPick }: Props) {
  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.9rem' }}>
        <div>
          <h3 style={{ fontSize: '0.96rem', fontWeight: 800, margin: 0 }}>Suggested questions</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', margin: '0.2rem 0 0' }}>Tap a question or ask your own.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        {questions.map((question) => (
          <button key={question} type="button" className="btn-ghost" onClick={() => onPick(question)} style={{ borderRadius: 999, padding: '0.55rem 0.9rem', fontSize: '0.8rem' }}>
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}