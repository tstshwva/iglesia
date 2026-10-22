import {test} from 'node:test';
import assert from 'node:assert/strict';
import {workbook} from '../public/export.js';
test('Excel válido en formato ZIP y texto de celdas escapado',async()=>{
 const b=Buffer.from(await workbook([['Nombre','Monto'],['Ana & <Luis>','=1+1']]).arrayBuffer());
 let i=0;const files={};while(b.readUInt32LE(i)===0x04034b50){const size=b.readUInt32LE(i+18),n=b.readUInt16LE(i+26),extra=b.readUInt16LE(i+28),name=b.subarray(i+30,i+30+n).toString(),start=i+30+n+extra;files[name]=b.subarray(start,start+size).toString();i=start+size}
 assert.equal(Object.keys(files).length,5);assert.ok(files['[Content_Types].xml']);assert.match(files['xl/worksheets/sheet1.xml'],/Ana &amp; &lt;Luis&gt;/);assert.match(files['xl/worksheets/sheet1.xml'],/t="inlineStr"/);assert.ok(!files['xl/worksheets/sheet1.xml'].includes('<f>'));assert.equal(b.readUInt32LE(b.length-22),0x06054b50);
});
