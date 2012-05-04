# Grid language reference/planning/ideas

## General

* Stack based
* 2 dimensional execution context
* inspired largely by <>< with several different design decisions

### types

* need numerics
    * only ints?
    * floats?
    * just use js nums?
* going to have code/functions too
* booleans are 0 and non-zero
* characters?


### i/o

* no idea. could use canvas operations exclusively, for some real
  weirdness. then maybe primitives for colors
* probably should support printing at the very least though

## Instructions

### Meta-instructions

instructions generated internally, don't draw.

* skipping: a no-op. occurs when an instruction is skipped
* empty: also a no-op. signifies the IP is on an empty spot

### Reflections

* diag-pri: changes direction from [x y] to [y x]
    + that is, it swaps dx and dy
    + should draw as a line from top-left to bottom-right in its cell
* diag-sec: changes direction from [x y] to [-y x]
    + should draw as a line from bottom-left to top-right in its cell
* vertical: changes direction from [x y] to [-x y]
    + no-op if moving up/down
    + reflects x otherwise
    + should draw as vertical line
* horizontal: changes direction from [x y] to [x -y]
    + no-op if moving left/right
    + reflects y otherwise
    + should draw as horizontal line
* bounce: change direction from [x y] to [-x -y]
    + reflects current direction no matter what it is
    + undecided how to draw. maybe as vert and horiz overlapping
* rand: randomly sets direction
    + should draw similar to bounce with a ? over it

### Directions

all draw as arrows in a given direction

* up: set direction to [0 -1]
* down: set direction to [0 1]
* left: set direction to [-1 0]
* right: set direction to [1 0]

### Comparison/Arithmetic

numeric operations.

* lt: pop x and y off stack, push 1 if x < y, 0 otherwise
* gt: see above but with x > y
* eq: see above but with x = y
* add: pop x and y off stack, push x+y
* sub: pop x and y off stack, push x-y
* mul: pop x and y off stack, push x*y
* mod: pop x and y off stack, push x%y
* quo: pop x and y off stack, push (x-(x%y))/y

should all draw as their mathematical symbols

### execution

* skip: skip next turn
    + draw as ???
* skip?: pop v off stack. if v is 0, skip next turn, otherwise dont
    + draw as ???
* halt: halts the program
    + stop sign or empty octagon probably


### stack modification

* dup: duplicate top of stack
    + draw as [a a ...] vertically
* drop: discard top of stack
    + draw as a [b ...] vertically
* swap2: swap top two elems of stack
    + draw as [b a | c d ...] vertically
* swap3: swap top 3 elems of stack
    + draw as [b c a | d e...] vertically or something like that
* rev: reverses stack
    + no clue how to draw this.  somehow an upside down stack?

### multistacks

* enstack: pops n off the stack, creates a new stack with the top n
  items of the current stack.  saves the old stack for later
  restoration
* destack: restores old stack from the stack stack.  pushes the items
  from what was the current stack onto the front of the old stack

really have no idea how to draw  these


### idea:

many ops seem to require animations to convey

### registers

* store: if register is empty, pop x off stack and put in register. if
  register is full, fetch item in register and push on stack
  
### confusing words

* jump: pop x and y off stack.  move instruction pointer to [x y] on grid.
* get: pop x and y off stack. push the instruction located at [x y] on
  grid onto the stack
* place: pop x and y and v off stack. place v at [x y] on grid.



