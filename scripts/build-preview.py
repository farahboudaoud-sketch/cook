# Construit un fichier HTML unique pour tester l'appli dans un navigateur d'ordinateur.
# Les photos sont chargées depuis Wikimedia Commons. Usage : python3 scripts/build-preview.py sortie.html
import base64, re, sys
W = 'www/'
css = open(W + 'css/style.css', encoding='utf8').read()
css = re.sub(r"url\('(\.\./fonts/[^']+)'\)", lambda m: "url('data:font/woff2;base64,%s')" % base64.b64encode(open(W + m.group(1)[3:], 'rb').read()).decode(), css)
css += """
@media (min-width: 700px) {
  html, body { background: #E8DECF; }
  #app { max-width: 420px; margin: 0 auto; background: var(--paper); box-shadow: 0 0 0 1px rgba(43,33,26,0.15), 0 10px 40px rgba(43,33,26,0.15); }
  .overlay { left: 50%; right: auto; width: 420px; transform: translateX(-50%); }
  .toast { bottom: 90px; }
}
"""
scripts = ''.join('<script>%s</script>\n' % open(W + 'js/' + f, encoding='utf8').read() for f in ['data.js', 'details.js', 'images.js', 'genimages.js', 'prompts.js', 'features.js', 'app.js'])
html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Carnet de cuisine – aperçu</title>
<style>{css}</style>
</head>
<body>
<div id="app"></div>
{scripts}</body>
</html>"""
open(sys.argv[1] if len(sys.argv) > 1 else 'carnet-de-cuisine-apercu.html', 'w', encoding='utf8').write(html)
print('ok')
