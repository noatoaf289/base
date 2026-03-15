import { type FC, useRef, useCallback, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { PreviewState } from '@/types/flow';
import type { Config } from '@/api/schemas';

/** Fallback when config not yet loaded; should match server default (server-spec §6). */
const DEFAULT_IFRAME_DATA_EVENT = 'VISUALIS_IFRAME_DATA';

export interface StepPreviewProps {
  preview: PreviewState;
  mainCubeData: unknown[];
  config: Config | null;
  onStartOver: () => void;
  onFeedback: (feedback: string) => void;
  feedbackLoading: boolean;
}

export const StepPreview: FC<StepPreviewProps> = ({
  preview,
  mainCubeData,
  config,
  onStartOver,
  onFeedback,
  feedbackLoading,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const iframeDataEvent = config?.iframeDataEvent ?? DEFAULT_IFRAME_DATA_EVENT;
  const publishUrl = config?.baseUrl
    ? `${config.baseUrl.replace(/\/$/, '')}/api/snippets/${preview.runId}.html`
    : '';

  const copyCode = useCallback(() => {
    void navigator.clipboard.writeText(preview.htmlSnippet);
  }, [preview.htmlSnippet]);

  const copyPublishLink = useCallback(() => {
    if (publishUrl) void navigator.clipboard.writeText(publishUrl);
  }, [publishUrl]);

  const handleFeedbackSubmit = useCallback(() => {
    if (!feedbackText.trim()) return;
    onFeedback(feedbackText.trim());
    setFeedbackText('');
  }, [feedbackText, onFeedback]);

  const injectDataIntoIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      { type: iframeDataEvent, payload: mainCubeData },
      '*'
    );
  }, [mainCubeData, iframeDataEvent]);

  useEffect(() => {
    injectDataIntoIframe();
  }, [injectDataIntoIframe, preview.htmlSnippet]);

  const iframeSrc = `data:text/html;charset=utf-8,${encodeURIComponent(preview.htmlSnippet)}`;

  return (
    <Card className="w-full max-w-5xl">
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onStartOver}>
            Start over
          </Button>
          <Button variant="outline" onClick={copyCode}>
            Copy code
          </Button>
          {publishUrl && (
            <>
              <Button variant="default" onClick={copyPublishLink}>
                Copy publish link
              </Button>
              <Button
                variant="outline"
                asChild
              >
                <a href={publishUrl} target="_blank" rel="noopener noreferrer">
                  Open published page
                </a>
              </Button>
            </>
          )}
        </div>
        {publishUrl && (
          <p className="text-sm text-muted-foreground">
            Publish link (share or embed in iframe):{' '}
            <code className="rounded bg-muted px-1 py-0.5 break-all">{publishUrl}</code>
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="rounded-md border border-border overflow-hidden bg-muted min-h-[300px]">
              <iframe
                ref={iframeRef}
                title="Generated snippet"
                src={iframeSrc}
                className="w-full h-[400px] border-0"
                sandbox="allow-scripts"
                onLoad={injectDataIntoIframe}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Code</Label>
            <div className="rounded-md border border-border overflow-hidden min-h-[400px]">
              <Editor
                height="400px"
                defaultLanguage="html"
                value={preview.htmlSnippet}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  readOnly: true,
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="feedback">Feedback (continuation prompt)</Label>
          <div className="flex gap-2">
            <textarea
              id="feedback"
              className="flex min-h-[80px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="e.g. Make the bars blue and add a title"
            />
            <Button onClick={handleFeedbackSubmit} disabled={!feedbackText.trim() || feedbackLoading}>
              {feedbackLoading ? 'Sending…' : 'Send feedback'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
