(ns grid.canvas
  (:use-macros [grid.macros :only [with-path with-save]]))

;; a canvas library i've been accumulating and planning on eventually
;; releasing

(defn- ensure-str
  "Ensures that its argument is a string. Strings are returned,
  Keywords have name called on them, and anything else gets .toString"
  [s]
  (cond (string? s) s
        (keyword? s) (name s)
        :else (.toString s)))

(defn context
  "Gets the 2d context for the canvas"
  [cvs]
  (.getContext cvs "2d"))

(defn resize
  "Resize the canvas to w, h"
  [cvs w h]
  (doto cvs
    (set! -width w)
    (set! -height h)))

(defn make-canvas
  "Create a new canvas of size w by h"
  [w h]
  (doto (.createElement js/document "canvas")
    (set! -width w)
    (set! -height h)))

(defn fill-style
  "Sets the fill-style of the context."
  [ctx color]
  (doto ctx
    (set! -fillStyle color)))

(defn stroke-style
  "Sets the stroke-style of the context"
  [ctx color]
  (doto ctx
    (set! -strokeStyle color)))

(defn style
  "Sets both the fill and stroke style of the context"
  [ctx color]
  (doto ctx
    (fill-style color)
    (stroke-style color)))

(defn shadow-x
  "Set the shadowOffsetX attribute to x"
  (doto ctx
    (set! -shadowOffsetX x)))

(defn shadow-y
  "Set the shadowOffsetY attribute to y"
  [ctx y]
  (doto ctx
    (set! -shadowOffsetY y)))

(defn shadow-offset
  "Sets the shadowOffsetX and shadowOffsetY properties to x and y"
  [ctx x y]
  (doto ctx
    (set! -shadowOffsetX x)
    (set! -shadowOffsetY y)))

(defn shadow-blur
  "set's the shadow blur to `blur`"
  [ctx blur]
  (set! ctx -shadowBlur blur))

(defn shadow-color
  "Set's the shadow color to `col`"
  [ctx col]
  (doto ctx
    (set! -shadowColor col)))

(defn line-width
  "Sets the line-width of the context"
  [ctx wid]
  (doto ctx
    (set! -lineWidth wid)))

(defn fill-rect
  "Fills a rectangle on the context"
  [ctx x y w h]
  (doto ctx
    (.fillRect x y w h)))

(defn stroke-rect
  "Strokes a rectangle on the context."
  [ctx x y w h]
  (doto ctx
    (.strokeRect x y w h)))

(defn clear-rect
  "Clears a rectangle on the context."
  [ctx x y w h]
  (doto ctx
    (.clearRect x y w h)))

(defn rect
  "Adds a rectangle to the path."
  [ctx x y w h]
  (doto ctx
    (.rect x y w h)))

(defn move-to
  "Move to x, y"
  [ctx x y]
  (doto ctx
    (.moveTo x y)))

(defn line-to
  "Draw a line from the current point to x, y"
  [ctx x y]
  (doto ctx
    (.lineTo x y)))

(defn line-cap
  "Set the context's lineCap attribute. Accepts strings or keywords as its
  second argument.

  Possible values: `#{:butt :round :square}`"
  [ctx which]
  (doto ctx
    (set! -lineCap (ensure-str which))))

(defn line-join
  "Set the context's lineJoin attribute.  Accepts strings or keywords as
  its second argument.

  Possible values: `#{:round :bevel :miter}`"
  [ctx which]
  (doto ctx
    (set! -lineJoin (ensure-str which))))

(defn miter-limit
  "Set the context's miterLimit attribute"
  [ctx lim]
  (doto ctx
    (set! -miterLimit lim)))

(defn alpha
  "Set the contexts globalAlpha attribute."
  [ctx a]
  (doto ctx
    (set! -globalAlpha a)))

(defn composite
  "Set the context's globalCompositeOperation attribute. Accepts strings
  or keywords as its second argument.

  Possible values: `#{:source-over :source-in :source-out :source-atop :destination-over :destination-in :destination-out :destination-atop :lighter :darker :copy :xor}`"
  [ctx c]
  (doto ctx
    (set! -globalCompositeOperation (ensure-str c))))

(defn quad-to
  "Equivalent to (.quadraticCurveTo ctx x0 y0 x1 y1)."
  [ctx x0 y0 x1 y1]
  (doto ctx
    (.quadraticCurveTo x0 y0 x1 y1)))

(defn bezier-to
  "Equivalent to (.bezierCurveTo ctx x0 y0 x1 y1 x2 y2)"
  [ctx x0 y0 x1 y1 x2 y2]
  (doto ctx
    (.bezierCurveTo x0 y0 x1 y1 x2 y2)))

(defn stroke
  "Stroke the context's current path"
  [ctx]
  (doto ctx .stroke))

(defn fill
  "Fill the context's current path"
  [ctx]
  (doto ctx .fill))

(defn fill-text
  "Fill `text` at x, y using the context's current font and fill style"
  [ctx text x y]
  (doto ctx
    (.fillText text x y)))

(defn stroke-text
  "Stroke `text` at x, y using the context's current font and stroke style"
  [ctx text x y]
  (doto ctx
    (.strokeText text x y)))

(defn text-width
  "Measure the text, returning it's width (after transformation)"
  [ctx text]
  (.. ctx (measureText text) -width))

(defn begin-path
  "Begin a context path, destroying any existing one."
  [ctx]
  (doto ctx .beginPath))

(defn close-path
  "Close the context path."
  [ctx]
  (doto ctx .closePath))

(defn arc
  "equivalent to (.arc ctx x y radius start-angle end-angle anti-clocwise?)"
  [ctx x y radius start-angle end-angle anti-clockwise?]
  (doto ctx
    (.arc x y radius start-angle end-angle anti-clockwise?)))

(defn arc-to
  "equivalent to (.arcTo ctx x1 y1 x2 y2 rad)"
  [ctx x1 y1 x2 y2 rad]
  (doto ctx
    (.arcTo x1 y1 x2 y2 rad)))

(defn point-in-path?
  "Is the point x, y in the contexts current path?"
  [ctx x y]
  (.isPointInPath ctx x y))

(defn clip
  "Set's the context's clipping path to be the contexts current path."
  [ctx]
  (doto ctx .clip))

(defn translate
  "Translate the contexts transformation matrix by x, y"
  [ctx x y]
  (doto ctx
    (.translate x y)))

(defn rotate
  "Rotate the contexts transformation matrix by r radians"
  [ctx r]
  (doto ctx
    (.rotate r)))

(defn transform
  "Multiplies the context's current transformation matrix by

      m11    m12    dx
      m12    m22    dy
      0      0      1"
  [ctx m11 m12 m21 m22 dx dy]
  (doto ctx
    (.transform m11 m12 m21 m22 dx dy)))

(defn set-transform
  "Set the contexts current transformation matrix to

      m11    m12    dx
      m12    m22    dy
      0      0      1"
  [ctx m11 m12 m21 m22 dx dy]
  (doto ctx
    (.setTransform m11 m12 m21 m22 dx dy)))

(defn scale
  "Takes one or two arguments.  Either scale context by x horizontally
  and y vertically, or scale context by s horizontally and vertically."
  ([ctx s]
     (doto ctx (.scale s s)))
  ([ctx x y]
     (doto ctx (.scale x y))))

(defn linear-gradient
  "create a linear gradient from x0, y0 to x1, y1"
  [ctx x0 y0 x1 y1]
  (.createLinearGradient ctx x0 y0 x1 y1))

(defn radial-gradient
  "Create a radial gradient from x0, y0, r0 to x1, y1, r1"
  [ctx x0 y0 r0 x1 y1 r1]
  (.createRadialGradient ctx x0 y0 r0 x1 y1 r1))

(defn pattern
  "Create a canvas pattern. Second arg can be an image, video, or canvas
  Third arg can be a string or keyword.

  Possible values for `rep`: `#{:repeat :repeat-x :repeat-y :no-repeat}`"
  [ctx img rep]
  (.createPattern ctx img (ensure-str rep)))

(defn add-stop
  "Add a color stop of `off`, `col` to a CanvasGradient."
  [grad off col]
  (doto grad
    (.addColorStop off col)))

(defn clear
  "Takes a canvas (and not a context) as its argument. If given a
  color argument, fills a rect the size of the canvas with that color.
  Otherwise, clears a rect the size of the canvas.

  See also clear-rect."
  ([cvs]
     (.. (context cvs) (clearRect 0 0 (.-width cvs) (.-height cvs)))
     cvs)
  ([cvs col]
     (saving (context cvs)
       (fill-style col)
       (fill-rect 0 0 (.-width cvs) (.-height cvs)))
     cvs))

(defn font
  "set the context's font to the given font string."
  [ctx f]
  (doto ctx
    (set! -font f)))

(defn text-align
  "Sets the context's text align to the given value. value can be
  a string or a keyword.

  Possible values for val: `#{:start :end :left :right :center}`"
  [ctx val]
  (doto ctx
    (set! -textAlign (ensure-str val))))

(defn text-baseline
  "Sets the context's text baseline to the given value. can be string
  or keyword.

  Possible values for val: `#{:top :hanging :middle :alphabetic :idiographic :bottom}`")


(defn draw-image
  "Draw an image on the context. "
  ([ctx img dx dy & [dw dh]]
     (doto ctx
       (.drawImage img dx dy dw dh)))
  ([ctx img sx sy sw sh dx dy dw dh]
     (doto ctx
       (.drawImage img sx sy sw sh dx dy dw dh))))

(defn restore
  "Restores the context. See also gasket.macros/with-save"
  [ctx]
  (doto ctx .restore))

(defn save
  "Saves the context. See also gasket.macros/with-save"
  [ctx]
  (doto ctx .save))


(defn data-url
  "Get the data url for the canvas.  Optional type parameter defaults to
  image/png. If type is img/jpeg or image/webp then the third argument
  is used as quality."
  ([cvs] (data-url cvs "image/png"))
  ([cvs type] (.toDataURL cvs type))
  ([cvs type quality-if-jpeg] (.toDataURL cvs type quality-if-jpeg)))

(defn create-image-data
  "Create image data based either on the provided image data, or
  the provided width and height"
  ([ctx idata]
     (.createImageData ctx idata))
  ([ctx w h]
     (.createImageData ctx w h)))

(defn get-image-data
  "Get the image data at x, y with dimensions w, h"
  [ctx x y w h]
  (.getImageData ctx x y w h))

(defn put-image-data
  "Put image data at x y w h, with optional dx dy dw dh parameters"
  [ctx idata x y w h & [dx dy dw dh]]
  (doto ctx
    (.putImageData idata x y w h dx dy dw dh)))
