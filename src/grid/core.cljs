(ns grid.core
  (:require [waltz.state :as state]
            [crate.core :as crate]
            [cljs.reader :as reader]
            [clojure.string :as string]
            [clojure.set :as set]
            [clojure.walk :as walk]
            [clojure.zip :as zip])
  (:use [jayq.core :only [$ append bind]])
  (:use-macros [waltz.macros :only [in out defstate defevent]]
               [crate.macros :only [defpartial]]))







(defpartial cell [r c]
  [:div {:data-row r
         :data-col c
         :class "cell"}])

(defpartial cells [w h]
  [:table#cells
   (doall
    (map (fn [row]
           [:tr.row
            (doall
             (map #(vector :td (cell row %))
                  (range w)))])
         (range h)))])

(append ($ :#grid)
        (cells 10 10))
