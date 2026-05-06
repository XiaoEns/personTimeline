import { useMemo, useCallback } from 'react'
import { GitLog } from '@/vendor/react-git-log'
import type { GitLogEntry } from '@/vendor/react-git-log'
import type { PersonDetail, PersonEventItem } from '@person-timeline/api-types'

// ========== 扩展条目类型 ==========
interface PersonEventExtra {
  role: string | null
  eventType: string
}

type PersonGitEntry = GitLogEntry<PersonEventExtra>

// ========== Props ==========
interface GitTreeProps {
  person: PersonDetail
  events: PersonEventItem[]
  otherBranches?: { personName: string; events: PersonEventItem[] }[]
  onSelectEvent?: (eventId: string) => void
}

// ========== 分支色板 ==========
// const BRANCH_COLORS = [
//   '#5b8ff9', // 蓝
//   '#5ad8a6', // 青绿
//   '#f6bd16', // 金
//   '#e86452', // 红
//   '#6dc8ec', // 天蓝
//   '#945fb4', // 紫
//   '#ff9845', // 橙
//   '#1e9493', // 深青
// ]

/**
 * 将人物事件列表映射为 GitLog 所需条目格式。
 *
 * 核心逻辑：
 * 1. 收集所有人物的事件，按 event_id 去重——相同 event_id = 共享事件
 * 2. 按时间升序构建 git DAG：共享事件 → 合并节点（多 parents），单人事件 → 普通节点
 * 3. 反转为降序输出，符合 git log 从新到旧的渲染顺序
 *
 * 共享事件放置在 currentBranch 上，其他人物分支在共享点汇入、再在后续事件处分叉。
 */
function mapEventsToGitLog(
  person: PersonDetail,
  events: PersonEventItem[],
  otherBranches?: { personName: string; events: PersonEventItem[] }[],
): { entries: PersonGitEntry[]; currentBranch: string } {
  // ---- 1. 收集所有事件，按 event_id 分组 ----
  const eventMap = new Map<string, {
    event: PersonEventItem
    persons: { name: string; role: string | null; personalTitle: string | null }[]
  }>()

  const allBranches: { name: string; events: PersonEventItem[] }[] = [
    { name: person.name, events },
    ...(otherBranches || []).map(b => ({ name: b.personName, events: b.events })),
  ]

  allBranches.forEach(({ name: branchName, events: evts }) => {
    evts.forEach(evt => {
      const existing = eventMap.get(evt.event_id)
      if (existing) {
        existing.persons.push({ name: branchName, role: evt.role, personalTitle: evt.personal_title })
      } else {
        eventMap.set(evt.event_id, {
          event: evt,
          persons: [{ name: branchName, role: evt.role, personalTitle: evt.personal_title }],
        })
      }
    })
  })

  // ---- 2. 按时间升序排列（用于构建 parent 关系） ----
  const sortedEvents = Array.from(eventMap.values()).sort((a, b) => {
    const da = new Date(a.event.start_date).getTime()
    const db = new Date(b.event.start_date).getTime()
    if (da !== db) return da - db
    return a.event.sort_order - b.event.sort_order
  })

  // ---- 3. 按时间升序遍历，构建 git DAG ----
  const entries: PersonGitEntry[] = []
  const lastHash = new Map<string, string>() // branchName → 该分支最新 commit hash

  sortedEvents.forEach(({ event: evt, persons }) => {
    const year = evt.start_date?.slice(0, 4) || ''
    const branchNames = persons.map(p => p.name)

    if (persons.length === 1) {
      // 单人事件 —— 普通 commit
      const branchName = persons[0].name
      const hash = `${branchName}:${evt.event_id}`
      const parentHash = lastHash.get(branchName)

      entries.push({
        hash,
        branch: branchName,
        parents: parentHash ? [parentHash] : [],
        message: `${evt.personal_title || evt.title}（${year}年）`,
        committerDate: evt.start_date,
        author: { name: branchName },
        role: evt.role,
        eventType: evt.event_type,
      })

      lastHash.set(branchName, hash)
    } else {
      // 共享事件 —— 合并 commit（多 parents）
      const parentHashes = new Set<string>()
      branchNames.forEach(name => {
        const h = lastHash.get(name)
        if (h) parentHashes.add(h)
      })

      // 优先放在当前人物分支上，否则取第一个参与人物
      const primaryBranch = branchNames.includes(person.name) ? person.name : branchNames[0]

      // 参与者角色描述
      const rolesDesc = persons
        .map(p => `${p.name}${p.role ? `:${p.role}` : ''}`)
        .join('、')

      const hash = evt.event_id

      // 当前人物的个人视角标题（若参与）
      const selfPerson = persons.find(p => p.name === person.name)
      const displayTitle = selfPerson?.personalTitle || evt.title

      entries.push({
        hash,
        branch: primaryBranch,
        parents: Array.from(parentHashes),
        message: `${displayTitle}（${year}年）— ${rolesDesc}`,
        committerDate: evt.start_date,
        author: { name: primaryBranch },
        role: selfPerson?.role || persons[0].role,
        eventType: evt.event_type,
      })

      // 所有参与分支的 lastHash 都指向此共享 commit
      branchNames.forEach(name => {
        lastHash.set(name, hash)
      })
    }
  })

  // ---- 4. 反转为降序（git log 从新到旧） ----
  entries.reverse()

  return { entries, currentBranch: person.name }
}

/**
 * 以 Git 分支图形式展示人物时间线。
 * 人物 = 分支，事件 = commit。
 */
export default function GitTree({ person, events, otherBranches, onSelectEvent }: GitTreeProps) {
  const { entries, currentBranch } = useMemo(
    () => mapEventsToGitLog(person, events, otherBranches),
    [person, events, otherBranches],
  )

  const handleSelectCommit = useCallback(
    (commit?: { hash: string }) => {
      if (commit && onSelectEvent) {
        // hash 格式：「分支名:事件ID」（单人事件）或「事件ID」（共享事件）
        const eventId = commit.hash.includes(':') ? commit.hash.split(':')[1] : commit.hash
        onSelectEvent(eventId)
      }
    },
    [onSelectEvent],
  )

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        暂无事件数据
      </div>
    )
  }

  return (
    <div className="git-tree-wrapper h-full w-full overflow-auto bg-white">
      <GitLog
        entries={entries}
        currentBranch={currentBranch}
        theme="light"
        colours="rainbow-light"
        defaultGraphWidth={240}
        showHeaders={false}
        rowSpacing={6}
        onSelectCommit={handleSelectCommit}
        enableSelectedCommitStyling
        enablePreviewedCommitStyling
      >
        <GitLog.Tags />
        <GitLog.GraphHTMLGrid
          nodeTheme="plain"
          nodeSize={16}
          orientation="normal"
        />
        <GitLog.Table timestampFormat="YYYY年" />
      </GitLog>
    </div>
  );
}
