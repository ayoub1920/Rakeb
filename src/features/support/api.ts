import { apiGet, apiPost } from '@/api/request';
import type { RequestOptions } from '@/types/api';

/**
 * Help centre, support tickets, reports and SOS — `API Rakeb.md` §13.
 * Backend: `src/modules/support`.
 */

export type HelpArticle = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
};

export type HelpArticleDetail = {
  slug: string;
  category: string;
  title: string;
  body: string;
  updated_at: string;
};

export function getHelpArticles(options?: RequestOptions): Promise<HelpArticle[]> {
  return apiGet<HelpArticle[]>('/help/articles', undefined, options);
}

export function getHelpArticle(slug: string, options?: RequestOptions): Promise<HelpArticleDetail> {
  return apiGet<HelpArticleDetail>(`/help/articles/${slug}`, undefined, options);
}

export type CreateTicketInput = {
  subject: string;
  category: string;
  message: string;
  email?: string;
  booking_id?: string;
  trip_id?: string;
};

export type TicketResult = {
  id: string;
  reference: string;
  status: string;
  subject: string;
  created_at: string;
};

export function createTicket(
  input: CreateTicketInput,
  options?: RequestOptions,
): Promise<TicketResult> {
  return apiPost<TicketResult>('/support/tickets', input, options);
}

export type ReportTargetType = 'user' | 'trip' | 'booking' | 'message';

export type CreateReportInput = {
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  details?: string;
};

export type ReportResult = {
  id: string;
  status: string;
  target_type: ReportTargetType;
  target_id: string;
  created_at: string;
};

export function createReport(
  input: CreateReportInput,
  options?: RequestOptions,
): Promise<ReportResult> {
  return apiPost<ReportResult>('/reports', input, options);
}
