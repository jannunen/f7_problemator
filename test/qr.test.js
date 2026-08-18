import { describe, it, expect } from 'vitest'
import { extractProblemId, describeCameraError } from '../src/js/helpers/qr.js'

describe('extractProblemId', () => {
  it('reads the id off a Problemator QR URL', () => {
    expect(extractProblemId('https://pwa.problemator.fi/#!/problem/67243')).toBe('67243')
  })

  it('accepts a bare id, as a string or a number', () => {
    expect(extractProblemId('67243')).toBe('67243')
    expect(extractProblemId(67243)).toBe('67243')
  })

  it('tolerates trailing whitespace from a scan', () => {
    expect(extractProblemId('https://pwa.problemator.fi/#!/problem/67243\n')).toBe('67243')
  })

  // Previously this threw: the regex returned null and the code indexed [1]
  // on it, so pointing the camera at any other QR code crashed the handler.
  it('returns null for a QR code that is not ours, instead of throwing', () => {
    expect(extractProblemId('https://example.com/about')).toBeNull()
    expect(extractProblemId('just some text')).toBeNull()
    expect(extractProblemId('')).toBeNull()
    expect(extractProblemId(null)).toBeNull()
    expect(extractProblemId(undefined)).toBeNull()
  })
})

describe('describeCameraError', () => {
  const t = (k) => k

  it('names the camera-in-use case, which is what a failed second scan hits', () => {
    const d = describeCameraError({ name: 'NotReadableError' }, t)
    expect(d.title).toBe('searchprob.qr_err_inuse_title')
  })

  it('distinguishes permission denial from no camera', () => {
    expect(describeCameraError({ name: 'NotAllowedError' }, t).title)
      .toBe('searchprob.qr_err_denied_title')
    expect(describeCameraError({ name: 'NotFoundError' }, t).title)
      .toBe('searchprob.qr_err_nocamera_title')
  })

  it('always returns something to show, even for an unknown error', () => {
    const d = describeCameraError({ name: 'SomethingNew' }, t)
    expect(d.title).toBeTruthy()
    expect(d.hint).toBeTruthy()
    expect(describeCameraError(undefined, t).title).toBeTruthy()
  })
})
