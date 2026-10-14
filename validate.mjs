import fs from 'node:fs';
import assert from 'node:assert/strict';
const data=JSON.parse(fs.readFileSync(new URL('./content.json',import.meta.url),'utf8'));
assert.ok(!Number.isNaN(Date.parse(data.checkedAt)),'Valid checkedAt required');
assert.ok(data.coverage,'Coverage limitations required');
const ids=new Set();
for(const e of data.editions){assert.match(e.id,/^\d{4}-\d{2}-\d{2}$/);assert.equal(e.date,e.id);assert.ok(!ids.has(e.id),'Duplicate edition');ids.add(e.id);assert.ok(e.title&&e.summary);for(const i of e.items){assert.ok(i.sources?.length,'Every item needs citations');for(const s of i.sources){assert.equal(new URL(s.url).protocol,'https:');assert.ok(s.checked&&s.title);}}}
for(const a of data.alerts){assert.ok(a.verification==='verified'&&a.reviewedBy&&a.checkedAt&&a.newsDate&&a.diasporaRelevance&&a.effectiveDate&&a.jurisdiction&&a.status,'Alert review and U.S. diaspora relevance fields required');assert.ok(a.sources.some(s=>{const h=new URL(s.url).hostname;return s.primary&&(h.endsWith('.gov')||h==='gov.za'||h.endsWith('.gov.za')||h==='au.int'||h.endsWith('.au.int'));}),'Policy alert must cite an approved official primary source');}
const allowedReviews=new Set(['partial_official_source_checked','official_source_checked','checked_no_verified_update','not_individually_checked','not_checked']);
const digestWindows=data.digestWindows||[];
assert.ok(digestWindows.length>=5,'October 1–10 digest archive needs its first five two-day windows');
for(const [index,w] of digestWindows.entries()){
  const expectedStart=new Date(Date.UTC(2026,9,1+index*2)).toISOString().slice(0,10);
  const expectedEnd=new Date(Date.UTC(2026,9,2+index*2)).toISOString().slice(0,10);
  assert.equal(w.start,expectedStart,'Digest windows begin October 1 and advance every two days');
  assert.equal(w.end,expectedEnd,'Digest windows cover two days');
  assert.ok(w.title&&w.status&&w.checkedAt&&Array.isArray(w.items),'Digest scope metadata required');
  if(index>=5){
    assert.ok(w.coverageChecks,'Future digest windows need a dated source coverage record');
    for(const group of ['africa','unitedStates','federal']){
      const record=w.coverageChecks[group];
      assert.ok(Array.isArray(record?.verified)&&Array.isArray(record?.noUpdate),'Separate verified, checked-no-update and not-checked statuses');
      assert.equal(new Set([...record.verified,...record.noUpdate]).size,record.verified.length+record.noUpdate.length,'Coverage statuses may not overlap');
    }
  }
  for(const item of w.items){
    assert.ok(item.date>=w.start&&item.date<=w.end,'Digest item date must fall in its window');
    assert.ok(['U.S. Immigrant Brief','African Diaspora Brief','Policy Alerts'].includes(item.pillar),'Known editorial pillar required');
    for(const key of ['dateKind','title','summary','jurisdiction','affectedPeople','effectiveDate','status','uncertainty','reviewedBy'])assert.ok(item[key],`Digest item requires ${key}`);
    assert.equal(item.source.primary,true,'Digest item needs primary evidence');
    assert.equal(new URL(item.source.url).protocol,'https:');
    assert.ok(item.source.title&&item.source.checked);
  }
}
for(const issue of data.newsletters||[]){
  const sourceEdition=data.editions.find(e=>e.id===issue.editionId);
  assert.ok(sourceEdition,'Newsletter must name a preserved source edition');
  assert.ok(Array.isArray(issue.itemIds),'Newsletter must explicitly select verified daily items');
  if(issue.poster){assert.ok(issue.poster.url.startsWith('/posters/')&&issue.poster.alt&&issue.poster.caption,'Poster needs a first-party path, alt text and editorial caption');assert.ok(fs.existsSync(new URL('./src'+issue.poster.url,import.meta.url)),'Poster asset must exist in source');}
  assert.equal(new Set(issue.itemIds).size,issue.itemIds.length,'Newsletter item IDs must be unique');
  for(const id of issue.itemIds){
    const item=sourceEdition.items.find(entry=>entry.id===id);
    assert.ok(item,`Newsletter item ${id} must exist in its source edition`);
    assert.ok(item.newsDate&&item.newsDate<=issue.date&&item.diasporaRelevance&&item.affectedPeople&&item.effectiveDate&&item.reviewedBy,`Newsletter item ${id} needs date, affected people, relevance, effective date and reviewer`);
    assert.ok(item.sources.some(source=>source.primary===true),`Newsletter item ${id} needs primary evidence`);
    if(item.media)assert.ok(item.media.url.startsWith('/')&&item.media.alt&&item.media.caption,`Newsletter item ${id} needs accessible first-party media`);
  }
  const record=(data.coverageRecords||[]).find(r=>r.date===issue.date);
  assert.ok(record,'Each newsletter needs a dated jurisdiction coverage record');
  assert.equal(record.africa.length,54,'List all 54 African countries');
  assert.equal(record.unitedStates.length,51,'List all 50 U.S. states plus DC');
  for(const rows of [record.africa,record.unitedStates,record.federal]){
    assert.equal(new Set(rows.map(row=>row.name)).size,rows.length,'Jurisdictions must be unique');
    for(const row of rows){assert.ok(allowedReviews.has(row.review),'Use an explicit check status');assert.ok(Array.isArray(row.sourceIds),'Record relevant sources separately');}
  }
  const sourceIds=new Set(record.sources.map(source=>source.id));
  for(const row of [...record.africa,...record.unitedStates,...record.federal])for(const id of row.sourceIds)assert.ok(sourceIds.has(id),'Coverage source ID must resolve');
}
console.log(`Validated ${data.editions.length} editions and ${data.alerts.length} reviewed alerts.`);
