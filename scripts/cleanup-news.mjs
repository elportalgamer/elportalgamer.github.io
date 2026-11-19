import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),file=path.join(root,'news.json');
const payload=JSON.parse(await fs.readFile(file,'utf8'));const items=Array.isArray(payload)?payload:payload.items||[];
const remaining=[];
for(const item of items){
  if(Date.parse(item.expiresAt)>Date.now()){remaining.push(item);continue;}
  if(typeof item.image==='string'&&/^news-images\/[a-f0-9]{16}\.png$/.test(item.image)){
    const imagePath=path.resolve(root,item.image),allowed=path.resolve(root,'news-images')+path.sep;
    if(!imagePath.startsWith(allowed))throw Error('Image outside news-images');
    await fs.unlink(imagePath).catch(error=>{if(error.code!=='ENOENT')throw error;});
  }
}
await fs.writeFile(file,JSON.stringify({items:remaining},null,2)+'\n');
console.log('Initial news backup:',remaining.length,'unexpired stories. Live archive is kept in the news service, not in Git.');
