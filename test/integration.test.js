import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
test('Autenticación, permisos, registros e historial',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'siloe-'));const child=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:'3199',DB_PATH:path.join(dir,'test.sqlite'),RESET_WEBHOOK:'',SETUP_TOKEN:''}});let cookie='',stdout='';child.stdout.on('data',d=>stdout+=d);
 try{await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',()=>reject(Error('Servidor detenido')))});
 const req=async(p,method='GET',b,auth=cookie)=>{const r=await fetch('http://127.0.0.1:3199/api/'+p,{method,headers:{'Content-Type':'application/json',cookie:auth},body:b?JSON.stringify(b):undefined});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}};
 assert.equal((await req('members')).status,401);
 assert.equal((await req('setup','POST',{name:'Admin',email:'admin@example.test',password:'Password12345!'})).status,201);
 assert.equal((await req('setup','POST',{})).status,403);
 assert.equal((await req('login','POST',{email:'admin@example.test',password:'wrong'})).status,401);
 const login=await req('login','POST',{email:'admin@example.test',password:'Password12345!'});cookie=login.cookie;assert.equal(login.status,200);
 assert.equal((await req('members','POST',{name:'Ana',joined:'2026-10-21',active:'Activo'})).status,201);
 const m=(await req('members')).body[0];assert.equal((await req('members/'+m.id,'PUT',{...m,active:'Inactivo'})).status,200);assert.equal((await req('members')).body[0].active,'Inactivo');
 assert.equal((await req('members/'+m.id,'DELETE')).status,400);
 const event=await req('events','POST',{title:'Culto',date:'2026-10-21',time:'10:00',place:'Templo'});assert.equal(event.status,201);
 const attendance={eventId:event.body.id,date:'2026-10-21',present:[m.id],absent:[]};assert.equal((await req('attendance','POST',attendance)).status,201);assert.equal((await req('attendance','POST',attendance)).status,400);
 assert.equal((await req('donations','POST',{date:'2026-10-21',amount:-1,concept:'Diezmo',method:'Efectivo'})).status,400);
 assert.equal((await req('donations','POST',{date:'2026-10-21',amount:100,concept:'Ofrenda',method:'Efectivo'})).status,201);
 for(const role of ['pastor','secretario','tesorero','coordinador']){
 assert.equal((await req('users','POST',{name:role,email:role+'@example.test',password:'Password12345!',role})).status,201);
 const l=await req('login','POST',{email:role+'@example.test',password:'Password12345!'});const c=l.cookie;
 assert.equal((await req('donations','GET',undefined,c)).status,role==='tesorero'?200:403);
 assert.equal((await req('users','GET',undefined,c)).status,403);
 assert.equal((await req('settings','PUT',{name:'Cambio'},c)).status,403);
 assert.equal((await req('members','POST',{name:'Otra',joined:'2026-10-21'},c)).status,['pastor','secretario'].includes(role)?201:403);
 }
 assert.equal((await req('members','POST',{name:'CSRF',joined:'2026-10-21'},'')).status,401);
 await req('logout','POST');assert.equal((await req('me')).status,401);
 assert.equal((await req('forgot','POST',{email:'admin@example.test'})).status,200);
 await new Promise(r=>setTimeout(r,30));const resetToken=/Recuperación local para admin@example.test: ([a-f0-9]+)/.exec(stdout)?.[1];assert.ok(resetToken);
 const oldSession=await req('login','POST',{email:'admin@example.test',password:'Password12345!'});cookie=oldSession.cookie;
 assert.equal((await req('reset','POST',{token:resetToken,password:'NewPassword12345!'})).status,200);
 assert.equal((await req('me')).status,401);
 assert.equal((await req('reset','POST',{token:resetToken,password:'AnotherPassword123!'})).status,400);
 assert.equal((await req('login','POST',{email:'admin@example.test',password:'Password12345!'})).status,401);
 assert.equal((await req('login','POST',{email:'admin@example.test',password:'NewPassword12345!'})).status,200);
 }finally{child.kill();await new Promise(r=>child.once('exit',r));rmSync(dir,{recursive:true,force:true})}
});
