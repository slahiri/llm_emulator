import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RotateCcw } from "lucide-react";
import type { ModelConfig, Weights } from "@/lib/types";
import { initializeWeights } from "@/lib/model";

interface ModelPanelProps {
  corpus: string[];
  config: ModelConfig;
  weights: Weights | null;
  onWeightsChange: (weights: Weights) => void;
  onVocabularyChange: (vocabulary: Record<string, number>) => void;
  onComplete: () => void;
}

export function ModelPanel({
  corpus,
  config,
  weights,
  onWeightsChange,
  onVocabularyChange,
  onComplete,
}: ModelPanelProps) {
  // Extract vocabulary from corpus
  const vocabulary = useMemo(() => {
    const vocab: Record<string, number> = {};
    let id = 0;
    corpus.forEach((sentence) => {
      sentence
        .toLowerCase()
        .replace(/[.,!?]/g, "")
        .split(/\s+/)
        .forEach((word) => {
          if (word && !(word in vocab)) {
            vocab[word] = id++;
          }
        });
    });
    return vocab;
  }, [corpus]);

  const vocabSize = Object.keys(vocabulary).length;
  const isInitialized = weights !== null;

  const handleInitialize = () => {
    onVocabularyChange(vocabulary);
    const newWeights = initializeWeights(vocabSize, config);
    onWeightsChange(newWeights);
    onComplete();
  };

  const handleReinitialize = () => {
    onVocabularyChange(vocabulary);
    const newWeights = initializeWeights(vocabSize, config);
    onWeightsChange(newWeights);
  };

  return (
    <div className="space-y-4">
      {/* Intro */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Model Initialization</h3>
        <p className="text-sm text-muted-foreground">
          Before training, the model needs initial weights. These start as
          random numbers and will be adjusted during training.
        </p>
      </div>

      {/* Explanation Card */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="pt-4">
          <p className="text-sm">
            💡 <strong>Random start:</strong> Every word starts with a random
            embedding vector. Through training, similar words (like "cat" and
            "dog") will develop similar vectors, while different words (like
            "cat" and "the") will become distinct.
          </p>
        </CardContent>
      </Card>

      {/* Vocabulary Display */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Vocabulary (from corpus)</span>
          <Badge variant="secondary">{vocabSize} words</Badge>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg max-h-[200px] overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {Object.entries(vocabulary)
              .sort((a, b) => a[1] - b[1])
              .map(([word, id]) => (
                <div
                  key={word}
                  className="flex items-center gap-1 px-2 py-1 bg-background rounded text-sm"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    #{id}
                  </span>
                  <span>{word}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Model Stats */}
      {isInitialized && weights && (
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-500">
                Initialized
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Embeddings:</span>
                <span className="ml-2 font-mono">
                  {weights.embeddings.length} × {weights.embeddings[0]?.length || 0}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Layers:</span>
                <span className="ml-2 font-mono">{weights.layers.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Embedding Preview */}
      {isInitialized && weights && (
        <div className="space-y-2">
          <span className="text-sm font-medium">Sample Embedding (first word)</span>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">
              "{Object.keys(vocabulary)[0]}" vector:
            </p>
            <p className="font-mono text-xs break-all">
              [{weights.embeddings[0]?.map((v) => v.toFixed(3)).join(", ")}]
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        {isInitialized ? (
          <>
            <Button variant="outline" size="sm" onClick={handleReinitialize}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reinitialize
            </Button>
            <Button onClick={onComplete}>
              Continue to Training
            </Button>
          </>
        ) : (
          <Button onClick={handleInitialize} className="w-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Initialize Model
          </Button>
        )}
      </div>
    </div>
  );
}
