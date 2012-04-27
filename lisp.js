(function() {
  var Env, Operations, Symbol, a, atom, eva, global_env, multi_read, parse, read, read_from, to_string, tokenize;

  Operations = {
    '#t': true,
    '#f': false,
    '+': function(x, y) {
      return x + y;
    },
    '-': function(x, y) {
      return x - y;
    },
    '*': function(x, y) {
      return x * y;
    },
    '/': function(x, y) {
      return x / y;
    },
    '<': function(x, y) {
      return x < y;
    },
    '>': function(x, y) {
      return x > y;
    },
    '<=': function(x, y) {
      return x <= y;
    },
    '>=': function(x, y) {
      return x >= y;
    },
    '=': function(x, y) {
      return x === y;
    },
    'atom': function(x) {
      if (x instanceof Array && a.length > 0) {
        return [];
      } else {
        return '#t';
      }
    },
    'eq': function(x, y) {
      return x === y;
    },
    'car': function(x) {
      return x[0];
    },
    'cdr': function(x) {
      return x.slice(1);
    },
    'cons': function(x, y) {
      return [x].concat(y);
    }
  };

  Symbol = 'string';

  Env = (function() {

    Env.name = 'Env';

    function Env(properties, outer) {
      this.properties = properties != null ? properties : {};
      this.outer = outer != null ? outer : null;
    }

    Env.prototype.find = function(key) {
      if (this.properties.hasOwnProperty(key) || this.outer === null) {
        return this;
      } else {
        return this.outer.find(key);
      }
    };

    Env.prototype.get = function(key) {
      if (this.properties.hasOwnProperty(key)) {
        return this.properties[key];
      } else {
        return this.outer.get(key);
      }
    };

    Env.prototype.set = function(key, val) {
      return this.properties[key] = val;
    };

    return Env;

  })();

  global_env = new Env(Operations);

  eva = function(x, env) {
    var alt, conseq, exp, exps, key, keys, proc, test, _, _i, _len, _ref, _ref2;
    if (env == null) env = global_env;
    if (typeof x === Symbol) {
      return env.get(x);
    } else if (!(x instanceof Array)) {
      return x;
    } else if (x[0] === 'quote') {
      _ = x[0], exp = x[1];
      return exp;
    } else if (x[0] === 'if') {
      _ = x[0], test = x[1], conseq = x[2], alt = x[3];
      if (eva(test, env)) {
        return eva(conseq, env);
      } else {
        return eva(alt, env);
      }
    } else if (x[0] === 'cond') {
      _ref = x.slice(1);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref2 = _ref[_i], test = _ref2[0], conseq = _ref2[1];
        if (eva(test, env)) return eva(conseq, env);
      }
    } else if (x[0] === 'set!') {
      _ = x[0], key = x[1], exp = x[2];
      return env.find(key).set(key, eva(exp, env));
    } else if (x[0] === 'define') {
      _ = x[0], key = x[1], exp = x[2];
      return env.set(key, eva(exp, env));
    } else if (x[0] === 'lambda') {
      _ = x[0], keys = x[1], exp = x[2];
      return function() {
        var args, properties;
        properties = {};
        args = arguments;
        keys.forEach(function(x, i) {
          return properties[x] = args[i];
        });
        return eva(exp, new Env(properties, env));
      };
    } else {
      exps = [
        (function() {
          var _j, _len2, _results;
          _results = [];
          for (_j = 0, _len2 = x.length; _j < _len2; _j++) {
            exp = x[_j];
            _results.push(eva(exp, env));
          }
          return _results;
        })()
      ][0];
      proc = exps.shift();
      return proc.apply(null, exps);
    }
  };

  read = function(s) {
    return multi_read(tokenize(s));
  };

  parse = read;

  tokenize = function(string) {
    return string.replace(/('?\()/g, ' $1 ').replace(/\)/g, ' ) ').replace(/\n/g, '').split(" ").filter(function(s) {
      return s !== "";
    });
  };

  multi_read = function(tokens) {
    var _results;
    _results = [];
    while (tokens.length > 0) {
      _results.push(read_from(tokens));
    }
    return _results;
  };

  read_from = function(tokens) {
    var L, token;
    if (tokens.length === 0) throw 'unexpected EOF while reading';
    token = tokens.shift();
    if ('(' === token || '\'(' === token) {
      L = [];
      while (tokens[0] !== ')') {
        L.push(read_from(tokens));
      }
      tokens.shift();
      if ('(' === token) {
        return L;
      } else {
        return ['quote', L];
      }
    } else if (')' === token) {
      throw 'unexpected )';
    } else {
      return atom(token);
    }
  };

  atom = function(token) {
    if (isNaN(parseFloat(token))) {
      if ('\'' === token[0]) {
        return ['quote', atom(token.slice(1))];
      } else {
        return token;
      }
    } else {
      return parseFloat(token);
    }
  };

  to_string = function(exp) {
    if (exp instanceof Array) {
      return "(" + exp.map(to_string).join(" ") + ")";
    } else if (typeof exp === 'undefined') {
      return '';
    } else if (exp === null) {
      return null;
    } else if (exp === true) {
      return '#t';
    } else if (exp === false) {
      return '#f';
    } else {
      return exp.toString();
    }
  };

  window.repl = function(s) {
    var i, r, _i, _len, _ref;
    _ref = parse(s);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      i = _ref[_i];
      r = eva(i);
    }
    return to_string(r);
  };

  a = " (define lifemap '((0 0 0 0 0)                         (0 0 1 0 0)                         (0 1 0 1 0)                         (0 0 2 1 0)                        (0 0 0 0 0)))(define size 5)(define getlist   (lambda (x list)     (if (= x 1) (car list)         (getlist (- x 1) (cdr list)))))(define getmap  (lambda (x y map)     (getlist x (getlist y map))))(define getmapx  (lambda (x y size map)    (cond ((<= x 0) (getmapx (+ x size) y size map))          ((<= y 0) (getmapx x (+ y size) size map))          (#t (getmap x y map)))))(define nearlifes  (lambda (x y size map)    (+ (getmapx    x    (- y 1) size map)       (getmapx    x    (+ y 1) size map)       (getmapx (- x 1) (- y 1) size map)       (getmapx (- x 1)    y    size map)       (getmapx (- x 1) (+ y 1) size map)       (getmapx (+ x 1) (- y 1) size map)       (getmapx (+ x 1)    y    size map)       (getmapx (+ x 1) (+ y 1) size map))))(define live?  (lambda (x y size map)    (if (>= (nearlifes x y size map) 3) #t #f)))";

  repl(a);

}).call(this);
