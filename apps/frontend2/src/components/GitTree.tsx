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
  /** 显式指定分支名列表及列顺序（第一个为主分支）。未传则从 events[].persons 自动推导 */
  activeBranchNames?: string[]
  onSelectEvent?: (eventId: string) => void
}

/**
 * 将人物事件列表映射为 GitLog 所需条目格式。
 *
 * 核心逻辑：
 * 1. 按 start_date 升序排列事件
 * 2. 若传入 activeBranchNames 则直接使用，否则从 events[].persons 自动推导
 * 3. 每个分支的第一个事件作为独立根 commit（parents: []），确保主分支占据第一列
 * 4. 构建 git DAG：persons.length > 1 → 合并节点，否则 → 普通 commit
 * 5. __end__ 哨兵只放在主分支上
 */
function mapEventsToGitLog(
  person: PersonDetail,
  events: PersonEventItem[],
  activeBranchNames?: string[],
): { entries: PersonGitEntry[]; currentBranch: string } {
  if (events.length === 0) {
    return { entries: [], currentBranch: person.name }
  }

  // ---- 1. 按 start_date 升序排列 ----
  const sortedEvents = [...events].sort((a, b) => {
    const da = new Date(a.start_date).getTime()
    const db = new Date(b.start_date).getTime()
    if (da !== db) return da - db
    return a.sort_order - b.sort_order
  })

  // ---- 2. 推导分支列表 ----
  // 若上层传入了 activeBranchNames，直接使用；否则从 events[].persons 自动收集
  let branchNames: string[]
  if (activeBranchNames && activeBranchNames.length > 0) {
    branchNames = activeBranchNames
  } else {
    const branchPersonSet = new Set<string>()
    sortedEvents.forEach(evt => {
      (evt.persons || []).forEach(p => branchPersonSet.add(p))
    })
    branchPersonSet.delete(person.name)
    branchNames = [person.name]
    Array.from(branchPersonSet).sort().forEach(p => branchNames.push(p))
  }

  // ---- 3. 计算 __end__ 哨兵日期（末事件延展 1 天） ----
  const lastDate = new Date(sortedEvents[sortedEvents.length - 1].start_date)
  const endDate = new Date(lastDate.getTime() + 86400000)

  /** 将 Date 格式化为 "YYYY-MM-DD HH:MM:SS" 字符串 */
  function formatDate(d: Date): string {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd} 00:00:00`
  }

  // ---- 4. 升序遍历构建 git DAG ----
  // 不为 lastHash 做预热——每个分支的首个事件将作为根 commit（parents: []）
  const entries: PersonGitEntry[] = []
  const lastHash = new Map<string, string>()

  sortedEvents.forEach(evt => {
    const year = evt.start_date?.slice(0, 4) || ''
    const persons = evt.persons || []

    if (persons.length <= 1) {
      // 单人事件 —— 普通 commit
      const branchName = persons.length === 1 ? persons[0] : person.name
      const parentHash = lastHash.get(branchName)

      entries.push({
        hash: evt.event_id,
        branch: branchName,
        parents: parentHash ? [parentHash] : [],
        message: `${evt.personal_title || evt.title}（${year}年）`,
        committerDate: evt.start_date,
        author: { name: branchName },
        role: evt.role,
        eventType: evt.event_type,
      })

      lastHash.set(branchName, evt.event_id)
    } else {
      // 多人事件 —— 合并 commit（多 parents）
      const parentHashes: string[] = []
      persons.forEach(name => {
        const h = lastHash.get(name)
        if (h && !parentHashes.includes(h)) {
          parentHashes.push(h)
        }
      })

      // 优先放在当前人物分支上
      const primaryBranch = persons.includes(person.name) ? person.name : persons[0]

      // 参与者描述
      const rolesDesc = persons.join('、')

      entries.push({
        hash: evt.event_id,
        branch: primaryBranch,
        parents: parentHashes,
        message: `${evt.personal_title || evt.title}（${year}年）— ${rolesDesc}`,
        committerDate: evt.start_date,
        author: { name: primaryBranch },
        role: evt.role,
        eventType: evt.event_type,
      })

      // 所有参与分支的 lastHash 都更新为此事件
      persons.forEach(name => {
        lastHash.set(name, evt.event_id)
      })
    }
  })

  // ---- 5. __end__ 哨兵 —— 只放在主分支上 ----
  const primaryLastHash = lastHash.get(branchNames[0])
  entries.push({
    hash: '__end__',
    branch: branchNames[0],
    parents: primaryLastHash ? [primaryLastHash] : [],
    message: '结束',
    committerDate: formatDate(endDate),
    author: { name: person.name },
    role: null,
    eventType: 'OTHER',
  })

  return { entries, currentBranch: person.name }
}

/**
 * 以 Git 分支图形式展示人物时间线。
 * 人物 = 分支，事件 = commit。
 */
export default function GitTree({ person, events, activeBranchNames, onSelectEvent }: GitTreeProps) {
  const { entries, currentBranch } = useMemo(
    () => mapEventsToGitLog(person, events, activeBranchNames),
    [person, events, activeBranchNames],
  )

  /**
   * 处理 commit 选中事件。
   * hash 即 event_id，哨兵节点（__end__）不触发回调。
   */
  const handleSelectCommit = useCallback(
    (commit?: { hash: string }) => {
      if (commit && onSelectEvent) {
        const { hash } = commit
        if (hash !== '__start__' && hash !== '__end__') {
          onSelectEvent(hash)
        }
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
