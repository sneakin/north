: help-legal
  " Copyright © 2019 Nolan Eakins, SemanticGap™ " write-string
  " https://semanticgap.com/" write-line
  " All rights reserved." write-line
;

: version
  " Version " write-string
  version-string write-line
;

: about
  " North: " write-string
  " Nolan's Forth " write-string
  " https://sneakin.github.io/north/" write-line
  version
  help-legal
;
