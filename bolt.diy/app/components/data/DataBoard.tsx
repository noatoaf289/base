import { memo, useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import {
  dataContextStore,
  dataContextLoading,
  dataContextError,
  setDataContext,
  clearDataContext,
} from '~/lib/stores/dataContext';
import type { PackageContext } from '~/types/flapi';
import { ModelSelector } from '~/components/chat/ModelSelector';
import { APIKeyManager } from '~/components/chat/APIKeyManager';
import type { ProviderInfo } from '~/types/model';
import type { ModelInfo } from '~/lib/modules/llm/types';

interface PackageRow {
  id: string;
  packageId: string;
  packageName: string;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  cubeData?: Record<string, unknown[]>;
  error?: string;
}

interface DataBoardProps {
  onStartBuild: (description: string) => void;
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  providerList?: ProviderInfo[];
  modelList?: ModelInfo[];
  apiKeys?: Record<string, string>;
  onApiKeysChange?: (provider: string, key: string) => void;
  isModelLoading?: string;
}

export const DataBoard = memo(({
  onStartBuild,
  model,
  setModel,
  provider,
  setProvider,
  providerList = [],
  modelList = [],
  apiKeys = {},
  onApiKeysChange,
  isModelLoading,
}: DataBoardProps) => {
  const context = useStore(dataContextStore);
  const loading = useStore(dataContextLoading);
  const error = useStore(dataContextError);

  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [newPackageId, setNewPackageId] = useState('');
  const [systemDescription, setSystemDescription] = useState('');

  const addPackage = useCallback(() => {
    const trimmed = newPackageId.trim();

    if (!trimmed || packages.some((p) => p.packageId === trimmed)) {
      return;
    }

    setPackages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), packageId: trimmed, packageName: '', status: 'idle' },
    ]);
    setNewPackageId('');
  }, [newPackageId, packages]);

  const removePackage = useCallback((id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const loadPackage = useCallback(async (row: PackageRow) => {
    setPackages((prev) => prev.map((p) => (p.id === row.id ? { ...p, status: 'loading', error: undefined } : p)));

    try {
      const res = await fetch(`/api/flapi/run/${encodeURIComponent(row.packageId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error((errBody as any)?.error?.message || `Failed (${res.status})`);
      }

      const data = await res.json();
      const results = (data as any).results || {};

      let packageName = `Package ${row.packageId}`;

      try {
        const searchRes = await fetch(`/api/flapi/search?q=${encodeURIComponent(row.packageId)}`);

        if (searchRes.ok) {
          const searchData = await searchRes.json();

          if (Array.isArray(searchData)) {
            const match = searchData.find((p: any) => String(p.Id) === row.packageId);

            if (match) {
              packageName = match.Name;
            }
          }
        }
      } catch {
        // ignore
      }

      setPackages((prev) =>
        prev.map((p) => (p.id === row.id ? { ...p, status: 'loaded', cubeData: results, packageName } : p)),
      );
    } catch (err) {
      setPackages((prev) =>
        prev.map((p) =>
          p.id === row.id
            ? { ...p, status: 'error', error: err instanceof Error ? err.message : 'Failed' }
            : p,
        ),
      );
    }
  }, []);

  const loadAllPackages = useCallback(async () => {
    const unloaded = packages.filter((p) => p.status !== 'loaded');
    await Promise.all(unloaded.map((p) => loadPackage(p)));
  }, [packages, loadPackage]);

  const handleBuild = useCallback(() => {
    // Merge all loaded packages into context
    const loadedPackages = packages.filter((p) => p.status === 'loaded' && p.cubeData);

    if (loadedPackages.length > 0) {
      const mergedCubeData: Record<string, unknown[]> = {};
      const packageNames: string[] = [];

      loadedPackages.forEach((p) => {
        packageNames.push(p.packageName || `Package ${p.packageId}`);

        if (p.cubeData) {
          Object.entries(p.cubeData).forEach(([cubeName, rows]) => {
            mergedCubeData[cubeName] = rows;
          });
        }
      });

      const ctx: PackageContext = {
        packageId: loadedPackages.map((p) => p.packageId).join(','),
        packageName: packageNames.join(' + '),
        cubeData: mergedCubeData,
      };
      setDataContext(ctx);
    }

    if (systemDescription.trim()) {
      onStartBuild(systemDescription.trim());
    }
  }, [packages, systemDescription, onStartBuild]);

  const loadedCount = packages.filter((p) => p.status === 'loaded').length;
  const totalCubes = packages
    .filter((p) => p.cubeData)
    .reduce((sum, p) => sum + Object.keys(p.cubeData!).length, 0);
  const canBuild = loadedCount > 0 && systemDescription.trim().length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 animate-fade-in">
      {/* Model Configuration */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          <div className="i-ph:gear text-blue-500" />
          Model Configuration
        </label>
        <ClientOnly>
          {() => (
            <div className="space-y-2">
              <ModelSelector
                key={provider?.name + ':' + modelList.length}
                model={model}
                setModel={setModel}
                modelList={modelList}
                provider={provider}
                setProvider={setProvider}
                providerList={providerList}
                apiKeys={apiKeys}
                modelLoading={isModelLoading}
              />
              {provider && onApiKeysChange && (
                <APIKeyManager
                  provider={provider}
                  apiKey={apiKeys[provider.name] || ''}
                  setApiKey={(key) => onApiKeysChange(provider.name, key)}
                />
              )}
            </div>
          )}
        </ClientOnly>
      </div>

      {/* Active context banner */}
      {context && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-sm">
          <div className="i-ph:check-circle text-blue-500" />
          <span className="text-blue-700 dark:text-blue-300">
            Active: <strong>{context.packageName}</strong> &mdash; {Object.keys(context.cubeData).length} cubes,{' '}
            {Object.values(context.cubeData).reduce((s, r) => s + (r as unknown[]).length, 0)} rows
          </span>
          <button onClick={() => clearDataContext()} className="ml-auto text-xs text-red-400 hover:text-red-500 underline">
            Clear
          </button>
        </div>
      )}

      {/* System description */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          <div className="i-ph:note-pencil text-blue-500" />
          System Description
        </label>
        <textarea
          value={systemDescription}
          onChange={(e) => setSystemDescription(e.target.value)}
          placeholder="Describe the application you want to build...&#10;e.g. Sales analytics dashboard with charts, filters, and drill-down"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 resize-none"
          rows={2}
        />
      </div>

      {/* Package table */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          <div className="i-ph:package text-blue-500" />
          Data Packages
        </label>

        {/* Add row */}
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newPackageId}
            onChange={(e) => setNewPackageId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPackage()}
            placeholder="Enter package ID..."
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
          />
          <button
            onClick={addPackage}
            disabled={!newPackageId.trim()}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
          >
            <div className="i-ph:plus-bold text-xs" />
            Add
          </button>
        </div>

        {/* Table */}
        {packages.length > 0 ? (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-2 font-medium">ID</th>
                  <th className="text-left px-4 py-2 font-medium">Name</th>
                  <th className="text-left px-4 py-2 font-medium">Cubes</th>
                  <th className="text-center px-4 py-2 font-medium">Status</th>
                  <th className="text-center px-4 py-2 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-2 font-mono text-blue-600 dark:text-blue-400">{pkg.packageId}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{pkg.packageName || '—'}</td>
                    <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                      {pkg.cubeData ? (
                        <>
                          <strong className="text-gray-700 dark:text-gray-300">
                            {Object.keys(pkg.cubeData).length}
                          </strong>{' '}
                          <span className="text-xs">
                            ({Object.values(pkg.cubeData).reduce((s, r) => s + (r as unknown[]).length, 0)} rows)
                          </span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {pkg.status === 'idle' && (
                        <span className="text-xs text-gray-400 flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
                          Pending
                        </span>
                      )}
                      {pkg.status === 'loading' && (
                        <span className="text-xs text-blue-500 flex items-center justify-center gap-1">
                          <div className="i-ph:spinner-gap-bold animate-spin text-xs" />
                          Loading
                        </span>
                      )}
                      {pkg.status === 'loaded' && (
                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                          Loaded
                        </span>
                      )}
                      {pkg.status === 'error' && (
                        <span className="text-xs text-red-500 flex items-center justify-center gap-1" title={pkg.error}>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                          Error
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        {pkg.status !== 'loaded' && (
                          <button
                            onClick={() => loadPackage(pkg)}
                            disabled={pkg.status === 'loading'}
                            className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-500 disabled:opacity-40"
                            title="Load"
                          >
                            <div className="i-ph:play text-sm" />
                          </button>
                        )}
                        <button
                          onClick={() => removePackage(pkg.id)}
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-400 hover:text-red-500"
                          title="Remove"
                        >
                          <div className="i-ph:trash text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 dark:text-gray-600 text-sm border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
            Add package IDs above to load data
          </div>
        )}

        {/* Cube summary chips */}
        {packages.some((p) => p.cubeData) && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {packages
              .filter((p) => p.cubeData)
              .flatMap((p) =>
                Object.entries(p.cubeData!).map(([cubeName, rows]) => (
                  <span
                    key={`${p.id}-${cubeName}`}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40"
                  >
                    {cubeName}
                    <span className="text-blue-400/60">{(rows as unknown[]).length}r</span>
                  </span>
                )),
              )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <div className="i-ph:warning-circle" />
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {loadedCount > 0 && (
            <>
              {loadedCount} pkg{loadedCount !== 1 ? 's' : ''} &middot; {totalCubes} cube{totalCubes !== 1 ? 's' : ''}
            </>
          )}
        </div>
        <div className="flex gap-2">
          {packages.some((p) => p.status === 'idle' || p.status === 'error') && (
            <button
              onClick={loadAllPackages}
              className="px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-1.5"
            >
              <div className="i-ph:play text-xs" />
              Load All
            </button>
          )}
          <button
            onClick={handleBuild}
            disabled={!canBuild}
            className="px-5 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
          >
            <div className="i-ph:rocket-launch text-sm" />
            Build App
          </button>
        </div>
      </div>
    </div>
  );
});
