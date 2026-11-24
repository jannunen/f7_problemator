import { describe, it, expect } from 'vitest'
import { categoryCap, isCategoryFull, spotsLeft } from '../src/js/helpers/compCategory.js'

const cat = (maxparticipants, confirmed = 0) => ({
  id: 1,
  pivot: { maxparticipants },
  participants: Array.from({ length: confirmed }, (_, i) => ({ contenderid: i })),
})

describe('categoryCap', () => {
  it('reads the cap off the pivot', () => expect(categoryCap(cat(40))).toBe(40))
  it('null and 0 both mean no limit, as the backend reads them', () => {
    expect(categoryCap(cat(null))).toBeNull()
    expect(categoryCap(cat(0))).toBeNull()
    expect(categoryCap(cat('0'))).toBeNull()
  })
  it('a cap that arrives as a string still counts', () => expect(categoryCap(cat('20'))).toBe(20))
  it('ignores a cap on the category itself, where there is no such column', () => {
    expect(categoryCap({ maxparticipants: 5, pivot: {} })).toBeNull()
    expect(categoryCap({})).toBeNull()
  })
})

describe('isCategoryFull', () => {
  it('full at the cap, and over it', () => {
    expect(isCategoryFull(cat(2, 2))).toBe(true)
    expect(isCategoryFull(cat(2, 3))).toBe(true)
  })
  it('not full with a spot left', () => expect(isCategoryFull(cat(2, 1))).toBe(false))
  it('never full without a cap', () => {
    expect(isCategoryFull(cat(null, 500))).toBe(false)
    expect(isCategoryFull(cat(0, 500))).toBe(false)
  })
  it('a category with no participants list yet is not full', () => {
    expect(isCategoryFull({ pivot: { maxparticipants: 2 } })).toBe(false)
  })
})

describe('spotsLeft', () => {
  it('the cap less what is taken', () => expect(spotsLeft(cat(40), 36)).toBe(4))
  it('never below zero', () => expect(spotsLeft(cat(40), 45)).toBe(0))
  it('null when there is no cap, so the page can say there is no limit', () => {
    expect(spotsLeft(cat(null), 3)).toBeNull()
    expect(spotsLeft(cat(0), 3)).toBeNull()
  })
})
