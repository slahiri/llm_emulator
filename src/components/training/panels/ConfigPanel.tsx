import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import type { ModelConfig } from "@/lib/types";

interface ConfigPanelProps {
  config: ModelConfig;
  onConfigChange: (config: ModelConfig) => void;
  onComplete: () => void;
}

export function ConfigPanel({
  config,
  onConfigChange,
  onComplete,
}: ConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState<ModelConfig>(config);

  const handleSave = () => {
    onConfigChange(localConfig);
    onComplete();
  };

  const updateConfig = (key: keyof ModelConfig, value: number) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Calculate approximate parameter count
  const paramCount =
    localConfig.embedDim * 25 + // embeddings (approx vocab size)
    localConfig.numLayers * localConfig.numHeads * localConfig.embedDim * localConfig.embedDim * 3 + // attention
    localConfig.numLayers * localConfig.embedDim * localConfig.embedDim * 4; // FFN

  return (
    <div className="space-y-4">
      {/* Intro */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Model Configuration</h3>
        <p className="text-sm text-muted-foreground">
          These parameters control the size and capacity of your model. Larger
          models can learn more complex patterns but take longer to train.
        </p>
      </div>

      {/* Explanation Card */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="pt-4">
          <p className="text-sm">
            💡 <strong>Keep it small!</strong> For learning purposes, we use a
            tiny model. Real LLMs like GPT-4 have billions of parameters - ours
            has just thousands, making it easy to visualize every weight.
          </p>
        </CardContent>
      </Card>

      {/* Config Sliders */}
      <div className="space-y-6">
        {/* Embedding Dimension */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Embedding Dimension</span>
              <p className="text-xs text-muted-foreground">
                Size of word vectors (meaning representation)
              </p>
            </div>
            <Badge variant="secondary">{localConfig.embedDim}</Badge>
          </div>
          <Slider
            value={[localConfig.embedDim]}
            onValueChange={([v]) => updateConfig("embedDim", v)}
            min={4}
            max={32}
            step={4}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>4 (tiny)</span>
            <span>32 (larger)</span>
          </div>
        </div>

        {/* Transformer Layers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Transformer Layers</span>
              <p className="text-xs text-muted-foreground">
                Depth of the model (more = more abstract understanding)
              </p>
            </div>
            <Badge variant="secondary">{localConfig.numLayers}</Badge>
          </div>
          <Slider
            value={[localConfig.numLayers]}
            onValueChange={([v]) => updateConfig("numLayers", v)}
            min={1}
            max={6}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 layer</span>
            <span>6 layers</span>
          </div>
        </div>

        {/* Attention Heads */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Attention Heads</span>
              <p className="text-xs text-muted-foreground">
                Parallel attention patterns per layer
              </p>
            </div>
            <Badge variant="secondary">{localConfig.numHeads}</Badge>
          </div>
          <Slider
            value={[localConfig.numHeads]}
            onValueChange={([v]) => updateConfig("numHeads", v)}
            min={1}
            max={4}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 head</span>
            <span>4 heads</span>
          </div>
        </div>

        {/* Learning Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Learning Rate</span>
              <p className="text-xs text-muted-foreground">
                How fast the model adjusts (higher = faster but less stable)
              </p>
            </div>
            <Badge variant="secondary">{localConfig.learningRate}</Badge>
          </div>
          <Slider
            value={[localConfig.learningRate * 1000]}
            onValueChange={([v]) => updateConfig("learningRate", v / 1000)}
            min={1}
            max={100}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.001 (slow)</span>
            <span>0.1 (fast)</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Approximate parameters:</span>
            <span className="font-mono font-medium">
              {paramCount.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            (GPT-3 has 175 billion parameters!)
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave}>
          <Check className="w-4 h-4 mr-2" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
