import { useSyncExternalStore } from 'react'
import { dehydrate, hydrate, onlineManager, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { createAssignment, updateAssignmentStatus, updateAssignment } from '@/api/assignments'
import type { CreateAssignmentPayload, UpdateAssignmentPayload, AssignmentStatus } from '@/types'

const STORAGE_KEY = 'FLOWDAY_OFFLINE_MUTATIONS_V1'

/**
 * Register default mutation functions for key operations.
 * This allows TanStack Query to execute hydrated mutations across page reloads
 * when connectivity is restored.
 */
export function registerMutationDefaults(queryClient: QueryClient): void {
  queryClient.setMutationDefaults(['createAssignment'], {
    mutationFn: (variables: CreateAssignmentPayload) => createAssignment(variables),
  })

  queryClient.setMutationDefaults(['updateAssignmentStatus'], {
    mutationFn: ({ id, status }: { id: string; status: AssignmentStatus }) =>
      updateAssignmentStatus(id, { status }),
  })

  queryClient.setMutationDefaults(['updateAssignment'], {
    mutationFn: ({ id, body }: { id: string; body: UpdateAssignmentPayload }) =>
      updateAssignment(id, body),
  })
}

/**
 * Save paused mutations to localStorage.
 */
function saveMutationCache(queryClient: QueryClient): void {
  try {
    const dehydrated = dehydrate(queryClient, {
      shouldDehydrateMutation: (mutation) => mutation.state.isPaused || mutation.state.status === 'pending',
      shouldDehydrateQuery: () => false,
    })

    if (dehydrated.mutations && dehydrated.mutations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dehydrated))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch (err) {
    console.warn('Failed to save offline mutation queue to localStorage:', err)
  }
}

/**
 * Restore saved mutations from localStorage.
 */
function loadMutationCache(queryClient: QueryClient): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return

    const dehydratedState = JSON.parse(raw)
    hydrate(queryClient, dehydratedState)
  } catch (err) {
    console.warn('Failed to load offline mutation queue from localStorage:', err)
  }
}

/**
 * Initialize offline persistence and subscription on the QueryClient instance.
 */
export function initOfflinePersister(queryClient: QueryClient): void {
  registerMutationDefaults(queryClient)
  loadMutationCache(queryClient)

  // Subscribe to mutation cache changes to auto-persist queued mutations
  queryClient.getMutationCache().subscribe(() => {
    saveMutationCache(queryClient)
  })

  // Resume paused mutations when connectivity returns
  window.addEventListener('online', () => {
    onlineManager.setOnline(true)
    queryClient.resumePausedMutations()
  })

  if (onlineManager.isOnline()) {
    queryClient.resumePausedMutations()
  }
}

/**
 * Hook to reactively return the count of currently paused/queued mutations.
 */
export function useQueuedMutationsCount(): number {
  const queryClient = useQueryClient()
  return useSyncExternalStore(
    (onStoreChange) => queryClient.getMutationCache().subscribe(onStoreChange),
    () => queryClient.getMutationCache().getAll().filter((m) => m.state.isPaused).length,
    () => 0
  )
}

/**
 * Hook to reactively return the count of actively executing mutations.
 */
export function useExecutingMutationsCount(): number {
  const queryClient = useQueryClient()
  return useSyncExternalStore(
    (onStoreChange) => queryClient.getMutationCache().subscribe(onStoreChange),
    () => queryClient.getMutationCache().getAll().filter((m) => m.state.status === 'pending' && !m.state.isPaused).length,
    () => 0
  )
}
