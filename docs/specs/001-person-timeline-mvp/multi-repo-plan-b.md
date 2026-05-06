# 方案 B：统一图 + 仓库元数据 — 详细设计

## 背景

当前 `@tomplum/react-git-log` 硬编码了"单仓库"假设（19 处），核心体现在：
- `currentBranch` / `headCommit` 是单值
- index 伪提交只有一个，硬编码在 column 0
- `GraphContextBag` 丢失了泛型 `T`

方案 B 的目标是：**最小改动**，让多个仓库的 commits 合并到一个 `entries` 数组后，图能正确识别多个 HEAD 并为每个 HEAD 渲染 index 伪提交，同时用户可通过泛型 `T` 附带仓库元数据，在回调和自定义渲染中区分 repo。

---

## 设计原则

1. **向后兼容** — 现有 `currentBranch: string` 用法完全不变
2. **渐进增强** — 多 repo 能力通过新增可选字段实现
3. **最小改动** — 不改图布局算法（`GraphDataBuilder`/`ActiveBranches`/`ActiveNodes`），只扩展数据输入和渲染

---

## 一、API 设计

### 1.1 类型层改造

**文件**: [packages/library/src/types.ts](packages/library/src/types.ts)

```typescript
// 新增：仓库配置
export interface RepoConfig {
  /** 仓库标识，用于在 Tags/Table 中区分 */
  name: string
  /** 该仓库的当前分支名（与 GitLogEntry.branch 做 includes 匹配） */
  currentBranch: string
}

// GitLogProps 改造（向后兼容）
export interface GitLogProps<T = unknown> extends GitLogCommonProps<T> {
  /**
   * 当前检出的分支名（单仓库模式）。
   * 与 repos 互斥，二选一。
   */
  currentBranch?: string

  /**
   * 多仓库配置。传入后启用多仓库模式。
   * 每个 RepoConfig 对应一个仓库的当前分支。
   */
  repos?: RepoConfig[]
}

// GitLogPagedProps 同理
export interface GitLogPagedProps<T> extends GitLogCommonProps<T> {
  branchName?: string
  headCommitHash?: string
  repos?: RepoConfig[]
}
```

### 1.2 消费端用法示例

```tsx
// 单仓库（向后兼容，完全不变）
<GitLog entries={entries} currentBranch="main">
  <GitLog.GraphHTMLGrid />
  <GitLog.Table />
</GitLog>

// 多仓库（新用法）
<GitLog
  entries={allEntries}
  repos={[
    { name: 'repo-A', currentBranch: 'main' },
    { name: 'repo-B', currentBranch: 'develop' },
  ]}
  showGitIndex  // 每个 repo 的 HEAD 上方都会显示 index 伪提交
>
  <GitLog.GraphHTMLGrid />
  <GitLog.Table />
</GitLog>
```

---

## 二、数据管道改造

### 2.1 GitLogCore — headCommit 查找

**文件**: [packages/library/src/components/GitLogCore/GitLogCore.tsx](packages/library/src/components/GitLogCore/GitLogCore.tsx)

**当前逻辑** (line 95-105): 单次 `find()`，返回一个 `headCommit`

**改造后**:

```typescript
// 规范化 repos 配置（向后兼容单仓库用法）
const repoConfigs = useMemo<RepoConfig[]>(() => {
  if (repos && repos.length > 0) {
    return repos
  }
  if (currentBranch) {
    return [{ name: 'default', currentBranch }]
  }
  return []
}, [currentBranch, repos])

// 查找所有 HEAD commits（每个 repo 一个）
const headCommits = useMemo<Map<string, Commit<T>>>(() => {
  const map = new Map<string, Commit<T>>()
  for (const repo of repoConfigs) {
    const headCommit = isServerSidePaginated
      ? allCommits.find(({ hash }) => hash === repo.headCommitHash)
      : allCommits.find(({ branch }) => branch.includes(repo.currentBranch))
    if (headCommit) {
      map.set(repo.name, headCommit)
    }
  }
  return map
}, [allCommits, repoConfigs, isServerSidePaginated])
```

### 2.2 GitLogCore — indexCommit 生成

**当前逻辑** (line 107-124): 生成一个 `indexCommit`

**改造后**: 为每个 HEAD 生成一个 index 伪提交

```typescript
const indexCommits = useMemo<Commit[]>(() => {
  return [...headCommits.values()].map(headCommit => ({
    hash: `index-${headCommit.hash}`,  // 每个 index 有唯一 hash
    branch: headCommit.branch,
    parents: [headCommit.hash],
    children: [],
    authorDate: dayjs.utc().toISOString(),
    message: '// WIP',
    committerDate: dayjs.utc().toISOString(),
    isBranchTip: false
  } as Commit))
}, [headCommits])
```

### 2.3 GraphDataBuilder — _headCommit 改造

**文件**: [packages/library/src/data/GraphDataBuilder.ts](packages/library/src/data/GraphDataBuilder.ts)

**当前逻辑** (line 49-51): 单个 `_headCommit`

**改造后**:

```typescript
private readonly _headCommits: Map<string, Commit<T>>  // repoName → headCommit

constructor(props: GraphDataBuilderProps<T>) {
  // ...
  this._headCommits = new Map()
  for (const repo of props.repoConfigs) {
    const head = props.commits.find(c => c.branch.includes(repo.currentBranch))
    if (head) {
      this._headCommits.set(repo.name, head)
    }
  }
}
```

**build() 方法中的 head commit 特殊处理** (line 225-227):

```typescript
// 改造前：只有单个 HEAD 走 'index' 替换
if (hash === this._headCommit?.hash) {
  commitToReplaceHash = 'index'
  commitToReplaceColumn = 0
}

// 改造后：任一个 HEAD 都走替换逻辑
const headEntry = [...this._headCommits.entries()]
  .find(([, h]) => h.hash === hash)
if (headEntry) {
  const [repoName] = headEntry
  commitToReplaceHash = `index-${hash}`
  // column 不再强制为 0，用 findCommitToReplace 自然计算
}
```

### 2.4 ActiveBranches — 初始化调整

**当前** (line 7): `private branches: (string | null)[] = ['index']`

**改造**: 初始化为空数组。不再预设 column 0 为 `'index'`。

```typescript
private branches: (string | null)[] = []
```

`'index-xxx'` 的列位置现在由 `findCommitToReplace` 自然决定（它会替换 HEAD 所在的列），而非硬编码为 0。

**向后兼容风险**：单仓库模式下，列表会自动增长，被自然分配 column 值。列号仅影响同列纵向排列的可视化效果，不影响图渲染的正确性。需要验证单仓库 snapshot 测试。

### 2.5 ActiveNodes — 初始化调整

**当前** (line 8): `this.activeNodes.set('index', new Set<number>())`

**改造**: 延迟到 `build()` 中初始化，为每个 HEAD 注册 index 节点：

```typescript
// build() 开始处
for (const headCommit of this._headCommits.values()) {
  this._activeNodes.enqueue([
    this._hashToIndex.get(headCommit.hash)!,
    `index-${headCommit.hash}`
  ])
}
```

---

## 三、Context 层改造

### 3.1 GitContextBag 字段变更

**文件**: [packages/library/src/context/GitContext/types.ts](packages/library/src/context/GitContext/types.ts)

```typescript
export interface GitContextBag<T = unknown> {
  // 改造：单值 → 可能多个
  headCommit?: Commit<T>                          // 保留（向后兼容，取第一个）
  headCommits: Map<string, Commit<T>>             // 新增：repoName → headCommit

  indexCommit?: Commit                            // 保留（向后兼容，取第一个）
  indexCommits: Commit[]                          // 新增：所有 index 伪提交

  currentBranch: string                           // 保留
  repoConfigs: RepoConfig[]                       // 新增

  // ... 其余字段不变
}
```

### 3.2 GraphContextBag — 添加泛型

**文件**: [packages/library/src/modules/Graph/context/types.ts](packages/library/src/modules/Graph/context/types.ts)

```typescript
// 改造前
export interface GraphContextBag {
  visibleCommits: Commit<unknown>[]
  node?: CustomCommitNode<unknown>
  // ...
}

// 改造后
export interface GraphContextBag<T = unknown> {
  visibleCommits: Commit<T>[]
  node?: CustomCommitNode<T>
  // ... 其余不变
}
```

**关联改动**：
- `GraphContext.ts`: `createContext<GraphContextBag>` → `createContext<GraphContextBag<unknown>>`
- `useGraphContext.ts`: 返回类型添加泛型支持

---

## 四、渲染层改造

### 4.1 IndexPseudoRow — 支持多 index 节点

**文件**: [packages/library/src/modules/Graph/strategies/Grid/components/IndexPseudoRow/IndexPseudoRow.tsx](packages/library/src/modules/Graph/strategies/Grid/components/IndexPseudoRow/IndexPseudoRow.tsx)

**改造**: 不再硬编码 column 0，而是根据各个 HEAD commit 的 position 来放置 index 节点：

```typescript
export const IndexPseudoRow = () => {
  const { indexCommits, headCommits, graphData } = useGitContext()
  const { graphWidth } = useGraphContext()

  const indexColumns = useMemo(() => {
    const columns = new Array<GraphColumnState>(graphWidth).fill({})

    for (const [, headCommit] of headCommits) {
      const pos = graphData.positions.get(headCommit.hash)
      if (pos) {
        const columnIndex = pos[1]  // 使用 HEAD 所在的实际列
        columns[columnIndex] = {
          isNode: true,
          isVerticalLine: true,
          isBottomBreakPoint: !isHeadCommitVisible
        }
      }
    }
    return columns
  }, [graphWidth, headCommits, graphData.positions])
  // ...
}
```

### 4.2 GraphMatrixBuilder.drawIndexPseudoCommitEdge

**文件**: [packages/library/src/modules/Graph/strategies/Grid/GraphMatrixBuilder/GraphMatrixBuilder.ts](packages/library/src/modules/Graph/strategies/Grid/GraphMatrixBuilder/GraphMatrixBuilder.ts)

**改造**: 为每个 HEAD 所在的列画虚线，而非硬编码 column 0：

```typescript
public drawIndexPseudoCommitEdge() {
  for (const [, headCommit] of this._headCommits) {
    if (this._positions.has(headCommit.hash)) {
      const headRowIndex = this._positions.get(headCommit.hash)![0]
      const headColumnIndex = this._positions.get(headCommit.hash)![1]  // 实际的列
      for (let rowIndex = 0; rowIndex <= headRowIndex; rowIndex++) {
        const columnState = this._matrix.getColumns(rowIndex)
        columnState.update(headColumnIndex, {
          isVerticalLine: true,
          isVerticalIndexLine: true
        })
      }
    }
  }
}
```

### 4.3 Table — 多 index 伪提交

**文件**: [packages/library/src/modules/Table/Table.tsx](packages/library/src/modules/Table/Table.tsx)

当前 Table 在 `tableData` 头部 `unshift(indexCommit)`（只有一个）。改造后需要 `unshift(...indexCommits)`。

### 4.4 Tags — 多 index 伪提交

**文件**: [packages/library/src/modules/Tags/Tags.tsx](packages/library/src/modules/Tags/Tags.tsx)

同理，Tags 需要 prepend 所有 index 伪提交。每个 index 伪提交对应一行空占位或 IndexLabel。

---

## 五、泛型 T 链路的修复

### 5.1 CustomTableRow 泛型化

**文件**: [packages/library/src/modules/Table/types.ts](packages/library/src/modules/Table/types.ts)

```typescript
// 改造前
export type CustomTableRow = (props: CustomTableRowProps) => ReactElement<HTMLElement>
export interface CustomTableRowProps {
  commit: Commit        // 丢失了 T
}

// 改造后
export type CustomTableRow<T = unknown> = (props: CustomTableRowProps<T>) => ReactElement<HTMLElement>
export interface CustomTableRowProps<T = unknown> {
  commit: Commit<T>
}
```

**关联改动**: `Table.tsx` 中的 `TableProps<T>` 和组件内部都需要传递 T。

### 5.2 GraphContextBag 泛型化

见上文 3.2 节。这是让 `CustomCommitNode<T>` 能拿到完整类型的必要条件。

---

## 六、可选增强（非必须）

这些是"锦上添花"的功能，可视需求决定是否实施：

| 增强 | 说明 |
|------|------|
| Tags 显示 repo 名 | `BranchLabel` 读取 `commit` 中的 repo 字段（通过 T），显示为 `main [repo-A]` |
| Tags dedup key | `prepareCommits` 的 `tagsSeen` key 从 `commit.branch` 改为 `repoName + '/' + commit.branch` |
| 颜色按 repo 分配 | 新增 `getColumnColour?: (commit: Commit<T>, columnIndex: number) => string` 回调，用户可按 repo 返回不同颜色 |
| repo 分隔线/标签 | 在 Graph 行间插入 repo 标识行（类似 index pseudo-row 但显示 repo 名） |

---

## 七、改造文件清单

### 必须改动（核心）

| 文件 | 改动内容 |
|------|----------|
| [src/types.ts](packages/library/src/types.ts) | 新增 `RepoConfig`，`currentBranch` 改为可选，新增 `repos` 字段 |
| [src/components/GitLogCore/GitLogCore.tsx](packages/library/src/components/GitLogCore/GitLogCore.tsx) | `headCommit` 查找改为多 repo，`indexCommit` 生成改为多个 |
| [src/components/GitLogCore/types.ts](packages/library/src/components/GitLogCore/types.ts) | `GitLogCoreProps` 新增 `repos` / `repoConfigs` 字段 |
| [src/data/GraphDataBuilder.ts](packages/library/src/data/GraphDataBuilder.ts) | `_headCommit` → `_headCommits: Map`，head 特殊处理逻辑调整 |
| [src/data/ActiveBranches.ts](packages/library/src/data/ActiveBranches.ts) | 初始值从 `['index']` 改为 `[]` |
| [src/data/ActiveNodes.ts](packages/library/src/data/ActiveNodes.ts) | 去掉构造函数中 `'index'` 的预注册 |
| [src/context/GitContext/types.ts](packages/library/src/context/GitContext/types.ts) | 新增 `headCommits`、`indexCommits`、`repoConfigs` |
| [src/context/GitContext/GitContext.ts](packages/library/src/context/GitContext/GitContext.ts) | 更新默认值 |
| [src/modules/Graph/context/types.ts](packages/library/src/modules/Graph/context/types.ts) | `GraphContextBag` 添加泛型 `<T>` |
| [src/modules/Graph/context/GraphContext.ts](packages/library/src/modules/Graph/context/GraphContext.ts) | 更新 `createContext` 默认值 |
| [src/modules/Graph/core/GraphCore.tsx](packages/library/src/modules/Graph/core/GraphCore.tsx) | 传递泛型 T 到 GraphContext |
| [src/modules/Graph/strategies/Grid/components/IndexPseudoRow/IndexPseudoRow.tsx](packages/library/src/modules/Graph/strategies/Grid/components/IndexPseudoRow/IndexPseudoRow.tsx) | 支持多列 index 节点 |
| [src/modules/Graph/strategies/Grid/GraphMatrixBuilder/GraphMatrixBuilder.ts](packages/library/src/modules/Graph/strategies/Grid/GraphMatrixBuilder/GraphMatrixBuilder.ts) | `drawIndexPseudoCommitEdge` 改为遍历所有 HEAD |
| [src/modules/Graph/strategies/Grid/GraphMatrixBuilder/types.ts](packages/library/src/modules/Graph/strategies/Grid/GraphMatrixBuilder/types.ts) | `GraphMatrixBuilderProps` 新增 `headCommits` |
| [src/modules/Table/types.ts](packages/library/src/modules/Table/types.ts) | `CustomTableRow` / `CustomTableRowProps` 添加泛型 `<T>` |
| [src/modules/Table/Table.tsx](packages/library/src/modules/Table/Table.tsx) | 支持多个 index 伪提交 |
| [src/modules/Tags/Tags.tsx](packages/library/src/modules/Tags/Tags.tsx) | 支持多个 index 伪提交 |

### 建议改动（完善）

| 文件 | 改动内容 |
|------|----------|
| [src/modules/Tags/utils/formatBranch.ts](packages/library/src/modules/Tags/utils/formatBranch.ts) | 可选：支持 repo 前缀格式化 |
| [src/modules/Tags/components/BranchLabel/BranchLabel.tsx](packages/library/src/modules/Tags/components/BranchLabel/BranchLabel.tsx) | 可选：显示 repo 名称 |
| [src/hooks/useTheme/useTheme.ts](packages/library/src/hooks/useTheme/useTheme.ts) | 可选：支持基于 commit 的列颜色分配 |

---

## 八、验证方案

### 8.1 向后兼容验证

1. 运行现有全量测试套件：`npm run test:unit:ci --workspace=@tomplum/react-git-log`
2. 运行集成测试：`npm run test:integration:ci --workspace=@tomplum/react-git-log`
3. 关键：所有 snapshot 测试应保持不变（特别是 [GitLog.spec.tsx.snap](packages/library/src/__snapshots__/GitLog.spec.tsx.snap)、[GitLogPaged.spec.tsx.snap](packages/library/src/__snapshots__/GitLogPaged.spec.tsx.snap)、[HTMLGridGraph.spec.tsx.snap](packages/library/src/modules/Graph/strategies/Grid/__snapshots__/HTMLGridGraph.spec.tsx.snap)）
4. Storybook 中现有 stories 行为不变

### 8.2 多仓库场景验证

1. 构建测试数据：两个独立仓库的 git log 合并为一个 `entries` 数组
2. 验证点：
   - 两个 HEAD 都被正确识别（各自在正确的 column）
   - 每个 HEAD 上方都有 index 伪提交
   - index 虚线从各自的 index 节点连到各自的 HEAD
   - 两个仓库的分支线互不干扰
3. 用 `onSelectCommit` 回调验证 commit 中能拿到泛型 `T` 的自定义字段（如 `repoName`）

### 8.3 极端场景验证

1. 两个仓库的 `currentBranch` 同名（如都是 `main`）— 应各自找到正确的 HEAD
2. 两个仓库的分支在图中交错（分支线交叉）— 图不应崩溃
3. 其中一个仓库只有 1 个 commit（根提交） — index 伪提交正确处理
4. 开启 filter 过滤掉其中一个仓库的全部 commit — 另一个仓库正常显示
5. 客户端分页模式 — 两个仓库的 index 仅在首页显示
6. 服务端分页模式（`GitLogPaged`）— `headCommitHash` 需要改为 `headCommitHashes: Map<repoName, hash>`
