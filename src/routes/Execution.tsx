import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Execution() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Execution</h1>
        </div>

        <div className="text-center py-20">
          <p className="text-muted-foreground">
            Complete training first to use execution mode.
          </p>
          <Link to="/training">
            <Button className="mt-4">Go to Training</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
