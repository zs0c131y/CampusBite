import { afterEach, before, after, test, mock } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '../src/models/User.js'
import Store from '../src/models/Store.js'
import RefreshToken from '../src/models/RefreshToken.js'
import adminRoutes from '../src/routes/adminRoutes.js'
import { loginSchema, registerSchema, refreshToken } from '../src/controllers/authController.js'
import { seedAdmin } from '../src/services/adminSeedService.js'

const adminId = '507f1f77bcf86cd799439011'
const userId = '507f1f77bcf86cd799439012'
const admin = { _id: adminId, name: 'Adarsh', email: 'adarsh@campusbite', role: 'admin', is_email_verified: true }
let server
let base
process.env.JWT_SECRET = 'admin-tests-only'
process.env.JWT_REFRESH_SECRET = 'refresh-tests-only'

before(async () => {
  const app = express()
  app.use(express.json())
  app.use('/admin', adminRoutes)
  app.post('/refresh', refreshToken)
  app.use((error, req, res, next) => { res.status(500).json({ message: error.message }) })
  server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})
after(async () => { await new Promise((resolve) => server.close(resolve)) })
afterEach(() => mock.restoreAll())

const token = (version = 0) => jwt.sign({ userId: adminId, authVersion: version }, process.env.JWT_SECRET)
const authenticateAs = (user) => mock.method(User, 'findById', () => ({ lean: async () => user }))
const request = (path, { method = 'GET', body, auth = token() } = {}) => fetch(`${base}/admin${path}`, {
  method, headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
  ...(body ? { body: JSON.stringify(body) } : {}),
})
const userUpdate = { name: 'Student Updated', phoneNumber: '', role: 'student', isActive: true, isEmailVerified: true }

test('every admin endpoint rejects unauthenticated requests', async () => {
  for (const [path, method] of [['/overview', 'GET'], ['/users', 'GET'], [`/users/${userId}`, 'PATCH'], ['/stores', 'GET'], [`/stores/${userId}`, 'PATCH'], ['/orders', 'GET'], ['/account', 'PUT']]) {
    assert.equal((await request(path, { method, auth: null })).status, 401)
  }
})

test('non-admin roles cannot read or mutate admin resources', async () => {
  for (const role of ['student', 'faculty', 'store_employee']) {
    authenticateAs({ ...admin, role })
    assert.equal((await request('/users')).status, 403)
    assert.equal((await request(`/stores/${userId}`, { method: 'PATCH', body: { isActive: false } })).status, 403)
    mock.restoreAll()
  }
})

test('suspended, unverified and revoked sessions are rejected', async () => {
  for (const user of [{ ...admin, is_active: false }, { ...admin, is_email_verified: false }, { ...admin, auth_version: 1 }]) {
    authenticateAs(user)
    assert.equal((await request('/users')).status, 401)
    mock.restoreAll()
  }
})

test('user search escapes regex input, bounds pagination, and excludes secrets', async () => {
  authenticateAs(admin)
  let filter
  let projection
  let offset
  const chain = { select(value) { projection = value; return this }, sort() { return this }, skip(value) { offset = value; return this }, limit() { return this }, lean: async () => [{ ...admin, is_active: true }] }
  mock.method(User, 'find', (value) => { filter = value; return chain })
  mock.method(User, 'countDocuments', async () => 1)
  const response = await request('/users?search=a%2B.%2A&page=-3')
  assert.equal(response.status, 200)
  const data = (await response.json()).data
  assert.equal(filter.$or[0].name.$regex, 'a\\+\\.\\*')
  assert.equal(offset, 0)
  assert.match(projection, /-password /)
  assert.match(projection, /-password_reset_token/)
  assert.equal(data.users[0].id, adminId)
})

test('invalid IDs and arbitrary update fields are rejected', async () => {
  authenticateAs(admin)
  assert.equal((await request('/users/invalid', { method: 'PATCH', body: userUpdate })).status, 400)
  assert.equal((await request(`/users/${userId}`, { method: 'PATCH', body: { ...userUpdate, password: 'injected' } })).status, 400)
  assert.equal((await request(`/stores/${userId}`, { method: 'PATCH', body: { isActive: 'false' } })).status, 400)
})

test('admins cannot be demoted/suspended and users cannot be promoted to admin', async () => {
  mock.method(User, 'findById', (id) => id === adminId ? { ...admin, lean: async () => admin } : { _id: userId, role: 'student' })
  assert.equal((await request(`/users/${adminId}`, { method: 'PATCH', body: { ...userUpdate, isActive: false } })).status, 403)
  assert.equal((await request(`/users/${userId}`, { method: 'PATCH', body: { ...userUpdate, role: 'admin' } })).status, 403)
})

test('suspension revokes sessions and clearing restrictions resets trust', async () => {
  const user = { _id: userId, role: 'student', auth_version: 0, save: async () => {} }
  mock.method(User, 'findById', (id) => id === adminId ? { lean: async () => admin } : { ...user, select: () => ({ lean: async () => ({ _id: userId, name: 'Student Updated' }) }), save: async function () { Object.assign(user, this) } })
  const revoked = mock.method(RefreshToken, 'deleteMany', async () => ({}))
  const response = await request(`/users/${userId}`, { method: 'PATCH', body: { ...userUpdate, isActive: false, clearRestriction: true } })
  assert.equal(response.status, 200)
  assert.equal(user.is_active, false)
  assert.equal(user.auth_version, 1)
  assert.equal(user.trust_tier, 'good')
  assert.equal(user.ordering_restricted_until, null)
  assert.equal(revoked.mock.callCount(), 1)
})

test('store status mutation updates only availability', async () => {
  authenticateAs(admin)
  const update = mock.method(Store, 'findByIdAndUpdate', async () => ({ _id: userId, is_active: false }))
  assert.equal((await request(`/stores/${userId}`, { method: 'PATCH', body: { isActive: false } })).status, 200)
  assert.deepEqual(update.mock.calls[0].arguments[1], { is_active: false })
})

test('account changes require current password and revoke access after a successful save', async () => {
  const user = { ...admin, password: await bcrypt.hash('password1234', 4), save: async () => {} }
  mock.method(User, 'findById', () => ({ ...user, lean: async () => admin, save: async function () { Object.assign(user, this) } }))
  mock.method(User, 'exists', async () => null)
  const revoked = mock.method(RefreshToken, 'deleteMany', async () => ({}))
  const body = { name: 'Adarsh', email: 'new@example.com', currentPassword: 'wrong', newPassword: 'NewPassword123' }
  assert.equal((await request('/account', { method: 'PUT', body })).status, 400)
  assert.equal((await request('/account', { method: 'PUT', body: { ...body, currentPassword: 'password1234' } })).status, 200)
  assert.equal(user.email, 'new@example.com')
  assert.equal(user.auth_version, 1)
  assert.equal(await bcrypt.compare('NewPassword123', user.password), true)
  assert.equal(revoked.mock.callCount(), 1)
})

test('refresh cannot restore a suspended user session', async () => {
  const refresh = jwt.sign({ userId: adminId }, process.env.JWT_REFRESH_SECRET)
  mock.method(RefreshToken, 'findOne', async () => ({ _id: userId }))
  mock.method(RefreshToken, 'deleteMany', async () => ({}))
  authenticateAs({ ...admin, is_active: false })
  const response = await fetch(`${base}/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: refresh }) })
  assert.equal(response.status, 401)
})

test('login accepts the requested address while public registration refuses admin', () => {
  assert.equal(loginSchema.safeParse({ email: ' ADARSH@CAMPUSBITE ', password: 'password1234' }).success, true)
  assert.equal(loginSchema.safeParse({ email: 'invalid', password: 'x' }).success, false)
  assert.equal(registerSchema.safeParse({ name: 'Admin', email: 'admin@example.com', password: 'Password123', confirmPassword: 'Password123', role: 'admin' }).success, false)
})

test('seed hashes the requested password and creates a verified administrator', async () => {
  mock.method(User, 'findOne', async () => null)
  const create = mock.method(User, 'create', async () => ({}))
  assert.equal((await seedAdmin()).created, true)
  const values = create.mock.calls[0].arguments[0]
  assert.equal(values.email, 'adarsh@campusbite')
  assert.equal(values.role, 'admin')
  assert.equal(values.is_email_verified, true)
  assert.notEqual(values.password, 'password1234')
  assert.equal(await bcrypt.compare('password1234', values.password), true)
})

test('seed preserves changed credentials and refuses to elevate an existing ordinary user', async () => {
  mock.method(User, 'findOne', async () => ({ role: 'admin', password: 'changed' }))
  const create = mock.method(User, 'create', async () => ({}))
  assert.equal((await seedAdmin()).created, false)
  assert.equal(create.mock.callCount(), 0)
  mock.restoreAll()
  mock.method(User, 'findOne', async () => ({ role: 'student' }))
  await assert.rejects(seedAdmin(), /non-admin/)
})
