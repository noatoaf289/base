import { type FC, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FieldExplanation } from '@/types/flow';

const MAX_FIELDS = 16;
const MAX_EXPLANATION_LENGTH = 100;

export interface StepCubeFieldsProps {
  cubeNames: string[];
  mainCubeName: string;
  fieldNames: string[];
  fieldExplanations: FieldExplanation[];
  onMainCubeChange: (name: string) => void;
  onFieldExplanationsChange: (list: FieldExplanation[]) => void;
  onNext: () => void;
}

export const StepCubeFields: FC<StepCubeFieldsProps> = ({
  cubeNames,
  mainCubeName,
  fieldNames,
  fieldExplanations,
  onMainCubeChange,
  onFieldExplanationsChange,
  onNext,
}) => {
  const [cubeInput, setCubeInput] = useState(mainCubeName);

  const addField = useCallback(() => {
    if (fieldExplanations.length >= MAX_FIELDS) return;
    onFieldExplanationsChange([
      ...fieldExplanations,
      { fieldName: fieldNames[0] ?? '', explanation: '' },
    ]);
  }, [fieldExplanations, fieldNames, onFieldExplanationsChange]);

  const updateField = useCallback(
    (index: number, updates: Partial<FieldExplanation>) => {
      const next = [...fieldExplanations];
      next[index] = { ...next[index], ...updates };
      onFieldExplanationsChange(next);
    },
    [fieldExplanations, onFieldExplanationsChange]
  );

  const removeField = useCallback(
    (index: number) => {
      onFieldExplanationsChange(fieldExplanations.filter((_, i) => i !== index));
    },
    [fieldExplanations, onFieldExplanationsChange]
  );

  const filteredCubes = useMemo(
    () =>
      cubeNames.filter((c) => c.toLowerCase().includes(cubeInput.toLowerCase())),
    [cubeNames, cubeInput]
  );

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Select cube and field explanations</CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose the main cube and add up to {MAX_FIELDS} field explanations (max {MAX_EXPLANATION_LENGTH} chars each).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cube">Main cube</Label>
          <Input
            id="cube"
            value={cubeInput}
            onChange={(e) => setCubeInput(e.target.value)}
            onBlur={() => {
              if (cubeNames.includes(cubeInput)) onMainCubeChange(cubeInput);
            }}
            placeholder="Type to search cubes..."
            list="cube-list"
          />
          <datalist id="cube-list">
            {filteredCubes.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {cubeInput && !cubeNames.includes(cubeInput) && (
            <p className="text-xs text-muted-foreground">Select a cube from the list or use an existing name.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Field explanations</Label>
          {fieldExplanations.map((fe, i) => (
            <div key={i} className="flex gap-2 items-start rounded border border-border p-2">
              <div className="flex-1 grid grid-cols-[1fr,2fr] gap-2">
                <Input
                  placeholder="Field name"
                  value={fe.fieldName}
                  onChange={(e) => updateField(i, { fieldName: e.target.value })}
                  list={`field-list-${i}`}
                />
                <datalist id={`field-list-${i}`}>
                  {fieldNames.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
                <textarea
                  className="flex min-h-[60px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y col-span-2"
                  placeholder="Explanation (max 100 chars)"
                  value={fe.explanation}
                  onChange={(e) =>
                    updateField(i, { explanation: e.target.value.slice(0, MAX_EXPLANATION_LENGTH) })
                  }
                  maxLength={MAX_EXPLANATION_LENGTH}
                  rows={2}
                />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeField(i)}>
                ×
              </Button>
            </div>
          ))}
          {fieldExplanations.length < MAX_FIELDS && (
            <Button type="button" variant="outline" onClick={addField}>
              + Add field explanation
            </Button>
          )}
        </div>

        <Button
          onClick={() => {
            if (cubeNames.includes(cubeInput)) onMainCubeChange(cubeInput);
            onNext();
          }}
        >
          Next: Enter prompt
        </Button>
      </CardContent>
    </Card>
  );
};
