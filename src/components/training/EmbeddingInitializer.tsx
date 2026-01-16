import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Shuffle } from "lucide-react";

interface EmbeddingInitializerProps {
  vocabulary: Record<string, number>;
  embeddings: number[][] | null;
  embedDim: number;
  onEmbeddingsChange: (embeddings: number[][]) => void;
  onComplete: () => void;
  onBack: () => void;
}

// Dimension labels for understanding (simplified)
const DIMENSION_LABELS = [
  "Living thing",
  "Size",
  "Action word",
  "Common word",
  "Position",
  "Abstract",
  "Positive",
  "Movement",
];

export function EmbeddingInitializer({
  vocabulary,
  embeddings,
  embedDim,
  onEmbeddingsChange,
  onComplete,
  onBack,
}: EmbeddingInitializerProps) {
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);
  const vocabSize = Object.keys(vocabulary).length;

  // Initialize embeddings with random values if not set
  const currentEmbeddings = useMemo(() => {
    if (embeddings && embeddings.length === vocabSize) {
      return embeddings;
    }
    // Generate random embeddings
    return Array.from({ length: vocabSize }, () =>
      Array.from({ length: embedDim }, () => Math.random() * 2 - 1)
    );
  }, [embeddings, vocabSize, embedDim]);

  // Get word by ID
  const getWordById = (id: number): string => {
    return Object.entries(vocabulary).find(([, v]) => v === id)?.[0] ?? "";
  };

  // Update a single embedding value
  const updateEmbedding = (wordId: number, dimIndex: number, value: number) => {
    const newEmbeddings = currentEmbeddings.map((emb, idx) =>
      idx === wordId
        ? emb.map((v, d) => (d === dimIndex ? value : v))
        : [...emb]
    );
    onEmbeddingsChange(newEmbeddings);
  };

  // Randomize all embeddings
  const randomizeAll = () => {
    const newEmbeddings = Array.from({ length: vocabSize }, () =>
      Array.from({ length: embedDim }, () => Math.random() * 2 - 1)
    );
    onEmbeddingsChange(newEmbeddings);
  };

  // Calculate distance between two embeddings (for similarity display)
  const calculateSimilarity = (id1: number, id2: number): number => {
    const emb1 = currentEmbeddings[id1];
    const emb2 = currentEmbeddings[id2];
    if (!emb1 || !emb2) return 0;

    // Cosine similarity
    const dot = emb1.reduce((sum, v, i) => sum + v * emb2[i], 0);
    const mag1 = Math.sqrt(emb1.reduce((sum, v) => sum + v * v, 0));
    const mag2 = Math.sqrt(emb2.reduce((sum, v) => sum + v * v, 0));
    return mag1 && mag2 ? dot / (mag1 * mag2) : 0;
  };

  // Get similar words to selected word
  const getSimilarWords = (wordId: number): Array<{ word: string; id: number; similarity: number }> => {
    return Object.entries(vocabulary)
      .filter(([, id]) => id !== wordId)
      .map(([word, id]) => ({
        word,
        id,
        similarity: calculateSimilarity(wordId, id),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">2</span>
            <span>Initialize Embeddings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Token IDs are just numbers - they don't capture meaning.
            <strong> Embeddings</strong> are vectors (lists of numbers) that
            represent what each word <em>means</em>.
          </p>
          <p className="text-muted-foreground">
            Each dimension captures some aspect of meaning. Similar words will
            have similar vectors!
          </p>
        </CardContent>
      </Card>

      {/* Word Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select a Word to Inspect</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(vocabulary)
              .sort((a, b) => a[1] - b[1])
              .map(([word, id]) => (
                <motion.button
                  key={word}
                  onClick={() => setSelectedWordId(id)}
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                    ${selectedWordId === id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80"
                    }
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {word}
                  <span className="ml-1 text-xs opacity-70">#{id}</span>
                </motion.button>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Embedding Editor */}
      {selectedWordId !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Embedding for "{getWordById(selectedWordId)}"</span>
                <Badge variant="outline">{embedDim} dimensions</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentEmbeddings[selectedWordId]?.map((value, dimIndex) => (
                <div key={dimIndex} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Dim {dimIndex}: {DIMENSION_LABELS[dimIndex] || `Feature ${dimIndex}`}
                    </span>
                    <span className="font-mono">{value.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={([v]) => updateEmbedding(selectedWordId, dimIndex, v)}
                    min={-1}
                    max={1}
                    step={0.01}
                  />
                </div>
              ))}

              {/* Vector display */}
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Vector representation:</p>
                <p className="font-mono text-sm break-all">
                  [{currentEmbeddings[selectedWordId]?.map((v) => v.toFixed(2)).join(", ")}]
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Similarity Display */}
      {selectedWordId !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">
                Most Similar to "{getWordById(selectedWordId)}"
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getSimilarWords(selectedWordId).map(({ word, similarity }) => (
                  <div
                    key={word}
                    className="flex items-center justify-between p-2 bg-background rounded"
                  >
                    <span>{word}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.max(0, similarity * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono w-16 text-right">
                        {(similarity * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                💡 Similarity is calculated using cosine similarity between embedding vectors.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button variant="outline" onClick={randomizeAll}>
            <Shuffle className="w-4 h-4 mr-2" />
            Randomize All
          </Button>
        </div>

        <Button onClick={() => {
          onEmbeddingsChange(currentEmbeddings);
          onComplete();
        }}>
          Continue to Attention
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Learning Note */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Key insight:</strong> Right now these embeddings are random -
            they don't capture real meaning yet. During training, the model will
            adjust these vectors so that words used in similar contexts get similar
            embeddings. This is how meaning emerges from data!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
