import { API_URL, apiFetch } from "@/lib/utils"
import type { GoalPage } from "@/types/goal"

export async function fetchGoalPage(
  token: string,
  cursor: string | null,
): Promise<GoalPage> {
  const params = new URLSearchParams({ limit: "25" })
  if (cursor) params.set("cursor", cursor)
  const response = await apiFetch(`${API_URL}/api/goals/page?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(`Goal request failed with ${response.status}`)
  return response.json()
}

export async function toggleGoalRequest(
  token: string,
  goalId: number,
): Promise<{ new_badges?: string[] }> {
  const response = await apiFetch(`${API_URL}/api/goals/${goalId}/toggle`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(`Goal toggle failed with ${response.status}`)
  return response.json()
}

export async function deleteGoalRequest(token: string, goalId: number): Promise<void> {
  const response = await apiFetch(`${API_URL}/api/goals/${goalId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(`Goal deletion failed with ${response.status}`)
}
