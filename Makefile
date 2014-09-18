all:
	./node_modules/.bin/lessc style.less > style.css
	./node_modules/.bin/webpack main.coffee edit.js

run:
	make
	python3 -m http.server 3000
	
