# Port Numbered Network Simulator

This simulator can be used to test the behaviour of 
distributed algorithms written
for the [PN Model](https://dl.acm.org/doi/abs/10.1145/800141.804655). It is a [self-contained web-application](https://pn-network-simulator.sspilsbury.com)
that runs entirely in your browser and comes pre-packed
with an implementation of some distributed algorithms
like graph color reduction, bipartite maximal matching
and a 3-approximation of the vertex cover problem.

The interface provides a way to input the graph
and the port numberings for each edge. There isn't
any validation done to check that the port numberings
that you choose are valid, in general, you must ensure
that each edge with degree `k` has incident
ports `0` to `k - 1` and that no two endpoints ports
for a node share the same port number. The node IDs
can be any numeric unique identifier - these are used
later when calling the `init` function to define the
initial state if you want to use the `LOCAL` model.

To write your own algorithms against the model, you
need to define three functions: `init`, `send` and 
`receive`. The critical difference between this
simulator and other simulators is that these
functions can be written as *arbitrary stateless
javascript functions* and debugged as such, which
should make it slightly easier to try out new
algorithms without being restricted to a purely
functional formalism.

You can input the graph link definition
and the relevant functions into the text boxes
in which they appear. A function will be automatically
loaded as soon as it is valid JavaScript code.

Each are detailed in the sections below

## `init` function

This function takes the following form:

```js
(n, d) => ([...])
```

The function returns the initial state tuple for a
given node with unique identifier `n` and degree `d`.
Note that if you rely on `n`, your algorithm is,
strictly speaking, operating in the `LOCAL` model, but
you are free to just ignore `n`. `d` tells you the
degree of a node. The total number of nodes in
the network is not known.

This gets called once per node every time the
structure of the network is changed, or you
load in a new algorithm. You can still change the
initial states for each node manually down below
by editing the tuples yourself.

There is also a convenience function for the sake
of bipartite maximal matching to 2-color the
graph using a BFS traversal. You can specify which
element in the tuple the result of the 2-coloring
gets saved into.

## `send` function

This function takes the following form:

```js
(r, p, s) => ([...])
```

The function returns a message for port `p` given
round `r` and state `s`. The returned message can
be any JavaScript object, but typically you'd return
a tuple of some sort. Each node gets its
`send` function called once for each of its
outgoing ports on each round. The send `send` function
cannot change states and node states in the network
are guaranteed not to change until all `send` functions
have been called for all ports. The messages are all
collected for later delivery.

## `receive` function

This function takes the following form:

```js
(r, s, m) => ([...])
```

The function returns a new state for a node given
its current state `s`, the round `r` and its
incoming messages `m`. This function is called
once per node per round.

The incoming messages `m` are ordered by the
receiving port numbers, so an array index `i`
in `m` corresponds to a message received by port `i`.
A convenient way to figure out the port numbers for
each message is to do something like:

```js
const messagePorts = m.map((msg, p) => ([msg, p]));
```

Which packs each message into a tuple where the first
element is the message and the second is the receiving
port.

The `receive` function must return a new state for
the node once it terminates. The retured state
is blindly taken as the new state for the node, so
be careful not to return nothing otherwise
your new node state will be `undefined`!.

# Debugging the functions

There is also a level of debuggability in the
each of the functions which you can use with the
built in browser-debugger. If you open up
the sources tab in your browser debugger, under
"(no domain)" you should see that you have
three scripts:

 - `init-func.js`: The `init` function
 - `send-func.js`: The `send` function
 - `receive-func.js`: The `receive` function

You can set breakpoints and debug here as usual.
They will be updated if you update the program code
in the text boxes.
