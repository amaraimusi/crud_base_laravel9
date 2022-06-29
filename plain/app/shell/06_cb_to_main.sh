#!/bin/sh
echo 'CrudBaseを他のプロジェクトへ更新'

rsync -auvz ~/git/crud_base_laravel8/plain/app/css/CrudBase ~/git/crud_base_laravel8/dev/public/css/
rsync -auvz ~/git/crud_base_laravel8/plain/app/js/CrudBase ~/git/crud_base_laravel8/dev/public/js/
rsync -auvz ~/git/crud_base_laravel8/plain/app/vendor/CrudBase ~/git/crud_base_laravel8/dev/vendor/
echo "------------ Success!"
cmd /k