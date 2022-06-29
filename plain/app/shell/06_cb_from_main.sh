#!/bin/sh
echo 'CrudBaseをmainから引っ張ってくる'


rsync -auvz ~/git/crud_base_laravel8/dev/public/css/CrudBase ~/git/crud_base_laravel8/plain/app/css/
rsync -auvz ~/git/crud_base_laravel8/dev/public/js/CrudBase ~/git/crud_base_laravel8/plain/app/js/
rsync -auvz ~/git/crud_base_laravel8/dev/vendor/CrudBase ~/git/crud_base_laravel8/plain/app/vendor/



echo "------------ Success!"
cmd /k