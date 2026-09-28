import { create } from 'zustand';

interface PageCache {
  data: any;
  page: number;
  totalPages: number;
  total: number;
  extra?: any;
}

interface ScrollState {
  scrollPositions: Record<string, number>;
  pageCaches: Record<string, PageCache>;
  setScrollPosition: (path: string, position: number) => void;
  setPageCache: (path: string, cache: PageCache) => void;
  clearPageCache: (path: string) => void;
}

export const useScrollStore = create<ScrollState>((set) => ({
  scrollPositions: {},
  pageCaches: {},
  setScrollPosition: (path, position) =>
    set((state) => ({
      scrollPositions: { ...state.scrollPositions, [path]: position },
    })),
  setPageCache: (path, cache) =>
    set((state) => ({
      pageCaches: { ...state.pageCaches, [path]: cache },
    })),
  clearPageCache: (path) =>
    set((state) => {
      const newScroll = { ...state.scrollPositions };
      const newCaches = { ...state.pageCaches };
      delete newScroll[path];
      delete newCaches[path];
      return { scrollPositions: newScroll, pageCaches: newCaches };
    }),
}));
