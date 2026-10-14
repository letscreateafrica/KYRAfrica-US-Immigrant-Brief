import fs from 'node:fs';
import path from 'node:path';
const root=path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
const staging=path.join(root,'src');
const dist=path.join(root,'dist');
for(const d of ['data','posters','briefs','legacy'])fs.mkdirSync(path.join(dist,d),{recursive:true});
const data=JSON.parse(fs.readFileSync(path.join(root,'content.json'),'utf8'));
for(const f of ['index.html','styles.css','app.js'])fs.copyFileSync(path.join(staging,f),path.join(dist,f));
for(const f of fs.readdirSync(path.join(staging,'posters')))fs.copyFileSync(path.join(staging,'posters',f),path.join(dist,'posters',f));
fs.writeFileSync(path.join(dist,'data/content.json'),JSON.stringify(data,null,2));
fs.writeFileSync(path.join(root,'content.json'),JSON.stringify(data,null,2));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function coverageHtml(date){
const record=(data.coverageRecords||[]).find(row=>row.date===date);if(!record)return '';
const byId=new Map(record.sources.map(source=>[source.id,source]));
const label=review=>review==='partial_official_source_checked'?'One official source checked':review==='official_source_checked'?'Official source checked':review==='checked_no_verified_update'?'Checked; no verified update':'Not individually checked';
const group=(title,rows)=>`<details open><summary><strong>${esc(title)} · ${rows.length} listed</strong></summary><ul>${rows.map(row=>`<li><strong>${esc(row.name)}</strong> — ${esc(label(row.review))}. ${esc(row.note||'')}${row.sourceIds.map(id=>{const source=byId.get(id);return source?` <a href="${esc(source.url)}" rel="noreferrer">${esc(source.title)} ↗</a>`:''}).join('')}</li>`).join('')}</ul></details>`;
return `<section class="wrap section edition-detail" id="jurisdictions"><h2>All jurisdictions: coverage record</h2><p class="notice">${esc(record.method)}</p>${group('African countries',record.africa)}${group('U.S. states and DC',record.unitedStates)}${group('Federal and regional source areas',record.federal)}<p class="meta">${esc(record.date)} · ${esc(record.reviewedBy)}</p></section>`;
}
function posterLines(value){
  const words=String(value).replace(/[.;:!?]+$/,'').split(/\s+/);
  const lines=[];
  for(const word of words){
    if(!lines.length||lines.at(-1).length+word.length+1>23)lines.push(word);
    else lines[lines.length-1]+=' '+word;
  }
  return lines.slice(0,4);
}
for(const e of data.editions){if(fs.existsSync(path.join(staging,'posters',e.id+'.svg'))||(e.id<'2026-10-12'&&fs.existsSync(path.join(dist,'posters',e.id+'.svg'))))continue;const title=posterLines(e.title);const posterType=e.id==='2026-10-09'?'Verified notice':e.type;const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" role="img" aria-label="Editorial poster for ${e.date}"><rect width="600" height="750" fill="#154e40"/><circle cx="560" cy="120" r="170" fill="#e5b75c"/><circle cx="410" cy="320" r="190" fill="none" stroke="#719386"/><text x="48" y="70" fill="#fff" font-family="sans-serif" font-size="23">KnowYourRights Africa</text><text x="48" y="150" fill="#e5b75c" font-family="sans-serif" font-size="18">${esc(e.date)} · ${esc(posterType)}</text>${title.map((t,i)=>`<text x="48" y="${300+i*64}" fill="#fff" font-family="Georgia,serif" font-size="34">${esc(t)}</text>`).join('')}<path d="M48 575h504" stroke="#719386"/><text x="48" y="625" fill="#fff" font-family="sans-serif" font-size="19">Read the full brief. Follow the sources.</text><text x="48" y="690" fill="#fff" font-family="sans-serif" font-size="15">Editorial illustration · not documentary evidence</text></svg>`;fs.writeFileSync(path.join(dist,'posters',e.id+'.svg'),svg);}
for(const e of data.editions.filter(e=>e.type!=='Legacy archive')){
const pillars=['U.S. Immigrant Brief','African Diaspora Brief','Policy Alerts'];
const itemHtml=i=>`<article><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p><p><strong>Jurisdiction:</strong> ${esc(i.place)} · <strong>Source date:</strong> ${esc(i.newsDate||e.date)}</p>${i.affectedPeople?`<p><strong>Affected people:</strong> ${esc(i.affectedPeople)}</p>`:''}${i.diasporaRelevance?`<p><strong>U.S. diaspora relevance:</strong> ${esc(i.diasporaRelevance)}</p>`:''}${i.effectiveDate?`<p><strong>Status and effective date:</strong> ${esc(i.status)} · ${esc(i.effectiveDate)}</p>`:''}${i.uncertainty?`<p><strong>Uncertainty:</strong> ${esc(i.uncertainty)}</p>`:''}${i.reviewedBy?`<p>${esc(i.reviewedBy)}</p>`:''}${i.sources.map(source=>`<p><a href="${esc(source.url)}" rel="noreferrer">${esc(source.title)}</a> · Checked ${esc(source.checked)}</p>`).join('')}</article>`;
const sectionHtml=(topic,index)=>{const items=e.items.filter(i=>i.topic===topic);const alerts=topic==='Policy Alerts'?data.alerts.filter(a=>a.newsDate===e.date):[];return `<section><h2>${String(index+1).padStart(2,'0')} / ${esc(topic)}</h2>${items.map(itemHtml).join('')}${alerts.map(a=>`<article><h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p><p>${esc(a.impact)}</p><p><strong>Jurisdiction:</strong> ${esc(a.jurisdiction)} · <strong>Status:</strong> ${esc(a.status)} · <strong>Effective date:</strong> ${esc(a.effectiveDate)}</p><p><strong>U.S. diaspora relevance:</strong> ${esc(a.diasporaRelevance)}</p><p>${esc(a.reviewedBy)}</p>${a.sources.map(source=>`<p><a href="${esc(source.url)}" rel="noreferrer">${esc(source.title)}</a> · Checked ${esc(source.checked)}</p>`).join('')}</article>`).join('')}${items.length||alerts.length?'':'<p>No qualifying verified item from the sources checked for this section. Other sources and jurisdictions may have updates.</p>'}</section>`};
const fallback=`<section class="wrap section edition-detail" id="static-edition"><a href="/#archive">← All editions</a><p class="tag">${esc(e.date)} · ${esc(e.type)}</p><h1>${esc(e.title)}</h1><p>${esc(e.summary)}</p><p class="notice">${esc(data.coverage)}</p>${pillars.map(sectionHtml).join('')}<p>Editorial poster: <a href="/posters/${e.id}.svg">download</a>. Illustration, not evidence.</p><p>General information, not individual legal advice.</p></section>`;
const base=fs.readFileSync(path.join(dist,'index.html'),'utf8');
fs.writeFileSync(path.join(dist,'briefs',e.id+'.html'),base.replace('<div id="home">','<div id="home" class="hidden">').replace('<section id="detail"',fallback+'<section id="detail"').replace('<section class="wrap section" id="standards">',coverageHtml(e.date)+'<section class="wrap section" id="standards">').replace('Interactive search needs JavaScript.','This edition is available above without JavaScript.'));
}
const e=data.editions[0];
const base=fs.readFileSync(path.join(dist,'index.html'),'utf8');
fs.writeFileSync(path.join(dist,'latest-brief/index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><title>Latest KnowYourRights Africa brief</title><meta http-equiv="refresh" content="0;url=/briefs/${e.id}.html"><a href="/briefs/${e.id}.html">Read latest edition</a></html>`);
fs.writeFileSync(path.join(dist,'archive/index.html'),base);
fs.copyFileSync(path.join(dist,'archive/2026-10-05/index.html'),path.join(dist,'legacy/2026-10-05.html'));
fs.writeFileSync(path.join(dist,'_headers'),`/*\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n/data/*\n  Cache-Control: no-cache\n`);
console.log('Prepared unified app; preserved dated archive pages.');

