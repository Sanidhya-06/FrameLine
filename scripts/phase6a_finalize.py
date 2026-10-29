import json,csv,re
from pathlib import Path
from datetime import datetime,timezone
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parent.parent
data=json.loads((ROOT/'docs'/'phase6a_probe_raw.json').read_text(encoding='utf-8'))
out=[]
for x in data:
    es=x['entries2']; n=len(es)
    share=lambda k: round(100*sum(bool(e.get(k)) for e in es)/n,2) if n else 0
    ages=[]
    for e in es:
        try: ages.append((datetime.now(timezone.utc)-datetime(*e['published_parsed'][:6],tzinfo=timezone.utc)).total_seconds()/3600)
        except Exception: pass
    row={k:x.get(k) for k in ('publisher','url','status1','status2','time1','time2')}
    row.update(entries1=len(x['entries1']),entries2=n,title_pct=share('title'),url_pct=share('link'),summary_pct=share('summary'),date_pct=share('published_parsed'),newest_age_h=round(min(ages),2) if ages else '')
    out.append(row)
    if x['status1']==200 and x['status2']==200 and n>=10 and share('title')>=90 and share('link')>=90:
        u=urlparse(x['url']); name='feed_phase6a_'+re.sub(r'[^A-Za-z0-9_-]','_',u.netloc+'_'+u.path.strip('/'))[:70]+'.xml'
        (ROOT/'tests'/'fixtures'/name).write_text(x['raw2'],encoding='utf-8')
with open(ROOT/'docs'/'phase6a_probe.csv','w',newline='',encoding='utf-8') as f:
    w=csv.DictWriter(f,fieldnames=list(out[0]));w.writeheader();w.writerows(out)
print('metrics rows',len(out),'fixtures',sum(r['status1']==200 and r['status2']==200 and r['entries2']>=10 and r['title_pct']>=90 and r['url_pct']>=90 for r in out))
