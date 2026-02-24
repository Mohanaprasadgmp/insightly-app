"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GenerateButton({
  reportId,
  label = "Generate with AI",
}: {
  reportId: string;
  label?: string;
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${reportId}/generate`, {
        method: "POST",
      });

      if (!res.ok) {
        let msg = "Generation failed. Please try again.";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch { /* ignore parse error */ }
        setError(msg);
        return;
      }

      if (!res.body) {
        setError("No response from server. Please try again.");
        return;
      }

      // Consume the stream (Claude writes the report server-side)
      const reader = res.body.getReader();
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }

      // Refresh the Server Component to show the generated summary
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button
        variant="gradient"
        size="sm"
        onClick={handleGenerate}
        disabled={generating}
      >
        {generating ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5" />
            {label}
          </>
        )}
      </Button>
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
