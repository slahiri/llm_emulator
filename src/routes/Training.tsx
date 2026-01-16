import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useModelStore } from "@/stores/modelStore";
import { StageProgress } from "@/components/training/StageProgress";
import { VocabularyBuilder } from "@/components/training/VocabularyBuilder";
import { EmbeddingInitializer } from "@/components/training/EmbeddingInitializer";
import { AttentionExplainer } from "@/components/training/AttentionExplainer";
import { TrainingLoop } from "@/components/training/TrainingLoop";
import type { TrainingStage, Weights } from "@/lib/types";

export default function Training() {
  const navigate = useNavigate();
  const {
    model,
    isLoading,
    loadModel,
    setStage,
    setVocabulary,
    setWeights,
    updateTrainingProgress,
    setStatus,
  } = useModelStore();

  // Load model on mount
  useEffect(() => {
    loadModel();
  }, [loadModel]);

  if (isLoading || !model) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentStage = model.stage;

  const handleStageClick = (stage: TrainingStage) => {
    if (stage <= currentStage) {
      setStage(stage);
    }
  };

  const handleVocabularyComplete = () => {
    setStage(2);
  };

  const handleEmbeddingsComplete = () => {
    setStage(3);
  };

  const handleAttentionComplete = () => {
    setStage(4);
  };

  const handleTrainingComplete = () => {
    setStatus("completed");
    navigate("/execution");
  };

  const handleWeightsChange = (weights: Weights) => {
    setWeights(weights);
  };

  const handleProgressUpdate = (iteration: number, loss: number, lossHistory: number[]) => {
    updateTrainingProgress({ iteration, loss, lossHistory });
  };

  // Initialize embeddings array from weights or create placeholder
  const embeddings = model.weights?.embeddings ?? null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Training</h1>
        </div>

        {/* Stage Progress */}
        <div className="mb-8">
          <StageProgress
            currentStage={currentStage}
            onStageClick={handleStageClick}
          />
        </div>

        {/* Stage Content */}
        <div className="mt-8">
          {currentStage === 1 && (
            <VocabularyBuilder
              corpus={model.corpus}
              vocabulary={model.vocabulary}
              onVocabularyChange={setVocabulary}
              onComplete={handleVocabularyComplete}
            />
          )}

          {currentStage === 2 && (
            <EmbeddingInitializer
              vocabulary={model.vocabulary}
              embeddings={embeddings}
              embedDim={model.config.embedDim}
              onEmbeddingsChange={(emb) => {
                // Create full weights structure with just embeddings for now
                const currentWeights = model.weights ?? {
                  embeddings: emb,
                  layers: [],
                  output: { W: [], b: [] },
                };
                handleWeightsChange({ ...currentWeights, embeddings: emb });
              }}
              onComplete={handleEmbeddingsComplete}
              onBack={() => setStage(1)}
            />
          )}

          {currentStage === 3 && (
            <AttentionExplainer
              corpus={model.corpus}
              onComplete={handleAttentionComplete}
              onBack={() => setStage(2)}
            />
          )}

          {currentStage === 4 && (
            <TrainingLoop
              model={model}
              onWeightsChange={handleWeightsChange}
              onProgressUpdate={handleProgressUpdate}
              onComplete={handleTrainingComplete}
              onBack={() => setStage(3)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
