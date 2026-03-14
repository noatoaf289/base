import { useState, useCallback } from 'react';
import { runPackage, generateSnippet, sendFeedback } from '@/api/client';
import { StepParams } from '@/steps/StepParams';
import { StepCubeFields } from '@/steps/StepCubeFields';
import { StepPrompt } from '@/steps/StepPrompt';
import { StepPreview } from '@/steps/StepPreview';
import type { Step, PackageRunState, PreviewState, FieldExplanation } from '@/types/flow';
import { flapiRunResponseSchema } from '@/api/schemas';

const extractCubeNames = (results: Record<string, unknown[]>): string[] =>
  Object.keys(results);

const extractFieldNames = (rows: unknown[]): string[] => {
  const set = new Set<string>();
  for (const row of rows) {
    if (row !== null && typeof row === 'object' && !Array.isArray(row)) {
      for (const key of Object.keys(row)) set.add(key);
    }
  }
  return Array.from(set);
};

export const App = () => {
  const [step, setStep] = useState<Step>('params');
  const [runError, setRunError] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const [state, setState] = useState<PackageRunState>({
    packageId: '',
    packageDisplayName: '',
    runParams: {},
    runResponse: null,
    mainCubeName: '',
    mainCubeData: [],
    fieldExplanations: [],
    userPrompt: '',
  });

  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [runParamsJson, setRunParamsJson] = useState('{\n  "param1": "value1",\n  "filters": {}\n}');

  const handleRun = useCallback(async (params: Record<string, unknown>) => {
    setRunError(null);
    setRunning(true);
    try {
      const res = await runPackage(state.packageId, params);
      const parsed = flapiRunResponseSchema.safeParse(res);
      if (!parsed.success) {
        setRunError('Invalid response from server');
        return;
      }
      const cubeNames = extractCubeNames(parsed.data.results);
      const mainCube = state.mainCubeName && parsed.data.results[state.mainCubeName]
        ? state.mainCubeName
        : cubeNames[0];
      const mainCubeData = mainCube ? (parsed.data.results[mainCube] ?? []) : [];
      setState((s) => ({
        ...s,
        runParams: params,
        runResponse: parsed.data,
        mainCubeName: mainCube ?? '',
        mainCubeData,
        fieldExplanations: [],
      }));
      setStep('cube-fields');
    } catch (e) {
      setRunError(e instanceof Error ? e.message : 'Run failed');
    } finally {
      setRunning(false);
    }
  }, [state.packageId, state.mainCubeName]);

  const handleGenerate = useCallback(async () => {
    setGenError(null);
    setGenerating(true);
    try {
      const body = {
        fieldExplanations: state.fieldExplanations.filter(
          (f) => f.fieldName.trim() && f.explanation.trim()
        ),
        userPrompt: state.userPrompt,
        mainCubeName: state.mainCubeName,
        mainCubeData: state.mainCubeData,
      };
      const res = await generateSnippet(body);
      setPreview({
        runId: res.runId,
        htmlSnippet: res.htmlSnippet,
        librariesUsed: res.librariesUsed,
      });
      setStep('preview');
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Generate failed');
    } finally {
      setGenerating(false);
    }
  }, [state.fieldExplanations, state.userPrompt, state.mainCubeName, state.mainCubeData]);

  const handleFeedback = useCallback(
    async (feedback: string) => {
      if (!preview) return;
      setFeedbackLoading(true);
      try {
        const res = await sendFeedback({ runId: preview.runId, feedback });
        setPreview({
          runId: res.runId,
          htmlSnippet: res.htmlSnippet,
          librariesUsed: res.librariesUsed,
        });
      } finally {
        setFeedbackLoading(false);
      }
    },
    [preview]
  );

  const handleStartOver = useCallback(() => {
    setStep('params');
    setPreview(null);
    setState((s) => ({
      ...s,
      packageId: '',
      packageDisplayName: '',
      runResponse: null,
      mainCubeData: [],
      fieldExplanations: [],
      userPrompt: '',
    }));
    setRunError(null);
    setGenError(null);
  }, []);

  const cubeNames = state.runResponse ? extractCubeNames(state.runResponse.results) : [];
  const fieldNames = extractFieldNames(state.mainCubeData);

  const setFieldExplanations = useCallback((list: FieldExplanation[]) => {
    setState((s) => ({ ...s, fieldExplanations: list }));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Visualis</h1>
        <p className="text-muted-foreground">AI-powered HTML snippets from your package data</p>
      </header>

      {step === 'params' && (
        <StepParams
          packageId={state.packageId}
          packageDisplayName={state.packageDisplayName}
          onPackageSelect={(id, name) =>
            setState((s) => ({ ...s, packageId: id, packageDisplayName: name }))
          }
          runParamsJson={runParamsJson}
          onRunParamsChange={setRunParamsJson}
          onRun={handleRun}
          running={running}
          error={runError}
        />
      )}

      {step === 'cube-fields' && (
        <StepCubeFields
          cubeNames={cubeNames}
          mainCubeName={state.mainCubeName}
          fieldNames={fieldNames}
          fieldExplanations={state.fieldExplanations}
          onMainCubeChange={(name) =>
            setState((s) => {
              const data = s.runResponse?.results[name] ?? [];
              return { ...s, mainCubeName: name, mainCubeData: data };
            })
          }
          onFieldExplanationsChange={setFieldExplanations}
          onNext={() => setStep('prompt')}
        />
      )}

      {step === 'prompt' && (
        <StepPrompt
          userPrompt={state.userPrompt}
          onPromptChange={(v) => setState((s) => ({ ...s, userPrompt: v }))}
          onGenerate={handleGenerate}
          generating={generating}
          error={genError}
        />
      )}

      {step === 'preview' && preview && (
        <StepPreview
          preview={preview}
          mainCubeData={state.mainCubeData}
          onStartOver={handleStartOver}
          onFeedback={handleFeedback}
          feedbackLoading={feedbackLoading}
        />
      )}
    </div>
  );
};
