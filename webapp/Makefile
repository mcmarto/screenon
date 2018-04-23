all: deploy

build: src/**/*.html src/data_handling.js index.html
	polymer build

deploy: build
	cp -r ./build/default/* ../static/
