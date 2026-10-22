import { PDFDocument } from 'pdfkit';
import { date, day, fail } from './domain.js';
export const titles = { members: 'Miembros', attendance: 'Asistencia por evento', ministries: 'Participación por ministerio', donations: 'Ingresos por periodo' };
export function report(kind, query, all) {
  if (!titles[kind]) fail('Reporte inexistente.', 404);
  const from = query.get('from') ? date(query.get('from')) : '', to = query.get('to') ? date(query.get('to')) : '';
  if (from && to && from > to) fail('La fecha inicial debe ser anterior a la final.');
  const between = d => (!from || d >= from) && (!to || d <= to);
  const members = all('members'), events = all('events');
  const name = id => members.find(m => m.id === Number(id))?.name || 'Anónima';
  let headers, rows, total;
  if (kind === 'members') {
    headers = ['Nombre', 'Teléfono', 'Correo', 'Ingreso', 'Estado', 'Familia'];
    rows = members.filter(m => between(m.joined) && (!query.get('state') || (m.active || 'Activo') === query.get('state'))).map(m => [m.name, m.phone, m.email, m.joined, m.active || 'Activo', m.family || '']);
  } else if (kind === 'attendance') {
    headers = ['Evento', 'Fecha', 'Presentes', 'Ausentes', 'Porcentaje', 'Miembros presentes', 'Miembros ausentes'];
    rows = all('attendance').filter(a => between(a.date) && (!query.get('event') || Number(a.eventId) === Number(query.get('event')))).sort((a, b) => a.date.localeCompare(b.date)).map(a => {
      const p = a.present.length, n = p + a.absent.length;
      return [events.find(e => e.id === Number(a.eventId))?.title || 'Evento', a.date, p, a.absent.length, n ? Math.round(p / n * 100) + '%' : '0%', a.present.map(name).join(', '), a.absent.map(name).join(', ')];
    });
  } else if (kind === 'ministries') {
    headers = ['Ministerio', 'Coordinador', 'Integrantes', 'Actividades del periodo', 'Asistencias de integrantes', 'Nombres'];
    rows = all('ministries').filter(m => !query.get('ministry') || m.id === Number(query.get('ministry'))).map(m => {
      const activities = events.filter(e => Number(e.ministryId) === m.id && e.status !== 'Cancelado' && between(e.date)), ids = new Set(activities.map(e => e.id));
      const appearances = all('attendance').filter(a => ids.has(Number(a.eventId)) && between(a.date)).reduce((s, a) => s + a.present.filter(id => (m.members || []).includes(id)).length, 0);
      return [m.name, m.coordinator, (m.members || []).length, activities.length, appearances, (m.members || []).map(name).join(', ')];
    });
  } else {
    headers = ['Fecha', 'Monto (MXN)', 'Concepto', 'Método', 'Aportante'];
    const selected = all('donations').filter(d => between(d.date));
    total = Math.round(selected.reduce((s, d) => s + Math.round(Number(d.amount) * 100), 0)) / 100;
    rows = selected.sort((a, b) => a.date.localeCompare(b.date)).map(d => [d.date, Number(d.amount), d.concept, d.method, d.memberId ? name(d.memberId) : 'Anónima']);
  }
  return { kind, title: titles[kind], headers, rows, total, from, to, generated: day() };
}
export async function reportPdf(info, settings) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 46, bufferPages: true, info: { Title: `${settings.name} · ${info.title}`, Author: settings.name } });
    const chunks = []; doc.on('data', c => chunks.push(c)); doc.on('error', reject); doc.on('end', () => resolve(Buffer.concat(chunks)));
    const heading = () => {
      if (settings.logo) { try { doc.image(Buffer.from(settings.logo.split(',')[1], 'base64'), 46, 34, { fit: [48, 48] }); } catch { /* Legacy invalid images do not prevent reports. */ } }
      const x = settings.logo ? 108 : 46;
      doc.fillColor('#245d4a').font('Helvetica-Bold').fontSize(settings.name.length > 75 ? 10 : 15).text(settings.name, x, 39, { width: 435, height: 48, ellipsis: true });
      doc.moveTo(46, 98).lineTo(549, 98).strokeColor('#d7e2d5').stroke(); doc.x = 46; doc.y = 115;
    };
    heading(); doc.on('pageAdded', heading);
    doc.fillColor('#203b36').font('Helvetica-Bold').fontSize(20).text(info.title);
    doc.moveDown(0.5).font('Helvetica').fontSize(10).text(`Periodo: ${info.from || 'Inicio'} a ${info.to || 'Todos'} · Generado: ${info.generated}`).text(`${info.rows.length} registros`);
    for (const contact of [settings.address, settings.phone, settings.email]) if (contact) doc.font('Helvetica').fontSize(9).text(contact, { width: 495 });
    if (info.total !== undefined) doc.font('Helvetica-Bold').text(`Total de ingresos: $${info.total.toFixed(2)} MXN`);
    doc.moveDown(); if (!info.rows.length) doc.font('Helvetica').text('No hay registros para los filtros seleccionados.');
    for (const [i, row] of info.rows.entries()) {
      if (doc.y > 690) doc.addPage();
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#245d4a').text(`${i + 1}. ${String(row[0] ?? '')}`, { width: 495 });
      row.slice(1).forEach((value, j) => doc.font('Helvetica').fontSize(9).fillColor('#304538').text(`${info.headers[j + 1]}: ${value === '' || value == null ? '—' : String(value)}`, { width: 495, lineGap: 3 })); doc.moveDown();
    }
    const pages = doc.bufferedPageRange(); doc.removeListener('pageAdded', heading);
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i); doc.font('Helvetica').fontSize(8).fillColor('#7b8979').text('Uso interno de la iglesia', 46, 775, { width: 400, lineBreak: false });
      doc.text(`${i + 1} / ${pages.count}`, 490, 775, { width: 55, lineBreak: false });
    }
    doc.end();
  });
}
