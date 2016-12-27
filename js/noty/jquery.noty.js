/*!
 @package noty - jQuery Notification Plugin
 @version version: 2.3.11
 @contributors https://github.com/needim/noty/graphs/contributors

 @documentation Examples and Documentation - http://needim.github.com/noty/

 @license Licensed under the MIT licenses: http://www.opensource.org/licenses/mit-license.php
 */

if (typeof Object.create !== 'function') {
  Object.create = function (o) {
    function F() {
    }

    F.prototype = o;
    return new F();
  };
}

var NotyObject = {

  init: function (options) {

    // Mix in the passed in options with the default options
    this.options = $.extend({}, $.noty.defaults, options);

    this.options.layout = (this.options.custom) ? $.noty.layouts['inline'] : $.noty.layouts[this.options.layout];

    if ($.noty.themes[this.options.theme]) {
      this.options.theme = $.noty.themes[this.options.theme];
      if (this.options.theme.template)
        this.options.template = this.options.theme.template;

      if (this.options.theme.animation)
        this.options.animation = this.options.theme.animation;
    }
    else {
      this.options.themeClassName = this.options.theme;
    }

    this.options = $.extend({}, this.options, this.options.layout.options);

    if (this.options.id) {
      if ($.noty.store[this.options.id]) {
        return $.noty.store[this.options.id];
      }
    } else {
      this.options.id = 'noty_' + (new Date().getTime() * Math.floor(Math.random() * 1000000));
    }

    // Build the noty dom initial structure
    this._build();

    // return this so we can chain/use the bridge with less code.
    return this;
  }, // end init

  _build: function () {

    // Generating noty bar
    var $bar = $('<div class="noty_bar noty_type_' + this.options.type + '"></div>').attr('id', this.options.id);
    $bar.append(this.options.template).find('.noty_text').html(this.options.text);

    this.$bar = (this.options.layout.parent.object !== null) ? $(this.options.layout.parent.object).css(this.options.layout.parent.css).append($bar) : $bar;

    if (this.options.themeClassName)
      this.$bar.addClass(this.options.themeClassName).addClass('noty_container_type_' + this.options.type);

    // Set buttons if available
    if (this.options.buttons) {

      var $buttons;
      // Try find container for buttons in presented template, and create it if not found
      if (this.$bar.find('.noty_buttons').length > 0) {
        $buttons = this.$bar.find('.noty_buttons');
      } else {
        $buttons = $('<div/>').addClass('noty_buttons');
        (this.options.layout.parent.object !== null) ? this.$bar.find('.noty_bar').append($buttons) : this.$bar.append($buttons);
      }

      var self = this;

      $.each(this.options.buttons, function (i, button) {
        var $button = $('<button/>').addClass((button.addClass) ? button.addClass : 'gray').html(button.text).attr('id', button.id ? button.id : 'button-' + i)
            .attr('title', button.title)
            .appendTo($buttons)
            .on('click', function (event) {
              if ($.isFunction(button.onClick)) {
                button.onClick.call($button, self, event);
              }
            });
      });
    } else {
      // If buttons is not available, then remove containers if exist
      this.$bar.find('.noty_buttons').remove();
    }

    // For easy access
    this.$message     = this.$bar.find('.noty_message');
    this.$closeButton = this.$bar.find('.noty_close');
    this.$buttons     = this.$bar.find('.noty_buttons');

    $.noty.store[this.options.id] = this; // store noty for api

  }, // end _build

  show: function () {

    var self = this;

    (self.options.custom) ? self.options.custom.find(self.options.layout.container.selector).append(self.$bar) : $(self.options.layout.container.selector).append(self.$bar);

    if (self.options.theme && self.options.theme.style)
      self.options.theme.style.apply(self);

    ($.type(self.options.layout.css) === 'function') ? this.options.layout.css.apply(self.$bar) : self.$bar.css(this.options.layout.css || {});

    self.$bar.addClass(self.options.layout.addClass);

    self.options.layout.container.style.apply($(self.options.layout.container.selector), [self.options.within]);

    self.showing = true;

    if (self.options.theme && self.options.theme.style)
      self.options.theme.callback.onShow.apply(this);

    if ($.inArray('click', self.options.closeWith) > -1)
      self.$bar.css('cursor', 'pointer').on('click', function (evt) {
        self.stopPropagation(evt);
        if (self.options.callback.onCloseClick) {
          self.options.callback.onCloseClick.apply(self);
        }
        self.close();
      });

    if ($.inArray('hover', self.options.closeWith) > -1)
      self.$bar.one('mouseenter', function () {
        self.close();
      });

    if ($.inArray('button', self.options.closeWith) > -1)
      self.$closeButton.one('click', function (evt) {
        self.stopPropagation(evt);
        self.close();
      });

    if ($.inArray('button', self.options.closeWith) == -1)
      self.$closeButton.remove();

    if (self.options.callback.beforeShow)
      self.options.callback.beforeShow.apply(self);

    if (typeof self.options.animation.open == 'string') {
      self.animationTypeOpen = 'css';
      self.$bar.css('min-height', self.$bar.innerHeight());
      self.$bar.on('click', function (e) {
        self.wasClicked = true;
      });
      self.$bar.show();

      if (self.options.callback.onShow)
        self.options.callback.onShow.apply(self);

      self.$bar.addClass(self.options.animation.open).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
        if (self.options.callback.afterShow) self.options.callback.afterShow.apply(self);
        self.showing = false;
        self.shown   = true;
        if (self.hasOwnProperty('wasClicked')) {
          self.$bar.off('click', function (e) {
            self.wasClicked = true;
          });
          self.close();
        }
      });

    } else if (typeof self.options.animation.open == 'object' && self.options.animation.open == null) {
      self.animationTypeOpen = 'none';
      self.showing           = false;
      self.shown             = true;
      self.$bar.show();

      if (self.options.callback.onShow)
        self.options.callback.onShow.apply(self);

      self.$bar.queue(function () {
        if (self.options.callback.afterShow)
          self.options.callback.afterShow.apply(self);
      });

    } else {
      self.animationTypeOpen = 'anim';

      if (self.options.callback.onShow)
        self.options.callback.onShow.apply(self);

      self.$bar.animate(
          self.options.animation.open,
          self.options.animation.speed,
          self.options.animation.easing,
          function () {
            if (self.options.callback.afterShow) self.options.callback.afterShow.apply(self);
            self.showing = false;
            self.shown   = true;
          });
    }

    // If noty is have a timeout option
    if (self.options.timeout) {
      self.queueClose(self.options.timeout);
      self.$bar.on('mouseenter', self.dequeueClose.bind(self));
      self.$bar.on('mouseleave', self.queueClose.bind(self, self.options.timeout));
    }

    return this;

  }, // end show

  dequeueClose: function () {
    if (!this.closeTimer) return;
    clearTimeout(this.closeTimer);
    this.closeTimer = null;
  },

  queueClose: function (timeout) {
    if (this.closeTimer) return;
    var self        = this;
    self.closeTimer = window.setTimeout(function () {
      self.close();
    }, timeout);
    return self.closeTimer
  },

  close: function () {
    if (this.closeTimer) this.dequeueClose();

    if (this.closed) return;
    if (this.$bar && this.$bar.hasClass('i-am-closing-now')) return;

    var self = this;

    if (this.showing && (this.animationTypeOpen == 'anim' || this.animationTypeOpen == 'none')) {
      self.$bar.queue(
          function () {
            self.close.apply(self);
          }
      );
      return;
    } else if (this.showing && this.animationTypeOpen == 'css') {
      self.$bar.on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
        self.close();
      });
    }

    if (!this.shown && !this.showing) { // If we are still waiting in the queue just delete from queue
      var queue = [];
      $.each($.noty.queue, function (i, n) {
        if (n.options.id != self.options.id) {
          queue.push(n);
        }
      });
      $.noty.queue = queue;
      return;
    }

    self.$bar.addClass('i-am-closing-now');

    if (self.options.callback.onClose) {
      self.options.callback.onClose.apply(self);
    }

    if (typeof self.options.animation.close == 'string') {
      self.$bar.removeClass(self.options.animation.open).addClass(self.options.animation.close).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
        if (self.options.callback.afterClose) self.options.callback.afterClose.apply(self);
        self.closeCleanUp();
      });

    } else if (typeof self.options.animation.close == 'object' && self.options.animation.close == null) {
      self.$bar.dequeue().hide(0, function () {
        if (self.options.callback.afterClose) self.options.callback.afterClose.apply(self);
        self.closeCleanUp();
      });

    } else {
      self.$bar.clearQueue().stop().animate(
          self.options.animation.close,
          self.options.animation.speed,
          self.options.animation.easing,
          function () {
            if (self.options.callback.afterClose) self.options.callback.afterClose.apply(self);
          })
          .promise().done(function () {
        self.closeCleanUp();
      });
    }

  }, // end close

  closeCleanUp: function () {

    var self = this;

    // Modal Cleaning
    if (self.options.modal) {
      $.notyRenderer.setModalCount(-1);
      if ($.notyRenderer.getModalCount() == 0 && !$.noty.queue.length) $('.noty_modal').fadeOut(self.options.animation.fadeSpeed, function () {
        $(this).remove();
      });
    }

    // Layout Cleaning
    $.notyRenderer.setLayoutCountFor(self, -1);
    if ($.notyRenderer.getLayoutCountFor(self) == 0) $(self.options.layout.container.selector).remove();

    // Make sure self.$bar has not been removed before attempting to remove it
    if (typeof self.$bar !== 'undefined' && self.$bar !== null) {

      if (typeof self.options.animation.close == 'string') {
        self.$bar.css('transition', 'all 10ms ease').css('border', 0).css('margin', 0).height(0);
        self.$bar.one('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function () {
          self.$bar.remove();
          self.$bar   = null;
          self.closed = true;

          if (self.options.theme.callback && self.options.theme.callback.onClose) {
            self.options.theme.callback.onClose.apply(self);
          }

          self.handleNext();
        });
      } else {
        self.$bar.remove();
        self.$bar   = null;
        self.closed = true;

        self.handleNext();
      }
    } else {
      self.handleNext();
    }

  }, // end close clean up

  handleNext: function () {
    var self = this;

    delete $.noty.store[self.options.id]; // deleting noty from store

    if (self.options.theme.callback && self.options.theme.callback.onClose) {
      self.options.theme.callback.onClose.apply(self);
    }

    if (!self.options.dismissQueue) {
      // Queue render
      $.noty.ontap = true;

      $.notyRenderer.render();
    }

    if (self.options.maxVisible > 0 && self.options.dismissQueue) {
      $.notyRenderer.render();
    }
  },

  setText: function (text) {
    if (!this.closed) {
      this.options.text = text;
      this.$bar.find('.noty_text').html(text);
    }
    return this;
  },

  setType: function (type) {
    if (!this.closed) {
      this.options.type = type;
      this.options.theme.style.apply(this);
      this.options.theme.callback.onShow.apply(this);
    }
    return this;
  },

  setTimeout: function (time) {
    if (!this.closed) {
      var self             = this;
      this.options.timeout = time;
      self.$bar.delay(self.options.timeout).promise().done(function () {
        self.close();
      });
    }
    return this;
  },

  stopPropagation: function (evt) {
    evt = evt || window.event;
    if (typeof evt.stopPropagation !== "undefined") {
      evt.stopPropagation();
    }
    else {
      evt.cancelBubble = true;
    }
  },

  closed : false,
  showing: false,
  shown  : false

}; // end NotyObject

var NotyPushObject = {
  init: function (options) {

    // Mix in the passed in options with the default options
    this.options = $.extend({}, $.noty.pushDefaults, options);

    return this.show();
  },

  show: function () {

    var self = this;

    /* Safari 6+, Firefox 22+, Chrome 22+, Opera 25+ */
    if ($.notyPushRenderer.PN) {

      self.notification = new $.notyPushRenderer.PN(self.options.title, {
            icon: self.options.icon,
            body: self.options.body,
            tag : self.options.tag
          }
      );

      /* Legacy webkit browsers */
    } else if (window.webkitNotifications) {

      self.notification = window.webkitNotifications.createNotification(
          self.options.icon,
          self.options.title,
          self.options.body
      );
      self.notification.show();

      /* Firefox Mobile */
    } else if (navigator.mozNotification) {

      self.notification = navigator.mozNotification.createNotification(
          self.options.title,
          self.options.body,
          self.options.icon
      );

      self.notification.show();

      /* IE9+ */
    } else if (window.external && window.external.msIsSiteMode()) {

      window.external.msSiteModeClearIconOverlay();
      window.external.msSiteModeSetIconOverlay(self.options.icon, self.options.title);
      window.external.msSiteModeActivate();

    } else {
      throw new Error('Notifications are not supported');
    }

    if (self.notification) {
      if (self.options.timeout) {
        setTimeout(function () {
          self.close();
        }, self.options.timeout);
      }

      if (self.options.callback.show) {
        self.notification.addEventListener('show', self.options.callback.show);
      }

      if (self.options.callback.click) {
        self.notification.addEventListener('click', self.options.callback.click);
      }

      if (self.options.callback.error) {
        self.notification.addEventListener('error', self.options.callback.error);
      }

      if (self.options.callback.close) {
        self.notification.addEventListener('close', self.options.callback.close);
      }

      if (self.options.callback.error) {
        self.notification.addEventListener('cancel', self.options.callback.cancel);
      }

    }

    return this;
  },

  close: function () {
    if (this.notification) {
      this.notification.close();
    }
  }
};

$.notyPushRenderer = {};

$.notyPushRenderer.permCallback = function (result) {
  console.info('Permission request result: ', result);
};

$.notyPushRenderer.storeSubscription = function (subscription) {
  console.info('You can override this function for storing user\'s endpoint & authentication details: ', subscription);
};

$.notyPushRenderer.init = function (options) {
  this.PN = window.Notification;

  if (this.isSupported()) {
    if (this.needPermission()) {
      return this.requestPermission().then(function (result) {
        if (result === 'granted') {

          // Renderer creates a new notyPush object
          var notification = Object.create(NotyPushObject).init(options);
          $.notyPushRenderer.render();
          return notification;

        } else {
          // fallback to normal notifications
          options.text = options.title + "<br>" + options.body;
          return $.notyRenderer.init(options);
        }
      });
    } else {
      // Renderer creates a new notyPush object
      var notification = Object.create(NotyPushObject).init(options);
      $.notyPushRenderer.render();
      return notification;
    }
  } else {
    console.info('HTML5 Notifications are not supported. Fallback to normal notifications');
    // fallback to normal notifications
    options.text = options.title + "<br>" + options.body;
    return $.notyRenderer.init(options);
  }
};

$.notyPushRenderer.render = function () {

};

$.notyPushRenderer.isSupported = function () {
  return (this.PN || this.PN.requestPermission);
};

$.notyPushRenderer.needPermission = function () {
  return !(this.PN && this.PN.permission && this.PN.permission === 'granted');
};

$.notyPushRenderer.requestPermission = function () {
  return this.PN.requestPermission().then(function (perm) {

    // let's register our service worker for Google Cloud Messaging
    if (perm === 'granted' && 'serviceWorker' in navigator && $.noty.pushWorker !== false) {
      navigator.serviceWorker.register($.noty.pushWorker).then(function () {
        navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
          serviceWorkerRegistration.pushManager.subscribe({
            userVisibleOnly: true
          }).then(function (subscription) {

            var key   = subscription.getKey('p256dh');
            var token = subscription.getKey('auth');
            var gcmData = {
              'endpoint': $.notyPushRenderer.getEndpoint(subscription),
              'key'     : key ? btoa(String.fromCharCode.apply(null, new Uint8Array(key))) : null,
              'token'   : token ? btoa(String.fromCharCode.apply(null, new Uint8Array(token))) : null
            };

            $.notyPushRenderer.storeSubscription(gcmData);

          }).catch(function (err) {
            console.error('Error occurred while worker subscribe(): ', err);
          });
        });
      });
    }

    $.notyPushRenderer.permCallback(perm);

    return perm;
  });
};

$.notyPushRenderer.getEndpoint = function (subscription) {
  var endpoint       = subscription.endpoint;
  var subscriptionId = subscription.subscriptionId;

  // fix for Chrome < 45
  if (subscriptionId && endpoint.indexOf(subscriptionId) === -1) {
    endpoint += '/' + subscriptionId;
  }

  return endpoint;
};

$.notyRenderer = {};

$.notyRenderer.init = function (options) {

  // Renderer creates a new noty
  var notification = Object.create(NotyObject).init(options);

  if (notification.options.killer)
    $.noty.closeAll();

  (notification.options.force) ? $.noty.queue.unshift(notification) : $.noty.queue.push(notification);

  $.notyRenderer.render();

  return ($.noty.returns == 'object') ? notification : notification.options.id;
};

$.notyRenderer.render = function () {

  var instance = $.noty.queue[0];

  if ($.type(instance) === 'object') {
    if (instance.options.dismissQueue) {
      if (instance.options.maxVisible > 0) {
        if ($(instance.options.layout.container.selector + ' > li').length < instance.options.maxVisible) {
          $.notyRenderer.show($.noty.queue.shift());
        }
        else {

        }
      }
      else {
        $.notyRenderer.show($.noty.queue.shift());
      }
    }
    else {
      if ($.noty.ontap) {
        $.notyRenderer.show($.noty.queue.shift());
        $.noty.ontap = false;
      }
    }
  }
  else {
    $.noty.ontap = true; // Queue is over
  }

};

$.notyRenderer.show = function (notification) {

  if (notification.options.modal) {
    $.notyRenderer.createModalFor(notification);
    $.notyRenderer.setModalCount(+1);
  }

  // Where is the container?
  if (notification.options.custom) {
    if (notification.options.custom.find(notification.options.layout.container.selector).length == 0) {
      notification.options.custom.append($(notification.options.layout.container.object).addClass('i-am-new'));
    }
    else {
      notification.options.custom.find(notification.options.layout.container.selector).removeClass('i-am-new');
    }
  }
  else {
    if ($(notification.options.layout.container.selector).length == 0) {
      $('body').append($(notification.options.layout.container.object).addClass('i-am-new'));
    }
    else {
      $(notification.options.layout.container.selector).removeClass('i-am-new');
    }
  }

  $.notyRenderer.setLayoutCountFor(notification, +1);

  notification.show();
};

$.notyRenderer.createModalFor = function (notification) {
  if ($('.noty_modal').length == 0) {
    var modal = $('<div/>').addClass('noty_modal').addClass(notification.options.theme).data('noty_modal_count', 0);

    if (notification.options.theme.modal && notification.options.theme.modal.css)
      modal.css(notification.options.theme.modal.css);

    modal.prependTo($('body')).fadeIn(notification.options.animation.fadeSpeed);

    if ($.inArray('backdrop', notification.options.closeWith) > -1)
      modal.on('click', function () {
        $.noty.closeAll();
      });
  }
};

$.notyRenderer.getLayoutCountFor = function (notification) {
  return $(notification.options.layout.container.selector).data('noty_layout_count') || 0;
};

$.notyRenderer.setLayoutCountFor = function (notification, arg) {
  return $(notification.options.layout.container.selector).data('noty_layout_count', $.notyRenderer.getLayoutCountFor(notification) + arg);
};

$.notyRenderer.getModalCount = function () {
  return $('.noty_modal').data('noty_modal_count') || 0;
};

$.notyRenderer.setModalCount = function (arg) {
  return $('.noty_modal').data('noty_modal_count', $.notyRenderer.getModalCount() + arg);
};

// This is for custom container
$.fn.noty = function (options) {
  options.custom = $(this);
  return $.notyRenderer.init(options);
};

$.noty         = {};
$.noty.queue   = [];
$.noty.ontap   = true;
$.noty.layouts = {};
$.noty.themes  = {};
$.noty.returns = 'object';
$.noty.store   = {};

$.noty.get = function (id) {
  return $.noty.store.hasOwnProperty(id) ? $.noty.store[id] : false;
};

$.noty.close = function (id) {
  return $.noty.get(id) ? $.noty.get(id).close() : false;
};

$.noty.setText = function (id, text) {
  return $.noty.get(id) ? $.noty.get(id).setText(text) : false;
};

$.noty.setType = function (id, type) {
  return $.noty.get(id) ? $.noty.get(id).setType(type) : false;
};

$.noty.clearQueue = function () {
  $.noty.queue = [];
};

$.noty.closeAll = function () {
  $.noty.clearQueue();
  $.each($.noty.store, function (id, noty) {
    noty.close();
  });
};

var windowAlert = window.alert;

$.noty.consumeAlert = function (options) {
  window.alert = function (text) {
    if (options)
      options.text = text;
    else
      options = {text: text};

    $.notyRenderer.init(options);
  };
};

$.noty.stopConsumeAlert = function () {
  window.alert = windowAlert;
};

$.noty.defaults = {
  layout      : 'topRight',
  theme       : 'relax',
  type        : 'alert',
  text        : '',
  dismissQueue: true,
  template    : '<div class="noty_message"><span class="noty_text"></span><div class="noty_close"></div></div>',
  animation   : {
    open     : {height: 'toggle'},
    close    : {height: 'toggle'},
    easing   : 'swing',
    speed    : 500,
    fadeSpeed: 'fast'
  },
  timeout     : false,
  force       : false,
  modal       : false,
  maxVisible  : 5,
  killer      : false,
  closeWith   : ['click'],
  callback    : {
    beforeShow  : function () {
    },
    onShow      : function () {
    },
    afterShow   : function () {
    },
    onClose     : function () {
    },
    afterClose  : function () {
    },
    onCloseClick: function () {
    }
  },
  buttons     : false
};

$.noty.pushWorker   = '/gcm-worker.js'; // It should be at root directory otherwise promise can't resolve
$.noty.pushDefaults = {
  icon    : '',
  title   : '',
  body    : '',
  timeout : false,
  callback: {
    click : function (e) {
      e.target.close();
    },
    show  : function (e) {},
    error : function (e) {},
    close : function (e) {},
    cancel: function (e) {}
  }
};

$(window).on('resize', function () {
  $.each($.noty.layouts, function (index, layout) {
    layout.container.style.apply($(layout.container.selector));
  });
});

// Helpers
window.noty = function noty(options) {
  return $.notyRenderer.init(options);
};

window.pushNoty = function pushNoty(options) {
  return $.notyPushRenderer.init(options);
};
