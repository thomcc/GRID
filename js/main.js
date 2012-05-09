var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.evalWorksForGlobals_ = null;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.require = function(rule) {
  if(!COMPILED) {
    if(goog.getObjectByName(rule)) {
      return
    }
    var path = goog.getPathFromDeps_(rule);
    if(path) {
      goog.included_[path] = true;
      goog.writeScripts_()
    }else {
      var errorMessage = "goog.require could not find: " + rule;
      if(goog.global.console) {
        goog.global.console["error"](errorMessage)
      }
      throw Error(errorMessage);
    }
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName])
          }else {
            if(!goog.getObjectByName(requireName)) {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs)
    }
  }else {
    return function() {
      return fn.apply(context, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style
};
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global && !goog.string.contains(str, "<")) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global["document"]["createElement"]("div");
  el["innerHTML"] = "<pre>x" + str + "</pre>";
  if(el["firstChild"][goog.string.NORMALIZE_FN_]) {
    el["firstChild"][goog.string.NORMALIZE_FN_]()
  }
  str = el["firstChild"]["firstChild"]["nodeValue"].slice(1);
  el["innerHTML"] = "";
  return goog.string.canonicalizeNewlines(str)
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.NORMALIZE_FN_ = "normalize";
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\u000b":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
void 0;
void 0;
void 0;
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____4417 = x != null;
    if(and__3822__auto____4417) {
      return x.cljs$lang$type
    }else {
      return and__3822__auto____4417
    }
  }())) {
    return false
  }else {
    if(cljs.core.truth_(p[goog.typeOf.call(null, x)])) {
      return true
    }else {
      if(cljs.core.truth_(p["_"])) {
        return true
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error("No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
void 0;
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__4418__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__4418 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4418__delegate.call(this, array, i, idxs)
    };
    G__4418.cljs$lang$maxFixedArity = 2;
    G__4418.cljs$lang$applyTo = function(arglist__4419) {
      var array = cljs.core.first(arglist__4419);
      var i = cljs.core.first(cljs.core.next(arglist__4419));
      var idxs = cljs.core.rest(cljs.core.next(arglist__4419));
      return G__4418__delegate.call(this, array, i, idxs)
    };
    return G__4418
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$3 = aget__3;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
void 0;
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
void 0;
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____4420 = this$;
      if(and__3822__auto____4420) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____4420
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3824__auto____4421 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4421) {
          return or__3824__auto____4421
        }else {
          var or__3824__auto____4422 = cljs.core._invoke["_"];
          if(or__3824__auto____4422) {
            return or__3824__auto____4422
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____4423 = this$;
      if(and__3822__auto____4423) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____4423
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3824__auto____4424 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4424) {
          return or__3824__auto____4424
        }else {
          var or__3824__auto____4425 = cljs.core._invoke["_"];
          if(or__3824__auto____4425) {
            return or__3824__auto____4425
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____4426 = this$;
      if(and__3822__auto____4426) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____4426
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3824__auto____4427 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4427) {
          return or__3824__auto____4427
        }else {
          var or__3824__auto____4428 = cljs.core._invoke["_"];
          if(or__3824__auto____4428) {
            return or__3824__auto____4428
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____4429 = this$;
      if(and__3822__auto____4429) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____4429
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3824__auto____4430 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4430) {
          return or__3824__auto____4430
        }else {
          var or__3824__auto____4431 = cljs.core._invoke["_"];
          if(or__3824__auto____4431) {
            return or__3824__auto____4431
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____4432 = this$;
      if(and__3822__auto____4432) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____4432
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3824__auto____4433 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4433) {
          return or__3824__auto____4433
        }else {
          var or__3824__auto____4434 = cljs.core._invoke["_"];
          if(or__3824__auto____4434) {
            return or__3824__auto____4434
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____4435 = this$;
      if(and__3822__auto____4435) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____4435
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3824__auto____4436 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4436) {
          return or__3824__auto____4436
        }else {
          var or__3824__auto____4437 = cljs.core._invoke["_"];
          if(or__3824__auto____4437) {
            return or__3824__auto____4437
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____4438 = this$;
      if(and__3822__auto____4438) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____4438
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3824__auto____4439 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4439) {
          return or__3824__auto____4439
        }else {
          var or__3824__auto____4440 = cljs.core._invoke["_"];
          if(or__3824__auto____4440) {
            return or__3824__auto____4440
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____4441 = this$;
      if(and__3822__auto____4441) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____4441
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3824__auto____4442 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4442) {
          return or__3824__auto____4442
        }else {
          var or__3824__auto____4443 = cljs.core._invoke["_"];
          if(or__3824__auto____4443) {
            return or__3824__auto____4443
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____4444 = this$;
      if(and__3822__auto____4444) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____4444
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3824__auto____4445 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4445) {
          return or__3824__auto____4445
        }else {
          var or__3824__auto____4446 = cljs.core._invoke["_"];
          if(or__3824__auto____4446) {
            return or__3824__auto____4446
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____4447 = this$;
      if(and__3822__auto____4447) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____4447
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3824__auto____4448 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4448) {
          return or__3824__auto____4448
        }else {
          var or__3824__auto____4449 = cljs.core._invoke["_"];
          if(or__3824__auto____4449) {
            return or__3824__auto____4449
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____4450 = this$;
      if(and__3822__auto____4450) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____4450
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3824__auto____4451 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4451) {
          return or__3824__auto____4451
        }else {
          var or__3824__auto____4452 = cljs.core._invoke["_"];
          if(or__3824__auto____4452) {
            return or__3824__auto____4452
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____4453 = this$;
      if(and__3822__auto____4453) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____4453
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3824__auto____4454 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4454) {
          return or__3824__auto____4454
        }else {
          var or__3824__auto____4455 = cljs.core._invoke["_"];
          if(or__3824__auto____4455) {
            return or__3824__auto____4455
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____4456 = this$;
      if(and__3822__auto____4456) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____4456
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3824__auto____4457 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4457) {
          return or__3824__auto____4457
        }else {
          var or__3824__auto____4458 = cljs.core._invoke["_"];
          if(or__3824__auto____4458) {
            return or__3824__auto____4458
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____4459 = this$;
      if(and__3822__auto____4459) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____4459
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3824__auto____4460 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4460) {
          return or__3824__auto____4460
        }else {
          var or__3824__auto____4461 = cljs.core._invoke["_"];
          if(or__3824__auto____4461) {
            return or__3824__auto____4461
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____4462 = this$;
      if(and__3822__auto____4462) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____4462
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3824__auto____4463 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4463) {
          return or__3824__auto____4463
        }else {
          var or__3824__auto____4464 = cljs.core._invoke["_"];
          if(or__3824__auto____4464) {
            return or__3824__auto____4464
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____4465 = this$;
      if(and__3822__auto____4465) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____4465
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3824__auto____4466 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4466) {
          return or__3824__auto____4466
        }else {
          var or__3824__auto____4467 = cljs.core._invoke["_"];
          if(or__3824__auto____4467) {
            return or__3824__auto____4467
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____4468 = this$;
      if(and__3822__auto____4468) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____4468
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3824__auto____4469 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4469) {
          return or__3824__auto____4469
        }else {
          var or__3824__auto____4470 = cljs.core._invoke["_"];
          if(or__3824__auto____4470) {
            return or__3824__auto____4470
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____4471 = this$;
      if(and__3822__auto____4471) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____4471
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3824__auto____4472 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4472) {
          return or__3824__auto____4472
        }else {
          var or__3824__auto____4473 = cljs.core._invoke["_"];
          if(or__3824__auto____4473) {
            return or__3824__auto____4473
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____4474 = this$;
      if(and__3822__auto____4474) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____4474
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3824__auto____4475 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4475) {
          return or__3824__auto____4475
        }else {
          var or__3824__auto____4476 = cljs.core._invoke["_"];
          if(or__3824__auto____4476) {
            return or__3824__auto____4476
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____4477 = this$;
      if(and__3822__auto____4477) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____4477
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3824__auto____4478 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4478) {
          return or__3824__auto____4478
        }else {
          var or__3824__auto____4479 = cljs.core._invoke["_"];
          if(or__3824__auto____4479) {
            return or__3824__auto____4479
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____4480 = this$;
      if(and__3822__auto____4480) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____4480
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3824__auto____4481 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4481) {
          return or__3824__auto____4481
        }else {
          var or__3824__auto____4482 = cljs.core._invoke["_"];
          if(or__3824__auto____4482) {
            return or__3824__auto____4482
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
void 0;
void 0;
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____4483 = coll;
    if(and__3822__auto____4483) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____4483
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4484 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4484) {
        return or__3824__auto____4484
      }else {
        var or__3824__auto____4485 = cljs.core._count["_"];
        if(or__3824__auto____4485) {
          return or__3824__auto____4485
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____4486 = coll;
    if(and__3822__auto____4486) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____4486
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4487 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4487) {
        return or__3824__auto____4487
      }else {
        var or__3824__auto____4488 = cljs.core._empty["_"];
        if(or__3824__auto____4488) {
          return or__3824__auto____4488
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____4489 = coll;
    if(and__3822__auto____4489) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____4489
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3824__auto____4490 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4490) {
        return or__3824__auto____4490
      }else {
        var or__3824__auto____4491 = cljs.core._conj["_"];
        if(or__3824__auto____4491) {
          return or__3824__auto____4491
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
void 0;
void 0;
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____4492 = coll;
      if(and__3822__auto____4492) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____4492
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3824__auto____4493 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____4493) {
          return or__3824__auto____4493
        }else {
          var or__3824__auto____4494 = cljs.core._nth["_"];
          if(or__3824__auto____4494) {
            return or__3824__auto____4494
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____4495 = coll;
      if(and__3822__auto____4495) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____4495
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3824__auto____4496 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____4496) {
          return or__3824__auto____4496
        }else {
          var or__3824__auto____4497 = cljs.core._nth["_"];
          if(or__3824__auto____4497) {
            return or__3824__auto____4497
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
void 0;
void 0;
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____4498 = coll;
    if(and__3822__auto____4498) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____4498
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4499 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4499) {
        return or__3824__auto____4499
      }else {
        var or__3824__auto____4500 = cljs.core._first["_"];
        if(or__3824__auto____4500) {
          return or__3824__auto____4500
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____4501 = coll;
    if(and__3822__auto____4501) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____4501
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4502 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4502) {
        return or__3824__auto____4502
      }else {
        var or__3824__auto____4503 = cljs.core._rest["_"];
        if(or__3824__auto____4503) {
          return or__3824__auto____4503
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____4504 = o;
      if(and__3822__auto____4504) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____4504
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3824__auto____4505 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____4505) {
          return or__3824__auto____4505
        }else {
          var or__3824__auto____4506 = cljs.core._lookup["_"];
          if(or__3824__auto____4506) {
            return or__3824__auto____4506
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____4507 = o;
      if(and__3822__auto____4507) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____4507
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3824__auto____4508 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____4508) {
          return or__3824__auto____4508
        }else {
          var or__3824__auto____4509 = cljs.core._lookup["_"];
          if(or__3824__auto____4509) {
            return or__3824__auto____4509
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
void 0;
void 0;
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____4510 = coll;
    if(and__3822__auto____4510) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____4510
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____4511 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4511) {
        return or__3824__auto____4511
      }else {
        var or__3824__auto____4512 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____4512) {
          return or__3824__auto____4512
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____4513 = coll;
    if(and__3822__auto____4513) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____4513
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3824__auto____4514 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4514) {
        return or__3824__auto____4514
      }else {
        var or__3824__auto____4515 = cljs.core._assoc["_"];
        if(or__3824__auto____4515) {
          return or__3824__auto____4515
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
void 0;
void 0;
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____4516 = coll;
    if(and__3822__auto____4516) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____4516
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____4517 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4517) {
        return or__3824__auto____4517
      }else {
        var or__3824__auto____4518 = cljs.core._dissoc["_"];
        if(or__3824__auto____4518) {
          return or__3824__auto____4518
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
void 0;
void 0;
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____4519 = coll;
    if(and__3822__auto____4519) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____4519
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4520 = cljs.core._key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4520) {
        return or__3824__auto____4520
      }else {
        var or__3824__auto____4521 = cljs.core._key["_"];
        if(or__3824__auto____4521) {
          return or__3824__auto____4521
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____4522 = coll;
    if(and__3822__auto____4522) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____4522
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4523 = cljs.core._val[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4523) {
        return or__3824__auto____4523
      }else {
        var or__3824__auto____4524 = cljs.core._val["_"];
        if(or__3824__auto____4524) {
          return or__3824__auto____4524
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____4525 = coll;
    if(and__3822__auto____4525) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____4525
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3824__auto____4526 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4526) {
        return or__3824__auto____4526
      }else {
        var or__3824__auto____4527 = cljs.core._disjoin["_"];
        if(or__3824__auto____4527) {
          return or__3824__auto____4527
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
void 0;
void 0;
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____4528 = coll;
    if(and__3822__auto____4528) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____4528
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4529 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4529) {
        return or__3824__auto____4529
      }else {
        var or__3824__auto____4530 = cljs.core._peek["_"];
        if(or__3824__auto____4530) {
          return or__3824__auto____4530
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____4531 = coll;
    if(and__3822__auto____4531) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____4531
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4532 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4532) {
        return or__3824__auto____4532
      }else {
        var or__3824__auto____4533 = cljs.core._pop["_"];
        if(or__3824__auto____4533) {
          return or__3824__auto____4533
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____4534 = coll;
    if(and__3822__auto____4534) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____4534
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3824__auto____4535 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4535) {
        return or__3824__auto____4535
      }else {
        var or__3824__auto____4536 = cljs.core._assoc_n["_"];
        if(or__3824__auto____4536) {
          return or__3824__auto____4536
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
void 0;
void 0;
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____4537 = o;
    if(and__3822__auto____4537) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____4537
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____4538 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(or__3824__auto____4538) {
        return or__3824__auto____4538
      }else {
        var or__3824__auto____4539 = cljs.core._deref["_"];
        if(or__3824__auto____4539) {
          return or__3824__auto____4539
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____4540 = o;
    if(and__3822__auto____4540) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____4540
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3824__auto____4541 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(or__3824__auto____4541) {
        return or__3824__auto____4541
      }else {
        var or__3824__auto____4542 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____4542) {
          return or__3824__auto____4542
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
void 0;
void 0;
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____4543 = o;
    if(and__3822__auto____4543) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____4543
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____4544 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____4544) {
        return or__3824__auto____4544
      }else {
        var or__3824__auto____4545 = cljs.core._meta["_"];
        if(or__3824__auto____4545) {
          return or__3824__auto____4545
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____4546 = o;
    if(and__3822__auto____4546) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____4546
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3824__auto____4547 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____4547) {
        return or__3824__auto____4547
      }else {
        var or__3824__auto____4548 = cljs.core._with_meta["_"];
        if(or__3824__auto____4548) {
          return or__3824__auto____4548
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
void 0;
void 0;
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____4549 = coll;
      if(and__3822__auto____4549) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____4549
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3824__auto____4550 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____4550) {
          return or__3824__auto____4550
        }else {
          var or__3824__auto____4551 = cljs.core._reduce["_"];
          if(or__3824__auto____4551) {
            return or__3824__auto____4551
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____4552 = coll;
      if(and__3822__auto____4552) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____4552
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3824__auto____4553 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____4553) {
          return or__3824__auto____4553
        }else {
          var or__3824__auto____4554 = cljs.core._reduce["_"];
          if(or__3824__auto____4554) {
            return or__3824__auto____4554
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
void 0;
void 0;
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____4555 = coll;
    if(and__3822__auto____4555) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____4555
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3824__auto____4556 = cljs.core._kv_reduce[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4556) {
        return or__3824__auto____4556
      }else {
        var or__3824__auto____4557 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____4557) {
          return or__3824__auto____4557
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
void 0;
void 0;
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____4558 = o;
    if(and__3822__auto____4558) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____4558
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3824__auto____4559 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(or__3824__auto____4559) {
        return or__3824__auto____4559
      }else {
        var or__3824__auto____4560 = cljs.core._equiv["_"];
        if(or__3824__auto____4560) {
          return or__3824__auto____4560
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
void 0;
void 0;
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____4561 = o;
    if(and__3822__auto____4561) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____4561
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____4562 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(or__3824__auto____4562) {
        return or__3824__auto____4562
      }else {
        var or__3824__auto____4563 = cljs.core._hash["_"];
        if(or__3824__auto____4563) {
          return or__3824__auto____4563
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____4564 = o;
    if(and__3822__auto____4564) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____4564
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____4565 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____4565) {
        return or__3824__auto____4565
      }else {
        var or__3824__auto____4566 = cljs.core._seq["_"];
        if(or__3824__auto____4566) {
          return or__3824__auto____4566
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISequential = {};
void 0;
void 0;
cljs.core.IList = {};
void 0;
void 0;
cljs.core.IRecord = {};
void 0;
void 0;
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____4567 = coll;
    if(and__3822__auto____4567) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____4567
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4568 = cljs.core._rseq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4568) {
        return or__3824__auto____4568
      }else {
        var or__3824__auto____4569 = cljs.core._rseq["_"];
        if(or__3824__auto____4569) {
          return or__3824__auto____4569
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____4570 = coll;
    if(and__3822__auto____4570) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____4570
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____4571 = cljs.core._sorted_seq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4571) {
        return or__3824__auto____4571
      }else {
        var or__3824__auto____4572 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____4572) {
          return or__3824__auto____4572
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____4573 = coll;
    if(and__3822__auto____4573) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____4573
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____4574 = cljs.core._sorted_seq_from[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4574) {
        return or__3824__auto____4574
      }else {
        var or__3824__auto____4575 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____4575) {
          return or__3824__auto____4575
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____4576 = coll;
    if(and__3822__auto____4576) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____4576
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3824__auto____4577 = cljs.core._entry_key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4577) {
        return or__3824__auto____4577
      }else {
        var or__3824__auto____4578 = cljs.core._entry_key["_"];
        if(or__3824__auto____4578) {
          return or__3824__auto____4578
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____4579 = coll;
    if(and__3822__auto____4579) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____4579
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4580 = cljs.core._comparator[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4580) {
        return or__3824__auto____4580
      }else {
        var or__3824__auto____4581 = cljs.core._comparator["_"];
        if(or__3824__auto____4581) {
          return or__3824__auto____4581
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____4582 = o;
    if(and__3822__auto____4582) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____4582
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3824__auto____4583 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____4583) {
        return or__3824__auto____4583
      }else {
        var or__3824__auto____4584 = cljs.core._pr_seq["_"];
        if(or__3824__auto____4584) {
          return or__3824__auto____4584
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
void 0;
void 0;
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____4585 = d;
    if(and__3822__auto____4585) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____4585
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3824__auto____4586 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(or__3824__auto____4586) {
        return or__3824__auto____4586
      }else {
        var or__3824__auto____4587 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____4587) {
          return or__3824__auto____4587
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
void 0;
void 0;
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____4588 = this$;
    if(and__3822__auto____4588) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____4588
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3824__auto____4589 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(or__3824__auto____4589) {
        return or__3824__auto____4589
      }else {
        var or__3824__auto____4590 = cljs.core._notify_watches["_"];
        if(or__3824__auto____4590) {
          return or__3824__auto____4590
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____4591 = this$;
    if(and__3822__auto____4591) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____4591
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3824__auto____4592 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____4592) {
        return or__3824__auto____4592
      }else {
        var or__3824__auto____4593 = cljs.core._add_watch["_"];
        if(or__3824__auto____4593) {
          return or__3824__auto____4593
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____4594 = this$;
    if(and__3822__auto____4594) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____4594
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3824__auto____4595 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____4595) {
        return or__3824__auto____4595
      }else {
        var or__3824__auto____4596 = cljs.core._remove_watch["_"];
        if(or__3824__auto____4596) {
          return or__3824__auto____4596
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
void 0;
void 0;
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____4597 = coll;
    if(and__3822__auto____4597) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____4597
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4598 = cljs.core._as_transient[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4598) {
        return or__3824__auto____4598
      }else {
        var or__3824__auto____4599 = cljs.core._as_transient["_"];
        if(or__3824__auto____4599) {
          return or__3824__auto____4599
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____4600 = tcoll;
    if(and__3822__auto____4600) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____4600
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3824__auto____4601 = cljs.core._conj_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4601) {
        return or__3824__auto____4601
      }else {
        var or__3824__auto____4602 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____4602) {
          return or__3824__auto____4602
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____4603 = tcoll;
    if(and__3822__auto____4603) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____4603
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____4604 = cljs.core._persistent_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4604) {
        return or__3824__auto____4604
      }else {
        var or__3824__auto____4605 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____4605) {
          return or__3824__auto____4605
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____4606 = tcoll;
    if(and__3822__auto____4606) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____4606
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3824__auto____4607 = cljs.core._assoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4607) {
        return or__3824__auto____4607
      }else {
        var or__3824__auto____4608 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____4608) {
          return or__3824__auto____4608
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
void 0;
void 0;
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____4609 = tcoll;
    if(and__3822__auto____4609) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____4609
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3824__auto____4610 = cljs.core._dissoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4610) {
        return or__3824__auto____4610
      }else {
        var or__3824__auto____4611 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____4611) {
          return or__3824__auto____4611
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
void 0;
void 0;
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____4612 = tcoll;
    if(and__3822__auto____4612) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____4612
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3824__auto____4613 = cljs.core._assoc_n_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4613) {
        return or__3824__auto____4613
      }else {
        var or__3824__auto____4614 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____4614) {
          return or__3824__auto____4614
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____4615 = tcoll;
    if(and__3822__auto____4615) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____4615
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____4616 = cljs.core._pop_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4616) {
        return or__3824__auto____4616
      }else {
        var or__3824__auto____4617 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____4617) {
          return or__3824__auto____4617
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____4618 = tcoll;
    if(and__3822__auto____4618) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____4618
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3824__auto____4619 = cljs.core._disjoin_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4619) {
        return or__3824__auto____4619
      }else {
        var or__3824__auto____4620 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____4620) {
          return or__3824__auto____4620
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
void 0;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
void 0;
void 0;
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____4621 = x === y;
    if(or__3824__auto____4621) {
      return or__3824__auto____4621
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__4622__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4623 = y;
            var G__4624 = cljs.core.first.call(null, more);
            var G__4625 = cljs.core.next.call(null, more);
            x = G__4623;
            y = G__4624;
            more = G__4625;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4622 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4622__delegate.call(this, x, y, more)
    };
    G__4622.cljs$lang$maxFixedArity = 2;
    G__4622.cljs$lang$applyTo = function(arglist__4626) {
      var x = cljs.core.first(arglist__4626);
      var y = cljs.core.first(cljs.core.next(arglist__4626));
      var more = cljs.core.rest(cljs.core.next(arglist__4626));
      return G__4622__delegate.call(this, x, y, more)
    };
    return G__4622
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$3 = _EQ___3;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(function() {
    var or__3824__auto____4627 = x == null;
    if(or__3824__auto____4627) {
      return or__3824__auto____4627
    }else {
      return void 0 === x
    }
  }()) {
    return null
  }else {
    return x.constructor
  }
};
void 0;
void 0;
void 0;
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__4628 = null;
  var G__4628__2 = function(o, k) {
    return null
  };
  var G__4628__3 = function(o, k, not_found) {
    return not_found
  };
  G__4628 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4628__2.call(this, o, k);
      case 3:
        return G__4628__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4628
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__4629 = null;
  var G__4629__2 = function(_, f) {
    return f.call(null)
  };
  var G__4629__3 = function(_, f, start) {
    return start
  };
  G__4629 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4629__2.call(this, _, f);
      case 3:
        return G__4629__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4629
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__4630 = null;
  var G__4630__2 = function(_, n) {
    return null
  };
  var G__4630__3 = function(_, n, not_found) {
    return not_found
  };
  G__4630 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4630__2.call(this, _, n);
      case 3:
        return G__4630__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4630
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
void 0;
void 0;
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    if(cljs.core._count.call(null, cicoll) === 0) {
      return f.call(null)
    }else {
      var val__4631 = cljs.core._nth.call(null, cicoll, 0);
      var n__4632 = 1;
      while(true) {
        if(n__4632 < cljs.core._count.call(null, cicoll)) {
          var nval__4633 = f.call(null, val__4631, cljs.core._nth.call(null, cicoll, n__4632));
          if(cljs.core.reduced_QMARK_.call(null, nval__4633)) {
            return cljs.core.deref.call(null, nval__4633)
          }else {
            var G__4640 = nval__4633;
            var G__4641 = n__4632 + 1;
            val__4631 = G__4640;
            n__4632 = G__4641;
            continue
          }
        }else {
          return val__4631
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var val__4634 = val;
    var n__4635 = 0;
    while(true) {
      if(n__4635 < cljs.core._count.call(null, cicoll)) {
        var nval__4636 = f.call(null, val__4634, cljs.core._nth.call(null, cicoll, n__4635));
        if(cljs.core.reduced_QMARK_.call(null, nval__4636)) {
          return cljs.core.deref.call(null, nval__4636)
        }else {
          var G__4642 = nval__4636;
          var G__4643 = n__4635 + 1;
          val__4634 = G__4642;
          n__4635 = G__4643;
          continue
        }
      }else {
        return val__4634
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var val__4637 = val;
    var n__4638 = idx;
    while(true) {
      if(n__4638 < cljs.core._count.call(null, cicoll)) {
        var nval__4639 = f.call(null, val__4637, cljs.core._nth.call(null, cicoll, n__4638));
        if(cljs.core.reduced_QMARK_.call(null, nval__4639)) {
          return cljs.core.deref.call(null, nval__4639)
        }else {
          var G__4644 = nval__4639;
          var G__4645 = n__4638 + 1;
          val__4637 = G__4644;
          n__4638 = G__4645;
          continue
        }
      }else {
        return val__4637
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
void 0;
void 0;
void 0;
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition3$ = 30;
  this.cljs$lang$protocol_mask$partition0$ = 58;
  this.cljs$lang$protocol_mask$partition2$ = 32
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4646 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4647 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__4648 = this;
  var this$__4649 = this;
  return cljs.core.pr_str.call(null, this$__4649)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(_, f) {
  var this__4650 = this;
  return cljs.core.ci_reduce.call(null, this__4650.a, f, this__4650.a[this__4650.i], this__4650.i + 1)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(_, f, start) {
  var this__4651 = this;
  return cljs.core.ci_reduce.call(null, this__4651.a, f, start, this__4651.i)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__4652 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__4653 = this;
  return this__4653.a.length - this__4653.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__4654 = this;
  return this__4654.a[this__4654.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__4655 = this;
  if(this__4655.i + 1 < this__4655.a.length) {
    return new cljs.core.IndexedSeq(this__4655.a, this__4655.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4656 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__4657 = this;
  var i__4658 = n + this__4657.i;
  if(i__4658 < this__4657.a.length) {
    return this__4657.a[i__4658]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__4659 = this;
  var i__4660 = n + this__4659.i;
  if(i__4660 < this__4659.a.length) {
    return this__4659.a[i__4660]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function prim_seq(prim, i) {
  if(prim.length === 0) {
    return null
  }else {
    return new cljs.core.IndexedSeq(prim, i)
  }
};
cljs.core.array_seq = function array_seq(array, i) {
  return cljs.core.prim_seq.call(null, array, i)
};
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__4661 = null;
  var G__4661__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__4661__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__4661 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4661__2.call(this, array, f);
      case 3:
        return G__4661__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4661
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__4662 = null;
  var G__4662__2 = function(array, k) {
    return array[k]
  };
  var G__4662__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__4662 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4662__2.call(this, array, k);
      case 3:
        return G__4662__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4662
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__4663 = null;
  var G__4663__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__4663__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__4663 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4663__2.call(this, array, n);
      case 3:
        return G__4663__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4663
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core._seq.call(null, coll)
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  if(coll != null) {
    if(function() {
      var G__4664__4665 = coll;
      if(G__4664__4665 != null) {
        if(function() {
          var or__3824__auto____4666 = G__4664__4665.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____4666) {
            return or__3824__auto____4666
          }else {
            return G__4664__4665.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4664__4665.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4664__4665)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4664__4665)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__4667 = cljs.core.seq.call(null, coll);
      if(s__4667 != null) {
        return cljs.core._first.call(null, s__4667)
      }else {
        return null
      }
    }
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  if(coll != null) {
    if(function() {
      var G__4668__4669 = coll;
      if(G__4668__4669 != null) {
        if(function() {
          var or__3824__auto____4670 = G__4668__4669.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____4670) {
            return or__3824__auto____4670
          }else {
            return G__4668__4669.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4668__4669.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4668__4669)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4668__4669)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__4671 = cljs.core.seq.call(null, coll);
      if(s__4671 != null) {
        return cljs.core._rest.call(null, s__4671)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__4672 = cljs.core.next.call(null, s);
      s = G__4672;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__4673__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__4674 = conj.call(null, coll, x);
          var G__4675 = cljs.core.first.call(null, xs);
          var G__4676 = cljs.core.next.call(null, xs);
          coll = G__4674;
          x = G__4675;
          xs = G__4676;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__4673 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4673__delegate.call(this, coll, x, xs)
    };
    G__4673.cljs$lang$maxFixedArity = 2;
    G__4673.cljs$lang$applyTo = function(arglist__4677) {
      var coll = cljs.core.first(arglist__4677);
      var x = cljs.core.first(cljs.core.next(arglist__4677));
      var xs = cljs.core.rest(cljs.core.next(arglist__4677));
      return G__4673__delegate.call(this, coll, x, xs)
    };
    return G__4673
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$3 = conj__3;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
void 0;
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll, acc) {
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, coll)) {
      return acc + cljs.core._count.call(null, coll)
    }else {
      var G__4678 = cljs.core.next.call(null, coll);
      var G__4679 = acc + 1;
      coll = G__4678;
      acc = G__4679;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll, 0)
  }
};
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    return cljs.core._nth.call(null, coll, Math.floor(n))
  };
  var nth__3 = function(coll, n, not_found) {
    return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__4681__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__4680 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__4682 = ret__4680;
          var G__4683 = cljs.core.first.call(null, kvs);
          var G__4684 = cljs.core.second.call(null, kvs);
          var G__4685 = cljs.core.nnext.call(null, kvs);
          coll = G__4682;
          k = G__4683;
          v = G__4684;
          kvs = G__4685;
          continue
        }else {
          return ret__4680
        }
        break
      }
    };
    var G__4681 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4681__delegate.call(this, coll, k, v, kvs)
    };
    G__4681.cljs$lang$maxFixedArity = 3;
    G__4681.cljs$lang$applyTo = function(arglist__4686) {
      var coll = cljs.core.first(arglist__4686);
      var k = cljs.core.first(cljs.core.next(arglist__4686));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4686)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4686)));
      return G__4681__delegate.call(this, coll, k, v, kvs)
    };
    return G__4681
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$4 = assoc__4;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__4688__delegate = function(coll, k, ks) {
      while(true) {
        var ret__4687 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4689 = ret__4687;
          var G__4690 = cljs.core.first.call(null, ks);
          var G__4691 = cljs.core.next.call(null, ks);
          coll = G__4689;
          k = G__4690;
          ks = G__4691;
          continue
        }else {
          return ret__4687
        }
        break
      }
    };
    var G__4688 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4688__delegate.call(this, coll, k, ks)
    };
    G__4688.cljs$lang$maxFixedArity = 2;
    G__4688.cljs$lang$applyTo = function(arglist__4692) {
      var coll = cljs.core.first(arglist__4692);
      var k = cljs.core.first(cljs.core.next(arglist__4692));
      var ks = cljs.core.rest(cljs.core.next(arglist__4692));
      return G__4688__delegate.call(this, coll, k, ks)
    };
    return G__4688
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$3 = dissoc__3;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__4693__4694 = o;
    if(G__4693__4694 != null) {
      if(function() {
        var or__3824__auto____4695 = G__4693__4694.cljs$lang$protocol_mask$partition2$ & 8;
        if(or__3824__auto____4695) {
          return or__3824__auto____4695
        }else {
          return G__4693__4694.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__4693__4694.cljs$lang$protocol_mask$partition2$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4693__4694)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4693__4694)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__4697__delegate = function(coll, k, ks) {
      while(true) {
        var ret__4696 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4698 = ret__4696;
          var G__4699 = cljs.core.first.call(null, ks);
          var G__4700 = cljs.core.next.call(null, ks);
          coll = G__4698;
          k = G__4699;
          ks = G__4700;
          continue
        }else {
          return ret__4696
        }
        break
      }
    };
    var G__4697 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4697__delegate.call(this, coll, k, ks)
    };
    G__4697.cljs$lang$maxFixedArity = 2;
    G__4697.cljs$lang$applyTo = function(arglist__4701) {
      var coll = cljs.core.first(arglist__4701);
      var k = cljs.core.first(cljs.core.next(arglist__4701));
      var ks = cljs.core.rest(cljs.core.next(arglist__4701));
      return G__4697__delegate.call(this, coll, k, ks)
    };
    return G__4697
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$3 = disj__3;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4702__4703 = x;
    if(G__4702__4703 != null) {
      if(function() {
        var or__3824__auto____4704 = G__4702__4703.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____4704) {
          return or__3824__auto____4704
        }else {
          return G__4702__4703.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__4702__4703.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__4702__4703)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__4702__4703)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4705__4706 = x;
    if(G__4705__4706 != null) {
      if(function() {
        var or__3824__auto____4707 = G__4705__4706.cljs$lang$protocol_mask$partition1$ & 16;
        if(or__3824__auto____4707) {
          return or__3824__auto____4707
        }else {
          return G__4705__4706.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__4705__4706.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__4705__4706)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__4705__4706)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__4708__4709 = x;
  if(G__4708__4709 != null) {
    if(function() {
      var or__3824__auto____4710 = G__4708__4709.cljs$lang$protocol_mask$partition1$ & 2;
      if(or__3824__auto____4710) {
        return or__3824__auto____4710
      }else {
        return G__4708__4709.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__4708__4709.cljs$lang$protocol_mask$partition1$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__4708__4709)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__4708__4709)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__4711__4712 = x;
  if(G__4711__4712 != null) {
    if(function() {
      var or__3824__auto____4713 = G__4711__4712.cljs$lang$protocol_mask$partition3$ & 16;
      if(or__3824__auto____4713) {
        return or__3824__auto____4713
      }else {
        return G__4711__4712.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__4711__4712.cljs$lang$protocol_mask$partition3$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__4711__4712)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__4711__4712)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__4714__4715 = x;
  if(G__4714__4715 != null) {
    if(function() {
      var or__3824__auto____4716 = G__4714__4715.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____4716) {
        return or__3824__auto____4716
      }else {
        return G__4714__4715.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__4714__4715.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__4714__4715)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__4714__4715)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4717__4718 = x;
    if(G__4717__4718 != null) {
      if(function() {
        var or__3824__auto____4719 = G__4717__4718.cljs$lang$protocol_mask$partition1$ & 4;
        if(or__3824__auto____4719) {
          return or__3824__auto____4719
        }else {
          return G__4717__4718.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__4717__4718.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__4717__4718)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__4717__4718)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__4720__4721 = x;
  if(G__4720__4721 != null) {
    if(function() {
      var or__3824__auto____4722 = G__4720__4721.cljs$lang$protocol_mask$partition2$ & 1;
      if(or__3824__auto____4722) {
        return or__3824__auto____4722
      }else {
        return G__4720__4721.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__4720__4721.cljs$lang$protocol_mask$partition2$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__4720__4721)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__4720__4721)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__4723__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__4723 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4723__delegate.call(this, keyvals)
    };
    G__4723.cljs$lang$maxFixedArity = 0;
    G__4723.cljs$lang$applyTo = function(arglist__4724) {
      var keyvals = cljs.core.seq(arglist__4724);
      return G__4723__delegate.call(this, keyvals)
    };
    return G__4723
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$1 = js_obj__1;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__4725 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__4725.push(key)
  });
  return keys__4725
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__4726 = i;
  var j__4727 = j;
  var len__4728 = len;
  while(true) {
    if(len__4728 === 0) {
      return to
    }else {
      to[j__4727] = from[i__4726];
      var G__4729 = i__4726 + 1;
      var G__4730 = j__4727 + 1;
      var G__4731 = len__4728 - 1;
      i__4726 = G__4729;
      j__4727 = G__4730;
      len__4728 = G__4731;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__4732 = i + (len - 1);
  var j__4733 = j + (len - 1);
  var len__4734 = len;
  while(true) {
    if(len__4734 === 0) {
      return to
    }else {
      to[j__4733] = from[i__4732];
      var G__4735 = i__4732 - 1;
      var G__4736 = j__4733 - 1;
      var G__4737 = len__4734 - 1;
      i__4732 = G__4735;
      j__4733 = G__4736;
      len__4734 = G__4737;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__4738__4739 = s;
    if(G__4738__4739 != null) {
      if(function() {
        var or__3824__auto____4740 = G__4738__4739.cljs$lang$protocol_mask$partition0$ & 32;
        if(or__3824__auto____4740) {
          return or__3824__auto____4740
        }else {
          return G__4738__4739.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__4738__4739.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4738__4739)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4738__4739)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__4741__4742 = s;
    if(G__4741__4742 != null) {
      if(function() {
        var or__3824__auto____4743 = G__4741__4742.cljs$lang$protocol_mask$partition3$ & 8;
        if(or__3824__auto____4743) {
          return or__3824__auto____4743
        }else {
          return G__4741__4742.cljs$core$ISeqable$
        }
      }()) {
        return true
      }else {
        if(!G__4741__4742.cljs$lang$protocol_mask$partition3$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__4741__4742)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__4741__4742)
    }
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____4744 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____4744)) {
    return cljs.core.not.call(null, function() {
      var or__3824__auto____4745 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____4745) {
        return or__3824__auto____4745
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }())
  }else {
    return and__3822__auto____4744
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____4746 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____4746)) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____4746
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____4747 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____4747)) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____4747
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____4748 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____4748) {
    return or__3824__auto____4748
  }else {
    var G__4749__4750 = f;
    if(G__4749__4750 != null) {
      if(function() {
        var or__3824__auto____4751 = G__4749__4750.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____4751) {
          return or__3824__auto____4751
        }else {
          return G__4749__4750.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__4749__4750.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__4749__4750)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__4749__4750)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____4752 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____4752) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____4752
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____4753 = coll;
    if(cljs.core.truth_(and__3822__auto____4753)) {
      var and__3822__auto____4754 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____4754) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____4754
      }
    }else {
      return and__3822__auto____4753
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___3 = function() {
    var G__4759__delegate = function(x, y, more) {
      if(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))) {
        var s__4755 = cljs.core.set([y, x]);
        var xs__4756 = more;
        while(true) {
          var x__4757 = cljs.core.first.call(null, xs__4756);
          var etc__4758 = cljs.core.next.call(null, xs__4756);
          if(cljs.core.truth_(xs__4756)) {
            if(cljs.core.contains_QMARK_.call(null, s__4755, x__4757)) {
              return false
            }else {
              var G__4760 = cljs.core.conj.call(null, s__4755, x__4757);
              var G__4761 = etc__4758;
              s__4755 = G__4760;
              xs__4756 = G__4761;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__4759 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4759__delegate.call(this, x, y, more)
    };
    G__4759.cljs$lang$maxFixedArity = 2;
    G__4759.cljs$lang$applyTo = function(arglist__4762) {
      var x = cljs.core.first(arglist__4762);
      var y = cljs.core.first(cljs.core.next(arglist__4762));
      var more = cljs.core.rest(cljs.core.next(arglist__4762));
      return G__4759__delegate.call(this, x, y, more)
    };
    return G__4759
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$3 = distinct_QMARK___3;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
    return goog.array.defaultCompare.call(null, x, y)
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if("\ufdd0'else") {
          throw new Error("compare on non-nil objects of different types");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__4763 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__4763)) {
        return r__4763
      }else {
        if(cljs.core.truth_(r__4763)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
void 0;
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__4764 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__4764, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__4764)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    return cljs.core._reduce.call(null, coll, f)
  };
  var reduce__3 = function(f, val, coll) {
    return cljs.core._reduce.call(null, coll, f, val)
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____4765 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3971__auto____4765)) {
      var s__4766 = temp__3971__auto____4765;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__4766), cljs.core.next.call(null, s__4766))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__4767 = val;
    var coll__4768 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__4768)) {
        var nval__4769 = f.call(null, val__4767, cljs.core.first.call(null, coll__4768));
        if(cljs.core.reduced_QMARK_.call(null, nval__4769)) {
          return cljs.core.deref.call(null, nval__4769)
        }else {
          var G__4770 = nval__4769;
          var G__4771 = cljs.core.next.call(null, coll__4768);
          val__4767 = G__4770;
          coll__4768 = G__4771;
          continue
        }
      }else {
        return val__4767
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.IReduce["_"] = true;
cljs.core._reduce["_"] = function() {
  var G__4772 = null;
  var G__4772__2 = function(coll, f) {
    return cljs.core.seq_reduce.call(null, f, coll)
  };
  var G__4772__3 = function(coll, f, start) {
    return cljs.core.seq_reduce.call(null, f, start, coll)
  };
  G__4772 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4772__2.call(this, coll, f);
      case 3:
        return G__4772__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4772
}();
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 0;
  this.cljs$lang$protocol_mask$partition2$ = 2
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$ = true;
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__4773 = this;
  return this__4773.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__4774__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__4774 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4774__delegate.call(this, x, y, more)
    };
    G__4774.cljs$lang$maxFixedArity = 2;
    G__4774.cljs$lang$applyTo = function(arglist__4775) {
      var x = cljs.core.first(arglist__4775);
      var y = cljs.core.first(cljs.core.next(arglist__4775));
      var more = cljs.core.rest(cljs.core.next(arglist__4775));
      return G__4774__delegate.call(this, x, y, more)
    };
    return G__4774
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$3 = _PLUS___3;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__4776__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__4776 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4776__delegate.call(this, x, y, more)
    };
    G__4776.cljs$lang$maxFixedArity = 2;
    G__4776.cljs$lang$applyTo = function(arglist__4777) {
      var x = cljs.core.first(arglist__4777);
      var y = cljs.core.first(cljs.core.next(arglist__4777));
      var more = cljs.core.rest(cljs.core.next(arglist__4777));
      return G__4776__delegate.call(this, x, y, more)
    };
    return G__4776
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$3 = ___3;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__4778__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__4778 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4778__delegate.call(this, x, y, more)
    };
    G__4778.cljs$lang$maxFixedArity = 2;
    G__4778.cljs$lang$applyTo = function(arglist__4779) {
      var x = cljs.core.first(arglist__4779);
      var y = cljs.core.first(cljs.core.next(arglist__4779));
      var more = cljs.core.rest(cljs.core.next(arglist__4779));
      return G__4778__delegate.call(this, x, y, more)
    };
    return G__4778
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$3 = _STAR___3;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__4780__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__4780 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4780__delegate.call(this, x, y, more)
    };
    G__4780.cljs$lang$maxFixedArity = 2;
    G__4780.cljs$lang$applyTo = function(arglist__4781) {
      var x = cljs.core.first(arglist__4781);
      var y = cljs.core.first(cljs.core.next(arglist__4781));
      var more = cljs.core.rest(cljs.core.next(arglist__4781));
      return G__4780__delegate.call(this, x, y, more)
    };
    return G__4780
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$3 = _SLASH___3;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__4782__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4783 = y;
            var G__4784 = cljs.core.first.call(null, more);
            var G__4785 = cljs.core.next.call(null, more);
            x = G__4783;
            y = G__4784;
            more = G__4785;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4782 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4782__delegate.call(this, x, y, more)
    };
    G__4782.cljs$lang$maxFixedArity = 2;
    G__4782.cljs$lang$applyTo = function(arglist__4786) {
      var x = cljs.core.first(arglist__4786);
      var y = cljs.core.first(cljs.core.next(arglist__4786));
      var more = cljs.core.rest(cljs.core.next(arglist__4786));
      return G__4782__delegate.call(this, x, y, more)
    };
    return G__4782
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$3 = _LT___3;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__4787__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4788 = y;
            var G__4789 = cljs.core.first.call(null, more);
            var G__4790 = cljs.core.next.call(null, more);
            x = G__4788;
            y = G__4789;
            more = G__4790;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4787 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4787__delegate.call(this, x, y, more)
    };
    G__4787.cljs$lang$maxFixedArity = 2;
    G__4787.cljs$lang$applyTo = function(arglist__4791) {
      var x = cljs.core.first(arglist__4791);
      var y = cljs.core.first(cljs.core.next(arglist__4791));
      var more = cljs.core.rest(cljs.core.next(arglist__4791));
      return G__4787__delegate.call(this, x, y, more)
    };
    return G__4787
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$3 = _LT__EQ___3;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__4792__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4793 = y;
            var G__4794 = cljs.core.first.call(null, more);
            var G__4795 = cljs.core.next.call(null, more);
            x = G__4793;
            y = G__4794;
            more = G__4795;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4792 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4792__delegate.call(this, x, y, more)
    };
    G__4792.cljs$lang$maxFixedArity = 2;
    G__4792.cljs$lang$applyTo = function(arglist__4796) {
      var x = cljs.core.first(arglist__4796);
      var y = cljs.core.first(cljs.core.next(arglist__4796));
      var more = cljs.core.rest(cljs.core.next(arglist__4796));
      return G__4792__delegate.call(this, x, y, more)
    };
    return G__4792
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$3 = _GT___3;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__4797__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4798 = y;
            var G__4799 = cljs.core.first.call(null, more);
            var G__4800 = cljs.core.next.call(null, more);
            x = G__4798;
            y = G__4799;
            more = G__4800;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4797 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4797__delegate.call(this, x, y, more)
    };
    G__4797.cljs$lang$maxFixedArity = 2;
    G__4797.cljs$lang$applyTo = function(arglist__4801) {
      var x = cljs.core.first(arglist__4801);
      var y = cljs.core.first(cljs.core.next(arglist__4801));
      var more = cljs.core.rest(cljs.core.next(arglist__4801));
      return G__4797__delegate.call(this, x, y, more)
    };
    return G__4797
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$3 = _GT__EQ___3;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__4802__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__4802 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4802__delegate.call(this, x, y, more)
    };
    G__4802.cljs$lang$maxFixedArity = 2;
    G__4802.cljs$lang$applyTo = function(arglist__4803) {
      var x = cljs.core.first(arglist__4803);
      var y = cljs.core.first(cljs.core.next(arglist__4803));
      var more = cljs.core.rest(cljs.core.next(arglist__4803));
      return G__4802__delegate.call(this, x, y, more)
    };
    return G__4802
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$3 = max__3;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__4804__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__4804 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4804__delegate.call(this, x, y, more)
    };
    G__4804.cljs$lang$maxFixedArity = 2;
    G__4804.cljs$lang$applyTo = function(arglist__4805) {
      var x = cljs.core.first(arglist__4805);
      var y = cljs.core.first(cljs.core.next(arglist__4805));
      var more = cljs.core.rest(cljs.core.next(arglist__4805));
      return G__4804__delegate.call(this, x, y, more)
    };
    return G__4804
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$3 = min__3;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__4806 = n % d;
  return cljs.core.fix.call(null, (n - rem__4806) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__4807 = cljs.core.quot.call(null, n, d);
  return n - d * q__4807
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(n) {
  var c__4808 = 0;
  var n__4809 = n;
  while(true) {
    if(n__4809 === 0) {
      return c__4808
    }else {
      var G__4810 = c__4808 + 1;
      var G__4811 = n__4809 & n__4809 - 1;
      c__4808 = G__4810;
      n__4809 = G__4811;
      continue
    }
    break
  }
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__4812__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4813 = y;
            var G__4814 = cljs.core.first.call(null, more);
            var G__4815 = cljs.core.next.call(null, more);
            x = G__4813;
            y = G__4814;
            more = G__4815;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4812 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4812__delegate.call(this, x, y, more)
    };
    G__4812.cljs$lang$maxFixedArity = 2;
    G__4812.cljs$lang$applyTo = function(arglist__4816) {
      var x = cljs.core.first(arglist__4816);
      var y = cljs.core.first(cljs.core.next(arglist__4816));
      var more = cljs.core.rest(cljs.core.next(arglist__4816));
      return G__4812__delegate.call(this, x, y, more)
    };
    return G__4812
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$3 = _EQ__EQ___3;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__4817 = n;
  var xs__4818 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____4819 = xs__4818;
      if(cljs.core.truth_(and__3822__auto____4819)) {
        return n__4817 > 0
      }else {
        return and__3822__auto____4819
      }
    }())) {
      var G__4820 = n__4817 - 1;
      var G__4821 = cljs.core.next.call(null, xs__4818);
      n__4817 = G__4820;
      xs__4818 = G__4821;
      continue
    }else {
      return xs__4818
    }
    break
  }
};
cljs.core.IIndexed["_"] = true;
cljs.core._nth["_"] = function() {
  var G__4826 = null;
  var G__4826__2 = function(coll, n) {
    var temp__3971__auto____4822 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3971__auto____4822)) {
      var xs__4823 = temp__3971__auto____4822;
      return cljs.core.first.call(null, xs__4823)
    }else {
      throw new Error("Index out of bounds");
    }
  };
  var G__4826__3 = function(coll, n, not_found) {
    var temp__3971__auto____4824 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3971__auto____4824)) {
      var xs__4825 = temp__3971__auto____4824;
      return cljs.core.first.call(null, xs__4825)
    }else {
      return not_found
    }
  };
  G__4826 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4826__2.call(this, coll, n);
      case 3:
        return G__4826__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4826
}();
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__4827__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__4828 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__4829 = cljs.core.next.call(null, more);
            sb = G__4828;
            more = G__4829;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__4827 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4827__delegate.call(this, x, ys)
    };
    G__4827.cljs$lang$maxFixedArity = 1;
    G__4827.cljs$lang$applyTo = function(arglist__4830) {
      var x = cljs.core.first(arglist__4830);
      var ys = cljs.core.rest(arglist__4830);
      return G__4827__delegate.call(this, x, ys)
    };
    return G__4827
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$2 = str_STAR___2;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__4831__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__4832 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__4833 = cljs.core.next.call(null, more);
            sb = G__4832;
            more = G__4833;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__4831 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4831__delegate.call(this, x, ys)
    };
    G__4831.cljs$lang$maxFixedArity = 1;
    G__4831.cljs$lang$applyTo = function(arglist__4834) {
      var x = cljs.core.first(arglist__4834);
      var ys = cljs.core.rest(arglist__4834);
      return G__4831__delegate.call(this, x, ys)
    };
    return G__4831
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$2 = str__2;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__4835 = cljs.core.seq.call(null, x);
    var ys__4836 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__4835 == null) {
        return ys__4836 == null
      }else {
        if(ys__4836 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__4835), cljs.core.first.call(null, ys__4836))) {
            var G__4837 = cljs.core.next.call(null, xs__4835);
            var G__4838 = cljs.core.next.call(null, ys__4836);
            xs__4835 = G__4837;
            ys__4836 = G__4838;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__4839_SHARP_, p2__4840_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__4839_SHARP_, cljs.core.hash.call(null, p2__4840_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__4841 = 0;
  var s__4842 = cljs.core.seq.call(null, m);
  while(true) {
    if(cljs.core.truth_(s__4842)) {
      var e__4843 = cljs.core.first.call(null, s__4842);
      var G__4844 = (h__4841 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__4843)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__4843)))) % 4503599627370496;
      var G__4845 = cljs.core.next.call(null, s__4842);
      h__4841 = G__4844;
      s__4842 = G__4845;
      continue
    }else {
      return h__4841
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__4846 = 0;
  var s__4847 = cljs.core.seq.call(null, s);
  while(true) {
    if(cljs.core.truth_(s__4847)) {
      var e__4848 = cljs.core.first.call(null, s__4847);
      var G__4849 = (h__4846 + cljs.core.hash.call(null, e__4848)) % 4503599627370496;
      var G__4850 = cljs.core.next.call(null, s__4847);
      h__4846 = G__4849;
      s__4847 = G__4850;
      continue
    }else {
      return h__4846
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__4851__4852 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__4851__4852)) {
    var G__4854__4856 = cljs.core.first.call(null, G__4851__4852);
    var vec__4855__4857 = G__4854__4856;
    var key_name__4858 = cljs.core.nth.call(null, vec__4855__4857, 0, null);
    var f__4859 = cljs.core.nth.call(null, vec__4855__4857, 1, null);
    var G__4851__4860 = G__4851__4852;
    var G__4854__4861 = G__4854__4856;
    var G__4851__4862 = G__4851__4860;
    while(true) {
      var vec__4863__4864 = G__4854__4861;
      var key_name__4865 = cljs.core.nth.call(null, vec__4863__4864, 0, null);
      var f__4866 = cljs.core.nth.call(null, vec__4863__4864, 1, null);
      var G__4851__4867 = G__4851__4862;
      var str_name__4868 = cljs.core.name.call(null, key_name__4865);
      obj[str_name__4868] = f__4866;
      var temp__3974__auto____4869 = cljs.core.next.call(null, G__4851__4867);
      if(cljs.core.truth_(temp__3974__auto____4869)) {
        var G__4851__4870 = temp__3974__auto____4869;
        var G__4871 = cljs.core.first.call(null, G__4851__4870);
        var G__4872 = G__4851__4870;
        G__4854__4861 = G__4871;
        G__4851__4862 = G__4872;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition3$ = 62;
  this.cljs$lang$protocol_mask$partition0$ = 46;
  this.cljs$lang$protocol_mask$partition1$ = 32;
  this.cljs$lang$protocol_mask$partition2$ = 24
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4873 = this;
  var h__364__auto____4874 = this__4873.__hash;
  if(h__364__auto____4874 != null) {
    return h__364__auto____4874
  }else {
    var h__364__auto____4875 = cljs.core.hash_coll.call(null, coll);
    this__4873.__hash = h__364__auto____4875;
    return h__364__auto____4875
  }
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4876 = this;
  return new cljs.core.List(this__4876.meta, o, coll, this__4876.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__4877 = this;
  var this$__4878 = this;
  return cljs.core.pr_str.call(null, this$__4878)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__4879 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__4880 = this;
  return this__4880.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__4881 = this;
  return this__4881.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__4882 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__4883 = this;
  return this__4883.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__4884 = this;
  return this__4884.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4885 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__4886 = this;
  return new cljs.core.List(meta, this__4886.first, this__4886.rest, this__4886.count, this__4886.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__4887 = this;
  return this__4887.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__4888 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List.prototype.cljs$core$IList$ = true;
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition3$ = 62;
  this.cljs$lang$protocol_mask$partition0$ = 46;
  this.cljs$lang$protocol_mask$partition1$ = 32;
  this.cljs$lang$protocol_mask$partition2$ = 24
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4889 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4890 = this;
  return new cljs.core.List(this__4890.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__4891 = this;
  var this$__4892 = this;
  return cljs.core.pr_str.call(null, this$__4892)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__4893 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__4894 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__4895 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__4896 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__4897 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__4898 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4899 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__4900 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__4901 = this;
  return this__4901.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__4902 = this;
  return coll
};
cljs.core.EmptyList.prototype.cljs$core$IList$ = true;
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__4903__4904 = coll;
  if(G__4903__4904 != null) {
    if(function() {
      var or__3824__auto____4905 = G__4903__4904.cljs$lang$protocol_mask$partition4$ & 2;
      if(or__3824__auto____4905) {
        return or__3824__auto____4905
      }else {
        return G__4903__4904.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__4903__4904.cljs$lang$protocol_mask$partition4$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__4903__4904)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__4903__4904)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__4906) {
    var items = cljs.core.seq(arglist__4906);
    return list__delegate.call(this, items)
  };
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition3$ = 62;
  this.cljs$lang$protocol_mask$partition0$ = 44;
  this.cljs$lang$protocol_mask$partition2$ = 24
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4907 = this;
  var h__364__auto____4908 = this__4907.__hash;
  if(h__364__auto____4908 != null) {
    return h__364__auto____4908
  }else {
    var h__364__auto____4909 = cljs.core.hash_coll.call(null, coll);
    this__4907.__hash = h__364__auto____4909;
    return h__364__auto____4909
  }
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4910 = this;
  return new cljs.core.Cons(null, o, coll, this__4910.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__4911 = this;
  var this$__4912 = this;
  return cljs.core.pr_str.call(null, this$__4912)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__4913 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__4914 = this;
  return this__4914.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__4915 = this;
  if(this__4915.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__4915.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4916 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__4917 = this;
  return new cljs.core.Cons(meta, this__4917.first, this__4917.rest, this__4917.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__4918 = this;
  return this__4918.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__4919 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__4919.meta)
};
cljs.core.Cons.prototype.cljs$core$IList$ = true;
cljs.core.Cons;
cljs.core.cons = function cons(x, seq) {
  return new cljs.core.Cons(null, x, seq, null)
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__4920__4921 = x;
  if(G__4920__4921 != null) {
    if(function() {
      var or__3824__auto____4922 = G__4920__4921.cljs$lang$protocol_mask$partition3$ & 32;
      if(or__3824__auto____4922) {
        return or__3824__auto____4922
      }else {
        return G__4920__4921.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__4920__4921.cljs$lang$protocol_mask$partition3$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__4920__4921)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__4920__4921)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__4923 = null;
  var G__4923__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__4923__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__4923 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4923__2.call(this, string, f);
      case 3:
        return G__4923__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4923
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__4924 = null;
  var G__4924__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__4924__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__4924 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4924__2.call(this, string, k);
      case 3:
        return G__4924__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4924
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__4925 = null;
  var G__4925__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__4925__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__4925 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4925__2.call(this, string, n);
      case 3:
        return G__4925__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4925
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__4934 = null;
  var G__4934__2 = function(tsym4928, coll) {
    var tsym4928__4930 = this;
    var this$__4931 = tsym4928__4930;
    return cljs.core.get.call(null, coll, this$__4931.toString())
  };
  var G__4934__3 = function(tsym4929, coll, not_found) {
    var tsym4929__4932 = this;
    var this$__4933 = tsym4929__4932;
    return cljs.core.get.call(null, coll, this$__4933.toString(), not_found)
  };
  G__4934 = function(tsym4929, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4934__2.call(this, tsym4929, coll);
      case 3:
        return G__4934__3.call(this, tsym4929, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4934
}();
String.prototype.apply = function(tsym4926, args4927) {
  return tsym4926.call.apply(tsym4926, [tsym4926].concat(cljs.core.aclone.call(null, args4927)))
};
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__4935 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__4935
  }else {
    lazy_seq.x = x__4935.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition3$ = 30;
  this.cljs$lang$protocol_mask$partition0$ = 44;
  this.cljs$lang$protocol_mask$partition2$ = 24
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4936 = this;
  var h__364__auto____4937 = this__4936.__hash;
  if(h__364__auto____4937 != null) {
    return h__364__auto____4937
  }else {
    var h__364__auto____4938 = cljs.core.hash_coll.call(null, coll);
    this__4936.__hash = h__364__auto____4938;
    return h__364__auto____4938
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4939 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__4940 = this;
  var this$__4941 = this;
  return cljs.core.pr_str.call(null, this$__4941)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__4942 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__4943 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__4944 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4945 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__4946 = this;
  return new cljs.core.LazySeq(meta, this__4946.realized, this__4946.x, this__4946.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__4947 = this;
  return this__4947.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__4948 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__4948.meta)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__4949 = [];
  var s__4950 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__4950))) {
      ary__4949.push(cljs.core.first.call(null, s__4950));
      var G__4951 = cljs.core.next.call(null, s__4950);
      s__4950 = G__4951;
      continue
    }else {
      return ary__4949
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__4952 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__4953 = 0;
  var xs__4954 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(xs__4954)) {
      ret__4952[i__4953] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__4954));
      var G__4955 = i__4953 + 1;
      var G__4956 = cljs.core.next.call(null, xs__4954);
      i__4953 = G__4955;
      xs__4954 = G__4956;
      continue
    }else {
    }
    break
  }
  return ret__4952
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__4957 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__4958 = cljs.core.seq.call(null, init_val_or_seq);
      var i__4959 = 0;
      var s__4960 = s__4958;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____4961 = s__4960;
          if(cljs.core.truth_(and__3822__auto____4961)) {
            return i__4959 < size
          }else {
            return and__3822__auto____4961
          }
        }())) {
          a__4957[i__4959] = cljs.core.first.call(null, s__4960);
          var G__4964 = i__4959 + 1;
          var G__4965 = cljs.core.next.call(null, s__4960);
          i__4959 = G__4964;
          s__4960 = G__4965;
          continue
        }else {
          return a__4957
        }
        break
      }
    }else {
      var n__653__auto____4962 = size;
      var i__4963 = 0;
      while(true) {
        if(i__4963 < n__653__auto____4962) {
          a__4957[i__4963] = init_val_or_seq;
          var G__4966 = i__4963 + 1;
          i__4963 = G__4966;
          continue
        }else {
        }
        break
      }
      return a__4957
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__4967 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__4968 = cljs.core.seq.call(null, init_val_or_seq);
      var i__4969 = 0;
      var s__4970 = s__4968;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____4971 = s__4970;
          if(cljs.core.truth_(and__3822__auto____4971)) {
            return i__4969 < size
          }else {
            return and__3822__auto____4971
          }
        }())) {
          a__4967[i__4969] = cljs.core.first.call(null, s__4970);
          var G__4974 = i__4969 + 1;
          var G__4975 = cljs.core.next.call(null, s__4970);
          i__4969 = G__4974;
          s__4970 = G__4975;
          continue
        }else {
          return a__4967
        }
        break
      }
    }else {
      var n__653__auto____4972 = size;
      var i__4973 = 0;
      while(true) {
        if(i__4973 < n__653__auto____4972) {
          a__4967[i__4973] = init_val_or_seq;
          var G__4976 = i__4973 + 1;
          i__4973 = G__4976;
          continue
        }else {
        }
        break
      }
      return a__4967
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__4977 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__4978 = cljs.core.seq.call(null, init_val_or_seq);
      var i__4979 = 0;
      var s__4980 = s__4978;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____4981 = s__4980;
          if(cljs.core.truth_(and__3822__auto____4981)) {
            return i__4979 < size
          }else {
            return and__3822__auto____4981
          }
        }())) {
          a__4977[i__4979] = cljs.core.first.call(null, s__4980);
          var G__4984 = i__4979 + 1;
          var G__4985 = cljs.core.next.call(null, s__4980);
          i__4979 = G__4984;
          s__4980 = G__4985;
          continue
        }else {
          return a__4977
        }
        break
      }
    }else {
      var n__653__auto____4982 = size;
      var i__4983 = 0;
      while(true) {
        if(i__4983 < n__653__auto____4982) {
          a__4977[i__4983] = init_val_or_seq;
          var G__4986 = i__4983 + 1;
          i__4983 = G__4986;
          continue
        }else {
        }
        break
      }
      return a__4977
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  var s__4987 = s;
  var i__4988 = n;
  var sum__4989 = 0;
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____4990 = i__4988 > 0;
      if(and__3822__auto____4990) {
        return cljs.core.seq.call(null, s__4987)
      }else {
        return and__3822__auto____4990
      }
    }())) {
      var G__4991 = cljs.core.next.call(null, s__4987);
      var G__4992 = i__4988 - 1;
      var G__4993 = sum__4989 + 1;
      s__4987 = G__4991;
      i__4988 = G__4992;
      sum__4989 = G__4993;
      continue
    }else {
      return sum__4989
    }
    break
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__4994 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__4994)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__4994), concat.call(null, cljs.core.rest.call(null, s__4994), y))
      }else {
        return y
      }
    })
  };
  var concat__3 = function() {
    var G__4997__delegate = function(x, y, zs) {
      var cat__4996 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__4995 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__4995)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__4995), cat.call(null, cljs.core.rest.call(null, xys__4995), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__4996.call(null, concat.call(null, x, y), zs)
    };
    var G__4997 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4997__delegate.call(this, x, y, zs)
    };
    G__4997.cljs$lang$maxFixedArity = 2;
    G__4997.cljs$lang$applyTo = function(arglist__4998) {
      var x = cljs.core.first(arglist__4998);
      var y = cljs.core.first(cljs.core.next(arglist__4998));
      var zs = cljs.core.rest(cljs.core.next(arglist__4998));
      return G__4997__delegate.call(this, x, y, zs)
    };
    return G__4997
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$3 = concat__3;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__4999__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__4999 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__4999__delegate.call(this, a, b, c, d, more)
    };
    G__4999.cljs$lang$maxFixedArity = 4;
    G__4999.cljs$lang$applyTo = function(arglist__5000) {
      var a = cljs.core.first(arglist__5000);
      var b = cljs.core.first(cljs.core.next(arglist__5000));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5000)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5000))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5000))));
      return G__4999__delegate.call(this, a, b, c, d, more)
    };
    return G__4999
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$5 = list_STAR___5;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__5001 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.bounded_count.call(null, args, fixed_arity__5001 + 1) <= fixed_arity__5001) {
        return f.apply(f, cljs.core.to_array.call(null, args))
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__5002 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__5003 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.bounded_count.call(null, arglist__5002, fixed_arity__5003) <= fixed_arity__5003) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__5002))
      }else {
        return f.cljs$lang$applyTo(arglist__5002)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5002))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__5004 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__5005 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.bounded_count.call(null, arglist__5004, fixed_arity__5005) <= fixed_arity__5005) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__5004))
      }else {
        return f.cljs$lang$applyTo(arglist__5004)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5004))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__5006 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__5007 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.bounded_count.call(null, arglist__5006, fixed_arity__5007) <= fixed_arity__5007) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__5006))
      }else {
        return f.cljs$lang$applyTo(arglist__5006)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5006))
    }
  };
  var apply__6 = function() {
    var G__5010__delegate = function(f, a, b, c, d, args) {
      var arglist__5008 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__5009 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        if(cljs.core.bounded_count.call(null, arglist__5008, fixed_arity__5009) <= fixed_arity__5009) {
          return f.apply(f, cljs.core.to_array.call(null, arglist__5008))
        }else {
          return f.cljs$lang$applyTo(arglist__5008)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__5008))
      }
    };
    var G__5010 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__5010__delegate.call(this, f, a, b, c, d, args)
    };
    G__5010.cljs$lang$maxFixedArity = 5;
    G__5010.cljs$lang$applyTo = function(arglist__5011) {
      var f = cljs.core.first(arglist__5011);
      var a = cljs.core.first(cljs.core.next(arglist__5011));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5011)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5011))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5011)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5011)))));
      return G__5010__delegate.call(this, f, a, b, c, d, args)
    };
    return G__5010
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$6 = apply__6;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__5012) {
    var obj = cljs.core.first(arglist__5012);
    var f = cljs.core.first(cljs.core.next(arglist__5012));
    var args = cljs.core.rest(cljs.core.next(arglist__5012));
    return vary_meta__delegate.call(this, obj, f, args)
  };
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___3 = function() {
    var G__5013__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__5013 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5013__delegate.call(this, x, y, more)
    };
    G__5013.cljs$lang$maxFixedArity = 2;
    G__5013.cljs$lang$applyTo = function(arglist__5014) {
      var x = cljs.core.first(arglist__5014);
      var y = cljs.core.first(cljs.core.next(arglist__5014));
      var more = cljs.core.rest(cljs.core.next(arglist__5014));
      return G__5013__delegate.call(this, x, y, more)
    };
    return G__5013
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$3 = not_EQ___3;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__5015 = pred;
        var G__5016 = cljs.core.next.call(null, coll);
        pred = G__5015;
        coll = G__5016;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3824__auto____5017 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____5017)) {
        return or__3824__auto____5017
      }else {
        var G__5018 = pred;
        var G__5019 = cljs.core.next.call(null, coll);
        pred = G__5018;
        coll = G__5019;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__5020 = null;
    var G__5020__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__5020__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__5020__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__5020__3 = function() {
      var G__5021__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__5021 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__5021__delegate.call(this, x, y, zs)
      };
      G__5021.cljs$lang$maxFixedArity = 2;
      G__5021.cljs$lang$applyTo = function(arglist__5022) {
        var x = cljs.core.first(arglist__5022);
        var y = cljs.core.first(cljs.core.next(arglist__5022));
        var zs = cljs.core.rest(cljs.core.next(arglist__5022));
        return G__5021__delegate.call(this, x, y, zs)
      };
      return G__5021
    }();
    G__5020 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__5020__0.call(this);
        case 1:
          return G__5020__1.call(this, x);
        case 2:
          return G__5020__2.call(this, x, y);
        default:
          return G__5020__3.apply(this, arguments)
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__5020.cljs$lang$maxFixedArity = 2;
    G__5020.cljs$lang$applyTo = G__5020__3.cljs$lang$applyTo;
    return G__5020
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__5023__delegate = function(args) {
      return x
    };
    var G__5023 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__5023__delegate.call(this, args)
    };
    G__5023.cljs$lang$maxFixedArity = 0;
    G__5023.cljs$lang$applyTo = function(arglist__5024) {
      var args = cljs.core.seq(arglist__5024);
      return G__5023__delegate.call(this, args)
    };
    return G__5023
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__5028 = null;
      var G__5028__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__5028__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__5028__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__5028__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__5028__4 = function() {
        var G__5029__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__5029 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5029__delegate.call(this, x, y, z, args)
        };
        G__5029.cljs$lang$maxFixedArity = 3;
        G__5029.cljs$lang$applyTo = function(arglist__5030) {
          var x = cljs.core.first(arglist__5030);
          var y = cljs.core.first(cljs.core.next(arglist__5030));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5030)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5030)));
          return G__5029__delegate.call(this, x, y, z, args)
        };
        return G__5029
      }();
      G__5028 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5028__0.call(this);
          case 1:
            return G__5028__1.call(this, x);
          case 2:
            return G__5028__2.call(this, x, y);
          case 3:
            return G__5028__3.call(this, x, y, z);
          default:
            return G__5028__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5028.cljs$lang$maxFixedArity = 3;
      G__5028.cljs$lang$applyTo = G__5028__4.cljs$lang$applyTo;
      return G__5028
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__5031 = null;
      var G__5031__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__5031__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__5031__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__5031__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__5031__4 = function() {
        var G__5032__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__5032 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5032__delegate.call(this, x, y, z, args)
        };
        G__5032.cljs$lang$maxFixedArity = 3;
        G__5032.cljs$lang$applyTo = function(arglist__5033) {
          var x = cljs.core.first(arglist__5033);
          var y = cljs.core.first(cljs.core.next(arglist__5033));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5033)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5033)));
          return G__5032__delegate.call(this, x, y, z, args)
        };
        return G__5032
      }();
      G__5031 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5031__0.call(this);
          case 1:
            return G__5031__1.call(this, x);
          case 2:
            return G__5031__2.call(this, x, y);
          case 3:
            return G__5031__3.call(this, x, y, z);
          default:
            return G__5031__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5031.cljs$lang$maxFixedArity = 3;
      G__5031.cljs$lang$applyTo = G__5031__4.cljs$lang$applyTo;
      return G__5031
    }()
  };
  var comp__4 = function() {
    var G__5034__delegate = function(f1, f2, f3, fs) {
      var fs__5025 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__5035__delegate = function(args) {
          var ret__5026 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__5025), args);
          var fs__5027 = cljs.core.next.call(null, fs__5025);
          while(true) {
            if(cljs.core.truth_(fs__5027)) {
              var G__5036 = cljs.core.first.call(null, fs__5027).call(null, ret__5026);
              var G__5037 = cljs.core.next.call(null, fs__5027);
              ret__5026 = G__5036;
              fs__5027 = G__5037;
              continue
            }else {
              return ret__5026
            }
            break
          }
        };
        var G__5035 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5035__delegate.call(this, args)
        };
        G__5035.cljs$lang$maxFixedArity = 0;
        G__5035.cljs$lang$applyTo = function(arglist__5038) {
          var args = cljs.core.seq(arglist__5038);
          return G__5035__delegate.call(this, args)
        };
        return G__5035
      }()
    };
    var G__5034 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5034__delegate.call(this, f1, f2, f3, fs)
    };
    G__5034.cljs$lang$maxFixedArity = 3;
    G__5034.cljs$lang$applyTo = function(arglist__5039) {
      var f1 = cljs.core.first(arglist__5039);
      var f2 = cljs.core.first(cljs.core.next(arglist__5039));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5039)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5039)));
      return G__5034__delegate.call(this, f1, f2, f3, fs)
    };
    return G__5034
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$4 = comp__4;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__5040__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__5040 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5040__delegate.call(this, args)
      };
      G__5040.cljs$lang$maxFixedArity = 0;
      G__5040.cljs$lang$applyTo = function(arglist__5041) {
        var args = cljs.core.seq(arglist__5041);
        return G__5040__delegate.call(this, args)
      };
      return G__5040
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__5042__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__5042 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5042__delegate.call(this, args)
      };
      G__5042.cljs$lang$maxFixedArity = 0;
      G__5042.cljs$lang$applyTo = function(arglist__5043) {
        var args = cljs.core.seq(arglist__5043);
        return G__5042__delegate.call(this, args)
      };
      return G__5042
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__5044__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__5044 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5044__delegate.call(this, args)
      };
      G__5044.cljs$lang$maxFixedArity = 0;
      G__5044.cljs$lang$applyTo = function(arglist__5045) {
        var args = cljs.core.seq(arglist__5045);
        return G__5044__delegate.call(this, args)
      };
      return G__5044
    }()
  };
  var partial__5 = function() {
    var G__5046__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__5047__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__5047 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5047__delegate.call(this, args)
        };
        G__5047.cljs$lang$maxFixedArity = 0;
        G__5047.cljs$lang$applyTo = function(arglist__5048) {
          var args = cljs.core.seq(arglist__5048);
          return G__5047__delegate.call(this, args)
        };
        return G__5047
      }()
    };
    var G__5046 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5046__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__5046.cljs$lang$maxFixedArity = 4;
    G__5046.cljs$lang$applyTo = function(arglist__5049) {
      var f = cljs.core.first(arglist__5049);
      var arg1 = cljs.core.first(cljs.core.next(arglist__5049));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5049)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5049))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5049))));
      return G__5046__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    return G__5046
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$5 = partial__5;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__5050 = null;
      var G__5050__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__5050__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__5050__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__5050__4 = function() {
        var G__5051__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__5051 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5051__delegate.call(this, a, b, c, ds)
        };
        G__5051.cljs$lang$maxFixedArity = 3;
        G__5051.cljs$lang$applyTo = function(arglist__5052) {
          var a = cljs.core.first(arglist__5052);
          var b = cljs.core.first(cljs.core.next(arglist__5052));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5052)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5052)));
          return G__5051__delegate.call(this, a, b, c, ds)
        };
        return G__5051
      }();
      G__5050 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__5050__1.call(this, a);
          case 2:
            return G__5050__2.call(this, a, b);
          case 3:
            return G__5050__3.call(this, a, b, c);
          default:
            return G__5050__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5050.cljs$lang$maxFixedArity = 3;
      G__5050.cljs$lang$applyTo = G__5050__4.cljs$lang$applyTo;
      return G__5050
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__5053 = null;
      var G__5053__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5053__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__5053__4 = function() {
        var G__5054__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__5054 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5054__delegate.call(this, a, b, c, ds)
        };
        G__5054.cljs$lang$maxFixedArity = 3;
        G__5054.cljs$lang$applyTo = function(arglist__5055) {
          var a = cljs.core.first(arglist__5055);
          var b = cljs.core.first(cljs.core.next(arglist__5055));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5055)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5055)));
          return G__5054__delegate.call(this, a, b, c, ds)
        };
        return G__5054
      }();
      G__5053 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5053__2.call(this, a, b);
          case 3:
            return G__5053__3.call(this, a, b, c);
          default:
            return G__5053__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5053.cljs$lang$maxFixedArity = 3;
      G__5053.cljs$lang$applyTo = G__5053__4.cljs$lang$applyTo;
      return G__5053
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__5056 = null;
      var G__5056__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5056__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__5056__4 = function() {
        var G__5057__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__5057 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5057__delegate.call(this, a, b, c, ds)
        };
        G__5057.cljs$lang$maxFixedArity = 3;
        G__5057.cljs$lang$applyTo = function(arglist__5058) {
          var a = cljs.core.first(arglist__5058);
          var b = cljs.core.first(cljs.core.next(arglist__5058));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5058)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5058)));
          return G__5057__delegate.call(this, a, b, c, ds)
        };
        return G__5057
      }();
      G__5056 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5056__2.call(this, a, b);
          case 3:
            return G__5056__3.call(this, a, b, c);
          default:
            return G__5056__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5056.cljs$lang$maxFixedArity = 3;
      G__5056.cljs$lang$applyTo = G__5056__4.cljs$lang$applyTo;
      return G__5056
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__5061 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5059 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5059)) {
        var s__5060 = temp__3974__auto____5059;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__5060)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__5060)))
      }else {
        return null
      }
    })
  };
  return mapi__5061.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____5062 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____5062)) {
      var s__5063 = temp__3974__auto____5062;
      var x__5064 = f.call(null, cljs.core.first.call(null, s__5063));
      if(x__5064 == null) {
        return keep.call(null, f, cljs.core.rest.call(null, s__5063))
      }else {
        return cljs.core.cons.call(null, x__5064, keep.call(null, f, cljs.core.rest.call(null, s__5063)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__5074 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5071 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5071)) {
        var s__5072 = temp__3974__auto____5071;
        var x__5073 = f.call(null, idx, cljs.core.first.call(null, s__5072));
        if(x__5073 == null) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5072))
        }else {
          return cljs.core.cons.call(null, x__5073, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5072)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__5074.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5081 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5081)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____5081
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5082 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5082)) {
            var and__3822__auto____5083 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____5083)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____5083
            }
          }else {
            return and__3822__auto____5082
          }
        }())
      };
      var ep1__4 = function() {
        var G__5119__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____5084 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____5084)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____5084
            }
          }())
        };
        var G__5119 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5119__delegate.call(this, x, y, z, args)
        };
        G__5119.cljs$lang$maxFixedArity = 3;
        G__5119.cljs$lang$applyTo = function(arglist__5120) {
          var x = cljs.core.first(arglist__5120);
          var y = cljs.core.first(cljs.core.next(arglist__5120));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5120)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5120)));
          return G__5119__delegate.call(this, x, y, z, args)
        };
        return G__5119
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$4 = ep1__4;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5085 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5085)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____5085
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5086 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5086)) {
            var and__3822__auto____5087 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____5087)) {
              var and__3822__auto____5088 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____5088)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____5088
              }
            }else {
              return and__3822__auto____5087
            }
          }else {
            return and__3822__auto____5086
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5089 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5089)) {
            var and__3822__auto____5090 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____5090)) {
              var and__3822__auto____5091 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____5091)) {
                var and__3822__auto____5092 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____5092)) {
                  var and__3822__auto____5093 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____5093)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____5093
                  }
                }else {
                  return and__3822__auto____5092
                }
              }else {
                return and__3822__auto____5091
              }
            }else {
              return and__3822__auto____5090
            }
          }else {
            return and__3822__auto____5089
          }
        }())
      };
      var ep2__4 = function() {
        var G__5121__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____5094 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____5094)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5065_SHARP_) {
                var and__3822__auto____5095 = p1.call(null, p1__5065_SHARP_);
                if(cljs.core.truth_(and__3822__auto____5095)) {
                  return p2.call(null, p1__5065_SHARP_)
                }else {
                  return and__3822__auto____5095
                }
              }, args)
            }else {
              return and__3822__auto____5094
            }
          }())
        };
        var G__5121 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5121__delegate.call(this, x, y, z, args)
        };
        G__5121.cljs$lang$maxFixedArity = 3;
        G__5121.cljs$lang$applyTo = function(arglist__5122) {
          var x = cljs.core.first(arglist__5122);
          var y = cljs.core.first(cljs.core.next(arglist__5122));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5122)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5122)));
          return G__5121__delegate.call(this, x, y, z, args)
        };
        return G__5121
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$4 = ep2__4;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5096 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5096)) {
            var and__3822__auto____5097 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5097)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____5097
            }
          }else {
            return and__3822__auto____5096
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5098 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5098)) {
            var and__3822__auto____5099 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5099)) {
              var and__3822__auto____5100 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____5100)) {
                var and__3822__auto____5101 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____5101)) {
                  var and__3822__auto____5102 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____5102)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____5102
                  }
                }else {
                  return and__3822__auto____5101
                }
              }else {
                return and__3822__auto____5100
              }
            }else {
              return and__3822__auto____5099
            }
          }else {
            return and__3822__auto____5098
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5103 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5103)) {
            var and__3822__auto____5104 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5104)) {
              var and__3822__auto____5105 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____5105)) {
                var and__3822__auto____5106 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____5106)) {
                  var and__3822__auto____5107 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____5107)) {
                    var and__3822__auto____5108 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____5108)) {
                      var and__3822__auto____5109 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____5109)) {
                        var and__3822__auto____5110 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____5110)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____5110
                        }
                      }else {
                        return and__3822__auto____5109
                      }
                    }else {
                      return and__3822__auto____5108
                    }
                  }else {
                    return and__3822__auto____5107
                  }
                }else {
                  return and__3822__auto____5106
                }
              }else {
                return and__3822__auto____5105
              }
            }else {
              return and__3822__auto____5104
            }
          }else {
            return and__3822__auto____5103
          }
        }())
      };
      var ep3__4 = function() {
        var G__5123__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____5111 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____5111)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5066_SHARP_) {
                var and__3822__auto____5112 = p1.call(null, p1__5066_SHARP_);
                if(cljs.core.truth_(and__3822__auto____5112)) {
                  var and__3822__auto____5113 = p2.call(null, p1__5066_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____5113)) {
                    return p3.call(null, p1__5066_SHARP_)
                  }else {
                    return and__3822__auto____5113
                  }
                }else {
                  return and__3822__auto____5112
                }
              }, args)
            }else {
              return and__3822__auto____5111
            }
          }())
        };
        var G__5123 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5123__delegate.call(this, x, y, z, args)
        };
        G__5123.cljs$lang$maxFixedArity = 3;
        G__5123.cljs$lang$applyTo = function(arglist__5124) {
          var x = cljs.core.first(arglist__5124);
          var y = cljs.core.first(cljs.core.next(arglist__5124));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5124)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5124)));
          return G__5123__delegate.call(this, x, y, z, args)
        };
        return G__5123
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$4 = ep3__4;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__5125__delegate = function(p1, p2, p3, ps) {
      var ps__5114 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__5067_SHARP_) {
            return p1__5067_SHARP_.call(null, x)
          }, ps__5114)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__5068_SHARP_) {
            var and__3822__auto____5115 = p1__5068_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5115)) {
              return p1__5068_SHARP_.call(null, y)
            }else {
              return and__3822__auto____5115
            }
          }, ps__5114)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__5069_SHARP_) {
            var and__3822__auto____5116 = p1__5069_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5116)) {
              var and__3822__auto____5117 = p1__5069_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____5117)) {
                return p1__5069_SHARP_.call(null, z)
              }else {
                return and__3822__auto____5117
              }
            }else {
              return and__3822__auto____5116
            }
          }, ps__5114)
        };
        var epn__4 = function() {
          var G__5126__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____5118 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____5118)) {
                return cljs.core.every_QMARK_.call(null, function(p1__5070_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__5070_SHARP_, args)
                }, ps__5114)
              }else {
                return and__3822__auto____5118
              }
            }())
          };
          var G__5126 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5126__delegate.call(this, x, y, z, args)
          };
          G__5126.cljs$lang$maxFixedArity = 3;
          G__5126.cljs$lang$applyTo = function(arglist__5127) {
            var x = cljs.core.first(arglist__5127);
            var y = cljs.core.first(cljs.core.next(arglist__5127));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5127)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5127)));
            return G__5126__delegate.call(this, x, y, z, args)
          };
          return G__5126
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$4 = epn__4;
        return epn
      }()
    };
    var G__5125 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5125__delegate.call(this, p1, p2, p3, ps)
    };
    G__5125.cljs$lang$maxFixedArity = 3;
    G__5125.cljs$lang$applyTo = function(arglist__5128) {
      var p1 = cljs.core.first(arglist__5128);
      var p2 = cljs.core.first(cljs.core.next(arglist__5128));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5128)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5128)));
      return G__5125__delegate.call(this, p1, p2, p3, ps)
    };
    return G__5125
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$4 = every_pred__4;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____5130 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5130)) {
          return or__3824__auto____5130
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____5131 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5131)) {
          return or__3824__auto____5131
        }else {
          var or__3824__auto____5132 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____5132)) {
            return or__3824__auto____5132
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__5168__delegate = function(x, y, z, args) {
          var or__3824__auto____5133 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____5133)) {
            return or__3824__auto____5133
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__5168 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5168__delegate.call(this, x, y, z, args)
        };
        G__5168.cljs$lang$maxFixedArity = 3;
        G__5168.cljs$lang$applyTo = function(arglist__5169) {
          var x = cljs.core.first(arglist__5169);
          var y = cljs.core.first(cljs.core.next(arglist__5169));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5169)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5169)));
          return G__5168__delegate.call(this, x, y, z, args)
        };
        return G__5168
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$4 = sp1__4;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____5134 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5134)) {
          return or__3824__auto____5134
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____5135 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5135)) {
          return or__3824__auto____5135
        }else {
          var or__3824__auto____5136 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____5136)) {
            return or__3824__auto____5136
          }else {
            var or__3824__auto____5137 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5137)) {
              return or__3824__auto____5137
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____5138 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5138)) {
          return or__3824__auto____5138
        }else {
          var or__3824__auto____5139 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____5139)) {
            return or__3824__auto____5139
          }else {
            var or__3824__auto____5140 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____5140)) {
              return or__3824__auto____5140
            }else {
              var or__3824__auto____5141 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____5141)) {
                return or__3824__auto____5141
              }else {
                var or__3824__auto____5142 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____5142)) {
                  return or__3824__auto____5142
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__5170__delegate = function(x, y, z, args) {
          var or__3824__auto____5143 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____5143)) {
            return or__3824__auto____5143
          }else {
            return cljs.core.some.call(null, function(p1__5075_SHARP_) {
              var or__3824__auto____5144 = p1.call(null, p1__5075_SHARP_);
              if(cljs.core.truth_(or__3824__auto____5144)) {
                return or__3824__auto____5144
              }else {
                return p2.call(null, p1__5075_SHARP_)
              }
            }, args)
          }
        };
        var G__5170 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5170__delegate.call(this, x, y, z, args)
        };
        G__5170.cljs$lang$maxFixedArity = 3;
        G__5170.cljs$lang$applyTo = function(arglist__5171) {
          var x = cljs.core.first(arglist__5171);
          var y = cljs.core.first(cljs.core.next(arglist__5171));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5171)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5171)));
          return G__5170__delegate.call(this, x, y, z, args)
        };
        return G__5170
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$4 = sp2__4;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____5145 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5145)) {
          return or__3824__auto____5145
        }else {
          var or__3824__auto____5146 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____5146)) {
            return or__3824__auto____5146
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____5147 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5147)) {
          return or__3824__auto____5147
        }else {
          var or__3824__auto____5148 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____5148)) {
            return or__3824__auto____5148
          }else {
            var or__3824__auto____5149 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5149)) {
              return or__3824__auto____5149
            }else {
              var or__3824__auto____5150 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____5150)) {
                return or__3824__auto____5150
              }else {
                var or__3824__auto____5151 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____5151)) {
                  return or__3824__auto____5151
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____5152 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5152)) {
          return or__3824__auto____5152
        }else {
          var or__3824__auto____5153 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____5153)) {
            return or__3824__auto____5153
          }else {
            var or__3824__auto____5154 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5154)) {
              return or__3824__auto____5154
            }else {
              var or__3824__auto____5155 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____5155)) {
                return or__3824__auto____5155
              }else {
                var or__3824__auto____5156 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____5156)) {
                  return or__3824__auto____5156
                }else {
                  var or__3824__auto____5157 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____5157)) {
                    return or__3824__auto____5157
                  }else {
                    var or__3824__auto____5158 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____5158)) {
                      return or__3824__auto____5158
                    }else {
                      var or__3824__auto____5159 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____5159)) {
                        return or__3824__auto____5159
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__5172__delegate = function(x, y, z, args) {
          var or__3824__auto____5160 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____5160)) {
            return or__3824__auto____5160
          }else {
            return cljs.core.some.call(null, function(p1__5076_SHARP_) {
              var or__3824__auto____5161 = p1.call(null, p1__5076_SHARP_);
              if(cljs.core.truth_(or__3824__auto____5161)) {
                return or__3824__auto____5161
              }else {
                var or__3824__auto____5162 = p2.call(null, p1__5076_SHARP_);
                if(cljs.core.truth_(or__3824__auto____5162)) {
                  return or__3824__auto____5162
                }else {
                  return p3.call(null, p1__5076_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__5172 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5172__delegate.call(this, x, y, z, args)
        };
        G__5172.cljs$lang$maxFixedArity = 3;
        G__5172.cljs$lang$applyTo = function(arglist__5173) {
          var x = cljs.core.first(arglist__5173);
          var y = cljs.core.first(cljs.core.next(arglist__5173));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5173)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5173)));
          return G__5172__delegate.call(this, x, y, z, args)
        };
        return G__5172
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$4 = sp3__4;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__5174__delegate = function(p1, p2, p3, ps) {
      var ps__5163 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__5077_SHARP_) {
            return p1__5077_SHARP_.call(null, x)
          }, ps__5163)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__5078_SHARP_) {
            var or__3824__auto____5164 = p1__5078_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5164)) {
              return or__3824__auto____5164
            }else {
              return p1__5078_SHARP_.call(null, y)
            }
          }, ps__5163)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__5079_SHARP_) {
            var or__3824__auto____5165 = p1__5079_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5165)) {
              return or__3824__auto____5165
            }else {
              var or__3824__auto____5166 = p1__5079_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____5166)) {
                return or__3824__auto____5166
              }else {
                return p1__5079_SHARP_.call(null, z)
              }
            }
          }, ps__5163)
        };
        var spn__4 = function() {
          var G__5175__delegate = function(x, y, z, args) {
            var or__3824__auto____5167 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____5167)) {
              return or__3824__auto____5167
            }else {
              return cljs.core.some.call(null, function(p1__5080_SHARP_) {
                return cljs.core.some.call(null, p1__5080_SHARP_, args)
              }, ps__5163)
            }
          };
          var G__5175 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5175__delegate.call(this, x, y, z, args)
          };
          G__5175.cljs$lang$maxFixedArity = 3;
          G__5175.cljs$lang$applyTo = function(arglist__5176) {
            var x = cljs.core.first(arglist__5176);
            var y = cljs.core.first(cljs.core.next(arglist__5176));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5176)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5176)));
            return G__5175__delegate.call(this, x, y, z, args)
          };
          return G__5175
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$4 = spn__4;
        return spn
      }()
    };
    var G__5174 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5174__delegate.call(this, p1, p2, p3, ps)
    };
    G__5174.cljs$lang$maxFixedArity = 3;
    G__5174.cljs$lang$applyTo = function(arglist__5177) {
      var p1 = cljs.core.first(arglist__5177);
      var p2 = cljs.core.first(cljs.core.next(arglist__5177));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5177)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5177)));
      return G__5174__delegate.call(this, p1, p2, p3, ps)
    };
    return G__5174
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$4 = some_fn__4;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5178 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5178)) {
        var s__5179 = temp__3974__auto____5178;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__5179)), map.call(null, f, cljs.core.rest.call(null, s__5179)))
      }else {
        return null
      }
    })
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5180 = cljs.core.seq.call(null, c1);
      var s2__5181 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5182 = s1__5180;
        if(cljs.core.truth_(and__3822__auto____5182)) {
          return s2__5181
        }else {
          return and__3822__auto____5182
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5180), cljs.core.first.call(null, s2__5181)), map.call(null, f, cljs.core.rest.call(null, s1__5180), cljs.core.rest.call(null, s2__5181)))
      }else {
        return null
      }
    })
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5183 = cljs.core.seq.call(null, c1);
      var s2__5184 = cljs.core.seq.call(null, c2);
      var s3__5185 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5186 = s1__5183;
        if(cljs.core.truth_(and__3822__auto____5186)) {
          var and__3822__auto____5187 = s2__5184;
          if(cljs.core.truth_(and__3822__auto____5187)) {
            return s3__5185
          }else {
            return and__3822__auto____5187
          }
        }else {
          return and__3822__auto____5186
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5183), cljs.core.first.call(null, s2__5184), cljs.core.first.call(null, s3__5185)), map.call(null, f, cljs.core.rest.call(null, s1__5183), cljs.core.rest.call(null, s2__5184), cljs.core.rest.call(null, s3__5185)))
      }else {
        return null
      }
    })
  };
  var map__5 = function() {
    var G__5190__delegate = function(f, c1, c2, c3, colls) {
      var step__5189 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__5188 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5188)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__5188), step.call(null, map.call(null, cljs.core.rest, ss__5188)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__5129_SHARP_) {
        return cljs.core.apply.call(null, f, p1__5129_SHARP_)
      }, step__5189.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__5190 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5190__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5190.cljs$lang$maxFixedArity = 4;
    G__5190.cljs$lang$applyTo = function(arglist__5191) {
      var f = cljs.core.first(arglist__5191);
      var c1 = cljs.core.first(cljs.core.next(arglist__5191));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5191)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5191))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5191))));
      return G__5190__delegate.call(this, f, c1, c2, c3, colls)
    };
    return G__5190
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$5 = map__5;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____5192 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5192)) {
        var s__5193 = temp__3974__auto____5192;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5193), take.call(null, n - 1, cljs.core.rest.call(null, s__5193)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__5196 = function(n, coll) {
    while(true) {
      var s__5194 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5195 = n > 0;
        if(and__3822__auto____5195) {
          return s__5194
        }else {
          return and__3822__auto____5195
        }
      }())) {
        var G__5197 = n - 1;
        var G__5198 = cljs.core.rest.call(null, s__5194);
        n = G__5197;
        coll = G__5198;
        continue
      }else {
        return s__5194
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5196.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__5199 = cljs.core.seq.call(null, coll);
  var lead__5200 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__5200)) {
      var G__5201 = cljs.core.next.call(null, s__5199);
      var G__5202 = cljs.core.next.call(null, lead__5200);
      s__5199 = G__5201;
      lead__5200 = G__5202;
      continue
    }else {
      return s__5199
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__5205 = function(pred, coll) {
    while(true) {
      var s__5203 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5204 = s__5203;
        if(cljs.core.truth_(and__3822__auto____5204)) {
          return pred.call(null, cljs.core.first.call(null, s__5203))
        }else {
          return and__3822__auto____5204
        }
      }())) {
        var G__5206 = pred;
        var G__5207 = cljs.core.rest.call(null, s__5203);
        pred = G__5206;
        coll = G__5207;
        continue
      }else {
        return s__5203
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5205.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____5208 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____5208)) {
      var s__5209 = temp__3974__auto____5208;
      return cljs.core.concat.call(null, s__5209, cycle.call(null, s__5209))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5210 = cljs.core.seq.call(null, c1);
      var s2__5211 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5212 = s1__5210;
        if(cljs.core.truth_(and__3822__auto____5212)) {
          return s2__5211
        }else {
          return and__3822__auto____5212
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__5210), cljs.core.cons.call(null, cljs.core.first.call(null, s2__5211), interleave.call(null, cljs.core.rest.call(null, s1__5210), cljs.core.rest.call(null, s2__5211))))
      }else {
        return null
      }
    })
  };
  var interleave__3 = function() {
    var G__5214__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__5213 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5213)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__5213), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__5213)))
        }else {
          return null
        }
      })
    };
    var G__5214 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5214__delegate.call(this, c1, c2, colls)
    };
    G__5214.cljs$lang$maxFixedArity = 2;
    G__5214.cljs$lang$applyTo = function(arglist__5215) {
      var c1 = cljs.core.first(arglist__5215);
      var c2 = cljs.core.first(cljs.core.next(arglist__5215));
      var colls = cljs.core.rest(cljs.core.next(arglist__5215));
      return G__5214__delegate.call(this, c1, c2, colls)
    };
    return G__5214
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$3 = interleave__3;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__5218 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____5216 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____5216)) {
        var coll__5217 = temp__3971__auto____5216;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__5217), cat.call(null, cljs.core.rest.call(null, coll__5217), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__5218.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__5219__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__5219 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5219__delegate.call(this, f, coll, colls)
    };
    G__5219.cljs$lang$maxFixedArity = 2;
    G__5219.cljs$lang$applyTo = function(arglist__5220) {
      var f = cljs.core.first(arglist__5220);
      var coll = cljs.core.first(cljs.core.next(arglist__5220));
      var colls = cljs.core.rest(cljs.core.next(arglist__5220));
      return G__5219__delegate.call(this, f, coll, colls)
    };
    return G__5219
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$3 = mapcat__3;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____5221 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____5221)) {
      var s__5222 = temp__3974__auto____5221;
      var f__5223 = cljs.core.first.call(null, s__5222);
      var r__5224 = cljs.core.rest.call(null, s__5222);
      if(cljs.core.truth_(pred.call(null, f__5223))) {
        return cljs.core.cons.call(null, f__5223, filter.call(null, pred, r__5224))
      }else {
        return filter.call(null, pred, r__5224)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__5226 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__5226.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__5225_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__5225_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__5227__5228 = to;
    if(G__5227__5228 != null) {
      if(function() {
        var or__3824__auto____5229 = G__5227__5228.cljs$lang$protocol_mask$partition5$ & 1;
        if(or__3824__auto____5229) {
          return or__3824__auto____5229
        }else {
          return G__5227__5228.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__5227__5228.cljs$lang$protocol_mask$partition5$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5227__5228)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5227__5228)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5230 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5230)) {
        var s__5231 = temp__3974__auto____5230;
        var p__5232 = cljs.core.take.call(null, n, s__5231);
        if(n === cljs.core.count.call(null, p__5232)) {
          return cljs.core.cons.call(null, p__5232, partition.call(null, n, step, cljs.core.drop.call(null, step, s__5231)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5233 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5233)) {
        var s__5234 = temp__3974__auto____5233;
        var p__5235 = cljs.core.take.call(null, n, s__5234);
        if(n === cljs.core.count.call(null, p__5235)) {
          return cljs.core.cons.call(null, p__5235, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__5234)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__5235, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__5236 = cljs.core.lookup_sentinel;
    var m__5237 = m;
    var ks__5238 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__5238)) {
        var m__5239 = cljs.core.get.call(null, m__5237, cljs.core.first.call(null, ks__5238), sentinel__5236);
        if(sentinel__5236 === m__5239) {
          return not_found
        }else {
          var G__5240 = sentinel__5236;
          var G__5241 = m__5239;
          var G__5242 = cljs.core.next.call(null, ks__5238);
          sentinel__5236 = G__5240;
          m__5237 = G__5241;
          ks__5238 = G__5242;
          continue
        }
      }else {
        return m__5237
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__5243, v) {
  var vec__5244__5245 = p__5243;
  var k__5246 = cljs.core.nth.call(null, vec__5244__5245, 0, null);
  var ks__5247 = cljs.core.nthnext.call(null, vec__5244__5245, 1);
  if(cljs.core.truth_(ks__5247)) {
    return cljs.core.assoc.call(null, m, k__5246, assoc_in.call(null, cljs.core.get.call(null, m, k__5246), ks__5247, v))
  }else {
    return cljs.core.assoc.call(null, m, k__5246, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__5248, f, args) {
    var vec__5249__5250 = p__5248;
    var k__5251 = cljs.core.nth.call(null, vec__5249__5250, 0, null);
    var ks__5252 = cljs.core.nthnext.call(null, vec__5249__5250, 1);
    if(cljs.core.truth_(ks__5252)) {
      return cljs.core.assoc.call(null, m, k__5251, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__5251), ks__5252, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__5251, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__5251), args))
    }
  };
  var update_in = function(m, p__5248, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__5248, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__5253) {
    var m = cljs.core.first(arglist__5253);
    var p__5248 = cljs.core.first(cljs.core.next(arglist__5253));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5253)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5253)));
    return update_in__delegate.call(this, m, p__5248, f, args)
  };
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition3$ = 30;
  this.cljs$lang$protocol_mask$partition1$ = 35;
  this.cljs$lang$protocol_mask$partition0$ = 31;
  this.cljs$lang$protocol_mask$partition2$ = 57
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5258 = this;
  var h__364__auto____5259 = this__5258.__hash;
  if(h__364__auto____5259 != null) {
    return h__364__auto____5259
  }else {
    var h__364__auto____5260 = cljs.core.hash_coll.call(null, coll);
    this__5258.__hash = h__364__auto____5260;
    return h__364__auto____5260
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5261 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5262 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5263 = this;
  var new_array__5264 = cljs.core.aclone.call(null, this__5263.array);
  new_array__5264[k] = v;
  return new cljs.core.Vector(this__5263.meta, new_array__5264, null)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__5293 = null;
  var G__5293__2 = function(tsym5256, k) {
    var this__5265 = this;
    var tsym5256__5266 = this;
    var coll__5267 = tsym5256__5266;
    return cljs.core._lookup.call(null, coll__5267, k)
  };
  var G__5293__3 = function(tsym5257, k, not_found) {
    var this__5268 = this;
    var tsym5257__5269 = this;
    var coll__5270 = tsym5257__5269;
    return cljs.core._lookup.call(null, coll__5270, k, not_found)
  };
  G__5293 = function(tsym5257, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5293__2.call(this, tsym5257, k);
      case 3:
        return G__5293__3.call(this, tsym5257, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5293
}();
cljs.core.Vector.prototype.apply = function(tsym5254, args5255) {
  return tsym5254.call.apply(tsym5254, [tsym5254].concat(cljs.core.aclone.call(null, args5255)))
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5271 = this;
  var new_array__5272 = cljs.core.aclone.call(null, this__5271.array);
  new_array__5272.push(o);
  return new cljs.core.Vector(this__5271.meta, new_array__5272, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__5273 = this;
  var this$__5274 = this;
  return cljs.core.pr_str.call(null, this$__5274)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5275 = this;
  return cljs.core.ci_reduce.call(null, this__5275.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5276 = this;
  return cljs.core.ci_reduce.call(null, this__5276.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5277 = this;
  if(this__5277.array.length > 0) {
    var vector_seq__5278 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__5277.array.length) {
          return cljs.core.cons.call(null, this__5277.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__5278.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5279 = this;
  return this__5279.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5280 = this;
  var count__5281 = this__5280.array.length;
  if(count__5281 > 0) {
    return this__5280.array[count__5281 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5282 = this;
  if(this__5282.array.length > 0) {
    var new_array__5283 = cljs.core.aclone.call(null, this__5282.array);
    new_array__5283.pop();
    return new cljs.core.Vector(this__5282.meta, new_array__5283, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5284 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5285 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5286 = this;
  return new cljs.core.Vector(meta, this__5286.array, this__5286.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5287 = this;
  return this__5287.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5289 = this;
  if(function() {
    var and__3822__auto____5290 = 0 <= n;
    if(and__3822__auto____5290) {
      return n < this__5289.array.length
    }else {
      return and__3822__auto____5290
    }
  }()) {
    return this__5289.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5291 = this;
  if(function() {
    var and__3822__auto____5292 = 0 <= n;
    if(and__3822__auto____5292) {
      return n < this__5291.array.length
    }else {
      return and__3822__auto____5292
    }
  }()) {
    return this__5291.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5288 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5288.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__437__auto__) {
  return cljs.core.list.call(null, "cljs.core.VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__5294 = pv.cnt;
  if(cnt__5294 < 32) {
    return 0
  }else {
    return cnt__5294 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__5295 = level;
  var ret__5296 = node;
  while(true) {
    if(ll__5295 === 0) {
      return ret__5296
    }else {
      var embed__5297 = ret__5296;
      var r__5298 = cljs.core.pv_fresh_node.call(null, edit);
      var ___5299 = cljs.core.pv_aset.call(null, r__5298, 0, embed__5297);
      var G__5300 = ll__5295 - 5;
      var G__5301 = r__5298;
      ll__5295 = G__5300;
      ret__5296 = G__5301;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__5302 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__5303 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__5302, subidx__5303, tailnode);
    return ret__5302
  }else {
    var temp__3971__auto____5304 = cljs.core.pv_aget.call(null, parent, subidx__5303);
    if(cljs.core.truth_(temp__3971__auto____5304)) {
      var child__5305 = temp__3971__auto____5304;
      var node_to_insert__5306 = push_tail.call(null, pv, level - 5, child__5305, tailnode);
      cljs.core.pv_aset.call(null, ret__5302, subidx__5303, node_to_insert__5306);
      return ret__5302
    }else {
      var node_to_insert__5307 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__5302, subidx__5303, node_to_insert__5307);
      return ret__5302
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____5308 = 0 <= i;
    if(and__3822__auto____5308) {
      return i < pv.cnt
    }else {
      return and__3822__auto____5308
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__5309 = pv.root;
      var level__5310 = pv.shift;
      while(true) {
        if(level__5310 > 0) {
          var G__5311 = cljs.core.pv_aget.call(null, node__5309, i >>> level__5310 & 31);
          var G__5312 = level__5310 - 5;
          node__5309 = G__5311;
          level__5310 = G__5312;
          continue
        }else {
          return node__5309.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__5313 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__5313, i & 31, val);
    return ret__5313
  }else {
    var subidx__5314 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__5313, subidx__5314, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5314), i, val));
    return ret__5313
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__5315 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5316 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5315));
    if(function() {
      var and__3822__auto____5317 = new_child__5316 == null;
      if(and__3822__auto____5317) {
        return subidx__5315 === 0
      }else {
        return and__3822__auto____5317
      }
    }()) {
      return null
    }else {
      var ret__5318 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__5318, subidx__5315, new_child__5316);
      return ret__5318
    }
  }else {
    if(subidx__5315 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__5319 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__5319, subidx__5315, null);
        return ret__5319
      }else {
        return null
      }
    }
  }
};
void 0;
void 0;
void 0;
void 0;
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition5$ = 1;
  this.cljs$lang$protocol_mask$partition3$ = 31;
  this.cljs$lang$protocol_mask$partition1$ = 43;
  this.cljs$lang$protocol_mask$partition0$ = 31;
  this.cljs$lang$protocol_mask$partition2$ = 57
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5324 = this;
  return new cljs.core.TransientVector(this__5324.cnt, this__5324.shift, cljs.core.tv_editable_root.call(null, this__5324.root), cljs.core.tv_editable_tail.call(null, this__5324.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5325 = this;
  var h__364__auto____5326 = this__5325.__hash;
  if(h__364__auto____5326 != null) {
    return h__364__auto____5326
  }else {
    var h__364__auto____5327 = cljs.core.hash_coll.call(null, coll);
    this__5325.__hash = h__364__auto____5327;
    return h__364__auto____5327
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5328 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5329 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5330 = this;
  if(function() {
    var and__3822__auto____5331 = 0 <= k;
    if(and__3822__auto____5331) {
      return k < this__5330.cnt
    }else {
      return and__3822__auto____5331
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__5332 = cljs.core.aclone.call(null, this__5330.tail);
      new_tail__5332[k & 31] = v;
      return new cljs.core.PersistentVector(this__5330.meta, this__5330.cnt, this__5330.shift, this__5330.root, new_tail__5332, null)
    }else {
      return new cljs.core.PersistentVector(this__5330.meta, this__5330.cnt, this__5330.shift, cljs.core.do_assoc.call(null, coll, this__5330.shift, this__5330.root, k, v), this__5330.tail, null)
    }
  }else {
    if(k === this__5330.cnt) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__5330.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__5378 = null;
  var G__5378__2 = function(tsym5322, k) {
    var this__5333 = this;
    var tsym5322__5334 = this;
    var coll__5335 = tsym5322__5334;
    return cljs.core._lookup.call(null, coll__5335, k)
  };
  var G__5378__3 = function(tsym5323, k, not_found) {
    var this__5336 = this;
    var tsym5323__5337 = this;
    var coll__5338 = tsym5323__5337;
    return cljs.core._lookup.call(null, coll__5338, k, not_found)
  };
  G__5378 = function(tsym5323, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5378__2.call(this, tsym5323, k);
      case 3:
        return G__5378__3.call(this, tsym5323, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5378
}();
cljs.core.PersistentVector.prototype.apply = function(tsym5320, args5321) {
  return tsym5320.call.apply(tsym5320, [tsym5320].concat(cljs.core.aclone.call(null, args5321)))
};
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__5339 = this;
  var step_init__5340 = [0, init];
  var i__5341 = 0;
  while(true) {
    if(i__5341 < this__5339.cnt) {
      var arr__5342 = cljs.core.array_for.call(null, v, i__5341);
      var len__5343 = arr__5342.length;
      var init__5347 = function() {
        var j__5344 = 0;
        var init__5345 = step_init__5340[1];
        while(true) {
          if(j__5344 < len__5343) {
            var init__5346 = f.call(null, init__5345, j__5344 + i__5341, arr__5342[j__5344]);
            if(cljs.core.reduced_QMARK_.call(null, init__5346)) {
              return init__5346
            }else {
              var G__5379 = j__5344 + 1;
              var G__5380 = init__5346;
              j__5344 = G__5379;
              init__5345 = G__5380;
              continue
            }
          }else {
            step_init__5340[0] = len__5343;
            step_init__5340[1] = init__5345;
            return init__5345
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__5347)) {
        return cljs.core.deref.call(null, init__5347)
      }else {
        var G__5381 = i__5341 + step_init__5340[0];
        i__5341 = G__5381;
        continue
      }
    }else {
      return step_init__5340[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5348 = this;
  if(this__5348.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__5349 = cljs.core.aclone.call(null, this__5348.tail);
    new_tail__5349.push(o);
    return new cljs.core.PersistentVector(this__5348.meta, this__5348.cnt + 1, this__5348.shift, this__5348.root, new_tail__5349, null)
  }else {
    var root_overflow_QMARK___5350 = this__5348.cnt >>> 5 > 1 << this__5348.shift;
    var new_shift__5351 = root_overflow_QMARK___5350 ? this__5348.shift + 5 : this__5348.shift;
    var new_root__5353 = root_overflow_QMARK___5350 ? function() {
      var n_r__5352 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__5352, 0, this__5348.root);
      cljs.core.pv_aset.call(null, n_r__5352, 1, cljs.core.new_path.call(null, null, this__5348.shift, new cljs.core.VectorNode(null, this__5348.tail)));
      return n_r__5352
    }() : cljs.core.push_tail.call(null, coll, this__5348.shift, this__5348.root, new cljs.core.VectorNode(null, this__5348.tail));
    return new cljs.core.PersistentVector(this__5348.meta, this__5348.cnt + 1, new_shift__5351, new_root__5353, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__5354 = this;
  return cljs.core._nth.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__5355 = this;
  return cljs.core._nth.call(null, coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__5356 = this;
  var this$__5357 = this;
  return cljs.core.pr_str.call(null, this$__5357)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5358 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5359 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5360 = this;
  if(this__5360.cnt > 0) {
    var vector_seq__5361 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__5360.cnt) {
          return cljs.core.cons.call(null, cljs.core._nth.call(null, coll, i), vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__5361.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5362 = this;
  return this__5362.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5363 = this;
  if(this__5363.cnt > 0) {
    return cljs.core._nth.call(null, coll, this__5363.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5364 = this;
  if(this__5364.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__5364.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5364.meta)
    }else {
      if(1 < this__5364.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__5364.meta, this__5364.cnt - 1, this__5364.shift, this__5364.root, this__5364.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__5365 = cljs.core.array_for.call(null, coll, this__5364.cnt - 2);
          var nr__5366 = cljs.core.pop_tail.call(null, coll, this__5364.shift, this__5364.root);
          var new_root__5367 = nr__5366 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__5366;
          var cnt_1__5368 = this__5364.cnt - 1;
          if(function() {
            var and__3822__auto____5369 = 5 < this__5364.shift;
            if(and__3822__auto____5369) {
              return cljs.core.pv_aget.call(null, new_root__5367, 1) == null
            }else {
              return and__3822__auto____5369
            }
          }()) {
            return new cljs.core.PersistentVector(this__5364.meta, cnt_1__5368, this__5364.shift - 5, cljs.core.pv_aget.call(null, new_root__5367, 0), new_tail__5365, null)
          }else {
            return new cljs.core.PersistentVector(this__5364.meta, cnt_1__5368, this__5364.shift, new_root__5367, new_tail__5365, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5371 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5372 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5373 = this;
  return new cljs.core.PersistentVector(meta, this__5373.cnt, this__5373.shift, this__5373.root, this__5373.tail, this__5373.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5374 = this;
  return this__5374.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5375 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5376 = this;
  if(function() {
    var and__3822__auto____5377 = 0 <= n;
    if(and__3822__auto____5377) {
      return n < this__5376.cnt
    }else {
      return and__3822__auto____5377
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5370 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5370.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs) {
  var xs__5382 = cljs.core.seq.call(null, xs);
  var out__5383 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    if(cljs.core.truth_(xs__5382)) {
      var G__5384 = cljs.core.next.call(null, xs__5382);
      var G__5385 = cljs.core.conj_BANG_.call(null, out__5383, cljs.core.first.call(null, xs__5382));
      xs__5382 = G__5384;
      out__5383 = G__5385;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5383)
    }
    break
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.PersistentVector.EMPTY, coll)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__5386) {
    var args = cljs.core.seq(arglist__5386);
    return vector__delegate.call(this, args)
  };
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition3$ = 30;
  this.cljs$lang$protocol_mask$partition1$ = 35;
  this.cljs$lang$protocol_mask$partition0$ = 31;
  this.cljs$lang$protocol_mask$partition2$ = 57
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5391 = this;
  var h__364__auto____5392 = this__5391.__hash;
  if(h__364__auto____5392 != null) {
    return h__364__auto____5392
  }else {
    var h__364__auto____5393 = cljs.core.hash_coll.call(null, coll);
    this__5391.__hash = h__364__auto____5393;
    return h__364__auto____5393
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5394 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5395 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__5396 = this;
  var v_pos__5397 = this__5396.start + key;
  return new cljs.core.Subvec(this__5396.meta, cljs.core._assoc.call(null, this__5396.v, v_pos__5397, val), this__5396.start, this__5396.end > v_pos__5397 + 1 ? this__5396.end : v_pos__5397 + 1, null)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__5421 = null;
  var G__5421__2 = function(tsym5389, k) {
    var this__5398 = this;
    var tsym5389__5399 = this;
    var coll__5400 = tsym5389__5399;
    return cljs.core._lookup.call(null, coll__5400, k)
  };
  var G__5421__3 = function(tsym5390, k, not_found) {
    var this__5401 = this;
    var tsym5390__5402 = this;
    var coll__5403 = tsym5390__5402;
    return cljs.core._lookup.call(null, coll__5403, k, not_found)
  };
  G__5421 = function(tsym5390, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5421__2.call(this, tsym5390, k);
      case 3:
        return G__5421__3.call(this, tsym5390, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5421
}();
cljs.core.Subvec.prototype.apply = function(tsym5387, args5388) {
  return tsym5387.call.apply(tsym5387, [tsym5387].concat(cljs.core.aclone.call(null, args5388)))
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5404 = this;
  return new cljs.core.Subvec(this__5404.meta, cljs.core._assoc_n.call(null, this__5404.v, this__5404.end, o), this__5404.start, this__5404.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__5405 = this;
  var this$__5406 = this;
  return cljs.core.pr_str.call(null, this$__5406)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__5407 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__5408 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5409 = this;
  var subvec_seq__5410 = function subvec_seq(i) {
    if(i === this__5409.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__5409.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__5410.call(null, this__5409.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5411 = this;
  return this__5411.end - this__5411.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5412 = this;
  return cljs.core._nth.call(null, this__5412.v, this__5412.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5413 = this;
  if(this__5413.start === this__5413.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__5413.meta, this__5413.v, this__5413.start, this__5413.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5414 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5415 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5416 = this;
  return new cljs.core.Subvec(meta, this__5416.v, this__5416.start, this__5416.end, this__5416.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5417 = this;
  return this__5417.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5419 = this;
  return cljs.core._nth.call(null, this__5419.v, this__5419.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5420 = this;
  return cljs.core._nth.call(null, this__5420.v, this__5420.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5418 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5418.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, cljs.core.aclone.call(null, node.arr))
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__5422 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__5422, 0, tl.length);
  return ret__5422
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__5423 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__5424 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__5423, subidx__5424, level === 5 ? tail_node : function() {
    var child__5425 = cljs.core.pv_aget.call(null, ret__5423, subidx__5424);
    if(child__5425 != null) {
      return tv_push_tail.call(null, tv, level - 5, child__5425, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__5423
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__5426 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__5427 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5428 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__5426, subidx__5427));
    if(function() {
      var and__3822__auto____5429 = new_child__5428 == null;
      if(and__3822__auto____5429) {
        return subidx__5427 === 0
      }else {
        return and__3822__auto____5429
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__5426, subidx__5427, new_child__5428);
      return node__5426
    }
  }else {
    if(subidx__5427 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__5426, subidx__5427, null);
        return node__5426
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____5430 = 0 <= i;
    if(and__3822__auto____5430) {
      return i < tv.cnt
    }else {
      return and__3822__auto____5430
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__5431 = tv.root;
      var node__5432 = root__5431;
      var level__5433 = tv.shift;
      while(true) {
        if(level__5433 > 0) {
          var G__5434 = cljs.core.tv_ensure_editable.call(null, root__5431.edit, cljs.core.pv_aget.call(null, node__5432, i >>> level__5433 & 31));
          var G__5435 = level__5433 - 5;
          node__5432 = G__5434;
          level__5433 = G__5435;
          continue
        }else {
          return node__5432.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 19;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition5$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientVector")
};
cljs.core.TransientVector.prototype.cljs$core$IFn$ = true;
cljs.core.TransientVector.prototype.call = function() {
  var G__5473 = null;
  var G__5473__2 = function(tsym5438, k) {
    var this__5440 = this;
    var tsym5438__5441 = this;
    var coll__5442 = tsym5438__5441;
    return cljs.core._lookup.call(null, coll__5442, k)
  };
  var G__5473__3 = function(tsym5439, k, not_found) {
    var this__5443 = this;
    var tsym5439__5444 = this;
    var coll__5445 = tsym5439__5444;
    return cljs.core._lookup.call(null, coll__5445, k, not_found)
  };
  G__5473 = function(tsym5439, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5473__2.call(this, tsym5439, k);
      case 3:
        return G__5473__3.call(this, tsym5439, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5473
}();
cljs.core.TransientVector.prototype.apply = function(tsym5436, args5437) {
  return tsym5436.call.apply(tsym5436, [tsym5436].concat(cljs.core.aclone.call(null, args5437)))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5446 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5447 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5448 = this;
  if(cljs.core.truth_(this__5448.root.edit)) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5449 = this;
  if(function() {
    var and__3822__auto____5450 = 0 <= n;
    if(and__3822__auto____5450) {
      return n < this__5449.cnt
    }else {
      return and__3822__auto____5450
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5451 = this;
  if(cljs.core.truth_(this__5451.root.edit)) {
    return this__5451.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__5452 = this;
  if(cljs.core.truth_(this__5452.root.edit)) {
    if(function() {
      var and__3822__auto____5453 = 0 <= n;
      if(and__3822__auto____5453) {
        return n < this__5452.cnt
      }else {
        return and__3822__auto____5453
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__5452.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__5456 = function go(level, node) {
          var node__5454 = cljs.core.tv_ensure_editable.call(null, this__5452.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__5454, n & 31, val);
            return node__5454
          }else {
            var subidx__5455 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__5454, subidx__5455, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__5454, subidx__5455)));
            return node__5454
          }
        }.call(null, this__5452.shift, this__5452.root);
        this__5452.root = new_root__5456;
        return tcoll
      }
    }else {
      if(n === this__5452.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__5452.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__5457 = this;
  if(cljs.core.truth_(this__5457.root.edit)) {
    if(this__5457.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__5457.cnt) {
        this__5457.cnt = 0;
        return tcoll
      }else {
        if((this__5457.cnt - 1 & 31) > 0) {
          this__5457.cnt = this__5457.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__5458 = cljs.core.editable_array_for.call(null, tcoll, this__5457.cnt - 2);
            var new_root__5460 = function() {
              var nr__5459 = cljs.core.tv_pop_tail.call(null, tcoll, this__5457.shift, this__5457.root);
              if(nr__5459 != null) {
                return nr__5459
              }else {
                return new cljs.core.VectorNode(this__5457.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____5461 = 5 < this__5457.shift;
              if(and__3822__auto____5461) {
                return cljs.core.pv_aget.call(null, new_root__5460, 1) == null
              }else {
                return and__3822__auto____5461
              }
            }()) {
              var new_root__5462 = cljs.core.tv_ensure_editable.call(null, this__5457.root.edit, cljs.core.pv_aget.call(null, new_root__5460, 0));
              this__5457.root = new_root__5462;
              this__5457.shift = this__5457.shift - 5;
              this__5457.cnt = this__5457.cnt - 1;
              this__5457.tail = new_tail__5458;
              return tcoll
            }else {
              this__5457.root = new_root__5460;
              this__5457.cnt = this__5457.cnt - 1;
              this__5457.tail = new_tail__5458;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__5463 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__5464 = this;
  if(cljs.core.truth_(this__5464.root.edit)) {
    if(this__5464.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__5464.tail[this__5464.cnt & 31] = o;
      this__5464.cnt = this__5464.cnt + 1;
      return tcoll
    }else {
      var tail_node__5465 = new cljs.core.VectorNode(this__5464.root.edit, this__5464.tail);
      var new_tail__5466 = cljs.core.make_array.call(null, 32);
      new_tail__5466[0] = o;
      this__5464.tail = new_tail__5466;
      if(this__5464.cnt >>> 5 > 1 << this__5464.shift) {
        var new_root_array__5467 = cljs.core.make_array.call(null, 32);
        var new_shift__5468 = this__5464.shift + 5;
        new_root_array__5467[0] = this__5464.root;
        new_root_array__5467[1] = cljs.core.new_path.call(null, this__5464.root.edit, this__5464.shift, tail_node__5465);
        this__5464.root = new cljs.core.VectorNode(this__5464.root.edit, new_root_array__5467);
        this__5464.shift = new_shift__5468;
        this__5464.cnt = this__5464.cnt + 1;
        return tcoll
      }else {
        var new_root__5469 = cljs.core.tv_push_tail.call(null, tcoll, this__5464.shift, this__5464.root, tail_node__5465);
        this__5464.root = new_root__5469;
        this__5464.cnt = this__5464.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5470 = this;
  if(cljs.core.truth_(this__5470.root.edit)) {
    this__5470.root.edit = null;
    var len__5471 = this__5470.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__5472 = cljs.core.make_array.call(null, len__5471);
    cljs.core.array_copy.call(null, this__5470.tail, 0, trimmed_tail__5472, 0, len__5471);
    return new cljs.core.PersistentVector(null, this__5470.cnt, this__5470.shift, this__5470.root, trimmed_tail__5472, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition3$ = 30;
  this.cljs$lang$protocol_mask$partition0$ = 44;
  this.cljs$lang$protocol_mask$partition2$ = 24
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5474 = this;
  var h__364__auto____5475 = this__5474.__hash;
  if(h__364__auto____5475 != null) {
    return h__364__auto____5475
  }else {
    var h__364__auto____5476 = cljs.core.hash_coll.call(null, coll);
    this__5474.__hash = h__364__auto____5476;
    return h__364__auto____5476
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5477 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__5478 = this;
  var this$__5479 = this;
  return cljs.core.pr_str.call(null, this$__5479)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5480 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5481 = this;
  return cljs.core._first.call(null, this__5481.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5482 = this;
  var temp__3971__auto____5483 = cljs.core.next.call(null, this__5482.front);
  if(cljs.core.truth_(temp__3971__auto____5483)) {
    var f1__5484 = temp__3971__auto____5483;
    return new cljs.core.PersistentQueueSeq(this__5482.meta, f1__5484, this__5482.rear, null)
  }else {
    if(this__5482.rear == null) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__5482.meta, this__5482.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5485 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5486 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__5486.front, this__5486.rear, this__5486.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5487 = this;
  return this__5487.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5488 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5488.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition3$ = 30;
  this.cljs$lang$protocol_mask$partition0$ = 46;
  this.cljs$lang$protocol_mask$partition1$ = 32;
  this.cljs$lang$protocol_mask$partition2$ = 24
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5489 = this;
  var h__364__auto____5490 = this__5489.__hash;
  if(h__364__auto____5490 != null) {
    return h__364__auto____5490
  }else {
    var h__364__auto____5491 = cljs.core.hash_coll.call(null, coll);
    this__5489.__hash = h__364__auto____5491;
    return h__364__auto____5491
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5492 = this;
  if(cljs.core.truth_(this__5492.front)) {
    return new cljs.core.PersistentQueue(this__5492.meta, this__5492.count + 1, this__5492.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____5493 = this__5492.rear;
      if(cljs.core.truth_(or__3824__auto____5493)) {
        return or__3824__auto____5493
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__5492.meta, this__5492.count + 1, cljs.core.conj.call(null, this__5492.front, o), cljs.core.PersistentVector.fromArray([]), null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__5494 = this;
  var this$__5495 = this;
  return cljs.core.pr_str.call(null, this$__5495)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5496 = this;
  var rear__5497 = cljs.core.seq.call(null, this__5496.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____5498 = this__5496.front;
    if(cljs.core.truth_(or__3824__auto____5498)) {
      return or__3824__auto____5498
    }else {
      return rear__5497
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__5496.front, cljs.core.seq.call(null, rear__5497), null, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5499 = this;
  return this__5499.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5500 = this;
  return cljs.core._first.call(null, this__5500.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5501 = this;
  if(cljs.core.truth_(this__5501.front)) {
    var temp__3971__auto____5502 = cljs.core.next.call(null, this__5501.front);
    if(cljs.core.truth_(temp__3971__auto____5502)) {
      var f1__5503 = temp__3971__auto____5502;
      return new cljs.core.PersistentQueue(this__5501.meta, this__5501.count - 1, f1__5503, this__5501.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__5501.meta, this__5501.count - 1, cljs.core.seq.call(null, this__5501.rear), cljs.core.PersistentVector.fromArray([]), null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5504 = this;
  return cljs.core.first.call(null, this__5504.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5505 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5506 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5507 = this;
  return new cljs.core.PersistentQueue(meta, this__5507.count, this__5507.front, this__5507.rear, this__5507.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5508 = this;
  return this__5508.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5509 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.fromArray([]), 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 0;
  this.cljs$lang$protocol_mask$partition3$ = 2
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__5510 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__5511 = array.length;
  var i__5512 = 0;
  while(true) {
    if(i__5512 < len__5511) {
      if(cljs.core._EQ_.call(null, k, array[i__5512])) {
        return i__5512
      }else {
        var G__5513 = i__5512 + incr;
        i__5512 = G__5513;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___2 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___4 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____5514 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3822__auto____5514)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3822__auto____5514
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___2.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___4.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  obj_map_contains_key_QMARK_.cljs$lang$arity$2 = obj_map_contains_key_QMARK___2;
  obj_map_contains_key_QMARK_.cljs$lang$arity$4 = obj_map_contains_key_QMARK___4;
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__5515 = cljs.core.hash.call(null, a);
  var b__5516 = cljs.core.hash.call(null, b);
  if(a__5515 < b__5516) {
    return-1
  }else {
    if(a__5515 > b__5516) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__5518 = m.keys;
  var len__5519 = ks__5518.length;
  var so__5520 = m.strobj;
  var out__5521 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__5522 = 0;
  var out__5523 = cljs.core.transient$.call(null, out__5521);
  while(true) {
    if(i__5522 < len__5519) {
      var k__5524 = ks__5518[i__5522];
      var G__5525 = i__5522 + 1;
      var G__5526 = cljs.core.assoc_BANG_.call(null, out__5523, k__5524, so__5520[k__5524]);
      i__5522 = G__5525;
      out__5523 = G__5526;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__5523, k, v))
    }
    break
  }
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition5$ = 1;
  this.cljs$lang$protocol_mask$partition3$ = 14;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 15;
  this.cljs$lang$protocol_mask$partition2$ = 24
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5531 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5532 = this;
  var h__364__auto____5533 = this__5532.__hash;
  if(h__364__auto____5533 != null) {
    return h__364__auto____5533
  }else {
    var h__364__auto____5534 = cljs.core.hash_imap.call(null, coll);
    this__5532.__hash = h__364__auto____5534;
    return h__364__auto____5534
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5535 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5536 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5536.strobj, this__5536.strobj[k], not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5537 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var overwrite_QMARK___5538 = this__5537.strobj.hasOwnProperty(k);
    if(cljs.core.truth_(overwrite_QMARK___5538)) {
      var new_strobj__5539 = goog.object.clone.call(null, this__5537.strobj);
      new_strobj__5539[k] = v;
      return new cljs.core.ObjMap(this__5537.meta, this__5537.keys, new_strobj__5539, this__5537.update_count + 1, null)
    }else {
      if(this__5537.update_count < cljs.core.ObjMap.HASHMAP_THRESHOLD) {
        var new_strobj__5540 = goog.object.clone.call(null, this__5537.strobj);
        var new_keys__5541 = cljs.core.aclone.call(null, this__5537.keys);
        new_strobj__5540[k] = v;
        new_keys__5541.push(k);
        return new cljs.core.ObjMap(this__5537.meta, new_keys__5541, new_strobj__5540, this__5537.update_count + 1, null)
      }else {
        return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5542 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5542.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__5562 = null;
  var G__5562__2 = function(tsym5529, k) {
    var this__5543 = this;
    var tsym5529__5544 = this;
    var coll__5545 = tsym5529__5544;
    return cljs.core._lookup.call(null, coll__5545, k)
  };
  var G__5562__3 = function(tsym5530, k, not_found) {
    var this__5546 = this;
    var tsym5530__5547 = this;
    var coll__5548 = tsym5530__5547;
    return cljs.core._lookup.call(null, coll__5548, k, not_found)
  };
  G__5562 = function(tsym5530, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5562__2.call(this, tsym5530, k);
      case 3:
        return G__5562__3.call(this, tsym5530, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5562
}();
cljs.core.ObjMap.prototype.apply = function(tsym5527, args5528) {
  return tsym5527.call.apply(tsym5527, [tsym5527].concat(cljs.core.aclone.call(null, args5528)))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5549 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__5550 = this;
  var this$__5551 = this;
  return cljs.core.pr_str.call(null, this$__5551)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5552 = this;
  if(this__5552.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__5517_SHARP_) {
      return cljs.core.vector.call(null, p1__5517_SHARP_, this__5552.strobj[p1__5517_SHARP_])
    }, this__5552.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5553 = this;
  return this__5553.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5554 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5555 = this;
  return new cljs.core.ObjMap(meta, this__5555.keys, this__5555.strobj, this__5555.update_count, this__5555.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5556 = this;
  return this__5556.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5557 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__5557.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5558 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____5559 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3822__auto____5559)) {
      return this__5558.strobj.hasOwnProperty(k)
    }else {
      return and__3822__auto____5559
    }
  }())) {
    var new_keys__5560 = cljs.core.aclone.call(null, this__5558.keys);
    var new_strobj__5561 = goog.object.clone.call(null, this__5558.strobj);
    new_keys__5560.splice(cljs.core.scan_array.call(null, 1, k, new_keys__5560), 1);
    cljs.core.js_delete.call(null, new_strobj__5561, k);
    return new cljs.core.ObjMap(this__5558.meta, new_keys__5560, new_strobj__5561, this__5558.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition3$ = 14;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 15;
  this.cljs$lang$protocol_mask$partition2$ = 24
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5568 = this;
  var h__364__auto____5569 = this__5568.__hash;
  if(h__364__auto____5569 != null) {
    return h__364__auto____5569
  }else {
    var h__364__auto____5570 = cljs.core.hash_imap.call(null, coll);
    this__5568.__hash = h__364__auto____5570;
    return h__364__auto____5570
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5571 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5572 = this;
  var bucket__5573 = this__5572.hashobj[cljs.core.hash.call(null, k)];
  var i__5574 = cljs.core.truth_(bucket__5573) ? cljs.core.scan_array.call(null, 2, k, bucket__5573) : null;
  if(cljs.core.truth_(i__5574)) {
    return bucket__5573[i__5574 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5575 = this;
  var h__5576 = cljs.core.hash.call(null, k);
  var bucket__5577 = this__5575.hashobj[h__5576];
  if(cljs.core.truth_(bucket__5577)) {
    var new_bucket__5578 = cljs.core.aclone.call(null, bucket__5577);
    var new_hashobj__5579 = goog.object.clone.call(null, this__5575.hashobj);
    new_hashobj__5579[h__5576] = new_bucket__5578;
    var temp__3971__auto____5580 = cljs.core.scan_array.call(null, 2, k, new_bucket__5578);
    if(cljs.core.truth_(temp__3971__auto____5580)) {
      var i__5581 = temp__3971__auto____5580;
      new_bucket__5578[i__5581 + 1] = v;
      return new cljs.core.HashMap(this__5575.meta, this__5575.count, new_hashobj__5579, null)
    }else {
      new_bucket__5578.push(k, v);
      return new cljs.core.HashMap(this__5575.meta, this__5575.count + 1, new_hashobj__5579, null)
    }
  }else {
    var new_hashobj__5582 = goog.object.clone.call(null, this__5575.hashobj);
    new_hashobj__5582[h__5576] = [k, v];
    return new cljs.core.HashMap(this__5575.meta, this__5575.count + 1, new_hashobj__5582, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5583 = this;
  var bucket__5584 = this__5583.hashobj[cljs.core.hash.call(null, k)];
  var i__5585 = cljs.core.truth_(bucket__5584) ? cljs.core.scan_array.call(null, 2, k, bucket__5584) : null;
  if(cljs.core.truth_(i__5585)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__5608 = null;
  var G__5608__2 = function(tsym5566, k) {
    var this__5586 = this;
    var tsym5566__5587 = this;
    var coll__5588 = tsym5566__5587;
    return cljs.core._lookup.call(null, coll__5588, k)
  };
  var G__5608__3 = function(tsym5567, k, not_found) {
    var this__5589 = this;
    var tsym5567__5590 = this;
    var coll__5591 = tsym5567__5590;
    return cljs.core._lookup.call(null, coll__5591, k, not_found)
  };
  G__5608 = function(tsym5567, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5608__2.call(this, tsym5567, k);
      case 3:
        return G__5608__3.call(this, tsym5567, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5608
}();
cljs.core.HashMap.prototype.apply = function(tsym5564, args5565) {
  return tsym5564.call.apply(tsym5564, [tsym5564].concat(cljs.core.aclone.call(null, args5565)))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5592 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__5593 = this;
  var this$__5594 = this;
  return cljs.core.pr_str.call(null, this$__5594)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5595 = this;
  if(this__5595.count > 0) {
    var hashes__5596 = cljs.core.js_keys.call(null, this__5595.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__5563_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__5595.hashobj[p1__5563_SHARP_]))
    }, hashes__5596)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5597 = this;
  return this__5597.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5598 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5599 = this;
  return new cljs.core.HashMap(meta, this__5599.count, this__5599.hashobj, this__5599.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5600 = this;
  return this__5600.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5601 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__5601.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5602 = this;
  var h__5603 = cljs.core.hash.call(null, k);
  var bucket__5604 = this__5602.hashobj[h__5603];
  var i__5605 = cljs.core.truth_(bucket__5604) ? cljs.core.scan_array.call(null, 2, k, bucket__5604) : null;
  if(cljs.core.not.call(null, i__5605)) {
    return coll
  }else {
    var new_hashobj__5606 = goog.object.clone.call(null, this__5602.hashobj);
    if(3 > bucket__5604.length) {
      cljs.core.js_delete.call(null, new_hashobj__5606, h__5603)
    }else {
      var new_bucket__5607 = cljs.core.aclone.call(null, bucket__5604);
      new_bucket__5607.splice(i__5605, 2);
      new_hashobj__5606[h__5603] = new_bucket__5607
    }
    return new cljs.core.HashMap(this__5602.meta, this__5602.count - 1, new_hashobj__5606, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__5609 = ks.length;
  var i__5610 = 0;
  var out__5611 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__5610 < len__5609) {
      var G__5612 = i__5610 + 1;
      var G__5613 = cljs.core.assoc.call(null, out__5611, ks[i__5610], vs[i__5610]);
      i__5610 = G__5612;
      out__5611 = G__5613;
      continue
    }else {
      return out__5611
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__5614 = m.arr;
  var len__5615 = arr__5614.length;
  var i__5616 = 0;
  while(true) {
    if(len__5615 <= i__5616) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__5614[i__5616], k)) {
        return i__5616
      }else {
        if("\ufdd0'else") {
          var G__5617 = i__5616 + 2;
          i__5616 = G__5617;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
void 0;
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition5$ = 1;
  this.cljs$lang$protocol_mask$partition3$ = 15;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 15;
  this.cljs$lang$protocol_mask$partition2$ = 24
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5622 = this;
  return new cljs.core.TransientArrayMap({}, this__5622.arr.length, cljs.core.aclone.call(null, this__5622.arr))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5623 = this;
  var h__364__auto____5624 = this__5623.__hash;
  if(h__364__auto____5624 != null) {
    return h__364__auto____5624
  }else {
    var h__364__auto____5625 = cljs.core.hash_imap.call(null, coll);
    this__5623.__hash = h__364__auto____5625;
    return h__364__auto____5625
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5626 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5627 = this;
  var idx__5628 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5628 === -1) {
    return not_found
  }else {
    return this__5627.arr[idx__5628 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5629 = this;
  var idx__5630 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5630 === -1) {
    if(this__5629.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__5629.meta, this__5629.cnt + 1, function() {
        var G__5631__5632 = cljs.core.aclone.call(null, this__5629.arr);
        G__5631__5632.push(k);
        G__5631__5632.push(v);
        return G__5631__5632
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__5629.arr[idx__5630 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__5629.meta, this__5629.cnt, function() {
          var G__5633__5634 = cljs.core.aclone.call(null, this__5629.arr);
          G__5633__5634[idx__5630 + 1] = v;
          return G__5633__5634
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5635 = this;
  return cljs.core.array_map_index_of.call(null, coll, k) != -1
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__5665 = null;
  var G__5665__2 = function(tsym5620, k) {
    var this__5636 = this;
    var tsym5620__5637 = this;
    var coll__5638 = tsym5620__5637;
    return cljs.core._lookup.call(null, coll__5638, k)
  };
  var G__5665__3 = function(tsym5621, k, not_found) {
    var this__5639 = this;
    var tsym5621__5640 = this;
    var coll__5641 = tsym5621__5640;
    return cljs.core._lookup.call(null, coll__5641, k, not_found)
  };
  G__5665 = function(tsym5621, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5665__2.call(this, tsym5621, k);
      case 3:
        return G__5665__3.call(this, tsym5621, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5665
}();
cljs.core.PersistentArrayMap.prototype.apply = function(tsym5618, args5619) {
  return tsym5618.call.apply(tsym5618, [tsym5618].concat(cljs.core.aclone.call(null, args5619)))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__5642 = this;
  var len__5643 = this__5642.arr.length;
  var i__5644 = 0;
  var init__5645 = init;
  while(true) {
    if(i__5644 < len__5643) {
      var init__5646 = f.call(null, init__5645, this__5642.arr[i__5644], this__5642.arr[i__5644 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__5646)) {
        return cljs.core.deref.call(null, init__5646)
      }else {
        var G__5666 = i__5644 + 2;
        var G__5667 = init__5646;
        i__5644 = G__5666;
        init__5645 = G__5667;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5647 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__5648 = this;
  var this$__5649 = this;
  return cljs.core.pr_str.call(null, this$__5649)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5650 = this;
  if(this__5650.cnt > 0) {
    var len__5651 = this__5650.arr.length;
    var array_map_seq__5652 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__5651) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__5650.arr[i], this__5650.arr[i + 1]]), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      })
    };
    return array_map_seq__5652.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5653 = this;
  return this__5653.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5654 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5655 = this;
  return new cljs.core.PersistentArrayMap(meta, this__5655.cnt, this__5655.arr, this__5655.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5656 = this;
  return this__5656.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5657 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__5657.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5658 = this;
  var idx__5659 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5659 >= 0) {
    var len__5660 = this__5658.arr.length;
    var new_len__5661 = len__5660 - 2;
    if(new_len__5661 === 0) {
      return cljs.core._empty.call(null, coll)
    }else {
      var new_arr__5662 = cljs.core.make_array.call(null, new_len__5661);
      var s__5663 = 0;
      var d__5664 = 0;
      while(true) {
        if(s__5663 >= len__5660) {
          return new cljs.core.PersistentArrayMap(this__5658.meta, this__5658.cnt - 1, new_arr__5662, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__5658.arr[s__5663])) {
            var G__5668 = s__5663 + 2;
            var G__5669 = d__5664;
            s__5663 = G__5668;
            d__5664 = G__5669;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__5662[d__5664] = this__5658.arr[s__5663];
              new_arr__5662[d__5664 + 1] = this__5658.arr[s__5663 + 1];
              var G__5670 = s__5663 + 2;
              var G__5671 = d__5664 + 2;
              s__5663 = G__5670;
              d__5664 = G__5671;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__5672 = cljs.core.count.call(null, ks);
  var i__5673 = 0;
  var out__5674 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__5673 < len__5672) {
      var G__5675 = i__5673 + 1;
      var G__5676 = cljs.core.assoc_BANG_.call(null, out__5674, ks[i__5673], vs[i__5673]);
      i__5673 = G__5675;
      out__5674 = G__5676;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5674)
    }
    break
  }
};
void 0;
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition5$ = 14;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__5677 = this;
  if(cljs.core.truth_(this__5677.editable_QMARK_)) {
    var idx__5678 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__5678 >= 0) {
      this__5677.arr[idx__5678] = this__5677.arr[this__5677.len - 2];
      this__5677.arr[idx__5678 + 1] = this__5677.arr[this__5677.len - 1];
      var G__5679__5680 = this__5677.arr;
      G__5679__5680.pop();
      G__5679__5680.pop();
      G__5679__5680;
      this__5677.len = this__5677.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__5681 = this;
  if(cljs.core.truth_(this__5681.editable_QMARK_)) {
    var idx__5682 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__5682 === -1) {
      if(this__5681.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__5681.len = this__5681.len + 2;
        this__5681.arr.push(key);
        this__5681.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__5681.len, this__5681.arr), key, val)
      }
    }else {
      if(val === this__5681.arr[idx__5682 + 1]) {
        return tcoll
      }else {
        this__5681.arr[idx__5682 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__5683 = this;
  if(cljs.core.truth_(this__5683.editable_QMARK_)) {
    if(function() {
      var G__5684__5685 = o;
      if(G__5684__5685 != null) {
        if(function() {
          var or__3824__auto____5686 = G__5684__5685.cljs$lang$protocol_mask$partition1$ & 8;
          if(or__3824__auto____5686) {
            return or__3824__auto____5686
          }else {
            return G__5684__5685.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__5684__5685.cljs$lang$protocol_mask$partition1$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__5684__5685)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__5684__5685)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__5687 = cljs.core.seq.call(null, o);
      var tcoll__5688 = tcoll;
      while(true) {
        var temp__3971__auto____5689 = cljs.core.first.call(null, es__5687);
        if(cljs.core.truth_(temp__3971__auto____5689)) {
          var e__5690 = temp__3971__auto____5689;
          var G__5696 = cljs.core.next.call(null, es__5687);
          var G__5697 = cljs.core._assoc_BANG_.call(null, tcoll__5688, cljs.core.key.call(null, e__5690), cljs.core.val.call(null, e__5690));
          es__5687 = G__5696;
          tcoll__5688 = G__5697;
          continue
        }else {
          return tcoll__5688
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5691 = this;
  if(cljs.core.truth_(this__5691.editable_QMARK_)) {
    this__5691.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__5691.len, 2), this__5691.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__5692 = this;
  return cljs.core._lookup.call(null, tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__5693 = this;
  if(cljs.core.truth_(this__5693.editable_QMARK_)) {
    var idx__5694 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__5694 === -1) {
      return not_found
    }else {
      return this__5693.arr[idx__5694 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__5695 = this;
  if(cljs.core.truth_(this__5695.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__5695.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__5698 = cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {}));
  var i__5699 = 0;
  while(true) {
    if(i__5699 < len) {
      var G__5700 = cljs.core.assoc_BANG_.call(null, out__5698, arr[i__5699], arr[i__5699 + 1]);
      var G__5701 = i__5699 + 2;
      out__5698 = G__5700;
      i__5699 = G__5701;
      continue
    }else {
      return out__5698
    }
    break
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__5702__5703 = cljs.core.aclone.call(null, arr);
    G__5702__5703[i] = a;
    return G__5702__5703
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__5704__5705 = cljs.core.aclone.call(null, arr);
    G__5704__5705[i] = a;
    G__5704__5705[j] = b;
    return G__5704__5705
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__5706 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__5706, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__5706, 2 * i, new_arr__5706.length - 2 * i);
  return new_arr__5706
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__5707 = inode.ensure_editable(edit);
    editable__5707.arr[i] = a;
    return editable__5707
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__5708 = inode.ensure_editable(edit);
    editable__5708.arr[i] = a;
    editable__5708.arr[j] = b;
    return editable__5708
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__5709 = arr.length;
  var i__5710 = 0;
  var init__5711 = init;
  while(true) {
    if(i__5710 < len__5709) {
      var init__5714 = function() {
        var k__5712 = arr[i__5710];
        if(k__5712 != null) {
          return f.call(null, init__5711, k__5712, arr[i__5710 + 1])
        }else {
          var node__5713 = arr[i__5710 + 1];
          if(node__5713 != null) {
            return node__5713.kv_reduce(f, init__5711)
          }else {
            return init__5711
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__5714)) {
        return cljs.core.deref.call(null, init__5714)
      }else {
        var G__5715 = i__5710 + 2;
        var G__5716 = init__5714;
        i__5710 = G__5715;
        init__5711 = G__5716;
        continue
      }
    }else {
      return init__5711
    }
    break
  }
};
void 0;
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__5717 = this;
  var inode__5718 = this;
  if(this__5717.bitmap === bit) {
    return null
  }else {
    var editable__5719 = inode__5718.ensure_editable(e);
    var earr__5720 = editable__5719.arr;
    var len__5721 = earr__5720.length;
    editable__5719.bitmap = bit ^ editable__5719.bitmap;
    cljs.core.array_copy.call(null, earr__5720, 2 * (i + 1), earr__5720, 2 * i, len__5721 - 2 * (i + 1));
    earr__5720[len__5721 - 2] = null;
    earr__5720[len__5721 - 1] = null;
    return editable__5719
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5722 = this;
  var inode__5723 = this;
  var bit__5724 = 1 << (hash >>> shift & 31);
  var idx__5725 = cljs.core.bitmap_indexed_node_index.call(null, this__5722.bitmap, bit__5724);
  if((this__5722.bitmap & bit__5724) === 0) {
    var n__5726 = cljs.core.bit_count.call(null, this__5722.bitmap);
    if(2 * n__5726 < this__5722.arr.length) {
      var editable__5727 = inode__5723.ensure_editable(edit);
      var earr__5728 = editable__5727.arr;
      added_leaf_QMARK_[0] = true;
      cljs.core.array_copy_downward.call(null, earr__5728, 2 * idx__5725, earr__5728, 2 * (idx__5725 + 1), 2 * (n__5726 - idx__5725));
      earr__5728[2 * idx__5725] = key;
      earr__5728[2 * idx__5725 + 1] = val;
      editable__5727.bitmap = editable__5727.bitmap | bit__5724;
      return editable__5727
    }else {
      if(n__5726 >= 16) {
        var nodes__5729 = cljs.core.make_array.call(null, 32);
        var jdx__5730 = hash >>> shift & 31;
        nodes__5729[jdx__5730] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__5731 = 0;
        var j__5732 = 0;
        while(true) {
          if(i__5731 < 32) {
            if((this__5722.bitmap >>> i__5731 & 1) === 0) {
              var G__5785 = i__5731 + 1;
              var G__5786 = j__5732;
              i__5731 = G__5785;
              j__5732 = G__5786;
              continue
            }else {
              nodes__5729[i__5731] = null != this__5722.arr[j__5732] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__5722.arr[j__5732]), this__5722.arr[j__5732], this__5722.arr[j__5732 + 1], added_leaf_QMARK_) : this__5722.arr[j__5732 + 1];
              var G__5787 = i__5731 + 1;
              var G__5788 = j__5732 + 2;
              i__5731 = G__5787;
              j__5732 = G__5788;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__5726 + 1, nodes__5729)
      }else {
        if("\ufdd0'else") {
          var new_arr__5733 = cljs.core.make_array.call(null, 2 * (n__5726 + 4));
          cljs.core.array_copy.call(null, this__5722.arr, 0, new_arr__5733, 0, 2 * idx__5725);
          new_arr__5733[2 * idx__5725] = key;
          added_leaf_QMARK_[0] = true;
          new_arr__5733[2 * idx__5725 + 1] = val;
          cljs.core.array_copy.call(null, this__5722.arr, 2 * idx__5725, new_arr__5733, 2 * (idx__5725 + 1), 2 * (n__5726 - idx__5725));
          var editable__5734 = inode__5723.ensure_editable(edit);
          editable__5734.arr = new_arr__5733;
          editable__5734.bitmap = editable__5734.bitmap | bit__5724;
          return editable__5734
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__5735 = this__5722.arr[2 * idx__5725];
    var val_or_node__5736 = this__5722.arr[2 * idx__5725 + 1];
    if(null == key_or_nil__5735) {
      var n__5737 = val_or_node__5736.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__5737 === val_or_node__5736) {
        return inode__5723
      }else {
        return cljs.core.edit_and_set.call(null, inode__5723, edit, 2 * idx__5725 + 1, n__5737)
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5735)) {
        if(val === val_or_node__5736) {
          return inode__5723
        }else {
          return cljs.core.edit_and_set.call(null, inode__5723, edit, 2 * idx__5725 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return cljs.core.edit_and_set.call(null, inode__5723, edit, 2 * idx__5725, null, 2 * idx__5725 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__5735, val_or_node__5736, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__5738 = this;
  var inode__5739 = this;
  return cljs.core.create_inode_seq.call(null, this__5738.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__5740 = this;
  var inode__5741 = this;
  var bit__5742 = 1 << (hash >>> shift & 31);
  if((this__5740.bitmap & bit__5742) === 0) {
    return inode__5741
  }else {
    var idx__5743 = cljs.core.bitmap_indexed_node_index.call(null, this__5740.bitmap, bit__5742);
    var key_or_nil__5744 = this__5740.arr[2 * idx__5743];
    var val_or_node__5745 = this__5740.arr[2 * idx__5743 + 1];
    if(null == key_or_nil__5744) {
      var n__5746 = val_or_node__5745.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__5746 === val_or_node__5745) {
        return inode__5741
      }else {
        if(null != n__5746) {
          return cljs.core.edit_and_set.call(null, inode__5741, edit, 2 * idx__5743 + 1, n__5746)
        }else {
          if(this__5740.bitmap === bit__5742) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__5741.edit_and_remove_pair(edit, bit__5742, idx__5743)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5744)) {
        removed_leaf_QMARK_[0] = true;
        return inode__5741.edit_and_remove_pair(edit, bit__5742, idx__5743)
      }else {
        if("\ufdd0'else") {
          return inode__5741
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__5747 = this;
  var inode__5748 = this;
  if(e === this__5747.edit) {
    return inode__5748
  }else {
    var n__5749 = cljs.core.bit_count.call(null, this__5747.bitmap);
    var new_arr__5750 = cljs.core.make_array.call(null, n__5749 < 0 ? 4 : 2 * (n__5749 + 1));
    cljs.core.array_copy.call(null, this__5747.arr, 0, new_arr__5750, 0, 2 * n__5749);
    return new cljs.core.BitmapIndexedNode(e, this__5747.bitmap, new_arr__5750)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__5751 = this;
  var inode__5752 = this;
  return cljs.core.inode_kv_reduce.call(null, this__5751.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function() {
  var G__5789 = null;
  var G__5789__3 = function(shift, hash, key) {
    var this__5753 = this;
    var inode__5754 = this;
    var bit__5755 = 1 << (hash >>> shift & 31);
    if((this__5753.bitmap & bit__5755) === 0) {
      return null
    }else {
      var idx__5756 = cljs.core.bitmap_indexed_node_index.call(null, this__5753.bitmap, bit__5755);
      var key_or_nil__5757 = this__5753.arr[2 * idx__5756];
      var val_or_node__5758 = this__5753.arr[2 * idx__5756 + 1];
      if(null == key_or_nil__5757) {
        return val_or_node__5758.inode_find(shift + 5, hash, key)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__5757)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__5757, val_or_node__5758])
        }else {
          if("\ufdd0'else") {
            return null
          }else {
            return null
          }
        }
      }
    }
  };
  var G__5789__4 = function(shift, hash, key, not_found) {
    var this__5759 = this;
    var inode__5760 = this;
    var bit__5761 = 1 << (hash >>> shift & 31);
    if((this__5759.bitmap & bit__5761) === 0) {
      return not_found
    }else {
      var idx__5762 = cljs.core.bitmap_indexed_node_index.call(null, this__5759.bitmap, bit__5761);
      var key_or_nil__5763 = this__5759.arr[2 * idx__5762];
      var val_or_node__5764 = this__5759.arr[2 * idx__5762 + 1];
      if(null == key_or_nil__5763) {
        return val_or_node__5764.inode_find(shift + 5, hash, key, not_found)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__5763)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__5763, val_or_node__5764])
        }else {
          if("\ufdd0'else") {
            return not_found
          }else {
            return null
          }
        }
      }
    }
  };
  G__5789 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__5789__3.call(this, shift, hash, key);
      case 4:
        return G__5789__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5789
}();
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__5765 = this;
  var inode__5766 = this;
  var bit__5767 = 1 << (hash >>> shift & 31);
  if((this__5765.bitmap & bit__5767) === 0) {
    return inode__5766
  }else {
    var idx__5768 = cljs.core.bitmap_indexed_node_index.call(null, this__5765.bitmap, bit__5767);
    var key_or_nil__5769 = this__5765.arr[2 * idx__5768];
    var val_or_node__5770 = this__5765.arr[2 * idx__5768 + 1];
    if(null == key_or_nil__5769) {
      var n__5771 = val_or_node__5770.inode_without(shift + 5, hash, key);
      if(n__5771 === val_or_node__5770) {
        return inode__5766
      }else {
        if(null != n__5771) {
          return new cljs.core.BitmapIndexedNode(null, this__5765.bitmap, cljs.core.clone_and_set.call(null, this__5765.arr, 2 * idx__5768 + 1, n__5771))
        }else {
          if(this__5765.bitmap === bit__5767) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__5765.bitmap ^ bit__5767, cljs.core.remove_pair.call(null, this__5765.arr, idx__5768))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5769)) {
        return new cljs.core.BitmapIndexedNode(null, this__5765.bitmap ^ bit__5767, cljs.core.remove_pair.call(null, this__5765.arr, idx__5768))
      }else {
        if("\ufdd0'else") {
          return inode__5766
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__5772 = this;
  var inode__5773 = this;
  var bit__5774 = 1 << (hash >>> shift & 31);
  var idx__5775 = cljs.core.bitmap_indexed_node_index.call(null, this__5772.bitmap, bit__5774);
  if((this__5772.bitmap & bit__5774) === 0) {
    var n__5776 = cljs.core.bit_count.call(null, this__5772.bitmap);
    if(n__5776 >= 16) {
      var nodes__5777 = cljs.core.make_array.call(null, 32);
      var jdx__5778 = hash >>> shift & 31;
      nodes__5777[jdx__5778] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__5779 = 0;
      var j__5780 = 0;
      while(true) {
        if(i__5779 < 32) {
          if((this__5772.bitmap >>> i__5779 & 1) === 0) {
            var G__5790 = i__5779 + 1;
            var G__5791 = j__5780;
            i__5779 = G__5790;
            j__5780 = G__5791;
            continue
          }else {
            nodes__5777[i__5779] = null != this__5772.arr[j__5780] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__5772.arr[j__5780]), this__5772.arr[j__5780], this__5772.arr[j__5780 + 1], added_leaf_QMARK_) : this__5772.arr[j__5780 + 1];
            var G__5792 = i__5779 + 1;
            var G__5793 = j__5780 + 2;
            i__5779 = G__5792;
            j__5780 = G__5793;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__5776 + 1, nodes__5777)
    }else {
      var new_arr__5781 = cljs.core.make_array.call(null, 2 * (n__5776 + 1));
      cljs.core.array_copy.call(null, this__5772.arr, 0, new_arr__5781, 0, 2 * idx__5775);
      new_arr__5781[2 * idx__5775] = key;
      added_leaf_QMARK_[0] = true;
      new_arr__5781[2 * idx__5775 + 1] = val;
      cljs.core.array_copy.call(null, this__5772.arr, 2 * idx__5775, new_arr__5781, 2 * (idx__5775 + 1), 2 * (n__5776 - idx__5775));
      return new cljs.core.BitmapIndexedNode(null, this__5772.bitmap | bit__5774, new_arr__5781)
    }
  }else {
    var key_or_nil__5782 = this__5772.arr[2 * idx__5775];
    var val_or_node__5783 = this__5772.arr[2 * idx__5775 + 1];
    if(null == key_or_nil__5782) {
      var n__5784 = val_or_node__5783.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__5784 === val_or_node__5783) {
        return inode__5773
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__5772.bitmap, cljs.core.clone_and_set.call(null, this__5772.arr, 2 * idx__5775 + 1, n__5784))
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5782)) {
        if(val === val_or_node__5783) {
          return inode__5773
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__5772.bitmap, cljs.core.clone_and_set.call(null, this__5772.arr, 2 * idx__5775 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return new cljs.core.BitmapIndexedNode(null, this__5772.bitmap, cljs.core.clone_and_set.call(null, this__5772.arr, 2 * idx__5775, null, 2 * idx__5775 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__5782, val_or_node__5783, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__5794 = array_node.arr;
  var len__5795 = 2 * (array_node.cnt - 1);
  var new_arr__5796 = cljs.core.make_array.call(null, len__5795);
  var i__5797 = 0;
  var j__5798 = 1;
  var bitmap__5799 = 0;
  while(true) {
    if(i__5797 < len__5795) {
      if(function() {
        var and__3822__auto____5800 = i__5797 != idx;
        if(and__3822__auto____5800) {
          return null != arr__5794[i__5797]
        }else {
          return and__3822__auto____5800
        }
      }()) {
        new_arr__5796[j__5798] = arr__5794[i__5797];
        var G__5801 = i__5797 + 1;
        var G__5802 = j__5798 + 2;
        var G__5803 = bitmap__5799 | 1 << i__5797;
        i__5797 = G__5801;
        j__5798 = G__5802;
        bitmap__5799 = G__5803;
        continue
      }else {
        var G__5804 = i__5797 + 1;
        var G__5805 = j__5798;
        var G__5806 = bitmap__5799;
        i__5797 = G__5804;
        j__5798 = G__5805;
        bitmap__5799 = G__5806;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__5799, new_arr__5796)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__5807 = this;
  var inode__5808 = this;
  var idx__5809 = hash >>> shift & 31;
  var node__5810 = this__5807.arr[idx__5809];
  if(null == node__5810) {
    return new cljs.core.ArrayNode(null, this__5807.cnt + 1, cljs.core.clone_and_set.call(null, this__5807.arr, idx__5809, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__5811 = node__5810.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__5811 === node__5810) {
      return inode__5808
    }else {
      return new cljs.core.ArrayNode(null, this__5807.cnt, cljs.core.clone_and_set.call(null, this__5807.arr, idx__5809, n__5811))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__5812 = this;
  var inode__5813 = this;
  var idx__5814 = hash >>> shift & 31;
  var node__5815 = this__5812.arr[idx__5814];
  if(null != node__5815) {
    var n__5816 = node__5815.inode_without(shift + 5, hash, key);
    if(n__5816 === node__5815) {
      return inode__5813
    }else {
      if(n__5816 == null) {
        if(this__5812.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__5813, null, idx__5814)
        }else {
          return new cljs.core.ArrayNode(null, this__5812.cnt - 1, cljs.core.clone_and_set.call(null, this__5812.arr, idx__5814, n__5816))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__5812.cnt, cljs.core.clone_and_set.call(null, this__5812.arr, idx__5814, n__5816))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__5813
  }
};
cljs.core.ArrayNode.prototype.inode_find = function() {
  var G__5848 = null;
  var G__5848__3 = function(shift, hash, key) {
    var this__5817 = this;
    var inode__5818 = this;
    var idx__5819 = hash >>> shift & 31;
    var node__5820 = this__5817.arr[idx__5819];
    if(null != node__5820) {
      return node__5820.inode_find(shift + 5, hash, key)
    }else {
      return null
    }
  };
  var G__5848__4 = function(shift, hash, key, not_found) {
    var this__5821 = this;
    var inode__5822 = this;
    var idx__5823 = hash >>> shift & 31;
    var node__5824 = this__5821.arr[idx__5823];
    if(null != node__5824) {
      return node__5824.inode_find(shift + 5, hash, key, not_found)
    }else {
      return not_found
    }
  };
  G__5848 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__5848__3.call(this, shift, hash, key);
      case 4:
        return G__5848__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5848
}();
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__5825 = this;
  var inode__5826 = this;
  return cljs.core.create_array_node_seq.call(null, this__5825.arr)
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__5827 = this;
  var inode__5828 = this;
  if(e === this__5827.edit) {
    return inode__5828
  }else {
    return new cljs.core.ArrayNode(e, this__5827.cnt, cljs.core.aclone.call(null, this__5827.arr))
  }
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5829 = this;
  var inode__5830 = this;
  var idx__5831 = hash >>> shift & 31;
  var node__5832 = this__5829.arr[idx__5831];
  if(null == node__5832) {
    var editable__5833 = cljs.core.edit_and_set.call(null, inode__5830, edit, idx__5831, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__5833.cnt = editable__5833.cnt + 1;
    return editable__5833
  }else {
    var n__5834 = node__5832.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__5834 === node__5832) {
      return inode__5830
    }else {
      return cljs.core.edit_and_set.call(null, inode__5830, edit, idx__5831, n__5834)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__5835 = this;
  var inode__5836 = this;
  var idx__5837 = hash >>> shift & 31;
  var node__5838 = this__5835.arr[idx__5837];
  if(null == node__5838) {
    return inode__5836
  }else {
    var n__5839 = node__5838.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__5839 === node__5838) {
      return inode__5836
    }else {
      if(null == n__5839) {
        if(this__5835.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__5836, edit, idx__5837)
        }else {
          var editable__5840 = cljs.core.edit_and_set.call(null, inode__5836, edit, idx__5837, n__5839);
          editable__5840.cnt = editable__5840.cnt - 1;
          return editable__5840
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__5836, edit, idx__5837, n__5839)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__5841 = this;
  var inode__5842 = this;
  var len__5843 = this__5841.arr.length;
  var i__5844 = 0;
  var init__5845 = init;
  while(true) {
    if(i__5844 < len__5843) {
      var node__5846 = this__5841.arr[i__5844];
      if(node__5846 != null) {
        var init__5847 = node__5846.kv_reduce(f, init__5845);
        if(cljs.core.reduced_QMARK_.call(null, init__5847)) {
          return cljs.core.deref.call(null, init__5847)
        }else {
          var G__5849 = i__5844 + 1;
          var G__5850 = init__5847;
          i__5844 = G__5849;
          init__5845 = G__5850;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__5845
    }
    break
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__5851 = 2 * cnt;
  var i__5852 = 0;
  while(true) {
    if(i__5852 < lim__5851) {
      if(cljs.core._EQ_.call(null, key, arr[i__5852])) {
        return i__5852
      }else {
        var G__5853 = i__5852 + 2;
        i__5852 = G__5853;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__5854 = this;
  var inode__5855 = this;
  if(hash === this__5854.collision_hash) {
    var idx__5856 = cljs.core.hash_collision_node_find_index.call(null, this__5854.arr, this__5854.cnt, key);
    if(idx__5856 === -1) {
      var len__5857 = this__5854.arr.length;
      var new_arr__5858 = cljs.core.make_array.call(null, len__5857 + 2);
      cljs.core.array_copy.call(null, this__5854.arr, 0, new_arr__5858, 0, len__5857);
      new_arr__5858[len__5857] = key;
      new_arr__5858[len__5857 + 1] = val;
      added_leaf_QMARK_[0] = true;
      return new cljs.core.HashCollisionNode(null, this__5854.collision_hash, this__5854.cnt + 1, new_arr__5858)
    }else {
      if(cljs.core._EQ_.call(null, this__5854.arr[idx__5856], val)) {
        return inode__5855
      }else {
        return new cljs.core.HashCollisionNode(null, this__5854.collision_hash, this__5854.cnt, cljs.core.clone_and_set.call(null, this__5854.arr, idx__5856 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__5854.collision_hash >>> shift & 31), [null, inode__5855])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__5859 = this;
  var inode__5860 = this;
  var idx__5861 = cljs.core.hash_collision_node_find_index.call(null, this__5859.arr, this__5859.cnt, key);
  if(idx__5861 === -1) {
    return inode__5860
  }else {
    if(this__5859.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__5859.collision_hash, this__5859.cnt - 1, cljs.core.remove_pair.call(null, this__5859.arr, cljs.core.quot.call(null, idx__5861, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_find = function() {
  var G__5888 = null;
  var G__5888__3 = function(shift, hash, key) {
    var this__5862 = this;
    var inode__5863 = this;
    var idx__5864 = cljs.core.hash_collision_node_find_index.call(null, this__5862.arr, this__5862.cnt, key);
    if(idx__5864 < 0) {
      return null
    }else {
      if(cljs.core._EQ_.call(null, key, this__5862.arr[idx__5864])) {
        return cljs.core.PersistentVector.fromArray([this__5862.arr[idx__5864], this__5862.arr[idx__5864 + 1]])
      }else {
        if("\ufdd0'else") {
          return null
        }else {
          return null
        }
      }
    }
  };
  var G__5888__4 = function(shift, hash, key, not_found) {
    var this__5865 = this;
    var inode__5866 = this;
    var idx__5867 = cljs.core.hash_collision_node_find_index.call(null, this__5865.arr, this__5865.cnt, key);
    if(idx__5867 < 0) {
      return not_found
    }else {
      if(cljs.core._EQ_.call(null, key, this__5865.arr[idx__5867])) {
        return cljs.core.PersistentVector.fromArray([this__5865.arr[idx__5867], this__5865.arr[idx__5867 + 1]])
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  };
  G__5888 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__5888__3.call(this, shift, hash, key);
      case 4:
        return G__5888__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5888
}();
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__5868 = this;
  var inode__5869 = this;
  return cljs.core.create_inode_seq.call(null, this__5868.arr)
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function() {
  var G__5889 = null;
  var G__5889__1 = function(e) {
    var this__5870 = this;
    var inode__5871 = this;
    if(e === this__5870.edit) {
      return inode__5871
    }else {
      var new_arr__5872 = cljs.core.make_array.call(null, 2 * (this__5870.cnt + 1));
      cljs.core.array_copy.call(null, this__5870.arr, 0, new_arr__5872, 0, 2 * this__5870.cnt);
      return new cljs.core.HashCollisionNode(e, this__5870.collision_hash, this__5870.cnt, new_arr__5872)
    }
  };
  var G__5889__3 = function(e, count, array) {
    var this__5873 = this;
    var inode__5874 = this;
    if(e === this__5873.edit) {
      this__5873.arr = array;
      this__5873.cnt = count;
      return inode__5874
    }else {
      return new cljs.core.HashCollisionNode(this__5873.edit, this__5873.collision_hash, count, array)
    }
  };
  G__5889 = function(e, count, array) {
    switch(arguments.length) {
      case 1:
        return G__5889__1.call(this, e);
      case 3:
        return G__5889__3.call(this, e, count, array)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5889
}();
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5875 = this;
  var inode__5876 = this;
  if(hash === this__5875.collision_hash) {
    var idx__5877 = cljs.core.hash_collision_node_find_index.call(null, this__5875.arr, this__5875.cnt, key);
    if(idx__5877 === -1) {
      if(this__5875.arr.length > 2 * this__5875.cnt) {
        var editable__5878 = cljs.core.edit_and_set.call(null, inode__5876, edit, 2 * this__5875.cnt, key, 2 * this__5875.cnt + 1, val);
        added_leaf_QMARK_[0] = true;
        editable__5878.cnt = editable__5878.cnt + 1;
        return editable__5878
      }else {
        var len__5879 = this__5875.arr.length;
        var new_arr__5880 = cljs.core.make_array.call(null, len__5879 + 2);
        cljs.core.array_copy.call(null, this__5875.arr, 0, new_arr__5880, 0, len__5879);
        new_arr__5880[len__5879] = key;
        new_arr__5880[len__5879 + 1] = val;
        added_leaf_QMARK_[0] = true;
        return inode__5876.ensure_editable(edit, this__5875.cnt + 1, new_arr__5880)
      }
    }else {
      if(this__5875.arr[idx__5877 + 1] === val) {
        return inode__5876
      }else {
        return cljs.core.edit_and_set.call(null, inode__5876, edit, idx__5877 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__5875.collision_hash >>> shift & 31), [null, inode__5876, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__5881 = this;
  var inode__5882 = this;
  var idx__5883 = cljs.core.hash_collision_node_find_index.call(null, this__5881.arr, this__5881.cnt, key);
  if(idx__5883 === -1) {
    return inode__5882
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__5881.cnt === 1) {
      return null
    }else {
      var editable__5884 = inode__5882.ensure_editable(edit);
      var earr__5885 = editable__5884.arr;
      earr__5885[idx__5883] = earr__5885[2 * this__5881.cnt - 2];
      earr__5885[idx__5883 + 1] = earr__5885[2 * this__5881.cnt - 1];
      earr__5885[2 * this__5881.cnt - 1] = null;
      earr__5885[2 * this__5881.cnt - 2] = null;
      editable__5884.cnt = editable__5884.cnt - 1;
      return editable__5884
    }
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__5886 = this;
  var inode__5887 = this;
  return cljs.core.inode_kv_reduce.call(null, this__5886.arr, f, init)
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__5890 = cljs.core.hash.call(null, key1);
    if(key1hash__5890 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__5890, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___5891 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__5890, key1, val1, added_leaf_QMARK___5891).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___5891)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__5892 = cljs.core.hash.call(null, key1);
    if(key1hash__5892 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__5892, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___5893 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__5892, key1, val1, added_leaf_QMARK___5893).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___5893)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition3$ = 30;
  this.cljs$lang$protocol_mask$partition0$ = 44;
  this.cljs$lang$protocol_mask$partition2$ = 24
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5894 = this;
  var h__364__auto____5895 = this__5894.__hash;
  if(h__364__auto____5895 != null) {
    return h__364__auto____5895
  }else {
    var h__364__auto____5896 = cljs.core.hash_coll.call(null, coll);
    this__5894.__hash = h__364__auto____5896;
    return h__364__auto____5896
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5897 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__5898 = this;
  var this$__5899 = this;
  return cljs.core.pr_str.call(null, this$__5899)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__5900 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5901 = this;
  if(this__5901.s == null) {
    return cljs.core.PersistentVector.fromArray([this__5901.nodes[this__5901.i], this__5901.nodes[this__5901.i + 1]])
  }else {
    return cljs.core.first.call(null, this__5901.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5902 = this;
  if(this__5902.s == null) {
    return cljs.core.create_inode_seq.call(null, this__5902.nodes, this__5902.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__5902.nodes, this__5902.i, cljs.core.next.call(null, this__5902.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5903 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5904 = this;
  return new cljs.core.NodeSeq(meta, this__5904.nodes, this__5904.i, this__5904.s, this__5904.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5905 = this;
  return this__5905.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5906 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5906.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__5907 = nodes.length;
      var j__5908 = i;
      while(true) {
        if(j__5908 < len__5907) {
          if(null != nodes[j__5908]) {
            return new cljs.core.NodeSeq(null, nodes, j__5908, null, null)
          }else {
            var temp__3971__auto____5909 = nodes[j__5908 + 1];
            if(cljs.core.truth_(temp__3971__auto____5909)) {
              var node__5910 = temp__3971__auto____5909;
              var temp__3971__auto____5911 = node__5910.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____5911)) {
                var node_seq__5912 = temp__3971__auto____5911;
                return new cljs.core.NodeSeq(null, nodes, j__5908 + 2, node_seq__5912, null)
              }else {
                var G__5913 = j__5908 + 2;
                j__5908 = G__5913;
                continue
              }
            }else {
              var G__5914 = j__5908 + 2;
              j__5908 = G__5914;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition3$ = 30;
  this.cljs$lang$protocol_mask$partition0$ = 44;
  this.cljs$lang$protocol_mask$partition2$ = 24
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5915 = this;
  var h__364__auto____5916 = this__5915.__hash;
  if(h__364__auto____5916 != null) {
    return h__364__auto____5916
  }else {
    var h__364__auto____5917 = cljs.core.hash_coll.call(null, coll);
    this__5915.__hash = h__364__auto____5917;
    return h__364__auto____5917
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5918 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__5919 = this;
  var this$__5920 = this;
  return cljs.core.pr_str.call(null, this$__5920)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__5921 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5922 = this;
  return cljs.core.first.call(null, this__5922.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5923 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__5923.nodes, this__5923.i, cljs.core.next.call(null, this__5923.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5924 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5925 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__5925.nodes, this__5925.i, this__5925.s, this__5925.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5926 = this;
  return this__5926.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5927 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5927.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__5928 = nodes.length;
      var j__5929 = i;
      while(true) {
        if(j__5929 < len__5928) {
          var temp__3971__auto____5930 = nodes[j__5929];
          if(cljs.core.truth_(temp__3971__auto____5930)) {
            var nj__5931 = temp__3971__auto____5930;
            var temp__3971__auto____5932 = nj__5931.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____5932)) {
              var ns__5933 = temp__3971__auto____5932;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__5929 + 1, ns__5933, null)
            }else {
              var G__5934 = j__5929 + 1;
              j__5929 = G__5934;
              continue
            }
          }else {
            var G__5935 = j__5929 + 1;
            j__5929 = G__5935;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
void 0;
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition5$ = 1;
  this.cljs$lang$protocol_mask$partition3$ = 15;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 15;
  this.cljs$lang$protocol_mask$partition2$ = 24
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5940 = this;
  return new cljs.core.TransientHashMap({}, this__5940.root, this__5940.cnt, this__5940.has_nil_QMARK_, this__5940.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5941 = this;
  var h__364__auto____5942 = this__5941.__hash;
  if(h__364__auto____5942 != null) {
    return h__364__auto____5942
  }else {
    var h__364__auto____5943 = cljs.core.hash_imap.call(null, coll);
    this__5941.__hash = h__364__auto____5943;
    return h__364__auto____5943
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5944 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5945 = this;
  if(k == null) {
    if(cljs.core.truth_(this__5945.has_nil_QMARK_)) {
      return this__5945.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__5945.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return cljs.core.nth.call(null, this__5945.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5946 = this;
  if(k == null) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____5947 = this__5946.has_nil_QMARK_;
      if(cljs.core.truth_(and__3822__auto____5947)) {
        return v === this__5946.nil_val
      }else {
        return and__3822__auto____5947
      }
    }())) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__5946.meta, cljs.core.truth_(this__5946.has_nil_QMARK_) ? this__5946.cnt : this__5946.cnt + 1, this__5946.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___5948 = [false];
    var new_root__5949 = (this__5946.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__5946.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___5948);
    if(new_root__5949 === this__5946.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__5946.meta, cljs.core.truth_(added_leaf_QMARK___5948[0]) ? this__5946.cnt + 1 : this__5946.cnt, new_root__5949, this__5946.has_nil_QMARK_, this__5946.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5950 = this;
  if(k == null) {
    return this__5950.has_nil_QMARK_
  }else {
    if(this__5950.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return cljs.core.not.call(null, this__5950.root.inode_find(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__5971 = null;
  var G__5971__2 = function(tsym5938, k) {
    var this__5951 = this;
    var tsym5938__5952 = this;
    var coll__5953 = tsym5938__5952;
    return cljs.core._lookup.call(null, coll__5953, k)
  };
  var G__5971__3 = function(tsym5939, k, not_found) {
    var this__5954 = this;
    var tsym5939__5955 = this;
    var coll__5956 = tsym5939__5955;
    return cljs.core._lookup.call(null, coll__5956, k, not_found)
  };
  G__5971 = function(tsym5939, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5971__2.call(this, tsym5939, k);
      case 3:
        return G__5971__3.call(this, tsym5939, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5971
}();
cljs.core.PersistentHashMap.prototype.apply = function(tsym5936, args5937) {
  return tsym5936.call.apply(tsym5936, [tsym5936].concat(cljs.core.aclone.call(null, args5937)))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__5957 = this;
  var init__5958 = cljs.core.truth_(this__5957.has_nil_QMARK_) ? f.call(null, init, null, this__5957.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__5958)) {
    return cljs.core.deref.call(null, init__5958)
  }else {
    if(null != this__5957.root) {
      return this__5957.root.kv_reduce(f, init__5958)
    }else {
      if("\ufdd0'else") {
        return init__5958
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5959 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__5960 = this;
  var this$__5961 = this;
  return cljs.core.pr_str.call(null, this$__5961)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5962 = this;
  if(this__5962.cnt > 0) {
    var s__5963 = null != this__5962.root ? this__5962.root.inode_seq() : null;
    if(cljs.core.truth_(this__5962.has_nil_QMARK_)) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__5962.nil_val]), s__5963)
    }else {
      return s__5963
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5964 = this;
  return this__5964.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5965 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5966 = this;
  return new cljs.core.PersistentHashMap(meta, this__5966.cnt, this__5966.root, this__5966.has_nil_QMARK_, this__5966.nil_val, this__5966.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5967 = this;
  return this__5967.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5968 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__5968.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5969 = this;
  if(k == null) {
    if(cljs.core.truth_(this__5969.has_nil_QMARK_)) {
      return new cljs.core.PersistentHashMap(this__5969.meta, this__5969.cnt - 1, this__5969.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__5969.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__5970 = this__5969.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__5970 === this__5969.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__5969.meta, this__5969.cnt - 1, new_root__5970, this__5969.has_nil_QMARK_, this__5969.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__5972 = ks.length;
  var i__5973 = 0;
  var out__5974 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__5973 < len__5972) {
      var G__5975 = i__5973 + 1;
      var G__5976 = cljs.core.assoc_BANG_.call(null, out__5974, ks[i__5973], vs[i__5973]);
      i__5973 = G__5975;
      out__5974 = G__5976;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5974)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition5$ = 14;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__5977 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__5978 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__5979 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5980 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__5981 = this;
  if(k == null) {
    if(cljs.core.truth_(this__5981.has_nil_QMARK_)) {
      return this__5981.nil_val
    }else {
      return null
    }
  }else {
    if(this__5981.root == null) {
      return null
    }else {
      return cljs.core.nth.call(null, this__5981.root.inode_find(0, cljs.core.hash.call(null, k), k), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__5982 = this;
  if(k == null) {
    if(cljs.core.truth_(this__5982.has_nil_QMARK_)) {
      return this__5982.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__5982.root == null) {
      return not_found
    }else {
      return cljs.core.nth.call(null, this__5982.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5983 = this;
  if(cljs.core.truth_(this__5983.edit)) {
    return this__5983.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__5984 = this;
  var tcoll__5985 = this;
  if(cljs.core.truth_(this__5984.edit)) {
    if(function() {
      var G__5986__5987 = o;
      if(G__5986__5987 != null) {
        if(function() {
          var or__3824__auto____5988 = G__5986__5987.cljs$lang$protocol_mask$partition1$ & 8;
          if(or__3824__auto____5988) {
            return or__3824__auto____5988
          }else {
            return G__5986__5987.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__5986__5987.cljs$lang$protocol_mask$partition1$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__5986__5987)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__5986__5987)
      }
    }()) {
      return tcoll__5985.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__5989 = cljs.core.seq.call(null, o);
      var tcoll__5990 = tcoll__5985;
      while(true) {
        var temp__3971__auto____5991 = cljs.core.first.call(null, es__5989);
        if(cljs.core.truth_(temp__3971__auto____5991)) {
          var e__5992 = temp__3971__auto____5991;
          var G__6003 = cljs.core.next.call(null, es__5989);
          var G__6004 = tcoll__5990.assoc_BANG_(cljs.core.key.call(null, e__5992), cljs.core.val.call(null, e__5992));
          es__5989 = G__6003;
          tcoll__5990 = G__6004;
          continue
        }else {
          return tcoll__5990
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__5993 = this;
  var tcoll__5994 = this;
  if(cljs.core.truth_(this__5993.edit)) {
    if(k == null) {
      if(this__5993.nil_val === v) {
      }else {
        this__5993.nil_val = v
      }
      if(cljs.core.truth_(this__5993.has_nil_QMARK_)) {
      }else {
        this__5993.count = this__5993.count + 1;
        this__5993.has_nil_QMARK_ = true
      }
      return tcoll__5994
    }else {
      var added_leaf_QMARK___5995 = [false];
      var node__5996 = (this__5993.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__5993.root).inode_assoc_BANG_(this__5993.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___5995);
      if(node__5996 === this__5993.root) {
      }else {
        this__5993.root = node__5996
      }
      if(cljs.core.truth_(added_leaf_QMARK___5995[0])) {
        this__5993.count = this__5993.count + 1
      }else {
      }
      return tcoll__5994
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__5997 = this;
  var tcoll__5998 = this;
  if(cljs.core.truth_(this__5997.edit)) {
    if(k == null) {
      if(cljs.core.truth_(this__5997.has_nil_QMARK_)) {
        this__5997.has_nil_QMARK_ = false;
        this__5997.nil_val = null;
        this__5997.count = this__5997.count - 1;
        return tcoll__5998
      }else {
        return tcoll__5998
      }
    }else {
      if(this__5997.root == null) {
        return tcoll__5998
      }else {
        var removed_leaf_QMARK___5999 = [false];
        var node__6000 = this__5997.root.inode_without_BANG_(this__5997.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___5999);
        if(node__6000 === this__5997.root) {
        }else {
          this__5997.root = node__6000
        }
        if(cljs.core.truth_(removed_leaf_QMARK___5999[0])) {
          this__5997.count = this__5997.count - 1
        }else {
        }
        return tcoll__5998
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__6001 = this;
  var tcoll__6002 = this;
  if(cljs.core.truth_(this__6001.edit)) {
    this__6001.edit = null;
    return new cljs.core.PersistentHashMap(null, this__6001.count, this__6001.root, this__6001.has_nil_QMARK_, this__6001.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__6005 = node;
  var stack__6006 = stack;
  while(true) {
    if(t__6005 != null) {
      var G__6007 = cljs.core.truth_(ascending_QMARK_) ? t__6005.left : t__6005.right;
      var G__6008 = cljs.core.conj.call(null, stack__6006, t__6005);
      t__6005 = G__6007;
      stack__6006 = G__6008;
      continue
    }else {
      return stack__6006
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition3$ = 30;
  this.cljs$lang$protocol_mask$partition0$ = 42;
  this.cljs$lang$protocol_mask$partition2$ = 24
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6009 = this;
  var h__364__auto____6010 = this__6009.__hash;
  if(h__364__auto____6010 != null) {
    return h__364__auto____6010
  }else {
    var h__364__auto____6011 = cljs.core.hash_coll.call(null, coll);
    this__6009.__hash = h__364__auto____6011;
    return h__364__auto____6011
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6012 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__6013 = this;
  var this$__6014 = this;
  return cljs.core.pr_str.call(null, this$__6014)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6015 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6016 = this;
  if(this__6016.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__6016.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__6017 = this;
  return cljs.core.peek.call(null, this__6017.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__6018 = this;
  var t__6019 = cljs.core.peek.call(null, this__6018.stack);
  var next_stack__6020 = cljs.core.tree_map_seq_push.call(null, cljs.core.truth_(this__6018.ascending_QMARK_) ? t__6019.right : t__6019.left, cljs.core.pop.call(null, this__6018.stack), this__6018.ascending_QMARK_);
  if(next_stack__6020 != null) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__6020, this__6018.ascending_QMARK_, this__6018.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6021 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6022 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__6022.stack, this__6022.ascending_QMARK_, this__6022.cnt, this__6022.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6023 = this;
  return this__6023.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
void 0;
void 0;
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____6024 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____6024) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____6024
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____6025 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____6025) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____6025
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__6026 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__6026)) {
    return cljs.core.deref.call(null, init__6026)
  }else {
    var init__6027 = node.left != null ? tree_map_kv_reduce.call(null, node.left, f, init__6026) : init__6026;
    if(cljs.core.reduced_QMARK_.call(null, init__6027)) {
      return cljs.core.deref.call(null, init__6027)
    }else {
      var init__6028 = node.right != null ? tree_map_kv_reduce.call(null, node.right, f, init__6027) : init__6027;
      if(cljs.core.reduced_QMARK_.call(null, init__6028)) {
        return cljs.core.deref.call(null, init__6028)
      }else {
        return init__6028
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition3$ = 30;
  this.cljs$lang$protocol_mask$partition1$ = 43;
  this.cljs$lang$protocol_mask$partition0$ = 31;
  this.cljs$lang$protocol_mask$partition2$ = 57
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$ = true;
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6033 = this;
  var h__364__auto____6034 = this__6033.__hash;
  if(h__364__auto____6034 != null) {
    return h__364__auto____6034
  }else {
    var h__364__auto____6035 = cljs.core.hash_coll.call(null, coll);
    this__6033.__hash = h__364__auto____6035;
    return h__364__auto____6035
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$ = true;
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6036 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6037 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6038 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6038.key, this__6038.val]), k, v)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$ = true;
cljs.core.BlackNode.prototype.call = function() {
  var G__6085 = null;
  var G__6085__2 = function(tsym6031, k) {
    var this__6039 = this;
    var tsym6031__6040 = this;
    var node__6041 = tsym6031__6040;
    return cljs.core._lookup.call(null, node__6041, k)
  };
  var G__6085__3 = function(tsym6032, k, not_found) {
    var this__6042 = this;
    var tsym6032__6043 = this;
    var node__6044 = tsym6032__6043;
    return cljs.core._lookup.call(null, node__6044, k, not_found)
  };
  G__6085 = function(tsym6032, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6085__2.call(this, tsym6032, k);
      case 3:
        return G__6085__3.call(this, tsym6032, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6085
}();
cljs.core.BlackNode.prototype.apply = function(tsym6029, args6030) {
  return tsym6029.call.apply(tsym6029, [tsym6029].concat(cljs.core.aclone.call(null, args6030)))
};
cljs.core.BlackNode.prototype.cljs$core$ISequential$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6045 = this;
  return cljs.core.PersistentVector.fromArray([this__6045.key, this__6045.val, o])
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6046 = this;
  return this__6046.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6047 = this;
  return this__6047.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__6048 = this;
  var node__6049 = this;
  return ins.balance_right(node__6049)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__6050 = this;
  var node__6051 = this;
  return new cljs.core.RedNode(this__6050.key, this__6050.val, this__6050.left, this__6050.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__6052 = this;
  var node__6053 = this;
  return cljs.core.balance_right_del.call(null, this__6052.key, this__6052.val, this__6052.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__6054 = this;
  var node__6055 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__6056 = this;
  var node__6057 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6057, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__6058 = this;
  var node__6059 = this;
  return cljs.core.balance_left_del.call(null, this__6058.key, this__6058.val, del, this__6058.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__6060 = this;
  var node__6061 = this;
  return ins.balance_left(node__6061)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__6062 = this;
  var node__6063 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__6063, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__6086 = null;
  var G__6086__0 = function() {
    var this__6066 = this;
    var this$__6067 = this;
    return cljs.core.pr_str.call(null, this$__6067)
  };
  G__6086 = function() {
    switch(arguments.length) {
      case 0:
        return G__6086__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6086
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__6068 = this;
  var node__6069 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6069, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__6070 = this;
  var node__6071 = this;
  return node__6071
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$ = true;
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6072 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6073 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6074 = this;
  return cljs.core.list.call(null, this__6074.key, this__6074.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6076 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$ = true;
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6077 = this;
  return this__6077.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6078 = this;
  return cljs.core.PersistentVector.fromArray([this__6078.key])
};
cljs.core.BlackNode.prototype.cljs$core$IVector$ = true;
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6079 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6079.key, this__6079.val]), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6080 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6081 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6081.key, this__6081.val]), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6082 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6083 = this;
  if(n === 0) {
    return this__6083.key
  }else {
    if(n === 1) {
      return this__6083.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__6084 = this;
  if(n === 0) {
    return this__6084.key
  }else {
    if(n === 1) {
      return this__6084.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__6075 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition3$ = 30;
  this.cljs$lang$protocol_mask$partition1$ = 43;
  this.cljs$lang$protocol_mask$partition0$ = 31;
  this.cljs$lang$protocol_mask$partition2$ = 57
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$ = true;
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6091 = this;
  var h__364__auto____6092 = this__6091.__hash;
  if(h__364__auto____6092 != null) {
    return h__364__auto____6092
  }else {
    var h__364__auto____6093 = cljs.core.hash_coll.call(null, coll);
    this__6091.__hash = h__364__auto____6093;
    return h__364__auto____6093
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$ = true;
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6094 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6095 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6096 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6096.key, this__6096.val]), k, v)
};
cljs.core.RedNode.prototype.cljs$core$IFn$ = true;
cljs.core.RedNode.prototype.call = function() {
  var G__6143 = null;
  var G__6143__2 = function(tsym6089, k) {
    var this__6097 = this;
    var tsym6089__6098 = this;
    var node__6099 = tsym6089__6098;
    return cljs.core._lookup.call(null, node__6099, k)
  };
  var G__6143__3 = function(tsym6090, k, not_found) {
    var this__6100 = this;
    var tsym6090__6101 = this;
    var node__6102 = tsym6090__6101;
    return cljs.core._lookup.call(null, node__6102, k, not_found)
  };
  G__6143 = function(tsym6090, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6143__2.call(this, tsym6090, k);
      case 3:
        return G__6143__3.call(this, tsym6090, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6143
}();
cljs.core.RedNode.prototype.apply = function(tsym6087, args6088) {
  return tsym6087.call.apply(tsym6087, [tsym6087].concat(cljs.core.aclone.call(null, args6088)))
};
cljs.core.RedNode.prototype.cljs$core$ISequential$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6103 = this;
  return cljs.core.PersistentVector.fromArray([this__6103.key, this__6103.val, o])
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6104 = this;
  return this__6104.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6105 = this;
  return this__6105.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__6106 = this;
  var node__6107 = this;
  return new cljs.core.RedNode(this__6106.key, this__6106.val, this__6106.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__6108 = this;
  var node__6109 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__6110 = this;
  var node__6111 = this;
  return new cljs.core.RedNode(this__6110.key, this__6110.val, this__6110.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__6112 = this;
  var node__6113 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__6114 = this;
  var node__6115 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6115, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__6116 = this;
  var node__6117 = this;
  return new cljs.core.RedNode(this__6116.key, this__6116.val, del, this__6116.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__6118 = this;
  var node__6119 = this;
  return new cljs.core.RedNode(this__6118.key, this__6118.val, ins, this__6118.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__6120 = this;
  var node__6121 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6120.left)) {
    return new cljs.core.RedNode(this__6120.key, this__6120.val, this__6120.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__6120.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6120.right)) {
      return new cljs.core.RedNode(this__6120.right.key, this__6120.right.val, new cljs.core.BlackNode(this__6120.key, this__6120.val, this__6120.left, this__6120.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__6120.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__6121, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__6144 = null;
  var G__6144__0 = function() {
    var this__6124 = this;
    var this$__6125 = this;
    return cljs.core.pr_str.call(null, this$__6125)
  };
  G__6144 = function() {
    switch(arguments.length) {
      case 0:
        return G__6144__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6144
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__6126 = this;
  var node__6127 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6126.right)) {
    return new cljs.core.RedNode(this__6126.key, this__6126.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6126.left, null), this__6126.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6126.left)) {
      return new cljs.core.RedNode(this__6126.left.key, this__6126.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6126.left.left, null), new cljs.core.BlackNode(this__6126.key, this__6126.val, this__6126.left.right, this__6126.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6127, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__6128 = this;
  var node__6129 = this;
  return new cljs.core.BlackNode(this__6128.key, this__6128.val, this__6128.left, this__6128.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$ = true;
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6130 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6131 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6132 = this;
  return cljs.core.list.call(null, this__6132.key, this__6132.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$ = true;
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6134 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$ = true;
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6135 = this;
  return this__6135.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6136 = this;
  return cljs.core.PersistentVector.fromArray([this__6136.key])
};
cljs.core.RedNode.prototype.cljs$core$IVector$ = true;
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6137 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6137.key, this__6137.val]), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6138 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6139 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6139.key, this__6139.val]), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6140 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6141 = this;
  if(n === 0) {
    return this__6141.key
  }else {
    if(n === 1) {
      return this__6141.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__6142 = this;
  if(n === 0) {
    return this__6142.key
  }else {
    if(n === 1) {
      return this__6142.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__6133 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__6145 = comp.call(null, k, tree.key);
    if(c__6145 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__6145 < 0) {
        var ins__6146 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(ins__6146 != null) {
          return tree.add_left(ins__6146)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__6147 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(ins__6147 != null) {
            return tree.add_right(ins__6147)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__6148 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6148)) {
            return new cljs.core.RedNode(app__6148.key, app__6148.val, new cljs.core.RedNode(left.key, left.val, left.left, app__6148.left), new cljs.core.RedNode(right.key, right.val, app__6148.right, right.right), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__6148, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__6149 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6149)) {
              return new cljs.core.RedNode(app__6149.key, app__6149.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__6149.left, null), new cljs.core.BlackNode(right.key, right.val, app__6149.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__6149, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(tree != null) {
    var c__6150 = comp.call(null, k, tree.key);
    if(c__6150 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__6150 < 0) {
        var del__6151 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____6152 = del__6151 != null;
          if(or__3824__auto____6152) {
            return or__3824__auto____6152
          }else {
            return found[0] != null
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__6151, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__6151, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__6153 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____6154 = del__6153 != null;
            if(or__3824__auto____6154) {
              return or__3824__auto____6154
            }else {
              return found[0] != null
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__6153)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__6153, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__6155 = tree.key;
  var c__6156 = comp.call(null, k, tk__6155);
  if(c__6156 === 0) {
    return tree.replace(tk__6155, v, tree.left, tree.right)
  }else {
    if(c__6156 < 0) {
      return tree.replace(tk__6155, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__6155, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition3$ = 15;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 15;
  this.cljs$lang$protocol_mask$partition4$ = 6;
  this.cljs$lang$protocol_mask$partition2$ = 24
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6161 = this;
  var h__364__auto____6162 = this__6161.__hash;
  if(h__364__auto____6162 != null) {
    return h__364__auto____6162
  }else {
    var h__364__auto____6163 = cljs.core.hash_imap.call(null, coll);
    this__6161.__hash = h__364__auto____6163;
    return h__364__auto____6163
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6164 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6165 = this;
  var n__6166 = coll.entry_at(k);
  if(n__6166 != null) {
    return n__6166.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6167 = this;
  var found__6168 = [null];
  var t__6169 = cljs.core.tree_map_add.call(null, this__6167.comp, this__6167.tree, k, v, found__6168);
  if(t__6169 == null) {
    var found_node__6170 = cljs.core.nth.call(null, found__6168, 0);
    if(cljs.core._EQ_.call(null, v, found_node__6170.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6167.comp, cljs.core.tree_map_replace.call(null, this__6167.comp, this__6167.tree, k, v), this__6167.cnt, this__6167.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6167.comp, t__6169.blacken(), this__6167.cnt + 1, this__6167.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6171 = this;
  return coll.entry_at(k) != null
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__6203 = null;
  var G__6203__2 = function(tsym6159, k) {
    var this__6172 = this;
    var tsym6159__6173 = this;
    var coll__6174 = tsym6159__6173;
    return cljs.core._lookup.call(null, coll__6174, k)
  };
  var G__6203__3 = function(tsym6160, k, not_found) {
    var this__6175 = this;
    var tsym6160__6176 = this;
    var coll__6177 = tsym6160__6176;
    return cljs.core._lookup.call(null, coll__6177, k, not_found)
  };
  G__6203 = function(tsym6160, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6203__2.call(this, tsym6160, k);
      case 3:
        return G__6203__3.call(this, tsym6160, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6203
}();
cljs.core.PersistentTreeMap.prototype.apply = function(tsym6157, args6158) {
  return tsym6157.call.apply(tsym6157, [tsym6157].concat(cljs.core.aclone.call(null, args6158)))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6178 = this;
  if(this__6178.tree != null) {
    return cljs.core.tree_map_kv_reduce.call(null, this__6178.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6179 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6180 = this;
  if(this__6180.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6180.tree, false, this__6180.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__6181 = this;
  var this$__6182 = this;
  return cljs.core.pr_str.call(null, this$__6182)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__6183 = this;
  var coll__6184 = this;
  var t__6185 = this__6183.tree;
  while(true) {
    if(t__6185 != null) {
      var c__6186 = this__6183.comp.call(null, k, t__6185.key);
      if(c__6186 === 0) {
        return t__6185
      }else {
        if(c__6186 < 0) {
          var G__6204 = t__6185.left;
          t__6185 = G__6204;
          continue
        }else {
          if("\ufdd0'else") {
            var G__6205 = t__6185.right;
            t__6185 = G__6205;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__6187 = this;
  if(this__6187.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6187.tree, ascending_QMARK_, this__6187.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6188 = this;
  if(this__6188.cnt > 0) {
    var stack__6189 = null;
    var t__6190 = this__6188.tree;
    while(true) {
      if(t__6190 != null) {
        var c__6191 = this__6188.comp.call(null, k, t__6190.key);
        if(c__6191 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__6189, t__6190), ascending_QMARK_, -1)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__6191 < 0) {
              var G__6206 = cljs.core.conj.call(null, stack__6189, t__6190);
              var G__6207 = t__6190.left;
              stack__6189 = G__6206;
              t__6190 = G__6207;
              continue
            }else {
              var G__6208 = stack__6189;
              var G__6209 = t__6190.right;
              stack__6189 = G__6208;
              t__6190 = G__6209;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__6191 > 0) {
                var G__6210 = cljs.core.conj.call(null, stack__6189, t__6190);
                var G__6211 = t__6190.right;
                stack__6189 = G__6210;
                t__6190 = G__6211;
                continue
              }else {
                var G__6212 = stack__6189;
                var G__6213 = t__6190.left;
                stack__6189 = G__6212;
                t__6190 = G__6213;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__6189 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__6189, ascending_QMARK_, -1)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__6192 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6193 = this;
  return this__6193.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6194 = this;
  if(this__6194.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6194.tree, true, this__6194.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6195 = this;
  return this__6195.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6196 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6197 = this;
  return new cljs.core.PersistentTreeMap(this__6197.comp, this__6197.tree, this__6197.cnt, meta, this__6197.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6201 = this;
  return this__6201.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6202 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__6202.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6198 = this;
  var found__6199 = [null];
  var t__6200 = cljs.core.tree_map_remove.call(null, this__6198.comp, this__6198.tree, k, found__6199);
  if(t__6200 == null) {
    if(cljs.core.nth.call(null, found__6199, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6198.comp, null, 0, this__6198.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6198.comp, t__6200.blacken(), this__6198.cnt - 1, this__6198.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__6214 = cljs.core.seq.call(null, keyvals);
    var out__6215 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(cljs.core.truth_(in$__6214)) {
        var G__6216 = cljs.core.nnext.call(null, in$__6214);
        var G__6217 = cljs.core.assoc_BANG_.call(null, out__6215, cljs.core.first.call(null, in$__6214), cljs.core.second.call(null, in$__6214));
        in$__6214 = G__6216;
        out__6215 = G__6217;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__6215)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__6218) {
    var keyvals = cljs.core.seq(arglist__6218);
    return hash_map__delegate.call(this, keyvals)
  };
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__6219) {
    var keyvals = cljs.core.seq(arglist__6219);
    return array_map__delegate.call(this, keyvals)
  };
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$__6220 = cljs.core.seq.call(null, keyvals);
    var out__6221 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__6220)) {
        var G__6222 = cljs.core.nnext.call(null, in$__6220);
        var G__6223 = cljs.core.assoc.call(null, out__6221, cljs.core.first.call(null, in$__6220), cljs.core.second.call(null, in$__6220));
        in$__6220 = G__6222;
        out__6221 = G__6223;
        continue
      }else {
        return out__6221
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__6224) {
    var keyvals = cljs.core.seq(arglist__6224);
    return sorted_map__delegate.call(this, keyvals)
  };
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$__6225 = cljs.core.seq.call(null, keyvals);
    var out__6226 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(cljs.core.truth_(in$__6225)) {
        var G__6227 = cljs.core.nnext.call(null, in$__6225);
        var G__6228 = cljs.core.assoc.call(null, out__6226, cljs.core.first.call(null, in$__6225), cljs.core.second.call(null, in$__6225));
        in$__6225 = G__6227;
        out__6226 = G__6228;
        continue
      }else {
        return out__6226
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__6229) {
    var comparator = cljs.core.first(arglist__6229);
    var keyvals = cljs.core.rest(arglist__6229);
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__6230_SHARP_, p2__6231_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____6232 = p1__6230_SHARP_;
          if(cljs.core.truth_(or__3824__auto____6232)) {
            return or__3824__auto____6232
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__6231_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__6233) {
    var maps = cljs.core.seq(arglist__6233);
    return merge__delegate.call(this, maps)
  };
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__6236 = function(m, e) {
        var k__6234 = cljs.core.first.call(null, e);
        var v__6235 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__6234)) {
          return cljs.core.assoc.call(null, m, k__6234, f.call(null, cljs.core.get.call(null, m, k__6234), v__6235))
        }else {
          return cljs.core.assoc.call(null, m, k__6234, v__6235)
        }
      };
      var merge2__6238 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__6236, function() {
          var or__3824__auto____6237 = m1;
          if(cljs.core.truth_(or__3824__auto____6237)) {
            return or__3824__auto____6237
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__6238, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__6239) {
    var f = cljs.core.first(arglist__6239);
    var maps = cljs.core.rest(arglist__6239);
    return merge_with__delegate.call(this, f, maps)
  };
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__6240 = cljs.core.ObjMap.fromObject([], {});
  var keys__6241 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__6241)) {
      var key__6242 = cljs.core.first.call(null, keys__6241);
      var entry__6243 = cljs.core.get.call(null, map, key__6242, "\ufdd0'user/not-found");
      var G__6244 = cljs.core.not_EQ_.call(null, entry__6243, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__6240, key__6242, entry__6243) : ret__6240;
      var G__6245 = cljs.core.next.call(null, keys__6241);
      ret__6240 = G__6244;
      keys__6241 = G__6245;
      continue
    }else {
      return ret__6240
    }
    break
  }
};
void 0;
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition5$ = 1;
  this.cljs$lang$protocol_mask$partition3$ = 14;
  this.cljs$lang$protocol_mask$partition1$ = 17;
  this.cljs$lang$protocol_mask$partition0$ = 15;
  this.cljs$lang$protocol_mask$partition2$ = 24
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6251 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__6251.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6252 = this;
  var h__364__auto____6253 = this__6252.__hash;
  if(h__364__auto____6253 != null) {
    return h__364__auto____6253
  }else {
    var h__364__auto____6254 = cljs.core.hash_iset.call(null, coll);
    this__6252.__hash = h__364__auto____6254;
    return h__364__auto____6254
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6255 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6256 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6256.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__6275 = null;
  var G__6275__2 = function(tsym6249, k) {
    var this__6257 = this;
    var tsym6249__6258 = this;
    var coll__6259 = tsym6249__6258;
    return cljs.core._lookup.call(null, coll__6259, k)
  };
  var G__6275__3 = function(tsym6250, k, not_found) {
    var this__6260 = this;
    var tsym6250__6261 = this;
    var coll__6262 = tsym6250__6261;
    return cljs.core._lookup.call(null, coll__6262, k, not_found)
  };
  G__6275 = function(tsym6250, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6275__2.call(this, tsym6250, k);
      case 3:
        return G__6275__3.call(this, tsym6250, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6275
}();
cljs.core.PersistentHashSet.prototype.apply = function(tsym6247, args6248) {
  return tsym6247.call.apply(tsym6247, [tsym6247].concat(cljs.core.aclone.call(null, args6248)))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6263 = this;
  return new cljs.core.PersistentHashSet(this__6263.meta, cljs.core.assoc.call(null, this__6263.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__6264 = this;
  var this$__6265 = this;
  return cljs.core.pr_str.call(null, this$__6265)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6266 = this;
  return cljs.core.keys.call(null, this__6266.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6267 = this;
  return new cljs.core.PersistentHashSet(this__6267.meta, cljs.core.dissoc.call(null, this__6267.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6268 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6269 = this;
  var and__3822__auto____6270 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____6270) {
    var and__3822__auto____6271 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____6271) {
      return cljs.core.every_QMARK_.call(null, function(p1__6246_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6246_SHARP_)
      }, other)
    }else {
      return and__3822__auto____6271
    }
  }else {
    return and__3822__auto____6270
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6272 = this;
  return new cljs.core.PersistentHashSet(meta, this__6272.hash_map, this__6272.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6273 = this;
  return this__6273.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6274 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__6274.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 3;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition5$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashSet")
};
cljs.core.TransientHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.TransientHashSet.prototype.call = function() {
  var G__6293 = null;
  var G__6293__2 = function(tsym6279, k) {
    var this__6281 = this;
    var tsym6279__6282 = this;
    var tcoll__6283 = tsym6279__6282;
    if(cljs.core._lookup.call(null, this__6281.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__6293__3 = function(tsym6280, k, not_found) {
    var this__6284 = this;
    var tsym6280__6285 = this;
    var tcoll__6286 = tsym6280__6285;
    if(cljs.core._lookup.call(null, this__6284.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__6293 = function(tsym6280, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6293__2.call(this, tsym6280, k);
      case 3:
        return G__6293__3.call(this, tsym6280, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6293
}();
cljs.core.TransientHashSet.prototype.apply = function(tsym6277, args6278) {
  return tsym6277.call.apply(tsym6277, [tsym6277].concat(cljs.core.aclone.call(null, args6278)))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__6287 = this;
  return cljs.core._lookup.call(null, tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__6288 = this;
  if(cljs.core._lookup.call(null, this__6288.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__6289 = this;
  return cljs.core.count.call(null, this__6289.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__6290 = this;
  this__6290.transient_map = cljs.core.dissoc_BANG_.call(null, this__6290.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__6291 = this;
  this__6291.transient_map = cljs.core.assoc_BANG_.call(null, this__6291.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6292 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__6292.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition3$ = 14;
  this.cljs$lang$protocol_mask$partition1$ = 17;
  this.cljs$lang$protocol_mask$partition0$ = 15;
  this.cljs$lang$protocol_mask$partition4$ = 6;
  this.cljs$lang$protocol_mask$partition2$ = 24
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6298 = this;
  var h__364__auto____6299 = this__6298.__hash;
  if(h__364__auto____6299 != null) {
    return h__364__auto____6299
  }else {
    var h__364__auto____6300 = cljs.core.hash_iset.call(null, coll);
    this__6298.__hash = h__364__auto____6300;
    return h__364__auto____6300
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6301 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6302 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6302.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__6326 = null;
  var G__6326__2 = function(tsym6296, k) {
    var this__6303 = this;
    var tsym6296__6304 = this;
    var coll__6305 = tsym6296__6304;
    return cljs.core._lookup.call(null, coll__6305, k)
  };
  var G__6326__3 = function(tsym6297, k, not_found) {
    var this__6306 = this;
    var tsym6297__6307 = this;
    var coll__6308 = tsym6297__6307;
    return cljs.core._lookup.call(null, coll__6308, k, not_found)
  };
  G__6326 = function(tsym6297, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6326__2.call(this, tsym6297, k);
      case 3:
        return G__6326__3.call(this, tsym6297, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6326
}();
cljs.core.PersistentTreeSet.prototype.apply = function(tsym6294, args6295) {
  return tsym6294.call.apply(tsym6294, [tsym6294].concat(cljs.core.aclone.call(null, args6295)))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6309 = this;
  return new cljs.core.PersistentTreeSet(this__6309.meta, cljs.core.assoc.call(null, this__6309.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6310 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__6310.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__6311 = this;
  var this$__6312 = this;
  return cljs.core.pr_str.call(null, this$__6312)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__6313 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__6313.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6314 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__6314.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__6315 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6316 = this;
  return cljs.core._comparator.call(null, this__6316.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6317 = this;
  return cljs.core.keys.call(null, this__6317.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6318 = this;
  return new cljs.core.PersistentTreeSet(this__6318.meta, cljs.core.dissoc.call(null, this__6318.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6319 = this;
  return cljs.core.count.call(null, this__6319.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6320 = this;
  var and__3822__auto____6321 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____6321) {
    var and__3822__auto____6322 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____6322) {
      return cljs.core.every_QMARK_.call(null, function(p1__6276_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6276_SHARP_)
      }, other)
    }else {
      return and__3822__auto____6322
    }
  }else {
    return and__3822__auto____6321
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6323 = this;
  return new cljs.core.PersistentTreeSet(meta, this__6323.tree_map, this__6323.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6324 = this;
  return this__6324.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6325 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__6325.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in$__6327 = cljs.core.seq.call(null, coll);
  var out__6328 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, in$__6327))) {
      var G__6329 = cljs.core.next.call(null, in$__6327);
      var G__6330 = cljs.core.conj_BANG_.call(null, out__6328, cljs.core.first.call(null, in$__6327));
      in$__6327 = G__6329;
      out__6328 = G__6330;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6328)
    }
    break
  }
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__6331) {
    var keys = cljs.core.seq(arglist__6331);
    return sorted_set__delegate.call(this, keys)
  };
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__6333) {
    var comparator = cljs.core.first(arglist__6333);
    var keys = cljs.core.rest(arglist__6333);
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__6334 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____6335 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____6335)) {
        var e__6336 = temp__3971__auto____6335;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__6336))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__6334, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__6332_SHARP_) {
      var temp__3971__auto____6337 = cljs.core.find.call(null, smap, p1__6332_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____6337)) {
        var e__6338 = temp__3971__auto____6337;
        return cljs.core.second.call(null, e__6338)
      }else {
        return p1__6332_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__6346 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__6339, seen) {
        while(true) {
          var vec__6340__6341 = p__6339;
          var f__6342 = cljs.core.nth.call(null, vec__6340__6341, 0, null);
          var xs__6343 = vec__6340__6341;
          var temp__3974__auto____6344 = cljs.core.seq.call(null, xs__6343);
          if(cljs.core.truth_(temp__3974__auto____6344)) {
            var s__6345 = temp__3974__auto____6344;
            if(cljs.core.contains_QMARK_.call(null, seen, f__6342)) {
              var G__6347 = cljs.core.rest.call(null, s__6345);
              var G__6348 = seen;
              p__6339 = G__6347;
              seen = G__6348;
              continue
            }else {
              return cljs.core.cons.call(null, f__6342, step.call(null, cljs.core.rest.call(null, s__6345), cljs.core.conj.call(null, seen, f__6342)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__6346.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__6349 = cljs.core.PersistentVector.fromArray([]);
  var s__6350 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__6350))) {
      var G__6351 = cljs.core.conj.call(null, ret__6349, cljs.core.first.call(null, s__6350));
      var G__6352 = cljs.core.next.call(null, s__6350);
      ret__6349 = G__6351;
      s__6350 = G__6352;
      continue
    }else {
      return cljs.core.seq.call(null, ret__6349)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____6353 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____6353) {
        return or__3824__auto____6353
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__6354 = x.lastIndexOf("/");
      if(i__6354 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__6354 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____6355 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____6355) {
      return or__3824__auto____6355
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__6356 = x.lastIndexOf("/");
    if(i__6356 > -1) {
      return cljs.core.subs.call(null, x, 2, i__6356)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__6359 = cljs.core.ObjMap.fromObject([], {});
  var ks__6360 = cljs.core.seq.call(null, keys);
  var vs__6361 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____6362 = ks__6360;
      if(cljs.core.truth_(and__3822__auto____6362)) {
        return vs__6361
      }else {
        return and__3822__auto____6362
      }
    }())) {
      var G__6363 = cljs.core.assoc.call(null, map__6359, cljs.core.first.call(null, ks__6360), cljs.core.first.call(null, vs__6361));
      var G__6364 = cljs.core.next.call(null, ks__6360);
      var G__6365 = cljs.core.next.call(null, vs__6361);
      map__6359 = G__6363;
      ks__6360 = G__6364;
      vs__6361 = G__6365;
      continue
    }else {
      return map__6359
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__6368__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6357_SHARP_, p2__6358_SHARP_) {
        return max_key.call(null, k, p1__6357_SHARP_, p2__6358_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__6368 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6368__delegate.call(this, k, x, y, more)
    };
    G__6368.cljs$lang$maxFixedArity = 3;
    G__6368.cljs$lang$applyTo = function(arglist__6369) {
      var k = cljs.core.first(arglist__6369);
      var x = cljs.core.first(cljs.core.next(arglist__6369));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6369)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6369)));
      return G__6368__delegate.call(this, k, x, y, more)
    };
    return G__6368
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$4 = max_key__4;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__6370__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6366_SHARP_, p2__6367_SHARP_) {
        return min_key.call(null, k, p1__6366_SHARP_, p2__6367_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__6370 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6370__delegate.call(this, k, x, y, more)
    };
    G__6370.cljs$lang$maxFixedArity = 3;
    G__6370.cljs$lang$applyTo = function(arglist__6371) {
      var k = cljs.core.first(arglist__6371);
      var x = cljs.core.first(cljs.core.next(arglist__6371));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6371)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6371)));
      return G__6370__delegate.call(this, k, x, y, more)
    };
    return G__6370
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$4 = min_key__4;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____6372 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____6372)) {
        var s__6373 = temp__3974__auto____6372;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__6373), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__6373)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____6374 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____6374)) {
      var s__6375 = temp__3974__auto____6374;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__6375)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__6375), take_while.call(null, pred, cljs.core.rest.call(null, s__6375)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__6376 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__6376.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__6377 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____6378 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____6378)) {
        var vec__6379__6380 = temp__3974__auto____6378;
        var e__6381 = cljs.core.nth.call(null, vec__6379__6380, 0, null);
        var s__6382 = vec__6379__6380;
        if(cljs.core.truth_(include__6377.call(null, e__6381))) {
          return s__6382
        }else {
          return cljs.core.next.call(null, s__6382)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6377, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____6383 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____6383)) {
      var vec__6384__6385 = temp__3974__auto____6383;
      var e__6386 = cljs.core.nth.call(null, vec__6384__6385, 0, null);
      var s__6387 = vec__6384__6385;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__6386)) ? s__6387 : cljs.core.next.call(null, s__6387))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__6388 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____6389 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____6389)) {
        var vec__6390__6391 = temp__3974__auto____6389;
        var e__6392 = cljs.core.nth.call(null, vec__6390__6391, 0, null);
        var s__6393 = vec__6390__6391;
        if(cljs.core.truth_(include__6388.call(null, e__6392))) {
          return s__6393
        }else {
          return cljs.core.next.call(null, s__6393)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6388, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____6394 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____6394)) {
      var vec__6395__6396 = temp__3974__auto____6394;
      var e__6397 = cljs.core.nth.call(null, vec__6395__6396, 0, null);
      var s__6398 = vec__6395__6396;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__6397)) ? s__6398 : cljs.core.next.call(null, s__6398))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition3$ = 30;
  this.cljs$lang$protocol_mask$partition0$ = 62;
  this.cljs$lang$protocol_mask$partition2$ = 56
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__6399 = this;
  var h__364__auto____6400 = this__6399.__hash;
  if(h__364__auto____6400 != null) {
    return h__364__auto____6400
  }else {
    var h__364__auto____6401 = cljs.core.hash_coll.call(null, rng);
    this__6399.__hash = h__364__auto____6401;
    return h__364__auto____6401
  }
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__6402 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__6403 = this;
  var this$__6404 = this;
  return cljs.core.pr_str.call(null, this$__6404)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__6405 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__6406 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__6407 = this;
  var comp__6408 = this__6407.step > 0 ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__6408.call(null, this__6407.start, this__6407.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__6409 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng))) {
    return 0
  }else {
    return Math["ceil"]((this__6409.end - this__6409.start) / this__6409.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__6410 = this;
  return this__6410.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__6411 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__6411.meta, this__6411.start + this__6411.step, this__6411.end, this__6411.step, null)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__6412 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__6413 = this;
  return new cljs.core.Range(meta, this__6413.start, this__6413.end, this__6413.step, this__6413.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__6414 = this;
  return this__6414.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__6415 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6415.start + n * this__6415.step
  }else {
    if(function() {
      var and__3822__auto____6416 = this__6415.start > this__6415.end;
      if(and__3822__auto____6416) {
        return this__6415.step === 0
      }else {
        return and__3822__auto____6416
      }
    }()) {
      return this__6415.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__6417 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6417.start + n * this__6417.step
  }else {
    if(function() {
      var and__3822__auto____6418 = this__6417.start > this__6417.end;
      if(and__3822__auto____6418) {
        return this__6417.step === 0
      }else {
        return and__3822__auto____6418
      }
    }()) {
      return this__6417.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__6419 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6419.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____6420 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____6420)) {
      var s__6421 = temp__3974__auto____6420;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__6421), take_nth.call(null, n, cljs.core.drop.call(null, n, s__6421)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____6423 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____6423)) {
      var s__6424 = temp__3974__auto____6423;
      var fst__6425 = cljs.core.first.call(null, s__6424);
      var fv__6426 = f.call(null, fst__6425);
      var run__6427 = cljs.core.cons.call(null, fst__6425, cljs.core.take_while.call(null, function(p1__6422_SHARP_) {
        return cljs.core._EQ_.call(null, fv__6426, f.call(null, p1__6422_SHARP_))
      }, cljs.core.next.call(null, s__6424)));
      return cljs.core.cons.call(null, run__6427, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__6427), s__6424))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {})), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____6438 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____6438)) {
        var s__6439 = temp__3971__auto____6438;
        return reductions.call(null, f, cljs.core.first.call(null, s__6439), cljs.core.rest.call(null, s__6439))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____6440 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____6440)) {
        var s__6441 = temp__3974__auto____6440;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__6441)), cljs.core.rest.call(null, s__6441))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__6443 = null;
      var G__6443__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__6443__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__6443__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__6443__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__6443__4 = function() {
        var G__6444__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__6444 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6444__delegate.call(this, x, y, z, args)
        };
        G__6444.cljs$lang$maxFixedArity = 3;
        G__6444.cljs$lang$applyTo = function(arglist__6445) {
          var x = cljs.core.first(arglist__6445);
          var y = cljs.core.first(cljs.core.next(arglist__6445));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6445)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6445)));
          return G__6444__delegate.call(this, x, y, z, args)
        };
        return G__6444
      }();
      G__6443 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6443__0.call(this);
          case 1:
            return G__6443__1.call(this, x);
          case 2:
            return G__6443__2.call(this, x, y);
          case 3:
            return G__6443__3.call(this, x, y, z);
          default:
            return G__6443__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6443.cljs$lang$maxFixedArity = 3;
      G__6443.cljs$lang$applyTo = G__6443__4.cljs$lang$applyTo;
      return G__6443
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__6446 = null;
      var G__6446__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__6446__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__6446__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__6446__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__6446__4 = function() {
        var G__6447__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__6447 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6447__delegate.call(this, x, y, z, args)
        };
        G__6447.cljs$lang$maxFixedArity = 3;
        G__6447.cljs$lang$applyTo = function(arglist__6448) {
          var x = cljs.core.first(arglist__6448);
          var y = cljs.core.first(cljs.core.next(arglist__6448));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6448)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6448)));
          return G__6447__delegate.call(this, x, y, z, args)
        };
        return G__6447
      }();
      G__6446 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6446__0.call(this);
          case 1:
            return G__6446__1.call(this, x);
          case 2:
            return G__6446__2.call(this, x, y);
          case 3:
            return G__6446__3.call(this, x, y, z);
          default:
            return G__6446__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6446.cljs$lang$maxFixedArity = 3;
      G__6446.cljs$lang$applyTo = G__6446__4.cljs$lang$applyTo;
      return G__6446
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__6449 = null;
      var G__6449__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__6449__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__6449__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__6449__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__6449__4 = function() {
        var G__6450__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__6450 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6450__delegate.call(this, x, y, z, args)
        };
        G__6450.cljs$lang$maxFixedArity = 3;
        G__6450.cljs$lang$applyTo = function(arglist__6451) {
          var x = cljs.core.first(arglist__6451);
          var y = cljs.core.first(cljs.core.next(arglist__6451));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6451)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6451)));
          return G__6450__delegate.call(this, x, y, z, args)
        };
        return G__6450
      }();
      G__6449 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6449__0.call(this);
          case 1:
            return G__6449__1.call(this, x);
          case 2:
            return G__6449__2.call(this, x, y);
          case 3:
            return G__6449__3.call(this, x, y, z);
          default:
            return G__6449__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6449.cljs$lang$maxFixedArity = 3;
      G__6449.cljs$lang$applyTo = G__6449__4.cljs$lang$applyTo;
      return G__6449
    }()
  };
  var juxt__4 = function() {
    var G__6452__delegate = function(f, g, h, fs) {
      var fs__6442 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__6453 = null;
        var G__6453__0 = function() {
          return cljs.core.reduce.call(null, function(p1__6428_SHARP_, p2__6429_SHARP_) {
            return cljs.core.conj.call(null, p1__6428_SHARP_, p2__6429_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__6442)
        };
        var G__6453__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__6430_SHARP_, p2__6431_SHARP_) {
            return cljs.core.conj.call(null, p1__6430_SHARP_, p2__6431_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__6442)
        };
        var G__6453__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__6432_SHARP_, p2__6433_SHARP_) {
            return cljs.core.conj.call(null, p1__6432_SHARP_, p2__6433_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__6442)
        };
        var G__6453__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__6434_SHARP_, p2__6435_SHARP_) {
            return cljs.core.conj.call(null, p1__6434_SHARP_, p2__6435_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__6442)
        };
        var G__6453__4 = function() {
          var G__6454__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__6436_SHARP_, p2__6437_SHARP_) {
              return cljs.core.conj.call(null, p1__6436_SHARP_, cljs.core.apply.call(null, p2__6437_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__6442)
          };
          var G__6454 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__6454__delegate.call(this, x, y, z, args)
          };
          G__6454.cljs$lang$maxFixedArity = 3;
          G__6454.cljs$lang$applyTo = function(arglist__6455) {
            var x = cljs.core.first(arglist__6455);
            var y = cljs.core.first(cljs.core.next(arglist__6455));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6455)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6455)));
            return G__6454__delegate.call(this, x, y, z, args)
          };
          return G__6454
        }();
        G__6453 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__6453__0.call(this);
            case 1:
              return G__6453__1.call(this, x);
            case 2:
              return G__6453__2.call(this, x, y);
            case 3:
              return G__6453__3.call(this, x, y, z);
            default:
              return G__6453__4.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__6453.cljs$lang$maxFixedArity = 3;
        G__6453.cljs$lang$applyTo = G__6453__4.cljs$lang$applyTo;
        return G__6453
      }()
    };
    var G__6452 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6452__delegate.call(this, f, g, h, fs)
    };
    G__6452.cljs$lang$maxFixedArity = 3;
    G__6452.cljs$lang$applyTo = function(arglist__6456) {
      var f = cljs.core.first(arglist__6456);
      var g = cljs.core.first(cljs.core.next(arglist__6456));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6456)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6456)));
      return G__6452__delegate.call(this, f, g, h, fs)
    };
    return G__6452
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$4 = juxt__4;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__6458 = cljs.core.next.call(null, coll);
        coll = G__6458;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____6457 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3822__auto____6457)) {
          return n > 0
        }else {
          return and__3822__auto____6457
        }
      }())) {
        var G__6459 = n - 1;
        var G__6460 = cljs.core.next.call(null, coll);
        n = G__6459;
        coll = G__6460;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__6461 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__6461), s)) {
    if(cljs.core.count.call(null, matches__6461) === 1) {
      return cljs.core.first.call(null, matches__6461)
    }else {
      return cljs.core.vec.call(null, matches__6461)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__6462 = re.exec(s);
  if(matches__6462 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__6462) === 1) {
      return cljs.core.first.call(null, matches__6462)
    }else {
      return cljs.core.vec.call(null, matches__6462)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__6463 = cljs.core.re_find.call(null, re, s);
  var match_idx__6464 = s.search(re);
  var match_str__6465 = cljs.core.coll_QMARK_.call(null, match_data__6463) ? cljs.core.first.call(null, match_data__6463) : match_data__6463;
  var post_match__6466 = cljs.core.subs.call(null, s, match_idx__6464 + cljs.core.count.call(null, match_str__6465));
  if(cljs.core.truth_(match_data__6463)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__6463, re_seq.call(null, re, post_match__6466))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__6468__6469 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___6470 = cljs.core.nth.call(null, vec__6468__6469, 0, null);
  var flags__6471 = cljs.core.nth.call(null, vec__6468__6469, 1, null);
  var pattern__6472 = cljs.core.nth.call(null, vec__6468__6469, 2, null);
  return new RegExp(pattern__6472, flags__6471)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__6467_SHARP_) {
    return print_one.call(null, p1__6467_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____6473 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3822__auto____6473)) {
            var and__3822__auto____6477 = function() {
              var G__6474__6475 = obj;
              if(G__6474__6475 != null) {
                if(function() {
                  var or__3824__auto____6476 = G__6474__6475.cljs$lang$protocol_mask$partition2$ & 8;
                  if(or__3824__auto____6476) {
                    return or__3824__auto____6476
                  }else {
                    return G__6474__6475.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__6474__6475.cljs$lang$protocol_mask$partition2$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6474__6475)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6474__6475)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____6477)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____6477
            }
          }else {
            return and__3822__auto____6473
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, function() {
          var G__6478__6479 = obj;
          if(G__6478__6479 != null) {
            if(function() {
              var or__3824__auto____6480 = G__6478__6479.cljs$lang$protocol_mask$partition4$ & 8;
              if(or__3824__auto____6480) {
                return or__3824__auto____6480
              }else {
                return G__6478__6479.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__6478__6479.cljs$lang$protocol_mask$partition4$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6478__6479)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6478__6479)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(function() {
          var and__3822__auto____6481 = obj != null;
          if(and__3822__auto____6481) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____6481
          }
        }()) ? obj.cljs$lang$ctorPrSeq(obj) : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__6482 = cljs.core.first.call(null, objs);
  var sb__6483 = new goog.string.StringBuffer;
  var G__6484__6485 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6484__6485)) {
    var obj__6486 = cljs.core.first.call(null, G__6484__6485);
    var G__6484__6487 = G__6484__6485;
    while(true) {
      if(obj__6486 === first_obj__6482) {
      }else {
        sb__6483.append(" ")
      }
      var G__6488__6489 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6486, opts));
      if(cljs.core.truth_(G__6488__6489)) {
        var string__6490 = cljs.core.first.call(null, G__6488__6489);
        var G__6488__6491 = G__6488__6489;
        while(true) {
          sb__6483.append(string__6490);
          var temp__3974__auto____6492 = cljs.core.next.call(null, G__6488__6491);
          if(cljs.core.truth_(temp__3974__auto____6492)) {
            var G__6488__6493 = temp__3974__auto____6492;
            var G__6496 = cljs.core.first.call(null, G__6488__6493);
            var G__6497 = G__6488__6493;
            string__6490 = G__6496;
            G__6488__6491 = G__6497;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____6494 = cljs.core.next.call(null, G__6484__6487);
      if(cljs.core.truth_(temp__3974__auto____6494)) {
        var G__6484__6495 = temp__3974__auto____6494;
        var G__6498 = cljs.core.first.call(null, G__6484__6495);
        var G__6499 = G__6484__6495;
        obj__6486 = G__6498;
        G__6484__6487 = G__6499;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__6483
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__6500 = cljs.core.pr_sb.call(null, objs, opts);
  sb__6500.append("\n");
  return[cljs.core.str(sb__6500)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__6501 = cljs.core.first.call(null, objs);
  var G__6502__6503 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6502__6503)) {
    var obj__6504 = cljs.core.first.call(null, G__6502__6503);
    var G__6502__6505 = G__6502__6503;
    while(true) {
      if(obj__6504 === first_obj__6501) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__6506__6507 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6504, opts));
      if(cljs.core.truth_(G__6506__6507)) {
        var string__6508 = cljs.core.first.call(null, G__6506__6507);
        var G__6506__6509 = G__6506__6507;
        while(true) {
          cljs.core.string_print.call(null, string__6508);
          var temp__3974__auto____6510 = cljs.core.next.call(null, G__6506__6509);
          if(cljs.core.truth_(temp__3974__auto____6510)) {
            var G__6506__6511 = temp__3974__auto____6510;
            var G__6514 = cljs.core.first.call(null, G__6506__6511);
            var G__6515 = G__6506__6511;
            string__6508 = G__6514;
            G__6506__6509 = G__6515;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____6512 = cljs.core.next.call(null, G__6502__6505);
      if(cljs.core.truth_(temp__3974__auto____6512)) {
        var G__6502__6513 = temp__3974__auto____6512;
        var G__6516 = cljs.core.first.call(null, G__6502__6513);
        var G__6517 = G__6502__6513;
        obj__6504 = G__6516;
        G__6502__6505 = G__6517;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__6518) {
    var objs = cljs.core.seq(arglist__6518);
    return pr_str__delegate.call(this, objs)
  };
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__6519) {
    var objs = cljs.core.seq(arglist__6519);
    return prn_str__delegate.call(this, objs)
  };
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__6520) {
    var objs = cljs.core.seq(arglist__6520);
    return pr__delegate.call(this, objs)
  };
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__6521) {
    var objs = cljs.core.seq(arglist__6521);
    return cljs_core_print__delegate.call(this, objs)
  };
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__6522) {
    var objs = cljs.core.seq(arglist__6522);
    return print_str__delegate.call(this, objs)
  };
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__6523) {
    var objs = cljs.core.seq(arglist__6523);
    return println__delegate.call(this, objs)
  };
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__6524) {
    var objs = cljs.core.seq(arglist__6524);
    return println_str__delegate.call(this, objs)
  };
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__6525) {
    var objs = cljs.core.seq(arglist__6525);
    return prn__delegate.call(this, objs)
  };
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6526 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6526, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6527 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6527, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6528 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6528, "{", ", ", "}", opts, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____6529 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____6529)) {
        var nspc__6530 = temp__3974__auto____6529;
        return[cljs.core.str(nspc__6530), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____6531 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____6531)) {
          var nspc__6532 = temp__3974__auto____6531;
          return[cljs.core.str(nspc__6532), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6533 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6533, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6534 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6534, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 0;
  this.cljs$lang$protocol_mask$partition3$ = 6;
  this.cljs$lang$protocol_mask$partition4$ = 40;
  this.cljs$lang$protocol_mask$partition2$ = 10
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__6535 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__6536 = this;
  var G__6537__6538 = cljs.core.seq.call(null, this__6536.watches);
  if(cljs.core.truth_(G__6537__6538)) {
    var G__6540__6542 = cljs.core.first.call(null, G__6537__6538);
    var vec__6541__6543 = G__6540__6542;
    var key__6544 = cljs.core.nth.call(null, vec__6541__6543, 0, null);
    var f__6545 = cljs.core.nth.call(null, vec__6541__6543, 1, null);
    var G__6537__6546 = G__6537__6538;
    var G__6540__6547 = G__6540__6542;
    var G__6537__6548 = G__6537__6546;
    while(true) {
      var vec__6549__6550 = G__6540__6547;
      var key__6551 = cljs.core.nth.call(null, vec__6549__6550, 0, null);
      var f__6552 = cljs.core.nth.call(null, vec__6549__6550, 1, null);
      var G__6537__6553 = G__6537__6548;
      f__6552.call(null, key__6551, this$, oldval, newval);
      var temp__3974__auto____6554 = cljs.core.next.call(null, G__6537__6553);
      if(cljs.core.truth_(temp__3974__auto____6554)) {
        var G__6537__6555 = temp__3974__auto____6554;
        var G__6562 = cljs.core.first.call(null, G__6537__6555);
        var G__6563 = G__6537__6555;
        G__6540__6547 = G__6562;
        G__6537__6548 = G__6563;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__6556 = this;
  return this$.watches = cljs.core.assoc.call(null, this__6556.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__6557 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__6557.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__6558 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__6558.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__6559 = this;
  return this__6559.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__6560 = this;
  return this__6560.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__6561 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__6570__delegate = function(x, p__6564) {
      var map__6565__6566 = p__6564;
      var map__6565__6567 = cljs.core.seq_QMARK_.call(null, map__6565__6566) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6565__6566) : map__6565__6566;
      var validator__6568 = cljs.core.get.call(null, map__6565__6567, "\ufdd0'validator");
      var meta__6569 = cljs.core.get.call(null, map__6565__6567, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__6569, validator__6568, null)
    };
    var G__6570 = function(x, var_args) {
      var p__6564 = null;
      if(goog.isDef(var_args)) {
        p__6564 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6570__delegate.call(this, x, p__6564)
    };
    G__6570.cljs$lang$maxFixedArity = 1;
    G__6570.cljs$lang$applyTo = function(arglist__6571) {
      var x = cljs.core.first(arglist__6571);
      var p__6564 = cljs.core.rest(arglist__6571);
      return G__6570__delegate.call(this, x, p__6564)
    };
    return G__6570
  }();
  atom = function(x, var_args) {
    var p__6564 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$2 = atom__2;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____6572 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____6572)) {
    var validate__6573 = temp__3974__auto____6572;
    if(cljs.core.truth_(validate__6573.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 5832))))].join(""));
    }
  }else {
  }
  var old_value__6574 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__6574, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__6575__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__6575 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__6575__delegate.call(this, a, f, x, y, z, more)
    };
    G__6575.cljs$lang$maxFixedArity = 5;
    G__6575.cljs$lang$applyTo = function(arglist__6576) {
      var a = cljs.core.first(arglist__6576);
      var f = cljs.core.first(cljs.core.next(arglist__6576));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6576)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6576))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6576)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6576)))));
      return G__6575__delegate.call(this, a, f, x, y, z, more)
    };
    return G__6575
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$6 = swap_BANG___6;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__6577) {
    var iref = cljs.core.first(arglist__6577);
    var f = cljs.core.first(cljs.core.next(arglist__6577));
    var args = cljs.core.rest(cljs.core.next(arglist__6577));
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 0;
  this.cljs$lang$protocol_mask$partition4$ = 16;
  this.cljs$lang$protocol_mask$partition2$ = 2
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__6578 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__6578.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__6579 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__6579.state, function(p__6580) {
    var curr_state__6581 = p__6580;
    var curr_state__6582 = cljs.core.seq_QMARK_.call(null, curr_state__6581) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__6581) : curr_state__6581;
    var done__6583 = cljs.core.get.call(null, curr_state__6582, "\ufdd0'done");
    if(cljs.core.truth_(done__6583)) {
      return curr_state__6582
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__6579.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__6584__6585 = options;
    var map__6584__6586 = cljs.core.seq_QMARK_.call(null, map__6584__6585) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6584__6585) : map__6584__6585;
    var keywordize_keys__6587 = cljs.core.get.call(null, map__6584__6586, "\ufdd0'keywordize-keys");
    var keyfn__6588 = cljs.core.truth_(keywordize_keys__6587) ? cljs.core.keyword : cljs.core.str;
    var f__6594 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__593__auto____6593 = function iter__6589(s__6590) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__6590__6591 = s__6590;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__6590__6591))) {
                        var k__6592 = cljs.core.first.call(null, s__6590__6591);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__6588.call(null, k__6592), thisfn.call(null, x[k__6592])]), iter__6589.call(null, cljs.core.rest.call(null, s__6590__6591)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__593__auto____6593.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__6594.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__6595) {
    var x = cljs.core.first(arglist__6595);
    var options = cljs.core.rest(arglist__6595);
    return js__GT_clj__delegate.call(this, x, options)
  };
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__6596 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__6600__delegate = function(args) {
      var temp__3971__auto____6597 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__6596), args);
      if(cljs.core.truth_(temp__3971__auto____6597)) {
        var v__6598 = temp__3971__auto____6597;
        return v__6598
      }else {
        var ret__6599 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__6596, cljs.core.assoc, args, ret__6599);
        return ret__6599
      }
    };
    var G__6600 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6600__delegate.call(this, args)
    };
    G__6600.cljs$lang$maxFixedArity = 0;
    G__6600.cljs$lang$applyTo = function(arglist__6601) {
      var args = cljs.core.seq(arglist__6601);
      return G__6600__delegate.call(this, args)
    };
    return G__6600
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__6602 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__6602)) {
        var G__6603 = ret__6602;
        f = G__6603;
        continue
      }else {
        return ret__6602
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__6604__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__6604 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6604__delegate.call(this, f, args)
    };
    G__6604.cljs$lang$maxFixedArity = 1;
    G__6604.cljs$lang$applyTo = function(arglist__6605) {
      var f = cljs.core.first(arglist__6605);
      var args = cljs.core.rest(arglist__6605);
      return G__6604__delegate.call(this, f, args)
    };
    return G__6604
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$2 = trampoline__2;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__6606 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__6606, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__6606, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____6607 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____6607) {
      return or__3824__auto____6607
    }else {
      var or__3824__auto____6608 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(or__3824__auto____6608) {
        return or__3824__auto____6608
      }else {
        var and__3822__auto____6609 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____6609) {
          var and__3822__auto____6610 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____6610) {
            var and__3822__auto____6611 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____6611) {
              var ret__6612 = true;
              var i__6613 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____6614 = cljs.core.not.call(null, ret__6612);
                  if(or__3824__auto____6614) {
                    return or__3824__auto____6614
                  }else {
                    return i__6613 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__6612
                }else {
                  var G__6615 = isa_QMARK_.call(null, h, child.call(null, i__6613), parent.call(null, i__6613));
                  var G__6616 = i__6613 + 1;
                  ret__6612 = G__6615;
                  i__6613 = G__6616;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____6611
            }
          }else {
            return and__3822__auto____6610
          }
        }else {
          return and__3822__auto____6609
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6116))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6120))))].join(""));
    }
    var tp__6620 = "\ufdd0'parents".call(null, h);
    var td__6621 = "\ufdd0'descendants".call(null, h);
    var ta__6622 = "\ufdd0'ancestors".call(null, h);
    var tf__6623 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____6624 = cljs.core.contains_QMARK_.call(null, tp__6620.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__6622.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__6622.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__6620, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__6623.call(null, "\ufdd0'ancestors".call(null, h), tag, td__6621, parent, ta__6622), "\ufdd0'descendants":tf__6623.call(null, "\ufdd0'descendants".call(null, h), parent, ta__6622, tag, td__6621)})
    }();
    if(cljs.core.truth_(or__3824__auto____6624)) {
      return or__3824__auto____6624
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__6625 = "\ufdd0'parents".call(null, h);
    var childsParents__6626 = cljs.core.truth_(parentMap__6625.call(null, tag)) ? cljs.core.disj.call(null, parentMap__6625.call(null, tag), parent) : cljs.core.set([]);
    var newParents__6627 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__6626)) ? cljs.core.assoc.call(null, parentMap__6625, tag, childsParents__6626) : cljs.core.dissoc.call(null, parentMap__6625, tag);
    var deriv_seq__6628 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__6617_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__6617_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__6617_SHARP_), cljs.core.second.call(null, p1__6617_SHARP_)))
    }, cljs.core.seq.call(null, newParents__6627)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__6625.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__6618_SHARP_, p2__6619_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__6618_SHARP_, p2__6619_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__6628))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__6629 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____6631 = cljs.core.truth_(function() {
    var and__3822__auto____6630 = xprefs__6629;
    if(cljs.core.truth_(and__3822__auto____6630)) {
      return xprefs__6629.call(null, y)
    }else {
      return and__3822__auto____6630
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____6631)) {
    return or__3824__auto____6631
  }else {
    var or__3824__auto____6633 = function() {
      var ps__6632 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__6632) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__6632), prefer_table))) {
          }else {
          }
          var G__6636 = cljs.core.rest.call(null, ps__6632);
          ps__6632 = G__6636;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____6633)) {
      return or__3824__auto____6633
    }else {
      var or__3824__auto____6635 = function() {
        var ps__6634 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__6634) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__6634), y, prefer_table))) {
            }else {
            }
            var G__6637 = cljs.core.rest.call(null, ps__6634);
            ps__6634 = G__6637;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____6635)) {
        return or__3824__auto____6635
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____6638 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____6638)) {
    return or__3824__auto____6638
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__6647 = cljs.core.reduce.call(null, function(be, p__6639) {
    var vec__6640__6641 = p__6639;
    var k__6642 = cljs.core.nth.call(null, vec__6640__6641, 0, null);
    var ___6643 = cljs.core.nth.call(null, vec__6640__6641, 1, null);
    var e__6644 = vec__6640__6641;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__6642)) {
      var be2__6646 = cljs.core.truth_(function() {
        var or__3824__auto____6645 = be == null;
        if(or__3824__auto____6645) {
          return or__3824__auto____6645
        }else {
          return cljs.core.dominates.call(null, k__6642, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__6644 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__6646), k__6642, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__6642), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__6646)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__6646
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__6647)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__6647));
      return cljs.core.second.call(null, best_entry__6647)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
void 0;
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____6648 = mf;
    if(and__3822__auto____6648) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____6648
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____6649 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6649) {
        return or__3824__auto____6649
      }else {
        var or__3824__auto____6650 = cljs.core._reset["_"];
        if(or__3824__auto____6650) {
          return or__3824__auto____6650
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____6651 = mf;
    if(and__3822__auto____6651) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____6651
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3824__auto____6652 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6652) {
        return or__3824__auto____6652
      }else {
        var or__3824__auto____6653 = cljs.core._add_method["_"];
        if(or__3824__auto____6653) {
          return or__3824__auto____6653
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____6654 = mf;
    if(and__3822__auto____6654) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____6654
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____6655 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6655) {
        return or__3824__auto____6655
      }else {
        var or__3824__auto____6656 = cljs.core._remove_method["_"];
        if(or__3824__auto____6656) {
          return or__3824__auto____6656
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____6657 = mf;
    if(and__3822__auto____6657) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____6657
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3824__auto____6658 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6658) {
        return or__3824__auto____6658
      }else {
        var or__3824__auto____6659 = cljs.core._prefer_method["_"];
        if(or__3824__auto____6659) {
          return or__3824__auto____6659
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____6660 = mf;
    if(and__3822__auto____6660) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____6660
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____6661 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6661) {
        return or__3824__auto____6661
      }else {
        var or__3824__auto____6662 = cljs.core._get_method["_"];
        if(or__3824__auto____6662) {
          return or__3824__auto____6662
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____6663 = mf;
    if(and__3822__auto____6663) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____6663
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____6664 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6664) {
        return or__3824__auto____6664
      }else {
        var or__3824__auto____6665 = cljs.core._methods["_"];
        if(or__3824__auto____6665) {
          return or__3824__auto____6665
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____6666 = mf;
    if(and__3822__auto____6666) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____6666
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____6667 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6667) {
        return or__3824__auto____6667
      }else {
        var or__3824__auto____6668 = cljs.core._prefers["_"];
        if(or__3824__auto____6668) {
          return or__3824__auto____6668
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____6669 = mf;
    if(and__3822__auto____6669) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____6669
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3824__auto____6670 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6670) {
        return or__3824__auto____6670
      }else {
        var or__3824__auto____6671 = cljs.core._dispatch["_"];
        if(or__3824__auto____6671) {
          return or__3824__auto____6671
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__6672 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__6673 = cljs.core._get_method.call(null, mf, dispatch_val__6672);
  if(cljs.core.truth_(target_fn__6673)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__6672)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__6673, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 0;
  this.cljs$lang$protocol_mask$partition3$ = 4;
  this.cljs$lang$protocol_mask$partition6$ = 1
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__6674 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__6675 = this;
  cljs.core.swap_BANG_.call(null, this__6675.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6675.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6675.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6675.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__6676 = this;
  cljs.core.swap_BANG_.call(null, this__6676.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__6676.method_cache, this__6676.method_table, this__6676.cached_hierarchy, this__6676.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__6677 = this;
  cljs.core.swap_BANG_.call(null, this__6677.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__6677.method_cache, this__6677.method_table, this__6677.cached_hierarchy, this__6677.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__6678 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__6678.cached_hierarchy), cljs.core.deref.call(null, this__6678.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__6678.method_cache, this__6678.method_table, this__6678.cached_hierarchy, this__6678.hierarchy)
  }
  var temp__3971__auto____6679 = cljs.core.deref.call(null, this__6678.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____6679)) {
    var target_fn__6680 = temp__3971__auto____6679;
    return target_fn__6680
  }else {
    var temp__3971__auto____6681 = cljs.core.find_and_cache_best_method.call(null, this__6678.name, dispatch_val, this__6678.hierarchy, this__6678.method_table, this__6678.prefer_table, this__6678.method_cache, this__6678.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____6681)) {
      var target_fn__6682 = temp__3971__auto____6681;
      return target_fn__6682
    }else {
      return cljs.core.deref.call(null, this__6678.method_table).call(null, this__6678.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__6683 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__6683.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__6683.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__6683.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__6683.method_cache, this__6683.method_table, this__6683.cached_hierarchy, this__6683.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__6684 = this;
  return cljs.core.deref.call(null, this__6684.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__6685 = this;
  return cljs.core.deref.call(null, this__6685.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__6686 = this;
  return cljs.core.do_dispatch.call(null, mf, this__6686.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__6687__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__6687 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__6687__delegate.call(this, _, args)
  };
  G__6687.cljs$lang$maxFixedArity = 1;
  G__6687.cljs$lang$applyTo = function(arglist__6688) {
    var _ = cljs.core.first(arglist__6688);
    var args = cljs.core.rest(arglist__6688);
    return G__6687__delegate.call(this, _, args)
  };
  return G__6687
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape.call(null, match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0'else") {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$1 = join__1;
  join.cljs$lang$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__6689 = s;
      var limit__6690 = limit;
      var parts__6691 = cljs.core.PersistentVector.fromArray([]);
      while(true) {
        if(cljs.core._EQ_.call(null, limit__6690, 1)) {
          return cljs.core.conj.call(null, parts__6691, s__6689)
        }else {
          var temp__3971__auto____6692 = cljs.core.re_find.call(null, re, s__6689);
          if(cljs.core.truth_(temp__3971__auto____6692)) {
            var m__6693 = temp__3971__auto____6692;
            var index__6694 = s__6689.indexOf(m__6693);
            var G__6695 = s__6689.substring(index__6694 + cljs.core.count.call(null, m__6693));
            var G__6696 = limit__6690 - 1;
            var G__6697 = cljs.core.conj.call(null, parts__6691, s__6689.substring(0, index__6694));
            s__6689 = G__6695;
            limit__6690 = G__6696;
            parts__6691 = G__6697;
            continue
          }else {
            return cljs.core.conj.call(null, parts__6691, s__6689)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  split.cljs$lang$arity$2 = split__2;
  split.cljs$lang$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim.call(null, s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft.call(null, s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight.call(null, s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index__6698 = s.length;
  while(true) {
    if(index__6698 === 0) {
      return""
    }else {
      var ch__6699 = cljs.core.get.call(null, s, index__6698 - 1);
      if(function() {
        var or__3824__auto____6700 = cljs.core._EQ_.call(null, ch__6699, "\n");
        if(or__3824__auto____6700) {
          return or__3824__auto____6700
        }else {
          return cljs.core._EQ_.call(null, ch__6699, "\r")
        }
      }()) {
        var G__6701 = index__6698 - 1;
        index__6698 = G__6701;
        continue
      }else {
        return s.substring(0, index__6698)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__6702 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____6703 = cljs.core.not.call(null, s__6702);
    if(or__3824__auto____6703) {
      return or__3824__auto____6703
    }else {
      var or__3824__auto____6704 = cljs.core._EQ_.call(null, "", s__6702);
      if(or__3824__auto____6704) {
        return or__3824__auto____6704
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__6702)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__6705 = new goog.string.StringBuffer;
  var length__6706 = s.length;
  var index__6707 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__6706, index__6707)) {
      return buffer__6705.toString()
    }else {
      var ch__6708 = s.charAt(index__6707);
      var temp__3971__auto____6709 = cljs.core.get.call(null, cmap, ch__6708);
      if(cljs.core.truth_(temp__3971__auto____6709)) {
        var replacement__6710 = temp__3971__auto____6709;
        buffer__6705.append([cljs.core.str(replacement__6710)].join(""))
      }else {
        buffer__6705.append(ch__6708)
      }
      var G__6711 = index__6707 + 1;
      index__6707 = G__6711;
      continue
    }
    break
  }
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isVersion("9"), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isVersion("9") || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            element[key] = val
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc;
  if(goog.userAgent.WEBKIT) {
    doc = frame.document || frame.contentWindow.document
  }else {
    doc = frame.contentDocument || frame.contentWindow.document
  }
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    for(var i = 0, child;child = root.childNodes[i];i++) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.userAgent.IE) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("crate.core");
goog.require("cljs.core");
goog.require("goog.dom");
goog.require("clojure.string");
crate.core.xmlns = cljs.core.ObjMap.fromObject(["\ufdd0'xhtml", "\ufdd0'svg"], {"\ufdd0'xhtml":"http://www.w3.org/1999/xhtml", "\ufdd0'svg":"http://www.w3.org/2000/svg"});
void 0;
crate.core.group_id = cljs.core.atom.call(null, 0);
crate.core.dom_attr = function() {
  var dom_attr = null;
  var dom_attr__2 = function(elem, attrs) {
    if(cljs.core.truth_(elem)) {
      if(cljs.core.not.call(null, cljs.core.map_QMARK_.call(null, attrs))) {
        return elem.getAttribute(cljs.core.name.call(null, attrs))
      }else {
        var G__6712__6713 = cljs.core.seq.call(null, attrs);
        if(cljs.core.truth_(G__6712__6713)) {
          var G__6715__6717 = cljs.core.first.call(null, G__6712__6713);
          var vec__6716__6718 = G__6715__6717;
          var k__6719 = cljs.core.nth.call(null, vec__6716__6718, 0, null);
          var v__6720 = cljs.core.nth.call(null, vec__6716__6718, 1, null);
          var G__6712__6721 = G__6712__6713;
          var G__6715__6722 = G__6715__6717;
          var G__6712__6723 = G__6712__6721;
          while(true) {
            var vec__6724__6725 = G__6715__6722;
            var k__6726 = cljs.core.nth.call(null, vec__6724__6725, 0, null);
            var v__6727 = cljs.core.nth.call(null, vec__6724__6725, 1, null);
            var G__6712__6728 = G__6712__6723;
            dom_attr.call(null, elem, k__6726, v__6727);
            var temp__3974__auto____6729 = cljs.core.next.call(null, G__6712__6728);
            if(cljs.core.truth_(temp__3974__auto____6729)) {
              var G__6712__6730 = temp__3974__auto____6729;
              var G__6731 = cljs.core.first.call(null, G__6712__6730);
              var G__6732 = G__6712__6730;
              G__6715__6722 = G__6731;
              G__6712__6723 = G__6732;
              continue
            }else {
            }
            break
          }
        }else {
        }
        return elem
      }
    }else {
      return null
    }
  };
  var dom_attr__3 = function(elem, k, v) {
    elem.setAttribute(cljs.core.name.call(null, k), v);
    return elem
  };
  dom_attr = function(elem, k, v) {
    switch(arguments.length) {
      case 2:
        return dom_attr__2.call(this, elem, k);
      case 3:
        return dom_attr__3.call(this, elem, k, v)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dom_attr.cljs$lang$arity$2 = dom_attr__2;
  dom_attr.cljs$lang$arity$3 = dom_attr__3;
  return dom_attr
}();
crate.core.as_content = function as_content(parent, content) {
  var G__6733__6734 = cljs.core.seq.call(null, content);
  if(cljs.core.truth_(G__6733__6734)) {
    var c__6735 = cljs.core.first.call(null, G__6733__6734);
    var G__6733__6736 = G__6733__6734;
    while(true) {
      var child__6737 = c__6735 == null ? null : cljs.core.map_QMARK_.call(null, c__6735) ? function() {
        throw"Maps cannot be used as content";
      }() : cljs.core.string_QMARK_.call(null, c__6735) ? goog.dom.createTextNode.call(null, c__6735) : cljs.core.vector_QMARK_.call(null, c__6735) ? crate.core.elem_factory.call(null, c__6735) : cljs.core.seq_QMARK_.call(null, c__6735) ? as_content.call(null, parent, c__6735) : cljs.core.truth_(c__6735.nodeName) ? c__6735 : null;
      if(cljs.core.truth_(child__6737)) {
        goog.dom.appendChild.call(null, parent, child__6737)
      }else {
      }
      var temp__3974__auto____6738 = cljs.core.next.call(null, G__6733__6736);
      if(cljs.core.truth_(temp__3974__auto____6738)) {
        var G__6733__6739 = temp__3974__auto____6738;
        var G__6740 = cljs.core.first.call(null, G__6733__6739);
        var G__6741 = G__6733__6739;
        c__6735 = G__6740;
        G__6733__6736 = G__6741;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
crate.core.re_tag = /([^\s\.#]+)(?:#([^\s\.#]+))?(?:\.([^\s#]+))?/;
crate.core.normalize_element = function normalize_element(p__6743) {
  var vec__6744__6745 = p__6743;
  var tag__6746 = cljs.core.nth.call(null, vec__6744__6745, 0, null);
  var content__6747 = cljs.core.nthnext.call(null, vec__6744__6745, 1);
  if(cljs.core.not.call(null, function() {
    var or__3824__auto____6748 = cljs.core.keyword_QMARK_.call(null, tag__6746);
    if(or__3824__auto____6748) {
      return or__3824__auto____6748
    }else {
      var or__3824__auto____6749 = cljs.core.symbol_QMARK_.call(null, tag__6746);
      if(or__3824__auto____6749) {
        return or__3824__auto____6749
      }else {
        return cljs.core.string_QMARK_.call(null, tag__6746)
      }
    }
  }())) {
    throw[cljs.core.str(tag__6746), cljs.core.str(" is not a valid tag name.")].join("");
  }else {
  }
  var vec__6750__6752 = cljs.core.re_matches.call(null, crate.core.re_tag, cljs.core.name.call(null, tag__6746));
  var ___6753 = cljs.core.nth.call(null, vec__6750__6752, 0, null);
  var tag__6754 = cljs.core.nth.call(null, vec__6750__6752, 1, null);
  var id__6755 = cljs.core.nth.call(null, vec__6750__6752, 2, null);
  var class$__6756 = cljs.core.nth.call(null, vec__6750__6752, 3, null);
  var vec__6751__6763 = function() {
    var vec__6757__6758 = clojure.string.split.call(null, tag__6754, /:/);
    var nsp__6759 = cljs.core.nth.call(null, vec__6757__6758, 0, null);
    var t__6760 = cljs.core.nth.call(null, vec__6757__6758, 1, null);
    var ns_xmlns__6761 = crate.core.xmlns.call(null, cljs.core.keyword.call(null, nsp__6759));
    if(cljs.core.truth_(t__6760)) {
      return cljs.core.PersistentVector.fromArray([function() {
        var or__3824__auto____6762 = ns_xmlns__6761;
        if(cljs.core.truth_(or__3824__auto____6762)) {
          return or__3824__auto____6762
        }else {
          return nsp__6759
        }
      }(), t__6760])
    }else {
      return cljs.core.PersistentVector.fromArray(["\ufdd0'xhtml".call(null, crate.core.xmlns), nsp__6759])
    }
  }();
  var nsp__6764 = cljs.core.nth.call(null, vec__6751__6763, 0, null);
  var tag__6765 = cljs.core.nth.call(null, vec__6751__6763, 1, null);
  var tag_attrs__6767 = cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), cljs.core.filter.call(null, function(p1__6742_SHARP_) {
    return cljs.core.not.call(null, cljs.core.second.call(null, p1__6742_SHARP_) == null)
  }, cljs.core.ObjMap.fromObject(["\ufdd0'id", "\ufdd0'class"], {"\ufdd0'id":function() {
    var or__3824__auto____6766 = id__6755;
    if(cljs.core.truth_(or__3824__auto____6766)) {
      return or__3824__auto____6766
    }else {
      return null
    }
  }(), "\ufdd0'class":cljs.core.truth_(class$__6756) ? clojure.string.replace.call(null, class$__6756, /\./, " ") : null})));
  var map_attrs__6768 = cljs.core.first.call(null, content__6747);
  if(cljs.core.map_QMARK_.call(null, map_attrs__6768)) {
    return cljs.core.PersistentVector.fromArray([nsp__6764, tag__6765, cljs.core.merge.call(null, tag_attrs__6767, map_attrs__6768), cljs.core.next.call(null, content__6747)])
  }else {
    return cljs.core.PersistentVector.fromArray([nsp__6764, tag__6765, tag_attrs__6767, content__6747])
  }
};
crate.core.parse_content = function parse_content(elem, content) {
  var attrs__6769 = cljs.core.first.call(null, content);
  if(cljs.core.map_QMARK_.call(null, attrs__6769)) {
    crate.core.dom_attr.call(null, elem, attrs__6769);
    return cljs.core.rest.call(null, content)
  }else {
    return content
  }
};
crate.core.create_elem = cljs.core.truth_(document.createElementNS) ? function(nsp, tag) {
  return document.createElementNS(nsp, tag)
} : function(_, tag) {
  return document.createElement(tag)
};
crate.core.elem_factory = function elem_factory(tag_def) {
  var vec__6770__6771 = crate.core.normalize_element.call(null, tag_def);
  var nsp__6772 = cljs.core.nth.call(null, vec__6770__6771, 0, null);
  var tag__6773 = cljs.core.nth.call(null, vec__6770__6771, 1, null);
  var attrs__6774 = cljs.core.nth.call(null, vec__6770__6771, 2, null);
  var content__6775 = cljs.core.nth.call(null, vec__6770__6771, 3, null);
  var elem__6776 = crate.core.create_elem.call(null, nsp__6772, tag__6773);
  crate.core.dom_attr.call(null, elem__6776, attrs__6774);
  crate.core.as_content.call(null, elem__6776, content__6775);
  return elem__6776
};
crate.core.html = function() {
  var html__delegate = function(tags) {
    var res__6777 = cljs.core.map.call(null, crate.core.elem_factory, tags);
    if(cljs.core.truth_(cljs.core.second.call(null, res__6777))) {
      return res__6777
    }else {
      return cljs.core.first.call(null, res__6777)
    }
  };
  var html = function(var_args) {
    var tags = null;
    if(goog.isDef(var_args)) {
      tags = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return html__delegate.call(this, tags)
  };
  html.cljs$lang$maxFixedArity = 0;
  html.cljs$lang$applyTo = function(arglist__6778) {
    var tags = cljs.core.seq(arglist__6778);
    return html__delegate.call(this, tags)
  };
  return html
}();
goog.provide("jayq.util");
goog.require("cljs.core");
jayq.util.map__GT_js = function map__GT_js(m) {
  var out__6875 = {};
  var G__6876__6877 = cljs.core.seq.call(null, m);
  if(cljs.core.truth_(G__6876__6877)) {
    var G__6879__6881 = cljs.core.first.call(null, G__6876__6877);
    var vec__6880__6882 = G__6879__6881;
    var k__6883 = cljs.core.nth.call(null, vec__6880__6882, 0, null);
    var v__6884 = cljs.core.nth.call(null, vec__6880__6882, 1, null);
    var G__6876__6885 = G__6876__6877;
    var G__6879__6886 = G__6879__6881;
    var G__6876__6887 = G__6876__6885;
    while(true) {
      var vec__6888__6889 = G__6879__6886;
      var k__6890 = cljs.core.nth.call(null, vec__6888__6889, 0, null);
      var v__6891 = cljs.core.nth.call(null, vec__6888__6889, 1, null);
      var G__6876__6892 = G__6876__6887;
      out__6875[cljs.core.name.call(null, k__6890)] = v__6891;
      var temp__3974__auto____6893 = cljs.core.next.call(null, G__6876__6892);
      if(cljs.core.truth_(temp__3974__auto____6893)) {
        var G__6876__6894 = temp__3974__auto____6893;
        var G__6895 = cljs.core.first.call(null, G__6876__6894);
        var G__6896 = G__6876__6894;
        G__6879__6886 = G__6895;
        G__6876__6887 = G__6896;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return out__6875
};
jayq.util.wait = function wait(ms, func) {
  return setTimeout(func, ms)
};
jayq.util.log = function() {
  var log__delegate = function(v, text) {
    var vs__6897 = cljs.core.string_QMARK_.call(null, v) ? cljs.core.apply.call(null, cljs.core.str, v, text) : v;
    return console.log(vs__6897)
  };
  var log = function(v, var_args) {
    var text = null;
    if(goog.isDef(var_args)) {
      text = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return log__delegate.call(this, v, text)
  };
  log.cljs$lang$maxFixedArity = 1;
  log.cljs$lang$applyTo = function(arglist__6898) {
    var v = cljs.core.first(arglist__6898);
    var text = cljs.core.rest(arglist__6898);
    return log__delegate.call(this, v, text)
  };
  return log
}();
jayq.util.clj__GT_js = function clj__GT_js(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      return cljs.core.name.call(null, x)
    }else {
      if(cljs.core.map_QMARK_.call(null, x)) {
        return cljs.core.reduce.call(null, function(m, p__6899) {
          var vec__6900__6901 = p__6899;
          var k__6902 = cljs.core.nth.call(null, vec__6900__6901, 0, null);
          var v__6903 = cljs.core.nth.call(null, vec__6900__6901, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__6902), clj__GT_js.call(null, v__6903))
        }, cljs.core.ObjMap.fromObject([], {}), x).strobj
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, clj__GT_js, x))
        }else {
          if("\ufdd0'else") {
            return x
          }else {
            return null
          }
        }
      }
    }
  }
};
goog.provide("jayq.core");
goog.require("cljs.core");
goog.require("jayq.util");
goog.require("clojure.string");
jayq.core.crate_meta = function crate_meta(func) {
  return func.prototype._crateGroup
};
jayq.core.__GT_selector = function __GT_selector(sel) {
  if(cljs.core.string_QMARK_.call(null, sel)) {
    return sel
  }else {
    if(cljs.core.fn_QMARK_.call(null, sel)) {
      var temp__3971__auto____6779 = jayq.core.crate_meta.call(null, sel);
      if(cljs.core.truth_(temp__3971__auto____6779)) {
        var cm__6780 = temp__3971__auto____6779;
        return[cljs.core.str("[crateGroup="), cljs.core.str(cm__6780), cljs.core.str("]")].join("")
      }else {
        return sel
      }
    }else {
      if(cljs.core.keyword_QMARK_.call(null, sel)) {
        return cljs.core.name.call(null, sel)
      }else {
        if("\ufdd0'else") {
          return sel
        }else {
          return null
        }
      }
    }
  }
};
jayq.core.$ = function() {
  var $__delegate = function(sel, p__6781) {
    var vec__6782__6783 = p__6781;
    var context__6784 = cljs.core.nth.call(null, vec__6782__6783, 0, null);
    if(cljs.core.not.call(null, context__6784)) {
      return jQuery(jayq.core.__GT_selector.call(null, sel))
    }else {
      return jQuery(jayq.core.__GT_selector.call(null, sel), context__6784)
    }
  };
  var $ = function(sel, var_args) {
    var p__6781 = null;
    if(goog.isDef(var_args)) {
      p__6781 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return $__delegate.call(this, sel, p__6781)
  };
  $.cljs$lang$maxFixedArity = 1;
  $.cljs$lang$applyTo = function(arglist__6785) {
    var sel = cljs.core.first(arglist__6785);
    var p__6781 = cljs.core.rest(arglist__6785);
    return $__delegate.call(this, sel, p__6781)
  };
  return $
}();
jQuery.prototype.cljs$core$IReduce$ = true;
jQuery.prototype.cljs$core$IReduce$_reduce$arity$2 = function(this$, f) {
  return cljs.core.ci_reduce.call(null, jayq.core.coll, f, cljs.core.first.call(null, this$), cljs.core.count.call(null, this$))
};
jQuery.prototype.cljs$core$IReduce$_reduce$arity$3 = function(this$, f, start) {
  return cljs.core.ci_reduce.call(null, jayq.core.coll, f, start, jayq.core.i)
};
jQuery.prototype.cljs$core$ILookup$ = true;
jQuery.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this$, k) {
  var or__3824__auto____6786 = this$.slice(k, k + 1);
  if(cljs.core.truth_(or__3824__auto____6786)) {
    return or__3824__auto____6786
  }else {
    return null
  }
};
jQuery.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this$, k, not_found) {
  return cljs.core._nth.call(null, this$, k, not_found)
};
jQuery.prototype.cljs$core$ISequential$ = true;
jQuery.prototype.cljs$core$IIndexed$ = true;
jQuery.prototype.cljs$core$IIndexed$_nth$arity$2 = function(this$, n) {
  if(n < cljs.core.count.call(null, this$)) {
    return this$.slice(n, n + 1)
  }else {
    return null
  }
};
jQuery.prototype.cljs$core$IIndexed$_nth$arity$3 = function(this$, n, not_found) {
  if(n < cljs.core.count.call(null, this$)) {
    return this$.slice(n, n + 1)
  }else {
    if(void 0 === not_found) {
      return null
    }else {
      return not_found
    }
  }
};
jQuery.prototype.cljs$core$ICounted$ = true;
jQuery.prototype.cljs$core$ICounted$_count$arity$1 = function(this$) {
  return this$.size()
};
jQuery.prototype.cljs$core$ISeq$ = true;
jQuery.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  return this$.get(0)
};
jQuery.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  if(cljs.core.count.call(null, this$) > 1) {
    return this$.slice(1)
  }else {
    return cljs.core.list.call(null)
  }
};
jQuery.prototype.cljs$core$ISeqable$ = true;
jQuery.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  if(cljs.core.truth_(this$.get(0))) {
    return this$
  }else {
    return null
  }
};
jQuery.prototype.call = function() {
  var G__6787 = null;
  var G__6787__2 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__6787__3 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__6787 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6787__2.call(this, _, k);
      case 3:
        return G__6787__3.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6787
}();
jayq.core.anim = function anim(elem, props, dur) {
  return elem.animate(jayq.util.clj__GT_js.call(null, props), dur)
};
jayq.core.text = function text($elem, txt) {
  return $elem.text(txt)
};
jayq.core.css = function css($elem, opts) {
  if(cljs.core.keyword_QMARK_.call(null, opts)) {
    return $elem.css(cljs.core.name.call(null, opts))
  }else {
    return $elem.css(jayq.util.clj__GT_js.call(null, opts))
  }
};
jayq.core.attr = function() {
  var attr__delegate = function($elem, a, p__6788) {
    var vec__6789__6790 = p__6788;
    var v__6791 = cljs.core.nth.call(null, vec__6789__6790, 0, null);
    var a__6792 = cljs.core.name.call(null, a);
    if(cljs.core.not.call(null, v__6791)) {
      return $elem.attr(a__6792)
    }else {
      return $elem.attr(a__6792, v__6791)
    }
  };
  var attr = function($elem, a, var_args) {
    var p__6788 = null;
    if(goog.isDef(var_args)) {
      p__6788 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return attr__delegate.call(this, $elem, a, p__6788)
  };
  attr.cljs$lang$maxFixedArity = 2;
  attr.cljs$lang$applyTo = function(arglist__6793) {
    var $elem = cljs.core.first(arglist__6793);
    var a = cljs.core.first(cljs.core.next(arglist__6793));
    var p__6788 = cljs.core.rest(cljs.core.next(arglist__6793));
    return attr__delegate.call(this, $elem, a, p__6788)
  };
  return attr
}();
jayq.core.data = function() {
  var data__delegate = function($elem, k, p__6794) {
    var vec__6795__6796 = p__6794;
    var v__6797 = cljs.core.nth.call(null, vec__6795__6796, 0, null);
    var k__6798 = cljs.core.name.call(null, k);
    if(cljs.core.not.call(null, v__6797)) {
      return $elem.data(k__6798)
    }else {
      return $elem.data(k__6798, v__6797)
    }
  };
  var data = function($elem, k, var_args) {
    var p__6794 = null;
    if(goog.isDef(var_args)) {
      p__6794 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return data__delegate.call(this, $elem, k, p__6794)
  };
  data.cljs$lang$maxFixedArity = 2;
  data.cljs$lang$applyTo = function(arglist__6799) {
    var $elem = cljs.core.first(arglist__6799);
    var k = cljs.core.first(cljs.core.next(arglist__6799));
    var p__6794 = cljs.core.rest(cljs.core.next(arglist__6799));
    return data__delegate.call(this, $elem, k, p__6794)
  };
  return data
}();
jayq.core.position = function position($elem) {
  return cljs.core.js__GT_clj.call(null, $elem.position(), "\ufdd0'keywordize-keys", true)
};
jayq.core.add_class = function add_class($elem, cl) {
  var cl__6800 = cljs.core.name.call(null, cl);
  return $elem.addClass(cl__6800)
};
jayq.core.remove_class = function remove_class($elem, cl) {
  var cl__6801 = cljs.core.name.call(null, cl);
  return $elem.removeClass(cl__6801)
};
jayq.core.append = function append($elem, content) {
  return $elem.append(content)
};
jayq.core.prepend = function prepend($elem, content) {
  return $elem.prepend(content)
};
jayq.core.remove = function remove($elem) {
  return $elem.remove()
};
jayq.core.hide = function() {
  var hide__delegate = function($elem, p__6802) {
    var vec__6803__6804 = p__6802;
    var speed__6805 = cljs.core.nth.call(null, vec__6803__6804, 0, null);
    var on_finish__6806 = cljs.core.nth.call(null, vec__6803__6804, 1, null);
    return $elem.hide(speed__6805, on_finish__6806)
  };
  var hide = function($elem, var_args) {
    var p__6802 = null;
    if(goog.isDef(var_args)) {
      p__6802 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return hide__delegate.call(this, $elem, p__6802)
  };
  hide.cljs$lang$maxFixedArity = 1;
  hide.cljs$lang$applyTo = function(arglist__6807) {
    var $elem = cljs.core.first(arglist__6807);
    var p__6802 = cljs.core.rest(arglist__6807);
    return hide__delegate.call(this, $elem, p__6802)
  };
  return hide
}();
jayq.core.show = function() {
  var show__delegate = function($elem, p__6808) {
    var vec__6809__6810 = p__6808;
    var speed__6811 = cljs.core.nth.call(null, vec__6809__6810, 0, null);
    var on_finish__6812 = cljs.core.nth.call(null, vec__6809__6810, 1, null);
    return $elem.show(speed__6811, on_finish__6812)
  };
  var show = function($elem, var_args) {
    var p__6808 = null;
    if(goog.isDef(var_args)) {
      p__6808 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return show__delegate.call(this, $elem, p__6808)
  };
  show.cljs$lang$maxFixedArity = 1;
  show.cljs$lang$applyTo = function(arglist__6813) {
    var $elem = cljs.core.first(arglist__6813);
    var p__6808 = cljs.core.rest(arglist__6813);
    return show__delegate.call(this, $elem, p__6808)
  };
  return show
}();
jayq.core.toggle = function() {
  var toggle__delegate = function($elem, p__6814) {
    var vec__6815__6816 = p__6814;
    var speed__6817 = cljs.core.nth.call(null, vec__6815__6816, 0, null);
    var on_finish__6818 = cljs.core.nth.call(null, vec__6815__6816, 1, null);
    return $elem.toggle(speed__6817, on_finish__6818)
  };
  var toggle = function($elem, var_args) {
    var p__6814 = null;
    if(goog.isDef(var_args)) {
      p__6814 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return toggle__delegate.call(this, $elem, p__6814)
  };
  toggle.cljs$lang$maxFixedArity = 1;
  toggle.cljs$lang$applyTo = function(arglist__6819) {
    var $elem = cljs.core.first(arglist__6819);
    var p__6814 = cljs.core.rest(arglist__6819);
    return toggle__delegate.call(this, $elem, p__6814)
  };
  return toggle
}();
jayq.core.fade_out = function() {
  var fade_out__delegate = function($elem, p__6820) {
    var vec__6821__6822 = p__6820;
    var speed__6823 = cljs.core.nth.call(null, vec__6821__6822, 0, null);
    var on_finish__6824 = cljs.core.nth.call(null, vec__6821__6822, 1, null);
    return $elem.fadeOut(speed__6823, on_finish__6824)
  };
  var fade_out = function($elem, var_args) {
    var p__6820 = null;
    if(goog.isDef(var_args)) {
      p__6820 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_out__delegate.call(this, $elem, p__6820)
  };
  fade_out.cljs$lang$maxFixedArity = 1;
  fade_out.cljs$lang$applyTo = function(arglist__6825) {
    var $elem = cljs.core.first(arglist__6825);
    var p__6820 = cljs.core.rest(arglist__6825);
    return fade_out__delegate.call(this, $elem, p__6820)
  };
  return fade_out
}();
jayq.core.fade_in = function() {
  var fade_in__delegate = function($elem, p__6826) {
    var vec__6827__6828 = p__6826;
    var speed__6829 = cljs.core.nth.call(null, vec__6827__6828, 0, null);
    var on_finish__6830 = cljs.core.nth.call(null, vec__6827__6828, 1, null);
    return $elem.fadeIn(speed__6829, on_finish__6830)
  };
  var fade_in = function($elem, var_args) {
    var p__6826 = null;
    if(goog.isDef(var_args)) {
      p__6826 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_in__delegate.call(this, $elem, p__6826)
  };
  fade_in.cljs$lang$maxFixedArity = 1;
  fade_in.cljs$lang$applyTo = function(arglist__6831) {
    var $elem = cljs.core.first(arglist__6831);
    var p__6826 = cljs.core.rest(arglist__6831);
    return fade_in__delegate.call(this, $elem, p__6826)
  };
  return fade_in
}();
jayq.core.slide_up = function() {
  var slide_up__delegate = function($elem, p__6832) {
    var vec__6833__6834 = p__6832;
    var speed__6835 = cljs.core.nth.call(null, vec__6833__6834, 0, null);
    var on_finish__6836 = cljs.core.nth.call(null, vec__6833__6834, 1, null);
    return $elem.slideUp(speed__6835, on_finish__6836)
  };
  var slide_up = function($elem, var_args) {
    var p__6832 = null;
    if(goog.isDef(var_args)) {
      p__6832 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_up__delegate.call(this, $elem, p__6832)
  };
  slide_up.cljs$lang$maxFixedArity = 1;
  slide_up.cljs$lang$applyTo = function(arglist__6837) {
    var $elem = cljs.core.first(arglist__6837);
    var p__6832 = cljs.core.rest(arglist__6837);
    return slide_up__delegate.call(this, $elem, p__6832)
  };
  return slide_up
}();
jayq.core.slide_down = function() {
  var slide_down__delegate = function($elem, p__6838) {
    var vec__6839__6840 = p__6838;
    var speed__6841 = cljs.core.nth.call(null, vec__6839__6840, 0, null);
    var on_finish__6842 = cljs.core.nth.call(null, vec__6839__6840, 1, null);
    return $elem.slideDown(speed__6841, on_finish__6842)
  };
  var slide_down = function($elem, var_args) {
    var p__6838 = null;
    if(goog.isDef(var_args)) {
      p__6838 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_down__delegate.call(this, $elem, p__6838)
  };
  slide_down.cljs$lang$maxFixedArity = 1;
  slide_down.cljs$lang$applyTo = function(arglist__6843) {
    var $elem = cljs.core.first(arglist__6843);
    var p__6838 = cljs.core.rest(arglist__6843);
    return slide_down__delegate.call(this, $elem, p__6838)
  };
  return slide_down
}();
jayq.core.parent = function parent($elem) {
  return $elem.parent()
};
jayq.core.find = function find($elem, selector) {
  return $elem.find(cljs.core.name.call(null, selector))
};
jayq.core.clone = function clone($elem) {
  return $elem.clone()
};
jayq.core.inner = function inner($elem, v) {
  return $elem.html(v)
};
jayq.core.empty = function empty($elem) {
  return $elem.empty()
};
jayq.core.val = function() {
  var val__delegate = function($elem, p__6844) {
    var vec__6845__6846 = p__6844;
    var v__6847 = cljs.core.nth.call(null, vec__6845__6846, 0, null);
    if(cljs.core.truth_(v__6847)) {
      return $elem.val(v__6847)
    }else {
      return $elem.val()
    }
  };
  var val = function($elem, var_args) {
    var p__6844 = null;
    if(goog.isDef(var_args)) {
      p__6844 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return val__delegate.call(this, $elem, p__6844)
  };
  val.cljs$lang$maxFixedArity = 1;
  val.cljs$lang$applyTo = function(arglist__6848) {
    var $elem = cljs.core.first(arglist__6848);
    var p__6844 = cljs.core.rest(arglist__6848);
    return val__delegate.call(this, $elem, p__6844)
  };
  return val
}();
jayq.core.queue = function queue($elem, callback) {
  return $elem.queue(callback)
};
jayq.core.dequeue = function dequeue(elem) {
  return jayq.core.$.call(null, elem).dequeue()
};
jayq.core.document_ready = function document_ready(func) {
  return jayq.core.$.call(null, document).ready(func)
};
jayq.core.xhr = function xhr(p__6849, content, callback) {
  var vec__6850__6851 = p__6849;
  var method__6852 = cljs.core.nth.call(null, vec__6850__6851, 0, null);
  var uri__6853 = cljs.core.nth.call(null, vec__6850__6851, 1, null);
  var params__6854 = jayq.util.clj__GT_js.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'type", "\ufdd0'data", "\ufdd0'success"], {"\ufdd0'type":clojure.string.upper_case.call(null, cljs.core.name.call(null, method__6852)), "\ufdd0'data":jayq.util.clj__GT_js.call(null, content), "\ufdd0'success":callback}));
  return jQuery.ajax(uri__6853, params__6854)
};
jayq.core.bind = function bind($elem, ev, func) {
  return $elem.bind(cljs.core.name.call(null, ev), func)
};
jayq.core.trigger = function trigger($elem, ev) {
  return $elem.trigger(cljs.core.name.call(null, ev))
};
jayq.core.delegate = function delegate($elem, sel, ev, func) {
  return $elem.delegate(jayq.core.__GT_selector.call(null, sel), cljs.core.name.call(null, ev), func)
};
jayq.core.__GT_event = function __GT_event(e) {
  if(cljs.core.keyword_QMARK_.call(null, e)) {
    return cljs.core.name.call(null, e)
  }else {
    if(cljs.core.map_QMARK_.call(null, e)) {
      return jayq.util.clj__GT_js.call(null, e)
    }else {
      if(cljs.core.coll_QMARK_.call(null, e)) {
        return clojure.string.join.call(null, " ", cljs.core.map.call(null, cljs.core.name, e))
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Unknown event type: "), cljs.core.str(e)].join(""));
        }else {
          return null
        }
      }
    }
  }
};
jayq.core.on = function() {
  var on__delegate = function($elem, events, p__6855) {
    var vec__6856__6857 = p__6855;
    var sel__6858 = cljs.core.nth.call(null, vec__6856__6857, 0, null);
    var data__6859 = cljs.core.nth.call(null, vec__6856__6857, 1, null);
    var handler__6860 = cljs.core.nth.call(null, vec__6856__6857, 2, null);
    return $elem.on(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__6858), data__6859, handler__6860)
  };
  var on = function($elem, events, var_args) {
    var p__6855 = null;
    if(goog.isDef(var_args)) {
      p__6855 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return on__delegate.call(this, $elem, events, p__6855)
  };
  on.cljs$lang$maxFixedArity = 2;
  on.cljs$lang$applyTo = function(arglist__6861) {
    var $elem = cljs.core.first(arglist__6861);
    var events = cljs.core.first(cljs.core.next(arglist__6861));
    var p__6855 = cljs.core.rest(cljs.core.next(arglist__6861));
    return on__delegate.call(this, $elem, events, p__6855)
  };
  return on
}();
jayq.core.one = function() {
  var one__delegate = function($elem, events, p__6862) {
    var vec__6863__6864 = p__6862;
    var sel__6865 = cljs.core.nth.call(null, vec__6863__6864, 0, null);
    var data__6866 = cljs.core.nth.call(null, vec__6863__6864, 1, null);
    var handler__6867 = cljs.core.nth.call(null, vec__6863__6864, 2, null);
    return $elem.one(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__6865), data__6866, handler__6867)
  };
  var one = function($elem, events, var_args) {
    var p__6862 = null;
    if(goog.isDef(var_args)) {
      p__6862 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return one__delegate.call(this, $elem, events, p__6862)
  };
  one.cljs$lang$maxFixedArity = 2;
  one.cljs$lang$applyTo = function(arglist__6868) {
    var $elem = cljs.core.first(arglist__6868);
    var events = cljs.core.first(cljs.core.next(arglist__6868));
    var p__6862 = cljs.core.rest(cljs.core.next(arglist__6868));
    return one__delegate.call(this, $elem, events, p__6862)
  };
  return one
}();
jayq.core.off = function() {
  var off__delegate = function($elem, events, p__6869) {
    var vec__6870__6871 = p__6869;
    var sel__6872 = cljs.core.nth.call(null, vec__6870__6871, 0, null);
    var handler__6873 = cljs.core.nth.call(null, vec__6870__6871, 1, null);
    return $elem.off(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__6872), handler__6873)
  };
  var off = function($elem, events, var_args) {
    var p__6869 = null;
    if(goog.isDef(var_args)) {
      p__6869 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return off__delegate.call(this, $elem, events, p__6869)
  };
  off.cljs$lang$maxFixedArity = 2;
  off.cljs$lang$applyTo = function(arglist__6874) {
    var $elem = cljs.core.first(arglist__6874);
    var events = cljs.core.first(cljs.core.next(arglist__6874));
    var p__6869 = cljs.core.rest(cljs.core.next(arglist__6874));
    return off__delegate.call(this, $elem, events, p__6869)
  };
  return off
}();
jayq.core.prevent = function prevent(e) {
  return e.preventDefault()
};
goog.provide("grid.core");
goog.require("cljs.core");
goog.require("jayq.core");
goog.require("crate.core");
goog.require("clojure.string");
grid.core.debug_QMARK_ = false;
grid.core.dirs = cljs.core.ObjMap.fromObject(["\ufdd0'user/right", "\ufdd0'user/left", "\ufdd0'user/down", "\ufdd0'user/up"], {"\ufdd0'user/right":cljs.core.PersistentVector.fromArray([1, 0]), "\ufdd0'user/left":cljs.core.PersistentVector.fromArray([-1, 0]), "\ufdd0'user/down":cljs.core.PersistentVector.fromArray([0, 1]), "\ufdd0'user/up":cljs.core.PersistentVector.fromArray([0, -1])});
grid.core.comps = cljs.core.ObjMap.fromObject(["\ufdd0'user/lt", "\ufdd0'user/gt", "\ufdd0'user/eq"], {"\ufdd0'user/lt":cljs.core._LT_, "\ufdd0'user/gt":cljs.core._GT_, "\ufdd0'user/eq":cljs.core._EQ_});
grid.core.ariths = cljs.core.ObjMap.fromObject(["\ufdd0'user/add", "\ufdd0'user/sub", "\ufdd0'user/mul", "\ufdd0'user/mod", "\ufdd0'user/quo"], {"\ufdd0'user/add":cljs.core._PLUS_, "\ufdd0'user/sub":cljs.core._, "\ufdd0'user/mul":cljs.core._STAR_, "\ufdd0'user/mod":cljs.core.mod, "\ufdd0'user/quo":cljs.core.quot});
grid.core.refls = cljs.core.ObjMap.fromObject(["\ufdd0'user/diag-pri", "\ufdd0'user/diag-sec", "\ufdd0'user/vertical", "\ufdd0'user/horizontal", "\ufdd0'user/bounce"], {"\ufdd0'user/diag-pri":function refls(p__4270) {
  var vec__4271__4272 = p__4270;
  var dx__4273 = cljs.core.nth.call(null, vec__4271__4272, 0, null);
  var dy__4274 = cljs.core.nth.call(null, vec__4271__4272, 1, null);
  return cljs.core.PersistentVector.fromArray([dy__4274, dx__4273])
}, "\ufdd0'user/diag-sec":function refls(p__4275) {
  var vec__4276__4277 = p__4275;
  var dx__4278 = cljs.core.nth.call(null, vec__4276__4277, 0, null);
  var dy__4279 = cljs.core.nth.call(null, vec__4276__4277, 1, null);
  return cljs.core.PersistentVector.fromArray([-dy__4279, -dx__4278])
}, "\ufdd0'user/vertical":function refls(p__4280) {
  var vec__4281__4282 = p__4280;
  var dx__4283 = cljs.core.nth.call(null, vec__4281__4282, 0, null);
  var dy__4284 = cljs.core.nth.call(null, vec__4281__4282, 1, null);
  return cljs.core.PersistentVector.fromArray([-dx__4283, dy__4284])
}, "\ufdd0'user/horizontal":function refls(p__4285) {
  var vec__4286__4287 = p__4285;
  var dx__4288 = cljs.core.nth.call(null, vec__4286__4287, 0, null);
  var dy__4289 = cljs.core.nth.call(null, vec__4286__4287, 1, null);
  return cljs.core.PersistentVector.fromArray([dx__4288, -dy__4289])
}, "\ufdd0'user/bounce":function refls(p__4290) {
  var vec__4291__4292 = p__4290;
  var dx__4293 = cljs.core.nth.call(null, vec__4291__4292, 0, null);
  var dy__4294 = cljs.core.nth.call(null, vec__4291__4292, 1, null);
  return cljs.core.PersistentVector.fromArray([-dx__4293, -dy__4294])
}});
grid.core.derive_keys = function derive_keys(m, p) {
  var G__4295__4296 = cljs.core.seq.call(null, cljs.core.keys.call(null, m));
  if(cljs.core.truth_(G__4295__4296)) {
    var i__4297 = cljs.core.first.call(null, G__4295__4296);
    var G__4295__4298 = G__4295__4296;
    while(true) {
      cljs.core.derive.call(null, i__4297, p);
      var temp__3974__auto____4299 = cljs.core.next.call(null, G__4295__4298);
      if(cljs.core.truth_(temp__3974__auto____4299)) {
        var G__4295__4300 = temp__3974__auto____4299;
        var G__4301 = cljs.core.first.call(null, G__4295__4300);
        var G__4302 = G__4295__4300;
        i__4297 = G__4301;
        G__4295__4298 = G__4302;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
grid.core.derive_keys.call(null, grid.core.refls, "\ufdd0'user/reflection");
grid.core.derive_keys.call(null, grid.core.dirs, "\ufdd0'user/direction");
grid.core.derive_keys.call(null, grid.core.comps, "\ufdd0'user/comparison");
grid.core.derive_keys.call(null, grid.core.ariths, "\ufdd0'user/arithmetic");
cljs.core.derive.call(null, "\ufdd0'user/skipping", "\ufdd0'user/empty");
grid.core.CodeState = function(stack, box, w, h, pos, dir, skip_QMARK_, halted_QMARK_, error, changed, __meta, __extmap) {
  this.stack = stack;
  this.box = box;
  this.w = w;
  this.h = h;
  this.pos = pos;
  this.dir = dir;
  this.skip_QMARK_ = skip_QMARK_;
  this.halted_QMARK_ = halted_QMARK_;
  this.error = error;
  this.changed = changed;
  this.__meta = __meta;
  this.__extmap = __extmap;
  this.cljs$lang$protocol_mask$partition0$ = 0;
  this.cljs$lang$protocol_mask$partition1$ = 32;
  if(arguments.length > 10) {
    this.__meta = __meta;
    this.__extmap = __extmap
  }else {
    this.__meta = null;
    this.__extmap = null
  }
};
grid.core.CodeState.prototype.cljs$core$IHash$ = true;
grid.core.CodeState.prototype.cljs$core$IHash$_hash$arity$1 = function(this__452__auto__) {
  var this__4306 = this;
  return cljs.core.hash_coll.call(null, this__452__auto__)
};
grid.core.CodeState.prototype.cljs$core$ILookup$ = true;
grid.core.CodeState.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this__457__auto__, k__458__auto__) {
  var this__4307 = this;
  return cljs.core._lookup.call(null, this__457__auto__, k__458__auto__, null)
};
grid.core.CodeState.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this__459__auto__, k4304, else__460__auto__) {
  var this__4308 = this;
  if(k4304 === "\ufdd0'stack") {
    return this__4308.stack
  }else {
    if(k4304 === "\ufdd0'box") {
      return this__4308.box
    }else {
      if(k4304 === "\ufdd0'w") {
        return this__4308.w
      }else {
        if(k4304 === "\ufdd0'h") {
          return this__4308.h
        }else {
          if(k4304 === "\ufdd0'pos") {
            return this__4308.pos
          }else {
            if(k4304 === "\ufdd0'dir") {
              return this__4308.dir
            }else {
              if(k4304 === "\ufdd0'skip?") {
                return this__4308.skip_QMARK_
              }else {
                if(k4304 === "\ufdd0'halted?") {
                  return this__4308.halted_QMARK_
                }else {
                  if(k4304 === "\ufdd0'error") {
                    return this__4308.error
                  }else {
                    if(k4304 === "\ufdd0'changed") {
                      return this__4308.changed
                    }else {
                      if("\ufdd0'else") {
                        return cljs.core.get.call(null, this__4308.__extmap, k4304, else__460__auto__)
                      }else {
                        return null
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
grid.core.CodeState.prototype.cljs$core$IAssociative$ = true;
grid.core.CodeState.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(this__464__auto__, k__465__auto__, G__4303) {
  var this__4309 = this;
  var pred__4310__4313 = cljs.core.identical_QMARK_;
  var expr__4311__4314 = k__465__auto__;
  if(cljs.core.truth_(pred__4310__4313.call(null, "\ufdd0'stack", expr__4311__4314))) {
    return new grid.core.CodeState(G__4303, this__4309.box, this__4309.w, this__4309.h, this__4309.pos, this__4309.dir, this__4309.skip_QMARK_, this__4309.halted_QMARK_, this__4309.error, this__4309.changed, this__4309.__meta, this__4309.__extmap)
  }else {
    if(cljs.core.truth_(pred__4310__4313.call(null, "\ufdd0'box", expr__4311__4314))) {
      return new grid.core.CodeState(this__4309.stack, G__4303, this__4309.w, this__4309.h, this__4309.pos, this__4309.dir, this__4309.skip_QMARK_, this__4309.halted_QMARK_, this__4309.error, this__4309.changed, this__4309.__meta, this__4309.__extmap)
    }else {
      if(cljs.core.truth_(pred__4310__4313.call(null, "\ufdd0'w", expr__4311__4314))) {
        return new grid.core.CodeState(this__4309.stack, this__4309.box, G__4303, this__4309.h, this__4309.pos, this__4309.dir, this__4309.skip_QMARK_, this__4309.halted_QMARK_, this__4309.error, this__4309.changed, this__4309.__meta, this__4309.__extmap)
      }else {
        if(cljs.core.truth_(pred__4310__4313.call(null, "\ufdd0'h", expr__4311__4314))) {
          return new grid.core.CodeState(this__4309.stack, this__4309.box, this__4309.w, G__4303, this__4309.pos, this__4309.dir, this__4309.skip_QMARK_, this__4309.halted_QMARK_, this__4309.error, this__4309.changed, this__4309.__meta, this__4309.__extmap)
        }else {
          if(cljs.core.truth_(pred__4310__4313.call(null, "\ufdd0'pos", expr__4311__4314))) {
            return new grid.core.CodeState(this__4309.stack, this__4309.box, this__4309.w, this__4309.h, G__4303, this__4309.dir, this__4309.skip_QMARK_, this__4309.halted_QMARK_, this__4309.error, this__4309.changed, this__4309.__meta, this__4309.__extmap)
          }else {
            if(cljs.core.truth_(pred__4310__4313.call(null, "\ufdd0'dir", expr__4311__4314))) {
              return new grid.core.CodeState(this__4309.stack, this__4309.box, this__4309.w, this__4309.h, this__4309.pos, G__4303, this__4309.skip_QMARK_, this__4309.halted_QMARK_, this__4309.error, this__4309.changed, this__4309.__meta, this__4309.__extmap)
            }else {
              if(cljs.core.truth_(pred__4310__4313.call(null, "\ufdd0'skip?", expr__4311__4314))) {
                return new grid.core.CodeState(this__4309.stack, this__4309.box, this__4309.w, this__4309.h, this__4309.pos, this__4309.dir, G__4303, this__4309.halted_QMARK_, this__4309.error, this__4309.changed, this__4309.__meta, this__4309.__extmap)
              }else {
                if(cljs.core.truth_(pred__4310__4313.call(null, "\ufdd0'halted?", expr__4311__4314))) {
                  return new grid.core.CodeState(this__4309.stack, this__4309.box, this__4309.w, this__4309.h, this__4309.pos, this__4309.dir, this__4309.skip_QMARK_, G__4303, this__4309.error, this__4309.changed, this__4309.__meta, this__4309.__extmap)
                }else {
                  if(cljs.core.truth_(pred__4310__4313.call(null, "\ufdd0'error", expr__4311__4314))) {
                    return new grid.core.CodeState(this__4309.stack, this__4309.box, this__4309.w, this__4309.h, this__4309.pos, this__4309.dir, this__4309.skip_QMARK_, this__4309.halted_QMARK_, G__4303, this__4309.changed, this__4309.__meta, this__4309.__extmap)
                  }else {
                    if(cljs.core.truth_(pred__4310__4313.call(null, "\ufdd0'changed", expr__4311__4314))) {
                      return new grid.core.CodeState(this__4309.stack, this__4309.box, this__4309.w, this__4309.h, this__4309.pos, this__4309.dir, this__4309.skip_QMARK_, this__4309.halted_QMARK_, this__4309.error, G__4303, this__4309.__meta, this__4309.__extmap)
                    }else {
                      return new grid.core.CodeState(this__4309.stack, this__4309.box, this__4309.w, this__4309.h, this__4309.pos, this__4309.dir, this__4309.skip_QMARK_, this__4309.halted_QMARK_, this__4309.error, this__4309.changed, this__4309.__meta, cljs.core.assoc.call(null, this__4309.__extmap, k__465__auto__, G__4303))
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
grid.core.CodeState.prototype.cljs$core$IRecord$ = true;
grid.core.CodeState.prototype.cljs$core$ICollection$ = true;
grid.core.CodeState.prototype.cljs$core$ICollection$_conj$arity$2 = function(this__462__auto__, entry__463__auto__) {
  var this__4315 = this;
  if(cljs.core.vector_QMARK_.call(null, entry__463__auto__)) {
    return cljs.core._assoc.call(null, this__462__auto__, cljs.core._nth.call(null, entry__463__auto__, 0), cljs.core._nth.call(null, entry__463__auto__, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, this__462__auto__, entry__463__auto__)
  }
};
grid.core.CodeState.prototype.cljs$core$ISeqable$ = true;
grid.core.CodeState.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this__469__auto__) {
  var this__4316 = this;
  return cljs.core.seq.call(null, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'stack", this__4316.stack), cljs.core.vector.call(null, "\ufdd0'box", this__4316.box), cljs.core.vector.call(null, "\ufdd0'w", this__4316.w), cljs.core.vector.call(null, "\ufdd0'h", this__4316.h), cljs.core.vector.call(null, "\ufdd0'pos", this__4316.pos), cljs.core.vector.call(null, "\ufdd0'dir", this__4316.dir), cljs.core.vector.call(null, "\ufdd0'skip?", this__4316.skip_QMARK_), 
  cljs.core.vector.call(null, "\ufdd0'halted?", this__4316.halted_QMARK_), cljs.core.vector.call(null, "\ufdd0'error", this__4316.error), cljs.core.vector.call(null, "\ufdd0'changed", this__4316.changed)]), this__4316.__extmap))
};
grid.core.CodeState.prototype.cljs$core$IPrintable$ = true;
grid.core.CodeState.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(this__471__auto__, opts__472__auto__) {
  var this__4317 = this;
  var pr_pair__473__auto____4318 = function(keyval__474__auto__) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts__472__auto__, keyval__474__auto__)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__473__auto____4318, [cljs.core.str("#"), cljs.core.str("grid.core.CodeState"), cljs.core.str("{")].join(""), ", ", "}", opts__472__auto__, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'stack", this__4317.stack), cljs.core.vector.call(null, "\ufdd0'box", this__4317.box), cljs.core.vector.call(null, "\ufdd0'w", this__4317.w), cljs.core.vector.call(null, "\ufdd0'h", this__4317.h), cljs.core.vector.call(null, 
  "\ufdd0'pos", this__4317.pos), cljs.core.vector.call(null, "\ufdd0'dir", this__4317.dir), cljs.core.vector.call(null, "\ufdd0'skip?", this__4317.skip_QMARK_), cljs.core.vector.call(null, "\ufdd0'halted?", this__4317.halted_QMARK_), cljs.core.vector.call(null, "\ufdd0'error", this__4317.error), cljs.core.vector.call(null, "\ufdd0'changed", this__4317.changed)]), this__4317.__extmap))
};
grid.core.CodeState.prototype.cljs$core$ICounted$ = true;
grid.core.CodeState.prototype.cljs$core$ICounted$_count$arity$1 = function(this__461__auto__) {
  var this__4319 = this;
  return 10 + cljs.core.count.call(null, this__4319.__extmap)
};
grid.core.CodeState.prototype.cljs$core$IStack$ = true;
grid.core.CodeState.prototype.cljs$core$IStack$_peek$arity$1 = function(_) {
  var this__4320 = this;
  return cljs.core._peek.call(null, this__4320.stack)
};
grid.core.CodeState.prototype.cljs$core$IStack$_pop$arity$1 = function(this$) {
  var this__4321 = this;
  return cljs.core.update_in.call(null, this$, cljs.core.PersistentVector.fromArray(["\ufdd0'stack"]), cljs.core.pop)
};
grid.core.CodeState.prototype.cljs$core$IEquiv$ = true;
grid.core.CodeState.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(this__453__auto__, other__454__auto__) {
  var this__4322 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____4323 = other__454__auto__;
    if(cljs.core.truth_(and__3822__auto____4323)) {
      var and__3822__auto____4324 = this__453__auto__.constructor === other__454__auto__.constructor;
      if(and__3822__auto____4324) {
        return cljs.core.equiv_map.call(null, this__453__auto__, other__454__auto__)
      }else {
        return and__3822__auto____4324
      }
    }else {
      return and__3822__auto____4323
    }
  }())) {
    return true
  }else {
    return false
  }
};
grid.core.CodeState.prototype.cljs$core$IWithMeta$ = true;
grid.core.CodeState.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(this__456__auto__, G__4303) {
  var this__4325 = this;
  return new grid.core.CodeState(this__4325.stack, this__4325.box, this__4325.w, this__4325.h, this__4325.pos, this__4325.dir, this__4325.skip_QMARK_, this__4325.halted_QMARK_, this__4325.error, this__4325.changed, G__4303, this__4325.__extmap)
};
grid.core.CodeState.prototype.cljs$core$IMeta$ = true;
grid.core.CodeState.prototype.cljs$core$IMeta$_meta$arity$1 = function(this__455__auto__) {
  var this__4326 = this;
  return this__4326.__meta
};
grid.core.CodeState.prototype.cljs$core$IMap$ = true;
grid.core.CodeState.prototype.cljs$core$IMap$_dissoc$arity$2 = function(this__466__auto__, k__467__auto__) {
  var this__4327 = this;
  if(cljs.core.contains_QMARK_.call(null, cljs.core.set(["\ufdd0'dir", "\ufdd0'changed", "\ufdd0'stack", "\ufdd0'error", "\ufdd0'pos", "\ufdd0'h", "\ufdd0'halted?", "\ufdd0'box", "\ufdd0'skip?", "\ufdd0'w"]), k__467__auto__)) {
    return cljs.core.dissoc.call(null, cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), this__466__auto__), this__4327.__meta), k__467__auto__)
  }else {
    return new grid.core.CodeState(this__4327.stack, this__4327.box, this__4327.w, this__4327.h, this__4327.pos, this__4327.dir, this__4327.skip_QMARK_, this__4327.halted_QMARK_, this__4327.error, this__4327.changed, this__4327.__meta, cljs.core.not_empty.call(null, cljs.core.dissoc.call(null, this__4327.__extmap, k__467__auto__)))
  }
};
grid.core.CodeState.cljs$lang$type = true;
grid.core.CodeState.cljs$lang$ctorPrSeq = function(this__498__auto__) {
  return cljs.core.list.call(null, "grid.core.CodeState")
};
grid.core.__GT_CodeState = function __GT_CodeState(stack, box, w, h, pos, dir, skip_QMARK_, halted_QMARK_, error, changed) {
  return new grid.core.CodeState(stack, box, w, h, pos, dir, skip_QMARK_, halted_QMARK_, error, changed)
};
grid.core.map__GT_CodeState = function map__GT_CodeState(G__4305) {
  return new grid.core.CodeState("\ufdd0'stack".call(null, G__4305), "\ufdd0'box".call(null, G__4305), "\ufdd0'w".call(null, G__4305), "\ufdd0'h".call(null, G__4305), "\ufdd0'pos".call(null, G__4305), "\ufdd0'dir".call(null, G__4305), "\ufdd0'skip?".call(null, G__4305), "\ufdd0'halted?".call(null, G__4305), "\ufdd0'error".call(null, G__4305), "\ufdd0'changed".call(null, G__4305), null, cljs.core.dissoc.call(null, G__4305, "\ufdd0'stack", "\ufdd0'box", "\ufdd0'w", "\ufdd0'h", "\ufdd0'pos", "\ufdd0'dir", 
  "\ufdd0'skip?", "\ufdd0'halted?", "\ufdd0'error", "\ufdd0'changed"))
};
grid.core.CodeState;
grid.core.code_state = function code_state(w, h) {
  return new grid.core.CodeState(cljs.core.PersistentVector.fromArray([]), cljs.core.ObjMap.fromObject([], {}), w, h, cljs.core.PersistentVector.fromArray([-1, 0]), cljs.core.PersistentVector.fromArray([1, 0]), false, false, null, null)
};
grid.core.ohno = function ohno(cs) {
  return cljs.core.assoc.call(null, cs, "\ufdd0'error", "\ufdd0'pos".call(null, cs), "\ufdd0'halted?", true)
};
grid.core.push = function push(cs, x) {
  return cljs.core.update_in.call(null, cs, cljs.core.PersistentVector.fromArray(["\ufdd0'stack"]), cljs.core.conj, x)
};
grid.core.skip = function skip(cs, b) {
  return cljs.core.assoc.call(null, cs, "\ufdd0'skip?", b)
};
grid.core.set_at = function set_at(env, pos, val) {
  return cljs.core.assoc_in.call(null, env, cljs.core.PersistentVector.fromArray(["\ufdd0'box", pos]), val)
};
grid.core.move = function move(p__4328) {
  var env__4331 = p__4328;
  var env__4332 = cljs.core.seq_QMARK_.call(null, env__4331) ? cljs.core.apply.call(null, cljs.core.hash_map, env__4331) : env__4331;
  var w__4333 = cljs.core.get.call(null, env__4332, "\ufdd0'w");
  var h__4334 = cljs.core.get.call(null, env__4332, "\ufdd0'h");
  var vec__4329__4335 = cljs.core.get.call(null, env__4332, "\ufdd0'pos");
  var x__4336 = cljs.core.nth.call(null, vec__4329__4335, 0, null);
  var y__4337 = cljs.core.nth.call(null, vec__4329__4335, 1, null);
  var vec__4330__4338 = cljs.core.get.call(null, env__4332, "\ufdd0'dir");
  var dx__4339 = cljs.core.nth.call(null, vec__4330__4338, 0, null);
  var dy__4340 = cljs.core.nth.call(null, vec__4330__4338, 1, null);
  return cljs.core.assoc.call(null, env__4332, "\ufdd0'pos", cljs.core.PersistentVector.fromArray([(w__4333 + x__4336 + dx__4339) % w__4333, (h__4334 + y__4337 + dy__4340) % h__4334]))
};
grid.core.at = function() {
  var at__delegate = function(cs, p__4341) {
    var vec__4342__4343 = p__4341;
    var pos__4344 = cljs.core.nth.call(null, vec__4342__4343, 0, null);
    return cljs.core.get_in.call(null, cs, cljs.core.PersistentVector.fromArray(["\ufdd0'box", function() {
      var or__3824__auto____4345 = pos__4344;
      if(cljs.core.truth_(or__3824__auto____4345)) {
        return or__3824__auto____4345
      }else {
        return cljs.core.get.call(null, cs, "\ufdd0'pos")
      }
    }()]))
  };
  var at = function(cs, var_args) {
    var p__4341 = null;
    if(goog.isDef(var_args)) {
      p__4341 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return at__delegate.call(this, cs, p__4341)
  };
  at.cljs$lang$maxFixedArity = 1;
  at.cljs$lang$applyTo = function(arglist__4346) {
    var cs = cljs.core.first(arglist__4346);
    var p__4341 = cljs.core.rest(arglist__4346);
    return at__delegate.call(this, cs, p__4341)
  };
  return at
}();
grid.core.inst = function inst(cs) {
  var o__4264__auto____4348 = cljs.core.truth_(cljs.core.get.call(null, cs, "\ufdd0'skip?")) ? "\ufdd0'user/skipping" : function() {
    var or__3824__auto____4347 = grid.core.at.call(null, cs);
    if(cljs.core.truth_(or__3824__auto____4347)) {
      return or__3824__auto____4347
    }else {
      return"\ufdd0'user/empty"
    }
  }();
  if(cljs.core.truth_(grid.core.debug_QMARK_)) {
  }else {
  }
  return o__4264__auto____4348
};
grid.core.exec = function() {
  var method_table__663__auto____4349 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  var prefer_table__664__auto____4350 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  var method_cache__665__auto____4351 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  var cached_hierarchy__666__auto____4352 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  var hierarchy__667__auto____4353 = cljs.core.get.call(null, cljs.core.ObjMap.fromObject([], {}), "\ufdd0'hierarchy", cljs.core.global_hierarchy);
  return new cljs.core.MultiFn("exec", grid.core.inst, "\ufdd0'default", hierarchy__667__auto____4353, method_table__663__auto____4349, prefer_table__664__auto____4350, method_cache__665__auto____4351, cached_hierarchy__666__auto____4352)
}();
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'default", function(c) {
  var o__4264__auto____4354 = grid.core.push.call(null, c, grid.core.at.call(null, c));
  if(cljs.core.truth_(grid.core.debug_QMARK_)) {
  }else {
  }
  return o__4264__auto____4354
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/reflection", function(cs) {
  return cljs.core.update_in.call(null, cs, cljs.core.PersistentVector.fromArray(["\ufdd0'dir"]), grid.core.refls.call(null, grid.core.at.call(null, cs)))
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/direction", function(cs) {
  return cljs.core.assoc.call(null, cs, "\ufdd0'dir", grid.core.dirs.call(null, grid.core.at.call(null, cs)))
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/comparison", function(code) {
  var c__4355 = grid.core.comps.call(null, grid.core.at.call(null, code));
  return grid.core.push.call(null, cljs.core.pop.call(null, cljs.core.pop.call(null, code)), cljs.core.truth_(c__4355.call(null, cljs.core.peek.call(null, cljs.core.pop.call(null, code)), cljs.core.peek.call(null, code))) ? 1 : 0)
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/arithmetic", function(c) {
  var op__4356 = grid.core.ariths.call(null, grid.core.at.call(null, c));
  return grid.core.push.call(null, cljs.core.pop.call(null, cljs.core.pop.call(null, c)), op__4356.call(null, cljs.core.peek.call(null, cljs.core.pop.call(null, c)), cljs.core.peek.call(null, c)))
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/empty", function(c) {
  return grid.core.skip.call(null, c, false)
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/skip!", function(c) {
  return grid.core.skip.call(null, c, true)
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/skip?", function(c) {
  return grid.core.skip.call(null, c, cljs.core.not.call(null, cljs.core.peek.call(null, c) === 0))
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/drop", function(c) {
  return cljs.core.pop.call(null, c)
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/dup", function(cs) {
  return cljs.core.update_in.call(null, cs, cljs.core.PersistentVector.fromArray(["\ufdd0'stack"]), function(p1__4357_SHARP_) {
    return cljs.core.conj.call(null, p1__4357_SHARP_, cljs.core.peek.call(null, p1__4357_SHARP_))
  })
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/swap", function(p__4358) {
  var cs__4359 = p__4358;
  var cs__4360 = cljs.core.seq_QMARK_.call(null, cs__4359) ? cljs.core.apply.call(null, cljs.core.hash_map, cs__4359) : cs__4359;
  var stack__4361 = cljs.core.get.call(null, cs__4360, "\ufdd0'stack");
  return cljs.core.assoc.call(null, cs__4360, "\ufdd0'stack", cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.pop.call(null, cljs.core.pop.call(null, stack__4361)), cljs.core.peek.call(null, stack__4361)), cljs.core.peek.call(null, cljs.core.pop.call(null, stack__4361))))
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/jump", function(c) {
  return cljs.core.assoc.call(null, cljs.core.pop.call(null, cljs.core.pop.call(null, c)), "\ufdd0'pos", cljs.core.PersistentVector.fromArray([cljs.core.peek.call(null, c), cljs.core.peek.call(null, cljs.core.pop.call(null, c))]))
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/get", function(c) {
  return grid.core.push.call(null, cljs.core.pop.call(null, cljs.core.pop.call(null, c)), grid.core.at.call(null, c, cljs.core.PersistentVector.fromArray([cljs.core.peek.call(null, c), cljs.core.peek.call(null, cljs.core.pop.call(null, c))])))
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/place", function(c) {
  return cljs.core.assoc.call(null, grid.core.set_at.call(null, cljs.core.pop.call(null, cljs.core.pop.call(null, cljs.core.pop.call(null, c))), cljs.core.PersistentVector.fromArray([cljs.core.peek.call(null, c), cljs.core.peek.call(null, cljs.core.pop.call(null, c))]), cljs.core.peek.call(null, cljs.core.pop.call(null, cljs.core.pop.call(null, c)))), "\ufdd0'changed", cljs.core.PersistentVector.fromArray([cljs.core.peek.call(null, c), cljs.core.peek.call(null, cljs.core.pop.call(null, c))]))
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/halt", function(c) {
  return cljs.core.assoc.call(null, c, "\ufdd0'halted?", true)
});
grid.core.tick = function tick(code) {
  var o__4264__auto____4362 = cljs.core.not.call(null, "\ufdd0'halted?".call(null, code)) ? grid.core.exec.call(null, grid.core.move.call(null, code)) : code;
  if(cljs.core.truth_(grid.core.debug_QMARK_)) {
  }else {
  }
  return o__4264__auto____4362
};
grid.core.cstate = cljs.core.atom.call(null, null);
grid.core.code_QMARK_ = function code_QMARK_(v) {
  return cljs.core.keyword_QMARK_.call(null, v)
};
grid.core.inst__GT_string = cljs.core.PersistentHashMap.fromArrays([null, "\ufdd0'user/horizontal", "\ufdd0'user/skip?", "\ufdd0'user/add", "\ufdd0'user/lt", "\ufdd0'user/down", "\ufdd0'user/bounce", "\ufdd0'user/get", "\ufdd0'user/diag-pri", "\ufdd0'user/diag-sec", "\ufdd0'user/drop", "\ufdd0'user/mul", "\ufdd0'user/up", "\ufdd0'user/gt", "\ufdd0'user/sub", "\ufdd0'user/halt", "\ufdd0'user/right", "\ufdd0'user/vertical", "\ufdd0'user/swap", "\ufdd0'user/dup", "\ufdd0'user/quo", "\ufdd0'user/jump", 
"\ufdd0'user/left", "\ufdd0'user/place", "\ufdd0'user/eq", "\ufdd0'user/mod", "\ufdd0'user/skip!"], ["", "\u2015", "?", "+", "<", "\u2193", "\u2573", "\u0393", "\u2572", "\u2571", "\u0394", "*", "\u2191", ">", "-", "H", "\u2192", "|", "\u21c5", "\u2564", "\u00f7", "J", "\u2190", "\u03a0", "=", "%", "!"]);
grid.core.make_cell_id = function make_cell_id(row, column) {
  return[cljs.core.str("cell-row-"), cljs.core.str(row), cljs.core.str("-col-"), cljs.core.str(column)].join("")
};
grid.core.make_td_id = function make_td_id(row, column) {
  return[cljs.core.str("wrap-row-"), cljs.core.str(row), cljs.core.str("-col-"), cljs.core.str(column)].join("")
};
var group__4239__auto____4364 = cljs.core.swap_BANG_.call(null, crate.core.group_id, cljs.core.inc);
grid.core.cell = function cell(r, c, p__4365) {
  var map__4366__4367 = p__4365;
  var map__4366__4368 = cljs.core.seq_QMARK_.call(null, map__4366__4367) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4366__4367) : map__4366__4367;
  var error__4369 = cljs.core.get.call(null, map__4366__4368, "\ufdd0'error");
  var pos__4370 = cljs.core.get.call(null, map__4366__4368, "\ufdd0'pos");
  var box__4371 = cljs.core.get.call(null, map__4366__4368, "\ufdd0'box");
  var elem__4240__auto____4374 = crate.core.html.call(null, cljs.core.PersistentVector.fromArray(["\ufdd0'div", cljs.core.ObjMap.fromObject(["\ufdd0'id", "\ufdd0'data-row", "\ufdd0'data-col", "\ufdd0'class"], {"\ufdd0'id":grid.core.make_cell_id.call(null, r, c), "\ufdd0'data-row":r, "\ufdd0'data-col":c, "\ufdd0'class":cljs.core._EQ_.call(null, error__4369, cljs.core.PersistentVector.fromArray([c, r])) ? "cell error" : cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([c, r]), pos__4370) ? 
  "cell active" : "\ufdd0'else" ? "cell" : null}), function() {
    var temp__3971__auto____4372 = grid.core.inst__GT_string.call(null, box__4371.call(null, cljs.core.PersistentVector.fromArray([c, r])));
    if(cljs.core.truth_(temp__3971__auto____4372)) {
      var is__4373 = temp__3971__auto____4372;
      return is__4373
    }else {
      return[cljs.core.str(box__4371.call(null, cljs.core.PersistentVector.fromArray([c, r])))].join("")
    }
  }()]));
  elem__4240__auto____4374.setAttribute("crateGroup", group__4239__auto____4364);
  return elem__4240__auto____4374
};
grid.core.cell.prototype._crateGroup = group__4239__auto____4364;
var group__4239__auto____4375 = cljs.core.swap_BANG_.call(null, crate.core.group_id, cljs.core.inc);
grid.core.cells = function cells(p__4376) {
  var code__4377 = p__4376;
  var code__4378 = cljs.core.seq_QMARK_.call(null, code__4377) ? cljs.core.apply.call(null, cljs.core.hash_map, code__4377) : code__4377;
  var pos__4379 = cljs.core.get.call(null, code__4378, "\ufdd0'pos");
  var box__4380 = cljs.core.get.call(null, code__4378, "\ufdd0'box");
  var h__4381 = cljs.core.get.call(null, code__4378, "\ufdd0'h");
  var w__4382 = cljs.core.get.call(null, code__4378, "\ufdd0'w");
  var elem__4240__auto____4383 = crate.core.html.call(null, cljs.core.PersistentVector.fromArray(["\ufdd0'table#cells", cljs.core.map.call(null, function(row) {
    return cljs.core.PersistentVector.fromArray(["\ufdd0'tr.row", cljs.core.map.call(null, function(p1__4363_SHARP_) {
      return cljs.core.vector.call(null, "\ufdd0'td", cljs.core.ObjMap.fromObject(["\ufdd0'id"], {"\ufdd0'id":grid.core.make_td_id.call(null, row, p1__4363_SHARP_)}), grid.core.cell.call(null, row, p1__4363_SHARP_, code__4378))
    }, cljs.core.range.call(null, w__4382))])
  }, cljs.core.range.call(null, h__4381))]));
  elem__4240__auto____4383.setAttribute("crateGroup", group__4239__auto____4375);
  return elem__4240__auto____4383
};
grid.core.cells.prototype._crateGroup = group__4239__auto____4375;
var group__4239__auto____4384 = cljs.core.swap_BANG_.call(null, crate.core.group_id, cljs.core.inc);
grid.core.control = function control(ctrl) {
  var elem__4240__auto____4385 = crate.core.html.call(null, cljs.core.PersistentVector.fromArray(["\ufdd0'a.ctrl", cljs.core.ObjMap.fromObject(["\ufdd0'href", "\ufdd0'id"], {"\ufdd0'href":"#", "\ufdd0'id":ctrl}), clojure.string.capitalize.call(null, ctrl)]));
  elem__4240__auto____4385.setAttribute("crateGroup", group__4239__auto____4384);
  return elem__4240__auto____4385
};
grid.core.control.prototype._crateGroup = group__4239__auto____4384;
var group__4239__auto____4386 = cljs.core.swap_BANG_.call(null, crate.core.group_id, cljs.core.inc);
grid.core.controls = function controls(cs) {
  var elem__4240__auto____4387 = crate.core.html.call(null, cljs.core.PersistentVector.fromArray(["\ufdd0'div#controls", cljs.core.map.call(null, grid.core.control, cs)]));
  elem__4240__auto____4387.setAttribute("crateGroup", group__4239__auto____4386);
  return elem__4240__auto____4387
};
grid.core.controls.prototype._crateGroup = group__4239__auto____4386;
var group__4239__auto____4388 = cljs.core.swap_BANG_.call(null, crate.core.group_id, cljs.core.inc);
grid.core.stack = function stack(p__4389) {
  var map__4390__4391 = p__4389;
  var map__4390__4392 = cljs.core.seq_QMARK_.call(null, map__4390__4391) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4390__4391) : map__4390__4391;
  var stack__4393 = cljs.core.get.call(null, map__4390__4392, "\ufdd0'stack");
  var elem__4240__auto____4395 = crate.core.html.call(null, function() {
    var s__4394 = cljs.core.reverse.call(null, cljs.core.map.call(null, function(e) {
      if(cljs.core.truth_(grid.core.code_QMARK_.call(null, e))) {
        return cljs.core.PersistentVector.fromArray(["\ufdd0'li.code", grid.core.inst__GT_string.call(null, e)])
      }else {
        return cljs.core.PersistentVector.fromArray(["\ufdd0'li.value", [cljs.core.str(e)].join("")])
      }
    }, stack__4393));
    return cljs.core.PersistentVector.fromArray(["\ufdd0'div#stack-wrap", cljs.core.PersistentVector.fromArray(["\ufdd0'ul#stack", 10 > cljs.core.count.call(null, s__4394) ? s__4394 : cljs.core.seq.call(null, cljs.core.conj.call(null, cljs.core.vec.call(null, cljs.core.take.call(null, 9, s__4394)), cljs.core.PersistentVector.fromArray(["\ufdd0'li", "..."])))])])
  }());
  elem__4240__auto____4395.setAttribute("crateGroup", group__4239__auto____4388);
  return elem__4240__auto____4395
};
grid.core.stack.prototype._crateGroup = group__4239__auto____4388;
grid.core.update_active = function update_active(p__4396) {
  var map__4397__4399 = p__4396;
  var map__4397__4400 = cljs.core.seq_QMARK_.call(null, map__4397__4399) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4397__4399) : map__4397__4399;
  var vec__4398__4401 = cljs.core.get.call(null, map__4397__4400, "\ufdd0'pos");
  var nx__4402 = cljs.core.nth.call(null, vec__4398__4401, 0, null);
  var ny__4403 = cljs.core.nth.call(null, vec__4398__4401, 1, null);
  jayq.core.remove_class.call(null, jayq.core.$.call(null, "div.active"), "active");
  return jayq.core.add_class.call(null, jayq.core.$.call(null, [cljs.core.str("#"), cljs.core.str(grid.core.make_cell_id.call(null, ny__4403, nx__4402))].join("")), "active")
};
grid.core.update_stack = function update_stack(cstate) {
  jayq.core.remove.call(null, jayq.core.$.call(null, "\ufdd0'#stack-wrap"));
  return jayq.core.append.call(null, jayq.core.$.call(null, "\ufdd0'#grid"), grid.core.stack.call(null, cstate))
};
grid.core.update_grid = function update_grid(p__4404) {
  var cs__4405 = p__4404;
  var cs__4406 = cljs.core.seq_QMARK_.call(null, cs__4405) ? cljs.core.apply.call(null, cljs.core.hash_map, cs__4405) : cs__4405;
  var c__4407 = cljs.core.get.call(null, cs__4406, "\ufdd0'changed");
  if(cljs.core.truth_(c__4407)) {
    var vec__4408__4409 = c__4407;
    var cx__4410 = cljs.core.nth.call(null, vec__4408__4409, 0, null);
    var cy__4411 = cljs.core.nth.call(null, vec__4408__4409, 1, null);
    jayq.core.remove.call(null, jayq.core.$.call(null, [cljs.core.str("#"), cljs.core.str(grid.core.make_cell_id.call(null, cy__4411, cx__4410))].join("")));
    return jayq.core.append.call(null, jayq.core.$.call(null, [cljs.core.str("#"), cljs.core.str(grid.core.make_td_id.call(null, cy__4411, cx__4410))].join("")), grid.core.cell.call(null, cy__4411, cx__4410, cs__4406))
  }else {
    return null
  }
};
grid.core.set_ui = function set_ui(cstate) {
  jayq.core.remove.call(null, jayq.core.$.call(null, "\ufdd0'#cells"));
  jayq.core.remove.call(null, jayq.core.$.call(null, "\ufdd0'#stack-wrap"));
  return jayq.core.append.call(null, jayq.core.append.call(null, jayq.core.$.call(null, "\ufdd0'#grid"), grid.core.cells.call(null, cstate)), grid.core.stack.call(null, cstate))
};
grid.core.init_box = cljs.core.PersistentHashMap.fromArrays([cljs.core.PersistentVector.fromArray([3, 2]), cljs.core.PersistentVector.fromArray([6, 5]), cljs.core.PersistentVector.fromArray([9, 8]), cljs.core.PersistentVector.fromArray([1, 0]), cljs.core.PersistentVector.fromArray([9, 9]), cljs.core.PersistentVector.fromArray([0, 0]), cljs.core.PersistentVector.fromArray([1, 2]), cljs.core.PersistentVector.fromArray([3, 5]), cljs.core.PersistentVector.fromArray([5, 7]), cljs.core.PersistentVector.fromArray([7, 
9]), cljs.core.PersistentVector.fromArray([2, 5]), cljs.core.PersistentVector.fromArray([6, 9]), cljs.core.PersistentVector.fromArray([0, 3]), cljs.core.PersistentVector.fromArray([1, 5]), cljs.core.PersistentVector.fromArray([0, 5]), cljs.core.PersistentVector.fromArray([3, 9]), cljs.core.PersistentVector.fromArray([0, 6]), cljs.core.PersistentVector.fromArray([0, 7]), cljs.core.PersistentVector.fromArray([0, 8]), cljs.core.PersistentVector.fromArray([0, 9]), cljs.core.PersistentVector.fromArray([7, 
0]), cljs.core.PersistentVector.fromArray([6, 1]), cljs.core.PersistentVector.fromArray([8, 3]), cljs.core.PersistentVector.fromArray([5, 1]), cljs.core.PersistentVector.fromArray([6, 2]), cljs.core.PersistentVector.fromArray([7, 3]), cljs.core.PersistentVector.fromArray([9, 5]), cljs.core.PersistentVector.fromArray([3, 0]), cljs.core.PersistentVector.fromArray([4, 1]), cljs.core.PersistentVector.fromArray([5, 2]), cljs.core.PersistentVector.fromArray([7, 4]), cljs.core.PersistentVector.fromArray([3, 
1]), cljs.core.PersistentVector.fromArray([4, 2]), cljs.core.PersistentVector.fromArray([7, 5]), cljs.core.PersistentVector.fromArray([9, 7])], ["\ufdd0'user/get", "\ufdd0'user/skip!", "\ufdd0'user/horizontal", "\ufdd0'user/right", "\ufdd0'user/diag-sec", "\ufdd0'user/down", "\ufdd0'user/up", "\ufdd0'user/diag-sec", "\ufdd0'user/halt", 1, "\ufdd0'user/skip!", "\ufdd0'user/sub", "\ufdd0'user/diag-sec", 3, "\ufdd0'user/right", "\ufdd0'user/diag-pri", "\ufdd0'user/down", 1, 6, "\ufdd0'user/jump", "\ufdd0'user/jump", 
"\ufdd0'user/place", "\ufdd0'user/skip!", 8, "\ufdd0'user/left", "\ufdd0'user/swap", "\ufdd0'user/diag-pri", "\ufdd0'user/down", 1, 7, 7, "\ufdd0'user/right", 5, "\ufdd0'user/diag-pri", "\ufdd0'user/skip?"]);
grid.core.set_size_BANG_ = function set_size_BANG_(w, h) {
  cljs.core.reset_BANG_.call(null, grid.core.cstate, cljs.core.assoc.call(null, grid.core.code_state.call(null, w, h), "\ufdd0'box", grid.core.init_box));
  return grid.core.set_ui.call(null, cljs.core.deref.call(null, grid.core.cstate))
};
grid.core.update_ui = function update_ui(cs) {
  var G__4412__4413 = cs;
  grid.core.update_grid.call(null, G__4412__4413);
  grid.core.update_stack.call(null, G__4412__4413);
  grid.core.update_active.call(null, G__4412__4413);
  return G__4412__4413
};
grid.core.ctls = cljs.core.PersistentVector.fromArray(["run", "step", "reset"]);
grid.core.running_QMARK_ = cljs.core.atom.call(null, false);
grid.core.step = function step() {
  try {
    var ns__4416 = grid.core.tick.call(null, cljs.core.deref.call(null, grid.core.cstate));
    cljs.core.reset_BANG_.call(null, grid.core.cstate, ns__4416)
  }catch(e4414) {
    if(cljs.core.instance_QMARK_.call(null, Error, e4414)) {
      var e__4415 = e4414;
      cljs.core.swap_BANG_.call(null, grid.core.cstate, grid.core.ohno)
    }else {
      if("\ufdd0'else") {
        throw e4414;
      }else {
      }
    }
  }
  grid.core.update_ui.call(null, cljs.core.deref.call(null, grid.core.cstate));
  return cljs.core.swap_BANG_.call(null, grid.core.cstate, cljs.core.assoc, "\ufdd0'changed", null)
};
grid.core.run = function run() {
  if(cljs.core.truth_(cljs.core.deref.call(null, grid.core.running_QMARK_))) {
    grid.core.step.call(null);
    if(cljs.core.truth_("\ufdd0'halted?".call(null, cljs.core.deref.call(null, grid.core.cstate)))) {
      return grid.core.stop.call(null)
    }else {
      return setTimeout(run, 100)
    }
  }else {
    return null
  }
};
grid.core.go = function go() {
  jayq.core.add_class.call(null, jayq.core.$.call(null, "\ufdd0'#run"), "active");
  cljs.core.reset_BANG_.call(null, grid.core.running_QMARK_, true);
  return setTimeout(grid.core.run, 100)
};
grid.core.stop = function stop() {
  jayq.core.remove_class.call(null, jayq.core.$.call(null, "\ufdd0'#run"), "active");
  return cljs.core.reset_BANG_.call(null, grid.core.running_QMARK_, false)
};
grid.core.reset = function reset() {
  grid.core.stop.call(null);
  return grid.core.set_size_BANG_.call(null, 10, 10)
};
grid.core.clickwrap = function clickwrap(f) {
  return function(e) {
    e.preventDefault();
    return f.call(null, e)
  }
};
grid.core.init = function init() {
  grid.core.set_size_BANG_.call(null, 10, 10);
  jayq.core.append.call(null, jayq.core.$.call(null, "\ufdd0'#grid"), grid.core.controls.call(null, grid.core.ctls));
  jayq.core.on.call(null, jayq.core.$.call(null, "\ufdd0'#step"), "\ufdd0'click", grid.core.clickwrap.call(null, grid.core.step));
  jayq.core.on.call(null, jayq.core.$.call(null, "\ufdd0'#run"), "\ufdd0'click", grid.core.clickwrap.call(null, function() {
    if(cljs.core.truth_(cljs.core.deref.call(null, grid.core.running_QMARK_))) {
      return grid.core.stop.call(null)
    }else {
      return grid.core.go.call(null)
    }
  }));
  return jayq.core.on.call(null, jayq.core.$.call(null, "\ufdd0'#reset"), "\ufdd0'click", grid.core.clickwrap.call(null, grid.core.reset))
};
grid.core.init.call(null);
