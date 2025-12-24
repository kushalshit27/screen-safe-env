
.PHONY: build lint check-types compile test package vsix clean

build:
	npm run build

lint:
	npm run lint

check-types:
	npm run check-types

compile:
	npm run compile

test:
	npm test

package:
	npm run package

vsix: package
	npx @vscode/vsce package

clean:
	rm -rf dist node_modules out *.vsix .vscode-test