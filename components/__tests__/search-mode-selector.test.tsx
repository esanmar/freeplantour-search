import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { deleteCookie, getCookie } from '@/lib/utils/cookies'

import { SearchModeSelector } from '../search-mode-selector'

describe('SearchModeSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deleteCookie('searchMode')
  })

  test('allows adaptive selection for every user, guest or not', () => {
    render(<SearchModeSelector />)

    fireEvent.click(screen.getByRole('button', { name: /adaptive mode/i }))

    expect(getCookie('searchMode')).toBe('adaptive')
  })
})
