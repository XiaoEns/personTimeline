import { useParams } from 'react-router-dom'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useGitTree } from '@/hooks/useGitTree'
import { getPerson, listPersonEvents } from '@/api/persons'
import GitTree from '@/components/GitTree'
import EventCard from '@/components/EventCard'
import type { PersonDetail, PersonEventItem } from '@person-timeline/api-types'

export default function PersonGitTree() {
  const { id } = useParams<{ id: string }>()
  const { person: initialPerson, events: initialEvents, loading } = useGitTree(id)

  // 已激活的人物 ID 列表（第一个是初始人物）
  const [activePersonIds, setActivePersonIds] = useState<string[]>([])

  // 人物缓存：personId → { person, events }
  const [personCache, setPersonCache] = useState<
    Map<string, { person: PersonDetail; events: PersonEventItem[] }>
  >(new Map())

  // 分支加载状态
  const [loadingBranches, setLoadingBranches] = useState<Set<string>>(new Set())

  // 事件选中状态
  const [selectedEvent, setSelectedEvent] = useState<PersonEventItem | null>(null)
  const [showEventCard, setShowEventCard] = useState(false)

  // ---- 初始数据填充 ----
  useEffect(() => {
    if (initialPerson && initialEvents.length > 0 && id) {
      setActivePersonIds([id])
      setPersonCache(prev => {
        const next = new Map(prev)
        next.set(id, { person: initialPerson, events: initialEvents })
        return next
      })
    }
  }, [initialPerson, initialEvents, id])

  // ---- event_id → PersonEventItem 映射（用于选中回调） ----
  const eventMap = useMemo(() => {
    const map = new Map<string, PersonEventItem>()
    personCache.forEach(cached => {
      cached.events.forEach(e => map.set(e.event_id, e))
    })
    return map
  }, [personCache])

  // ---- 合并事件（按 event_id 去重） ----
  const mergedEvents = useMemo(() => {
    const map = new Map<string, PersonEventItem>()
    activePersonIds.forEach(pid => {
      const cached = personCache.get(pid)
      if (!cached) return
      cached.events.forEach(evt => {
        if (!map.has(evt.event_id)) {
          map.set(evt.event_id, { ...evt })
        }
      })
    })
    return Array.from(map.values()).sort((a, b) => {
      const da = new Date(a.start_date).getTime()
      const db = new Date(b.start_date).getTime()
      if (da !== db) return da - db
      return a.sort_order - b.sort_order
    })
  }, [activePersonIds, personCache])

  // ---- 分支名列表（主人物排第一） ----
  const activeBranchNames = useMemo(() => {
    return activePersonIds.map(pid => {
      const cached = personCache.get(pid)
      return cached?.person.name || pid
    })
  }, [activePersonIds, personCache])

  // ---- 添加分支 ----
  const addBranch = useCallback(async (personId: string) => {
    if (activePersonIds.includes(personId)) return
    if (loadingBranches.has(personId)) return

    setLoadingBranches(prev => new Set(prev).add(personId))
    try {
      const [personData, eventsData] = await Promise.all([
        getPerson(personId),
        listPersonEvents(personId),
      ])
      setPersonCache(prev => {
        const next = new Map(prev)
        next.set(personId, {
          person: personData,
          events: eventsData.items.sort((a, b) => a.sort_order - b.sort_order),
        })
        return next
      })
      setActivePersonIds(prev => [...prev, personId])
    } finally {
      setLoadingBranches(prev => {
        const next = new Set(prev)
        next.delete(personId)
        return next
      })
    }
  }, [activePersonIds, loadingBranches])

  // ---- 移除分支 ----
  const removeBranch = useCallback((personId: string) => {
    // 不可移除初始人物
    if (activePersonIds[0] === personId) return
    setActivePersonIds(prev => prev.filter(pid => pid !== personId))
  }, [activePersonIds])

  // ---- 事件选中 ----
  const handleEventSelect = useCallback((eventId: string) => {
    const ev = eventMap.get(eventId)
    if (ev) {
      setSelectedEvent(ev)
      setShowEventCard(true)
    }
  }, [eventMap])

  const closeEventCard = useCallback(() => setShowEventCard(false), [])

  // ---- 分支颜色映射 ----
  const branchColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-400 text-sm">加载人物分支数据...</span>
      </div>
    )
  }

  if (!initialPerson) return null

  const totalBranches = activePersonIds.length
  const totalCommits = mergedEvents.length

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full">
      {/* 顶部信息栏 */}
      <div className="flex items-center gap-4 border-b bg-white px-6 py-3 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{initialPerson.name}</h1>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500">
          <span>{initialPerson.birth_display || initialPerson.birth_date?.slice(0, 10) || '?'}</span>
          <span>—</span>
          <span>{initialPerson.death_display || initialPerson.death_date?.slice(0, 10) || '?'}</span>
        </div>

        {/* 统计摘要 */}
        <div className="flex items-center gap-3 ml-auto text-xs text-gray-400">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>{totalBranches} 条人物分支</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{totalCommits} 个事件</span>
          </div>
        </div>
      </div>

      {/* 分支图例 */}
      {activeBranchNames.length > 1 && (
        <div className="flex items-center gap-2 px-6 py-2 border-b bg-gray-50/80 shrink-0">
          <span className="text-xs text-gray-400 mr-1">分支：</span>
          {activeBranchNames.map((name, idx) => {
            const pid = activePersonIds[idx]
            const isLoading = loadingBranches.has(pid)
            const canRemove = idx > 0
            return (
              <span
                key={pid}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-white border"
                style={{ borderLeft: `3px solid ${branchColors[idx % branchColors.length]}` }}
              >
                {name}
                {isLoading && (
                  <span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                )}
                {canRemove && !isLoading && (
                  <button
                    onClick={() => removeBranch(pid)}
                    className="ml-0.5 text-gray-300 hover:text-red-500 transition-colors leading-none"
                    title={`移除 ${name}`}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </span>
            )
          })}
        </div>
      )}

      {/* Git 树主体 */}
      <div className="flex-1 min-h-0 overflow-hidden bg-white">
        <GitTree
          person={initialPerson}
          events={mergedEvents}
          activeBranchNames={activeBranchNames}
          onSelectEvent={handleEventSelect}
        />
      </div>

      <EventCard
        event={selectedEvent}
        visible={showEventCard}
        onClose={closeEventCard}
        activePersonIds={activePersonIds}
        onAddBranch={addBranch}
      />
    </div>
  )
}
