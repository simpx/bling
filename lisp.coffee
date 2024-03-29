Operations =
    '#t':   true
    '#f':   false
    '+':    (x, y) -> x + y
    '-':    (x, y) -> x - y
    '*':    (x, y) -> x * y
    '/':    (x, y) -> x / y
    '<':    (x, y) -> x < y
    '>':    (x, y) -> x > y
    '<=':   (x, y) -> x <= y
    '>=':   (x, y) -> x >= y
    '=':    (x, y) -> x == y
    'atom': (x)    -> if (x instanceof Array && a.length > 0) then [] else '#t'
    'eq':   (x, y) -> x == y
    'car':  (x)    -> x[0]
    'cdr':  (x)    -> x.slice(1)
    'cons': (x, y) -> [x].concat(y)

Symbol = 'string'
class Env
    constructor: (@properties={}, @outer=null) ->

    find: (key) ->
        if @properties.hasOwnProperty(key) || @outer == null 
            @ 
        else 
            @outer.find(key)

    get: (key) ->
        if @properties.hasOwnProperty(key) then @properties[key] \
            else @outer.get(key)

    set: (key, val) -> 
        @properties[key] = val

global_env = new Env Operations

eva = (x, env=global_env) ->
    if typeof x == Symbol
        env.get(x)
    else if not (x instanceof Array)
        x
    else if x[0] == 'quote'
        [_, exp] = x
        exp
    else if x[0] == 'if'
        [_, test, conseq, alt] = x
        if eva(test, env)
            eva(conseq, env)
        else
            eva(alt, env)
    else if x[0] == 'cond'
        for [test, conseq] in x.slice(1)
            if eva(test, env)
                return eva(conseq, env)
    else if x[0] == 'set!'
        [_, key, exp] = x
        env.find(key).set(key, eva(exp, env))
    else if x[0] == 'define'
        [_, key, exp] = x
        env.set(key, eva(exp, env))
    else if x[0] == 'lambda'
        [_, keys, exp] = x
        ->
            properties = {}
            args = arguments
            keys.forEach((x, i) -> properties[x] = args[i])
            eva(exp, new Env(properties, env))
    else
        exps = [eva(exp, env) for exp in x][0]
        proc = exps.shift()
        proc.apply(null, exps)

read = (s) ->
    multi_read(tokenize(s))

parse = read

tokenize = (string) ->
    string.replace(/('?\()/g,' $1 ').replace(/\)/g,' ) ').replace(/\n/g, '').split(" ").filter((s) -> s != "")

multi_read = (tokens) ->
    while tokens.length > 0
        read_from(tokens)

read_from = (tokens) ->
    if tokens.length == 0
        throw 'unexpected EOF while reading'
    token = tokens.shift()
    if '(' == token or '\'(' == token
        L = []
        while tokens[0] != ')'
            L.push(read_from(tokens))
        tokens.shift()
        if '(' == token then L else ['quote', L]
    else if ')' == token
        throw 'unexpected )'
    else
        atom(token)

atom = (token) ->
    if isNaN(parseFloat(token))
        if '\'' == token[0]
            ['quote', atom(token[1..])]
        else
            token
    else 
        parseFloat(token)

to_string = (exp) -> 
    if exp instanceof Array
        "(" + exp.map(to_string).join(" ") + ")"
    else if typeof exp == 'undefined'
        ''
    else if exp == null
        null
    else if exp is true
        '#t'
    else if exp is false
        '#f'
    else
        exp.toString()

window.repl = (s) ->
    for i in parse(s)
        r = eva(i)
    to_string(r)

a = " (define lifemap '((0 0 0 0 0) 
                        (0 0 1 0 0) 
                        (0 1 0 1 0) 
                        (0 0 2 1 0)
                        (0 0 0 0 0)))
(define size 5)
(define getlist 
  (lambda (x list) 
    (if (= x 1) (car list) 
        (getlist (- x 1) (cdr list)))))
(define getmap
  (lambda (x y map) 
    (getlist x (getlist y map))))
(define getmapx
  (lambda (x y size map)
    (cond ((<= x 0) (getmapx (+ x size) y size map))
          ((<= y 0) (getmapx x (+ y size) size map))
          (#t (getmap x y map)))))
(define nearlifes
  (lambda (x y size map)
    (+ (getmapx    x    (- y 1) size map)
       (getmapx    x    (+ y 1) size map)
       (getmapx (- x 1) (- y 1) size map)
       (getmapx (- x 1)    y    size map)
       (getmapx (- x 1) (+ y 1) size map)
       (getmapx (+ x 1) (- y 1) size map)
       (getmapx (+ x 1)    y    size map)
       (getmapx (+ x 1) (+ y 1) size map))))
(define live?
  (lambda (x y size map)
    (if (>= (nearlifes x y size map) 3) #t #f)))
"
repl(a)
