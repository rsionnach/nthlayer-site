#!/bin/sh
# Compile the walkthrough's JSX source to plain JavaScript (no in-browser Babel), then stamp index.html with a
# content version so browsers fetch the new app.js and verdicts.json after a deploy.
# Usage: ./walkthrough/build.sh   (needs Node; esbuild is fetched by npx). Safe to run repeatedly.
set -e
cd "$(dirname "$0")"
npx --yes esbuild@0.24.0 app.jsx --outfile=app.js --jsx=transform --target=es2018 --minify --legal-comments=none

# Short content version from app.js + verdicts.json (cksum is POSIX).
v=$(cat app.js verdicts.json | cksum | cut -d ' ' -f 1)
v=$(printf '%x' "$v")

# Rewrite every reference, with or without an existing ?v=, to the new version.
sed -E \
  -e "s#/walkthrough/app\.js(\?v=[0-9a-zA-Z]*)?#/walkthrough/app.js?v=$v#g" \
  -e "s#/walkthrough/verdicts\.json(\?v=[0-9a-zA-Z]*)?#/walkthrough/verdicts.json?v=$v#g" \
  index.html > index.html.tmp
mv index.html.tmp index.html
echo "walkthrough: built app.js, version $v"
