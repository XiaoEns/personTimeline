import { useState, useEffect, useRef } from 'react'
import { getPerson, listPersonEvents } from '@/api/persons'
import type { PersonDetail, PersonEventItem } from '@person-timeline/api-types'

interface GitTreeData {
  /** 当前人物 */
  person: PersonDetail | null
  /** 当前人物的事件 */
  events: PersonEventItem[]
  /** 加载状态 */
  loading: boolean
}

/**
 * 获取 Git 树展示所需的当前人物数据。
 * 人物 = 分支，事件 = commit，分支信息由事件的 persons 字段驱动。
 */
export function useGitTree(personId: string | undefined): GitTreeData {
  const [person, setPerson] = useState<PersonDetail | null>(null)
  const [events, setEvents] = useState<PersonEventItem[]>([])
  const [loading, setLoading] = useState(true)

  /** 跳过 StrictMode 重复挂载导致的二次请求 */
  const loadedIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!personId) return
    if (loadedIdRef.current === personId) return
    setLoading(true)

    async function load() {
      const [personData, personEvents] = await Promise.all([
        getPerson(personId),
        listPersonEvents(personId),
      ])
      setPerson(personData)
      setEvents(personEvents.items.sort((a, b) => a.sort_order - b.sort_order))
    }

    load().finally(() => setLoading(false))
    return () => { loadedIdRef.current = personId }
  }, [personId])

  return { person, events, loading }
}
