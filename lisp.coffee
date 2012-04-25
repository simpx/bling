Operations =
    '+': (a, b) -> a + b
    '-': (a, b) -> a - b
    '*': (a, b) -> a * b
    '/': (a, b) -> a / b
    'car': (a) -> a[0]

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
    read_from(tokenize(s))

parse = read

tokenize = (string) ->
    string.replace(/('?\()/g,' $1 ').replace(/\)/g,' ) ').split(" ").filter((s) -> s != "")

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
        "( " + exp.map(to_string).join(" ") + " )"
    else if typeof exp == 'undefined' or exp == null
        "null"
    else
        exp.toString()

window.repl = (s) ->
    to_string(eva(parse(s)))
