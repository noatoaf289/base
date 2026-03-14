(() => {
  if (window.loadSqlite3) return;

  const moduleUrl = "/libs/sqlite3-wasm.mjs";
  const wasmUrl = "/libs/sqlite3-wasm.wasm";

  window.loadSqlite3 = async (options = {}) => {
    const mod = await import(moduleUrl);
    const init = mod.default;
    const fallbackLocateFile = (file) => {
      if (file.endsWith(".wasm")) return wasmUrl;
      return `/libs/${file}`;
    };

    return init({
      ...options,
      locateFile: (file) => {
        if (typeof options.locateFile === "function") {
          return options.locateFile(file, "/libs/");
        }
        return fallbackLocateFile(file);
      },
    });
  };

  window.loadSqlite3WorkerPromiser = async (...args) => {
    const mod = await import(moduleUrl);
    return mod.sqlite3Worker1Promiser(...args);
  };
})();
