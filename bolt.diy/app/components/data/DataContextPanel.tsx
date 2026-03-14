import * as RadixDialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { IconButton } from '~/components/ui/IconButton';
import { Button } from '~/components/ui/Button';
import { dataContextStore, dataContextLoading, dataContextError, setDataContext, clearDataContext } from '~/lib/stores/dataContext';
import type { PackageDescriptor, PackageContext } from '~/types/flapi';

const transition = { duration: 0.15, ease: cubicEasingFn };

const backdropVariants = {
  closed: { opacity: 0, transition },
  open: { opacity: 1, transition },
};

const panelVariants = {
  closed: { x: '-50%', y: '-40%', scale: 0.96, opacity: 0, transition },
  open: { x: '-50%', y: '-50%', scale: 1, opacity: 1, transition },
};

interface DataContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataContextPanel = memo(({ isOpen, onClose }: DataContextPanelProps) => {
  const context = useStore(dataContextStore);
  const loading = useStore(dataContextLoading);
  const error = useStore(dataContextError);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PackageDescriptor[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageDescriptor | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedPackage(null);
    }
  }, [isOpen]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);

      try {
        const res = await fetch(`/api/flapi/search?q=${encodeURIComponent(query)}`);

        if (!res.ok) {
          throw new Error('Search failed');
        }

        const data: PackageDescriptor[] = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error('Package search error:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const handleLoadData = useCallback(async () => {
    if (!selectedPackage) {
      return;
    }

    dataContextLoading.set(true);
    dataContextError.set(null);

    try {
      const res = await fetch(`/api/flapi/run/${encodeURIComponent(String(selectedPackage.Id))}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error((errBody as any)?.error?.message || `Failed to run package (${res.status})`);
      }

      const data = await res.json();
      const packageContext: PackageContext = {
        packageId: String(selectedPackage.Id),
        packageName: selectedPackage.Name,
        cubeData: (data as any).results || {},
      };

      setDataContext(packageContext);
      onClose();
    } catch (err) {
      dataContextError.set(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      dataContextLoading.set(false);
    }
  }, [selectedPackage, onClose]);

  return (
    <RadixDialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay asChild>
          <motion.div
            className="fixed inset-0 z-[9999] bg-black/70 dark:bg-black/80 backdrop-blur-sm"
            initial="closed"
            animate="open"
            exit="closed"
            variants={backdropVariants}
          />
        </RadixDialog.Overlay>
        <RadixDialog.Content asChild>
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-950 rounded-lg shadow-xl border border-bolt-elements-borderColor z-[9999] w-[560px] max-h-[80vh] focus:outline-none"
            initial="closed"
            animate="open"
            exit="closed"
            variants={panelVariants}
          >
            <div className="flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-bolt-elements-borderColor">
                <RadixDialog.Title className="text-lg font-medium text-bolt-elements-textPrimary flex items-center gap-2">
                  <div className="i-ph:database text-xl" />
                  Load Data Package
                </RadixDialog.Title>
                <RadixDialog.Close asChild>
                  <IconButton icon="i-ph:x" className="text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary" />
                </RadixDialog.Close>
              </div>

              {/* Content */}
              <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 140px)' }}>
                {/* Current data context indicator */}
                {context && (
                  <div className="mb-4 p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="i-ph:check-circle text-green-600 dark:text-green-400" />
                        <span className="text-sm text-green-700 dark:text-green-300">
                          Loaded: <strong>{context.packageName}</strong> ({Object.keys(context.cubeData).length} cubes)
                        </span>
                      </div>
                      <button
                        onClick={() => clearDataContext()}
                        className="text-xs text-red-500 hover:text-red-600 underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Search input */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 i-ph:magnifying-glass text-bolt-elements-textTertiary" />
                  <input
                    type="text"
                    placeholder="Search packages..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-md border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary text-sm placeholder:text-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 i-ph:spinner-gap-bold animate-spin text-bolt-elements-textTertiary" />
                  )}
                </div>

                {/* Search results */}
                {searchResults.length > 0 && (
                  <div className="mt-3 border border-bolt-elements-borderColor rounded-md overflow-hidden">
                    {searchResults.map((pkg) => (
                      <button
                        key={pkg.Id}
                        onClick={() => setSelectedPackage(pkg)}
                        className={classNames(
                          'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b last:border-b-0 border-bolt-elements-borderColor',
                          selectedPackage?.Id === pkg.Id
                            ? 'bg-purple-50 dark:bg-purple-900/20'
                            : 'hover:bg-bolt-elements-background-depth-2',
                        )}
                      >
                        {pkg.Logo && (
                          <img src={`data:image/png;base64,${pkg.Logo}`} alt="" className="w-8 h-8 rounded" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-bolt-elements-textPrimary">{pkg.Name}</div>
                          <div className="text-xs text-bolt-elements-textTertiary">ID: {pkg.Id}</div>
                        </div>
                        {selectedPackage?.Id === pkg.Id && (
                          <div className="ml-auto i-ph:check-circle-fill text-purple-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                  <div className="mt-3 text-center text-sm text-bolt-elements-textTertiary py-4">
                    No packages found
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="mt-3 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2">
                      <div className="i-ph:warning-circle text-red-500" />
                      <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                    </div>
                  </div>
                )}

                {/* Data summary when loaded after selecting */}
                {context && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-bolt-elements-textPrimary mb-2">Data Summary</h3>
                    <div className="space-y-2">
                      {Object.entries(context.cubeData).map(([cubeName, rows]) => (
                        <div
                          key={cubeName}
                          className="p-3 rounded-md bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-bolt-elements-textPrimary">{cubeName}</span>
                            <span className="text-xs text-bolt-elements-textTertiary">
                              {(rows as unknown[]).length} rows
                            </span>
                          </div>
                          {(rows as unknown[]).length > 0 && (
                            <div className="mt-1 text-xs text-bolt-elements-textSecondary">
                              Fields: {Object.keys((rows as Record<string, unknown>[])[0] || {}).join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-bolt-elements-borderColor">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-bolt-elements-borderColor text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLoadData}
                  disabled={!selectedPackage || loading}
                  className="bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <div className="i-ph:spinner-gap-bold animate-spin w-4 h-4 mr-2" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <div className="i-ph:download-simple w-4 h-4 mr-2" />
                      Load Data
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
});
