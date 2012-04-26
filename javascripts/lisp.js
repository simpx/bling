(function() {
  var Env, Operations, Symbol, atom, eva, global_env, parse, read, read_from, to_string, tokenize;

  Operations = {
    '+': function(a, b) {
      return a + b;
    },
    '-': function(a, b) {
      return a - b;
    },
    '*': function(a, b) {
      return a * b;
    },
    '/': function(a, b) {
      return a / b;
    },
    'car': function(a) {
      return a[0];
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
    var alt, conseq, exp, exps, key, keys, proc, test, _;
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
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = x.length; _i < _len; _i++) {
            exp = x[_i];
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
    return read_from(tokenize(s));
  };

  parse = read;

  tokenize = function(string) {
    return string.replace(/('?\()/g, ' $1 ').replace(/\)/g, ' ) ').split(" ").filter(function(s) {
      return s !== "";
    });
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
      return "( " + exp.map(to_string).join(" ") + " )";
    } else if (typeof exp === 'undefined' || exp === null) {
      return "null";
    } else {
      return exp.toString();
    }
  };

  window.repl = function(s) {
    return to_string(eva(parse(s)));
  };

}).call(this);
