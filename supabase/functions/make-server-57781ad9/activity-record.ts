import type { SupabaseClient } from "npm:@supabase/supabase-js";

type TaskLike = { id: string; title?: string };

export async function recordTaskCompleted(
  supabase: SupabaseClient,
  userId: string,
  task: TaskLike,
): Promise<void> {
  try {
    const title = String(task.title || "").trim().slice(0, 200);
    const { error } = await supabase.from("user_activity_events").insert({
      user_id: userId,
      event_type: "task_completed",
      intensity: 3,
      metadata: { taskId: task.id, title, source: "web" },
      occurred_at: new Date().toISOString(),
      visibility: "private",
    });
    if (error) console.warn("[activity] task_completed insert failed", error.message);
  } catch (e) {
    console.warn("[activity] task_completed insert threw", String(e));
  }
}
