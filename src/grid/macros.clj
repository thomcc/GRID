(ns grid.macros)



(defmacro dbg [m & vs]
  `(let [o# (do ~@vs)]
     (when grid.core/debug?
       (.log js/console (str "DEBUG (" ~m "): " (pr-str o#))))
     o#))
