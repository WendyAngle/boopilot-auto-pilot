
## 目标

除「标签管理」模块自身外，系统中所有「用到 / 修改 / 设置标签」的位置统一改为下拉框多选 + 支持新增标签，新增标签实时写入全局标签数据，标签管理列表能立即看到。UI 风格与现有 shadcn 体系保持一致（Popover + Badge + Input，使用 design tokens，不引入新色值）。

## 一、共享数据层

`src/lib/systemTags.ts` 从「静态常量」改造为「可订阅的全局 store」（参考 `operations-store.ts` 模式）：

- 保留现有 `SystemTag / TagStatus` 类型与初始数据（作为 seed）。
- 新增内部 `state.tags` + `subscribe(listener)`，导出：
  - `useSystemTags()` — React hook，订阅整表
  - `useUsableTags()` — 仅返回 `status === 'active'` 的标签
  - `tagsActions.add({ name, color?, parentId? })` — 去重后追加；id 用 `tag-${Date.now()}`，默认色从预置色板循环取一个，`status: 'active'`，`order` = 末尾，`createdAt` = now
  - `tagsActions.update / remove / setStatus`（供标签管理页用，替换其本地 `useState`）
- 保留 `SYSTEM_TAGS` 导出（指向当前快照）与 `getUsableTags / findTagByName`（读当前快照），保证旧代码兼容；改造各页面优先用新 hook 以便实时刷新。

「标签管理」页改为读写同一 store（去掉本地 `useState(SYSTEM_TAGS)`），所以从其他页面 `tagsActions.add` 出的新标签立即出现在管理列表中。

## 二、通用组件 `TagMultiSelect`

新建 `src/components/tag-multi-select.tsx`，签名：

```ts
<TagMultiSelect
  value={string[]}            // 选中的标签 name 列表
  onChange={(names) => void}
  placeholder="选择标签"
  allowCreate?: boolean        // 默认 true
  maxTagCount?: number         // 触发器内最多平铺多少个 Badge，超过显示 +N
  disabled?: boolean
/>
```

实现要点：
- `Popover` + 触发器是一个 `border-input` 的「类 Select」按钮：内部把已选标签渲染成可单击 × 移除的 `Badge`（颜色取自标签 `color` token，沿用现有 `TagPillList` 视觉），空时显示 `placeholder`，右侧 `ChevronDown`。
- Popover 内容：顶部 `Input` 搜索框；下方滚动列表，每行 `Checkbox + 圆点色块 + 标签名`，点击切换；底部分割线下一个「+ 新增标签」按钮。
- 「+ 新增标签」点击后切换成内联两列输入：标签名 `Input` + 颜色 `Popover`（从预置 8 色 swatch 中选，默认随机），「取消 / 确认」；确认时调用 `tagsActions.add`，自动选中新标签。
- 搜索词在列表无匹配时，按钮文案变为 `+ 新增「{kw}」`，一键创建。
- 全部样式走 `bg-popover / border-border / text-foreground` 等 token，圆角与现有 `Select` 一致。

## 三、替换位置（除 `_app.tags.list.tsx` 外）

| 位置 | 当前形态 | 替换为 |
|---|---|---|
| `_app.accounts.managed.index.tsx` 账号编辑抽屉「标签」 | chip 列表点击切换 | `TagMultiSelect` |
| `_app.accounts.managed.index.tsx` 批量「修改标签」弹窗 | 单选下拉 | `TagMultiSelect`（多选，覆盖原标签） |
| `_app.materials.posts.tsx` 贴文编辑「标签」 | chip 切换 | `TagMultiSelect` |
| `_app.materials.posts.tsx` 批量「修改标签」弹窗 | 现有自定义多选 | `TagMultiSelect` |
| `_app.tasks.templates.tsx` 模版编辑「标签」 + 批量「修改/设置标签」 | chip 切换 | `TagMultiSelect` |
| `_app.tenants.list.tsx` 「修改标签」弹窗 | 自定义表格选择 | `TagMultiSelect` |
| `components/use-template-dialog.tsx` `postTags` / `reachTags` 两处选择 | 自定义 chip | `TagMultiSelect` |

读取标签来源全部改用 `useUsableTags()`，从而新增标签即时可见。

## 四、不改动

- `src/routes/_app.tags.list.tsx`（标签管理本身）只把数据源切到 store，UI / 交互保持现状。
- `SYSTEM_TAGS` 常量名继续保留（向后兼容），仅语义改为「初始 seed + 当前快照」。
- 不改任何业务字段、不改后端契约（项目无后端，仅前端 mock）。

## 五、技术细节

- store 模式：`let listeners = new Set<() => void>()`；`useSyncExternalStore` 实现 hook，避免 stale closure。
- 颜色预置：`['#16A6A6','#F56C6C','#67C23A','#409EFF','#E6A23C','#9B5CFF','#5470C6','#FF6B9A']`（沿用现有标签里出现过的色值，不引入新调色板）。
- 去重：按 `name` 大小写不敏感比较；命中已有标签时不新增，直接选中。
- 所有新组件文件 < 200 行；不动 design tokens。

## 待确认

1. 批量「修改标签」语义沿用各页现状（账号 = 覆盖，贴文 = 追加，模版 = 覆盖，租户 = 覆盖），不做统一，可吗？
2. 新增标签默认 `parentId = null`（顶级标签），不在弹窗里暴露父标签选择，可吗？
3. 颜色 swatch 用上面 8 色固定预置即可，无需取色器，对吗？

确认后我开始实施。
