from pathlib import Path
import re
p=Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s=p.read_text()
scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',s,re.S|re.I)
Path('/tmp/sac_index_scripts.js').write_text('\n'.join(scripts))
print('scripts',len(scripts),'chars',sum(map(len,scripts)))
