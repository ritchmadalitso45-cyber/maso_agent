import test from 'node:test'
import assert from 'node:assert/strict'
import { presentResult } from '../src/resultPresentation.js'
const base = { risk_level: 'Safe', checks: { model_type: 'url' } }
test('low model risk is displayed directly', () => assert.equal(presentResult(base).title, 'Low-risk link'))
test('known threat match overrides low model risk explicitly', () => assert.equal(presentResult({ ...base, safety_status: 'unsafe', findings: [{ code: 'known_threat', message: 'OpenPhish reports a threat.' }] }).title, 'Unsafe link'))
test('strong model risk is displayed directly', () => assert.equal(presentResult({ ...base, risk_level: 'Dangerous' }).title, 'High-risk link'))
test('message verdict uses message wording', () => assert.equal(presentResult({ ...base, checks: { model_type: 'text' } }).title, 'Low-risk message'))

test('failed lookup is explicit', () => assert.equal(presentResult({ ...base, safety_status: 'unverified' }).title, 'Live check unavailable'))
