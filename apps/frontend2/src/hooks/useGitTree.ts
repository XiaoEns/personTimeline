import { useState, useEffect } from 'react'
import { getPerson, listPersonEvents } from '@/api/persons'
import { listPersons } from '@/api/persons'
import type { PersonDetail, PersonEventItem, PersonListItem } from '@person-timeline/api-types'

interface GitTreeData {
  /** 当前人物 */
  person: PersonDetail | null
  /** 当前人物的事件 */
  events: PersonEventItem[]
  /** 其他人物及其事件 */
  otherBranches: { personName: string; events: PersonEventItem[] }[]
  /** 加载状态 */
  loading: boolean
}

/**
 * 获取 Git 树展示所需的完整数据——当前人物 + 其他人物分支。
 * 每个人物对应一个 git 分支，人物事件对应分支上的 commit。
 */
export function useGitTree(personId: string | undefined): GitTreeData {
  const [person, setPerson] = useState<PersonDetail | null>(null)
  const [events, setEvents] = useState<PersonEventItem[]>([])
  const [otherBranches, setOtherBranches] = useState<{ personName: string; events: PersonEventItem[] }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!personId) return
    setLoading(true)

    async function load() {
      // 1. 获取所有人物列表
      const allPersons: PersonListItem[] = []
      let page = 1
      let hasMore = true
      while (hasMore) {
        const result = await listPersons({ page, page_size: 50, status: 'published' })
        allPersons.push(...result.items)
        hasMore = result.items.length === result.page_size
        page++
      }

      // 2. 获取当前人物详情 + 事件
      const [personData, personEvents] = await Promise.all([
        getPerson(personId),
        listPersonEvents(personId),
      ])
      setPerson(personData)
      setEvents(personEvents.items.sort((a, b) => a.sort_order - b.sort_order))

      // 3. 获取其他人物的事件（有事件的人物才加入分支）
      const otherPersons = allPersons.filter(p => p.id !== personId && p.event_count > 0)
      const otherBranchesData = await Promise.all(
        otherPersons.map(async (p) => {
          const evts = await listPersonEvents(p.id)
          return {
            personName: p.name,
            events: evts.items.sort((a, b) => a.sort_order - b.sort_order),
          }
        }),
      )
      setOtherBranches(otherBranchesData.filter(b => b.events.length > 0))
    }

    load().finally(() => setLoading(false))
  }, [personId])

  return { person, events, otherBranches, loading }
}
