import fs from 'node:fs';
import path from 'node:path';

const root=path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
const data=JSON.parse(fs.readFileSync(path.join(root,'content.json'),'utf8'));
const history=data.trackerHistory;
if(!history) process.exit(0);
const out=path.join(root,'dist','tracker');
fs.mkdirSync(out,{recursive:true});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const layout=(title,body)=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'"><title>${esc(title)} | KnowYourRights Africa</title><link rel="stylesheet" href="/styles.css"></head><body><a class="skip" href="#main">Skip to content</a><header><div class="wrap header"><a class="brand" href="/">KnowYourRights<span>AFRICA</span></a><nav aria-label="Main navigation"><a href="/newsletter/">Visual newsletter</a><a href="/#archive">Current briefs</a><a href="/tracker/">Tracker history</a></nav></div></header><main id="main" class="wrap section edition-detail">${body}</main><footer><div class="wrap"><strong>KnowYourRights Africa</strong><p>Historical source record · General information, not individual legal advice.</p><a href="/#standards">Editorial standards</a> · <a href="/#privacy">Privacy</a></div></footer></body></html>`;
const index=`<p class="tag">Retrospective tracker record · imported ${esc(history.importedAt)}</p><h1>U.S. Immigrant Brief tracker history</h1><p class="notice">${esc(history.scope)}</p><p>${esc(history.visualNote)}</p><p><a href="${esc(history.source)}" rel="noreferrer">Open the supplied shared tracker snapshot ↗</a></p><div class="feed">${history.records.map(r=>`<article class="card"><p class="tag">${esc(r.date)} · ${esc(r.label)}</p><h2><a href="${esc(r.url)}">Read the historical record</a></h2><p>${esc(r.verification)}</p><p class="meta">${esc(r.reviewedBy)}</p></article>`).join('')}</div><p><a href="/#archive">See current dated editions and their source checks →</a></p>`;
fs.writeFileSync(path.join(out,'index.html'),layout('Tracker history',index));
for(const r of history.records){
  const md=fs.readFileSync(path.join(root,'tracker-records',r.id+'.md'),'utf8');
  const links=[...new Set((md.match(/https:\/\/[^\s<>"'`]+/g)||[]).map(x=>x.replace(/[),.;]+$/,'')))];
  const linksHtml=links.length?`<details><summary>Links in the historical text (${links.length}; not reverified)</summary><ul>${links.map(url=>`<li><a href="${esc(url)}" rel="noreferrer noopener">${esc(url)}</a></li>`).join('')}</ul></details>`:'';
  const recordDir=path.join(out,r.id);fs.mkdirSync(recordDir,{recursive:true});
  fs.writeFileSync(path.join(out,r.id+'.md'),md);
  const body=`<p><a href="/tracker/">← All tracker records</a></p><p class="tag">${esc(r.date)} · ${esc(r.label)}</p><h1>Historical tracker brief</h1><p class="notice">${esc(history.scope)}</p><p>${esc(history.visualNote)}</p><div class="actions"><a class="button" href="${esc(r.rawUrl)}" download>Download original text</a><a class="button secondary" href="${esc(r.source)}" rel="noreferrer">View shared snapshot</a></div>${linksHtml}<h2>Original generated text</h2><pre class="tracker-transcript">${esc(md)}</pre><p><a href="/tracker/">← All tracker records</a></p>`;
  fs.writeFileSync(path.join(recordDir,'index.html'),layout(`Tracker brief ${r.date}`,body));
}
console.log(`Prepared ${history.records.length} historical tracker records.`);
