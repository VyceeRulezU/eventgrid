import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    functions: { invoke: vi.fn() },
  },
  safeGetSession: vi.fn().mockResolvedValue(null),
  isSupabaseConfigured: true,
}))

describe('smoke', () => {
  it('vitest runs', () => {
    expect(1 + 1).toBe(2)
  })

  it('renders a react element', () => {
    render(<div data-testid="hello">hello world</div>)
    expect(screen.getByTestId('hello')).toHaveTextContent('hello world')
  })
})
