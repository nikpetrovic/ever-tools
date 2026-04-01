import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { EmailRecord } from '../types/email'

const EMAILS_KEY = ['emails'] as const

export function useEmails(): { emails: EmailRecord[]; isLoading: boolean } {
  const queryClient = useQueryClient()

  const { data: emails = [], isLoading } = useQuery({
    queryKey: EMAILS_KEY,
    queryFn: () => window.api.emails.list(),
  })

  useEffect(() => {
    const unsubscribe = window.api.emails.onNew((email) => {
      queryClient.setQueryData<EmailRecord[]>(EMAILS_KEY, (prev = []) => [email, ...prev])
    })
    return unsubscribe
  }, [queryClient])

  return { emails, isLoading }
}

export function useDeleteEmail(): (id: string) => Promise<void> {
  const queryClient = useQueryClient()
  return async (id: string) => {
    await window.api.emails.delete(id)
    queryClient.setQueryData<EmailRecord[]>(EMAILS_KEY, (prev = []) =>
      prev.filter((e) => e.id !== id)
    )
  }
}

export function useClearEmails(): () => Promise<void> {
  const queryClient = useQueryClient()
  return async () => {
    await window.api.emails.clear()
    queryClient.setQueryData<EmailRecord[]>(EMAILS_KEY, [])
  }
}

export function useMarkRead(): (id: string) => Promise<void> {
  const queryClient = useQueryClient()
  return async (id: string) => {
    await window.api.emails.markRead(id)
    queryClient.setQueryData<EmailRecord[]>(EMAILS_KEY, (prev = []) =>
      prev.map((e) => (e.id === id ? { ...e, read: true } : e))
    )
  }
}
