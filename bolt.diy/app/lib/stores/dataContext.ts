import { atom } from 'nanostores';
import type { PackageContext } from '~/types/flapi';

export const dataContextStore = atom<PackageContext | null>(null);
export const dataContextLoading = atom<boolean>(false);
export const dataContextError = atom<string | null>(null);

export function setDataContext(context: PackageContext) {
  dataContextStore.set(context);
  dataContextError.set(null);
}

export function clearDataContext() {
  dataContextStore.set(null);
  dataContextError.set(null);
}
