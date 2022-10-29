#!/bin/sh
CUR=`sed -n '4p' < package.json`
echo "Current version: $CUR"
echo "Enter new version"
read newver
sed -i "4s/.*/\"version\": \"$newver\",/" package.json
sed -i "6s/.*/APP_VERSION=$newver/" ../backend/.env
npm run build
npm run deploy

