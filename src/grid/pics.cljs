(ns grid.pics
  (:require [grid.canvas :as c])
  (:use-macros [grid.macros :only [with-path save-path pathing saving]]))

(defmulti draw identity)
