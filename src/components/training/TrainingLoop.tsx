import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Pause, SkipForward, RotateCcw, CheckCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Model, Weights } from "@/lib/types";
import { initializeWeights, trainStep, tokenize, detokenize, forward } from "@/lib/model";

interface TrainingLoopProps {
  model: Model;
  onWeightsChange: (weights: Weights) => void;
  onProgressUpdate: (iteration: number, loss: number, lossHistory: number[]) => void;
  onComplete: () => void;
  onBack: () => void;
}

interface TrainingState {
  currentSentence: string;
  inputTokens: number[];
  targetToken: number;
  predictions: Array<{ word: string; probability: number }>;
  correctWord: string;
  loss: number;
  phase: "idle" | "forward" | "loss" | "backprop" | "update";
}

export function TrainingLoop({
  model,
  onWeightsChange,
  onProgressUpdate,
  onComplete,
  onBack,
}: TrainingLoopProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [iteration, setIteration] = useState(model.trainingProgress.iteration);
  const [lossHistory, setLossHistory] = useState<number[]>(model.trainingProgress.lossHistory);
  const [weights, setWeights] = useState<Weights | null>(model.weights);
  const [trainingState, setTrainingState] = useState<TrainingState | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const maxIterations = model.trainingProgress.maxIterations;
  const vocabulary = model.vocabulary;
  const corpus = model.corpus;
  const config = model.config;
  const vocabSize = Object.keys(vocabulary).length;

  // Initialize weights if not set
  useEffect(() => {
    if (!weights) {
      const initialWeights = initializeWeights(vocabSize, config);
      setWeights(initialWeights);
      onWeightsChange(initialWeights);
    }
  }, [weights, vocabSize, config, onWeightsChange]);

  // Generate training pair from corpus
  const getTrainingPair = useCallback(() => {
    // Pick random sentence
    const sentence = corpus[Math.floor(Math.random() * corpus.length)];
    const tokens = tokenize(sentence, vocabulary);

    if (tokens.length < 2) {
      return getTrainingPair(); // Try another sentence
    }

    // Random split point
    const splitPoint = Math.floor(Math.random() * (tokens.length - 1)) + 1;
    const inputTokens = tokens.slice(0, splitPoint);
    const targetToken = tokens[splitPoint];

    return { sentence, inputTokens, targetToken };
  }, [corpus, vocabulary]);

  // Run single training step
  const runStep = useCallback(() => {
    if (!weights || iteration >= maxIterations) return;

    const { sentence, inputTokens, targetToken } = getTrainingPair();

    // Forward pass to get predictions
    const forwardResult = forward(inputTokens, weights, targetToken);

    // Get top predictions
    const predictions = forwardResult.probabilities
      .map((prob, idx) => ({
        word: detokenize(idx, vocabulary),
        probability: prob,
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);

    const correctWord = detokenize(targetToken, vocabulary);

    // Update training state for visualization
    setTrainingState({
      currentSentence: sentence,
      inputTokens,
      targetToken,
      predictions,
      correctWord,
      loss: forwardResult.loss!,
      phase: "forward",
    });

    // Perform training step
    const { newWeights, loss } = trainStep(
      inputTokens,
      targetToken,
      weights,
      config.learningRate
    );

    // Update state
    setWeights(newWeights);
    onWeightsChange(newWeights);

    const newIteration = iteration + 1;
    const newLossHistory = [...lossHistory, loss];

    setIteration(newIteration);
    setLossHistory(newLossHistory);
    onProgressUpdate(newIteration, loss, newLossHistory);

    // Check completion
    if (newIteration >= maxIterations) {
      setIsPlaying(false);
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
  ]);

  // Auto-play loop
  useEffect(() => {
    if (isPlaying && iteration < maxIterations) {
      intervalRef.current = setInterval(() => {
        runStep();
      }, 1000 / speed);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, speed, runStep, iteration, maxIterations]);

  // Calculate average loss
  const avgLoss = lossHistory.length > 0
    ? lossHistory.slice(-50).reduce((a, b) => a + b, 0) / Math.min(50, lossHistory.length)
    : 0;

  // Chart data
  const chartData = lossHistory.map((loss, idx) => ({
    iteration: idx + 1,
    loss: loss,
  }));

  const isComplete = iteration >= maxIterations;

  return (
    <div className="space-y-6">
      {/* Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">4</span>
            <span>Training Loop</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Now watch the model learn! For each training step:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-1 text-sm">
            <li><strong>Forward pass:</strong> Predict the next word</li>
            <li><strong>Calculate loss:</strong> How wrong was the prediction?</li>
            <li><strong>Backpropagation:</strong> Figure out which weights to adjust</li>
            <li><strong>Update weights:</strong> Make small improvements</li>
          </ol>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Training Progress</span>
            <Badge variant={isComplete ? "default" : "secondary"}>
              {iteration} / {maxIterations}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={(iteration / maxIterations) * 100} />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Current Loss:</span>
              <span className="ml-2 font-mono">
                {trainingState?.loss.toFixed(4) ?? "—"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg Loss (last 50):</span>
              <span className="ml-2 font-mono">{avgLoss.toFixed(4)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <Button variant="outline" size="icon" onClick={() => setIsPlaying(false)}>
              <Pause className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsPlaying(true)}
              disabled={isComplete}
            >
              <Play className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={runStep}
            disabled={isPlaying || isComplete}
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setIteration(0);
              setLossHistory([]);
              setTrainingState(null);
              const newWeights = initializeWeights(vocabSize, config);
              setWeights(newWeights);
              onWeightsChange(newWeights);
              onProgressUpdate(0, 0, []);
            }}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Speed:</span>
          {[1, 2, 5, 10].map((s) => (
            <Button
              key={s}
              variant={speed === s ? "default" : "outline"}
              size="sm"
              onClick={() => setSpeed(s)}
            >
              {s}x
            </Button>
          ))}
        </div>
      </div>

      {/* Current Training Step Visualization */}
      <AnimatePresence>
        {trainingState && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Step</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sentence */}
                <div>
                  <span className="text-sm text-muted-foreground">Sentence: </span>
                  <span className="font-medium">{trainingState.currentSentence}</span>
                </div>

                {/* Input → Target */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Input:</span>
                  {trainingState.inputTokens.map((t, i) => (
                    <Badge key={i} variant="secondary">
                      {detokenize(t, vocabulary)}
                    </Badge>
                  ))}
                  <span className="text-muted-foreground">→</span>
                  <span className="text-sm text-muted-foreground">Predict:</span>
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    {trainingState.correctWord}
                  </Badge>
                </div>

                {/* Predictions */}
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Model's predictions:</span>
                  {trainingState.predictions.map(({ word, probability }, idx) => {
                    const isCorrect = word === trainingState.correctWord;
                    return (
                      <div key={word} className="flex items-center gap-2">
                        <span className="w-20 text-sm truncate">{word}</span>
                        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${probability * 100}%` }}
                            className={`h-full ${
                              isCorrect ? "bg-green-500" : idx === 0 ? "bg-primary" : "bg-primary/40"
                            }`}
                          />
                        </div>
                        <span className="w-16 text-sm font-mono text-right">
                          {(probability * 100).toFixed(1)}%
                        </span>
                        {isCorrect && <CheckCircle className="w-4 h-4 text-green-500" />}
                      </div>
                    );
                  })}
                </div>

                {/* Loss */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Loss: </span>
                  <span className="font-mono">{trainingState.loss.toFixed(4)}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    (lower is better)
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loss Chart */}
      {lossHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Loss Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="iteration"
                    tick={{ fontSize: 12 }}
                    label={{ value: "Iteration", position: "bottom", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={{ value: "Loss", angle: -90, position: "insideLeft", fontSize: 12 }}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="loss"
                    stroke="hsl(var(--primary))"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              The loss should generally decrease over time as the model learns.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Attention
        </Button>

        <Button onClick={onComplete} disabled={iteration < 50}>
          {isComplete ? "Training Complete!" : "Finish Training Early"}
          <CheckCircle className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Learning Note */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>What's happening:</strong> The model sees part of a sentence
            and tries to predict the next word. When it's wrong, it adjusts its
            weights to make that prediction more likely next time. Over many
            iterations, it learns patterns like "cat" often comes after "the".
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
