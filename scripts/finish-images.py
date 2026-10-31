# Redimensionne tmp-img/*.png en www/img/<id>.jpg, met à jour www/js/genimages.js
# et produit review/generees-N.jpg (planches de vérification).
import glob, json, os
from PIL import Image, ImageDraw
os.makedirs('www/img', exist_ok=True); os.makedirs('review', exist_ok=True)
for p in glob.glob('tmp-img/*.png'):
    rid = os.path.basename(p)[:-4]
    im = Image.open(p).convert('RGB')
    w = 768; h = round(im.height * w / im.width)
    im.resize((w, h), Image.LANCZOS).save(f'www/img/{rid}.jpg', quality=82, optimize=True)
order = list(json.load(open('scripts/image-prompts.json')).keys())
have = [r for r in order if os.path.exists(f'www/img/{r}.jpg')]
open('www/js/genimages.js', 'w', encoding='utf8').write("/* Recettes de base dont l'image générée est incluse dans l'appli (www/img/<id>.jpg) */\n'use strict';\nconst GEN_IMAGES = " + json.dumps(have) + ";\n")
W, H, cols = 256, 171, 5
for n in range(0, len(have), 20):
    chunk = have[n:n + 20]; rows = (len(chunk) + cols - 1) // cols
    s = Image.new('RGB', (cols * W, rows * (H + 20)), 'white'); d = ImageDraw.Draw(s)
    for i, rid in enumerate(chunk):
        x, y = (i % cols) * W, (i // cols) * (H + 20)
        im = Image.open(f'www/img/{rid}.jpg'); im.thumbnail((W - 4, H - 4)); s.paste(im, (x + 2, y + 2))
        d.text((x + 4, y + H + 4), rid, fill='black')
    s.save(f'review/generees-{n // 20 + 1}.jpg', quality=82)
print(len(have), 'images')
