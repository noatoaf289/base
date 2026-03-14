(() => {
  if (window.loadMonacoEditor) return;

  const monacoModuleUrl = "/libs/wc-monaco-editor/index.js";
  let monacoLoaderPromise = null;

  window.loadMonacoEditor = async () => {
    if (!monacoLoaderPromise) {
      monacoLoaderPromise = import(monacoModuleUrl);
    }
    return monacoLoaderPromise;
  };

  void window.loadMonacoEditor();
})();
