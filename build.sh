# pack
node pack.js

# insert css/js
sed -e '/{{POROTAPP_CSS}}/r./app.css' -e '/{{POROTAPP_CSS}}/d' \
	-e '/{{POROTAPP_JS}}/r./porotapp.js' -e '/{{POROTAPP_JS}}/d' porotapp.tpl > build/porotapp.html
