import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

interface VocabularyBuilderProps {
  corpus: string[];
  vocabulary: Record<string, number>;
  onVocabularyChange: (vocabulary: Record<string, number>) => void;
  onComplete: () => void;
}

export function VocabularyBuilder({
  corpus,
  vocabulary,
  onVocabularyChange,
  onComplete,
}: VocabularyBuilderProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Extract all unique words from corpus
  const allWords = useMemo(() => {
    const words = new Set<string>();
    corpus.forEach((sentence) => {
      sentence
        .toLowerCase()
        .replace(/[.,!?]/g, "")
        .split(/\s+/)
        .forEach((word) => {
          if (word) words.add(word);
        });
    });
    return Array.from(words).sort();
  }, [corpus]);

  // Get next available token ID
  const nextTokenId = Object.keys(vocabulary).length;

  // Check if all words are assigned
  const allAssigned = allWords.every((word) => word in vocabulary);

  // Handle word click
  const handleWordClick = (word: string) => {
    if (word in vocabulary) {
      // Already assigned - just highlight it
      setSelectedWord(word);
      return;
    }

    // Assign new token ID
    const newVocabulary = { ...vocabulary, [word]: nextTokenId };
    onVocabularyChange(newVocabulary);
    setSelectedWord(word);
  };

  // Auto-assign all remaining words
  const handleAutoAssign = () => {
    const newVocabulary = { ...vocabulary };
    let id = nextTokenId;
    allWords.forEach((word) => {
      if (!(word in newVocabulary)) {
        newVocabulary[word] = id++;
      }
    });
    onVocabularyChange(newVocabulary);
  };

  return (
    <div className="space-y-6">
      {/* Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">1</span>
            <span>Build Your Vocabulary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Computers only understand numbers. The first step is to give each
            word a unique ID number. This is called <strong>tokenization</strong>.
          </p>
          <p className="text-muted-foreground">
            Click on each word below to assign it a token ID. Notice that the
            same word always gets the same ID!
          </p>
        </CardContent>
      </Card>

      {/* Training Corpus */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Training Sentences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {corpus.map((sentence, idx) => (
              <div key={idx} className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                {sentence
                  .replace(/[.,!?]/g, "")
                  .split(/\s+/)
                  .map((word, wordIdx) => {
                    const normalizedWord = word.toLowerCase();
                    const tokenId = vocabulary[normalizedWord];
                    const isAssigned = tokenId !== undefined;
                    const isSelected = selectedWord === normalizedWord;

                    return (
                      <motion.button
                        key={`${idx}-${wordIdx}`}
                        onClick={() => handleWordClick(normalizedWord)}
                        className={`
                          relative px-3 py-1.5 rounded-md text-sm font-medium
                          transition-colors cursor-pointer
                          ${isAssigned
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary hover:bg-secondary/80"
                          }
                          ${isSelected ? "ring-2 ring-ring ring-offset-2" : ""}
                        `}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {word}
                        <AnimatePresence>
                          {isAssigned && (
                            <motion.span
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground"
                            >
                              #{tokenId}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vocabulary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Your Vocabulary</span>
            <Badge variant="secondary">
              {Object.keys(vocabulary).length} / {allWords.length} words
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(vocabulary).length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Click on words above to build your vocabulary
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(vocabulary)
                .sort((a, b) => a[1] - b[1])
                .map(([word, id]) => (
                  <motion.div
                    key={word}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 px-2 py-1 bg-muted rounded"
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      #{id}
                    </span>
                    <span className="text-sm">{word}</span>
                  </motion.div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Panel */}
      {selectedWord && selectedWord in vocabulary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-4">
              <p className="text-sm">
                <strong>"{selectedWord}"</strong> → Token ID{" "}
                <strong>#{vocabulary[selectedWord]}</strong>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Every time the model sees "{selectedWord}", it will use the
                number {vocabulary[selectedWord]}.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleAutoAssign} disabled={allAssigned}>
          <Sparkles className="w-4 h-4 mr-2" />
          Auto-assign remaining
        </Button>

        <Button onClick={onComplete} disabled={!allAssigned}>
          Continue to Embeddings
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Learning Note */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Why this matters:</strong> Token IDs are just arbitrary
            numbers - #0 and #1 don't mean "similar". In the next step, we'll
            give these numbers actual meaning using <em>embeddings</em>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
