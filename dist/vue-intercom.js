(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.VueIntercom = factory());
}(this, (function () { 'use strict';

var callIf = function (a, f) { return a && f(); };

var assert = function (condition, msg) { return callIf(!condition, function () {
    throw new Error(("[vue-intercom] " + msg))
  }); };

var is = function (t, o) { return o instanceof t || (o !== null && o !== undefined && o.constructor === t); };

var mapInstanceToProps = function (vm, props) {
  var o = {};
  props.forEach(function (p) { return (o[p] = { get: function () { return vm[p]; } }); });
  return o
};

/* globals window, document */
var Vue;
var init = function (ref) {
  var appId = ref.appId;

  assert(Vue, 'call Vue.use(VueIntercom) before creating an instance');

  var vm = new Vue({
    data: function data() {
      return {
        ready: false,
        visible: false,
        unreadCount: 0
      }
    }
  });

  var queued = [];

  var callIntercom = function () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    var intercomAvailable =
      window && window.Intercom && typeof window.Intercom === 'function';
    console.log(intercomAvailable, typeof window.Intercom);
    var f = function () {
      console.log('calling f');
      window.Intercom.apply(window, args);
    };
    return intercomAvailable ? f() : queued.push(f)
  };

  var intercom = { _vm: vm };

  Object.defineProperties(
    intercom,
    mapInstanceToProps(vm, ['ready', 'visible', 'unreadCount'])
  );

  intercom._init = function () {
    vm.ready = true;

    queued.forEach(function (f) { return f(); });

    callIntercom('onHide', function () { return (vm.visible = false); });
    callIntercom('onShow', function () { return (vm.visible = true); });
    callIntercom(
      'onUnreadCountChange',
      function (unreadCount) { return (vm.unreadCount = unreadCount); }
    );
  };
  intercom.boot = function (options) {
    if ( options === void 0 ) options = { app_id: appId };

    return callIntercom('boot', options);
  };
  intercom.shutdown = function () { return callIntercom('shutdown'); };
  intercom.update = function () {
    var options = [], len = arguments.length;
    while ( len-- ) options[ len ] = arguments[ len ];

    return callIntercom.apply(void 0, [ 'update' ].concat( options ));
  };
  intercom.show = function () { return callIntercom('show'); };
  intercom.hide = function () { return callIntercom('hide'); };
  intercom.showMessages = function () { return callIntercom('showMessages'); };
  intercom.showNewMessage = function (content) { return callIntercom.apply(void 0, [ 'showNewMessage' ].concat( (is(String, content) ? [content] : []) )); };
  intercom.trackEvent = function (name) {
      var metadata = [], len = arguments.length - 1;
      while ( len-- > 0 ) metadata[ len ] = arguments[ len + 1 ];

      return callIntercom.apply(void 0, [ 'trackEvent' ].concat( [name ].concat( metadata) ));
  };
  intercom.getVisitorId = function () { return callIntercom('getVisitorId'); };

  return intercom
};

var installed;

init.install = function install(_Vue, ref) {
  var appId = ref.appId;

  assert(!Vue, 'already installed.');
  Vue = _Vue;
  var vueIntercom = init({ appId: appId });
  Vue.mixin({
    created: function created() {
      var this$1 = this;

      callIf(!installed, function () {
        init.loadScript(appId, function (x, y) { return this$1.$intercom._init(); });
        installed = true;
      });
    }
  });
  Object.defineProperty(Vue.prototype, '$intercom', {
    get: function () { return vueIntercom; }
  });
};

init.loadScript = function loadScript(appId, done) {
  var script = document.createElement('script');
  script.src = "https://widget.intercom.io/widget/" + appId;
  var firstScript = document.getElementsByTagName('script')[0];
  firstScript.parentNode.insertBefore(script, firstScript);
  script.onload = done;
};

return init;

})));
