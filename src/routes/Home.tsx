import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GraduationCap, Play } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">LLM Visualizer</h1>
        <p className="text-muted-foreground text-lg max-w-md">
          Learn how Large Language Models work through interactive visualization
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
        <Link to="/training">
          <Card className="h-full hover:border-primary transition-colors cursor-pointer">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Training</CardTitle>
              <CardDescription>
                Learn how LLMs learn from data. Build vocabulary, initialize embeddings, and watch the training loop.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/execution">
          <Card className="h-full hover:border-primary transition-colors cursor-pointer">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Play className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Execution</CardTitle>
              <CardDescription>
                Use your trained model to generate text. See exactly what happens inside during inference.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
