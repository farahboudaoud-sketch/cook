# Planche contact des photos trouvées, pour vérification (review/planche-*.jpg)
import json, re, io, urllib.request
from PIL import Image, ImageDraw
txt = open('www/js/images.js', encoding='utf8').read()
data = json.loads(txt[txt.index('{'):txt.rindex('}') + 1])
UA = {'User-Agent': 'CarnetDeCuisine/1.0 (application perso; https://github.com/farahboudaoud-sketch/cook)'}
items = list(data.items())
W, H, cols = 320, 240, 5
for page in range(0, len(items), 20):
    chunk = items[page:page + 20]
    rows = (len(chunk) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * W, rows * (H + 24)), 'white')
    d = ImageDraw.Draw(sheet)
    for i, (rid, info) in enumerate(chunk):
        x, y = (i % cols) * W, (i // cols) * (H + 24)
        try:
            raw = urllib.request.urlopen(urllib.request.Request(info['src'], headers=UA), timeout=30).read()
            im = Image.open(io.BytesIO(raw)).convert('RGB')
            im.thumbnail((W - 6, H - 6))
            sheet.paste(im, (x + 3, y + 3))
        except Exception as e:
            d.text((x + 6, y + 6), 'ERREUR ' + str(e)[:40], fill='red')
        d.text((x + 6, y + H + 4), rid, fill='black')
    sheet.save(f'review/planche-{page // 20 + 1}.jpg', quality=80)
print('ok')
