(ns grid.macros)

;; from unfinished canvas lib mentioned in canvas.cljs

(defmacro with-save
  "Macro. Evaluates c, which should return a canvas context,
  saves that context, evaluates the forms in succession, before
  restoring the context"
  [c & forms]
  `(let [c# ~c]
     (.save c#)
     ~@forms
     (.restore c#)))

(defmacro saving
  "Macro. Same as with-save, however forms are evaluated inside of a
  doto."
  [c & forms]
  `(doto ~c
     (.save)
     ~@forms
     (.restore)))

(defn with-path
  "Macro. Evaluates c, which should return a canvas context,
  begins a path on the context, evaluates the forms in succession
  before closing the path on the context"
  [c & forms]
  `(let [c# ~c]
     (.beginPath c#)
     ~@forms
     (.closePath c#)))

(defmacro pathing
  "Macro. Same as with-path, but forms are evaluated inside of a
  doto."
  [c & forms]
  `(doto ~c
     (.beginPath)
     ~@forms
     (.closePath)))
