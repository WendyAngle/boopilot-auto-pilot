## 智能体工作台交互模式升级

重构 `src/routes/_app.agents.workspace.tsx`，将当前固定三轮对话扩展为「三种交互模式 + 模式选择」，并使收集到的字段与模版卡片字段对齐。

### 一、交互流程

**步骤 0 — 模式选择**
进入页面后，助手首条消息改为：
> 你好，我是「账号运营助手」，将与你一起创建任务模版。请你先确认下将采取哪种形式与我沟通

用户通过对话气泡下方的三个按钮选择：
- 按程序设定一次性确定所有问题 → 模式 A
- 按程序设定依次确定相关问题 → 模式 B
- 直接描述 → 模式 C

选择后该选项作为用户气泡固化，进入对应流程。

**模式 A — 一次性表单**
助手发送引导语后，下方渲染一张「结构化表单卡片」（聊天流内 inline），一次展示 10 项：业务场景、目标平台（多选 chip）、操作类型（多选 chip）、执行模式（单选）、执行次数（范围/限定，单选+输入）、执行时段（起止时间）、默认话术（textarea）、自定义约束（textarea）、通知偏好（双 checkbox）、模版名称。底部按钮「提交」→ 进入步骤 4 确认。

**模式 B — 多轮表单**
1. Round1：文本输入业务场景。
2. Round2：inline 卡片含 平台多选 + 操作类型多选 + 执行模式单选。
3. Round3：inline 卡片含 次数范围/限定 + 执行时段 + 默认话术。
4. Round4：inline 卡片含 自定义约束 + 通知偏好；右上「跳过」。
5. Round5：模版名称（自动基于场景+平台推荐一个，用户可改）。
→ 步骤 4 确认。

**模式 C — 自由描述**
助手发引导语，用户用 textarea 自由输入完整描述。提交后系统简单解析（复用 `parseUserMessage` + 关键词匹配 actions/时间/通知）填充已识别字段，未识别的全部写入「补充描述」。→ 步骤 4 确认。

**步骤 4 — 汇总确认（三模式通用）**
渲染「模版预览卡」+ 三个按钮：
- 确认创建 → 调用 `templatesActions.add`，跳转 `/tasks/templates`
- 补充信息后创建 → 弹出 textarea，用户补充内容追加到 description 末尾后再创建
- 重新开始 → 重置

### 二、字段与模版卡片对齐

`TaskTemplate` 现有字段：`name / subtype / platforms / total / description / actions / tags / status / agentName`。映射规则：
- 业务场景 → `tags`（或描述开头）+ description
- 目标平台 → `platforms`
- 操作类型 → `actions`
- 执行模式 单次/周期 → `subtype` (`action` / `nurture`)
- 执行次数（范围或限定）→ `total` 取限定值或范围上限；范围、时段、话术、约束、通知偏好均拼入 `description`
- 模版名称 → `name`
- 新建模版默认 `status: "draft"`、`agentName: "账号运营助手"`、`uses: 0`、`monthlyUses: 0`

不在卡片直接展示的字段（时段、话术、约束、通知、次数范围）按「【执行时段】… 【默认话术】… 【约束】… 【通知】…」分段写入 description，保持卡片描述区可读。

### 三、UI 与风格

- 复用现有 `ChatBubble`、右侧「对话进度」「模版预览」面板。
- 进度步骤根据所选模式动态变化：
  - 模式 A：选择模式 → 填写表单 → 确认创建
  - 模式 B：模式 → 场景 → 核心操作 → 执行参数 → 高级配置 → 命名 → 确认
  - 模式 C：模式 → 描述 → 确认
- inline 表单卡片样式与现有 card 一致（`rounded-xl border bg-card`），使用项目已有的 `Checkbox`、`RadioGroup`、`Input`、`Textarea`、`Button`、`Badge`，所有颜色走 design token，不引入新色值。
- 右侧「模版预览」实时反映正在收集的字段（含新增的 操作类型 / 执行模式 / 次数 / 时段 等）。

### 四、需要新增/修改文件

- 修改：`src/routes/_app.agents.workspace.tsx`（主要工作量；拆分子组件 `ModePicker`、`FormCardA`、`FormCardB_Core`、`FormCardB_Params`、`FormCardB_Advanced`、`SummaryCard` 保留在同文件内）
- 复用：`src/lib/operations-store.ts` 中 `TEMPLATE_ACTION_LABEL` / `TEMPLATE_ACTIONS` / `templatesActions.add`，无需修改。

### 五、待确认事项

1. 「补充信息后创建」时，用户补充内容是追加到 description 末尾（带「【补充说明】」前缀），可以吗？
2. 模式 A 一次性表单较长，是否允许在聊天流内纵向滚动展示（高度上限约 520px，内部滚动）？还是希望弹出对话框形式？
3. 模式 C 自由描述解析为弱解析（只抓平台/操作/数字/周期关键字），其余全部落入 description——是否符合预期？

确认以上后我开始实施。