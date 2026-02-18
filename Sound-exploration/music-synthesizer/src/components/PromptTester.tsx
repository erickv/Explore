// src/components/PromptTester.tsx

import React, { useState } from 'react';
import { ClaudeService } from '../services/claudeService';
import { AudioGenerationParams } from '../services/types';

const EXAMPLE_PROMPTS = [
  "Chill lo-fi drum loop, 4 bars, 70 BPM, with vinyl texture",
  "Futuristic ambient synth pad, 8 bars, like Blade Runner",
  "Dark techno bassline with distortion, 128 BPM, Berlin club vibe",
  "Uplifting house piano loop, 124 BPM, summer festival energy",
  "Aggressive trap hi-hats, 140 BPM, one-shot, heavy compression",
  "Mellow jazz piano sample, 4 bars, warm analog feel",
  "Ethereal ambient drone, 16 bars, deep reverb, cinematic",
  "Punchy kick drum one-shot, 808 style, distorted",
  "Groovy funk bass loop, 100 BPM, vintage compression",
  "Atmospheric dubstep wobble, 140 BPM, dark and heavy"
];

export const PromptTester: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<AudioGenerationParams | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] } | null>(null);

  const handleProcess = async () => {
    if (!prompt.trim()) return;
    
    setIsProcessing(true);
    try {
      const params = await ClaudeService.parsePrompt(prompt);
      setResult(params);
      
      const validationResult = ClaudeService.validateParams(params);
      setValidation(validationResult);
    } catch (error) {
      console.error('Error processing prompt:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExampleClick = (examplePrompt: string) => {
    setPrompt(examplePrompt);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🎛️ Music Prompt Tester</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Try an example:</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {EXAMPLE_PROMPTS.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {example.substring(0, 30)}...
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your music prompt..."
          style={{
            width: '100%',
            height: '100px',
            padding: '10px',
            fontSize: '16px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        />
        <button
          onClick={handleProcess}
          disabled={isProcessing || !prompt.trim()}
          style={{
            marginTop: '10px',
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: isProcessing || !prompt.trim() ? 0.6 : 1
          }}
        >
          {isProcessing ? 'Processing...' : 'Process Prompt'}
        </button>
      </div>

      {result && (
        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
          <h3>📤 Generated Parameters:</h3>
          
          {validation && !validation.valid && (
            <div style={{ 
              backgroundColor: '#fee', 
              padding: '10px', 
              borderRadius: '4px', 
              marginBottom: '10px' 
            }}>
              <strong>⚠️ Validation Issues:</strong>
              <ul>
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <pre style={{ 
            backgroundColor: '#fff', 
            padding: '15px', 
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>

          <div style={{ marginTop: '20px' }}>
            <h4>🎯 Quick Summary:</h4>
            <ul>
              <li><strong>Format:</strong> {result.format}</li>
              <li><strong>BPM:</strong> {result.bpm || 'Not specified'}</li>
              <li><strong>Length:</strong> {result.length}</li>
              <li><strong>Genre:</strong> {result.genre || 'Not specified'}</li>
              <li><strong>Mood:</strong> {result.mood}</li>
              <li><strong>Energy:</strong> {result.energy}</li>
              <li><strong>Tags:</strong> {result.tags.join(', ') || 'None'}</li>
              <li><strong>Instruments:</strong> {result.instruments.join(', ') || 'None'}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};