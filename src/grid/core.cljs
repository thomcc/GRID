(ns grid.core
  (:refer-clojure :exclude [remove])
  (:require [crate.core :as crate]
            [clojure.string :as string])
  (:use [jayq.core :only [$ append bind remove on add-class remove-class]])
  (:use-macros [crate.macros :only [defpartial]]
               [grid.macros :only [dbg]]))

(def debug? true)

(def dirs {::right [1 0], ::left [-1 0], ::down [0 1], ::up [0 -1]})
(def comps {::lt <, ::gt >, ::eq =})
(def ariths {::add +, ::sub -, ::mul *, ::mod mod, ::quo quot})
(def refls {::diag-pri (fn [[dx dy]] [dy dx])
            ::diag-sec (fn [[dx dy]] [(- dy) (- dx)])
            ::vertical (fn [[dx dy]] [(- dx) dy])
            ::horizontal (fn [[dx dy]] [dx (- dy)])
            ::bounce (fn [[dx dy]] [(- dx) (- dy)])})

(defn- derive-keys [m p]
  (doseq [i (keys m)]
    (derive i p)))

(derive-keys refls ::reflection)
(derive-keys dirs ::direction)
(derive-keys comps ::comparison)
(derive-keys ariths ::arithmetic)
(derive ::skipping ::empty)

(defrecord CodeState [stack box w h pos dir skip? halted? error]
  IStack
  (-peek [_] (-peek stack))
  (-pop [this] (update-in this [:stack] pop)))

(defn code-state [w h]
  (CodeState. [] {} w h [-1 0] [1 0] false false nil))

(defn ohno [cs] (assoc cs :error (:pos cs) :halted? true))
(defn push [cs x] (update-in cs [:stack] conj x))
(defn skip [cs b] (assoc cs :skip? b))
(defn set-at [env pos val] (assoc-in env [:box pos] val))
(defn move [{w :w h :h [x y] :pos [dx dy] :dir :as env}]
  (assoc env :pos [(mod (+ w x dx) w) (mod (+ h y dy) h)]))

(defn at [cs & [pos]]
  (get-in cs [:box (or pos (get cs :pos))]))

(defn inst [cs]
  (dbg "inst"
    (if (get cs :skip?) ::skipping
        (or (at cs) ::empty))))

(defmulti exec inst)

(defmethod exec :default [c]
  (dbg "lit"
    (push c (at c))))

(defmethod exec ::reflection [cs]
  (update-in cs [:dir] (refls (at cs))))

(defmethod exec ::direction [cs]
  (assoc cs :dir (dirs (at cs))))

(defmethod exec ::comparison [code]
  (let [c (comps (at code))]
    (-> code pop pop
        (push (if (c (-> code pop peek)
                     (-> code peek))
                1 0)))))

(defmethod exec ::arithmetic [c]
  (let [op (ariths (at c))]
    (-> c pop pop (push (op (-> c pop peek)
                            (-> c peek))))))

(defmethod exec ::empty [c] (skip c false))
(defmethod exec ::skip! [c] (skip c true))
(defmethod exec ::skip? [c] (skip c (not (zero? (peek c)))))
(defmethod exec ::drop [c] (pop c))
(defmethod exec ::dup [cs]
  (update-in cs [:stack] #(conj % (peek %))))

(defmethod exec ::swap [{:keys [stack] :as cs}]
  (assoc cs :stack (-> stack pop pop
                       (conj (-> stack peek))
                       (conj (-> stack pop peek)))))

(defmethod exec ::jump [c]
  (-> c pop pop (assoc :pos [(peek c) (peek (pop c))])))

(defmethod exec ::get [c]
  (-> c pop pop (push (at c [(peek c) (peek (pop c))]))))

(defmethod exec ::place [c]
  (-> c pop pop pop (set-at [(peek c) (peek (pop c))]
                            (-> c pop pop peek))))

(defmethod exec ::halt [c] (assoc c :halted? true))

(defn tick [code]
  (dbg "tick"
    (if-not (:halted? code)
      (-> code move exec)
      code)))

(def cstate (atom nil))
(defn code? [v] (keyword? v))
(def inst->string
  {nil ""
   ::left "\u2190" ;; < arrow
   ::up "\u2191" ;; ^ arrow
   ::right "\u2192" ;; > arrow
   ::down "\u2193" ;; v arrow
   ::halt "H"
   ::add "+"
   ::sub "-"
   ::mul "*"
   ::mod "%"
   ::lt "<"
   ::gt ">"
   ::eq "="
   ::quo "\u00F7" ;; division symbol
   ::diag-pri "\u2572" ;; \
   ::diag-sec "\u2571" ;; /
   ::vertical "|"
   ::horizontal "\u2015" ;; --
   ::bounce "\u2573" ; times
   ::dup "\u2564" ;; some sort of arrow i think
   ::swap "\u21C5" ;; v^
   ::drop "\u0394" ;; delta
   ::place "\u03A0" ;; pi
   ::get "\u0393" ;; gamma
   ::jump "\u2933" ;; jumpy arrow
   ::skip! "!"
   ::skip? "?"})

(defpartial cell [r c {:keys [box pos error]}]
  [:div {:data-row r
         :data-col c
         :class (cond (= error [c r]) "cell error"
                      (= [c r] pos) "cell active"
                      :else "cell")}
   (if-let [is (inst->string (box [c r]))] is
           (str (box [c r])))])

(defpartial cells [{:keys [w h box pos] :as code}]
  [:table#cells
   (map (fn [row]
          [:tr.row
           (map #(vector :td (cell row % code))
                (range w))])
        (range h))])

(defpartial control [ctrl]
  [:a.ctrl {:href "#" :id ctrl} (string/capitalize ctrl)])

(defpartial controls [cs]
  [:div#controls
   (map control cs)])

(defpartial stack [{:keys [stack]}]
  (let [s (reverse
           (map (fn [e]
                  (if (code? e)
                    [:li.code (inst->string e)]
                    [:li.value (str e)]))
                stack))]
   [:div#stack-wrap
    [:ul#stack
     (if (> 10 (count s)) s
         (-> (take 9 s) vec (conj [:li "..."]) seq))]]))

(defn set-ui [cstate]
  (remove ($ :#cells))
  (remove ($ :#stack-wrap))
  (-> ($ :#grid)
      (append (cells cstate))
      (append (stack cstate))))

(def init-box
  {[0 0] ::down [1 0] ::right,[3 0] ::down,[7 0] ::jump [3 1] ::right,[4 1] 1
   [5 1] 8,[6 1] ::place,[1 2] ::up,[3 2] ::get,[4 2] 5,[5 2] 7 [6 2] ::left,[0 3]
   ::diag-sec,[7 3] ::swap,[8 3] ::skip! [7 4] 7,[0 5] ::right,[1 5] 3 [2 5]
   ::skip!,[3 5] ::diag-sec,[6 5] ::skip!,[7 5] ::diag-pri [9 5] ::diag-pri,
   [0 6] ::down,[0 7] 1 [5 7] ::halt,[9 7] ::skip?,[0 8] 6 [9 8] ::horizontal,
   [0 9] ::jump,[3 9] ::diag-pri,[6 9] ::sub [7 9] 1,[9 9] ::diag-sec})

(defn set-size! [w h]
  (reset! cstate (assoc (code-state w h) :box init-box))
  (set-ui @cstate))

(def ctls ["run" "step" "reset"])

(def running? (atom false))

(defn step []
  (try
    (let [ns (tick @cstate)]
      (reset! cstate ns))
    (catch js/Error e
      (swap! cstate ohno)))
  (set-ui @cstate))

(defn run []
  (when @running?
    (step)
    (if (:halted? @cstate)
      (stop)
      (js/setTimeout run 100))))

(defn go []
  (add-class ($ :#run) "active")
  (reset! running? true)
  (js/setTimeout run 100))

(defn stop []
  (remove-class ($ :#run) "active")
  (reset! running? false))

(defn reset []
  (stop)
  (set-size! 10 10))

(defn clickwrap [f]
  (fn [e] (.preventDefault e) (f e)))

(defn init []
  (set-size! 10 10)
  (append ($ :#grid) (controls ctls))
  (on ($ :#step) :click (clickwrap step))
  (on ($ :#run) :click (clickwrap #(if @running? (stop) (go))))
  (on ($ :#reset) :click (clickwrap reset)))



(init)
