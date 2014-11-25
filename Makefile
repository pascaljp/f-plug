all:
	make -C src
	mkdir -p release
	cp src/compiled.js release/
	cp -r src/resource/* release/

clean:
	make -C src clean
	rm -r release
