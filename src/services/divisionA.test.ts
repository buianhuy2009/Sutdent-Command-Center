import { describe, it, expect } from 'vitest';
import { predictText } from '../components/workspaces/ModelTrainingWorkspace';
import { scoreChunks, chunkText } from './ragVault';

describe('predictText (tiny Naive-Bayes)', () => {
  const labels = [
    { name: 'Math', texts: ['solve quadratic equation', 'geometry triangle area', 'algebra homework chapter 3'] },
    { name: 'English', texts: ['write essay environment', 'vocabulary unit 4', 'reading comprehension homework'] },
  ];
  it('routes math input to Math', () => {
    const p = predictText(labels, 'quadratic equation homework');
    expect(p.label).toBe('Math');
    expect(p.confidence).toBeGreaterThan(50);
  });
  it('routes essay input to English', () => {
    const p = predictText(labels, 'write essay vocabulary');
    expect(p.label).toBe('English');
  });
});

describe('ragVault chunk + score', () => {
  it('chunks with overlap', () => {
    const chunks = chunkText('a'.repeat(1200), 500, 100);
    expect(chunks.length).toBe(3);
    expect(chunks[0].length).toBe(500);
  });
  it('retrieves the matching note in top-3', () => {
    const idx = [
      { docId: 'bio', title: 'Biology notes', snippet: 'photosynthesis happens in chloroplasts using sunlight' },
      { docId: 'math', title: 'Math notes', snippet: 'quadratic formula discriminant' },
    ];
    const res = scoreChunks('what did my biology notes say about photosynthesis', idx);
    expect(res[0]?.docId).toBe('bio');
    expect(res.length).toBeLessThanOrEqual(3);
  });
});
