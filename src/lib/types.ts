// Core type definitions for the LLM Visualizer

export interface ModelConfig {
  embedDim: number;      // 8
  numLayers: number;     // 3
  numHeads: number;      // 2
  learningRate: number;  // 0.01
}

export interface AttentionHead {
  Wq: number[][];  // Query weights
  Wk: number[][];  // Key weights
  Wv: number[][];  // Value weights
}

export interface TransformerLayer {
  attention: {
    heads: AttentionHead[];
  };
  ffn: {
    W1: number[][];
    b1: number[];
    W2: number[][];
    b2: number[];
  };
}

export interface Weights {
  embeddings: number[][];           // [vocabSize x embedDim]
  layers: TransformerLayer[];       // Transformer layers
  output: {
    W: number[][];                  // [embedDim x vocabSize]
    b: number[];                    // [vocabSize]
  };
}

export interface TrainingProgress {
  iteration: number;
  maxIterations: number;
  loss: number;
  lossHistory: number[];
}

export type TrainingStage = 1 | 2 | 3 | 4;
export type ModelStatus = 'idle' | 'training' | 'completed';

export interface Model {
  status: ModelStatus;
  stage: TrainingStage;

  corpus: string[];
  vocabulary: Record<string, number>;  // word → ID

  config: ModelConfig;
  weights: Weights | null;

  trainingProgress: TrainingProgress;
}

// Default model configuration
export const DEFAULT_CONFIG: ModelConfig = {
  embedDim: 8,
  numLayers: 3,
  numHeads: 2,
  learningRate: 0.01,
};

// Default training corpus
export const DEFAULT_CORPUS: string[] = [
  "The cat sat on the mat.",
  "The dog ran in the park.",
  "A bird flew over the tree.",
  "The cat chased the bird.",
  "The dog sat on the mat.",
  "A bird sat in the tree.",
  "The cat ran in the park.",
  "The dog chased the cat.",
];

// Create initial model state
export function createInitialModel(): Model {
  return {
    status: 'idle',
    stage: 1,
    corpus: DEFAULT_CORPUS,
    vocabulary: {},
    config: DEFAULT_CONFIG,
    weights: null,
    trainingProgress: {
      iteration: 0,
      maxIterations: 500,
      loss: 0,
      lossHistory: [],
    },
  };
}
