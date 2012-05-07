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
    var and__3822__auto____263946 = x != null;
    if(and__3822__auto____263946) {
      return x.cljs$lang$type
    }else {
      return and__3822__auto____263946
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
    var G__263947__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__263947 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__263947__delegate.call(this, array, i, idxs)
    };
    G__263947.cljs$lang$maxFixedArity = 2;
    G__263947.cljs$lang$applyTo = function(arglist__263948) {
      var array = cljs.core.first(arglist__263948);
      var i = cljs.core.first(cljs.core.next(arglist__263948));
      var idxs = cljs.core.rest(cljs.core.next(arglist__263948));
      return G__263947__delegate.call(this, array, i, idxs)
    };
    return G__263947
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
      var and__3822__auto____263949 = this$;
      if(and__3822__auto____263949) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____263949
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3824__auto____263950 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____263950) {
          return or__3824__auto____263950
        }else {
          var or__3824__auto____263951 = cljs.core._invoke["_"];
          if(or__3824__auto____263951) {
            return or__3824__auto____263951
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____263952 = this$;
      if(and__3822__auto____263952) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____263952
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3824__auto____263953 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____263953) {
          return or__3824__auto____263953
        }else {
          var or__3824__auto____263954 = cljs.core._invoke["_"];
          if(or__3824__auto____263954) {
            return or__3824__auto____263954
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____263955 = this$;
      if(and__3822__auto____263955) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____263955
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3824__auto____263956 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____263956) {
          return or__3824__auto____263956
        }else {
          var or__3824__auto____263957 = cljs.core._invoke["_"];
          if(or__3824__auto____263957) {
            return or__3824__auto____263957
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____263958 = this$;
      if(and__3822__auto____263958) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____263958
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3824__auto____263959 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____263959) {
          return or__3824__auto____263959
        }else {
          var or__3824__auto____263960 = cljs.core._invoke["_"];
          if(or__3824__auto____263960) {
            return or__3824__auto____263960
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____263961 = this$;
      if(and__3822__auto____263961) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____263961
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3824__auto____263962 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____263962) {
          return or__3824__auto____263962
        }else {
          var or__3824__auto____263963 = cljs.core._invoke["_"];
          if(or__3824__auto____263963) {
            return or__3824__auto____263963
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____263964 = this$;
      if(and__3822__auto____263964) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____263964
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3824__auto____263965 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____263965) {
          return or__3824__auto____263965
        }else {
          var or__3824__auto____263966 = cljs.core._invoke["_"];
          if(or__3824__auto____263966) {
            return or__3824__auto____263966
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____263967 = this$;
      if(and__3822__auto____263967) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____263967
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3824__auto____263968 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____263968) {
          return or__3824__auto____263968
        }else {
          var or__3824__auto____263969 = cljs.core._invoke["_"];
          if(or__3824__auto____263969) {
            return or__3824__auto____263969
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____263970 = this$;
      if(and__3822__auto____263970) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____263970
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3824__auto____263971 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____263971) {
          return or__3824__auto____263971
        }else {
          var or__3824__auto____263972 = cljs.core._invoke["_"];
          if(or__3824__auto____263972) {
            return or__3824__auto____263972
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____263973 = this$;
      if(and__3822__auto____263973) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____263973
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3824__auto____263974 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____263974) {
          return or__3824__auto____263974
        }else {
          var or__3824__auto____263975 = cljs.core._invoke["_"];
          if(or__3824__auto____263975) {
            return or__3824__auto____263975
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____263976 = this$;
      if(and__3822__auto____263976) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____263976
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3824__auto____263977 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____263977) {
          return or__3824__auto____263977
        }else {
          var or__3824__auto____263978 = cljs.core._invoke["_"];
          if(or__3824__auto____263978) {
            return or__3824__auto____263978
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____263979 = this$;
      if(and__3822__auto____263979) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____263979
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3824__auto____263980 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____263980) {
          return or__3824__auto____263980
        }else {
          var or__3824__auto____263981 = cljs.core._invoke["_"];
          if(or__3824__auto____263981) {
            return or__3824__auto____263981
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____263982 = this$;
      if(and__3822__auto____263982) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____263982
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3824__auto____263983 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____263983) {
          return or__3824__auto____263983
        }else {
          var or__3824__auto____263984 = cljs.core._invoke["_"];
          if(or__3824__auto____263984) {
            return or__3824__auto____263984
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____263985 = this$;
      if(and__3822__auto____263985) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____263985
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3824__auto____263986 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____263986) {
          return or__3824__auto____263986
        }else {
          var or__3824__auto____263987 = cljs.core._invoke["_"];
          if(or__3824__auto____263987) {
            return or__3824__auto____263987
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____263988 = this$;
      if(and__3822__auto____263988) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____263988
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3824__auto____263989 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____263989) {
          return or__3824__auto____263989
        }else {
          var or__3824__auto____263990 = cljs.core._invoke["_"];
          if(or__3824__auto____263990) {
            return or__3824__auto____263990
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____263991 = this$;
      if(and__3822__auto____263991) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____263991
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3824__auto____263992 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____263992) {
          return or__3824__auto____263992
        }else {
          var or__3824__auto____263993 = cljs.core._invoke["_"];
          if(or__3824__auto____263993) {
            return or__3824__auto____263993
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____263994 = this$;
      if(and__3822__auto____263994) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____263994
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3824__auto____263995 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____263995) {
          return or__3824__auto____263995
        }else {
          var or__3824__auto____263996 = cljs.core._invoke["_"];
          if(or__3824__auto____263996) {
            return or__3824__auto____263996
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____263997 = this$;
      if(and__3822__auto____263997) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____263997
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3824__auto____263998 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____263998) {
          return or__3824__auto____263998
        }else {
          var or__3824__auto____263999 = cljs.core._invoke["_"];
          if(or__3824__auto____263999) {
            return or__3824__auto____263999
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____264000 = this$;
      if(and__3822__auto____264000) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____264000
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3824__auto____264001 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____264001) {
          return or__3824__auto____264001
        }else {
          var or__3824__auto____264002 = cljs.core._invoke["_"];
          if(or__3824__auto____264002) {
            return or__3824__auto____264002
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____264003 = this$;
      if(and__3822__auto____264003) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____264003
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3824__auto____264004 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____264004) {
          return or__3824__auto____264004
        }else {
          var or__3824__auto____264005 = cljs.core._invoke["_"];
          if(or__3824__auto____264005) {
            return or__3824__auto____264005
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____264006 = this$;
      if(and__3822__auto____264006) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____264006
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3824__auto____264007 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____264007) {
          return or__3824__auto____264007
        }else {
          var or__3824__auto____264008 = cljs.core._invoke["_"];
          if(or__3824__auto____264008) {
            return or__3824__auto____264008
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____264009 = this$;
      if(and__3822__auto____264009) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____264009
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3824__auto____264010 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____264010) {
          return or__3824__auto____264010
        }else {
          var or__3824__auto____264011 = cljs.core._invoke["_"];
          if(or__3824__auto____264011) {
            return or__3824__auto____264011
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
    var and__3822__auto____264012 = coll;
    if(and__3822__auto____264012) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____264012
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____264013 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264013) {
        return or__3824__auto____264013
      }else {
        var or__3824__auto____264014 = cljs.core._count["_"];
        if(or__3824__auto____264014) {
          return or__3824__auto____264014
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
    var and__3822__auto____264015 = coll;
    if(and__3822__auto____264015) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____264015
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____264016 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264016) {
        return or__3824__auto____264016
      }else {
        var or__3824__auto____264017 = cljs.core._empty["_"];
        if(or__3824__auto____264017) {
          return or__3824__auto____264017
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
    var and__3822__auto____264018 = coll;
    if(and__3822__auto____264018) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____264018
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3824__auto____264019 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264019) {
        return or__3824__auto____264019
      }else {
        var or__3824__auto____264020 = cljs.core._conj["_"];
        if(or__3824__auto____264020) {
          return or__3824__auto____264020
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
      var and__3822__auto____264021 = coll;
      if(and__3822__auto____264021) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____264021
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3824__auto____264022 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____264022) {
          return or__3824__auto____264022
        }else {
          var or__3824__auto____264023 = cljs.core._nth["_"];
          if(or__3824__auto____264023) {
            return or__3824__auto____264023
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____264024 = coll;
      if(and__3822__auto____264024) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____264024
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3824__auto____264025 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____264025) {
          return or__3824__auto____264025
        }else {
          var or__3824__auto____264026 = cljs.core._nth["_"];
          if(or__3824__auto____264026) {
            return or__3824__auto____264026
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
    var and__3822__auto____264027 = coll;
    if(and__3822__auto____264027) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____264027
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____264028 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264028) {
        return or__3824__auto____264028
      }else {
        var or__3824__auto____264029 = cljs.core._first["_"];
        if(or__3824__auto____264029) {
          return or__3824__auto____264029
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____264030 = coll;
    if(and__3822__auto____264030) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____264030
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____264031 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264031) {
        return or__3824__auto____264031
      }else {
        var or__3824__auto____264032 = cljs.core._rest["_"];
        if(or__3824__auto____264032) {
          return or__3824__auto____264032
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
      var and__3822__auto____264033 = o;
      if(and__3822__auto____264033) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____264033
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3824__auto____264034 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____264034) {
          return or__3824__auto____264034
        }else {
          var or__3824__auto____264035 = cljs.core._lookup["_"];
          if(or__3824__auto____264035) {
            return or__3824__auto____264035
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____264036 = o;
      if(and__3822__auto____264036) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____264036
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3824__auto____264037 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____264037) {
          return or__3824__auto____264037
        }else {
          var or__3824__auto____264038 = cljs.core._lookup["_"];
          if(or__3824__auto____264038) {
            return or__3824__auto____264038
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
    var and__3822__auto____264039 = coll;
    if(and__3822__auto____264039) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____264039
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____264040 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264040) {
        return or__3824__auto____264040
      }else {
        var or__3824__auto____264041 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____264041) {
          return or__3824__auto____264041
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____264042 = coll;
    if(and__3822__auto____264042) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____264042
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3824__auto____264043 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264043) {
        return or__3824__auto____264043
      }else {
        var or__3824__auto____264044 = cljs.core._assoc["_"];
        if(or__3824__auto____264044) {
          return or__3824__auto____264044
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
    var and__3822__auto____264045 = coll;
    if(and__3822__auto____264045) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____264045
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____264046 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264046) {
        return or__3824__auto____264046
      }else {
        var or__3824__auto____264047 = cljs.core._dissoc["_"];
        if(or__3824__auto____264047) {
          return or__3824__auto____264047
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
    var and__3822__auto____264048 = coll;
    if(and__3822__auto____264048) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____264048
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____264049 = cljs.core._key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264049) {
        return or__3824__auto____264049
      }else {
        var or__3824__auto____264050 = cljs.core._key["_"];
        if(or__3824__auto____264050) {
          return or__3824__auto____264050
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____264051 = coll;
    if(and__3822__auto____264051) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____264051
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____264052 = cljs.core._val[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264052) {
        return or__3824__auto____264052
      }else {
        var or__3824__auto____264053 = cljs.core._val["_"];
        if(or__3824__auto____264053) {
          return or__3824__auto____264053
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
    var and__3822__auto____264054 = coll;
    if(and__3822__auto____264054) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____264054
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3824__auto____264055 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264055) {
        return or__3824__auto____264055
      }else {
        var or__3824__auto____264056 = cljs.core._disjoin["_"];
        if(or__3824__auto____264056) {
          return or__3824__auto____264056
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
    var and__3822__auto____264057 = coll;
    if(and__3822__auto____264057) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____264057
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____264058 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264058) {
        return or__3824__auto____264058
      }else {
        var or__3824__auto____264059 = cljs.core._peek["_"];
        if(or__3824__auto____264059) {
          return or__3824__auto____264059
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____264060 = coll;
    if(and__3822__auto____264060) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____264060
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____264061 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264061) {
        return or__3824__auto____264061
      }else {
        var or__3824__auto____264062 = cljs.core._pop["_"];
        if(or__3824__auto____264062) {
          return or__3824__auto____264062
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
    var and__3822__auto____264063 = coll;
    if(and__3822__auto____264063) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____264063
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3824__auto____264064 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264064) {
        return or__3824__auto____264064
      }else {
        var or__3824__auto____264065 = cljs.core._assoc_n["_"];
        if(or__3824__auto____264065) {
          return or__3824__auto____264065
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
    var and__3822__auto____264066 = o;
    if(and__3822__auto____264066) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____264066
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____264067 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(or__3824__auto____264067) {
        return or__3824__auto____264067
      }else {
        var or__3824__auto____264068 = cljs.core._deref["_"];
        if(or__3824__auto____264068) {
          return or__3824__auto____264068
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
    var and__3822__auto____264069 = o;
    if(and__3822__auto____264069) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____264069
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3824__auto____264070 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(or__3824__auto____264070) {
        return or__3824__auto____264070
      }else {
        var or__3824__auto____264071 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____264071) {
          return or__3824__auto____264071
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
    var and__3822__auto____264072 = o;
    if(and__3822__auto____264072) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____264072
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____264073 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____264073) {
        return or__3824__auto____264073
      }else {
        var or__3824__auto____264074 = cljs.core._meta["_"];
        if(or__3824__auto____264074) {
          return or__3824__auto____264074
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
    var and__3822__auto____264075 = o;
    if(and__3822__auto____264075) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____264075
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3824__auto____264076 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____264076) {
        return or__3824__auto____264076
      }else {
        var or__3824__auto____264077 = cljs.core._with_meta["_"];
        if(or__3824__auto____264077) {
          return or__3824__auto____264077
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
      var and__3822__auto____264078 = coll;
      if(and__3822__auto____264078) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____264078
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3824__auto____264079 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____264079) {
          return or__3824__auto____264079
        }else {
          var or__3824__auto____264080 = cljs.core._reduce["_"];
          if(or__3824__auto____264080) {
            return or__3824__auto____264080
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____264081 = coll;
      if(and__3822__auto____264081) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____264081
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3824__auto____264082 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____264082) {
          return or__3824__auto____264082
        }else {
          var or__3824__auto____264083 = cljs.core._reduce["_"];
          if(or__3824__auto____264083) {
            return or__3824__auto____264083
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
    var and__3822__auto____264084 = coll;
    if(and__3822__auto____264084) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____264084
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3824__auto____264085 = cljs.core._kv_reduce[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264085) {
        return or__3824__auto____264085
      }else {
        var or__3824__auto____264086 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____264086) {
          return or__3824__auto____264086
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
    var and__3822__auto____264087 = o;
    if(and__3822__auto____264087) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____264087
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3824__auto____264088 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(or__3824__auto____264088) {
        return or__3824__auto____264088
      }else {
        var or__3824__auto____264089 = cljs.core._equiv["_"];
        if(or__3824__auto____264089) {
          return or__3824__auto____264089
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
    var and__3822__auto____264090 = o;
    if(and__3822__auto____264090) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____264090
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____264091 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(or__3824__auto____264091) {
        return or__3824__auto____264091
      }else {
        var or__3824__auto____264092 = cljs.core._hash["_"];
        if(or__3824__auto____264092) {
          return or__3824__auto____264092
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
    var and__3822__auto____264093 = o;
    if(and__3822__auto____264093) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____264093
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____264094 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____264094) {
        return or__3824__auto____264094
      }else {
        var or__3824__auto____264095 = cljs.core._seq["_"];
        if(or__3824__auto____264095) {
          return or__3824__auto____264095
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
    var and__3822__auto____264096 = coll;
    if(and__3822__auto____264096) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____264096
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____264097 = cljs.core._rseq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264097) {
        return or__3824__auto____264097
      }else {
        var or__3824__auto____264098 = cljs.core._rseq["_"];
        if(or__3824__auto____264098) {
          return or__3824__auto____264098
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
    var and__3822__auto____264099 = coll;
    if(and__3822__auto____264099) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____264099
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____264100 = cljs.core._sorted_seq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264100) {
        return or__3824__auto____264100
      }else {
        var or__3824__auto____264101 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____264101) {
          return or__3824__auto____264101
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____264102 = coll;
    if(and__3822__auto____264102) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____264102
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____264103 = cljs.core._sorted_seq_from[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264103) {
        return or__3824__auto____264103
      }else {
        var or__3824__auto____264104 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____264104) {
          return or__3824__auto____264104
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____264105 = coll;
    if(and__3822__auto____264105) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____264105
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3824__auto____264106 = cljs.core._entry_key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264106) {
        return or__3824__auto____264106
      }else {
        var or__3824__auto____264107 = cljs.core._entry_key["_"];
        if(or__3824__auto____264107) {
          return or__3824__auto____264107
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____264108 = coll;
    if(and__3822__auto____264108) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____264108
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____264109 = cljs.core._comparator[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264109) {
        return or__3824__auto____264109
      }else {
        var or__3824__auto____264110 = cljs.core._comparator["_"];
        if(or__3824__auto____264110) {
          return or__3824__auto____264110
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
    var and__3822__auto____264111 = o;
    if(and__3822__auto____264111) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____264111
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3824__auto____264112 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____264112) {
        return or__3824__auto____264112
      }else {
        var or__3824__auto____264113 = cljs.core._pr_seq["_"];
        if(or__3824__auto____264113) {
          return or__3824__auto____264113
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
    var and__3822__auto____264114 = d;
    if(and__3822__auto____264114) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____264114
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3824__auto____264115 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(or__3824__auto____264115) {
        return or__3824__auto____264115
      }else {
        var or__3824__auto____264116 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____264116) {
          return or__3824__auto____264116
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
    var and__3822__auto____264117 = this$;
    if(and__3822__auto____264117) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____264117
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3824__auto____264118 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(or__3824__auto____264118) {
        return or__3824__auto____264118
      }else {
        var or__3824__auto____264119 = cljs.core._notify_watches["_"];
        if(or__3824__auto____264119) {
          return or__3824__auto____264119
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____264120 = this$;
    if(and__3822__auto____264120) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____264120
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3824__auto____264121 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____264121) {
        return or__3824__auto____264121
      }else {
        var or__3824__auto____264122 = cljs.core._add_watch["_"];
        if(or__3824__auto____264122) {
          return or__3824__auto____264122
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____264123 = this$;
    if(and__3822__auto____264123) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____264123
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3824__auto____264124 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____264124) {
        return or__3824__auto____264124
      }else {
        var or__3824__auto____264125 = cljs.core._remove_watch["_"];
        if(or__3824__auto____264125) {
          return or__3824__auto____264125
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
    var and__3822__auto____264126 = coll;
    if(and__3822__auto____264126) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____264126
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____264127 = cljs.core._as_transient[goog.typeOf.call(null, coll)];
      if(or__3824__auto____264127) {
        return or__3824__auto____264127
      }else {
        var or__3824__auto____264128 = cljs.core._as_transient["_"];
        if(or__3824__auto____264128) {
          return or__3824__auto____264128
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
    var and__3822__auto____264129 = tcoll;
    if(and__3822__auto____264129) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____264129
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3824__auto____264130 = cljs.core._conj_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____264130) {
        return or__3824__auto____264130
      }else {
        var or__3824__auto____264131 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____264131) {
          return or__3824__auto____264131
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____264132 = tcoll;
    if(and__3822__auto____264132) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____264132
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____264133 = cljs.core._persistent_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____264133) {
        return or__3824__auto____264133
      }else {
        var or__3824__auto____264134 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____264134) {
          return or__3824__auto____264134
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
    var and__3822__auto____264135 = tcoll;
    if(and__3822__auto____264135) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____264135
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3824__auto____264136 = cljs.core._assoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____264136) {
        return or__3824__auto____264136
      }else {
        var or__3824__auto____264137 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____264137) {
          return or__3824__auto____264137
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
    var and__3822__auto____264138 = tcoll;
    if(and__3822__auto____264138) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____264138
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3824__auto____264139 = cljs.core._dissoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____264139) {
        return or__3824__auto____264139
      }else {
        var or__3824__auto____264140 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____264140) {
          return or__3824__auto____264140
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
    var and__3822__auto____264141 = tcoll;
    if(and__3822__auto____264141) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____264141
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3824__auto____264142 = cljs.core._assoc_n_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____264142) {
        return or__3824__auto____264142
      }else {
        var or__3824__auto____264143 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____264143) {
          return or__3824__auto____264143
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____264144 = tcoll;
    if(and__3822__auto____264144) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____264144
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____264145 = cljs.core._pop_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____264145) {
        return or__3824__auto____264145
      }else {
        var or__3824__auto____264146 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____264146) {
          return or__3824__auto____264146
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
    var and__3822__auto____264147 = tcoll;
    if(and__3822__auto____264147) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____264147
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3824__auto____264148 = cljs.core._disjoin_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____264148) {
        return or__3824__auto____264148
      }else {
        var or__3824__auto____264149 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____264149) {
          return or__3824__auto____264149
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
    var or__3824__auto____264150 = x === y;
    if(or__3824__auto____264150) {
      return or__3824__auto____264150
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__264151__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__264152 = y;
            var G__264153 = cljs.core.first.call(null, more);
            var G__264154 = cljs.core.next.call(null, more);
            x = G__264152;
            y = G__264153;
            more = G__264154;
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
    var G__264151 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__264151__delegate.call(this, x, y, more)
    };
    G__264151.cljs$lang$maxFixedArity = 2;
    G__264151.cljs$lang$applyTo = function(arglist__264155) {
      var x = cljs.core.first(arglist__264155);
      var y = cljs.core.first(cljs.core.next(arglist__264155));
      var more = cljs.core.rest(cljs.core.next(arglist__264155));
      return G__264151__delegate.call(this, x, y, more)
    };
    return G__264151
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
    var or__3824__auto____264156 = x == null;
    if(or__3824__auto____264156) {
      return or__3824__auto____264156
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
  var G__264157 = null;
  var G__264157__2 = function(o, k) {
    return null
  };
  var G__264157__3 = function(o, k, not_found) {
    return not_found
  };
  G__264157 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__264157__2.call(this, o, k);
      case 3:
        return G__264157__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__264157
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
  var G__264158 = null;
  var G__264158__2 = function(_, f) {
    return f.call(null)
  };
  var G__264158__3 = function(_, f, start) {
    return start
  };
  G__264158 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__264158__2.call(this, _, f);
      case 3:
        return G__264158__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__264158
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
  var G__264159 = null;
  var G__264159__2 = function(_, n) {
    return null
  };
  var G__264159__3 = function(_, n, not_found) {
    return not_found
  };
  G__264159 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__264159__2.call(this, _, n);
      case 3:
        return G__264159__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__264159
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
      var val__264160 = cljs.core._nth.call(null, cicoll, 0);
      var n__264161 = 1;
      while(true) {
        if(n__264161 < cljs.core._count.call(null, cicoll)) {
          var nval__264162 = f.call(null, val__264160, cljs.core._nth.call(null, cicoll, n__264161));
          if(cljs.core.reduced_QMARK_.call(null, nval__264162)) {
            return cljs.core.deref.call(null, nval__264162)
          }else {
            var G__264169 = nval__264162;
            var G__264170 = n__264161 + 1;
            val__264160 = G__264169;
            n__264161 = G__264170;
            continue
          }
        }else {
          return val__264160
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var val__264163 = val;
    var n__264164 = 0;
    while(true) {
      if(n__264164 < cljs.core._count.call(null, cicoll)) {
        var nval__264165 = f.call(null, val__264163, cljs.core._nth.call(null, cicoll, n__264164));
        if(cljs.core.reduced_QMARK_.call(null, nval__264165)) {
          return cljs.core.deref.call(null, nval__264165)
        }else {
          var G__264171 = nval__264165;
          var G__264172 = n__264164 + 1;
          val__264163 = G__264171;
          n__264164 = G__264172;
          continue
        }
      }else {
        return val__264163
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var val__264166 = val;
    var n__264167 = idx;
    while(true) {
      if(n__264167 < cljs.core._count.call(null, cicoll)) {
        var nval__264168 = f.call(null, val__264166, cljs.core._nth.call(null, cicoll, n__264167));
        if(cljs.core.reduced_QMARK_.call(null, nval__264168)) {
          return cljs.core.deref.call(null, nval__264168)
        }else {
          var G__264173 = nval__264168;
          var G__264174 = n__264167 + 1;
          val__264166 = G__264173;
          n__264167 = G__264174;
          continue
        }
      }else {
        return val__264166
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
  var this__264175 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__264176 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__264177 = this;
  var this$__264178 = this;
  return cljs.core.pr_str.call(null, this$__264178)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(_, f) {
  var this__264179 = this;
  return cljs.core.ci_reduce.call(null, this__264179.a, f, this__264179.a[this__264179.i], this__264179.i + 1)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(_, f, start) {
  var this__264180 = this;
  return cljs.core.ci_reduce.call(null, this__264180.a, f, start, this__264180.i)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__264181 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__264182 = this;
  return this__264182.a.length - this__264182.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__264183 = this;
  return this__264183.a[this__264183.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__264184 = this;
  if(this__264184.i + 1 < this__264184.a.length) {
    return new cljs.core.IndexedSeq(this__264184.a, this__264184.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__264185 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__264186 = this;
  var i__264187 = n + this__264186.i;
  if(i__264187 < this__264186.a.length) {
    return this__264186.a[i__264187]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__264188 = this;
  var i__264189 = n + this__264188.i;
  if(i__264189 < this__264188.a.length) {
    return this__264188.a[i__264189]
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
  var G__264190 = null;
  var G__264190__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__264190__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__264190 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__264190__2.call(this, array, f);
      case 3:
        return G__264190__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__264190
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__264191 = null;
  var G__264191__2 = function(array, k) {
    return array[k]
  };
  var G__264191__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__264191 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__264191__2.call(this, array, k);
      case 3:
        return G__264191__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__264191
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__264192 = null;
  var G__264192__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__264192__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__264192 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__264192__2.call(this, array, n);
      case 3:
        return G__264192__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__264192
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
      var G__264193__264194 = coll;
      if(G__264193__264194 != null) {
        if(function() {
          var or__3824__auto____264195 = G__264193__264194.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____264195) {
            return or__3824__auto____264195
          }else {
            return G__264193__264194.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__264193__264194.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__264193__264194)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__264193__264194)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__264196 = cljs.core.seq.call(null, coll);
      if(s__264196 != null) {
        return cljs.core._first.call(null, s__264196)
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
      var G__264197__264198 = coll;
      if(G__264197__264198 != null) {
        if(function() {
          var or__3824__auto____264199 = G__264197__264198.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____264199) {
            return or__3824__auto____264199
          }else {
            return G__264197__264198.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__264197__264198.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__264197__264198)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__264197__264198)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__264200 = cljs.core.seq.call(null, coll);
      if(s__264200 != null) {
        return cljs.core._rest.call(null, s__264200)
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
      var G__264201 = cljs.core.next.call(null, s);
      s = G__264201;
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
    var G__264202__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__264203 = conj.call(null, coll, x);
          var G__264204 = cljs.core.first.call(null, xs);
          var G__264205 = cljs.core.next.call(null, xs);
          coll = G__264203;
          x = G__264204;
          xs = G__264205;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__264202 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__264202__delegate.call(this, coll, x, xs)
    };
    G__264202.cljs$lang$maxFixedArity = 2;
    G__264202.cljs$lang$applyTo = function(arglist__264206) {
      var coll = cljs.core.first(arglist__264206);
      var x = cljs.core.first(cljs.core.next(arglist__264206));
      var xs = cljs.core.rest(cljs.core.next(arglist__264206));
      return G__264202__delegate.call(this, coll, x, xs)
    };
    return G__264202
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
      var G__264207 = cljs.core.next.call(null, coll);
      var G__264208 = acc + 1;
      coll = G__264207;
      acc = G__264208;
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
    var G__264210__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__264209 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__264211 = ret__264209;
          var G__264212 = cljs.core.first.call(null, kvs);
          var G__264213 = cljs.core.second.call(null, kvs);
          var G__264214 = cljs.core.nnext.call(null, kvs);
          coll = G__264211;
          k = G__264212;
          v = G__264213;
          kvs = G__264214;
          continue
        }else {
          return ret__264209
        }
        break
      }
    };
    var G__264210 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__264210__delegate.call(this, coll, k, v, kvs)
    };
    G__264210.cljs$lang$maxFixedArity = 3;
    G__264210.cljs$lang$applyTo = function(arglist__264215) {
      var coll = cljs.core.first(arglist__264215);
      var k = cljs.core.first(cljs.core.next(arglist__264215));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264215)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__264215)));
      return G__264210__delegate.call(this, coll, k, v, kvs)
    };
    return G__264210
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
    var G__264217__delegate = function(coll, k, ks) {
      while(true) {
        var ret__264216 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__264218 = ret__264216;
          var G__264219 = cljs.core.first.call(null, ks);
          var G__264220 = cljs.core.next.call(null, ks);
          coll = G__264218;
          k = G__264219;
          ks = G__264220;
          continue
        }else {
          return ret__264216
        }
        break
      }
    };
    var G__264217 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__264217__delegate.call(this, coll, k, ks)
    };
    G__264217.cljs$lang$maxFixedArity = 2;
    G__264217.cljs$lang$applyTo = function(arglist__264221) {
      var coll = cljs.core.first(arglist__264221);
      var k = cljs.core.first(cljs.core.next(arglist__264221));
      var ks = cljs.core.rest(cljs.core.next(arglist__264221));
      return G__264217__delegate.call(this, coll, k, ks)
    };
    return G__264217
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
    var G__264222__264223 = o;
    if(G__264222__264223 != null) {
      if(function() {
        var or__3824__auto____264224 = G__264222__264223.cljs$lang$protocol_mask$partition2$ & 8;
        if(or__3824__auto____264224) {
          return or__3824__auto____264224
        }else {
          return G__264222__264223.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__264222__264223.cljs$lang$protocol_mask$partition2$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__264222__264223)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__264222__264223)
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
    var G__264226__delegate = function(coll, k, ks) {
      while(true) {
        var ret__264225 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__264227 = ret__264225;
          var G__264228 = cljs.core.first.call(null, ks);
          var G__264229 = cljs.core.next.call(null, ks);
          coll = G__264227;
          k = G__264228;
          ks = G__264229;
          continue
        }else {
          return ret__264225
        }
        break
      }
    };
    var G__264226 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__264226__delegate.call(this, coll, k, ks)
    };
    G__264226.cljs$lang$maxFixedArity = 2;
    G__264226.cljs$lang$applyTo = function(arglist__264230) {
      var coll = cljs.core.first(arglist__264230);
      var k = cljs.core.first(cljs.core.next(arglist__264230));
      var ks = cljs.core.rest(cljs.core.next(arglist__264230));
      return G__264226__delegate.call(this, coll, k, ks)
    };
    return G__264226
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
    var G__264231__264232 = x;
    if(G__264231__264232 != null) {
      if(function() {
        var or__3824__auto____264233 = G__264231__264232.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____264233) {
          return or__3824__auto____264233
        }else {
          return G__264231__264232.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__264231__264232.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__264231__264232)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__264231__264232)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__264234__264235 = x;
    if(G__264234__264235 != null) {
      if(function() {
        var or__3824__auto____264236 = G__264234__264235.cljs$lang$protocol_mask$partition1$ & 16;
        if(or__3824__auto____264236) {
          return or__3824__auto____264236
        }else {
          return G__264234__264235.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__264234__264235.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__264234__264235)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__264234__264235)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__264237__264238 = x;
  if(G__264237__264238 != null) {
    if(function() {
      var or__3824__auto____264239 = G__264237__264238.cljs$lang$protocol_mask$partition1$ & 2;
      if(or__3824__auto____264239) {
        return or__3824__auto____264239
      }else {
        return G__264237__264238.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__264237__264238.cljs$lang$protocol_mask$partition1$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__264237__264238)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__264237__264238)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__264240__264241 = x;
  if(G__264240__264241 != null) {
    if(function() {
      var or__3824__auto____264242 = G__264240__264241.cljs$lang$protocol_mask$partition3$ & 16;
      if(or__3824__auto____264242) {
        return or__3824__auto____264242
      }else {
        return G__264240__264241.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__264240__264241.cljs$lang$protocol_mask$partition3$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__264240__264241)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__264240__264241)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__264243__264244 = x;
  if(G__264243__264244 != null) {
    if(function() {
      var or__3824__auto____264245 = G__264243__264244.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____264245) {
        return or__3824__auto____264245
      }else {
        return G__264243__264244.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__264243__264244.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__264243__264244)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__264243__264244)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__264246__264247 = x;
    if(G__264246__264247 != null) {
      if(function() {
        var or__3824__auto____264248 = G__264246__264247.cljs$lang$protocol_mask$partition1$ & 4;
        if(or__3824__auto____264248) {
          return or__3824__auto____264248
        }else {
          return G__264246__264247.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__264246__264247.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__264246__264247)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__264246__264247)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__264249__264250 = x;
  if(G__264249__264250 != null) {
    if(function() {
      var or__3824__auto____264251 = G__264249__264250.cljs$lang$protocol_mask$partition2$ & 1;
      if(or__3824__auto____264251) {
        return or__3824__auto____264251
      }else {
        return G__264249__264250.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__264249__264250.cljs$lang$protocol_mask$partition2$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__264249__264250)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__264249__264250)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__264252__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__264252 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__264252__delegate.call(this, keyvals)
    };
    G__264252.cljs$lang$maxFixedArity = 0;
    G__264252.cljs$lang$applyTo = function(arglist__264253) {
      var keyvals = cljs.core.seq(arglist__264253);
      return G__264252__delegate.call(this, keyvals)
    };
    return G__264252
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
  var keys__264254 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__264254.push(key)
  });
  return keys__264254
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__264255 = i;
  var j__264256 = j;
  var len__264257 = len;
  while(true) {
    if(len__264257 === 0) {
      return to
    }else {
      to[j__264256] = from[i__264255];
      var G__264258 = i__264255 + 1;
      var G__264259 = j__264256 + 1;
      var G__264260 = len__264257 - 1;
      i__264255 = G__264258;
      j__264256 = G__264259;
      len__264257 = G__264260;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__264261 = i + (len - 1);
  var j__264262 = j + (len - 1);
  var len__264263 = len;
  while(true) {
    if(len__264263 === 0) {
      return to
    }else {
      to[j__264262] = from[i__264261];
      var G__264264 = i__264261 - 1;
      var G__264265 = j__264262 - 1;
      var G__264266 = len__264263 - 1;
      i__264261 = G__264264;
      j__264262 = G__264265;
      len__264263 = G__264266;
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
    var G__264267__264268 = s;
    if(G__264267__264268 != null) {
      if(function() {
        var or__3824__auto____264269 = G__264267__264268.cljs$lang$protocol_mask$partition0$ & 32;
        if(or__3824__auto____264269) {
          return or__3824__auto____264269
        }else {
          return G__264267__264268.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__264267__264268.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__264267__264268)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__264267__264268)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__264270__264271 = s;
    if(G__264270__264271 != null) {
      if(function() {
        var or__3824__auto____264272 = G__264270__264271.cljs$lang$protocol_mask$partition3$ & 8;
        if(or__3824__auto____264272) {
          return or__3824__auto____264272
        }else {
          return G__264270__264271.cljs$core$ISeqable$
        }
      }()) {
        return true
      }else {
        if(!G__264270__264271.cljs$lang$protocol_mask$partition3$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__264270__264271)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__264270__264271)
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
  var and__3822__auto____264273 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____264273)) {
    return cljs.core.not.call(null, function() {
      var or__3824__auto____264274 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____264274) {
        return or__3824__auto____264274
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }())
  }else {
    return and__3822__auto____264273
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____264275 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____264275)) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____264275
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____264276 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____264276)) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____264276
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____264277 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____264277) {
    return or__3824__auto____264277
  }else {
    var G__264278__264279 = f;
    if(G__264278__264279 != null) {
      if(function() {
        var or__3824__auto____264280 = G__264278__264279.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____264280) {
          return or__3824__auto____264280
        }else {
          return G__264278__264279.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__264278__264279.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__264278__264279)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__264278__264279)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____264281 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____264281) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____264281
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
    var and__3822__auto____264282 = coll;
    if(cljs.core.truth_(and__3822__auto____264282)) {
      var and__3822__auto____264283 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____264283) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____264283
      }
    }else {
      return and__3822__auto____264282
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
    var G__264288__delegate = function(x, y, more) {
      if(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))) {
        var s__264284 = cljs.core.set([y, x]);
        var xs__264285 = more;
        while(true) {
          var x__264286 = cljs.core.first.call(null, xs__264285);
          var etc__264287 = cljs.core.next.call(null, xs__264285);
          if(cljs.core.truth_(xs__264285)) {
            if(cljs.core.contains_QMARK_.call(null, s__264284, x__264286)) {
              return false
            }else {
              var G__264289 = cljs.core.conj.call(null, s__264284, x__264286);
              var G__264290 = etc__264287;
              s__264284 = G__264289;
              xs__264285 = G__264290;
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
    var G__264288 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__264288__delegate.call(this, x, y, more)
    };
    G__264288.cljs$lang$maxFixedArity = 2;
    G__264288.cljs$lang$applyTo = function(arglist__264291) {
      var x = cljs.core.first(arglist__264291);
      var y = cljs.core.first(cljs.core.next(arglist__264291));
      var more = cljs.core.rest(cljs.core.next(arglist__264291));
      return G__264288__delegate.call(this, x, y, more)
    };
    return G__264288
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
      var r__264292 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__264292)) {
        return r__264292
      }else {
        if(cljs.core.truth_(r__264292)) {
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
      var a__264293 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__264293, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__264293)
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
    var temp__3971__auto____264294 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3971__auto____264294)) {
      var s__264295 = temp__3971__auto____264294;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__264295), cljs.core.next.call(null, s__264295))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__264296 = val;
    var coll__264297 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__264297)) {
        var nval__264298 = f.call(null, val__264296, cljs.core.first.call(null, coll__264297));
        if(cljs.core.reduced_QMARK_.call(null, nval__264298)) {
          return cljs.core.deref.call(null, nval__264298)
        }else {
          var G__264299 = nval__264298;
          var G__264300 = cljs.core.next.call(null, coll__264297);
          val__264296 = G__264299;
          coll__264297 = G__264300;
          continue
        }
      }else {
        return val__264296
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
  var G__264301 = null;
  var G__264301__2 = function(coll, f) {
    return cljs.core.seq_reduce.call(null, f, coll)
  };
  var G__264301__3 = function(coll, f, start) {
    return cljs.core.seq_reduce.call(null, f, start, coll)
  };
  G__264301 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__264301__2.call(this, coll, f);
      case 3:
        return G__264301__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__264301
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
  var this__264302 = this;
  return this__264302.val
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
    var G__264303__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__264303 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__264303__delegate.call(this, x, y, more)
    };
    G__264303.cljs$lang$maxFixedArity = 2;
    G__264303.cljs$lang$applyTo = function(arglist__264304) {
      var x = cljs.core.first(arglist__264304);
      var y = cljs.core.first(cljs.core.next(arglist__264304));
      var more = cljs.core.rest(cljs.core.next(arglist__264304));
      return G__264303__delegate.call(this, x, y, more)
    };
    return G__264303
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
    var G__264305__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__264305 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__264305__delegate.call(this, x, y, more)
    };
    G__264305.cljs$lang$maxFixedArity = 2;
    G__264305.cljs$lang$applyTo = function(arglist__264306) {
      var x = cljs.core.first(arglist__264306);
      var y = cljs.core.first(cljs.core.next(arglist__264306));
      var more = cljs.core.rest(cljs.core.next(arglist__264306));
      return G__264305__delegate.call(this, x, y, more)
    };
    return G__264305
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
    var G__264307__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__264307 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__264307__delegate.call(this, x, y, more)
    };
    G__264307.cljs$lang$maxFixedArity = 2;
    G__264307.cljs$lang$applyTo = function(arglist__264308) {
      var x = cljs.core.first(arglist__264308);
      var y = cljs.core.first(cljs.core.next(arglist__264308));
      var more = cljs.core.rest(cljs.core.next(arglist__264308));
      return G__264307__delegate.call(this, x, y, more)
    };
    return G__264307
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
    var G__264309__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__264309 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__264309__delegate.call(this, x, y, more)
    };
    G__264309.cljs$lang$maxFixedArity = 2;
    G__264309.cljs$lang$applyTo = function(arglist__264310) {
      var x = cljs.core.first(arglist__264310);
      var y = cljs.core.first(cljs.core.next(arglist__264310));
      var more = cljs.core.rest(cljs.core.next(arglist__264310));
      return G__264309__delegate.call(this, x, y, more)
    };
    return G__264309
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
    var G__264311__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__264312 = y;
            var G__264313 = cljs.core.first.call(null, more);
            var G__264314 = cljs.core.next.call(null, more);
            x = G__264312;
            y = G__264313;
            more = G__264314;
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
    var G__264311 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__264311__delegate.call(this, x, y, more)
    };
    G__264311.cljs$lang$maxFixedArity = 2;
    G__264311.cljs$lang$applyTo = function(arglist__264315) {
      var x = cljs.core.first(arglist__264315);
      var y = cljs.core.first(cljs.core.next(arglist__264315));
      var more = cljs.core.rest(cljs.core.next(arglist__264315));
      return G__264311__delegate.call(this, x, y, more)
    };
    return G__264311
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
    var G__264316__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__264317 = y;
            var G__264318 = cljs.core.first.call(null, more);
            var G__264319 = cljs.core.next.call(null, more);
            x = G__264317;
            y = G__264318;
            more = G__264319;
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
    var G__264316 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__264316__delegate.call(this, x, y, more)
    };
    G__264316.cljs$lang$maxFixedArity = 2;
    G__264316.cljs$lang$applyTo = function(arglist__264320) {
      var x = cljs.core.first(arglist__264320);
      var y = cljs.core.first(cljs.core.next(arglist__264320));
      var more = cljs.core.rest(cljs.core.next(arglist__264320));
      return G__264316__delegate.call(this, x, y, more)
    };
    return G__264316
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
    var G__264321__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__264322 = y;
            var G__264323 = cljs.core.first.call(null, more);
            var G__264324 = cljs.core.next.call(null, more);
            x = G__264322;
            y = G__264323;
            more = G__264324;
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
    var G__264321 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__264321__delegate.call(this, x, y, more)
    };
    G__264321.cljs$lang$maxFixedArity = 2;
    G__264321.cljs$lang$applyTo = function(arglist__264325) {
      var x = cljs.core.first(arglist__264325);
      var y = cljs.core.first(cljs.core.next(arglist__264325));
      var more = cljs.core.rest(cljs.core.next(arglist__264325));
      return G__264321__delegate.call(this, x, y, more)
    };
    return G__264321
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
    var G__264326__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__264327 = y;
            var G__264328 = cljs.core.first.call(null, more);
            var G__264329 = cljs.core.next.call(null, more);
            x = G__264327;
            y = G__264328;
            more = G__264329;
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
    var G__264326 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__264326__delegate.call(this, x, y, more)
    };
    G__264326.cljs$lang$maxFixedArity = 2;
    G__264326.cljs$lang$applyTo = function(arglist__264330) {
      var x = cljs.core.first(arglist__264330);
      var y = cljs.core.first(cljs.core.next(arglist__264330));
      var more = cljs.core.rest(cljs.core.next(arglist__264330));
      return G__264326__delegate.call(this, x, y, more)
    };
    return G__264326
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
    var G__264331__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__264331 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__264331__delegate.call(this, x, y, more)
    };
    G__264331.cljs$lang$maxFixedArity = 2;
    G__264331.cljs$lang$applyTo = function(arglist__264332) {
      var x = cljs.core.first(arglist__264332);
      var y = cljs.core.first(cljs.core.next(arglist__264332));
      var more = cljs.core.rest(cljs.core.next(arglist__264332));
      return G__264331__delegate.call(this, x, y, more)
    };
    return G__264331
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
    var G__264333__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__264333 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__264333__delegate.call(this, x, y, more)
    };
    G__264333.cljs$lang$maxFixedArity = 2;
    G__264333.cljs$lang$applyTo = function(arglist__264334) {
      var x = cljs.core.first(arglist__264334);
      var y = cljs.core.first(cljs.core.next(arglist__264334));
      var more = cljs.core.rest(cljs.core.next(arglist__264334));
      return G__264333__delegate.call(this, x, y, more)
    };
    return G__264333
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
  var rem__264335 = n % d;
  return cljs.core.fix.call(null, (n - rem__264335) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__264336 = cljs.core.quot.call(null, n, d);
  return n - d * q__264336
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
  var c__264337 = 0;
  var n__264338 = n;
  while(true) {
    if(n__264338 === 0) {
      return c__264337
    }else {
      var G__264339 = c__264337 + 1;
      var G__264340 = n__264338 & n__264338 - 1;
      c__264337 = G__264339;
      n__264338 = G__264340;
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
    var G__264341__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__264342 = y;
            var G__264343 = cljs.core.first.call(null, more);
            var G__264344 = cljs.core.next.call(null, more);
            x = G__264342;
            y = G__264343;
            more = G__264344;
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
    var G__264341 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__264341__delegate.call(this, x, y, more)
    };
    G__264341.cljs$lang$maxFixedArity = 2;
    G__264341.cljs$lang$applyTo = function(arglist__264345) {
      var x = cljs.core.first(arglist__264345);
      var y = cljs.core.first(cljs.core.next(arglist__264345));
      var more = cljs.core.rest(cljs.core.next(arglist__264345));
      return G__264341__delegate.call(this, x, y, more)
    };
    return G__264341
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
  var n__264346 = n;
  var xs__264347 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____264348 = xs__264347;
      if(cljs.core.truth_(and__3822__auto____264348)) {
        return n__264346 > 0
      }else {
        return and__3822__auto____264348
      }
    }())) {
      var G__264349 = n__264346 - 1;
      var G__264350 = cljs.core.next.call(null, xs__264347);
      n__264346 = G__264349;
      xs__264347 = G__264350;
      continue
    }else {
      return xs__264347
    }
    break
  }
};
cljs.core.IIndexed["_"] = true;
cljs.core._nth["_"] = function() {
  var G__264355 = null;
  var G__264355__2 = function(coll, n) {
    var temp__3971__auto____264351 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3971__auto____264351)) {
      var xs__264352 = temp__3971__auto____264351;
      return cljs.core.first.call(null, xs__264352)
    }else {
      throw new Error("Index out of bounds");
    }
  };
  var G__264355__3 = function(coll, n, not_found) {
    var temp__3971__auto____264353 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3971__auto____264353)) {
      var xs__264354 = temp__3971__auto____264353;
      return cljs.core.first.call(null, xs__264354)
    }else {
      return not_found
    }
  };
  G__264355 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__264355__2.call(this, coll, n);
      case 3:
        return G__264355__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__264355
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
    var G__264356__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__264357 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__264358 = cljs.core.next.call(null, more);
            sb = G__264357;
            more = G__264358;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__264356 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__264356__delegate.call(this, x, ys)
    };
    G__264356.cljs$lang$maxFixedArity = 1;
    G__264356.cljs$lang$applyTo = function(arglist__264359) {
      var x = cljs.core.first(arglist__264359);
      var ys = cljs.core.rest(arglist__264359);
      return G__264356__delegate.call(this, x, ys)
    };
    return G__264356
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
    var G__264360__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__264361 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__264362 = cljs.core.next.call(null, more);
            sb = G__264361;
            more = G__264362;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__264360 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__264360__delegate.call(this, x, ys)
    };
    G__264360.cljs$lang$maxFixedArity = 1;
    G__264360.cljs$lang$applyTo = function(arglist__264363) {
      var x = cljs.core.first(arglist__264363);
      var ys = cljs.core.rest(arglist__264363);
      return G__264360__delegate.call(this, x, ys)
    };
    return G__264360
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
    var xs__264364 = cljs.core.seq.call(null, x);
    var ys__264365 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__264364 == null) {
        return ys__264365 == null
      }else {
        if(ys__264365 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__264364), cljs.core.first.call(null, ys__264365))) {
            var G__264366 = cljs.core.next.call(null, xs__264364);
            var G__264367 = cljs.core.next.call(null, ys__264365);
            xs__264364 = G__264366;
            ys__264365 = G__264367;
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
  return cljs.core.reduce.call(null, function(p1__264368_SHARP_, p2__264369_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__264368_SHARP_, cljs.core.hash.call(null, p2__264369_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__264370 = 0;
  var s__264371 = cljs.core.seq.call(null, m);
  while(true) {
    if(cljs.core.truth_(s__264371)) {
      var e__264372 = cljs.core.first.call(null, s__264371);
      var G__264373 = (h__264370 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__264372)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__264372)))) % 4503599627370496;
      var G__264374 = cljs.core.next.call(null, s__264371);
      h__264370 = G__264373;
      s__264371 = G__264374;
      continue
    }else {
      return h__264370
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__264375 = 0;
  var s__264376 = cljs.core.seq.call(null, s);
  while(true) {
    if(cljs.core.truth_(s__264376)) {
      var e__264377 = cljs.core.first.call(null, s__264376);
      var G__264378 = (h__264375 + cljs.core.hash.call(null, e__264377)) % 4503599627370496;
      var G__264379 = cljs.core.next.call(null, s__264376);
      h__264375 = G__264378;
      s__264376 = G__264379;
      continue
    }else {
      return h__264375
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__264380__264381 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__264380__264381)) {
    var G__264383__264385 = cljs.core.first.call(null, G__264380__264381);
    var vec__264384__264386 = G__264383__264385;
    var key_name__264387 = cljs.core.nth.call(null, vec__264384__264386, 0, null);
    var f__264388 = cljs.core.nth.call(null, vec__264384__264386, 1, null);
    var G__264380__264389 = G__264380__264381;
    var G__264383__264390 = G__264383__264385;
    var G__264380__264391 = G__264380__264389;
    while(true) {
      var vec__264392__264393 = G__264383__264390;
      var key_name__264394 = cljs.core.nth.call(null, vec__264392__264393, 0, null);
      var f__264395 = cljs.core.nth.call(null, vec__264392__264393, 1, null);
      var G__264380__264396 = G__264380__264391;
      var str_name__264397 = cljs.core.name.call(null, key_name__264394);
      obj[str_name__264397] = f__264395;
      var temp__3974__auto____264398 = cljs.core.next.call(null, G__264380__264396);
      if(cljs.core.truth_(temp__3974__auto____264398)) {
        var G__264380__264399 = temp__3974__auto____264398;
        var G__264400 = cljs.core.first.call(null, G__264380__264399);
        var G__264401 = G__264380__264399;
        G__264383__264390 = G__264400;
        G__264380__264391 = G__264401;
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
  var this__264402 = this;
  var h__364__auto____264403 = this__264402.__hash;
  if(h__364__auto____264403 != null) {
    return h__364__auto____264403
  }else {
    var h__364__auto____264404 = cljs.core.hash_coll.call(null, coll);
    this__264402.__hash = h__364__auto____264404;
    return h__364__auto____264404
  }
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__264405 = this;
  return new cljs.core.List(this__264405.meta, o, coll, this__264405.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__264406 = this;
  var this$__264407 = this;
  return cljs.core.pr_str.call(null, this$__264407)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__264408 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__264409 = this;
  return this__264409.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__264410 = this;
  return this__264410.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__264411 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__264412 = this;
  return this__264412.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__264413 = this;
  return this__264413.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__264414 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__264415 = this;
  return new cljs.core.List(meta, this__264415.first, this__264415.rest, this__264415.count, this__264415.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__264416 = this;
  return this__264416.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__264417 = this;
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
  var this__264418 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__264419 = this;
  return new cljs.core.List(this__264419.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__264420 = this;
  var this$__264421 = this;
  return cljs.core.pr_str.call(null, this$__264421)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__264422 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__264423 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__264424 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__264425 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__264426 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__264427 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__264428 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__264429 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__264430 = this;
  return this__264430.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__264431 = this;
  return coll
};
cljs.core.EmptyList.prototype.cljs$core$IList$ = true;
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__264432__264433 = coll;
  if(G__264432__264433 != null) {
    if(function() {
      var or__3824__auto____264434 = G__264432__264433.cljs$lang$protocol_mask$partition4$ & 2;
      if(or__3824__auto____264434) {
        return or__3824__auto____264434
      }else {
        return G__264432__264433.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__264432__264433.cljs$lang$protocol_mask$partition4$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__264432__264433)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__264432__264433)
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
  list.cljs$lang$applyTo = function(arglist__264435) {
    var items = cljs.core.seq(arglist__264435);
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
  var this__264436 = this;
  var h__364__auto____264437 = this__264436.__hash;
  if(h__364__auto____264437 != null) {
    return h__364__auto____264437
  }else {
    var h__364__auto____264438 = cljs.core.hash_coll.call(null, coll);
    this__264436.__hash = h__364__auto____264438;
    return h__364__auto____264438
  }
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__264439 = this;
  return new cljs.core.Cons(null, o, coll, this__264439.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__264440 = this;
  var this$__264441 = this;
  return cljs.core.pr_str.call(null, this$__264441)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__264442 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__264443 = this;
  return this__264443.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__264444 = this;
  if(this__264444.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__264444.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__264445 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__264446 = this;
  return new cljs.core.Cons(meta, this__264446.first, this__264446.rest, this__264446.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__264447 = this;
  return this__264447.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__264448 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__264448.meta)
};
cljs.core.Cons.prototype.cljs$core$IList$ = true;
cljs.core.Cons;
cljs.core.cons = function cons(x, seq) {
  return new cljs.core.Cons(null, x, seq, null)
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__264449__264450 = x;
  if(G__264449__264450 != null) {
    if(function() {
      var or__3824__auto____264451 = G__264449__264450.cljs$lang$protocol_mask$partition3$ & 32;
      if(or__3824__auto____264451) {
        return or__3824__auto____264451
      }else {
        return G__264449__264450.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__264449__264450.cljs$lang$protocol_mask$partition3$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__264449__264450)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__264449__264450)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__264452 = null;
  var G__264452__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__264452__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__264452 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__264452__2.call(this, string, f);
      case 3:
        return G__264452__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__264452
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__264453 = null;
  var G__264453__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__264453__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__264453 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__264453__2.call(this, string, k);
      case 3:
        return G__264453__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__264453
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__264454 = null;
  var G__264454__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__264454__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__264454 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__264454__2.call(this, string, n);
      case 3:
        return G__264454__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__264454
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
  var G__264463 = null;
  var G__264463__2 = function(tsym264457, coll) {
    var tsym264457__264459 = this;
    var this$__264460 = tsym264457__264459;
    return cljs.core.get.call(null, coll, this$__264460.toString())
  };
  var G__264463__3 = function(tsym264458, coll, not_found) {
    var tsym264458__264461 = this;
    var this$__264462 = tsym264458__264461;
    return cljs.core.get.call(null, coll, this$__264462.toString(), not_found)
  };
  G__264463 = function(tsym264458, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__264463__2.call(this, tsym264458, coll);
      case 3:
        return G__264463__3.call(this, tsym264458, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__264463
}();
String.prototype.apply = function(tsym264455, args264456) {
  return tsym264455.call.apply(tsym264455, [tsym264455].concat(cljs.core.aclone.call(null, args264456)))
};
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__264464 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__264464
  }else {
    lazy_seq.x = x__264464.call(null);
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
  var this__264465 = this;
  var h__364__auto____264466 = this__264465.__hash;
  if(h__364__auto____264466 != null) {
    return h__364__auto____264466
  }else {
    var h__364__auto____264467 = cljs.core.hash_coll.call(null, coll);
    this__264465.__hash = h__364__auto____264467;
    return h__364__auto____264467
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__264468 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__264469 = this;
  var this$__264470 = this;
  return cljs.core.pr_str.call(null, this$__264470)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__264471 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__264472 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__264473 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__264474 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__264475 = this;
  return new cljs.core.LazySeq(meta, this__264475.realized, this__264475.x, this__264475.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__264476 = this;
  return this__264476.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__264477 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__264477.meta)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__264478 = [];
  var s__264479 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__264479))) {
      ary__264478.push(cljs.core.first.call(null, s__264479));
      var G__264480 = cljs.core.next.call(null, s__264479);
      s__264479 = G__264480;
      continue
    }else {
      return ary__264478
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__264481 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__264482 = 0;
  var xs__264483 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(xs__264483)) {
      ret__264481[i__264482] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__264483));
      var G__264484 = i__264482 + 1;
      var G__264485 = cljs.core.next.call(null, xs__264483);
      i__264482 = G__264484;
      xs__264483 = G__264485;
      continue
    }else {
    }
    break
  }
  return ret__264481
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
    var a__264486 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__264487 = cljs.core.seq.call(null, init_val_or_seq);
      var i__264488 = 0;
      var s__264489 = s__264487;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____264490 = s__264489;
          if(cljs.core.truth_(and__3822__auto____264490)) {
            return i__264488 < size
          }else {
            return and__3822__auto____264490
          }
        }())) {
          a__264486[i__264488] = cljs.core.first.call(null, s__264489);
          var G__264493 = i__264488 + 1;
          var G__264494 = cljs.core.next.call(null, s__264489);
          i__264488 = G__264493;
          s__264489 = G__264494;
          continue
        }else {
          return a__264486
        }
        break
      }
    }else {
      var n__653__auto____264491 = size;
      var i__264492 = 0;
      while(true) {
        if(i__264492 < n__653__auto____264491) {
          a__264486[i__264492] = init_val_or_seq;
          var G__264495 = i__264492 + 1;
          i__264492 = G__264495;
          continue
        }else {
        }
        break
      }
      return a__264486
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
    var a__264496 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__264497 = cljs.core.seq.call(null, init_val_or_seq);
      var i__264498 = 0;
      var s__264499 = s__264497;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____264500 = s__264499;
          if(cljs.core.truth_(and__3822__auto____264500)) {
            return i__264498 < size
          }else {
            return and__3822__auto____264500
          }
        }())) {
          a__264496[i__264498] = cljs.core.first.call(null, s__264499);
          var G__264503 = i__264498 + 1;
          var G__264504 = cljs.core.next.call(null, s__264499);
          i__264498 = G__264503;
          s__264499 = G__264504;
          continue
        }else {
          return a__264496
        }
        break
      }
    }else {
      var n__653__auto____264501 = size;
      var i__264502 = 0;
      while(true) {
        if(i__264502 < n__653__auto____264501) {
          a__264496[i__264502] = init_val_or_seq;
          var G__264505 = i__264502 + 1;
          i__264502 = G__264505;
          continue
        }else {
        }
        break
      }
      return a__264496
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
    var a__264506 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__264507 = cljs.core.seq.call(null, init_val_or_seq);
      var i__264508 = 0;
      var s__264509 = s__264507;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____264510 = s__264509;
          if(cljs.core.truth_(and__3822__auto____264510)) {
            return i__264508 < size
          }else {
            return and__3822__auto____264510
          }
        }())) {
          a__264506[i__264508] = cljs.core.first.call(null, s__264509);
          var G__264513 = i__264508 + 1;
          var G__264514 = cljs.core.next.call(null, s__264509);
          i__264508 = G__264513;
          s__264509 = G__264514;
          continue
        }else {
          return a__264506
        }
        break
      }
    }else {
      var n__653__auto____264511 = size;
      var i__264512 = 0;
      while(true) {
        if(i__264512 < n__653__auto____264511) {
          a__264506[i__264512] = init_val_or_seq;
          var G__264515 = i__264512 + 1;
          i__264512 = G__264515;
          continue
        }else {
        }
        break
      }
      return a__264506
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
  var s__264516 = s;
  var i__264517 = n;
  var sum__264518 = 0;
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____264519 = i__264517 > 0;
      if(and__3822__auto____264519) {
        return cljs.core.seq.call(null, s__264516)
      }else {
        return and__3822__auto____264519
      }
    }())) {
      var G__264520 = cljs.core.next.call(null, s__264516);
      var G__264521 = i__264517 - 1;
      var G__264522 = sum__264518 + 1;
      s__264516 = G__264520;
      i__264517 = G__264521;
      sum__264518 = G__264522;
      continue
    }else {
      return sum__264518
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
      var s__264523 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__264523)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__264523), concat.call(null, cljs.core.rest.call(null, s__264523), y))
      }else {
        return y
      }
    })
  };
  var concat__3 = function() {
    var G__264526__delegate = function(x, y, zs) {
      var cat__264525 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__264524 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__264524)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__264524), cat.call(null, cljs.core.rest.call(null, xys__264524), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__264525.call(null, concat.call(null, x, y), zs)
    };
    var G__264526 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__264526__delegate.call(this, x, y, zs)
    };
    G__264526.cljs$lang$maxFixedArity = 2;
    G__264526.cljs$lang$applyTo = function(arglist__264527) {
      var x = cljs.core.first(arglist__264527);
      var y = cljs.core.first(cljs.core.next(arglist__264527));
      var zs = cljs.core.rest(cljs.core.next(arglist__264527));
      return G__264526__delegate.call(this, x, y, zs)
    };
    return G__264526
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
    var G__264528__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__264528 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__264528__delegate.call(this, a, b, c, d, more)
    };
    G__264528.cljs$lang$maxFixedArity = 4;
    G__264528.cljs$lang$applyTo = function(arglist__264529) {
      var a = cljs.core.first(arglist__264529);
      var b = cljs.core.first(cljs.core.next(arglist__264529));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264529)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__264529))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__264529))));
      return G__264528__delegate.call(this, a, b, c, d, more)
    };
    return G__264528
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
    var fixed_arity__264530 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.bounded_count.call(null, args, fixed_arity__264530 + 1) <= fixed_arity__264530) {
        return f.apply(f, cljs.core.to_array.call(null, args))
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__264531 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__264532 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.bounded_count.call(null, arglist__264531, fixed_arity__264532) <= fixed_arity__264532) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__264531))
      }else {
        return f.cljs$lang$applyTo(arglist__264531)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__264531))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__264533 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__264534 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.bounded_count.call(null, arglist__264533, fixed_arity__264534) <= fixed_arity__264534) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__264533))
      }else {
        return f.cljs$lang$applyTo(arglist__264533)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__264533))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__264535 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__264536 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.bounded_count.call(null, arglist__264535, fixed_arity__264536) <= fixed_arity__264536) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__264535))
      }else {
        return f.cljs$lang$applyTo(arglist__264535)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__264535))
    }
  };
  var apply__6 = function() {
    var G__264539__delegate = function(f, a, b, c, d, args) {
      var arglist__264537 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__264538 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        if(cljs.core.bounded_count.call(null, arglist__264537, fixed_arity__264538) <= fixed_arity__264538) {
          return f.apply(f, cljs.core.to_array.call(null, arglist__264537))
        }else {
          return f.cljs$lang$applyTo(arglist__264537)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__264537))
      }
    };
    var G__264539 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__264539__delegate.call(this, f, a, b, c, d, args)
    };
    G__264539.cljs$lang$maxFixedArity = 5;
    G__264539.cljs$lang$applyTo = function(arglist__264540) {
      var f = cljs.core.first(arglist__264540);
      var a = cljs.core.first(cljs.core.next(arglist__264540));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264540)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__264540))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__264540)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__264540)))));
      return G__264539__delegate.call(this, f, a, b, c, d, args)
    };
    return G__264539
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
  vary_meta.cljs$lang$applyTo = function(arglist__264541) {
    var obj = cljs.core.first(arglist__264541);
    var f = cljs.core.first(cljs.core.next(arglist__264541));
    var args = cljs.core.rest(cljs.core.next(arglist__264541));
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
    var G__264542__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__264542 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__264542__delegate.call(this, x, y, more)
    };
    G__264542.cljs$lang$maxFixedArity = 2;
    G__264542.cljs$lang$applyTo = function(arglist__264543) {
      var x = cljs.core.first(arglist__264543);
      var y = cljs.core.first(cljs.core.next(arglist__264543));
      var more = cljs.core.rest(cljs.core.next(arglist__264543));
      return G__264542__delegate.call(this, x, y, more)
    };
    return G__264542
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
        var G__264544 = pred;
        var G__264545 = cljs.core.next.call(null, coll);
        pred = G__264544;
        coll = G__264545;
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
      var or__3824__auto____264546 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____264546)) {
        return or__3824__auto____264546
      }else {
        var G__264547 = pred;
        var G__264548 = cljs.core.next.call(null, coll);
        pred = G__264547;
        coll = G__264548;
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
    var G__264549 = null;
    var G__264549__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__264549__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__264549__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__264549__3 = function() {
      var G__264550__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__264550 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__264550__delegate.call(this, x, y, zs)
      };
      G__264550.cljs$lang$maxFixedArity = 2;
      G__264550.cljs$lang$applyTo = function(arglist__264551) {
        var x = cljs.core.first(arglist__264551);
        var y = cljs.core.first(cljs.core.next(arglist__264551));
        var zs = cljs.core.rest(cljs.core.next(arglist__264551));
        return G__264550__delegate.call(this, x, y, zs)
      };
      return G__264550
    }();
    G__264549 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__264549__0.call(this);
        case 1:
          return G__264549__1.call(this, x);
        case 2:
          return G__264549__2.call(this, x, y);
        default:
          return G__264549__3.apply(this, arguments)
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__264549.cljs$lang$maxFixedArity = 2;
    G__264549.cljs$lang$applyTo = G__264549__3.cljs$lang$applyTo;
    return G__264549
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__264552__delegate = function(args) {
      return x
    };
    var G__264552 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__264552__delegate.call(this, args)
    };
    G__264552.cljs$lang$maxFixedArity = 0;
    G__264552.cljs$lang$applyTo = function(arglist__264553) {
      var args = cljs.core.seq(arglist__264553);
      return G__264552__delegate.call(this, args)
    };
    return G__264552
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
      var G__264557 = null;
      var G__264557__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__264557__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__264557__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__264557__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__264557__4 = function() {
        var G__264558__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__264558 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__264558__delegate.call(this, x, y, z, args)
        };
        G__264558.cljs$lang$maxFixedArity = 3;
        G__264558.cljs$lang$applyTo = function(arglist__264559) {
          var x = cljs.core.first(arglist__264559);
          var y = cljs.core.first(cljs.core.next(arglist__264559));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264559)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__264559)));
          return G__264558__delegate.call(this, x, y, z, args)
        };
        return G__264558
      }();
      G__264557 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__264557__0.call(this);
          case 1:
            return G__264557__1.call(this, x);
          case 2:
            return G__264557__2.call(this, x, y);
          case 3:
            return G__264557__3.call(this, x, y, z);
          default:
            return G__264557__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__264557.cljs$lang$maxFixedArity = 3;
      G__264557.cljs$lang$applyTo = G__264557__4.cljs$lang$applyTo;
      return G__264557
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__264560 = null;
      var G__264560__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__264560__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__264560__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__264560__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__264560__4 = function() {
        var G__264561__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__264561 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__264561__delegate.call(this, x, y, z, args)
        };
        G__264561.cljs$lang$maxFixedArity = 3;
        G__264561.cljs$lang$applyTo = function(arglist__264562) {
          var x = cljs.core.first(arglist__264562);
          var y = cljs.core.first(cljs.core.next(arglist__264562));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264562)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__264562)));
          return G__264561__delegate.call(this, x, y, z, args)
        };
        return G__264561
      }();
      G__264560 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__264560__0.call(this);
          case 1:
            return G__264560__1.call(this, x);
          case 2:
            return G__264560__2.call(this, x, y);
          case 3:
            return G__264560__3.call(this, x, y, z);
          default:
            return G__264560__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__264560.cljs$lang$maxFixedArity = 3;
      G__264560.cljs$lang$applyTo = G__264560__4.cljs$lang$applyTo;
      return G__264560
    }()
  };
  var comp__4 = function() {
    var G__264563__delegate = function(f1, f2, f3, fs) {
      var fs__264554 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__264564__delegate = function(args) {
          var ret__264555 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__264554), args);
          var fs__264556 = cljs.core.next.call(null, fs__264554);
          while(true) {
            if(cljs.core.truth_(fs__264556)) {
              var G__264565 = cljs.core.first.call(null, fs__264556).call(null, ret__264555);
              var G__264566 = cljs.core.next.call(null, fs__264556);
              ret__264555 = G__264565;
              fs__264556 = G__264566;
              continue
            }else {
              return ret__264555
            }
            break
          }
        };
        var G__264564 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__264564__delegate.call(this, args)
        };
        G__264564.cljs$lang$maxFixedArity = 0;
        G__264564.cljs$lang$applyTo = function(arglist__264567) {
          var args = cljs.core.seq(arglist__264567);
          return G__264564__delegate.call(this, args)
        };
        return G__264564
      }()
    };
    var G__264563 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__264563__delegate.call(this, f1, f2, f3, fs)
    };
    G__264563.cljs$lang$maxFixedArity = 3;
    G__264563.cljs$lang$applyTo = function(arglist__264568) {
      var f1 = cljs.core.first(arglist__264568);
      var f2 = cljs.core.first(cljs.core.next(arglist__264568));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264568)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__264568)));
      return G__264563__delegate.call(this, f1, f2, f3, fs)
    };
    return G__264563
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
      var G__264569__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__264569 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__264569__delegate.call(this, args)
      };
      G__264569.cljs$lang$maxFixedArity = 0;
      G__264569.cljs$lang$applyTo = function(arglist__264570) {
        var args = cljs.core.seq(arglist__264570);
        return G__264569__delegate.call(this, args)
      };
      return G__264569
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__264571__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__264571 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__264571__delegate.call(this, args)
      };
      G__264571.cljs$lang$maxFixedArity = 0;
      G__264571.cljs$lang$applyTo = function(arglist__264572) {
        var args = cljs.core.seq(arglist__264572);
        return G__264571__delegate.call(this, args)
      };
      return G__264571
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__264573__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__264573 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__264573__delegate.call(this, args)
      };
      G__264573.cljs$lang$maxFixedArity = 0;
      G__264573.cljs$lang$applyTo = function(arglist__264574) {
        var args = cljs.core.seq(arglist__264574);
        return G__264573__delegate.call(this, args)
      };
      return G__264573
    }()
  };
  var partial__5 = function() {
    var G__264575__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__264576__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__264576 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__264576__delegate.call(this, args)
        };
        G__264576.cljs$lang$maxFixedArity = 0;
        G__264576.cljs$lang$applyTo = function(arglist__264577) {
          var args = cljs.core.seq(arglist__264577);
          return G__264576__delegate.call(this, args)
        };
        return G__264576
      }()
    };
    var G__264575 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__264575__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__264575.cljs$lang$maxFixedArity = 4;
    G__264575.cljs$lang$applyTo = function(arglist__264578) {
      var f = cljs.core.first(arglist__264578);
      var arg1 = cljs.core.first(cljs.core.next(arglist__264578));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264578)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__264578))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__264578))));
      return G__264575__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    return G__264575
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
      var G__264579 = null;
      var G__264579__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__264579__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__264579__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__264579__4 = function() {
        var G__264580__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__264580 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__264580__delegate.call(this, a, b, c, ds)
        };
        G__264580.cljs$lang$maxFixedArity = 3;
        G__264580.cljs$lang$applyTo = function(arglist__264581) {
          var a = cljs.core.first(arglist__264581);
          var b = cljs.core.first(cljs.core.next(arglist__264581));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264581)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__264581)));
          return G__264580__delegate.call(this, a, b, c, ds)
        };
        return G__264580
      }();
      G__264579 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__264579__1.call(this, a);
          case 2:
            return G__264579__2.call(this, a, b);
          case 3:
            return G__264579__3.call(this, a, b, c);
          default:
            return G__264579__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__264579.cljs$lang$maxFixedArity = 3;
      G__264579.cljs$lang$applyTo = G__264579__4.cljs$lang$applyTo;
      return G__264579
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__264582 = null;
      var G__264582__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__264582__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__264582__4 = function() {
        var G__264583__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__264583 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__264583__delegate.call(this, a, b, c, ds)
        };
        G__264583.cljs$lang$maxFixedArity = 3;
        G__264583.cljs$lang$applyTo = function(arglist__264584) {
          var a = cljs.core.first(arglist__264584);
          var b = cljs.core.first(cljs.core.next(arglist__264584));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264584)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__264584)));
          return G__264583__delegate.call(this, a, b, c, ds)
        };
        return G__264583
      }();
      G__264582 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__264582__2.call(this, a, b);
          case 3:
            return G__264582__3.call(this, a, b, c);
          default:
            return G__264582__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__264582.cljs$lang$maxFixedArity = 3;
      G__264582.cljs$lang$applyTo = G__264582__4.cljs$lang$applyTo;
      return G__264582
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__264585 = null;
      var G__264585__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__264585__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__264585__4 = function() {
        var G__264586__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__264586 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__264586__delegate.call(this, a, b, c, ds)
        };
        G__264586.cljs$lang$maxFixedArity = 3;
        G__264586.cljs$lang$applyTo = function(arglist__264587) {
          var a = cljs.core.first(arglist__264587);
          var b = cljs.core.first(cljs.core.next(arglist__264587));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264587)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__264587)));
          return G__264586__delegate.call(this, a, b, c, ds)
        };
        return G__264586
      }();
      G__264585 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__264585__2.call(this, a, b);
          case 3:
            return G__264585__3.call(this, a, b, c);
          default:
            return G__264585__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__264585.cljs$lang$maxFixedArity = 3;
      G__264585.cljs$lang$applyTo = G__264585__4.cljs$lang$applyTo;
      return G__264585
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
  var mapi__264590 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____264588 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____264588)) {
        var s__264589 = temp__3974__auto____264588;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__264589)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__264589)))
      }else {
        return null
      }
    })
  };
  return mapi__264590.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____264591 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____264591)) {
      var s__264592 = temp__3974__auto____264591;
      var x__264593 = f.call(null, cljs.core.first.call(null, s__264592));
      if(x__264593 == null) {
        return keep.call(null, f, cljs.core.rest.call(null, s__264592))
      }else {
        return cljs.core.cons.call(null, x__264593, keep.call(null, f, cljs.core.rest.call(null, s__264592)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__264603 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____264600 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____264600)) {
        var s__264601 = temp__3974__auto____264600;
        var x__264602 = f.call(null, idx, cljs.core.first.call(null, s__264601));
        if(x__264602 == null) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__264601))
        }else {
          return cljs.core.cons.call(null, x__264602, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__264601)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__264603.call(null, 0, coll)
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
          var and__3822__auto____264610 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____264610)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____264610
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____264611 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____264611)) {
            var and__3822__auto____264612 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____264612)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____264612
            }
          }else {
            return and__3822__auto____264611
          }
        }())
      };
      var ep1__4 = function() {
        var G__264648__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____264613 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____264613)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____264613
            }
          }())
        };
        var G__264648 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__264648__delegate.call(this, x, y, z, args)
        };
        G__264648.cljs$lang$maxFixedArity = 3;
        G__264648.cljs$lang$applyTo = function(arglist__264649) {
          var x = cljs.core.first(arglist__264649);
          var y = cljs.core.first(cljs.core.next(arglist__264649));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264649)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__264649)));
          return G__264648__delegate.call(this, x, y, z, args)
        };
        return G__264648
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
          var and__3822__auto____264614 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____264614)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____264614
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____264615 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____264615)) {
            var and__3822__auto____264616 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____264616)) {
              var and__3822__auto____264617 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____264617)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____264617
              }
            }else {
              return and__3822__auto____264616
            }
          }else {
            return and__3822__auto____264615
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____264618 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____264618)) {
            var and__3822__auto____264619 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____264619)) {
              var and__3822__auto____264620 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____264620)) {
                var and__3822__auto____264621 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____264621)) {
                  var and__3822__auto____264622 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____264622)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____264622
                  }
                }else {
                  return and__3822__auto____264621
                }
              }else {
                return and__3822__auto____264620
              }
            }else {
              return and__3822__auto____264619
            }
          }else {
            return and__3822__auto____264618
          }
        }())
      };
      var ep2__4 = function() {
        var G__264650__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____264623 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____264623)) {
              return cljs.core.every_QMARK_.call(null, function(p1__264594_SHARP_) {
                var and__3822__auto____264624 = p1.call(null, p1__264594_SHARP_);
                if(cljs.core.truth_(and__3822__auto____264624)) {
                  return p2.call(null, p1__264594_SHARP_)
                }else {
                  return and__3822__auto____264624
                }
              }, args)
            }else {
              return and__3822__auto____264623
            }
          }())
        };
        var G__264650 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__264650__delegate.call(this, x, y, z, args)
        };
        G__264650.cljs$lang$maxFixedArity = 3;
        G__264650.cljs$lang$applyTo = function(arglist__264651) {
          var x = cljs.core.first(arglist__264651);
          var y = cljs.core.first(cljs.core.next(arglist__264651));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264651)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__264651)));
          return G__264650__delegate.call(this, x, y, z, args)
        };
        return G__264650
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
          var and__3822__auto____264625 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____264625)) {
            var and__3822__auto____264626 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____264626)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____264626
            }
          }else {
            return and__3822__auto____264625
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____264627 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____264627)) {
            var and__3822__auto____264628 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____264628)) {
              var and__3822__auto____264629 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____264629)) {
                var and__3822__auto____264630 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____264630)) {
                  var and__3822__auto____264631 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____264631)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____264631
                  }
                }else {
                  return and__3822__auto____264630
                }
              }else {
                return and__3822__auto____264629
              }
            }else {
              return and__3822__auto____264628
            }
          }else {
            return and__3822__auto____264627
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____264632 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____264632)) {
            var and__3822__auto____264633 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____264633)) {
              var and__3822__auto____264634 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____264634)) {
                var and__3822__auto____264635 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____264635)) {
                  var and__3822__auto____264636 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____264636)) {
                    var and__3822__auto____264637 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____264637)) {
                      var and__3822__auto____264638 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____264638)) {
                        var and__3822__auto____264639 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____264639)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____264639
                        }
                      }else {
                        return and__3822__auto____264638
                      }
                    }else {
                      return and__3822__auto____264637
                    }
                  }else {
                    return and__3822__auto____264636
                  }
                }else {
                  return and__3822__auto____264635
                }
              }else {
                return and__3822__auto____264634
              }
            }else {
              return and__3822__auto____264633
            }
          }else {
            return and__3822__auto____264632
          }
        }())
      };
      var ep3__4 = function() {
        var G__264652__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____264640 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____264640)) {
              return cljs.core.every_QMARK_.call(null, function(p1__264595_SHARP_) {
                var and__3822__auto____264641 = p1.call(null, p1__264595_SHARP_);
                if(cljs.core.truth_(and__3822__auto____264641)) {
                  var and__3822__auto____264642 = p2.call(null, p1__264595_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____264642)) {
                    return p3.call(null, p1__264595_SHARP_)
                  }else {
                    return and__3822__auto____264642
                  }
                }else {
                  return and__3822__auto____264641
                }
              }, args)
            }else {
              return and__3822__auto____264640
            }
          }())
        };
        var G__264652 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__264652__delegate.call(this, x, y, z, args)
        };
        G__264652.cljs$lang$maxFixedArity = 3;
        G__264652.cljs$lang$applyTo = function(arglist__264653) {
          var x = cljs.core.first(arglist__264653);
          var y = cljs.core.first(cljs.core.next(arglist__264653));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264653)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__264653)));
          return G__264652__delegate.call(this, x, y, z, args)
        };
        return G__264652
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
    var G__264654__delegate = function(p1, p2, p3, ps) {
      var ps__264643 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__264596_SHARP_) {
            return p1__264596_SHARP_.call(null, x)
          }, ps__264643)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__264597_SHARP_) {
            var and__3822__auto____264644 = p1__264597_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____264644)) {
              return p1__264597_SHARP_.call(null, y)
            }else {
              return and__3822__auto____264644
            }
          }, ps__264643)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__264598_SHARP_) {
            var and__3822__auto____264645 = p1__264598_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____264645)) {
              var and__3822__auto____264646 = p1__264598_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____264646)) {
                return p1__264598_SHARP_.call(null, z)
              }else {
                return and__3822__auto____264646
              }
            }else {
              return and__3822__auto____264645
            }
          }, ps__264643)
        };
        var epn__4 = function() {
          var G__264655__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____264647 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____264647)) {
                return cljs.core.every_QMARK_.call(null, function(p1__264599_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__264599_SHARP_, args)
                }, ps__264643)
              }else {
                return and__3822__auto____264647
              }
            }())
          };
          var G__264655 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__264655__delegate.call(this, x, y, z, args)
          };
          G__264655.cljs$lang$maxFixedArity = 3;
          G__264655.cljs$lang$applyTo = function(arglist__264656) {
            var x = cljs.core.first(arglist__264656);
            var y = cljs.core.first(cljs.core.next(arglist__264656));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264656)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__264656)));
            return G__264655__delegate.call(this, x, y, z, args)
          };
          return G__264655
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
    var G__264654 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__264654__delegate.call(this, p1, p2, p3, ps)
    };
    G__264654.cljs$lang$maxFixedArity = 3;
    G__264654.cljs$lang$applyTo = function(arglist__264657) {
      var p1 = cljs.core.first(arglist__264657);
      var p2 = cljs.core.first(cljs.core.next(arglist__264657));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264657)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__264657)));
      return G__264654__delegate.call(this, p1, p2, p3, ps)
    };
    return G__264654
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
        var or__3824__auto____264659 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____264659)) {
          return or__3824__auto____264659
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____264660 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____264660)) {
          return or__3824__auto____264660
        }else {
          var or__3824__auto____264661 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____264661)) {
            return or__3824__auto____264661
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__264697__delegate = function(x, y, z, args) {
          var or__3824__auto____264662 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____264662)) {
            return or__3824__auto____264662
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__264697 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__264697__delegate.call(this, x, y, z, args)
        };
        G__264697.cljs$lang$maxFixedArity = 3;
        G__264697.cljs$lang$applyTo = function(arglist__264698) {
          var x = cljs.core.first(arglist__264698);
          var y = cljs.core.first(cljs.core.next(arglist__264698));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264698)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__264698)));
          return G__264697__delegate.call(this, x, y, z, args)
        };
        return G__264697
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
        var or__3824__auto____264663 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____264663)) {
          return or__3824__auto____264663
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____264664 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____264664)) {
          return or__3824__auto____264664
        }else {
          var or__3824__auto____264665 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____264665)) {
            return or__3824__auto____264665
          }else {
            var or__3824__auto____264666 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____264666)) {
              return or__3824__auto____264666
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____264667 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____264667)) {
          return or__3824__auto____264667
        }else {
          var or__3824__auto____264668 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____264668)) {
            return or__3824__auto____264668
          }else {
            var or__3824__auto____264669 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____264669)) {
              return or__3824__auto____264669
            }else {
              var or__3824__auto____264670 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____264670)) {
                return or__3824__auto____264670
              }else {
                var or__3824__auto____264671 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____264671)) {
                  return or__3824__auto____264671
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__264699__delegate = function(x, y, z, args) {
          var or__3824__auto____264672 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____264672)) {
            return or__3824__auto____264672
          }else {
            return cljs.core.some.call(null, function(p1__264604_SHARP_) {
              var or__3824__auto____264673 = p1.call(null, p1__264604_SHARP_);
              if(cljs.core.truth_(or__3824__auto____264673)) {
                return or__3824__auto____264673
              }else {
                return p2.call(null, p1__264604_SHARP_)
              }
            }, args)
          }
        };
        var G__264699 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__264699__delegate.call(this, x, y, z, args)
        };
        G__264699.cljs$lang$maxFixedArity = 3;
        G__264699.cljs$lang$applyTo = function(arglist__264700) {
          var x = cljs.core.first(arglist__264700);
          var y = cljs.core.first(cljs.core.next(arglist__264700));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264700)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__264700)));
          return G__264699__delegate.call(this, x, y, z, args)
        };
        return G__264699
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
        var or__3824__auto____264674 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____264674)) {
          return or__3824__auto____264674
        }else {
          var or__3824__auto____264675 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____264675)) {
            return or__3824__auto____264675
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____264676 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____264676)) {
          return or__3824__auto____264676
        }else {
          var or__3824__auto____264677 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____264677)) {
            return or__3824__auto____264677
          }else {
            var or__3824__auto____264678 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____264678)) {
              return or__3824__auto____264678
            }else {
              var or__3824__auto____264679 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____264679)) {
                return or__3824__auto____264679
              }else {
                var or__3824__auto____264680 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____264680)) {
                  return or__3824__auto____264680
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____264681 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____264681)) {
          return or__3824__auto____264681
        }else {
          var or__3824__auto____264682 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____264682)) {
            return or__3824__auto____264682
          }else {
            var or__3824__auto____264683 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____264683)) {
              return or__3824__auto____264683
            }else {
              var or__3824__auto____264684 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____264684)) {
                return or__3824__auto____264684
              }else {
                var or__3824__auto____264685 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____264685)) {
                  return or__3824__auto____264685
                }else {
                  var or__3824__auto____264686 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____264686)) {
                    return or__3824__auto____264686
                  }else {
                    var or__3824__auto____264687 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____264687)) {
                      return or__3824__auto____264687
                    }else {
                      var or__3824__auto____264688 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____264688)) {
                        return or__3824__auto____264688
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
        var G__264701__delegate = function(x, y, z, args) {
          var or__3824__auto____264689 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____264689)) {
            return or__3824__auto____264689
          }else {
            return cljs.core.some.call(null, function(p1__264605_SHARP_) {
              var or__3824__auto____264690 = p1.call(null, p1__264605_SHARP_);
              if(cljs.core.truth_(or__3824__auto____264690)) {
                return or__3824__auto____264690
              }else {
                var or__3824__auto____264691 = p2.call(null, p1__264605_SHARP_);
                if(cljs.core.truth_(or__3824__auto____264691)) {
                  return or__3824__auto____264691
                }else {
                  return p3.call(null, p1__264605_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__264701 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__264701__delegate.call(this, x, y, z, args)
        };
        G__264701.cljs$lang$maxFixedArity = 3;
        G__264701.cljs$lang$applyTo = function(arglist__264702) {
          var x = cljs.core.first(arglist__264702);
          var y = cljs.core.first(cljs.core.next(arglist__264702));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264702)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__264702)));
          return G__264701__delegate.call(this, x, y, z, args)
        };
        return G__264701
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
    var G__264703__delegate = function(p1, p2, p3, ps) {
      var ps__264692 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__264606_SHARP_) {
            return p1__264606_SHARP_.call(null, x)
          }, ps__264692)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__264607_SHARP_) {
            var or__3824__auto____264693 = p1__264607_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____264693)) {
              return or__3824__auto____264693
            }else {
              return p1__264607_SHARP_.call(null, y)
            }
          }, ps__264692)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__264608_SHARP_) {
            var or__3824__auto____264694 = p1__264608_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____264694)) {
              return or__3824__auto____264694
            }else {
              var or__3824__auto____264695 = p1__264608_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____264695)) {
                return or__3824__auto____264695
              }else {
                return p1__264608_SHARP_.call(null, z)
              }
            }
          }, ps__264692)
        };
        var spn__4 = function() {
          var G__264704__delegate = function(x, y, z, args) {
            var or__3824__auto____264696 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____264696)) {
              return or__3824__auto____264696
            }else {
              return cljs.core.some.call(null, function(p1__264609_SHARP_) {
                return cljs.core.some.call(null, p1__264609_SHARP_, args)
              }, ps__264692)
            }
          };
          var G__264704 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__264704__delegate.call(this, x, y, z, args)
          };
          G__264704.cljs$lang$maxFixedArity = 3;
          G__264704.cljs$lang$applyTo = function(arglist__264705) {
            var x = cljs.core.first(arglist__264705);
            var y = cljs.core.first(cljs.core.next(arglist__264705));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264705)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__264705)));
            return G__264704__delegate.call(this, x, y, z, args)
          };
          return G__264704
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
    var G__264703 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__264703__delegate.call(this, p1, p2, p3, ps)
    };
    G__264703.cljs$lang$maxFixedArity = 3;
    G__264703.cljs$lang$applyTo = function(arglist__264706) {
      var p1 = cljs.core.first(arglist__264706);
      var p2 = cljs.core.first(cljs.core.next(arglist__264706));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264706)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__264706)));
      return G__264703__delegate.call(this, p1, p2, p3, ps)
    };
    return G__264703
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
      var temp__3974__auto____264707 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____264707)) {
        var s__264708 = temp__3974__auto____264707;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__264708)), map.call(null, f, cljs.core.rest.call(null, s__264708)))
      }else {
        return null
      }
    })
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__264709 = cljs.core.seq.call(null, c1);
      var s2__264710 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____264711 = s1__264709;
        if(cljs.core.truth_(and__3822__auto____264711)) {
          return s2__264710
        }else {
          return and__3822__auto____264711
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__264709), cljs.core.first.call(null, s2__264710)), map.call(null, f, cljs.core.rest.call(null, s1__264709), cljs.core.rest.call(null, s2__264710)))
      }else {
        return null
      }
    })
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__264712 = cljs.core.seq.call(null, c1);
      var s2__264713 = cljs.core.seq.call(null, c2);
      var s3__264714 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3822__auto____264715 = s1__264712;
        if(cljs.core.truth_(and__3822__auto____264715)) {
          var and__3822__auto____264716 = s2__264713;
          if(cljs.core.truth_(and__3822__auto____264716)) {
            return s3__264714
          }else {
            return and__3822__auto____264716
          }
        }else {
          return and__3822__auto____264715
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__264712), cljs.core.first.call(null, s2__264713), cljs.core.first.call(null, s3__264714)), map.call(null, f, cljs.core.rest.call(null, s1__264712), cljs.core.rest.call(null, s2__264713), cljs.core.rest.call(null, s3__264714)))
      }else {
        return null
      }
    })
  };
  var map__5 = function() {
    var G__264719__delegate = function(f, c1, c2, c3, colls) {
      var step__264718 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__264717 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__264717)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__264717), step.call(null, map.call(null, cljs.core.rest, ss__264717)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__264658_SHARP_) {
        return cljs.core.apply.call(null, f, p1__264658_SHARP_)
      }, step__264718.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__264719 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__264719__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__264719.cljs$lang$maxFixedArity = 4;
    G__264719.cljs$lang$applyTo = function(arglist__264720) {
      var f = cljs.core.first(arglist__264720);
      var c1 = cljs.core.first(cljs.core.next(arglist__264720));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264720)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__264720))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__264720))));
      return G__264719__delegate.call(this, f, c1, c2, c3, colls)
    };
    return G__264719
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
      var temp__3974__auto____264721 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____264721)) {
        var s__264722 = temp__3974__auto____264721;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__264722), take.call(null, n - 1, cljs.core.rest.call(null, s__264722)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__264725 = function(n, coll) {
    while(true) {
      var s__264723 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____264724 = n > 0;
        if(and__3822__auto____264724) {
          return s__264723
        }else {
          return and__3822__auto____264724
        }
      }())) {
        var G__264726 = n - 1;
        var G__264727 = cljs.core.rest.call(null, s__264723);
        n = G__264726;
        coll = G__264727;
        continue
      }else {
        return s__264723
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__264725.call(null, n, coll)
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
  var s__264728 = cljs.core.seq.call(null, coll);
  var lead__264729 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__264729)) {
      var G__264730 = cljs.core.next.call(null, s__264728);
      var G__264731 = cljs.core.next.call(null, lead__264729);
      s__264728 = G__264730;
      lead__264729 = G__264731;
      continue
    }else {
      return s__264728
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__264734 = function(pred, coll) {
    while(true) {
      var s__264732 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____264733 = s__264732;
        if(cljs.core.truth_(and__3822__auto____264733)) {
          return pred.call(null, cljs.core.first.call(null, s__264732))
        }else {
          return and__3822__auto____264733
        }
      }())) {
        var G__264735 = pred;
        var G__264736 = cljs.core.rest.call(null, s__264732);
        pred = G__264735;
        coll = G__264736;
        continue
      }else {
        return s__264732
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__264734.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____264737 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____264737)) {
      var s__264738 = temp__3974__auto____264737;
      return cljs.core.concat.call(null, s__264738, cycle.call(null, s__264738))
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
      var s1__264739 = cljs.core.seq.call(null, c1);
      var s2__264740 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____264741 = s1__264739;
        if(cljs.core.truth_(and__3822__auto____264741)) {
          return s2__264740
        }else {
          return and__3822__auto____264741
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__264739), cljs.core.cons.call(null, cljs.core.first.call(null, s2__264740), interleave.call(null, cljs.core.rest.call(null, s1__264739), cljs.core.rest.call(null, s2__264740))))
      }else {
        return null
      }
    })
  };
  var interleave__3 = function() {
    var G__264743__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__264742 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__264742)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__264742), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__264742)))
        }else {
          return null
        }
      })
    };
    var G__264743 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__264743__delegate.call(this, c1, c2, colls)
    };
    G__264743.cljs$lang$maxFixedArity = 2;
    G__264743.cljs$lang$applyTo = function(arglist__264744) {
      var c1 = cljs.core.first(arglist__264744);
      var c2 = cljs.core.first(cljs.core.next(arglist__264744));
      var colls = cljs.core.rest(cljs.core.next(arglist__264744));
      return G__264743__delegate.call(this, c1, c2, colls)
    };
    return G__264743
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
  var cat__264747 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____264745 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____264745)) {
        var coll__264746 = temp__3971__auto____264745;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__264746), cat.call(null, cljs.core.rest.call(null, coll__264746), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__264747.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__264748__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__264748 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__264748__delegate.call(this, f, coll, colls)
    };
    G__264748.cljs$lang$maxFixedArity = 2;
    G__264748.cljs$lang$applyTo = function(arglist__264749) {
      var f = cljs.core.first(arglist__264749);
      var coll = cljs.core.first(cljs.core.next(arglist__264749));
      var colls = cljs.core.rest(cljs.core.next(arglist__264749));
      return G__264748__delegate.call(this, f, coll, colls)
    };
    return G__264748
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
    var temp__3974__auto____264750 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____264750)) {
      var s__264751 = temp__3974__auto____264750;
      var f__264752 = cljs.core.first.call(null, s__264751);
      var r__264753 = cljs.core.rest.call(null, s__264751);
      if(cljs.core.truth_(pred.call(null, f__264752))) {
        return cljs.core.cons.call(null, f__264752, filter.call(null, pred, r__264753))
      }else {
        return filter.call(null, pred, r__264753)
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
  var walk__264755 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__264755.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__264754_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__264754_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__264756__264757 = to;
    if(G__264756__264757 != null) {
      if(function() {
        var or__3824__auto____264758 = G__264756__264757.cljs$lang$protocol_mask$partition5$ & 1;
        if(or__3824__auto____264758) {
          return or__3824__auto____264758
        }else {
          return G__264756__264757.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__264756__264757.cljs$lang$protocol_mask$partition5$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__264756__264757)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__264756__264757)
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
      var temp__3974__auto____264759 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____264759)) {
        var s__264760 = temp__3974__auto____264759;
        var p__264761 = cljs.core.take.call(null, n, s__264760);
        if(n === cljs.core.count.call(null, p__264761)) {
          return cljs.core.cons.call(null, p__264761, partition.call(null, n, step, cljs.core.drop.call(null, step, s__264760)))
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
      var temp__3974__auto____264762 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____264762)) {
        var s__264763 = temp__3974__auto____264762;
        var p__264764 = cljs.core.take.call(null, n, s__264763);
        if(n === cljs.core.count.call(null, p__264764)) {
          return cljs.core.cons.call(null, p__264764, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__264763)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__264764, pad)))
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
    var sentinel__264765 = cljs.core.lookup_sentinel;
    var m__264766 = m;
    var ks__264767 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__264767)) {
        var m__264768 = cljs.core.get.call(null, m__264766, cljs.core.first.call(null, ks__264767), sentinel__264765);
        if(sentinel__264765 === m__264768) {
          return not_found
        }else {
          var G__264769 = sentinel__264765;
          var G__264770 = m__264768;
          var G__264771 = cljs.core.next.call(null, ks__264767);
          sentinel__264765 = G__264769;
          m__264766 = G__264770;
          ks__264767 = G__264771;
          continue
        }
      }else {
        return m__264766
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
cljs.core.assoc_in = function assoc_in(m, p__264772, v) {
  var vec__264773__264774 = p__264772;
  var k__264775 = cljs.core.nth.call(null, vec__264773__264774, 0, null);
  var ks__264776 = cljs.core.nthnext.call(null, vec__264773__264774, 1);
  if(cljs.core.truth_(ks__264776)) {
    return cljs.core.assoc.call(null, m, k__264775, assoc_in.call(null, cljs.core.get.call(null, m, k__264775), ks__264776, v))
  }else {
    return cljs.core.assoc.call(null, m, k__264775, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__264777, f, args) {
    var vec__264778__264779 = p__264777;
    var k__264780 = cljs.core.nth.call(null, vec__264778__264779, 0, null);
    var ks__264781 = cljs.core.nthnext.call(null, vec__264778__264779, 1);
    if(cljs.core.truth_(ks__264781)) {
      return cljs.core.assoc.call(null, m, k__264780, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__264780), ks__264781, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__264780, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__264780), args))
    }
  };
  var update_in = function(m, p__264777, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__264777, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__264782) {
    var m = cljs.core.first(arglist__264782);
    var p__264777 = cljs.core.first(cljs.core.next(arglist__264782));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__264782)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__264782)));
    return update_in__delegate.call(this, m, p__264777, f, args)
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
  var this__264787 = this;
  var h__364__auto____264788 = this__264787.__hash;
  if(h__364__auto____264788 != null) {
    return h__364__auto____264788
  }else {
    var h__364__auto____264789 = cljs.core.hash_coll.call(null, coll);
    this__264787.__hash = h__364__auto____264789;
    return h__364__auto____264789
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__264790 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__264791 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__264792 = this;
  var new_array__264793 = cljs.core.aclone.call(null, this__264792.array);
  new_array__264793[k] = v;
  return new cljs.core.Vector(this__264792.meta, new_array__264793, null)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__264822 = null;
  var G__264822__2 = function(tsym264785, k) {
    var this__264794 = this;
    var tsym264785__264795 = this;
    var coll__264796 = tsym264785__264795;
    return cljs.core._lookup.call(null, coll__264796, k)
  };
  var G__264822__3 = function(tsym264786, k, not_found) {
    var this__264797 = this;
    var tsym264786__264798 = this;
    var coll__264799 = tsym264786__264798;
    return cljs.core._lookup.call(null, coll__264799, k, not_found)
  };
  G__264822 = function(tsym264786, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__264822__2.call(this, tsym264786, k);
      case 3:
        return G__264822__3.call(this, tsym264786, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__264822
}();
cljs.core.Vector.prototype.apply = function(tsym264783, args264784) {
  return tsym264783.call.apply(tsym264783, [tsym264783].concat(cljs.core.aclone.call(null, args264784)))
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__264800 = this;
  var new_array__264801 = cljs.core.aclone.call(null, this__264800.array);
  new_array__264801.push(o);
  return new cljs.core.Vector(this__264800.meta, new_array__264801, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__264802 = this;
  var this$__264803 = this;
  return cljs.core.pr_str.call(null, this$__264803)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__264804 = this;
  return cljs.core.ci_reduce.call(null, this__264804.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__264805 = this;
  return cljs.core.ci_reduce.call(null, this__264805.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__264806 = this;
  if(this__264806.array.length > 0) {
    var vector_seq__264807 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__264806.array.length) {
          return cljs.core.cons.call(null, this__264806.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__264807.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__264808 = this;
  return this__264808.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__264809 = this;
  var count__264810 = this__264809.array.length;
  if(count__264810 > 0) {
    return this__264809.array[count__264810 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__264811 = this;
  if(this__264811.array.length > 0) {
    var new_array__264812 = cljs.core.aclone.call(null, this__264811.array);
    new_array__264812.pop();
    return new cljs.core.Vector(this__264811.meta, new_array__264812, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__264813 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__264814 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__264815 = this;
  return new cljs.core.Vector(meta, this__264815.array, this__264815.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__264816 = this;
  return this__264816.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__264818 = this;
  if(function() {
    var and__3822__auto____264819 = 0 <= n;
    if(and__3822__auto____264819) {
      return n < this__264818.array.length
    }else {
      return and__3822__auto____264819
    }
  }()) {
    return this__264818.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__264820 = this;
  if(function() {
    var and__3822__auto____264821 = 0 <= n;
    if(and__3822__auto____264821) {
      return n < this__264820.array.length
    }else {
      return and__3822__auto____264821
    }
  }()) {
    return this__264820.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__264817 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__264817.meta)
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
  var cnt__264823 = pv.cnt;
  if(cnt__264823 < 32) {
    return 0
  }else {
    return cnt__264823 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__264824 = level;
  var ret__264825 = node;
  while(true) {
    if(ll__264824 === 0) {
      return ret__264825
    }else {
      var embed__264826 = ret__264825;
      var r__264827 = cljs.core.pv_fresh_node.call(null, edit);
      var ___264828 = cljs.core.pv_aset.call(null, r__264827, 0, embed__264826);
      var G__264829 = ll__264824 - 5;
      var G__264830 = r__264827;
      ll__264824 = G__264829;
      ret__264825 = G__264830;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__264831 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__264832 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__264831, subidx__264832, tailnode);
    return ret__264831
  }else {
    var temp__3971__auto____264833 = cljs.core.pv_aget.call(null, parent, subidx__264832);
    if(cljs.core.truth_(temp__3971__auto____264833)) {
      var child__264834 = temp__3971__auto____264833;
      var node_to_insert__264835 = push_tail.call(null, pv, level - 5, child__264834, tailnode);
      cljs.core.pv_aset.call(null, ret__264831, subidx__264832, node_to_insert__264835);
      return ret__264831
    }else {
      var node_to_insert__264836 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__264831, subidx__264832, node_to_insert__264836);
      return ret__264831
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____264837 = 0 <= i;
    if(and__3822__auto____264837) {
      return i < pv.cnt
    }else {
      return and__3822__auto____264837
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__264838 = pv.root;
      var level__264839 = pv.shift;
      while(true) {
        if(level__264839 > 0) {
          var G__264840 = cljs.core.pv_aget.call(null, node__264838, i >>> level__264839 & 31);
          var G__264841 = level__264839 - 5;
          node__264838 = G__264840;
          level__264839 = G__264841;
          continue
        }else {
          return node__264838.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__264842 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__264842, i & 31, val);
    return ret__264842
  }else {
    var subidx__264843 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__264842, subidx__264843, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__264843), i, val));
    return ret__264842
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__264844 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__264845 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__264844));
    if(function() {
      var and__3822__auto____264846 = new_child__264845 == null;
      if(and__3822__auto____264846) {
        return subidx__264844 === 0
      }else {
        return and__3822__auto____264846
      }
    }()) {
      return null
    }else {
      var ret__264847 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__264847, subidx__264844, new_child__264845);
      return ret__264847
    }
  }else {
    if(subidx__264844 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__264848 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__264848, subidx__264844, null);
        return ret__264848
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
  var this__264853 = this;
  return new cljs.core.TransientVector(this__264853.cnt, this__264853.shift, cljs.core.tv_editable_root.call(null, this__264853.root), cljs.core.tv_editable_tail.call(null, this__264853.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__264854 = this;
  var h__364__auto____264855 = this__264854.__hash;
  if(h__364__auto____264855 != null) {
    return h__364__auto____264855
  }else {
    var h__364__auto____264856 = cljs.core.hash_coll.call(null, coll);
    this__264854.__hash = h__364__auto____264856;
    return h__364__auto____264856
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__264857 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__264858 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__264859 = this;
  if(function() {
    var and__3822__auto____264860 = 0 <= k;
    if(and__3822__auto____264860) {
      return k < this__264859.cnt
    }else {
      return and__3822__auto____264860
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__264861 = cljs.core.aclone.call(null, this__264859.tail);
      new_tail__264861[k & 31] = v;
      return new cljs.core.PersistentVector(this__264859.meta, this__264859.cnt, this__264859.shift, this__264859.root, new_tail__264861, null)
    }else {
      return new cljs.core.PersistentVector(this__264859.meta, this__264859.cnt, this__264859.shift, cljs.core.do_assoc.call(null, coll, this__264859.shift, this__264859.root, k, v), this__264859.tail, null)
    }
  }else {
    if(k === this__264859.cnt) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__264859.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__264907 = null;
  var G__264907__2 = function(tsym264851, k) {
    var this__264862 = this;
    var tsym264851__264863 = this;
    var coll__264864 = tsym264851__264863;
    return cljs.core._lookup.call(null, coll__264864, k)
  };
  var G__264907__3 = function(tsym264852, k, not_found) {
    var this__264865 = this;
    var tsym264852__264866 = this;
    var coll__264867 = tsym264852__264866;
    return cljs.core._lookup.call(null, coll__264867, k, not_found)
  };
  G__264907 = function(tsym264852, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__264907__2.call(this, tsym264852, k);
      case 3:
        return G__264907__3.call(this, tsym264852, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__264907
}();
cljs.core.PersistentVector.prototype.apply = function(tsym264849, args264850) {
  return tsym264849.call.apply(tsym264849, [tsym264849].concat(cljs.core.aclone.call(null, args264850)))
};
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__264868 = this;
  var step_init__264869 = [0, init];
  var i__264870 = 0;
  while(true) {
    if(i__264870 < this__264868.cnt) {
      var arr__264871 = cljs.core.array_for.call(null, v, i__264870);
      var len__264872 = arr__264871.length;
      var init__264876 = function() {
        var j__264873 = 0;
        var init__264874 = step_init__264869[1];
        while(true) {
          if(j__264873 < len__264872) {
            var init__264875 = f.call(null, init__264874, j__264873 + i__264870, arr__264871[j__264873]);
            if(cljs.core.reduced_QMARK_.call(null, init__264875)) {
              return init__264875
            }else {
              var G__264908 = j__264873 + 1;
              var G__264909 = init__264875;
              j__264873 = G__264908;
              init__264874 = G__264909;
              continue
            }
          }else {
            step_init__264869[0] = len__264872;
            step_init__264869[1] = init__264874;
            return init__264874
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__264876)) {
        return cljs.core.deref.call(null, init__264876)
      }else {
        var G__264910 = i__264870 + step_init__264869[0];
        i__264870 = G__264910;
        continue
      }
    }else {
      return step_init__264869[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__264877 = this;
  if(this__264877.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__264878 = cljs.core.aclone.call(null, this__264877.tail);
    new_tail__264878.push(o);
    return new cljs.core.PersistentVector(this__264877.meta, this__264877.cnt + 1, this__264877.shift, this__264877.root, new_tail__264878, null)
  }else {
    var root_overflow_QMARK___264879 = this__264877.cnt >>> 5 > 1 << this__264877.shift;
    var new_shift__264880 = root_overflow_QMARK___264879 ? this__264877.shift + 5 : this__264877.shift;
    var new_root__264882 = root_overflow_QMARK___264879 ? function() {
      var n_r__264881 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__264881, 0, this__264877.root);
      cljs.core.pv_aset.call(null, n_r__264881, 1, cljs.core.new_path.call(null, null, this__264877.shift, new cljs.core.VectorNode(null, this__264877.tail)));
      return n_r__264881
    }() : cljs.core.push_tail.call(null, coll, this__264877.shift, this__264877.root, new cljs.core.VectorNode(null, this__264877.tail));
    return new cljs.core.PersistentVector(this__264877.meta, this__264877.cnt + 1, new_shift__264880, new_root__264882, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__264883 = this;
  return cljs.core._nth.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__264884 = this;
  return cljs.core._nth.call(null, coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__264885 = this;
  var this$__264886 = this;
  return cljs.core.pr_str.call(null, this$__264886)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__264887 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__264888 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__264889 = this;
  if(this__264889.cnt > 0) {
    var vector_seq__264890 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__264889.cnt) {
          return cljs.core.cons.call(null, cljs.core._nth.call(null, coll, i), vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__264890.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__264891 = this;
  return this__264891.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__264892 = this;
  if(this__264892.cnt > 0) {
    return cljs.core._nth.call(null, coll, this__264892.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__264893 = this;
  if(this__264893.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__264893.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__264893.meta)
    }else {
      if(1 < this__264893.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__264893.meta, this__264893.cnt - 1, this__264893.shift, this__264893.root, this__264893.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__264894 = cljs.core.array_for.call(null, coll, this__264893.cnt - 2);
          var nr__264895 = cljs.core.pop_tail.call(null, coll, this__264893.shift, this__264893.root);
          var new_root__264896 = nr__264895 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__264895;
          var cnt_1__264897 = this__264893.cnt - 1;
          if(function() {
            var and__3822__auto____264898 = 5 < this__264893.shift;
            if(and__3822__auto____264898) {
              return cljs.core.pv_aget.call(null, new_root__264896, 1) == null
            }else {
              return and__3822__auto____264898
            }
          }()) {
            return new cljs.core.PersistentVector(this__264893.meta, cnt_1__264897, this__264893.shift - 5, cljs.core.pv_aget.call(null, new_root__264896, 0), new_tail__264894, null)
          }else {
            return new cljs.core.PersistentVector(this__264893.meta, cnt_1__264897, this__264893.shift, new_root__264896, new_tail__264894, null)
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
  var this__264900 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__264901 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__264902 = this;
  return new cljs.core.PersistentVector(meta, this__264902.cnt, this__264902.shift, this__264902.root, this__264902.tail, this__264902.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__264903 = this;
  return this__264903.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__264904 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__264905 = this;
  if(function() {
    var and__3822__auto____264906 = 0 <= n;
    if(and__3822__auto____264906) {
      return n < this__264905.cnt
    }else {
      return and__3822__auto____264906
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__264899 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__264899.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs) {
  var xs__264911 = cljs.core.seq.call(null, xs);
  var out__264912 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    if(cljs.core.truth_(xs__264911)) {
      var G__264913 = cljs.core.next.call(null, xs__264911);
      var G__264914 = cljs.core.conj_BANG_.call(null, out__264912, cljs.core.first.call(null, xs__264911));
      xs__264911 = G__264913;
      out__264912 = G__264914;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__264912)
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
  vector.cljs$lang$applyTo = function(arglist__264915) {
    var args = cljs.core.seq(arglist__264915);
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
  var this__264920 = this;
  var h__364__auto____264921 = this__264920.__hash;
  if(h__364__auto____264921 != null) {
    return h__364__auto____264921
  }else {
    var h__364__auto____264922 = cljs.core.hash_coll.call(null, coll);
    this__264920.__hash = h__364__auto____264922;
    return h__364__auto____264922
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__264923 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__264924 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__264925 = this;
  var v_pos__264926 = this__264925.start + key;
  return new cljs.core.Subvec(this__264925.meta, cljs.core._assoc.call(null, this__264925.v, v_pos__264926, val), this__264925.start, this__264925.end > v_pos__264926 + 1 ? this__264925.end : v_pos__264926 + 1, null)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__264950 = null;
  var G__264950__2 = function(tsym264918, k) {
    var this__264927 = this;
    var tsym264918__264928 = this;
    var coll__264929 = tsym264918__264928;
    return cljs.core._lookup.call(null, coll__264929, k)
  };
  var G__264950__3 = function(tsym264919, k, not_found) {
    var this__264930 = this;
    var tsym264919__264931 = this;
    var coll__264932 = tsym264919__264931;
    return cljs.core._lookup.call(null, coll__264932, k, not_found)
  };
  G__264950 = function(tsym264919, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__264950__2.call(this, tsym264919, k);
      case 3:
        return G__264950__3.call(this, tsym264919, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__264950
}();
cljs.core.Subvec.prototype.apply = function(tsym264916, args264917) {
  return tsym264916.call.apply(tsym264916, [tsym264916].concat(cljs.core.aclone.call(null, args264917)))
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__264933 = this;
  return new cljs.core.Subvec(this__264933.meta, cljs.core._assoc_n.call(null, this__264933.v, this__264933.end, o), this__264933.start, this__264933.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__264934 = this;
  var this$__264935 = this;
  return cljs.core.pr_str.call(null, this$__264935)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__264936 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__264937 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__264938 = this;
  var subvec_seq__264939 = function subvec_seq(i) {
    if(i === this__264938.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__264938.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__264939.call(null, this__264938.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__264940 = this;
  return this__264940.end - this__264940.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__264941 = this;
  return cljs.core._nth.call(null, this__264941.v, this__264941.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__264942 = this;
  if(this__264942.start === this__264942.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__264942.meta, this__264942.v, this__264942.start, this__264942.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__264943 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__264944 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__264945 = this;
  return new cljs.core.Subvec(meta, this__264945.v, this__264945.start, this__264945.end, this__264945.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__264946 = this;
  return this__264946.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__264948 = this;
  return cljs.core._nth.call(null, this__264948.v, this__264948.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__264949 = this;
  return cljs.core._nth.call(null, this__264949.v, this__264949.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__264947 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__264947.meta)
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
  var ret__264951 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__264951, 0, tl.length);
  return ret__264951
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__264952 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__264953 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__264952, subidx__264953, level === 5 ? tail_node : function() {
    var child__264954 = cljs.core.pv_aget.call(null, ret__264952, subidx__264953);
    if(child__264954 != null) {
      return tv_push_tail.call(null, tv, level - 5, child__264954, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__264952
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__264955 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__264956 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__264957 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__264955, subidx__264956));
    if(function() {
      var and__3822__auto____264958 = new_child__264957 == null;
      if(and__3822__auto____264958) {
        return subidx__264956 === 0
      }else {
        return and__3822__auto____264958
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__264955, subidx__264956, new_child__264957);
      return node__264955
    }
  }else {
    if(subidx__264956 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__264955, subidx__264956, null);
        return node__264955
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____264959 = 0 <= i;
    if(and__3822__auto____264959) {
      return i < tv.cnt
    }else {
      return and__3822__auto____264959
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__264960 = tv.root;
      var node__264961 = root__264960;
      var level__264962 = tv.shift;
      while(true) {
        if(level__264962 > 0) {
          var G__264963 = cljs.core.tv_ensure_editable.call(null, root__264960.edit, cljs.core.pv_aget.call(null, node__264961, i >>> level__264962 & 31));
          var G__264964 = level__264962 - 5;
          node__264961 = G__264963;
          level__264962 = G__264964;
          continue
        }else {
          return node__264961.arr
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
  var G__265002 = null;
  var G__265002__2 = function(tsym264967, k) {
    var this__264969 = this;
    var tsym264967__264970 = this;
    var coll__264971 = tsym264967__264970;
    return cljs.core._lookup.call(null, coll__264971, k)
  };
  var G__265002__3 = function(tsym264968, k, not_found) {
    var this__264972 = this;
    var tsym264968__264973 = this;
    var coll__264974 = tsym264968__264973;
    return cljs.core._lookup.call(null, coll__264974, k, not_found)
  };
  G__265002 = function(tsym264968, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__265002__2.call(this, tsym264968, k);
      case 3:
        return G__265002__3.call(this, tsym264968, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__265002
}();
cljs.core.TransientVector.prototype.apply = function(tsym264965, args264966) {
  return tsym264965.call.apply(tsym264965, [tsym264965].concat(cljs.core.aclone.call(null, args264966)))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__264975 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__264976 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__264977 = this;
  if(cljs.core.truth_(this__264977.root.edit)) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__264978 = this;
  if(function() {
    var and__3822__auto____264979 = 0 <= n;
    if(and__3822__auto____264979) {
      return n < this__264978.cnt
    }else {
      return and__3822__auto____264979
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__264980 = this;
  if(cljs.core.truth_(this__264980.root.edit)) {
    return this__264980.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__264981 = this;
  if(cljs.core.truth_(this__264981.root.edit)) {
    if(function() {
      var and__3822__auto____264982 = 0 <= n;
      if(and__3822__auto____264982) {
        return n < this__264981.cnt
      }else {
        return and__3822__auto____264982
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__264981.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__264985 = function go(level, node) {
          var node__264983 = cljs.core.tv_ensure_editable.call(null, this__264981.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__264983, n & 31, val);
            return node__264983
          }else {
            var subidx__264984 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__264983, subidx__264984, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__264983, subidx__264984)));
            return node__264983
          }
        }.call(null, this__264981.shift, this__264981.root);
        this__264981.root = new_root__264985;
        return tcoll
      }
    }else {
      if(n === this__264981.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__264981.cnt)].join(""));
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
  var this__264986 = this;
  if(cljs.core.truth_(this__264986.root.edit)) {
    if(this__264986.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__264986.cnt) {
        this__264986.cnt = 0;
        return tcoll
      }else {
        if((this__264986.cnt - 1 & 31) > 0) {
          this__264986.cnt = this__264986.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__264987 = cljs.core.editable_array_for.call(null, tcoll, this__264986.cnt - 2);
            var new_root__264989 = function() {
              var nr__264988 = cljs.core.tv_pop_tail.call(null, tcoll, this__264986.shift, this__264986.root);
              if(nr__264988 != null) {
                return nr__264988
              }else {
                return new cljs.core.VectorNode(this__264986.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____264990 = 5 < this__264986.shift;
              if(and__3822__auto____264990) {
                return cljs.core.pv_aget.call(null, new_root__264989, 1) == null
              }else {
                return and__3822__auto____264990
              }
            }()) {
              var new_root__264991 = cljs.core.tv_ensure_editable.call(null, this__264986.root.edit, cljs.core.pv_aget.call(null, new_root__264989, 0));
              this__264986.root = new_root__264991;
              this__264986.shift = this__264986.shift - 5;
              this__264986.cnt = this__264986.cnt - 1;
              this__264986.tail = new_tail__264987;
              return tcoll
            }else {
              this__264986.root = new_root__264989;
              this__264986.cnt = this__264986.cnt - 1;
              this__264986.tail = new_tail__264987;
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
  var this__264992 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__264993 = this;
  if(cljs.core.truth_(this__264993.root.edit)) {
    if(this__264993.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__264993.tail[this__264993.cnt & 31] = o;
      this__264993.cnt = this__264993.cnt + 1;
      return tcoll
    }else {
      var tail_node__264994 = new cljs.core.VectorNode(this__264993.root.edit, this__264993.tail);
      var new_tail__264995 = cljs.core.make_array.call(null, 32);
      new_tail__264995[0] = o;
      this__264993.tail = new_tail__264995;
      if(this__264993.cnt >>> 5 > 1 << this__264993.shift) {
        var new_root_array__264996 = cljs.core.make_array.call(null, 32);
        var new_shift__264997 = this__264993.shift + 5;
        new_root_array__264996[0] = this__264993.root;
        new_root_array__264996[1] = cljs.core.new_path.call(null, this__264993.root.edit, this__264993.shift, tail_node__264994);
        this__264993.root = new cljs.core.VectorNode(this__264993.root.edit, new_root_array__264996);
        this__264993.shift = new_shift__264997;
        this__264993.cnt = this__264993.cnt + 1;
        return tcoll
      }else {
        var new_root__264998 = cljs.core.tv_push_tail.call(null, tcoll, this__264993.shift, this__264993.root, tail_node__264994);
        this__264993.root = new_root__264998;
        this__264993.cnt = this__264993.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__264999 = this;
  if(cljs.core.truth_(this__264999.root.edit)) {
    this__264999.root.edit = null;
    var len__265000 = this__264999.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__265001 = cljs.core.make_array.call(null, len__265000);
    cljs.core.array_copy.call(null, this__264999.tail, 0, trimmed_tail__265001, 0, len__265000);
    return new cljs.core.PersistentVector(null, this__264999.cnt, this__264999.shift, this__264999.root, trimmed_tail__265001, null)
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
  var this__265003 = this;
  var h__364__auto____265004 = this__265003.__hash;
  if(h__364__auto____265004 != null) {
    return h__364__auto____265004
  }else {
    var h__364__auto____265005 = cljs.core.hash_coll.call(null, coll);
    this__265003.__hash = h__364__auto____265005;
    return h__364__auto____265005
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__265006 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__265007 = this;
  var this$__265008 = this;
  return cljs.core.pr_str.call(null, this$__265008)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__265009 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__265010 = this;
  return cljs.core._first.call(null, this__265010.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__265011 = this;
  var temp__3971__auto____265012 = cljs.core.next.call(null, this__265011.front);
  if(cljs.core.truth_(temp__3971__auto____265012)) {
    var f1__265013 = temp__3971__auto____265012;
    return new cljs.core.PersistentQueueSeq(this__265011.meta, f1__265013, this__265011.rear, null)
  }else {
    if(this__265011.rear == null) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__265011.meta, this__265011.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__265014 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__265015 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__265015.front, this__265015.rear, this__265015.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__265016 = this;
  return this__265016.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__265017 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__265017.meta)
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
  var this__265018 = this;
  var h__364__auto____265019 = this__265018.__hash;
  if(h__364__auto____265019 != null) {
    return h__364__auto____265019
  }else {
    var h__364__auto____265020 = cljs.core.hash_coll.call(null, coll);
    this__265018.__hash = h__364__auto____265020;
    return h__364__auto____265020
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__265021 = this;
  if(cljs.core.truth_(this__265021.front)) {
    return new cljs.core.PersistentQueue(this__265021.meta, this__265021.count + 1, this__265021.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____265022 = this__265021.rear;
      if(cljs.core.truth_(or__3824__auto____265022)) {
        return or__3824__auto____265022
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__265021.meta, this__265021.count + 1, cljs.core.conj.call(null, this__265021.front, o), cljs.core.PersistentVector.fromArray([]), null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__265023 = this;
  var this$__265024 = this;
  return cljs.core.pr_str.call(null, this$__265024)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__265025 = this;
  var rear__265026 = cljs.core.seq.call(null, this__265025.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____265027 = this__265025.front;
    if(cljs.core.truth_(or__3824__auto____265027)) {
      return or__3824__auto____265027
    }else {
      return rear__265026
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__265025.front, cljs.core.seq.call(null, rear__265026), null, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__265028 = this;
  return this__265028.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__265029 = this;
  return cljs.core._first.call(null, this__265029.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__265030 = this;
  if(cljs.core.truth_(this__265030.front)) {
    var temp__3971__auto____265031 = cljs.core.next.call(null, this__265030.front);
    if(cljs.core.truth_(temp__3971__auto____265031)) {
      var f1__265032 = temp__3971__auto____265031;
      return new cljs.core.PersistentQueue(this__265030.meta, this__265030.count - 1, f1__265032, this__265030.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__265030.meta, this__265030.count - 1, cljs.core.seq.call(null, this__265030.rear), cljs.core.PersistentVector.fromArray([]), null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__265033 = this;
  return cljs.core.first.call(null, this__265033.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__265034 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__265035 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__265036 = this;
  return new cljs.core.PersistentQueue(meta, this__265036.count, this__265036.front, this__265036.rear, this__265036.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__265037 = this;
  return this__265037.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__265038 = this;
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
  var this__265039 = this;
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
  var len__265040 = array.length;
  var i__265041 = 0;
  while(true) {
    if(i__265041 < len__265040) {
      if(cljs.core._EQ_.call(null, k, array[i__265041])) {
        return i__265041
      }else {
        var G__265042 = i__265041 + incr;
        i__265041 = G__265042;
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
      var and__3822__auto____265043 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3822__auto____265043)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3822__auto____265043
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
  var a__265044 = cljs.core.hash.call(null, a);
  var b__265045 = cljs.core.hash.call(null, b);
  if(a__265044 < b__265045) {
    return-1
  }else {
    if(a__265044 > b__265045) {
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
  var ks__265047 = m.keys;
  var len__265048 = ks__265047.length;
  var so__265049 = m.strobj;
  var out__265050 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__265051 = 0;
  var out__265052 = cljs.core.transient$.call(null, out__265050);
  while(true) {
    if(i__265051 < len__265048) {
      var k__265053 = ks__265047[i__265051];
      var G__265054 = i__265051 + 1;
      var G__265055 = cljs.core.assoc_BANG_.call(null, out__265052, k__265053, so__265049[k__265053]);
      i__265051 = G__265054;
      out__265052 = G__265055;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__265052, k, v))
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
  var this__265060 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__265061 = this;
  var h__364__auto____265062 = this__265061.__hash;
  if(h__364__auto____265062 != null) {
    return h__364__auto____265062
  }else {
    var h__364__auto____265063 = cljs.core.hash_imap.call(null, coll);
    this__265061.__hash = h__364__auto____265063;
    return h__364__auto____265063
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__265064 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__265065 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__265065.strobj, this__265065.strobj[k], not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__265066 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var overwrite_QMARK___265067 = this__265066.strobj.hasOwnProperty(k);
    if(cljs.core.truth_(overwrite_QMARK___265067)) {
      var new_strobj__265068 = goog.object.clone.call(null, this__265066.strobj);
      new_strobj__265068[k] = v;
      return new cljs.core.ObjMap(this__265066.meta, this__265066.keys, new_strobj__265068, this__265066.update_count + 1, null)
    }else {
      if(this__265066.update_count < cljs.core.ObjMap.HASHMAP_THRESHOLD) {
        var new_strobj__265069 = goog.object.clone.call(null, this__265066.strobj);
        var new_keys__265070 = cljs.core.aclone.call(null, this__265066.keys);
        new_strobj__265069[k] = v;
        new_keys__265070.push(k);
        return new cljs.core.ObjMap(this__265066.meta, new_keys__265070, new_strobj__265069, this__265066.update_count + 1, null)
      }else {
        return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__265071 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__265071.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__265091 = null;
  var G__265091__2 = function(tsym265058, k) {
    var this__265072 = this;
    var tsym265058__265073 = this;
    var coll__265074 = tsym265058__265073;
    return cljs.core._lookup.call(null, coll__265074, k)
  };
  var G__265091__3 = function(tsym265059, k, not_found) {
    var this__265075 = this;
    var tsym265059__265076 = this;
    var coll__265077 = tsym265059__265076;
    return cljs.core._lookup.call(null, coll__265077, k, not_found)
  };
  G__265091 = function(tsym265059, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__265091__2.call(this, tsym265059, k);
      case 3:
        return G__265091__3.call(this, tsym265059, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__265091
}();
cljs.core.ObjMap.prototype.apply = function(tsym265056, args265057) {
  return tsym265056.call.apply(tsym265056, [tsym265056].concat(cljs.core.aclone.call(null, args265057)))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__265078 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__265079 = this;
  var this$__265080 = this;
  return cljs.core.pr_str.call(null, this$__265080)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__265081 = this;
  if(this__265081.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__265046_SHARP_) {
      return cljs.core.vector.call(null, p1__265046_SHARP_, this__265081.strobj[p1__265046_SHARP_])
    }, this__265081.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__265082 = this;
  return this__265082.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__265083 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__265084 = this;
  return new cljs.core.ObjMap(meta, this__265084.keys, this__265084.strobj, this__265084.update_count, this__265084.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__265085 = this;
  return this__265085.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__265086 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__265086.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__265087 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____265088 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3822__auto____265088)) {
      return this__265087.strobj.hasOwnProperty(k)
    }else {
      return and__3822__auto____265088
    }
  }())) {
    var new_keys__265089 = cljs.core.aclone.call(null, this__265087.keys);
    var new_strobj__265090 = goog.object.clone.call(null, this__265087.strobj);
    new_keys__265089.splice(cljs.core.scan_array.call(null, 1, k, new_keys__265089), 1);
    cljs.core.js_delete.call(null, new_strobj__265090, k);
    return new cljs.core.ObjMap(this__265087.meta, new_keys__265089, new_strobj__265090, this__265087.update_count + 1, null)
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
  var this__265097 = this;
  var h__364__auto____265098 = this__265097.__hash;
  if(h__364__auto____265098 != null) {
    return h__364__auto____265098
  }else {
    var h__364__auto____265099 = cljs.core.hash_imap.call(null, coll);
    this__265097.__hash = h__364__auto____265099;
    return h__364__auto____265099
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__265100 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__265101 = this;
  var bucket__265102 = this__265101.hashobj[cljs.core.hash.call(null, k)];
  var i__265103 = cljs.core.truth_(bucket__265102) ? cljs.core.scan_array.call(null, 2, k, bucket__265102) : null;
  if(cljs.core.truth_(i__265103)) {
    return bucket__265102[i__265103 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__265104 = this;
  var h__265105 = cljs.core.hash.call(null, k);
  var bucket__265106 = this__265104.hashobj[h__265105];
  if(cljs.core.truth_(bucket__265106)) {
    var new_bucket__265107 = cljs.core.aclone.call(null, bucket__265106);
    var new_hashobj__265108 = goog.object.clone.call(null, this__265104.hashobj);
    new_hashobj__265108[h__265105] = new_bucket__265107;
    var temp__3971__auto____265109 = cljs.core.scan_array.call(null, 2, k, new_bucket__265107);
    if(cljs.core.truth_(temp__3971__auto____265109)) {
      var i__265110 = temp__3971__auto____265109;
      new_bucket__265107[i__265110 + 1] = v;
      return new cljs.core.HashMap(this__265104.meta, this__265104.count, new_hashobj__265108, null)
    }else {
      new_bucket__265107.push(k, v);
      return new cljs.core.HashMap(this__265104.meta, this__265104.count + 1, new_hashobj__265108, null)
    }
  }else {
    var new_hashobj__265111 = goog.object.clone.call(null, this__265104.hashobj);
    new_hashobj__265111[h__265105] = [k, v];
    return new cljs.core.HashMap(this__265104.meta, this__265104.count + 1, new_hashobj__265111, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__265112 = this;
  var bucket__265113 = this__265112.hashobj[cljs.core.hash.call(null, k)];
  var i__265114 = cljs.core.truth_(bucket__265113) ? cljs.core.scan_array.call(null, 2, k, bucket__265113) : null;
  if(cljs.core.truth_(i__265114)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__265137 = null;
  var G__265137__2 = function(tsym265095, k) {
    var this__265115 = this;
    var tsym265095__265116 = this;
    var coll__265117 = tsym265095__265116;
    return cljs.core._lookup.call(null, coll__265117, k)
  };
  var G__265137__3 = function(tsym265096, k, not_found) {
    var this__265118 = this;
    var tsym265096__265119 = this;
    var coll__265120 = tsym265096__265119;
    return cljs.core._lookup.call(null, coll__265120, k, not_found)
  };
  G__265137 = function(tsym265096, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__265137__2.call(this, tsym265096, k);
      case 3:
        return G__265137__3.call(this, tsym265096, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__265137
}();
cljs.core.HashMap.prototype.apply = function(tsym265093, args265094) {
  return tsym265093.call.apply(tsym265093, [tsym265093].concat(cljs.core.aclone.call(null, args265094)))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__265121 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__265122 = this;
  var this$__265123 = this;
  return cljs.core.pr_str.call(null, this$__265123)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__265124 = this;
  if(this__265124.count > 0) {
    var hashes__265125 = cljs.core.js_keys.call(null, this__265124.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__265092_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__265124.hashobj[p1__265092_SHARP_]))
    }, hashes__265125)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__265126 = this;
  return this__265126.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__265127 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__265128 = this;
  return new cljs.core.HashMap(meta, this__265128.count, this__265128.hashobj, this__265128.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__265129 = this;
  return this__265129.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__265130 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__265130.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__265131 = this;
  var h__265132 = cljs.core.hash.call(null, k);
  var bucket__265133 = this__265131.hashobj[h__265132];
  var i__265134 = cljs.core.truth_(bucket__265133) ? cljs.core.scan_array.call(null, 2, k, bucket__265133) : null;
  if(cljs.core.not.call(null, i__265134)) {
    return coll
  }else {
    var new_hashobj__265135 = goog.object.clone.call(null, this__265131.hashobj);
    if(3 > bucket__265133.length) {
      cljs.core.js_delete.call(null, new_hashobj__265135, h__265132)
    }else {
      var new_bucket__265136 = cljs.core.aclone.call(null, bucket__265133);
      new_bucket__265136.splice(i__265134, 2);
      new_hashobj__265135[h__265132] = new_bucket__265136
    }
    return new cljs.core.HashMap(this__265131.meta, this__265131.count - 1, new_hashobj__265135, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__265138 = ks.length;
  var i__265139 = 0;
  var out__265140 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__265139 < len__265138) {
      var G__265141 = i__265139 + 1;
      var G__265142 = cljs.core.assoc.call(null, out__265140, ks[i__265139], vs[i__265139]);
      i__265139 = G__265141;
      out__265140 = G__265142;
      continue
    }else {
      return out__265140
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__265143 = m.arr;
  var len__265144 = arr__265143.length;
  var i__265145 = 0;
  while(true) {
    if(len__265144 <= i__265145) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__265143[i__265145], k)) {
        return i__265145
      }else {
        if("\ufdd0'else") {
          var G__265146 = i__265145 + 2;
          i__265145 = G__265146;
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
  var this__265151 = this;
  return new cljs.core.TransientArrayMap({}, this__265151.arr.length, cljs.core.aclone.call(null, this__265151.arr))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__265152 = this;
  var h__364__auto____265153 = this__265152.__hash;
  if(h__364__auto____265153 != null) {
    return h__364__auto____265153
  }else {
    var h__364__auto____265154 = cljs.core.hash_imap.call(null, coll);
    this__265152.__hash = h__364__auto____265154;
    return h__364__auto____265154
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__265155 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__265156 = this;
  var idx__265157 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__265157 === -1) {
    return not_found
  }else {
    return this__265156.arr[idx__265157 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__265158 = this;
  var idx__265159 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__265159 === -1) {
    if(this__265158.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__265158.meta, this__265158.cnt + 1, function() {
        var G__265160__265161 = cljs.core.aclone.call(null, this__265158.arr);
        G__265160__265161.push(k);
        G__265160__265161.push(v);
        return G__265160__265161
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__265158.arr[idx__265159 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__265158.meta, this__265158.cnt, function() {
          var G__265162__265163 = cljs.core.aclone.call(null, this__265158.arr);
          G__265162__265163[idx__265159 + 1] = v;
          return G__265162__265163
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__265164 = this;
  return cljs.core.array_map_index_of.call(null, coll, k) != -1
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__265194 = null;
  var G__265194__2 = function(tsym265149, k) {
    var this__265165 = this;
    var tsym265149__265166 = this;
    var coll__265167 = tsym265149__265166;
    return cljs.core._lookup.call(null, coll__265167, k)
  };
  var G__265194__3 = function(tsym265150, k, not_found) {
    var this__265168 = this;
    var tsym265150__265169 = this;
    var coll__265170 = tsym265150__265169;
    return cljs.core._lookup.call(null, coll__265170, k, not_found)
  };
  G__265194 = function(tsym265150, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__265194__2.call(this, tsym265150, k);
      case 3:
        return G__265194__3.call(this, tsym265150, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__265194
}();
cljs.core.PersistentArrayMap.prototype.apply = function(tsym265147, args265148) {
  return tsym265147.call.apply(tsym265147, [tsym265147].concat(cljs.core.aclone.call(null, args265148)))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__265171 = this;
  var len__265172 = this__265171.arr.length;
  var i__265173 = 0;
  var init__265174 = init;
  while(true) {
    if(i__265173 < len__265172) {
      var init__265175 = f.call(null, init__265174, this__265171.arr[i__265173], this__265171.arr[i__265173 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__265175)) {
        return cljs.core.deref.call(null, init__265175)
      }else {
        var G__265195 = i__265173 + 2;
        var G__265196 = init__265175;
        i__265173 = G__265195;
        init__265174 = G__265196;
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
  var this__265176 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__265177 = this;
  var this$__265178 = this;
  return cljs.core.pr_str.call(null, this$__265178)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__265179 = this;
  if(this__265179.cnt > 0) {
    var len__265180 = this__265179.arr.length;
    var array_map_seq__265181 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__265180) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__265179.arr[i], this__265179.arr[i + 1]]), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      })
    };
    return array_map_seq__265181.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__265182 = this;
  return this__265182.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__265183 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__265184 = this;
  return new cljs.core.PersistentArrayMap(meta, this__265184.cnt, this__265184.arr, this__265184.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__265185 = this;
  return this__265185.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__265186 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__265186.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__265187 = this;
  var idx__265188 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__265188 >= 0) {
    var len__265189 = this__265187.arr.length;
    var new_len__265190 = len__265189 - 2;
    if(new_len__265190 === 0) {
      return cljs.core._empty.call(null, coll)
    }else {
      var new_arr__265191 = cljs.core.make_array.call(null, new_len__265190);
      var s__265192 = 0;
      var d__265193 = 0;
      while(true) {
        if(s__265192 >= len__265189) {
          return new cljs.core.PersistentArrayMap(this__265187.meta, this__265187.cnt - 1, new_arr__265191, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__265187.arr[s__265192])) {
            var G__265197 = s__265192 + 2;
            var G__265198 = d__265193;
            s__265192 = G__265197;
            d__265193 = G__265198;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__265191[d__265193] = this__265187.arr[s__265192];
              new_arr__265191[d__265193 + 1] = this__265187.arr[s__265192 + 1];
              var G__265199 = s__265192 + 2;
              var G__265200 = d__265193 + 2;
              s__265192 = G__265199;
              d__265193 = G__265200;
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
  var len__265201 = cljs.core.count.call(null, ks);
  var i__265202 = 0;
  var out__265203 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__265202 < len__265201) {
      var G__265204 = i__265202 + 1;
      var G__265205 = cljs.core.assoc_BANG_.call(null, out__265203, ks[i__265202], vs[i__265202]);
      i__265202 = G__265204;
      out__265203 = G__265205;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__265203)
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
  var this__265206 = this;
  if(cljs.core.truth_(this__265206.editable_QMARK_)) {
    var idx__265207 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__265207 >= 0) {
      this__265206.arr[idx__265207] = this__265206.arr[this__265206.len - 2];
      this__265206.arr[idx__265207 + 1] = this__265206.arr[this__265206.len - 1];
      var G__265208__265209 = this__265206.arr;
      G__265208__265209.pop();
      G__265208__265209.pop();
      G__265208__265209;
      this__265206.len = this__265206.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__265210 = this;
  if(cljs.core.truth_(this__265210.editable_QMARK_)) {
    var idx__265211 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__265211 === -1) {
      if(this__265210.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__265210.len = this__265210.len + 2;
        this__265210.arr.push(key);
        this__265210.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__265210.len, this__265210.arr), key, val)
      }
    }else {
      if(val === this__265210.arr[idx__265211 + 1]) {
        return tcoll
      }else {
        this__265210.arr[idx__265211 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__265212 = this;
  if(cljs.core.truth_(this__265212.editable_QMARK_)) {
    if(function() {
      var G__265213__265214 = o;
      if(G__265213__265214 != null) {
        if(function() {
          var or__3824__auto____265215 = G__265213__265214.cljs$lang$protocol_mask$partition1$ & 8;
          if(or__3824__auto____265215) {
            return or__3824__auto____265215
          }else {
            return G__265213__265214.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__265213__265214.cljs$lang$protocol_mask$partition1$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__265213__265214)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__265213__265214)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__265216 = cljs.core.seq.call(null, o);
      var tcoll__265217 = tcoll;
      while(true) {
        var temp__3971__auto____265218 = cljs.core.first.call(null, es__265216);
        if(cljs.core.truth_(temp__3971__auto____265218)) {
          var e__265219 = temp__3971__auto____265218;
          var G__265225 = cljs.core.next.call(null, es__265216);
          var G__265226 = cljs.core._assoc_BANG_.call(null, tcoll__265217, cljs.core.key.call(null, e__265219), cljs.core.val.call(null, e__265219));
          es__265216 = G__265225;
          tcoll__265217 = G__265226;
          continue
        }else {
          return tcoll__265217
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__265220 = this;
  if(cljs.core.truth_(this__265220.editable_QMARK_)) {
    this__265220.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__265220.len, 2), this__265220.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__265221 = this;
  return cljs.core._lookup.call(null, tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__265222 = this;
  if(cljs.core.truth_(this__265222.editable_QMARK_)) {
    var idx__265223 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__265223 === -1) {
      return not_found
    }else {
      return this__265222.arr[idx__265223 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__265224 = this;
  if(cljs.core.truth_(this__265224.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__265224.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__265227 = cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {}));
  var i__265228 = 0;
  while(true) {
    if(i__265228 < len) {
      var G__265229 = cljs.core.assoc_BANG_.call(null, out__265227, arr[i__265228], arr[i__265228 + 1]);
      var G__265230 = i__265228 + 2;
      out__265227 = G__265229;
      i__265228 = G__265230;
      continue
    }else {
      return out__265227
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
    var G__265231__265232 = cljs.core.aclone.call(null, arr);
    G__265231__265232[i] = a;
    return G__265231__265232
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__265233__265234 = cljs.core.aclone.call(null, arr);
    G__265233__265234[i] = a;
    G__265233__265234[j] = b;
    return G__265233__265234
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
  var new_arr__265235 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__265235, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__265235, 2 * i, new_arr__265235.length - 2 * i);
  return new_arr__265235
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
    var editable__265236 = inode.ensure_editable(edit);
    editable__265236.arr[i] = a;
    return editable__265236
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__265237 = inode.ensure_editable(edit);
    editable__265237.arr[i] = a;
    editable__265237.arr[j] = b;
    return editable__265237
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
  var len__265238 = arr.length;
  var i__265239 = 0;
  var init__265240 = init;
  while(true) {
    if(i__265239 < len__265238) {
      var init__265243 = function() {
        var k__265241 = arr[i__265239];
        if(k__265241 != null) {
          return f.call(null, init__265240, k__265241, arr[i__265239 + 1])
        }else {
          var node__265242 = arr[i__265239 + 1];
          if(node__265242 != null) {
            return node__265242.kv_reduce(f, init__265240)
          }else {
            return init__265240
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__265243)) {
        return cljs.core.deref.call(null, init__265243)
      }else {
        var G__265244 = i__265239 + 2;
        var G__265245 = init__265243;
        i__265239 = G__265244;
        init__265240 = G__265245;
        continue
      }
    }else {
      return init__265240
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
  var this__265246 = this;
  var inode__265247 = this;
  if(this__265246.bitmap === bit) {
    return null
  }else {
    var editable__265248 = inode__265247.ensure_editable(e);
    var earr__265249 = editable__265248.arr;
    var len__265250 = earr__265249.length;
    editable__265248.bitmap = bit ^ editable__265248.bitmap;
    cljs.core.array_copy.call(null, earr__265249, 2 * (i + 1), earr__265249, 2 * i, len__265250 - 2 * (i + 1));
    earr__265249[len__265250 - 2] = null;
    earr__265249[len__265250 - 1] = null;
    return editable__265248
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__265251 = this;
  var inode__265252 = this;
  var bit__265253 = 1 << (hash >>> shift & 31);
  var idx__265254 = cljs.core.bitmap_indexed_node_index.call(null, this__265251.bitmap, bit__265253);
  if((this__265251.bitmap & bit__265253) === 0) {
    var n__265255 = cljs.core.bit_count.call(null, this__265251.bitmap);
    if(2 * n__265255 < this__265251.arr.length) {
      var editable__265256 = inode__265252.ensure_editable(edit);
      var earr__265257 = editable__265256.arr;
      added_leaf_QMARK_[0] = true;
      cljs.core.array_copy_downward.call(null, earr__265257, 2 * idx__265254, earr__265257, 2 * (idx__265254 + 1), 2 * (n__265255 - idx__265254));
      earr__265257[2 * idx__265254] = key;
      earr__265257[2 * idx__265254 + 1] = val;
      editable__265256.bitmap = editable__265256.bitmap | bit__265253;
      return editable__265256
    }else {
      if(n__265255 >= 16) {
        var nodes__265258 = cljs.core.make_array.call(null, 32);
        var jdx__265259 = hash >>> shift & 31;
        nodes__265258[jdx__265259] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__265260 = 0;
        var j__265261 = 0;
        while(true) {
          if(i__265260 < 32) {
            if((this__265251.bitmap >>> i__265260 & 1) === 0) {
              var G__265314 = i__265260 + 1;
              var G__265315 = j__265261;
              i__265260 = G__265314;
              j__265261 = G__265315;
              continue
            }else {
              nodes__265258[i__265260] = null != this__265251.arr[j__265261] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__265251.arr[j__265261]), this__265251.arr[j__265261], this__265251.arr[j__265261 + 1], added_leaf_QMARK_) : this__265251.arr[j__265261 + 1];
              var G__265316 = i__265260 + 1;
              var G__265317 = j__265261 + 2;
              i__265260 = G__265316;
              j__265261 = G__265317;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__265255 + 1, nodes__265258)
      }else {
        if("\ufdd0'else") {
          var new_arr__265262 = cljs.core.make_array.call(null, 2 * (n__265255 + 4));
          cljs.core.array_copy.call(null, this__265251.arr, 0, new_arr__265262, 0, 2 * idx__265254);
          new_arr__265262[2 * idx__265254] = key;
          added_leaf_QMARK_[0] = true;
          new_arr__265262[2 * idx__265254 + 1] = val;
          cljs.core.array_copy.call(null, this__265251.arr, 2 * idx__265254, new_arr__265262, 2 * (idx__265254 + 1), 2 * (n__265255 - idx__265254));
          var editable__265263 = inode__265252.ensure_editable(edit);
          editable__265263.arr = new_arr__265262;
          editable__265263.bitmap = editable__265263.bitmap | bit__265253;
          return editable__265263
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__265264 = this__265251.arr[2 * idx__265254];
    var val_or_node__265265 = this__265251.arr[2 * idx__265254 + 1];
    if(null == key_or_nil__265264) {
      var n__265266 = val_or_node__265265.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__265266 === val_or_node__265265) {
        return inode__265252
      }else {
        return cljs.core.edit_and_set.call(null, inode__265252, edit, 2 * idx__265254 + 1, n__265266)
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__265264)) {
        if(val === val_or_node__265265) {
          return inode__265252
        }else {
          return cljs.core.edit_and_set.call(null, inode__265252, edit, 2 * idx__265254 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return cljs.core.edit_and_set.call(null, inode__265252, edit, 2 * idx__265254, null, 2 * idx__265254 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__265264, val_or_node__265265, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__265267 = this;
  var inode__265268 = this;
  return cljs.core.create_inode_seq.call(null, this__265267.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__265269 = this;
  var inode__265270 = this;
  var bit__265271 = 1 << (hash >>> shift & 31);
  if((this__265269.bitmap & bit__265271) === 0) {
    return inode__265270
  }else {
    var idx__265272 = cljs.core.bitmap_indexed_node_index.call(null, this__265269.bitmap, bit__265271);
    var key_or_nil__265273 = this__265269.arr[2 * idx__265272];
    var val_or_node__265274 = this__265269.arr[2 * idx__265272 + 1];
    if(null == key_or_nil__265273) {
      var n__265275 = val_or_node__265274.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__265275 === val_or_node__265274) {
        return inode__265270
      }else {
        if(null != n__265275) {
          return cljs.core.edit_and_set.call(null, inode__265270, edit, 2 * idx__265272 + 1, n__265275)
        }else {
          if(this__265269.bitmap === bit__265271) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__265270.edit_and_remove_pair(edit, bit__265271, idx__265272)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__265273)) {
        removed_leaf_QMARK_[0] = true;
        return inode__265270.edit_and_remove_pair(edit, bit__265271, idx__265272)
      }else {
        if("\ufdd0'else") {
          return inode__265270
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__265276 = this;
  var inode__265277 = this;
  if(e === this__265276.edit) {
    return inode__265277
  }else {
    var n__265278 = cljs.core.bit_count.call(null, this__265276.bitmap);
    var new_arr__265279 = cljs.core.make_array.call(null, n__265278 < 0 ? 4 : 2 * (n__265278 + 1));
    cljs.core.array_copy.call(null, this__265276.arr, 0, new_arr__265279, 0, 2 * n__265278);
    return new cljs.core.BitmapIndexedNode(e, this__265276.bitmap, new_arr__265279)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__265280 = this;
  var inode__265281 = this;
  return cljs.core.inode_kv_reduce.call(null, this__265280.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function() {
  var G__265318 = null;
  var G__265318__3 = function(shift, hash, key) {
    var this__265282 = this;
    var inode__265283 = this;
    var bit__265284 = 1 << (hash >>> shift & 31);
    if((this__265282.bitmap & bit__265284) === 0) {
      return null
    }else {
      var idx__265285 = cljs.core.bitmap_indexed_node_index.call(null, this__265282.bitmap, bit__265284);
      var key_or_nil__265286 = this__265282.arr[2 * idx__265285];
      var val_or_node__265287 = this__265282.arr[2 * idx__265285 + 1];
      if(null == key_or_nil__265286) {
        return val_or_node__265287.inode_find(shift + 5, hash, key)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__265286)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__265286, val_or_node__265287])
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
  var G__265318__4 = function(shift, hash, key, not_found) {
    var this__265288 = this;
    var inode__265289 = this;
    var bit__265290 = 1 << (hash >>> shift & 31);
    if((this__265288.bitmap & bit__265290) === 0) {
      return not_found
    }else {
      var idx__265291 = cljs.core.bitmap_indexed_node_index.call(null, this__265288.bitmap, bit__265290);
      var key_or_nil__265292 = this__265288.arr[2 * idx__265291];
      var val_or_node__265293 = this__265288.arr[2 * idx__265291 + 1];
      if(null == key_or_nil__265292) {
        return val_or_node__265293.inode_find(shift + 5, hash, key, not_found)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__265292)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__265292, val_or_node__265293])
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
  G__265318 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__265318__3.call(this, shift, hash, key);
      case 4:
        return G__265318__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__265318
}();
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__265294 = this;
  var inode__265295 = this;
  var bit__265296 = 1 << (hash >>> shift & 31);
  if((this__265294.bitmap & bit__265296) === 0) {
    return inode__265295
  }else {
    var idx__265297 = cljs.core.bitmap_indexed_node_index.call(null, this__265294.bitmap, bit__265296);
    var key_or_nil__265298 = this__265294.arr[2 * idx__265297];
    var val_or_node__265299 = this__265294.arr[2 * idx__265297 + 1];
    if(null == key_or_nil__265298) {
      var n__265300 = val_or_node__265299.inode_without(shift + 5, hash, key);
      if(n__265300 === val_or_node__265299) {
        return inode__265295
      }else {
        if(null != n__265300) {
          return new cljs.core.BitmapIndexedNode(null, this__265294.bitmap, cljs.core.clone_and_set.call(null, this__265294.arr, 2 * idx__265297 + 1, n__265300))
        }else {
          if(this__265294.bitmap === bit__265296) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__265294.bitmap ^ bit__265296, cljs.core.remove_pair.call(null, this__265294.arr, idx__265297))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__265298)) {
        return new cljs.core.BitmapIndexedNode(null, this__265294.bitmap ^ bit__265296, cljs.core.remove_pair.call(null, this__265294.arr, idx__265297))
      }else {
        if("\ufdd0'else") {
          return inode__265295
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__265301 = this;
  var inode__265302 = this;
  var bit__265303 = 1 << (hash >>> shift & 31);
  var idx__265304 = cljs.core.bitmap_indexed_node_index.call(null, this__265301.bitmap, bit__265303);
  if((this__265301.bitmap & bit__265303) === 0) {
    var n__265305 = cljs.core.bit_count.call(null, this__265301.bitmap);
    if(n__265305 >= 16) {
      var nodes__265306 = cljs.core.make_array.call(null, 32);
      var jdx__265307 = hash >>> shift & 31;
      nodes__265306[jdx__265307] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__265308 = 0;
      var j__265309 = 0;
      while(true) {
        if(i__265308 < 32) {
          if((this__265301.bitmap >>> i__265308 & 1) === 0) {
            var G__265319 = i__265308 + 1;
            var G__265320 = j__265309;
            i__265308 = G__265319;
            j__265309 = G__265320;
            continue
          }else {
            nodes__265306[i__265308] = null != this__265301.arr[j__265309] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__265301.arr[j__265309]), this__265301.arr[j__265309], this__265301.arr[j__265309 + 1], added_leaf_QMARK_) : this__265301.arr[j__265309 + 1];
            var G__265321 = i__265308 + 1;
            var G__265322 = j__265309 + 2;
            i__265308 = G__265321;
            j__265309 = G__265322;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__265305 + 1, nodes__265306)
    }else {
      var new_arr__265310 = cljs.core.make_array.call(null, 2 * (n__265305 + 1));
      cljs.core.array_copy.call(null, this__265301.arr, 0, new_arr__265310, 0, 2 * idx__265304);
      new_arr__265310[2 * idx__265304] = key;
      added_leaf_QMARK_[0] = true;
      new_arr__265310[2 * idx__265304 + 1] = val;
      cljs.core.array_copy.call(null, this__265301.arr, 2 * idx__265304, new_arr__265310, 2 * (idx__265304 + 1), 2 * (n__265305 - idx__265304));
      return new cljs.core.BitmapIndexedNode(null, this__265301.bitmap | bit__265303, new_arr__265310)
    }
  }else {
    var key_or_nil__265311 = this__265301.arr[2 * idx__265304];
    var val_or_node__265312 = this__265301.arr[2 * idx__265304 + 1];
    if(null == key_or_nil__265311) {
      var n__265313 = val_or_node__265312.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__265313 === val_or_node__265312) {
        return inode__265302
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__265301.bitmap, cljs.core.clone_and_set.call(null, this__265301.arr, 2 * idx__265304 + 1, n__265313))
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__265311)) {
        if(val === val_or_node__265312) {
          return inode__265302
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__265301.bitmap, cljs.core.clone_and_set.call(null, this__265301.arr, 2 * idx__265304 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return new cljs.core.BitmapIndexedNode(null, this__265301.bitmap, cljs.core.clone_and_set.call(null, this__265301.arr, 2 * idx__265304, null, 2 * idx__265304 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__265311, val_or_node__265312, hash, key, val)))
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
  var arr__265323 = array_node.arr;
  var len__265324 = 2 * (array_node.cnt - 1);
  var new_arr__265325 = cljs.core.make_array.call(null, len__265324);
  var i__265326 = 0;
  var j__265327 = 1;
  var bitmap__265328 = 0;
  while(true) {
    if(i__265326 < len__265324) {
      if(function() {
        var and__3822__auto____265329 = i__265326 != idx;
        if(and__3822__auto____265329) {
          return null != arr__265323[i__265326]
        }else {
          return and__3822__auto____265329
        }
      }()) {
        new_arr__265325[j__265327] = arr__265323[i__265326];
        var G__265330 = i__265326 + 1;
        var G__265331 = j__265327 + 2;
        var G__265332 = bitmap__265328 | 1 << i__265326;
        i__265326 = G__265330;
        j__265327 = G__265331;
        bitmap__265328 = G__265332;
        continue
      }else {
        var G__265333 = i__265326 + 1;
        var G__265334 = j__265327;
        var G__265335 = bitmap__265328;
        i__265326 = G__265333;
        j__265327 = G__265334;
        bitmap__265328 = G__265335;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__265328, new_arr__265325)
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
  var this__265336 = this;
  var inode__265337 = this;
  var idx__265338 = hash >>> shift & 31;
  var node__265339 = this__265336.arr[idx__265338];
  if(null == node__265339) {
    return new cljs.core.ArrayNode(null, this__265336.cnt + 1, cljs.core.clone_and_set.call(null, this__265336.arr, idx__265338, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__265340 = node__265339.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__265340 === node__265339) {
      return inode__265337
    }else {
      return new cljs.core.ArrayNode(null, this__265336.cnt, cljs.core.clone_and_set.call(null, this__265336.arr, idx__265338, n__265340))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__265341 = this;
  var inode__265342 = this;
  var idx__265343 = hash >>> shift & 31;
  var node__265344 = this__265341.arr[idx__265343];
  if(null != node__265344) {
    var n__265345 = node__265344.inode_without(shift + 5, hash, key);
    if(n__265345 === node__265344) {
      return inode__265342
    }else {
      if(n__265345 == null) {
        if(this__265341.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__265342, null, idx__265343)
        }else {
          return new cljs.core.ArrayNode(null, this__265341.cnt - 1, cljs.core.clone_and_set.call(null, this__265341.arr, idx__265343, n__265345))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__265341.cnt, cljs.core.clone_and_set.call(null, this__265341.arr, idx__265343, n__265345))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__265342
  }
};
cljs.core.ArrayNode.prototype.inode_find = function() {
  var G__265377 = null;
  var G__265377__3 = function(shift, hash, key) {
    var this__265346 = this;
    var inode__265347 = this;
    var idx__265348 = hash >>> shift & 31;
    var node__265349 = this__265346.arr[idx__265348];
    if(null != node__265349) {
      return node__265349.inode_find(shift + 5, hash, key)
    }else {
      return null
    }
  };
  var G__265377__4 = function(shift, hash, key, not_found) {
    var this__265350 = this;
    var inode__265351 = this;
    var idx__265352 = hash >>> shift & 31;
    var node__265353 = this__265350.arr[idx__265352];
    if(null != node__265353) {
      return node__265353.inode_find(shift + 5, hash, key, not_found)
    }else {
      return not_found
    }
  };
  G__265377 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__265377__3.call(this, shift, hash, key);
      case 4:
        return G__265377__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__265377
}();
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__265354 = this;
  var inode__265355 = this;
  return cljs.core.create_array_node_seq.call(null, this__265354.arr)
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__265356 = this;
  var inode__265357 = this;
  if(e === this__265356.edit) {
    return inode__265357
  }else {
    return new cljs.core.ArrayNode(e, this__265356.cnt, cljs.core.aclone.call(null, this__265356.arr))
  }
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__265358 = this;
  var inode__265359 = this;
  var idx__265360 = hash >>> shift & 31;
  var node__265361 = this__265358.arr[idx__265360];
  if(null == node__265361) {
    var editable__265362 = cljs.core.edit_and_set.call(null, inode__265359, edit, idx__265360, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__265362.cnt = editable__265362.cnt + 1;
    return editable__265362
  }else {
    var n__265363 = node__265361.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__265363 === node__265361) {
      return inode__265359
    }else {
      return cljs.core.edit_and_set.call(null, inode__265359, edit, idx__265360, n__265363)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__265364 = this;
  var inode__265365 = this;
  var idx__265366 = hash >>> shift & 31;
  var node__265367 = this__265364.arr[idx__265366];
  if(null == node__265367) {
    return inode__265365
  }else {
    var n__265368 = node__265367.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__265368 === node__265367) {
      return inode__265365
    }else {
      if(null == n__265368) {
        if(this__265364.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__265365, edit, idx__265366)
        }else {
          var editable__265369 = cljs.core.edit_and_set.call(null, inode__265365, edit, idx__265366, n__265368);
          editable__265369.cnt = editable__265369.cnt - 1;
          return editable__265369
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__265365, edit, idx__265366, n__265368)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__265370 = this;
  var inode__265371 = this;
  var len__265372 = this__265370.arr.length;
  var i__265373 = 0;
  var init__265374 = init;
  while(true) {
    if(i__265373 < len__265372) {
      var node__265375 = this__265370.arr[i__265373];
      if(node__265375 != null) {
        var init__265376 = node__265375.kv_reduce(f, init__265374);
        if(cljs.core.reduced_QMARK_.call(null, init__265376)) {
          return cljs.core.deref.call(null, init__265376)
        }else {
          var G__265378 = i__265373 + 1;
          var G__265379 = init__265376;
          i__265373 = G__265378;
          init__265374 = G__265379;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__265374
    }
    break
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__265380 = 2 * cnt;
  var i__265381 = 0;
  while(true) {
    if(i__265381 < lim__265380) {
      if(cljs.core._EQ_.call(null, key, arr[i__265381])) {
        return i__265381
      }else {
        var G__265382 = i__265381 + 2;
        i__265381 = G__265382;
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
  var this__265383 = this;
  var inode__265384 = this;
  if(hash === this__265383.collision_hash) {
    var idx__265385 = cljs.core.hash_collision_node_find_index.call(null, this__265383.arr, this__265383.cnt, key);
    if(idx__265385 === -1) {
      var len__265386 = this__265383.arr.length;
      var new_arr__265387 = cljs.core.make_array.call(null, len__265386 + 2);
      cljs.core.array_copy.call(null, this__265383.arr, 0, new_arr__265387, 0, len__265386);
      new_arr__265387[len__265386] = key;
      new_arr__265387[len__265386 + 1] = val;
      added_leaf_QMARK_[0] = true;
      return new cljs.core.HashCollisionNode(null, this__265383.collision_hash, this__265383.cnt + 1, new_arr__265387)
    }else {
      if(cljs.core._EQ_.call(null, this__265383.arr[idx__265385], val)) {
        return inode__265384
      }else {
        return new cljs.core.HashCollisionNode(null, this__265383.collision_hash, this__265383.cnt, cljs.core.clone_and_set.call(null, this__265383.arr, idx__265385 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__265383.collision_hash >>> shift & 31), [null, inode__265384])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__265388 = this;
  var inode__265389 = this;
  var idx__265390 = cljs.core.hash_collision_node_find_index.call(null, this__265388.arr, this__265388.cnt, key);
  if(idx__265390 === -1) {
    return inode__265389
  }else {
    if(this__265388.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__265388.collision_hash, this__265388.cnt - 1, cljs.core.remove_pair.call(null, this__265388.arr, cljs.core.quot.call(null, idx__265390, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_find = function() {
  var G__265417 = null;
  var G__265417__3 = function(shift, hash, key) {
    var this__265391 = this;
    var inode__265392 = this;
    var idx__265393 = cljs.core.hash_collision_node_find_index.call(null, this__265391.arr, this__265391.cnt, key);
    if(idx__265393 < 0) {
      return null
    }else {
      if(cljs.core._EQ_.call(null, key, this__265391.arr[idx__265393])) {
        return cljs.core.PersistentVector.fromArray([this__265391.arr[idx__265393], this__265391.arr[idx__265393 + 1]])
      }else {
        if("\ufdd0'else") {
          return null
        }else {
          return null
        }
      }
    }
  };
  var G__265417__4 = function(shift, hash, key, not_found) {
    var this__265394 = this;
    var inode__265395 = this;
    var idx__265396 = cljs.core.hash_collision_node_find_index.call(null, this__265394.arr, this__265394.cnt, key);
    if(idx__265396 < 0) {
      return not_found
    }else {
      if(cljs.core._EQ_.call(null, key, this__265394.arr[idx__265396])) {
        return cljs.core.PersistentVector.fromArray([this__265394.arr[idx__265396], this__265394.arr[idx__265396 + 1]])
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  };
  G__265417 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__265417__3.call(this, shift, hash, key);
      case 4:
        return G__265417__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__265417
}();
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__265397 = this;
  var inode__265398 = this;
  return cljs.core.create_inode_seq.call(null, this__265397.arr)
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function() {
  var G__265418 = null;
  var G__265418__1 = function(e) {
    var this__265399 = this;
    var inode__265400 = this;
    if(e === this__265399.edit) {
      return inode__265400
    }else {
      var new_arr__265401 = cljs.core.make_array.call(null, 2 * (this__265399.cnt + 1));
      cljs.core.array_copy.call(null, this__265399.arr, 0, new_arr__265401, 0, 2 * this__265399.cnt);
      return new cljs.core.HashCollisionNode(e, this__265399.collision_hash, this__265399.cnt, new_arr__265401)
    }
  };
  var G__265418__3 = function(e, count, array) {
    var this__265402 = this;
    var inode__265403 = this;
    if(e === this__265402.edit) {
      this__265402.arr = array;
      this__265402.cnt = count;
      return inode__265403
    }else {
      return new cljs.core.HashCollisionNode(this__265402.edit, this__265402.collision_hash, count, array)
    }
  };
  G__265418 = function(e, count, array) {
    switch(arguments.length) {
      case 1:
        return G__265418__1.call(this, e);
      case 3:
        return G__265418__3.call(this, e, count, array)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__265418
}();
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__265404 = this;
  var inode__265405 = this;
  if(hash === this__265404.collision_hash) {
    var idx__265406 = cljs.core.hash_collision_node_find_index.call(null, this__265404.arr, this__265404.cnt, key);
    if(idx__265406 === -1) {
      if(this__265404.arr.length > 2 * this__265404.cnt) {
        var editable__265407 = cljs.core.edit_and_set.call(null, inode__265405, edit, 2 * this__265404.cnt, key, 2 * this__265404.cnt + 1, val);
        added_leaf_QMARK_[0] = true;
        editable__265407.cnt = editable__265407.cnt + 1;
        return editable__265407
      }else {
        var len__265408 = this__265404.arr.length;
        var new_arr__265409 = cljs.core.make_array.call(null, len__265408 + 2);
        cljs.core.array_copy.call(null, this__265404.arr, 0, new_arr__265409, 0, len__265408);
        new_arr__265409[len__265408] = key;
        new_arr__265409[len__265408 + 1] = val;
        added_leaf_QMARK_[0] = true;
        return inode__265405.ensure_editable(edit, this__265404.cnt + 1, new_arr__265409)
      }
    }else {
      if(this__265404.arr[idx__265406 + 1] === val) {
        return inode__265405
      }else {
        return cljs.core.edit_and_set.call(null, inode__265405, edit, idx__265406 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__265404.collision_hash >>> shift & 31), [null, inode__265405, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__265410 = this;
  var inode__265411 = this;
  var idx__265412 = cljs.core.hash_collision_node_find_index.call(null, this__265410.arr, this__265410.cnt, key);
  if(idx__265412 === -1) {
    return inode__265411
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__265410.cnt === 1) {
      return null
    }else {
      var editable__265413 = inode__265411.ensure_editable(edit);
      var earr__265414 = editable__265413.arr;
      earr__265414[idx__265412] = earr__265414[2 * this__265410.cnt - 2];
      earr__265414[idx__265412 + 1] = earr__265414[2 * this__265410.cnt - 1];
      earr__265414[2 * this__265410.cnt - 1] = null;
      earr__265414[2 * this__265410.cnt - 2] = null;
      editable__265413.cnt = editable__265413.cnt - 1;
      return editable__265413
    }
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__265415 = this;
  var inode__265416 = this;
  return cljs.core.inode_kv_reduce.call(null, this__265415.arr, f, init)
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__265419 = cljs.core.hash.call(null, key1);
    if(key1hash__265419 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__265419, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___265420 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__265419, key1, val1, added_leaf_QMARK___265420).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___265420)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__265421 = cljs.core.hash.call(null, key1);
    if(key1hash__265421 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__265421, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___265422 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__265421, key1, val1, added_leaf_QMARK___265422).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___265422)
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
  var this__265423 = this;
  var h__364__auto____265424 = this__265423.__hash;
  if(h__364__auto____265424 != null) {
    return h__364__auto____265424
  }else {
    var h__364__auto____265425 = cljs.core.hash_coll.call(null, coll);
    this__265423.__hash = h__364__auto____265425;
    return h__364__auto____265425
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__265426 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__265427 = this;
  var this$__265428 = this;
  return cljs.core.pr_str.call(null, this$__265428)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__265429 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__265430 = this;
  if(this__265430.s == null) {
    return cljs.core.PersistentVector.fromArray([this__265430.nodes[this__265430.i], this__265430.nodes[this__265430.i + 1]])
  }else {
    return cljs.core.first.call(null, this__265430.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__265431 = this;
  if(this__265431.s == null) {
    return cljs.core.create_inode_seq.call(null, this__265431.nodes, this__265431.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__265431.nodes, this__265431.i, cljs.core.next.call(null, this__265431.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__265432 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__265433 = this;
  return new cljs.core.NodeSeq(meta, this__265433.nodes, this__265433.i, this__265433.s, this__265433.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__265434 = this;
  return this__265434.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__265435 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__265435.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__265436 = nodes.length;
      var j__265437 = i;
      while(true) {
        if(j__265437 < len__265436) {
          if(null != nodes[j__265437]) {
            return new cljs.core.NodeSeq(null, nodes, j__265437, null, null)
          }else {
            var temp__3971__auto____265438 = nodes[j__265437 + 1];
            if(cljs.core.truth_(temp__3971__auto____265438)) {
              var node__265439 = temp__3971__auto____265438;
              var temp__3971__auto____265440 = node__265439.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____265440)) {
                var node_seq__265441 = temp__3971__auto____265440;
                return new cljs.core.NodeSeq(null, nodes, j__265437 + 2, node_seq__265441, null)
              }else {
                var G__265442 = j__265437 + 2;
                j__265437 = G__265442;
                continue
              }
            }else {
              var G__265443 = j__265437 + 2;
              j__265437 = G__265443;
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
  var this__265444 = this;
  var h__364__auto____265445 = this__265444.__hash;
  if(h__364__auto____265445 != null) {
    return h__364__auto____265445
  }else {
    var h__364__auto____265446 = cljs.core.hash_coll.call(null, coll);
    this__265444.__hash = h__364__auto____265446;
    return h__364__auto____265446
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__265447 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__265448 = this;
  var this$__265449 = this;
  return cljs.core.pr_str.call(null, this$__265449)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__265450 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__265451 = this;
  return cljs.core.first.call(null, this__265451.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__265452 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__265452.nodes, this__265452.i, cljs.core.next.call(null, this__265452.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__265453 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__265454 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__265454.nodes, this__265454.i, this__265454.s, this__265454.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__265455 = this;
  return this__265455.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__265456 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__265456.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__265457 = nodes.length;
      var j__265458 = i;
      while(true) {
        if(j__265458 < len__265457) {
          var temp__3971__auto____265459 = nodes[j__265458];
          if(cljs.core.truth_(temp__3971__auto____265459)) {
            var nj__265460 = temp__3971__auto____265459;
            var temp__3971__auto____265461 = nj__265460.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____265461)) {
              var ns__265462 = temp__3971__auto____265461;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__265458 + 1, ns__265462, null)
            }else {
              var G__265463 = j__265458 + 1;
              j__265458 = G__265463;
              continue
            }
          }else {
            var G__265464 = j__265458 + 1;
            j__265458 = G__265464;
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
  var this__265469 = this;
  return new cljs.core.TransientHashMap({}, this__265469.root, this__265469.cnt, this__265469.has_nil_QMARK_, this__265469.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__265470 = this;
  var h__364__auto____265471 = this__265470.__hash;
  if(h__364__auto____265471 != null) {
    return h__364__auto____265471
  }else {
    var h__364__auto____265472 = cljs.core.hash_imap.call(null, coll);
    this__265470.__hash = h__364__auto____265472;
    return h__364__auto____265472
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__265473 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__265474 = this;
  if(k == null) {
    if(cljs.core.truth_(this__265474.has_nil_QMARK_)) {
      return this__265474.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__265474.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return cljs.core.nth.call(null, this__265474.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__265475 = this;
  if(k == null) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____265476 = this__265475.has_nil_QMARK_;
      if(cljs.core.truth_(and__3822__auto____265476)) {
        return v === this__265475.nil_val
      }else {
        return and__3822__auto____265476
      }
    }())) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__265475.meta, cljs.core.truth_(this__265475.has_nil_QMARK_) ? this__265475.cnt : this__265475.cnt + 1, this__265475.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___265477 = [false];
    var new_root__265478 = (this__265475.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__265475.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___265477);
    if(new_root__265478 === this__265475.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__265475.meta, cljs.core.truth_(added_leaf_QMARK___265477[0]) ? this__265475.cnt + 1 : this__265475.cnt, new_root__265478, this__265475.has_nil_QMARK_, this__265475.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__265479 = this;
  if(k == null) {
    return this__265479.has_nil_QMARK_
  }else {
    if(this__265479.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return cljs.core.not.call(null, this__265479.root.inode_find(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__265500 = null;
  var G__265500__2 = function(tsym265467, k) {
    var this__265480 = this;
    var tsym265467__265481 = this;
    var coll__265482 = tsym265467__265481;
    return cljs.core._lookup.call(null, coll__265482, k)
  };
  var G__265500__3 = function(tsym265468, k, not_found) {
    var this__265483 = this;
    var tsym265468__265484 = this;
    var coll__265485 = tsym265468__265484;
    return cljs.core._lookup.call(null, coll__265485, k, not_found)
  };
  G__265500 = function(tsym265468, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__265500__2.call(this, tsym265468, k);
      case 3:
        return G__265500__3.call(this, tsym265468, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__265500
}();
cljs.core.PersistentHashMap.prototype.apply = function(tsym265465, args265466) {
  return tsym265465.call.apply(tsym265465, [tsym265465].concat(cljs.core.aclone.call(null, args265466)))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__265486 = this;
  var init__265487 = cljs.core.truth_(this__265486.has_nil_QMARK_) ? f.call(null, init, null, this__265486.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__265487)) {
    return cljs.core.deref.call(null, init__265487)
  }else {
    if(null != this__265486.root) {
      return this__265486.root.kv_reduce(f, init__265487)
    }else {
      if("\ufdd0'else") {
        return init__265487
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__265488 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__265489 = this;
  var this$__265490 = this;
  return cljs.core.pr_str.call(null, this$__265490)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__265491 = this;
  if(this__265491.cnt > 0) {
    var s__265492 = null != this__265491.root ? this__265491.root.inode_seq() : null;
    if(cljs.core.truth_(this__265491.has_nil_QMARK_)) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__265491.nil_val]), s__265492)
    }else {
      return s__265492
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__265493 = this;
  return this__265493.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__265494 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__265495 = this;
  return new cljs.core.PersistentHashMap(meta, this__265495.cnt, this__265495.root, this__265495.has_nil_QMARK_, this__265495.nil_val, this__265495.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__265496 = this;
  return this__265496.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__265497 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__265497.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__265498 = this;
  if(k == null) {
    if(cljs.core.truth_(this__265498.has_nil_QMARK_)) {
      return new cljs.core.PersistentHashMap(this__265498.meta, this__265498.cnt - 1, this__265498.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__265498.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__265499 = this__265498.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__265499 === this__265498.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__265498.meta, this__265498.cnt - 1, new_root__265499, this__265498.has_nil_QMARK_, this__265498.nil_val, null)
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
  var len__265501 = ks.length;
  var i__265502 = 0;
  var out__265503 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__265502 < len__265501) {
      var G__265504 = i__265502 + 1;
      var G__265505 = cljs.core.assoc_BANG_.call(null, out__265503, ks[i__265502], vs[i__265502]);
      i__265502 = G__265504;
      out__265503 = G__265505;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__265503)
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
  var this__265506 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__265507 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__265508 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__265509 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__265510 = this;
  if(k == null) {
    if(cljs.core.truth_(this__265510.has_nil_QMARK_)) {
      return this__265510.nil_val
    }else {
      return null
    }
  }else {
    if(this__265510.root == null) {
      return null
    }else {
      return cljs.core.nth.call(null, this__265510.root.inode_find(0, cljs.core.hash.call(null, k), k), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__265511 = this;
  if(k == null) {
    if(cljs.core.truth_(this__265511.has_nil_QMARK_)) {
      return this__265511.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__265511.root == null) {
      return not_found
    }else {
      return cljs.core.nth.call(null, this__265511.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__265512 = this;
  if(cljs.core.truth_(this__265512.edit)) {
    return this__265512.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__265513 = this;
  var tcoll__265514 = this;
  if(cljs.core.truth_(this__265513.edit)) {
    if(function() {
      var G__265515__265516 = o;
      if(G__265515__265516 != null) {
        if(function() {
          var or__3824__auto____265517 = G__265515__265516.cljs$lang$protocol_mask$partition1$ & 8;
          if(or__3824__auto____265517) {
            return or__3824__auto____265517
          }else {
            return G__265515__265516.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__265515__265516.cljs$lang$protocol_mask$partition1$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__265515__265516)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__265515__265516)
      }
    }()) {
      return tcoll__265514.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__265518 = cljs.core.seq.call(null, o);
      var tcoll__265519 = tcoll__265514;
      while(true) {
        var temp__3971__auto____265520 = cljs.core.first.call(null, es__265518);
        if(cljs.core.truth_(temp__3971__auto____265520)) {
          var e__265521 = temp__3971__auto____265520;
          var G__265532 = cljs.core.next.call(null, es__265518);
          var G__265533 = tcoll__265519.assoc_BANG_(cljs.core.key.call(null, e__265521), cljs.core.val.call(null, e__265521));
          es__265518 = G__265532;
          tcoll__265519 = G__265533;
          continue
        }else {
          return tcoll__265519
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__265522 = this;
  var tcoll__265523 = this;
  if(cljs.core.truth_(this__265522.edit)) {
    if(k == null) {
      if(this__265522.nil_val === v) {
      }else {
        this__265522.nil_val = v
      }
      if(cljs.core.truth_(this__265522.has_nil_QMARK_)) {
      }else {
        this__265522.count = this__265522.count + 1;
        this__265522.has_nil_QMARK_ = true
      }
      return tcoll__265523
    }else {
      var added_leaf_QMARK___265524 = [false];
      var node__265525 = (this__265522.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__265522.root).inode_assoc_BANG_(this__265522.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___265524);
      if(node__265525 === this__265522.root) {
      }else {
        this__265522.root = node__265525
      }
      if(cljs.core.truth_(added_leaf_QMARK___265524[0])) {
        this__265522.count = this__265522.count + 1
      }else {
      }
      return tcoll__265523
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__265526 = this;
  var tcoll__265527 = this;
  if(cljs.core.truth_(this__265526.edit)) {
    if(k == null) {
      if(cljs.core.truth_(this__265526.has_nil_QMARK_)) {
        this__265526.has_nil_QMARK_ = false;
        this__265526.nil_val = null;
        this__265526.count = this__265526.count - 1;
        return tcoll__265527
      }else {
        return tcoll__265527
      }
    }else {
      if(this__265526.root == null) {
        return tcoll__265527
      }else {
        var removed_leaf_QMARK___265528 = [false];
        var node__265529 = this__265526.root.inode_without_BANG_(this__265526.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___265528);
        if(node__265529 === this__265526.root) {
        }else {
          this__265526.root = node__265529
        }
        if(cljs.core.truth_(removed_leaf_QMARK___265528[0])) {
          this__265526.count = this__265526.count - 1
        }else {
        }
        return tcoll__265527
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__265530 = this;
  var tcoll__265531 = this;
  if(cljs.core.truth_(this__265530.edit)) {
    this__265530.edit = null;
    return new cljs.core.PersistentHashMap(null, this__265530.count, this__265530.root, this__265530.has_nil_QMARK_, this__265530.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__265534 = node;
  var stack__265535 = stack;
  while(true) {
    if(t__265534 != null) {
      var G__265536 = cljs.core.truth_(ascending_QMARK_) ? t__265534.left : t__265534.right;
      var G__265537 = cljs.core.conj.call(null, stack__265535, t__265534);
      t__265534 = G__265536;
      stack__265535 = G__265537;
      continue
    }else {
      return stack__265535
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
  var this__265538 = this;
  var h__364__auto____265539 = this__265538.__hash;
  if(h__364__auto____265539 != null) {
    return h__364__auto____265539
  }else {
    var h__364__auto____265540 = cljs.core.hash_coll.call(null, coll);
    this__265538.__hash = h__364__auto____265540;
    return h__364__auto____265540
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__265541 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__265542 = this;
  var this$__265543 = this;
  return cljs.core.pr_str.call(null, this$__265543)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__265544 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__265545 = this;
  if(this__265545.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__265545.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__265546 = this;
  return cljs.core.peek.call(null, this__265546.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__265547 = this;
  var t__265548 = cljs.core.peek.call(null, this__265547.stack);
  var next_stack__265549 = cljs.core.tree_map_seq_push.call(null, cljs.core.truth_(this__265547.ascending_QMARK_) ? t__265548.right : t__265548.left, cljs.core.pop.call(null, this__265547.stack), this__265547.ascending_QMARK_);
  if(next_stack__265549 != null) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__265549, this__265547.ascending_QMARK_, this__265547.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__265550 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__265551 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__265551.stack, this__265551.ascending_QMARK_, this__265551.cnt, this__265551.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__265552 = this;
  return this__265552.meta
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
        var and__3822__auto____265553 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____265553) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____265553
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
        var and__3822__auto____265554 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____265554) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____265554
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
  var init__265555 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__265555)) {
    return cljs.core.deref.call(null, init__265555)
  }else {
    var init__265556 = node.left != null ? tree_map_kv_reduce.call(null, node.left, f, init__265555) : init__265555;
    if(cljs.core.reduced_QMARK_.call(null, init__265556)) {
      return cljs.core.deref.call(null, init__265556)
    }else {
      var init__265557 = node.right != null ? tree_map_kv_reduce.call(null, node.right, f, init__265556) : init__265556;
      if(cljs.core.reduced_QMARK_.call(null, init__265557)) {
        return cljs.core.deref.call(null, init__265557)
      }else {
        return init__265557
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
  var this__265562 = this;
  var h__364__auto____265563 = this__265562.__hash;
  if(h__364__auto____265563 != null) {
    return h__364__auto____265563
  }else {
    var h__364__auto____265564 = cljs.core.hash_coll.call(null, coll);
    this__265562.__hash = h__364__auto____265564;
    return h__364__auto____265564
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$ = true;
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__265565 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__265566 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__265567 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__265567.key, this__265567.val]), k, v)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$ = true;
cljs.core.BlackNode.prototype.call = function() {
  var G__265614 = null;
  var G__265614__2 = function(tsym265560, k) {
    var this__265568 = this;
    var tsym265560__265569 = this;
    var node__265570 = tsym265560__265569;
    return cljs.core._lookup.call(null, node__265570, k)
  };
  var G__265614__3 = function(tsym265561, k, not_found) {
    var this__265571 = this;
    var tsym265561__265572 = this;
    var node__265573 = tsym265561__265572;
    return cljs.core._lookup.call(null, node__265573, k, not_found)
  };
  G__265614 = function(tsym265561, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__265614__2.call(this, tsym265561, k);
      case 3:
        return G__265614__3.call(this, tsym265561, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__265614
}();
cljs.core.BlackNode.prototype.apply = function(tsym265558, args265559) {
  return tsym265558.call.apply(tsym265558, [tsym265558].concat(cljs.core.aclone.call(null, args265559)))
};
cljs.core.BlackNode.prototype.cljs$core$ISequential$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__265574 = this;
  return cljs.core.PersistentVector.fromArray([this__265574.key, this__265574.val, o])
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__265575 = this;
  return this__265575.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__265576 = this;
  return this__265576.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__265577 = this;
  var node__265578 = this;
  return ins.balance_right(node__265578)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__265579 = this;
  var node__265580 = this;
  return new cljs.core.RedNode(this__265579.key, this__265579.val, this__265579.left, this__265579.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__265581 = this;
  var node__265582 = this;
  return cljs.core.balance_right_del.call(null, this__265581.key, this__265581.val, this__265581.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__265583 = this;
  var node__265584 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__265585 = this;
  var node__265586 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__265586, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__265587 = this;
  var node__265588 = this;
  return cljs.core.balance_left_del.call(null, this__265587.key, this__265587.val, del, this__265587.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__265589 = this;
  var node__265590 = this;
  return ins.balance_left(node__265590)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__265591 = this;
  var node__265592 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__265592, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__265615 = null;
  var G__265615__0 = function() {
    var this__265595 = this;
    var this$__265596 = this;
    return cljs.core.pr_str.call(null, this$__265596)
  };
  G__265615 = function() {
    switch(arguments.length) {
      case 0:
        return G__265615__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__265615
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__265597 = this;
  var node__265598 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__265598, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__265599 = this;
  var node__265600 = this;
  return node__265600
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$ = true;
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__265601 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__265602 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__265603 = this;
  return cljs.core.list.call(null, this__265603.key, this__265603.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__265605 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$ = true;
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__265606 = this;
  return this__265606.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__265607 = this;
  return cljs.core.PersistentVector.fromArray([this__265607.key])
};
cljs.core.BlackNode.prototype.cljs$core$IVector$ = true;
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__265608 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__265608.key, this__265608.val]), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__265609 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__265610 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__265610.key, this__265610.val]), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__265611 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__265612 = this;
  if(n === 0) {
    return this__265612.key
  }else {
    if(n === 1) {
      return this__265612.val
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
  var this__265613 = this;
  if(n === 0) {
    return this__265613.key
  }else {
    if(n === 1) {
      return this__265613.val
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
  var this__265604 = this;
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
  var this__265620 = this;
  var h__364__auto____265621 = this__265620.__hash;
  if(h__364__auto____265621 != null) {
    return h__364__auto____265621
  }else {
    var h__364__auto____265622 = cljs.core.hash_coll.call(null, coll);
    this__265620.__hash = h__364__auto____265622;
    return h__364__auto____265622
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$ = true;
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__265623 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__265624 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__265625 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__265625.key, this__265625.val]), k, v)
};
cljs.core.RedNode.prototype.cljs$core$IFn$ = true;
cljs.core.RedNode.prototype.call = function() {
  var G__265672 = null;
  var G__265672__2 = function(tsym265618, k) {
    var this__265626 = this;
    var tsym265618__265627 = this;
    var node__265628 = tsym265618__265627;
    return cljs.core._lookup.call(null, node__265628, k)
  };
  var G__265672__3 = function(tsym265619, k, not_found) {
    var this__265629 = this;
    var tsym265619__265630 = this;
    var node__265631 = tsym265619__265630;
    return cljs.core._lookup.call(null, node__265631, k, not_found)
  };
  G__265672 = function(tsym265619, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__265672__2.call(this, tsym265619, k);
      case 3:
        return G__265672__3.call(this, tsym265619, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__265672
}();
cljs.core.RedNode.prototype.apply = function(tsym265616, args265617) {
  return tsym265616.call.apply(tsym265616, [tsym265616].concat(cljs.core.aclone.call(null, args265617)))
};
cljs.core.RedNode.prototype.cljs$core$ISequential$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__265632 = this;
  return cljs.core.PersistentVector.fromArray([this__265632.key, this__265632.val, o])
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__265633 = this;
  return this__265633.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__265634 = this;
  return this__265634.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__265635 = this;
  var node__265636 = this;
  return new cljs.core.RedNode(this__265635.key, this__265635.val, this__265635.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__265637 = this;
  var node__265638 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__265639 = this;
  var node__265640 = this;
  return new cljs.core.RedNode(this__265639.key, this__265639.val, this__265639.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__265641 = this;
  var node__265642 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__265643 = this;
  var node__265644 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__265644, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__265645 = this;
  var node__265646 = this;
  return new cljs.core.RedNode(this__265645.key, this__265645.val, del, this__265645.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__265647 = this;
  var node__265648 = this;
  return new cljs.core.RedNode(this__265647.key, this__265647.val, ins, this__265647.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__265649 = this;
  var node__265650 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__265649.left)) {
    return new cljs.core.RedNode(this__265649.key, this__265649.val, this__265649.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__265649.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__265649.right)) {
      return new cljs.core.RedNode(this__265649.right.key, this__265649.right.val, new cljs.core.BlackNode(this__265649.key, this__265649.val, this__265649.left, this__265649.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__265649.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__265650, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__265673 = null;
  var G__265673__0 = function() {
    var this__265653 = this;
    var this$__265654 = this;
    return cljs.core.pr_str.call(null, this$__265654)
  };
  G__265673 = function() {
    switch(arguments.length) {
      case 0:
        return G__265673__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__265673
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__265655 = this;
  var node__265656 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__265655.right)) {
    return new cljs.core.RedNode(this__265655.key, this__265655.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__265655.left, null), this__265655.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__265655.left)) {
      return new cljs.core.RedNode(this__265655.left.key, this__265655.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__265655.left.left, null), new cljs.core.BlackNode(this__265655.key, this__265655.val, this__265655.left.right, this__265655.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__265656, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__265657 = this;
  var node__265658 = this;
  return new cljs.core.BlackNode(this__265657.key, this__265657.val, this__265657.left, this__265657.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$ = true;
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__265659 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__265660 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__265661 = this;
  return cljs.core.list.call(null, this__265661.key, this__265661.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$ = true;
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__265663 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$ = true;
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__265664 = this;
  return this__265664.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__265665 = this;
  return cljs.core.PersistentVector.fromArray([this__265665.key])
};
cljs.core.RedNode.prototype.cljs$core$IVector$ = true;
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__265666 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__265666.key, this__265666.val]), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__265667 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__265668 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__265668.key, this__265668.val]), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__265669 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__265670 = this;
  if(n === 0) {
    return this__265670.key
  }else {
    if(n === 1) {
      return this__265670.val
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
  var this__265671 = this;
  if(n === 0) {
    return this__265671.key
  }else {
    if(n === 1) {
      return this__265671.val
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
  var this__265662 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__265674 = comp.call(null, k, tree.key);
    if(c__265674 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__265674 < 0) {
        var ins__265675 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(ins__265675 != null) {
          return tree.add_left(ins__265675)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__265676 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(ins__265676 != null) {
            return tree.add_right(ins__265676)
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
          var app__265677 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__265677)) {
            return new cljs.core.RedNode(app__265677.key, app__265677.val, new cljs.core.RedNode(left.key, left.val, left.left, app__265677.left), new cljs.core.RedNode(right.key, right.val, app__265677.right, right.right), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__265677, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__265678 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__265678)) {
              return new cljs.core.RedNode(app__265678.key, app__265678.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__265678.left, null), new cljs.core.BlackNode(right.key, right.val, app__265678.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__265678, right.right, null))
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
    var c__265679 = comp.call(null, k, tree.key);
    if(c__265679 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__265679 < 0) {
        var del__265680 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____265681 = del__265680 != null;
          if(or__3824__auto____265681) {
            return or__3824__auto____265681
          }else {
            return found[0] != null
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__265680, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__265680, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__265682 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____265683 = del__265682 != null;
            if(or__3824__auto____265683) {
              return or__3824__auto____265683
            }else {
              return found[0] != null
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__265682)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__265682, null)
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
  var tk__265684 = tree.key;
  var c__265685 = comp.call(null, k, tk__265684);
  if(c__265685 === 0) {
    return tree.replace(tk__265684, v, tree.left, tree.right)
  }else {
    if(c__265685 < 0) {
      return tree.replace(tk__265684, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__265684, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__265690 = this;
  var h__364__auto____265691 = this__265690.__hash;
  if(h__364__auto____265691 != null) {
    return h__364__auto____265691
  }else {
    var h__364__auto____265692 = cljs.core.hash_imap.call(null, coll);
    this__265690.__hash = h__364__auto____265692;
    return h__364__auto____265692
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__265693 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__265694 = this;
  var n__265695 = coll.entry_at(k);
  if(n__265695 != null) {
    return n__265695.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__265696 = this;
  var found__265697 = [null];
  var t__265698 = cljs.core.tree_map_add.call(null, this__265696.comp, this__265696.tree, k, v, found__265697);
  if(t__265698 == null) {
    var found_node__265699 = cljs.core.nth.call(null, found__265697, 0);
    if(cljs.core._EQ_.call(null, v, found_node__265699.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__265696.comp, cljs.core.tree_map_replace.call(null, this__265696.comp, this__265696.tree, k, v), this__265696.cnt, this__265696.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__265696.comp, t__265698.blacken(), this__265696.cnt + 1, this__265696.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__265700 = this;
  return coll.entry_at(k) != null
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__265732 = null;
  var G__265732__2 = function(tsym265688, k) {
    var this__265701 = this;
    var tsym265688__265702 = this;
    var coll__265703 = tsym265688__265702;
    return cljs.core._lookup.call(null, coll__265703, k)
  };
  var G__265732__3 = function(tsym265689, k, not_found) {
    var this__265704 = this;
    var tsym265689__265705 = this;
    var coll__265706 = tsym265689__265705;
    return cljs.core._lookup.call(null, coll__265706, k, not_found)
  };
  G__265732 = function(tsym265689, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__265732__2.call(this, tsym265689, k);
      case 3:
        return G__265732__3.call(this, tsym265689, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__265732
}();
cljs.core.PersistentTreeMap.prototype.apply = function(tsym265686, args265687) {
  return tsym265686.call.apply(tsym265686, [tsym265686].concat(cljs.core.aclone.call(null, args265687)))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__265707 = this;
  if(this__265707.tree != null) {
    return cljs.core.tree_map_kv_reduce.call(null, this__265707.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__265708 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__265709 = this;
  if(this__265709.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__265709.tree, false, this__265709.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__265710 = this;
  var this$__265711 = this;
  return cljs.core.pr_str.call(null, this$__265711)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__265712 = this;
  var coll__265713 = this;
  var t__265714 = this__265712.tree;
  while(true) {
    if(t__265714 != null) {
      var c__265715 = this__265712.comp.call(null, k, t__265714.key);
      if(c__265715 === 0) {
        return t__265714
      }else {
        if(c__265715 < 0) {
          var G__265733 = t__265714.left;
          t__265714 = G__265733;
          continue
        }else {
          if("\ufdd0'else") {
            var G__265734 = t__265714.right;
            t__265714 = G__265734;
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
  var this__265716 = this;
  if(this__265716.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__265716.tree, ascending_QMARK_, this__265716.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__265717 = this;
  if(this__265717.cnt > 0) {
    var stack__265718 = null;
    var t__265719 = this__265717.tree;
    while(true) {
      if(t__265719 != null) {
        var c__265720 = this__265717.comp.call(null, k, t__265719.key);
        if(c__265720 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__265718, t__265719), ascending_QMARK_, -1)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__265720 < 0) {
              var G__265735 = cljs.core.conj.call(null, stack__265718, t__265719);
              var G__265736 = t__265719.left;
              stack__265718 = G__265735;
              t__265719 = G__265736;
              continue
            }else {
              var G__265737 = stack__265718;
              var G__265738 = t__265719.right;
              stack__265718 = G__265737;
              t__265719 = G__265738;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__265720 > 0) {
                var G__265739 = cljs.core.conj.call(null, stack__265718, t__265719);
                var G__265740 = t__265719.right;
                stack__265718 = G__265739;
                t__265719 = G__265740;
                continue
              }else {
                var G__265741 = stack__265718;
                var G__265742 = t__265719.left;
                stack__265718 = G__265741;
                t__265719 = G__265742;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__265718 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__265718, ascending_QMARK_, -1)
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
  var this__265721 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__265722 = this;
  return this__265722.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__265723 = this;
  if(this__265723.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__265723.tree, true, this__265723.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__265724 = this;
  return this__265724.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__265725 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__265726 = this;
  return new cljs.core.PersistentTreeMap(this__265726.comp, this__265726.tree, this__265726.cnt, meta, this__265726.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__265730 = this;
  return this__265730.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__265731 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__265731.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__265727 = this;
  var found__265728 = [null];
  var t__265729 = cljs.core.tree_map_remove.call(null, this__265727.comp, this__265727.tree, k, found__265728);
  if(t__265729 == null) {
    if(cljs.core.nth.call(null, found__265728, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__265727.comp, null, 0, this__265727.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__265727.comp, t__265729.blacken(), this__265727.cnt - 1, this__265727.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__265743 = cljs.core.seq.call(null, keyvals);
    var out__265744 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(cljs.core.truth_(in$__265743)) {
        var G__265745 = cljs.core.nnext.call(null, in$__265743);
        var G__265746 = cljs.core.assoc_BANG_.call(null, out__265744, cljs.core.first.call(null, in$__265743), cljs.core.second.call(null, in$__265743));
        in$__265743 = G__265745;
        out__265744 = G__265746;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__265744)
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
  hash_map.cljs$lang$applyTo = function(arglist__265747) {
    var keyvals = cljs.core.seq(arglist__265747);
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
  array_map.cljs$lang$applyTo = function(arglist__265748) {
    var keyvals = cljs.core.seq(arglist__265748);
    return array_map__delegate.call(this, keyvals)
  };
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$__265749 = cljs.core.seq.call(null, keyvals);
    var out__265750 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__265749)) {
        var G__265751 = cljs.core.nnext.call(null, in$__265749);
        var G__265752 = cljs.core.assoc.call(null, out__265750, cljs.core.first.call(null, in$__265749), cljs.core.second.call(null, in$__265749));
        in$__265749 = G__265751;
        out__265750 = G__265752;
        continue
      }else {
        return out__265750
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
  sorted_map.cljs$lang$applyTo = function(arglist__265753) {
    var keyvals = cljs.core.seq(arglist__265753);
    return sorted_map__delegate.call(this, keyvals)
  };
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$__265754 = cljs.core.seq.call(null, keyvals);
    var out__265755 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(cljs.core.truth_(in$__265754)) {
        var G__265756 = cljs.core.nnext.call(null, in$__265754);
        var G__265757 = cljs.core.assoc.call(null, out__265755, cljs.core.first.call(null, in$__265754), cljs.core.second.call(null, in$__265754));
        in$__265754 = G__265756;
        out__265755 = G__265757;
        continue
      }else {
        return out__265755
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__265758) {
    var comparator = cljs.core.first(arglist__265758);
    var keyvals = cljs.core.rest(arglist__265758);
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
      return cljs.core.reduce.call(null, function(p1__265759_SHARP_, p2__265760_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____265761 = p1__265759_SHARP_;
          if(cljs.core.truth_(or__3824__auto____265761)) {
            return or__3824__auto____265761
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__265760_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__265762) {
    var maps = cljs.core.seq(arglist__265762);
    return merge__delegate.call(this, maps)
  };
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__265765 = function(m, e) {
        var k__265763 = cljs.core.first.call(null, e);
        var v__265764 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__265763)) {
          return cljs.core.assoc.call(null, m, k__265763, f.call(null, cljs.core.get.call(null, m, k__265763), v__265764))
        }else {
          return cljs.core.assoc.call(null, m, k__265763, v__265764)
        }
      };
      var merge2__265767 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__265765, function() {
          var or__3824__auto____265766 = m1;
          if(cljs.core.truth_(or__3824__auto____265766)) {
            return or__3824__auto____265766
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__265767, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__265768) {
    var f = cljs.core.first(arglist__265768);
    var maps = cljs.core.rest(arglist__265768);
    return merge_with__delegate.call(this, f, maps)
  };
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__265769 = cljs.core.ObjMap.fromObject([], {});
  var keys__265770 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__265770)) {
      var key__265771 = cljs.core.first.call(null, keys__265770);
      var entry__265772 = cljs.core.get.call(null, map, key__265771, "\ufdd0'user/not-found");
      var G__265773 = cljs.core.not_EQ_.call(null, entry__265772, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__265769, key__265771, entry__265772) : ret__265769;
      var G__265774 = cljs.core.next.call(null, keys__265770);
      ret__265769 = G__265773;
      keys__265770 = G__265774;
      continue
    }else {
      return ret__265769
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
  var this__265780 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__265780.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__265781 = this;
  var h__364__auto____265782 = this__265781.__hash;
  if(h__364__auto____265782 != null) {
    return h__364__auto____265782
  }else {
    var h__364__auto____265783 = cljs.core.hash_iset.call(null, coll);
    this__265781.__hash = h__364__auto____265783;
    return h__364__auto____265783
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__265784 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__265785 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__265785.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__265804 = null;
  var G__265804__2 = function(tsym265778, k) {
    var this__265786 = this;
    var tsym265778__265787 = this;
    var coll__265788 = tsym265778__265787;
    return cljs.core._lookup.call(null, coll__265788, k)
  };
  var G__265804__3 = function(tsym265779, k, not_found) {
    var this__265789 = this;
    var tsym265779__265790 = this;
    var coll__265791 = tsym265779__265790;
    return cljs.core._lookup.call(null, coll__265791, k, not_found)
  };
  G__265804 = function(tsym265779, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__265804__2.call(this, tsym265779, k);
      case 3:
        return G__265804__3.call(this, tsym265779, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__265804
}();
cljs.core.PersistentHashSet.prototype.apply = function(tsym265776, args265777) {
  return tsym265776.call.apply(tsym265776, [tsym265776].concat(cljs.core.aclone.call(null, args265777)))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__265792 = this;
  return new cljs.core.PersistentHashSet(this__265792.meta, cljs.core.assoc.call(null, this__265792.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__265793 = this;
  var this$__265794 = this;
  return cljs.core.pr_str.call(null, this$__265794)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__265795 = this;
  return cljs.core.keys.call(null, this__265795.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__265796 = this;
  return new cljs.core.PersistentHashSet(this__265796.meta, cljs.core.dissoc.call(null, this__265796.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__265797 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__265798 = this;
  var and__3822__auto____265799 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____265799) {
    var and__3822__auto____265800 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____265800) {
      return cljs.core.every_QMARK_.call(null, function(p1__265775_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__265775_SHARP_)
      }, other)
    }else {
      return and__3822__auto____265800
    }
  }else {
    return and__3822__auto____265799
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__265801 = this;
  return new cljs.core.PersistentHashSet(meta, this__265801.hash_map, this__265801.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__265802 = this;
  return this__265802.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__265803 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__265803.meta)
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
  var G__265822 = null;
  var G__265822__2 = function(tsym265808, k) {
    var this__265810 = this;
    var tsym265808__265811 = this;
    var tcoll__265812 = tsym265808__265811;
    if(cljs.core._lookup.call(null, this__265810.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__265822__3 = function(tsym265809, k, not_found) {
    var this__265813 = this;
    var tsym265809__265814 = this;
    var tcoll__265815 = tsym265809__265814;
    if(cljs.core._lookup.call(null, this__265813.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__265822 = function(tsym265809, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__265822__2.call(this, tsym265809, k);
      case 3:
        return G__265822__3.call(this, tsym265809, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__265822
}();
cljs.core.TransientHashSet.prototype.apply = function(tsym265806, args265807) {
  return tsym265806.call.apply(tsym265806, [tsym265806].concat(cljs.core.aclone.call(null, args265807)))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__265816 = this;
  return cljs.core._lookup.call(null, tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__265817 = this;
  if(cljs.core._lookup.call(null, this__265817.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__265818 = this;
  return cljs.core.count.call(null, this__265818.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__265819 = this;
  this__265819.transient_map = cljs.core.dissoc_BANG_.call(null, this__265819.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__265820 = this;
  this__265820.transient_map = cljs.core.assoc_BANG_.call(null, this__265820.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__265821 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__265821.transient_map), null)
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
  var this__265827 = this;
  var h__364__auto____265828 = this__265827.__hash;
  if(h__364__auto____265828 != null) {
    return h__364__auto____265828
  }else {
    var h__364__auto____265829 = cljs.core.hash_iset.call(null, coll);
    this__265827.__hash = h__364__auto____265829;
    return h__364__auto____265829
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__265830 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__265831 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__265831.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__265855 = null;
  var G__265855__2 = function(tsym265825, k) {
    var this__265832 = this;
    var tsym265825__265833 = this;
    var coll__265834 = tsym265825__265833;
    return cljs.core._lookup.call(null, coll__265834, k)
  };
  var G__265855__3 = function(tsym265826, k, not_found) {
    var this__265835 = this;
    var tsym265826__265836 = this;
    var coll__265837 = tsym265826__265836;
    return cljs.core._lookup.call(null, coll__265837, k, not_found)
  };
  G__265855 = function(tsym265826, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__265855__2.call(this, tsym265826, k);
      case 3:
        return G__265855__3.call(this, tsym265826, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__265855
}();
cljs.core.PersistentTreeSet.prototype.apply = function(tsym265823, args265824) {
  return tsym265823.call.apply(tsym265823, [tsym265823].concat(cljs.core.aclone.call(null, args265824)))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__265838 = this;
  return new cljs.core.PersistentTreeSet(this__265838.meta, cljs.core.assoc.call(null, this__265838.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__265839 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__265839.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__265840 = this;
  var this$__265841 = this;
  return cljs.core.pr_str.call(null, this$__265841)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__265842 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__265842.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__265843 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__265843.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__265844 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__265845 = this;
  return cljs.core._comparator.call(null, this__265845.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__265846 = this;
  return cljs.core.keys.call(null, this__265846.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__265847 = this;
  return new cljs.core.PersistentTreeSet(this__265847.meta, cljs.core.dissoc.call(null, this__265847.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__265848 = this;
  return cljs.core.count.call(null, this__265848.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__265849 = this;
  var and__3822__auto____265850 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____265850) {
    var and__3822__auto____265851 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____265851) {
      return cljs.core.every_QMARK_.call(null, function(p1__265805_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__265805_SHARP_)
      }, other)
    }else {
      return and__3822__auto____265851
    }
  }else {
    return and__3822__auto____265850
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__265852 = this;
  return new cljs.core.PersistentTreeSet(meta, this__265852.tree_map, this__265852.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__265853 = this;
  return this__265853.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__265854 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__265854.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in$__265856 = cljs.core.seq.call(null, coll);
  var out__265857 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, in$__265856))) {
      var G__265858 = cljs.core.next.call(null, in$__265856);
      var G__265859 = cljs.core.conj_BANG_.call(null, out__265857, cljs.core.first.call(null, in$__265856));
      in$__265856 = G__265858;
      out__265857 = G__265859;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__265857)
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
  sorted_set.cljs$lang$applyTo = function(arglist__265860) {
    var keys = cljs.core.seq(arglist__265860);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__265862) {
    var comparator = cljs.core.first(arglist__265862);
    var keys = cljs.core.rest(arglist__265862);
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__265863 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____265864 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____265864)) {
        var e__265865 = temp__3971__auto____265864;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__265865))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__265863, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__265861_SHARP_) {
      var temp__3971__auto____265866 = cljs.core.find.call(null, smap, p1__265861_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____265866)) {
        var e__265867 = temp__3971__auto____265866;
        return cljs.core.second.call(null, e__265867)
      }else {
        return p1__265861_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__265875 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__265868, seen) {
        while(true) {
          var vec__265869__265870 = p__265868;
          var f__265871 = cljs.core.nth.call(null, vec__265869__265870, 0, null);
          var xs__265872 = vec__265869__265870;
          var temp__3974__auto____265873 = cljs.core.seq.call(null, xs__265872);
          if(cljs.core.truth_(temp__3974__auto____265873)) {
            var s__265874 = temp__3974__auto____265873;
            if(cljs.core.contains_QMARK_.call(null, seen, f__265871)) {
              var G__265876 = cljs.core.rest.call(null, s__265874);
              var G__265877 = seen;
              p__265868 = G__265876;
              seen = G__265877;
              continue
            }else {
              return cljs.core.cons.call(null, f__265871, step.call(null, cljs.core.rest.call(null, s__265874), cljs.core.conj.call(null, seen, f__265871)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__265875.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__265878 = cljs.core.PersistentVector.fromArray([]);
  var s__265879 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__265879))) {
      var G__265880 = cljs.core.conj.call(null, ret__265878, cljs.core.first.call(null, s__265879));
      var G__265881 = cljs.core.next.call(null, s__265879);
      ret__265878 = G__265880;
      s__265879 = G__265881;
      continue
    }else {
      return cljs.core.seq.call(null, ret__265878)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____265882 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____265882) {
        return or__3824__auto____265882
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__265883 = x.lastIndexOf("/");
      if(i__265883 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__265883 + 1)
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
    var or__3824__auto____265884 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____265884) {
      return or__3824__auto____265884
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__265885 = x.lastIndexOf("/");
    if(i__265885 > -1) {
      return cljs.core.subs.call(null, x, 2, i__265885)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__265888 = cljs.core.ObjMap.fromObject([], {});
  var ks__265889 = cljs.core.seq.call(null, keys);
  var vs__265890 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____265891 = ks__265889;
      if(cljs.core.truth_(and__3822__auto____265891)) {
        return vs__265890
      }else {
        return and__3822__auto____265891
      }
    }())) {
      var G__265892 = cljs.core.assoc.call(null, map__265888, cljs.core.first.call(null, ks__265889), cljs.core.first.call(null, vs__265890));
      var G__265893 = cljs.core.next.call(null, ks__265889);
      var G__265894 = cljs.core.next.call(null, vs__265890);
      map__265888 = G__265892;
      ks__265889 = G__265893;
      vs__265890 = G__265894;
      continue
    }else {
      return map__265888
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
    var G__265897__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__265886_SHARP_, p2__265887_SHARP_) {
        return max_key.call(null, k, p1__265886_SHARP_, p2__265887_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__265897 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__265897__delegate.call(this, k, x, y, more)
    };
    G__265897.cljs$lang$maxFixedArity = 3;
    G__265897.cljs$lang$applyTo = function(arglist__265898) {
      var k = cljs.core.first(arglist__265898);
      var x = cljs.core.first(cljs.core.next(arglist__265898));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__265898)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__265898)));
      return G__265897__delegate.call(this, k, x, y, more)
    };
    return G__265897
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
    var G__265899__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__265895_SHARP_, p2__265896_SHARP_) {
        return min_key.call(null, k, p1__265895_SHARP_, p2__265896_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__265899 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__265899__delegate.call(this, k, x, y, more)
    };
    G__265899.cljs$lang$maxFixedArity = 3;
    G__265899.cljs$lang$applyTo = function(arglist__265900) {
      var k = cljs.core.first(arglist__265900);
      var x = cljs.core.first(cljs.core.next(arglist__265900));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__265900)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__265900)));
      return G__265899__delegate.call(this, k, x, y, more)
    };
    return G__265899
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
      var temp__3974__auto____265901 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____265901)) {
        var s__265902 = temp__3974__auto____265901;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__265902), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__265902)))
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
    var temp__3974__auto____265903 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____265903)) {
      var s__265904 = temp__3974__auto____265903;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__265904)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__265904), take_while.call(null, pred, cljs.core.rest.call(null, s__265904)))
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
    var comp__265905 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__265905.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__265906 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____265907 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____265907)) {
        var vec__265908__265909 = temp__3974__auto____265907;
        var e__265910 = cljs.core.nth.call(null, vec__265908__265909, 0, null);
        var s__265911 = vec__265908__265909;
        if(cljs.core.truth_(include__265906.call(null, e__265910))) {
          return s__265911
        }else {
          return cljs.core.next.call(null, s__265911)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__265906, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____265912 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____265912)) {
      var vec__265913__265914 = temp__3974__auto____265912;
      var e__265915 = cljs.core.nth.call(null, vec__265913__265914, 0, null);
      var s__265916 = vec__265913__265914;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__265915)) ? s__265916 : cljs.core.next.call(null, s__265916))
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
    var include__265917 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____265918 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____265918)) {
        var vec__265919__265920 = temp__3974__auto____265918;
        var e__265921 = cljs.core.nth.call(null, vec__265919__265920, 0, null);
        var s__265922 = vec__265919__265920;
        if(cljs.core.truth_(include__265917.call(null, e__265921))) {
          return s__265922
        }else {
          return cljs.core.next.call(null, s__265922)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__265917, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____265923 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____265923)) {
      var vec__265924__265925 = temp__3974__auto____265923;
      var e__265926 = cljs.core.nth.call(null, vec__265924__265925, 0, null);
      var s__265927 = vec__265924__265925;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__265926)) ? s__265927 : cljs.core.next.call(null, s__265927))
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
  var this__265928 = this;
  var h__364__auto____265929 = this__265928.__hash;
  if(h__364__auto____265929 != null) {
    return h__364__auto____265929
  }else {
    var h__364__auto____265930 = cljs.core.hash_coll.call(null, rng);
    this__265928.__hash = h__364__auto____265930;
    return h__364__auto____265930
  }
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__265931 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__265932 = this;
  var this$__265933 = this;
  return cljs.core.pr_str.call(null, this$__265933)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__265934 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__265935 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__265936 = this;
  var comp__265937 = this__265936.step > 0 ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__265937.call(null, this__265936.start, this__265936.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__265938 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng))) {
    return 0
  }else {
    return Math["ceil"]((this__265938.end - this__265938.start) / this__265938.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__265939 = this;
  return this__265939.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__265940 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__265940.meta, this__265940.start + this__265940.step, this__265940.end, this__265940.step, null)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__265941 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__265942 = this;
  return new cljs.core.Range(meta, this__265942.start, this__265942.end, this__265942.step, this__265942.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__265943 = this;
  return this__265943.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__265944 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__265944.start + n * this__265944.step
  }else {
    if(function() {
      var and__3822__auto____265945 = this__265944.start > this__265944.end;
      if(and__3822__auto____265945) {
        return this__265944.step === 0
      }else {
        return and__3822__auto____265945
      }
    }()) {
      return this__265944.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__265946 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__265946.start + n * this__265946.step
  }else {
    if(function() {
      var and__3822__auto____265947 = this__265946.start > this__265946.end;
      if(and__3822__auto____265947) {
        return this__265946.step === 0
      }else {
        return and__3822__auto____265947
      }
    }()) {
      return this__265946.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__265948 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__265948.meta)
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
    var temp__3974__auto____265949 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____265949)) {
      var s__265950 = temp__3974__auto____265949;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__265950), take_nth.call(null, n, cljs.core.drop.call(null, n, s__265950)))
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
    var temp__3974__auto____265952 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____265952)) {
      var s__265953 = temp__3974__auto____265952;
      var fst__265954 = cljs.core.first.call(null, s__265953);
      var fv__265955 = f.call(null, fst__265954);
      var run__265956 = cljs.core.cons.call(null, fst__265954, cljs.core.take_while.call(null, function(p1__265951_SHARP_) {
        return cljs.core._EQ_.call(null, fv__265955, f.call(null, p1__265951_SHARP_))
      }, cljs.core.next.call(null, s__265953)));
      return cljs.core.cons.call(null, run__265956, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__265956), s__265953))))
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
      var temp__3971__auto____265967 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____265967)) {
        var s__265968 = temp__3971__auto____265967;
        return reductions.call(null, f, cljs.core.first.call(null, s__265968), cljs.core.rest.call(null, s__265968))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____265969 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____265969)) {
        var s__265970 = temp__3974__auto____265969;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__265970)), cljs.core.rest.call(null, s__265970))
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
      var G__265972 = null;
      var G__265972__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__265972__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__265972__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__265972__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__265972__4 = function() {
        var G__265973__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__265973 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__265973__delegate.call(this, x, y, z, args)
        };
        G__265973.cljs$lang$maxFixedArity = 3;
        G__265973.cljs$lang$applyTo = function(arglist__265974) {
          var x = cljs.core.first(arglist__265974);
          var y = cljs.core.first(cljs.core.next(arglist__265974));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__265974)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__265974)));
          return G__265973__delegate.call(this, x, y, z, args)
        };
        return G__265973
      }();
      G__265972 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__265972__0.call(this);
          case 1:
            return G__265972__1.call(this, x);
          case 2:
            return G__265972__2.call(this, x, y);
          case 3:
            return G__265972__3.call(this, x, y, z);
          default:
            return G__265972__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__265972.cljs$lang$maxFixedArity = 3;
      G__265972.cljs$lang$applyTo = G__265972__4.cljs$lang$applyTo;
      return G__265972
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__265975 = null;
      var G__265975__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__265975__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__265975__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__265975__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__265975__4 = function() {
        var G__265976__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__265976 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__265976__delegate.call(this, x, y, z, args)
        };
        G__265976.cljs$lang$maxFixedArity = 3;
        G__265976.cljs$lang$applyTo = function(arglist__265977) {
          var x = cljs.core.first(arglist__265977);
          var y = cljs.core.first(cljs.core.next(arglist__265977));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__265977)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__265977)));
          return G__265976__delegate.call(this, x, y, z, args)
        };
        return G__265976
      }();
      G__265975 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__265975__0.call(this);
          case 1:
            return G__265975__1.call(this, x);
          case 2:
            return G__265975__2.call(this, x, y);
          case 3:
            return G__265975__3.call(this, x, y, z);
          default:
            return G__265975__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__265975.cljs$lang$maxFixedArity = 3;
      G__265975.cljs$lang$applyTo = G__265975__4.cljs$lang$applyTo;
      return G__265975
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__265978 = null;
      var G__265978__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__265978__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__265978__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__265978__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__265978__4 = function() {
        var G__265979__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__265979 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__265979__delegate.call(this, x, y, z, args)
        };
        G__265979.cljs$lang$maxFixedArity = 3;
        G__265979.cljs$lang$applyTo = function(arglist__265980) {
          var x = cljs.core.first(arglist__265980);
          var y = cljs.core.first(cljs.core.next(arglist__265980));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__265980)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__265980)));
          return G__265979__delegate.call(this, x, y, z, args)
        };
        return G__265979
      }();
      G__265978 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__265978__0.call(this);
          case 1:
            return G__265978__1.call(this, x);
          case 2:
            return G__265978__2.call(this, x, y);
          case 3:
            return G__265978__3.call(this, x, y, z);
          default:
            return G__265978__4.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__265978.cljs$lang$maxFixedArity = 3;
      G__265978.cljs$lang$applyTo = G__265978__4.cljs$lang$applyTo;
      return G__265978
    }()
  };
  var juxt__4 = function() {
    var G__265981__delegate = function(f, g, h, fs) {
      var fs__265971 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__265982 = null;
        var G__265982__0 = function() {
          return cljs.core.reduce.call(null, function(p1__265957_SHARP_, p2__265958_SHARP_) {
            return cljs.core.conj.call(null, p1__265957_SHARP_, p2__265958_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__265971)
        };
        var G__265982__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__265959_SHARP_, p2__265960_SHARP_) {
            return cljs.core.conj.call(null, p1__265959_SHARP_, p2__265960_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__265971)
        };
        var G__265982__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__265961_SHARP_, p2__265962_SHARP_) {
            return cljs.core.conj.call(null, p1__265961_SHARP_, p2__265962_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__265971)
        };
        var G__265982__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__265963_SHARP_, p2__265964_SHARP_) {
            return cljs.core.conj.call(null, p1__265963_SHARP_, p2__265964_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__265971)
        };
        var G__265982__4 = function() {
          var G__265983__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__265965_SHARP_, p2__265966_SHARP_) {
              return cljs.core.conj.call(null, p1__265965_SHARP_, cljs.core.apply.call(null, p2__265966_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__265971)
          };
          var G__265983 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__265983__delegate.call(this, x, y, z, args)
          };
          G__265983.cljs$lang$maxFixedArity = 3;
          G__265983.cljs$lang$applyTo = function(arglist__265984) {
            var x = cljs.core.first(arglist__265984);
            var y = cljs.core.first(cljs.core.next(arglist__265984));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__265984)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__265984)));
            return G__265983__delegate.call(this, x, y, z, args)
          };
          return G__265983
        }();
        G__265982 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__265982__0.call(this);
            case 1:
              return G__265982__1.call(this, x);
            case 2:
              return G__265982__2.call(this, x, y);
            case 3:
              return G__265982__3.call(this, x, y, z);
            default:
              return G__265982__4.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__265982.cljs$lang$maxFixedArity = 3;
        G__265982.cljs$lang$applyTo = G__265982__4.cljs$lang$applyTo;
        return G__265982
      }()
    };
    var G__265981 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__265981__delegate.call(this, f, g, h, fs)
    };
    G__265981.cljs$lang$maxFixedArity = 3;
    G__265981.cljs$lang$applyTo = function(arglist__265985) {
      var f = cljs.core.first(arglist__265985);
      var g = cljs.core.first(cljs.core.next(arglist__265985));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__265985)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__265985)));
      return G__265981__delegate.call(this, f, g, h, fs)
    };
    return G__265981
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
        var G__265987 = cljs.core.next.call(null, coll);
        coll = G__265987;
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
        var and__3822__auto____265986 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3822__auto____265986)) {
          return n > 0
        }else {
          return and__3822__auto____265986
        }
      }())) {
        var G__265988 = n - 1;
        var G__265989 = cljs.core.next.call(null, coll);
        n = G__265988;
        coll = G__265989;
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
  var matches__265990 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__265990), s)) {
    if(cljs.core.count.call(null, matches__265990) === 1) {
      return cljs.core.first.call(null, matches__265990)
    }else {
      return cljs.core.vec.call(null, matches__265990)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__265991 = re.exec(s);
  if(matches__265991 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__265991) === 1) {
      return cljs.core.first.call(null, matches__265991)
    }else {
      return cljs.core.vec.call(null, matches__265991)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__265992 = cljs.core.re_find.call(null, re, s);
  var match_idx__265993 = s.search(re);
  var match_str__265994 = cljs.core.coll_QMARK_.call(null, match_data__265992) ? cljs.core.first.call(null, match_data__265992) : match_data__265992;
  var post_match__265995 = cljs.core.subs.call(null, s, match_idx__265993 + cljs.core.count.call(null, match_str__265994));
  if(cljs.core.truth_(match_data__265992)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__265992, re_seq.call(null, re, post_match__265995))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__265997__265998 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___265999 = cljs.core.nth.call(null, vec__265997__265998, 0, null);
  var flags__266000 = cljs.core.nth.call(null, vec__265997__265998, 1, null);
  var pattern__266001 = cljs.core.nth.call(null, vec__265997__265998, 2, null);
  return new RegExp(pattern__266001, flags__266000)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__265996_SHARP_) {
    return print_one.call(null, p1__265996_SHARP_, opts)
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
          var and__3822__auto____266002 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3822__auto____266002)) {
            var and__3822__auto____266006 = function() {
              var G__266003__266004 = obj;
              if(G__266003__266004 != null) {
                if(function() {
                  var or__3824__auto____266005 = G__266003__266004.cljs$lang$protocol_mask$partition2$ & 8;
                  if(or__3824__auto____266005) {
                    return or__3824__auto____266005
                  }else {
                    return G__266003__266004.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__266003__266004.cljs$lang$protocol_mask$partition2$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__266003__266004)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__266003__266004)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____266006)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____266006
            }
          }else {
            return and__3822__auto____266002
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, function() {
          var G__266007__266008 = obj;
          if(G__266007__266008 != null) {
            if(function() {
              var or__3824__auto____266009 = G__266007__266008.cljs$lang$protocol_mask$partition4$ & 8;
              if(or__3824__auto____266009) {
                return or__3824__auto____266009
              }else {
                return G__266007__266008.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__266007__266008.cljs$lang$protocol_mask$partition4$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__266007__266008)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__266007__266008)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(function() {
          var and__3822__auto____266010 = obj != null;
          if(and__3822__auto____266010) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____266010
          }
        }()) ? obj.cljs$lang$ctorPrSeq(obj) : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__266011 = cljs.core.first.call(null, objs);
  var sb__266012 = new goog.string.StringBuffer;
  var G__266013__266014 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__266013__266014)) {
    var obj__266015 = cljs.core.first.call(null, G__266013__266014);
    var G__266013__266016 = G__266013__266014;
    while(true) {
      if(obj__266015 === first_obj__266011) {
      }else {
        sb__266012.append(" ")
      }
      var G__266017__266018 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__266015, opts));
      if(cljs.core.truth_(G__266017__266018)) {
        var string__266019 = cljs.core.first.call(null, G__266017__266018);
        var G__266017__266020 = G__266017__266018;
        while(true) {
          sb__266012.append(string__266019);
          var temp__3974__auto____266021 = cljs.core.next.call(null, G__266017__266020);
          if(cljs.core.truth_(temp__3974__auto____266021)) {
            var G__266017__266022 = temp__3974__auto____266021;
            var G__266025 = cljs.core.first.call(null, G__266017__266022);
            var G__266026 = G__266017__266022;
            string__266019 = G__266025;
            G__266017__266020 = G__266026;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____266023 = cljs.core.next.call(null, G__266013__266016);
      if(cljs.core.truth_(temp__3974__auto____266023)) {
        var G__266013__266024 = temp__3974__auto____266023;
        var G__266027 = cljs.core.first.call(null, G__266013__266024);
        var G__266028 = G__266013__266024;
        obj__266015 = G__266027;
        G__266013__266016 = G__266028;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__266012
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__266029 = cljs.core.pr_sb.call(null, objs, opts);
  sb__266029.append("\n");
  return[cljs.core.str(sb__266029)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__266030 = cljs.core.first.call(null, objs);
  var G__266031__266032 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__266031__266032)) {
    var obj__266033 = cljs.core.first.call(null, G__266031__266032);
    var G__266031__266034 = G__266031__266032;
    while(true) {
      if(obj__266033 === first_obj__266030) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__266035__266036 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__266033, opts));
      if(cljs.core.truth_(G__266035__266036)) {
        var string__266037 = cljs.core.first.call(null, G__266035__266036);
        var G__266035__266038 = G__266035__266036;
        while(true) {
          cljs.core.string_print.call(null, string__266037);
          var temp__3974__auto____266039 = cljs.core.next.call(null, G__266035__266038);
          if(cljs.core.truth_(temp__3974__auto____266039)) {
            var G__266035__266040 = temp__3974__auto____266039;
            var G__266043 = cljs.core.first.call(null, G__266035__266040);
            var G__266044 = G__266035__266040;
            string__266037 = G__266043;
            G__266035__266038 = G__266044;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____266041 = cljs.core.next.call(null, G__266031__266034);
      if(cljs.core.truth_(temp__3974__auto____266041)) {
        var G__266031__266042 = temp__3974__auto____266041;
        var G__266045 = cljs.core.first.call(null, G__266031__266042);
        var G__266046 = G__266031__266042;
        obj__266033 = G__266045;
        G__266031__266034 = G__266046;
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
  pr_str.cljs$lang$applyTo = function(arglist__266047) {
    var objs = cljs.core.seq(arglist__266047);
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
  prn_str.cljs$lang$applyTo = function(arglist__266048) {
    var objs = cljs.core.seq(arglist__266048);
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
  pr.cljs$lang$applyTo = function(arglist__266049) {
    var objs = cljs.core.seq(arglist__266049);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__266050) {
    var objs = cljs.core.seq(arglist__266050);
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
  print_str.cljs$lang$applyTo = function(arglist__266051) {
    var objs = cljs.core.seq(arglist__266051);
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
  println.cljs$lang$applyTo = function(arglist__266052) {
    var objs = cljs.core.seq(arglist__266052);
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
  println_str.cljs$lang$applyTo = function(arglist__266053) {
    var objs = cljs.core.seq(arglist__266053);
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
  prn.cljs$lang$applyTo = function(arglist__266054) {
    var objs = cljs.core.seq(arglist__266054);
    return prn__delegate.call(this, objs)
  };
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__266055 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__266055, "{", ", ", "}", opts, coll)
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
  var pr_pair__266056 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__266056, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__266057 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__266057, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____266058 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____266058)) {
        var nspc__266059 = temp__3974__auto____266058;
        return[cljs.core.str(nspc__266059), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____266060 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____266060)) {
          var nspc__266061 = temp__3974__auto____266060;
          return[cljs.core.str(nspc__266061), cljs.core.str("/")].join("")
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
  var pr_pair__266062 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__266062, "{", ", ", "}", opts, coll)
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
  var pr_pair__266063 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__266063, "{", ", ", "}", opts, coll)
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
  var this__266064 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__266065 = this;
  var G__266066__266067 = cljs.core.seq.call(null, this__266065.watches);
  if(cljs.core.truth_(G__266066__266067)) {
    var G__266069__266071 = cljs.core.first.call(null, G__266066__266067);
    var vec__266070__266072 = G__266069__266071;
    var key__266073 = cljs.core.nth.call(null, vec__266070__266072, 0, null);
    var f__266074 = cljs.core.nth.call(null, vec__266070__266072, 1, null);
    var G__266066__266075 = G__266066__266067;
    var G__266069__266076 = G__266069__266071;
    var G__266066__266077 = G__266066__266075;
    while(true) {
      var vec__266078__266079 = G__266069__266076;
      var key__266080 = cljs.core.nth.call(null, vec__266078__266079, 0, null);
      var f__266081 = cljs.core.nth.call(null, vec__266078__266079, 1, null);
      var G__266066__266082 = G__266066__266077;
      f__266081.call(null, key__266080, this$, oldval, newval);
      var temp__3974__auto____266083 = cljs.core.next.call(null, G__266066__266082);
      if(cljs.core.truth_(temp__3974__auto____266083)) {
        var G__266066__266084 = temp__3974__auto____266083;
        var G__266091 = cljs.core.first.call(null, G__266066__266084);
        var G__266092 = G__266066__266084;
        G__266069__266076 = G__266091;
        G__266066__266077 = G__266092;
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
  var this__266085 = this;
  return this$.watches = cljs.core.assoc.call(null, this__266085.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__266086 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__266086.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__266087 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__266087.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__266088 = this;
  return this__266088.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__266089 = this;
  return this__266089.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__266090 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__266099__delegate = function(x, p__266093) {
      var map__266094__266095 = p__266093;
      var map__266094__266096 = cljs.core.seq_QMARK_.call(null, map__266094__266095) ? cljs.core.apply.call(null, cljs.core.hash_map, map__266094__266095) : map__266094__266095;
      var validator__266097 = cljs.core.get.call(null, map__266094__266096, "\ufdd0'validator");
      var meta__266098 = cljs.core.get.call(null, map__266094__266096, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__266098, validator__266097, null)
    };
    var G__266099 = function(x, var_args) {
      var p__266093 = null;
      if(goog.isDef(var_args)) {
        p__266093 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__266099__delegate.call(this, x, p__266093)
    };
    G__266099.cljs$lang$maxFixedArity = 1;
    G__266099.cljs$lang$applyTo = function(arglist__266100) {
      var x = cljs.core.first(arglist__266100);
      var p__266093 = cljs.core.rest(arglist__266100);
      return G__266099__delegate.call(this, x, p__266093)
    };
    return G__266099
  }();
  atom = function(x, var_args) {
    var p__266093 = var_args;
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
  var temp__3974__auto____266101 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____266101)) {
    var validate__266102 = temp__3974__auto____266101;
    if(cljs.core.truth_(validate__266102.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 5832))))].join(""));
    }
  }else {
  }
  var old_value__266103 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__266103, new_value);
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
    var G__266104__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__266104 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__266104__delegate.call(this, a, f, x, y, z, more)
    };
    G__266104.cljs$lang$maxFixedArity = 5;
    G__266104.cljs$lang$applyTo = function(arglist__266105) {
      var a = cljs.core.first(arglist__266105);
      var f = cljs.core.first(cljs.core.next(arglist__266105));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__266105)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__266105))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__266105)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__266105)))));
      return G__266104__delegate.call(this, a, f, x, y, z, more)
    };
    return G__266104
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__266106) {
    var iref = cljs.core.first(arglist__266106);
    var f = cljs.core.first(cljs.core.next(arglist__266106));
    var args = cljs.core.rest(cljs.core.next(arglist__266106));
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
  var this__266107 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__266107.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__266108 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__266108.state, function(p__266109) {
    var curr_state__266110 = p__266109;
    var curr_state__266111 = cljs.core.seq_QMARK_.call(null, curr_state__266110) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__266110) : curr_state__266110;
    var done__266112 = cljs.core.get.call(null, curr_state__266111, "\ufdd0'done");
    if(cljs.core.truth_(done__266112)) {
      return curr_state__266111
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__266108.f.call(null)})
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
    var map__266113__266114 = options;
    var map__266113__266115 = cljs.core.seq_QMARK_.call(null, map__266113__266114) ? cljs.core.apply.call(null, cljs.core.hash_map, map__266113__266114) : map__266113__266114;
    var keywordize_keys__266116 = cljs.core.get.call(null, map__266113__266115, "\ufdd0'keywordize-keys");
    var keyfn__266117 = cljs.core.truth_(keywordize_keys__266116) ? cljs.core.keyword : cljs.core.str;
    var f__266123 = function thisfn(x) {
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
                var iter__593__auto____266122 = function iter__266118(s__266119) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__266119__266120 = s__266119;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__266119__266120))) {
                        var k__266121 = cljs.core.first.call(null, s__266119__266120);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__266117.call(null, k__266121), thisfn.call(null, x[k__266121])]), iter__266118.call(null, cljs.core.rest.call(null, s__266119__266120)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__593__auto____266122.call(null, cljs.core.js_keys.call(null, x))
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
    return f__266123.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__266124) {
    var x = cljs.core.first(arglist__266124);
    var options = cljs.core.rest(arglist__266124);
    return js__GT_clj__delegate.call(this, x, options)
  };
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__266125 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__266129__delegate = function(args) {
      var temp__3971__auto____266126 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__266125), args);
      if(cljs.core.truth_(temp__3971__auto____266126)) {
        var v__266127 = temp__3971__auto____266126;
        return v__266127
      }else {
        var ret__266128 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__266125, cljs.core.assoc, args, ret__266128);
        return ret__266128
      }
    };
    var G__266129 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__266129__delegate.call(this, args)
    };
    G__266129.cljs$lang$maxFixedArity = 0;
    G__266129.cljs$lang$applyTo = function(arglist__266130) {
      var args = cljs.core.seq(arglist__266130);
      return G__266129__delegate.call(this, args)
    };
    return G__266129
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__266131 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__266131)) {
        var G__266132 = ret__266131;
        f = G__266132;
        continue
      }else {
        return ret__266131
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__266133__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__266133 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__266133__delegate.call(this, f, args)
    };
    G__266133.cljs$lang$maxFixedArity = 1;
    G__266133.cljs$lang$applyTo = function(arglist__266134) {
      var f = cljs.core.first(arglist__266134);
      var args = cljs.core.rest(arglist__266134);
      return G__266133__delegate.call(this, f, args)
    };
    return G__266133
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
    var k__266135 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__266135, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__266135, cljs.core.PersistentVector.fromArray([])), x))
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
    var or__3824__auto____266136 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____266136) {
      return or__3824__auto____266136
    }else {
      var or__3824__auto____266137 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(or__3824__auto____266137) {
        return or__3824__auto____266137
      }else {
        var and__3822__auto____266138 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____266138) {
          var and__3822__auto____266139 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____266139) {
            var and__3822__auto____266140 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____266140) {
              var ret__266141 = true;
              var i__266142 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____266143 = cljs.core.not.call(null, ret__266141);
                  if(or__3824__auto____266143) {
                    return or__3824__auto____266143
                  }else {
                    return i__266142 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__266141
                }else {
                  var G__266144 = isa_QMARK_.call(null, h, child.call(null, i__266142), parent.call(null, i__266142));
                  var G__266145 = i__266142 + 1;
                  ret__266141 = G__266144;
                  i__266142 = G__266145;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____266140
            }
          }else {
            return and__3822__auto____266139
          }
        }else {
          return and__3822__auto____266138
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
    var tp__266149 = "\ufdd0'parents".call(null, h);
    var td__266150 = "\ufdd0'descendants".call(null, h);
    var ta__266151 = "\ufdd0'ancestors".call(null, h);
    var tf__266152 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____266153 = cljs.core.contains_QMARK_.call(null, tp__266149.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__266151.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__266151.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__266149, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__266152.call(null, "\ufdd0'ancestors".call(null, h), tag, td__266150, parent, ta__266151), "\ufdd0'descendants":tf__266152.call(null, "\ufdd0'descendants".call(null, h), parent, ta__266151, tag, td__266150)})
    }();
    if(cljs.core.truth_(or__3824__auto____266153)) {
      return or__3824__auto____266153
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
    var parentMap__266154 = "\ufdd0'parents".call(null, h);
    var childsParents__266155 = cljs.core.truth_(parentMap__266154.call(null, tag)) ? cljs.core.disj.call(null, parentMap__266154.call(null, tag), parent) : cljs.core.set([]);
    var newParents__266156 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__266155)) ? cljs.core.assoc.call(null, parentMap__266154, tag, childsParents__266155) : cljs.core.dissoc.call(null, parentMap__266154, tag);
    var deriv_seq__266157 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__266146_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__266146_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__266146_SHARP_), cljs.core.second.call(null, p1__266146_SHARP_)))
    }, cljs.core.seq.call(null, newParents__266156)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__266154.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__266147_SHARP_, p2__266148_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__266147_SHARP_, p2__266148_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__266157))
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
  var xprefs__266158 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____266160 = cljs.core.truth_(function() {
    var and__3822__auto____266159 = xprefs__266158;
    if(cljs.core.truth_(and__3822__auto____266159)) {
      return xprefs__266158.call(null, y)
    }else {
      return and__3822__auto____266159
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____266160)) {
    return or__3824__auto____266160
  }else {
    var or__3824__auto____266162 = function() {
      var ps__266161 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__266161) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__266161), prefer_table))) {
          }else {
          }
          var G__266165 = cljs.core.rest.call(null, ps__266161);
          ps__266161 = G__266165;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____266162)) {
      return or__3824__auto____266162
    }else {
      var or__3824__auto____266164 = function() {
        var ps__266163 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__266163) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__266163), y, prefer_table))) {
            }else {
            }
            var G__266166 = cljs.core.rest.call(null, ps__266163);
            ps__266163 = G__266166;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____266164)) {
        return or__3824__auto____266164
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____266167 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____266167)) {
    return or__3824__auto____266167
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__266176 = cljs.core.reduce.call(null, function(be, p__266168) {
    var vec__266169__266170 = p__266168;
    var k__266171 = cljs.core.nth.call(null, vec__266169__266170, 0, null);
    var ___266172 = cljs.core.nth.call(null, vec__266169__266170, 1, null);
    var e__266173 = vec__266169__266170;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__266171)) {
      var be2__266175 = cljs.core.truth_(function() {
        var or__3824__auto____266174 = be == null;
        if(or__3824__auto____266174) {
          return or__3824__auto____266174
        }else {
          return cljs.core.dominates.call(null, k__266171, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__266173 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__266175), k__266171, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__266171), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__266175)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__266175
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__266176)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__266176));
      return cljs.core.second.call(null, best_entry__266176)
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
    var and__3822__auto____266177 = mf;
    if(and__3822__auto____266177) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____266177
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____266178 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(or__3824__auto____266178) {
        return or__3824__auto____266178
      }else {
        var or__3824__auto____266179 = cljs.core._reset["_"];
        if(or__3824__auto____266179) {
          return or__3824__auto____266179
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____266180 = mf;
    if(and__3822__auto____266180) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____266180
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3824__auto____266181 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____266181) {
        return or__3824__auto____266181
      }else {
        var or__3824__auto____266182 = cljs.core._add_method["_"];
        if(or__3824__auto____266182) {
          return or__3824__auto____266182
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____266183 = mf;
    if(and__3822__auto____266183) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____266183
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____266184 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____266184) {
        return or__3824__auto____266184
      }else {
        var or__3824__auto____266185 = cljs.core._remove_method["_"];
        if(or__3824__auto____266185) {
          return or__3824__auto____266185
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____266186 = mf;
    if(and__3822__auto____266186) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____266186
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3824__auto____266187 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____266187) {
        return or__3824__auto____266187
      }else {
        var or__3824__auto____266188 = cljs.core._prefer_method["_"];
        if(or__3824__auto____266188) {
          return or__3824__auto____266188
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____266189 = mf;
    if(and__3822__auto____266189) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____266189
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____266190 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____266190) {
        return or__3824__auto____266190
      }else {
        var or__3824__auto____266191 = cljs.core._get_method["_"];
        if(or__3824__auto____266191) {
          return or__3824__auto____266191
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____266192 = mf;
    if(and__3822__auto____266192) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____266192
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____266193 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(or__3824__auto____266193) {
        return or__3824__auto____266193
      }else {
        var or__3824__auto____266194 = cljs.core._methods["_"];
        if(or__3824__auto____266194) {
          return or__3824__auto____266194
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____266195 = mf;
    if(and__3822__auto____266195) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____266195
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____266196 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(or__3824__auto____266196) {
        return or__3824__auto____266196
      }else {
        var or__3824__auto____266197 = cljs.core._prefers["_"];
        if(or__3824__auto____266197) {
          return or__3824__auto____266197
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____266198 = mf;
    if(and__3822__auto____266198) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____266198
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3824__auto____266199 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(or__3824__auto____266199) {
        return or__3824__auto____266199
      }else {
        var or__3824__auto____266200 = cljs.core._dispatch["_"];
        if(or__3824__auto____266200) {
          return or__3824__auto____266200
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__266201 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__266202 = cljs.core._get_method.call(null, mf, dispatch_val__266201);
  if(cljs.core.truth_(target_fn__266202)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__266201)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__266202, args)
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
  var this__266203 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__266204 = this;
  cljs.core.swap_BANG_.call(null, this__266204.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__266204.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__266204.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__266204.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__266205 = this;
  cljs.core.swap_BANG_.call(null, this__266205.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__266205.method_cache, this__266205.method_table, this__266205.cached_hierarchy, this__266205.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__266206 = this;
  cljs.core.swap_BANG_.call(null, this__266206.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__266206.method_cache, this__266206.method_table, this__266206.cached_hierarchy, this__266206.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__266207 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__266207.cached_hierarchy), cljs.core.deref.call(null, this__266207.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__266207.method_cache, this__266207.method_table, this__266207.cached_hierarchy, this__266207.hierarchy)
  }
  var temp__3971__auto____266208 = cljs.core.deref.call(null, this__266207.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____266208)) {
    var target_fn__266209 = temp__3971__auto____266208;
    return target_fn__266209
  }else {
    var temp__3971__auto____266210 = cljs.core.find_and_cache_best_method.call(null, this__266207.name, dispatch_val, this__266207.hierarchy, this__266207.method_table, this__266207.prefer_table, this__266207.method_cache, this__266207.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____266210)) {
      var target_fn__266211 = temp__3971__auto____266210;
      return target_fn__266211
    }else {
      return cljs.core.deref.call(null, this__266207.method_table).call(null, this__266207.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__266212 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__266212.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__266212.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__266212.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__266212.method_cache, this__266212.method_table, this__266212.cached_hierarchy, this__266212.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__266213 = this;
  return cljs.core.deref.call(null, this__266213.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__266214 = this;
  return cljs.core.deref.call(null, this__266214.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__266215 = this;
  return cljs.core.do_dispatch.call(null, mf, this__266215.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__266216__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__266216 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__266216__delegate.call(this, _, args)
  };
  G__266216.cljs$lang$maxFixedArity = 1;
  G__266216.cljs$lang$applyTo = function(arglist__266217) {
    var _ = cljs.core.first(arglist__266217);
    var args = cljs.core.rest(arglist__266217);
    return G__266216__delegate.call(this, _, args)
  };
  return G__266216
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
      var s__266218 = s;
      var limit__266219 = limit;
      var parts__266220 = cljs.core.PersistentVector.fromArray([]);
      while(true) {
        if(cljs.core._EQ_.call(null, limit__266219, 1)) {
          return cljs.core.conj.call(null, parts__266220, s__266218)
        }else {
          var temp__3971__auto____266221 = cljs.core.re_find.call(null, re, s__266218);
          if(cljs.core.truth_(temp__3971__auto____266221)) {
            var m__266222 = temp__3971__auto____266221;
            var index__266223 = s__266218.indexOf(m__266222);
            var G__266224 = s__266218.substring(index__266223 + cljs.core.count.call(null, m__266222));
            var G__266225 = limit__266219 - 1;
            var G__266226 = cljs.core.conj.call(null, parts__266220, s__266218.substring(0, index__266223));
            s__266218 = G__266224;
            limit__266219 = G__266225;
            parts__266220 = G__266226;
            continue
          }else {
            return cljs.core.conj.call(null, parts__266220, s__266218)
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
  var index__266227 = s.length;
  while(true) {
    if(index__266227 === 0) {
      return""
    }else {
      var ch__266228 = cljs.core.get.call(null, s, index__266227 - 1);
      if(function() {
        var or__3824__auto____266229 = cljs.core._EQ_.call(null, ch__266228, "\n");
        if(or__3824__auto____266229) {
          return or__3824__auto____266229
        }else {
          return cljs.core._EQ_.call(null, ch__266228, "\r")
        }
      }()) {
        var G__266230 = index__266227 - 1;
        index__266227 = G__266230;
        continue
      }else {
        return s.substring(0, index__266227)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__266231 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____266232 = cljs.core.not.call(null, s__266231);
    if(or__3824__auto____266232) {
      return or__3824__auto____266232
    }else {
      var or__3824__auto____266233 = cljs.core._EQ_.call(null, "", s__266231);
      if(or__3824__auto____266233) {
        return or__3824__auto____266233
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__266231)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__266234 = new goog.string.StringBuffer;
  var length__266235 = s.length;
  var index__266236 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__266235, index__266236)) {
      return buffer__266234.toString()
    }else {
      var ch__266237 = s.charAt(index__266236);
      var temp__3971__auto____266238 = cljs.core.get.call(null, cmap, ch__266237);
      if(cljs.core.truth_(temp__3971__auto____266238)) {
        var replacement__266239 = temp__3971__auto____266238;
        buffer__266234.append([cljs.core.str(replacement__266239)].join(""))
      }else {
        buffer__266234.append(ch__266237)
      }
      var G__266240 = index__266236 + 1;
      index__266236 = G__266240;
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
        var G__266241__266242 = cljs.core.seq.call(null, attrs);
        if(cljs.core.truth_(G__266241__266242)) {
          var G__266244__266246 = cljs.core.first.call(null, G__266241__266242);
          var vec__266245__266247 = G__266244__266246;
          var k__266248 = cljs.core.nth.call(null, vec__266245__266247, 0, null);
          var v__266249 = cljs.core.nth.call(null, vec__266245__266247, 1, null);
          var G__266241__266250 = G__266241__266242;
          var G__266244__266251 = G__266244__266246;
          var G__266241__266252 = G__266241__266250;
          while(true) {
            var vec__266253__266254 = G__266244__266251;
            var k__266255 = cljs.core.nth.call(null, vec__266253__266254, 0, null);
            var v__266256 = cljs.core.nth.call(null, vec__266253__266254, 1, null);
            var G__266241__266257 = G__266241__266252;
            dom_attr.call(null, elem, k__266255, v__266256);
            var temp__3974__auto____266258 = cljs.core.next.call(null, G__266241__266257);
            if(cljs.core.truth_(temp__3974__auto____266258)) {
              var G__266241__266259 = temp__3974__auto____266258;
              var G__266260 = cljs.core.first.call(null, G__266241__266259);
              var G__266261 = G__266241__266259;
              G__266244__266251 = G__266260;
              G__266241__266252 = G__266261;
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
  var G__266262__266263 = cljs.core.seq.call(null, content);
  if(cljs.core.truth_(G__266262__266263)) {
    var c__266264 = cljs.core.first.call(null, G__266262__266263);
    var G__266262__266265 = G__266262__266263;
    while(true) {
      var child__266266 = c__266264 == null ? null : cljs.core.map_QMARK_.call(null, c__266264) ? function() {
        throw"Maps cannot be used as content";
      }() : cljs.core.string_QMARK_.call(null, c__266264) ? goog.dom.createTextNode.call(null, c__266264) : cljs.core.vector_QMARK_.call(null, c__266264) ? crate.core.elem_factory.call(null, c__266264) : cljs.core.seq_QMARK_.call(null, c__266264) ? as_content.call(null, parent, c__266264) : cljs.core.truth_(c__266264.nodeName) ? c__266264 : null;
      if(cljs.core.truth_(child__266266)) {
        goog.dom.appendChild.call(null, parent, child__266266)
      }else {
      }
      var temp__3974__auto____266267 = cljs.core.next.call(null, G__266262__266265);
      if(cljs.core.truth_(temp__3974__auto____266267)) {
        var G__266262__266268 = temp__3974__auto____266267;
        var G__266269 = cljs.core.first.call(null, G__266262__266268);
        var G__266270 = G__266262__266268;
        c__266264 = G__266269;
        G__266262__266265 = G__266270;
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
crate.core.normalize_element = function normalize_element(p__266272) {
  var vec__266273__266274 = p__266272;
  var tag__266275 = cljs.core.nth.call(null, vec__266273__266274, 0, null);
  var content__266276 = cljs.core.nthnext.call(null, vec__266273__266274, 1);
  if(cljs.core.not.call(null, function() {
    var or__3824__auto____266277 = cljs.core.keyword_QMARK_.call(null, tag__266275);
    if(or__3824__auto____266277) {
      return or__3824__auto____266277
    }else {
      var or__3824__auto____266278 = cljs.core.symbol_QMARK_.call(null, tag__266275);
      if(or__3824__auto____266278) {
        return or__3824__auto____266278
      }else {
        return cljs.core.string_QMARK_.call(null, tag__266275)
      }
    }
  }())) {
    throw[cljs.core.str(tag__266275), cljs.core.str(" is not a valid tag name.")].join("");
  }else {
  }
  var vec__266279__266281 = cljs.core.re_matches.call(null, crate.core.re_tag, cljs.core.name.call(null, tag__266275));
  var ___266282 = cljs.core.nth.call(null, vec__266279__266281, 0, null);
  var tag__266283 = cljs.core.nth.call(null, vec__266279__266281, 1, null);
  var id__266284 = cljs.core.nth.call(null, vec__266279__266281, 2, null);
  var class$__266285 = cljs.core.nth.call(null, vec__266279__266281, 3, null);
  var vec__266280__266292 = function() {
    var vec__266286__266287 = clojure.string.split.call(null, tag__266283, /:/);
    var nsp__266288 = cljs.core.nth.call(null, vec__266286__266287, 0, null);
    var t__266289 = cljs.core.nth.call(null, vec__266286__266287, 1, null);
    var ns_xmlns__266290 = crate.core.xmlns.call(null, cljs.core.keyword.call(null, nsp__266288));
    if(cljs.core.truth_(t__266289)) {
      return cljs.core.PersistentVector.fromArray([function() {
        var or__3824__auto____266291 = ns_xmlns__266290;
        if(cljs.core.truth_(or__3824__auto____266291)) {
          return or__3824__auto____266291
        }else {
          return nsp__266288
        }
      }(), t__266289])
    }else {
      return cljs.core.PersistentVector.fromArray(["\ufdd0'xhtml".call(null, crate.core.xmlns), nsp__266288])
    }
  }();
  var nsp__266293 = cljs.core.nth.call(null, vec__266280__266292, 0, null);
  var tag__266294 = cljs.core.nth.call(null, vec__266280__266292, 1, null);
  var tag_attrs__266296 = cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), cljs.core.filter.call(null, function(p1__266271_SHARP_) {
    return cljs.core.not.call(null, cljs.core.second.call(null, p1__266271_SHARP_) == null)
  }, cljs.core.ObjMap.fromObject(["\ufdd0'id", "\ufdd0'class"], {"\ufdd0'id":function() {
    var or__3824__auto____266295 = id__266284;
    if(cljs.core.truth_(or__3824__auto____266295)) {
      return or__3824__auto____266295
    }else {
      return null
    }
  }(), "\ufdd0'class":cljs.core.truth_(class$__266285) ? clojure.string.replace.call(null, class$__266285, /\./, " ") : null})));
  var map_attrs__266297 = cljs.core.first.call(null, content__266276);
  if(cljs.core.map_QMARK_.call(null, map_attrs__266297)) {
    return cljs.core.PersistentVector.fromArray([nsp__266293, tag__266294, cljs.core.merge.call(null, tag_attrs__266296, map_attrs__266297), cljs.core.next.call(null, content__266276)])
  }else {
    return cljs.core.PersistentVector.fromArray([nsp__266293, tag__266294, tag_attrs__266296, content__266276])
  }
};
crate.core.parse_content = function parse_content(elem, content) {
  var attrs__266298 = cljs.core.first.call(null, content);
  if(cljs.core.map_QMARK_.call(null, attrs__266298)) {
    crate.core.dom_attr.call(null, elem, attrs__266298);
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
  var vec__266299__266300 = crate.core.normalize_element.call(null, tag_def);
  var nsp__266301 = cljs.core.nth.call(null, vec__266299__266300, 0, null);
  var tag__266302 = cljs.core.nth.call(null, vec__266299__266300, 1, null);
  var attrs__266303 = cljs.core.nth.call(null, vec__266299__266300, 2, null);
  var content__266304 = cljs.core.nth.call(null, vec__266299__266300, 3, null);
  var elem__266305 = crate.core.create_elem.call(null, nsp__266301, tag__266302);
  crate.core.dom_attr.call(null, elem__266305, attrs__266303);
  crate.core.as_content.call(null, elem__266305, content__266304);
  return elem__266305
};
crate.core.html = function() {
  var html__delegate = function(tags) {
    var res__266306 = cljs.core.map.call(null, crate.core.elem_factory, tags);
    if(cljs.core.truth_(cljs.core.second.call(null, res__266306))) {
      return res__266306
    }else {
      return cljs.core.first.call(null, res__266306)
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
  html.cljs$lang$applyTo = function(arglist__266307) {
    var tags = cljs.core.seq(arglist__266307);
    return html__delegate.call(this, tags)
  };
  return html
}();
goog.provide("jayq.util");
goog.require("cljs.core");
jayq.util.map__GT_js = function map__GT_js(m) {
  var out__266404 = {};
  var G__266405__266406 = cljs.core.seq.call(null, m);
  if(cljs.core.truth_(G__266405__266406)) {
    var G__266408__266410 = cljs.core.first.call(null, G__266405__266406);
    var vec__266409__266411 = G__266408__266410;
    var k__266412 = cljs.core.nth.call(null, vec__266409__266411, 0, null);
    var v__266413 = cljs.core.nth.call(null, vec__266409__266411, 1, null);
    var G__266405__266414 = G__266405__266406;
    var G__266408__266415 = G__266408__266410;
    var G__266405__266416 = G__266405__266414;
    while(true) {
      var vec__266417__266418 = G__266408__266415;
      var k__266419 = cljs.core.nth.call(null, vec__266417__266418, 0, null);
      var v__266420 = cljs.core.nth.call(null, vec__266417__266418, 1, null);
      var G__266405__266421 = G__266405__266416;
      out__266404[cljs.core.name.call(null, k__266419)] = v__266420;
      var temp__3974__auto____266422 = cljs.core.next.call(null, G__266405__266421);
      if(cljs.core.truth_(temp__3974__auto____266422)) {
        var G__266405__266423 = temp__3974__auto____266422;
        var G__266424 = cljs.core.first.call(null, G__266405__266423);
        var G__266425 = G__266405__266423;
        G__266408__266415 = G__266424;
        G__266405__266416 = G__266425;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return out__266404
};
jayq.util.wait = function wait(ms, func) {
  return setTimeout(func, ms)
};
jayq.util.log = function() {
  var log__delegate = function(v, text) {
    var vs__266426 = cljs.core.string_QMARK_.call(null, v) ? cljs.core.apply.call(null, cljs.core.str, v, text) : v;
    return console.log(vs__266426)
  };
  var log = function(v, var_args) {
    var text = null;
    if(goog.isDef(var_args)) {
      text = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return log__delegate.call(this, v, text)
  };
  log.cljs$lang$maxFixedArity = 1;
  log.cljs$lang$applyTo = function(arglist__266427) {
    var v = cljs.core.first(arglist__266427);
    var text = cljs.core.rest(arglist__266427);
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
        return cljs.core.reduce.call(null, function(m, p__266428) {
          var vec__266429__266430 = p__266428;
          var k__266431 = cljs.core.nth.call(null, vec__266429__266430, 0, null);
          var v__266432 = cljs.core.nth.call(null, vec__266429__266430, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__266431), clj__GT_js.call(null, v__266432))
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
      var temp__3971__auto____266308 = jayq.core.crate_meta.call(null, sel);
      if(cljs.core.truth_(temp__3971__auto____266308)) {
        var cm__266309 = temp__3971__auto____266308;
        return[cljs.core.str("[crateGroup="), cljs.core.str(cm__266309), cljs.core.str("]")].join("")
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
  var $__delegate = function(sel, p__266310) {
    var vec__266311__266312 = p__266310;
    var context__266313 = cljs.core.nth.call(null, vec__266311__266312, 0, null);
    if(cljs.core.not.call(null, context__266313)) {
      return jQuery(jayq.core.__GT_selector.call(null, sel))
    }else {
      return jQuery(jayq.core.__GT_selector.call(null, sel), context__266313)
    }
  };
  var $ = function(sel, var_args) {
    var p__266310 = null;
    if(goog.isDef(var_args)) {
      p__266310 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return $__delegate.call(this, sel, p__266310)
  };
  $.cljs$lang$maxFixedArity = 1;
  $.cljs$lang$applyTo = function(arglist__266314) {
    var sel = cljs.core.first(arglist__266314);
    var p__266310 = cljs.core.rest(arglist__266314);
    return $__delegate.call(this, sel, p__266310)
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
  var or__3824__auto____266315 = this$.slice(k, k + 1);
  if(cljs.core.truth_(or__3824__auto____266315)) {
    return or__3824__auto____266315
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
  var G__266316 = null;
  var G__266316__2 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__266316__3 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__266316 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__266316__2.call(this, _, k);
      case 3:
        return G__266316__3.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__266316
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
  var attr__delegate = function($elem, a, p__266317) {
    var vec__266318__266319 = p__266317;
    var v__266320 = cljs.core.nth.call(null, vec__266318__266319, 0, null);
    var a__266321 = cljs.core.name.call(null, a);
    if(cljs.core.not.call(null, v__266320)) {
      return $elem.attr(a__266321)
    }else {
      return $elem.attr(a__266321, v__266320)
    }
  };
  var attr = function($elem, a, var_args) {
    var p__266317 = null;
    if(goog.isDef(var_args)) {
      p__266317 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return attr__delegate.call(this, $elem, a, p__266317)
  };
  attr.cljs$lang$maxFixedArity = 2;
  attr.cljs$lang$applyTo = function(arglist__266322) {
    var $elem = cljs.core.first(arglist__266322);
    var a = cljs.core.first(cljs.core.next(arglist__266322));
    var p__266317 = cljs.core.rest(cljs.core.next(arglist__266322));
    return attr__delegate.call(this, $elem, a, p__266317)
  };
  return attr
}();
jayq.core.data = function() {
  var data__delegate = function($elem, k, p__266323) {
    var vec__266324__266325 = p__266323;
    var v__266326 = cljs.core.nth.call(null, vec__266324__266325, 0, null);
    var k__266327 = cljs.core.name.call(null, k);
    if(cljs.core.not.call(null, v__266326)) {
      return $elem.data(k__266327)
    }else {
      return $elem.data(k__266327, v__266326)
    }
  };
  var data = function($elem, k, var_args) {
    var p__266323 = null;
    if(goog.isDef(var_args)) {
      p__266323 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return data__delegate.call(this, $elem, k, p__266323)
  };
  data.cljs$lang$maxFixedArity = 2;
  data.cljs$lang$applyTo = function(arglist__266328) {
    var $elem = cljs.core.first(arglist__266328);
    var k = cljs.core.first(cljs.core.next(arglist__266328));
    var p__266323 = cljs.core.rest(cljs.core.next(arglist__266328));
    return data__delegate.call(this, $elem, k, p__266323)
  };
  return data
}();
jayq.core.position = function position($elem) {
  return cljs.core.js__GT_clj.call(null, $elem.position(), "\ufdd0'keywordize-keys", true)
};
jayq.core.add_class = function add_class($elem, cl) {
  var cl__266329 = cljs.core.name.call(null, cl);
  return $elem.addClass(cl__266329)
};
jayq.core.remove_class = function remove_class($elem, cl) {
  var cl__266330 = cljs.core.name.call(null, cl);
  return $elem.removeClass(cl__266330)
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
  var hide__delegate = function($elem, p__266331) {
    var vec__266332__266333 = p__266331;
    var speed__266334 = cljs.core.nth.call(null, vec__266332__266333, 0, null);
    var on_finish__266335 = cljs.core.nth.call(null, vec__266332__266333, 1, null);
    return $elem.hide(speed__266334, on_finish__266335)
  };
  var hide = function($elem, var_args) {
    var p__266331 = null;
    if(goog.isDef(var_args)) {
      p__266331 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return hide__delegate.call(this, $elem, p__266331)
  };
  hide.cljs$lang$maxFixedArity = 1;
  hide.cljs$lang$applyTo = function(arglist__266336) {
    var $elem = cljs.core.first(arglist__266336);
    var p__266331 = cljs.core.rest(arglist__266336);
    return hide__delegate.call(this, $elem, p__266331)
  };
  return hide
}();
jayq.core.show = function() {
  var show__delegate = function($elem, p__266337) {
    var vec__266338__266339 = p__266337;
    var speed__266340 = cljs.core.nth.call(null, vec__266338__266339, 0, null);
    var on_finish__266341 = cljs.core.nth.call(null, vec__266338__266339, 1, null);
    return $elem.show(speed__266340, on_finish__266341)
  };
  var show = function($elem, var_args) {
    var p__266337 = null;
    if(goog.isDef(var_args)) {
      p__266337 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return show__delegate.call(this, $elem, p__266337)
  };
  show.cljs$lang$maxFixedArity = 1;
  show.cljs$lang$applyTo = function(arglist__266342) {
    var $elem = cljs.core.first(arglist__266342);
    var p__266337 = cljs.core.rest(arglist__266342);
    return show__delegate.call(this, $elem, p__266337)
  };
  return show
}();
jayq.core.toggle = function() {
  var toggle__delegate = function($elem, p__266343) {
    var vec__266344__266345 = p__266343;
    var speed__266346 = cljs.core.nth.call(null, vec__266344__266345, 0, null);
    var on_finish__266347 = cljs.core.nth.call(null, vec__266344__266345, 1, null);
    return $elem.toggle(speed__266346, on_finish__266347)
  };
  var toggle = function($elem, var_args) {
    var p__266343 = null;
    if(goog.isDef(var_args)) {
      p__266343 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return toggle__delegate.call(this, $elem, p__266343)
  };
  toggle.cljs$lang$maxFixedArity = 1;
  toggle.cljs$lang$applyTo = function(arglist__266348) {
    var $elem = cljs.core.first(arglist__266348);
    var p__266343 = cljs.core.rest(arglist__266348);
    return toggle__delegate.call(this, $elem, p__266343)
  };
  return toggle
}();
jayq.core.fade_out = function() {
  var fade_out__delegate = function($elem, p__266349) {
    var vec__266350__266351 = p__266349;
    var speed__266352 = cljs.core.nth.call(null, vec__266350__266351, 0, null);
    var on_finish__266353 = cljs.core.nth.call(null, vec__266350__266351, 1, null);
    return $elem.fadeOut(speed__266352, on_finish__266353)
  };
  var fade_out = function($elem, var_args) {
    var p__266349 = null;
    if(goog.isDef(var_args)) {
      p__266349 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_out__delegate.call(this, $elem, p__266349)
  };
  fade_out.cljs$lang$maxFixedArity = 1;
  fade_out.cljs$lang$applyTo = function(arglist__266354) {
    var $elem = cljs.core.first(arglist__266354);
    var p__266349 = cljs.core.rest(arglist__266354);
    return fade_out__delegate.call(this, $elem, p__266349)
  };
  return fade_out
}();
jayq.core.fade_in = function() {
  var fade_in__delegate = function($elem, p__266355) {
    var vec__266356__266357 = p__266355;
    var speed__266358 = cljs.core.nth.call(null, vec__266356__266357, 0, null);
    var on_finish__266359 = cljs.core.nth.call(null, vec__266356__266357, 1, null);
    return $elem.fadeIn(speed__266358, on_finish__266359)
  };
  var fade_in = function($elem, var_args) {
    var p__266355 = null;
    if(goog.isDef(var_args)) {
      p__266355 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_in__delegate.call(this, $elem, p__266355)
  };
  fade_in.cljs$lang$maxFixedArity = 1;
  fade_in.cljs$lang$applyTo = function(arglist__266360) {
    var $elem = cljs.core.first(arglist__266360);
    var p__266355 = cljs.core.rest(arglist__266360);
    return fade_in__delegate.call(this, $elem, p__266355)
  };
  return fade_in
}();
jayq.core.slide_up = function() {
  var slide_up__delegate = function($elem, p__266361) {
    var vec__266362__266363 = p__266361;
    var speed__266364 = cljs.core.nth.call(null, vec__266362__266363, 0, null);
    var on_finish__266365 = cljs.core.nth.call(null, vec__266362__266363, 1, null);
    return $elem.slideUp(speed__266364, on_finish__266365)
  };
  var slide_up = function($elem, var_args) {
    var p__266361 = null;
    if(goog.isDef(var_args)) {
      p__266361 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_up__delegate.call(this, $elem, p__266361)
  };
  slide_up.cljs$lang$maxFixedArity = 1;
  slide_up.cljs$lang$applyTo = function(arglist__266366) {
    var $elem = cljs.core.first(arglist__266366);
    var p__266361 = cljs.core.rest(arglist__266366);
    return slide_up__delegate.call(this, $elem, p__266361)
  };
  return slide_up
}();
jayq.core.slide_down = function() {
  var slide_down__delegate = function($elem, p__266367) {
    var vec__266368__266369 = p__266367;
    var speed__266370 = cljs.core.nth.call(null, vec__266368__266369, 0, null);
    var on_finish__266371 = cljs.core.nth.call(null, vec__266368__266369, 1, null);
    return $elem.slideDown(speed__266370, on_finish__266371)
  };
  var slide_down = function($elem, var_args) {
    var p__266367 = null;
    if(goog.isDef(var_args)) {
      p__266367 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_down__delegate.call(this, $elem, p__266367)
  };
  slide_down.cljs$lang$maxFixedArity = 1;
  slide_down.cljs$lang$applyTo = function(arglist__266372) {
    var $elem = cljs.core.first(arglist__266372);
    var p__266367 = cljs.core.rest(arglist__266372);
    return slide_down__delegate.call(this, $elem, p__266367)
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
  var val__delegate = function($elem, p__266373) {
    var vec__266374__266375 = p__266373;
    var v__266376 = cljs.core.nth.call(null, vec__266374__266375, 0, null);
    if(cljs.core.truth_(v__266376)) {
      return $elem.val(v__266376)
    }else {
      return $elem.val()
    }
  };
  var val = function($elem, var_args) {
    var p__266373 = null;
    if(goog.isDef(var_args)) {
      p__266373 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return val__delegate.call(this, $elem, p__266373)
  };
  val.cljs$lang$maxFixedArity = 1;
  val.cljs$lang$applyTo = function(arglist__266377) {
    var $elem = cljs.core.first(arglist__266377);
    var p__266373 = cljs.core.rest(arglist__266377);
    return val__delegate.call(this, $elem, p__266373)
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
jayq.core.xhr = function xhr(p__266378, content, callback) {
  var vec__266379__266380 = p__266378;
  var method__266381 = cljs.core.nth.call(null, vec__266379__266380, 0, null);
  var uri__266382 = cljs.core.nth.call(null, vec__266379__266380, 1, null);
  var params__266383 = jayq.util.clj__GT_js.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'type", "\ufdd0'data", "\ufdd0'success"], {"\ufdd0'type":clojure.string.upper_case.call(null, cljs.core.name.call(null, method__266381)), "\ufdd0'data":jayq.util.clj__GT_js.call(null, content), "\ufdd0'success":callback}));
  return jQuery.ajax(uri__266382, params__266383)
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
  var on__delegate = function($elem, events, p__266384) {
    var vec__266385__266386 = p__266384;
    var sel__266387 = cljs.core.nth.call(null, vec__266385__266386, 0, null);
    var data__266388 = cljs.core.nth.call(null, vec__266385__266386, 1, null);
    var handler__266389 = cljs.core.nth.call(null, vec__266385__266386, 2, null);
    return $elem.on(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__266387), data__266388, handler__266389)
  };
  var on = function($elem, events, var_args) {
    var p__266384 = null;
    if(goog.isDef(var_args)) {
      p__266384 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return on__delegate.call(this, $elem, events, p__266384)
  };
  on.cljs$lang$maxFixedArity = 2;
  on.cljs$lang$applyTo = function(arglist__266390) {
    var $elem = cljs.core.first(arglist__266390);
    var events = cljs.core.first(cljs.core.next(arglist__266390));
    var p__266384 = cljs.core.rest(cljs.core.next(arglist__266390));
    return on__delegate.call(this, $elem, events, p__266384)
  };
  return on
}();
jayq.core.one = function() {
  var one__delegate = function($elem, events, p__266391) {
    var vec__266392__266393 = p__266391;
    var sel__266394 = cljs.core.nth.call(null, vec__266392__266393, 0, null);
    var data__266395 = cljs.core.nth.call(null, vec__266392__266393, 1, null);
    var handler__266396 = cljs.core.nth.call(null, vec__266392__266393, 2, null);
    return $elem.one(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__266394), data__266395, handler__266396)
  };
  var one = function($elem, events, var_args) {
    var p__266391 = null;
    if(goog.isDef(var_args)) {
      p__266391 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return one__delegate.call(this, $elem, events, p__266391)
  };
  one.cljs$lang$maxFixedArity = 2;
  one.cljs$lang$applyTo = function(arglist__266397) {
    var $elem = cljs.core.first(arglist__266397);
    var events = cljs.core.first(cljs.core.next(arglist__266397));
    var p__266391 = cljs.core.rest(cljs.core.next(arglist__266397));
    return one__delegate.call(this, $elem, events, p__266391)
  };
  return one
}();
jayq.core.off = function() {
  var off__delegate = function($elem, events, p__266398) {
    var vec__266399__266400 = p__266398;
    var sel__266401 = cljs.core.nth.call(null, vec__266399__266400, 0, null);
    var handler__266402 = cljs.core.nth.call(null, vec__266399__266400, 1, null);
    return $elem.off(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__266401), handler__266402)
  };
  var off = function($elem, events, var_args) {
    var p__266398 = null;
    if(goog.isDef(var_args)) {
      p__266398 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return off__delegate.call(this, $elem, events, p__266398)
  };
  off.cljs$lang$maxFixedArity = 2;
  off.cljs$lang$applyTo = function(arglist__266403) {
    var $elem = cljs.core.first(arglist__266403);
    var events = cljs.core.first(cljs.core.next(arglist__266403));
    var p__266398 = cljs.core.rest(cljs.core.next(arglist__266403));
    return off__delegate.call(this, $elem, events, p__266398)
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
grid.core.debug_QMARK_ = true;
grid.core.dirs = cljs.core.ObjMap.fromObject(["\ufdd0'user/right", "\ufdd0'user/left", "\ufdd0'user/down", "\ufdd0'user/up"], {"\ufdd0'user/right":cljs.core.PersistentVector.fromArray([1, 0]), "\ufdd0'user/left":cljs.core.PersistentVector.fromArray([-1, 0]), "\ufdd0'user/down":cljs.core.PersistentVector.fromArray([0, 1]), "\ufdd0'user/up":cljs.core.PersistentVector.fromArray([0, -1])});
grid.core.comps = cljs.core.ObjMap.fromObject(["\ufdd0'user/lt", "\ufdd0'user/gt", "\ufdd0'user/eq"], {"\ufdd0'user/lt":cljs.core._LT_, "\ufdd0'user/gt":cljs.core._GT_, "\ufdd0'user/eq":cljs.core._EQ_});
grid.core.ariths = cljs.core.ObjMap.fromObject(["\ufdd0'user/add", "\ufdd0'user/sub", "\ufdd0'user/mul", "\ufdd0'user/mod", "\ufdd0'user/quo"], {"\ufdd0'user/add":cljs.core._PLUS_, "\ufdd0'user/sub":cljs.core._, "\ufdd0'user/mul":cljs.core._STAR_, "\ufdd0'user/mod":cljs.core.mod, "\ufdd0'user/quo":cljs.core.quot});
grid.core.refls = cljs.core.ObjMap.fromObject(["\ufdd0'user/diag-pri", "\ufdd0'user/diag-sec", "\ufdd0'user/vertical", "\ufdd0'user/horizontal", "\ufdd0'user/bounce"], {"\ufdd0'user/diag-pri":function refls(p__263817) {
  var vec__263818__263819 = p__263817;
  var dx__263820 = cljs.core.nth.call(null, vec__263818__263819, 0, null);
  var dy__263821 = cljs.core.nth.call(null, vec__263818__263819, 1, null);
  return cljs.core.PersistentVector.fromArray([dy__263821, dx__263820])
}, "\ufdd0'user/diag-sec":function refls(p__263822) {
  var vec__263823__263824 = p__263822;
  var dx__263825 = cljs.core.nth.call(null, vec__263823__263824, 0, null);
  var dy__263826 = cljs.core.nth.call(null, vec__263823__263824, 1, null);
  return cljs.core.PersistentVector.fromArray([-dy__263826, -dx__263825])
}, "\ufdd0'user/vertical":function refls(p__263827) {
  var vec__263828__263829 = p__263827;
  var dx__263830 = cljs.core.nth.call(null, vec__263828__263829, 0, null);
  var dy__263831 = cljs.core.nth.call(null, vec__263828__263829, 1, null);
  return cljs.core.PersistentVector.fromArray([-dx__263830, dy__263831])
}, "\ufdd0'user/horizontal":function refls(p__263832) {
  var vec__263833__263834 = p__263832;
  var dx__263835 = cljs.core.nth.call(null, vec__263833__263834, 0, null);
  var dy__263836 = cljs.core.nth.call(null, vec__263833__263834, 1, null);
  return cljs.core.PersistentVector.fromArray([dx__263835, -dy__263836])
}, "\ufdd0'user/bounce":function refls(p__263837) {
  var vec__263838__263839 = p__263837;
  var dx__263840 = cljs.core.nth.call(null, vec__263838__263839, 0, null);
  var dy__263841 = cljs.core.nth.call(null, vec__263838__263839, 1, null);
  return cljs.core.PersistentVector.fromArray([-dx__263840, -dy__263841])
}});
grid.core.derive_keys = function derive_keys(m, p) {
  var G__263842__263843 = cljs.core.seq.call(null, cljs.core.keys.call(null, m));
  if(cljs.core.truth_(G__263842__263843)) {
    var i__263844 = cljs.core.first.call(null, G__263842__263843);
    var G__263842__263845 = G__263842__263843;
    while(true) {
      cljs.core.derive.call(null, i__263844, p);
      var temp__3974__auto____263846 = cljs.core.next.call(null, G__263842__263845);
      if(cljs.core.truth_(temp__3974__auto____263846)) {
        var G__263842__263847 = temp__3974__auto____263846;
        var G__263848 = cljs.core.first.call(null, G__263842__263847);
        var G__263849 = G__263842__263847;
        i__263844 = G__263848;
        G__263842__263845 = G__263849;
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
grid.core.CodeState = function(stack, box, w, h, pos, dir, skip_QMARK_, halted_QMARK_, error, __meta, __extmap) {
  this.stack = stack;
  this.box = box;
  this.w = w;
  this.h = h;
  this.pos = pos;
  this.dir = dir;
  this.skip_QMARK_ = skip_QMARK_;
  this.halted_QMARK_ = halted_QMARK_;
  this.error = error;
  this.__meta = __meta;
  this.__extmap = __extmap;
  this.cljs$lang$protocol_mask$partition0$ = 0;
  this.cljs$lang$protocol_mask$partition1$ = 32;
  if(arguments.length > 9) {
    this.__meta = __meta;
    this.__extmap = __extmap
  }else {
    this.__meta = null;
    this.__extmap = null
  }
};
grid.core.CodeState.prototype.cljs$core$IHash$ = true;
grid.core.CodeState.prototype.cljs$core$IHash$_hash$arity$1 = function(this__452__auto__) {
  var this__263853 = this;
  return cljs.core.hash_coll.call(null, this__452__auto__)
};
grid.core.CodeState.prototype.cljs$core$ILookup$ = true;
grid.core.CodeState.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this__457__auto__, k__458__auto__) {
  var this__263854 = this;
  return cljs.core._lookup.call(null, this__457__auto__, k__458__auto__, null)
};
grid.core.CodeState.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this__459__auto__, k263851, else__460__auto__) {
  var this__263855 = this;
  if(k263851 === "\ufdd0'stack") {
    return this__263855.stack
  }else {
    if(k263851 === "\ufdd0'box") {
      return this__263855.box
    }else {
      if(k263851 === "\ufdd0'w") {
        return this__263855.w
      }else {
        if(k263851 === "\ufdd0'h") {
          return this__263855.h
        }else {
          if(k263851 === "\ufdd0'pos") {
            return this__263855.pos
          }else {
            if(k263851 === "\ufdd0'dir") {
              return this__263855.dir
            }else {
              if(k263851 === "\ufdd0'skip?") {
                return this__263855.skip_QMARK_
              }else {
                if(k263851 === "\ufdd0'halted?") {
                  return this__263855.halted_QMARK_
                }else {
                  if(k263851 === "\ufdd0'error") {
                    return this__263855.error
                  }else {
                    if("\ufdd0'else") {
                      return cljs.core.get.call(null, this__263855.__extmap, k263851, else__460__auto__)
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
};
grid.core.CodeState.prototype.cljs$core$IAssociative$ = true;
grid.core.CodeState.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(this__464__auto__, k__465__auto__, G__263850) {
  var this__263856 = this;
  var pred__263857__263860 = cljs.core.identical_QMARK_;
  var expr__263858__263861 = k__465__auto__;
  if(cljs.core.truth_(pred__263857__263860.call(null, "\ufdd0'stack", expr__263858__263861))) {
    return new grid.core.CodeState(G__263850, this__263856.box, this__263856.w, this__263856.h, this__263856.pos, this__263856.dir, this__263856.skip_QMARK_, this__263856.halted_QMARK_, this__263856.error, this__263856.__meta, this__263856.__extmap)
  }else {
    if(cljs.core.truth_(pred__263857__263860.call(null, "\ufdd0'box", expr__263858__263861))) {
      return new grid.core.CodeState(this__263856.stack, G__263850, this__263856.w, this__263856.h, this__263856.pos, this__263856.dir, this__263856.skip_QMARK_, this__263856.halted_QMARK_, this__263856.error, this__263856.__meta, this__263856.__extmap)
    }else {
      if(cljs.core.truth_(pred__263857__263860.call(null, "\ufdd0'w", expr__263858__263861))) {
        return new grid.core.CodeState(this__263856.stack, this__263856.box, G__263850, this__263856.h, this__263856.pos, this__263856.dir, this__263856.skip_QMARK_, this__263856.halted_QMARK_, this__263856.error, this__263856.__meta, this__263856.__extmap)
      }else {
        if(cljs.core.truth_(pred__263857__263860.call(null, "\ufdd0'h", expr__263858__263861))) {
          return new grid.core.CodeState(this__263856.stack, this__263856.box, this__263856.w, G__263850, this__263856.pos, this__263856.dir, this__263856.skip_QMARK_, this__263856.halted_QMARK_, this__263856.error, this__263856.__meta, this__263856.__extmap)
        }else {
          if(cljs.core.truth_(pred__263857__263860.call(null, "\ufdd0'pos", expr__263858__263861))) {
            return new grid.core.CodeState(this__263856.stack, this__263856.box, this__263856.w, this__263856.h, G__263850, this__263856.dir, this__263856.skip_QMARK_, this__263856.halted_QMARK_, this__263856.error, this__263856.__meta, this__263856.__extmap)
          }else {
            if(cljs.core.truth_(pred__263857__263860.call(null, "\ufdd0'dir", expr__263858__263861))) {
              return new grid.core.CodeState(this__263856.stack, this__263856.box, this__263856.w, this__263856.h, this__263856.pos, G__263850, this__263856.skip_QMARK_, this__263856.halted_QMARK_, this__263856.error, this__263856.__meta, this__263856.__extmap)
            }else {
              if(cljs.core.truth_(pred__263857__263860.call(null, "\ufdd0'skip?", expr__263858__263861))) {
                return new grid.core.CodeState(this__263856.stack, this__263856.box, this__263856.w, this__263856.h, this__263856.pos, this__263856.dir, G__263850, this__263856.halted_QMARK_, this__263856.error, this__263856.__meta, this__263856.__extmap)
              }else {
                if(cljs.core.truth_(pred__263857__263860.call(null, "\ufdd0'halted?", expr__263858__263861))) {
                  return new grid.core.CodeState(this__263856.stack, this__263856.box, this__263856.w, this__263856.h, this__263856.pos, this__263856.dir, this__263856.skip_QMARK_, G__263850, this__263856.error, this__263856.__meta, this__263856.__extmap)
                }else {
                  if(cljs.core.truth_(pred__263857__263860.call(null, "\ufdd0'error", expr__263858__263861))) {
                    return new grid.core.CodeState(this__263856.stack, this__263856.box, this__263856.w, this__263856.h, this__263856.pos, this__263856.dir, this__263856.skip_QMARK_, this__263856.halted_QMARK_, G__263850, this__263856.__meta, this__263856.__extmap)
                  }else {
                    return new grid.core.CodeState(this__263856.stack, this__263856.box, this__263856.w, this__263856.h, this__263856.pos, this__263856.dir, this__263856.skip_QMARK_, this__263856.halted_QMARK_, this__263856.error, this__263856.__meta, cljs.core.assoc.call(null, this__263856.__extmap, k__465__auto__, G__263850))
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
  var this__263862 = this;
  if(cljs.core.vector_QMARK_.call(null, entry__463__auto__)) {
    return cljs.core._assoc.call(null, this__462__auto__, cljs.core._nth.call(null, entry__463__auto__, 0), cljs.core._nth.call(null, entry__463__auto__, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, this__462__auto__, entry__463__auto__)
  }
};
grid.core.CodeState.prototype.cljs$core$ISeqable$ = true;
grid.core.CodeState.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this__469__auto__) {
  var this__263863 = this;
  return cljs.core.seq.call(null, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'stack", this__263863.stack), cljs.core.vector.call(null, "\ufdd0'box", this__263863.box), cljs.core.vector.call(null, "\ufdd0'w", this__263863.w), cljs.core.vector.call(null, "\ufdd0'h", this__263863.h), cljs.core.vector.call(null, "\ufdd0'pos", this__263863.pos), cljs.core.vector.call(null, "\ufdd0'dir", this__263863.dir), cljs.core.vector.call(null, "\ufdd0'skip?", 
  this__263863.skip_QMARK_), cljs.core.vector.call(null, "\ufdd0'halted?", this__263863.halted_QMARK_), cljs.core.vector.call(null, "\ufdd0'error", this__263863.error)]), this__263863.__extmap))
};
grid.core.CodeState.prototype.cljs$core$IPrintable$ = true;
grid.core.CodeState.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(this__471__auto__, opts__472__auto__) {
  var this__263864 = this;
  var pr_pair__473__auto____263865 = function(keyval__474__auto__) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts__472__auto__, keyval__474__auto__)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__473__auto____263865, [cljs.core.str("#"), cljs.core.str("grid.core.CodeState"), cljs.core.str("{")].join(""), ", ", "}", opts__472__auto__, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'stack", this__263864.stack), cljs.core.vector.call(null, "\ufdd0'box", this__263864.box), cljs.core.vector.call(null, "\ufdd0'w", this__263864.w), cljs.core.vector.call(null, "\ufdd0'h", this__263864.h), cljs.core.vector.call(null, 
  "\ufdd0'pos", this__263864.pos), cljs.core.vector.call(null, "\ufdd0'dir", this__263864.dir), cljs.core.vector.call(null, "\ufdd0'skip?", this__263864.skip_QMARK_), cljs.core.vector.call(null, "\ufdd0'halted?", this__263864.halted_QMARK_), cljs.core.vector.call(null, "\ufdd0'error", this__263864.error)]), this__263864.__extmap))
};
grid.core.CodeState.prototype.cljs$core$ICounted$ = true;
grid.core.CodeState.prototype.cljs$core$ICounted$_count$arity$1 = function(this__461__auto__) {
  var this__263866 = this;
  return 9 + cljs.core.count.call(null, this__263866.__extmap)
};
grid.core.CodeState.prototype.cljs$core$IStack$ = true;
grid.core.CodeState.prototype.cljs$core$IStack$_peek$arity$1 = function(_) {
  var this__263867 = this;
  return cljs.core._peek.call(null, this__263867.stack)
};
grid.core.CodeState.prototype.cljs$core$IStack$_pop$arity$1 = function(this$) {
  var this__263868 = this;
  return cljs.core.update_in.call(null, this$, cljs.core.PersistentVector.fromArray(["\ufdd0'stack"]), cljs.core.pop)
};
grid.core.CodeState.prototype.cljs$core$IEquiv$ = true;
grid.core.CodeState.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(this__453__auto__, other__454__auto__) {
  var this__263869 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____263870 = other__454__auto__;
    if(cljs.core.truth_(and__3822__auto____263870)) {
      var and__3822__auto____263871 = this__453__auto__.constructor === other__454__auto__.constructor;
      if(and__3822__auto____263871) {
        return cljs.core.equiv_map.call(null, this__453__auto__, other__454__auto__)
      }else {
        return and__3822__auto____263871
      }
    }else {
      return and__3822__auto____263870
    }
  }())) {
    return true
  }else {
    return false
  }
};
grid.core.CodeState.prototype.cljs$core$IWithMeta$ = true;
grid.core.CodeState.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(this__456__auto__, G__263850) {
  var this__263872 = this;
  return new grid.core.CodeState(this__263872.stack, this__263872.box, this__263872.w, this__263872.h, this__263872.pos, this__263872.dir, this__263872.skip_QMARK_, this__263872.halted_QMARK_, this__263872.error, G__263850, this__263872.__extmap)
};
grid.core.CodeState.prototype.cljs$core$IMeta$ = true;
grid.core.CodeState.prototype.cljs$core$IMeta$_meta$arity$1 = function(this__455__auto__) {
  var this__263873 = this;
  return this__263873.__meta
};
grid.core.CodeState.prototype.cljs$core$IMap$ = true;
grid.core.CodeState.prototype.cljs$core$IMap$_dissoc$arity$2 = function(this__466__auto__, k__467__auto__) {
  var this__263874 = this;
  if(cljs.core.contains_QMARK_.call(null, cljs.core.set(["\ufdd0'dir", "\ufdd0'stack", "\ufdd0'error", "\ufdd0'pos", "\ufdd0'h", "\ufdd0'halted?", "\ufdd0'box", "\ufdd0'skip?", "\ufdd0'w"]), k__467__auto__)) {
    return cljs.core.dissoc.call(null, cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), this__466__auto__), this__263874.__meta), k__467__auto__)
  }else {
    return new grid.core.CodeState(this__263874.stack, this__263874.box, this__263874.w, this__263874.h, this__263874.pos, this__263874.dir, this__263874.skip_QMARK_, this__263874.halted_QMARK_, this__263874.error, this__263874.__meta, cljs.core.not_empty.call(null, cljs.core.dissoc.call(null, this__263874.__extmap, k__467__auto__)))
  }
};
grid.core.CodeState.cljs$lang$type = true;
grid.core.CodeState.cljs$lang$ctorPrSeq = function(this__498__auto__) {
  return cljs.core.list.call(null, "grid.core.CodeState")
};
grid.core.__GT_CodeState = function __GT_CodeState(stack, box, w, h, pos, dir, skip_QMARK_, halted_QMARK_, error) {
  return new grid.core.CodeState(stack, box, w, h, pos, dir, skip_QMARK_, halted_QMARK_, error)
};
grid.core.map__GT_CodeState = function map__GT_CodeState(G__263852) {
  return new grid.core.CodeState("\ufdd0'stack".call(null, G__263852), "\ufdd0'box".call(null, G__263852), "\ufdd0'w".call(null, G__263852), "\ufdd0'h".call(null, G__263852), "\ufdd0'pos".call(null, G__263852), "\ufdd0'dir".call(null, G__263852), "\ufdd0'skip?".call(null, G__263852), "\ufdd0'halted?".call(null, G__263852), "\ufdd0'error".call(null, G__263852), null, cljs.core.dissoc.call(null, G__263852, "\ufdd0'stack", "\ufdd0'box", "\ufdd0'w", "\ufdd0'h", "\ufdd0'pos", "\ufdd0'dir", "\ufdd0'skip?", 
  "\ufdd0'halted?", "\ufdd0'error"))
};
grid.core.CodeState;
grid.core.code_state = function code_state(w, h) {
  return new grid.core.CodeState(cljs.core.PersistentVector.fromArray([]), cljs.core.ObjMap.fromObject([], {}), w, h, cljs.core.PersistentVector.fromArray([-1, 0]), cljs.core.PersistentVector.fromArray([1, 0]), false, false, null)
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
grid.core.move = function move(p__263875) {
  var env__263878 = p__263875;
  var env__263879 = cljs.core.seq_QMARK_.call(null, env__263878) ? cljs.core.apply.call(null, cljs.core.hash_map, env__263878) : env__263878;
  var w__263880 = cljs.core.get.call(null, env__263879, "\ufdd0'w");
  var h__263881 = cljs.core.get.call(null, env__263879, "\ufdd0'h");
  var vec__263876__263882 = cljs.core.get.call(null, env__263879, "\ufdd0'pos");
  var x__263883 = cljs.core.nth.call(null, vec__263876__263882, 0, null);
  var y__263884 = cljs.core.nth.call(null, vec__263876__263882, 1, null);
  var vec__263877__263885 = cljs.core.get.call(null, env__263879, "\ufdd0'dir");
  var dx__263886 = cljs.core.nth.call(null, vec__263877__263885, 0, null);
  var dy__263887 = cljs.core.nth.call(null, vec__263877__263885, 1, null);
  return cljs.core.assoc.call(null, env__263879, "\ufdd0'pos", cljs.core.PersistentVector.fromArray([(w__263880 + x__263883 + dx__263886) % w__263880, (h__263881 + y__263884 + dy__263887) % h__263881]))
};
grid.core.at = function() {
  var at__delegate = function(cs, p__263888) {
    var vec__263889__263890 = p__263888;
    var pos__263891 = cljs.core.nth.call(null, vec__263889__263890, 0, null);
    return cljs.core.get_in.call(null, cs, cljs.core.PersistentVector.fromArray(["\ufdd0'box", function() {
      var or__3824__auto____263892 = pos__263891;
      if(cljs.core.truth_(or__3824__auto____263892)) {
        return or__3824__auto____263892
      }else {
        return cljs.core.get.call(null, cs, "\ufdd0'pos")
      }
    }()]))
  };
  var at = function(cs, var_args) {
    var p__263888 = null;
    if(goog.isDef(var_args)) {
      p__263888 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return at__delegate.call(this, cs, p__263888)
  };
  at.cljs$lang$maxFixedArity = 1;
  at.cljs$lang$applyTo = function(arglist__263893) {
    var cs = cljs.core.first(arglist__263893);
    var p__263888 = cljs.core.rest(arglist__263893);
    return at__delegate.call(this, cs, p__263888)
  };
  return at
}();
grid.core.inst = function inst(cs) {
  var o__4264__auto____263895 = cljs.core.truth_(cljs.core.get.call(null, cs, "\ufdd0'skip?")) ? "\ufdd0'user/skipping" : function() {
    var or__3824__auto____263894 = grid.core.at.call(null, cs);
    if(cljs.core.truth_(or__3824__auto____263894)) {
      return or__3824__auto____263894
    }else {
      return"\ufdd0'user/empty"
    }
  }();
  console.log([cljs.core.str("DEBUG ("), cljs.core.str("inst"), cljs.core.str("): "), cljs.core.str(cljs.core.pr_str.call(null, o__4264__auto____263895))].join(""));
  return o__4264__auto____263895
};
grid.core.exec = function() {
  var method_table__663__auto____263896 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  var prefer_table__664__auto____263897 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  var method_cache__665__auto____263898 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  var cached_hierarchy__666__auto____263899 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  var hierarchy__667__auto____263900 = cljs.core.get.call(null, cljs.core.ObjMap.fromObject([], {}), "\ufdd0'hierarchy", cljs.core.global_hierarchy);
  return new cljs.core.MultiFn("exec", grid.core.inst, "\ufdd0'default", hierarchy__667__auto____263900, method_table__663__auto____263896, prefer_table__664__auto____263897, method_cache__665__auto____263898, cached_hierarchy__666__auto____263899)
}();
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'default", function(c) {
  var o__4264__auto____263901 = grid.core.push.call(null, c, grid.core.at.call(null, c));
  console.log([cljs.core.str("DEBUG ("), cljs.core.str("lit"), cljs.core.str("): "), cljs.core.str(cljs.core.pr_str.call(null, o__4264__auto____263901))].join(""));
  return o__4264__auto____263901
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/reflection", function(cs) {
  return cljs.core.update_in.call(null, cs, cljs.core.PersistentVector.fromArray(["\ufdd0'dir"]), grid.core.refls.call(null, grid.core.at.call(null, cs)))
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/direction", function(cs) {
  return cljs.core.assoc.call(null, cs, "\ufdd0'dir", grid.core.dirs.call(null, grid.core.at.call(null, cs)))
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/comparison", function(code) {
  var c__263902 = grid.core.comps.call(null, grid.core.at.call(null, code));
  return grid.core.push.call(null, cljs.core.pop.call(null, cljs.core.pop.call(null, code)), cljs.core.truth_(c__263902.call(null, cljs.core.peek.call(null, cljs.core.pop.call(null, code)), cljs.core.peek.call(null, code))) ? 1 : 0)
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/arithmetic", function(c) {
  var op__263903 = grid.core.ariths.call(null, grid.core.at.call(null, c));
  return grid.core.push.call(null, cljs.core.pop.call(null, cljs.core.pop.call(null, c)), op__263903.call(null, cljs.core.peek.call(null, cljs.core.pop.call(null, c)), cljs.core.peek.call(null, c)))
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
  return cljs.core.update_in.call(null, cs, cljs.core.PersistentVector.fromArray(["\ufdd0'stack"]), function(p1__263904_SHARP_) {
    return cljs.core.conj.call(null, p1__263904_SHARP_, cljs.core.peek.call(null, p1__263904_SHARP_))
  })
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/swap", function(p__263905) {
  var cs__263906 = p__263905;
  var cs__263907 = cljs.core.seq_QMARK_.call(null, cs__263906) ? cljs.core.apply.call(null, cljs.core.hash_map, cs__263906) : cs__263906;
  var stack__263908 = cljs.core.get.call(null, cs__263907, "\ufdd0'stack");
  return cljs.core.assoc.call(null, cs__263907, "\ufdd0'stack", cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.pop.call(null, cljs.core.pop.call(null, stack__263908)), cljs.core.peek.call(null, stack__263908)), cljs.core.peek.call(null, cljs.core.pop.call(null, stack__263908))))
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/jump", function(c) {
  return cljs.core.assoc.call(null, cljs.core.pop.call(null, cljs.core.pop.call(null, c)), "\ufdd0'pos", cljs.core.PersistentVector.fromArray([cljs.core.peek.call(null, c), cljs.core.peek.call(null, cljs.core.pop.call(null, c))]))
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/get", function(c) {
  return grid.core.push.call(null, cljs.core.pop.call(null, cljs.core.pop.call(null, c)), grid.core.at.call(null, c, cljs.core.PersistentVector.fromArray([cljs.core.peek.call(null, c), cljs.core.peek.call(null, cljs.core.pop.call(null, c))])))
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/place", function(c) {
  return grid.core.set_at.call(null, cljs.core.pop.call(null, cljs.core.pop.call(null, cljs.core.pop.call(null, c))), cljs.core.PersistentVector.fromArray([cljs.core.peek.call(null, c), cljs.core.peek.call(null, cljs.core.pop.call(null, c))]), cljs.core.peek.call(null, cljs.core.pop.call(null, cljs.core.pop.call(null, c))))
});
cljs.core._add_method.call(null, grid.core.exec, "\ufdd0'user/halt", function(c) {
  return cljs.core.assoc.call(null, c, "\ufdd0'halted?", true)
});
grid.core.tick = function tick(code) {
  var o__4264__auto____263909 = cljs.core.not.call(null, "\ufdd0'halted?".call(null, code)) ? grid.core.exec.call(null, grid.core.move.call(null, code)) : code;
  console.log([cljs.core.str("DEBUG ("), cljs.core.str("tick"), cljs.core.str("): "), cljs.core.str(cljs.core.pr_str.call(null, o__4264__auto____263909))].join(""));
  return o__4264__auto____263909
};
grid.core.cstate = cljs.core.atom.call(null, null);
grid.core.code_QMARK_ = function code_QMARK_(v) {
  return cljs.core.keyword_QMARK_.call(null, v)
};
grid.core.inst__GT_string = cljs.core.PersistentHashMap.fromArrays([null, "\ufdd0'user/horizontal", "\ufdd0'user/skip?", "\ufdd0'user/add", "\ufdd0'user/lt", "\ufdd0'user/down", "\ufdd0'user/bounce", "\ufdd0'user/get", "\ufdd0'user/diag-pri", "\ufdd0'user/diag-sec", "\ufdd0'user/drop", "\ufdd0'user/mul", "\ufdd0'user/up", "\ufdd0'user/gt", "\ufdd0'user/sub", "\ufdd0'user/halt", "\ufdd0'user/right", "\ufdd0'user/vertical", "\ufdd0'user/swap", "\ufdd0'user/dup", "\ufdd0'user/quo", "\ufdd0'user/jump", 
"\ufdd0'user/left", "\ufdd0'user/place", "\ufdd0'user/eq", "\ufdd0'user/mod", "\ufdd0'user/skip!"], ["", "\u2015", "?", "+", "<", "\u2193", "\u2573", "\u0393", "\u2572", "\u2571", "\u0394", "*", "\u2191", ">", "-", "H", "\u2192", "|", "\u21c5", "\u2564", "\u00f7", "\u2933", "\u2190", "\u03a0", "=", "%", "!"]);
var group__4239__auto____263911 = cljs.core.swap_BANG_.call(null, crate.core.group_id, cljs.core.inc);
grid.core.cell = function cell(r, c, p__263912) {
  var map__263913__263914 = p__263912;
  var map__263913__263915 = cljs.core.seq_QMARK_.call(null, map__263913__263914) ? cljs.core.apply.call(null, cljs.core.hash_map, map__263913__263914) : map__263913__263914;
  var error__263916 = cljs.core.get.call(null, map__263913__263915, "\ufdd0'error");
  var pos__263917 = cljs.core.get.call(null, map__263913__263915, "\ufdd0'pos");
  var box__263918 = cljs.core.get.call(null, map__263913__263915, "\ufdd0'box");
  var elem__4240__auto____263921 = crate.core.html.call(null, cljs.core.PersistentVector.fromArray(["\ufdd0'div", cljs.core.ObjMap.fromObject(["\ufdd0'data-row", "\ufdd0'data-col", "\ufdd0'class"], {"\ufdd0'data-row":r, "\ufdd0'data-col":c, "\ufdd0'class":cljs.core._EQ_.call(null, error__263916, cljs.core.PersistentVector.fromArray([c, r])) ? "cell error" : cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([c, r]), pos__263917) ? "cell active" : "\ufdd0'else" ? "cell" : null}), function() {
    var temp__3971__auto____263919 = grid.core.inst__GT_string.call(null, box__263918.call(null, cljs.core.PersistentVector.fromArray([c, r])));
    if(cljs.core.truth_(temp__3971__auto____263919)) {
      var is__263920 = temp__3971__auto____263919;
      return is__263920
    }else {
      return[cljs.core.str(box__263918.call(null, cljs.core.PersistentVector.fromArray([c, r])))].join("")
    }
  }()]));
  elem__4240__auto____263921.setAttribute("crateGroup", group__4239__auto____263911);
  return elem__4240__auto____263921
};
grid.core.cell.prototype._crateGroup = group__4239__auto____263911;
var group__4239__auto____263922 = cljs.core.swap_BANG_.call(null, crate.core.group_id, cljs.core.inc);
grid.core.cells = function cells(p__263923) {
  var code__263924 = p__263923;
  var code__263925 = cljs.core.seq_QMARK_.call(null, code__263924) ? cljs.core.apply.call(null, cljs.core.hash_map, code__263924) : code__263924;
  var pos__263926 = cljs.core.get.call(null, code__263925, "\ufdd0'pos");
  var box__263927 = cljs.core.get.call(null, code__263925, "\ufdd0'box");
  var h__263928 = cljs.core.get.call(null, code__263925, "\ufdd0'h");
  var w__263929 = cljs.core.get.call(null, code__263925, "\ufdd0'w");
  var elem__4240__auto____263930 = crate.core.html.call(null, cljs.core.PersistentVector.fromArray(["\ufdd0'table#cells", cljs.core.map.call(null, function(row) {
    return cljs.core.PersistentVector.fromArray(["\ufdd0'tr.row", cljs.core.map.call(null, function(p1__263910_SHARP_) {
      return cljs.core.vector.call(null, "\ufdd0'td", grid.core.cell.call(null, row, p1__263910_SHARP_, code__263925))
    }, cljs.core.range.call(null, w__263929))])
  }, cljs.core.range.call(null, h__263928))]));
  elem__4240__auto____263930.setAttribute("crateGroup", group__4239__auto____263922);
  return elem__4240__auto____263930
};
grid.core.cells.prototype._crateGroup = group__4239__auto____263922;
var group__4239__auto____263931 = cljs.core.swap_BANG_.call(null, crate.core.group_id, cljs.core.inc);
grid.core.control = function control(ctrl) {
  var elem__4240__auto____263932 = crate.core.html.call(null, cljs.core.PersistentVector.fromArray(["\ufdd0'a.ctrl", cljs.core.ObjMap.fromObject(["\ufdd0'href", "\ufdd0'id"], {"\ufdd0'href":"#", "\ufdd0'id":ctrl}), clojure.string.capitalize.call(null, ctrl)]));
  elem__4240__auto____263932.setAttribute("crateGroup", group__4239__auto____263931);
  return elem__4240__auto____263932
};
grid.core.control.prototype._crateGroup = group__4239__auto____263931;
var group__4239__auto____263933 = cljs.core.swap_BANG_.call(null, crate.core.group_id, cljs.core.inc);
grid.core.controls = function controls(cs) {
  var elem__4240__auto____263934 = crate.core.html.call(null, cljs.core.PersistentVector.fromArray(["\ufdd0'div#controls", cljs.core.map.call(null, grid.core.control, cs)]));
  elem__4240__auto____263934.setAttribute("crateGroup", group__4239__auto____263933);
  return elem__4240__auto____263934
};
grid.core.controls.prototype._crateGroup = group__4239__auto____263933;
var group__4239__auto____263935 = cljs.core.swap_BANG_.call(null, crate.core.group_id, cljs.core.inc);
grid.core.stack = function stack(p__263936) {
  var map__263937__263938 = p__263936;
  var map__263937__263939 = cljs.core.seq_QMARK_.call(null, map__263937__263938) ? cljs.core.apply.call(null, cljs.core.hash_map, map__263937__263938) : map__263937__263938;
  var stack__263940 = cljs.core.get.call(null, map__263937__263939, "\ufdd0'stack");
  var elem__4240__auto____263942 = crate.core.html.call(null, function() {
    var s__263941 = cljs.core.reverse.call(null, cljs.core.map.call(null, function(e) {
      if(cljs.core.truth_(grid.core.code_QMARK_.call(null, e))) {
        return cljs.core.PersistentVector.fromArray(["\ufdd0'li.code", grid.core.inst__GT_string.call(null, e)])
      }else {
        return cljs.core.PersistentVector.fromArray(["\ufdd0'li.value", [cljs.core.str(e)].join("")])
      }
    }, stack__263940));
    return cljs.core.PersistentVector.fromArray(["\ufdd0'div#stack-wrap", cljs.core.PersistentVector.fromArray(["\ufdd0'ul#stack", 10 > cljs.core.count.call(null, s__263941) ? s__263941 : cljs.core.seq.call(null, cljs.core.conj.call(null, cljs.core.vec.call(null, cljs.core.take.call(null, 9, s__263941)), cljs.core.PersistentVector.fromArray(["\ufdd0'li", "..."])))])])
  }());
  elem__4240__auto____263942.setAttribute("crateGroup", group__4239__auto____263935);
  return elem__4240__auto____263942
};
grid.core.stack.prototype._crateGroup = group__4239__auto____263935;
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
grid.core.ctls = cljs.core.PersistentVector.fromArray(["run", "step", "reset"]);
grid.core.running_QMARK_ = cljs.core.atom.call(null, false);
grid.core.step = function step() {
  try {
    var ns__263945 = grid.core.tick.call(null, cljs.core.deref.call(null, grid.core.cstate));
    cljs.core.reset_BANG_.call(null, grid.core.cstate, ns__263945)
  }catch(e263943) {
    if(cljs.core.instance_QMARK_.call(null, Error, e263943)) {
      var e__263944 = e263943;
      cljs.core.swap_BANG_.call(null, grid.core.cstate, grid.core.ohno)
    }else {
      if("\ufdd0'else") {
        throw e263943;
      }else {
      }
    }
  }
  return grid.core.set_ui.call(null, cljs.core.deref.call(null, grid.core.cstate))
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
