// Tiny LLM implementation for visualization

import {
  softmax,
  matVecMul,
  vecAdd,
  relu,
  layerNorm,
  crossEntropyLoss,
  randomMatrix,
  randomVector,
  dotProduct,
} from "./math";
import type { ModelConfig, Weights, AttentionHead, TransformerLayer } from "./types";

/**
 * Initialize weights for the tiny LLM
 */
export function initializeWeights(
  vocabSize: number,
  config: ModelConfig
): Weights {
  const { embedDim, numLayers, numHeads } = config;
  const headDim = Math.floor(embedDim / numHeads);

  // Initialize embeddings
  const embeddings = randomMatrix(vocabSize, embedDim, 0.5);

  // Initialize transformer layers
  const layers: TransformerLayer[] = [];
  for (let l = 0; l < numLayers; l++) {
    const heads: AttentionHead[] = [];
    for (let h = 0; h < numHeads; h++) {
      heads.push({
        Wq: randomMatrix(embedDim, headDim, 0.1),
        Wk: randomMatrix(embedDim, headDim, 0.1),
        Wv: randomMatrix(embedDim, headDim, 0.1),
      });
    }

    layers.push({
      attention: { heads },
      ffn: {
        W1: randomMatrix(embedDim, embedDim * 2, 0.1),
        b1: randomVector(embedDim * 2, 0.1),
        W2: randomMatrix(embedDim * 2, embedDim, 0.1),
        b2: randomVector(embedDim, 0.1),
      },
    });
  }

  // Initialize output layer
  const output = {
    W: randomMatrix(embedDim, vocabSize, 0.1),
    b: randomVector(vocabSize, 0.1),
  };

  return { embeddings, layers, output };
}

/**
 * Forward pass result with intermediate values for visualization
 */
export interface ForwardResult {
  // Input
  inputTokens: number[];

  // Embeddings
  embeddings: number[][];

  // Per-layer results
  layerOutputs: Array<{
    attentionScores: number[][][]; // [numHeads][seqLen][seqLen]
    attentionOutput: number[][];
    ffnOutput: number[][];
  }>;

  // Output
  logits: number[];
  probabilities: number[];
  predictedToken: number;

  // For training
  loss?: number;
  targetToken?: number;
}

/**
 * Single attention head forward pass
 */
function attentionHead(
  input: number[][],
  head: AttentionHead
): { scores: number[][]; output: number[][] } {
  const seqLen = input.length;

  // Compute Q, K, V
  const Q = input.map((x) => matVecMul(head.Wq, x));
  const K = input.map((x) => matVecMul(head.Wk, x));
  const V = input.map((x) => matVecMul(head.Wv, x));

  const dk = Q[0].length;
  const scale = Math.sqrt(dk);

  // Compute attention scores
  const scores: number[][] = [];
  for (let i = 0; i < seqLen; i++) {
    const rowScores: number[] = [];
    for (let j = 0; j < seqLen; j++) {
      // Causal masking: can only attend to previous positions
      if (j > i) {
        rowScores.push(-1e9); // Very negative = zero after softmax
      } else {
        rowScores.push(dotProduct(Q[i], K[j]) / scale);
      }
    }
    scores.push(softmax(rowScores));
  }

  // Apply attention to values
  const output: number[][] = [];
  for (let i = 0; i < seqLen; i++) {
    const weighted = V[0].map(() => 0);
    for (let j = 0; j < seqLen; j++) {
      for (let k = 0; k < V[0].length; k++) {
        weighted[k] += scores[i][j] * V[j][k];
      }
    }
    output.push(weighted);
  }

  return { scores, output };
}

/**
 * Feed-forward network
 */
function feedForward(
  input: number[],
  ffn: TransformerLayer["ffn"]
): number[] {
  // First linear + ReLU
  const hidden = relu(vecAdd(matVecMul(ffn.W1, input), ffn.b1));
  // Second linear
  return vecAdd(matVecMul(ffn.W2, hidden), ffn.b2);
}

/**
 * Forward pass through the model
 */
export function forward(
  inputTokens: number[],
  weights: Weights,
  targetToken?: number
): ForwardResult {
  const seqLen = inputTokens.length;

  // Get embeddings
  let current = inputTokens.map((t) => [...weights.embeddings[t]]);
  const embeddingsSnapshot = current.map((e) => [...e]);

  // Process through layers
  const layerOutputs: ForwardResult["layerOutputs"] = [];

  for (const layer of weights.layers) {
    // Multi-head attention
    const headOutputs: number[][][] = [];
    const allScores: number[][][] = [];

    for (const head of layer.attention.heads) {
      const { scores, output } = attentionHead(current, head);
      allScores.push(scores);
      headOutputs.push(output);
    }

    // Concatenate head outputs (simplified: just average them)
    const attentionOutput = current.map((_, i) => {
      const combined = current[0].map(() => 0);
      for (const headOut of headOutputs) {
        for (let d = 0; d < combined.length; d++) {
          combined[d] += headOut[i][d % headOut[i].length] / headOutputs.length;
        }
      }
      return combined;
    });

    // Residual connection + layer norm
    const afterAttention = current.map((x, i) =>
      layerNorm(vecAdd(x, attentionOutput[i]))
    );

    // Feed-forward network
    const ffnOutput = afterAttention.map((x) => feedForward(x, layer.ffn));

    // Residual connection + layer norm
    current = afterAttention.map((x, i) =>
      layerNorm(vecAdd(x, ffnOutput[i]))
    );

    layerOutputs.push({
      attentionScores: allScores,
      attentionOutput,
      ffnOutput,
    });
  }

  // Output layer (use last position for prediction)
  const lastHidden = current[seqLen - 1];
  const logits = vecAdd(matVecMul(weights.output.W, lastHidden), weights.output.b);
  const probabilities = softmax(logits);

  // Find predicted token
  let maxProb = -1;
  let predictedToken = 0;
  for (let i = 0; i < probabilities.length; i++) {
    if (probabilities[i] > maxProb) {
      maxProb = probabilities[i];
      predictedToken = i;
    }
  }

  // Calculate loss if target provided
  let loss: number | undefined;
  if (targetToken !== undefined) {
    loss = crossEntropyLoss(probabilities, targetToken);
  }

  return {
    inputTokens,
    embeddings: embeddingsSnapshot,
    layerOutputs,
    logits,
    probabilities,
    predictedToken,
    loss,
    targetToken,
  };
}

/**
 * Simple training step (gradient descent on output weights only for visualization)
 * This is a simplified version that only updates embeddings and output weights
 */
export function trainStep(
  inputTokens: number[],
  targetToken: number,
  weights: Weights,
  learningRate: number
): { newWeights: Weights; loss: number; result: ForwardResult } {
  // Forward pass
  const result = forward(inputTokens, weights, targetToken);
  const loss = result.loss!;

  // Create new weights (copy)
  const newWeights: Weights = {
    embeddings: weights.embeddings.map((e) => [...e]),
    layers: weights.layers.map((layer) => ({
      attention: {
        heads: layer.attention.heads.map((head) => ({
          Wq: head.Wq.map((r) => [...r]),
          Wk: head.Wk.map((r) => [...r]),
          Wv: head.Wv.map((r) => [...r]),
        })),
      },
      ffn: {
        W1: layer.ffn.W1.map((r) => [...r]),
        b1: [...layer.ffn.b1],
        W2: layer.ffn.W2.map((r) => [...r]),
        b2: [...layer.ffn.b2],
      },
    })),
    output: {
      W: weights.output.W.map((r) => [...r]),
      b: [...weights.output.b],
    },
  };

  // Simplified gradient: adjust output weights based on error
  // For the target token: increase weight
  // For other high-probability tokens: decrease weight
  const probs = result.probabilities;

  // Get the last hidden state
  const lastLayerIdx = result.layerOutputs.length - 1;
  const lastHidden = result.layerOutputs[lastLayerIdx].ffnOutput[inputTokens.length - 1];

  for (let v = 0; v < probs.length; v++) {
    const error = (v === targetToken ? 1 : 0) - probs[v];

    // Update output weights
    for (let d = 0; d < lastHidden.length; d++) {
      newWeights.output.W[d][v] += learningRate * error * lastHidden[d];
    }
    newWeights.output.b[v] += learningRate * error;
  }

  // Update embeddings for input tokens
  for (const tokenId of inputTokens) {
    for (let d = 0; d < newWeights.embeddings[tokenId].length; d++) {
      // Small random perturbation in direction that would help (simplified)
      const adjustment = learningRate * (Math.random() - 0.5) * 0.1;
      newWeights.embeddings[tokenId][d] += adjustment;
    }
  }

  return { newWeights, loss, result };
}

/**
 * Tokenize a sentence using vocabulary
 */
export function tokenize(
  sentence: string,
  vocabulary: Record<string, number>
): number[] {
  return sentence
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .split(/\s+/)
    .filter((word) => word in vocabulary)
    .map((word) => vocabulary[word]);
}

/**
 * Get word from token ID
 */
export function detokenize(
  tokenId: number,
  vocabulary: Record<string, number>
): string {
  return Object.entries(vocabulary).find(([, id]) => id === tokenId)?.[0] ?? `<${tokenId}>`;
}
