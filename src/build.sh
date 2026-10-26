#!/bin/sh
# Rebuild ../index.html from the sources in this folder (embeds Faruma as base64).
cd "$(dirname "$0")"
python3 - <<'PY'
import base64
s=open('src.html').read().replace('__FARUMA__',base64.b64encode(open('Faruma.ttf','rb').read()).decode())
s=s.replace('/*TOOLBOX_CSS*/',open('toolbox.css').read()).replace('/*TOOLBOX_JS*/',open('toolbox.js').read())
open('../index.html','w').write(s)
PY
