#!/bin/sh

ROOT=$(dirname $0)/..
OUTDIR="$ROOT/build/doc/src"

mkdir -p "$OUTDIR"

for i in $ROOT/src/*.4th ; do
    OUTFILE="$(basename $i).html"
    echo "$i > $OUTDIR/$OUTFILE"
    pygmentize -l forth -f html -O full "$i" > "$OUTDIR"/"$OUTFILE"
done

pygmentize -l javascript -f html -O full src/forth.js > "$OUTDIR"/forth.js.html
