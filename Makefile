CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

release:
	make -C src
	mkdir -p release
	cp src/compiled.js release/
	cp -r src/resource/* release/

package: release
	$(CHROME) --pack-extension=release

clean:
	make -C src clean
	rm -r release
