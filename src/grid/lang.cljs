(ns grid.core
  (:refer-clojure :exclude [get])
  (:require [cljs.reader :as reader]
            [clojure.string :as string]
            [clojure.set :as set]
            [clojure.walk :as walk]
            [clojure.zip :as zip]))

(defprotocol IRegister
  (store [r x])
  (fetch [r])
  (ditch [r]))

(defprotocol IMultiStack
  (enstack [coll])
  (unstack [coll]))

(defprotocol IStackExt
  (rev [coll])
  (push [coll x])
  (dup [coll])
  (plen [coll])
  (swap2 [coll])
  (swap3 [coll]))

(defprotocol IMobileBox
  (move [this])
  (move-to [this pos])
  (turn [this f])
  (turn-to [this dir])
  (at [this])
  (at [this p])
  (place [this x y v]))

(defprotocol ICodeState
  (skip [_ b])
  (inst [_]))

(deftype MultiStack [stack stack-stack reg-stack]
  IStack
  (-peek [_] (peek stack))
  (-pop [_] (MultiStack. (pop stack) stack-stack reg-stack))
  IStackExt
  (rev [_] (MultiStack. (vec (reverse stack)) stack-stack reg-stack))
  (push [_ x] (MultiStack. (conj stack x) stack-stack reg-stack))
  (dup [_] (MultiStack. (conj stack (peek stack)) stack-stack reg-stack))
  (plen [_] (MultiStack. (conj stack (count stack)) stack-stack reg-stack))
  (swap2 [_]
    (MultiStack. (-> stack pop pop
                     (conj (-> stack peek))
                     (conj (-> stack pop peek)))
                 stack-stack
                 reg-stack))
  (swap3 [_]
    (MultiStack. (-> stack pop pop pop
                     (conj (-> stack peek))
                     (conj (-> stack pop pop peek))
                     (conj (-> stack pop peek)))
                 stack-stack
                 reg-stack))
  IRegister
  (fetch [_] (peek reg-stack))
  (store [_ x] (MultiStack stack stack-stack (conj reg-stack x)))
  (ditch [_] (MultiStack. stack stack-stack (pop reg-stack)))
  IMultiStack
  (enstack [_]
    (let [ct (- (count stack) (peek stack))
          stack (pop stack)]
      (MultiStack. (subvec stack ct)
                   (conj stack-stack (subvec stack 0 ct))
                   (conj reg-stack nil))))
  (unstack [_]
    (MultiStack. (into (peek stack-stack) stack)
                 (pop stack-stack)
                 (if (== 1 (count reg-stack)) [nil]
                     (pop reg-stack)))))

(deftype Env [box w h pos dir]
  IMobile
  (move [_]
    (let [[x y] (map + pos dir)
          nx (cond (< -1 x) (dec w)
                   (< x w) x
                   :else 0)
          ny (cond (< -1 y) (dec h)
                   (< y h) y
                   :else 0)]
      (Env. box w h [nx ny] dir)))
  (move-to [_ npos] (Env. box w h npos dir))
  (turn [_ f] (Env. box w h pos (f dir)))
  (turn-to [_ ndir] (Env. box w h pos ndir))
  (at [this] (or (box pos) ::empty))
  (at [_ p] (or (box p) ::empty))
  (place [_ x y v] (Env. (assoc box []))))

(deftype CodeState [mstack env skip?]
  IStack
  (-peek [_] (-peek mstack))
  (-pop [_] (CodeState. (-pop mstack) env skip?))
  IStackExt
  (rev [_] (CodeState. (rev mstack) env? skip?))
  (push [_ x] (CodeState. (push mstack x) env skip?))
  (dup [_] (CodeState. (dup mstack) env skip?))
  (swap2 [_] (CodeState. (swap2 mstack) env skip?))
  (swap3 [_] (CodeState. (swap3 mstack) env skip?))
  IMultiStack
  (enstack [_] (CodeState. (enstack mstack) env skip?))
  (unstack [_] (CodeState. (unstack mstack) env skip?))
  IRegister
  (store [_ x] (CodeState. (store x) env skip?))
  (fetch [_] (fetch mstack))
  (ditch [_] (CodeState. (ditch x) env skip?))
  IMobile
  (move [_] (CodeState. mstack (move env) skip?))
  (move-to [_ npos] (CodeState. mstack (move-to env npos) skip?))
  (turn [_ f] (CodeState. mstack (turn env f) skip?))
  (turn-to [_ ndir] (CodeState. mstack (turn-to env ndir) skip?))
  (place [_ x y v] (CodeState. mstack (place env x y v) skip?))
  (at [_] (at env))
  (at [this p] (at env p))
  ICodeState
  (skip [_ b] (CodeState. mstack env b))
  (inst [this]
    (let [i (at this)]
      (cond skip? ::skipping
            :else i))))

(defn code-state [w h]
  (CodeState. (MultiStack. [] [] [nil])
              (Env. {} w h [-1 0] [1 0])
              false))

(def dirs {::right [1 0], ::left [-1 0], ::down [0 1], ::up [0 -1]})
(def comps {::lt <, ::gt >, ::eq =})
(def ariths {::add +, ::sub -, ::mul *, ::mod mod, ::quo quot})

(def refls
  {::diag-pri (fn [[dx dy]] [dy dx])
   ::diag-sec (fn [[dx dy]] [(- dy) dx])
   ::vertical (fn [[dx dy]] [(- dx) dy])
   ::horizontal (fn [[dx dy]] [dx (- dy)])
   ::bounce (fn [[dx dy]] [(- dx) (- dy)])
   ::rand #(rand-nth (vals dirs))})

(defn- derive-keys [m p]
  (doseq [i (keys m)]
    (derive i p)))

(derive-keys refls ::reflection)
(derive-keys dirs ::direction)
(derive-keys comps ::comparison)
(derive-keys ariths ::arithmetic)
(derive ::skipping ::empty)

(defmulti exec inst)

(defmethod exec ::reflection [c]
  (turn c (refls (at c))))

(defmethod exec ::direction [c]
  (turn-to c (dirs (at c))))

(defmethod exec ::comparison [code]
  (let [c (comps (at code))]
    (-> code pop pop
        (push (if (c (-> code pop peek)
                     (-> code peek))
                1 0)))))

(defmethod exec ::arithmetic [c]
  (let [op (ariths (at c))]
    (-> code pop pop
        (push (op (-> code pop peek)
                  (-> code peek))))))

(defmethod exec ::empty [c] (skip c false))
(defmethod exec ::skip [c] (skip c true))
(defmethod exec ::skip? [c]
  (skip c (zero? (peek c))))

(defmethod exec ::dup [c] (dup c))
(defmethod exec ::drop [c] (pop c))
(defmethod exec ::swap2 [c] (swap2 c))
(defmethod exec ::swap3 [c] (swap3 c))
(defmethod exec ::rev [c] (rev c))

(defmethod exec ::enstack [c] (enstack c))
(defmethod exec ::desatck [c] (destack c))

(defmethod exec ::store [c]
  (if-let [v (fetch c)]
    (-> c ditch (push v))
    (-> c pop (store (pop c)))))


(defmethod exec ::jump [c]
  (-> c pop pop
      (move-to [(peek c) (peek (pop c))])))

(defmethod exec ::get [c]
  (-> c pop pop
      (push (at c [(peek c) (peek (pop c))]))))

(defmethod exec ::place [c]
  (-> c pop pop pop
      (place [(peek c) (peek (pop c))]
             (pop c))))

(defmethod exec ::halt [c]
  (throw (js/Error. "HALT")))

(defn tick [code]
  (-> code move exec))
