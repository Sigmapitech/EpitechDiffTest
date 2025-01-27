EXT := extension
SRC := $(shell find .             \
	-type f -not -path "./.git/*" \
	-type f -not -path "*.zip"    \
	-type f -not -path "*.xpi"    \
	-and -not -path "Makefile")

.POSIX:
.SUFFIXES:

$(EXT).xpi: $(EXT).zip
	cp $< $@

$(EXT).zip: $(SRC)
	zip -r -FS ./$@ $(SRC)

.PHONY: clean
clean:
	$(RM) $(EXT).zip $(EXT).xpi

.PHONY: re
re: clean $(EXT).xpi

.NOTPARALLEL: re
