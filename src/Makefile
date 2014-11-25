COMPILER=compiler.jar
OUTPUT=compiled.js

SRCS=Barrier.js BluetoothDevice.js FPlug.js FileSystem.js Main.js Util.js
EXTERNS=externs.js

all: $(OUTPUT)

$(COMPILER):
	echo "https://github.com/google/closure-compiler/blob/master/README.md"
	echo "Downloading closure compiler"
	cd /tmp; yes | curl http://dl.google.com/closure-compiler/compiler-latest.zip -O
	cd /tmp; yes | unzip compiler-latest.zip
	echo $(PWD)
	cp /tmp/compiler.jar $(COMPILER)

$(OUTPUT): $(COMPILER) $(SRCS) $(EXTERNS)
	java -jar ${COMPILER} \
	$(SRCS:%=--js=%) \
	$(EXTERNS:%=--externs=%) \
        --js_output_file=$(OUTPUT) \
        --warning_level=VERBOSE \
        --compilation_level=ADVANCED_OPTIMIZATIONS

clean:
	rm -f $(COMPILER) $(OUTPUT)
