import { useMutation, useQuery } from '@tanstack/react-query';

import { STALE_TIME } from '@/api/query-client';
import { useIsAuthenticated } from '@/auth/use-auth';
import type { ApiError } from '@/types/api';

import {
  createReport,
  createTicket,
  getHelpArticle,
  getHelpArticles,
  type CreateReportInput,
  type CreateTicketInput,
  type HelpArticle,
  type HelpArticleDetail,
  type ReportResult,
  type TicketResult,
} from './api';
import { supportKeys } from './keys';

export type { ReportTargetType } from './api';

/** `GET /help/articles`. */
export function useHelpArticles() {
  const isAuthenticated = useIsAuthenticated();

  return useQuery<HelpArticle[], ApiError>({
    queryKey: supportKeys.articles(),
    queryFn: ({ signal }) => getHelpArticles({ signal }),
    enabled: isAuthenticated,
    staleTime: STALE_TIME.static,
  });
}

/** `GET /help/articles/{slug}`. */
export function useHelpArticle(slug: string) {
  const isAuthenticated = useIsAuthenticated();

  return useQuery<HelpArticleDetail, ApiError>({
    queryKey: supportKeys.article(slug),
    queryFn: ({ signal }) => getHelpArticle(slug, { signal }),
    enabled: isAuthenticated && slug.length > 0,
    staleTime: STALE_TIME.static,
  });
}

/** `POST /support/tickets`. */
export function useCreateTicket() {
  return useMutation<TicketResult, ApiError, CreateTicketInput>({
    mutationFn: (input) => createTicket(input),
  });
}

/** `POST /reports`. */
export function useCreateReport() {
  return useMutation<ReportResult, ApiError, CreateReportInput>({
    mutationFn: (input) => createReport(input),
  });
}
