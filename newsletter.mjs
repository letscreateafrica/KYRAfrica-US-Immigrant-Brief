import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');
const data = JSON.parse(fs.readFileSync(path.join(root, 'content.json'), 'utf8'));
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const formatDate = value => new Intl.DateTimeFormat('en-US', {dateStyle:'long', timeZone:'UTC'}).format(new Date(value + 'T12:00:00Z'));
const sourceLinks = sources => sources.map(source => `<a href="${esc(source.url)}" rel="noreferrer">${esc(source.title)} ↗</a><small>Checked ${esc(source.checked)}</small>`).join('');
const newsletters = data.newsletters || [];
function coverageMarkup(date) {
  const record = (data.coverageRecords || []).find(entry => entry.date === date);
  if (!record) return '';
  const byId = new Map(record.sources.map(source => [source.id, source]));
  const label = review => review === 'partial_official_source_checked' ? 'One official source checked'
    : review === 'official_source_checked' ? 'Official source checked'
    : review === 'checked_no_verified_update' ? 'Checked; no verified update'
    : 'Not individually checked';
  const row = entry => `<li><strong>${esc(entry.name)}</strong><span class="review ${esc(entry.review)}">${esc(label(entry.review))}</span>${entry.note ? `<p>${esc(entry.note)}</p>` : ''}${entry.sourceIds.length ? `<div class="jurisdiction-sources">${entry.sourceIds.map(id => {const source = byId.get(id); return source ? `<a href="${esc(source.url)}" rel="noreferrer">${esc(source.title)} ↗</a>` : '';}).join('')}</div>` : ''}</li>`;
  const group = (title, entries) => `<details open><summary>${esc(title)} · ${entries.length} listed</summary><ul class="jurisdiction-grid">${entries.map(row).join('')}</ul></details>`;
  const individual = rows => rows.filter(entry => ['partial_official_source_checked','official_source_checked'].includes(entry.review)).length;
  const noUpdate = [...record.africa,...record.unitedStates,...record.federal].filter(entry => entry.review === 'checked_no_verified_update').length;
  return `<section class="coverage-record" aria-labelledby="coverage-title"><div class="section-head"><p class="eyebrow">04 / Coverage record</p><h2 id="coverage-title">Every jurisdiction, with an honest status.</h2><p>${esc(record.method)}</p></div><div class="coverage-numbers"><div><strong>54</strong><span>African countries listed · ${individual(record.africa)} with an individual official source checked</span></div><div><strong>51</strong><span>50 U.S. states + DC listed · ${individual(record.unitedStates)} with an individual official source checked</span></div><div><strong>${noUpdate}</strong><span>Named source areas or jurisdictions checked with no verified update</span></div></div><p class="notice">“Not individually checked” means no conclusion about whether a policy changed. A regional or multistate source linked beside a name does not turn it into an individual jurisdiction check.</p>${group('Africa', record.africa)}${group('United States and DC', record.unitedStates)}${group('Federal and regional source areas', record.federal)}<p class="reviewer">Coverage record: ${esc(record.date)} · ${esc(record.reviewedBy)}</p></section>`;
}
for (const issue of newsletters) {
  const edition = data.editions.find(entry => entry.id === issue.editionId);
  if (!edition || edition.type === 'Legacy archive') throw new Error(`Newsletter ${issue.date} has no current source edition`);
  const alerts = data.alerts.filter(alert => alert.checkedAt === issue.date && alert.verification === 'verified' && alert.diasporaRelevance);
  const selectedItems = (issue.itemIds || []).map(id => edition.items.find(item => item.id === id));
  if (selectedItems.some(item => !item)) throw new Error(`Newsletter ${issue.date} names an unknown item`);
  const cardsFor = topic => selectedItems.filter(item => item.topic === topic).map((item, index) => `<article class="story"><div class="story-mark" aria-hidden="true">${String(index + 1).padStart(2, '0')}</div><div><p class="kicker">${esc(item.place)} · Source dated ${esc(formatDate(item.newsDate))}</p><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p>${item.affectedPeople ? `<p><strong>Affected people:</strong> ${esc(item.affectedPeople)}</p>` : ''}<p><strong>Why it matters to the U.S. diaspora:</strong> ${esc(item.diasporaRelevance)}</p><p class="status">${esc(item.status)} · ${esc(item.effectiveDate)}</p>${item.uncertainty ? `<p><strong>Uncertainty:</strong> ${esc(item.uncertainty)}</p>` : ''}${item.media ? `<figure class="story-media"><a href="${esc(item.media.url)}"><img src="${esc(item.media.url)}" alt="${esc(item.media.alt)}" loading="lazy" width="600" height="750"></a><figcaption>${esc(item.media.caption)} <a href="${esc(item.media.url)}" download>Download image</a></figcaption></figure>` : ''}<p class="reviewer">${esc(item.reviewedBy)}</p><div class="sources"><strong>Read the evidence</strong>${sourceLinks(item.sources)}</div></div></article>`).join('') || '<p class="empty-note">No new verified, U.S.-diaspora-relevant item is included in this category today. This is not a finding that no policy changed elsewhere.</p>';
  const alertCards = alerts.length ? alerts.map(alert => `<article class="alert"><p class="kicker">Verified policy alert · ${esc(alert.status)}</p><h3>${esc(alert.title)}</h3><p>${esc(alert.summary)}</p><p>${esc(alert.impact)}</p><p><strong>Why it matters to the U.S. diaspora:</strong> ${esc(alert.diasporaRelevance)}</p><dl><div><dt>Jurisdiction</dt><dd>${esc(alert.jurisdiction)}</dd></div><div><dt>Notice date</dt><dd>${esc(formatDate(alert.newsDate))}</dd></div><div><dt>Effective date</dt><dd>${esc(alert.effectiveDate)}</dd></div><div><dt>Review</dt><dd>${esc(alert.reviewedBy)} · checked ${esc(alert.checkedAt)}</dd></div></dl><div class="sources"><strong>Official evidence</strong>${sourceLinks(alert.sources)}</div></article>`).join('') : '<p class="empty-note">No verified policy alert was added to this issue.</p>';
  const posterMarkup = issue.poster ? `<figure class="summary-poster"><a href="${esc(issue.poster.url)}"><img src="${esc(issue.poster.url)}" alt="${esc(issue.poster.alt)}" width="1440" height="1920" loading="lazy"></a><figcaption>${esc(issue.poster.caption)} <a href="${esc(issue.poster.url)}" download>Download the poster</a>.</figcaption></figure>` : '';
  const shareText = encodeURIComponent(`KnowYourRights Africa visual newsletter · ${formatDate(issue.date)}\n${issue.title}\nhttps://african-diaspora-brief-october-5-2026.letscreateafrica.chatgpt.site/newsletter/${issue.date}/\nRead the sources before acting.`);
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Visual summary of the ${esc(formatDate(issue.date))} KnowYourRights Africa brief and verified policy alerts."><meta name="referrer" content="no-referrer"><title>${esc(issue.title)} | KnowYourRights Africa</title><link rel="stylesheet" href="/newsletter/newsletter.css"><link rel="stylesheet" href="/newsletter/coverage.css"></head>
<body><a class="skip" href="#main">Skip to stories</a><header><a class="brand" href="/">KnowYourRights <b>Africa</b></a><nav aria-label="Newsletter navigation"><a href="/">Home</a><a href="/briefs/${esc(edition.id)}.html">Full edition</a><a href="/#alerts">Policy alerts</a></nav></header>
<main id="main"><section class="cover"><div><p class="eyebrow">Daily visual newsletter · ${issue.pilot ? 'Pilot issue' : 'Issue'} ${esc(issue.date)}</p><h1>${esc(issue.title)}</h1><p class="lead">${esc(issue.summary)}</p><div class="actions"><a class="button light" href="/briefs/${esc(edition.id)}.html">Read the full brief</a>${issue.poster ? `<a class="button outline" href="${esc(issue.poster.url)}" download>Download summary poster</a>` : ''}<a class="button outline" href="https://wa.me/?text=${shareText}" rel="noopener noreferrer" target="_blank">Share on WhatsApp</a></div></div><div class="cover-art" role="img" aria-label="Abstract editorial graphic with three connected circles representing the U.S. brief, Africa brief and policy alert"><div class="orbit a">U.S.</div><div class="orbit b">Africa</div><div class="orbit c">Policy</div></div></section>
<section class="scope"><strong>What this issue covers</strong><p>${esc(issue.scope)}</p><p>${esc(data.coverage)}</p></section>
${posterMarkup}
<section class="stories" aria-labelledby="immigrant-title"><div class="section-head"><p class="eyebrow">01 / U.S. Immigrant Brief</p><h2 id="immigrant-title">Navigate with clarity.</h2><p>Immigration processes, rights, courts and official resources, with jurisdiction and dates made clear.</p><p>Source edition: <a href="/briefs/${esc(edition.id)}.html">${esc(formatDate(edition.date))}</a>.</p></div>${cardsFor('U.S. Immigrant Brief')}</section>
<section class="stories" aria-labelledby="diaspora-title"><div class="section-head"><p class="eyebrow">02 / African Diaspora Brief</p><h2 id="diaspora-title">Keep your connections.</h2><p>Developments across Africa and U.S. communities, with transparent coverage and research limitations.</p></div>${cardsFor('African Diaspora Brief')}</section>
<section class="policy" aria-labelledby="policy-title"><div class="section-head"><p class="eyebrow">03 / Policy Alerts</p><h2 id="policy-title">See what changed.</h2><p>Verified notices with effective dates, source evidence and a clear distinction between proposals and rules.</p></div>${alertCards}</section>
${coverageMarkup(issue.date)}
<section class="finish"><h2>Go beyond the summary.</h2><p>The visual newsletter is a starting point. Read the <a href="/briefs/${esc(edition.id)}.html">full dated edition</a> and its official sources before making decisions.</p><p>General information, not individual legal advice. For personal immigration matters, consult a qualified immigration attorney or DOJ-accredited representative.</p><div class="actions"><a class="button light" href="/briefs/${esc(edition.id)}.html">Full edition and sources</a></div></section></main>
<footer><span>KnowYourRights Africa · ${esc(formatDate(issue.date))}</span><span>Illustration is editorial, not documentary evidence. No trackers or automatic sharing.</span></footer></body></html>`;
  const target = path.join(dist, 'newsletter', issue.date);
  fs.mkdirSync(target, {recursive:true});
  fs.writeFileSync(path.join(target, 'index.html'), html);
}
if (newsletters.length) {
  const latest = newsletters[0];
  const target = path.join(dist, 'newsletter');
  fs.mkdirSync(target, {recursive:true});
  fs.writeFileSync(path.join(target, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><title>Latest visual newsletter</title><meta http-equiv="refresh" content="0;url=/newsletter/${latest.date}/"><a href="/newsletter/${latest.date}/">Read the latest visual newsletter</a></html>`);
  fs.copyFileSync(path.join(root, 'src', 'newsletter.css'), path.join(target, 'newsletter.css'));
  fs.copyFileSync(path.join(root, 'src', 'coverage.css'), path.join(target, 'coverage.css'));
  for (const file of [path.join(dist, 'index.html'), path.join(dist, 'archive', 'index.html')]) {
    const html = fs.readFileSync(file, 'utf8');
    const start = html.indexOf('<section class="wrap section" id="newsletter">');
    const end = html.indexOf('</section>', start);
    if (start < 0 || end < 0) throw new Error('Newsletter home section missing');
    const section = `<section class="wrap section" id="newsletter"><div class="section-heading"><h2>The visual newsletter</h2><span class="eyebrow">A quick read with a route back to every source.</span></div><div class="card"><span class="tag">Daily visual summary · ${esc(formatDate(latest.date))}${latest.pilot ? ' pilot' : ''}</span><h3>${esc(latest.title)}</h3><p>${esc(latest.summary)}</p><a class="button" href="/newsletter/${esc(latest.date)}/">Read the ${esc(formatDate(latest.date))} newsletter</a></div><p class="meta">Issue sources and coverage limits are stated in the newsletter. New issues require editorial review and publication.</p></section>`;
    fs.writeFileSync(file, html.slice(0, start) + section + html.slice(end + '</section>'.length));
  }
}
console.log(`Prepared ${newsletters.length} visual newsletter issue(s).`);

