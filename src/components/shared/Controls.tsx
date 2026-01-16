import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";

interface ControlsProps {
  isPlaying: boolean;
  playbackSpeed: number;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset?: () => void;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
}

export function Controls({
  isPlaying,
  playbackSpeed,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSpeedChange,
  disabled = false,
}: ControlsProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        {isPlaying ? (
          <Button
            variant="outline"
            size="icon"
            onClick={onPause}
            disabled={disabled}
          >
            <Pause className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            onClick={onPlay}
            disabled={disabled}
          >
            <Play className="w-4 h-4" />
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={onStep}
          disabled={disabled || isPlaying}
        >
          <SkipForward className="w-4 h-4" />
        </Button>

        {onReset && (
          <Button
            variant="outline"
            size="icon"
            onClick={onReset}
            disabled={disabled}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-1 max-w-xs">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Speed:
        </span>
        <Slider
          value={[playbackSpeed]}
          onValueChange={([value]) => onSpeedChange(value)}
          min={0.25}
          max={2}
          step={0.25}
          disabled={disabled}
          className="flex-1"
        />
        <span className="text-sm font-mono w-12">{playbackSpeed}x</span>
      </div>
    </div>
  );
}
