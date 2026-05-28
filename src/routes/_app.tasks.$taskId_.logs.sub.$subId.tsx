import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { TaskLogListPage } from "@/components/task-log-list-page";
import { useTasks } from "@/lib/operations-store";

export const Route = createFileRoute("/_app/tasks/$taskId/logs/sub/$subId")({
  component: SubTaskLogsPage,
  head: () => ({ meta: [{ title: "子任务日志 — BooPilot" }] }),
});

function SubTaskLogsPage() {
  const { taskId, subId } = Route.useParams();
  const tasks = useTasks();
  const task = useMemo(() => tasks.find((t) => t.id === taskId), [tasks, taskId]);
  // subId 形如 "${taskId}-001"，取尾段序号 - 1 作为索引
  const subIndex = useMemo(() => {
    const m = subId.match(/(\d+)\s*$/);
    return m ? Math.max(0, Number(m[1]) - 1) : 0;
  }, [subId]);
  return (
    <TaskLogListPage
      task={task}
      taskId={taskId}
      subIndex={subIndex}
      subTaskLabel={subId}
    />
  );
}
