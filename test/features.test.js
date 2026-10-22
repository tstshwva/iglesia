import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import sharp from 'sharp';
import { DatabaseSync } from 'node:sqlite';
import { workbook } from '../public/export.js';

test('Migración, identidad, importación, reportes, usuarios y entrega SMTP', { timeout: 30000 }, async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'siloe-features-')), dbPath = path.join(dir, 'test.sqlite');
  const legacy = new DatabaseSync(dbPath); legacy.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,name TEXT,email TEXT UNIQUE,password TEXT,role TEXT)'); legacy.close();
  let email = '', resolveMail;
  const mailReceived = new Promise(r => resolveMail = r);
  const smtp = net.createServer(socket => {
    socket.write('220 localhost test SMTP\r\n'); let pending = '', inData = false, message = '';
    socket.on('data', data => {
      pending += data.toString(); let i;
      while ((i = pending.indexOf('\r\n')) >= 0) {
        const line = pending.slice(0, i); pending = pending.slice(i + 2);
        if (inData) { if (line === '.') { inData = false; email = message; resolveMail(message); socket.write('250 Accepted\r\n'); } else message += line + '\r\n'; }
        else if (/^EHLO|^HELO/.test(line)) socket.write('250-localhost\r\n250 SIZE 100000\r\n');
        else if (/^DATA/.test(line)) { inData = true; socket.write('354 Send data\r\n'); }
        else if (/^QUIT/.test(line)) socket.end('221 Goodbye\r\n');
        else socket.write('250 OK\r\n');
      }
    });
  });
  await new Promise(r => smtp.listen(0, '127.0.0.1', r));
  const child = spawn(process.execPath, ['server.js'], { env: { ...process.env, HOST: '127.0.0.1', PORT: '0', DB_PATH: dbPath, NODE_ENV: 'test', SETUP_TOKEN: '', RESET_WEBHOOK: '', SMTP_HOST: '127.0.0.1', SMTP_PORT: String(smtp.address().port), SMTP_USER: '', SMTP_PASSWORD: '', MAIL_FROM: 'Iglesia <no-reply@example.test>', SMTP_REQUIRE_TLS: 'false' } });
  let cookie = '', base, stderr = ''; child.stderr.on('data', c => stderr += c);
  try {
    base = await new Promise((resolve, reject) => { child.stdout.on('data', c => { const m = /http:\/\/127\.0\.0\.1:\d+/.exec(c.toString()); if (m) resolve(m[0]); }); child.once('error', reject); child.once('exit', () => reject(Error(stderr || 'No arrancó el servidor.'))); });
    const request = async (p, method = 'GET', body, auth = cookie) => {
      const r = await fetch(base + '/api/' + p, { method, signal: AbortSignal.timeout(10000), headers: { 'Content-Type': 'application/json', cookie: auth }, body: body ? JSON.stringify(body) : undefined });
      return { status: r.status, data: r.headers.get('Content-Type')?.includes('application/json') ? await r.json() : Buffer.from(await r.arrayBuffer()), cookie: r.headers.get('set-cookie')?.split(';')[0] };
    };
    assert.equal((await request('status')).data.version, '2.1.0');
    assert.equal((await request('setup', 'POST', { name: 'Administrador', email: 'admin@example.test', password: 'Password12345!', recoveryEmail: 'Backup@EXAMPLE.test', recoveryPhone: '+52 555 123 4567' })).status, 201);
    cookie = (await request('login', 'POST', { email: 'admin@example.test', password: 'Password12345!' })).cookie;
    const image = 'data:image/png;base64,' + (await sharp({ create: { width: 48, height: 48, channels: 4, background: '#245d4a' } }).png().toBuffer()).toString('base64');
    const config = { name: 'Iglesia de Prueba', address: 'Dirección de prueba', phone: '5551234567', email: 'contacto@example.test', schedule: 'Domingos 10:00', logo: image, cover: image };
    assert.equal((await request('settings', 'PUT', config)).status, 200);
    const branding = (await request('branding', 'GET', undefined, '')).data;
    assert.equal(branding.name, config.name); assert.ok(branding.logo.startsWith('data:image/png;base64,')); assert.ok(!('email' in branding));
    assert.equal((await request('settings', 'PUT', { ...config, logo: 'data:image/png;base64,bm90LWFuLWltYWdl' })).status, 400);
    assert.equal((await request('members', 'POST', { name: 'Ana López', email: 'ana@example.test' })).status, 201);
    assert.equal((await request('members', 'POST', { name: 'Ana Lopez' })).status, 409);
    assert.equal((await request('members', 'POST', { name: 'Ana Lopez', confirmDuplicate: true })).status, 201);
    assert.equal((await request('members', 'POST', { name: 'Fecha mala', joined: '2026-02-30' })).status, 400);
    const book = await workbook([['Nombre', 'Correo', 'Fecha de ingreso', 'Familia'], ['Ana López', 'ana@example.test', '2026-10-21', 'López'], ['Carlos Prueba', '', '', 'Pérez'], ['Elena Prueba', 'elena@example.test', '', 'Pérez'], ['Correo malo', 'invalido', '', '']]).arrayBuffer();
    const preview = (await request('members/import/preview', 'POST', { type: 'xlsx', content: Buffer.from(book).toString('base64') })).data;
    assert.equal(preview.ready, 2); assert.equal(preview.duplicates, 1); assert.equal(preview.errors, 1);
    const commit = (await request('members/import/commit', 'POST', { token: preview.token })).data; assert.equal(commit.imported, 2);
    assert.equal((await request('members/import/commit', 'POST', { token: preview.token })).status, 400);
    const members = (await request('members')).data, ana = members[0];
    const ministry = await request('ministries', 'POST', { name: 'Música', coordinator: 'Coordinador', members: [ana.id] }); assert.equal(ministry.status, 201);
    const event = await request('events', 'POST', { title: 'Ensayo', date: '2026-10-21', time: '18:00', place: 'Templo', responsible: 'Coordinador', ministryId: ministry.data.id }); assert.equal(event.status, 201);
    assert.equal((await request('attendance', 'POST', { eventId: event.data.id, date: '2026-10-21', present: [ana.id], absent: [] })).status, 201);
    const participation = (await request('reports/ministries?from=2026-10-01&to=2026-10-31')).data; assert.equal(participation.rows[0][3], 1); assert.equal(participation.rows[0][4], 1);
    assert.equal((await request('reports/members?from=2026-10-31&to=2026-10-01')).status, 400);
    assert.equal((await request('donations', 'POST', { date: '2026-10-21', amount: 100.25, concept: 'Ofrenda', method: 'Efectivo' })).status, 201);
    const report = await request('reports/donations?from=2026-10-01&to=2026-10-31'); assert.equal(report.data.total, 100.25); assert.equal(report.data.rows[0][4], 'Anónima');
    const pdf = await request('reports/members/pdf'); assert.equal(pdf.status, 200); assert.equal(pdf.data.subarray(0, 4).toString(), '%PDF');
    const admin = (await request('users')).data[0]; assert.equal(admin.recoveryEmail, 'backup@example.test'); assert.equal(admin.recoveryPhone, '+52 555 123 4567'); assert.equal((await request('users/' + admin.id, 'PUT', { ...admin, active: false })).status, 400);
    assert.equal((await request('users', 'POST', { name: 'Inválido', email: 'invalid@example.test', password: 'Password12345!', role: 'secretario', recoveryEmail: 'mal' })).status, 400);
    assert.equal((await request('users', 'POST', { name: 'Coordinador', email: 'coord@example.test', password: 'Password12345!', role: 'coordinador', recoveryEmail: 'coord-backup@example.test', recoveryPhone: '5551234567' })).status, 201);
    const coordinator = (await request('users')).data[1], session = (await request('login', 'POST', { email: 'coord@example.test', password: 'Password12345!' })).cookie;
    assert.equal(coordinator.recoveryEmail, 'coord-backup@example.test');
    assert.equal((await request('account/recovery', 'PUT', { current: 'incorrecta', recoveryEmail: 'new@example.test' }, session)).status, 403);
    assert.equal((await request('account/recovery', 'PUT', { current: 'Password12345!', recoveryPhone: 'abc' }, session)).status, 400);
    assert.equal((await request('account/recovery', 'PUT', { current: 'Password12345!', recoveryEmail: 'New@EXAMPLE.test', recoveryPhone: '+52 555 765 4321' }, session)).status, 200);
    assert.equal((await request('me', 'GET', undefined, session)).data.recoveryEmail, 'new@example.test');
    assert.equal((await request('me')).data.recoveryEmail, 'backup@example.test');
    assert.equal((await request('reports/donations', 'GET', undefined, session)).status, 403);
    assert.equal((await request('members/import/preview', 'POST', { type: 'csv', content: '' }, session)).status, 403);
    assert.equal((await request('users/' + coordinator.id, 'PUT', { ...coordinator, role: 'secretario' })).status, 200);
    assert.equal((await request('me', 'GET', undefined, session)).status, 401);
    const secretary = (await request('login', 'POST', { email: 'coord@example.test', password: 'Password12345!' })).cookie;
    assert.equal((await request('users/' + coordinator.id, 'PUT', { ...coordinator, active: false })).status, 200);
    assert.equal((await request('me', 'GET', undefined, secretary)).status, 401);
    assert.equal((await request('login', 'POST', { email: 'coord@example.test', password: 'Password12345!' })).status, 401);
    assert.equal((await request('forgot', 'POST', { email: 'admin@example.test' })).status, 200);
    await mailReceived;
    const firstMail = email.replace(/=\r\n/g, '').replace(/=3D/g, '='), oldToken = /restablecer=([a-f0-9]{64})/.exec(firstMail)?.[1];
    assert.ok(oldToken); assert.ok(firstMail.includes('To: backup@example.test')); assert.ok(!firstMail.includes('To: admin@example.test'));
    assert.equal((await request('account/recovery', 'PUT', { current: 'Password12345!', recoveryEmail: 'second-backup@example.test', recoveryPhone: '' })).status, 200);
    assert.equal((await request('me')).data.recoveryPhone, '');
    assert.equal((await request('reset', 'POST', { token: oldToken, password: 'ChangedPassword123!' })).status, 400);
    assert.equal((await request('forgot', 'POST', { email: 'admin@example.test' })).status, 200);
    const decoded = email.replace(/=\r\n/g, '').replace(/=3D/g, '='), token = /restablecer=([a-f0-9]{64})/.exec(decoded)?.[1]; assert.ok(token); assert.ok(decoded.includes('To: second-backup@example.test'));
    assert.equal((await request('reset', 'POST', { token, password: 'ChangedPassword123!' })).status, 200);
    assert.equal((await request('me')).status, 401);
  } finally {
    if (child.exitCode === null) { const exit = new Promise(r => child.once('exit', r)); child.kill(); await exit; }
    await new Promise(r => smtp.close(r)); rmSync(dir, { recursive: true, force: true });
  }
});
