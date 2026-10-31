# Planches contact des photos trouvées (review/planche-N.jpg) : 1re photo de chaque recette,
# et review/choix-<id>.jpg avec toutes les photos proposées pour quelques recettes au besoin.
import json, io, os, sys, urllib.request
from PIL import Image, ImageDraw
txt = open('www/js/images.js', encoding='utf8').read()
data = json.loads(txt[txt.index('{'):txt.rindex('}') + 1])
UA = {'User-Agent': 'CarnetDeCuisine/1.0 (application perso; https://github.com/farahboudaoud-sketch/cook)'}
os.makedirs('review', exist_ok=True)
def get(url):
    raw = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read()
    return Image.open(io.BytesIO(raw)).convert('RGB')
def sheet(cells, path, W=256, H=192, cols=5):
    rows = (len(cells) + cols - 1) // cols
    s = Image.new('RGB', (cols * W, rows * (H + 20)), 'white'); d = ImageDraw.Draw(s)
    for i, (label, url) in enumerate(cells):
        x, y = (i % cols) * W, (i // cols) * (H + 20)
        try:
            im = get(url); im.thumbnail((W - 4, H - 4)); s.paste(im, (x + 2, y + 2))
        except Exception as e:
            d.text((x + 6, y + 6), 'ERREUR', fill='red')
        d.text((x + 4, y + H + 4), label, fill='black')
    s.save(path, quality=80)
ids = json.load(open('scripts/image-queries.json'))
items = [(k, data[k][0]['src'] if k in data else '') for k in ids]
for n in range(0, len(items), 20):
    sheet(items[n:n + 20], f'review/planche-{n // 20 + 1}.jpg')
for rid in sys.argv[1:]:
    if rid in data:
        sheet([(f'{rid} #{i}', c['src']) for i, c in enumerate(data[rid])], f'review/choix-{rid}.jpg')
print('ok')
