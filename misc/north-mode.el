(defvar north-words
  '(("\\w*\\["
     definition-starter
     (font-lock-keyword-face . 1))
    ("\\]\\w*"
     definition-ender
     (font-lock-keyword-face . 1))
    (("def" "defop" "::")
     definition-starter
     (font-lock-keyword-face . 1)
     "[ \n]" t name (font-lock-function-name-face . 3))
    (("end")
     definition-ender
     (font-lock-keyword-face . 1))
    (("\"")
     immediate
     (font-lock-string-face . 1)
     "[\"]" nil string (font-lock-string-face . 1))
    (("doc(" "args(")
     immediate
     (font-lock-comment-face . 1)
     "[)]" nil string (font-lock-comment-face . 1))
    (("immediate-as")
     definition-starter
     (font-lock-keyword-face . 1)
     "[ 	\n]" t name
     (font-lock-function-name-face . 3))
    (("if" "unless" "else" "then" "begin" "end" "do" "while" "until" "leave" "recurse" "cont")
     compile-only
     (font-lock-keyword-face . 2))
    ("return\\w*"
     compile-only
     (font-lock-keyword-face . 2))
    (("true" "false" "pi")
     non-immediate
     (font-lock-constant-face . 2))
    (("break" "pause")
     compile-only
     (font-lock-warning-face . 2))
    (("postpone" "[']" "[compile]")
     compile-only
     (font-lock-keyword-face . 2)
     "[ 	\n]" t name
     (font-lock-function-name-face . 3))
    (("'" "''")
     non-immediate
     (font-lock-keyword-face . 2)
     "[ 	\n]" t name
     (font-lock-function-name-face . 3))
    (("create" "variable" "constant"
      "literal" "int32" "pointer" "offset"
      "char-code")
     non-immediate
     (font-lock-type-face . 2)
     "[ 	\n]" t name
     (font-lock-variable-name-face . 3))
    (("literal" "int32" "pointer" "offset")
     non-immediate
     (font-lock-constant-face . 2)
     "[ 	\n]" t name
     (font-lock-variable-name-face . 3))
    (("alias")
     non-immediate
     (font-lock-type-face . 1)
     "[ 	\n]" t name
     (font-lock-function-name-face . 3)
     "[ 	\n]" t name
     (font-lock-function-name-face . 3))
    (("end-struct")
     non-immediate
     (font-lock-keyword-face . 2)
     "[ 	\n]" t name
     (font-lock-type-face . 3))
    (("struct" "structure" "field:" "bytes:" "cells:")
     non-immediate
     (font-lock-keyword-face . 2))
    ("[#&$x%]?-?[0-9]+\\(\\.[0-9]*e\\(-?[0-9]+\\)?\\|\\.?[0-9a-f]*\\)" immediate
     (font-lock-constant-face . 1))))

(defvar north-indent-words
  '(("\\w*\\["
     (0 . 2)
     (0 . 2))
    ("\\]\\w*"
     (-2 . 0)
     (0 . -2))
    (("def" "defop")
     (0 . 2)
     (0 . 2))
    (("end")
     (-2 . 0)
     (0 . -2))
    (("if" "unless" "begin" "do")
     (0 . 2)
     (0 . 2))
    (("again" "then" "endif")
     (-2 . 0)
     (0 . -2))
    (("else" "recover")
     (-2 . 2)
     (0 . 0))
    (("while" "[while]" "until" "[until]")
     (-2 . 4)
     (0 . 2))))

(define-derived-mode north-mode forth-mode "North"
  "Major mode for North."
  (setf forth-local-words north-words)
  (setf forth-local-indent-words north-indent-words)
  (forth-compile-words)
  )

(defconst north-ext "\\.[4n]th\\'")
(unless (assoc north-ext auto-mode-alist)
  (add-to-list 'auto-mode-alist (cons north-ext 'north-mode)))

;; What Emacs' suggests:
(defun north-renumber-args (n &optional increase start end)
  (interactive
   (list (read-number "First argument number?" 0)
         (read-number "Increase by?" 1)
         (if (use-region-p) (region-beginning) (point))
         (if (use-region-p)
             (region-end)
           (save-excursion
             (forward-paragraph 1)
             (point)))))
  (if (use-region-p) (goto-char start))
  (message "Renumbering args from %i to +%i to point %i:%i." n increase start end)
  (while (re-search-forward "arg\\([0-9]+\\)" end t)
    (let ((num (string-to-number (match-string 1))))
      (replace-match (format "arg%i" (if (>= num n)
                                         (+ 1 num)
                                       num))))))

;; What I really want:
(defun north-renumber-args (n &optional increase start end)
  (interactive
   (list (read-number "First argument number?" 0)
         (read-number "Increase by?" 1)
         (if (use-region-p) (region-beginning))
         (if (use-region-p) (region-end))))
  (perform-replace "arg\\([0-9]+\\)"
                   (list (lambda (text counter)
                           (let ((num (string-to-number (match-string 1))))
                             (format "arg%i" (if (>= num n)
                                                 (+ 1 num)
                                               num)))))
                   t t nil nil nil start end))

(defun north-query-swap (from to &optional start end)
  (interactive
   (list (read-string "Swap: ")
         (read-string "With: ")
         (if (use-region-p) (region-beginning))
         (if (use-region-p) (region-end))))
  (perform-replace (format "\\(%s\\|%s\\)" (regexp-quote from) (regexp-quote to))
                   (list (lambda (a b)
                           (cond
                            ((string= to (match-string 0)) from)
                            ((string= from (match-string 0)) to)
                            (t (error (format "Unknown match: %s" (match-string 0)))))))
                   t t nil nil nil start end))
