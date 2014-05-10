all:
	./_edit/node_modules/.bin/browserify -t coffeeify _edit/main.coffee > _edit/main.js

run:
	make
	python3 -m http.server 3000
	
