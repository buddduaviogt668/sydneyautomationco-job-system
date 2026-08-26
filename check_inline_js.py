from bs4 import BeautifulSoup
from pathlib import Path

html = Path('/home/ubuntu/sydneyautomationco-job-system/index.html').read_text(encoding='utf-8')
soup = BeautifulSoup(html, 'html.parser')
scripts = [s.string or s.get_text() for s in soup.find_all('script') if not s.get('src')]
Path('/tmp/sydney_automation_inline.js').write_text('\n\n'.join(scripts), encoding='utf-8')
print(f'extracted {len(scripts)} inline scripts')
