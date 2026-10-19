import test from 'node:test'
import assert from 'node:assert/strict'
import { createAnalysisRequest, validateAttachment } from '../src/analysisRequest.js'

test('email upload uses multipart without forcing a boundary', () => {
  const file = new File(['Subject: Test\n\nPlease verify this message.'], 'sample.eml')
  const request = createAnalysisRequest('', file)
  assert.equal(request.url, '/api/v1/analyze/email?expand_links=false&external_checks=false')
  assert.equal(request.options.headers, undefined)
  assert.equal(request.options.body.get('file'), file)
})

test('supported QR formats go to the QR endpoint', () => {
  for (const extension of ['png', 'JPG', 'jpeg', 'webp']) {
    const request = createAnalysisRequest('', new File(['image'], `qr.${extension}`))
    assert.equal(request.kind, 'qr')
    assert.equal(request.url, '/api/v1/analyze/qr?expand_links=false&external_checks=false')
  }
})

test('unsupported, empty and oversized files fail before upload', () => {
  assert.throws(() => validateAttachment(new File(['pdf'], 'test.pdf')), /Choose an email/)
  assert.throws(() => validateAttachment(new File([], 'empty.eml')), /empty/)
  assert.throws(() => validateAttachment(new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'large.png')), /too large/)
})

test('text submission remains JSON with network checks disabled', () => {
  const request = createAnalysisRequest('https://example.com', null)
  assert.equal(request.url, '/api/v1/analyze')
  assert.equal(request.options.headers['Content-Type'], 'application/json')
  assert.deepEqual(JSON.parse(request.options.body), { content: 'https://example.com', expand_links: false, external_checks: false })
})




test('threat-feed checks are requested when selected', () => {
  assert.equal(JSON.parse(createAnalysisRequest('https://example.com', null, true).options.body).external_checks, true)
  assert.equal(createAnalysisRequest('', new File(['data'],'qr.png'), true).url, '/api/v1/analyze/qr?expand_links=false&external_checks=true')
})
