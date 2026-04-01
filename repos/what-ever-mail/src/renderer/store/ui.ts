import { useState, useCallback } from 'react'

export type NavItem = 'inbox' | 'trash'

export function useUiStore() {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)
  const [navItem, setNavItem] = useState<NavItem>('inbox')
  const [searchQuery, setSearchQuery] = useState('')

  const selectEmail = useCallback((id: string | null) => setSelectedEmailId(id), [])

  const navigate = useCallback((item: NavItem) => {
    setNavItem(item)
    setSelectedEmailId(null)
    setSearchQuery('')
  }, [])

  return { selectedEmailId, navItem, searchQuery, selectEmail, navigate, setSearchQuery }
}
