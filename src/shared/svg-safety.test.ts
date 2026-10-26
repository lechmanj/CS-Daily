import { describe, expect, it } from 'vitest'
import { findUnsafeSvgFeatures, looksLikeSvg } from './svg-safety'

const wrap = (inner: string) => `<svg viewBox="0 0 10 10">${inner}</svg>`

describe('findUnsafeSvgFeatures', () => {
  it('accepts plain shapes, text and internal references', () => {
    const svg = wrap(
      '<defs><marker id="a"/></defs><line marker-end="url(#a)"/><use href="#a"/>' +
        '<rect style="fill: var(--x, #fff)"/><text>hi</text>'
    )
    expect(findUnsafeSvgFeatures(svg)).toEqual([])
  })

  it.each([
    ['script element', wrap('<script>alert(1)</script>')],
    ['script element, odd casing', wrap('<SCRIPT>alert(1)</SCRIPT>')],
    ['foreignObject', wrap('<foreignObject><div/></foreignObject>')],
    ['iframe', wrap('<iframe src="x"></iframe>')],
    ['onclick handler', wrap('<rect onclick="x()"/>')],
    ['onload handler', '<svg viewBox="0 0 1 1" onload="x()"></svg>'],
    ['javascript: url', wrap('<a href="#" xlink:href="javascript:x()"/>')],
    ['external href', wrap('<image href="https://example.com/a.png"/>')],
    ['external xlink:href', wrap('<use xlink:href="http://example.com/a.svg#b"/>')],
    ['external url()', wrap('<rect style="fill: url(https://example.com/a)"/>')],
    ['@import', wrap('<style>@import "x.css";</style>')],
    ['doctype/entity', '<!DOCTYPE svg [<!ENTITY x "y">]><svg viewBox="0 0 1 1"></svg>']
  ])('flags %s', (_name, svg) => {
    expect(findUnsafeSvgFeatures(svg).length).toBeGreaterThan(0)
  })
})

describe('looksLikeSvg', () => {
  it('accepts an svg root, with or without an XML prolog or comments', () => {
    expect(looksLikeSvg('<svg></svg>')).toBe(true)
    expect(looksLikeSvg('<?xml version="1.0"?>\n<!-- c -->\n<svg></svg>')).toBe(true)
  })

  it('rejects other documents', () => {
    expect(looksLikeSvg('<html><svg></svg></html>')).toBe(false)
    expect(looksLikeSvg('')).toBe(false)
  })
})
