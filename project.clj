(defproject grid/grid "0.1.0-SNAPSHOT"
  :license {:name "Eclipse Public License",
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [crate "0.1.0-alpha3"]
                 [jayq "0.1.0-alpha3"]
                 [waltz "0.1.0-alpha1"]]
  :cljsbuild {:builds
              [{:source-path "src",
                :compiler
                {:optimizations :whitespace,
                 :pretty-print true,
                 :output-to "public/js/main.js"}}]}
  :profiles {:dev
             {:source-paths
              ["comp/clojurescript/src/clj"
               "comp/clojurescript/src/cljs"]}}
  :min-lein-version "2.0.0"
  :plugins [[lein-cljsbuild "0.1.8"]]
  :description "none as such")
;;; old project.clj:
;; (defproject grid "0.1.0-SNAPSHOT"
;;   :description "none as such"
;;   :license {:name "Eclipse Public License"
;;             :url "http://www.eclipse.org/legal/epl-v10.html"}
;;   :dependencies [[org.clojure/clojure "1.4.0"]
;;                  [crate "0.1.0-alpha3"]
;;                  [jayq "0.1.0-alpha3"]
;;                  [waltz "0.1.0-alpha1"]]
;;   :dev-dependencies [[lein-cljsbuild "0.1.8"]]
;;   :extra-classpath-dirs ["checkouts/clojurescript/src/clj"
;;                          "checkouts/clojurescript/src/cljs"]
;;   :cljsbuild {:builds
;;               [{:source-path "src"
;;                 :compiler {:optimizations :whitespace
;;                            :pretty-print true
;;                            :output-to "public/js/main.js"}}]})
