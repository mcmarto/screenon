all: deploy

cleanstatic:
	rm -rf ../static/**

build: src/**/*.html src/data_handling.js index.html
	polymer build --bundle --js-minify --html-minify 
	# polymer build

deploy: build cleanstatic
	cp -r ./build/default/* ../static/
