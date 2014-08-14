all:
	./node_modules/.bin/browserify -t coffeeify main.coffee > ./edit.js
	./node_modules/.bin/lessc style.less > ./edit.css
run:
	make
	python -m SimpleHTTPServer
