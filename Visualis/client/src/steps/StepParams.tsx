import { type FC, useState, useCallback, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { searchPackages } from '@/api/client';
import type { PackageDescriptor } from '@/api/schemas';

const defaultParams = '{\n  "param1": "value1",\n  "filters": {}\n}';
const SEARCH_DEBOUNCE_MS = 300;

export interface StepParamsProps {
  packageId: string;
  packageDisplayName: string;
  onPackageSelect: (id: string, name: string) => void;
  runParamsJson: string;
  onRunParamsChange: (v: string) => void;
  onRun: (params: Record<string, unknown>) => void;
  running: boolean;
  error: string | null;
}

export const StepParams: FC<StepParamsProps> = ({
  packageId,
  packageDisplayName,
  onPackageSelect,
  runParamsJson,
  onRunParamsChange,
  onRun,
  running,
  error,
}) => {
  const [paramsText, setParamsText] = useState(runParamsJson || defaultParams);
  const [packageQuery, setPackageQuery] = useState(packageDisplayName || '');
  const [suggestions, setSuggestions] = useState<PackageDescriptor[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (packageQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      setLoadingSuggestions(true);
      searchPackages(packageQuery)
        .then((list) => {
          setSuggestions(list);
          setShowSuggestions(true);
        })
        .catch((e) => {
          console.error('[StepParams] search packages failed', e);
          setSuggestions([]);
        })
        .finally(() => setLoadingSuggestions(false));
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [packageQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return;
      setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      const next = value ?? '';
      setParamsText(next);
      try {
        JSON.parse(next);
        onRunParamsChange(next);
      } catch {
        // allow invalid json while typing
      }
    },
    [onRunParamsChange]
  );

  const handleRun = useCallback(() => {
    let params: Record<string, unknown>;
    try {
      params = JSON.parse(paramsText) as Record<string, unknown>;
    } catch {
      return;
    }
    onRunParamsChange(paramsText);
    onRun(params);
  }, [paramsText, onRunParamsChange, onRun]);

  const onSelectPackage = useCallback(
    (pkg: PackageDescriptor) => {
      onPackageSelect(String(pkg.Id), pkg.Name);
      setPackageQuery(pkg.Name);
      setSuggestions([]);
      setShowSuggestions(false);
    },
    [onPackageSelect]
  );

  const paramsValid = ((): boolean => {
    try {
      JSON.parse(paramsText);
      return true;
    } catch {
      return false;
    }
  })();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Package run</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter package ID and run parameters (JSON). Then run to load cube results.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2" ref={containerRef}>
          <Label htmlFor="packageId">Package</Label>
          <div className="relative">
            <Input
              id="packageId"
              value={packageQuery}
              onChange={(e) => setPackageQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Type to search packages (min 2 chars)..."
              autoComplete="off"
            />
            {loadingSuggestions && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                Searching…
              </span>
            )}
            {showSuggestions && suggestions.length > 0 && (
              <ul
                className="absolute z-10 mt-1 w-full rounded-md border border-border bg-card py-1 shadow-lg"
                role="listbox"
              >
                {suggestions.map((pkg) => (
                  <li
                    key={pkg.Id}
                    role="option"
                    className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    onMouseDown={() => onSelectPackage(pkg)}
                  >
                    {pkg.Name} <span className="text-muted-foreground">(id: {pkg.Id})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Run parameters (JSON)</Label>
          <div className="rounded-md border border-border overflow-hidden min-h-[200px]">
            <Editor
              height="200px"
              defaultLanguage="json"
              value={paramsText}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{ minimap: { enabled: false }, fontSize: 13 }}
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button
          onClick={handleRun}
          disabled={!packageId.trim() || !paramsValid || running}
        >
          {running ? 'Running…' : 'Run package'}
        </Button>
      </CardContent>
    </Card>
  );
};
