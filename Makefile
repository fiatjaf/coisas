all:
	./node_modules/.bin/lessc style.less
	./node_modules/.bin/webpack main.coffee index.js

run:
	make
	python3 -m http.server 3000
	
