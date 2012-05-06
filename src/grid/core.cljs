(ns grid.core
  (:refer-clojure :exclude [remove])
  (:require [waltz.state :as state]
;;            [grid.lang :as l]
            [crate.core :as crate]
            [cljs.reader :as reader]
            [clojure.string :as string]
            [clojure.set :as set]
            [clojure.walk :as walk]
            [clojure.zip :as zip])
  (:use [jayq.core :only [$ append bind remove]])
  (:use-macros [waltz.macros :only [in out defstate defevent]]
               [crate.macros :only [defpartial]]))

(def exec-hierarchy (make-hierarchy))

(def dirs {::right [1 0], ::left [-1 0], ::down [0 1], ::up [0 -1]})
(def comps {::lt <, ::gt >, ::eq =})
(def ariths {::add +, ::sub -, ::mul *, ::mod mod, ::quo quot})
(def refls
  {::diag-pri (fn [[dx dy]] [dy dx])
   ::diag-sec (fn [[dx dy]] [(- dy) dx])
   ::vertical (fn [[dx dy]] [(- dx) dy])
   ::horizontal (fn [[dx dy]] [dx (- dy)])
   ::bounce (fn [[dx dy]] [(- dx) (- dy)])
   ;; ::rand #(rand-nth (vals dirs))
   })

(defn- derive-keys [m p]
  (doseq [i (keys m)]
    (derive i p)))

(derive-keys refls ::reflection)
(derive-keys dirs ::direction)
(derive-keys comps ::comparison)
(derive-keys ariths ::arithmetic)
(derive ::skipping ::empty)

(defrecord CodeState [stack stack-stack reg-stack
                      box w h pos dir
                      skip?]

  IStack
  (-peek [_] (-peek stack))
  (-pop [this] (update-in this :stack pop)))

(defn code-state [w h]
  (CodeState. [] [] [nil]
              {} w h [-1 0] [1 0]
              false))

(defn enstack
  [{:keys [stack stack-stack reg-stack] :as cs} n]
  (let [ct (- (count stack) (peek stack))
        stack (pop stack)]
    (assoc cs
      :stack (subvec stack ct)
      :stack-stack (conj stack-stack (subvec stack 0 ct))
      :reg-stack (conj reg-stack nil))))

(defn unstack [{:keys [stack stack-stack reg-stack] :as cs}]
  (assoc cs
    :stack (into (peek stack-stack) stack)
    :stack-stack (pop stack-stack)
    :reg-stack (if (== 1 (count reg-stack)) [nil]
                   (pop reg-stack))))

(defn push [cs x] (update-in cs [:stack] conj x))
(defn fetch [cs] (peek (cs :reg-stack)))
(defn store [cs x] (update-in cs [:reg-stack] conj x))
(defn ditch [cs] (update-in cs [:reg-stack] pop))
(defn skip [cs b] (assoc cs :skip b))
(defn set-at [env x y val] (assoc-in env [:box [x y]] val))

(defn move
  [{:keys [w h pos dir] :as env}]
  (let [[x y] (map + pos dir)
        nx (cond (< -1 x) (dec w)
                 (< x w) x
                 :else 0)
        ny (cond (< -1 y) (dec h)
                 (< y h) y
                 :else 0)]
    (assoc env :pos [nx ny])))

(defn at
  ([env] (at (env :pos)))
  ([env pos] (get (env :box) pos)))

(defn inst [cs]
  (if (cs :skip?) ::skipping
      (at cs)))

(defmulti exec inst)

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
    (-> c pop pop
        (push (op (-> c pop peek)
                  (-> c peek))))))

(defmethod exec ::empty [c] (skip c false))
(defmethod exec ::skip [c] (skip c true))
(defmethod exec ::skip? [c] (skip c (zero? (peek c))))

(defmethod exec ::dup [cs]
  (update-in cs [:stack] #(conj % (peek %))))



(defmethod exec ::swap2 [{:keys [stack] :as cs}]
  (assoc cs
    :stack (-> stack pop pop
               (conj (-> stack peek))
               (conj (-> stack pop peek)))))

(defmethod exec ::swap3 [{:keys [stack] :as cs}]
  (assoc cs
    :stack (-> stack pop pop pop
               (conj (-> stack peek))
               (conj (-> stack pop pop peek))
               (conj (-> stack pop peek)))))

(defmethod exec ::rev [cs]
  (update-in cs [:stack] (comp vec reverse)))

(defmethod exec ::plen [cs]
  (update-in cs [:stack] #(conj % (count %))))

(defmethod exec ::drop [c] (pop c))
(defmethod exec ::enstack [c] (enstack c))
(defmethod exec ::unstack [c] (unstack c))

(defmethod exec ::store [c]
  (if-let [v (fetch c)]
    (-> c ditch (push v))
    (-> c pop (store (pop c)))))

(defmethod exec ::jump [c]
  (-> c pop pop (assoc :pos [(peek c) (peek (pop c))])))

(defmethod exec ::get [c]
  (-> c pop pop (push (get-at c [(peek c) (peek (pop c))]))))

(defmethod exec ::place [c]
  (-> c pop pop pop
      (set-at (peek c) (peek (pop c)) (pop c))))

(defmethod exec ::halt [c] (throw (js/Error. "HALT")))

(defn tick [code] (-> code move exec))

(def cstate (atom nil))

(defpartial error [msg]
  [:div.error [:p msg]])

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
   ::quo "\u00F7" ;; division symbol
   ::diag-pri "\u2572" ;; \
   ::diag-sec "\u2571" ;; /
   ::vertical "|"
   ::horizontal "\u2015" ;; --
   ::bounce "\u2573" ; times
   ::lt "<"
   ::gt ">"
   ::eq "="
   ::mod "%"
   ::skip "!"
   ::skip? "?"
   ::dup "\u2564" ;; some sort of arrow i think
   ::swap2 "\u21C5" ;; v^
   ::swap3 "~"
   ::drop "\u0394" ;; delta
   ::place "\u03A0" ;; pi
   ::get "\u0393" ;; gamma
   ::jump "\u2933" ;; jumpy arrow
   ::store "\u25CA" ;; weird circle
   ::enstack "\u03B5" ;; epsilon
   ::unstack "\u03C5" ;; upsilon
   ::plen "\u03BB" ;; lambda
   ::rev "\u02B6" ;; upside down r
   })

(defpartial cell [r c inst]
  [:div {:data-row r
         :data-col c
         :class "cell"
         :title (if inst (name inst) "empty")}
   (inst->string inst)])

(defpartial cells [{:keys [w h box pos]}]
  [:table#cells
   (map (fn [row]
          [:tr.row
           (map (fn [col]
                  (let [cell (cell row col (box [col row]))]
                    (if (= [col row] pos)
                      [:td.active cell]
                      [:td cell])))
                (range w))])
        (range h))])

(defpartial stack [{:keys [stack]}]
  (let [s (reverse
           (map (fn [e]
                  (if (keyword? e)
                    [:li.code (inst->string e)]
                    [:li.value (str e)]))
                stack))]
   [:div#stack-wrap
    [:ul#stack
     (if (> 10 (count s)) s
         (-> (take 9 s) vec (conj [:li "..."]) seq))]]))


(defn initialize [cs]
  (-> cs
      (set-at 0 0 ::down)
      (set-at 0 3 ::left)
      (set-at 5 0 ::halt)
      (set-at 7 0 ::left)
      (set-at 7 3 ::up)
      (set-at 5 5 ::quo)
      (push ::enstack)
      (push 3002)
      (push ::plen)
      (push ::rev)
      (push ::store)
      (push ::get)
      (push ::jump)
      (push ::diag-pri)
      move))

(defn set-size! [w h]
  (reset! cstate (initialize (code-state w h)))
  (remove ($ :#cells))
  (remove ($ :#stack-wrap))
  (-> ($ :#grid)
      (append (cells @cstate))
      (append (stack @cstate))))

(defn init []
  (set-size! 10 10)
  )
(init)