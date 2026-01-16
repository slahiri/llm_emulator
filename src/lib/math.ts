// Core math operations for the tiny LLM

/**
 * Softmax function - converts raw scores to probabilities
 */
export function softmax(x: number[]): number[] {
  const maxVal = Math.max(...x);
  const expValues = x.map((v) => Math.exp(v - maxVal)); // Subtract max for numerical stability
  const sumExp = expValues.reduce((a, b) => a + b, 0);
  return expValues.map((v) => v / sumExp);
}

/**
 * Dot product of two vectors
 */
export function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

/**
 * Matrix-vector multiplication
 */
export function matVecMul(matrix: number[][], vec: number[]): number[] {
  return matrix.map((row) => dotProduct(row, vec));
}

/**
 * Matrix-matrix multiplication
 */
export function matMul(a: number[][], b: number[][]): number[][] {
  const rows = a.length;
  const cols = b[0].length;
  const result: number[][] = [];

  for (let i = 0; i < rows; i++) {
    result[i] = [];
    for (let j = 0; j < cols; j++) {
      let sum = 0;
      for (let k = 0; k < a[0].length; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

/**
 * Transpose a matrix
 */
export function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]));
}

/**
 * Element-wise addition of two vectors
 */
export function vecAdd(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i]);
}

/**
 * Element-wise subtraction
 */
export function vecSub(a: number[], b: number[]): number[] {
  return a.map((v, i) => v - b[i]);
}

/**
 * Scalar multiplication
 */
export function vecScale(a: number[], scalar: number): number[] {
  return a.map((v) => v * scalar);
}

/**
 * ReLU activation
 */
export function relu(x: number[]): number[] {
  return x.map((v) => Math.max(0, v));
}

/**
 * Layer normalization (simplified)
 */
export function layerNorm(x: number[]): number[] {
  const mean = x.reduce((a, b) => a + b, 0) / x.length;
  const variance = x.reduce((sum, v) => sum + (v - mean) ** 2, 0) / x.length;
  const std = Math.sqrt(variance + 1e-5);
  return x.map((v) => (v - mean) / std);
}

/**
 * Cross-entropy loss for a single prediction
 */
export function crossEntropyLoss(predicted: number[], targetIndex: number): number {
  const prob = Math.max(predicted[targetIndex], 1e-10); // Avoid log(0)
  return -Math.log(prob);
}

/**
 * Initialize random weights
 */
export function randomMatrix(rows: number, cols: number, scale = 0.1): number[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() * 2 - 1) * scale)
  );
}

/**
 * Initialize random vector
 */
export function randomVector(size: number, scale = 0.1): number[] {
  return Array.from({ length: size }, () => (Math.random() * 2 - 1) * scale);
}

/**
 * Compute attention scores for a sequence
 */
export function computeAttention(
  queries: number[][],
  keys: number[][],
  values: number[][]
): { scores: number[][]; output: number[][] } {
  const seqLen = queries.length;
  const dk = queries[0].length;
  const scale = Math.sqrt(dk);

  // Compute attention scores
  const scores: number[][] = [];
  for (let i = 0; i < seqLen; i++) {
    const rowScores: number[] = [];
    for (let j = 0; j < seqLen; j++) {
      rowScores.push(dotProduct(queries[i], keys[j]) / scale);
    }
    scores.push(softmax(rowScores));
  }

  // Apply attention to values
  const output: number[][] = [];
  for (let i = 0; i < seqLen; i++) {
    const weighted = values[0].map(() => 0);
    for (let j = 0; j < seqLen; j++) {
      for (let k = 0; k < values[0].length; k++) {
        weighted[k] += scores[i][j] * values[j][k];
      }
    }
    output.push(weighted);
  }

  return { scores, output };
}
