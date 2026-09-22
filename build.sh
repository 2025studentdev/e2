#!/bin/bash
set -e

cd site
npm ci
npm run build
cd ..

cd hexo-blog
npm ci
npx hexo clean
npx hexo generate
cd ..

rm -rf outputdist
mkdir -p outputdist/blog
cp -r site/dist/* outputdist/
cp -r hexo-blog/public/* outputdist/blog/