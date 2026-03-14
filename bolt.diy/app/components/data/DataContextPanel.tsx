import { memo, useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { classNames } from '~/utils/classNames';
import {
  dataContextStore,
  dataContextLoading,
  dataContextError,
  setDataContext,
  clearDataContext,
} from '~/lib/stores/dataContext';
import type { PackageContext } from '~/types/flapi';

interface PackageRow {
  id: string;
  packageId: string;
  packageName: string;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  cubeData?: Record<string, unknown[]>;
  error?: string;
}

interface DataContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBuild?: (description: string) => void;
}

export const DataContextPanel = memo(({ isOpen, onClose, onStartBuild }: DataContextPanelProps) => {
  const context = useStore(dataContextStore);
  const loading = useStore(dataContextLoading);
  const error = useStore(dataContextError);

  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [newPackageId, setNewPackageId] = useState('');
  const [systemDescription, setSystemDescription] = useState('');

  const addPackage = useCallback(() => {
    const trimmed = newPackageId.trim();

    if (!trimmed) {
      return;
    }

    if (packages.some((p) => p.packageId === trimmed)) {
      return;
    }

    setPackages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        packageId: trimmed,
        packageName: '',
        status: 'idle',
      },
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

      // Try to get package name from search
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
        // ignore search errors
      }

      setPackages((prev) =>
        prev.map((p) =>
          p.id === row.id ? { ...p, status: 'loaded', cubeData: results, packageName } : p,
        ),
      );
    } catch (err) {
      setPackages((prev) =>
        prev.map((p) =>
          p.id === row.id
            ? { ...p, status: 'error', error: err instanceof Error ? err.message : 'Failed to load' }
            : p,
        ),
      );
    }
  }, []);

  const loadAllPackages = useCallback(async () => {
    const unloaded = packages.filter((p) => p.status !== 'loaded');
    await Promise.all(unloaded.map((p) => loadPackage(p)));
  }, [packages, loadPackage]);

  const applyDataContext = useCallback(() => {
    const loadedPackages = packages.filter((p) => p.status === 'loaded' && p.cubeData);

    if (loadedPackages.length === 0) {
      return;
    }

    // Merge all cube data from all packages
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
  }, [packages]);

  const handleStartBuild = useCallback(() => {
    applyDataContext();

    if (onStartBuild && systemDescription.trim()) {
      onStartBuild(systemDescription.trim());
    }

    onClose();
  }, [applyDataContext, onStartBuild, systemDescription, onClose]);

  const loadedCount = packages.filter((p) => p.status === 'loaded').length;
  const totalCubes = packages
    .filter((p) => p.cubeData)
    .reduce((sum, p) => sum + Object.keys(p.cubeData!).length, 0);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white dark:bg-gray-950 rounded-xl shadow-2xl border border-blue-200 dark:border-blue-800/50 w-[720px] max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <div className="i-ph:cube text-xl" />
              Data Configuration
            </h2>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <div className="i-ph:x text-xl" />
            </button>
          </div>
          {context && (
            <div className="mt-2 flex items-center gap-2 text-blue-100 text-sm">
              <div className="i-ph:check-circle" />
              Active: <strong>{context.packageName}</strong> ({Object.keys(context.cubeData).length}{' '}
              cubes)
              <button
                onClick={() => clearDataContext()}
                className="ml-2 text-xs underline text-blue-200 hover:text-white"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 160px)' }}>
          {/* System Description */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <div className="i-ph:note-pencil text-blue-500" />
                System Description
              </div>
            </label>
            <textarea
              value={systemDescription}
              onChange={(e) => setSystemDescription(e.target.value)}
              placeholder="Describe the application you want to build... e.g., 'Sales analytics dashboard with charts, filters, and drill-down capabilities'"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 resize-none"
              rows={3}
            />
          </div>

          {/* Packages Table */}
          <div className="px-6 py-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <div className="flex items-center gap-2">
                <div className="i-ph:package text-blue-500" />
                Data Packages
              </div>
            </label>

            {/* Add package row */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newPackageId}
                onChange={(e) => setNewPackageId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addPackage();
                  }
                }}
                placeholder="Enter package ID..."
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
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

            {/* Packages table */}
            {packages.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
                      <th className="text-left px-4 py-2.5 font-medium">Package ID</th>
                      <th className="text-left px-4 py-2.5 font-medium">Name</th>
                      <th className="text-left px-4 py-2.5 font-medium">Cubes</th>
                      <th className="text-center px-4 py-2.5 font-medium">Status</th>
                      <th className="text-center px-4 py-2.5 font-medium w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.map((pkg) => (
                      <tr
                        key={pkg.id}
                        className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/50"
                      >
                        <td className="px-4 py-2.5 font-mono text-blue-600 dark:text-blue-400">
                          {pkg.packageId}
                        </td>
                        <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                          {pkg.packageName || '-'}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                          {pkg.cubeData ? (
                            <span className="flex items-center gap-1">
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {Object.keys(pkg.cubeData).length}
                              </span>
                              <span className="text-xs">
                                ({Object.values(pkg.cubeData).reduce(
                                  (s, r) => s + (r as unknown[]).length,
                                  0,
                                )}{' '}
                                rows)
                              </span>
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {pkg.status === 'idle' && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                              <div className="w-2 h-2 rounded-full bg-gray-300" />
                              Pending
                            </span>
                          )}
                          {pkg.status === 'loading' && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-500">
                              <div className="i-ph:spinner-gap-bold animate-spin text-sm" />
                              Loading
                            </span>
                          )}
                          {pkg.status === 'loaded' && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              Loaded
                            </span>
                          )}
                          {pkg.status === 'error' && (
                            <span
                              className="inline-flex items-center gap-1 text-xs text-red-500"
                              title={pkg.error}
                            >
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                              Error
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {pkg.status !== 'loaded' && (
                              <button
                                onClick={() => loadPackage(pkg)}
                                disabled={pkg.status === 'loading'}
                                className="p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-500 transition-colors disabled:opacity-40"
                                title="Load package"
                              >
                                <div className="i-ph:play text-sm" />
                              </button>
                            )}
                            <button
                              onClick={() => removePackage(pkg.id)}
                              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-red-400 hover:text-red-500 transition-colors"
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
            )}

            {packages.length === 0 && (
              <div className="text-center py-8 text-gray-400 dark:text-gray-600 text-sm border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                <div className="i-ph:package text-3xl mx-auto mb-2 opacity-40" />
                Add package IDs above to load data
              </div>
            )}

            {/* Cube details for loaded packages */}
            {packages.some((p) => p.status === 'loaded' && p.cubeData) && (
              <div className="mt-4">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Loaded Cubes
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {packages
                    .filter((p) => p.cubeData)
                    .flatMap((p) =>
                      Object.entries(p.cubeData!).map(([cubeName, rows]) => (
                        <div
                          key={`${p.id}-${cubeName}`}
                          className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50"
                        >
                          <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            {cubeName}
                          </div>
                          <div className="text-xs text-blue-500/70 dark:text-blue-400/60 mt-0.5">
                            {(rows as unknown[]).length} rows &middot;{' '}
                            {Object.keys((rows as Record<string, unknown>[])[0] || {}).join(', ')}
                          </div>
                        </div>
                      )),
                    )}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <div className="i-ph:warning-circle" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="text-xs text-gray-400">
            {loadedCount > 0 && (
              <span>
                {loadedCount} package{loadedCount !== 1 ? 's' : ''} loaded &middot; {totalCubes} cube
                {totalCubes !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {packages.some((p) => p.status === 'idle' || p.status === 'error') && (
              <button
                onClick={loadAllPackages}
                className="px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-1.5"
              >
                <div className="i-ph:play text-xs" />
                Load All
              </button>
            )}
            <button
              onClick={handleStartBuild}
              disabled={loadedCount === 0}
              className="px-5 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
            >
              <div className="i-ph:rocket-launch text-sm" />
              {systemDescription.trim() ? 'Build App' : 'Apply Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
