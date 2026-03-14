import type { FlapiRunResponse } from '@/api/schemas';

export type Step = 'params' | 'cube-fields' | 'prompt' | 'preview';

export interface FieldExplanation {
  fieldName: string;
  explanation: string;
}

export interface PackageRunState {
  packageId: string;
  packageDisplayName: string;
  runParams: Record<string, unknown>;
  runResponse: FlapiRunResponse | null;
  mainCubeName: string;
  mainCubeData: unknown[];
  fieldExplanations: FieldExplanation[];
  userPrompt: string;
}

export interface PreviewState {
  runId: string;
  htmlSnippet: string;
  librariesUsed: string[];
}
