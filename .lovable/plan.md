# 任务状态体系重构 + 终止操作

## 目标

1. 任务列表与子任务列表的"状态"列重命名为"**任务结果**"。"待执行"的数据在该列显示为 `-`。
2. 在"任务结果"之后新增"**执行状态**"列，取值 `已完成 / 待执行 / 手动终止`。
3. 两个列表的筛选条件同步：保留"任务结果"筛选项并新增"执行状态"筛选项。
4. 任务列表与子任务列表：待执行 + 执行中 的数据支持「终止」操作。
5. 子任务列表：操作列新增「终止」；表头新增「批量终止」按钮（默认置灰，选中后可点击；点击后过滤掉已完成的数据，并弹出二次确认告知用户）。

## 字段与状态语义

`TaskRow` / `SubTask` 当前的 `status` 表示运行结果（success/failed/partial/running/pending）。新增一个派生概念 **执行状态 execState**：

```
aborted → "手动终止"
pending | running → "待执行"
其它 (success/failed/partial) → "已完成"
```

任务/子任务被手动终止时：在 `TaskRow` 上新增 `aborted?: boolean` 字段（迁移到 `operations-store.ts`）；子任务由于是前端 mock 派生数据，新增页面级的 `Set<string>` 保存已被终止的子任务 ID，并在派生时把状态映射为 `aborted`。

| 列 | 显示规则 |
|----|---------|
| 任务结果 | `pending → "-"`；`aborted → "-"`（结果未产出）；其它显示原 STATUS_LABEL（执行中/成功/失败/部分成功） |
| 执行状态 | 按 execState 映射 + 配色 Badge |

## 实施步骤

### 1. `src/lib/operations-store.ts`
- `TaskRow` 增加 `aborted?: boolean`
- 导出 `ExecState = "completed" | "pending" | "aborted"`，`EXEC_STATE_LABEL`、`EXEC_STATE_CLS`、`getExecState(t)` 工具
- `executeTask` 在被终止任务上不应推进；在 tick 中检查 `aborted` 标志，若为 true 则停止
- 新增 `abortTask(id)`：将 status 置为当前 status（不动结果）、`aborted=true`，并写 `endTime`

### 2. `src/routes/_app.tasks.list.tsx`（任务列表）
- 表头：删除"状态" → 改为"任务结果"；后面插入"执行状态"列
- 单元格：
  - 任务结果：`pending || aborted → "-"`，否则原 STATUS Badge
  - 执行状态：execState Badge
- 筛选区：
  - 原"状态"下拉改名为"任务结果"，选项去掉 `pending`，按结果维度（执行中/成功/失败/部分成功 + "无结果"）
  - 新增"执行状态"下拉：全部 / 已完成 / 待执行 / 手动终止
- 行操作下拉菜单：
  - 当 execState === "pending" 时显示「终止」并启用（pending+running 都可终止）
  - 终止：调用 `abortTask`，toast 提示
- 编辑按钮：仅未终止的 `pending` 可编辑（保持原意图）

### 3. `src/routes/_app.tasks.$taskId.tsx`（子任务列表）
- `SubStatus` 增加 `"aborted"`；标签/配色补齐
- 页面 state：`const [abortedSubs, setAbortedSubs] = useState<Set<string>>(new Set())`；在 `buildSubTasks` 之后做一次映射，将其中的子任务 status 置为 `aborted`
- 表头：原"任务状态" → "任务结果"；新增"执行状态"列；首列新增 Checkbox（全选 = 当前页所有 pending/running 子任务）
- 行操作列：
  - 「查看日志」保留
  - 新增「终止」（仅 pending/running 可点）
- 筛选区：「状态」改为「任务结果」+ 新增「执行状态」下拉
- 顶部工具条（在筛选条上方新增一行）：
  - 「批量终止」按钮：未选中时 disabled
  - 点击 → 过滤掉已完成（success/failed/partial/aborted）的 id → 弹 `AlertDialog` 二次确认：
    > 已自动过滤 X 条已完成/已终止数据，确认对剩余 Y 条「待执行/执行中」的子任务执行终止吗？
  - 确认后：合并入 `abortedSubs`，清空选择，toast 提示

### 4. UI 细节
- 复用现有 `STATUS_CLS` 配色风格新增 `EXEC_STATE_CLS`：
  - completed → success 色
  - pending → muted/primary 色
  - aborted → destructive 弱化色（`bg-destructive/10 text-destructive border-destructive/30`）
- 二次确认使用项目里现成的 `@/components/ui/alert-dialog`
- Checkbox 使用 `@/components/ui/checkbox`，列宽 36px，与表格其它列对齐

## 验收

- 任务列表"任务结果"列对 pending 显示 `-`；"执行状态"列正确
- 任务列表筛选"执行状态=手动终止"能过滤出已终止任务
- 任务列表对 pending/running 行点「终止」后：execState 显示「手动终止」、任务结果显示 `-`
- 子任务列表勾选混合数据点「批量终止」→ 弹窗显示自动过滤数量；确认后只对待执行/执行中生效
