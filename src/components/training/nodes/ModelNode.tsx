import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Box } from "lucide-react";

interface ModelNodeData {
  label: string;
  vocabSize: number;
  isInitialized: boolean;
  isSelected: boolean;
}

export const ModelNode = memo(function ModelNode({
  data,
}: {
  data: ModelNodeData;
}) {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-background shadow-md min-w-[140px]
        transition-all cursor-pointer
        ${data.isSelected
          ? "border-primary ring-2 ring-primary/20"
          : data.isInitialized
            ? "border-green-500"
            : "border-muted-foreground/30"
        }
      `}
    >
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      <div className="flex items-center gap-2">
        <div className={`
          p-2 rounded-md
          ${data.isInitialized ? "bg-green-500/10 text-green-600" : "bg-muted"}
        `}>
          <Box className="w-4 h-4" />
        </div>
        <div>
          <p className="font-medium text-sm">{data.label}</p>
          <p className="text-xs text-muted-foreground">
            {data.isInitialized
              ? `${data.vocabSize} words`
              : "Not initialized"
            }
          </p>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </div>
  );
});
