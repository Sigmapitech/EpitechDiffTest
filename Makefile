EXT := extension

.POSIX:
.SUFFIXES:

$(EXT).xpi: $(EXT).zip
	cp $< $@

$(EXT).zip:
	zip -r -FS ./$@ * --exclude '*.git*'

.PHONY: clean
clean:
	$(RM) $(EXT).zip $(EXT).xpi
