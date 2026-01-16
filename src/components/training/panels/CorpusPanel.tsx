import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, RotateCcw, Shuffle } from "lucide-react";
import { DEFAULT_CORPUS } from "@/lib/types";

// Pre-prepared sentence templates for random generation
const SENTENCE_TEMPLATES = [
  // Subject + verb + location
  "The cat sat on the mat.",
  "The dog ran in the park.",
  "A bird flew over the tree.",
  "The cat slept on the bed.",
  "The dog played in the yard.",
  "A fish swam in the pond.",
  "The bird sang in the tree.",
  "The cat jumped on the table.",
  "The dog barked at the door.",
  "A rabbit hopped in the garden.",

  // Subject + verb + object
  "The cat chased the mouse.",
  "The dog caught the ball.",
  "A bird ate the seed.",
  "The cat watched the bird.",
  "The dog found the bone.",
  "A mouse ran from the cat.",
  "The bird built a nest.",
  "The cat drank the milk.",
  "The dog loved the boy.",
  "A girl fed the duck.",

  // More complex patterns
  "The big cat sat on the soft mat.",
  "The small dog ran in the green park.",
  "A little bird flew over the tall tree.",
  "The happy cat played with the red ball.",
  "The brown dog slept in the warm sun.",
  "A white bird landed on the blue water.",
  "The black cat hid under the old bed.",
  "The young dog jumped over the small fence.",

  // Questions and statements
  "The cat is on the mat.",
  "The dog is in the park.",
  "A bird is in the sky.",
  "The sun is very bright.",
  "The moon is in the sky.",
  "The tree is very tall.",
  "The flower is very pretty.",
  "The water is very cold.",

  // Action sequences
  "The cat sat and then slept.",
  "The dog ran and then stopped.",
  "A bird flew and then landed.",
  "The boy walked and then ran.",
  "The girl sang and then danced.",
];

interface CorpusPanelProps {
  corpus: string[];
  onCorpusChange: (corpus: string[]) => void;
  onComplete: () => void;
}

export function CorpusPanel({
  corpus,
  onCorpusChange,
  onComplete,
}: CorpusPanelProps) {
  const [editText, setEditText] = useState(corpus.join("\n"));
  const [generateCount, setGenerateCount] = useState(8);

  useEffect(() => {
    setEditText(corpus.join("\n"));
  }, [corpus]);

  const handleSave = () => {
    const newCorpus = editText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (newCorpus.length > 0) {
      onCorpusChange(newCorpus);
      onComplete();
    }
  };

  const handleReset = () => {
    setEditText(DEFAULT_CORPUS.join("\n"));
    onCorpusChange(DEFAULT_CORPUS);
  };

  const handleGenerateRandom = () => {
    // Shuffle and pick unique sentences
    const shuffled = [...SENTENCE_TEMPLATES].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, generateCount);
    setEditText(selected.join("\n"));
  };

  // Count unique words
  const uniqueWords = new Set(
    editText
      .toLowerCase()
      .replace(/[.,!?]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 0)
  );

  const sentenceCount = editText.split("\n").filter((s) => s.trim().length > 0).length;

  return (
    <div className="space-y-4">
      {/* Intro */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Training Corpus</h3>
        <p className="text-sm text-muted-foreground">
          This is the text your model will learn from. The model will try to
          predict the next word based on patterns it finds in these sentences.
        </p>
      </div>

      {/* Explanation Card */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="pt-4">
          <p className="text-sm">
            💡 <strong>Why this matters:</strong> A language model learns by
            seeing lots of text. It notices patterns like "the cat" often
            followed by "sat" or "ran". More sentences with overlapping words
            help the model learn better relationships.
          </p>
        </CardContent>
      </Card>

      {/* Random Generator */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Generate Random Sentences</span>
            <Badge variant="outline">{generateCount} sentences</Badge>
          </div>
          <Slider
            value={[generateCount]}
            onValueChange={([v]) => setGenerateCount(v)}
            min={5}
            max={20}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5 (simple)</span>
            <span>20 (more data)</span>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGenerateRandom}
          >
            <Shuffle className="w-4 h-4 mr-2" />
            Generate {generateCount} Random Sentences
          </Button>
        </CardContent>
      </Card>

      {/* Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Edit Sentences</span>
          <div className="flex gap-2">
            <Badge variant="secondary">{sentenceCount} sentences</Badge>
            <Badge variant="outline">{uniqueWords.size} unique words</Badge>
          </div>
        </div>
        <Textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          placeholder="Enter training sentences, one per line..."
          className="min-h-[200px] font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Enter one sentence per line. Keep sentences simple with common words.
          Recommended: 5-15 sentences with overlapping vocabulary.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Default
        </Button>
        <Button onClick={handleSave} disabled={sentenceCount < 2}>
          <Check className="w-4 h-4 mr-2" />
          Save Corpus
        </Button>
      </div>
    </div>
  );
}
