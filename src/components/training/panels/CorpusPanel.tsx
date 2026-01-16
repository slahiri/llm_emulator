import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, RotateCcw } from "lucide-react";
import { DEFAULT_CORPUS } from "@/lib/types";

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
