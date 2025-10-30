/**
 * Support Module API Client
 *
 * Handles all support and feedback endpoints:
 * - Support ticket creation and management
 * - Feedback submission
 * - Ticket statistics
 */

import apiClient, { type ApiResponse } from './base-client';

// ============================================================================
// Type Definitions
// ============================================================================

export interface SupportTicket {
  id: string;
  user_id: string;
  ticket_number: string;
  category: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  admin_response?: string;
  resolved_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  user_id: string;
  feedback_type: 'bug' | 'feature' | 'improvement' | 'general';
  subject: string;
  message: string;
  page_url?: string;
  browser_info?: any;
  screenshot_url?: string;
  status: 'submitted' | 'reviewed' | 'implemented';
  priority: 'low' | 'normal' | 'high';
  created_at: string;
}

export interface TicketStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  average_resolution_time?: number; // in hours
}

// ============================================================================
// Support Tickets
// ============================================================================

/**
 * Create support ticket
 */
export async function createTicket(params: {
  category: string;
  subject: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}): Promise<SupportTicket> {
  const { data } = await apiClient.post<ApiResponse<{ ticket: SupportTicket }>>(
    '/support/tickets',
    {
      category: params.category,
      subject: params.subject,
      message: params.message,
      priority: params.priority,
    }
  );
  return data.data!.ticket;
}

/**
 * Get user's support tickets
 */
export async function getTickets(params?: {
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  limit?: number;
  offset?: number;
}): Promise<{ tickets: SupportTicket[]; total: number }> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.priority) queryParams.append('priority', params.priority);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const { data } = await apiClient.get<ApiResponse<{
    tickets: SupportTicket[];
    total: number;
  }>>(
    `/support/tickets?${queryParams.toString()}`
  );
  return data.data!;
}

/**
 * Get specific ticket by ID
 */
export async function getTicket(ticketId: string): Promise<SupportTicket> {
  const { data } = await apiClient.get<ApiResponse<{ ticket: SupportTicket }>>(
    `/support/tickets/${ticketId}`
  );
  return data.data!.ticket;
}

/**
 * Update ticket (add message, change status)
 */
export async function updateTicket(
  ticketId: string,
  params: {
    status?: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    message?: string;
  }
): Promise<SupportTicket> {
  const { data } = await apiClient.put<ApiResponse<{ ticket: SupportTicket }>>(
    `/support/tickets/${ticketId}`,
    params
  );
  return data.data!.ticket;
}

/**
 * Get ticket statistics
 */
export async function getTicketStats(): Promise<TicketStats> {
  const { data } = await apiClient.get<ApiResponse<TicketStats>>(
    '/support/tickets-stats'
  );
  return data.data!;
}

// ============================================================================
// Feedback
// ============================================================================

/**
 * Submit feedback
 */
export async function submitFeedback(params: {
  feedback_type: 'bug' | 'feature' | 'improvement' | 'general';
  subject: string;
  message: string;
  page_url?: string;
  browser_info?: any;
  screenshot_url?: string;
}): Promise<Feedback> {
  const { data } = await apiClient.post<ApiResponse<{ feedback: Feedback }>>(
    '/support/feedback',
    {
      feedbackType: params.feedback_type,
      subject: params.subject,
      message: params.message,
      pageUrl: params.page_url,
      browserInfo: params.browser_info,
      screenshotUrl: params.screenshot_url,
    }
  );
  return data.data!.feedback;
}

/**
 * Get user's feedback submissions
 */
export async function getFeedback(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ feedback: Feedback[]; total: number }> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const { data } = await apiClient.get<ApiResponse<{
    feedback: Feedback[];
    total: number;
  }>>(
    `/support/feedback?${queryParams.toString()}`
  );
  return data.data!;
}

/**
 * Get specific feedback by ID
 */
export async function getFeedbackById(feedbackId: string): Promise<Feedback> {
  const { data } = await apiClient.get<ApiResponse<{ feedback: Feedback }>>(
    `/support/feedback/${feedbackId}`
  );
  return data.data!.feedback;
}

// ============================================================================
// Export All
// ============================================================================

export default {
  // Support Tickets
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  getTicketStats,

  // Feedback
  submitFeedback,
  getFeedback,
  getFeedbackById,
};
