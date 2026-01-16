import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, SkipForward, RotateCcw, CheckCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { Model, Weights } from "@/lib/types";
import { initializeWeights, trainStep, tokenize, detokenize } from "@/lib/model";

interface TrainPanelProps {
  model: Model;
  onWeightsChange: (weights: Weights) => void;
  onProgressUpdate: (iteration: number, loss: number, lossHistory: number[]) => void;
  onStatusChange: (status: Model["status"]) => void;
  onComplete: () => void;
}

interface TrainingStep {
  sentence: string;
  inputWords: string[];
  targetWord: string;
  predictions: Array<{ word: string; probability: number }>;
  loss: number;
  explanation: string;
}

export function TrainPanel({
  model,
  onWeightsChange,
  onProgressUpdate,
  onStatusChange,
  onComplete,
}: TrainPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [iteration, setIteration] = useState(model.trainingProgress.iteration);
  const [lossHistory, setLossHistory] = useState<number[]>(model.trainingProgress.lossHistory);
  const [weights, setWeights] = useState<Weights | null>(model.weights);
  const [currentStep, setCurrentStep] = useState<TrainingStep | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const maxIterations = model.trainingProgress.maxIterations;
  const vocabulary = model.vocabulary;
  const corpus = model.corpus;
  const config = model.config;
  const vocabSize = Object.keys(vocabulary).length;

  // Initialize weights if needed
  useEffect(() => {
    if (!weights && vocabSize > 0) {
      const newWeights = initializeWeights(vocabSize, config);
      setWeights(newWeights);
      onWeightsChange(newWeights);
    }
  }, [weights, vocabSize, config, onWeightsChange]);

  // Generate training pair
  const getTrainingPair = useCallback(() => {
    const sentence = corpus[Math.floor(Math.random() * corpus.length)];
    const tokens = tokenize(sentence, vocabulary);

    if (tokens.length < 2) {
      return getTrainingPair();
    }

    const splitPoint = Math.floor(Math.random() * (tokens.length - 1)) + 1;
    const inputTokens = tokens.slice(0, splitPoint);
    const targetToken = tokens[splitPoint];

    return { sentence, inputTokens, targetToken };
  }, [corpus, vocabulary]);

  // Generate explanation based on step
  const generateExplanation = (
    predictions: Array<{ word: string; probability: number }>,
    targetWord: string,
    _loss: number
  ): string => {
    const topPrediction = predictions[0];
    const isCorrect = topPrediction.word === targetWord;
    const targetProb = predictions.find((p) => p.word === targetWord)?.probability ?? 0;

    if (isCorrect) {
      if (topPrediction.probability > 0.5) {
        return `Great! The model confidently predicted "${targetWord}" with ${(topPrediction.probability * 100).toFixed(0)}% confidence. The weights will be reinforced.`;
      } else {
        return `Correct prediction "${targetWord}" but with only ${(topPrediction.probability * 100).toFixed(0)}% confidence. The model will strengthen this pattern.`;
      }
    } else {
      return `The model predicted "${topPrediction.word}" (${(topPrediction.probability * 100).toFixed(0)}%) but the answer was "${targetWord}" (${(targetProb * 100).toFixed(0)}%). Adjusting weights to favor the correct answer...`;
    }
  };

  // Run single training step
  const runStep = useCallback(() => {
    if (!weights || iteration >= maxIterations) return;

    const { sentence, inputTokens, targetToken } = getTrainingPair();
    const inputWords = inputTokens.map((t) => detokenize(t, vocabulary));
    const targetWord = detokenize(targetToken, vocabulary);

    const { newWeights, loss, result } = trainStep(
      inputTokens,
      targetToken,
      weights,
      config.learningRate
    );

    const predictions = result.probabilities
      .map((prob, idx) => ({
        word: detokenize(idx, vocabulary),
        probability: prob,
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);

    const explanation = generateExplanation(predictions, targetWord, loss);

    setCurrentStep({
      sentence,
      inputWords,
      targetWord,
      predictions,
      loss,
      explanation,
    });

    setWeights(newWeights);
    onWeightsChange(newWeights);

    const newIteration = iteration + 1;
    const newLossHistory = [...lossHistory, loss];

    setIteration(newIteration);
    setLossHistory(newLossHistory);
    onProgressUpdate(newIteration, loss, newLossHistory);

    if (newIteration >= maxIterations) {
      setIsPlaying(false);
      onStatusChange("completed");
    } else {
      onStatusChange("training");
    }
  }, [
    weights,
    iteration,
    maxIterations,
    getTrainingPair,
    vocabulary,
    config.learningRate,
    lossHistory,
    onWeightsChange,
    onProgressUpdate,
    onStatusChange,
  ]);

  // Auto-play loop
  useEffect(() => {
    if (isPlaying && iteration < maxIterations) {
      intervalRef.current = setInterval(runStep, 1000 / speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, runStep, iteration, maxIterations]);

  const handleReset = () => {
    setIteration(0);
    setLossHistory([]);
    setCurrentStep(null);
    setIsPlaying(false);
    const newWeights = initializeWeights(vocabSize, config);
    setWeights(newWeights);
    onWeightsChange(newWeights);
    onProgressUpdate(0, 0, []);
    onStatusChange("idle");
  };

  const avgLoss = lossHistory.length > 0
    ? lossHistory.slice(-50).reduce((a, b) => a + b, 0) / Math.min(50, lossHistory.length)
    : 0;

  const chartData = lossHistory.slice(-100).map((loss, idx) => ({
    iteration: lossHistory.length - 100 + idx + 1,
    loss,
  }));

  const isComplete = iteration >= maxIterations;
  const canStart = weights !== null && vocabSize > 0;

  return (
    <div className="space-y-4">
      {/* Intro */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Training Loop</h3>
        <p className="text-sm text-muted-foreground">
          Watch the model learn from your corpus. Each step: predict → compare →
          adjust weights.
        </p>
      </div>

      {/* Explanation Card */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="pt-4">
          <p className="text-sm">
            💡 <strong>How training works:</strong> The model sees part of a
            sentence and tries to predict the next word. If wrong, it adjusts
            weights to make the correct answer more likely next time.
          </p>
        </CardContent>
      </Card>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Progress</span>
          <span className="font-mono">{iteration} / {maxIterations}</span>
        </div>
        <Progress value={(iteration / maxIterations) * 100} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Avg Loss: {avgLoss.toFixed(3)}</span>
          {isComplete && <Badge className="bg-green-500">Complete!</Badge>}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {isPlaying ? (
          <Button variant="outline" size="sm" onClick={() => setIsPlaying(false)}>
            <Pause className="w-4 h-4 mr-1" /> Pause
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlaying(true)}
            disabled={!canStart || isComplete}
          >
            <Play className="w-4 h-4 mr-1" /> Play
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={runStep}
          disabled={!canStart || isPlaying || isComplete}
        >
          <SkipForward className="w-4 h-4 mr-1" /> Step
        </Button>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-1" /> Reset
        </Button>

        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs text-muted-foreground">Speed:</span>
          {[1, 5, 10].map((s) => (
            <Button
              key={s}
              variant={speed === s ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2"
              onClick={() => setSpeed(s)}
            >
              {s}x
            </Button>
          ))}
        </div>
      </div>

      {/* Current Step */}
      {currentStep && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Input:</span>{" "}
              <span className="font-medium">"{currentStep.inputWords.join(" ")}"</span>
              <span className="text-muted-foreground"> → Predict: </span>
              <Badge variant="outline" className="border-green-500 text-green-600">
                {currentStep.targetWord}
              </Badge>
            </div>

            {/* Predictions */}
            <div className="space-y-1">
              {currentStep.predictions.map(({ word, probability }, idx) => {
                const isCorrect = word === currentStep.targetWord;
                return (
                  <div key={word} className="flex items-center gap-2 text-sm">
                    <span className="w-16 truncate">{word}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isCorrect ? "bg-green-500" : idx === 0 ? "bg-primary" : "bg-primary/40"
                        }`}
                        style={{ width: `${probability * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono text-xs">
                      {(probability * 100).toFixed(0)}%
                    </span>
                    {isCorrect && <CheckCircle className="w-3 h-3 text-green-500" />}
                  </div>
                );
              })}
            </div>

            {/* Explanation */}
            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              {currentStep.explanation}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loss Chart */}
      {lossHistory.length > 10 && (
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="iteration" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="loss"
                stroke="hsl(var(--primary))"
                dot={false}
                strokeWidth={1.5}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Complete Button */}
      {isComplete && (
        <Button onClick={onComplete} className="w-full">
          <CheckCircle className="w-4 h-4 mr-2" />
          Training Complete - Continue to Execution
        </Button>
      )}
    </div>
  );
}
