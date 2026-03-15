import { type FC } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { ModelDescriptor } from '@/api/schemas';

export interface StepPromptProps {
  userPrompt: string;
  onPromptChange: (v: string) => void;
  modelId: string;
  onModelChange: (id: string) => void;
  models: ModelDescriptor[];
  onGenerate: () => void;
  generating: boolean;
  error: string | null;
}

export const StepPrompt: FC<StepPromptProps> = ({
  userPrompt,
  onPromptChange,
  modelId,
  onModelChange,
  models,
  onGenerate,
  generating,
  error,
}) => (
  <Card className="w-full max-w-2xl">
    <CardHeader>
      <CardTitle>What to build</CardTitle>
      <p className="text-sm text-muted-foreground">
        Describe the visualization or HTML snippet you want (e.g. &quot;Bar chart of amount by region&quot;).
      </p>
    </CardHeader>
    <CardContent className="space-y-4">
      {models.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <select
            id="model"
            className="flex h-9 w-full max-w-xs rounded-md border border-border bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={modelId}
            onChange={(e) => onModelChange(e.target.value)}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.provider})
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="prompt">Prompt</Label>
        <textarea
          id="prompt"
          className="flex min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 resize-y"
          value={userPrompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="e.g. Show a bar chart of amount by region with a title"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button onClick={onGenerate} disabled={!userPrompt.trim() || generating}>
        {generating ? 'Generating…' : 'Generate HTML snippet'}
      </Button>
    </CardContent>
  </Card>
);
