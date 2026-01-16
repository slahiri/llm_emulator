import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrainingStage } from "@/lib/types";

interface StageProgressProps {
  currentStage: TrainingStage;
  onStageClick?: (stage: TrainingStage) => void;
}

const stages = [
  { id: 1 as TrainingStage, name: "Vocabulary", description: "Words → Numbers" },
  { id: 2 as TrainingStage, name: "Embeddings", description: "Numbers → Meaning" },
  { id: 3 as TrainingStage, name: "Attention", description: "Context Awareness" },
  { id: 4 as TrainingStage, name: "Training", description: "Learning Loop" },
];

export function StageProgress({ currentStage, onStageClick }: StageProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex items-center flex-1">
            {/* Stage circle */}
            <button
              onClick={() => onStageClick?.(stage.id)}
              disabled={stage.id > currentStage}
              className={cn(
                "flex flex-col items-center gap-2 group",
                stage.id <= currentStage ? "cursor-pointer" : "cursor-not-allowed"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  stage.id < currentStage
                    ? "bg-primary text-primary-foreground"
                    : stage.id === currentStage
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {stage.id < currentStage ? (
                  <Check className="w-5 h-5" />
                ) : (
                  stage.id
                )}
              </div>
              <div className="text-center">
                <p
                  className={cn(
                    "text-sm font-medium",
                    stage.id === currentStage
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {stage.name}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {stage.description}
                </p>
              </div>
            </button>

            {/* Connector line */}
            {index < stages.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-4",
                  stage.id < currentStage ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
