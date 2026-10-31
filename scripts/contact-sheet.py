# Planche contact des images générées (review/planche-N.jpg) pour vérification
import json, os
from PIL import Image, ImageDraw

ids = list(json.load(open('scripts/image-prompts.json')).keys())
os.makedirs('review', exist_ok=True)
W, H, cols = 256, 192, 5
for page in range(0, len(ids), 20):
    chunk = ids[page:page + 20]
    rows = (len(chunk) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * W, rows * (H + 20)), 'white')
    d = ImageDraw.Draw(sheet)
    for i, rid in enumerate(chunk):
        x, y = (i % cols) * W, (i // cols) * (H + 20)
        p = f'www/img/{rid}.jpg'
        if os.path.exists(p):
            im = Image.open(p).convert('RGB')
            im.thumbnail((W - 4, H - 4))
            sheet.paste(im, (x + 2, y + 2))
        else:
            d.text((x + 6, y + 6), 'MANQUANTE', fill='red')
        d.text((x + 4, y + H + 4), rid, fill='black')
    sheet.save(f'review/planche-{page // 20 + 1}.jpg', quality=82)
print('ok')
