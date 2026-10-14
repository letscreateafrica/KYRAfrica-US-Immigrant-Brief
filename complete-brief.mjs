import fs from 'node:fs';
import path from 'node:path';
const root=path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
const data=JSON.parse(fs.readFileSync(path.join(root,'content.json'),'utf8'));
const e=data.editions.find(e=>e.id==='2026-10-12');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reports=(e.reportedItems||[]).map((i,n)=>`<article class="story"><div class="story-mark" aria-hidden="true">${n+4}</div><div><p class="kicker">${esc(i.place)} · Report date ${esc(i.newsDate)}</p><h3>${esc(i.title)}</h3><p class="notice">${esc(i.status)}. This item is outside the verified policy-alert feed.</p><p>${esc(i.text)}</p><p><strong>Affected people:</strong> ${esc(i.affectedPeople)}</p><p><strong>Why it matters:</strong> ${esc(i.diasporaRelevance)}</p><p><strong>Event or effective date:</strong> ${esc(i.effectiveDate)}</p><p><strong>Verification limit:</strong> ${esc(i.uncertainty)}</p><p class="reviewer">${esc(i.reviewedBy)}</p><div class="sources">${i.sources.map(s=>`<a href="${esc(s.url)}" rel="noreferrer">${esc(s.title)} ↗</a><small>Checked ${esc(s.checked)} · ${s.primary?'Primary evidence':'Reporting or record awaiting retrieval'}</small>`).join('')}</div></div></article>`).join('');
const appendix=`<section class="stories" id="reported"><div class="section-head"><p class="eyebrow">Additional topics from the requested brief</p><h2>Reporting with verification limits.</h2><p>These three stories are included to preserve the full six-topic brief. Their underlying incident, agency or court records were not retrieved; they are not independently verified policy alerts.</p></div>${reports}</section>`;
const corrections=`<section class="scope"><strong>Source review and corrections · October 12, 2026</strong><p>${esc(e.correctionNote)}</p><p>Three items have primary documents reviewed. Three remain attributed reports. The court opinion establishes what was ordered on October 7, not the case’s current status. The original poster’s “verified” labels do not override these written qualifications.</p></section>`;
const feeTable=`<div class="fee-table"><table><caption>Selected USCIS H.R. 1 fees · covered postmarks from October 16</caption><thead><tr><th scope="col">Category</th><th scope="col">Before</th><th scope="col">From October 16</th></tr></thead><tbody><tr><th scope="row">Annual pending-asylum fee</th><td>$102</td><td>$105</td></tr><tr><th scope="row">Immigration parole fee</th><td>$1,020</td><td>$1,050</td></tr><tr><th scope="row">Certain initial asylum, parole and TPS EAD fees</th><td>$560</td><td>$570</td></tr><tr><th scope="row">TPS Form I-821 fee</th><td>$510</td><td>$520</td></tr></tbody></table><p>Selected categories only. Use the linked agency instructions for the total amount owed.</p></div>`;
const checklist=`<section class="scope"><strong>Before you act or share</strong><ul><li>Check the filing category, full fee instructions and October 16 postmark threshold.</li><li>Review the October 7 biometrics order and October 21 report deadline with a qualified representative.</li><li>Confirm the Egyptian return case’s actual court record and return status.</li><li>Check current South African intake notices; a proposed model is not a live service.</li><li>Distinguish the reported Omar search from allegations, charges or findings.</li><li>Use official IOM updates for changing casualty figures and protect relatives’ private details.</li><li>Check event dates before forwarding; editorial artwork is not documentary evidence.</li></ul></section>`;
const file=path.join(root,'dist/newsletter/2026-10-12/index.html');
let html=fs.readFileSync(file,'utf8');
html=html.replace('<section class="scope">',corrections+'<section class="scope">').replace('<section class="policy"',appendix+'<section class="policy"').replace('<section class="finish">',checklist+'<section class="finish">');
html=html.replace('<h3>USCIS fees change October 16</h3>','<h3>USCIS fees change October 16</h3>'+feeTable);
const fullUrl='https://african-diaspora-brief-october-5-2026.letscreateafrica.chatgpt.site/briefs/2026-10-12.html';
html=html.replace('</head>',`<meta property="og:title" content="October 12 KnowYourRights Africa · Complete brief"><meta property="og:description" content="Six topics, source notes, policy alerts and editorial poster. Primary review and attributed reporting clearly distinguished."><meta property="og:image" content="https://african-diaspora-brief-october-5-2026.letscreateafrica.chatgpt.site/posters/2026-10-12-original.png"><link rel="canonical" href="${fullUrl}"></head>`);
fs.writeFileSync(file,html);
fs.writeFileSync(path.join(root,'dist/briefs/2026-10-12.html'),html.replace('Daily visual newsletter · Issue 2026-10-12','Complete U.S. Immigrant Brief · October 12, 2026').replaceAll('https://wa.me/?text=','https://wa.me/?text=').replaceAll(encodeURIComponent('/newsletter/2026-10-12/'),encodeURIComponent('/briefs/2026-10-12.html')).replace('Read the full brief</a>','Browse the archive</a>').replace('class="button light" href="/briefs/2026-10-12.html"','class="button light" href="/#archive"'));
fs.appendFileSync(path.join(root,'dist/newsletter/newsletter.css'),'\n.fee-table{overflow-x:auto;margin:1.5rem 0}table{width:100%;border-collapse:collapse;font-size:1rem}caption{text-align:left;font-weight:bold;margin-bottom:1rem}th,td{text-align:left;padding:.8rem;border-bottom:1px solid #b7cbbf}.summary-poster{max-width:760px;margin:2rem auto;padding:1rem}.summary-poster img{height:auto;width:100%}.scope li{margin:.7rem 0}.sources a{overflow-wrap:anywhere}@media(max-width:600px){th,td{padding:.5rem}header nav{flex-wrap:wrap}}\n');
const svg=fs.readFileSync(path.join(root,'dist/posters/2026-10-12.svg'),'utf8').replace('African Diaspora</text>','October 12:</text>').replace('Brief</text>','Dates &amp; evidence</text>');
fs.writeFileSync(path.join(root,'dist/posters/2026-10-12.svg'),svg);
console.log('Prepared complete October 12 brief with all six topics, original poster, fee table and verification notes.');

// Future dated briefs use the same complete editorial newsletter layout. Keep the
// October 12 page above intact because it has its own sourced corrections.
for (const issue of data.newsletters.filter(issue => issue.date > '2026-10-12')) {
  const newsletterPath=path.join(root,'dist/newsletter',issue.date,'index.html');
  const briefPath=path.join(root,'dist/briefs',`${issue.date}.html`);
  let complete=fs.readFileSync(newsletterPath,'utf8');
  complete=complete.replace(`Daily visual newsletter · Issue ${issue.date}`,`Complete source-reviewed brief · ${issue.date}`);
  complete=complete.replaceAll(`/briefs/${issue.date}.html`,'/#archive');
  complete=complete.replace('Read the full brief</a>','Browse the archive</a>');
  complete=complete.replace('Full edition and sources</a>','Browse the archive</a>');
  complete=complete.replace('</head>',`<link rel="canonical" href="https://african-diaspora-brief-october-5-2026.letscreateafrica.chatgpt.site/briefs/${issue.date}.html"></head>`);
  const newsletterUrl=`https://african-diaspora-brief-october-5-2026.letscreateafrica.chatgpt.site/newsletter/${issue.date}/`;
  const briefUrl=`https://african-diaspora-brief-october-5-2026.letscreateafrica.chatgpt.site/briefs/${issue.date}.html`;
  complete=complete.replaceAll(encodeURIComponent(newsletterUrl),encodeURIComponent(briefUrl));
  fs.writeFileSync(briefPath,complete);
}
