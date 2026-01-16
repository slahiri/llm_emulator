import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Eye, Check, X } from "lucide-react";

interface AttentionExplainerProps {
  corpus: string[];
  onComplete: () => void;
  onBack: () => void;
}

// Pre-defined attention scenarios for teaching
const ATTENTION_SCENARIOS = [
  {
    sentence: "The cat sat on the mat",
    targetWord: "sat",
    targetIndex: 2,
    question: "When predicting what comes after 'sat', which word should the model focus on most?",
    correctAnswer: "cat",
    correctIndex: 1,
    explanation: "The model should focus on 'cat' because it's the subject doing the action. Knowing WHO sat helps predict WHERE (on the mat).",
    attentionScores: { the: 0.1, cat: 0.65, sat: 0.1, on: 0.05, mat: 0.1 },
  },
  {
    sentence: "The dog chased the cat",
    targetWord: "chased",
    targetIndex: 2,
    question: "When processing 'chased', which word matters most for understanding the action?",
    correctAnswer: "dog",
    correctIndex: 1,
    explanation: "The model focuses on 'dog' to understand who is doing the chasing. This helps it understand the relationship between words.",
    attentionScores: { the: 0.08, dog: 0.6, chased: 0.12, cat: 0.2 },
  },
  {
    sentence: "A bird flew over the tree",
    targetWord: "flew",
    targetIndex: 2,
    question: "For 'flew', which word provides the most context?",
    correctAnswer: "bird",
    correctIndex: 1,
    explanation: "Birds fly! The model learns that 'bird' and 'flew' are strongly connected, so when it sees 'bird', it expects flight-related actions.",
    attentionScores: { a: 0.05, bird: 0.7, flew: 0.1, over: 0.05, the: 0.05, tree: 0.05 },
  },
];

export function AttentionExplainer({
  onComplete,
  onBack,
}: AttentionExplainerProps) {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const scenario = ATTENTION_SCENARIOS[currentScenario];
  const words = scenario.sentence.toLowerCase().split(" ");
  const isCorrect = selectedWord === scenario.correctAnswer;
  const isLastScenario = currentScenario === ATTENTION_SCENARIOS.length - 1;

  const handleWordClick = (word: string) => {
    if (showAnswer) return;
    setSelectedWord(word);
  };

  const handleCheckAnswer = () => {
    setShowAnswer(true);
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (isLastScenario) {
      onComplete();
    } else {
      setCurrentScenario((c) => c + 1);
      setSelectedWord(null);
      setShowAnswer(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">3</span>
            <span>Understand Attention</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The <strong>attention mechanism</strong> lets each word "look at"
            all other words to understand context. It learns which words are
            important for understanding each position.
          </p>
          <p className="text-muted-foreground">
            Try to guess which word the model pays most attention to!
          </p>
        </CardContent>
      </Card>

      {/* Progress */}
      <div className="flex items-center justify-between">
        <Badge variant="outline">
          Scenario {currentScenario + 1} / {ATTENTION_SCENARIOS.length}
        </Badge>
        <Badge variant="secondary">
          Score: {correctCount} / {currentScenario + (showAnswer ? 1 : 0)}
        </Badge>
      </div>

      {/* Scenario */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {scenario.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sentence with clickable words */}
          <div className="flex flex-wrap gap-3 justify-center py-4">
            {words.map((word, idx) => {
              const isTarget = idx === scenario.targetIndex;
              const isSelected = selectedWord === word;
              const isCorrectWord = word === scenario.correctAnswer;

              return (
                <motion.button
                  key={idx}
                  onClick={() => !isTarget && handleWordClick(word)}
                  disabled={isTarget}
                  className={`
                    relative px-4 py-2 rounded-lg text-lg font-medium transition-all
                    ${isTarget
                      ? "bg-primary text-primary-foreground cursor-default"
                      : isSelected
                      ? "bg-secondary ring-2 ring-ring"
                      : "bg-muted hover:bg-muted/80 cursor-pointer"
                    }
                    ${showAnswer && isCorrectWord ? "ring-2 ring-green-500" : ""}
                    ${showAnswer && isSelected && !isCorrect ? "ring-2 ring-red-500" : ""}
                  `}
                  whileHover={!isTarget ? { scale: 1.05 } : {}}
                  whileTap={!isTarget ? { scale: 0.95 } : {}}
                >
                  {word}
                  {isTarget && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                      target
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Selection feedback */}
          {selectedWord && !showAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <p className="text-muted-foreground mb-4">
                You selected: <strong>"{selectedWord}"</strong>
              </p>
              <Button onClick={handleCheckAnswer}>Check Answer</Button>
            </motion.div>
          )}

          {/* Answer reveal */}
          <AnimatePresence>
            {showAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Result */}
                <div
                  className={`
                    p-4 rounded-lg flex items-center gap-3
                    ${isCorrect ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-700"}
                  `}
                >
                  {isCorrect ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <X className="w-5 h-5" />
                  )}
                  <span className="font-medium">
                    {isCorrect
                      ? "Correct!"
                      : `Not quite. The answer is "${scenario.correctAnswer}".`}
                  </span>
                </div>

                {/* Explanation */}
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-sm">{scenario.explanation}</p>
                  </CardContent>
                </Card>

                {/* Attention visualization */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Model's attention distribution:</p>
                  {Object.entries(scenario.attentionScores).map(([word, score]) => (
                    <div key={word} className="flex items-center gap-3">
                      <span className="w-16 text-sm">{word}</span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${score * 100}%` }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className={`h-full ${
                            word === scenario.correctAnswer
                              ? "bg-green-500"
                              : "bg-primary/60"
                          }`}
                        />
                      </div>
                      <span className="w-12 text-sm font-mono text-right">
                        {(score * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Next button */}
                <div className="flex justify-end pt-4">
                  <Button onClick={handleNext}>
                    {isLastScenario ? "Continue to Training" : "Next Scenario"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Back button */}
      {!showAnswer && (
        <div className="flex justify-start">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Embeddings
          </Button>
        </div>
      )}

      {/* Learning Note */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Multi-head attention:</strong> Real transformers have
            multiple "attention heads" running in parallel. Each head can learn
            different patterns - one might focus on grammar, another on meaning,
            another on long-range dependencies.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
