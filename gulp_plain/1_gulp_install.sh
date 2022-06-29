#!/bin/sh
echo 'gulpといくつかのパッケージをインストールします。'

echo 'グローバルのgulpを一旦、アンインストールします。'
npm rm --global gulp

echo 'グローバルへgulpを再インストールします。'
npm install gulp -g

echo 'ローカルへgulpをインストールします。'
npm install --save-dev gulp

echo 'gulp-concatをインストールします。'
npm install --save-dev gulp-concat

echo 'gulp-terserをインストールします。'
npm install gulp-terser --save-dev


echo "------------ インストール作業がすべて終わりました。"
cmd /k