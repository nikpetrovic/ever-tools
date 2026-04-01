import { useQuery } from '@tanstack/react-query'
import type { EmailRecord } from '../types/email'

export function useEmailDetail(id: string | null): EmailRecord | null {
  const { data } = useQuery({
    queryKey: ['email', id],
    queryFn: () => window.api.emails.get(id!),
    enabled: id !== null,
  })
  return data ?? null
}
