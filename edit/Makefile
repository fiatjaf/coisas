all:
	./node_modules/.bin/browserify -t coffeeify main.coffee > main.js

run:
	make
	python3 -m http.server 3000
	
