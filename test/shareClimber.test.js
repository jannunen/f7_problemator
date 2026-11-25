import { describe, it, expect, vi } from 'vitest'
import { climberShareUrl, shareLink } from '../src/js/helpers/shareClimber.js'

describe('climberShareUrl', () => {
  it('points at the backend share page for that climber', () => {
    expect(climberShareUrl('https://api4.problemator.fi', 1234)).toBe('https://api4.problemator.fi/climber/1234/share')
  })

  it('does not double the slash when the host ends in one', () => {
    expect(climberShareUrl('https://api4.problemator.fi/', '1234')).toBe('https://api4.problemator.fi/climber/1234/share')
  })
})

describe('shareLink', () => {
  const payload = { url: 'https://api.test/climber/7/share', title: 'T', text: 'X' }
  const abort = () => Object.assign(new Error('closed'), { name: 'AbortError' })

  it('uses the native share sheet when there is one', async () => {
    const nav = { share: vi.fn().mockResolvedValue(), clipboard: { writeText: vi.fn() } }

    expect(await shareLink(payload, nav)).toBe('shared')
    expect(nav.share).toHaveBeenCalledWith(payload)
    expect(nav.clipboard.writeText).not.toHaveBeenCalled()
  })

  it('copies the link where navigator.share does not exist', async () => {
    const nav = { clipboard: { writeText: vi.fn().mockResolvedValue() } }

    expect(await shareLink(payload, nav)).toBe('copied')
    expect(nav.clipboard.writeText).toHaveBeenCalledWith(payload.url)
  })

  it('treats a dismissed share sheet as cancelled, without copying', async () => {
    const nav = { share: vi.fn().mockRejectedValue(abort()), clipboard: { writeText: vi.fn() } }

    expect(await shareLink(payload, nav)).toBe('cancelled')
    expect(nav.clipboard.writeText).not.toHaveBeenCalled()
  })

  it('falls back to copying when the share sheet itself errors', async () => {
    const nav = {
      share: vi.fn().mockRejectedValue(new Error('NotAllowedError')),
      clipboard: { writeText: vi.fn().mockResolvedValue() },
    }

    expect(await shareLink(payload, nav)).toBe('copied')
  })

  it('reports failure instead of throwing when nothing works', async () => {
    expect(await shareLink(payload, {})).toBe('failed')
    expect(await shareLink(payload, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })).toBe('failed')
  })
})
