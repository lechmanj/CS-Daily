import { describe, expect, it } from 'vitest'
import { IpcChannel, normalizePlatform } from './ipc'

describe('normalizePlatform', () => {
  it('keeps supported platforms', () => {
    expect(normalizePlatform('darwin')).toBe('darwin')
    expect(normalizePlatform('win32')).toBe('win32')
  })

  it('maps everything else to "other"', () => {
    expect(normalizePlatform('linux')).toBe('other')
  })
})

describe('IpcChannel', () => {
  it('uses unique channel names', () => {
    const names = Object.values(IpcChannel)
    expect(new Set(names).size).toBe(names.length)
  })
})
