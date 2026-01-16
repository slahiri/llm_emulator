import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Play, Loader2, CheckCircle } from "lucide-react";

interface TrainNodeData {
  label: string;
  status: "idle" | "training" | "completed";
  iteration: number;
  maxIterations: number;
  isSelected: boolean;
}

export const TrainNode = memo(function TrainNode({
  data,
}: {
  data: TrainNodeData;
}) {
  const progress = data.maxIterations > 0
    ? Math.round((data.iteration / data.maxIterations) * 100)
    : 0;

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-background shadow-md min-w-[140px]
        transition-all cursor-pointer
        ${data.isSelected
          ? "border-primary ring-2 ring-primary/20"
          : data.status === "completed"
            ? "border-green-500"
            : data.status === "training"
              ? "border-blue-500"
              : "border-muted-foreground/30"
        }
      `}
    >
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      <div className="flex items-center gap-2">
        <div className={`
          p-2 rounded-md
          ${data.status === "completed"
            ? "bg-green-500/10 text-green-600"
            : data.status === "training"
              ? "bg-blue-500/10 text-blue-600"
              : "bg-muted"
          }
        `}>
          {data.status === "training" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : data.status === "completed" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </div>
        <div>
          <p className="font-medium text-sm">{data.label}</p>
          <p className="text-xs text-muted-foreground">
            {data.status === "completed"
              ? "Complete!"
              : data.status === "training"
                ? `${progress}%`
                : "Ready"
            }
          </p>
        </div>
      </div>
    </div>
  );
});
