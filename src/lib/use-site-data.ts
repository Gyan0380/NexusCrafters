import { useQuery } from "@tanstack/react-query";
import {
  fetchActivity,
  fetchAllAssignments,
  fetchAssignmentsForMember,
  fetchContactRequests,
  fetchFaqs,
  fetchPackages,
  fetchPortfolioMedia,
  fetchProjects,
  fetchServices,
  fetchSettings,
  fetchTeamMembers,
} from "@/lib/cms";

export function useServices(includeInactive = false) {
  return useQuery({
    queryKey: ["services", includeInactive],
    queryFn: () => fetchServices(includeInactive),
  });
}

export function usePackages(includeInactive = false) {
  return useQuery({
    queryKey: ["packages", includeInactive],
    queryFn: () => fetchPackages(includeInactive),
  });
}

export function useProjects(includeUnpublished = false) {
  return useQuery({
    queryKey: ["projects", includeUnpublished],
    queryFn: () => fetchProjects(includeUnpublished),
  });
}

export function useFaqs(includeInactive = false) {
  return useQuery({
    queryKey: ["faqs", includeInactive],
    queryFn: () => fetchFaqs(includeInactive),
  });
}

export function useSettings() {
  return useQuery({ queryKey: ["site_settings"], queryFn: fetchSettings });
}

export function usePortfolioMedia(includeUnpublished = false) {
  return useQuery({
    queryKey: ["portfolio_media", includeUnpublished],
    queryFn: () => fetchPortfolioMedia(includeUnpublished),
  });
}

export function useContactRequests(enabled = true) {
  return useQuery({ queryKey: ["contact_requests"], queryFn: fetchContactRequests, enabled });
}

export function useActivity(enabled = true) {
  return useQuery({ queryKey: ["activity_logs"], queryFn: fetchActivity, enabled });
}

export function useTeamMembers(includeHidden = false) {
  return useQuery({
    queryKey: ["team_members", includeHidden],
    queryFn: () => fetchTeamMembers(includeHidden),
  });
}

export function useAllAssignments(enabled = true) {
  return useQuery({ queryKey: ["project_assignments"], queryFn: fetchAllAssignments, enabled });
}

export function useMemberAssignments(memberId: string | null | undefined) {
  return useQuery({
    queryKey: ["project_assignments", "member", memberId],
    queryFn: () => fetchAssignmentsForMember(memberId as string),
    enabled: Boolean(memberId),
  });
}

export function pickText(
  settings: Record<string, Record<string, unknown>> | undefined,
  key: string,
  field: string,
  fallback: string,
) {
  const value = settings?.[key]?.[field];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function pickList<T>(
  settings: Record<string, Record<string, unknown>> | undefined,
  key: string,
  field: string,
  fallback: T[],
): T[] {
  const value = settings?.[key]?.[field];
  return Array.isArray(value) && value.length ? (value as T[]) : fallback;
}
