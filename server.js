import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
mkdirSync(path.join(root,'data'),{recursive:true});
const db=new DatabaseSync(process.env.DB_PATH||path.join(root,'data','church.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER REFERENCES users(id),expires INTEGER);
CREATE TABLE IF NOT EXISTS resets(token TEXT PRIMARY KEY,user_id INTEGER REFERENCES users(id),expires INTEGER);
CREATE TABLE IF NOT EXISTS records(id INTEGER PRIMARY KEY,kind TEXT NOT NULL,body TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY CHECK(id=1),body TEXT NOT NULL);`);
const roles=['administrador','pastor','secretario','tesorero','coordinador'];
const permissions={members:['administrador','pastor','secretario'],events:['administrador','pastor','secretario','coordinador'],attendance:['administrador','pastor','secretario','coordinador'],ministries:['administrador','pastor','secretario','coordinador'],donations:['administrador','tesorero'],announcements:['administrador','pastor','secretario'],settings:['administrador'],users:['administrador']};
const hash=p=>{const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(p,salt,64).toString('hex')};
const valid=(p,h)=>{const [s,k]=h.split(':');return timingSafeEqual(scryptSync(p,s,64),Buffer.from(k,'hex'))};
const digest=t=>createHash('sha256').update(t).digest('hex');
const all=kind=>db.prepare('SELECT id,body FROM records WHERE kind=?').all(kind).map(r=>({...JSON.parse(r.body),id:r.id}));
const save=(kind,b,id)=>id?db.prepare('UPDATE records SET body=? WHERE kind=? AND id=?').run(JSON.stringify(b),kind,id):db.prepare('INSERT INTO records(kind,body) VALUES(?,?)').run(kind,JSON.stringify(b));
if(!db.prepare('SELECT id FROM settings').get())db.prepare('INSERT INTO settings VALUES(1,?)').run(JSON.stringify({name:'Siloé - Iglesia Presbiteriana',address:'',phone:'',email:'',schedule:'Domingos 10:00',logo:''}));
const attempts=new Map();
function throttle(ip){const now=Date.now(),v=attempts.get(ip)||{n:0,t:now};if(now-v.t>900000){v.n=0;v.t=now}v.n++;attempts.set(ip,v);if(v.n>30)throw Error('Demasiados intentos. Espera 15 minutos.')}
function validate(kind,b){
 const required={members:['name','joined'],events:['title','date','time','place'],ministries:['name'],donations:['date','amount','concept','method'],announcements:['title','description','date'],attendance:['eventId','date','present','absent']}[kind]||[];
 for(const k of required)if(b[k]===undefined||b[k]==='')throw Error('Falta el campo: '+k);
 if(kind==='donations'&&(!Number.isFinite(Number(b.amount))||Number(b.amount)<=0))throw Error('El monto debe ser mayor que cero');
 if(b.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email))throw Error('Correo inválido');
 if(kind==='members'&&b.active&&!['Activo','Inactivo'].includes(b.active))throw Error('Estado de miembro inválido');
 if(kind==='events'&&b.status&&!['Programado','Cancelado'].includes(b.status))throw Error('Estado de evento inválido');
 if(kind==='events'&&b.ministryId&&!all('ministries').some(m=>m.id===Number(b.ministryId)))throw Error('Ministerio inexistente');
 if(kind==='ministries'&&(!Array.isArray(b.members||[])||(b.members||[]).some(id=>!all('members').some(m=>m.id===id))))throw Error('Integrantes inválidos');
 if(kind==='donations'&&b.memberId&&!all('members').some(m=>m.id===Number(b.memberId)))throw Error('Miembro inexistente');
 if(kind==='attendance'){
 if(!all('events').some(e=>e.id===Number(b.eventId)))throw Error('Evento inexistente');
 if(!Array.isArray(b.present)||!Array.isArray(b.absent))throw Error('Lista de asistencia inválida');
 const ids=new Set(all('members').map(m=>m.id));const both=[...b.present,...b.absent];if(new Set(both).size!==both.length||both.some(id=>!ids.has(id)))throw Error('Miembros de asistencia inválidos');
 }
}
async function jsonBody(req){let s='';for await(const c of req){s+=c;if(s.length>2e6)throw Error('Solicitud demasiado grande')}return JSON.parse(s||'{}')}
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
 res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data: https://images.unsplash.com; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
 const send=(code,b)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(b))};
 try{
 const url=new URL(req.url,'http://localhost'),p=url.pathname,method=req.method;
 if(!p.startsWith('/api/')){const names={'/':'index.html','/app.js':'app.js','/export.js':'export.js','/style.css':'style.css'};const f=names[p];if(!f){res.writeHead(404);return res.end('No encontrado')}res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html; charset=utf-8');return res.end(readFileSync(path.join(root,'public',f)))}
 if(!['GET','HEAD'].includes(method)&&req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)return send(403,{error:'Origen rechazado'});
 if(p==='/api/status')return send(200,{setup:!db.prepare('SELECT id FROM users LIMIT 1').get()});
 if(p==='/api/setup'&&method==='POST'){
 if(db.prepare('SELECT id FROM users LIMIT 1').get())return send(403,{error:'Configuración ya realizada'});
 if(process.env.SETUP_TOKEN&&req.headers['x-setup-token']!==process.env.SETUP_TOKEN)return send(403,{error:'Token de instalación requerido'});
 const b=await jsonBody(req);if(!b.name||!/^\S+@\S+\.\S+$/.test(b.email)||b.password?.length<12)throw Error('Nombre, correo y contraseña de 12 caracteres requeridos');
 db.prepare('INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)').run(b.name,b.email.toLowerCase(),hash(b.password),'administrador');return send(201,{ok:true});}
 if(p==='/api/login'&&method==='POST'){throttle(req.socket.remoteAddress);const b=await jsonBody(req),u=db.prepare('SELECT * FROM users WHERE email=?').get(String(b.email).toLowerCase());if(!u||!valid(String(b.password),u.password))return send(401,{error:'Correo o contraseña incorrectos'});const t=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(digest(t),u.id,Date.now()+28800000);res.setHeader('Set-Cookie',`session=${t}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.COOKIE_SECURE==='true'?'; Secure':''}`);return send(200,{ok:true})}
 if(p==='/api/forgot'&&method==='POST'){throttle(req.socket.remoteAddress);const b=await jsonBody(req),u=db.prepare('SELECT * FROM users WHERE email=?').get(String(b.email).toLowerCase());if(u){const t=randomBytes(32).toString('hex');db.prepare('DELETE FROM resets WHERE user_id=?').run(u.id);db.prepare('INSERT INTO resets VALUES(?,?,?)').run(digest(t),u.id,Date.now()+1800000);if(process.env.RESET_WEBHOOK){await fetch(process.env.RESET_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.RESET_WEBHOOK_SECRET||''}`},body:JSON.stringify({email:u.email,token:t,expiresMinutes:30})})}else console.log('Recuperación local para '+u.email+': '+t)}return send(200,{message:'Si el correo está registrado, recibirás instrucciones. En instalación local, consulta al administrador.'})}
 if(p==='/api/reset'&&method==='POST'){throttle(req.socket.remoteAddress);const b=await jsonBody(req),r=db.prepare('SELECT * FROM resets WHERE token=? AND expires>?').get(digest(String(b.token)),Date.now());if(!r||b.password?.length<12)throw Error('Token inválido o contraseña menor de 12 caracteres');db.prepare('UPDATE users SET password=? WHERE id=?').run(hash(b.password),r.user_id);db.prepare('DELETE FROM resets WHERE user_id=?').run(r.user_id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(r.user_id);return send(200,{ok:true})}
 const token=/session=([^;]+)/.exec(req.headers.cookie||'')?.[1]||'';
 const u=db.prepare('SELECT u.id,u.name,u.email,u.role FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?').get(digest(token),Date.now());if(!u)return send(401,{error:'Inicia sesión'});
 if(p==='/api/me')return send(200,{...u,permissions:Object.keys(permissions).filter(k=>permissions[k].includes(u.role))});
 if(p==='/api/logout'){db.prepare('DELETE FROM sessions WHERE token=?').run(digest(token));res.setHeader('Set-Cookie','session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return send(200,{ok:true})}
 if(p==='/api/settings'){
 if(method==='GET')return send(200,JSON.parse(db.prepare('SELECT body FROM settings WHERE id=1').get().body));
 if(u.role!=='administrador')return send(403,{error:'Acceso restringido'});const b=await jsonBody(req);if(!b.name)throw Error('Nombre requerido');if(b.logo&&!/^data:image\/(png|jpeg|webp);base64,/.test(b.logo))throw Error('Usa logotipo PNG, JPEG o WebP');db.prepare('UPDATE settings SET body=? WHERE id=1').run(JSON.stringify(b));return send(200,{ok:true})}
 if(p==='/api/users'){
 if(u.role!=='administrador')return send(403,{error:'Acceso restringido'});
 if(method==='GET')return send(200,db.prepare('SELECT id,name,email,role FROM users').all());
 const b=await jsonBody(req);if(!b.name||!/^\S+@\S+\.\S+$/.test(b.email)||!roles.includes(b.role)||b.password?.length<12)throw Error('Revisa nombre, correo, rol y contraseña (12 caracteres)');db.prepare('INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)').run(b.name,b.email.toLowerCase(),hash(b.password),b.role);return send(201,{ok:true})}
 const m=/^\/api\/(members|events|attendance|ministries|donations|announcements)(?:\/(\d+))?$/.exec(p);
 if(!m)return send(404,{error:'Ruta inexistente'});const kind=m[1],id=Number(m[2]);
 if(kind==='donations'&&!permissions.donations.includes(u.role))return send(403,{error:'Acceso financiero restringido'});
 if(method==='GET')return send(200,all(kind));
 if(!permissions[kind].includes(u.role))return send(403,{error:'Tu rol no permite esta operación'});
 if(id&&!db.prepare('SELECT id FROM records WHERE id=? AND kind=?').get(id,kind))return send(404,{error:'Registro inexistente'});
 if(method==='DELETE'){if(kind!=='announcements')throw Error('Utiliza desactivar o cancelar para conservar el historial');db.prepare('DELETE FROM records WHERE id=? AND kind=?').run(id,kind);return send(200,{ok:true})}
 if(!['POST','PUT'].includes(method))return send(405,{error:'Método no permitido'});
 const b=await jsonBody(req);delete b.id;validate(kind,b);if(kind==='attendance'&&all(kind).some(a=>a.id!==id&&Number(a.eventId)===Number(b.eventId)&&a.date===b.date))throw Error('Ya existe asistencia para este evento y fecha');const result=save(kind,b,id);return send(id?200:201,{ok:true,id:id||Number(result.lastInsertRowid)});
 }catch(e){send(400,{error:e.message.includes('UNIQUE')?'El correo ya está registrado':e.message})}
});
server.listen(Number(process.env.PORT)||3000,process.env.HOST||'127.0.0.1',()=>console.log('Aplicación disponible en http://localhost:'+(process.env.PORT||3000)));

