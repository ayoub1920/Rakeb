import type { InfiniteData } from '@tanstack/react-query';

import { DEFAULT_PAGE_SIZE } from '@/config/constants';
import type { CursorPage, CursorParams } from '@/types/api';

/**
 * Cursor pagination helpers.
 *
 * Every paginated endpoint in `API Rakeb.md` is cursor based (`?cursor=&limit=`),
 * so there is no page-number state anywhere in the app. These three helpers are
 * the entire integration with `useInfiniteQuery`.
 */

/** `initialPageParam` for every infinite query: the first page has no cursor. */
export const INITIAL_CURSOR: string | null = null;

/** `getNextPageParam` for every infinite query. */
export function getNextCursor<T>(page: CursorPage<T>): string | undefined {
  return page.next_cursor ?? undefined;
}

/** Flattens infinite-query pages into the flat list a `FlatList` renders. */
export function flattenPages<T>(data: InfiniteData<CursorPage<T>> | undefined): T[] {
  return data?.pages.flatMap((page) => page.items) ?? [];
}

/** Builds the `?cursor=&limit=` query params, omitting an empty cursor. */
export function toCursorParams(
  cursor: string | null | undefined,
  limit: number = DEFAULT_PAGE_SIZE,
): CursorParams {
  return cursor ? { cursor, limit } : { limit };
}
