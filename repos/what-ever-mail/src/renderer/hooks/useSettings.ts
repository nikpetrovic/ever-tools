import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export function useSetting<T>(key: string): { value: T | undefined; set: (v: T) => void } {
  const queryClient = useQueryClient()

  const { data: value } = useQuery({
    queryKey: ['settings', key],
    queryFn: () => window.api.settings.get<T>(key),
  })

  const mutation = useMutation({
    mutationFn: (v: T) => window.api.settings.set(key, v),
    onSuccess: (_data, v) => {
      queryClient.setQueryData(['settings', key], v)
    },
  })

  return { value, set: (v) => mutation.mutate(v) }
}

export function useSettingsSync(): void {
  const queryClient = useQueryClient()
  useEffect(() => {
    return window.api.onSettingsInvalidate(() => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    })
  }, [queryClient])
}
