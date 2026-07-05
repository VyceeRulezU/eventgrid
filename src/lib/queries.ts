import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PostgrestError } from '@supabase/supabase-js'

type QueryFn<T> = () => Promise<{ data: T | null; error: PostgrestError | null }>

export function useSupabaseQuery<T>(
  key: unknown[],
  fn: QueryFn<T>,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await fn()
      if (error) throw error
      return data as T
    },
    ...options,
  })
}

export function useSupabaseMutation<TVariables, TResponse>(
  fn: (vars: TVariables) => Promise<{ data: TResponse | null; error: PostgrestError | null }>,
  options?: {
    onSuccess?: (data: TResponse) => void
    invalidate?: unknown[][]
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vars: TVariables) => {
      const { data, error } = await fn(vars)
      if (error) throw error
      return data as TResponse
    },
    onSuccess: (data) => {
      if (options?.invalidate) {
        options.invalidate.forEach((key) => queryClient.invalidateQueries({ queryKey: key }))
      }
      options?.onSuccess?.(data)
    },
  })
}
