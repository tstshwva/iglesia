import { readSheet } from 'read-excel-file/node';
import { member, duplicate, normalized, fail } from './domain.js';

export function csv(text) {
  const sep = (text.split(/\r?\n/)[0].match(/;/g) || []).length > (text.split(/\r?\n/)[0].match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], cell = '', quote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quote && text[i + 1] === '"') { cell += '"'; i++; } else quote = !quote; }
    else if (c === sep && !quote) { row.push(cell); cell = ''; }
    else if ((c === '\n' || c === '\r') && !quote) { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (quote) fail('Hay comillas sin cerrar en el CSV.');
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
// Bound archive expansion before the spreadsheet library allocates decompressed XML.
function validateZip(buffer) {
  let end = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) if (buffer.readUInt32LE(i) === 0x06054b50) { end = i; break; }
  if (end < 0) fail('Archivo Excel inválido. Usa un libro .xlsx.');
  const count = buffer.readUInt16LE(end + 10); let pos = buffer.readUInt32LE(end + 16), total = 0;
  if (count > 250 || count === 65535) fail('El libro tiene demasiados archivos internos.');
  for (let i = 0; i < count; i++) {
    if (pos + 46 > buffer.length || buffer.readUInt32LE(pos) !== 0x02014b50) fail('Estructura de Excel inválida.');
    total += buffer.readUInt32LE(pos + 24);
    if (total > 20e6) fail('El libro descomprimido supera 20 MB.');
    pos += 46 + buffer.readUInt16LE(pos + 28) + buffer.readUInt16LE(pos + 30) + buffer.readUInt16LE(pos + 32);
  }
}
export async function previewImport(body, existing) {
  if (!['xlsx', 'csv'].includes(body.type) || typeof body.content !== 'string') fail('Selecciona un archivo .xlsx o .csv.');
  const buffer = Buffer.from(body.content, 'base64');
  if (buffer.length > 2e6 || buffer.length < 1) fail('El archivo debe pesar menos de 2 MB.');
  let rows;
  if (body.type === 'xlsx') { validateZip(buffer); rows = await readSheet(buffer); }
  else rows = csv(buffer.toString('utf8').replace(/^\ufeff/, ''));
  if (rows.length < 2 || rows.length > 1001) fail('Carga entre 1 y 1000 miembros por archivo.');
  const aliases = { nombre: 'name', 'nombre completo': 'name', name: 'name', telefono: 'phone', phone: 'phone', correo: 'email', email: 'email', 'fecha de ingreso': 'joined', ingreso: 'joined', joined: 'joined', estado: 'active', active: 'active', familia: 'family', family: 'family' };
  const headers = rows[0].map(h => aliases[normalized(h)]);
  if (!headers.includes('name')) fail('El archivo necesita una columna Nombre.');
  if (new Set(headers.filter(Boolean)).size !== headers.filter(Boolean).length) fail('Hay columnas repetidas.');
  const accepted = [], result = [];
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i].some(v => v !== null && String(v).trim())) continue;
    let b = {};
    try {
      headers.forEach((k, j) => { if (k && rows[i][j] !== null && rows[i][j] !== undefined) b[k] = rows[i][j] instanceof Date ? rows[i][j].toISOString().slice(0, 10) : String(rows[i][j]).trim(); });
      if (b.active) b.active = normalized(b.active) === 'inactivo' ? 'Inactivo' : normalized(b.active) === 'activo' ? 'Activo' : b.active;
      b = member(b);
      const match = duplicate(b, [...existing, ...accepted]);
      if (match) result.push({ row: i + 1, member: b, status: 'duplicado', message: `Ya existe: ${match.name}` });
      else { accepted.push(b); result.push({ row: i + 1, member: b, status: 'listo', message: 'Listo para importar' }); }
    } catch (e) { result.push({ row: i + 1, member: b, status: 'error', message: e.message }); }
  }
  return { rows: result, ready: accepted.length, duplicates: result.filter(r => r.status === 'duplicado').length, errors: result.filter(r => r.status === 'error').length };
}
