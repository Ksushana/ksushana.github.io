/*!
 * ScrollMagic v2.0.7 (2019-05-07)
 * The javascript library for magical scroll interactions.
 * (c) 2019 Jan Paepke (@janpaepke)
 * Project Website: http://scrollmagic.io
 * 
 * @version 2.0.7
 * @license Dual licensed under MIT license and GPL.
 * @author Jan Paepke - e-mail@janpaepke.de
 *
 * @file ScrollMagic GSAP Animation Plugin.
 *
 * requires: GSAP ~1.14
 * Powered by the Greensock Animation Platform (GSAP): http://www.greensock.com/js
 * Greensock License info at http://www.greensock.com/licensing/
 */
/**
 * This plugin is meant to be used in conjunction with the Greensock Animation Plattform.  
 * It offers an easy API to trigger Tweens or synchronize them to the scrollbar movement.
 *
 * Both the `lite` and the `max` versions of the GSAP library are supported.  
 * The most basic requirement is `TweenLite`.
 * 
 * To have access to this extension, please include `plugins/animation.gsap.js`.
 * @requires {@link http://greensock.com/gsap|GSAP ~1.14.x}
 * @mixin animation.GSAP
 */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['ScrollMagic', 'TweenMax', 'TimelineMax'], factory);
	} else if (typeof exports === 'object') {
		// CommonJS
		// Loads whole gsap package onto global scope.
		require('gsap');
		factory(require('scrollmagic'), TweenMax, TimelineMax);
	} else {
		// Browser globals
		factory(root.ScrollMagic || (root.jQuery && root.jQuery.ScrollMagic), root.TweenMax || root.TweenLite, root.TimelineMax || root.TimelineLite);
	}
}(this, function (ScrollMagic, Tween, Timeline) {
	"use strict";
	var NAMESPACE = "animation.gsap";

	var
		console = window.console || {},
		err = Function.prototype.bind.call(console.error || console.log || function () {}, console);
	if (!ScrollMagic) {
		err("(" + NAMESPACE + ") -> ERROR: The ScrollMagic main module could not be found. Please make sure it's loaded before this plugin or use an asynchronous loader like requirejs.");
	}
	if (!Tween) {
		err("(" + NAMESPACE + ") -> ERROR: TweenLite or TweenMax could not be found. Please make sure GSAP is loaded before ScrollMagic or use an asynchronous loader like requirejs.");
	}

	/*
	 * ----------------------------------------------------------------
	 * Extensions for Scene
	 * ----------------------------------------------------------------
	 */
	/**
	 * Every instance of ScrollMagic.Scene now accepts an additional option.  
	 * See {@link ScrollMagic.Scene} for a complete list of the standard options.
	 * @memberof! animation.GSAP#
	 * @method new ScrollMagic.Scene(options)
	 * @example
	 * var scene = new ScrollMagic.Scene({tweenChanges: true});
	 *
	 * @param {object} [options] - Options for the Scene. The options can be updated at any time.
	 * @param {boolean} [options.tweenChanges=false] - Tweens Animation to the progress target instead of setting it.  
	 												  Does not affect animations where duration is `0`.
	 */
	/**
	 * **Get** or **Set** the tweenChanges option value.  
	 * This only affects scenes with a duration. If `tweenChanges` is `true`, the progress update when scrolling will not be immediate, but instead the animation will smoothly animate to the target state.  
	 * For a better understanding, try enabling and disabling this option in the [Scene Manipulation Example](../examples/basic/scene_manipulation.html).
	 * @memberof! animation.GSAP#
	 * @method Scene.tweenChanges
	 * 
	 * @example
	 * // get the current tweenChanges option
	 * var tweenChanges = scene.tweenChanges();
	 *
	 * // set new tweenChanges option
	 * scene.tweenChanges(true);
	 *
	 * @fires {@link Scene.change}, when used as setter
	 * @param {boolean} [newTweenChanges] - The new tweenChanges setting of the scene.
	 * @returns {boolean} `get` -  Current tweenChanges option value.
	 * @returns {Scene} `set` -  Parent object for chaining.
	 */
	// add option (TODO: DOC (private for dev))
	ScrollMagic.Scene.addOption(
		"tweenChanges", // name
		false, // default
		function (val) { // validation callback
			return !!val;
		}
	);
	// extend scene
	ScrollMagic.Scene.extend(function () {
		var Scene = this,
			_tween;

		var log = function () {
			if (Scene._log) { // not available, when main source minified
				Array.prototype.splice.call(arguments, 1, 0, "(" + NAMESPACE + ")", "->");
				Scene._log.apply(this, arguments);
			}
		};

		// set listeners
		Scene.on("progress.plugin_gsap", function () {
			updateTweenProgress();
		});
		Scene.on("destroy.plugin_gsap", function (e) {
			Scene.removeTween(e.reset);
		});

		/**
		 * Update the tween progress to current position.
		 * @private
		 */
		var updateTweenProgress = function () {
			if (_tween) {
				var
					progress = Scene.progress(),
					state = Scene.state();
				if (_tween.repeat && _tween.repeat() === -1) {
					// infinite loop, so not in relation to progress
					if (state === 'DURING' && _tween.paused()) {
						_tween.play();
					} else if (state !== 'DURING' && !_tween.paused()) {
						_tween.pause();
					}
				} else if (progress != _tween.progress()) { // do we even need to update the progress?
					// no infinite loop - so should we just play or go to a specific point in time?
					if (Scene.duration() === 0) {
						// play the animation
						if (progress > 0) { // play from 0 to 1
							_tween.play();
						} else { // play from 1 to 0
							_tween.reverse();
						}
					} else {
						// go to a specific point in time
						if (Scene.tweenChanges() && _tween.tweenTo) {
							// go smooth
							_tween.tweenTo(progress * _tween.duration());
						} else {
							// just hard set it
							_tween.progress(progress).pause();
						}
					}
				}
			}
		};

		/**
		 * Add a tween to the scene.  
		 * If you want to add multiple tweens, add them into a GSAP Timeline object and supply it instead (see example below).  
		 * 
		 * If the scene has a duration, the tween's duration will be projected to the scroll distance of the scene, meaning its progress will be synced to scrollbar movement.  
		 * For a scene with a duration of `0`, the tween will be triggered when scrolling forward past the scene's trigger position and reversed, when scrolling back.  
		 * To gain better understanding, check out the [Simple Tweening example](../examples/basic/simple_tweening.html).
		 *
		 * Instead of supplying a tween this method can also be used as a shorthand for `TweenMax.to()` (see example below).
		 * @memberof! animation.GSAP#
		 *
		 * @example
		 * // add a single tween directly
		 * scene.setTween(TweenMax.to("obj"), 1, {x: 100});
		 *
		 * // add a single tween via variable
		 * var tween = TweenMax.to("obj"), 1, {x: 100};
		 * scene.setTween(tween);
		 *
		 * // add multiple tweens, wrapped in a timeline.
		 * var timeline = new TimelineMax();
		 * var tween1 = TweenMax.from("obj1", 1, {x: 100});
		 * var tween2 = TweenMax.to("obj2", 1, {y: 100});
		 * timeline
		 *		.add(tween1)
		 *		.add(tween2);
		 * scene.addTween(timeline);
		 *
		 * // short hand to add a TweenMax.to() tween
		 * scene.setTween("obj3", 0.5, {y: 100});
		 *
		 * // short hand to add a TweenMax.to() tween for 1 second
		 * // this is useful, when the scene has a duration and the tween duration isn't important anyway
		 * scene.setTween("obj3", {y: 100});
		 *
		 * @param {(object|string)} TweenObject - A TweenMax, TweenLite, TimelineMax or TimelineLite object that should be animated in the scene. Can also be a Dom Element or Selector, when using direct tween definition (see examples).
		 * @param {(number|object)} duration - A duration for the tween, or tween parameters. If an object containing parameters are supplied, a default duration of 1 will be used.
		 * @param {object} params - The parameters for the tween
		 * @returns {Scene} Parent object for chaining.
		 */
		Scene.setTween = function (TweenObject, duration, params) {
			var newTween;
			if (arguments.length > 1) {
				if (arguments.length < 3) {
					params = duration;
					duration = 1;
				}
				TweenObject = Tween.to(TweenObject, duration, params);
			}
			try {
				// wrap Tween into a Timeline Object if available to include delay and repeats in the duration and standardize methods.
				if (Timeline) {
					newTween = new Timeline({
							smoothChildTiming: true
						})
						.add(TweenObject);
				} else {
					newTween = TweenObject;
				}
				newTween.pause();
			} catch (e) {
				log(1, "ERROR calling method 'setTween()': Supplied argument is not a valid TweenObject");
				return Scene;
			}
			if (_tween) { // kill old tween?
				Scene.removeTween();
			}
			_tween = newTween;

			// some properties need to be transferred it to the wrapper, otherwise they would get lost.
			if (TweenObject.repeat && TweenObject.repeat() === -1) { // TweenMax or TimelineMax Object?
				_tween.repeat(-1);
				_tween.yoyo(TweenObject.yoyo());
			}
			// Some tween validations and debugging helpers

			if (Scene.tweenChanges() && !_tween.tweenTo) {
				log(2, "WARNING: tweenChanges will only work if the TimelineMax object is available for ScrollMagic.");
			}

			// check if there are position tweens defined for the trigger and warn about it :)
			if (_tween && Scene.controller() && Scene.triggerElement() && Scene.loglevel() >= 2) { // controller is needed to know scroll direction.
				var
					triggerTweens = Tween.getTweensOf(Scene.triggerElement()),
					vertical = Scene.controller().info("vertical");
				triggerTweens.forEach(function (value, index) {
					var
						tweenvars = value.vars.css || value.vars,
						condition = vertical ? (tweenvars.top !== undefined || tweenvars.bottom !== undefined) : (tweenvars.left !== undefined || tweenvars.right !== undefined);
					if (condition) {
						log(2, "WARNING: Tweening the position of the trigger element affects the scene timing and should be avoided!");
						return false;
					}
				});
			}

			// warn about tween overwrites, when an element is tweened multiple times
			if (parseFloat(TweenLite.version) >= 1.14) { // onOverwrite only present since GSAP v1.14.0
				var
					list = _tween.getChildren ? _tween.getChildren(true, true, false) : [_tween], // get all nested tween objects
					newCallback = function () {
						log(2, "WARNING: tween was overwritten by another. To learn how to avoid this issue see here: https://github.com/janpaepke/ScrollMagic/wiki/WARNING:-tween-was-overwritten-by-another");
					};
				for (var i = 0, thisTween, oldCallback; i < list.length; i++) {
					/*jshint loopfunc: true */
					thisTween = list[i];
					if (oldCallback !== newCallback) { // if tweens is added more than once
						oldCallback = thisTween.vars.onOverwrite;
						thisTween.vars.onOverwrite = function () {
							if (oldCallback) {
								oldCallback.apply(this, arguments);
							}
							newCallback.apply(this, arguments);
						};
					}
				}
			}
			log(3, "added tween");

			updateTweenProgress();
			return Scene;
		};

		/**
		 * Remove the tween from the scene.  
		 * This will terminate the control of the Scene over the tween.
		 *
		 * Using the reset option you can decide if the tween should remain in the current state or be rewound to set the target elements back to the state they were in before the tween was added to the scene.
		 * @memberof! animation.GSAP#
		 *
		 * @example
		 * // remove the tween from the scene without resetting it
		 * scene.removeTween();
		 *
		 * // remove the tween from the scene and reset it to initial position
		 * scene.removeTween(true);
		 *
		 * @param {boolean} [reset=false] - If `true` the tween will be reset to its initial values.
		 * @returns {Scene} Parent object for chaining.
		 */
		Scene.removeTween = function (reset) {
			if (_tween) {
				if (reset) {
					_tween.progress(0).pause();
				}
				_tween.kill();
				_tween = undefined;
				log(3, "removed tween (reset: " + (reset ? "true" : "false") + ")");
			}
			return Scene;
		};

	});
}));
!function(e,t){if("function"==typeof define&&define.amd)define(["exports"],t);else if("undefined"!=typeof exports)t(exports);else{var o={};t(o),e.bodyScrollLock=o}}(this,function(exports){"use strict";function r(e){if(Array.isArray(e)){for(var t=0,o=Array(e.length);t<e.length;t++)o[t]=e[t];return o}return Array.from(e)}Object.defineProperty(exports,"__esModule",{value:!0});var l=!1;if("undefined"!=typeof window){var e={get passive(){l=!0}};window.addEventListener("testPassive",null,e),window.removeEventListener("testPassive",null,e)}var d="undefined"!=typeof window&&window.navigator&&window.navigator.platform&&/iP(ad|hone|od)/.test(window.navigator.platform),c=[],u=!1,a=-1,s=void 0,v=void 0,f=function(t){return c.some(function(e){return!(!e.options.allowTouchMove||!e.options.allowTouchMove(t))})},m=function(e){var t=e||window.event;return!!f(t.target)||(1<t.touches.length||(t.preventDefault&&t.preventDefault(),!1))},o=function(){setTimeout(function(){void 0!==v&&(document.body.style.paddingRight=v,v=void 0),void 0!==s&&(document.body.style.overflow=s,s=void 0)})};exports.disableBodyScroll=function(i,e){if(d){if(!i)return void console.error("disableBodyScroll unsuccessful - targetElement must be provided when calling disableBodyScroll on IOS devices.");if(i&&!c.some(function(e){return e.targetElement===i})){var t={targetElement:i,options:e||{}};c=[].concat(r(c),[t]),i.ontouchstart=function(e){1===e.targetTouches.length&&(a=e.targetTouches[0].clientY)},i.ontouchmove=function(e){var t,o,n,r;1===e.targetTouches.length&&(o=i,r=(t=e).targetTouches[0].clientY-a,!f(t.target)&&(o&&0===o.scrollTop&&0<r?m(t):(n=o)&&n.scrollHeight-n.scrollTop<=n.clientHeight&&r<0?m(t):t.stopPropagation()))},u||(document.addEventListener("touchmove",m,l?{passive:!1}:void 0),u=!0)}}else{n=e,setTimeout(function(){if(void 0===v){var e=!!n&&!0===n.reserveScrollBarGap,t=window.innerWidth-document.documentElement.clientWidth;e&&0<t&&(v=document.body.style.paddingRight,document.body.style.paddingRight=t+"px")}void 0===s&&(s=document.body.style.overflow,document.body.style.overflow="hidden")});var o={targetElement:i,options:e||{}};c=[].concat(r(c),[o])}var n},exports.clearAllBodyScrollLocks=function(){d?(c.forEach(function(e){e.targetElement.ontouchstart=null,e.targetElement.ontouchmove=null}),u&&(document.removeEventListener("touchmove",m,l?{passive:!1}:void 0),u=!1),c=[],a=-1):(o(),c=[])},exports.enableBodyScroll=function(t){if(d){if(!t)return void console.error("enableBodyScroll unsuccessful - targetElement must be provided when calling enableBodyScroll on IOS devices.");t.ontouchstart=null,t.ontouchmove=null,c=c.filter(function(e){return e.targetElement!==t}),u&&0===c.length&&(document.removeEventListener("touchmove",m,l?{passive:!1}:void 0),u=!1)}else(c=c.filter(function(e){return e.targetElement!==t})).length||o()}});
// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @externs_url https://raw.githubusercontent.com/google/closure-compiler/master/contrib/externs/maps/google_maps_api_v3_16.js
// ==/ClosureCompiler==

/**
 * @name CSS3 InfoBubble with tabs for Google Maps API V3
 * @version 0.8
 * @author Luke Mahe
 * @fileoverview
 * This library is a CSS Infobubble with tabs. It uses css3 rounded corners and
 * drop shadows and animations. It also allows tabs
 */

/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * A CSS3 InfoBubble v0.8
 * @param {Object.<string, *>=} opt_options Optional properties to set.
 * @extends {google.maps.OverlayView}
 * @constructor
 */
function InfoBubble(opt_options) {
  this.extend(InfoBubble, google.maps.OverlayView);
  this.tabs_ = [];
  this.activeTab_ = null;
  this.baseZIndex_ = 100;
  this.isOpen_ = false;

  var options = opt_options || {};

  if (options['backgroundColor'] == undefined) {
    options['backgroundColor'] = this.BACKGROUND_COLOR_;
  }

  if (options['borderColor'] == undefined) {
    options['borderColor'] = this.BORDER_COLOR_;
  }

  if (options['borderRadius'] == undefined) {
    options['borderRadius'] = this.BORDER_RADIUS_;
  }

  if (options['borderWidth'] == undefined) {
    options['borderWidth'] = this.BORDER_WIDTH_;
  }

  if (options['padding'] == undefined) {
    options['padding'] = this.PADDING_;
  }

  if (options['arrowPosition'] == undefined) {
    options['arrowPosition'] = this.ARROW_POSITION_;
  }

  if (options['disableAutoPan'] == undefined) {
    options['disableAutoPan'] = false;
  }

  if (options['disableAnimation'] == undefined) {
    options['disableAnimation'] = false;
  }

  if (options['minWidth'] == undefined) {
    options['minWidth'] = this.MIN_WIDTH_;
  }

  if (options['shadowStyle'] == undefined) {
    options['shadowStyle'] = this.SHADOW_STYLE_;
  }

  if (options['arrowSize'] == undefined) {
    options['arrowSize'] = this.ARROW_SIZE_;
  }

  if (options['arrowStyle'] == undefined) {
    options['arrowStyle'] = this.ARROW_STYLE_;
  }

  if (options['closeSrc'] == undefined) {
    options['closeSrc'] = this.CLOSE_SRC_;
  }

  this.buildDom_();
  this.setValues(options);
}
window['InfoBubble'] = InfoBubble;


/**
 * Default arrow size
 * @const
 * @private
 */
InfoBubble.prototype.ARROW_SIZE_ = 15;


/**
 * Default arrow style
 * @const
 * @private
 */
InfoBubble.prototype.ARROW_STYLE_ = 0;


/**
 * Default shadow style
 * @const
 * @private
 */
InfoBubble.prototype.SHADOW_STYLE_ = 1;


/**
 * Default min width
 * @const
 * @private
 */
InfoBubble.prototype.MIN_WIDTH_ = 50;


/**
 * Default arrow position
 * @const
 * @private
 */
InfoBubble.prototype.ARROW_POSITION_ = 50;


/**
 * Default padding
 * @const
 * @private
 */
InfoBubble.prototype.PADDING_ = 10;


/**
 * Default border width
 * @const
 * @private
 */
InfoBubble.prototype.BORDER_WIDTH_ = 1;


/**
 * Default border color
 * @const
 * @private
 */
InfoBubble.prototype.BORDER_COLOR_ = '#ccc';


/**
 * Default border radius
 * @const
 * @private
 */
InfoBubble.prototype.BORDER_RADIUS_ = 10;


/**
 * Default background color
 * @const
 * @private
 */
InfoBubble.prototype.BACKGROUND_COLOR_ = '#fff';

/**
 * Default close image source
 * @const
 * @private
 */
InfoBubble.prototype.CLOSE_SRC_ = 'https://maps.gstatic.com/intl/en_us/mapfiles/iw_close.gif';

/**
 * Extends a objects prototype by anothers.
 *
 * @param {Object} obj1 The object to be extended.
 * @param {Object} obj2 The object to extend with.
 * @return {Object} The new extended object.
 * @ignore
 */
InfoBubble.prototype.extend = function(obj1, obj2) {
  return (function(object) {
    for (var property in object.prototype) {
      this.prototype[property] = object.prototype[property];
    }
    return this;
  }).apply(obj1, [obj2]);
};


/**
 * Builds the InfoBubble dom
 * @private
 */
InfoBubble.prototype.buildDom_ = function() {
  var bubble = this.bubble_ = document.createElement('DIV');
  bubble.style['position'] = 'absolute';
  bubble.style['zIndex'] = this.baseZIndex_;

  var tabsContainer = this.tabsContainer_ = document.createElement('DIV');
  tabsContainer.style['position'] = 'relative';

  // Close button
  var close = this.close_ = document.createElement('IMG');
  close.style['position'] = 'absolute';
  close.style['border'] = 0;
  close.style['zIndex'] = this.baseZIndex_ + 1;
  close.style['cursor'] = 'pointer';
  close.className = 'js-info-bubble-close';
  close.src = this.get('closeSrc');

  var that = this;
  google.maps.event.addDomListener(close, 'click', function() {
    that.close();
    google.maps.event.trigger(that, 'closeclick');
  });

  // Content area
  var contentContainer = this.contentContainer_ = document.createElement('DIV');
  contentContainer.style['overflowX'] = 'auto';
  contentContainer.style['overflowY'] = 'auto';
  contentContainer.style['cursor'] = 'default';
  contentContainer.style['clear'] = 'both';
  contentContainer.style['position'] = 'relative';

  var content = this.content_ = document.createElement('DIV');
  contentContainer.appendChild(content);

  // Arrow
  var arrow = this.arrow_ = document.createElement('DIV');
  arrow.style['position'] = 'relative';

  var arrowOuter = this.arrowOuter_ = document.createElement('DIV');
  var arrowInner = this.arrowInner_ = document.createElement('DIV');

  var arrowSize = this.getArrowSize_();

  arrowOuter.style['position'] = arrowInner.style['position'] = 'absolute';
  arrowOuter.style['left'] = arrowInner.style['left'] = '50%';
  arrowOuter.style['height'] = arrowInner.style['height'] = '0';
  arrowOuter.style['width'] = arrowInner.style['width'] = '0';
  arrowOuter.style['marginLeft'] = this.px(-arrowSize);
  arrowOuter.style['borderWidth'] = this.px(arrowSize);
  arrowOuter.style['borderBottomWidth'] = 0;

  // Shadow
  var bubbleShadow = this.bubbleShadow_ = document.createElement('DIV');
  bubbleShadow.style['position'] = 'absolute';

  // Hide the InfoBubble by default
  bubble.style['display'] = bubbleShadow.style['display'] = 'none';

  bubble.appendChild(this.tabsContainer_);
  bubble.appendChild(close);
  bubble.appendChild(contentContainer);
  arrow.appendChild(arrowOuter);
  arrow.appendChild(arrowInner);
  bubble.appendChild(arrow);

  var stylesheet = document.createElement('style');
  stylesheet.setAttribute('type', 'text/css');

  /**
   * The animation for the infobubble
   * @type {string}
   */
  this.animationName_ = '_ibani_' + Math.round(Math.random() * 10000);

  var css = '.' + this.animationName_ + '{-webkit-animation-name:' +
      this.animationName_ + ';-webkit-animation-duration:0.4s;' +
      '-webkit-animation-iteration-count:1;}' +
      '@-webkit-keyframes ' + this.animationName_ + ' {from {-webkit-transform: scale(0)}to {-webkit-transform: scale(1)}}';

  stylesheet.textContent = css;
  document.getElementsByTagName('head')[0].appendChild(stylesheet);
};


/**
 * Sets the background class name
 *
 * @param {string} className The class name to set.
 */
InfoBubble.prototype.setBackgroundClassName = function(className) {
  this.set('backgroundClassName', className);
};
InfoBubble.prototype['setBackgroundClassName'] = InfoBubble.prototype.setBackgroundClassName;


/**
 * changed MVC callback
 */
InfoBubble.prototype.backgroundClassName_changed = function() {
  this.content_.className = this.get('backgroundClassName');
};
InfoBubble.prototype['backgroundClassName_changed'] = InfoBubble.prototype.backgroundClassName_changed;


/**
 * Sets the class of the tab
 *
 * @param {string} className the class name to set.
 */
InfoBubble.prototype.setTabClassName = function(className) {
  this.set('tabClassName', className);
};
InfoBubble.prototype['setTabClassName'] = InfoBubble.prototype.setTabClassName;


/**
 * tabClassName changed MVC callback
 */
InfoBubble.prototype.tabClassName_changed = function() {
  this.updateTabStyles_();
};
InfoBubble.prototype['tabClassName_changed'] = InfoBubble.prototype.tabClassName_changed;


/**
 * Gets the style of the arrow
 *
 * @private
 * @return {number} The style of the arrow.
 */
InfoBubble.prototype.getArrowStyle_ = function() {
  return parseInt(this.get('arrowStyle'), 10) || 0;
};


/**
 * Sets the style of the arrow
 *
 * @param {number} style The style of the arrow.
 */
InfoBubble.prototype.setArrowStyle = function(style) {
  this.set('arrowStyle', style);
};
InfoBubble.prototype['setArrowStyle'] = InfoBubble.prototype.setArrowStyle;


/**
 * Arrow style changed MVC callback
 */
InfoBubble.prototype.arrowStyle_changed = function() {
  this.arrowSize_changed();
};
InfoBubble.prototype['arrowStyle_changed'] = InfoBubble.prototype.arrowStyle_changed;


/**
 * Gets the size of the arrow
 *
 * @private
 * @return {number} The size of the arrow.
 */
InfoBubble.prototype.getArrowSize_ = function() {
  return parseInt(this.get('arrowSize'), 10) || 0;
};


/**
 * Sets the size of the arrow
 *
 * @param {number} size The size of the arrow.
 */
InfoBubble.prototype.setArrowSize = function(size) {
  this.set('arrowSize', size);
};
InfoBubble.prototype['setArrowSize'] = InfoBubble.prototype.setArrowSize;


/**
 * Arrow size changed MVC callback
 */
InfoBubble.prototype.arrowSize_changed = function() {
  this.borderWidth_changed();
};
InfoBubble.prototype['arrowSize_changed'] = InfoBubble.prototype.arrowSize_changed;


/**
 * Set the position of the InfoBubble arrow
 *
 * @param {number} pos The position to set.
 */
InfoBubble.prototype.setArrowPosition = function(pos) {
  this.set('arrowPosition', pos);
};
InfoBubble.prototype['setArrowPosition'] = InfoBubble.prototype.setArrowPosition;


/**
 * Get the position of the InfoBubble arrow
 *
 * @private
 * @return {number} The position..
 */
InfoBubble.prototype.getArrowPosition_ = function() {
  return parseInt(this.get('arrowPosition'), 10) || 0;
};


/**
 * arrowPosition changed MVC callback
 */
InfoBubble.prototype.arrowPosition_changed = function() {
  var pos = this.getArrowPosition_();
  this.arrowOuter_.style['left'] = this.arrowInner_.style['left'] = pos + '%';

  this.redraw_();
};
InfoBubble.prototype['arrowPosition_changed'] = InfoBubble.prototype.arrowPosition_changed;


/**
 * Set the zIndex of the InfoBubble
 *
 * @param {number} zIndex The zIndex to set.
 */
InfoBubble.prototype.setZIndex = function(zIndex) {
  this.set('zIndex', zIndex);
};
InfoBubble.prototype['setZIndex'] = InfoBubble.prototype.setZIndex;


/**
 * Get the zIndex of the InfoBubble
 *
 * @return {number} The zIndex to set.
 */
InfoBubble.prototype.getZIndex = function() {
  return parseInt(this.get('zIndex'), 10) || this.baseZIndex_;
};


/**
 * zIndex changed MVC callback
 */
InfoBubble.prototype.zIndex_changed = function() {
  var zIndex = this.getZIndex();

  this.bubble_.style['zIndex'] = this.baseZIndex_ = zIndex;
  this.close_.style['zIndex'] = zIndex + 1;
};
InfoBubble.prototype['zIndex_changed'] = InfoBubble.prototype.zIndex_changed;


/**
 * Set the style of the shadow
 *
 * @param {number} shadowStyle The style of the shadow.
 */
InfoBubble.prototype.setShadowStyle = function(shadowStyle) {
  this.set('shadowStyle', shadowStyle);
};
InfoBubble.prototype['setShadowStyle'] = InfoBubble.prototype.setShadowStyle;


/**
 * Get the style of the shadow
 *
 * @private
 * @return {number} The style of the shadow.
 */
InfoBubble.prototype.getShadowStyle_ = function() {
  return parseInt(this.get('shadowStyle'), 10) || 0;
};


/**
 * shadowStyle changed MVC callback
 */
InfoBubble.prototype.shadowStyle_changed = function() {
  var shadowStyle = this.getShadowStyle_();

  var display = '';
  var shadow = '';
  var backgroundColor = '';
  switch (shadowStyle) {
    case 0:
      display = 'none';
      break;
    case 1:
      shadow = '40px 15px 10px rgba(33,33,33,0.3)';
      backgroundColor = 'transparent';
      break;
    case 2:
      shadow = '0 0 2px rgba(33,33,33,0.3)';
      backgroundColor = 'rgba(33,33,33,0.35)';
      break;
  }
  this.bubbleShadow_.style['boxShadow'] =
      this.bubbleShadow_.style['webkitBoxShadow'] =
      this.bubbleShadow_.style['MozBoxShadow'] = shadow;
  this.bubbleShadow_.style['backgroundColor'] = backgroundColor;
  if (this.isOpen_) {
    this.bubbleShadow_.style['display'] = display;
    this.draw();
  }
};
InfoBubble.prototype['shadowStyle_changed'] = InfoBubble.prototype.shadowStyle_changed;


/**
 * Show the close button
 */
InfoBubble.prototype.showCloseButton = function() {
  this.set('hideCloseButton', false);
};
InfoBubble.prototype['showCloseButton'] = InfoBubble.prototype.showCloseButton;


/**
 * Hide the close button
 */
InfoBubble.prototype.hideCloseButton = function() {
  this.set('hideCloseButton', true);
};
InfoBubble.prototype['hideCloseButton'] = InfoBubble.prototype.hideCloseButton;


/**
 * hideCloseButton changed MVC callback
 */
InfoBubble.prototype.hideCloseButton_changed = function() {
  this.close_.style['display'] = this.get('hideCloseButton') ? 'none' : '';
};
InfoBubble.prototype['hideCloseButton_changed'] = InfoBubble.prototype.hideCloseButton_changed;


/**
 * Set the background color
 *
 * @param {string} color The color to set.
 */
InfoBubble.prototype.setBackgroundColor = function(color) {
  if (color) {
    this.set('backgroundColor', color);
  }
};
InfoBubble.prototype['setBackgroundColor'] = InfoBubble.prototype.setBackgroundColor;


/**
 * backgroundColor changed MVC callback
 */
InfoBubble.prototype.backgroundColor_changed = function() {
  var backgroundColor = this.get('backgroundColor');
  this.contentContainer_.style['backgroundColor'] = backgroundColor;

  this.arrowInner_.style['borderColor'] = backgroundColor +
      ' transparent transparent';
  this.updateTabStyles_();
};
InfoBubble.prototype['backgroundColor_changed'] = InfoBubble.prototype.backgroundColor_changed;


/**
 * Set the border color
 *
 * @param {string} color The border color.
 */
InfoBubble.prototype.setBorderColor = function(color) {
  if (color) {
    this.set('borderColor', color);
  }
};
InfoBubble.prototype['setBorderColor'] = InfoBubble.prototype.setBorderColor;


/**
 * borderColor changed MVC callback
 */
InfoBubble.prototype.borderColor_changed = function() {
  var borderColor = this.get('borderColor');

  var contentContainer = this.contentContainer_;
  var arrowOuter = this.arrowOuter_;
  contentContainer.style['borderColor'] = borderColor;

  arrowOuter.style['borderColor'] = borderColor +
      ' transparent transparent';

  contentContainer.style['borderStyle'] =
      arrowOuter.style['borderStyle'] =
      this.arrowInner_.style['borderStyle'] = 'solid';

  this.updateTabStyles_();
};
InfoBubble.prototype['borderColor_changed'] = InfoBubble.prototype.borderColor_changed;


/**
 * Set the radius of the border
 *
 * @param {number} radius The radius of the border.
 */
InfoBubble.prototype.setBorderRadius = function(radius) {
  this.set('borderRadius', radius);
};
InfoBubble.prototype['setBorderRadius'] = InfoBubble.prototype.setBorderRadius;


/**
 * Get the radius of the border
 *
 * @private
 * @return {number} The radius of the border.
 */
InfoBubble.prototype.getBorderRadius_ = function() {
  return parseInt(this.get('borderRadius'), 10) || 0;
};


/**
 * borderRadius changed MVC callback
 */
InfoBubble.prototype.borderRadius_changed = function() {
  var borderRadius = this.getBorderRadius_();
  var borderWidth = this.getBorderWidth_();

  this.contentContainer_.style['borderRadius'] =
      this.contentContainer_.style['MozBorderRadius'] =
      this.contentContainer_.style['webkitBorderRadius'] =
      this.bubbleShadow_.style['borderRadius'] =
      this.bubbleShadow_.style['MozBorderRadius'] =
      this.bubbleShadow_.style['webkitBorderRadius'] = this.px(borderRadius);

  this.tabsContainer_.style['paddingLeft'] =
      this.tabsContainer_.style['paddingRight'] =
      this.px(borderRadius + borderWidth);

  this.redraw_();
};
InfoBubble.prototype['borderRadius_changed'] = InfoBubble.prototype.borderRadius_changed;


/**
 * Get the width of the border
 *
 * @private
 * @return {number} width The width of the border.
 */
InfoBubble.prototype.getBorderWidth_ = function() {
  return parseInt(this.get('borderWidth'), 10) || 0;
};


/**
 * Set the width of the border
 *
 * @param {number} width The width of the border.
 */
InfoBubble.prototype.setBorderWidth = function(width) {
  this.set('borderWidth', width);
};
InfoBubble.prototype['setBorderWidth'] = InfoBubble.prototype.setBorderWidth;


/**
 * borderWidth change MVC callback
 */
InfoBubble.prototype.borderWidth_changed = function() {
  var borderWidth = this.getBorderWidth_();

  this.contentContainer_.style['borderWidth'] = this.px(borderWidth);
  this.tabsContainer_.style['top'] = this.px(borderWidth);

  this.updateArrowStyle_();
  this.updateTabStyles_();
  this.borderRadius_changed();
  this.redraw_();
};
InfoBubble.prototype['borderWidth_changed'] = InfoBubble.prototype.borderWidth_changed;


/**
 * Update the arrow style
 * @private
 */
InfoBubble.prototype.updateArrowStyle_ = function() {
  var borderWidth = this.getBorderWidth_();
  var arrowSize = this.getArrowSize_();
  var arrowStyle = this.getArrowStyle_();
  var arrowOuterSizePx = this.px(arrowSize);
  var arrowInnerSizePx = this.px(Math.max(0, arrowSize - borderWidth));

  var outer = this.arrowOuter_;
  var inner = this.arrowInner_;

  this.arrow_.style['marginTop'] = this.px(-borderWidth);
  outer.style['borderTopWidth'] = arrowOuterSizePx;
  inner.style['borderTopWidth'] = arrowInnerSizePx;

  // Full arrow or arrow pointing to the left
  if (arrowStyle == 0 || arrowStyle == 1) {
    outer.style['borderLeftWidth'] = arrowOuterSizePx;
    inner.style['borderLeftWidth'] = arrowInnerSizePx;
  } else {
    outer.style['borderLeftWidth'] = inner.style['borderLeftWidth'] = 0;
  }

  // Full arrow or arrow pointing to the right
  if (arrowStyle == 0 || arrowStyle == 2) {
    outer.style['borderRightWidth'] = arrowOuterSizePx;
    inner.style['borderRightWidth'] = arrowInnerSizePx;
  } else {
    outer.style['borderRightWidth'] = inner.style['borderRightWidth'] = 0;
  }

  if (arrowStyle < 2) {
    outer.style['marginLeft'] = this.px(-(arrowSize));
    inner.style['marginLeft'] = this.px(-(arrowSize - borderWidth));
  } else {
    outer.style['marginLeft'] = inner.style['marginLeft'] = 0;
  }

  // If there is no border then don't show thw outer arrow
  if (borderWidth == 0) {
    outer.style['display'] = 'none';
  } else {
    outer.style['display'] = '';
  }
};


/**
 * Set the padding of the InfoBubble
 *
 * @param {number} padding The padding to apply.
 */
InfoBubble.prototype.setPadding = function(padding) {
  this.set('padding', padding);
};
InfoBubble.prototype['setPadding'] = InfoBubble.prototype.setPadding;


/**
 * Set the close image url
 *
 * @param {string} src The url of the image used as a close icon
 */
InfoBubble.prototype.setCloseSrc = function(src) {
  if (src && this.close_) {
    this.close_.src = src;
  }
};
InfoBubble.prototype['setCloseSrc'] = InfoBubble.prototype.setCloseSrc;


/**
 * Set the padding of the InfoBubble
 *
 * @private
 * @return {number} padding The padding to apply.
 */
InfoBubble.prototype.getPadding_ = function() {
  return parseInt(this.get('padding'), 10) || 0;
};


/**
 * padding changed MVC callback
 */
InfoBubble.prototype.padding_changed = function() {
  var padding = this.getPadding_();
  this.contentContainer_.style['padding'] = this.px(padding);
  this.updateTabStyles_();

  this.redraw_();
};
InfoBubble.prototype['padding_changed'] = InfoBubble.prototype.padding_changed;


/**
 * Add px extention to the number
 *
 * @param {number} num The number to wrap.
 * @return {string|number} A wrapped number.
 */
InfoBubble.prototype.px = function(num) {
  if (num) {
    // 0 doesn't need to be wrapped
    return num + 'px';
  }
  return num;
};


/**
 * Add events to stop propagation
 * @private
 */
InfoBubble.prototype.addEvents_ = function() {
  // We want to cancel all the events so they do not go to the map
  var events = ['mousedown', 'mousemove', 'mouseover', 'mouseout', 'mouseup',
      'mousewheel', 'DOMMouseScroll', 'touchstart', 'touchend', 'touchmove',
      'dblclick', 'contextmenu', 'click'];

  var bubble = this.bubble_;
  this.listeners_ = [];
  for (var i = 0, event; event = events[i]; i++) {
    this.listeners_.push(
      google.maps.event.addDomListener(bubble, event, function(e) {
        e.cancelBubble = true;
        if (e.stopPropagation) {
          e.stopPropagation();
        }
      })
    );
  }
};


/**
 * On Adding the InfoBubble to a map
 * Implementing the OverlayView interface
 */
InfoBubble.prototype.onAdd = function() {
  if (!this.bubble_) {
    this.buildDom_();
  }

  this.addEvents_();

  var panes = this.getPanes();
  if (panes) {
    panes.floatPane.appendChild(this.bubble_);
    panes.floatShadow.appendChild(this.bubbleShadow_);
  }

  /* once the infoBubble has been added to the DOM, fire 'domready' event */
  google.maps.event.trigger(this, 'domready');
};
InfoBubble.prototype['onAdd'] = InfoBubble.prototype.onAdd;


/**
 * Draw the InfoBubble
 * Implementing the OverlayView interface
 */
InfoBubble.prototype.draw = function() {
  var projection = this.getProjection();

  if (!projection) {
    // The map projection is not ready yet so do nothing
    return;
  }

  var latLng = /** @type {google.maps.LatLng} */ (this.get('position'));

  if (!latLng) {
    this.close();
    return;
  }

  var tabHeight = 0;

  if (this.activeTab_) {
    tabHeight = this.activeTab_.offsetHeight;
  }

  var anchorHeight = this.getAnchorHeight_();
  var arrowSize = this.getArrowSize_();
  var arrowPosition = this.getArrowPosition_();

  arrowPosition = arrowPosition / 100;

  var pos = projection.fromLatLngToDivPixel(latLng);
  var width = this.contentContainer_.offsetWidth;
  var height = this.bubble_.offsetHeight;

  if (!width) {
    return;
  }

  // Adjust for the height of the info bubble
  var top = pos.y + (height / 2);

  if (anchorHeight) {
    // If there is an anchor then include the height
    top -= anchorHeight;
  }

  var left = pos.x - width;

  this.bubble_.style['top'] = this.px(top);
  this.bubble_.style['left'] = this.px(left);

  var shadowStyle = parseInt(this.get('shadowStyle'), 10);

  switch (shadowStyle) {
    case 1:
      // Shadow is behind
      this.bubbleShadow_.style['top'] = this.px(top + tabHeight - 1);
      this.bubbleShadow_.style['left'] = this.px(left);
      this.bubbleShadow_.style['width'] = this.px(width);
      this.bubbleShadow_.style['height'] =
          this.px(this.contentContainer_.offsetHeight - arrowSize);
      break;
    case 2:
      // Shadow is below
      width = width * 0.8;
      if (anchorHeight) {
        this.bubbleShadow_.style['top'] = this.px(pos.y);
      } else {
        this.bubbleShadow_.style['top'] = this.px(pos.y + arrowSize);
      }
      this.bubbleShadow_.style['left'] = this.px(pos.x - width * arrowPosition);

      this.bubbleShadow_.style['width'] = this.px(width);
      this.bubbleShadow_.style['height'] = this.px(2);
      break;
  }
};
InfoBubble.prototype['draw'] = InfoBubble.prototype.draw;


/**
 * Removing the InfoBubble from a map
 */
InfoBubble.prototype.onRemove = function() {
  if (this.bubble_ && this.bubble_.parentNode) {
    this.bubble_.parentNode.removeChild(this.bubble_);
  }
  if (this.bubbleShadow_ && this.bubbleShadow_.parentNode) {
    this.bubbleShadow_.parentNode.removeChild(this.bubbleShadow_);
  }

  for (var i = 0, listener; listener = this.listeners_[i]; i++) {
    google.maps.event.removeListener(listener);
  }
};
InfoBubble.prototype['onRemove'] = InfoBubble.prototype.onRemove;


/**
 * Is the InfoBubble open
 *
 * @return {boolean} If the InfoBubble is open.
 */
InfoBubble.prototype.isOpen = function() {
  return this.isOpen_;
};
InfoBubble.prototype['isOpen'] = InfoBubble.prototype.isOpen;


/**
 * Close the InfoBubble
 */
InfoBubble.prototype.close = function() {
  if (this.bubble_) {
    this.bubble_.style['display'] = 'none';
    // Remove the animation so we next time it opens it will animate again
    this.bubble_.className =
        this.bubble_.className.replace(this.animationName_, '');
  }

  if (this.bubbleShadow_) {
    this.bubbleShadow_.style['display'] = 'none';
    this.bubbleShadow_.className =
        this.bubbleShadow_.className.replace(this.animationName_, '');
  }
  this.isOpen_ = false;
};
InfoBubble.prototype['close'] = InfoBubble.prototype.close;


/**
 * Open the InfoBubble (asynchronous).
 *
 * @param {google.maps.Map=} opt_map Optional map to open on.
 * @param {google.maps.MVCObject=} opt_anchor Optional anchor to position at.
 */
InfoBubble.prototype.open = function(opt_map, opt_anchor) {
  var that = this;
  window.setTimeout(function() {
    that.open_(opt_map, opt_anchor);
  }, 0);
};


/**
 * Open the InfoBubble
 * @private
 * @param {google.maps.Map=} opt_map Optional map to open on.
 * @param {google.maps.MVCObject=} opt_anchor Optional anchor to position at.
 */
InfoBubble.prototype.open_ = function(opt_map, opt_anchor) {
  this.updateContent_();

  if (opt_map) {
    this.setMap(opt_map);
  }

  if (opt_anchor) {
    this.set('anchor', opt_anchor);
    this.bindTo('anchorPoint', opt_anchor);
    this.bindTo('position', opt_anchor);
  }

  // Show the bubble and the show
  this.bubble_.style['display'] = this.bubbleShadow_.style['display'] = '';
  var animation = !this.get('disableAnimation');

  if (animation) {
    // Add the animation
    this.bubble_.className += ' ' + this.animationName_;
    this.bubbleShadow_.className += ' ' + this.animationName_;
  }

  this.redraw_();
  this.isOpen_ = true;

  var pan = !this.get('disableAutoPan');
  if (pan) {
    var that = this;
    window.setTimeout(function() {
      // Pan into view, done in a time out to make it feel nicer :)
      // that.panToView();
    }, 200);
  }
};
InfoBubble.prototype['open'] = InfoBubble.prototype.open;


/**
 * Set the position of the InfoBubble
 *
 * @param {google.maps.LatLng} position The position to set.
 */
InfoBubble.prototype.setPosition = function(position) {
  if (position) {
    this.set('position', position);
  }
};
InfoBubble.prototype['setPosition'] = InfoBubble.prototype.setPosition;


/**
 * Returns the position of the InfoBubble
 *
 * @return {google.maps.LatLng} the position.
 */
InfoBubble.prototype.getPosition = function() {
  return /** @type {google.maps.LatLng} */ (this.get('position'));
};
InfoBubble.prototype['getPosition'] = InfoBubble.prototype.getPosition;


/**
 * position changed MVC callback
 */
InfoBubble.prototype.position_changed = function() {
  this.draw();
};
InfoBubble.prototype['position_changed'] = InfoBubble.prototype.position_changed;


/**
 * Pan the InfoBubble into view
//  */
// InfoBubble.prototype.panToView = function() {
//   var projection = this.getProjection();

//   if (!projection) {
//     // The map projection is not ready yet so do nothing
//     return;
//   }

//   if (!this.bubble_) {
//     // No Bubble yet so do nothing
//     return;
//   }

//   var anchorHeight = this.getAnchorHeight_();
//   var height = this.bubble_.offsetHeight + anchorHeight;
//   var map = this.get('map');
//   var mapDiv = map.getDiv();
//   var mapHeight = mapDiv.offsetHeight;

//   var latLng = this.getPosition();
//   // var centerPos = projection.fromLatLngToContainerPixel(map.getCenter());
//   var pos = projection.fromLatLngToContainerPixel(latLng);

//   // Find out how much space at the top is free
//   // var spaceTop = centerPos.y - height;

//   // Fine out how much space at the bottom is free
//   // var spaceBottom = mapHeight - centerPos.y;

//   var needsTop = spaceTop < 0;
//   var deltaY = 0;

//   if (needsTop) {
//     spaceTop *= -1;
//     deltaY = (spaceTop + spaceBottom) / 2;
//   }

//   pos.y -= deltaY;
//   latLng = projection.fromContainerPixelToLatLng(pos);

//   if (map.getCenter() != latLng) {
//     map.panTo(latLng);
//   }
// };
// InfoBubble.prototype['panToView'] = InfoBubble.prototype.panToView;


/**
 * Converts a HTML string to a document fragment.
 *
 * @param {string} htmlString The HTML string to convert.
 * @return {Node} A HTML document fragment.
 * @private
 */
InfoBubble.prototype.htmlToDocumentFragment_ = function(htmlString) {
  htmlString = htmlString.replace(/^\s*([\S\s]*)\b\s*$/, '$1');
  var tempDiv = document.createElement('DIV');
  tempDiv.innerHTML = htmlString;
  if (tempDiv.childNodes.length == 1) {
    return /** @type {!Node} */ (tempDiv.removeChild(tempDiv.firstChild));
  } else {
    var fragment = document.createDocumentFragment();
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild);
    }
    return fragment;
  }
};


/**
 * Removes all children from the node.
 *
 * @param {Node} node The node to remove all children from.
 * @private
 */
InfoBubble.prototype.removeChildren_ = function(node) {
  if (!node) {
    return;
  }

  var child;
  while (child = node.firstChild) {
    node.removeChild(child);
  }
};


/**
 * Sets the content of the infobubble.
 *
 * @param {string|Node} content The content to set.
 */
InfoBubble.prototype.setContent = function(content) {
  this.set('content', content);
};
InfoBubble.prototype['setContent'] = InfoBubble.prototype.setContent;


/**
 * Get the content of the infobubble.
 *
 * @return {string|Node} The marker content.
 */
InfoBubble.prototype.getContent = function() {
  return /** @type {Node|string} */ (this.get('content'));
};
InfoBubble.prototype['getContent'] = InfoBubble.prototype.getContent;


/**
 * Sets the marker content and adds loading events to images
 */
InfoBubble.prototype.updateContent_ = function() {
  if (!this.content_) {
    // The Content area doesnt exist.
    return;
  }

  this.removeChildren_(this.content_);
  var content = this.getContent();
  if (content) {
    if (typeof content == 'string') {
      content = this.htmlToDocumentFragment_(content);
    }
    this.content_.appendChild(content);

    var that = this;
    var images = this.content_.getElementsByTagName('IMG');
    for (var i = 0, image; image = images[i]; i++) {
      // Because we don't know the size of an image till it loads, add a
      // listener to the image load so the marker can resize and reposition
      // itself to be the correct height.
      google.maps.event.addDomListener(image, 'load', function() {
        that.imageLoaded_();
      });
    }
  }
  this.redraw_();
};


/**
 * Image loaded
 * @private
 */
// InfoBubble.prototype.imageLoaded_ = function() {
//   var pan = !this.get('disableAutoPan');
//   this.redraw_();
//   if (pan && (this.tabs_.length == 0 || this.activeTab_.index == 0)) {
//     this.panToView();
//   }
// };


/**
 * Updates the styles of the tabs
 * @private
 */
InfoBubble.prototype.updateTabStyles_ = function() {
  if (this.tabs_ && this.tabs_.length) {
    for (var i = 0, tab; tab = this.tabs_[i]; i++) {
      this.setTabStyle_(tab.tab);
    }
    this.activeTab_.style['zIndex'] = this.baseZIndex_;
    var borderWidth = this.getBorderWidth_();
    var padding = this.getPadding_() / 2;
    this.activeTab_.style['borderBottomWidth'] = 0;
    this.activeTab_.style['paddingBottom'] = this.px(padding + borderWidth);
  }
};


/**
 * Sets the style of a tab
 * @private
 * @param {Element} tab The tab to style.
 */
InfoBubble.prototype.setTabStyle_ = function(tab) {
  var backgroundColor = this.get('backgroundColor');
  var borderColor = this.get('borderColor');
  var borderRadius = this.getBorderRadius_();
  var borderWidth = this.getBorderWidth_();
  var padding = this.getPadding_();

  var marginRight = this.px(-(Math.max(padding, borderRadius)));
  var borderRadiusPx = this.px(borderRadius);

  var index = this.baseZIndex_;
  if (tab.index) {
    index -= tab.index;
  }

  // The styles for the tab
  var styles = {
    'cssFloat': 'left',
    'position': 'relative',
    'cursor': 'pointer',
    'backgroundColor': backgroundColor,
    'border': this.px(borderWidth) + ' solid ' + borderColor,
    'padding': this.px(padding / 2) + ' ' + this.px(padding),
    'marginRight': marginRight,
    'whiteSpace': 'nowrap',
    'borderRadiusTopLeft': borderRadiusPx,
    'MozBorderRadiusTopleft': borderRadiusPx,
    'webkitBorderTopLeftRadius': borderRadiusPx,
    'borderRadiusTopRight': borderRadiusPx,
    'MozBorderRadiusTopright': borderRadiusPx,
    'webkitBorderTopRightRadius': borderRadiusPx,
    'zIndex': index,
    'display': 'inline'
  };

  for (var style in styles) {
    tab.style[style] = styles[style];
  }

  var className = this.get('tabClassName');
  if (className != undefined) {
    tab.className += ' ' + className;
  }
};


/**
 * Add user actions to a tab
 * @private
 * @param {Object} tab The tab to add the actions to.
 */
InfoBubble.prototype.addTabActions_ = function(tab) {
  var that = this;
  tab.listener_ = google.maps.event.addDomListener(tab, 'click', function() {
    that.setTabActive_(this);
  });
};


/**
 * Set a tab at a index to be active
 *
 * @param {number} index The index of the tab.
 */
InfoBubble.prototype.setTabActive = function(index) {
  var tab = this.tabs_[index - 1];

  if (tab) {
    this.setTabActive_(tab.tab);
  }
};
InfoBubble.prototype['setTabActive'] = InfoBubble.prototype.setTabActive;


/**
 * Set a tab to be active
 * @private
 * @param {Object} tab The tab to set active.
 */
InfoBubble.prototype.setTabActive_ = function(tab) {
  if (!tab) {
    this.setContent('');
    this.updateContent_();
    return;
  }

  var padding = this.getPadding_() / 2;
  var borderWidth = this.getBorderWidth_();

  if (this.activeTab_) {
    var activeTab = this.activeTab_;
    activeTab.style['zIndex'] = this.baseZIndex_ - activeTab.index;
    activeTab.style['paddingBottom'] = this.px(padding);
    activeTab.style['borderBottomWidth'] = this.px(borderWidth);
  }

  tab.style['zIndex'] = this.baseZIndex_;
  tab.style['borderBottomWidth'] = 0;
  tab.style['marginBottomWidth'] = '-10px';
  tab.style['paddingBottom'] = this.px(padding + borderWidth);

  this.setContent(this.tabs_[tab.index].content);
  this.updateContent_();

  this.activeTab_ = tab;

  this.redraw_();
};


/**
 * Set the max width of the InfoBubble
 *
 * @param {number} width The max width.
 */
InfoBubble.prototype.setMaxWidth = function(width) {
  this.set('maxWidth', width);
};
InfoBubble.prototype['setMaxWidth'] = InfoBubble.prototype.setMaxWidth;


/**
 * maxWidth changed MVC callback
 */
InfoBubble.prototype.maxWidth_changed = function() {
  this.redraw_();
};
InfoBubble.prototype['maxWidth_changed'] = InfoBubble.prototype.maxWidth_changed;


/**
 * Set the max height of the InfoBubble
 *
 * @param {number} height The max height.
 */
InfoBubble.prototype.setMaxHeight = function(height) {
  this.set('maxHeight', height);
};
InfoBubble.prototype['setMaxHeight'] = InfoBubble.prototype.setMaxHeight;


/**
 * maxHeight changed MVC callback
 */
InfoBubble.prototype.maxHeight_changed = function() {
  this.redraw_();
};
InfoBubble.prototype['maxHeight_changed'] = InfoBubble.prototype.maxHeight_changed;


/**
 * Set the min width of the InfoBubble
 *
 * @param {number} width The min width.
 */
InfoBubble.prototype.setMinWidth = function(width) {
  this.set('minWidth', width);
};
InfoBubble.prototype['setMinWidth'] = InfoBubble.prototype.setMinWidth;


/**
 * minWidth changed MVC callback
 */
InfoBubble.prototype.minWidth_changed = function() {
  this.redraw_();
};
InfoBubble.prototype['minWidth_changed'] = InfoBubble.prototype.minWidth_changed;


/**
 * Set the min height of the InfoBubble
 *
 * @param {number} height The min height.
 */
InfoBubble.prototype.setMinHeight = function(height) {
  this.set('minHeight', height);
};
InfoBubble.prototype['setMinHeight'] = InfoBubble.prototype.setMinHeight;


/**
 * minHeight changed MVC callback
 */
InfoBubble.prototype.minHeight_changed = function() {
  this.redraw_();
};
InfoBubble.prototype['minHeight_changed'] = InfoBubble.prototype.minHeight_changed;


/**
 * Add a tab
 *
 * @param {string} label The label of the tab.
 * @param {string|Element} content The content of the tab.
 */
InfoBubble.prototype.addTab = function(label, content) {
  var tab = document.createElement('DIV');
  tab.innerHTML = label;

  this.setTabStyle_(tab);
  this.addTabActions_(tab);

  this.tabsContainer_.appendChild(tab);

  this.tabs_.push({
    label: label,
    content: content,
    tab: tab
  });

  tab.index = this.tabs_.length - 1;
  tab.style['zIndex'] = this.baseZIndex_ - tab.index;

  if (!this.activeTab_) {
    this.setTabActive_(tab);
  }

  tab.className = tab.className + ' ' + this.animationName_;

  this.redraw_();
};
InfoBubble.prototype['addTab'] = InfoBubble.prototype.addTab;


/**
 * Update a tab at a speicifc index
 *
 * @param {number} index The index of the tab.
 * @param {?string} opt_label The label to change to.
 * @param {?string} opt_content The content to update to.
 */
InfoBubble.prototype.updateTab = function(index, opt_label, opt_content) {
  if (!this.tabs_.length || index < 0 || index >= this.tabs_.length) {
    return;
  }

  var tab = this.tabs_[index];
  if (opt_label != undefined) {
    tab.tab.innerHTML = tab.label = opt_label;
  }

  if (opt_content != undefined) {
    tab.content = opt_content;
  }

  if (this.activeTab_ == tab.tab) {
    this.setContent(tab.content);
    this.updateContent_();
  }
  this.redraw_();
};
InfoBubble.prototype['updateTab'] = InfoBubble.prototype.updateTab;


/**
 * Remove a tab at a specific index
 *
 * @param {number} index The index of the tab to remove.
 */
InfoBubble.prototype.removeTab = function(index) {
  if (!this.tabs_.length || index < 0 || index >= this.tabs_.length) {
    return;
  }

  var tab = this.tabs_[index];
  tab.tab.parentNode.removeChild(tab.tab);

  google.maps.event.removeListener(tab.tab.listener_);

  this.tabs_.splice(index, 1);

  delete tab;

  for (var i = 0, t; t = this.tabs_[i]; i++) {
    t.tab.index = i;
  }

  if (tab.tab == this.activeTab_) {
    // Removing the current active tab
    if (this.tabs_[index]) {
      // Show the tab to the right
      this.activeTab_ = this.tabs_[index].tab;
    } else if (this.tabs_[index - 1]) {
      // Show a tab to the left
      this.activeTab_ = this.tabs_[index - 1].tab;
    } else {
      // No tabs left to sho
      this.activeTab_ = undefined;
    }

    this.setTabActive_(this.activeTab_);
  }

  this.redraw_();
};
InfoBubble.prototype['removeTab'] = InfoBubble.prototype.removeTab;


/**
 * Get the size of an element
 * @private
 * @param {Node|string} element The element to size.
 * @param {number=} opt_maxWidth Optional max width of the element.
 * @param {number=} opt_maxHeight Optional max height of the element.
 * @return {google.maps.Size} The size of the element.
 */
InfoBubble.prototype.getElementSize_ = function(element, opt_maxWidth,
                                                opt_maxHeight) {
  var sizer = document.createElement('DIV');
  sizer.style['display'] = 'inline';
  sizer.style['position'] = 'absolute';
  sizer.style['visibility'] = 'hidden';

  if (typeof element == 'string') {
    sizer.innerHTML = element;
  } else {
    sizer.appendChild(element.cloneNode(true));
  }

  document.body.appendChild(sizer);
  var size = new google.maps.Size(sizer.offsetWidth, sizer.offsetHeight);

  // If the width is bigger than the max width then set the width and size again
  if (opt_maxWidth && size.width > opt_maxWidth) {
    sizer.style['width'] = this.px(opt_maxWidth);
    size = new google.maps.Size(sizer.offsetWidth, sizer.offsetHeight);
  }

  // If the height is bigger than the max height then set the height and size
  // again
  if (opt_maxHeight && size.height > opt_maxHeight) {
    sizer.style['height'] = this.px(opt_maxHeight);
    size = new google.maps.Size(sizer.offsetWidth, sizer.offsetHeight);
  }

  document.body.removeChild(sizer);
  delete sizer;
  return size;
};


/**
 * Redraw the InfoBubble
 * @private
 */
InfoBubble.prototype.redraw_ = function() {
  this.figureOutSize_();
  this.positionCloseButton_();
  this.draw();
};


/**
 * Figure out the optimum size of the InfoBubble
 * @private
 */
InfoBubble.prototype.figureOutSize_ = function() {
  var map = this.get('map');

  if (!map) {
    return;
  }

  var padding = this.getPadding_();
  var borderWidth = this.getBorderWidth_();
  var borderRadius = this.getBorderRadius_();
  var arrowSize = this.getArrowSize_();

  var mapDiv = map.getDiv();
  var gutter = arrowSize * 2;
  var mapWidth = mapDiv.offsetWidth - gutter;
  var mapHeight = mapDiv.offsetHeight - gutter - this.getAnchorHeight_();
  var tabHeight = 0;
  var width = /** @type {number} */ (this.get('minWidth') || 0);
  var height = /** @type {number} */ (this.get('minHeight') || 0);
  var maxWidth = /** @type {number} */ (this.get('maxWidth') || 0);
  var maxHeight = /** @type {number} */ (this.get('maxHeight') || 0);

  maxWidth = Math.min(mapWidth, maxWidth);
  maxHeight = Math.min(mapHeight, maxHeight);

  var tabWidth = 0;
  if (this.tabs_.length) {
    // If there are tabs then you need to check the size of each tab's content
    for (var i = 0, tab; tab = this.tabs_[i]; i++) {
      var tabSize = this.getElementSize_(tab.tab, maxWidth, maxHeight);
      var contentSize = this.getElementSize_(tab.content, maxWidth, maxHeight);

      if (width < tabSize.width) {
        width = tabSize.width;
      }

      // Add up all the tab widths because they might end up being wider than
      // the content
      tabWidth += tabSize.width;

      if (height < tabSize.height) {
        height = tabSize.height;
      }

      if (tabSize.height > tabHeight) {
        tabHeight = tabSize.height;
      }

      if (width < contentSize.width) {
        width = contentSize.width;
      }

      if (height < contentSize.height) {
        height = contentSize.height;
      }
    }
  } else {
    var content = /** @type {string|Node} */ (this.get('content'));
    if (typeof content == 'string') {
      content = this.htmlToDocumentFragment_(content);
    }
    if (content) {
      var contentSize = this.getElementSize_(content, maxWidth, maxHeight);

      if (width < contentSize.width) {
        width = contentSize.width;
      }

      if (height < contentSize.height) {
        height = contentSize.height;
      }
    }
  }

  if (maxWidth) {
    width = Math.min(width, maxWidth);
  }

  if (maxHeight) {
    height = Math.min(height, maxHeight);
  }

  width = Math.max(width, tabWidth);

  if (width == tabWidth) {
    width = width + 2 * padding;
  }

  arrowSize = arrowSize * 2;
  width = Math.max(width, arrowSize);

  // Maybe add this as a option so they can go bigger than the map if the user
  // wants
  if (width > mapWidth) {
    width = mapWidth;
  }

  if (height > mapHeight) {
    height = mapHeight - tabHeight;
  }

  if (this.tabsContainer_) {
    this.tabHeight_ = tabHeight;
    this.tabsContainer_.style['width'] = this.px(tabWidth);
  }

  this.contentContainer_.style['width'] = this.px(width);
  this.contentContainer_.style['height'] = this.px(height);
  this.contentContainer_.style['text-align'] = 'center';
};


/**
 *  Get the height of the anchor
 *
 *  This function is a hack for now and doesn't really work that good, need to
 *  wait for pixelBounds to be correctly exposed.
 *  @private
 *  @return {number} The height of the anchor.
 */
InfoBubble.prototype.getAnchorHeight_ = function() {
  var anchor = this.get('anchor');
  if (anchor) {
    var anchorPoint = /** @type google.maps.Point */(this.get('anchorPoint'));

    if (anchorPoint) {
      return -1 * anchorPoint.y;
    }
  }
  return 0;
};

InfoBubble.prototype.anchorPoint_changed = function() {
  this.draw();
};
InfoBubble.prototype['anchorPoint_changed'] = InfoBubble.prototype.anchorPoint_changed;


/**
 * Position the close button in the right spot.
 * @private
 */
InfoBubble.prototype.positionCloseButton_ = function() {
  var br = this.getBorderRadius_();
  var bw = this.getBorderWidth_();

  var right = 2;
  var top = 2;

  if (this.tabs_.length && this.tabHeight_) {
    top += this.tabHeight_;
  }

  top += bw;
  right += bw;

  var c = this.contentContainer_;
  if (c && c.clientHeight < c.scrollHeight) {
    // If there are scrollbars then move the cross in so it is not over
    // scrollbar
    right += 15;
  }

  this.close_.style['right'] = this.px(right);
  this.close_.style['top'] = this.px(top);
};

/*!
 * dist/inputmask
 * https://github.com/RobinHerbots/Inputmask
 * Copyright (c) 2010 - 2019 Robin Herbots
 * Licensed under the MIT license
 * Version: 5.0.0-beta.269
 */
!function webpackUniversalModuleDefinition(root, factory) {
  if ("object" == typeof exports && "object" == typeof module) module.exports = factory(); else if ("function" == typeof define && define.amd) define([], factory); else {
      var a = factory();
      for (var i in a) ("object" == typeof exports ? exports : root)[i] = a[i];
  }
}(window, function() {
  return modules = [ function(module, exports, __webpack_require__) {
      "use strict";
      function _typeof(obj) {
          return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function _typeof(obj) {
              return typeof obj;
          } : function _typeof(obj) {
              return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
          }, _typeof(obj);
      }
      var $ = __webpack_require__(1), window = __webpack_require__(2), document = window.document, generateMaskSet = __webpack_require__(3).generateMaskSet, analyseMask = __webpack_require__(3).analyseMask, maskScope = __webpack_require__(6);
      function Inputmask(alias, options, internal) {
          if (!(this instanceof Inputmask)) return new Inputmask(alias, options, internal);
          this.el = void 0, this.events = {}, this.maskset = void 0, this.refreshValue = !1,
          !0 !== internal && ($.isPlainObject(alias) ? options = alias : (options = options || {},
          alias && (options.alias = alias)), this.opts = $.extend(!0, {}, this.defaults, options),
          this.noMasksCache = options && void 0 !== options.definitions, this.userOptions = options || {},
          resolveAlias(this.opts.alias, options, this.opts), this.isRTL = this.opts.numericInput);
      }
      function resolveAlias(aliasStr, options, opts) {
          var aliasDefinition = Inputmask.prototype.aliases[aliasStr];
          return aliasDefinition ? (aliasDefinition.alias && resolveAlias(aliasDefinition.alias, void 0, opts),
          $.extend(!0, opts, aliasDefinition), $.extend(!0, opts, options), !0) : (null === opts.mask && (opts.mask = aliasStr),
          !1);
      }
      function importAttributeOptions(npt, opts, userOptions, dataAttribute) {
          function importOption(option, optionData) {
              optionData = void 0 !== optionData ? optionData : npt.getAttribute(dataAttribute + "-" + option),
              null !== optionData && ("string" == typeof optionData && (0 === option.indexOf("on") ? optionData = window[optionData] : "false" === optionData ? optionData = !1 : "true" === optionData && (optionData = !0)),
              userOptions[option] = optionData);
          }
          if (!0 === opts.importDataAttributes) {
              var attrOptions = npt.getAttribute(dataAttribute), option, dataoptions, optionData, p;
              if (attrOptions && "" !== attrOptions && (attrOptions = attrOptions.replace(/'/g, '"'),
              dataoptions = JSON.parse("{" + attrOptions + "}")), dataoptions) for (p in optionData = void 0,
              dataoptions) if ("alias" === p.toLowerCase()) {
                  optionData = dataoptions[p];
                  break;
              }
              for (option in importOption("alias", optionData), userOptions.alias && resolveAlias(userOptions.alias, userOptions, opts),
              opts) {
                  if (dataoptions) for (p in optionData = void 0, dataoptions) if (p.toLowerCase() === option.toLowerCase()) {
                      optionData = dataoptions[p];
                      break;
                  }
                  importOption(option, optionData);
              }
          }
          return $.extend(!0, opts, userOptions), "rtl" !== npt.dir && !opts.rightAlign || (npt.style.textAlign = "right"),
          "rtl" !== npt.dir && !opts.numericInput || (npt.dir = "ltr", npt.removeAttribute("dir"),
          opts.isRTL = !0), Object.keys(userOptions).length;
      }
      Inputmask.prototype = {
          dataAttribute: "data-inputmask",
          defaults: {
              placeholder: "_",
              optionalmarker: [ "[", "]" ],
              quantifiermarker: [ "{", "}" ],
              groupmarker: [ "(", ")" ],
              alternatormarker: "|",
              escapeChar: "\\",
              mask: null,
              regex: null,
              oncomplete: $.noop,
              onincomplete: $.noop,
              oncleared: $.noop,
              repeat: 0,
              greedy: !1,
              autoUnmask: !1,
              removeMaskOnSubmit: !1,
              clearMaskOnLostFocus: !0,
              insertMode: !0,
              clearIncomplete: !1,
              alias: null,
              onKeyDown: $.noop,
              onBeforeMask: null,
              onBeforePaste: function onBeforePaste(pastedValue, opts) {
                  return $.isFunction(opts.onBeforeMask) ? opts.onBeforeMask.call(this, pastedValue, opts) : pastedValue;
              },
              onBeforeWrite: null,
              onUnMask: null,
              showMaskOnFocus: !0,
              showMaskOnHover: !0,
              onKeyValidation: $.noop,
              skipOptionalPartCharacter: " ",
              numericInput: !1,
              rightAlign: !1,
              undoOnEscape: !0,
              radixPoint: "",
              _radixDance: !1,
              groupSeparator: "",
              keepStatic: null,
              positionCaretOnTab: !0,
              tabThrough: !1,
              supportsInputType: [ "text", "tel", "url", "password", "search" ],
              ignorables: [ 8, 9, 13, 19, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46, 93, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 0, 229 ],
              isComplete: null,
              preValidation: null,
              postValidation: null,
              staticDefinitionSymbol: void 0,
              jitMasking: !1,
              nullable: !0,
              inputEventOnly: !1,
              noValuePatching: !1,
              positionCaretOnClick: "lvp",
              casing: null,
              inputmode: "verbatim",
              importDataAttributes: !0,
              shiftPositions: !0
          },
          definitions: {
              9: {
                  validator: "[0-9\uff11-\uff19]",
                  definitionSymbol: "*"
              },
              a: {
                  validator: "[A-Za-z\u0410-\u044f\u0401\u0451\xc0-\xff\xb5]",
                  definitionSymbol: "*"
              },
              "*": {
                  validator: "[0-9\uff11-\uff19A-Za-z\u0410-\u044f\u0401\u0451\xc0-\xff\xb5]"
              }
          },
          aliases: {},
          masksCache: {},
          mask: function mask(elems) {
              var that = this;
              return "string" == typeof elems && (elems = document.getElementById(elems) || document.querySelectorAll(elems)),
              elems = elems.nodeName ? [ elems ] : elems, $.each(elems, function(ndx, el) {
                  var scopedOpts = $.extend(!0, {}, that.opts);
                  if (importAttributeOptions(el, scopedOpts, $.extend(!0, {}, that.userOptions), that.dataAttribute)) {
                      var maskset = generateMaskSet(scopedOpts, that.noMasksCache);
                      void 0 !== maskset && (void 0 !== el.inputmask && (el.inputmask.opts.autoUnmask = !0,
                      el.inputmask.remove()), el.inputmask = new Inputmask(void 0, void 0, !0), el.inputmask.opts = scopedOpts,
                      el.inputmask.noMasksCache = that.noMasksCache, el.inputmask.userOptions = $.extend(!0, {}, that.userOptions),
                      el.inputmask.isRTL = scopedOpts.isRTL || scopedOpts.numericInput, el.inputmask.el = el,
                      el.inputmask.maskset = maskset, $.data(el, "_inputmask_opts", scopedOpts), maskScope.call(el.inputmask, {
                          action: "mask"
                      }));
                  }
              }), elems && elems[0] && elems[0].inputmask || this;
          },
          option: function option(options, noremask) {
              return "string" == typeof options ? this.opts[options] : "object" === _typeof(options) ? ($.extend(this.userOptions, options),
              this.el && !0 !== noremask && this.mask(this.el), this) : void 0;
          },
          unmaskedvalue: function unmaskedvalue(value) {
              return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),
              maskScope.call(this, {
                  action: "unmaskedvalue",
                  value: value
              });
          },
          remove: function remove() {
              return maskScope.call(this, {
                  action: "remove"
              });
          },
          getemptymask: function getemptymask() {
              return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),
              maskScope.call(this, {
                  action: "getemptymask"
              });
          },
          hasMaskedValue: function hasMaskedValue() {
              return !this.opts.autoUnmask;
          },
          isComplete: function isComplete() {
              return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),
              maskScope.call(this, {
                  action: "isComplete"
              });
          },
          getmetadata: function getmetadata() {
              return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),
              maskScope.call(this, {
                  action: "getmetadata"
              });
          },
          isValid: function isValid(value) {
              return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),
              maskScope.call(this, {
                  action: "isValid",
                  value: value
              });
          },
          format: function format(value, metadata) {
              return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),
              maskScope.call(this, {
                  action: "format",
                  value: value,
                  metadata: metadata
              });
          },
          setValue: function setValue(value) {
              this.el && $(this.el).trigger("setvalue", [ value ]);
          },
          analyseMask: analyseMask
      }, Inputmask.extendDefaults = function(options) {
          $.extend(!0, Inputmask.prototype.defaults, options);
      }, Inputmask.extendDefinitions = function(definition) {
          $.extend(!0, Inputmask.prototype.definitions, definition);
      }, Inputmask.extendAliases = function(alias) {
          $.extend(!0, Inputmask.prototype.aliases, alias);
      }, Inputmask.format = function(value, options, metadata) {
          return Inputmask(options).format(value, metadata);
      }, Inputmask.unmask = function(value, options) {
          return Inputmask(options).unmaskedvalue(value);
      }, Inputmask.isValid = function(value, options) {
          return Inputmask(options).isValid(value);
      }, Inputmask.remove = function(elems) {
          "string" == typeof elems && (elems = document.getElementById(elems) || document.querySelectorAll(elems)),
          elems = elems.nodeName ? [ elems ] : elems, $.each(elems, function(ndx, el) {
              el.inputmask && el.inputmask.remove();
          });
      }, Inputmask.setValue = function(elems, value) {
          "string" == typeof elems && (elems = document.getElementById(elems) || document.querySelectorAll(elems)),
          elems = elems.nodeName ? [ elems ] : elems, $.each(elems, function(ndx, el) {
              el.inputmask ? el.inputmask.setValue(value) : $(el).trigger("setvalue", [ value ]);
          });
      };
      var escapeRegexRegex = new RegExp("(\\" + [ "/", ".", "*", "+", "?", "|", "(", ")", "[", "]", "{", "}", "\\", "$", "^" ].join("|\\") + ")", "gim");
      Inputmask.escapeRegex = function(str) {
          return str.replace(escapeRegexRegex, "\\$1");
      }, Inputmask.keyCode = {
          BACKSPACE: 8,
          BACKSPACE_SAFARI: 127,
          DELETE: 46,
          DOWN: 40,
          END: 35,
          ENTER: 13,
          ESCAPE: 27,
          HOME: 36,
          INSERT: 45,
          LEFT: 37,
          PAGE_DOWN: 34,
          PAGE_UP: 33,
          RIGHT: 39,
          SPACE: 32,
          TAB: 9,
          UP: 38,
          X: 88,
          CONTROL: 17
      }, Inputmask.dependencyLib = $, window.Inputmask = Inputmask, module.exports = Inputmask;
  }, function(module, exports, __webpack_require__) {
      "use strict";
      function _typeof(obj) {
          return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function _typeof(obj) {
              return typeof obj;
          } : function _typeof(obj) {
              return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
          }, _typeof(obj);
      }
      var window = __webpack_require__(2), document = window.document;
      function indexOf(list, elem) {
          for (var i = 0, len = list.length; i < len; i++) if (list[i] === elem) return i;
          return -1;
      }
      function isWindow(obj) {
          return null != obj && obj === obj.window;
      }
      function isArraylike(obj) {
          var length = "length" in obj && obj.length, ltype = _typeof(obj);
          return "function" !== ltype && !isWindow(obj) && (!(1 !== obj.nodeType || !length) || ("array" === ltype || 0 === length || "number" == typeof length && 0 < length && length - 1 in obj));
      }
      function isValidElement(elem) {
          return elem instanceof Element;
      }
      function DependencyLib(elem) {
          return elem instanceof DependencyLib ? elem : this instanceof DependencyLib ? void (null != elem && elem !== window && (this[0] = elem.nodeName ? elem : void 0 !== elem[0] && elem[0].nodeName ? elem[0] : document.querySelector(elem),
          void 0 !== this[0] && null !== this[0] && (this[0].eventRegistry = this[0].eventRegistry || {}))) : new DependencyLib(elem);
      }
      DependencyLib.prototype = {
          on: function on(events, handler) {
              function addEvent(ev, namespace) {
                  elem.addEventListener ? elem.addEventListener(ev, handler, !1) : elem.attachEvent && elem.attachEvent("on" + ev, handler),
                  eventRegistry[ev] = eventRegistry[ev] || {}, eventRegistry[ev][namespace] = eventRegistry[ev][namespace] || [],
                  eventRegistry[ev][namespace].push(handler);
              }
              if (isValidElement(this[0])) for (var eventRegistry = this[0].eventRegistry, elem = this[0], _events = events.split(" "), endx = 0; endx < _events.length; endx++) {
                  var nsEvent = _events[endx].split("."), ev = nsEvent[0], namespace = nsEvent[1] || "global";
                  addEvent(ev, namespace);
              }
              return this;
          },
          off: function off(events, handler) {
              var eventRegistry, elem;
              function removeEvent(ev, namespace, handler) {
                  if (ev in eventRegistry == !0) if (elem.removeEventListener ? elem.removeEventListener(ev, handler, !1) : elem.detachEvent && elem.detachEvent("on" + ev, handler),
                  "global" === namespace) for (var nmsp in eventRegistry[ev]) eventRegistry[ev][nmsp].splice(eventRegistry[ev][nmsp].indexOf(handler), 1); else eventRegistry[ev][namespace].splice(eventRegistry[ev][namespace].indexOf(handler), 1);
              }
              function resolveNamespace(ev, namespace) {
                  var evts = [], hndx, hndL;
                  if (0 < ev.length) if (void 0 === handler) for (hndx = 0, hndL = eventRegistry[ev][namespace].length; hndx < hndL; hndx++) evts.push({
                      ev: ev,
                      namespace: namespace && 0 < namespace.length ? namespace : "global",
                      handler: eventRegistry[ev][namespace][hndx]
                  }); else evts.push({
                      ev: ev,
                      namespace: namespace && 0 < namespace.length ? namespace : "global",
                      handler: handler
                  }); else if (0 < namespace.length) for (var evNdx in eventRegistry) for (var nmsp in eventRegistry[evNdx]) if (nmsp === namespace) if (void 0 === handler) for (hndx = 0,
                  hndL = eventRegistry[evNdx][nmsp].length; hndx < hndL; hndx++) evts.push({
                      ev: evNdx,
                      namespace: nmsp,
                      handler: eventRegistry[evNdx][nmsp][hndx]
                  }); else evts.push({
                      ev: evNdx,
                      namespace: nmsp,
                      handler: handler
                  });
                  return evts;
              }
              if (isValidElement(this[0])) {
                  eventRegistry = this[0].eventRegistry, elem = this[0];
                  for (var _events = events.split(" "), endx = 0; endx < _events.length; endx++) for (var nsEvent = _events[endx].split("."), offEvents = resolveNamespace(nsEvent[0], nsEvent[1]), i = 0, offEventsL = offEvents.length; i < offEventsL; i++) removeEvent(offEvents[i].ev, offEvents[i].namespace, offEvents[i].handler);
              }
              return this;
          },
          trigger: function trigger(events, argument_1) {
              if (isValidElement(this[0])) for (var eventRegistry = this[0].eventRegistry, elem = this[0], _events = "string" == typeof events ? events.split(" ") : [ events.type ], endx = 0; endx < _events.length; endx++) {
                  var nsEvent = _events[endx].split("."), ev = nsEvent[0], namespace = nsEvent[1] || "global";
                  if (void 0 !== document && "global" === namespace) {
                      var evnt, i, params = {
                          bubbles: !0,
                          cancelable: !0,
                          detail: argument_1
                      };
                      if (document.createEvent) {
                          try {
                              evnt = new CustomEvent(ev, params);
                          } catch (e) {
                              evnt = document.createEvent("CustomEvent"), evnt.initCustomEvent(ev, params.bubbles, params.cancelable, params.detail);
                          }
                          events.type && DependencyLib.extend(evnt, events), elem.dispatchEvent(evnt);
                      } else evnt = document.createEventObject(), evnt.eventType = ev, evnt.detail = argument_1,
                      events.type && DependencyLib.extend(evnt, events), elem.fireEvent("on" + evnt.eventType, evnt);
                  } else if (void 0 !== eventRegistry[ev]) if (events = events.type ? events : DependencyLib.Event(events),
                  events.detail = arguments.slice(1), "global" === namespace) for (var nmsp in eventRegistry[ev]) for (i = 0; i < eventRegistry[ev][nmsp].length; i++) eventRegistry[ev][nmsp][i].apply(elem, arguments); else for (i = 0; i < eventRegistry[ev][namespace].length; i++) eventRegistry[ev][namespace][i].apply(elem, arguments);
              }
              return this;
          }
      }, DependencyLib.isFunction = function(obj) {
          return "function" == typeof obj;
      }, DependencyLib.noop = function() {}, DependencyLib.isArray = Array.isArray, DependencyLib.inArray = function(elem, arr, i) {
          return null == arr ? -1 : indexOf(arr, elem, i);
      }, DependencyLib.valHooks = void 0, DependencyLib.isPlainObject = function(obj) {
          return "object" === _typeof(obj) && !obj.nodeType && !isWindow(obj) && !(obj.constructor && !Object.hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf"));
      }, DependencyLib.extend = function() {
          var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {}, i = 1, length = arguments.length, deep = !1;
          for ("boolean" == typeof target && (deep = target, target = arguments[i] || {},
          i++), "object" === _typeof(target) || DependencyLib.isFunction(target) || (target = {}),
          i === length && (target = this, i--); i < length; i++) if (null != (options = arguments[i])) for (name in options) src = target[name],
          copy = options[name], target !== copy && (deep && copy && (DependencyLib.isPlainObject(copy) || (copyIsArray = DependencyLib.isArray(copy))) ? (clone = copyIsArray ? (copyIsArray = !1,
          src && DependencyLib.isArray(src) ? src : []) : src && DependencyLib.isPlainObject(src) ? src : {},
          target[name] = DependencyLib.extend(deep, clone, copy)) : void 0 !== copy && (target[name] = copy));
          return target;
      }, DependencyLib.each = function(obj, callback) {
          var value, i = 0;
          if (isArraylike(obj)) for (var length = obj.length; i < length && (value = callback.call(obj[i], i, obj[i]),
          !1 !== value); i++) ; else for (i in obj) if (value = callback.call(obj[i], i, obj[i]),
          !1 === value) break;
          return obj;
      }, DependencyLib.data = function(owner, key, value) {
          if (void 0 === value) return owner.__data ? owner.__data[key] : null;
          owner.__data = owner.__data || {}, owner.__data[key] = value;
      }, "function" == typeof window.CustomEvent ? DependencyLib.Event = window.CustomEvent : (DependencyLib.Event = function(event, params) {
          params = params || {
              bubbles: !1,
              cancelable: !1,
              detail: void 0
          };
          var evt = document.createEvent("CustomEvent");
          return evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail),
          evt;
      }, DependencyLib.Event.prototype = window.Event.prototype), module.exports = DependencyLib;
  }, function(module, exports, __webpack_require__) {
      "use strict";
      var __WEBPACK_AMD_DEFINE_RESULT__;
      function _typeof(obj) {
          return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function _typeof(obj) {
              return typeof obj;
          } : function _typeof(obj) {
              return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
          }, _typeof(obj);
      }
      __WEBPACK_AMD_DEFINE_RESULT__ = function() {
          return "undefined" != typeof window ? window : new (eval("require('jsdom').JSDOM"))("").window;
      }.call(exports, __webpack_require__, exports, module), void 0 === __WEBPACK_AMD_DEFINE_RESULT__ || (module.exports = __WEBPACK_AMD_DEFINE_RESULT__);
  }, function(module, exports, __webpack_require__) {
      "use strict";
      var $ = __webpack_require__(1);
      function generateMaskSet(opts, nocache) {
          var ms;
          function generateMask(mask, metadata, opts) {
              var regexMask = !1, masksetDefinition, maskdefKey;
              if (null !== mask && "" !== mask || (regexMask = null !== opts.regex, mask = regexMask ? (mask = opts.regex,
              mask.replace(/^(\^)(.*)(\$)$/, "$2")) : (regexMask = !0, ".*")), 1 === mask.length && !1 === opts.greedy && 0 !== opts.repeat && (opts.placeholder = ""),
              0 < opts.repeat || "*" === opts.repeat || "+" === opts.repeat) {
                  var repeatStart = "*" === opts.repeat ? 0 : "+" === opts.repeat ? 1 : opts.repeat;
                  mask = opts.groupmarker[0] + mask + opts.groupmarker[1] + opts.quantifiermarker[0] + repeatStart + "," + opts.repeat + opts.quantifiermarker[1];
              }
              return maskdefKey = regexMask ? "regex_" + opts.regex : opts.numericInput ? mask.split("").reverse().join("") : mask,
              !1 !== opts.keepStatic && (maskdefKey = "ks_" + maskdefKey), void 0 === Inputmask.prototype.masksCache[maskdefKey] || !0 === nocache ? (masksetDefinition = {
                  mask: mask,
                  maskToken: Inputmask.prototype.analyseMask(mask, regexMask, opts),
                  validPositions: {},
                  _buffer: void 0,
                  buffer: void 0,
                  tests: {},
                  excludes: {},
                  metadata: metadata,
                  maskLength: void 0,
                  jitOffset: {}
              }, !0 !== nocache && (Inputmask.prototype.masksCache[maskdefKey] = masksetDefinition,
              masksetDefinition = $.extend(!0, {}, Inputmask.prototype.masksCache[maskdefKey]))) : masksetDefinition = $.extend(!0, {}, Inputmask.prototype.masksCache[maskdefKey]),
              masksetDefinition;
          }
          if ($.isFunction(opts.mask) && (opts.mask = opts.mask(opts)), $.isArray(opts.mask)) {
              if (1 < opts.mask.length) {
                  if (null === opts.keepStatic) {
                      opts.keepStatic = "auto";
                      for (var i = 0; i < opts.mask.length; i++) if (opts.mask[i].charAt(0) !== opts.mask[0].charAt(0)) {
                          opts.keepStatic = !0;
                          break;
                      }
                  }
                  var altMask = opts.groupmarker[0];
                  return $.each(opts.isRTL ? opts.mask.reverse() : opts.mask, function(ndx, msk) {
                      1 < altMask.length && (altMask += opts.groupmarker[1] + opts.alternatormarker + opts.groupmarker[0]),
                      void 0 === msk.mask || $.isFunction(msk.mask) ? altMask += msk : altMask += msk.mask;
                  }), altMask += opts.groupmarker[1], generateMask(altMask, opts.mask, opts);
              }
              opts.mask = opts.mask.pop();
          }
          return null === opts.keepStatic && (opts.keepStatic = !1), ms = opts.mask && void 0 !== opts.mask.mask && !$.isFunction(opts.mask.mask) ? generateMask(opts.mask.mask, opts.mask, opts) : generateMask(opts.mask, opts.mask, opts),
          ms;
      }
      function analyseMask(mask, regexMask, opts) {
          var tokenizer = /(?:[?*+]|\{[0-9+*]+(?:,[0-9+*]*)?(?:\|[0-9+*]*)?\})|[^.?*+^${[]()|\\]+|./g, regexTokenizer = /\[\^?]?(?:[^\\\]]+|\\[\S\s]?)*]?|\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9][0-9]*|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|c[A-Za-z]|[\S\s]?)|\((?:\?[:=!]?)?|(?:[?*+]|\{[0-9]+(?:,[0-9]*)?\})\??|[^.?*+^${[()|\\]+|./g, escaped = !1, currentToken = new MaskToken(), match, m, openenings = [], maskTokens = [], openingToken, currentOpeningToken, alternator, lastMatch, closeRegexGroup = !1;
          function MaskToken(isGroup, isOptional, isQuantifier, isAlternator) {
              this.matches = [], this.openGroup = isGroup || !1, this.alternatorGroup = !1, this.isGroup = isGroup || !1,
              this.isOptional = isOptional || !1, this.isQuantifier = isQuantifier || !1, this.isAlternator = isAlternator || !1,
              this.quantifier = {
                  min: 1,
                  max: 1
              };
          }
          function insertTestDefinition(mtoken, element, position) {
              position = void 0 !== position ? position : mtoken.matches.length;
              var prevMatch = mtoken.matches[position - 1];
              if (regexMask) 0 === element.indexOf("[") || escaped && /\\d|\\s|\\w]/i.test(element) || "." === element ? mtoken.matches.splice(position++, 0, {
                  fn: new RegExp(element, opts.casing ? "i" : ""),
                  static: !1,
                  optionality: !1,
                  newBlockMarker: void 0 === prevMatch ? "master" : prevMatch.def !== element,
                  casing: null,
                  def: element,
                  placeholder: void 0,
                  nativeDef: element
              }) : (escaped && (element = element[element.length - 1]), $.each(element.split(""), function(ndx, lmnt) {
                  prevMatch = mtoken.matches[position - 1], mtoken.matches.splice(position++, 0, {
                      fn: /[a-z]/i.test(opts.staticDefinitionSymbol || lmnt) ? new RegExp("[" + (opts.staticDefinitionSymbol || lmnt) + "]", opts.casing ? "i" : "") : null,
                      static: !0,
                      optionality: !1,
                      newBlockMarker: void 0 === prevMatch ? "master" : prevMatch.def !== lmnt && !0 !== prevMatch.static,
                      casing: null,
                      def: opts.staticDefinitionSymbol || lmnt,
                      placeholder: void 0 !== opts.staticDefinitionSymbol ? lmnt : void 0,
                      nativeDef: (escaped ? "'" : "") + lmnt
                  });
              })), escaped = !1; else {
                  var maskdef = (opts.definitions ? opts.definitions[element] : void 0) || Inputmask.prototype.definitions[element];
                  maskdef && !escaped ? mtoken.matches.splice(position++, 0, {
                      fn: maskdef.validator ? "string" == typeof maskdef.validator ? new RegExp(maskdef.validator, opts.casing ? "i" : "") : new function() {
                          this.test = maskdef.validator;
                      }() : new RegExp("."),
                      static: !1,
                      optionality: !1,
                      newBlockMarker: void 0 === prevMatch ? "master" : prevMatch.def !== (maskdef.definitionSymbol || element),
                      casing: maskdef.casing,
                      def: maskdef.definitionSymbol || element,
                      placeholder: maskdef.placeholder,
                      nativeDef: element
                  }) : (mtoken.matches.splice(position++, 0, {
                      fn: /[a-z]/i.test(opts.staticDefinitionSymbol || element) ? new RegExp("[" + (opts.staticDefinitionSymbol || element) + "]", opts.casing ? "i" : "") : null,
                      static: !0,
                      optionality: !1,
                      newBlockMarker: void 0 === prevMatch ? "master" : prevMatch.def !== element && !0 !== prevMatch.static,
                      casing: null,
                      def: opts.staticDefinitionSymbol || element,
                      placeholder: void 0 !== opts.staticDefinitionSymbol ? element : void 0,
                      nativeDef: (escaped ? "'" : "") + element
                  }), escaped = !1);
              }
          }
          function verifyGroupMarker(maskToken) {
              maskToken && maskToken.matches && $.each(maskToken.matches, function(ndx, token) {
                  var nextToken = maskToken.matches[ndx + 1];
                  (void 0 === nextToken || void 0 === nextToken.matches || !1 === nextToken.isQuantifier) && token && token.isGroup && (token.isGroup = !1,
                  regexMask || (insertTestDefinition(token, opts.groupmarker[0], 0), !0 !== token.openGroup && insertTestDefinition(token, opts.groupmarker[1]))),
                  verifyGroupMarker(token);
              });
          }
          function defaultCase() {
              if (0 < openenings.length) {
                  if (currentOpeningToken = openenings[openenings.length - 1], insertTestDefinition(currentOpeningToken, m),
                  currentOpeningToken.isAlternator) {
                      alternator = openenings.pop();
                      for (var mndx = 0; mndx < alternator.matches.length; mndx++) alternator.matches[mndx].isGroup && (alternator.matches[mndx].isGroup = !1);
                      0 < openenings.length ? (currentOpeningToken = openenings[openenings.length - 1],
                      currentOpeningToken.matches.push(alternator)) : currentToken.matches.push(alternator);
                  }
              } else insertTestDefinition(currentToken, m);
          }
          function reverseTokens(maskToken) {
              function reverseStatic(st) {
                  return st === opts.optionalmarker[0] ? st = opts.optionalmarker[1] : st === opts.optionalmarker[1] ? st = opts.optionalmarker[0] : st === opts.groupmarker[0] ? st = opts.groupmarker[1] : st === opts.groupmarker[1] && (st = opts.groupmarker[0]),
                  st;
              }
              for (var match in maskToken.matches = maskToken.matches.reverse(), maskToken.matches) if (Object.prototype.hasOwnProperty.call(maskToken.matches, match)) {
                  var intMatch = parseInt(match);
                  if (maskToken.matches[match].isQuantifier && maskToken.matches[intMatch + 1] && maskToken.matches[intMatch + 1].isGroup) {
                      var qt = maskToken.matches[match];
                      maskToken.matches.splice(match, 1), maskToken.matches.splice(intMatch + 1, 0, qt);
                  }
                  void 0 !== maskToken.matches[match].matches ? maskToken.matches[match] = reverseTokens(maskToken.matches[match]) : maskToken.matches[match] = reverseStatic(maskToken.matches[match]);
              }
              return maskToken;
          }
          function groupify(matches) {
              var groupToken = new MaskToken(!0);
              return groupToken.openGroup = !1, groupToken.matches = matches, groupToken;
          }
          function closeGroup() {
              if (openingToken = openenings.pop(), openingToken.openGroup = !1, void 0 !== openingToken) if (0 < openenings.length) {
                  if (currentOpeningToken = openenings[openenings.length - 1], currentOpeningToken.matches.push(openingToken),
                  currentOpeningToken.isAlternator) {
                      alternator = openenings.pop();
                      for (var mndx = 0; mndx < alternator.matches.length; mndx++) alternator.matches[mndx].isGroup = !1,
                      alternator.matches[mndx].alternatorGroup = !1;
                      0 < openenings.length ? (currentOpeningToken = openenings[openenings.length - 1],
                      currentOpeningToken.matches.push(alternator)) : currentToken.matches.push(alternator);
                  }
              } else currentToken.matches.push(openingToken); else defaultCase();
          }
          function groupQuantifier(matches) {
              var lastMatch = matches.pop();
              return lastMatch.isQuantifier && (lastMatch = groupify([ matches.pop(), lastMatch ])),
              lastMatch;
          }
          for (regexMask && (opts.optionalmarker[0] = void 0, opts.optionalmarker[1] = void 0); match = regexMask ? regexTokenizer.exec(mask) : tokenizer.exec(mask); ) {
              if (m = match[0], regexMask) switch (m.charAt(0)) {
                case "?":
                  m = "{0,1}";
                  break;

                case "+":
                case "*":
                  m = "{" + m + "}";
                  break;

                case "|":
                  if (0 === openenings.length) {
                      var altRegexGroup = groupify(currentToken.matches);
                      altRegexGroup.openGroup = !0, openenings.push(altRegexGroup), currentToken.matches = [],
                      closeRegexGroup = !0;
                  }
                  break;
              }
              if (escaped) defaultCase(); else switch (m.charAt(0)) {
                case "(?=":
                  break;

                case "(?!":
                  break;

                case "(?<=":
                  break;

                case "(?<!":
                  break;

                case opts.escapeChar:
                  escaped = !0, regexMask && defaultCase();
                  break;

                case opts.optionalmarker[1]:
                case opts.groupmarker[1]:
                  closeGroup();
                  break;

                case opts.optionalmarker[0]:
                  openenings.push(new MaskToken(!1, !0));
                  break;

                case opts.groupmarker[0]:
                  openenings.push(new MaskToken(!0));
                  break;

                case opts.quantifiermarker[0]:
                  var quantifier = new MaskToken(!1, !1, !0);
                  m = m.replace(/[{}]/g, "");
                  var mqj = m.split("|"), mq = mqj[0].split(","), mq0 = isNaN(mq[0]) ? mq[0] : parseInt(mq[0]), mq1 = 1 === mq.length ? mq0 : isNaN(mq[1]) ? mq[1] : parseInt(mq[1]);
                  "*" !== mq0 && "+" !== mq0 || (mq0 = "*" === mq1 ? 0 : 1), quantifier.quantifier = {
                      min: mq0,
                      max: mq1,
                      jit: mqj[1]
                  };
                  var matches = 0 < openenings.length ? openenings[openenings.length - 1].matches : currentToken.matches;
                  if (match = matches.pop(), match.isAlternator) {
                      matches.push(match), matches = match.matches;
                      var groupToken = new MaskToken(!0), tmpMatch = matches.pop();
                      matches.push(groupToken), matches = groupToken.matches, match = tmpMatch;
                  }
                  match.isGroup || (match = groupify([ match ])), matches.push(match), matches.push(quantifier);
                  break;

                case opts.alternatormarker:
                  if (0 < openenings.length) {
                      currentOpeningToken = openenings[openenings.length - 1];
                      var subToken = currentOpeningToken.matches[currentOpeningToken.matches.length - 1];
                      lastMatch = currentOpeningToken.openGroup && (void 0 === subToken.matches || !1 === subToken.isGroup && !1 === subToken.isAlternator) ? openenings.pop() : groupQuantifier(currentOpeningToken.matches);
                  } else lastMatch = groupQuantifier(currentToken.matches);
                  if (lastMatch.isAlternator) openenings.push(lastMatch); else if (lastMatch.alternatorGroup ? (alternator = openenings.pop(),
                  lastMatch.alternatorGroup = !1) : alternator = new MaskToken(!1, !1, !1, !0), alternator.matches.push(lastMatch),
                  openenings.push(alternator), lastMatch.openGroup) {
                      lastMatch.openGroup = !1;
                      var alternatorGroup = new MaskToken(!0);
                      alternatorGroup.alternatorGroup = !0, openenings.push(alternatorGroup);
                  }
                  break;

                default:
                  defaultCase();
              }
          }
          for (closeRegexGroup && closeGroup(); 0 < openenings.length; ) openingToken = openenings.pop(),
          currentToken.matches.push(openingToken);
          return 0 < currentToken.matches.length && (verifyGroupMarker(currentToken), maskTokens.push(currentToken)),
          (opts.numericInput || opts.isRTL) && reverseTokens(maskTokens[0]), maskTokens;
      }
      module.exports = {
          generateMaskSet: generateMaskSet,
          analyseMask: analyseMask
      };
  }, function(module, exports, __webpack_require__) {
      "use strict";
      __webpack_require__(5), __webpack_require__(7), __webpack_require__(8), module.exports = __webpack_require__(0);
  }, function(module, exports, __webpack_require__) {
      "use strict";
      var Inputmask = __webpack_require__(0);
      Inputmask.extendDefinitions({
          A: {
              validator: "[A-Za-z\u0410-\u044f\u0401\u0451\xc0-\xff\xb5]",
              casing: "upper"
          },
          "&": {
              validator: "[0-9A-Za-z\u0410-\u044f\u0401\u0451\xc0-\xff\xb5]",
              casing: "upper"
          },
          "#": {
              validator: "[0-9A-Fa-f]",
              casing: "upper"
          }
      });
      var ipValidatorRegex = new RegExp("25[0-5]|2[0-4][0-9]|[01][0-9][0-9]");
      function ipValidator(chrs, maskset, pos, strict, opts) {
          return chrs = -1 < pos - 1 && "." !== maskset.buffer[pos - 1] ? (chrs = maskset.buffer[pos - 1] + chrs,
          -1 < pos - 2 && "." !== maskset.buffer[pos - 2] ? maskset.buffer[pos - 2] + chrs : "0" + chrs) : "00" + chrs,
          ipValidatorRegex.test(chrs);
      }
      Inputmask.extendAliases({
          cssunit: {
              regex: "[+-]?[0-9]+\\.?([0-9]+)?(px|em|rem|ex|%|in|cm|mm|pt|pc)"
          },
          url: {
              regex: "(https?|ftp)//.*",
              autoUnmask: !1
          },
          ip: {
              mask: "i[i[i]].j[j[j]].k[k[k]].l[l[l]]",
              definitions: {
                  i: {
                      validator: ipValidator
                  },
                  j: {
                      validator: ipValidator
                  },
                  k: {
                      validator: ipValidator
                  },
                  l: {
                      validator: ipValidator
                  }
              },
              onUnMask: function onUnMask(maskedValue, unmaskedValue, opts) {
                  return maskedValue;
              },
              inputmode: "numeric"
          },
          email: {
              mask: "*{1,64}[.*{1,64}][.*{1,64}][.*{1,63}]@-{1,63}.-{1,63}[.-{1,63}][.-{1,63}]",
              greedy: !1,
              casing: "lower",
              onBeforePaste: function onBeforePaste(pastedValue, opts) {
                  return pastedValue = pastedValue.toLowerCase(), pastedValue.replace("mailto:", "");
              },
              definitions: {
                  "*": {
                      validator: "[0-9\uff11-\uff19A-Za-z\u0410-\u044f\u0401\u0451\xc0-\xff\xb5!#$%&'*+/=?^_`{|}~-]"
                  },
                  "-": {
                      validator: "[0-9A-Za-z-]"
                  }
              },
              onUnMask: function onUnMask(maskedValue, unmaskedValue, opts) {
                  return maskedValue;
              },
              inputmode: "email"
          },
          mac: {
              mask: "##:##:##:##:##:##"
          },
          vin: {
              mask: "V{13}9{4}",
              definitions: {
                  V: {
                      validator: "[A-HJ-NPR-Za-hj-npr-z\\d]",
                      casing: "upper"
                  }
              },
              clearIncomplete: !0,
              autoUnmask: !0
          }
      }), module.exports = Inputmask;
  }, function(module, exports, __webpack_require__) {
      "use strict";
      function _typeof(obj) {
          return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function _typeof(obj) {
              return typeof obj;
          } : function _typeof(obj) {
              return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
          }, _typeof(obj);
      }
      var $ = __webpack_require__(1), window = __webpack_require__(2), document = window.document, ua = window.navigator && window.navigator.userAgent || "", ie = 0 < ua.indexOf("MSIE ") || 0 < ua.indexOf("Trident/"), mobile = "ontouchstart" in window, iemobile = /iemobile/i.test(ua), iphone = /iphone/i.test(ua) && !iemobile;
      module.exports = function maskScope(actionObj, maskset, opts) {
          maskset = maskset || this.maskset, opts = opts || this.opts;
          var inputmask = this, el = this.el, isRTL = this.isRTL || (this.isRTL = opts.numericInput), undoValue, $el, skipKeyPressEvent = !1, skipInputEvent = !1, validationEvent = !1, ignorable = !1, maxLength, mouseEnter = !1, originalPlaceholder = void 0;
          function getMaskTemplate(baseOnInput, minimalPos, includeMode, noJit, clearOptionalTail) {
              var greedy = opts.greedy;
              clearOptionalTail && (opts.greedy = !1), minimalPos = minimalPos || 0;
              var maskTemplate = [], ndxIntlzr, pos = 0, test, testPos;
              do {
                  if (!0 === baseOnInput && maskset.validPositions[pos]) testPos = clearOptionalTail && !0 === maskset.validPositions[pos].match.optionality && void 0 === maskset.validPositions[pos + 1] && (!0 === maskset.validPositions[pos].generatedInput || maskset.validPositions[pos].input == opts.skipOptionalPartCharacter && 0 < pos) ? determineTestTemplate(pos, getTests(pos, ndxIntlzr, pos - 1)) : maskset.validPositions[pos],
                  test = testPos.match, ndxIntlzr = testPos.locator.slice(), maskTemplate.push(!0 === includeMode ? testPos.input : !1 === includeMode ? test.nativeDef : getPlaceholder(pos, test)); else {
                      testPos = getTestTemplate(pos, ndxIntlzr, pos - 1), test = testPos.match, ndxIntlzr = testPos.locator.slice();
                      var jitMasking = !0 !== noJit && (!1 !== opts.jitMasking ? opts.jitMasking : test.jit);
                      (!1 === jitMasking || void 0 === jitMasking || "number" == typeof jitMasking && isFinite(jitMasking) && pos < jitMasking) && maskTemplate.push(!1 === includeMode ? test.nativeDef : getPlaceholder(pos, test));
                  }
                  "auto" === opts.keepStatic && test.newBlockMarker && !0 !== test.static && (opts.keepStatic = pos - 1),
                  pos++;
              } while ((void 0 === maxLength || pos < maxLength) && (!0 !== test.static || "" !== test.def) || pos < minimalPos);
              return "" === maskTemplate[maskTemplate.length - 1] && maskTemplate.pop(), !1 === includeMode && void 0 !== maskset.maskLength || (maskset.maskLength = pos - 1),
              opts.greedy = greedy, maskTemplate;
          }
          function resetMaskSet(soft) {
              maskset.buffer = void 0, !0 !== soft && (maskset.validPositions = {}, maskset.p = 0);
          }
          function getLastValidPosition(closestTo, strict, validPositions) {
              var before = -1, after = -1, valids = validPositions || maskset.validPositions;
              for (var posNdx in void 0 === closestTo && (closestTo = -1), valids) {
                  var psNdx = parseInt(posNdx);
                  valids[psNdx] && (strict || !0 !== valids[psNdx].generatedInput) && (psNdx <= closestTo && (before = psNdx),
                  closestTo <= psNdx && (after = psNdx));
              }
              return -1 === before || before == closestTo ? after : -1 == after ? before : closestTo - before < after - closestTo ? before : after;
          }
          function getDecisionTaker(tst) {
              var decisionTaker = tst.locator[tst.alternation];
              return "string" == typeof decisionTaker && 0 < decisionTaker.length && (decisionTaker = decisionTaker.split(",")[0]),
              void 0 !== decisionTaker ? decisionTaker.toString() : "";
          }
          function getLocator(tst, align) {
              var locator = (null != tst.alternation ? tst.mloc[getDecisionTaker(tst)] : tst.locator).join("");
              if ("" !== locator) for (;locator.length < align; ) locator += "0";
              return locator;
          }
          function determineTestTemplate(pos, tests) {
              pos = 0 < pos ? pos - 1 : 0;
              for (var altTest = getTest(pos), targetLocator = getLocator(altTest), tstLocator, closest, bestMatch, ndx = 0; ndx < tests.length; ndx++) {
                  var tst = tests[ndx];
                  tstLocator = getLocator(tst, targetLocator.length);
                  var distance = Math.abs(tstLocator - targetLocator);
                  (void 0 === closest || "" !== tstLocator && distance < closest || bestMatch && !opts.greedy && bestMatch.match.optionality && "master" === bestMatch.match.newBlockMarker && (!tst.match.optionality || !tst.match.newBlockMarker) || bestMatch && bestMatch.match.optionalQuantifier && !tst.match.optionalQuantifier) && (closest = distance,
                  bestMatch = tst);
              }
              return bestMatch;
          }
          function getTestTemplate(pos, ndxIntlzr, tstPs) {
              return maskset.validPositions[pos] || determineTestTemplate(pos, getTests(pos, ndxIntlzr ? ndxIntlzr.slice() : ndxIntlzr, tstPs));
          }
          function getTest(pos, tests) {
              return maskset.validPositions[pos] ? maskset.validPositions[pos] : (tests || getTests(pos))[0];
          }
          function positionCanMatchDefinition(pos, testDefinition, opts) {
              for (var valid = !1, tests = getTests(pos), defProp = opts.shiftPositions ? "def" : "nativeDef", tndx = 0; tndx < tests.length; tndx++) if (tests[tndx].match && tests[tndx].match[defProp] === testDefinition.match[defProp]) {
                  valid = !0;
                  break;
              }
              return !1 === valid && void 0 !== maskset.jitOffset[pos] && (valid = positionCanMatchDefinition(pos + maskset.jitOffset[pos], testDefinition, opts)),
              valid;
          }
          function getTests(pos, ndxIntlzr, tstPs) {
              var maskTokens = maskset.maskToken, testPos = ndxIntlzr ? tstPs : 0, ndxInitializer = ndxIntlzr ? ndxIntlzr.slice() : [ 0 ], matches = [], insertStop = !1, latestMatch, cacheDependency = ndxIntlzr ? ndxIntlzr.join("") : "";
              function resolveTestFromToken(maskToken, ndxInitializer, loopNdx, quantifierRecurse) {
                  function handleMatch(match, loopNdx, quantifierRecurse) {
                      function isFirstMatch(latestMatch, tokenGroup) {
                          var firstMatch = 0 === $.inArray(latestMatch, tokenGroup.matches);
                          return firstMatch || $.each(tokenGroup.matches, function(ndx, match) {
                              if (!0 === match.isQuantifier ? firstMatch = isFirstMatch(latestMatch, tokenGroup.matches[ndx - 1]) : Object.prototype.hasOwnProperty.call(match, "matches") && (firstMatch = isFirstMatch(latestMatch, match)),
                              firstMatch) return !1;
                          }), firstMatch;
                      }
                      function resolveNdxInitializer(pos, alternateNdx, targetAlternation) {
                          var bestMatch, indexPos;
                          if ((maskset.tests[pos] || maskset.validPositions[pos]) && $.each(maskset.tests[pos] || [ maskset.validPositions[pos] ], function(ndx, lmnt) {
                              if (lmnt.mloc[alternateNdx]) return bestMatch = lmnt, !1;
                              var alternation = void 0 !== targetAlternation ? targetAlternation : lmnt.alternation, ndxPos = void 0 !== lmnt.locator[alternation] ? lmnt.locator[alternation].toString().indexOf(alternateNdx) : -1;
                              (void 0 === indexPos || ndxPos < indexPos) && -1 !== ndxPos && (bestMatch = lmnt,
                              indexPos = ndxPos);
                          }), bestMatch) {
                              var bestMatchAltIndex = bestMatch.locator[bestMatch.alternation], locator = bestMatch.mloc[alternateNdx] || bestMatch.mloc[bestMatchAltIndex] || bestMatch.locator;
                              return locator.slice((void 0 !== targetAlternation ? targetAlternation : bestMatch.alternation) + 1);
                          }
                          return void 0 !== targetAlternation ? resolveNdxInitializer(pos, alternateNdx) : void 0;
                      }
                      function isSubsetOf(source, target) {
                          function expand(pattern) {
                              for (var expanded = [], start = -1, end, i = 0, l = pattern.length; i < l; i++) if ("-" === pattern.charAt(i)) for (end = pattern.charCodeAt(i + 1); ++start < end; ) expanded.push(String.fromCharCode(start)); else start = pattern.charCodeAt(i),
                              expanded.push(pattern.charAt(i));
                              return expanded.join("");
                          }
                          return source.match.def === target.match.nativeDef || !(!(opts.regex || source.match.fn instanceof RegExp && target.match.fn instanceof RegExp) || !0 === source.match.static || !0 === target.match.static) && -1 !== expand(target.match.fn.toString().replace(/[[\]/]/g, "")).indexOf(expand(source.match.fn.toString().replace(/[[\]/]/g, "")));
                      }
                      function staticCanMatchDefinition(source, target) {
                          return !0 === source.match.static && !0 !== target.match.static && target.match.fn.test(source.match.def, maskset, pos, !1, opts, !1);
                      }
                      function setMergeLocators(targetMatch, altMatch) {
                          if (void 0 === altMatch || targetMatch.alternation === altMatch.alternation && -1 === targetMatch.locator[targetMatch.alternation].toString().indexOf(altMatch.locator[altMatch.alternation])) {
                              targetMatch.mloc = targetMatch.mloc || {};
                              var locNdx = targetMatch.locator[targetMatch.alternation];
                              if (void 0 !== locNdx) {
                                  if ("string" == typeof locNdx && (locNdx = locNdx.split(",")[0]), void 0 === targetMatch.mloc[locNdx] && (targetMatch.mloc[locNdx] = targetMatch.locator.slice()),
                                  void 0 !== altMatch) {
                                      for (var ndx in altMatch.mloc) "string" == typeof ndx && (ndx = ndx.split(",")[0]),
                                      void 0 === targetMatch.mloc[ndx] && (targetMatch.mloc[ndx] = altMatch.mloc[ndx]);
                                      targetMatch.locator[targetMatch.alternation] = Object.keys(targetMatch.mloc).join(",");
                                  }
                                  return !0;
                              }
                              targetMatch.alternation = void 0;
                          }
                          return !1;
                      }
                      if (500 < testPos && void 0 !== quantifierRecurse) throw "Inputmask: There is probably an error in your mask definition or in the code. Create an issue on github with an example of the mask you are using. " + maskset.mask;
                      if (testPos === pos && void 0 === match.matches) return matches.push({
                          match: match,
                          locator: loopNdx.reverse(),
                          cd: cacheDependency,
                          mloc: {}
                      }), !0;
                      if (void 0 !== match.matches) {
                          if (match.isGroup && quantifierRecurse !== match) {
                              if (match = handleMatch(maskToken.matches[$.inArray(match, maskToken.matches) + 1], loopNdx, quantifierRecurse),
                              match) return !0;
                          } else if (match.isOptional) {
                              var optionalToken = match, mtchsNdx = matches.length;
                              if (match = resolveTestFromToken(match, ndxInitializer, loopNdx, quantifierRecurse),
                              match) {
                                  if ($.each(matches, function(ndx, mtch) {
                                      mtchsNdx <= ndx && (mtch.match.optionality = !0);
                                  }), latestMatch = matches[matches.length - 1].match, void 0 !== quantifierRecurse || !isFirstMatch(latestMatch, optionalToken)) return !0;
                                  insertStop = !0, testPos = pos;
                              }
                          } else if (match.isAlternator) {
                              var alternateToken = match, malternateMatches = [], maltMatches, currentMatches = matches.slice(), loopNdxCnt = loopNdx.length, altIndex = 0 < ndxInitializer.length ? ndxInitializer.shift() : -1;
                              if (-1 === altIndex || "string" == typeof altIndex) {
                                  var currentPos = testPos, ndxInitializerClone = ndxInitializer.slice(), altIndexArr = [], amndx;
                                  if ("string" == typeof altIndex) altIndexArr = altIndex.split(","); else for (amndx = 0; amndx < alternateToken.matches.length; amndx++) altIndexArr.push(amndx.toString());
                                  if (void 0 !== maskset.excludes[pos]) {
                                      for (var altIndexArrClone = altIndexArr.slice(), i = 0, el = maskset.excludes[pos].length; i < el; i++) altIndexArr.splice(altIndexArr.indexOf(maskset.excludes[pos][i].toString()), 1);
                                      0 === altIndexArr.length && (delete maskset.excludes[pos], altIndexArr = altIndexArrClone);
                                  }
                                  (!0 === opts.keepStatic || isFinite(parseInt(opts.keepStatic)) && currentPos >= opts.keepStatic) && (altIndexArr = altIndexArr.slice(0, 1));
                                  for (var unMatchedAlternation = !1, ndx = 0; ndx < altIndexArr.length; ndx++) {
                                      amndx = parseInt(altIndexArr[ndx]), matches = [], ndxInitializer = "string" == typeof altIndex && resolveNdxInitializer(testPos, amndx, loopNdxCnt) || ndxInitializerClone.slice(),
                                      alternateToken.matches[amndx] && handleMatch(alternateToken.matches[amndx], [ amndx ].concat(loopNdx), quantifierRecurse) ? match = !0 : 0 === ndx && (unMatchedAlternation = !0),
                                      maltMatches = matches.slice(), testPos = currentPos, matches = [];
                                      for (var ndx1 = 0; ndx1 < maltMatches.length; ndx1++) {
                                          var altMatch = maltMatches[ndx1], dropMatch = !1;
                                          altMatch.match.jit = altMatch.match.jit || unMatchedAlternation, altMatch.alternation = altMatch.alternation || loopNdxCnt,
                                          setMergeLocators(altMatch);
                                          for (var ndx2 = 0; ndx2 < malternateMatches.length; ndx2++) {
                                              var altMatch2 = malternateMatches[ndx2];
                                              if ("string" != typeof altIndex || void 0 !== altMatch.alternation && -1 !== $.inArray(altMatch.locator[altMatch.alternation].toString(), altIndexArr)) {
                                                  if (altMatch.match.nativeDef === altMatch2.match.nativeDef) {
                                                      dropMatch = !0, setMergeLocators(altMatch2, altMatch);
                                                      break;
                                                  }
                                                  if (isSubsetOf(altMatch, altMatch2)) {
                                                      setMergeLocators(altMatch, altMatch2) && (dropMatch = !0, malternateMatches.splice(malternateMatches.indexOf(altMatch2), 0, altMatch));
                                                      break;
                                                  }
                                                  if (isSubsetOf(altMatch2, altMatch)) {
                                                      setMergeLocators(altMatch2, altMatch);
                                                      break;
                                                  }
                                                  if (staticCanMatchDefinition(altMatch, altMatch2)) {
                                                      setMergeLocators(altMatch, altMatch2) && (dropMatch = !0, malternateMatches.splice(malternateMatches.indexOf(altMatch2), 0, altMatch));
                                                      break;
                                                  }
                                              }
                                          }
                                          dropMatch || malternateMatches.push(altMatch);
                                      }
                                  }
                                  matches = currentMatches.concat(malternateMatches), testPos = pos, insertStop = 0 < matches.length,
                                  match = 0 < malternateMatches.length, ndxInitializer = ndxInitializerClone.slice();
                              } else match = handleMatch(alternateToken.matches[altIndex] || maskToken.matches[altIndex], [ altIndex ].concat(loopNdx), quantifierRecurse);
                              if (match) return !0;
                          } else if (match.isQuantifier && quantifierRecurse !== maskToken.matches[$.inArray(match, maskToken.matches) - 1]) for (var qt = match, qndx = 0 < ndxInitializer.length ? ndxInitializer.shift() : 0; qndx < (isNaN(qt.quantifier.max) ? qndx + 1 : qt.quantifier.max) && testPos <= pos; qndx++) {
                              var tokenGroup = maskToken.matches[$.inArray(qt, maskToken.matches) - 1];
                              if (match = handleMatch(tokenGroup, [ qndx ].concat(loopNdx), tokenGroup), match) {
                                  if (latestMatch = matches[matches.length - 1].match, latestMatch.optionalQuantifier = qndx >= qt.quantifier.min,
                                  latestMatch.jit = (qndx || 1) * tokenGroup.matches.indexOf(latestMatch) >= qt.quantifier.jit,
                                  latestMatch.optionalQuantifier && isFirstMatch(latestMatch, tokenGroup)) {
                                      insertStop = !0, testPos = pos;
                                      break;
                                  }
                                  return latestMatch.jit && (maskset.jitOffset[pos] = tokenGroup.matches.length - tokenGroup.matches.indexOf(latestMatch)),
                                  !0;
                              }
                          } else if (match = resolveTestFromToken(match, ndxInitializer, loopNdx, quantifierRecurse),
                          match) return !0;
                      } else testPos++;
                  }
                  for (var tndx = 0 < ndxInitializer.length ? ndxInitializer.shift() : 0; tndx < maskToken.matches.length; tndx++) if (!0 !== maskToken.matches[tndx].isQuantifier) {
                      var match = handleMatch(maskToken.matches[tndx], [ tndx ].concat(loopNdx), quantifierRecurse);
                      if (match && testPos === pos) return match;
                      if (pos < testPos) break;
                  }
              }
              function mergeLocators(pos, tests) {
                  var locator = [];
                  return $.isArray(tests) || (tests = [ tests ]), 0 < tests.length && (void 0 === tests[0].alternation || !0 === opts.keepStatic ? (locator = determineTestTemplate(pos, tests.slice()).locator.slice(),
                  0 === locator.length && (locator = tests[0].locator.slice())) : $.each(tests, function(ndx, tst) {
                      if ("" !== tst.def) if (0 === locator.length) locator = tst.locator.slice(); else for (var i = 0; i < locator.length; i++) tst.locator[i] && -1 === locator[i].toString().indexOf(tst.locator[i]) && (locator[i] += "," + tst.locator[i]);
                  })), locator;
              }
              if (-1 < pos && (void 0 === maxLength || pos < maxLength)) {
                  if (void 0 === ndxIntlzr) {
                      for (var previousPos = pos - 1, test; void 0 === (test = maskset.validPositions[previousPos] || maskset.tests[previousPos]) && -1 < previousPos; ) previousPos--;
                      void 0 !== test && -1 < previousPos && (ndxInitializer = mergeLocators(previousPos, test),
                      cacheDependency = ndxInitializer.join(""), testPos = previousPos);
                  }
                  if (maskset.tests[pos] && maskset.tests[pos][0].cd === cacheDependency) return maskset.tests[pos];
                  for (var mtndx = ndxInitializer.shift(); mtndx < maskTokens.length; mtndx++) {
                      var match = resolveTestFromToken(maskTokens[mtndx], ndxInitializer, [ mtndx ]);
                      if (match && testPos === pos || pos < testPos) break;
                  }
              }
              return 0 !== matches.length && !insertStop || matches.push({
                  match: {
                      fn: null,
                      static: !0,
                      optionality: !1,
                      casing: null,
                      def: "",
                      placeholder: ""
                  },
                  locator: [],
                  mloc: {},
                  cd: cacheDependency
              }), void 0 !== ndxIntlzr && maskset.tests[pos] ? $.extend(!0, [], matches) : (maskset.tests[pos] = $.extend(!0, [], matches),
              maskset.tests[pos]);
          }
          function getBufferTemplate() {
              return void 0 === maskset._buffer && (maskset._buffer = getMaskTemplate(!1, 1),
              void 0 === maskset.buffer && (maskset.buffer = maskset._buffer.slice())), maskset._buffer;
          }
          function getBuffer(noCache) {
              return void 0 !== maskset.buffer && !0 !== noCache || (maskset.buffer = getMaskTemplate(!0, getLastValidPosition(), !0),
              void 0 === maskset._buffer && (maskset._buffer = maskset.buffer.slice())), maskset.buffer;
          }
          function refreshFromBuffer(start, end, buffer) {
              var i, p, skipOptionalPartCharacter = opts.skipOptionalPartCharacter;
              if (opts.skipOptionalPartCharacter = "", !0 === start) resetMaskSet(), maskset.tests = {},
              start = 0, end = buffer.length; else for (i = start; i < end; i++) delete maskset.validPositions[i];
              for (p = start, i = start; i < end; i++) {
                  var valResult = isValid(p, buffer[i], !0, !0);
                  !1 !== valResult && (p = void 0 !== valResult.caret && valResult.caret > valResult.pos ? valResult.caret : valResult.pos + 1);
              }
              opts.skipOptionalPartCharacter = skipOptionalPartCharacter;
          }
          function casing(elem, test, pos) {
              switch (opts.casing || test.casing) {
                case "upper":
                  elem = elem.toUpperCase();
                  break;

                case "lower":
                  elem = elem.toLowerCase();
                  break;

                case "title":
                  var posBefore = maskset.validPositions[pos - 1];
                  elem = 0 === pos || posBefore && posBefore.input === String.fromCharCode(Inputmask.keyCode.SPACE) ? elem.toUpperCase() : elem.toLowerCase();
                  break;

                default:
                  if ($.isFunction(opts.casing)) {
                      var args = Array.prototype.slice.call(arguments);
                      args.push(maskset.validPositions), elem = opts.casing.apply(this, args);
                  }
              }
              return elem;
          }
          function checkAlternationMatch(altArr1, altArr2, na) {
              for (var altArrC = opts.greedy ? altArr2 : altArr2.slice(0, 1), isMatch = !1, naArr = void 0 !== na ? na.split(",") : [], naNdx, i = 0; i < naArr.length; i++) -1 !== (naNdx = altArr1.indexOf(naArr[i])) && altArr1.splice(naNdx, 1);
              for (var alndx = 0; alndx < altArr1.length; alndx++) if (-1 !== $.inArray(altArr1[alndx], altArrC)) {
                  isMatch = !0;
                  break;
              }
              return isMatch;
          }
          function alternate(maskPos, c, strict, fromIsValid, rAltPos, selection) {
              var validPsClone = $.extend(!0, {}, maskset.validPositions), tstClone = $.extend(!0, {}, maskset.tests), lastAlt, alternation, isValidRslt = !1, returnRslt = !1, altPos, prevAltPos, i, validPos, decisionPos, lAltPos = void 0 !== rAltPos ? rAltPos : getLastValidPosition(), nextPos, input, begin, end;
              if (selection && (begin = selection.begin, end = selection.end, selection.begin > selection.end && (begin = selection.end,
              end = selection.begin)), -1 === lAltPos && void 0 === rAltPos) lastAlt = 0, prevAltPos = getTest(lastAlt),
              alternation = prevAltPos.alternation; else for (;0 <= lAltPos; lAltPos--) if (altPos = maskset.validPositions[lAltPos],
              altPos && void 0 !== altPos.alternation) {
                  if (prevAltPos && prevAltPos.locator[altPos.alternation] !== altPos.locator[altPos.alternation]) break;
                  lastAlt = lAltPos, alternation = maskset.validPositions[lastAlt].alternation, prevAltPos = altPos;
              }
              if (void 0 !== alternation) {
                  decisionPos = parseInt(lastAlt), maskset.excludes[decisionPos] = maskset.excludes[decisionPos] || [],
                  !0 !== maskPos && maskset.excludes[decisionPos].push(getDecisionTaker(prevAltPos));
                  var validInputs = [], resultPos = -1;
                  for (i = decisionPos; i < getLastValidPosition(void 0, !0) + 1; i++) -1 === resultPos && maskPos <= i && void 0 !== c && (validInputs.push(c),
                  resultPos = validInputs.length - 1), validPos = maskset.validPositions[i], validPos && !0 !== validPos.generatedInput && (void 0 === selection || i < begin || end <= i) && validInputs.push(validPos.input),
                  delete maskset.validPositions[i];
                  for (-1 === resultPos && void 0 !== c && (validInputs.push(c), resultPos = validInputs.length - 1); void 0 !== maskset.excludes[decisionPos] && maskset.excludes[decisionPos].length < 10; ) {
                      for (maskset.tests[decisionPos] = void 0, resetMaskSet(!0), isValidRslt = !0, i = 0; i < validInputs.length && (nextPos = isValidRslt.caret || getLastValidPosition(void 0, !0) + 1,
                      input = validInputs[i], isValidRslt = isValid(nextPos, input, !1, fromIsValid, !0)); i++) i === resultPos && (returnRslt = isValidRslt);
                      if (isValidRslt) break;
                      if (resetMaskSet(), prevAltPos = getTest(decisionPos), maskset.validPositions = $.extend(!0, {}, validPsClone),
                      maskset.tests = $.extend(!0, {}, tstClone), !maskset.excludes[decisionPos]) {
                          returnRslt = alternate(maskPos, c, strict, fromIsValid, decisionPos - 1, selection);
                          break;
                      }
                      var decisionTaker = getDecisionTaker(prevAltPos);
                      if (-1 !== maskset.excludes[decisionPos].indexOf(decisionTaker)) {
                          returnRslt = alternate(maskPos, c, strict, fromIsValid, decisionPos - 1, selection);
                          break;
                      }
                      for (maskset.excludes[decisionPos].push(decisionTaker), i = decisionPos; i < getLastValidPosition(void 0, !0) + 1; i++) delete maskset.validPositions[i];
                  }
              }
              return delete maskset.excludes[decisionPos], returnRslt;
          }
          function isValid(pos, c, strict, fromIsValid, fromAlternate, validateOnly) {
              function isSelection(posObj) {
                  return isRTL ? 1 < posObj.begin - posObj.end || posObj.begin - posObj.end == 1 : 1 < posObj.end - posObj.begin || posObj.end - posObj.begin == 1;
              }
              strict = !0 === strict;
              var maskPos = pos;
              function processCommandObject(commandObj) {
                  if (void 0 !== commandObj) {
                      if (void 0 !== commandObj.remove && ($.isArray(commandObj.remove) || (commandObj.remove = [ commandObj.remove ]),
                      $.each(commandObj.remove.sort(function(a, b) {
                          return b.pos - a.pos;
                      }), function(ndx, lmnt) {
                          revalidateMask({
                              begin: lmnt,
                              end: lmnt + 1
                          });
                      }), commandObj.remove = void 0), void 0 !== commandObj.insert && ($.isArray(commandObj.insert) || (commandObj.insert = [ commandObj.insert ]),
                      $.each(commandObj.insert.sort(function(a, b) {
                          return a.pos - b.pos;
                      }), function(ndx, lmnt) {
                          "" !== lmnt.c && isValid(lmnt.pos, lmnt.c, void 0 === lmnt.strict || lmnt.strict, void 0 !== lmnt.fromIsValid ? lmnt.fromIsValid : fromIsValid);
                      }), commandObj.insert = void 0), commandObj.refreshFromBuffer && commandObj.buffer) {
                          var refresh = commandObj.refreshFromBuffer;
                          refreshFromBuffer(!0 === refresh ? refresh : refresh.start, refresh.end, commandObj.buffer),
                          commandObj.refreshFromBuffer = void 0;
                      }
                      void 0 !== commandObj.rewritePosition && (maskPos = commandObj.rewritePosition,
                      commandObj = !0);
                  }
                  return commandObj;
              }
              function _isValid(position, c, strict) {
                  var rslt = !1;
                  return $.each(getTests(position), function(ndx, tst) {
                      var test = tst.match;
                      if (getBuffer(!0), rslt = null != test.fn ? test.fn.test(c, maskset, position, strict, opts, isSelection(pos)) : (c === test.def || c === opts.skipOptionalPartCharacter) && "" !== test.def && {
                          c: getPlaceholder(position, test, !0) || test.def,
                          pos: position
                      }, !1 !== rslt) {
                          var elem = void 0 !== rslt.c ? rslt.c : c, validatedPos = position;
                          return elem = elem === opts.skipOptionalPartCharacter && !0 === test.static ? getPlaceholder(position, test, !0) || test.def : elem,
                          rslt = processCommandObject(rslt), !0 !== rslt && void 0 !== rslt.pos && rslt.pos !== position && (validatedPos = rslt.pos),
                          !0 !== rslt && void 0 === rslt.pos && void 0 === rslt.c ? !1 : (!1 === revalidateMask(pos, $.extend({}, tst, {
                              input: casing(elem, test, validatedPos)
                          }), fromIsValid, validatedPos) && (rslt = !1), !1);
                      }
                  }), rslt;
              }
              void 0 !== pos.begin && (maskPos = isRTL ? pos.end : pos.begin);
              var result = !0, positionsClone = $.extend(!0, {}, maskset.validPositions);
              if ($.isFunction(opts.preValidation) && !0 !== fromIsValid && !0 !== validateOnly && !0 !== fromAlternate && (result = opts.preValidation(getBuffer(), maskPos, c, isSelection(pos), opts, maskset, pos, strict),
              result = processCommandObject(result)), !0 === result) {
                  if (void 0 === maxLength || maskPos < maxLength) {
                      if (result = _isValid(maskPos, c, strict), (!strict || !0 === fromIsValid) && !1 === result && !0 !== validateOnly) {
                          var currentPosValid = maskset.validPositions[maskPos];
                          if (!currentPosValid || !0 !== currentPosValid.match.static || currentPosValid.match.def !== c && c !== opts.skipOptionalPartCharacter) {
                              if (opts.insertMode || void 0 === maskset.validPositions[seekNext(maskPos)] || pos.end > maskPos) {
                                  var skip = !1;
                                  if (maskset.jitOffset[maskPos] && void 0 === maskset.validPositions[seekNext(maskPos)] && (result = isValid(maskPos + maskset.jitOffset[maskPos], c, !0),
                                  !1 !== result && (!0 !== fromAlternate && (result.caret = maskPos), skip = !0)),
                                  pos.end > maskPos && (maskset.validPositions[maskPos] = void 0), !skip && !isMask(maskPos, !0)) for (var nPos = maskPos + 1, snPos = seekNext(maskPos); nPos <= snPos; nPos++) if (result = _isValid(nPos, c, strict),
                                  !1 !== result) {
                                      result = trackbackPositions(maskPos, void 0 !== result.pos ? result.pos : nPos) || result,
                                      maskPos = nPos;
                                      break;
                                  }
                              }
                          } else result = {
                              caret: seekNext(maskPos)
                          };
                      }
                  } else result = !1;
                  !1 !== result || !1 !== opts.keepStatic && !isComplete(getBuffer()) && 0 !== maskPos || strict || !0 === fromAlternate || (result = alternate(maskPos, c, strict, fromIsValid, void 0, pos)),
                  !0 === result && (result = {
                      pos: maskPos
                  });
              }
              if ($.isFunction(opts.postValidation) && !1 !== result && !0 !== fromIsValid && !0 !== validateOnly) {
                  var postResult = opts.postValidation(getBuffer(!0), void 0 !== pos.begin ? isRTL ? pos.end : pos.begin : pos, result, opts, maskset, strict);
                  void 0 !== postResult && (result = !0 === postResult ? result : postResult);
              }
              result && void 0 === result.pos && (result.pos = maskPos), !1 === result || !0 === validateOnly ? (resetMaskSet(!0),
              maskset.validPositions = $.extend(!0, {}, positionsClone)) : trackbackPositions(void 0, maskPos, !0);
              var endResult = processCommandObject(result);
              return endResult;
          }
          function trackbackPositions(originalPos, newPos, fillOnly) {
              if (void 0 === originalPos) for (originalPos = newPos - 1; 0 < originalPos && !maskset.validPositions[originalPos]; originalPos--) ;
              for (var ps = originalPos; ps < newPos; ps++) if (void 0 === maskset.validPositions[ps] && !isMask(ps, !0)) {
                  var vp = 0 == ps ? getTest(ps) : maskset.validPositions[ps - 1];
                  if (vp) {
                      var tests = getTests(ps).slice();
                      "" === tests[tests.length - 1].match.def && tests.pop();
                      var bestMatch = determineTestTemplate(ps, tests), np;
                      if (bestMatch && (!0 !== bestMatch.match.jit || "master" === bestMatch.match.newBlockMarker && (np = maskset.validPositions[ps + 1]) && !0 === np.match.optionalQuantifier) && (bestMatch = $.extend({}, bestMatch, {
                          input: getPlaceholder(ps, bestMatch.match, !0) || bestMatch.match.def
                      }), bestMatch.generatedInput = !0, revalidateMask(ps, bestMatch, !0), !0 !== fillOnly)) {
                          var cvpInput = maskset.validPositions[newPos].input;
                          return maskset.validPositions[newPos] = void 0, isValid(newPos, cvpInput, !0, !0);
                      }
                  }
              }
          }
          function revalidateMask(pos, validTest, fromIsValid, validatedPos) {
              function IsEnclosedStatic(pos, valids, selection) {
                  var posMatch = valids[pos];
                  if (void 0 === posMatch || !0 !== posMatch.match.static || !0 === posMatch.match.optionality || void 0 !== valids[0] && void 0 !== valids[0].alternation) return !1;
                  var prevMatch = selection.begin <= pos - 1 ? valids[pos - 1] && !0 === valids[pos - 1].match.static && valids[pos - 1] : valids[pos - 1], nextMatch = selection.end > pos + 1 ? valids[pos + 1] && !0 === valids[pos + 1].match.static && valids[pos + 1] : valids[pos + 1];
                  return prevMatch && nextMatch;
              }
              var offset = 0, begin = void 0 !== pos.begin ? pos.begin : pos, end = void 0 !== pos.end ? pos.end : pos;
              if (pos.begin > pos.end && (begin = pos.end, end = pos.begin), void 0 === validTest && !1 === opts.insertMode && end < maskset.maskLength && (0 === begin && 0 === end || (begin += 1,
              end += 1)), validatedPos = void 0 !== validatedPos ? validatedPos : begin, begin !== end || opts.insertMode && void 0 !== maskset.validPositions[validatedPos] && void 0 === fromIsValid || void 0 === validTest) {
                  var positionsClone = $.extend(!0, {}, maskset.validPositions), lvp = void 0 === validTest && !1 === opts.insertMode ? 1 < end ? end - 1 : end : getLastValidPosition(void 0, !0), i;
                  for (maskset.p = begin, i = lvp; begin <= i; i--) delete maskset.validPositions[i],
                  void 0 === validTest && delete maskset.tests[i + 1];
                  var valid = !0, j = validatedPos, posMatch = j, t;
                  if (i = j, validTest && (maskset.validPositions[validatedPos] = $.extend(!0, {}, validTest),
                  posMatch++, j++, begin < end && i++), validTest || opts.insertMode) for (;i <= lvp; i++) {
                      if (void 0 !== (t = positionsClone[i]) && !0 !== t.generatedInput && (end <= i || begin <= i && IsEnclosedStatic(i, positionsClone, {
                          begin: begin,
                          end: end
                      }))) {
                          for (;"" !== getTest(posMatch).match.def; ) {
                              if (positionCanMatchDefinition(posMatch, t, opts) || "+" === t.match.def) {
                                  "+" === t.match.def && getBuffer(!0);
                                  var result = isValid(posMatch, t.input, "+" !== t.match.def, "+" !== t.match.def);
                                  if (valid = !1 !== result, j = (result.pos || posMatch) + 1, !valid) break;
                              } else valid = !1;
                              if (valid) {
                                  void 0 === validTest && t.match.static && i === pos.begin && offset++;
                                  break;
                              }
                              if (!valid && posMatch > maskset.maskLength) break;
                              posMatch++;
                          }
                          "" == getTest(posMatch).match.def && (valid = !1), posMatch = j;
                      }
                      if (!valid) break;
                  }
                  if (!valid) return maskset.validPositions = $.extend(!0, {}, positionsClone), resetMaskSet(!0),
                  !1;
              } else validTest && (maskset.validPositions[validatedPos] = $.extend(!0, {}, validTest));
              return resetMaskSet(!0), offset;
          }
          function isMask(pos, strict, fuzzy) {
              var test = getTestTemplate(pos).match;
              if ("" === test.def && (test = getTest(pos).match), !0 !== test.static) return test.fn;
              if (!0 === fuzzy && void 0 !== maskset.validPositions[pos] && !0 !== maskset.validPositions[pos].generatedInput) return !0;
              if (!0 !== strict && -1 < pos) {
                  var tests = getTests(pos);
                  return tests.length > 1 + ("" === tests[tests.length - 1].match.def ? 1 : 0);
              }
              return !1;
          }
          function seekNext(pos, newBlock) {
              for (var position = pos + 1; "" !== getTest(position).match.def && (!0 === newBlock && (!0 !== getTest(position).match.newBlockMarker || !isMask(position, void 0, !0)) || !0 !== newBlock && !isMask(position, void 0, !0)); ) position++;
              return position;
          }
          function seekPrevious(pos, newBlock) {
              var position = pos, tests;
              if (position <= 0) return 0;
              for (;0 < --position && (!0 === newBlock && !0 !== getTest(position).match.newBlockMarker || !0 !== newBlock && !isMask(position, void 0, !0) && (tests = getTests(position),
              tests.length < 2 || 2 === tests.length && "" === tests[1].match.def)); ) ;
              return position;
          }
          function writeBuffer(input, buffer, caretPos, event, triggerEvents) {
              if (event && $.isFunction(opts.onBeforeWrite)) {
                  var result = opts.onBeforeWrite.call(inputmask, event, buffer, caretPos, opts);
                  if (result) {
                      if (result.refreshFromBuffer) {
                          var refresh = result.refreshFromBuffer;
                          refreshFromBuffer(!0 === refresh ? refresh : refresh.start, refresh.end, result.buffer || buffer),
                          buffer = getBuffer(!0);
                      }
                      void 0 !== caretPos && (caretPos = void 0 !== result.caret ? result.caret : caretPos);
                  }
              }
              if (void 0 !== input && (input.inputmask._valueSet(buffer.join("")), void 0 === caretPos || void 0 !== event && "blur" === event.type || caret(input, caretPos),
              !0 === triggerEvents)) {
                  var $input = $(input), nptVal = input.inputmask._valueGet();
                  skipInputEvent = !0, $input.trigger("input"), setTimeout(function() {
                      nptVal === getBufferTemplate().join("") ? $input.trigger("cleared") : !0 === isComplete(buffer) && $input.trigger("complete");
                  }, 0);
              }
          }
          function getPlaceholder(pos, test, returnPL) {
              if (test = test || getTest(pos).match, void 0 !== test.placeholder || !0 === returnPL) return $.isFunction(test.placeholder) ? test.placeholder(opts) : test.placeholder;
              if (!0 !== test.static) return opts.placeholder.charAt(pos % opts.placeholder.length);
              if (-1 < pos && void 0 === maskset.validPositions[pos]) {
                  var tests = getTests(pos), staticAlternations = [], prevTest;
                  if (tests.length > 1 + ("" === tests[tests.length - 1].match.def ? 1 : 0)) for (var i = 0; i < tests.length; i++) if (!0 !== tests[i].match.optionality && !0 !== tests[i].match.optionalQuantifier && (!0 === tests[i].match.static || void 0 === prevTest || !1 !== tests[i].match.fn.test(prevTest.match.def, maskset, pos, !0, opts)) && (staticAlternations.push(tests[i]),
                  !0 === tests[i].match.static && (prevTest = tests[i]), 1 < staticAlternations.length && /[0-9a-bA-Z]/.test(staticAlternations[0].match.def))) return opts.placeholder.charAt(pos % opts.placeholder.length);
              }
              return test.def;
          }
          function HandleNativePlaceholder(npt, value) {
              if (ie) {
                  if (npt.inputmask._valueGet() !== value && (npt.placeholder !== value || "" === npt.placeholder)) {
                      var buffer = getBuffer().slice(), nptValue = npt.inputmask._valueGet();
                      if (nptValue !== value) {
                          var lvp = getLastValidPosition();
                          -1 === lvp && nptValue === getBufferTemplate().join("") ? buffer = [] : -1 !== lvp && clearOptionalTail(buffer),
                          writeBuffer(npt, buffer);
                      }
                  }
              } else npt.placeholder !== value && (npt.placeholder = value, "" === npt.placeholder && npt.removeAttribute("placeholder"));
          }
          function determineNewCaretPosition(selectedCaret, tabbed) {
              function doRadixFocus(clickPos) {
                  if ("" !== opts.radixPoint && 0 !== opts.digits) {
                      var vps = maskset.validPositions;
                      if (void 0 === vps[clickPos] || vps[clickPos].input === getPlaceholder(clickPos)) {
                          if (clickPos < seekNext(-1)) return !0;
                          var radixPos = $.inArray(opts.radixPoint, getBuffer());
                          if (-1 !== radixPos) {
                              for (var vp in vps) if (vps[vp] && radixPos < vp && vps[vp].input !== getPlaceholder(vp)) return !1;
                              return !0;
                          }
                      }
                  }
                  return !1;
              }
              if (tabbed && (isRTL ? selectedCaret.end = selectedCaret.begin : selectedCaret.begin = selectedCaret.end),
              selectedCaret.begin === selectedCaret.end) switch (opts.positionCaretOnClick) {
                case "none":
                  break;

                case "select":
                  return {
                      begin: 0,
                      end: getBuffer().length
                  };

                case "ignore":
                  return seekNext(getLastValidPosition());

                case "radixFocus":
                  if (doRadixFocus(selectedCaret.begin)) {
                      var radixPos = getBuffer().join("").indexOf(opts.radixPoint);
                      return opts.numericInput ? seekNext(radixPos) : radixPos;
                  }

                default:
                  var clickPosition = selectedCaret.begin, lvclickPosition = getLastValidPosition(clickPosition, !0), lastPosition = seekNext(-1 !== lvclickPosition || isMask(0) ? lvclickPosition : 0);
                  if (clickPosition < lastPosition) return isMask(clickPosition, !0) || isMask(clickPosition - 1, !0) ? clickPosition : seekNext(clickPosition);
                  var lvp = maskset.validPositions[lvclickPosition], tt = getTestTemplate(lastPosition, lvp ? lvp.match.locator : void 0, lvp), placeholder = getPlaceholder(lastPosition, tt.match);
                  if ("" !== placeholder && getBuffer()[lastPosition] !== placeholder && !0 !== tt.match.optionalQuantifier && !0 !== tt.match.newBlockMarker || !isMask(lastPosition, opts.keepStatic) && tt.match.def === placeholder) {
                      var newPos = seekNext(lastPosition);
                      (newPos <= clickPosition || clickPosition === lastPosition) && (lastPosition = newPos);
                  }
                  return lastPosition;
              }
          }
          var EventRuler = {
              on: function on(input, eventName, eventHandler) {
                  var ev = function ev(e) {
                      e = e.originalEvent || e;
                      var that = this, args;
                      if (void 0 === that.inputmask && "FORM" !== this.nodeName) {
                          var imOpts = $.data(that, "_inputmask_opts");
                          imOpts ? new Inputmask(imOpts).mask(that) : EventRuler.off(that);
                      } else {
                          if ("setvalue" === e.type || "FORM" === this.nodeName || !(that.disabled || that.readOnly && !("keydown" === e.type && e.ctrlKey && 67 === e.keyCode || !1 === opts.tabThrough && e.keyCode === Inputmask.keyCode.TAB))) {
                              switch (e.type) {
                                case "input":
                                  if (!0 === skipInputEvent || e.inputType && "insertCompositionText" === e.inputType) return skipInputEvent = !1,
                                  e.preventDefault();
                                  if (mobile) return args = arguments, setTimeout(function() {
                                      eventHandler.apply(that, args), caret(that, that.inputmask.caretPos, void 0, !0);
                                  }, 0), !1;
                                  break;

                                case "keydown":
                                  skipKeyPressEvent = !1, skipInputEvent = !1;
                                  break;

                                case "keypress":
                                  if (!0 === skipKeyPressEvent) return e.preventDefault();
                                  skipKeyPressEvent = !0;
                                  break;

                                case "click":
                                case "focus":
                                  return validationEvent ? (validationEvent = !1, input.blur(), HandleNativePlaceholder(input, (isRTL ? getBuffer().slice().reverse() : getBuffer()).join("")),
                                  setTimeout(function() {
                                      input.focus();
                                  }, 3e3)) : (args = arguments, setTimeout(function() {
                                      eventHandler.apply(that, args);
                                  }, 0)), !1;
                              }
                              var returnVal = eventHandler.apply(that, arguments);
                              return !1 === returnVal && (e.preventDefault(), e.stopPropagation()), returnVal;
                          }
                          e.preventDefault();
                      }
                  };
                  input.inputmask.events[eventName] = input.inputmask.events[eventName] || [], input.inputmask.events[eventName].push(ev),
                  -1 !== $.inArray(eventName, [ "submit", "reset" ]) ? null !== input.form && $(input.form).on(eventName, ev) : $(input).on(eventName, ev);
              },
              off: function off(input, event) {
                  var events;
                  input.inputmask && input.inputmask.events && (event ? (events = [], events[event] = input.inputmask.events[event]) : events = input.inputmask.events,
                  $.each(events, function(eventName, evArr) {
                      for (;0 < evArr.length; ) {
                          var ev = evArr.pop();
                          -1 !== $.inArray(eventName, [ "submit", "reset" ]) ? null !== input.form && $(input.form).off(eventName, ev) : $(input).off(eventName, ev);
                      }
                      delete input.inputmask.events[eventName];
                  }));
              }
          }, EventHandlers = {
              keydownEvent: function keydownEvent(e) {
                  var input = this, $input = $(input), k = e.keyCode, pos = caret(input), kdResult = opts.onKeyDown.call(this, e, getBuffer(), pos, opts);
                  if (void 0 !== kdResult) return kdResult;
                  if (k === Inputmask.keyCode.BACKSPACE || k === Inputmask.keyCode.DELETE || iphone && k === Inputmask.keyCode.BACKSPACE_SAFARI || e.ctrlKey && k === Inputmask.keyCode.X && !("oncut" in input)) e.preventDefault(),
                  handleRemove(input, k, pos), writeBuffer(input, getBuffer(!0), maskset.p, e, input.inputmask._valueGet() !== getBuffer().join("")); else if (k === Inputmask.keyCode.END || k === Inputmask.keyCode.PAGE_DOWN) {
                      e.preventDefault();
                      var caretPos = seekNext(getLastValidPosition());
                      caret(input, e.shiftKey ? pos.begin : caretPos, caretPos, !0);
                  } else k === Inputmask.keyCode.HOME && !e.shiftKey || k === Inputmask.keyCode.PAGE_UP ? (e.preventDefault(),
                  caret(input, 0, e.shiftKey ? pos.begin : 0, !0)) : (opts.undoOnEscape && k === Inputmask.keyCode.ESCAPE || 90 === k && e.ctrlKey) && !0 !== e.altKey ? (checkVal(input, !0, !1, undoValue.split("")),
                  $input.trigger("click")) : !0 === opts.tabThrough && k === Inputmask.keyCode.TAB ? (!0 === e.shiftKey ? (!0 === getTest(pos.begin).match.static && (pos.begin = seekNext(pos.begin)),
                  pos.end = seekPrevious(pos.begin, !0), pos.begin = seekPrevious(pos.end, !0)) : (pos.begin = seekNext(pos.begin, !0),
                  pos.end = seekNext(pos.begin, !0), pos.end < maskset.maskLength && pos.end--), pos.begin < maskset.maskLength && (e.preventDefault(),
                  caret(input, pos.begin, pos.end))) : e.shiftKey || !1 === opts.insertMode && (k === Inputmask.keyCode.RIGHT ? setTimeout(function() {
                      var caretPos = caret(input);
                      caret(input, caretPos.begin);
                  }, 0) : k === Inputmask.keyCode.LEFT && setTimeout(function() {
                      var caretPos_begin = translatePosition(input.inputmask.caretPos.begin), caretPos_end = translatePosition(input.inputmask.caretPos.end);
                      caret(input, isRTL ? caretPos_begin + (caretPos_begin === maskset.maskLength ? 0 : 1) : caretPos_begin - (0 === caretPos_begin ? 0 : 1));
                  }, 0));
                  ignorable = -1 !== $.inArray(k, opts.ignorables);
              },
              keypressEvent: function keypressEvent(e, checkval, writeOut, strict, ndx) {
                  var input = this, $input = $(input), k = e.which || e.charCode || e.keyCode;
                  if (!(!0 === checkval || e.ctrlKey && e.altKey) && (e.ctrlKey || e.metaKey || ignorable)) return k === Inputmask.keyCode.ENTER && undoValue !== getBuffer().join("") && (undoValue = getBuffer().join(""),
                  setTimeout(function() {
                      $input.trigger("change");
                  }, 0)), !0;
                  if (k) {
                      46 === k && !1 === e.shiftKey && "" !== opts.radixPoint && (k = opts.radixPoint.charCodeAt(0));
                      var pos = checkval ? {
                          begin: ndx,
                          end: ndx
                      } : caret(input), forwardPosition, c = String.fromCharCode(k);
                      maskset.writeOutBuffer = !0;
                      var valResult = isValid(pos, c, strict);
                      if (!1 !== valResult && (resetMaskSet(!0), forwardPosition = void 0 !== valResult.caret ? valResult.caret : seekNext(valResult.pos.begin ? valResult.pos.begin : valResult.pos),
                      maskset.p = forwardPosition), forwardPosition = opts.numericInput && void 0 === valResult.caret ? seekPrevious(forwardPosition) : forwardPosition,
                      !1 !== writeOut && (setTimeout(function() {
                          opts.onKeyValidation.call(input, k, valResult, opts);
                      }, 0), maskset.writeOutBuffer && !1 !== valResult)) {
                          var buffer = getBuffer();
                          writeBuffer(input, buffer, forwardPosition, e, !0 !== checkval);
                      }
                      if (e.preventDefault(), checkval) return !1 !== valResult && (valResult.forwardPosition = forwardPosition),
                      valResult;
                  }
              },
              pasteEvent: function pasteEvent(e) {
                  var input = this, inputValue = this.inputmask._valueGet(!0), caretPos = caret(this), tempValue;
                  isRTL && (tempValue = caretPos.end, caretPos.end = caretPos.begin, caretPos.begin = tempValue);
                  var valueBeforeCaret = inputValue.substr(0, caretPos.begin), valueAfterCaret = inputValue.substr(caretPos.end, inputValue.length);
                  if (valueBeforeCaret === (isRTL ? getBufferTemplate().reverse() : getBufferTemplate()).slice(0, caretPos.begin).join("") && (valueBeforeCaret = ""),
                  valueAfterCaret === (isRTL ? getBufferTemplate().reverse() : getBufferTemplate()).slice(caretPos.end).join("") && (valueAfterCaret = ""),
                  window.clipboardData && window.clipboardData.getData) inputValue = valueBeforeCaret + window.clipboardData.getData("Text") + valueAfterCaret; else {
                      if (!e.clipboardData || !e.clipboardData.getData) return !0;
                      inputValue = valueBeforeCaret + e.clipboardData.getData("text/plain") + valueAfterCaret;
                  }
                  var pasteValue = inputValue;
                  if ($.isFunction(opts.onBeforePaste)) {
                      if (pasteValue = opts.onBeforePaste.call(inputmask, inputValue, opts), !1 === pasteValue) return e.preventDefault();
                      pasteValue = pasteValue || inputValue;
                  }
                  return checkVal(this, !1, !1, pasteValue.toString().split("")), writeBuffer(this, getBuffer(), seekNext(getLastValidPosition()), e, undoValue !== getBuffer().join("")),
                  e.preventDefault();
              },
              inputFallBackEvent: function inputFallBackEvent(e) {
                  function ieMobileHandler(input, inputValue, caretPos) {
                      if (iemobile) {
                          var inputChar = inputValue.replace(getBuffer().join(""), "");
                          if (1 === inputChar.length) {
                              var iv = inputValue.split("");
                              iv.splice(caretPos.begin, 0, inputChar), inputValue = iv.join("");
                          }
                      }
                      return inputValue;
                  }
                  function analyseChanges(inputValue, buffer, caretPos) {
                      for (var frontPart = inputValue.substr(0, caretPos.begin).split(""), backPart = inputValue.substr(caretPos.begin).split(""), frontBufferPart = buffer.substr(0, caretPos.begin).split(""), backBufferPart = buffer.substr(caretPos.begin).split(""), fpl = frontPart.length >= frontBufferPart.length ? frontPart.length : frontBufferPart.length, bpl = backPart.length >= backBufferPart.length ? backPart.length : backBufferPart.length, bl, i, action = "", data = [], marker = "~", placeholder; frontPart.length < fpl; ) frontPart.push("~");
                      for (;frontBufferPart.length < fpl; ) frontBufferPart.push("~");
                      for (;backPart.length < bpl; ) backPart.unshift("~");
                      for (;backBufferPart.length < bpl; ) backBufferPart.unshift("~");
                      var newBuffer = frontPart.concat(backPart), oldBuffer = frontBufferPart.concat(backBufferPart);
                      for (i = 0, bl = newBuffer.length; i < bl; i++) switch (placeholder = getPlaceholder(i),
                      action) {
                        case "insertText":
                          i = bl;
                          break;

                        case "insertReplacementText":
                          "~" === newBuffer[i] ? caretPos.end++ : i = bl;
                          break;

                        case "deleteContentForward":
                          "~" === newBuffer[i] ? caretPos.end++ : i = bl;
                          break;

                        default:
                          newBuffer[i] !== oldBuffer[i] && (newBuffer[i] !== placeholder && (oldBuffer[i] === placeholder && "~" === oldBuffer[i + 1] || "~" === oldBuffer[i]) ? (action = "insertText",
                          data.push(newBuffer[i]), caretPos.begin--, caretPos.end--) : "~" === oldBuffer[i + 1] && oldBuffer[i] === newBuffer[i + 1] ? (action = "insertText",
                          data.push(newBuffer[i]), caretPos.begin--, caretPos.end--) : newBuffer[i] !== placeholder && "~" !== newBuffer[i] && ("~" === newBuffer[i + 1] || oldBuffer[i] !== newBuffer[i] && oldBuffer[i + 1] === newBuffer[i + 1]) ? (action = "insertReplacementText",
                          data.push(newBuffer[i]), caretPos.begin--) : "~" === newBuffer[i] ? (action = "deleteContentBackward",
                          isMask(i, !0) && caretPos.end++) : i = bl);
                          break;
                      }
                      return {
                          action: action,
                          data: data,
                          caret: caretPos
                      };
                  }
                  var input = this, inputValue = input.inputmask._valueGet(!0), buffer = (isRTL ? getBuffer().slice().reverse() : getBuffer()).join(""), caretPos = caret(input, void 0, void 0, !0);
                  if (buffer !== inputValue) {
                      inputValue = ieMobileHandler(input, inputValue, caretPos);
                      var changes = analyseChanges(inputValue, buffer, caretPos);
                      switch (document.activeElement !== input && input.focus(), writeBuffer(input, getBuffer()),
                      caret(input, caretPos.begin, caretPos.end, !0), changes.action) {
                        case "insertText":
                        case "insertReplacementText":
                          $.each(changes.data, function(ndx, entry) {
                              var keypress = new $.Event("keypress");
                              keypress.which = entry.charCodeAt(0), ignorable = !1, EventHandlers.keypressEvent.call(input, keypress);
                          });
                          break;

                        case "deleteContentBackward":
                          var keydown = new $.Event("keydown");
                          keydown.keyCode = Inputmask.keyCode.BACKSPACE, EventHandlers.keydownEvent.call(input, keydown);
                          break;

                        default:
                          applyInputValue(input, inputValue);
                          break;
                      }
                      e.preventDefault();
                  }
              },
              compositionendEvent: function compositionendEvent(e) {
                  $el.trigger("input");
              },
              setValueEvent: function setValueEvent(e, argument_1, argument_2) {
                  var input = this, value = e && e.detail ? e.detail[0] : argument_1;
                  void 0 === value && (value = this.inputmask._valueGet(!0)), applyInputValue(this, value),
                  (e.detail && void 0 !== e.detail[1] || void 0 !== argument_2) && caret(this, e.detail ? e.detail[1] : argument_2);
              },
              focusEvent: function focusEvent(e) {
                  var input = this, nptValue = this.inputmask._valueGet();
                  opts.showMaskOnFocus && nptValue !== getBuffer().join("") && writeBuffer(this, getBuffer(), seekNext(getLastValidPosition())),
                  !0 !== opts.positionCaretOnTab || !1 !== mouseEnter || isComplete(getBuffer()) && -1 !== getLastValidPosition() || EventHandlers.clickEvent.apply(this, [ e, !0 ]),
                  undoValue = getBuffer().join("");
              },
              invalidEvent: function invalidEvent(e) {
                  validationEvent = !0;
              },
              mouseleaveEvent: function mouseleaveEvent() {
                  var input = this;
                  mouseEnter = !1, opts.clearMaskOnLostFocus && document.activeElement !== this && HandleNativePlaceholder(this, originalPlaceholder);
              },
              clickEvent: function clickEvent(e, tabbed) {
                  var input = this;
                  if (document.activeElement === this) {
                      var newCaretPosition = determineNewCaretPosition(caret(this), tabbed);
                      void 0 !== newCaretPosition && caret(this, newCaretPosition);
                  }
              },
              cutEvent: function cutEvent(e) {
                  var input = this, pos = caret(this), clipboardData = window.clipboardData || e.clipboardData, clipData = isRTL ? getBuffer().slice(pos.end, pos.begin) : getBuffer().slice(pos.begin, pos.end);
                  clipboardData.setData("text", isRTL ? clipData.reverse().join("") : clipData.join("")),
                  document.execCommand && document.execCommand("copy"), handleRemove(this, Inputmask.keyCode.DELETE, pos),
                  writeBuffer(this, getBuffer(), maskset.p, e, undoValue !== getBuffer().join(""));
              },
              blurEvent: function blurEvent(e) {
                  var $input = $(this), input = this;
                  if (this.inputmask) {
                      HandleNativePlaceholder(this, originalPlaceholder);
                      var nptValue = this.inputmask._valueGet(), buffer = getBuffer().slice();
                      "" !== nptValue && (opts.clearMaskOnLostFocus && (-1 === getLastValidPosition() && nptValue === getBufferTemplate().join("") ? buffer = [] : clearOptionalTail(buffer)),
                      !1 === isComplete(buffer) && (setTimeout(function() {
                          $input.trigger("incomplete");
                      }, 0), opts.clearIncomplete && (resetMaskSet(), buffer = opts.clearMaskOnLostFocus ? [] : getBufferTemplate().slice())),
                      writeBuffer(this, buffer, void 0, e)), undoValue !== getBuffer().join("") && (undoValue = getBuffer().join(""),
                      $input.trigger("change"));
                  }
              },
              mouseenterEvent: function mouseenterEvent() {
                  var input = this;
                  mouseEnter = !0, document.activeElement !== this && (null == originalPlaceholder && this.placeholder !== originalPlaceholder && (originalPlaceholder = this.placeholder),
                  opts.showMaskOnHover && HandleNativePlaceholder(this, (isRTL ? getBuffer().slice().reverse() : getBuffer()).join("")));
              },
              submitEvent: function submitEvent() {
                  undoValue !== getBuffer().join("") && $el.trigger("change"), opts.clearMaskOnLostFocus && -1 === getLastValidPosition() && el.inputmask._valueGet && el.inputmask._valueGet() === getBufferTemplate().join("") && el.inputmask._valueSet(""),
                  opts.clearIncomplete && !1 === isComplete(getBuffer()) && el.inputmask._valueSet(""),
                  opts.removeMaskOnSubmit && (el.inputmask._valueSet(el.inputmask.unmaskedvalue(), !0),
                  setTimeout(function() {
                      writeBuffer(el, getBuffer());
                  }, 0));
              },
              resetEvent: function resetEvent() {
                  el.inputmask.refreshValue = !0, setTimeout(function() {
                      applyInputValue(el, el.inputmask._valueGet(!0));
                  }, 0);
              }
          }, valueBuffer;
          function checkVal(input, writeOut, strict, nptvl, initiatingEvent) {
              var inputmask = this || input.inputmask, inputValue = nptvl.slice(), charCodes = "", initialNdx = -1, result = void 0;
              function isTemplateMatch(ndx, charCodes) {
                  if (opts.regex) return !1;
                  for (var targetTemplate = getMaskTemplate(!0, 0, !1).slice(ndx, seekNext(ndx)).join("").replace(/'/g, ""), charCodeNdx = targetTemplate.indexOf(charCodes); 0 < charCodeNdx && " " === targetTemplate[charCodeNdx - 1]; ) charCodeNdx--;
                  var match = 0 === charCodeNdx && !isMask(ndx) && (getTest(ndx).match.nativeDef === charCodes.charAt(0) || !0 === getTest(ndx).match.static && getTest(ndx).match.nativeDef === "'" + charCodes.charAt(0) || " " === getTest(ndx).match.nativeDef && (getTest(ndx + 1).match.nativeDef === charCodes.charAt(0) || !0 === getTest(ndx + 1).match.static && getTest(ndx + 1).match.nativeDef === "'" + charCodes.charAt(0)));
                  return !match && 0 < charCodeNdx && (inputmask.caretPos = {
                      begin: seekNext(charCodeNdx)
                  }), match;
              }
              resetMaskSet(), maskset.tests = {}, initialNdx = opts.radixPoint ? determineNewCaretPosition(0) : 0,
              maskset.p = initialNdx, inputmask.caretPos = {
                  begin: initialNdx
              };
              var staticMatches = [], prevCaretPos = inputmask.caretPos, sndx, validPos, nextValid;
              if ($.each(inputValue, function(ndx, charCode) {
                  if (void 0 !== charCode) if (void 0 === maskset.validPositions[ndx] && inputValue[ndx] === getPlaceholder(ndx) && isMask(ndx, !0) && !1 === isValid(ndx, inputValue[ndx], !0, void 0, void 0, !0)) maskset.p++; else {
                      var keypress = new $.Event("_checkval");
                      keypress.which = charCode.toString().charCodeAt(0), charCodes += charCode;
                      var lvp = getLastValidPosition(void 0, !0);
                      isTemplateMatch(initialNdx, charCodes) ? result = EventHandlers.keypressEvent.call(input, keypress, !0, !1, strict, lvp + 1) : (result = EventHandlers.keypressEvent.call(input, keypress, !0, !1, strict, inputmask.caretPos.begin),
                      result && (initialNdx = inputmask.caretPos.begin + 1, charCodes = "")), result ? (void 0 !== result.pos && maskset.validPositions[result.pos] && !0 === maskset.validPositions[result.pos].match.static && (staticMatches.push(result.pos),
                      isRTL || (result.forwardPosition = result.pos + 1)), writeBuffer(void 0, getBuffer(), result.forwardPosition, keypress, !1),
                      inputmask.caretPos = {
                          begin: result.forwardPosition,
                          end: result.forwardPosition
                      }, prevCaretPos = inputmask.caretPos) : inputmask.caretPos = prevCaretPos;
                  }
              }), 0 < staticMatches.length) if (!isComplete(getBuffer()) || staticMatches.length < seekNext(0)) {
                  for (;void 0 !== (sndx = staticMatches.pop()); ) if (sndx !== staticMatches.length) {
                      var keypress = new $.Event("_checkval"), nextSndx = sndx + 1;
                      for (validPos = maskset.validPositions[sndx], validPos.generatedInput = !0, keypress.which = validPos.input.charCodeAt(0); (nextValid = maskset.validPositions[nextSndx]) && nextValid.input === validPos.input; ) nextSndx++;
                      result = EventHandlers.keypressEvent.call(input, keypress, !0, !1, strict, nextSndx),
                      result && void 0 !== result.pos && result.pos !== sndx && maskset.validPositions[result.pos] && !0 === maskset.validPositions[result.pos].match.static && staticMatches.push(result.pos);
                  }
              } else for (;sndx = staticMatches.pop(); ) validPos = maskset.validPositions[sndx],
              validPos && (validPos.generatedInput = !0);
              writeOut && writeBuffer(input, getBuffer(), result ? result.forwardPosition : void 0, initiatingEvent || new $.Event("checkval"), initiatingEvent && "input" === initiatingEvent.type);
          }
          function unmaskedvalue(input) {
              if (input) {
                  if (void 0 === input.inputmask) return input.value;
                  input.inputmask && input.inputmask.refreshValue && applyInputValue(input, input.inputmask._valueGet(!0));
              }
              var umValue = [], vps = maskset.validPositions;
              for (var pndx in vps) vps[pndx] && vps[pndx].match && 1 != vps[pndx].match.static && umValue.push(vps[pndx].input);
              var unmaskedValue = 0 === umValue.length ? "" : (isRTL ? umValue.reverse() : umValue).join("");
              if ($.isFunction(opts.onUnMask)) {
                  var bufferValue = (isRTL ? getBuffer().slice().reverse() : getBuffer()).join("");
                  unmaskedValue = opts.onUnMask.call(inputmask, bufferValue, unmaskedValue, opts);
              }
              return unmaskedValue;
          }
          function translatePosition(pos) {
              return !isRTL || "number" != typeof pos || opts.greedy && "" === opts.placeholder || !el || (pos = el.inputmask._valueGet().length - pos),
              pos;
          }
          function caret(input, begin, end, notranslate) {
              var range;
              if (void 0 === begin) return "selectionStart" in input && "selectionEnd" in input ? (begin = input.selectionStart,
              end = input.selectionEnd) : window.getSelection ? (range = window.getSelection().getRangeAt(0),
              range.commonAncestorContainer.parentNode !== input && range.commonAncestorContainer !== input || (begin = range.startOffset,
              end = range.endOffset)) : document.selection && document.selection.createRange && (range = document.selection.createRange(),
              begin = 0 - range.duplicate().moveStart("character", -input.inputmask._valueGet().length),
              end = begin + range.text.length), !1 === opts.insertMode && begin === end - 1 && end--,
              {
                  begin: notranslate ? begin : translatePosition(begin),
                  end: notranslate ? end : translatePosition(end)
              };
              if ($.isArray(begin) && (end = isRTL ? begin[0] : begin[1], begin = isRTL ? begin[1] : begin[0]),
              void 0 !== begin.begin && (end = isRTL ? begin.begin : begin.end, begin = isRTL ? begin.end : begin.begin),
              "number" == typeof begin) {
                  begin = notranslate ? begin : translatePosition(begin), end = notranslate ? end : translatePosition(end),
                  end = "number" == typeof end ? end : begin;
                  var scrollCalc = parseInt(((input.ownerDocument.defaultView || window).getComputedStyle ? (input.ownerDocument.defaultView || window).getComputedStyle(input, null) : input.currentStyle).fontSize) * end;
                  if (input.scrollLeft = scrollCalc > input.scrollWidth ? scrollCalc : 0, input.inputmask.caretPos = {
                      begin: begin,
                      end: end
                  }, !1 === opts.insertMode && begin === end && end++, input === document.activeElement) if ("setSelectionRange" in input) input.setSelectionRange(begin, end); else if (window.getSelection) {
                      if (range = document.createRange(), void 0 === input.firstChild || null === input.firstChild) {
                          var textNode = document.createTextNode("");
                          input.appendChild(textNode);
                      }
                      range.setStart(input.firstChild, begin < input.inputmask._valueGet().length ? begin : input.inputmask._valueGet().length),
                      range.setEnd(input.firstChild, end < input.inputmask._valueGet().length ? end : input.inputmask._valueGet().length),
                      range.collapse(!0);
                      var sel = window.getSelection();
                      sel.removeAllRanges(), sel.addRange(range);
                  } else input.createTextRange && (range = input.createTextRange(), range.collapse(!0),
                  range.moveEnd("character", end), range.moveStart("character", begin), range.select());
              }
          }
          function determineLastRequiredPosition(returnDefinition) {
              var buffer = getMaskTemplate(!0, getLastValidPosition(), !0, !0), bl = buffer.length, pos, lvp = getLastValidPosition(), positions = {}, lvTest = maskset.validPositions[lvp], ndxIntlzr = void 0 !== lvTest ? lvTest.locator.slice() : void 0, testPos;
              for (pos = lvp + 1; pos < buffer.length; pos++) testPos = getTestTemplate(pos, ndxIntlzr, pos - 1),
              ndxIntlzr = testPos.locator.slice(), positions[pos] = $.extend(!0, {}, testPos);
              var lvTestAlt = lvTest && void 0 !== lvTest.alternation ? lvTest.locator[lvTest.alternation] : void 0;
              for (pos = bl - 1; lvp < pos && (testPos = positions[pos], (testPos.match.optionality || testPos.match.optionalQuantifier && testPos.match.newBlockMarker || lvTestAlt && (lvTestAlt !== positions[pos].locator[lvTest.alternation] && 1 != testPos.match.static || !0 === testPos.match.static && testPos.locator[lvTest.alternation] && checkAlternationMatch(testPos.locator[lvTest.alternation].toString().split(","), lvTestAlt.toString().split(",")) && "" !== getTests(pos)[0].def)) && buffer[pos] === getPlaceholder(pos, testPos.match)); pos--) bl--;
              return returnDefinition ? {
                  l: bl,
                  def: positions[bl] ? positions[bl].match : void 0
              } : bl;
          }
          function clearOptionalTail(buffer) {
              buffer.length = 0;
              for (var template = getMaskTemplate(!0, 0, !0, void 0, !0), lmnt; void 0 !== (lmnt = template.shift()); ) buffer.push(lmnt);
              return buffer;
          }
          function isComplete(buffer) {
              if ($.isFunction(opts.isComplete)) return opts.isComplete(buffer, opts);
              if ("*" !== opts.repeat) {
                  var complete = !1, lrp = determineLastRequiredPosition(!0), aml = seekPrevious(lrp.l);
                  if (void 0 === lrp.def || lrp.def.newBlockMarker || lrp.def.optionality || lrp.def.optionalQuantifier) {
                      complete = !0;
                      for (var i = 0; i <= aml; i++) {
                          var test = getTestTemplate(i).match;
                          if (!0 !== test.static && void 0 === maskset.validPositions[i] && !0 !== test.optionality && !0 !== test.optionalQuantifier || !0 === test.static && buffer[i] !== getPlaceholder(i, test)) {
                              complete = !1;
                              break;
                          }
                      }
                  }
                  return complete;
              }
          }
          function handleRemove(input, k, pos, strict, fromIsValid) {
              if ((opts.numericInput || isRTL) && (k === Inputmask.keyCode.BACKSPACE ? k = Inputmask.keyCode.DELETE : k === Inputmask.keyCode.DELETE && (k = Inputmask.keyCode.BACKSPACE),
              isRTL)) {
                  var pend = pos.end;
                  pos.end = pos.begin, pos.begin = pend;
              }
              var offset;
              if (k === Inputmask.keyCode.BACKSPACE || k === Inputmask.keyCode.DELETE && !1 === opts.insertMode ? pos.end - pos.begin < 1 && (pos.begin = seekPrevious(pos.begin),
              void 0 !== maskset.validPositions[pos.begin] && maskset.validPositions[pos.begin].input === opts.groupSeparator && pos.begin--) : k === Inputmask.keyCode.DELETE && pos.begin === pos.end && (pos.end = isMask(pos.end, !0, !0) ? pos.end + 1 : seekNext(pos.end) + 1,
              void 0 !== maskset.validPositions[pos.begin] && maskset.validPositions[pos.begin].input === opts.groupSeparator && pos.end++),
              !1 !== (offset = revalidateMask(pos))) {
                  if (!0 !== strict && !1 !== opts.keepStatic || null !== opts.regex && -1 !== getTest(pos.begin).match.def.indexOf("|")) {
                      var result = alternate(!0);
                      if (result) {
                          var newPos = void 0 !== result.caret ? result.caret : result.pos ? seekNext(result.pos.begin ? result.pos.begin : result.pos) : getLastValidPosition(-1, !0);
                          (k !== Inputmask.keyCode.DELETE || pos.begin > newPos) && pos.begin;
                      }
                  }
                  var lvp = getLastValidPosition(pos.end, !0);
                  lvp < pos.begin ? maskset.p = !1 === opts.insertMode ? seekPrevious(lvp + 1) : seekNext(lvp) : !0 !== strict && (maskset.p = k === Inputmask.keyCode.DELETE ? pos.begin + offset : pos.begin,
                  !1 === opts.insertMode && k === Inputmask.keyCode.DELETE && (maskset.p = pos.end + 1,
                  void 0 === maskset.validPositions[maskset.p] && getLastValidPosition(maskset.maskLength, !0) < maskset.p && (maskset.p = seekPrevious(lvp + 1))));
              }
          }
          function applyInputValue(input, value) {
              input.inputmask.refreshValue = !1, $.isFunction(opts.onBeforeMask) && (value = opts.onBeforeMask.call(inputmask, value, opts) || value),
              value = value.toString().split(""), checkVal(input, !0, !1, value), undoValue = getBuffer().join(""),
              (opts.clearMaskOnLostFocus || opts.clearIncomplete) && input.inputmask._valueGet() === getBufferTemplate().join("") && -1 === getLastValidPosition() && input.inputmask._valueSet("");
          }
          function mask(elem) {
              function isElementTypeSupported(input, opts) {
                  function patchValueProperty(npt) {
                      var valueGet, valueSet;
                      function patchValhook(type) {
                          if ($.valHooks && (void 0 === $.valHooks[type] || !0 !== $.valHooks[type].inputmaskpatch)) {
                              var valhookGet = $.valHooks[type] && $.valHooks[type].get ? $.valHooks[type].get : function(elem) {
                                  return elem.value;
                              }, valhookSet = $.valHooks[type] && $.valHooks[type].set ? $.valHooks[type].set : function(elem, value) {
                                  return elem.value = value, elem;
                              };
                              $.valHooks[type] = {
                                  get: function get(elem) {
                                      if (elem.inputmask) {
                                          if (elem.inputmask.opts.autoUnmask) return elem.inputmask.unmaskedvalue();
                                          var result = valhookGet(elem);
                                          return -1 !== getLastValidPosition(void 0, void 0, elem.inputmask.maskset.validPositions) || !0 !== opts.nullable ? result : "";
                                      }
                                      return valhookGet(elem);
                                  },
                                  set: function set(elem, value) {
                                      var result = valhookSet(elem, value);
                                      return elem.inputmask && applyInputValue(elem, value), result;
                                  },
                                  inputmaskpatch: !0
                              };
                          }
                      }
                      function getter() {
                          return this.inputmask ? this.inputmask.opts.autoUnmask ? this.inputmask.unmaskedvalue() : -1 !== getLastValidPosition() || !0 !== opts.nullable ? document.activeElement === this && opts.clearMaskOnLostFocus ? (isRTL ? clearOptionalTail(getBuffer().slice()).reverse() : clearOptionalTail(getBuffer().slice())).join("") : valueGet.call(this) : "" : valueGet.call(this);
                      }
                      function setter(value) {
                          valueSet.call(this, value), this.inputmask && applyInputValue(this, value);
                      }
                      function installNativeValueSetFallback(npt) {
                          EventRuler.on(npt, "mouseenter", function() {
                              var input = this, value = this.inputmask._valueGet(!0);
                              value !== (isRTL ? getBuffer().reverse() : getBuffer()).join("") && applyInputValue(this, value);
                          });
                      }
                      if (!npt.inputmask.__valueGet) {
                          if (!0 !== opts.noValuePatching) {
                              if (Object.getOwnPropertyDescriptor) {
                                  "function" != typeof Object.getPrototypeOf && (Object.getPrototypeOf = "object" === _typeof("test".__proto__) ? function(object) {
                                      return object.__proto__;
                                  } : function(object) {
                                      return object.constructor.prototype;
                                  });
                                  var valueProperty = Object.getPrototypeOf ? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(npt), "value") : void 0;
                                  valueProperty && valueProperty.get && valueProperty.set ? (valueGet = valueProperty.get,
                                  valueSet = valueProperty.set, Object.defineProperty(npt, "value", {
                                      get: getter,
                                      set: setter,
                                      configurable: !0
                                  })) : "input" !== npt.tagName.toLowerCase() && (valueGet = function valueGet() {
                                      return this.textContent;
                                  }, valueSet = function valueSet(value) {
                                      this.textContent = value;
                                  }, Object.defineProperty(npt, "value", {
                                      get: getter,
                                      set: setter,
                                      configurable: !0
                                  }));
                              } else document.__lookupGetter__ && npt.__lookupGetter__("value") && (valueGet = npt.__lookupGetter__("value"),
                              valueSet = npt.__lookupSetter__("value"), npt.__defineGetter__("value", getter),
                              npt.__defineSetter__("value", setter));
                              npt.inputmask.__valueGet = valueGet, npt.inputmask.__valueSet = valueSet;
                          }
                          npt.inputmask._valueGet = function(overruleRTL) {
                              return isRTL && !0 !== overruleRTL ? valueGet.call(this.el).split("").reverse().join("") : valueGet.call(this.el);
                          }, npt.inputmask._valueSet = function(value, overruleRTL) {
                              valueSet.call(this.el, null == value ? "" : !0 !== overruleRTL && isRTL ? value.split("").reverse().join("") : value);
                          }, void 0 === valueGet && (valueGet = function valueGet() {
                              return this.value;
                          }, valueSet = function valueSet(value) {
                              this.value = value;
                          }, patchValhook(npt.type), installNativeValueSetFallback(npt));
                      }
                  }
                  var elementType = input.getAttribute("type"), isSupported = "input" === input.tagName.toLowerCase() && -1 !== $.inArray(elementType, opts.supportsInputType) || input.isContentEditable || "textarea" === input.tagName.toLowerCase();
                  if (!isSupported) if ("input" === input.tagName.toLowerCase()) {
                      var el = document.createElement("input");
                      el.setAttribute("type", elementType), isSupported = "text" === el.type, el = null;
                  } else isSupported = "partial";
                  return !1 !== isSupported ? patchValueProperty(input) : input.inputmask = void 0,
                  isSupported;
              }
              EventRuler.off(elem);
              var isSupported = isElementTypeSupported(elem, opts);
              if (!1 !== isSupported && (el = elem, $el = $(el), originalPlaceholder = el.placeholder,
              maxLength = void 0 !== el ? el.maxLength : void 0, -1 === maxLength && (maxLength = void 0),
              "inputmode" in el && (el.inputmode = opts.inputmode, el.setAttribute("inputmode", opts.inputmode)),
              !0 === isSupported && (opts.showMaskOnFocus = opts.showMaskOnFocus && -1 === [ "cc-number", "cc-exp" ].indexOf(el.autocomplete),
              EventRuler.on(el, "submit", EventHandlers.submitEvent), EventRuler.on(el, "reset", EventHandlers.resetEvent),
              EventRuler.on(el, "blur", EventHandlers.blurEvent), EventRuler.on(el, "focus", EventHandlers.focusEvent),
              EventRuler.on(el, "invalid", EventHandlers.invalidEvent), EventRuler.on(el, "click", EventHandlers.clickEvent),
              EventRuler.on(el, "mouseleave", EventHandlers.mouseleaveEvent), EventRuler.on(el, "mouseenter", EventHandlers.mouseenterEvent),
              EventRuler.on(el, "paste", EventHandlers.pasteEvent), EventRuler.on(el, "cut", EventHandlers.cutEvent),
              EventRuler.on(el, "complete", opts.oncomplete), EventRuler.on(el, "incomplete", opts.onincomplete),
              EventRuler.on(el, "cleared", opts.oncleared), mobile || !0 === opts.inputEventOnly ? el.removeAttribute("maxLength") : (EventRuler.on(el, "keydown", EventHandlers.keydownEvent),
              EventRuler.on(el, "keypress", EventHandlers.keypressEvent)), EventRuler.on(el, "input", EventHandlers.inputFallBackEvent),
              EventRuler.on(el, "compositionend", EventHandlers.compositionendEvent)), EventRuler.on(el, "setvalue", EventHandlers.setValueEvent),
              undoValue = getBufferTemplate().join(""), "" !== el.inputmask._valueGet(!0) || !1 === opts.clearMaskOnLostFocus || document.activeElement === el)) {
                  applyInputValue(el, el.inputmask._valueGet(!0), opts);
                  var buffer = getBuffer().slice();
                  !1 === isComplete(buffer) && opts.clearIncomplete && resetMaskSet(), opts.clearMaskOnLostFocus && document.activeElement !== el && (-1 === getLastValidPosition() ? buffer = [] : clearOptionalTail(buffer)),
                  (!1 === opts.clearMaskOnLostFocus || opts.showMaskOnFocus && document.activeElement === el || "" !== el.inputmask._valueGet(!0)) && writeBuffer(el, buffer),
                  document.activeElement === el && caret(el, seekNext(getLastValidPosition()));
              }
          }
          if (void 0 !== actionObj) switch (actionObj.action) {
            case "isComplete":
              return el = actionObj.el, isComplete(getBuffer());

            case "unmaskedvalue":
              return void 0 !== el && void 0 === actionObj.value || (valueBuffer = actionObj.value,
              valueBuffer = ($.isFunction(opts.onBeforeMask) && opts.onBeforeMask.call(inputmask, valueBuffer, opts) || valueBuffer).split(""),
              checkVal.call(this, void 0, !1, !1, valueBuffer), $.isFunction(opts.onBeforeWrite) && opts.onBeforeWrite.call(inputmask, void 0, getBuffer(), 0, opts)),
              unmaskedvalue(el);

            case "mask":
              mask(el);
              break;

            case "format":
              return valueBuffer = ($.isFunction(opts.onBeforeMask) && opts.onBeforeMask.call(inputmask, actionObj.value, opts) || actionObj.value).split(""),
              checkVal.call(this, void 0, !0, !1, valueBuffer), actionObj.metadata ? {
                  value: isRTL ? getBuffer().slice().reverse().join("") : getBuffer().join(""),
                  metadata: maskScope.call(this, {
                      action: "getmetadata"
                  }, maskset, opts)
              } : isRTL ? getBuffer().slice().reverse().join("") : getBuffer().join("");

            case "isValid":
              actionObj.value ? (valueBuffer = ($.isFunction(opts.onBeforeMask) && opts.onBeforeMask.call(inputmask, actionObj.value, opts) || actionObj.value).split(""),
              checkVal.call(this, void 0, !0, !1, valueBuffer)) : actionObj.value = isRTL ? getBuffer().slice().reverse().join("") : getBuffer().join("");
              for (var buffer = getBuffer(), rl = determineLastRequiredPosition(), lmib = buffer.length - 1; rl < lmib && !isMask(lmib); lmib--) ;
              return buffer.splice(rl, lmib + 1 - rl), isComplete(buffer) && actionObj.value === (isRTL ? getBuffer().slice().reverse().join("") : getBuffer().join(""));

            case "getemptymask":
              return getBufferTemplate().join("");

            case "remove":
              if (el && el.inputmask) {
                  $.data(el, "_inputmask_opts", null), $el = $(el);
                  var cv = opts.autoUnmask ? unmaskedvalue(el) : el.inputmask._valueGet(opts.autoUnmask), valueProperty;
                  cv !== getBufferTemplate().join("") ? el.inputmask._valueSet(cv, opts.autoUnmask) : el.inputmask._valueSet(""),
                  EventRuler.off(el), Object.getOwnPropertyDescriptor && Object.getPrototypeOf ? (valueProperty = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value"),
                  valueProperty && el.inputmask.__valueGet && Object.defineProperty(el, "value", {
                      get: el.inputmask.__valueGet,
                      set: el.inputmask.__valueSet,
                      configurable: !0
                  })) : document.__lookupGetter__ && el.__lookupGetter__("value") && el.inputmask.__valueGet && (el.__defineGetter__("value", el.inputmask.__valueGet),
                  el.__defineSetter__("value", el.inputmask.__valueSet)), el.inputmask = void 0;
              }
              return el;

            case "getmetadata":
              if ($.isArray(maskset.metadata)) {
                  var maskTarget = getMaskTemplate(!0, 0, !1).join("");
                  return $.each(maskset.metadata, function(ndx, mtdt) {
                      if (mtdt.mask === maskTarget) return maskTarget = mtdt, !1;
                  }), maskTarget;
              }
              return maskset.metadata;
          }
      };
  }, function(module, exports, __webpack_require__) {
      "use strict";
      function _typeof(obj) {
          return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function _typeof(obj) {
              return typeof obj;
          } : function _typeof(obj) {
              return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
          }, _typeof(obj);
      }
      var Inputmask = __webpack_require__(0), $ = Inputmask.dependencyLib, formatCode = {
          d: [ "[1-9]|[12][0-9]|3[01]", Date.prototype.setDate, "day", Date.prototype.getDate ],
          dd: [ "0[1-9]|[12][0-9]|3[01]", Date.prototype.setDate, "day", function() {
              return pad(Date.prototype.getDate.call(this), 2);
          } ],
          ddd: [ "" ],
          dddd: [ "" ],
          m: [ "[1-9]|1[012]", Date.prototype.setMonth, "month", function() {
              return Date.prototype.getMonth.call(this) + 1;
          } ],
          mm: [ "0[1-9]|1[012]", Date.prototype.setMonth, "month", function() {
              return pad(Date.prototype.getMonth.call(this) + 1, 2);
          } ],
          mmm: [ "" ],
          mmmm: [ "" ],
          yy: [ "[0-9]{2}", Date.prototype.setFullYear, "year", function() {
              return pad(Date.prototype.getFullYear.call(this), 2);
          } ],
          yyyy: [ "[0-9]{4}", Date.prototype.setFullYear, "year", function() {
              return pad(Date.prototype.getFullYear.call(this), 4);
          } ],
          h: [ "[1-9]|1[0-2]", Date.prototype.setHours, "hours", Date.prototype.getHours ],
          hh: [ "0[1-9]|1[0-2]", Date.prototype.setHours, "hours", function() {
              return pad(Date.prototype.getHours.call(this), 2);
          } ],
          hhh: [ "[0-9]+", Date.prototype.setHours, "hours", Date.prototype.getHours ],
          H: [ "1?[0-9]|2[0-3]", Date.prototype.setHours, "hours", Date.prototype.getHours ],
          HH: [ "0[0-9]|1[0-9]|2[0-3]", Date.prototype.setHours, "hours", function() {
              return pad(Date.prototype.getHours.call(this), 2);
          } ],
          HHH: [ "[0-9]+", Date.prototype.setHours, "hours", Date.prototype.getHours ],
          M: [ "[1-5]?[0-9]", Date.prototype.setMinutes, "minutes", Date.prototype.getMinutes ],
          MM: [ "0[0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]", Date.prototype.setMinutes, "minutes", function() {
              return pad(Date.prototype.getMinutes.call(this), 2);
          } ],
          s: [ "[1-5]?[0-9]", Date.prototype.setSeconds, "seconds", Date.prototype.getSeconds ],
          ss: [ "0[0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]", Date.prototype.setSeconds, "seconds", function() {
              return pad(Date.prototype.getSeconds.call(this), 2);
          } ],
          l: [ "[0-9]{3}", Date.prototype.setMilliseconds, "milliseconds", function() {
              return pad(Date.prototype.getMilliseconds.call(this), 3);
          } ],
          L: [ "[0-9]{2}", Date.prototype.setMilliseconds, "milliseconds", function() {
              return pad(Date.prototype.getMilliseconds.call(this), 2);
          } ],
          t: [ "[ap]" ],
          tt: [ "[ap]m" ],
          T: [ "[AP]" ],
          TT: [ "[AP]M" ],
          Z: [ "" ],
          o: [ "" ],
          S: [ "" ]
      }, formatAlias = {
          isoDate: "yyyy-mm-dd",
          isoTime: "HH:MM:ss",
          isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
          isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
      };
      function getTokenizer(opts) {
          if (!opts.tokenizer) {
              var tokens = [];
              for (var ndx in formatCode) -1 === tokens.indexOf(ndx[0]) && tokens.push(ndx[0]);
              opts.tokenizer = "(" + tokens.join("+|") + ")+?|.", opts.tokenizer = new RegExp(opts.tokenizer, "g");
          }
          return opts.tokenizer;
      }
      function isValidDate(dateParts, currentResult) {
          return (!isFinite(dateParts.rawday) || "29" == dateParts.day && !isFinite(dateParts.rawyear) || new Date(dateParts.date.getFullYear(), isFinite(dateParts.rawmonth) ? dateParts.month : dateParts.date.getMonth() + 1, 0).getDate() >= dateParts.day) && currentResult;
      }
      function isDateInRange(dateParts, opts) {
          var result = !0;
          if (opts.min) {
              if (dateParts.rawyear) {
                  var rawYear = dateParts.rawyear.replace(/[^0-9]/g, ""), minYear = opts.min.year.substr(0, rawYear.length);
                  result = minYear <= rawYear;
              }
              dateParts.year === dateParts.rawyear && opts.min.date.getTime() == opts.min.date.getTime() && (result = opts.min.date.getTime() <= dateParts.date.getTime());
          }
          return result && opts.max && opts.max.date.getTime() == opts.max.date.getTime() && (result = opts.max.date.getTime() >= dateParts.date.getTime()),
          result;
      }
      function parse(format, dateObjValue, opts, raw) {
          var mask = "", match;
          for (getTokenizer(opts).lastIndex = 0; match = getTokenizer(opts).exec(format); ) if (void 0 === dateObjValue) if (formatCode[match[0]]) mask += "(" + formatCode[match[0]][0] + ")"; else switch (match[0]) {
            case "[":
              mask += "(";
              break;

            case "]":
              mask += ")?";
              break;

            default:
              mask += Inputmask.escapeRegex(match[0]);
          } else if (formatCode[match[0]]) if (!0 !== raw && formatCode[match[0]][3]) {
              var getFn = formatCode[match[0]][3];
              mask += getFn.call(dateObjValue.date);
          } else formatCode[match[0]][2] ? mask += dateObjValue["raw" + formatCode[match[0]][2]] : mask += match[0]; else mask += match[0];
          return mask;
      }
      function pad(val, len) {
          for (val = String(val), len = len || 2; val.length < len; ) val = "0" + val;
          return val;
      }
      function analyseMask(maskString, format, opts) {
          var dateObj = {
              date: new Date(1, 0, 1)
          }, targetProp, mask = maskString, match, dateOperation;
          function extendProperty(value) {
              var correctedValue = value.replace(/[^0-9]/g, "0");
              return correctedValue;
          }
          function setValue(dateObj, value, opts) {
              dateObj[targetProp] = extendProperty(value), dateObj["raw" + targetProp] = value,
              void 0 !== dateOperation && dateOperation.call(dateObj.date, "month" == targetProp ? parseInt(dateObj[targetProp]) - 1 : dateObj[targetProp]);
          }
          if ("string" == typeof mask) {
              for (getTokenizer(opts).lastIndex = 0; match = getTokenizer(opts).exec(format); ) {
                  var value = mask.slice(0, match[0].length);
                  formatCode.hasOwnProperty(match[0]) && (targetProp = formatCode[match[0]][2], dateOperation = formatCode[match[0]][1],
                  setValue(dateObj, value, opts)), mask = mask.slice(value.length);
              }
              return dateObj;
          }
          if (mask && "object" === _typeof(mask) && mask.hasOwnProperty("date")) return mask;
      }
      Inputmask.extendAliases({
          datetime: {
              mask: function mask(opts) {
                  return formatCode.S = opts.i18n.ordinalSuffix.join("|"), opts.inputFormat = formatAlias[opts.inputFormat] || opts.inputFormat,
                  opts.displayFormat = formatAlias[opts.displayFormat] || opts.displayFormat || opts.inputFormat,
                  opts.outputFormat = formatAlias[opts.outputFormat] || opts.outputFormat || opts.inputFormat,
                  opts.placeholder = "" !== opts.placeholder ? opts.placeholder : opts.inputFormat.replace(/[[\]]/, ""),
                  opts.regex = parse(opts.inputFormat, void 0, opts), null;
              },
              placeholder: "",
              inputFormat: "isoDateTime",
              displayFormat: void 0,
              outputFormat: void 0,
              min: null,
              max: null,
              skipOptionalPartCharacter: "",
              i18n: {
                  dayNames: [ "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" ],
                  monthNames: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
                  ordinalSuffix: [ "st", "nd", "rd", "th" ]
              },
              preValidation: function preValidation(buffer, pos, c, isSelection, opts, maskset, caretPos, strict) {
                  if (strict) return !0;
                  var calcPos = 0, targetMatch, match;
                  if (isNaN(c) && buffer[pos] !== c) {
                      for (getTokenizer(opts).lastIndex = 0; match = getTokenizer(opts).exec(opts.inputFormat); ) if (calcPos += match[0].length,
                      pos <= calcPos) {
                          targetMatch = match, match = getTokenizer(opts).exec(opts.inputFormat);
                          break;
                      }
                      if (match && match[0] === c && 1 < targetMatch[0].length) return buffer[pos] = buffer[pos - 1],
                      buffer[pos - 1] = "0", {
                          fuzzy: !0,
                          buffer: buffer,
                          refreshFromBuffer: {
                              start: pos - 1,
                              end: pos + 1
                          },
                          pos: pos + 1
                      };
                  }
                  return !0;
              },
              postValidation: function postValidation(buffer, pos, currentResult, opts, maskset, strict) {
                  if (strict) return !0;
                  opts.min = analyseMask(opts.min, opts.inputFormat, opts), opts.max = analyseMask(opts.max, opts.inputFormat, opts),
                  currentResult.fuzzy && (buffer = currentResult.buffer, pos = currentResult.pos);
                  var calcPos = 0, match;
                  for (getTokenizer(opts).lastIndex = 0; (match = getTokenizer(opts).exec(opts.inputFormat)) && (calcPos += match[0].length,
                  !(pos < calcPos)); ) ;
                  if (match && match[0] && void 0 !== formatCode[match[0]]) {
                      var validator = formatCode[match[0]][0], part = buffer.slice(match.index, match.index + match[0].length);
                      !1 === new RegExp(validator).test(part.join("")) && 2 === match[0].length && maskset.validPositions[match.index] && maskset.validPositions[match.index + 1] && (maskset.validPositions[match.index + 1].input = "0");
                  }
                  var result = currentResult, dateParts = analyseMask(buffer.join(""), opts.inputFormat, opts);
                  return result && dateParts.date.getTime() == dateParts.date.getTime() && (result = isValidDate(dateParts, result),
                  result = result && isDateInRange(dateParts, opts)), pos && result && currentResult.pos !== pos ? {
                      buffer: parse(opts.inputFormat, dateParts, opts).split(""),
                      refreshFromBuffer: {
                          start: pos,
                          end: currentResult.pos
                      }
                  } : result;
              },
              onKeyDown: function onKeyDown(e, buffer, caretPos, opts) {
                  var input = this;
                  if (e.ctrlKey && e.keyCode === Inputmask.keyCode.RIGHT) {
                      var today = new Date(), match, date = "";
                      for (getTokenizer(opts).lastIndex = 0; match = getTokenizer(opts).exec(opts.inputFormat); ) "d" === match[0].charAt(0) ? date += pad(today.getDate(), match[0].length) : "m" === match[0].charAt(0) ? date += pad(today.getMonth() + 1, match[0].length) : "yyyy" === match[0] ? date += today.getFullYear().toString() : "y" === match[0].charAt(0) && (date += pad(today.getYear(), match[0].length));
                      this.inputmask._valueSet(date), $(this).trigger("setvalue");
                  }
              },
              onUnMask: function onUnMask(maskedValue, unmaskedValue, opts) {
                  return unmaskedValue ? parse(opts.outputFormat, analyseMask(maskedValue, opts.inputFormat, opts), opts, !0) : unmaskedValue;
              },
              casing: function casing(elem, test, pos, validPositions) {
                  return 0 == test.nativeDef.indexOf("[ap]") ? elem.toLowerCase() : 0 == test.nativeDef.indexOf("[AP]") ? elem.toUpperCase() : elem;
              },
              insertMode: !1,
              shiftPositions: !1,
              keepStatic: !1
          }
      }), module.exports = Inputmask;
  }, function(module, exports, __webpack_require__) {
      "use strict";
      var Inputmask = __webpack_require__(0), $ = Inputmask.dependencyLib;
      function autoEscape(txt, opts) {
          for (var escapedTxt = "", i = 0; i < txt.length; i++) Inputmask.prototype.definitions[txt.charAt(i)] || opts.definitions[txt.charAt(i)] || opts.optionalmarker.start === txt.charAt(i) || opts.optionalmarker.end === txt.charAt(i) || opts.quantifiermarker.start === txt.charAt(i) || opts.quantifiermarker.end === txt.charAt(i) || opts.groupmarker.start === txt.charAt(i) || opts.groupmarker.end === txt.charAt(i) || opts.alternatormarker === txt.charAt(i) ? escapedTxt += "\\" + txt.charAt(i) : escapedTxt += txt.charAt(i);
          return escapedTxt;
      }
      function alignDigits(buffer, digits, opts, force) {
          if (0 < digits && (!opts.digitsOptional || force)) {
              var radixPosition = $.inArray(opts.radixPoint, buffer);
              -1 === radixPosition && (buffer.push(opts.radixPoint), radixPosition = buffer.length - 1);
              for (var i = 1; i <= digits; i++) buffer[radixPosition + i] = buffer[radixPosition + i] || "0";
          }
          return buffer;
      }
      function findValidator(symbol, maskset) {
          var posNdx = 0;
          if ("+" === symbol) {
              for (posNdx in maskset.validPositions) ;
              posNdx = parseInt(posNdx);
          }
          for (var tstNdx in maskset.tests) if (tstNdx = parseInt(tstNdx), posNdx <= tstNdx) for (var ndx = 0, ndxl = maskset.tests[tstNdx].length; ndx < ndxl; ndx++) if ((void 0 === maskset.validPositions[tstNdx] || "-" === symbol) && maskset.tests[tstNdx][ndx].match.def === symbol) return tstNdx + (void 0 !== maskset.validPositions[tstNdx] && "-" !== symbol ? 1 : 0);
          return posNdx;
      }
      function findValid(symbol, maskset) {
          var ret = -1;
          return $.each(maskset.validPositions, function(ndx, tst) {
              if (tst && tst.match.def === symbol) return ret = parseInt(ndx), !1;
          }), ret;
      }
      function parseMinMaxOptions(opts) {
          void 0 === opts.parseMinMaxOptions && (null !== opts.min && (opts.min = opts.min.toString().replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""),
          "," === opts.radixPoint && (opts.min = opts.min.replace(opts.radixPoint, ".")),
          opts.min = isFinite(opts.min) ? parseFloat(opts.min) : NaN, isNaN(opts.min) && (opts.min = Number.MIN_VALUE)),
          null !== opts.max && (opts.max = opts.max.toString().replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""),
          "," === opts.radixPoint && (opts.max = opts.max.replace(opts.radixPoint, ".")),
          opts.max = isFinite(opts.max) ? parseFloat(opts.max) : NaN, isNaN(opts.max) && (opts.max = Number.MAX_VALUE)),
          opts.parseMinMaxOptions = "done");
      }
      function genMask(opts) {
          opts.repeat = 0, opts.groupSeparator === opts.radixPoint && opts.digits && "0" !== opts.digits && ("." === opts.radixPoint ? opts.groupSeparator = "," : "," === opts.radixPoint ? opts.groupSeparator = "." : opts.groupSeparator = ""),
          " " === opts.groupSeparator && (opts.skipOptionalPartCharacter = void 0), 1 < opts.placeholder.length && (opts.placeholder = opts.placeholder.charAt(0)),
          "radixFocus" === opts.positionCaretOnClick && "" === opts.placeholder && (opts.positionCaretOnClick = "lvp");
          var decimalDef = "0";
          !0 === opts.numericInput && void 0 === opts.__financeInput ? (decimalDef = "1",
          opts.positionCaretOnClick = "radixFocus" === opts.positionCaretOnClick ? "lvp" : opts.positionCaretOnClick,
          isNaN(opts.digits) && (opts.digits = 2), opts._radixDance = !1) : (opts.__financeInput = !1,
          opts.numericInput = !0);
          var mask = "[+]", altMask;
          if (mask += autoEscape(opts.prefix, opts), "" !== opts.groupSeparator ? mask += opts._mask(opts) : mask += "9{+}",
          void 0 !== opts.digits && 0 !== opts.digits) {
              var dq = opts.digits.toString().split(",");
              isFinite(dq[0]) && dq[1] && isFinite(dq[1]) ? mask += opts.radixPoint + decimalDef + "{" + opts.digits + "}" : (isNaN(opts.digits) || 0 < parseInt(opts.digits)) && (opts.digitsOptional ? (altMask = mask + opts.radixPoint + decimalDef + "{0," + opts.digits + "}",
              opts.keepStatic = !0) : mask += opts.radixPoint + decimalDef + "{" + opts.digits + "}");
          }
          return mask += autoEscape(opts.suffix, opts), mask += "[-]", altMask && (mask = [ altMask + autoEscape(opts.suffix, opts) + "[-]", mask ]),
          opts.greedy = !1, parseMinMaxOptions(opts), mask;
      }
      function hanndleRadixDance(pos, c, radixPos, opts) {
          return opts._radixDance && opts.numericInput && c !== opts.negationSymbol.back && pos <= radixPos && (0 < radixPos || c == opts.radixPoint) && (pos -= 1),
          pos;
      }
      function decimalValidator(chrs, maskset, pos, strict, opts) {
          var radixPos = maskset.buffer ? maskset.buffer.indexOf(opts.radixPoint) : -1, result = -1 !== radixPos && new RegExp("[0-9\uff11-\uff19]").test(chrs);
          return opts._radixDance && result && null == maskset.validPositions[radixPos] ? {
              insert: {
                  pos: radixPos === pos ? radixPos + 1 : radixPos,
                  c: opts.radixPoint
              },
              pos: pos
          } : result;
      }
      function checkForLeadingZeroes(buffer, opts) {
          try {
              var numberMatches = new RegExp("(^" + ("" !== opts.negationSymbol.front ? Inputmask.escapeRegex(opts.negationSymbol.front) + "?" : "") + Inputmask.escapeRegex(opts.prefix) + ")(.*)(" + Inputmask.escapeRegex(opts.suffix) + ("" != opts.negationSymbol.back ? Inputmask.escapeRegex(opts.negationSymbol.back) + "?" : "") + "$)").exec(buffer.slice().reverse().join("")), number = numberMatches ? numberMatches[2] : "", leadingzeroes = !1;
              return number && (number = number.split(opts.radixPoint.charAt(0))[0], leadingzeroes = new RegExp("^[0" + opts.groupSeparator + "]*").exec(number)),
              !(!leadingzeroes || !(1 < leadingzeroes[0].length || 0 < leadingzeroes[0].length && leadingzeroes[0].length < number.length)) && leadingzeroes;
          } catch (e) {
              console.log(buffer.slice().reverse().join(""));
          }
      }
      Inputmask.extendAliases({
          numeric: {
              mask: genMask,
              _mask: function _mask(opts) {
                  return "(" + opts.groupSeparator + "999){+|1}";
              },
              digits: "*",
              digitsOptional: !0,
              enforceDigitsOnBlur: !1,
              radixPoint: ".",
              positionCaretOnClick: "radixFocus",
              _radixDance: !0,
              groupSeparator: "",
              allowMinus: !0,
              negationSymbol: {
                  front: "-",
                  back: ""
              },
              prefix: "",
              suffix: "",
              min: null,
              max: null,
              step: 1,
              unmaskAsNumber: !1,
              roundingFN: Math.round,
              inputmode: "numeric",
              placeholder: "0",
              greedy: !1,
              rightAlign: !0,
              insertMode: !0,
              autoUnmask: !1,
              skipOptionalPartCharacter: "",
              definitions: {
                  0: {
                      validator: decimalValidator
                  },
                  1: {
                      validator: decimalValidator,
                      definitionSymbol: "*"
                  },
                  "+": {
                      validator: function validator(chrs, maskset, pos, strict, opts) {
                          return opts.allowMinus && ("-" === chrs || chrs === opts.negationSymbol.front);
                      }
                  },
                  "-": {
                      validator: function validator(chrs, maskset, pos, strict, opts) {
                          return opts.allowMinus && chrs === opts.negationSymbol.back;
                      }
                  }
              },
              preValidation: function preValidation(buffer, pos, c, isSelection, opts, maskset, caretPos, strict) {
                  if (!1 !== opts.__financeInput && c === opts.radixPoint) return !1;
                  var radixPos = $.inArray(opts.radixPoint, buffer);
                  if (pos = hanndleRadixDance(pos, c, radixPos, opts), "-" !== c && c !== opts.negationSymbol.front) return !!strict || (-1 !== radixPos && !0 === opts._radixDance && !1 === isSelection && c === opts.radixPoint && void 0 !== opts.digits && (isNaN(opts.digits) || 0 < parseInt(opts.digits)) && radixPos !== pos ? {
                      caret: opts._radixDance && pos === radixPos - 1 ? radixPos + 1 : radixPos
                  } : {
                      rewritePosition: isSelection && opts.digitsOptional ? caretPos.end : pos
                  });
                  if (!0 !== opts.allowMinus) return !1;
                  var isNegative = !1, front = findValid("+", maskset), back = findValid("-", maskset);
                  return -1 !== front && (isNegative = [ front, back ]), !1 !== isNegative ? {
                      remove: isNegative,
                      caret: pos < radixPos ? pos + 1 : pos
                  } : {
                      insert: [ {
                          pos: findValidator("+", maskset),
                          c: opts.negationSymbol.front,
                          fromIsValid: !0
                      }, {
                          pos: findValidator("-", maskset),
                          c: opts.negationSymbol.back,
                          fromIsValid: void 0
                      } ],
                      caret: pos < radixPos ? pos + 1 : pos
                  };
              },
              postValidation: function postValidation(buffer, pos, currentResult, opts, maskset, strict) {
                  if (strict) return !0;
                  if (null !== opts.min || null !== opts.max) {
                      var unmasked = opts.onUnMask(buffer.slice().reverse().join(""), void 0, $.extend({}, opts, {
                          unmaskAsNumber: !0
                      }));
                      if (null !== opts.min && unmasked < opts.min && (unmasked.toString().length >= opts.min.toString().length || unmasked < 0)) return {
                          refreshFromBuffer: !0,
                          buffer: alignDigits(opts.min.toString().replace(".", opts.radixPoint).split(""), opts.digits, opts).reverse()
                      };
                      if (null !== opts.max && unmasked > opts.max) return {
                          refreshFromBuffer: !0,
                          buffer: alignDigits(opts.max.toString().replace(".", opts.radixPoint).split(""), opts.digits, opts).reverse()
                      };
                  }
                  return currentResult;
              },
              onUnMask: function onUnMask(maskedValue, unmaskedValue, opts) {
                  if ("" === unmaskedValue && !0 === opts.nullable) return unmaskedValue;
                  var processValue = maskedValue.replace(opts.prefix, "");
                  return processValue = processValue.replace(opts.suffix, ""), processValue = processValue.replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""),
                  "" !== opts.placeholder.charAt(0) && (processValue = processValue.replace(new RegExp(opts.placeholder.charAt(0), "g"), "0")),
                  opts.unmaskAsNumber ? ("" !== opts.radixPoint && -1 !== processValue.indexOf(opts.radixPoint) && (processValue = processValue.replace(Inputmask.escapeRegex.call(this, opts.radixPoint), ".")),
                  processValue = processValue.replace(new RegExp("^" + Inputmask.escapeRegex(opts.negationSymbol.front)), "-"),
                  processValue = processValue.replace(new RegExp(Inputmask.escapeRegex(opts.negationSymbol.back) + "$"), ""),
                  Number(processValue)) : processValue;
              },
              isComplete: function isComplete(buffer, opts) {
                  var maskedValue = (opts.numericInput ? buffer.slice().reverse() : buffer).join("");
                  return maskedValue = maskedValue.replace(new RegExp("^" + Inputmask.escapeRegex(opts.negationSymbol.front)), "-"),
                  maskedValue = maskedValue.replace(new RegExp(Inputmask.escapeRegex(opts.negationSymbol.back) + "$"), ""),
                  maskedValue = maskedValue.replace(opts.prefix, ""), maskedValue = maskedValue.replace(opts.suffix, ""),
                  maskedValue = maskedValue.replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator) + "([0-9]{3})", "g"), "$1"),
                  "," === opts.radixPoint && (maskedValue = maskedValue.replace(Inputmask.escapeRegex(opts.radixPoint), ".")),
                  isFinite(maskedValue);
              },
              onBeforeMask: function onBeforeMask(initialValue, opts) {
                  var radixPoint = opts.radixPoint || ",";
                  "number" != typeof initialValue && "number" !== opts.inputType || "" === radixPoint || (initialValue = initialValue.toString().replace(".", radixPoint));
                  var valueParts = initialValue.split(radixPoint), integerPart = valueParts[0].replace(/[^\-0-9]/g, ""), decimalPart = 1 < valueParts.length ? valueParts[1].replace(/[^0-9]/g, "") : "", forceDigits = 1 < valueParts.length;
                  initialValue = integerPart + ("" !== decimalPart ? radixPoint + decimalPart : decimalPart);
                  var digits = 0;
                  if ("" !== radixPoint && (digits = decimalPart.length, "" !== decimalPart)) {
                      var digitsFactor = Math.pow(10, digits || 1);
                      isFinite(opts.digits) && (digits = parseInt(opts.digits), digitsFactor = Math.pow(10, digits)),
                      initialValue = initialValue.replace(Inputmask.escapeRegex(radixPoint), "."), isFinite(initialValue) && (initialValue = opts.roundingFN(parseFloat(initialValue) * digitsFactor) / digitsFactor),
                      initialValue = initialValue.toString().replace(".", radixPoint);
                  }
                  if (0 === opts.digits && -1 !== initialValue.indexOf(Inputmask.escapeRegex(radixPoint)) && (initialValue = initialValue.substring(0, initialValue.indexOf(Inputmask.escapeRegex(radixPoint)))),
                  null !== opts.min || null !== opts.max) {
                      var numberValue = initialValue.toString().replace(radixPoint, ".");
                      null !== opts.min && numberValue < opts.min ? initialValue = opts.min.toString().replace(".", radixPoint) : null !== opts.max && numberValue > opts.max && (initialValue = opts.max.toString().replace(".", radixPoint));
                  }
                  return alignDigits(initialValue.toString().split(""), digits, opts, forceDigits).join("");
              },
              onBeforeWrite: function onBeforeWrite(e, buffer, caretPos, opts) {
                  function stripBuffer(buffer, stripRadix) {
                      if (!1 !== opts.__financeInput || stripRadix) {
                          var position = $.inArray(opts.radixPoint, buffer);
                          -1 !== position && buffer.splice(position, 1);
                      }
                      if ("" !== opts.groupSeparator) for (;-1 !== (position = buffer.indexOf(opts.groupSeparator)); ) buffer.splice(position, 1);
                      return buffer;
                  }
                  var result, leadingzeroes = checkForLeadingZeroes(buffer, opts);
                  if (leadingzeroes) {
                      var buf = buffer.slice().reverse(), caretNdx = buf.join("").indexOf(leadingzeroes[0]);
                      buf.splice(caretNdx, leadingzeroes[0].length);
                      var newCaretPos = buf.length - caretNdx;
                      stripBuffer(buf), result = {
                          refreshFromBuffer: !0,
                          buffer: buf.reverse(),
                          caret: caretPos < newCaretPos ? caretPos : newCaretPos
                      };
                  }
                  if (e) switch (e.type) {
                    case "blur":
                    case "checkval":
                      if (null !== opts.min) {
                          var unmasked = opts.onUnMask(buffer.slice().reverse().join(""), void 0, $.extend({}, opts, {
                              unmaskAsNumber: !0
                          }));
                          if (null !== opts.min && unmasked < opts.min) return {
                              refreshFromBuffer: !0,
                              buffer: alignDigits(opts.min.toString().replace(".", opts.radixPoint).split(""), opts.digits, opts).reverse()
                          };
                      }
                      if ("" !== opts.radixPoint && buffer[0] === opts.radixPoint) result && result.buffer ? result.buffer.shift() : (buffer.shift(),
                      result = {
                          refreshFromBuffer: !0,
                          buffer: stripBuffer(buffer)
                      }); else if (buffer[buffer.length - 1] === opts.negationSymbol.front) {
                          var nmbrMtchs = new RegExp("(^" + ("" != opts.negationSymbol.front ? Inputmask.escapeRegex(opts.negationSymbol.front) + "?" : "") + Inputmask.escapeRegex(opts.prefix) + ")(.*)(" + Inputmask.escapeRegex(opts.suffix) + ("" != opts.negationSymbol.back ? Inputmask.escapeRegex(opts.negationSymbol.back) + "?" : "") + "$)").exec(stripBuffer(buffer.slice(), !0).reverse().join("")), number = nmbrMtchs ? nmbrMtchs[2] : "";
                          0 == number && (result = {
                              refreshFromBuffer: !0,
                              buffer: [ 0 ]
                          });
                      }
                  }
                  return result;
              },
              onKeyDown: function onKeyDown(e, buffer, caretPos, opts) {
                  var $input = $(this), bffr;
                  if (e.ctrlKey) switch (e.keyCode) {
                    case Inputmask.keyCode.UP:
                      return this.inputmask.__valueSet.call(this, parseFloat(this.inputmask.unmaskedvalue()) + parseInt(opts.step)),
                      $input.trigger("setvalue"), !1;

                    case Inputmask.keyCode.DOWN:
                      return this.inputmask.__valueSet.call(this, parseFloat(this.inputmask.unmaskedvalue()) - parseInt(opts.step)),
                      $input.trigger("setvalue"), !1;
                  }
                  if (!e.shiftKey && (e.keyCode === Inputmask.keyCode.DELETE || e.keyCode === Inputmask.keyCode.BACKSPACE || e.keyCode === Inputmask.keyCode.BACKSPACE_SAFARI)) {
                      if (buffer[e.keyCode === Inputmask.keyCode.DELETE ? caretPos.begin - 1 : caretPos.end] === opts.negationSymbol.front) return bffr = buffer.slice().reverse(),
                      "" !== opts.negationSymbol.front && bffr.shift(), "" !== opts.negationSymbol.back && bffr.pop(),
                      $input.trigger("setvalue", [ bffr.join(""), caretPos.begin ]), !1;
                      if (!0 === opts._radixDance) {
                          var radixPos = $.inArray(opts.radixPoint, buffer);
                          if (opts.digitsOptional) {
                              if (0 === radixPos) return bffr = buffer.slice().reverse(), bffr.pop(), $input.trigger("setvalue", [ bffr.join(""), caretPos.begin ]),
                              !1;
                          } else if (-1 !== radixPos && (caretPos.begin < radixPos || e.keyCode === Inputmask.keyCode.DELETE && caretPos.begin === radixPos)) return e.keyCode !== Inputmask.keyCode.BACKSPACE && e.keyCode !== Inputmask.keyCode.BACKSPACE_SAFARI || caretPos.begin++,
                          bffr = buffer.slice().reverse(), bffr.splice(bffr.length - caretPos.begin, 1), $input.trigger("setvalue", [ alignDigits(bffr, opts.digits, opts).join(""), caretPos.begin ]),
                          !1;
                      }
                  }
              }
          },
          currency: {
              prefix: "$ ",
              groupSeparator: ",",
              alias: "numeric",
              digits: 2,
              digitsOptional: !1
          },
          decimal: {
              alias: "numeric"
          },
          integer: {
              alias: "numeric",
              digits: 0
          },
          percentage: {
              alias: "numeric",
              min: 0,
              max: 100,
              suffix: " %",
              digits: 0,
              allowMinus: !1
          },
          indianns: {
              alias: "numeric",
              _mask: function _mask(opts) {
                  return "(" + opts.groupSeparator + "99){*|1}(" + opts.groupSeparator + "999){1|1}";
              },
              groupSeparator: ",",
              radixPoint: ".",
              placeholder: "0",
              digits: 2,
              digitsOptional: !1
          }
      }), module.exports = Inputmask;
  } ], installedModules = {}, __webpack_require__.m = modules, __webpack_require__.c = installedModules,
  __webpack_require__.d = function(exports, name, getter) {
      __webpack_require__.o(exports, name) || Object.defineProperty(exports, name, {
          enumerable: !0,
          get: getter
      });
  }, __webpack_require__.r = function(exports) {
      "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(exports, Symbol.toStringTag, {
          value: "Module"
      }), Object.defineProperty(exports, "__esModule", {
          value: !0
      });
  }, __webpack_require__.t = function(value, mode) {
      if (1 & mode && (value = __webpack_require__(value)), 8 & mode) return value;
      if (4 & mode && "object" == typeof value && value && value.__esModule) return value;
      var ns = Object.create(null);
      if (__webpack_require__.r(ns), Object.defineProperty(ns, "default", {
          enumerable: !0,
          value: value
      }), 2 & mode && "string" != typeof value) for (var key in value) __webpack_require__.d(ns, key, function(key) {
          return value[key];
      }.bind(null, key));
      return ns;
  }, __webpack_require__.n = function(module) {
      var getter = module && module.__esModule ? function getDefault() {
          return module.default;
      } : function getModuleExports() {
          return module;
      };
      return __webpack_require__.d(getter, "a", getter), getter;
  }, __webpack_require__.o = function(object, property) {
      return Object.prototype.hasOwnProperty.call(object, property);
  }, __webpack_require__.p = "", __webpack_require__(__webpack_require__.s = 4);
  function __webpack_require__(moduleId) {
      if (installedModules[moduleId]) return installedModules[moduleId].exports;
      var module = installedModules[moduleId] = {
          i: moduleId,
          l: !1,
          exports: {}
      };
      return modules[moduleId].call(module.exports, module, module.exports, __webpack_require__),
      module.l = !0, module.exports;
  }
  var modules, installedModules;
});

/*! npm.im/object-fit-images 3.2.4 */
var objectFitImages = (function () {
'use strict';

var OFI = 'fregante:object-fit-images';
var propRegex = /(object-fit|object-position)\s*:\s*([-.\w\s%]+)/g;
var testImg = typeof Image === 'undefined' ? {style: {'object-position': 1}} : new Image();
var supportsObjectFit = 'object-fit' in testImg.style;
var supportsObjectPosition = 'object-position' in testImg.style;
var supportsOFI = 'background-size' in testImg.style;
var supportsCurrentSrc = typeof testImg.currentSrc === 'string';
var nativeGetAttribute = testImg.getAttribute;
var nativeSetAttribute = testImg.setAttribute;
var autoModeEnabled = false;

function createPlaceholder(w, h) {
	return ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + h + "'%3E%3C/svg%3E");
}

function polyfillCurrentSrc(el) {
	if (el.srcset && !supportsCurrentSrc && window.picturefill) {
		var pf = window.picturefill._;
		// parse srcset with picturefill where currentSrc isn't available
		if (!el[pf.ns] || !el[pf.ns].evaled) {
			// force synchronous srcset parsing
			pf.fillImg(el, {reselect: true});
		}

		if (!el[pf.ns].curSrc) {
			// force picturefill to parse srcset
			el[pf.ns].supported = false;
			pf.fillImg(el, {reselect: true});
		}

		// retrieve parsed currentSrc, if any
		el.currentSrc = el[pf.ns].curSrc || el.src;
	}
}

function getStyle(el) {
	var style = getComputedStyle(el).fontFamily;
	var parsed;
	var props = {};
	while ((parsed = propRegex.exec(style)) !== null) {
		props[parsed[1]] = parsed[2];
	}
	return props;
}

function setPlaceholder(img, width, height) {
	// Default: fill width, no height
	var placeholder = createPlaceholder(width || 1, height || 0);

	// Only set placeholder if it's different
	if (nativeGetAttribute.call(img, 'src') !== placeholder) {
		nativeSetAttribute.call(img, 'src', placeholder);
	}
}

function onImageReady(img, callback) {
	// naturalWidth is only available when the image headers are loaded,
	// this loop will poll it every 100ms.
	if (img.naturalWidth) {
		callback(img);
	} else {
		setTimeout(onImageReady, 100, img, callback);
	}
}

function fixOne(el) {
	var style = getStyle(el);
	var ofi = el[OFI];
	style['object-fit'] = style['object-fit'] || 'fill'; // default value

	// Avoid running where unnecessary, unless OFI had already done its deed
	if (!ofi.img) {
		// fill is the default behavior so no action is necessary
		if (style['object-fit'] === 'fill') {
			return;
		}

		// Where object-fit is supported and object-position isn't (Safari < 10)
		if (
			!ofi.skipTest && // unless user wants to apply regardless of browser support
			supportsObjectFit && // if browser already supports object-fit
			!style['object-position'] // unless object-position is used
		) {
			return;
		}
	}

	// keep a clone in memory while resetting the original to a blank
	if (!ofi.img) {
		ofi.img = new Image(el.width, el.height);
		ofi.img.srcset = nativeGetAttribute.call(el, "data-ofi-srcset") || el.srcset;
		ofi.img.src = nativeGetAttribute.call(el, "data-ofi-src") || el.src;

		// preserve for any future cloneNode calls
		// https://github.com/fregante/object-fit-images/issues/53
		nativeSetAttribute.call(el, "data-ofi-src", el.src);
		if (el.srcset) {
			nativeSetAttribute.call(el, "data-ofi-srcset", el.srcset);
		}

		setPlaceholder(el, el.naturalWidth || el.width, el.naturalHeight || el.height);

		// remove srcset because it overrides src
		if (el.srcset) {
			el.srcset = '';
		}
		try {
			keepSrcUsable(el);
		} catch (err) {
			if (window.console) {
				console.warn('https://bit.ly/ofi-old-browser');
			}
		}
	}

	polyfillCurrentSrc(ofi.img);

	el.style.backgroundImage = "url(\"" + ((ofi.img.currentSrc || ofi.img.src).replace(/"/g, '\\"')) + "\")";
	el.style.backgroundPosition = style['object-position'] || 'center';
	el.style.backgroundRepeat = 'no-repeat';
	el.style.backgroundOrigin = 'content-box';

	if (/scale-down/.test(style['object-fit'])) {
		onImageReady(ofi.img, function () {
			if (ofi.img.naturalWidth > el.width || ofi.img.naturalHeight > el.height) {
				el.style.backgroundSize = 'contain';
			} else {
				el.style.backgroundSize = 'auto';
			}
		});
	} else {
		el.style.backgroundSize = style['object-fit'].replace('none', 'auto').replace('fill', '100% 100%');
	}

	onImageReady(ofi.img, function (img) {
		setPlaceholder(el, img.naturalWidth, img.naturalHeight);
	});
}

function keepSrcUsable(el) {
	var descriptors = {
		get: function get(prop) {
			return el[OFI].img[prop ? prop : 'src'];
		},
		set: function set(value, prop) {
			el[OFI].img[prop ? prop : 'src'] = value;
			nativeSetAttribute.call(el, ("data-ofi-" + prop), value); // preserve for any future cloneNode
			fixOne(el);
			return value;
		}
	};
	Object.defineProperty(el, 'src', descriptors);
	Object.defineProperty(el, 'currentSrc', {
		get: function () { return descriptors.get('currentSrc'); }
	});
	Object.defineProperty(el, 'srcset', {
		get: function () { return descriptors.get('srcset'); },
		set: function (ss) { return descriptors.set(ss, 'srcset'); }
	});
}

function hijackAttributes() {
	function getOfiImageMaybe(el, name) {
		return el[OFI] && el[OFI].img && (name === 'src' || name === 'srcset') ? el[OFI].img : el;
	}
	if (!supportsObjectPosition) {
		HTMLImageElement.prototype.getAttribute = function (name) {
			return nativeGetAttribute.call(getOfiImageMaybe(this, name), name);
		};

		HTMLImageElement.prototype.setAttribute = function (name, value) {
			return nativeSetAttribute.call(getOfiImageMaybe(this, name), name, String(value));
		};
	}
}

function fix(imgs, opts) {
	var startAutoMode = !autoModeEnabled && !imgs;
	opts = opts || {};
	imgs = imgs || 'img';

	if ((supportsObjectPosition && !opts.skipTest) || !supportsOFI) {
		return false;
	}

	// use imgs as a selector or just select all images
	if (imgs === 'img') {
		imgs = document.getElementsByTagName('img');
	} else if (typeof imgs === 'string') {
		imgs = document.querySelectorAll(imgs);
	} else if (!('length' in imgs)) {
		imgs = [imgs];
	}

	// apply fix to all
	for (var i = 0; i < imgs.length; i++) {
		imgs[i][OFI] = imgs[i][OFI] || {
			skipTest: opts.skipTest
		};
		fixOne(imgs[i]);
	}

	if (startAutoMode) {
		document.body.addEventListener('load', function (e) {
			if (e.target.tagName === 'IMG') {
				fix(e.target, {
					skipTest: opts.skipTest
				});
			}
		}, true);
		autoModeEnabled = true;
		imgs = 'img'; // reset to a generic selector for watchMQ
	}

	// if requested, watch media queries for object-fit change
	if (opts.watchMQ) {
		window.addEventListener('resize', fix.bind(null, imgs, {
			skipTest: opts.skipTest
		}));
	}
}

fix.supportsObjectFit = supportsObjectFit;
fix.supportsObjectPosition = supportsObjectPosition;

hijackAttributes();

return fix;

}());

/*! picturefill - v3.0.2 - 2016-02-12
 * https://scottjehl.github.io/picturefill/
 * Copyright (c) 2016 https://github.com/scottjehl/picturefill/blob/master/Authors.txt; Licensed MIT
 */
!function(a){var b=navigator.userAgent;a.HTMLPictureElement&&/ecko/.test(b)&&b.match(/rv\:(\d+)/)&&RegExp.$1<45&&addEventListener("resize",function(){var b,c=document.createElement("source"),d=function(a){var b,d,e=a.parentNode;"PICTURE"===e.nodeName.toUpperCase()?(b=c.cloneNode(),e.insertBefore(b,e.firstElementChild),setTimeout(function(){e.removeChild(b)})):(!a._pfLastSize||a.offsetWidth>a._pfLastSize)&&(a._pfLastSize=a.offsetWidth,d=a.sizes,a.sizes+=",100vw",setTimeout(function(){a.sizes=d}))},e=function(){var a,b=document.querySelectorAll("picture > img, img[srcset][sizes]");for(a=0;a<b.length;a++)d(b[a])},f=function(){clearTimeout(b),b=setTimeout(e,99)},g=a.matchMedia&&matchMedia("(orientation: landscape)"),h=function(){f(),g&&g.addListener&&g.addListener(f)};return c.srcset="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",/^[c|i]|d$/.test(document.readyState||"")?h():document.addEventListener("DOMContentLoaded",h),f}())}(window),function(a,b,c){"use strict";function d(a){return" "===a||"	"===a||"\n"===a||"\f"===a||"\r"===a}function e(b,c){var d=new a.Image;return d.onerror=function(){A[b]=!1,ba()},d.onload=function(){A[b]=1===d.width,ba()},d.src=c,"pending"}function f(){M=!1,P=a.devicePixelRatio,N={},O={},s.DPR=P||1,Q.width=Math.max(a.innerWidth||0,z.clientWidth),Q.height=Math.max(a.innerHeight||0,z.clientHeight),Q.vw=Q.width/100,Q.vh=Q.height/100,r=[Q.height,Q.width,P].join("-"),Q.em=s.getEmValue(),Q.rem=Q.em}function g(a,b,c,d){var e,f,g,h;return"saveData"===B.algorithm?a>2.7?h=c+1:(f=b-c,e=Math.pow(a-.6,1.5),g=f*e,d&&(g+=.1*e),h=a+g):h=c>1?Math.sqrt(a*b):a,h>c}function h(a){var b,c=s.getSet(a),d=!1;"pending"!==c&&(d=r,c&&(b=s.setRes(c),s.applySetCandidate(b,a))),a[s.ns].evaled=d}function i(a,b){return a.res-b.res}function j(a,b,c){var d;return!c&&b&&(c=a[s.ns].sets,c=c&&c[c.length-1]),d=k(b,c),d&&(b=s.makeUrl(b),a[s.ns].curSrc=b,a[s.ns].curCan=d,d.res||aa(d,d.set.sizes)),d}function k(a,b){var c,d,e;if(a&&b)for(e=s.parseSet(b),a=s.makeUrl(a),c=0;c<e.length;c++)if(a===s.makeUrl(e[c].url)){d=e[c];break}return d}function l(a,b){var c,d,e,f,g=a.getElementsByTagName("source");for(c=0,d=g.length;d>c;c++)e=g[c],e[s.ns]=!0,f=e.getAttribute("srcset"),f&&b.push({srcset:f,media:e.getAttribute("media"),type:e.getAttribute("type"),sizes:e.getAttribute("sizes")})}function m(a,b){function c(b){var c,d=b.exec(a.substring(m));return d?(c=d[0],m+=c.length,c):void 0}function e(){var a,c,d,e,f,i,j,k,l,m=!1,o={};for(e=0;e<h.length;e++)f=h[e],i=f[f.length-1],j=f.substring(0,f.length-1),k=parseInt(j,10),l=parseFloat(j),X.test(j)&&"w"===i?((a||c)&&(m=!0),0===k?m=!0:a=k):Y.test(j)&&"x"===i?((a||c||d)&&(m=!0),0>l?m=!0:c=l):X.test(j)&&"h"===i?((d||c)&&(m=!0),0===k?m=!0:d=k):m=!0;m||(o.url=g,a&&(o.w=a),c&&(o.d=c),d&&(o.h=d),d||c||a||(o.d=1),1===o.d&&(b.has1x=!0),o.set=b,n.push(o))}function f(){for(c(T),i="",j="in descriptor";;){if(k=a.charAt(m),"in descriptor"===j)if(d(k))i&&(h.push(i),i="",j="after descriptor");else{if(","===k)return m+=1,i&&h.push(i),void e();if("("===k)i+=k,j="in parens";else{if(""===k)return i&&h.push(i),void e();i+=k}}else if("in parens"===j)if(")"===k)i+=k,j="in descriptor";else{if(""===k)return h.push(i),void e();i+=k}else if("after descriptor"===j)if(d(k));else{if(""===k)return void e();j="in descriptor",m-=1}m+=1}}for(var g,h,i,j,k,l=a.length,m=0,n=[];;){if(c(U),m>=l)return n;g=c(V),h=[],","===g.slice(-1)?(g=g.replace(W,""),e()):f()}}function n(a){function b(a){function b(){f&&(g.push(f),f="")}function c(){g[0]&&(h.push(g),g=[])}for(var e,f="",g=[],h=[],i=0,j=0,k=!1;;){if(e=a.charAt(j),""===e)return b(),c(),h;if(k){if("*"===e&&"/"===a[j+1]){k=!1,j+=2,b();continue}j+=1}else{if(d(e)){if(a.charAt(j-1)&&d(a.charAt(j-1))||!f){j+=1;continue}if(0===i){b(),j+=1;continue}e=" "}else if("("===e)i+=1;else if(")"===e)i-=1;else{if(","===e){b(),c(),j+=1;continue}if("/"===e&&"*"===a.charAt(j+1)){k=!0,j+=2;continue}}f+=e,j+=1}}}function c(a){return k.test(a)&&parseFloat(a)>=0?!0:l.test(a)?!0:"0"===a||"-0"===a||"+0"===a?!0:!1}var e,f,g,h,i,j,k=/^(?:[+-]?[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?(?:ch|cm|em|ex|in|mm|pc|pt|px|rem|vh|vmin|vmax|vw)$/i,l=/^calc\((?:[0-9a-z \.\+\-\*\/\(\)]+)\)$/i;for(f=b(a),g=f.length,e=0;g>e;e++)if(h=f[e],i=h[h.length-1],c(i)){if(j=i,h.pop(),0===h.length)return j;if(h=h.join(" "),s.matchesMedia(h))return j}return"100vw"}b.createElement("picture");var o,p,q,r,s={},t=!1,u=function(){},v=b.createElement("img"),w=v.getAttribute,x=v.setAttribute,y=v.removeAttribute,z=b.documentElement,A={},B={algorithm:""},C="data-pfsrc",D=C+"set",E=navigator.userAgent,F=/rident/.test(E)||/ecko/.test(E)&&E.match(/rv\:(\d+)/)&&RegExp.$1>35,G="currentSrc",H=/\s+\+?\d+(e\d+)?w/,I=/(\([^)]+\))?\s*(.+)/,J=a.picturefillCFG,K="position:absolute;left:0;visibility:hidden;display:block;padding:0;border:none;font-size:1em;width:1em;overflow:hidden;clip:rect(0px, 0px, 0px, 0px)",L="font-size:100%!important;",M=!0,N={},O={},P=a.devicePixelRatio,Q={px:1,"in":96},R=b.createElement("a"),S=!1,T=/^[ \t\n\r\u000c]+/,U=/^[, \t\n\r\u000c]+/,V=/^[^ \t\n\r\u000c]+/,W=/[,]+$/,X=/^\d+$/,Y=/^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/,Z=function(a,b,c,d){a.addEventListener?a.addEventListener(b,c,d||!1):a.attachEvent&&a.attachEvent("on"+b,c)},$=function(a){var b={};return function(c){return c in b||(b[c]=a(c)),b[c]}},_=function(){var a=/^([\d\.]+)(em|vw|px)$/,b=function(){for(var a=arguments,b=0,c=a[0];++b in a;)c=c.replace(a[b],a[++b]);return c},c=$(function(a){return"return "+b((a||"").toLowerCase(),/\band\b/g,"&&",/,/g,"||",/min-([a-z-\s]+):/g,"e.$1>=",/max-([a-z-\s]+):/g,"e.$1<=",/calc([^)]+)/g,"($1)",/(\d+[\.]*[\d]*)([a-z]+)/g,"($1 * e.$2)",/^(?!(e.[a-z]|[0-9\.&=|><\+\-\*\(\)\/])).*/gi,"")+";"});return function(b,d){var e;if(!(b in N))if(N[b]=!1,d&&(e=b.match(a)))N[b]=e[1]*Q[e[2]];else try{N[b]=new Function("e",c(b))(Q)}catch(f){}return N[b]}}(),aa=function(a,b){return a.w?(a.cWidth=s.calcListLength(b||"100vw"),a.res=a.w/a.cWidth):a.res=a.d,a},ba=function(a){if(t){var c,d,e,f=a||{};if(f.elements&&1===f.elements.nodeType&&("IMG"===f.elements.nodeName.toUpperCase()?f.elements=[f.elements]:(f.context=f.elements,f.elements=null)),c=f.elements||s.qsa(f.context||b,f.reevaluate||f.reselect?s.sel:s.selShort),e=c.length){for(s.setupRun(f),S=!0,d=0;e>d;d++)s.fillImg(c[d],f);s.teardownRun(f)}}};o=a.console&&console.warn?function(a){console.warn(a)}:u,G in v||(G="src"),A["image/jpeg"]=!0,A["image/gif"]=!0,A["image/png"]=!0,A["image/svg+xml"]=b.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image","1.1"),s.ns=("pf"+(new Date).getTime()).substr(0,9),s.supSrcset="srcset"in v,s.supSizes="sizes"in v,s.supPicture=!!a.HTMLPictureElement,s.supSrcset&&s.supPicture&&!s.supSizes&&!function(a){v.srcset="data:,a",a.src="data:,a",s.supSrcset=v.complete===a.complete,s.supPicture=s.supSrcset&&s.supPicture}(b.createElement("img")),s.supSrcset&&!s.supSizes?!function(){var a="data:image/gif;base64,R0lGODlhAgABAPAAAP///wAAACH5BAAAAAAALAAAAAACAAEAAAICBAoAOw==",c="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",d=b.createElement("img"),e=function(){var a=d.width;2===a&&(s.supSizes=!0),q=s.supSrcset&&!s.supSizes,t=!0,setTimeout(ba)};d.onload=e,d.onerror=e,d.setAttribute("sizes","9px"),d.srcset=c+" 1w,"+a+" 9w",d.src=c}():t=!0,s.selShort="picture>img,img[srcset]",s.sel=s.selShort,s.cfg=B,s.DPR=P||1,s.u=Q,s.types=A,s.setSize=u,s.makeUrl=$(function(a){return R.href=a,R.href}),s.qsa=function(a,b){return"querySelector"in a?a.querySelectorAll(b):[]},s.matchesMedia=function(){return a.matchMedia&&(matchMedia("(min-width: 0.1em)")||{}).matches?s.matchesMedia=function(a){return!a||matchMedia(a).matches}:s.matchesMedia=s.mMQ,s.matchesMedia.apply(this,arguments)},s.mMQ=function(a){return a?_(a):!0},s.calcLength=function(a){var b=_(a,!0)||!1;return 0>b&&(b=!1),b},s.supportsType=function(a){return a?A[a]:!0},s.parseSize=$(function(a){var b=(a||"").match(I);return{media:b&&b[1],length:b&&b[2]}}),s.parseSet=function(a){return a.cands||(a.cands=m(a.srcset,a)),a.cands},s.getEmValue=function(){var a;if(!p&&(a=b.body)){var c=b.createElement("div"),d=z.style.cssText,e=a.style.cssText;c.style.cssText=K,z.style.cssText=L,a.style.cssText=L,a.appendChild(c),p=c.offsetWidth,a.removeChild(c),p=parseFloat(p,10),z.style.cssText=d,a.style.cssText=e}return p||16},s.calcListLength=function(a){if(!(a in O)||B.uT){var b=s.calcLength(n(a));O[a]=b?b:Q.width}return O[a]},s.setRes=function(a){var b;if(a){b=s.parseSet(a);for(var c=0,d=b.length;d>c;c++)aa(b[c],a.sizes)}return b},s.setRes.res=aa,s.applySetCandidate=function(a,b){if(a.length){var c,d,e,f,h,k,l,m,n,o=b[s.ns],p=s.DPR;if(k=o.curSrc||b[G],l=o.curCan||j(b,k,a[0].set),l&&l.set===a[0].set&&(n=F&&!b.complete&&l.res-.1>p,n||(l.cached=!0,l.res>=p&&(h=l))),!h)for(a.sort(i),f=a.length,h=a[f-1],d=0;f>d;d++)if(c=a[d],c.res>=p){e=d-1,h=a[e]&&(n||k!==s.makeUrl(c.url))&&g(a[e].res,c.res,p,a[e].cached)?a[e]:c;break}h&&(m=s.makeUrl(h.url),o.curSrc=m,o.curCan=h,m!==k&&s.setSrc(b,h),s.setSize(b))}},s.setSrc=function(a,b){var c;a.src=b.url,"image/svg+xml"===b.set.type&&(c=a.style.width,a.style.width=a.offsetWidth+1+"px",a.offsetWidth+1&&(a.style.width=c))},s.getSet=function(a){var b,c,d,e=!1,f=a[s.ns].sets;for(b=0;b<f.length&&!e;b++)if(c=f[b],c.srcset&&s.matchesMedia(c.media)&&(d=s.supportsType(c.type))){"pending"===d&&(c=d),e=c;break}return e},s.parseSets=function(a,b,d){var e,f,g,h,i=b&&"PICTURE"===b.nodeName.toUpperCase(),j=a[s.ns];(j.src===c||d.src)&&(j.src=w.call(a,"src"),j.src?x.call(a,C,j.src):y.call(a,C)),(j.srcset===c||d.srcset||!s.supSrcset||a.srcset)&&(e=w.call(a,"srcset"),j.srcset=e,h=!0),j.sets=[],i&&(j.pic=!0,l(b,j.sets)),j.srcset?(f={srcset:j.srcset,sizes:w.call(a,"sizes")},j.sets.push(f),g=(q||j.src)&&H.test(j.srcset||""),g||!j.src||k(j.src,f)||f.has1x||(f.srcset+=", "+j.src,f.cands.push({url:j.src,d:1,set:f}))):j.src&&j.sets.push({srcset:j.src,sizes:null}),j.curCan=null,j.curSrc=c,j.supported=!(i||f&&!s.supSrcset||g&&!s.supSizes),h&&s.supSrcset&&!j.supported&&(e?(x.call(a,D,e),a.srcset=""):y.call(a,D)),j.supported&&!j.srcset&&(!j.src&&a.src||a.src!==s.makeUrl(j.src))&&(null===j.src?a.removeAttribute("src"):a.src=j.src),j.parsed=!0},s.fillImg=function(a,b){var c,d=b.reselect||b.reevaluate;a[s.ns]||(a[s.ns]={}),c=a[s.ns],(d||c.evaled!==r)&&((!c.parsed||b.reevaluate)&&s.parseSets(a,a.parentNode,b),c.supported?c.evaled=r:h(a))},s.setupRun=function(){(!S||M||P!==a.devicePixelRatio)&&f()},s.supPicture?(ba=u,s.fillImg=u):!function(){var c,d=a.attachEvent?/d$|^c/:/d$|^c|^i/,e=function(){var a=b.readyState||"";f=setTimeout(e,"loading"===a?200:999),b.body&&(s.fillImgs(),c=c||d.test(a),c&&clearTimeout(f))},f=setTimeout(e,b.body?9:99),g=function(a,b){var c,d,e=function(){var f=new Date-d;b>f?c=setTimeout(e,b-f):(c=null,a())};return function(){d=new Date,c||(c=setTimeout(e,b))}},h=z.clientHeight,i=function(){M=Math.max(a.innerWidth||0,z.clientWidth)!==Q.width||z.clientHeight!==h,h=z.clientHeight,M&&s.fillImgs()};Z(a,"resize",g(i,99)),Z(b,"readystatechange",e)}(),s.picturefill=ba,s.fillImgs=ba,s.teardownRun=u,ba._=s,a.picturefillCFG={pf:s,push:function(a){var b=a.shift();"function"==typeof s[b]?s[b].apply(s,a):(B[b]=a[0],S&&s.fillImgs({reselect:!0}))}};for(;J&&J.length;)a.picturefillCFG.push(J.shift());a.picturefill=ba,"object"==typeof module&&"object"==typeof module.exports?module.exports=ba:"function"==typeof define&&define.amd&&define("picturefill",function(){return ba}),s.supPicture||(A["image/webp"]=e("image/webp","data:image/webp;base64,UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAABBxAR/Q9ERP8DAABWUDggGAAAADABAJ0BKgEAAQADADQlpAADcAD++/1QAA=="))}(window,document);
(function(n,h){"function"===typeof define&&define.amd?define([],h):"object"===typeof module&&module.exports?module.exports=h():n.Rellax=h()})("undefined"!==typeof window?window:global,function(){var n=function(h,p){var a=Object.create(n.prototype),l=0,r=0,k=0,t=0,c=[],u=!0,B=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.msRequestAnimationFrame||window.oRequestAnimationFrame||function(a){return setTimeout(a,1E3/60)},q=null,C=window.cancelAnimationFrame||
window.mozCancelAnimationFrame||clearTimeout,D=window.transformProp||function(){var a=document.createElement("div");if(null===a.style.transform){var b=["Webkit","Moz","ms"],e;for(e in b)if(void 0!==a.style[b[e]+"Transform"])return b[e]+"Transform"}return"transform"}();a.options={speed:-2,center:!1,wrapper:null,relativeToWrapper:!1,round:!0,vertical:!0,horizontal:!1,callback:function(){}};p&&Object.keys(p).forEach(function(d){a.options[d]=p[d]});h||(h=".rellax");var m="string"===typeof h?document.querySelectorAll(h):
[h];if(0<m.length){a.elems=m;if(a.options.wrapper&&!a.options.wrapper.nodeType)if(m=document.querySelector(a.options.wrapper))a.options.wrapper=m;else{console.warn("Rellax: The wrapper you're trying to use doesn't exist.");return}var w=function(){for(var d=0;d<c.length;d++)a.elems[d].style.cssText=c[d].style;c=[];r=window.innerHeight;t=window.innerWidth;x();for(d=0;d<a.elems.length;d++){var b=a.elems[d],e=b.getAttribute("data-rellax-percentage"),g=b.getAttribute("data-rellax-speed"),h=b.getAttribute("data-rellax-zindex")||
0,l=b.getAttribute("data-rellax-min"),n=b.getAttribute("data-rellax-max"),v=a.options.wrapper?a.options.wrapper.scrollTop:window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop;a.options.relativeToWrapper&&(v=(window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop)-a.options.wrapper.offsetTop);var f=a.options.vertical?e||a.options.center?v:0:0,k=a.options.horizontal?e||a.options.center?a.options.wrapper?a.options.wrapper.scrollLeft:window.pageXOffset||
document.documentElement.scrollLeft||document.body.scrollLeft:0:0;v=f+b.getBoundingClientRect().top;var m=b.clientHeight||b.offsetHeight||b.scrollHeight,p=k+b.getBoundingClientRect().left,q=b.clientWidth||b.offsetWidth||b.scrollWidth;f=e?e:(f-v+r)/(m+r);e=e?e:(k-p+t)/(q+t);a.options.center&&(f=e=.5);g=g?g:a.options.speed;e=y(e,f,g);b=b.style.cssText;f="";0<=b.indexOf("transform")&&(f=b.indexOf("transform"),f=b.slice(f),f=(k=f.indexOf(";"))?" "+f.slice(11,k).replace(/\s/g,""):" "+f.slice(11).replace(/\s/g,
""));c.push({baseX:e.x,baseY:e.y,top:v,left:p,height:m,width:q,speed:g,style:b,transform:f,zindex:h,min:l,max:n})}u&&(window.addEventListener("resize",w),u=!1);z()},x=function(){var d=l,b=k;l=a.options.wrapper?a.options.wrapper.scrollTop:(document.documentElement||document.body.parentNode||document.body).scrollTop||window.pageYOffset;k=a.options.wrapper?a.options.wrapper.scrollLeft:(document.documentElement||document.body.parentNode||document.body).scrollLeft||window.pageXOffset;a.options.relativeToWrapper&&
(l=((document.documentElement||document.body.parentNode||document.body).scrollTop||window.pageYOffset)-a.options.wrapper.offsetTop);return d!=l&&a.options.vertical||b!=k&&a.options.horizontal?!0:!1},y=function(d,b,e){var c={};d=100*e*(1-d);b=100*e*(1-b);c.x=a.options.round?Math.round(d):Math.round(100*d)/100;c.y=a.options.round?Math.round(b):Math.round(100*b)/100;return c},A=function(){x()&&!1===u&&z();q=B(A)},z=function(){for(var d,b=0;b<a.elems.length;b++){d=y((k-c[b].left+t)/(c[b].width+t),(l-
c[b].top+r)/(c[b].height+r),c[b].speed);var e=d.y-c[b].baseY,g=d.x-c[b].baseX;null!==c[b].min&&(a.options.vertical&&!a.options.horizontal&&(e=e<=c[b].min?c[b].min:e),a.options.horizontal&&!a.options.vertical&&(g=g<=c[b].min?c[b].min:g));null!==c[b].max&&(a.options.vertical&&!a.options.horizontal&&(e=e>=c[b].max?c[b].max:e),a.options.horizontal&&!a.options.vertical&&(g=g>=c[b].max?c[b].max:g));a.elems[b].style[D]="translate3d("+(a.options.horizontal?g:"0")+"px,"+(a.options.vertical?e:"0")+"px,"+c[b].zindex+
"px) "+c[b].transform}a.options.callback(d)};a.destroy=function(){for(var d=0;d<a.elems.length;d++)a.elems[d].style.cssText=c[d].style;u||(window.removeEventListener("resize",w),u=!0);C(q);q=null};w();A();a.refresh=w;return a}console.warn("Rellax: The elements you're trying to select don't exist.")};return n});

/*! smooth-scroll v16.1.0 | (c) 2019 Chris Ferdinandi | MIT License | http://github.com/cferdinandi/smooth-scroll */
window.Element&&!Element.prototype.closest&&(Element.prototype.closest=function(e){var t,n=(this.document||this.ownerDocument).querySelectorAll(e),o=this;do{for(t=n.length;0<=--t&&n.item(t)!==o;);}while(t<0&&(o=o.parentElement));return o}),(function(){if("function"==typeof window.CustomEvent)return;function e(e,t){t=t||{bubbles:!1,cancelable:!1,detail:void 0};var n=document.createEvent("CustomEvent");return n.initCustomEvent(e,t.bubbles,t.cancelable,t.detail),n}e.prototype=window.Event.prototype,window.CustomEvent=e})(),(function(){for(var r=0,e=["ms","moz","webkit","o"],t=0;t<e.length&&!window.requestAnimationFrame;++t)window.requestAnimationFrame=window[e[t]+"RequestAnimationFrame"],window.cancelAnimationFrame=window[e[t]+"CancelAnimationFrame"]||window[e[t]+"CancelRequestAnimationFrame"];window.requestAnimationFrame||(window.requestAnimationFrame=function(e,t){var n=(new Date).getTime(),o=Math.max(0,16-(n-r)),a=window.setTimeout((function(){e(n+o)}),o);return r=n+o,a}),window.cancelAnimationFrame||(window.cancelAnimationFrame=function(e){clearTimeout(e)})})(),(function(e,t){"function"==typeof define&&define.amd?define([],(function(){return t(e)})):"object"==typeof exports?module.exports=t(e):e.SmoothScroll=t(e)})("undefined"!=typeof global?global:"undefined"!=typeof window?window:this,(function(q){"use strict";var I={ignore:"[data-scroll-ignore]",header:null,topOnEmptyHash:!0,speed:500,speedAsDuration:!1,durationMax:null,durationMin:null,clip:!0,offset:0,easing:"easeInOutCubic",customEasing:null,updateURL:!0,popstate:!0,emitEvents:!0},F=function(){var n={};return Array.prototype.forEach.call(arguments,(function(e){for(var t in e){if(!e.hasOwnProperty(t))return;n[t]=e[t]}})),n},r=function(e){"#"===e.charAt(0)&&(e=e.substr(1));for(var t,n=String(e),o=n.length,a=-1,r="",i=n.charCodeAt(0);++a<o;){if(0===(t=n.charCodeAt(a)))throw new InvalidCharacterError("Invalid character: the input contains U+0000.");1<=t&&t<=31||127==t||0===a&&48<=t&&t<=57||1===a&&48<=t&&t<=57&&45===i?r+="\\"+t.toString(16)+" ":r+=128<=t||45===t||95===t||48<=t&&t<=57||65<=t&&t<=90||97<=t&&t<=122?n.charAt(a):"\\"+n.charAt(a)}return"#"+r},L=function(){return Math.max(document.body.scrollHeight,document.documentElement.scrollHeight,document.body.offsetHeight,document.documentElement.offsetHeight,document.body.clientHeight,document.documentElement.clientHeight)},x=function(e){return e?(t=e,parseInt(q.getComputedStyle(t).height,10)+e.offsetTop):0;var t},H=function(e,t,n,o){if(t.emitEvents&&"function"==typeof q.CustomEvent){var a=new CustomEvent(e,{bubbles:!0,detail:{anchor:n,toggle:o}});document.dispatchEvent(a)}};return function(o,e){var A,a,O,C,M={};M.cancelScroll=function(e){cancelAnimationFrame(C),C=null,e||H("scrollCancel",A)},M.animateScroll=function(i,c,e){M.cancelScroll();var s=F(A||I,e||{}),u="[object Number]"===Object.prototype.toString.call(i),t=u||!i.tagName?null:i;if(u||t){var l=q.pageYOffset;s.header&&!O&&(O=document.querySelector(s.header));var n,o,a,m,r,d,f,h,p=x(O),g=u?i:(function(e,t,n,o){var a=0;if(e.offsetParent)for(;a+=e.offsetTop,e=e.offsetParent;);return a=Math.max(a-t-n,0),o&&(a=Math.min(a,L()-q.innerHeight)),a})(t,p,parseInt("function"==typeof s.offset?s.offset(i,c):s.offset,10),s.clip),y=g-l,v=L(),w=0,S=(n=y,a=(o=s).speedAsDuration?o.speed:Math.abs(n/1e3*o.speed),o.durationMax&&a>o.durationMax?o.durationMax:o.durationMin&&a<o.durationMin?o.durationMin:parseInt(a,10)),E=function(e,t){var n,o,a,r=q.pageYOffset;if(e==t||r==t||(l<t&&q.innerHeight+r)>=v)return M.cancelScroll(!0),o=t,a=u,0===(n=i)&&document.body.focus(),a||(n.focus(),document.activeElement!==n&&(n.setAttribute("tabindex","-1"),n.focus(),n.style.outline="none"),q.scrollTo(0,o)),H("scrollStop",s,i,c),!(C=m=null)},b=function(e){var t,n,o;m||(m=e),w+=e-m,d=l+y*(n=r=1<(r=0===S?0:w/S)?1:r,"easeInQuad"===(t=s).easing&&(o=n*n),"easeOutQuad"===t.easing&&(o=n*(2-n)),"easeInOutQuad"===t.easing&&(o=n<.5?2*n*n:(4-2*n)*n-1),"easeInCubic"===t.easing&&(o=n*n*n),"easeOutCubic"===t.easing&&(o=--n*n*n+1),"easeInOutCubic"===t.easing&&(o=n<.5?4*n*n*n:(n-1)*(2*n-2)*(2*n-2)+1),"easeInQuart"===t.easing&&(o=n*n*n*n),"easeOutQuart"===t.easing&&(o=1- --n*n*n*n),"easeInOutQuart"===t.easing&&(o=n<.5?8*n*n*n*n:1-8*--n*n*n*n),"easeInQuint"===t.easing&&(o=n*n*n*n*n),"easeOutQuint"===t.easing&&(o=1+--n*n*n*n*n),"easeInOutQuint"===t.easing&&(o=n<.5?16*n*n*n*n*n:1+16*--n*n*n*n*n),t.customEasing&&(o=t.customEasing(n)),o||n),q.scrollTo(0,Math.floor(d)),E(d,g)||(C=q.requestAnimationFrame(b),m=e)};0===q.pageYOffset&&q.scrollTo(0,0),f=i,h=s,u||history.pushState&&h.updateURL&&history.pushState({smoothScroll:JSON.stringify(h),anchor:f.id},document.title,f===document.documentElement?"#top":"#"+f.id),"matchMedia"in q&&q.matchMedia("(prefers-reduced-motion)").matches?q.scrollTo(0,Math.floor(g)):(H("scrollStart",s,i,c),M.cancelScroll(!0),q.requestAnimationFrame(b))}};var t=function(e){if(!e.defaultPrevented&&!(0!==e.button||e.metaKey||e.ctrlKey||e.shiftKey)&&"closest"in e.target&&(a=e.target.closest(o))&&"a"===a.tagName.toLowerCase()&&!e.target.closest(A.ignore)&&a.hostname===q.location.hostname&&a.pathname===q.location.pathname&&/#/.test(a.href)){var t,n=r(a.hash);if("#"===n){if(!A.topOnEmptyHash)return;t=document.documentElement}else t=document.querySelector(n);(t=t||"#top"!==n?t:document.documentElement)&&(e.preventDefault(),(function(e){if(history.replaceState&&e.updateURL&&!history.state){var t=q.location.hash;t=t||"",history.replaceState({smoothScroll:JSON.stringify(e),anchor:t||q.pageYOffset},document.title,t||q.location.href)}})(A),M.animateScroll(t,a))}},n=function(e){if(null!==history.state&&history.state.smoothScroll&&history.state.smoothScroll===JSON.stringify(A)){var t=history.state.anchor;"string"==typeof t&&t&&!(t=document.querySelector(r(history.state.anchor)))||M.animateScroll(t,null,{updateURL:!1})}};M.destroy=function(){A&&(document.removeEventListener("click",t,!1),q.removeEventListener("popstate",n,!1),M.cancelScroll(),C=O=a=A=null)};return (function(){if(!("querySelector"in document&&"addEventListener"in q&&"requestAnimationFrame"in q&&"closest"in q.Element.prototype))throw"Smooth Scroll: This browser does not support the required JavaScript methods and browser APIs.";M.destroy(),A=F(I,e||{}),O=A.header?document.querySelector(A.header):null,document.addEventListener("click",t,!1),A.updateURL&&A.popstate&&q.addEventListener("popstate",n,!1)})(),M}}));

/*!
  * Stickyfill – `position: sticky` polyfill
  * v. 2.1.0 | https://github.com/wilddeer/stickyfill
  * MIT License
  */

 ;(function(window, document) {
  'use strict';

  /*
   * 1. Check if the browser supports `position: sticky` natively or is too old to run the polyfill.
   *    If either of these is the case set `seppuku` flag. It will be checked later to disable key features
   *    of the polyfill, but the API will remain functional to avoid breaking things.
   */

  var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var seppuku = false;

  var isWindowDefined = typeof window !== 'undefined';

  // The polyfill can’t function properly without `window` or `window.getComputedStyle`.
  if (!isWindowDefined || !window.getComputedStyle) seppuku = true;
  // Dont’t get in a way if the browser supports `position: sticky` natively.
  else {
          (function () {
              var testNode = document.createElement('div');

              if (['', '-webkit-', '-moz-', '-ms-'].some(function (prefix) {
                  try {
                      testNode.style.position = prefix + 'sticky';
                  } catch (e) {}

                  return testNode.style.position != '';
              })) seppuku = true;
          })();
      }

  /*
   * 2. “Global” vars used across the polyfill
   */
  var isInitialized = false;

  // Check if Shadow Root constructor exists to make further checks simpler
  var shadowRootExists = typeof ShadowRoot !== 'undefined';

  // Last saved scroll position
  var scroll = {
      top: null,
      left: null
  };

  // Array of created Sticky instances
  var stickies = [];

  /*
   * 3. Utility functions
   */
  function extend(targetObj, sourceObject) {
      for (var key in sourceObject) {
          if (sourceObject.hasOwnProperty(key)) {
              targetObj[key] = sourceObject[key];
          }
      }
  }

  function parseNumeric(val) {
      return parseFloat(val) || 0;
  }

  function getDocOffsetTop(node) {
      var docOffsetTop = 0;

      while (node) {
          docOffsetTop += node.offsetTop;
          node = node.offsetParent;
      }

      return docOffsetTop;
  }

  /*
   * 4. Sticky class
   */

  var Sticky = function () {
      function Sticky(node) {
          _classCallCheck(this, Sticky);

          if (!(node instanceof HTMLElement)) throw new Error('First argument must be HTMLElement');
          if (stickies.some(function (sticky) {
              return sticky._node === node;
          })) throw new Error('Stickyfill is already applied to this node');

          this._node = node;
          this._stickyMode = null;
          this._active = false;

          stickies.push(this);

          this.refresh();
      }

      _createClass(Sticky, [{
          key: 'refresh',
          value: function refresh() {
              if (seppuku || this._removed) return;
              if (this._active) this._deactivate();

              var node = this._node;

              /*
               * 1. Save node computed props
               */
              var nodeComputedStyle = getComputedStyle(node);
              var nodeComputedProps = {
                  position: nodeComputedStyle.position,
                  top: nodeComputedStyle.top,
                  display: nodeComputedStyle.display,
                  marginTop: nodeComputedStyle.marginTop,
                  marginBottom: nodeComputedStyle.marginBottom,
                  marginLeft: nodeComputedStyle.marginLeft,
                  marginRight: nodeComputedStyle.marginRight,
                  cssFloat: nodeComputedStyle.cssFloat
              };

              /*
               * 2. Check if the node can be activated
               */
              if (isNaN(parseFloat(nodeComputedProps.top)) || nodeComputedProps.display == 'table-cell' || nodeComputedProps.display == 'none') return;

              this._active = true;

              /*
               * 3. Check if the current node position is `sticky`. If it is, it means that the browser supports sticky positioning,
               *    but the polyfill was force-enabled. We set the node’s position to `static` before continuing, so that the node
               *    is in it’s initial position when we gather its params.
               */
              var originalPosition = node.style.position;
              if (nodeComputedStyle.position == 'sticky' || nodeComputedStyle.position == '-webkit-sticky') node.style.position = 'static';

              /*
               * 4. Get necessary node parameters
               */
              var referenceNode = node.parentNode;
              var parentNode = shadowRootExists && referenceNode instanceof ShadowRoot ? referenceNode.host : referenceNode;
              var nodeWinOffset = node.getBoundingClientRect();
              var parentWinOffset = parentNode.getBoundingClientRect();
              var parentComputedStyle = getComputedStyle(parentNode);

              this._parent = {
                  node: parentNode,
                  styles: {
                      position: parentNode.style.position
                  },
                  offsetHeight: parentNode.offsetHeight
              };
              this._offsetToWindow = {
                  left: nodeWinOffset.left,
                  right: document.documentElement.clientWidth - nodeWinOffset.right
              };
              this._offsetToParent = {
                  top: nodeWinOffset.top - parentWinOffset.top - parseNumeric(parentComputedStyle.borderTopWidth),
                  left: nodeWinOffset.left - parentWinOffset.left - parseNumeric(parentComputedStyle.borderLeftWidth),
                  right: -nodeWinOffset.right + parentWinOffset.right - parseNumeric(parentComputedStyle.borderRightWidth)
              };
              this._styles = {
                  position: originalPosition,
                  top: node.style.top,
                  bottom: node.style.bottom,
                  left: node.style.left,
                  right: node.style.right,
                  width: node.style.width,
                  marginTop: node.style.marginTop,
                  marginLeft: node.style.marginLeft,
                  marginRight: node.style.marginRight
              };

              var nodeTopValue = parseNumeric(nodeComputedProps.top);
              this._limits = {
                  start: nodeWinOffset.top + window.pageYOffset - nodeTopValue,
                  end: parentWinOffset.top + window.pageYOffset + parentNode.offsetHeight - parseNumeric(parentComputedStyle.borderBottomWidth) - node.offsetHeight - nodeTopValue - parseNumeric(nodeComputedProps.marginBottom)
              };

              /*
               * 5. Ensure that the node will be positioned relatively to the parent node
               */
              var parentPosition = parentComputedStyle.position;

              if (parentPosition != 'absolute' && parentPosition != 'relative') {
                  parentNode.style.position = 'relative';
              }

              /*
               * 6. Recalc node position.
               *    It’s important to do this before clone injection to avoid scrolling bug in Chrome.
               */
              this._recalcPosition();

              /*
               * 7. Create a clone
               */
              var clone = this._clone = {};
              clone.node = document.createElement('div');

              // Apply styles to the clone
              extend(clone.node.style, {
                  width: nodeWinOffset.right - nodeWinOffset.left + 'px',
                  height: nodeWinOffset.bottom - nodeWinOffset.top + 'px',
                  marginTop: nodeComputedProps.marginTop,
                  marginBottom: nodeComputedProps.marginBottom,
                  marginLeft: nodeComputedProps.marginLeft,
                  marginRight: nodeComputedProps.marginRight,
                  cssFloat: nodeComputedProps.cssFloat,
                  padding: 0,
                  border: 0,
                  borderSpacing: 0,
                  fontSize: '1em',
                  position: 'static'
              });

              referenceNode.insertBefore(clone.node, node);
              clone.docOffsetTop = getDocOffsetTop(clone.node);
          }
      }, {
          key: '_recalcPosition',
          value: function _recalcPosition() {
              if (!this._active || this._removed) return;

              var stickyMode = scroll.top <= this._limits.start ? 'start' : scroll.top >= this._limits.end ? 'end' : 'middle';

              if (this._stickyMode == stickyMode) return;

              switch (stickyMode) {
                  case 'start':
                      extend(this._node.style, {
                          position: 'absolute',
                          left: this._offsetToParent.left + 'px',
                          right: this._offsetToParent.right + 'px',
                          top: this._offsetToParent.top + 'px',
                          bottom: 'auto',
                          width: 'auto',
                          marginLeft: 0,
                          marginRight: 0,
                          marginTop: 0
                      });
                      break;

                  case 'middle':
                      extend(this._node.style, {
                          position: 'fixed',
                          left: this._offsetToWindow.left + 'px',
                          right: this._offsetToWindow.right + 'px',
                          top: this._styles.top,
                          bottom: 'auto',
                          width: 'auto',
                          marginLeft: 0,
                          marginRight: 0,
                          marginTop: 0
                      });
                      break;

                  case 'end':
                      extend(this._node.style, {
                          position: 'absolute',
                          left: this._offsetToParent.left + 'px',
                          right: this._offsetToParent.right + 'px',
                          top: 'auto',
                          bottom: 0,
                          width: 'auto',
                          marginLeft: 0,
                          marginRight: 0
                      });
                      break;
              }

              this._stickyMode = stickyMode;
          }
      }, {
          key: '_fastCheck',
          value: function _fastCheck() {
              if (!this._active || this._removed) return;

              if (Math.abs(getDocOffsetTop(this._clone.node) - this._clone.docOffsetTop) > 1 || Math.abs(this._parent.node.offsetHeight - this._parent.offsetHeight) > 1) this.refresh();
          }
      }, {
          key: '_deactivate',
          value: function _deactivate() {
              var _this = this;

              if (!this._active || this._removed) return;

              this._clone.node.parentNode.removeChild(this._clone.node);
              delete this._clone;

              extend(this._node.style, this._styles);
              delete this._styles;

              // Check whether element’s parent node is used by other stickies.
              // If not, restore parent node’s styles.
              if (!stickies.some(function (sticky) {
                  return sticky !== _this && sticky._parent && sticky._parent.node === _this._parent.node;
              })) {
                  extend(this._parent.node.style, this._parent.styles);
              }
              delete this._parent;

              this._stickyMode = null;
              this._active = false;

              delete this._offsetToWindow;
              delete this._offsetToParent;
              delete this._limits;
          }
      }, {
          key: 'remove',
          value: function remove() {
              var _this2 = this;

              this._deactivate();

              stickies.some(function (sticky, index) {
                  if (sticky._node === _this2._node) {
                      stickies.splice(index, 1);
                      return true;
                  }
              });

              this._removed = true;
          }
      }]);

      return Sticky;
  }();

  /*
   * 5. Stickyfill API
   */


  var Stickyfill = {
      stickies: stickies,
      Sticky: Sticky,

      forceSticky: function forceSticky() {
          seppuku = false;
          init();

          this.refreshAll();
      },
      addOne: function addOne(node) {
          // Check whether it’s a node
          if (!(node instanceof HTMLElement)) {
              // Maybe it’s a node list of some sort?
              // Take first node from the list then
              if (node.length && node[0]) node = node[0];else return;
          }

          // Check if Stickyfill is already applied to the node
          // and return existing sticky
          for (var i = 0; i < stickies.length; i++) {
              if (stickies[i]._node === node) return stickies[i];
          }

          // Create and return new sticky
          return new Sticky(node);
      },
      add: function add(nodeList) {
          // If it’s a node make an array of one node
          if (nodeList instanceof HTMLElement) nodeList = [nodeList];
          // Check if the argument is an iterable of some sort
          if (!nodeList.length) return;

          // Add every element as a sticky and return an array of created Sticky instances
          var addedStickies = [];

          var _loop = function _loop(i) {
              var node = nodeList[i];

              // If it’s not an HTMLElement – create an empty element to preserve 1-to-1
              // correlation with input list
              if (!(node instanceof HTMLElement)) {
                  addedStickies.push(void 0);
                  return 'continue';
              }

              // If Stickyfill is already applied to the node
              // add existing sticky
              if (stickies.some(function (sticky) {
                  if (sticky._node === node) {
                      addedStickies.push(sticky);
                      return true;
                  }
              })) return 'continue';

              // Create and add new sticky
              addedStickies.push(new Sticky(node));
          };

          for (var i = 0; i < nodeList.length; i++) {
              var _ret2 = _loop(i);

              if (_ret2 === 'continue') continue;
          }

          return addedStickies;
      },
      refreshAll: function refreshAll() {
          stickies.forEach(function (sticky) {
              return sticky.refresh();
          });
      },
      removeOne: function removeOne(node) {
          // Check whether it’s a node
          if (!(node instanceof HTMLElement)) {
              // Maybe it’s a node list of some sort?
              // Take first node from the list then
              if (node.length && node[0]) node = node[0];else return;
          }

          // Remove the stickies bound to the nodes in the list
          stickies.some(function (sticky) {
              if (sticky._node === node) {
                  sticky.remove();
                  return true;
              }
          });
      },
      remove: function remove(nodeList) {
          // If it’s a node make an array of one node
          if (nodeList instanceof HTMLElement) nodeList = [nodeList];
          // Check if the argument is an iterable of some sort
          if (!nodeList.length) return;

          // Remove the stickies bound to the nodes in the list

          var _loop2 = function _loop2(i) {
              var node = nodeList[i];

              stickies.some(function (sticky) {
                  if (sticky._node === node) {
                      sticky.remove();
                      return true;
                  }
              });
          };

          for (var i = 0; i < nodeList.length; i++) {
              _loop2(i);
          }
      },
      removeAll: function removeAll() {
          while (stickies.length) {
              stickies[0].remove();
          }
      }
  };

  /*
   * 6. Setup events (unless the polyfill was disabled)
   */
  function init() {
      if (isInitialized) {
          return;
      }

      isInitialized = true;

      // Watch for scroll position changes and trigger recalc/refresh if needed
      function checkScroll() {
          if (window.pageXOffset != scroll.left) {
              scroll.top = window.pageYOffset;
              scroll.left = window.pageXOffset;

              Stickyfill.refreshAll();
          } else if (window.pageYOffset != scroll.top) {
              scroll.top = window.pageYOffset;
              scroll.left = window.pageXOffset;

              // recalc position for all stickies
              stickies.forEach(function (sticky) {
                  return sticky._recalcPosition();
              });
          }
      }

      checkScroll();
      window.addEventListener('scroll', checkScroll);

      // Watch for window resizes and device orientation changes and trigger refresh
      window.addEventListener('resize', Stickyfill.refreshAll);
      window.addEventListener('orientationchange', Stickyfill.refreshAll);

      //Fast dirty check for layout changes every 500ms
      var fastCheckTimer = void 0;

      function startFastCheckTimer() {
          fastCheckTimer = setInterval(function () {
              stickies.forEach(function (sticky) {
                  return sticky._fastCheck();
              });
          }, 500);
      }

      function stopFastCheckTimer() {
          clearInterval(fastCheckTimer);
      }

      var docHiddenKey = void 0;
      var visibilityChangeEventName = void 0;

      if ('hidden' in document) {
          docHiddenKey = 'hidden';
          visibilityChangeEventName = 'visibilitychange';
      } else if ('webkitHidden' in document) {
          docHiddenKey = 'webkitHidden';
          visibilityChangeEventName = 'webkitvisibilitychange';
      }

      if (visibilityChangeEventName) {
          if (!document[docHiddenKey]) startFastCheckTimer();

          document.addEventListener(visibilityChangeEventName, function () {
              if (document[docHiddenKey]) {
                  stopFastCheckTimer();
              } else {
                  startFastCheckTimer();
              }
          });
      } else startFastCheckTimer();
  }

  if (!seppuku) init();

  /*
   * 7. Expose Stickyfill
   */
  if (typeof module != 'undefined' && module.exports) {
      module.exports = Stickyfill;
  } else if (isWindowDefined) {
      window.Stickyfill = Stickyfill;
  }

})(window, document);
!function(root, factory) {
    "function" == typeof define && define.amd ? // AMD. Register as an anonymous module unless amdModuleId is set
    define([], function() {
        return root.svg4everybody = factory();
    }) : "object" == typeof module && module.exports ? // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory() : root.svg4everybody = factory();
}(this, function() {
    /*! svg4everybody v2.1.9 | github.com/jonathantneal/svg4everybody */
    function embed(parent, svg, target) {
        // if the target exists
        if (target) {
            // create a document fragment to hold the contents of the target
            var fragment = document.createDocumentFragment(), viewBox = !svg.hasAttribute("viewBox") && target.getAttribute("viewBox");
            // conditionally set the viewBox on the svg
            viewBox && svg.setAttribute("viewBox", viewBox);
            // copy the contents of the clone into the fragment
            for (// clone the target
            var clone = target.cloneNode(!0); clone.childNodes.length; ) {
                fragment.appendChild(clone.firstChild);
            }
            // append the fragment into the svg
            parent.appendChild(fragment);
        }
    }
    function loadreadystatechange(xhr) {
        // listen to changes in the request
        xhr.onreadystatechange = function() {
            // if the request is ready
            if (4 === xhr.readyState) {
                // get the cached html document
                var cachedDocument = xhr._cachedDocument;
                // ensure the cached html document based on the xhr response
                cachedDocument || (cachedDocument = xhr._cachedDocument = document.implementation.createHTMLDocument(""), 
                cachedDocument.body.innerHTML = xhr.responseText, xhr._cachedTarget = {}), // clear the xhr embeds list and embed each item
                xhr._embeds.splice(0).map(function(item) {
                    // get the cached target
                    var target = xhr._cachedTarget[item.id];
                    // ensure the cached target
                    target || (target = xhr._cachedTarget[item.id] = cachedDocument.getElementById(item.id)), 
                    // embed the target into the svg
                    embed(item.parent, item.svg, target);
                });
            }
        }, // test the ready state change immediately
        xhr.onreadystatechange();
    }
    function svg4everybody(rawopts) {
        function oninterval() {
            // while the index exists in the live <use> collection
            for (// get the cached <use> index
            var index = 0; index < uses.length; ) {
                // get the current <use>
                var use = uses[index], parent = use.parentNode, svg = getSVGAncestor(parent), src = use.getAttribute("xlink:href") || use.getAttribute("href");
                if (!src && opts.attributeName && (src = use.getAttribute(opts.attributeName)), 
                svg && src) {
                    if (polyfill) {
                        if (!opts.validate || opts.validate(src, svg, use)) {
                            // remove the <use> element
                            parent.removeChild(use);
                            // parse the src and get the url and id
                            var srcSplit = src.split("#"), url = srcSplit.shift(), id = srcSplit.join("#");
                            // if the link is external
                            if (url.length) {
                                // get the cached xhr request
                                var xhr = requests[url];
                                // ensure the xhr request exists
                                xhr || (xhr = requests[url] = new XMLHttpRequest(), xhr.open("GET", url), xhr.send(), 
                                xhr._embeds = []), // add the svg and id as an item to the xhr embeds list
                                xhr._embeds.push({
                                    parent: parent,
                                    svg: svg,
                                    id: id
                                }), // prepare the xhr ready state change event
                                loadreadystatechange(xhr);
                            } else {
                                // embed the local id into the svg
                                embed(parent, svg, document.getElementById(id));
                            }
                        } else {
                            // increase the index when the previous value was not "valid"
                            ++index, ++numberOfSvgUseElementsToBypass;
                        }
                    }
                } else {
                    // increase the index when the previous value was not "valid"
                    ++index;
                }
            }
            // continue the interval
            (!uses.length || uses.length - numberOfSvgUseElementsToBypass > 0) && requestAnimationFrame(oninterval, 67);
        }
        var polyfill, opts = Object(rawopts), newerIEUA = /\bTrident\/[567]\b|\bMSIE (?:9|10)\.0\b/, webkitUA = /\bAppleWebKit\/(\d+)\b/, olderEdgeUA = /\bEdge\/12\.(\d+)\b/, edgeUA = /\bEdge\/.(\d+)\b/, inIframe = window.top !== window.self;
        polyfill = "polyfill" in opts ? opts.polyfill : newerIEUA.test(navigator.userAgent) || (navigator.userAgent.match(olderEdgeUA) || [])[1] < 10547 || (navigator.userAgent.match(webkitUA) || [])[1] < 537 || edgeUA.test(navigator.userAgent) && inIframe;
        // create xhr requests object
        var requests = {}, requestAnimationFrame = window.requestAnimationFrame || setTimeout, uses = document.getElementsByTagName("use"), numberOfSvgUseElementsToBypass = 0;
        // conditionally start the interval if the polyfill is active
        polyfill && oninterval();
    }
    function getSVGAncestor(node) {
        for (var svg = node; "svg" !== svg.nodeName.toLowerCase() && (svg = svg.parentNode); ) {}
        return svg;
    }
    return svg4everybody;
});
  /**
   * Swiper 4.5.0
   * Most modern mobile touch slider and framework with hardware accelerated transitions
   * http://www.idangero.us/swiper/
   *
   * Copyright 2014-2019 Vladimir Kharlampidi
   *
   * Released under the MIT License
   *
   * Released on: February 22, 2019
   */

  (function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
      typeof define === 'function' && define.amd ? define(factory) :
        (global = global || self, global.Swiper = factory());
  }(this, function () {
    'use strict';

    /**
     * SSR Window 1.0.1
     * Better handling for window object in SSR environment
     * https://github.com/nolimits4web/ssr-window
     *
     * Copyright 2018, Vladimir Kharlampidi
     *
     * Licensed under MIT
     *
     * Released on: July 18, 2018
     */
    var doc = (typeof document === 'undefined') ? {
      body: {},
      addEventListener: function addEventListener() {
      },
      removeEventListener: function removeEventListener() {
      },
      activeElement: {
        blur: function blur() {
        },
        nodeName: '',
      },
      querySelector: function querySelector() {
        return null;
      },
      querySelectorAll: function querySelectorAll() {
        return [];
      },
      getElementById: function getElementById() {
        return null;
      },
      createEvent: function createEvent() {
        return {
          initEvent: function initEvent() {
          },
        };
      },
      createElement: function createElement() {
        return {
          children: [],
          childNodes: [],
          style: {},
          setAttribute: function setAttribute() {
          },
          getElementsByTagName: function getElementsByTagName() {
            return [];
          },
        };
      },
      location: {hash: ''},
    } : document; // eslint-disable-line

    var win = (typeof window === 'undefined') ? {
      document: doc,
      navigator: {
        userAgent: '',
      },
      location: {},
      history: {},
      CustomEvent: function CustomEvent() {
        return this;
      },
      addEventListener: function addEventListener() {
      },
      removeEventListener: function removeEventListener() {
      },
      getComputedStyle: function getComputedStyle() {
        return {
          getPropertyValue: function getPropertyValue() {
            return '';
          },
        };
      },
      Image: function Image() {
      },
      Date: function Date() {
      },
      screen: {},
      setTimeout: function setTimeout() {
      },
      clearTimeout: function clearTimeout() {
      },
    } : window; // eslint-disable-line

    /**
     * Dom7 2.1.3
     * Minimalistic JavaScript library for DOM manipulation, with a jQuery-compatible API
     * http://framework7.io/docs/dom.html
     *
     * Copyright 2019, Vladimir Kharlampidi
     * The iDangero.us
     * http://www.idangero.us/
     *
     * Licensed under MIT
     *
     * Released on: February 11, 2019
     */

    var Dom7 = function Dom7(arr) {
      var self = this;
      // Create array-like object
      for (var i = 0; i < arr.length; i += 1) {
        self[i] = arr[i];
      }
      self.length = arr.length;
      // Return collection with methods
      return this;
    };

    function $(selector, context) {
      var arr = [];
      var i = 0;
      if (selector && !context) {
        if (selector instanceof Dom7) {
          return selector;
        }
      }
      if (selector) {
        // String
        if (typeof selector === 'string') {
          var els;
          var tempParent;
          var html = selector.trim();
          if (html.indexOf('<') >= 0 && html.indexOf('>') >= 0) {
            var toCreate = 'div';
            if (html.indexOf('<li') === 0) {
              toCreate = 'ul';
            }
            if (html.indexOf('<tr') === 0) {
              toCreate = 'tbody';
            }
            if (html.indexOf('<td') === 0 || html.indexOf('<th') === 0) {
              toCreate = 'tr';
            }
            if (html.indexOf('<tbody') === 0) {
              toCreate = 'table';
            }
            if (html.indexOf('<option') === 0) {
              toCreate = 'select';
            }
            tempParent = doc.createElement(toCreate);
            tempParent.innerHTML = html;
            for (i = 0; i < tempParent.childNodes.length; i += 1) {
              arr.push(tempParent.childNodes[i]);
            }
          } else {
            if (!context && selector[0] === '#' && !selector.match(/[ .<>:~]/)) {
              // Pure ID selector
              els = [doc.getElementById(selector.trim().split('#')[1])];
            } else {
              // Other selectors
              els = (context || doc).querySelectorAll(selector.trim());
            }
            for (i = 0; i < els.length; i += 1) {
              if (els[i]) {
                arr.push(els[i]);
              }
            }
          }
        } else if (selector.nodeType || selector === win || selector === doc) {
          // Node/element
          arr.push(selector);
        } else if (selector.length > 0 && selector[0].nodeType) {
          // Array of elements or instance of Dom
          for (i = 0; i < selector.length; i += 1) {
            arr.push(selector[i]);
          }
        }
      }
      return new Dom7(arr);
    }

    $.fn = Dom7.prototype;
    $.Class = Dom7;
    $.Dom7 = Dom7;

    function unique(arr) {
      var uniqueArray = [];
      for (var i = 0; i < arr.length; i += 1) {
        if (uniqueArray.indexOf(arr[i]) === -1) {
          uniqueArray.push(arr[i]);
        }
      }
      return uniqueArray;
    }

    // Classes and attributes
    function addClass(className) {
      if (typeof className === 'undefined') {
        return this;
      }
      var classes = className.split(' ');
      for (var i = 0; i < classes.length; i += 1) {
        for (var j = 0; j < this.length; j += 1) {
          if (typeof this[j] !== 'undefined' && typeof this[j].classList !== 'undefined') {
            this[j].classList.add(classes[i]);
          }
        }
      }
      return this;
    }

    function removeClass(className) {
      var classes = className.split(' ');
      for (var i = 0; i < classes.length; i += 1) {
        for (var j = 0; j < this.length; j += 1) {
          if (typeof this[j] !== 'undefined' && typeof this[j].classList !== 'undefined') {
            this[j].classList.remove(classes[i]);
          }
        }
      }
      return this;
    }

    function hasClass(className) {
      if (!this[0]) {
        return false;
      }
      return this[0].classList.contains(className);
    }

    function toggleClass(className) {
      var classes = className.split(' ');
      for (var i = 0; i < classes.length; i += 1) {
        for (var j = 0; j < this.length; j += 1) {
          if (typeof this[j] !== 'undefined' && typeof this[j].classList !== 'undefined') {
            this[j].classList.toggle(classes[i]);
          }
        }
      }
      return this;
    }

    function attr(attrs, value) {
      var arguments$1 = arguments;

      if (arguments.length === 1 && typeof attrs === 'string') {
        // Get attr
        if (this[0]) {
          return this[0].getAttribute(attrs);
        }
        return undefined;
      }

      // Set attrs
      for (var i = 0; i < this.length; i += 1) {
        if (arguments$1.length === 2) {
          // String
          this[i].setAttribute(attrs, value);
        } else {
          // Object
          // eslint-disable-next-line
          for (var attrName in attrs) {
            this[i][attrName] = attrs[attrName];
            this[i].setAttribute(attrName, attrs[attrName]);
          }
        }
      }
      return this;
    }

    // eslint-disable-next-line
    function removeAttr(attr) {
      for (var i = 0; i < this.length; i += 1) {
        this[i].removeAttribute(attr);
      }
      return this;
    }

    function data(key, value) {
      var el;
      if (typeof value === 'undefined') {
        el = this[0];
        // Get value
        if (el) {
          if (el.dom7ElementDataStorage && (key in el.dom7ElementDataStorage)) {
            return el.dom7ElementDataStorage[key];
          }

          var dataKey = el.getAttribute(("data-" + key));
          if (dataKey) {
            return dataKey;
          }
          return undefined;
        }
        return undefined;
      }

      // Set value
      for (var i = 0; i < this.length; i += 1) {
        el = this[i];
        if (!el.dom7ElementDataStorage) {
          el.dom7ElementDataStorage = {};
        }
        el.dom7ElementDataStorage[key] = value;
      }
      return this;
    }

    // Transforms
    // eslint-disable-next-line
    function transform(transform) {
      for (var i = 0; i < this.length; i += 1) {
        var elStyle = this[i].style;
        elStyle.webkitTransform = transform;
        elStyle.transform = transform;
      }
      return this;
    }

    function transition(duration) {
      if (typeof duration !== 'string') {
        duration = duration + "ms"; // eslint-disable-line
      }
      for (var i = 0; i < this.length; i += 1) {
        var elStyle = this[i].style;
        elStyle.webkitTransitionDuration = duration;
        elStyle.transitionDuration = duration;
      }
      return this;
    }

    // Events
    function on() {
      var assign;

      var args = [], len = arguments.length;
      while (len--) args[len] = arguments[len];
      var eventType = args[0];
      var targetSelector = args[1];
      var listener = args[2];
      var capture = args[3];
      if (typeof args[1] === 'function') {
        (assign = args, eventType = assign[0], listener = assign[1], capture = assign[2]);
        targetSelector = undefined;
      }
      if (!capture) {
        capture = false;
      }

      function handleLiveEvent(e) {
        var target = e.target;
        if (!target) {
          return;
        }
        var eventData = e.target.dom7EventData || [];
        if (eventData.indexOf(e) < 0) {
          eventData.unshift(e);
        }
        if ($(target).is(targetSelector)) {
          listener.apply(target, eventData);
        } else {
          var parents = $(target).parents(); // eslint-disable-line
          for (var k = 0; k < parents.length; k += 1) {
            if ($(parents[k]).is(targetSelector)) {
              listener.apply(parents[k], eventData);
            }
          }
        }
      }

      function handleEvent(e) {
        var eventData = e && e.target ? e.target.dom7EventData || [] : [];
        if (eventData.indexOf(e) < 0) {
          eventData.unshift(e);
        }
        listener.apply(this, eventData);
      }

      var events = eventType.split(' ');
      var j;
      for (var i = 0; i < this.length; i += 1) {
        var el = this[i];
        if (!targetSelector) {
          for (j = 0; j < events.length; j += 1) {
            var event = events[j];
            if (!el.dom7Listeners) {
              el.dom7Listeners = {};
            }
            if (!el.dom7Listeners[event]) {
              el.dom7Listeners[event] = [];
            }
            el.dom7Listeners[event].push({
              listener: listener,
              proxyListener: handleEvent,
            });
            el.addEventListener(event, handleEvent, capture);
          }
        } else {
          // Live events
          for (j = 0; j < events.length; j += 1) {
            var event$1 = events[j];
            if (!el.dom7LiveListeners) {
              el.dom7LiveListeners = {};
            }
            if (!el.dom7LiveListeners[event$1]) {
              el.dom7LiveListeners[event$1] = [];
            }
            el.dom7LiveListeners[event$1].push({
              listener: listener,
              proxyListener: handleLiveEvent,
            });
            el.addEventListener(event$1, handleLiveEvent, capture);
          }
        }
      }
      return this;
    }

    function off() {
      var assign;

      var args = [], len = arguments.length;
      while (len--) args[len] = arguments[len];
      var eventType = args[0];
      var targetSelector = args[1];
      var listener = args[2];
      var capture = args[3];
      if (typeof args[1] === 'function') {
        (assign = args, eventType = assign[0], listener = assign[1], capture = assign[2]);
        targetSelector = undefined;
      }
      if (!capture) {
        capture = false;
      }

      var events = eventType.split(' ');
      for (var i = 0; i < events.length; i += 1) {
        var event = events[i];
        for (var j = 0; j < this.length; j += 1) {
          var el = this[j];
          var handlers = (void 0);
          if (!targetSelector && el.dom7Listeners) {
            handlers = el.dom7Listeners[event];
          } else if (targetSelector && el.dom7LiveListeners) {
            handlers = el.dom7LiveListeners[event];
          }
          if (handlers && handlers.length) {
            for (var k = handlers.length - 1; k >= 0; k -= 1) {
              var handler = handlers[k];
              if (listener && handler.listener === listener) {
                el.removeEventListener(event, handler.proxyListener, capture);
                handlers.splice(k, 1);
              } else if (listener && handler.listener && handler.listener.dom7proxy && handler.listener.dom7proxy === listener) {
                el.removeEventListener(event, handler.proxyListener, capture);
                handlers.splice(k, 1);
              } else if (!listener) {
                el.removeEventListener(event, handler.proxyListener, capture);
                handlers.splice(k, 1);
              }
            }
          }
        }
      }
      return this;
    }

    function trigger() {
      var args = [], len = arguments.length;
      while (len--) args[len] = arguments[len];

      var events = args[0].split(' ');
      var eventData = args[1];
      for (var i = 0; i < events.length; i += 1) {
        var event = events[i];
        for (var j = 0; j < this.length; j += 1) {
          var el = this[j];
          var evt = (void 0);
          try {
            evt = new win.CustomEvent(event, {
              detail: eventData,
              bubbles: true,
              cancelable: true,
            });
          } catch (e) {
            evt = doc.createEvent('Event');
            evt.initEvent(event, true, true);
            evt.detail = eventData;
          }
          // eslint-disable-next-line
          el.dom7EventData = args.filter(function (data, dataIndex) {
            return dataIndex > 0;
          });
          el.dispatchEvent(evt);
          el.dom7EventData = [];
          delete el.dom7EventData;
        }
      }
      return this;
    }

    function transitionEnd(callback) {
      var events = ['webkitTransitionEnd', 'transitionend'];
      var dom = this;
      var i;

      function fireCallBack(e) {
        /* jshint validthis:true */
        if (e.target !== this) {
          return;
        }
        callback.call(this, e);
        for (i = 0; i < events.length; i += 1) {
          dom.off(events[i], fireCallBack);
        }
      }

      if (callback) {
        for (i = 0; i < events.length; i += 1) {
          dom.on(events[i], fireCallBack);
        }
      }
      return this;
    }

    function outerWidth(includeMargins) {
      if (this.length > 0) {
        if (includeMargins) {
          // eslint-disable-next-line
          var styles = this.styles();
          return this[0].offsetWidth + parseFloat(styles.getPropertyValue('margin-right')) + parseFloat(styles.getPropertyValue('margin-left'));
        }
        return this[0].offsetWidth;
      }
      return null;
    }

    function outerHeight(includeMargins) {
      if (this.length > 0) {
        if (includeMargins) {
          // eslint-disable-next-line
          var styles = this.styles();
          return this[0].offsetHeight + parseFloat(styles.getPropertyValue('margin-top')) + parseFloat(styles.getPropertyValue('margin-bottom'));
        }
        return this[0].offsetHeight;
      }
      return null;
    }

    function offset() {
      if (this.length > 0) {
        var el = this[0];
        var box = el.getBoundingClientRect();
        var body = doc.body;
        var clientTop = el.clientTop || body.clientTop || 0;
        var clientLeft = el.clientLeft || body.clientLeft || 0;
        var scrollTop = el === win ? win.scrollY : el.scrollTop;
        var scrollLeft = el === win ? win.scrollX : el.scrollLeft;
        return {
          top: (box.top + scrollTop) - clientTop,
          left: (box.left + scrollLeft) - clientLeft,
        };
      }

      return null;
    }

    function styles() {
      if (this[0]) {
        return win.getComputedStyle(this[0], null);
      }
      return {};
    }

    function css(props, value) {
      var i;
      if (arguments.length === 1) {
        if (typeof props === 'string') {
          if (this[0]) {
            return win.getComputedStyle(this[0], null).getPropertyValue(props);
          }
        } else {
          for (i = 0; i < this.length; i += 1) {
            // eslint-disable-next-line
            for (var prop in props) {
              this[i].style[prop] = props[prop];
            }
          }
          return this;
        }
      }
      if (arguments.length === 2 && typeof props === 'string') {
        for (i = 0; i < this.length; i += 1) {
          this[i].style[props] = value;
        }
        return this;
      }
      return this;
    }

    // Iterate over the collection passing elements to `callback`
    function each(callback) {
      // Don't bother continuing without a callback
      if (!callback) {
        return this;
      }
      // Iterate over the current collection
      for (var i = 0; i < this.length; i += 1) {
        // If the callback returns false
        if (callback.call(this[i], i, this[i]) === false) {
          // End the loop early
          return this;
        }
      }
      // Return `this` to allow chained DOM operations
      return this;
    }

    // eslint-disable-next-line
    function html(html) {
      if (typeof html === 'undefined') {
        return this[0] ? this[0].innerHTML : undefined;
      }

      for (var i = 0; i < this.length; i += 1) {
        this[i].innerHTML = html;
      }
      return this;
    }

    // eslint-disable-next-line
    function text(text) {
      if (typeof text === 'undefined') {
        if (this[0]) {
          return this[0].textContent.trim();
        }
        return null;
      }

      for (var i = 0; i < this.length; i += 1) {
        this[i].textContent = text;
      }
      return this;
    }

    function is(selector) {
      var el = this[0];
      var compareWith;
      var i;
      if (!el || typeof selector === 'undefined') {
        return false;
      }
      if (typeof selector === 'string') {
        if (el.matches) {
          return el.matches(selector);
        } else if (el.webkitMatchesSelector) {
          return el.webkitMatchesSelector(selector);
        } else if (el.msMatchesSelector) {
          return el.msMatchesSelector(selector);
        }

        compareWith = $(selector);
        for (i = 0; i < compareWith.length; i += 1) {
          if (compareWith[i] === el) {
            return true;
          }
        }
        return false;
      } else if (selector === doc) {
        return el === doc;
      } else if (selector === win) {
        return el === win;
      }

      if (selector.nodeType || selector instanceof Dom7) {
        compareWith = selector.nodeType ? [selector] : selector;
        for (i = 0; i < compareWith.length; i += 1) {
          if (compareWith[i] === el) {
            return true;
          }
        }
        return false;
      }
      return false;
    }

    function index() {
      var child = this[0];
      var i;
      if (child) {
        i = 0;
        // eslint-disable-next-line
        while ((child = child.previousSibling) !== null) {
          if (child.nodeType === 1) {
            i += 1;
          }
        }
        return i;
      }
      return undefined;
    }

    // eslint-disable-next-line
    function eq(index) {
      if (typeof index === 'undefined') {
        return this;
      }
      var length = this.length;
      var returnIndex;
      if (index > length - 1) {
        return new Dom7([]);
      }
      if (index < 0) {
        returnIndex = length + index;
        if (returnIndex < 0) {
          return new Dom7([]);
        }
        return new Dom7([this[returnIndex]]);
      }
      return new Dom7([this[index]]);
    }

    function append() {
      var args = [], len = arguments.length;
      while (len--) args[len] = arguments[len];

      var newChild;

      for (var k = 0; k < args.length; k += 1) {
        newChild = args[k];
        for (var i = 0; i < this.length; i += 1) {
          if (typeof newChild === 'string') {
            var tempDiv = doc.createElement('div');
            tempDiv.innerHTML = newChild;
            while (tempDiv.firstChild) {
              this[i].appendChild(tempDiv.firstChild);
            }
          } else if (newChild instanceof Dom7) {
            for (var j = 0; j < newChild.length; j += 1) {
              this[i].appendChild(newChild[j]);
            }
          } else {
            this[i].appendChild(newChild);
          }
        }
      }

      return this;
    }

    function prepend(newChild) {
      var i;
      var j;
      for (i = 0; i < this.length; i += 1) {
        if (typeof newChild === 'string') {
          var tempDiv = doc.createElement('div');
          tempDiv.innerHTML = newChild;
          for (j = tempDiv.childNodes.length - 1; j >= 0; j -= 1) {
            this[i].insertBefore(tempDiv.childNodes[j], this[i].childNodes[0]);
          }
        } else if (newChild instanceof Dom7) {
          for (j = 0; j < newChild.length; j += 1) {
            this[i].insertBefore(newChild[j], this[i].childNodes[0]);
          }
        } else {
          this[i].insertBefore(newChild, this[i].childNodes[0]);
        }
      }
      return this;
    }

    function next(selector) {
      if (this.length > 0) {
        if (selector) {
          if (this[0].nextElementSibling && $(this[0].nextElementSibling).is(selector)) {
            return new Dom7([this[0].nextElementSibling]);
          }
          return new Dom7([]);
        }

        if (this[0].nextElementSibling) {
          return new Dom7([this[0].nextElementSibling]);
        }
        return new Dom7([]);
      }
      return new Dom7([]);
    }

    function nextAll(selector) {
      var nextEls = [];
      var el = this[0];
      if (!el) {
        return new Dom7([]);
      }
      while (el.nextElementSibling) {
        var next = el.nextElementSibling; // eslint-disable-line
        if (selector) {
          if ($(next).is(selector)) {
            nextEls.push(next);
          }
        } else {
          nextEls.push(next);
        }
        el = next;
      }
      return new Dom7(nextEls);
    }

    function prev(selector) {
      if (this.length > 0) {
        var el = this[0];
        if (selector) {
          if (el.previousElementSibling && $(el.previousElementSibling).is(selector)) {
            return new Dom7([el.previousElementSibling]);
          }
          return new Dom7([]);
        }

        if (el.previousElementSibling) {
          return new Dom7([el.previousElementSibling]);
        }
        return new Dom7([]);
      }
      return new Dom7([]);
    }

    function prevAll(selector) {
      var prevEls = [];
      var el = this[0];
      if (!el) {
        return new Dom7([]);
      }
      while (el.previousElementSibling) {
        var prev = el.previousElementSibling; // eslint-disable-line
        if (selector) {
          if ($(prev).is(selector)) {
            prevEls.push(prev);
          }
        } else {
          prevEls.push(prev);
        }
        el = prev;
      }
      return new Dom7(prevEls);
    }

    function parent(selector) {
      var parents = []; // eslint-disable-line
      for (var i = 0; i < this.length; i += 1) {
        if (this[i].parentNode !== null) {
          if (selector) {
            if ($(this[i].parentNode).is(selector)) {
              parents.push(this[i].parentNode);
            }
          } else {
            parents.push(this[i].parentNode);
          }
        }
      }
      return $(unique(parents));
    }

    function parents(selector) {
      var parents = []; // eslint-disable-line
      for (var i = 0; i < this.length; i += 1) {
        var parent = this[i].parentNode; // eslint-disable-line
        while (parent) {
          if (selector) {
            if ($(parent).is(selector)) {
              parents.push(parent);
            }
          } else {
            parents.push(parent);
          }
          parent = parent.parentNode;
        }
      }
      return $(unique(parents));
    }

    function closest(selector) {
      var closest = this; // eslint-disable-line
      if (typeof selector === 'undefined') {
        return new Dom7([]);
      }
      if (!closest.is(selector)) {
        closest = closest.parents(selector).eq(0);
      }
      return closest;
    }

    function find(selector) {
      var foundElements = [];
      for (var i = 0; i < this.length; i += 1) {
        var found = this[i].querySelectorAll(selector);
        for (var j = 0; j < found.length; j += 1) {
          foundElements.push(found[j]);
        }
      }
      return new Dom7(foundElements);
    }

    function children(selector) {
      var children = []; // eslint-disable-line
      for (var i = 0; i < this.length; i += 1) {
        var childNodes = this[i].childNodes;

        for (var j = 0; j < childNodes.length; j += 1) {
          if (!selector) {
            if (childNodes[j].nodeType === 1) {
              children.push(childNodes[j]);
            }
          } else if (childNodes[j].nodeType === 1 && $(childNodes[j]).is(selector)) {
            children.push(childNodes[j]);
          }
        }
      }
      return new Dom7(unique(children));
    }

    function remove() {
      for (var i = 0; i < this.length; i += 1) {
        if (this[i].parentNode) {
          this[i].parentNode.removeChild(this[i]);
        }
      }
      return this;
    }

    function add() {
      var args = [], len = arguments.length;
      while (len--) args[len] = arguments[len];

      var dom = this;
      var i;
      var j;
      for (i = 0; i < args.length; i += 1) {
        var toAdd = $(args[i]);
        for (j = 0; j < toAdd.length; j += 1) {
          dom[dom.length] = toAdd[j];
          dom.length += 1;
        }
      }
      return dom;
    }

    var Methods = {
      addClass: addClass,
      removeClass: removeClass,
      hasClass: hasClass,
      toggleClass: toggleClass,
      attr: attr,
      removeAttr: removeAttr,
      data: data,
      transform: transform,
      transition: transition,
      on: on,
      off: off,
      trigger: trigger,
      transitionEnd: transitionEnd,
      outerWidth: outerWidth,
      outerHeight: outerHeight,
      offset: offset,
      css: css,
      each: each,
      html: html,
      text: text,
      is: is,
      index: index,
      eq: eq,
      append: append,
      prepend: prepend,
      next: next,
      nextAll: nextAll,
      prev: prev,
      prevAll: prevAll,
      parent: parent,
      parents: parents,
      closest: closest,
      find: find,
      children: children,
      remove: remove,
      add: add,
      styles: styles,
    };

    Object.keys(Methods).forEach(function (methodName) {
      $.fn[methodName] = Methods[methodName];
    });

    var Utils = {
      deleteProps: function deleteProps(obj) {
        var object = obj;
        Object.keys(object).forEach(function (key) {
          try {
            object[key] = null;
          } catch (e) {
            // no getter for object
          }
          try {
            delete object[key];
          } catch (e) {
            // something got wrong
          }
        });
      },
      nextTick: function nextTick(callback, delay) {
        if (delay === void 0) delay = 0;

        return setTimeout(callback, delay);
      },
      now: function now() {
        return Date.now();
      },
      getTranslate: function getTranslate(el, axis) {
        if (axis === void 0) axis = 'x';

        var matrix;
        var curTransform;
        var transformMatrix;

        var curStyle = win.getComputedStyle(el, null);

        if (win.WebKitCSSMatrix) {
          curTransform = curStyle.transform || curStyle.webkitTransform;
          if (curTransform.split(',').length > 6) {
            curTransform = curTransform.split(', ').map(function (a) {
              return a.replace(',', '.');
            }).join(', ');
          }
          // Some old versions of Webkit choke when 'none' is passed; pass
          // empty string instead in this case
          transformMatrix = new win.WebKitCSSMatrix(curTransform === 'none' ? '' : curTransform);
        } else {
          transformMatrix = curStyle.MozTransform || curStyle.OTransform || curStyle.MsTransform || curStyle.msTransform || curStyle.transform || curStyle.getPropertyValue('transform').replace('translate(', 'matrix(1, 0, 0, 1,');
          matrix = transformMatrix.toString().split(',');
        }

        if (axis === 'x') {
          // Latest Chrome and webkits Fix
          if (win.WebKitCSSMatrix) {
            curTransform = transformMatrix.m41;
          }
          // Crazy IE10 Matrix
          else if (matrix.length === 16) {
            curTransform = parseFloat(matrix[12]);
          }
          // Normal Browsers
          else {
            curTransform = parseFloat(matrix[4]);
          }
        }
        if (axis === 'y') {
          // Latest Chrome and webkits Fix
          if (win.WebKitCSSMatrix) {
            curTransform = transformMatrix.m42;
          }
          // Crazy IE10 Matrix
          else if (matrix.length === 16) {
            curTransform = parseFloat(matrix[13]);
          }
          // Normal Browsers
          else {
            curTransform = parseFloat(matrix[5]);
          }
        }
        return curTransform || 0;
      },
      parseUrlQuery: function parseUrlQuery(url) {
        var query = {};
        var urlToParse = url || win.location.href;
        var i;
        var params;
        var param;
        var length;
        if (typeof urlToParse === 'string' && urlToParse.length) {
          urlToParse = urlToParse.indexOf('?') > -1 ? urlToParse.replace(/\S*\?/, '') : '';
          params = urlToParse.split('&').filter(function (paramsPart) {
            return paramsPart !== '';
          });
          length = params.length;

          for (i = 0; i < length; i += 1) {
            param = params[i].replace(/#\S+/g, '').split('=');
            query[decodeURIComponent(param[0])] = typeof param[1] === 'undefined' ? undefined : decodeURIComponent(param[1]) || '';
          }
        }
        return query;
      },
      isObject: function isObject(o) {
        return typeof o === 'object' && o !== null && o.constructor && o.constructor === Object;
      },
      extend: function extend() {
        var args = [], len$1 = arguments.length;
        while (len$1--) args[len$1] = arguments[len$1];

        var to = Object(args[0]);
        for (var i = 1; i < args.length; i += 1) {
          var nextSource = args[i];
          if (nextSource !== undefined && nextSource !== null) {
            var keysArray = Object.keys(Object(nextSource));
            for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex += 1) {
              var nextKey = keysArray[nextIndex];
              var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
              if (desc !== undefined && desc.enumerable) {
                if (Utils.isObject(to[nextKey]) && Utils.isObject(nextSource[nextKey])) {
                  Utils.extend(to[nextKey], nextSource[nextKey]);
                } else if (!Utils.isObject(to[nextKey]) && Utils.isObject(nextSource[nextKey])) {
                  to[nextKey] = {};
                  Utils.extend(to[nextKey], nextSource[nextKey]);
                } else {
                  to[nextKey] = nextSource[nextKey];
                }
              }
            }
          }
        }
        return to;
      },
    };

    var Support = (function Support() {
      var testDiv = doc.createElement('div');
      return {
        touch: (win.Modernizr && win.Modernizr.touch === true) || (function checkTouch() {
          return !!((win.navigator.maxTouchPoints > 0) || ('ontouchstart' in win) || (win.DocumentTouch && doc instanceof win.DocumentTouch));
        }()),

        pointerEvents: !!(win.navigator.pointerEnabled || win.PointerEvent || ('maxTouchPoints' in win.navigator && win.navigator.maxTouchPoints > 0)),
        prefixedPointerEvents: !!win.navigator.msPointerEnabled,

        transition: (function checkTransition() {
          var style = testDiv.style;
          return ('transition' in style || 'webkitTransition' in style || 'MozTransition' in style);
        }()),
        transforms3d: (win.Modernizr && win.Modernizr.csstransforms3d === true) || (function checkTransforms3d() {
          var style = testDiv.style;
          return ('webkitPerspective' in style || 'MozPerspective' in style || 'OPerspective' in style || 'MsPerspective' in style || 'perspective' in style);
        }()),

        flexbox: (function checkFlexbox() {
          var style = testDiv.style;
          var styles = ('alignItems webkitAlignItems webkitBoxAlign msFlexAlign mozBoxAlign webkitFlexDirection msFlexDirection mozBoxDirection mozBoxOrient webkitBoxDirection webkitBoxOrient').split(' ');
          for (var i = 0; i < styles.length; i += 1) {
            if (styles[i] in style) {
              return true;
            }
          }
          return false;
        }()),

        observer: (function checkObserver() {
          return ('MutationObserver' in win || 'WebkitMutationObserver' in win);
        }()),

        passiveListener: (function checkPassiveListener() {
          var supportsPassive = false;
          try {
            var opts = Object.defineProperty({}, 'passive', {
              // eslint-disable-next-line
              get: function get() {
                supportsPassive = true;
              },
            });
            win.addEventListener('testPassiveListener', null, opts);
          } catch (e) {
            // No support
          }
          return supportsPassive;
        }()),

        gestures: (function checkGestures() {
          return 'ongesturestart' in win;
        }()),
      };
    }());

    var Browser = (function Browser() {
      function isSafari() {
        var ua = win.navigator.userAgent.toLowerCase();
        return (ua.indexOf('safari') >= 0 && ua.indexOf('chrome') < 0 && ua.indexOf('android') < 0);
      }

      return {
        isIE: !!win.navigator.userAgent.match(/Trident/g) || !!win.navigator.userAgent.match(/MSIE/g),
        isEdge: !!win.navigator.userAgent.match(/Edge/g),
        isSafari: isSafari(),
        isUiWebView: /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(win.navigator.userAgent),
      };
    }());

    var SwiperClass = function SwiperClass(params) {
      if (params === void 0) params = {};

      var self = this;
      self.params = params;

      // Events
      self.eventsListeners = {};

      if (self.params && self.params.on) {
        Object.keys(self.params.on).forEach(function (eventName) {
          self.on(eventName, self.params.on[eventName]);
        });
      }
    };

    var staticAccessors = {components: {configurable: true}};

    SwiperClass.prototype.on = function on(events, handler, priority) {
      var self = this;
      if (typeof handler !== 'function') {
        return self;
      }
      var method = priority ? 'unshift' : 'push';
      events.split(' ').forEach(function (event) {
        if (!self.eventsListeners[event]) {
          self.eventsListeners[event] = [];
        }
        self.eventsListeners[event][method](handler);
      });
      return self;
    };

    SwiperClass.prototype.once = function once(events, handler, priority) {
      var self = this;
      if (typeof handler !== 'function') {
        return self;
      }

      function onceHandler() {
        var args = [], len = arguments.length;
        while (len--) args[len] = arguments[len];

        handler.apply(self, args);
        self.off(events, onceHandler);
        if (onceHandler.f7proxy) {
          delete onceHandler.f7proxy;
        }
      }

      onceHandler.f7proxy = handler;
      return self.on(events, onceHandler, priority);
    };

    SwiperClass.prototype.off = function off(events, handler) {
      var self = this;
      if (!self.eventsListeners) {
        return self;
      }
      events.split(' ').forEach(function (event) {
        if (typeof handler === 'undefined') {
          self.eventsListeners[event] = [];
        } else if (self.eventsListeners[event] && self.eventsListeners[event].length) {
          self.eventsListeners[event].forEach(function (eventHandler, index) {
            if (eventHandler === handler || (eventHandler.f7proxy && eventHandler.f7proxy === handler)) {
              self.eventsListeners[event].splice(index, 1);
            }
          });
        }
      });
      return self;
    };

    SwiperClass.prototype.emit = function emit() {
      var args = [], len = arguments.length;
      while (len--) args[len] = arguments[len];

      var self = this;
      if (!self.eventsListeners) {
        return self;
      }
      var events;
      var data;
      var context;
      if (typeof args[0] === 'string' || Array.isArray(args[0])) {
        events = args[0];
        data = args.slice(1, args.length);
        context = self;
      } else {
        events = args[0].events;
        data = args[0].data;
        context = args[0].context || self;
      }
      var eventsArray = Array.isArray(events) ? events : events.split(' ');
      eventsArray.forEach(function (event) {
        if (self.eventsListeners && self.eventsListeners[event]) {
          var handlers = [];
          self.eventsListeners[event].forEach(function (eventHandler) {
            handlers.push(eventHandler);
          });
          handlers.forEach(function (eventHandler) {
            eventHandler.apply(context, data);
          });
        }
      });
      return self;
    };

    SwiperClass.prototype.useModulesParams = function useModulesParams(instanceParams) {
      var instance = this;
      if (!instance.modules) {
        return;
      }
      Object.keys(instance.modules).forEach(function (moduleName) {
        var module = instance.modules[moduleName];
        // Extend params
        if (module.params) {
          Utils.extend(instanceParams, module.params);
        }
      });
    };

    SwiperClass.prototype.useModules = function useModules(modulesParams) {
      if (modulesParams === void 0) modulesParams = {};

      var instance = this;
      if (!instance.modules) {
        return;
      }
      Object.keys(instance.modules).forEach(function (moduleName) {
        var module = instance.modules[moduleName];
        var moduleParams = modulesParams[moduleName] || {};
        // Extend instance methods and props
        if (module.instance) {
          Object.keys(module.instance).forEach(function (modulePropName) {
            var moduleProp = module.instance[modulePropName];
            if (typeof moduleProp === 'function') {
              instance[modulePropName] = moduleProp.bind(instance);
            } else {
              instance[modulePropName] = moduleProp;
            }
          });
        }
        // Add event listeners
        if (module.on && instance.on) {
          Object.keys(module.on).forEach(function (moduleEventName) {
            instance.on(moduleEventName, module.on[moduleEventName]);
          });
        }

        // Module create callback
        if (module.create) {
          module.create.bind(instance)(moduleParams);
        }
      });
    };

    staticAccessors.components.set = function (components) {
      var Class = this;
      if (!Class.use) {
        return;
      }
      Class.use(components);
    };

    SwiperClass.installModule = function installModule(module) {
      var params = [], len = arguments.length - 1;
      while (len-- > 0) params[len] = arguments[len + 1];

      var Class = this;
      if (!Class.prototype.modules) {
        Class.prototype.modules = {};
      }
      var name = module.name || (((Object.keys(Class.prototype.modules).length) + "_" + (Utils.now())));
      Class.prototype.modules[name] = module;
      // Prototype
      if (module.proto) {
        Object.keys(module.proto).forEach(function (key) {
          Class.prototype[key] = module.proto[key];
        });
      }
      // Class
      if (module.static) {
        Object.keys(module.static).forEach(function (key) {
          Class[key] = module.static[key];
        });
      }
      // Callback
      if (module.install) {
        module.install.apply(Class, params);
      }
      return Class;
    };

    SwiperClass.use = function use(module) {
      var params = [], len = arguments.length - 1;
      while (len-- > 0) params[len] = arguments[len + 1];

      var Class = this;
      if (Array.isArray(module)) {
        module.forEach(function (m) {
          return Class.installModule(m);
        });
        return Class;
      }
      return Class.installModule.apply(Class, [module].concat(params));
    };

    Object.defineProperties(SwiperClass, staticAccessors);

    function updateSize() {
      var swiper = this;
      var width;
      var height;
      var $el = swiper.$el;
      if (typeof swiper.params.width !== 'undefined') {
        width = swiper.params.width;
      } else {
        width = $el[0].clientWidth;
      }
      if (typeof swiper.params.height !== 'undefined') {
        height = swiper.params.height;
      } else {
        height = $el[0].clientHeight;
      }
      if ((width === 0 && swiper.isHorizontal()) || (height === 0 && swiper.isVertical())) {
        return;
      }

      // Subtract paddings
      width = width - parseInt($el.css('padding-left'), 10) - parseInt($el.css('padding-right'), 10);
      height = height - parseInt($el.css('padding-top'), 10) - parseInt($el.css('padding-bottom'), 10);

      Utils.extend(swiper, {
        width: width,
        height: height,
        size: swiper.isHorizontal() ? width : height,
      });
    }

    function updateSlides() {
      var swiper = this;
      var params = swiper.params;

      var $wrapperEl = swiper.$wrapperEl;
      var swiperSize = swiper.size;
      var rtl = swiper.rtlTranslate;
      var wrongRTL = swiper.wrongRTL;
      var isVirtual = swiper.virtual && params.virtual.enabled;
      var previousSlidesLength = isVirtual ? swiper.virtual.slides.length : swiper.slides.length;
      var slides = $wrapperEl.children(("." + (swiper.params.slideClass)));
      var slidesLength = isVirtual ? swiper.virtual.slides.length : slides.length;
      var snapGrid = [];
      var slidesGrid = [];
      var slidesSizesGrid = [];

      var offsetBefore = params.slidesOffsetBefore;
      if (typeof offsetBefore === 'function') {
        offsetBefore = params.slidesOffsetBefore.call(swiper);
      }

      var offsetAfter = params.slidesOffsetAfter;
      if (typeof offsetAfter === 'function') {
        offsetAfter = params.slidesOffsetAfter.call(swiper);
      }

      var previousSnapGridLength = swiper.snapGrid.length;
      var previousSlidesGridLength = swiper.snapGrid.length;

      var spaceBetween = params.spaceBetween;
      var slidePosition = -offsetBefore;
      var prevSlideSize = 0;
      var index = 0;
      if (typeof swiperSize === 'undefined') {
        return;
      }
      if (typeof spaceBetween === 'string' && spaceBetween.indexOf('%') >= 0) {
        spaceBetween = (parseFloat(spaceBetween.replace('%', '')) / 100) * swiperSize;
      }

      swiper.virtualSize = -spaceBetween;

      // reset margins
      if (rtl) {
        slides.css({marginLeft: '', marginTop: ''});
      } else {
        slides.css({marginRight: '', marginBottom: ''});
      }

      var slidesNumberEvenToRows;
      if (params.slidesPerColumn > 1) {
        if (Math.floor(slidesLength / params.slidesPerColumn) === slidesLength / swiper.params.slidesPerColumn) {
          slidesNumberEvenToRows = slidesLength;
        } else {
          slidesNumberEvenToRows = Math.ceil(slidesLength / params.slidesPerColumn) * params.slidesPerColumn;
        }
        if (params.slidesPerView !== 'auto' && params.slidesPerColumnFill === 'row') {
          slidesNumberEvenToRows = Math.max(slidesNumberEvenToRows, params.slidesPerView * params.slidesPerColumn);
        }
      }

      // Calc slides
      var slideSize;
      var slidesPerColumn = params.slidesPerColumn;
      var slidesPerRow = slidesNumberEvenToRows / slidesPerColumn;
      var numFullColumns = Math.floor(slidesLength / params.slidesPerColumn);
      for (var i = 0; i < slidesLength; i += 1) {
        slideSize = 0;
        var slide = slides.eq(i);
        if (params.slidesPerColumn > 1) {
          // Set slides order
          var newSlideOrderIndex = (void 0);
          var column = (void 0);
          var row = (void 0);
          if (params.slidesPerColumnFill === 'column') {
            column = Math.floor(i / slidesPerColumn);
            row = i - (column * slidesPerColumn);
            if (column > numFullColumns || (column === numFullColumns && row === slidesPerColumn - 1)) {
              row += 1;
              if (row >= slidesPerColumn) {
                row = 0;
                column += 1;
              }
            }
            newSlideOrderIndex = column + ((row * slidesNumberEvenToRows) / slidesPerColumn);
            slide
              .css({
                '-webkit-box-ordinal-group': newSlideOrderIndex,
                '-moz-box-ordinal-group': newSlideOrderIndex,
                '-ms-flex-order': newSlideOrderIndex,
                '-webkit-order': newSlideOrderIndex,
                order: newSlideOrderIndex,
              });
          } else {
            row = Math.floor(i / slidesPerRow);
            column = i - (row * slidesPerRow);
          }
          slide
            .css(
              ("margin-" + (swiper.isHorizontal() ? 'top' : 'left')),
              (row !== 0 && params.spaceBetween) && (((params.spaceBetween) + "px"))
            )
            .attr('data-swiper-column', column)
            .attr('data-swiper-row', row);
        }
        if (slide.css('display') === 'none') {
          continue;
        } // eslint-disable-line

        if (params.slidesPerView === 'auto') {
          var slideStyles = win.getComputedStyle(slide[0], null);
          var currentTransform = slide[0].style.transform;
          var currentWebKitTransform = slide[0].style.webkitTransform;
          if (currentTransform) {
            slide[0].style.transform = 'none';
          }
          if (currentWebKitTransform) {
            slide[0].style.webkitTransform = 'none';
          }
          if (params.roundLengths) {
            slideSize = swiper.isHorizontal()
              ? slide.outerWidth(true)
              : slide.outerHeight(true);
          } else {
            // eslint-disable-next-line
            if (swiper.isHorizontal()) {
              var width = parseFloat(slideStyles.getPropertyValue('width'));
              var paddingLeft = parseFloat(slideStyles.getPropertyValue('padding-left'));
              var paddingRight = parseFloat(slideStyles.getPropertyValue('padding-right'));
              var marginLeft = parseFloat(slideStyles.getPropertyValue('margin-left'));
              var marginRight = parseFloat(slideStyles.getPropertyValue('margin-right'));
              var boxSizing = slideStyles.getPropertyValue('box-sizing');
              if (boxSizing && boxSizing === 'border-box') {
                slideSize = width + marginLeft + marginRight;
              } else {
                slideSize = width + paddingLeft + paddingRight + marginLeft + marginRight;
              }
            } else {
              var height = parseFloat(slideStyles.getPropertyValue('height'));
              var paddingTop = parseFloat(slideStyles.getPropertyValue('padding-top'));
              var paddingBottom = parseFloat(slideStyles.getPropertyValue('padding-bottom'));
              var marginTop = parseFloat(slideStyles.getPropertyValue('margin-top'));
              var marginBottom = parseFloat(slideStyles.getPropertyValue('margin-bottom'));
              var boxSizing$1 = slideStyles.getPropertyValue('box-sizing');
              if (boxSizing$1 && boxSizing$1 === 'border-box') {
                slideSize = height + marginTop + marginBottom;
              } else {
                slideSize = height + paddingTop + paddingBottom + marginTop + marginBottom;
              }
            }
          }
          if (currentTransform) {
            slide[0].style.transform = currentTransform;
          }
          if (currentWebKitTransform) {
            slide[0].style.webkitTransform = currentWebKitTransform;
          }
          if (params.roundLengths) {
            slideSize = Math.floor(slideSize);
          }
        } else {
          slideSize = (swiperSize - ((params.slidesPerView - 1) * spaceBetween)) / params.slidesPerView;
          if (params.roundLengths) {
            slideSize = Math.floor(slideSize);
          }

          if (slides[i]) {
            if (swiper.isHorizontal()) {
              slides[i].style.width = slideSize + "px";
            } else {
              slides[i].style.height = slideSize + "px";
            }
          }
        }
        if (slides[i]) {
          slides[i].swiperSlideSize = slideSize;
        }
        slidesSizesGrid.push(slideSize);


        if (params.centeredSlides) {
          slidePosition = slidePosition + (slideSize / 2) + (prevSlideSize / 2) + spaceBetween;
          if (prevSlideSize === 0 && i !== 0) {
            slidePosition = slidePosition - (swiperSize / 2) - spaceBetween;
          }
          if (i === 0) {
            slidePosition = slidePosition - (swiperSize / 2) - spaceBetween;
          }
          if (Math.abs(slidePosition) < 1 / 1000) {
            slidePosition = 0;
          }
          if (params.roundLengths) {
            slidePosition = Math.floor(slidePosition);
          }
          if ((index) % params.slidesPerGroup === 0) {
            snapGrid.push(slidePosition);
          }
          slidesGrid.push(slidePosition);
        } else {
          if (params.roundLengths) {
            slidePosition = Math.floor(slidePosition);
          }
          if ((index) % params.slidesPerGroup === 0) {
            snapGrid.push(slidePosition);
          }
          slidesGrid.push(slidePosition);
          slidePosition = slidePosition + slideSize + spaceBetween;
        }

        swiper.virtualSize += slideSize + spaceBetween;

        prevSlideSize = slideSize;

        index += 1;
      }
      swiper.virtualSize = Math.max(swiper.virtualSize, swiperSize) + offsetAfter;
      var newSlidesGrid;

      if (
        rtl && wrongRTL && (params.effect === 'slide' || params.effect === 'coverflow')) {
        $wrapperEl.css({width: ((swiper.virtualSize + params.spaceBetween) + "px")});
      }
      if (!Support.flexbox || params.setWrapperSize) {
        if (swiper.isHorizontal()) {
          $wrapperEl.css({width: ((swiper.virtualSize + params.spaceBetween) + "px")});
        } else {
          $wrapperEl.css({height: ((swiper.virtualSize + params.spaceBetween) + "px")});
        }
      }

      if (params.slidesPerColumn > 1) {
        swiper.virtualSize = (slideSize + params.spaceBetween) * slidesNumberEvenToRows;
        swiper.virtualSize = Math.ceil(swiper.virtualSize / params.slidesPerColumn) - params.spaceBetween;
        if (swiper.isHorizontal()) {
          $wrapperEl.css({width: ((swiper.virtualSize + params.spaceBetween) + "px")});
        } else {
          $wrapperEl.css({height: ((swiper.virtualSize + params.spaceBetween) + "px")});
        }
        if (params.centeredSlides) {
          newSlidesGrid = [];
          for (var i$1 = 0; i$1 < snapGrid.length; i$1 += 1) {
            var slidesGridItem = snapGrid[i$1];
            if (params.roundLengths) {
              slidesGridItem = Math.floor(slidesGridItem);
            }
            if (snapGrid[i$1] < swiper.virtualSize + snapGrid[0]) {
              newSlidesGrid.push(slidesGridItem);
            }
          }
          snapGrid = newSlidesGrid;
        }
      }

      // Remove last grid elements depending on width
      if (!params.centeredSlides) {
        newSlidesGrid = [];
        for (var i$2 = 0; i$2 < snapGrid.length; i$2 += 1) {
          var slidesGridItem$1 = snapGrid[i$2];
          if (params.roundLengths) {
            slidesGridItem$1 = Math.floor(slidesGridItem$1);
          }
          if (snapGrid[i$2] <= swiper.virtualSize - swiperSize) {
            newSlidesGrid.push(slidesGridItem$1);
          }
        }
        snapGrid = newSlidesGrid;
        if (Math.floor(swiper.virtualSize - swiperSize) - Math.floor(snapGrid[snapGrid.length - 1]) > 1) {
          snapGrid.push(swiper.virtualSize - swiperSize);
        }
      }
      if (snapGrid.length === 0) {
        snapGrid = [0];
      }

      if (params.spaceBetween !== 0) {
        if (swiper.isHorizontal()) {
          if (rtl) {
            slides.css({marginLeft: (spaceBetween + "px")});
          } else {
            slides.css({marginRight: (spaceBetween + "px")});
          }
        } else {
          slides.css({marginBottom: (spaceBetween + "px")});
        }
      }

      if (params.centerInsufficientSlides) {
        var allSlidesSize = 0;
        slidesSizesGrid.forEach(function (slideSizeValue) {
          allSlidesSize += slideSizeValue + (params.spaceBetween ? params.spaceBetween : 0);
        });
        allSlidesSize -= params.spaceBetween;
        if (allSlidesSize < swiperSize) {
          var allSlidesOffset = (swiperSize - allSlidesSize) / 2;
          snapGrid.forEach(function (snap, snapIndex) {
            snapGrid[snapIndex] = snap - allSlidesOffset;
          });
          slidesGrid.forEach(function (snap, snapIndex) {
            slidesGrid[snapIndex] = snap + allSlidesOffset;
          });
        }
      }

      Utils.extend(swiper, {
        slides: slides,
        snapGrid: snapGrid,
        slidesGrid: slidesGrid,
        slidesSizesGrid: slidesSizesGrid,
      });

      if (slidesLength !== previousSlidesLength) {
        swiper.emit('slidesLengthChange');
      }
      if (snapGrid.length !== previousSnapGridLength) {
        if (swiper.params.watchOverflow) {
          swiper.checkOverflow();
        }
        swiper.emit('snapGridLengthChange');
      }
      if (slidesGrid.length !== previousSlidesGridLength) {
        swiper.emit('slidesGridLengthChange');
      }

      if (params.watchSlidesProgress || params.watchSlidesVisibility) {
        swiper.updateSlidesOffset();
      }
    }

    function updateAutoHeight(speed) {
      var swiper = this;
      var activeSlides = [];
      var newHeight = 0;
      var i;
      if (typeof speed === 'number') {
        swiper.setTransition(speed);
      } else if (speed === true) {
        swiper.setTransition(swiper.params.speed);
      }
      // Find slides currently in view
      if (swiper.params.slidesPerView !== 'auto' && swiper.params.slidesPerView > 1) {
        for (i = 0; i < Math.ceil(swiper.params.slidesPerView); i += 1) {
          var index = swiper.activeIndex + i;
          if (index > swiper.slides.length) {
            break;
          }
          activeSlides.push(swiper.slides.eq(index)[0]);
        }
      } else {
        activeSlides.push(swiper.slides.eq(swiper.activeIndex)[0]);
      }

      // Find new height from highest slide in view
      for (i = 0; i < activeSlides.length; i += 1) {
        if (typeof activeSlides[i] !== 'undefined') {
          var height = activeSlides[i].offsetHeight;
          newHeight = height > newHeight ? height : newHeight;
        }
      }

      // Update Height
      if (newHeight) {
        swiper.$wrapperEl.css('height', (newHeight + "px"));
      }
    }

    function updateSlidesOffset() {
      var swiper = this;
      var slides = swiper.slides;
      for (var i = 0; i < slides.length; i += 1) {
        slides[i].swiperSlideOffset = swiper.isHorizontal() ? slides[i].offsetLeft : slides[i].offsetTop;
      }
    }

    function updateSlidesProgress(translate) {
      if (translate === void 0) translate = (this && this.translate) || 0;

      var swiper = this;
      var params = swiper.params;

      var slides = swiper.slides;
      var rtl = swiper.rtlTranslate;

      if (slides.length === 0) {
        return;
      }
      if (typeof slides[0].swiperSlideOffset === 'undefined') {
        swiper.updateSlidesOffset();
      }

      var offsetCenter = -translate;
      if (rtl) {
        offsetCenter = translate;
      }

      // Visible Slides
      slides.removeClass(params.slideVisibleClass);

      swiper.visibleSlidesIndexes = [];
      swiper.visibleSlides = [];

      for (var i = 0; i < slides.length; i += 1) {
        var slide = slides[i];
        var slideProgress = (
          (offsetCenter + (params.centeredSlides ? swiper.minTranslate() : 0)) - slide.swiperSlideOffset
        ) / (slide.swiperSlideSize + params.spaceBetween);
        if (params.watchSlidesVisibility) {
          var slideBefore = -(offsetCenter - slide.swiperSlideOffset);
          var slideAfter = slideBefore + swiper.slidesSizesGrid[i];
          var isVisible = (slideBefore >= 0 && slideBefore < swiper.size)
            || (slideAfter > 0 && slideAfter <= swiper.size)
            || (slideBefore <= 0 && slideAfter >= swiper.size);
          if (isVisible) {
            swiper.visibleSlides.push(slide);
            swiper.visibleSlidesIndexes.push(i);
            slides.eq(i).addClass(params.slideVisibleClass);
          }
        }
        slide.progress = rtl ? -slideProgress : slideProgress;
      }
      swiper.visibleSlides = $(swiper.visibleSlides);
    }

    function updateProgress(translate) {
      if (translate === void 0) translate = (this && this.translate) || 0;

      var swiper = this;
      var params = swiper.params;

      var translatesDiff = swiper.maxTranslate() - swiper.minTranslate();
      var progress = swiper.progress;
      var isBeginning = swiper.isBeginning;
      var isEnd = swiper.isEnd;
      var wasBeginning = isBeginning;
      var wasEnd = isEnd;
      if (translatesDiff === 0) {
        progress = 0;
        isBeginning = true;
        isEnd = true;
      } else {
        progress = (translate - swiper.minTranslate()) / (translatesDiff);
        isBeginning = progress <= 0;
        isEnd = progress >= 1;
      }
      Utils.extend(swiper, {
        progress: progress,
        isBeginning: isBeginning,
        isEnd: isEnd,
      });

      if (params.watchSlidesProgress || params.watchSlidesVisibility) {
        swiper.updateSlidesProgress(translate);
      }

      if (isBeginning && !wasBeginning) {
        swiper.emit('reachBeginning toEdge');
      }
      if (isEnd && !wasEnd) {
        swiper.emit('reachEnd toEdge');
      }
      if ((wasBeginning && !isBeginning) || (wasEnd && !isEnd)) {
        swiper.emit('fromEdge');
      }

      swiper.emit('progress', progress);
    }

    function updateSlidesClasses() {
      var swiper = this;

      var slides = swiper.slides;
      var params = swiper.params;
      var $wrapperEl = swiper.$wrapperEl;
      var activeIndex = swiper.activeIndex;
      var realIndex = swiper.realIndex;
      var isVirtual = swiper.virtual && params.virtual.enabled;

      slides.removeClass(((params.slideActiveClass) + " " + (params.slideNextClass) + " " + (params.slidePrevClass) + " " + (params.slideDuplicateActiveClass) + " " + (params.slideDuplicateNextClass) + " " + (params.slideDuplicatePrevClass)));

      var activeSlide;
      if (isVirtual) {
        activeSlide = swiper.$wrapperEl.find(("." + (params.slideClass) + "[data-swiper-slide-index=\"" + activeIndex + "\"]"));
      } else {
        activeSlide = slides.eq(activeIndex);
      }

      // Active classes
      activeSlide.addClass(params.slideActiveClass);

      if (params.loop) {
        // Duplicate to all looped slides
        if (activeSlide.hasClass(params.slideDuplicateClass)) {
          $wrapperEl
            .children(("." + (params.slideClass) + ":not(." + (params.slideDuplicateClass) + ")[data-swiper-slide-index=\"" + realIndex + "\"]"))
            .addClass(params.slideDuplicateActiveClass);
        } else {
          $wrapperEl
            .children(("." + (params.slideClass) + "." + (params.slideDuplicateClass) + "[data-swiper-slide-index=\"" + realIndex + "\"]"))
            .addClass(params.slideDuplicateActiveClass);
        }
      }
      // Next Slide
      var nextSlide = activeSlide.nextAll(("." + (params.slideClass))).eq(0).addClass(params.slideNextClass);
      if (params.loop && nextSlide.length === 0) {
        nextSlide = slides.eq(0);
        nextSlide.addClass(params.slideNextClass);
      }
      // Prev Slide
      var prevSlide = activeSlide.prevAll(("." + (params.slideClass))).eq(0).addClass(params.slidePrevClass);
      if (params.loop && prevSlide.length === 0) {
        prevSlide = slides.eq(-1);
        prevSlide.addClass(params.slidePrevClass);
      }
      if (params.loop) {
        // Duplicate to all looped slides
        if (nextSlide.hasClass(params.slideDuplicateClass)) {
          $wrapperEl
            .children(("." + (params.slideClass) + ":not(." + (params.slideDuplicateClass) + ")[data-swiper-slide-index=\"" + (nextSlide.attr('data-swiper-slide-index')) + "\"]"))
            .addClass(params.slideDuplicateNextClass);
        } else {
          $wrapperEl
            .children(("." + (params.slideClass) + "." + (params.slideDuplicateClass) + "[data-swiper-slide-index=\"" + (nextSlide.attr('data-swiper-slide-index')) + "\"]"))
            .addClass(params.slideDuplicateNextClass);
        }
        if (prevSlide.hasClass(params.slideDuplicateClass)) {
          $wrapperEl
            .children(("." + (params.slideClass) + ":not(." + (params.slideDuplicateClass) + ")[data-swiper-slide-index=\"" + (prevSlide.attr('data-swiper-slide-index')) + "\"]"))
            .addClass(params.slideDuplicatePrevClass);
        } else {
          $wrapperEl
            .children(("." + (params.slideClass) + "." + (params.slideDuplicateClass) + "[data-swiper-slide-index=\"" + (prevSlide.attr('data-swiper-slide-index')) + "\"]"))
            .addClass(params.slideDuplicatePrevClass);
        }
      }
    }

    function updateActiveIndex(newActiveIndex) {
      var swiper = this;
      var translate = swiper.rtlTranslate ? swiper.translate : -swiper.translate;
      var slidesGrid = swiper.slidesGrid;
      var snapGrid = swiper.snapGrid;
      var params = swiper.params;
      var previousIndex = swiper.activeIndex;
      var previousRealIndex = swiper.realIndex;
      var previousSnapIndex = swiper.snapIndex;
      var activeIndex = newActiveIndex;
      var snapIndex;
      if (typeof activeIndex === 'undefined') {
        for (var i = 0; i < slidesGrid.length; i += 1) {
          if (typeof slidesGrid[i + 1] !== 'undefined') {
            if (translate >= slidesGrid[i] && translate < slidesGrid[i + 1] - ((slidesGrid[i + 1] - slidesGrid[i]) / 2)) {
              activeIndex = i;
            } else if (translate >= slidesGrid[i] && translate < slidesGrid[i + 1]) {
              activeIndex = i + 1;
            }
          } else if (translate >= slidesGrid[i]) {
            activeIndex = i;
          }
        }
        // Normalize slideIndex
        if (params.normalizeSlideIndex) {
          if (activeIndex < 0 || typeof activeIndex === 'undefined') {
            activeIndex = 0;
          }
        }
      }
      if (snapGrid.indexOf(translate) >= 0) {
        snapIndex = snapGrid.indexOf(translate);
      } else {
        snapIndex = Math.floor(activeIndex / params.slidesPerGroup);
      }
      if (snapIndex >= snapGrid.length) {
        snapIndex = snapGrid.length - 1;
      }
      if (activeIndex === previousIndex) {
        if (snapIndex !== previousSnapIndex) {
          swiper.snapIndex = snapIndex;
          swiper.emit('snapIndexChange');
        }
        return;
      }

      // Get real index
      var realIndex = parseInt(swiper.slides.eq(activeIndex).attr('data-swiper-slide-index') || activeIndex, 10);

      Utils.extend(swiper, {
        snapIndex: snapIndex,
        realIndex: realIndex,
        previousIndex: previousIndex,
        activeIndex: activeIndex,
      });
      swiper.emit('activeIndexChange');
      swiper.emit('snapIndexChange');
      if (previousRealIndex !== realIndex) {
        swiper.emit('realIndexChange');
      }
      swiper.emit('slideChange');
    }

    function updateClickedSlide(e) {
      var swiper = this;
      var params = swiper.params;
      var slide = $(e.target).closest(("." + (params.slideClass)))[0];
      var slideFound = false;
      if (slide) {
        for (var i = 0; i < swiper.slides.length; i += 1) {
          if (swiper.slides[i] === slide) {
            slideFound = true;
          }
        }
      }

      if (slide && slideFound) {
        swiper.clickedSlide = slide;
        if (swiper.virtual && swiper.params.virtual.enabled) {
          swiper.clickedIndex = parseInt($(slide).attr('data-swiper-slide-index'), 10);
        } else {
          swiper.clickedIndex = $(slide).index();
        }
      } else {
        swiper.clickedSlide = undefined;
        swiper.clickedIndex = undefined;
        return;
      }
      if (params.slideToClickedSlide && swiper.clickedIndex !== undefined && swiper.clickedIndex !== swiper.activeIndex) {
        swiper.slideToClickedSlide();
      }
    }

    var update = {
      updateSize: updateSize,
      updateSlides: updateSlides,
      updateAutoHeight: updateAutoHeight,
      updateSlidesOffset: updateSlidesOffset,
      updateSlidesProgress: updateSlidesProgress,
      updateProgress: updateProgress,
      updateSlidesClasses: updateSlidesClasses,
      updateActiveIndex: updateActiveIndex,
      updateClickedSlide: updateClickedSlide,
    };

    function getTranslate(axis) {
      if (axis === void 0) axis = this.isHorizontal() ? 'x' : 'y';

      var swiper = this;

      var params = swiper.params;
      var rtl = swiper.rtlTranslate;
      var translate = swiper.translate;
      var $wrapperEl = swiper.$wrapperEl;

      if (params.virtualTranslate) {
        return rtl ? -translate : translate;
      }

      var currentTranslate = Utils.getTranslate($wrapperEl[0], axis);
      if (rtl) {
        currentTranslate = -currentTranslate;
      }

      return currentTranslate || 0;
    }

    function setTranslate(translate, byController) {
      var swiper = this;
      var rtl = swiper.rtlTranslate;
      var params = swiper.params;
      var $wrapperEl = swiper.$wrapperEl;
      var progress = swiper.progress;
      var x = 0;
      var y = 0;
      var z = 0;

      if (swiper.isHorizontal()) {
        x = rtl ? -translate : translate;
      } else {
        y = translate;
      }

      if (params.roundLengths) {
        x = Math.floor(x);
        y = Math.floor(y);
      }

      if (!params.virtualTranslate) {
        if (Support.transforms3d) {
          $wrapperEl.transform(("translate3d(" + x + "px, " + y + "px, " + z + "px)"));
        } else {
          $wrapperEl.transform(("translate(" + x + "px, " + y + "px)"));
        }
      }
      swiper.previousTranslate = swiper.translate;
      swiper.translate = swiper.isHorizontal() ? x : y;

      // Check if we need to update progress
      var newProgress;
      var translatesDiff = swiper.maxTranslate() - swiper.minTranslate();
      if (translatesDiff === 0) {
        newProgress = 0;
      } else {
        newProgress = (translate - swiper.minTranslate()) / (translatesDiff);
      }
      if (newProgress !== progress) {
        swiper.updateProgress(translate);
      }

      swiper.emit('setTranslate', swiper.translate, byController);
    }

    function minTranslate() {
      return (-this.snapGrid[0]);
    }

    function maxTranslate() {
      return (-this.snapGrid[this.snapGrid.length - 1]);
    }

    var translate = {
      getTranslate: getTranslate,
      setTranslate: setTranslate,
      minTranslate: minTranslate,
      maxTranslate: maxTranslate,
    };

    function setTransition(duration, byController) {
      var swiper = this;

      swiper.$wrapperEl.transition(duration);

      swiper.emit('setTransition', duration, byController);
    }

    function transitionStart(runCallbacks, direction) {
      if (runCallbacks === void 0) runCallbacks = true;

      var swiper = this;
      var activeIndex = swiper.activeIndex;
      var params = swiper.params;
      var previousIndex = swiper.previousIndex;
      if (params.autoHeight) {
        swiper.updateAutoHeight();
      }

      var dir = direction;
      if (!dir) {
        if (activeIndex > previousIndex) {
          dir = 'next';
        } else if (activeIndex < previousIndex) {
          dir = 'prev';
        } else {
          dir = 'reset';
        }
      }

      swiper.emit('transitionStart');

      if (runCallbacks && activeIndex !== previousIndex) {
        if (dir === 'reset') {
          swiper.emit('slideResetTransitionStart');
          return;
        }
        swiper.emit('slideChangeTransitionStart');
        if (dir === 'next') {
          swiper.emit('slideNextTransitionStart');
        } else {
          swiper.emit('slidePrevTransitionStart');
        }
      }
    }

    function transitionEnd$1(runCallbacks, direction) {
      if (runCallbacks === void 0) runCallbacks = true;

      var swiper = this;
      var activeIndex = swiper.activeIndex;
      var previousIndex = swiper.previousIndex;
      swiper.animating = false;
      swiper.setTransition(0);

      var dir = direction;
      if (!dir) {
        if (activeIndex > previousIndex) {
          dir = 'next';
        } else if (activeIndex < previousIndex) {
          dir = 'prev';
        } else {
          dir = 'reset';
        }
      }

      swiper.emit('transitionEnd');

      if (runCallbacks && activeIndex !== previousIndex) {
        if (dir === 'reset') {
          swiper.emit('slideResetTransitionEnd');
          return;
        }
        swiper.emit('slideChangeTransitionEnd');
        if (dir === 'next') {
          swiper.emit('slideNextTransitionEnd');
        } else {
          swiper.emit('slidePrevTransitionEnd');
        }
      }
    }

    var transition$1 = {
      setTransition: setTransition,
      transitionStart: transitionStart,
      transitionEnd: transitionEnd$1,
    };

    function slideTo(index, speed, runCallbacks, internal) {
      if (index === void 0) index = 0;
      if (speed === void 0) speed = this.params.speed;
      if (runCallbacks === void 0) runCallbacks = true;

      var swiper = this;
      var slideIndex = index;
      if (slideIndex < 0) {
        slideIndex = 0;
      }

      var params = swiper.params;
      var snapGrid = swiper.snapGrid;
      var slidesGrid = swiper.slidesGrid;
      var previousIndex = swiper.previousIndex;
      var activeIndex = swiper.activeIndex;
      var rtl = swiper.rtlTranslate;
      if (swiper.animating && params.preventInteractionOnTransition) {
        return false;
      }

      var snapIndex = Math.floor(slideIndex / params.slidesPerGroup);
      if (snapIndex >= snapGrid.length) {
        snapIndex = snapGrid.length - 1;
      }

      if ((activeIndex || params.initialSlide || 0) === (previousIndex || 0) && runCallbacks) {
        swiper.emit('beforeSlideChangeStart');
      }

      var translate = -snapGrid[snapIndex];

      // Update progress
      swiper.updateProgress(translate);

      // Normalize slideIndex
      if (params.normalizeSlideIndex) {
        for (var i = 0; i < slidesGrid.length; i += 1) {
          if (-Math.floor(translate * 100) >= Math.floor(slidesGrid[i] * 100)) {
            slideIndex = i;
          }
        }
      }
      // Directions locks
      if (swiper.initialized && slideIndex !== activeIndex) {
        if (!swiper.allowSlideNext && translate < swiper.translate && translate < swiper.minTranslate()) {
          return false;
        }
        if (!swiper.allowSlidePrev && translate > swiper.translate && translate > swiper.maxTranslate()) {
          if ((activeIndex || 0) !== slideIndex) {
            return false;
          }
        }
      }

      var direction;
      if (slideIndex > activeIndex) {
        direction = 'next';
      } else if (slideIndex < activeIndex) {
        direction = 'prev';
      } else {
        direction = 'reset';
      }


      // Update Index
      if ((rtl && -translate === swiper.translate) || (!rtl && translate === swiper.translate)) {
        swiper.updateActiveIndex(slideIndex);
        // Update Height
        if (params.autoHeight) {
          swiper.updateAutoHeight();
        }
        swiper.updateSlidesClasses();
        if (params.effect !== 'slide') {
          swiper.setTranslate(translate);
        }
        if (direction !== 'reset') {
          swiper.transitionStart(runCallbacks, direction);
          swiper.transitionEnd(runCallbacks, direction);
        }
        return false;
      }

      if (speed === 0 || !Support.transition) {
        swiper.setTransition(0);
        swiper.setTranslate(translate);
        swiper.updateActiveIndex(slideIndex);
        swiper.updateSlidesClasses();
        swiper.emit('beforeTransitionStart', speed, internal);
        swiper.transitionStart(runCallbacks, direction);
        swiper.transitionEnd(runCallbacks, direction);
      } else {
        swiper.setTransition(speed);
        swiper.setTranslate(translate);
        swiper.updateActiveIndex(slideIndex);
        swiper.updateSlidesClasses();
        swiper.emit('beforeTransitionStart', speed, internal);
        swiper.transitionStart(runCallbacks, direction);
        if (!swiper.animating) {
          swiper.animating = true;
          if (!swiper.onSlideToWrapperTransitionEnd) {
            swiper.onSlideToWrapperTransitionEnd = function transitionEnd(e) {
              if (!swiper || swiper.destroyed) {
                return;
              }
              if (e.target !== this) {
                return;
              }
              swiper.$wrapperEl[0].removeEventListener('transitionend', swiper.onSlideToWrapperTransitionEnd);
              swiper.$wrapperEl[0].removeEventListener('webkitTransitionEnd', swiper.onSlideToWrapperTransitionEnd);
              swiper.onSlideToWrapperTransitionEnd = null;
              delete swiper.onSlideToWrapperTransitionEnd;
              swiper.transitionEnd(runCallbacks, direction);
            };
          }
          swiper.$wrapperEl[0].addEventListener('transitionend', swiper.onSlideToWrapperTransitionEnd);
          swiper.$wrapperEl[0].addEventListener('webkitTransitionEnd', swiper.onSlideToWrapperTransitionEnd);
        }
      }

      return true;
    }

    function slideToLoop(index, speed, runCallbacks, internal) {
      if (index === void 0) index = 0;
      if (speed === void 0) speed = this.params.speed;
      if (runCallbacks === void 0) runCallbacks = true;

      var swiper = this;
      var newIndex = index;
      if (swiper.params.loop) {
        newIndex += swiper.loopedSlides;
      }

      return swiper.slideTo(newIndex, speed, runCallbacks, internal);
    }

    /* eslint no-unused-vars: "off" */
    function slideNext(speed, runCallbacks, internal) {
      if (speed === void 0) speed = this.params.speed;
      if (runCallbacks === void 0) runCallbacks = true;

      var swiper = this;
      var params = swiper.params;
      var animating = swiper.animating;
      if (params.loop) {
        if (animating) {
          return false;
        }
        swiper.loopFix();
        // eslint-disable-next-line
        swiper._clientLeft = swiper.$wrapperEl[0].clientLeft;
        return swiper.slideTo(swiper.activeIndex + params.slidesPerGroup, speed, runCallbacks, internal);
      }
      return swiper.slideTo(swiper.activeIndex + params.slidesPerGroup, speed, runCallbacks, internal);
    }

    /* eslint no-unused-vars: "off" */
    function slidePrev(speed, runCallbacks, internal) {
      if (speed === void 0) speed = this.params.speed;
      if (runCallbacks === void 0) runCallbacks = true;

      var swiper = this;
      var params = swiper.params;
      var animating = swiper.animating;
      var snapGrid = swiper.snapGrid;
      var slidesGrid = swiper.slidesGrid;
      var rtlTranslate = swiper.rtlTranslate;

      if (params.loop) {
        if (animating) {
          return false;
        }
        swiper.loopFix();
        // eslint-disable-next-line
        swiper._clientLeft = swiper.$wrapperEl[0].clientLeft;
      }
      var translate = rtlTranslate ? swiper.translate : -swiper.translate;

      function normalize(val) {
        if (val < 0) {
          return -Math.floor(Math.abs(val));
        }
        return Math.floor(val);
      }

      var normalizedTranslate = normalize(translate);
      var normalizedSnapGrid = snapGrid.map(function (val) {
        return normalize(val);
      });
      var normalizedSlidesGrid = slidesGrid.map(function (val) {
        return normalize(val);
      });

      var currentSnap = snapGrid[normalizedSnapGrid.indexOf(normalizedTranslate)];
      var prevSnap = snapGrid[normalizedSnapGrid.indexOf(normalizedTranslate) - 1];
      var prevIndex;
      if (typeof prevSnap !== 'undefined') {
        prevIndex = slidesGrid.indexOf(prevSnap);
        if (prevIndex < 0) {
          prevIndex = swiper.activeIndex - 1;
        }
      }
      return swiper.slideTo(prevIndex, speed, runCallbacks, internal);
    }

    /* eslint no-unused-vars: "off" */
    function slideReset(speed, runCallbacks, internal) {
      if (speed === void 0) speed = this.params.speed;
      if (runCallbacks === void 0) runCallbacks = true;

      var swiper = this;
      return swiper.slideTo(swiper.activeIndex, speed, runCallbacks, internal);
    }

    /* eslint no-unused-vars: "off" */
    function slideToClosest(speed, runCallbacks, internal) {
      if (speed === void 0) speed = this.params.speed;
      if (runCallbacks === void 0) runCallbacks = true;

      var swiper = this;
      var index = swiper.activeIndex;
      var snapIndex = Math.floor(index / swiper.params.slidesPerGroup);

      if (snapIndex < swiper.snapGrid.length - 1) {
        var translate = swiper.rtlTranslate ? swiper.translate : -swiper.translate;

        var currentSnap = swiper.snapGrid[snapIndex];
        var nextSnap = swiper.snapGrid[snapIndex + 1];

        if ((translate - currentSnap) > (nextSnap - currentSnap) / 2) {
          index = swiper.params.slidesPerGroup;
        }
      }

      return swiper.slideTo(index, speed, runCallbacks, internal);
    }

    function slideToClickedSlide() {
      var swiper = this;
      var params = swiper.params;
      var $wrapperEl = swiper.$wrapperEl;

      var slidesPerView = params.slidesPerView === 'auto' ? swiper.slidesPerViewDynamic() : params.slidesPerView;
      var slideToIndex = swiper.clickedIndex;
      var realIndex;
      if (params.loop) {
        if (swiper.animating) {
          return;
        }
        realIndex = parseInt($(swiper.clickedSlide).attr('data-swiper-slide-index'), 10);
        if (params.centeredSlides) {
          if (
            (slideToIndex < swiper.loopedSlides - (slidesPerView / 2))
            || (slideToIndex > (swiper.slides.length - swiper.loopedSlides) + (slidesPerView / 2))
          ) {
            swiper.loopFix();
            slideToIndex = $wrapperEl
              .children(("." + (params.slideClass) + "[data-swiper-slide-index=\"" + realIndex + "\"]:not(." + (params.slideDuplicateClass) + ")"))
              .eq(0)
              .index();

            Utils.nextTick(function () {
              swiper.slideTo(slideToIndex);
            });
          } else {
            swiper.slideTo(slideToIndex);
          }
        } else if (slideToIndex > swiper.slides.length - slidesPerView) {
          swiper.loopFix();
          slideToIndex = $wrapperEl
            .children(("." + (params.slideClass) + "[data-swiper-slide-index=\"" + realIndex + "\"]:not(." + (params.slideDuplicateClass) + ")"))
            .eq(0)
            .index();

          Utils.nextTick(function () {
            swiper.slideTo(slideToIndex);
          });
        } else {
          swiper.slideTo(slideToIndex);
        }
      } else {
        swiper.slideTo(slideToIndex);
      }
    }

    var slide = {
      slideTo: slideTo,
      slideToLoop: slideToLoop,
      slideNext: slideNext,
      slidePrev: slidePrev,
      slideReset: slideReset,
      slideToClosest: slideToClosest,
      slideToClickedSlide: slideToClickedSlide,
    };

    function loopCreate() {
      var swiper = this;
      var params = swiper.params;
      var $wrapperEl = swiper.$wrapperEl;
      // Remove duplicated slides
      $wrapperEl.children(("." + (params.slideClass) + "." + (params.slideDuplicateClass))).remove();

      var slides = $wrapperEl.children(("." + (params.slideClass)));

      if (params.loopFillGroupWithBlank) {
        var blankSlidesNum = params.slidesPerGroup - (slides.length % params.slidesPerGroup);
        if (blankSlidesNum !== params.slidesPerGroup) {
          for (var i = 0; i < blankSlidesNum; i += 1) {
            var blankNode = $(doc.createElement('div')).addClass(((params.slideClass) + " " + (params.slideBlankClass)));
            $wrapperEl.append(blankNode);
          }
          slides = $wrapperEl.children(("." + (params.slideClass)));
        }
      }

      if (params.slidesPerView === 'auto' && !params.loopedSlides) {
        params.loopedSlides = slides.length;
      }

      swiper.loopedSlides = parseInt(params.loopedSlides || params.slidesPerView, 10);
      swiper.loopedSlides += params.loopAdditionalSlides;
      if (swiper.loopedSlides > slides.length) {
        swiper.loopedSlides = slides.length;
      }

      var prependSlides = [];
      var appendSlides = [];
      slides.each(function (index, el) {
        var slide = $(el);
        if (index < swiper.loopedSlides) {
          appendSlides.push(el);
        }
        if (index < slides.length && index >= slides.length - swiper.loopedSlides) {
          prependSlides.push(el);
        }
        slide.attr('data-swiper-slide-index', index);
      });
      for (var i$1 = 0; i$1 < appendSlides.length; i$1 += 1) {
        $wrapperEl.append($(appendSlides[i$1].cloneNode(true)).addClass(params.slideDuplicateClass));
      }
      for (var i$2 = prependSlides.length - 1; i$2 >= 0; i$2 -= 1) {
        $wrapperEl.prepend($(prependSlides[i$2].cloneNode(true)).addClass(params.slideDuplicateClass));
      }
    }

    function loopFix() {
      var swiper = this;
      var params = swiper.params;
      var activeIndex = swiper.activeIndex;
      var slides = swiper.slides;
      var loopedSlides = swiper.loopedSlides;
      var allowSlidePrev = swiper.allowSlidePrev;
      var allowSlideNext = swiper.allowSlideNext;
      var snapGrid = swiper.snapGrid;
      var rtl = swiper.rtlTranslate;
      var newIndex;
      swiper.allowSlidePrev = true;
      swiper.allowSlideNext = true;

      var snapTranslate = -snapGrid[activeIndex];
      var diff = snapTranslate - swiper.getTranslate();


      // Fix For Negative Oversliding
      if (activeIndex < loopedSlides) {
        newIndex = (slides.length - (loopedSlides * 3)) + activeIndex;
        newIndex += loopedSlides;
        var slideChanged = swiper.slideTo(newIndex, 0, false, true);
        if (slideChanged && diff !== 0) {
          swiper.setTranslate((rtl ? -swiper.translate : swiper.translate) - diff);
        }
      } else if ((params.slidesPerView === 'auto' && activeIndex >= loopedSlides * 2) || (activeIndex >= slides.length - loopedSlides)) {
        // Fix For Positive Oversliding
        newIndex = -slides.length + activeIndex + loopedSlides;
        newIndex += loopedSlides;
        var slideChanged$1 = swiper.slideTo(newIndex, 0, false, true);
        if (slideChanged$1 && diff !== 0) {
          swiper.setTranslate((rtl ? -swiper.translate : swiper.translate) - diff);
        }
      }
      swiper.allowSlidePrev = allowSlidePrev;
      swiper.allowSlideNext = allowSlideNext;
    }

    function loopDestroy() {
      var swiper = this;
      var $wrapperEl = swiper.$wrapperEl;
      var params = swiper.params;
      var slides = swiper.slides;
      $wrapperEl.children(("." + (params.slideClass) + "." + (params.slideDuplicateClass) + ",." + (params.slideClass) + "." + (params.slideBlankClass))).remove();
      slides.removeAttr('data-swiper-slide-index');
    }

    var loop = {
      loopCreate: loopCreate,
      loopFix: loopFix,
      loopDestroy: loopDestroy,
    };

    function setGrabCursor(moving) {
      var swiper = this;
      if (Support.touch || !swiper.params.simulateTouch || (swiper.params.watchOverflow && swiper.isLocked)) {
        return;
      }
      var el = swiper.el;
      el.style.cursor = 'move';
      el.style.cursor = moving ? '-webkit-grabbing' : '-webkit-grab';
      el.style.cursor = moving ? '-moz-grabbin' : '-moz-grab';
      el.style.cursor = moving ? 'grabbing' : 'grab';
    }

    function unsetGrabCursor() {
      var swiper = this;
      if (Support.touch || (swiper.params.watchOverflow && swiper.isLocked)) {
        return;
      }
      swiper.el.style.cursor = '';
    }

    var grabCursor = {
      setGrabCursor: setGrabCursor,
      unsetGrabCursor: unsetGrabCursor,
    };

    function appendSlide(slides) {
      var swiper = this;
      var $wrapperEl = swiper.$wrapperEl;
      var params = swiper.params;
      if (params.loop) {
        swiper.loopDestroy();
      }
      if (typeof slides === 'object' && 'length' in slides) {
        for (var i = 0; i < slides.length; i += 1) {
          if (slides[i]) {
            $wrapperEl.append(slides[i]);
          }
        }
      } else {
        $wrapperEl.append(slides);
      }
      if (params.loop) {
        swiper.loopCreate();
      }
      if (!(params.observer && Support.observer)) {
        swiper.update();
      }
    }

    function prependSlide(slides) {
      var swiper = this;
      var params = swiper.params;
      var $wrapperEl = swiper.$wrapperEl;
      var activeIndex = swiper.activeIndex;

      if (params.loop) {
        swiper.loopDestroy();
      }
      var newActiveIndex = activeIndex + 1;
      if (typeof slides === 'object' && 'length' in slides) {
        for (var i = 0; i < slides.length; i += 1) {
          if (slides[i]) {
            $wrapperEl.prepend(slides[i]);
          }
        }
        newActiveIndex = activeIndex + slides.length;
      } else {
        $wrapperEl.prepend(slides);
      }
      if (params.loop) {
        swiper.loopCreate();
      }
      if (!(params.observer && Support.observer)) {
        swiper.update();
      }
      swiper.slideTo(newActiveIndex, 0, false);
    }

    function addSlide(index, slides) {
      var swiper = this;
      var $wrapperEl = swiper.$wrapperEl;
      var params = swiper.params;
      var activeIndex = swiper.activeIndex;
      var activeIndexBuffer = activeIndex;
      if (params.loop) {
        activeIndexBuffer -= swiper.loopedSlides;
        swiper.loopDestroy();
        swiper.slides = $wrapperEl.children(("." + (params.slideClass)));
      }
      var baseLength = swiper.slides.length;
      if (index <= 0) {
        swiper.prependSlide(slides);
        return;
      }
      if (index >= baseLength) {
        swiper.appendSlide(slides);
        return;
      }
      var newActiveIndex = activeIndexBuffer > index ? activeIndexBuffer + 1 : activeIndexBuffer;

      var slidesBuffer = [];
      for (var i = baseLength - 1; i >= index; i -= 1) {
        var currentSlide = swiper.slides.eq(i);
        currentSlide.remove();
        slidesBuffer.unshift(currentSlide);
      }

      if (typeof slides === 'object' && 'length' in slides) {
        for (var i$1 = 0; i$1 < slides.length; i$1 += 1) {
          if (slides[i$1]) {
            $wrapperEl.append(slides[i$1]);
          }
        }
        newActiveIndex = activeIndexBuffer > index ? activeIndexBuffer + slides.length : activeIndexBuffer;
      } else {
        $wrapperEl.append(slides);
      }

      for (var i$2 = 0; i$2 < slidesBuffer.length; i$2 += 1) {
        $wrapperEl.append(slidesBuffer[i$2]);
      }

      if (params.loop) {
        swiper.loopCreate();
      }
      if (!(params.observer && Support.observer)) {
        swiper.update();
      }
      if (params.loop) {
        swiper.slideTo(newActiveIndex + swiper.loopedSlides, 0, false);
      } else {
        swiper.slideTo(newActiveIndex, 0, false);
      }
    }

    function removeSlide(slidesIndexes) {
      var swiper = this;
      var params = swiper.params;
      var $wrapperEl = swiper.$wrapperEl;
      var activeIndex = swiper.activeIndex;

      var activeIndexBuffer = activeIndex;
      if (params.loop) {
        activeIndexBuffer -= swiper.loopedSlides;
        swiper.loopDestroy();
        swiper.slides = $wrapperEl.children(("." + (params.slideClass)));
      }
      var newActiveIndex = activeIndexBuffer;
      var indexToRemove;

      if (typeof slidesIndexes === 'object' && 'length' in slidesIndexes) {
        for (var i = 0; i < slidesIndexes.length; i += 1) {
          indexToRemove = slidesIndexes[i];
          if (swiper.slides[indexToRemove]) {
            swiper.slides.eq(indexToRemove).remove();
          }
          if (indexToRemove < newActiveIndex) {
            newActiveIndex -= 1;
          }
        }
        newActiveIndex = Math.max(newActiveIndex, 0);
      } else {
        indexToRemove = slidesIndexes;
        if (swiper.slides[indexToRemove]) {
          swiper.slides.eq(indexToRemove).remove();
        }
        if (indexToRemove < newActiveIndex) {
          newActiveIndex -= 1;
        }
        newActiveIndex = Math.max(newActiveIndex, 0);
      }

      if (params.loop) {
        swiper.loopCreate();
      }

      if (!(params.observer && Support.observer)) {
        swiper.update();
      }
      if (params.loop) {
        swiper.slideTo(newActiveIndex + swiper.loopedSlides, 0, false);
      } else {
        swiper.slideTo(newActiveIndex, 0, false);
      }
    }

    function removeAllSlides() {
      var swiper = this;

      var slidesIndexes = [];
      for (var i = 0; i < swiper.slides.length; i += 1) {
        slidesIndexes.push(i);
      }
      swiper.removeSlide(slidesIndexes);
    }

    var manipulation = {
      appendSlide: appendSlide,
      prependSlide: prependSlide,
      addSlide: addSlide,
      removeSlide: removeSlide,
      removeAllSlides: removeAllSlides,
    };

    var Device = (function Device() {
      var ua = win.navigator.userAgent;

      var device = {
        ios: false,
        android: false,
        androidChrome: false,
        desktop: false,
        windows: false,
        iphone: false,
        ipod: false,
        ipad: false,
        cordova: win.cordova || win.phonegap,
        phonegap: win.cordova || win.phonegap,
      };

      var windows = ua.match(/(Windows Phone);?[\s\/]+([\d.]+)?/); // eslint-disable-line
      var android = ua.match(/(Android);?[\s\/]+([\d.]+)?/); // eslint-disable-line
      var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
      var ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
      var iphone = !ipad && ua.match(/(iPhone\sOS|iOS)\s([\d_]+)/);


      // Windows
      if (windows) {
        device.os = 'windows';
        device.osVersion = windows[2];
        device.windows = true;
      }
      // Android
      if (android && !windows) {
        device.os = 'android';
        device.osVersion = android[2];
        device.android = true;
        device.androidChrome = ua.toLowerCase().indexOf('chrome') >= 0;
      }
      if (ipad || iphone || ipod) {
        device.os = 'ios';
        device.ios = true;
      }
      // iOS
      if (iphone && !ipod) {
        device.osVersion = iphone[2].replace(/_/g, '.');
        device.iphone = true;
      }
      if (ipad) {
        device.osVersion = ipad[2].replace(/_/g, '.');
        device.ipad = true;
      }
      if (ipod) {
        device.osVersion = ipod[3] ? ipod[3].replace(/_/g, '.') : null;
        device.iphone = true;
      }
      // iOS 8+ changed UA
      if (device.ios && device.osVersion && ua.indexOf('Version/') >= 0) {
        if (device.osVersion.split('.')[0] === '10') {
          device.osVersion = ua.toLowerCase().split('version/')[1].split(' ')[0];
        }
      }

      // Desktop
      device.desktop = !(device.os || device.android || device.webView);

      // Webview
      device.webView = (iphone || ipad || ipod) && ua.match(/.*AppleWebKit(?!.*Safari)/i);

      // Minimal UI
      if (device.os && device.os === 'ios') {
        var osVersionArr = device.osVersion.split('.');
        var metaViewport = doc.querySelector('meta[name="viewport"]');
        device.minimalUi = !device.webView
          && (ipod || iphone)
          && (osVersionArr[0] * 1 === 7 ? osVersionArr[1] * 1 >= 1 : osVersionArr[0] * 1 > 7)
          && metaViewport && metaViewport.getAttribute('content').indexOf('minimal-ui') >= 0;
      }

      // Pixel Ratio
      device.pixelRatio = win.devicePixelRatio || 1;

      // Export object
      return device;
    }());

    function onTouchStart(event) {
      var swiper = this;
      var data = swiper.touchEventsData;
      var params = swiper.params;
      var touches = swiper.touches;
      if (swiper.animating && params.preventInteractionOnTransition) {
        return;
      }
      var e = event;
      if (e.originalEvent) {
        e = e.originalEvent;
      }
      data.isTouchEvent = e.type === 'touchstart';
      if (!data.isTouchEvent && 'which' in e && e.which === 3) {
        return;
      }
      if (!data.isTouchEvent && 'button' in e && e.button > 0) {
        return;
      }
      if (data.isTouched && data.isMoved) {
        return;
      }
      if (params.noSwiping && $(e.target).closest(params.noSwipingSelector ? params.noSwipingSelector : ("." + (params.noSwipingClass)))[0]) {
        swiper.allowClick = true;
        return;
      }
      if (params.swipeHandler) {
        if (!$(e).closest(params.swipeHandler)[0]) {
          return;
        }
      }

      touches.currentX = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
      touches.currentY = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
      var startX = touches.currentX;
      var startY = touches.currentY;

      // Do NOT start if iOS edge swipe is detected. Otherwise iOS app (UIWebView) cannot swipe-to-go-back anymore

      var edgeSwipeDetection = params.edgeSwipeDetection || params.iOSEdgeSwipeDetection;
      var edgeSwipeThreshold = params.edgeSwipeThreshold || params.iOSEdgeSwipeThreshold;
      if (
        edgeSwipeDetection
        && ((startX <= edgeSwipeThreshold)
        || (startX >= win.screen.width - edgeSwipeThreshold))
      ) {
        return;
      }

      Utils.extend(data, {
        isTouched: true,
        isMoved: false,
        allowTouchCallbacks: true,
        isScrolling: undefined,
        startMoving: undefined,
      });

      touches.startX = startX;
      touches.startY = startY;
      data.touchStartTime = Utils.now();
      swiper.allowClick = true;
      swiper.updateSize();
      swiper.swipeDirection = undefined;
      if (params.threshold > 0) {
        data.allowThresholdMove = false;
      }
      if (e.type !== 'touchstart') {
        var preventDefault = true;
        if ($(e.target).is(data.formElements)) {
          preventDefault = false;
        }
        if (
          doc.activeElement
          && $(doc.activeElement).is(data.formElements)
          && doc.activeElement !== e.target
        ) {
          doc.activeElement.blur();
        }

        var shouldPreventDefault = preventDefault && swiper.allowTouchMove && params.touchStartPreventDefault;
        if (params.touchStartForcePreventDefault || shouldPreventDefault) {
          e.preventDefault();
        }
      }
      swiper.emit('touchStart', e);
    }

    function onTouchMove(event) {
      var swiper = this;
      var data = swiper.touchEventsData;
      var params = swiper.params;
      var touches = swiper.touches;
      var rtl = swiper.rtlTranslate;
      var e = event;
      if (e.originalEvent) {
        e = e.originalEvent;
      }
      if (!data.isTouched) {
        if (data.startMoving && data.isScrolling) {
          swiper.emit('touchMoveOpposite', e);
        }
        return;
      }
      if (data.isTouchEvent && e.type === 'mousemove') {
        return;
      }
      var pageX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
      var pageY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
      if (e.preventedByNestedSwiper) {
        touches.startX = pageX;
        touches.startY = pageY;
        return;
      }
      if (!swiper.allowTouchMove) {
        // isMoved = true;
        swiper.allowClick = false;
        if (data.isTouched) {
          Utils.extend(touches, {
            startX: pageX,
            startY: pageY,
            currentX: pageX,
            currentY: pageY,
          });
          data.touchStartTime = Utils.now();
        }
        return;
      }
      if (data.isTouchEvent && params.touchReleaseOnEdges && !params.loop) {
        if (swiper.isVertical()) {
          // Vertical
          if (
            (pageY < touches.startY && swiper.translate <= swiper.maxTranslate())
            || (pageY > touches.startY && swiper.translate >= swiper.minTranslate())
          ) {
            data.isTouched = false;
            data.isMoved = false;
            return;
          }
        } else if (
          (pageX < touches.startX && swiper.translate <= swiper.maxTranslate())
          || (pageX > touches.startX && swiper.translate >= swiper.minTranslate())
        ) {
          return;
        }
      }
      if (data.isTouchEvent && doc.activeElement) {
        if (e.target === doc.activeElement && $(e.target).is(data.formElements)) {
          data.isMoved = true;
          swiper.allowClick = false;
          return;
        }
      }
      if (data.allowTouchCallbacks) {
        swiper.emit('touchMove', e);
      }
      if (e.targetTouches && e.targetTouches.length > 1) {
        return;
      }

      touches.currentX = pageX;
      touches.currentY = pageY;

      var diffX = touches.currentX - touches.startX;
      var diffY = touches.currentY - touches.startY;
      if (swiper.params.threshold && Math.sqrt((Math.pow(diffX, 2)) + (Math.pow(diffY, 2))) < swiper.params.threshold) {
        return;
      }

      if (typeof data.isScrolling === 'undefined') {
        var touchAngle;
        if ((swiper.isHorizontal() && touches.currentY === touches.startY) || (swiper.isVertical() && touches.currentX === touches.startX)) {
          data.isScrolling = false;
        } else {
          // eslint-disable-next-line
          if ((diffX * diffX) + (diffY * diffY) >= 25) {
            touchAngle = (Math.atan2(Math.abs(diffY), Math.abs(diffX)) * 180) / Math.PI;
            data.isScrolling = swiper.isHorizontal() ? touchAngle > params.touchAngle : (90 - touchAngle > params.touchAngle);
          }
        }
      }
      if (data.isScrolling) {
        swiper.emit('touchMoveOpposite', e);
      }
      if (typeof data.startMoving === 'undefined') {
        if (touches.currentX !== touches.startX || touches.currentY !== touches.startY) {
          data.startMoving = true;
        }
      }
      if (data.isScrolling) {
        data.isTouched = false;
        return;
      }
      if (!data.startMoving) {
        return;
      }
      swiper.allowClick = false;
      e.preventDefault();
      if (params.touchMoveStopPropagation && !params.nested) {
        e.stopPropagation();
      }

      if (!data.isMoved) {
        if (params.loop) {
          swiper.loopFix();
        }
        data.startTranslate = swiper.getTranslate();
        swiper.setTransition(0);
        if (swiper.animating) {
          swiper.$wrapperEl.trigger('webkitTransitionEnd transitionend');
        }
        data.allowMomentumBounce = false;
        // Grab Cursor
        if (params.grabCursor && (swiper.allowSlideNext === true || swiper.allowSlidePrev === true)) {
          swiper.setGrabCursor(true);
        }
        swiper.emit('sliderFirstMove', e);
      }
      swiper.emit('sliderMove', e);
      data.isMoved = true;

      var diff = swiper.isHorizontal() ? diffX : diffY;
      touches.diff = diff;

      diff *= params.touchRatio;
      if (rtl) {
        diff = -diff;
      }

      swiper.swipeDirection = diff > 0 ? 'prev' : 'next';
      data.currentTranslate = diff + data.startTranslate;

      var disableParentSwiper = true;
      var resistanceRatio = params.resistanceRatio;
      if (params.touchReleaseOnEdges) {
        resistanceRatio = 0;
      }
      if ((diff > 0 && data.currentTranslate > swiper.minTranslate())) {
        disableParentSwiper = false;
        if (params.resistance) {
          data.currentTranslate = (swiper.minTranslate() - 1) + (Math.pow((-swiper.minTranslate() + data.startTranslate + diff), resistanceRatio));
        }
      } else if (diff < 0 && data.currentTranslate < swiper.maxTranslate()) {
        disableParentSwiper = false;
        if (params.resistance) {
          data.currentTranslate = (swiper.maxTranslate() + 1) - (Math.pow((swiper.maxTranslate() - data.startTranslate - diff), resistanceRatio));
        }
      }

      if (disableParentSwiper) {
        e.preventedByNestedSwiper = true;
      }

      // Directions locks
      if (!swiper.allowSlideNext && swiper.swipeDirection === 'next' && data.currentTranslate < data.startTranslate) {
        data.currentTranslate = data.startTranslate;
      }
      if (!swiper.allowSlidePrev && swiper.swipeDirection === 'prev' && data.currentTranslate > data.startTranslate) {
        data.currentTranslate = data.startTranslate;
      }


      // Threshold
      if (params.threshold > 0) {
        if (Math.abs(diff) > params.threshold || data.allowThresholdMove) {
          if (!data.allowThresholdMove) {
            data.allowThresholdMove = true;
            touches.startX = touches.currentX;
            touches.startY = touches.currentY;
            data.currentTranslate = data.startTranslate;
            touches.diff = swiper.isHorizontal() ? touches.currentX - touches.startX : touches.currentY - touches.startY;
            return;
          }
        } else {
          data.currentTranslate = data.startTranslate;
          return;
        }
      }

      if (!params.followFinger) {
        return;
      }

      // Update active index in free mode
      if (params.freeMode || params.watchSlidesProgress || params.watchSlidesVisibility) {
        swiper.updateActiveIndex();
        swiper.updateSlidesClasses();
      }
      if (params.freeMode) {
        // Velocity
        if (data.velocities.length === 0) {
          data.velocities.push({
            position: touches[swiper.isHorizontal() ? 'startX' : 'startY'],
            time: data.touchStartTime,
          });
        }
        data.velocities.push({
          position: touches[swiper.isHorizontal() ? 'currentX' : 'currentY'],
          time: Utils.now(),
        });
      }
      // Update progress
      swiper.updateProgress(data.currentTranslate);
      // Update translate
      swiper.setTranslate(data.currentTranslate);
    }

    function onTouchEnd(event) {
      var swiper = this;
      var data = swiper.touchEventsData;

      var params = swiper.params;
      var touches = swiper.touches;
      var rtl = swiper.rtlTranslate;
      var $wrapperEl = swiper.$wrapperEl;
      var slidesGrid = swiper.slidesGrid;
      var snapGrid = swiper.snapGrid;
      var e = event;
      if (e.originalEvent) {
        e = e.originalEvent;
      }
      if (data.allowTouchCallbacks) {
        swiper.emit('touchEnd', e);
      }
      data.allowTouchCallbacks = false;
      if (!data.isTouched) {
        if (data.isMoved && params.grabCursor) {
          swiper.setGrabCursor(false);
        }
        data.isMoved = false;
        data.startMoving = false;
        return;
      }
      // Return Grab Cursor
      if (params.grabCursor && data.isMoved && data.isTouched && (swiper.allowSlideNext === true || swiper.allowSlidePrev === true)) {
        swiper.setGrabCursor(false);
      }

      // Time diff
      var touchEndTime = Utils.now();
      var timeDiff = touchEndTime - data.touchStartTime;

      // Tap, doubleTap, Click
      if (swiper.allowClick) {
        swiper.updateClickedSlide(e);
        swiper.emit('tap', e);
        if (timeDiff < 300 && (touchEndTime - data.lastClickTime) > 300) {
          if (data.clickTimeout) {
            clearTimeout(data.clickTimeout);
          }
          data.clickTimeout = Utils.nextTick(function () {
            if (!swiper || swiper.destroyed) {
              return;
            }
            swiper.emit('click', e);
          }, 300);
        }
        if (timeDiff < 300 && (touchEndTime - data.lastClickTime) < 300) {
          if (data.clickTimeout) {
            clearTimeout(data.clickTimeout);
          }
          swiper.emit('doubleTap', e);
        }
      }

      data.lastClickTime = Utils.now();
      Utils.nextTick(function () {
        if (!swiper.destroyed) {
          swiper.allowClick = true;
        }
      });

      if (!data.isTouched || !data.isMoved || !swiper.swipeDirection || touches.diff === 0 || data.currentTranslate === data.startTranslate) {
        data.isTouched = false;
        data.isMoved = false;
        data.startMoving = false;
        return;
      }
      data.isTouched = false;
      data.isMoved = false;
      data.startMoving = false;

      var currentPos;
      if (params.followFinger) {
        currentPos = rtl ? swiper.translate : -swiper.translate;
      } else {
        currentPos = -data.currentTranslate;
      }

      if (params.freeMode) {
        if (currentPos < -swiper.minTranslate()) {
          swiper.slideTo(swiper.activeIndex);
          return;
        }
        if (currentPos > -swiper.maxTranslate()) {
          if (swiper.slides.length < snapGrid.length) {
            swiper.slideTo(snapGrid.length - 1);
          } else {
            swiper.slideTo(swiper.slides.length - 1);
          }
          return;
        }

        if (params.freeModeMomentum) {
          if (data.velocities.length > 1) {
            var lastMoveEvent = data.velocities.pop();
            var velocityEvent = data.velocities.pop();

            var distance = lastMoveEvent.position - velocityEvent.position;
            var time = lastMoveEvent.time - velocityEvent.time;
            swiper.velocity = distance / time;
            swiper.velocity /= 2;
            if (Math.abs(swiper.velocity) < params.freeModeMinimumVelocity) {
              swiper.velocity = 0;
            }
            // this implies that the user stopped moving a finger then released.
            // There would be no events with distance zero, so the last event is stale.
            if (time > 150 || (Utils.now() - lastMoveEvent.time) > 300) {
              swiper.velocity = 0;
            }
          } else {
            swiper.velocity = 0;
          }
          swiper.velocity *= params.freeModeMomentumVelocityRatio;

          data.velocities.length = 0;
          var momentumDuration = 1000 * params.freeModeMomentumRatio;
          var momentumDistance = swiper.velocity * momentumDuration;

          var newPosition = swiper.translate + momentumDistance;
          if (rtl) {
            newPosition = -newPosition;
          }

          var doBounce = false;
          var afterBouncePosition;
          var bounceAmount = Math.abs(swiper.velocity) * 20 * params.freeModeMomentumBounceRatio;
          var needsLoopFix;
          if (newPosition < swiper.maxTranslate()) {
            if (params.freeModeMomentumBounce) {
              if (newPosition + swiper.maxTranslate() < -bounceAmount) {
                newPosition = swiper.maxTranslate() - bounceAmount;
              }
              afterBouncePosition = swiper.maxTranslate();
              doBounce = true;
              data.allowMomentumBounce = true;
            } else {
              newPosition = swiper.maxTranslate();
            }
            if (params.loop && params.centeredSlides) {
              needsLoopFix = true;
            }
          } else if (newPosition > swiper.minTranslate()) {
            if (params.freeModeMomentumBounce) {
              if (newPosition - swiper.minTranslate() > bounceAmount) {
                newPosition = swiper.minTranslate() + bounceAmount;
              }
              afterBouncePosition = swiper.minTranslate();
              doBounce = true;
              data.allowMomentumBounce = true;
            } else {
              newPosition = swiper.minTranslate();
            }
            if (params.loop && params.centeredSlides) {
              needsLoopFix = true;
            }
          } else if (params.freeModeSticky) {
            var nextSlide;
            for (var j = 0; j < snapGrid.length; j += 1) {
              if (snapGrid[j] > -newPosition) {
                nextSlide = j;
                break;
              }
            }

            if (Math.abs(snapGrid[nextSlide] - newPosition) < Math.abs(snapGrid[nextSlide - 1] - newPosition) || swiper.swipeDirection === 'next') {
              newPosition = snapGrid[nextSlide];
            } else {
              newPosition = snapGrid[nextSlide - 1];
            }
            newPosition = -newPosition;
          }
          if (needsLoopFix) {
            swiper.once('transitionEnd', function () {
              swiper.loopFix();
            });
          }
          // Fix duration
          if (swiper.velocity !== 0) {
            if (rtl) {
              momentumDuration = Math.abs((-newPosition - swiper.translate) / swiper.velocity);
            } else {
              momentumDuration = Math.abs((newPosition - swiper.translate) / swiper.velocity);
            }
          } else if (params.freeModeSticky) {
            swiper.slideToClosest();
            return;
          }

          if (params.freeModeMomentumBounce && doBounce) {
            swiper.updateProgress(afterBouncePosition);
            swiper.setTransition(momentumDuration);
            swiper.setTranslate(newPosition);
            swiper.transitionStart(true, swiper.swipeDirection);
            swiper.animating = true;
            $wrapperEl.transitionEnd(function () {
              if (!swiper || swiper.destroyed || !data.allowMomentumBounce) {
                return;
              }
              swiper.emit('momentumBounce');

              swiper.setTransition(params.speed);
              swiper.setTranslate(afterBouncePosition);
              $wrapperEl.transitionEnd(function () {
                if (!swiper || swiper.destroyed) {
                  return;
                }
                swiper.transitionEnd();
              });
            });
          } else if (swiper.velocity) {
            swiper.updateProgress(newPosition);
            swiper.setTransition(momentumDuration);
            swiper.setTranslate(newPosition);
            swiper.transitionStart(true, swiper.swipeDirection);
            if (!swiper.animating) {
              swiper.animating = true;
              $wrapperEl.transitionEnd(function () {
                if (!swiper || swiper.destroyed) {
                  return;
                }
                swiper.transitionEnd();
              });
            }
          } else {
            swiper.updateProgress(newPosition);
          }

          swiper.updateActiveIndex();
          swiper.updateSlidesClasses();
        } else if (params.freeModeSticky) {
          swiper.slideToClosest();
          return;
        }

        if (!params.freeModeMomentum || timeDiff >= params.longSwipesMs) {
          swiper.updateProgress();
          swiper.updateActiveIndex();
          swiper.updateSlidesClasses();
        }
        return;
      }

      // Find current slide
      var stopIndex = 0;
      var groupSize = swiper.slidesSizesGrid[0];
      for (var i = 0; i < slidesGrid.length; i += params.slidesPerGroup) {
        if (typeof slidesGrid[i + params.slidesPerGroup] !== 'undefined') {
          if (currentPos >= slidesGrid[i] && currentPos < slidesGrid[i + params.slidesPerGroup]) {
            stopIndex = i;
            groupSize = slidesGrid[i + params.slidesPerGroup] - slidesGrid[i];
          }
        } else if (currentPos >= slidesGrid[i]) {
          stopIndex = i;
          groupSize = slidesGrid[slidesGrid.length - 1] - slidesGrid[slidesGrid.length - 2];
        }
      }

      // Find current slide size
      var ratio = (currentPos - slidesGrid[stopIndex]) / groupSize;

      if (timeDiff > params.longSwipesMs) {
        // Long touches
        if (!params.longSwipes) {
          swiper.slideTo(swiper.activeIndex);
          return;
        }
        if (swiper.swipeDirection === 'next') {
          if (ratio >= params.longSwipesRatio) {
            swiper.slideTo(stopIndex + params.slidesPerGroup);
          } else {
            swiper.slideTo(stopIndex);
          }
        }
        if (swiper.swipeDirection === 'prev') {
          if (ratio > (1 - params.longSwipesRatio)) {
            swiper.slideTo(stopIndex + params.slidesPerGroup);
          } else {
            swiper.slideTo(stopIndex);
          }
        }
      } else {
        // Short swipes
        if (!params.shortSwipes) {
          swiper.slideTo(swiper.activeIndex);
          return;
        }
        if (swiper.swipeDirection === 'next') {
          swiper.slideTo(stopIndex + params.slidesPerGroup);
        }
        if (swiper.swipeDirection === 'prev') {
          swiper.slideTo(stopIndex);
        }
      }
    }

    function onResize() {
      var swiper = this;

      var params = swiper.params;
      var el = swiper.el;

      if (el && el.offsetWidth === 0) {
        return;
      }

      // Breakpoints
      if (params.breakpoints) {
        swiper.setBreakpoint();
      }

      // Save locks
      var allowSlideNext = swiper.allowSlideNext;
      var allowSlidePrev = swiper.allowSlidePrev;
      var snapGrid = swiper.snapGrid;

      // Disable locks on resize
      swiper.allowSlideNext = true;
      swiper.allowSlidePrev = true;

      swiper.updateSize();
      swiper.updateSlides();

      if (params.freeMode) {
        var newTranslate = Math.min(Math.max(swiper.translate, swiper.maxTranslate()), swiper.minTranslate());
        swiper.setTranslate(newTranslate);
        swiper.updateActiveIndex();
        swiper.updateSlidesClasses();

        if (params.autoHeight) {
          swiper.updateAutoHeight();
        }
      } else {
        swiper.updateSlidesClasses();
        if ((params.slidesPerView === 'auto' || params.slidesPerView > 1) && swiper.isEnd && !swiper.params.centeredSlides) {
          swiper.slideTo(swiper.slides.length - 1, 0, false, true);
        } else {
          swiper.slideTo(swiper.activeIndex, 0, false, true);
        }
      }
      // Return locks after resize
      swiper.allowSlidePrev = allowSlidePrev;
      swiper.allowSlideNext = allowSlideNext;

      if (swiper.params.watchOverflow && snapGrid !== swiper.snapGrid) {
        swiper.checkOverflow();
      }
    }

    function onClick(e) {
      var swiper = this;
      if (!swiper.allowClick) {
        if (swiper.params.preventClicks) {
          e.preventDefault();
        }
        if (swiper.params.preventClicksPropagation && swiper.animating) {
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      }
    }

    function attachEvents() {
      var swiper = this;
      var params = swiper.params;
      var touchEvents = swiper.touchEvents;
      var el = swiper.el;
      var wrapperEl = swiper.wrapperEl;

      {
        swiper.onTouchStart = onTouchStart.bind(swiper);
        swiper.onTouchMove = onTouchMove.bind(swiper);
        swiper.onTouchEnd = onTouchEnd.bind(swiper);
      }

      swiper.onClick = onClick.bind(swiper);

      var target = params.touchEventsTarget === 'container' ? el : wrapperEl;
      var capture = !!params.nested;

      // Touch Events
      {
        if (!Support.touch && (Support.pointerEvents || Support.prefixedPointerEvents)) {
          target.addEventListener(touchEvents.start, swiper.onTouchStart, false);
          doc.addEventListener(touchEvents.move, swiper.onTouchMove, capture);
          doc.addEventListener(touchEvents.end, swiper.onTouchEnd, false);
        } else {
          if (Support.touch) {
            var passiveListener = touchEvents.start === 'touchstart' && Support.passiveListener && params.passiveListeners ? {passive: true, capture: false} : false;
            target.addEventListener(touchEvents.start, swiper.onTouchStart, passiveListener);
            target.addEventListener(touchEvents.move, swiper.onTouchMove, Support.passiveListener ? {passive: false, capture: capture} : capture);
            target.addEventListener(touchEvents.end, swiper.onTouchEnd, passiveListener);
          }
          if ((params.simulateTouch && !Device.ios && !Device.android) || (params.simulateTouch && !Support.touch && Device.ios)) {
            target.addEventListener('mousedown', swiper.onTouchStart, false);
            doc.addEventListener('mousemove', swiper.onTouchMove, capture);
            doc.addEventListener('mouseup', swiper.onTouchEnd, false);
          }
        }
        // Prevent Links Clicks
        if (params.preventClicks || params.preventClicksPropagation) {
          target.addEventListener('click', swiper.onClick, true);
        }
      }

      // Resize handler
      swiper.on((Device.ios || Device.android ? 'resize orientationchange observerUpdate' : 'resize observerUpdate'), onResize, true);
    }

    function detachEvents() {
      var swiper = this;

      var params = swiper.params;
      var touchEvents = swiper.touchEvents;
      var el = swiper.el;
      var wrapperEl = swiper.wrapperEl;

      var target = params.touchEventsTarget === 'container' ? el : wrapperEl;
      var capture = !!params.nested;

      // Touch Events
      {
        if (!Support.touch && (Support.pointerEvents || Support.prefixedPointerEvents)) {
          target.removeEventListener(touchEvents.start, swiper.onTouchStart, false);
          doc.removeEventListener(touchEvents.move, swiper.onTouchMove, capture);
          doc.removeEventListener(touchEvents.end, swiper.onTouchEnd, false);
        } else {
          if (Support.touch) {
            var passiveListener = touchEvents.start === 'onTouchStart' && Support.passiveListener && params.passiveListeners ? {passive: true, capture: false} : false;
            target.removeEventListener(touchEvents.start, swiper.onTouchStart, passiveListener);
            target.removeEventListener(touchEvents.move, swiper.onTouchMove, capture);
            target.removeEventListener(touchEvents.end, swiper.onTouchEnd, passiveListener);
          }
          if ((params.simulateTouch && !Device.ios && !Device.android) || (params.simulateTouch && !Support.touch && Device.ios)) {
            target.removeEventListener('mousedown', swiper.onTouchStart, false);
            doc.removeEventListener('mousemove', swiper.onTouchMove, capture);
            doc.removeEventListener('mouseup', swiper.onTouchEnd, false);
          }
        }
        // Prevent Links Clicks
        if (params.preventClicks || params.preventClicksPropagation) {
          target.removeEventListener('click', swiper.onClick, true);
        }
      }

      // Resize handler
      swiper.off((Device.ios || Device.android ? 'resize orientationchange observerUpdate' : 'resize observerUpdate'), onResize);
    }

    var events = {
      attachEvents: attachEvents,
      detachEvents: detachEvents,
    };

    function setBreakpoint() {
      var swiper = this;
      var activeIndex = swiper.activeIndex;
      var initialized = swiper.initialized;
      var loopedSlides = swiper.loopedSlides;
      if (loopedSlides === void 0) loopedSlides = 0;
      var params = swiper.params;
      var breakpoints = params.breakpoints;
      if (!breakpoints || (breakpoints && Object.keys(breakpoints).length === 0)) {
        return;
      }

      // Set breakpoint for window width and update parameters
      var breakpoint = swiper.getBreakpoint(breakpoints);

      if (breakpoint && swiper.currentBreakpoint !== breakpoint) {
        var breakpointOnlyParams = breakpoint in breakpoints ? breakpoints[breakpoint] : undefined;
        if (breakpointOnlyParams) {
          ['slidesPerView', 'spaceBetween', 'slidesPerGroup'].forEach(function (param) {
            var paramValue = breakpointOnlyParams[param];
            if (typeof paramValue === 'undefined') {
              return;
            }
            if (param === 'slidesPerView' && (paramValue === 'AUTO' || paramValue === 'auto')) {
              breakpointOnlyParams[param] = 'auto';
            } else if (param === 'slidesPerView') {
              breakpointOnlyParams[param] = parseFloat(paramValue);
            } else {
              breakpointOnlyParams[param] = parseInt(paramValue, 10);
            }
          });
        }

        var breakpointParams = breakpointOnlyParams || swiper.originalParams;
        var directionChanged = breakpointParams.direction && breakpointParams.direction !== params.direction;
        var needsReLoop = params.loop && (breakpointParams.slidesPerView !== params.slidesPerView || directionChanged);

        if (directionChanged && initialized) {
          swiper.changeDirection();
        }

        Utils.extend(swiper.params, breakpointParams);

        Utils.extend(swiper, {
          allowTouchMove: swiper.params.allowTouchMove,
          allowSlideNext: swiper.params.allowSlideNext,
          allowSlidePrev: swiper.params.allowSlidePrev,
        });

        swiper.currentBreakpoint = breakpoint;

        if (needsReLoop && initialized) {
          swiper.loopDestroy();
          swiper.loopCreate();
          swiper.updateSlides();
          swiper.slideTo((activeIndex - loopedSlides) + swiper.loopedSlides, 0, false);
        }

        swiper.emit('breakpoint', breakpointParams);
      }
    }

    function getBreakpoint(breakpoints) {
      var swiper = this;
      // Get breakpoint for window width
      if (!breakpoints) {
        return undefined;
      }
      var breakpoint = false;
      var points = [];
      Object.keys(breakpoints).forEach(function (point) {
        points.push(point);
      });
      points.sort(function (a, b) {
        return parseInt(a, 10) - parseInt(b, 10);
      });
      for (var i = 0; i < points.length; i += 1) {
        var point = points[i];
        if (swiper.params.breakpointsInverse) {
          if (point <= win.innerWidth) {
            breakpoint = point;
          }
        } else if (point >= win.innerWidth && !breakpoint) {
          breakpoint = point;
        }
      }
      return breakpoint || 'max';
    }

    var breakpoints = {setBreakpoint: setBreakpoint, getBreakpoint: getBreakpoint};

    function addClasses() {
      var swiper = this;
      var classNames = swiper.classNames;
      var params = swiper.params;
      var rtl = swiper.rtl;
      var $el = swiper.$el;
      var suffixes = [];

      suffixes.push('initialized');
      suffixes.push(params.direction);

      if (params.freeMode) {
        suffixes.push('free-mode');
      }
      if (!Support.flexbox) {
        suffixes.push('no-flexbox');
      }
      if (params.autoHeight) {
        suffixes.push('autoheight');
      }
      if (rtl) {
        suffixes.push('rtl');
      }
      if (params.slidesPerColumn > 1) {
        suffixes.push('multirow');
      }
      if (Device.android) {
        suffixes.push('android');
      }
      if (Device.ios) {
        suffixes.push('ios');
      }
      // WP8 Touch Events Fix
      if ((Browser.isIE || Browser.isEdge) && (Support.pointerEvents || Support.prefixedPointerEvents)) {
        suffixes.push(("wp8-" + (params.direction)));
      }

      suffixes.forEach(function (suffix) {
        classNames.push(params.containerModifierClass + suffix);
      });

      $el.addClass(classNames.join(' '));
    }

    function removeClasses() {
      var swiper = this;
      var $el = swiper.$el;
      var classNames = swiper.classNames;

      $el.removeClass(classNames.join(' '));
    }

    var classes = {addClasses: addClasses, removeClasses: removeClasses};

    function loadImage(imageEl, src, srcset, sizes, checkForComplete, callback) {
      var image;

      function onReady() {
        if (callback) {
          callback();
        }
      }

      if (!imageEl.complete || !checkForComplete) {
        if (src) {
          image = new win.Image();
          image.onload = onReady;
          image.onerror = onReady;
          if (sizes) {
            image.sizes = sizes;
          }
          if (srcset) {
            image.srcset = srcset;
          }
          if (src) {
            image.src = src;
          }
        } else {
          onReady();
        }
      } else {
        // image already loaded...
        onReady();
      }
    }

    function preloadImages() {
      var swiper = this;
      swiper.imagesToLoad = swiper.$el.find('img');

      function onReady() {
        if (typeof swiper === 'undefined' || swiper === null || !swiper || swiper.destroyed) {
          return;
        }
        if (swiper.imagesLoaded !== undefined) {
          swiper.imagesLoaded += 1;
        }
        if (swiper.imagesLoaded === swiper.imagesToLoad.length) {
          if (swiper.params.updateOnImagesReady) {
            swiper.update();
          }
          swiper.emit('imagesReady');
        }
      }

      for (var i = 0; i < swiper.imagesToLoad.length; i += 1) {
        var imageEl = swiper.imagesToLoad[i];
        swiper.loadImage(
          imageEl,
          imageEl.currentSrc || imageEl.getAttribute('src'),
          imageEl.srcset || imageEl.getAttribute('srcset'),
          imageEl.sizes || imageEl.getAttribute('sizes'),
          true,
          onReady
        );
      }
    }

    var images = {
      loadImage: loadImage,
      preloadImages: preloadImages,
    };

    function checkOverflow() {
      var swiper = this;
      var wasLocked = swiper.isLocked;

      swiper.isLocked = swiper.snapGrid.length === 1;
      swiper.allowSlideNext = !swiper.isLocked;
      swiper.allowSlidePrev = !swiper.isLocked;

      // events
      if (wasLocked !== swiper.isLocked) {
        swiper.emit(swiper.isLocked ? 'lock' : 'unlock');
      }

      if (wasLocked && wasLocked !== swiper.isLocked) {
        swiper.isEnd = false;
        swiper.navigation.update();
      }
    }

    var checkOverflow$1 = {checkOverflow: checkOverflow};

    var defaults = {
      init: true,
      direction: 'horizontal',
      touchEventsTarget: 'container',
      initialSlide: 0,
      speed: 300,
      //
      preventInteractionOnTransition: false,

      // To support iOS's swipe-to-go-back gesture (when being used in-app, with UIWebView).
      edgeSwipeDetection: false,
      edgeSwipeThreshold: 20,

      // Free mode
      freeMode: false,
      freeModeMomentum: true,
      freeModeMomentumRatio: 1,
      freeModeMomentumBounce: true,
      freeModeMomentumBounceRatio: 1,
      freeModeMomentumVelocityRatio: 1,
      freeModeSticky: false,
      freeModeMinimumVelocity: 0.02,

      // Autoheight
      autoHeight: false,

      // Set wrapper width
      setWrapperSize: false,

      // Virtual Translate
      virtualTranslate: false,

      // Effects
      effect: 'slide', // 'slide' or 'fade' or 'cube' or 'coverflow' or 'flip'

      // Breakpoints
      breakpoints: undefined,
      breakpointsInverse: false,

      // Slides grid
      spaceBetween: 0,
      slidesPerView: 1,
      slidesPerColumn: 1,
      slidesPerColumnFill: 'column',
      slidesPerGroup: 1,
      centeredSlides: false,
      slidesOffsetBefore: 0, // in px
      slidesOffsetAfter: 0, // in px
      normalizeSlideIndex: true,
      centerInsufficientSlides: false,

      // Disable swiper and hide navigation when container not overflow
      watchOverflow: false,

      // Round length
      roundLengths: false,

      // Touches
      touchRatio: 1,
      touchAngle: 45,
      simulateTouch: true,
      shortSwipes: true,
      longSwipes: true,
      longSwipesRatio: 0.5,
      longSwipesMs: 300,
      followFinger: true,
      allowTouchMove: true,
      threshold: 0,
      touchMoveStopPropagation: true,
      touchStartPreventDefault: true,
      touchStartForcePreventDefault: false,
      touchReleaseOnEdges: false,

      // Unique Navigation Elements
      uniqueNavElements: true,

      // Resistance
      resistance: true,
      resistanceRatio: 0.85,

      // Progress
      watchSlidesProgress: false,
      watchSlidesVisibility: false,

      // Cursor
      grabCursor: false,

      // Clicks
      preventClicks: true,
      preventClicksPropagation: true,
      slideToClickedSlide: false,

      // Images
      preloadImages: true,
      updateOnImagesReady: true,

      // loop
      loop: false,
      loopAdditionalSlides: 0,
      loopedSlides: null,
      loopFillGroupWithBlank: false,

      // Swiping/no swiping
      allowSlidePrev: true,
      allowSlideNext: true,
      swipeHandler: null, // '.swipe-handler',
      noSwiping: true,
      noSwipingClass: 'swiper-no-swiping',
      noSwipingSelector: null,

      // Passive Listeners
      passiveListeners: true,

      // NS
      containerModifierClass: 'swiper-container-', // NEW
      slideClass: 'swiper-slide',
      slideBlankClass: 'swiper-slide-invisible-blank',
      slideActiveClass: 'swiper-slide-active',
      slideDuplicateActiveClass: 'swiper-slide-duplicate-active',
      slideVisibleClass: 'swiper-slide-visible',
      slideDuplicateClass: 'swiper-slide-duplicate',
      slideNextClass: 'swiper-slide-next',
      slideDuplicateNextClass: 'swiper-slide-duplicate-next',
      slidePrevClass: 'swiper-slide-prev',
      slideDuplicatePrevClass: 'swiper-slide-duplicate-prev',
      wrapperClass: 'swiper-wrapper',

      // Callbacks
      runCallbacksOnInit: true,
    };

    /* eslint no-param-reassign: "off" */

    var prototypes = {
      update: update,
      translate: translate,
      transition: transition$1,
      slide: slide,
      loop: loop,
      grabCursor: grabCursor,
      manipulation: manipulation,
      events: events,
      breakpoints: breakpoints,
      checkOverflow: checkOverflow$1,
      classes: classes,
      images: images,
    };

    var extendedDefaults = {};

    var Swiper = /*@__PURE__*/(function (SwiperClass) {
      function Swiper() {
        var assign;

        var args = [], len = arguments.length;
        while (len--) args[len] = arguments[len];
        var el;
        var params;
        if (args.length === 1 && args[0].constructor && args[0].constructor === Object) {
          params = args[0];
        } else {
          (assign = args, el = assign[0], params = assign[1]);
        }
        if (!params) {
          params = {};
        }

        params = Utils.extend({}, params);
        if (el && !params.el) {
          params.el = el;
        }

        SwiperClass.call(this, params);

        Object.keys(prototypes).forEach(function (prototypeGroup) {
          Object.keys(prototypes[prototypeGroup]).forEach(function (protoMethod) {
            if (!Swiper.prototype[protoMethod]) {
              Swiper.prototype[protoMethod] = prototypes[prototypeGroup][protoMethod];
            }
          });
        });

        // Swiper Instance
        var swiper = this;
        if (typeof swiper.modules === 'undefined') {
          swiper.modules = {};
        }
        Object.keys(swiper.modules).forEach(function (moduleName) {
          var module = swiper.modules[moduleName];
          if (module.params) {
            var moduleParamName = Object.keys(module.params)[0];
            var moduleParams = module.params[moduleParamName];
            if (typeof moduleParams !== 'object' || moduleParams === null) {
              return;
            }
            if (!(moduleParamName in params && 'enabled' in moduleParams)) {
              return;
            }
            if (params[moduleParamName] === true) {
              params[moduleParamName] = {enabled: true};
            }
            if (
              typeof params[moduleParamName] === 'object'
              && !('enabled' in params[moduleParamName])
            ) {
              params[moduleParamName].enabled = true;
            }
            if (!params[moduleParamName]) {
              params[moduleParamName] = {enabled: false};
            }
          }
        });

        // Extend defaults with modules params
        var swiperParams = Utils.extend({}, defaults);
        swiper.useModulesParams(swiperParams);

        // Extend defaults with passed params
        swiper.params = Utils.extend({}, swiperParams, extendedDefaults, params);
        swiper.originalParams = Utils.extend({}, swiper.params);
        swiper.passedParams = Utils.extend({}, params);

        // Save Dom lib
        swiper.$ = $;

        // Find el
        var $el = $(swiper.params.el);
        el = $el[0];

        if (!el) {
          return undefined;
        }

        if ($el.length > 1) {
          var swipers = [];
          $el.each(function (index, containerEl) {
            var newParams = Utils.extend({}, params, {el: containerEl});
            swipers.push(new Swiper(newParams));
          });
          return swipers;
        }

        el.swiper = swiper;
        $el.data('swiper', swiper);

        // Find Wrapper
        var $wrapperEl = $el.children(("." + (swiper.params.wrapperClass)));

        // Extend Swiper
        Utils.extend(swiper, {
          $el: $el,
          el: el,
          $wrapperEl: $wrapperEl,
          wrapperEl: $wrapperEl[0],

          // Classes
          classNames: [],

          // Slides
          slides: $(),
          slidesGrid: [],
          snapGrid: [],
          slidesSizesGrid: [],

          // isDirection
          isHorizontal: function isHorizontal() {
            return swiper.params.direction === 'horizontal';
          },
          isVertical: function isVertical() {
            return swiper.params.direction === 'vertical';
          },
          // RTL
          rtl: (el.dir.toLowerCase() === 'rtl' || $el.css('direction') === 'rtl'),
          rtlTranslate: swiper.params.direction === 'horizontal' && (el.dir.toLowerCase() === 'rtl' || $el.css('direction') === 'rtl'),
          wrongRTL: $wrapperEl.css('display') === '-webkit-box',

          // Indexes
          activeIndex: 0,
          realIndex: 0,

          //
          isBeginning: true,
          isEnd: false,

          // Props
          translate: 0,
          previousTranslate: 0,
          progress: 0,
          velocity: 0,
          animating: false,

          // Locks
          allowSlideNext: swiper.params.allowSlideNext,
          allowSlidePrev: swiper.params.allowSlidePrev,

          // Touch Events
          touchEvents: (function touchEvents() {
            var touch = ['touchstart', 'touchmove', 'touchend'];
            var desktop = ['mousedown', 'mousemove', 'mouseup'];
            if (Support.pointerEvents) {
              desktop = ['pointerdown', 'pointermove', 'pointerup'];
            } else if (Support.prefixedPointerEvents) {
              desktop = ['MSPointerDown', 'MSPointerMove', 'MSPointerUp'];
            }
            swiper.touchEventsTouch = {
              start: touch[0],
              move: touch[1],
              end: touch[2],
            };
            swiper.touchEventsDesktop = {
              start: desktop[0],
              move: desktop[1],
              end: desktop[2],
            };
            return Support.touch || !swiper.params.simulateTouch ? swiper.touchEventsTouch : swiper.touchEventsDesktop;
          }()),
          touchEventsData: {
            isTouched: undefined,
            isMoved: undefined,
            allowTouchCallbacks: undefined,
            touchStartTime: undefined,
            isScrolling: undefined,
            currentTranslate: undefined,
            startTranslate: undefined,
            allowThresholdMove: undefined,
            // Form elements to match
            formElements: 'input, select, option, textarea, button, video',
            // Last click time
            lastClickTime: Utils.now(),
            clickTimeout: undefined,
            // Velocities
            velocities: [],
            allowMomentumBounce: undefined,
            isTouchEvent: undefined,
            startMoving: undefined,
          },

          // Clicks
          allowClick: true,

          // Touches
          allowTouchMove: swiper.params.allowTouchMove,

          touches: {
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            diff: 0,
          },

          // Images
          imagesToLoad: [],
          imagesLoaded: 0,

        });

        // Install Modules
        swiper.useModules();

        // Init
        if (swiper.params.init) {
          swiper.init();
        }

        // Return app instance
        return swiper;
      }

      if (SwiperClass) Swiper.__proto__ = SwiperClass;
      Swiper.prototype = Object.create(SwiperClass && SwiperClass.prototype);
      Swiper.prototype.constructor = Swiper;

      var staticAccessors = {extendedDefaults: {configurable: true}, defaults: {configurable: true}, Class: {configurable: true}, $: {configurable: true}};

      Swiper.prototype.slidesPerViewDynamic = function slidesPerViewDynamic() {
        var swiper = this;
        var params = swiper.params;
        var slides = swiper.slides;
        var slidesGrid = swiper.slidesGrid;
        var swiperSize = swiper.size;
        var activeIndex = swiper.activeIndex;
        var spv = 1;
        if (params.centeredSlides) {
          var slideSize = slides[activeIndex].swiperSlideSize;
          var breakLoop;
          for (var i = activeIndex + 1; i < slides.length; i += 1) {
            if (slides[i] && !breakLoop) {
              slideSize += slides[i].swiperSlideSize;
              spv += 1;
              if (slideSize > swiperSize) {
                breakLoop = true;
              }
            }
          }
          for (var i$1 = activeIndex - 1; i$1 >= 0; i$1 -= 1) {
            if (slides[i$1] && !breakLoop) {
              slideSize += slides[i$1].swiperSlideSize;
              spv += 1;
              if (slideSize > swiperSize) {
                breakLoop = true;
              }
            }
          }
        } else {
          for (var i$2 = activeIndex + 1; i$2 < slides.length; i$2 += 1) {
            if (slidesGrid[i$2] - slidesGrid[activeIndex] < swiperSize) {
              spv += 1;
            }
          }
        }
        return spv;
      };

      Swiper.prototype.update = function update() {
        var swiper = this;
        if (!swiper || swiper.destroyed) {
          return;
        }
        var snapGrid = swiper.snapGrid;
        var params = swiper.params;
        // Breakpoints
        if (params.breakpoints) {
          swiper.setBreakpoint();
        }
        swiper.updateSize();
        swiper.updateSlides();
        swiper.updateProgress();
        swiper.updateSlidesClasses();

        function setTranslate() {
          var translateValue = swiper.rtlTranslate ? swiper.translate * -1 : swiper.translate;
          var newTranslate = Math.min(Math.max(translateValue, swiper.maxTranslate()), swiper.minTranslate());
          swiper.setTranslate(newTranslate);
          swiper.updateActiveIndex();
          swiper.updateSlidesClasses();
        }

        var translated;
        if (swiper.params.freeMode) {
          setTranslate();
          if (swiper.params.autoHeight) {
            swiper.updateAutoHeight();
          }
        } else {
          if ((swiper.params.slidesPerView === 'auto' || swiper.params.slidesPerView > 1) && swiper.isEnd && !swiper.params.centeredSlides) {
            translated = swiper.slideTo(swiper.slides.length - 1, 0, false, true);
          } else {
            translated = swiper.slideTo(swiper.activeIndex, 0, false, true);
          }
          if (!translated) {
            setTranslate();
          }
        }
        if (params.watchOverflow && snapGrid !== swiper.snapGrid) {
          swiper.checkOverflow();
        }
        swiper.emit('update');
      };

      Swiper.prototype.changeDirection = function changeDirection(newDirection, needUpdate) {
        if (needUpdate === void 0) needUpdate = true;

        var swiper = this;
        var currentDirection = swiper.params.direction;
        if (!newDirection) {
          // eslint-disable-next-line
          newDirection = currentDirection === 'horizontal' ? 'vertical' : 'horizontal';
        }
        if ((newDirection === currentDirection) || (newDirection !== 'horizontal' && newDirection !== 'vertical')) {
          return swiper;
        }

        if (currentDirection === 'vertical') {
          swiper.$el
            .removeClass(((swiper.params.containerModifierClass) + "vertical wp8-vertical"))
            .addClass(("" + (swiper.params.containerModifierClass) + newDirection));

          if ((Browser.isIE || Browser.isEdge) && (Support.pointerEvents || Support.prefixedPointerEvents)) {
            swiper.$el.addClass(((swiper.params.containerModifierClass) + "wp8-" + newDirection));
          }
        }
        if (currentDirection === 'horizontal') {
          swiper.$el
            .removeClass(((swiper.params.containerModifierClass) + "horizontal wp8-horizontal"))
            .addClass(("" + (swiper.params.containerModifierClass) + newDirection));

          if ((Browser.isIE || Browser.isEdge) && (Support.pointerEvents || Support.prefixedPointerEvents)) {
            swiper.$el.addClass(((swiper.params.containerModifierClass) + "wp8-" + newDirection));
          }
        }

        swiper.params.direction = newDirection;

        swiper.slides.each(function (slideIndex, slideEl) {
          if (newDirection === 'vertical') {
            slideEl.style.width = '';
          } else {
            slideEl.style.height = '';
          }
        });

        swiper.emit('changeDirection');
        if (needUpdate) {
          swiper.update();
        }

        return swiper;
      };

      Swiper.prototype.init = function init() {
        var swiper = this;
        if (swiper.initialized) {
          return;
        }

        swiper.emit('beforeInit');

        // Set breakpoint
        if (swiper.params.breakpoints) {
          swiper.setBreakpoint();
        }

        // Add Classes
        swiper.addClasses();

        // Create loop
        if (swiper.params.loop) {
          swiper.loopCreate();
        }

        // Update size
        swiper.updateSize();

        // Update slides
        swiper.updateSlides();

        if (swiper.params.watchOverflow) {
          swiper.checkOverflow();
        }

        // Set Grab Cursor
        if (swiper.params.grabCursor) {
          swiper.setGrabCursor();
        }

        if (swiper.params.preloadImages) {
          swiper.preloadImages();
        }

        // Slide To Initial Slide
        if (swiper.params.loop) {
          swiper.slideTo(swiper.params.initialSlide + swiper.loopedSlides, 0, swiper.params.runCallbacksOnInit);
        } else {
          swiper.slideTo(swiper.params.initialSlide, 0, swiper.params.runCallbacksOnInit);
        }

        // Attach events
        swiper.attachEvents();

        // Init Flag
        swiper.initialized = true;

        // Emit
        swiper.emit('init');
      };

      Swiper.prototype.destroy = function destroy(deleteInstance, cleanStyles) {
        if (deleteInstance === void 0) deleteInstance = true;
        if (cleanStyles === void 0) cleanStyles = true;

        var swiper = this;
        var params = swiper.params;
        var $el = swiper.$el;
        var $wrapperEl = swiper.$wrapperEl;
        var slides = swiper.slides;

        if (typeof swiper.params === 'undefined' || swiper.destroyed) {
          return null;
        }

        swiper.emit('beforeDestroy');

        // Init Flag
        swiper.initialized = false;

        // Detach events
        swiper.detachEvents();

        // Destroy loop
        if (params.loop) {
          swiper.loopDestroy();
        }

        // Cleanup styles
        if (cleanStyles) {
          swiper.removeClasses();
          $el.removeAttr('style');
          $wrapperEl.removeAttr('style');
          if (slides && slides.length) {
            slides
              .removeClass([
                params.slideVisibleClass,
                params.slideActiveClass,
                params.slideNextClass,
                params.slidePrevClass].join(' '))
              .removeAttr('style')
              .removeAttr('data-swiper-slide-index')
              .removeAttr('data-swiper-column')
              .removeAttr('data-swiper-row');
          }
        }

        swiper.emit('destroy');

        // Detach emitter events
        Object.keys(swiper.eventsListeners).forEach(function (eventName) {
          swiper.off(eventName);
        });

        if (deleteInstance !== false) {
          swiper.$el[0].swiper = null;
          swiper.$el.data('swiper', null);
          Utils.deleteProps(swiper);
        }
        swiper.destroyed = true;

        return null;
      };

      Swiper.extendDefaults = function extendDefaults(newDefaults) {
        Utils.extend(extendedDefaults, newDefaults);
      };

      staticAccessors.extendedDefaults.get = function () {
        return extendedDefaults;
      };

      staticAccessors.defaults.get = function () {
        return defaults;
      };

      staticAccessors.Class.get = function () {
        return SwiperClass;
      };

      staticAccessors.$.get = function () {
        return $;
      };

      Object.defineProperties(Swiper, staticAccessors);

      return Swiper;
    }(SwiperClass));

    var Device$1 = {
      name: 'device',
      proto: {
        device: Device,
      },
      static: {
        device: Device,
      },
    };

    var Support$1 = {
      name: 'support',
      proto: {
        support: Support,
      },
      static: {
        support: Support,
      },
    };

    var Browser$1 = {
      name: 'browser',
      proto: {
        browser: Browser,
      },
      static: {
        browser: Browser,
      },
    };

    var Resize = {
      name: 'resize',
      create: function create() {
        var swiper = this;
        Utils.extend(swiper, {
          resize: {
            resizeHandler: function resizeHandler() {
              if (!swiper || swiper.destroyed || !swiper.initialized) {
                return;
              }
              swiper.emit('beforeResize');
              swiper.emit('resize');
            },
            orientationChangeHandler: function orientationChangeHandler() {
              if (!swiper || swiper.destroyed || !swiper.initialized) {
                return;
              }
              swiper.emit('orientationchange');
            },
          },
        });
      },
      on: {
        init: function init() {
          var swiper = this;
          // Emit resize
          win.addEventListener('resize', swiper.resize.resizeHandler);

          // Emit orientationchange
          win.addEventListener('orientationchange', swiper.resize.orientationChangeHandler);
        },
        destroy: function destroy() {
          var swiper = this;
          win.removeEventListener('resize', swiper.resize.resizeHandler);
          win.removeEventListener('orientationchange', swiper.resize.orientationChangeHandler);
        },
      },
    };

    var Observer = {
      func: win.MutationObserver || win.WebkitMutationObserver,
      attach: function attach(target, options) {
        if (options === void 0) options = {};

        var swiper = this;

        var ObserverFunc = Observer.func;
        var observer = new ObserverFunc(function (mutations) {
          // The observerUpdate event should only be triggered
          // once despite the number of mutations.  Additional
          // triggers are redundant and are very costly
          if (mutations.length === 1) {
            swiper.emit('observerUpdate', mutations[0]);
            return;
          }
          var observerUpdate = function observerUpdate() {
            swiper.emit('observerUpdate', mutations[0]);
          };

          if (win.requestAnimationFrame) {
            win.requestAnimationFrame(observerUpdate);
          } else {
            win.setTimeout(observerUpdate, 0);
          }
        });

        observer.observe(target, {
          attributes: typeof options.attributes === 'undefined' ? true : options.attributes,
          childList: typeof options.childList === 'undefined' ? true : options.childList,
          characterData: typeof options.characterData === 'undefined' ? true : options.characterData,
        });

        swiper.observer.observers.push(observer);
      },
      init: function init() {
        var swiper = this;
        if (!Support.observer || !swiper.params.observer) {
          return;
        }
        if (swiper.params.observeParents) {
          var containerParents = swiper.$el.parents();
          for (var i = 0; i < containerParents.length; i += 1) {
            swiper.observer.attach(containerParents[i]);
          }
        }
        // Observe container
        swiper.observer.attach(swiper.$el[0], {childList: swiper.params.observeSlideChildren});

        // Observe wrapper
        swiper.observer.attach(swiper.$wrapperEl[0], {attributes: false});
      },
      destroy: function destroy() {
        var swiper = this;
        swiper.observer.observers.forEach(function (observer) {
          observer.disconnect();
        });
        swiper.observer.observers = [];
      },
    };

    var Observer$1 = {
      name: 'observer',
      params: {
        observer: false,
        observeParents: false,
        observeSlideChildren: false,
      },
      create: function create() {
        var swiper = this;
        Utils.extend(swiper, {
          observer: {
            init: Observer.init.bind(swiper),
            attach: Observer.attach.bind(swiper),
            destroy: Observer.destroy.bind(swiper),
            observers: [],
          },
        });
      },
      on: {
        init: function init() {
          var swiper = this;
          swiper.observer.init();
        },
        destroy: function destroy() {
          var swiper = this;
          swiper.observer.destroy();
        },
      },
    };

    var Virtual = {
      update: function update(force) {
        var swiper = this;
        var ref = swiper.params;
        var slidesPerView = ref.slidesPerView;
        var slidesPerGroup = ref.slidesPerGroup;
        var centeredSlides = ref.centeredSlides;
        var ref$1 = swiper.params.virtual;
        var addSlidesBefore = ref$1.addSlidesBefore;
        var addSlidesAfter = ref$1.addSlidesAfter;
        var ref$2 = swiper.virtual;
        var previousFrom = ref$2.from;
        var previousTo = ref$2.to;
        var slides = ref$2.slides;
        var previousSlidesGrid = ref$2.slidesGrid;
        var renderSlide = ref$2.renderSlide;
        var previousOffset = ref$2.offset;
        swiper.updateActiveIndex();
        var activeIndex = swiper.activeIndex || 0;

        var offsetProp;
        if (swiper.rtlTranslate) {
          offsetProp = 'right';
        } else {
          offsetProp = swiper.isHorizontal() ? 'left' : 'top';
        }

        var slidesAfter;
        var slidesBefore;
        if (centeredSlides) {
          slidesAfter = Math.floor(slidesPerView / 2) + slidesPerGroup + addSlidesBefore;
          slidesBefore = Math.floor(slidesPerView / 2) + slidesPerGroup + addSlidesAfter;
        } else {
          slidesAfter = slidesPerView + (slidesPerGroup - 1) + addSlidesBefore;
          slidesBefore = slidesPerGroup + addSlidesAfter;
        }
        var from = Math.max((activeIndex || 0) - slidesBefore, 0);
        var to = Math.min((activeIndex || 0) + slidesAfter, slides.length - 1);
        var offset = (swiper.slidesGrid[from] || 0) - (swiper.slidesGrid[0] || 0);

        Utils.extend(swiper.virtual, {
          from: from,
          to: to,
          offset: offset,
          slidesGrid: swiper.slidesGrid,
        });

        function onRendered() {
          swiper.updateSlides();
          swiper.updateProgress();
          swiper.updateSlidesClasses();
          if (swiper.lazy && swiper.params.lazy.enabled) {
            swiper.lazy.load();
          }
        }

        if (previousFrom === from && previousTo === to && !force) {
          if (swiper.slidesGrid !== previousSlidesGrid && offset !== previousOffset) {
            swiper.slides.css(offsetProp, (offset + "px"));
          }
          swiper.updateProgress();
          return;
        }
        if (swiper.params.virtual.renderExternal) {
          swiper.params.virtual.renderExternal.call(swiper, {
            offset: offset,
            from: from,
            to: to,
            slides: (function getSlides() {
              var slidesToRender = [];
              for (var i = from; i <= to; i += 1) {
                slidesToRender.push(slides[i]);
              }
              return slidesToRender;
            }()),
          });
          onRendered();
          return;
        }
        var prependIndexes = [];
        var appendIndexes = [];
        if (force) {
          swiper.$wrapperEl.find(("." + (swiper.params.slideClass))).remove();
        } else {
          for (var i = previousFrom; i <= previousTo; i += 1) {
            if (i < from || i > to) {
              swiper.$wrapperEl.find(("." + (swiper.params.slideClass) + "[data-swiper-slide-index=\"" + i + "\"]")).remove();
            }
          }
        }
        for (var i$1 = 0; i$1 < slides.length; i$1 += 1) {
          if (i$1 >= from && i$1 <= to) {
            if (typeof previousTo === 'undefined' || force) {
              appendIndexes.push(i$1);
            } else {
              if (i$1 > previousTo) {
                appendIndexes.push(i$1);
              }
              if (i$1 < previousFrom) {
                prependIndexes.push(i$1);
              }
            }
          }
        }
        appendIndexes.forEach(function (index) {
          swiper.$wrapperEl.append(renderSlide(slides[index], index));
        });
        prependIndexes.sort(function (a, b) {
          return b - a;
        }).forEach(function (index) {
          swiper.$wrapperEl.prepend(renderSlide(slides[index], index));
        });
        swiper.$wrapperEl.children('.swiper-slide').css(offsetProp, (offset + "px"));
        onRendered();
      },
      renderSlide: function renderSlide(slide, index) {
        var swiper = this;
        var params = swiper.params.virtual;
        if (params.cache && swiper.virtual.cache[index]) {
          return swiper.virtual.cache[index];
        }
        var $slideEl = params.renderSlide
          ? $(params.renderSlide.call(swiper, slide, index))
          : $(("<div class=\"" + (swiper.params.slideClass) + "\" data-swiper-slide-index=\"" + index + "\">" + slide + "</div>"));
        if (!$slideEl.attr('data-swiper-slide-index')) {
          $slideEl.attr('data-swiper-slide-index', index);
        }
        if (params.cache) {
          swiper.virtual.cache[index] = $slideEl;
        }
        return $slideEl;
      },
      appendSlide: function appendSlide(slides) {
        var swiper = this;
        if (typeof slides === 'object' && 'length' in slides) {
          for (var i = 0; i < slides.length; i += 1) {
            if (slides[i]) {
              swiper.virtual.slides.push(slides[i]);
            }
          }
        } else {
          swiper.virtual.slides.push(slides);
        }
        swiper.virtual.update(true);
      },
      prependSlide: function prependSlide(slides) {
        var swiper = this;
        var activeIndex = swiper.activeIndex;
        var newActiveIndex = activeIndex + 1;
        var numberOfNewSlides = 1;

        if (Array.isArray(slides)) {
          for (var i = 0; i < slides.length; i += 1) {
            if (slides[i]) {
              swiper.virtual.slides.unshift(slides[i]);
            }
          }
          newActiveIndex = activeIndex + slides.length;
          numberOfNewSlides = slides.length;
        } else {
          swiper.virtual.slides.unshift(slides);
        }
        if (swiper.params.virtual.cache) {
          var cache = swiper.virtual.cache;
          var newCache = {};
          Object.keys(cache).forEach(function (cachedIndex) {
            newCache[parseInt(cachedIndex, 10) + numberOfNewSlides] = cache[cachedIndex];
          });
          swiper.virtual.cache = newCache;
        }
        swiper.virtual.update(true);
        swiper.slideTo(newActiveIndex, 0);
      },
      removeSlide: function removeSlide(slidesIndexes) {
        var swiper = this;
        if (typeof slidesIndexes === 'undefined' || slidesIndexes === null) {
          return;
        }
        var activeIndex = swiper.activeIndex;
        if (Array.isArray(slidesIndexes)) {
          for (var i = slidesIndexes.length - 1; i >= 0; i -= 1) {
            swiper.virtual.slides.splice(slidesIndexes[i], 1);
            if (swiper.params.virtual.cache) {
              delete swiper.virtual.cache[slidesIndexes[i]];
            }
            if (slidesIndexes[i] < activeIndex) {
              activeIndex -= 1;
            }
            activeIndex = Math.max(activeIndex, 0);
          }
        } else {
          swiper.virtual.slides.splice(slidesIndexes, 1);
          if (swiper.params.virtual.cache) {
            delete swiper.virtual.cache[slidesIndexes];
          }
          if (slidesIndexes < activeIndex) {
            activeIndex -= 1;
          }
          activeIndex = Math.max(activeIndex, 0);
        }
        swiper.virtual.update(true);
        swiper.slideTo(activeIndex, 0);
      },
      removeAllSlides: function removeAllSlides() {
        var swiper = this;
        swiper.virtual.slides = [];
        if (swiper.params.virtual.cache) {
          swiper.virtual.cache = {};
        }
        swiper.virtual.update(true);
        swiper.slideTo(0, 0);
      },
    };

    var Virtual$1 = {
      name: 'virtual',
      params: {
        virtual: {
          enabled: false,
          slides: [],
          cache: true,
          renderSlide: null,
          renderExternal: null,
          addSlidesBefore: 0,
          addSlidesAfter: 0,
        },
      },
      create: function create() {
        var swiper = this;
        Utils.extend(swiper, {
          virtual: {
            update: Virtual.update.bind(swiper),
            appendSlide: Virtual.appendSlide.bind(swiper),
            prependSlide: Virtual.prependSlide.bind(swiper),
            removeSlide: Virtual.removeSlide.bind(swiper),
            removeAllSlides: Virtual.removeAllSlides.bind(swiper),
            renderSlide: Virtual.renderSlide.bind(swiper),
            slides: swiper.params.virtual.slides,
            cache: {},
          },
        });
      },
      on: {
        beforeInit: function beforeInit() {
          var swiper = this;
          if (!swiper.params.virtual.enabled) {
            return;
          }
          swiper.classNames.push(((swiper.params.containerModifierClass) + "virtual"));
          var overwriteParams = {
            watchSlidesProgress: true,
          };
          Utils.extend(swiper.params, overwriteParams);
          Utils.extend(swiper.originalParams, overwriteParams);

          if (!swiper.params.initialSlide) {
            swiper.virtual.update();
          }
        },
        setTranslate: function setTranslate() {
          var swiper = this;
          if (!swiper.params.virtual.enabled) {
            return;
          }
          swiper.virtual.update();
        },
      },
    };

    var Keyboard = {
      handle: function handle(event) {
        var swiper = this;
        var rtl = swiper.rtlTranslate;
        var e = event;
        if (e.originalEvent) {
          e = e.originalEvent;
        } // jquery fix
        var kc = e.keyCode || e.charCode;
        // Directions locks
        if (!swiper.allowSlideNext && ((swiper.isHorizontal() && kc === 39) || (swiper.isVertical() && kc === 40))) {
          return false;
        }
        if (!swiper.allowSlidePrev && ((swiper.isHorizontal() && kc === 37) || (swiper.isVertical() && kc === 38))) {
          return false;
        }
        if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) {
          return undefined;
        }
        if (doc.activeElement && doc.activeElement.nodeName && (doc.activeElement.nodeName.toLowerCase() === 'input' || doc.activeElement.nodeName.toLowerCase() === 'textarea')) {
          return undefined;
        }
        if (swiper.params.keyboard.onlyInViewport && (kc === 37 || kc === 39 || kc === 38 || kc === 40)) {
          var inView = false;
          // Check that swiper should be inside of visible area of window
          if (swiper.$el.parents(("." + (swiper.params.slideClass))).length > 0 && swiper.$el.parents(("." + (swiper.params.slideActiveClass))).length === 0) {
            return undefined;
          }
          var windowWidth = win.innerWidth;
          var windowHeight = win.innerHeight;
          var swiperOffset = swiper.$el.offset();
          if (rtl) {
            swiperOffset.left -= swiper.$el[0].scrollLeft;
          }
          var swiperCoord = [
            [swiperOffset.left, swiperOffset.top],
            [swiperOffset.left + swiper.width, swiperOffset.top],
            [swiperOffset.left, swiperOffset.top + swiper.height],
            [swiperOffset.left + swiper.width, swiperOffset.top + swiper.height]];
          for (var i = 0; i < swiperCoord.length; i += 1) {
            var point = swiperCoord[i];
            if (
              point[0] >= 0 && point[0] <= windowWidth
              && point[1] >= 0 && point[1] <= windowHeight
            ) {
              inView = true;
            }
          }
          if (!inView) {
            return undefined;
          }
        }
        if (swiper.isHorizontal()) {
          if (kc === 37 || kc === 39) {
            if (e.preventDefault) {
              e.preventDefault();
            } else {
              e.returnValue = false;
            }
          }
          if ((kc === 39 && !rtl) || (kc === 37 && rtl)) {
            swiper.slideNext();
          }
          if ((kc === 37 && !rtl) || (kc === 39 && rtl)) {
            swiper.slidePrev();
          }
        } else {
          if (kc === 38 || kc === 40) {
            if (e.preventDefault) {
              e.preventDefault();
            } else {
              e.returnValue = false;
            }
          }
          if (kc === 40) {
            swiper.slideNext();
          }
          if (kc === 38) {
            swiper.slidePrev();
          }
        }
        swiper.emit('keyPress', kc);
        return undefined;
      },
      enable: function enable() {
        var swiper = this;
        if (swiper.keyboard.enabled) {
          return;
        }
        $(doc).on('keydown', swiper.keyboard.handle);
        swiper.keyboard.enabled = true;
      },
      disable: function disable() {
        var swiper = this;
        if (!swiper.keyboard.enabled) {
          return;
        }
        $(doc).off('keydown', swiper.keyboard.handle);
        swiper.keyboard.enabled = false;
      },
    };

    var Keyboard$1 = {
      name: 'keyboard',
      params: {
        keyboard: {
          enabled: false,
          onlyInViewport: true,
        },
      },
      create: function create() {
        var swiper = this;
        Utils.extend(swiper, {
          keyboard: {
            enabled: false,
            enable: Keyboard.enable.bind(swiper),
            disable: Keyboard.disable.bind(swiper),
            handle: Keyboard.handle.bind(swiper),
          },
        });
      },
      on: {
        init: function init() {
          var swiper = this;
          if (swiper.params.keyboard.enabled) {
            swiper.keyboard.enable();
          }
        },
        destroy: function destroy() {
          var swiper = this;
          if (swiper.keyboard.enabled) {
            swiper.keyboard.disable();
          }
        },
      },
    };

    function isEventSupported() {
      var eventName = 'onwheel';
      var isSupported = eventName in doc;

      if (!isSupported) {
        var element = doc.createElement('div');
        element.setAttribute(eventName, 'return;');
        isSupported = typeof element[eventName] === 'function';
      }

      if (!isSupported
        && doc.implementation
        && doc.implementation.hasFeature
        // always returns true in newer browsers as per the standard.
        // @see http://dom.spec.whatwg.org/#dom-domimplementation-hasfeature
        && doc.implementation.hasFeature('', '') !== true
      ) {
        // This is the only way to test support for the `wheel` event in IE9+.
        isSupported = doc.implementation.hasFeature('Events.wheel', '3.0');
      }

      return isSupported;
    }

    var Mousewheel = {
      lastScrollTime: Utils.now(),
      event: (function getEvent() {
        if (win.navigator.userAgent.indexOf('firefox') > -1) {
          return 'DOMMouseScroll';
        }
        return isEventSupported() ? 'wheel' : 'mousewheel';
      }()),
      normalize: function normalize(e) {
        // Reasonable defaults
        var PIXEL_STEP = 10;
        var LINE_HEIGHT = 40;
        var PAGE_HEIGHT = 800;

        var sX = 0;
        var sY = 0; // spinX, spinY
        var pX = 0;
        var pY = 0; // pixelX, pixelY

        // Legacy
        if ('detail' in e) {
          sY = e.detail;
        }
        if ('wheelDelta' in e) {
          sY = -e.wheelDelta / 120;
        }
        if ('wheelDeltaY' in e) {
          sY = -e.wheelDeltaY / 120;
        }
        if ('wheelDeltaX' in e) {
          sX = -e.wheelDeltaX / 120;
        }

        // side scrolling on FF with DOMMouseScroll
        if ('axis' in e && e.axis === e.HORIZONTAL_AXIS) {
          sX = sY;
          sY = 0;
        }

        pX = sX * PIXEL_STEP;
        pY = sY * PIXEL_STEP;

        if ('deltaY' in e) {
          pY = e.deltaY;
        }
        if ('deltaX' in e) {
          pX = e.deltaX;
        }

        if ((pX || pY) && e.deltaMode) {
          if (e.deltaMode === 1) { // delta in LINE units
            pX *= LINE_HEIGHT;
            pY *= LINE_HEIGHT;
          } else { // delta in PAGE units
            pX *= PAGE_HEIGHT;
            pY *= PAGE_HEIGHT;
          }
        }

        // Fall-back if spin cannot be determined
        if (pX && !sX) {
          sX = (pX < 1) ? -1 : 1;
        }
        if (pY && !sY) {
          sY = (pY < 1) ? -1 : 1;
        }

        return {
          spinX: sX,
          spinY: sY,
          pixelX: pX,
          pixelY: pY,
        };
      },
      handleMouseEnter: function handleMouseEnter() {
        var swiper = this;
        swiper.mouseEntered = true;
      },
      handleMouseLeave: function handleMouseLeave() {
        var swiper = this;
        swiper.mouseEntered = false;
      },
      handle: function handle(event) {
        var e = event;
        var swiper = this;
        var params = swiper.params.mousewheel;

        if (!swiper.mouseEntered && !params.releaseOnEdges) {
          return true;
        }

        if (e.originalEvent) {
          e = e.originalEvent;
        } // jquery fix
        var delta = 0;
        var rtlFactor = swiper.rtlTranslate ? -1 : 1;

        var data = Mousewheel.normalize(e);

        if (params.forceToAxis) {
          if (swiper.isHorizontal()) {
            if (Math.abs(data.pixelX) > Math.abs(data.pixelY)) {
              delta = data.pixelX * rtlFactor;
            } else {
              return true;
            }
          } else if (Math.abs(data.pixelY) > Math.abs(data.pixelX)) {
            delta = data.pixelY;
          } else {
            return true;
          }
        } else {
          delta = Math.abs(data.pixelX) > Math.abs(data.pixelY) ? -data.pixelX * rtlFactor : -data.pixelY;
        }

        if (delta === 0) {
          return true;
        }

        if (params.invert) {
          delta = -delta;
        }

        if (!swiper.params.freeMode) {
          if (Utils.now() - swiper.mousewheel.lastScrollTime > 60) {
            if (delta < 0) {
              if ((!swiper.isEnd || swiper.params.loop) && !swiper.animating) {
                swiper.slideNext();
                swiper.emit('scroll', e);
              } else if (params.releaseOnEdges) {
                return true;
              }
            } else if ((!swiper.isBeginning || swiper.params.loop) && !swiper.animating) {
              swiper.slidePrev();
              swiper.emit('scroll', e);
            } else if (params.releaseOnEdges) {
              return true;
            }
          }
          swiper.mousewheel.lastScrollTime = (new win.Date()).getTime();
        } else {
          // Freemode or scrollContainer:
          if (swiper.params.loop) {
            swiper.loopFix();
          }
          var position = swiper.getTranslate() + (delta * params.sensitivity);
          var wasBeginning = swiper.isBeginning;
          var wasEnd = swiper.isEnd;

          if (position >= swiper.minTranslate()) {
            position = swiper.minTranslate();
          }
          if (position <= swiper.maxTranslate()) {
            position = swiper.maxTranslate();
          }

          swiper.setTransition(0);
          swiper.setTranslate(position);
          swiper.updateProgress();
          swiper.updateActiveIndex();
          swiper.updateSlidesClasses();

          if ((!wasBeginning && swiper.isBeginning) || (!wasEnd && swiper.isEnd)) {
            swiper.updateSlidesClasses();
          }

          if (swiper.params.freeModeSticky) {
            clearTimeout(swiper.mousewheel.timeout);
            swiper.mousewheel.timeout = Utils.nextTick(function () {
              swiper.slideToClosest();
            }, 300);
          }
          // Emit event
          swiper.emit('scroll', e);

          // Stop autoplay
          if (swiper.params.autoplay && swiper.params.autoplayDisableOnInteraction) {
            swiper.autoplay.stop();
          }
          // Return page scroll on edge positions
          if (position === swiper.minTranslate() || position === swiper.maxTranslate()) {
            return true;
          }
        }

        if (e.preventDefault) {
          e.preventDefault();
        } else {
          e.returnValue = false;
        }
        return false;
      },
      enable: function enable() {
        var swiper = this;
        if (!Mousewheel.event) {
          return false;
        }
        if (swiper.mousewheel.enabled) {
          return false;
        }
        var target = swiper.$el;
        if (swiper.params.mousewheel.eventsTarged !== 'container') {
          target = $(swiper.params.mousewheel.eventsTarged);
        }
        target.on('mouseenter', swiper.mousewheel.handleMouseEnter);
        target.on('mouseleave', swiper.mousewheel.handleMouseLeave);
        target.on(Mousewheel.event, swiper.mousewheel.handle);
        swiper.mousewheel.enabled = true;
        return true;
      },
      disable: function disable() {
        var swiper = this;
        if (!Mousewheel.event) {
          return false;
        }
        if (!swiper.mousewheel.enabled) {
          return false;
        }
        var target = swiper.$el;
        if (swiper.params.mousewheel.eventsTarged !== 'container') {
          target = $(swiper.params.mousewheel.eventsTarged);
        }
        target.off(Mousewheel.event, swiper.mousewheel.handle);
        swiper.mousewheel.enabled = false;
        return true;
      },
    };

    var Mousewheel$1 = {
      name: 'mousewheel',
      params: {
        mousewheel: {
          enabled: false,
          releaseOnEdges: false,
          invert: false,
          forceToAxis: false,
          sensitivity: 1,
          eventsTarged: 'container',
        },
      },
      create: function create() {
        var swiper = this;
        Utils.extend(swiper, {
          mousewheel: {
            enabled: false,
            enable: Mousewheel.enable.bind(swiper),
            disable: Mousewheel.disable.bind(swiper),
            handle: Mousewheel.handle.bind(swiper),
            handleMouseEnter: Mousewheel.handleMouseEnter.bind(swiper),
            handleMouseLeave: Mousewheel.handleMouseLeave.bind(swiper),
            lastScrollTime: Utils.now(),
          },
        });
      },
      on: {
        init: function init() {
          var swiper = this;
          if (swiper.params.mousewheel.enabled) {
            swiper.mousewheel.enable();
          }
        },
        destroy: function destroy() {
          var swiper = this;
          if (swiper.mousewheel.enabled) {
            swiper.mousewheel.disable();
          }
        },
      },
    };

    var Navigation = {
      update: function update() {
        // Update Navigation Buttons
        var swiper = this;
        var params = swiper.params.navigation;

        if (swiper.params.loop) {
          return;
        }
        var ref = swiper.navigation;
        var $nextEl = ref.$nextEl;
        var $prevEl = ref.$prevEl;

        if ($prevEl && $prevEl.length > 0) {
          if (swiper.isBeginning) {
            $prevEl.addClass(params.disabledClass);
          } else {
            $prevEl.removeClass(params.disabledClass);
          }
          $prevEl[swiper.params.watchOverflow && swiper.isLocked ? 'addClass' : 'removeClass'](params.lockClass);
        }
        if ($nextEl && $nextEl.length > 0) {
          if (swiper.isEnd) {
            $nextEl.addClass(params.disabledClass);
          } else {
            $nextEl.removeClass(params.disabledClass);
          }
          $nextEl[swiper.params.watchOverflow && swiper.isLocked ? 'addClass' : 'removeClass'](params.lockClass);
        }
      },
      onPrevClick: function onPrevClick(e) {
        var swiper = this;
        e.preventDefault();
        if (swiper.isBeginning && !swiper.params.loop) {
          return;
        }
        swiper.slidePrev();
      },
      onNextClick: function onNextClick(e) {
        var swiper = this;
        e.preventDefault();
        if (swiper.isEnd && !swiper.params.loop) {
          return;
        }
        swiper.slideNext();
      },
      init: function init() {
        var swiper = this;
        var params = swiper.params.navigation;
        if (!(params.nextEl || params.prevEl)) {
          return;
        }

        var $nextEl;
        var $prevEl;
        if (params.nextEl) {
          $nextEl = $(params.nextEl);
          if (
            swiper.params.uniqueNavElements
            && typeof params.nextEl === 'string'
            && $nextEl.length > 1
            && swiper.$el.find(params.nextEl).length === 1
          ) {
            $nextEl = swiper.$el.find(params.nextEl);
          }
        }
        if (params.prevEl) {
          $prevEl = $(params.prevEl);
          if (
            swiper.params.uniqueNavElements
            && typeof params.prevEl === 'string'
            && $prevEl.length > 1
            && swiper.$el.find(params.prevEl).length === 1
          ) {
            $prevEl = swiper.$el.find(params.prevEl);
          }
        }

        if ($nextEl && $nextEl.length > 0) {
          $nextEl.on('click', swiper.navigation.onNextClick);
        }
        if ($prevEl && $prevEl.length > 0) {
          $prevEl.on('click', swiper.navigation.onPrevClick);
        }

        Utils.extend(swiper.navigation, {
          $nextEl: $nextEl,
          nextEl: $nextEl && $nextEl[0],
          $prevEl: $prevEl,
          prevEl: $prevEl && $prevEl[0],
        });
      },
      destroy: function destroy() {
        var swiper = this;
        var ref = swiper.navigation;
        var $nextEl = ref.$nextEl;
        var $prevEl = ref.$prevEl;
        if ($nextEl && $nextEl.length) {
          $nextEl.off('click', swiper.navigation.onNextClick);
          $nextEl.removeClass(swiper.params.navigation.disabledClass);
        }
        if ($prevEl && $prevEl.length) {
          $prevEl.off('click', swiper.navigation.onPrevClick);
          $prevEl.removeClass(swiper.params.navigation.disabledClass);
        }
      },
    };

    var Navigation$1 = {
      name: 'navigation',
      params: {
        navigation: {
          nextEl: null,
          prevEl: null,

          hideOnClick: false,
          disabledClass: 'swiper-button-disabled',
          hiddenClass: 'swiper-button-hidden',
          lockClass: 'swiper-button-lock',
        },
      },
      create: function create() {
        var swiper = this;
        Utils.extend(swiper, {
          navigation: {
            init: Navigation.init.bind(swiper),
            update: Navigation.update.bind(swiper),
            destroy: Navigation.destroy.bind(swiper),
            onNextClick: Navigation.onNextClick.bind(swiper),
            onPrevClick: Navigation.onPrevClick.bind(swiper),
          },
        });
      },
      on: {
        init: function init() {
          var swiper = this;
          swiper.navigation.init();
          swiper.navigation.update();
        },
        toEdge: function toEdge() {
          var swiper = this;
          swiper.navigation.update();
        },
        fromEdge: function fromEdge() {
          var swiper = this;
          swiper.navigation.update();
        },
        destroy: function destroy() {
          var swiper = this;
          swiper.navigation.destroy();
        },
        click: function click(e) {
          var swiper = this;
          var ref = swiper.navigation;
          var $nextEl = ref.$nextEl;
          var $prevEl = ref.$prevEl;
          if (
            swiper.params.navigation.hideOnClick
            && !$(e.target).is($prevEl)
            && !$(e.target).is($nextEl)
          ) {
            var isHidden;
            if ($nextEl) {
              isHidden = $nextEl.hasClass(swiper.params.navigation.hiddenClass);
            } else if ($prevEl) {
              isHidden = $prevEl.hasClass(swiper.params.navigation.hiddenClass);
            }
            if (isHidden === true) {
              swiper.emit('navigationShow', swiper);
            } else {
              swiper.emit('navigationHide', swiper);
            }
            if ($nextEl) {
              $nextEl.toggleClass(swiper.params.navigation.hiddenClass);
            }
            if ($prevEl) {
              $prevEl.toggleClass(swiper.params.navigation.hiddenClass);
            }
          }
        },
      },
    };

    var Pagination = {
      update: function update() {
        // Render || Update Pagination bullets/items
        var swiper = this;
        var rtl = swiper.rtl;
        var params = swiper.params.pagination;
        if (!params.el || !swiper.pagination.el || !swiper.pagination.$el || swiper.pagination.$el.length === 0) {
          return;
        }
        var slidesLength = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.slides.length : swiper.slides.length;
        var $el = swiper.pagination.$el;
        // Current/Total
        var current;
        var total = swiper.params.loop ? Math.ceil((slidesLength - (swiper.loopedSlides * 2)) / swiper.params.slidesPerGroup) : swiper.snapGrid.length;
        if (swiper.params.loop) {
          current = Math.ceil((swiper.activeIndex - swiper.loopedSlides) / swiper.params.slidesPerGroup);
          if (current > slidesLength - 1 - (swiper.loopedSlides * 2)) {
            current -= (slidesLength - (swiper.loopedSlides * 2));
          }
          if (current > total - 1) {
            current -= total;
          }
          if (current < 0 && swiper.params.paginationType !== 'bullets') {
            current = total + current;
          }
        } else if (typeof swiper.snapIndex !== 'undefined') {
          current = swiper.snapIndex;
        } else {
          current = swiper.activeIndex || 0;
        }
        // Types
        if (params.type === 'bullets' && swiper.pagination.bullets && swiper.pagination.bullets.length > 0) {
          var bullets = swiper.pagination.bullets;
          var firstIndex;
          var lastIndex;
          var midIndex;
          if (params.dynamicBullets) {
            swiper.pagination.bulletSize = bullets.eq(0)[swiper.isHorizontal() ? 'outerWidth' : 'outerHeight'](true);
            $el.css(swiper.isHorizontal() ? 'width' : 'height', ((swiper.pagination.bulletSize * (params.dynamicMainBullets + 4)) + "px"));
            if (params.dynamicMainBullets > 1 && swiper.previousIndex !== undefined) {
              swiper.pagination.dynamicBulletIndex += (current - swiper.previousIndex);
              if (swiper.pagination.dynamicBulletIndex > (params.dynamicMainBullets - 1)) {
                swiper.pagination.dynamicBulletIndex = params.dynamicMainBullets - 1;
              } else if (swiper.pagination.dynamicBulletIndex < 0) {
                swiper.pagination.dynamicBulletIndex = 0;
              }
            }
            firstIndex = current - swiper.pagination.dynamicBulletIndex;
            lastIndex = firstIndex + (Math.min(bullets.length, params.dynamicMainBullets) - 1);
            midIndex = (lastIndex + firstIndex) / 2;
          }
          bullets.removeClass(((params.bulletActiveClass) + " " + (params.bulletActiveClass) + "-next " + (params.bulletActiveClass) + "-next-next " + (params.bulletActiveClass) + "-prev " + (params.bulletActiveClass) + "-prev-prev " + (params.bulletActiveClass) + "-main"));
          if ($el.length > 1) {
            bullets.each(function (index, bullet) {
              var $bullet = $(bullet);
              var bulletIndex = $bullet.index();
              if (bulletIndex === current) {
                $bullet.addClass(params.bulletActiveClass);
              }
              if (params.dynamicBullets) {
                if (bulletIndex >= firstIndex && bulletIndex <= lastIndex) {
                  $bullet.addClass(((params.bulletActiveClass) + "-main"));
                }
                if (bulletIndex === firstIndex) {
                  $bullet
                    .prev()
                    .addClass(((params.bulletActiveClass) + "-prev"))
                    .prev()
                    .addClass(((params.bulletActiveClass) + "-prev-prev"));
                }
                if (bulletIndex === lastIndex) {
                  $bullet
                    .next()
                    .addClass(((params.bulletActiveClass) + "-next"))
                    .next()
                    .addClass(((params.bulletActiveClass) + "-next-next"));
                }
              }
            });
          } else {
            var $bullet = bullets.eq(current);
            $bullet.addClass(params.bulletActiveClass);
            if (params.dynamicBullets) {
              var $firstDisplayedBullet = bullets.eq(firstIndex);
              var $lastDisplayedBullet = bullets.eq(lastIndex);
              for (var i = firstIndex; i <= lastIndex; i += 1) {
                bullets.eq(i).addClass(((params.bulletActiveClass) + "-main"));
              }
              $firstDisplayedBullet
                .prev()
                .addClass(((params.bulletActiveClass) + "-prev"))
                .prev()
                .addClass(((params.bulletActiveClass) + "-prev-prev"));
              $lastDisplayedBullet
                .next()
                .addClass(((params.bulletActiveClass) + "-next"))
                .next()
                .addClass(((params.bulletActiveClass) + "-next-next"));
            }
          }
          if (params.dynamicBullets) {
            var dynamicBulletsLength = Math.min(bullets.length, params.dynamicMainBullets + 4);
            var bulletsOffset = (((swiper.pagination.bulletSize * dynamicBulletsLength) - (swiper.pagination.bulletSize)) / 2) - (midIndex * swiper.pagination.bulletSize);
            var offsetProp = rtl ? 'right' : 'left';
            bullets.css(swiper.isHorizontal() ? offsetProp : 'top', (bulletsOffset + "px"));
          }
        }
        if (params.type === 'fraction') {
          $el.find(("." + (params.currentClass))).text(params.formatFractionCurrent(current + 1));
          $el.find(("." + (params.totalClass))).text(params.formatFractionTotal(total));
        }
        if (params.type === 'progressbar') {
          var progressbarDirection;
          if (params.progressbarOpposite) {
            progressbarDirection = swiper.isHorizontal() ? 'vertical' : 'horizontal';
          } else {
            progressbarDirection = swiper.isHorizontal() ? 'horizontal' : 'vertical';
          }
          var scale = (current + 1) / total;
          var scaleX = 1;
          var scaleY = 1;
          if (progressbarDirection === 'horizontal') {
            scaleX = scale;
          } else {
            scaleY = scale;
          }
          $el.find(("." + (params.progressbarFillClass))).transform(("translate3d(0,0,0) scaleX(" + scaleX + ") scaleY(" + scaleY + ")")).transition(swiper.params.speed);
        }
        if (params.type === 'custom' && params.renderCustom) {
          $el.html(params.renderCustom(swiper, current + 1, total));
          swiper.emit('paginationRender', swiper, $el[0]);
        } else {
          swiper.emit('paginationUpdate', swiper, $el[0]);
        }
        $el[swiper.params.watchOverflow && swiper.isLocked ? 'addClass' : 'removeClass'](params.lockClass);
      },
      render: function render() {
        // Render Container
        var swiper = this;
        var params = swiper.params.pagination;
        if (!params.el || !swiper.pagination.el || !swiper.pagination.$el || swiper.pagination.$el.length === 0) {
          return;
        }
        var slidesLength = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.slides.length : swiper.slides.length;

        var $el = swiper.pagination.$el;
        var paginationHTML = '';
        if (params.type === 'bullets') {
          var numberOfBullets = swiper.params.loop ? Math.ceil((slidesLength - (swiper.loopedSlides * 2)) / swiper.params.slidesPerGroup) : swiper.snapGrid.length;
          for (var i = 0; i < numberOfBullets; i += 1) {
            if (params.renderBullet) {
              paginationHTML += params.renderBullet.call(swiper, i, params.bulletClass);
            } else {
              paginationHTML += "<" + (params.bulletElement) + " class=\"" + (params.bulletClass) + "\"></" + (params.bulletElement) + ">";
            }
          }
          $el.html(paginationHTML);
          swiper.pagination.bullets = $el.find(("." + (params.bulletClass)));
        }
        if (params.type === 'fraction') {
          if (params.renderFraction) {
            paginationHTML = params.renderFraction.call(swiper, params.currentClass, params.totalClass);
          } else {
            paginationHTML = "<span class=\"" + (params.currentClass) + "\"></span>"
              + ' / '
              + "<span class=\"" + (params.totalClass) + "\"></span>";
          }
          $el.html(paginationHTML);
        }
        if (params.type === 'progressbar') {
          if (params.renderProgressbar) {
            paginationHTML = params.renderProgressbar.call(swiper, params.progressbarFillClass);
          } else {
            paginationHTML = "<span class=\"" + (params.progressbarFillClass) + "\"></span>";
          }
          $el.html(paginationHTML);
        }
        if (params.type !== 'custom') {
          swiper.emit('paginationRender', swiper.pagination.$el[0]);
        }
      },
      init: function init() {
        var swiper = this;
        var params = swiper.params.pagination;
        if (!params.el) {
          return;
        }

        var $el = $(params.el);
        if ($el.length === 0) {
          return;
        }

        if (
          swiper.params.uniqueNavElements
          && typeof params.el === 'string'
          && $el.length > 1
          && swiper.$el.find(params.el).length === 1
        ) {
          $el = swiper.$el.find(params.el);
        }

        if (params.type === 'bullets' && params.clickable) {
          $el.addClass(params.clickableClass);
        }

        $el.addClass(params.modifierClass + params.type);

        if (params.type === 'bullets' && params.dynamicBullets) {
          $el.addClass(("" + (params.modifierClass) + (params.type) + "-dynamic"));
          swiper.pagination.dynamicBulletIndex = 0;
          if (params.dynamicMainBullets < 1) {
            params.dynamicMainBullets = 1;
          }
        }
        if (params.type === 'progressbar' && params.progressbarOpposite) {
          $el.addClass(params.progressbarOppositeClass);
        }

        if (params.clickable) {
          $el.on('click', ("." + (params.bulletClass)), function onClick(e) {
            e.preventDefault();
            var index = $(this).index() * swiper.params.slidesPerGroup;
            if (swiper.params.loop) {
              index += swiper.loopedSlides;
            }
            swiper.slideTo(index);
          });
        }

        Utils.extend(swiper.pagination, {
          $el: $el,
          el: $el[0],
        });
      },
      destroy: function destroy() {
        var swiper = this;
        var params = swiper.params.pagination;
        if (!params.el || !swiper.pagination.el || !swiper.pagination.$el || swiper.pagination.$el.length === 0) {
          return;
        }
        var $el = swiper.pagination.$el;

        $el.removeClass(params.hiddenClass);
        $el.removeClass(params.modifierClass + params.type);
        if (swiper.pagination.bullets) {
          swiper.pagination.bullets.removeClass(params.bulletActiveClass);
        }
        if (params.clickable) {
          $el.off('click', ("." + (params.bulletClass)));
        }
      },
    };

    var Pagination$1 = {
      name: 'pagination',
      params: {
        pagination: {
          el: null,
          bulletElement: 'span',
          clickable: false,
          hideOnClick: false,
          renderBullet: null,
          renderProgressbar: null,
          renderFraction: null,
          renderCustom: null,
          progressbarOpposite: false,
          type: 'bullets', // 'bullets' or 'progressbar' or 'fraction' or 'custom'
          dynamicBullets: false,
          dynamicMainBullets: 1,
          formatFractionCurrent: function (number) {
            return number;
          },
          formatFractionTotal: function (number) {
            return number;
          },
          bulletClass: 'swiper-pagination-bullet',
          bulletActiveClass: 'swiper-pagination-bullet-active',
          modifierClass: 'swiper-pagination-', // NEW
          currentClass: 'swiper-pagination-current',
          totalClass: 'swiper-pagination-total',
          hiddenClass: 'swiper-pagination-hidden',
          progressbarFillClass: 'swiper-pagination-progressbar-fill',
          progressbarOppositeClass: 'swiper-pagination-progressbar-opposite',
          clickableClass: 'swiper-pagination-clickable', // NEW
          lockClass: 'swiper-pagination-lock',
        },
      },
      create: function create() {
        var swiper = this;
        Utils.extend(swiper, {
          pagination: {
            init: Pagination.init.bind(swiper),
            render: Pagination.render.bind(swiper),
            update: Pagination.update.bind(swiper),
            destroy: Pagination.destroy.bind(swiper),
            dynamicBulletIndex: 0,
          },
        });
      },
      on: {
        init: function init() {
          var swiper = this;
          swiper.pagination.init();
          swiper.pagination.render();
          swiper.pagination.update();
        },
        activeIndexChange: function activeIndexChange() {
          var swiper = this;
          if (swiper.params.loop) {
            swiper.pagination.update();
          } else if (typeof swiper.snapIndex === 'undefined') {
            swiper.pagination.update();
          }
        },
        snapIndexChange: function snapIndexChange() {
          var swiper = this;
          if (!swiper.params.loop) {
            swiper.pagination.update();
          }
        },
        slidesLengthChange: function slidesLengthChange() {
          var swiper = this;
          if (swiper.params.loop) {
            swiper.pagination.render();
            swiper.pagination.update();
          }
        },
        snapGridLengthChange: function snapGridLengthChange() {
          var swiper = this;
          if (!swiper.params.loop) {
            swiper.pagination.render();
            swiper.pagination.update();
          }
        },
        destroy: function destroy() {
          var swiper = this;
          swiper.pagination.destroy();
        },
        click: function click(e) {
          var swiper = this;
          if (
            swiper.params.pagination.el
            && swiper.params.pagination.hideOnClick
            && swiper.pagination.$el.length > 0
            && !$(e.target).hasClass(swiper.params.pagination.bulletClass)
          ) {
            var isHidden = swiper.pagination.$el.hasClass(swiper.params.pagination.hiddenClass);
            if (isHidden === true) {
              swiper.emit('paginationShow', swiper);
            } else {
              swiper.emit('paginationHide', swiper);
            }
            swiper.pagination.$el.toggleClass(swiper.params.pagination.hiddenClass);
          }
        },
      },
    };

    var Scrollbar = {
      setTranslate: function setTranslate() {
        var swiper = this;
        if (!swiper.params.scrollbar.el || !swiper.scrollbar.el) {
          return;
        }
        var scrollbar = swiper.scrollbar;
        var rtl = swiper.rtlTranslate;
        var progress = swiper.progress;
        var dragSize = scrollbar.dragSize;
        var trackSize = scrollbar.trackSize;
        var $dragEl = scrollbar.$dragEl;
        var $el = scrollbar.$el;
        var params = swiper.params.scrollbar;

        var newSize = dragSize;
        var newPos = (trackSize - dragSize) * progress;
        if (rtl) {
          newPos = -newPos;
          if (newPos > 0) {
            newSize = dragSize - newPos;
            newPos = 0;
          } else if (-newPos + dragSize > trackSize) {
            newSize = trackSize + newPos;
          }
        } else if (newPos < 0) {
          newSize = dragSize + newPos;
          newPos = 0;
        } else if (newPos + dragSize > trackSize) {
          newSize = trackSize - newPos;
        }
        if (swiper.isHorizontal()) {
          if (Support.transforms3d) {
            $dragEl.transform(("translate3d(" + newPos + "px, 0, 0)"));
          } else {
            $dragEl.transform(("translateX(" + newPos + "px)"));
          }
          $dragEl[0].style.width = newSize + "px";
        } else {
          if (Support.transforms3d) {
            $dragEl.transform(("translate3d(0px, " + newPos + "px, 0)"));
          } else {
            $dragEl.transform(("translateY(" + newPos + "px)"));
          }
          $dragEl[0].style.height = newSize + "px";
        }
        if (params.hide) {
          clearTimeout(swiper.scrollbar.timeout);
          $el[0].style.opacity = 1;
          swiper.scrollbar.timeout = setTimeout(function () {
            $el[0].style.opacity = 0;
            $el.transition(400);
          }, 1000);
        }
      },
      setTransition: function setTransition(duration) {
        var swiper = this;
        if (!swiper.params.scrollbar.el || !swiper.scrollbar.el) {
          return;
        }
        swiper.scrollbar.$dragEl.transition(duration);
      },
      updateSize: function updateSize() {
        var swiper = this;
        if (!swiper.params.scrollbar.el || !swiper.scrollbar.el) {
          return;
        }

        var scrollbar = swiper.scrollbar;
        var $dragEl = scrollbar.$dragEl;
        var $el = scrollbar.$el;

        $dragEl[0].style.width = '';
        $dragEl[0].style.height = '';
        var trackSize = swiper.isHorizontal() ? $el[0].offsetWidth : $el[0].offsetHeight;

        var divider = swiper.size / swiper.virtualSize;
        var moveDivider = divider * (trackSize / swiper.size);
        var dragSize;
        if (swiper.params.scrollbar.dragSize === 'auto') {
          dragSize = trackSize * divider;
        } else {
          dragSize = parseInt(swiper.params.scrollbar.dragSize, 10);
        }

        if (swiper.isHorizontal()) {
          $dragEl[0].style.width = dragSize + "px";
        } else {
          $dragEl[0].style.height = dragSize + "px";
        }

        if (divider >= 1) {
          $el[0].style.display = 'none';
        } else {
          $el[0].style.display = '';
        }
        if (swiper.params.scrollbar.hide) {
          $el[0].style.opacity = 0;
        }
        Utils.extend(scrollbar, {
          trackSize: trackSize,
          divider: divider,
          moveDivider: moveDivider,
          dragSize: dragSize,
        });
        scrollbar.$el[swiper.params.watchOverflow && swiper.isLocked ? 'addClass' : 'removeClass'](swiper.params.scrollbar.lockClass);
      },
      setDragPosition: function setDragPosition(e) {
        var swiper = this;
        var scrollbar = swiper.scrollbar;
        var rtl = swiper.rtlTranslate;
        var $el = scrollbar.$el;
        var dragSize = scrollbar.dragSize;
        var trackSize = scrollbar.trackSize;

        var pointerPosition;
        if (swiper.isHorizontal()) {
          pointerPosition = ((e.type === 'touchstart' || e.type === 'touchmove') ? e.targetTouches[0].pageX : e.pageX || e.clientX);
        } else {
          pointerPosition = ((e.type === 'touchstart' || e.type === 'touchmove') ? e.targetTouches[0].pageY : e.pageY || e.clientY);
        }
        var positionRatio;
        positionRatio = ((pointerPosition) - $el.offset()[swiper.isHorizontal() ? 'left' : 'top'] - (dragSize / 2)) / (trackSize - dragSize);
        positionRatio = Math.max(Math.min(positionRatio, 1), 0);
        if (rtl) {
          positionRatio = 1 - positionRatio;
        }

        var position = swiper.minTranslate() + ((swiper.maxTranslate() - swiper.minTranslate()) * positionRatio);

        swiper.updateProgress(position);
        swiper.setTranslate(position);
        swiper.updateActiveIndex();
        swiper.updateSlidesClasses();
      },
      onDragStart: function onDragStart(e) {
        var swiper = this;
        var params = swiper.params.scrollbar;
        var scrollbar = swiper.scrollbar;
        var $wrapperEl = swiper.$wrapperEl;
        var $el = scrollbar.$el;
        var $dragEl = scrollbar.$dragEl;
        swiper.scrollbar.isTouched = true;
        e.preventDefault();
        e.stopPropagation();

        $wrapperEl.transition(100);
        $dragEl.transition(100);
        scrollbar.setDragPosition(e);

        clearTimeout(swiper.scrollbar.dragTimeout);

        $el.transition(0);
        if (params.hide) {
          $el.css('opacity', 1);
        }
        swiper.emit('scrollbarDragStart', e);
      },
      onDragMove: function onDragMove(e) {
        var swiper = this;
        var scrollbar = swiper.scrollbar;
        var $wrapperEl = swiper.$wrapperEl;
        var $el = scrollbar.$el;
        var $dragEl = scrollbar.$dragEl;

        if (!swiper.scrollbar.isTouched) {
          return;
        }
        if (e.preventDefault) {
          e.preventDefault();
        } else {
          e.returnValue = false;
        }
        scrollbar.setDragPosition(e);
        $wrapperEl.transition(0);
        $el.transition(0);
        $dragEl.transition(0);
        swiper.emit('scrollbarDragMove', e);
      },
      onDragEnd: function onDragEnd(e) {
        var swiper = this;

        var params = swiper.params.scrollbar;
        var scrollbar = swiper.scrollbar;
        var $el = scrollbar.$el;

        if (!swiper.scrollbar.isTouched) {
          return;
        }
        swiper.scrollbar.isTouched = false;
        if (params.hide) {
          clearTimeout(swiper.scrollbar.dragTimeout);
          swiper.scrollbar.dragTimeout = Utils.nextTick(function () {
            $el.css('opacity', 0);
            $el.transition(400);
          }, 1000);
        }
        swiper.emit('scrollbarDragEnd', e);
        if (params.snapOnRelease) {
          swiper.slideToClosest();
        }
      },
      enableDraggable: function enableDraggable() {
        var swiper = this;
        if (!swiper.params.scrollbar.el) {
          return;
        }
        var scrollbar = swiper.scrollbar;
        var touchEventsTouch = swiper.touchEventsTouch;
        var touchEventsDesktop = swiper.touchEventsDesktop;
        var params = swiper.params;
        var $el = scrollbar.$el;
        var target = $el[0];
        var activeListener = Support.passiveListener && params.passiveListeners ? {passive: false, capture: false} : false;
        var passiveListener = Support.passiveListener && params.passiveListeners ? {passive: true, capture: false} : false;
        if (!Support.touch) {
          target.addEventListener(touchEventsDesktop.start, swiper.scrollbar.onDragStart, activeListener);
          doc.addEventListener(touchEventsDesktop.move, swiper.scrollbar.onDragMove, activeListener);
          doc.addEventListener(touchEventsDesktop.end, swiper.scrollbar.onDragEnd, passiveListener);
        } else {
          target.addEventListener(touchEventsTouch.start, swiper.scrollbar.onDragStart, activeListener);
          target.addEventListener(touchEventsTouch.move, swiper.scrollbar.onDragMove, activeListener);
          target.addEventListener(touchEventsTouch.end, swiper.scrollbar.onDragEnd, passiveListener);
        }
      },
      disableDraggable: function disableDraggable() {
        var swiper = this;
        if (!swiper.params.scrollbar.el) {
          return;
        }
        var scrollbar = swiper.scrollbar;
        var touchEventsTouch = swiper.touchEventsTouch;
        var touchEventsDesktop = swiper.touchEventsDesktop;
        var params = swiper.params;
        var $el = scrollbar.$el;
        var target = $el[0];
        var activeListener = Support.passiveListener && params.passiveListeners ? {passive: false, capture: false} : false;
        var passiveListener = Support.passiveListener && params.passiveListeners ? {passive: true, capture: false} : false;
        if (!Support.touch) {
          target.removeEventListener(touchEventsDesktop.start, swiper.scrollbar.onDragStart, activeListener);
          doc.removeEventListener(touchEventsDesktop.move, swiper.scrollbar.onDragMove, activeListener);
          doc.removeEventListener(touchEventsDesktop.end, swiper.scrollbar.onDragEnd, passiveListener);
        } else {
          target.removeEventListener(touchEventsTouch.start, swiper.scrollbar.onDragStart, activeListener);
          target.removeEventListener(touchEventsTouch.move, swiper.scrollbar.onDragMove, activeListener);
          target.removeEventListener(touchEventsTouch.end, swiper.scrollbar.onDragEnd, passiveListener);
        }
      },
      init: function init() {
        var swiper = this;
        if (!swiper.params.scrollbar.el) {
          return;
        }
        var scrollbar = swiper.scrollbar;
        var $swiperEl = swiper.$el;
        var params = swiper.params.scrollbar;

        var $el = $(params.el);
        if (swiper.params.uniqueNavElements && typeof params.el === 'string' && $el.length > 1 && $swiperEl.find(params.el).length === 1) {
          $el = $swiperEl.find(params.el);
        }

        var $dragEl = $el.find(("." + (swiper.params.scrollbar.dragClass)));
        if ($dragEl.length === 0) {
          $dragEl = $(("<div class=\"" + (swiper.params.scrollbar.dragClass) + "\"></div>"));
          $el.append($dragEl);
        }

        Utils.extend(scrollbar, {
          $el: $el,
          el: $el[0],
          $dragEl: $dragEl,
          dragEl: $dragEl[0],
        });

        if (params.draggable) {
          scrollbar.enableDraggable();
        }
      },
      destroy: function destroy() {
        var swiper = this;
        swiper.scrollbar.disableDraggable();
      },
    };

    var Scrollbar$1 = {
      name: 'scrollbar',
      params: {
        scrollbar: {
          el: null,
          dragSize: 'auto',
          hide: false,
          draggable: false,
          snapOnRelease: true,
          lockClass: 'swiper-scrollbar-lock',
          dragClass: 'swiper-scrollbar-drag',
        },
      },
      create: function create() {
        var swiper = this;
        Utils.extend(swiper, {
          scrollbar: {
            init: Scrollbar.init.bind(swiper),
            destroy: Scrollbar.destroy.bind(swiper),
            updateSize: Scrollbar.updateSize.bind(swiper),
            setTranslate: Scrollbar.setTranslate.bind(swiper),
            setTransition: Scrollbar.setTransition.bind(swiper),
            enableDraggable: Scrollbar.enableDraggable.bind(swiper),
            disableDraggable: Scrollbar.disableDraggable.bind(swiper),
            setDragPosition: Scrollbar.setDragPosition.bind(swiper),
            onDragStart: Scrollbar.onDragStart.bind(swiper),
            onDragMove: Scrollbar.onDragMove.bind(swiper),
            onDragEnd: Scrollbar.onDragEnd.bind(swiper),
            isTouched: false,
            timeout: null,
            dragTimeout: null,
          },
        });
      },
      on: {
        init: function init() {
          var swiper = this;
          swiper.scrollbar.init();
          swiper.scrollbar.updateSize();
          swiper.scrollbar.setTranslate();
        },
        update: function update() {
          var swiper = this;
          swiper.scrollbar.updateSize();
        },
        resize: function resize() {
          var swiper = this;
          swiper.scrollbar.updateSize();
        },
        observerUpdate: function observerUpdate() {
          var swiper = this;
          swiper.scrollbar.updateSize();
        },
        setTranslate: function setTranslate() {
          var swiper = this;
          swiper.scrollbar.setTranslate();
        },
        setTransition: function setTransition(duration) {
          var swiper = this;
          swiper.scrollbar.setTransition(duration);
        },
        destroy: function destroy() {
          var swiper = this;
          swiper.scrollbar.destroy();
        },
      },
    };

    var Parallax = {
      setTransform: function setTransform(el, progress) {
        var swiper = this;
        var rtl = swiper.rtl;

        var $el = $(el);
        var rtlFactor = rtl ? -1 : 1;

        var p = $el.attr('data-swiper-parallax') || '0';
        var x = $el.attr('data-swiper-parallax-x');
        var y = $el.attr('data-swiper-parallax-y');
        var scale = $el.attr('data-swiper-parallax-scale');
        var opacity = $el.attr('data-swiper-parallax-opacity');

        if (x || y) {
          x = x || '0';
          y = y || '0';
        } else if (swiper.isHorizontal()) {
          x = p;
          y = '0';
        } else {
          y = p;
          x = '0';
        }

        if ((x).indexOf('%') >= 0) {
          x = (parseInt(x, 10) * progress * rtlFactor) + "%";
        } else {
          x = (x * progress * rtlFactor) + "px";
        }
        if ((y).indexOf('%') >= 0) {
          y = (parseInt(y, 10) * progress) + "%";
        } else {
          y = (y * progress) + "px";
        }

        if (typeof opacity !== 'undefined' && opacity !== null) {
          var currentOpacity = opacity - ((opacity - 1) * (1 - Math.abs(progress)));
          $el[0].style.opacity = currentOpacity;
        }
        if (typeof scale === 'undefined' || scale === null) {
          $el.transform(("translate3d(" + x + ", " + y + ", 0px)"));
        } else {
          var currentScale = scale - ((scale - 1) * (1 - Math.abs(progress)));
          $el.transform(("translate3d(" + x + ", " + y + ", 0px) scale(" + currentScale + ")"));
        }
      },
      setTranslate: function setTranslate() {
        var swiper = this;
        var $el = swiper.$el;
        var slides = swiper.slides;
        var progress = swiper.progress;
        var snapGrid = swiper.snapGrid;
        $el.children('[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]')
          .each(function (index, el) {
            swiper.parallax.setTransform(el, progress);
          });
        slides.each(function (slideIndex, slideEl) {
          var slideProgress = slideEl.progress;
          if (swiper.params.slidesPerGroup > 1 && swiper.params.slidesPerView !== 'auto') {
            slideProgress += Math.ceil(slideIndex / 2) - (progress * (snapGrid.length - 1));
          }
          slideProgress = Math.min(Math.max(slideProgress, -1), 1);
          $(slideEl).find('[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]')
            .each(function (index, el) {
              swiper.parallax.setTransform(el, slideProgress);
            });
        });
      },
      setTransition: function setTransition(duration) {
        if (duration === void 0) duration = this.params.speed;

        var swiper = this;
        var $el = swiper.$el;
        $el.find('[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]')
          .each(function (index, parallaxEl) {
            var $parallaxEl = $(parallaxEl);
            var parallaxDuration = parseInt($parallaxEl.attr('data-swiper-parallax-duration'), 10) || duration;
            if (duration === 0) {
              parallaxDuration = 0;
            }
            $parallaxEl.transition(parallaxDuration);
          });
      },
    };

    var Parallax$1 = {
      name: 'parallax',
      params: {
        parallax: {
          enabled: false,
        },
      },
      create: function create() {
        var swiper = this;
        Utils.extend(swiper, {
          parallax: {
            setTransform: Parallax.setTransform.bind(swiper),
            setTranslate: Parallax.setTranslate.bind(swiper),
            setTransition: Parallax.setTransition.bind(swiper),
          },
        });
      },
      on: {
        beforeInit: function beforeInit() {
          var swiper = this;
          if (!swiper.params.parallax.enabled) {
            return;
          }
          swiper.params.watchSlidesProgress = true;
          swiper.originalParams.watchSlidesProgress = true;
        },
        init: function init() {
          var swiper = this;
          if (!swiper.params.parallax.enabled) {
            return;
          }
          swiper.parallax.setTranslate();
        },
        setTranslate: function setTranslate() {
          var swiper = this;
          if (!swiper.params.parallax.enabled) {
            return;
          }
          swiper.parallax.setTranslate();
        },
        setTransition: function setTransition(duration) {
          var swiper = this;
          if (!swiper.params.parallax.enabled) {
            return;
          }
          swiper.parallax.setTransition(duration);
        },
      },
    };

    var Zoom = {
      // Calc Scale From Multi-touches
      getDistanceBetweenTouches: function getDistanceBetweenTouches(e) {
        if (e.targetTouches.length < 2) {
          return 1;
        }
        var x1 = e.targetTouches[0].pageX;
        var y1 = e.targetTouches[0].pageY;
        var x2 = e.targetTouches[1].pageX;
        var y2 = e.targetTouches[1].pageY;
        var distance = Math.sqrt((Math.pow((x2 - x1), 2)) + (Math.pow((y2 - y1), 2)));
        return distance;
      },
      // Events
      onGestureStart: function onGestureStart(e) {
        var swiper = this;
        var params = swiper.params.zoom;
        var zoom = swiper.zoom;
        var gesture = zoom.gesture;
        zoom.fakeGestureTouched = false;
        zoom.fakeGestureMoved = false;
        if (!Support.gestures) {
          if (e.type !== 'touchstart' || (e.type === 'touchstart' && e.targetTouches.length < 2)) {
            return;
          }
          zoom.fakeGestureTouched = true;
          gesture.scaleStart = Zoom.getDistanceBetweenTouches(e);
        }
        if (!gesture.$slideEl || !gesture.$slideEl.length) {
          gesture.$slideEl = $(e.target).closest('.swiper-slide');
          if (gesture.$slideEl.length === 0) {
            gesture.$slideEl = swiper.slides.eq(swiper.activeIndex);
          }
          gesture.$imageEl = gesture.$slideEl.find('img, svg, canvas');
          gesture.$imageWrapEl = gesture.$imageEl.parent(("." + (params.containerClass)));
          gesture.maxRatio = gesture.$imageWrapEl.attr('data-swiper-zoom') || params.maxRatio;
          if (gesture.$imageWrapEl.length === 0) {
            gesture.$imageEl = undefined;
            return;
          }
        }
        gesture.$imageEl.transition(0);
        swiper.zoom.isScaling = true;
      },
      onGestureChange: function onGestureChange(e) {
        var swiper = this;
        var params = swiper.params.zoom;
        var zoom = swiper.zoom;
        var gesture = zoom.gesture;
        if (!Support.gestures) {
          if (e.type !== 'touchmove' || (e.type === 'touchmove' && e.targetTouches.length < 2)) {
            return;
          }
          zoom.fakeGestureMoved = true;
          gesture.scaleMove = Zoom.getDistanceBetweenTouches(e);
        }
        if (!gesture.$imageEl || gesture.$imageEl.length === 0) {
          return;
        }
        if (Support.gestures) {
          zoom.scale = e.scale * zoom.currentScale;
        } else {
          zoom.scale = (gesture.scaleMove / gesture.scaleStart) * zoom.currentScale;
        }
        if (zoom.scale > gesture.maxRatio) {
          zoom.scale = (gesture.maxRatio - 1) + (Math.pow(((zoom.scale - gesture.maxRatio) + 1), 0.5));
        }
        if (zoom.scale < params.minRatio) {
          zoom.scale = (params.minRatio + 1) - (Math.pow(((params.minRatio - zoom.scale) + 1), 0.5));
        }
        gesture.$imageEl.transform(("translate3d(0,0,0) scale(" + (zoom.scale) + ")"));
      },
      onGestureEnd: function onGestureEnd(e) {
        var swiper = this;
        var params = swiper.params.zoom;
        var zoom = swiper.zoom;
        var gesture = zoom.gesture;
        if (!Support.gestures) {
          if (!zoom.fakeGestureTouched || !zoom.fakeGestureMoved) {
            return;
          }
          if (e.type !== 'touchend' || (e.type === 'touchend' && e.changedTouches.length < 2 && !Device.android)) {
            return;
          }
          zoom.fakeGestureTouched = false;
          zoom.fakeGestureMoved = false;
        }
        if (!gesture.$imageEl || gesture.$imageEl.length === 0) {
          return;
        }
        zoom.scale = Math.max(Math.min(zoom.scale, gesture.maxRatio), params.minRatio);
        gesture.$imageEl.transition(swiper.params.speed).transform(("translate3d(0,0,0) scale(" + (zoom.scale) + ")"));
        zoom.currentScale = zoom.scale;
        zoom.isScaling = false;
        if (zoom.scale === 1) {
          gesture.$slideEl = undefined;
        }
      },
      onTouchStart: function onTouchStart(e) {
        var swiper = this;
        var zoom = swiper.zoom;
        var gesture = zoom.gesture;
        var image = zoom.image;
        if (!gesture.$imageEl || gesture.$imageEl.length === 0) {
          return;
        }
        if (image.isTouched) {
          return;
        }
        if (Device.android) {
          e.preventDefault();
        }
        image.isTouched = true;
        image.touchesStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
        image.touchesStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
      },
      onTouchMove: function onTouchMove(e) {
        var swiper = this;
        var zoom = swiper.zoom;
        var gesture = zoom.gesture;
        var image = zoom.image;
        var velocity = zoom.velocity;
        if (!gesture.$imageEl || gesture.$imageEl.length === 0) {
          return;
        }
        swiper.allowClick = false;
        if (!image.isTouched || !gesture.$slideEl) {
          return;
        }

        if (!image.isMoved) {
          image.width = gesture.$imageEl[0].offsetWidth;
          image.height = gesture.$imageEl[0].offsetHeight;
          image.startX = Utils.getTranslate(gesture.$imageWrapEl[0], 'x') || 0;
          image.startY = Utils.getTranslate(gesture.$imageWrapEl[0], 'y') || 0;
          gesture.slideWidth = gesture.$slideEl[0].offsetWidth;
          gesture.slideHeight = gesture.$slideEl[0].offsetHeight;
          gesture.$imageWrapEl.transition(0);
          if (swiper.rtl) {
            image.startX = -image.startX;
            image.startY = -image.startY;
          }
        }
        // Define if we need image drag
        var scaledWidth = image.width * zoom.scale;
        var scaledHeight = image.height * zoom.scale;

        if (scaledWidth < gesture.slideWidth && scaledHeight < gesture.slideHeight) {
          return;
        }

        image.minX = Math.min(((gesture.slideWidth / 2) - (scaledWidth / 2)), 0);
        image.maxX = -image.minX;
        image.minY = Math.min(((gesture.slideHeight / 2) - (scaledHeight / 2)), 0);
        image.maxY = -image.minY;

        image.touchesCurrent.x = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
        image.touchesCurrent.y = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;

        if (!image.isMoved && !zoom.isScaling) {
          if (
            swiper.isHorizontal()
            && (
              (Math.floor(image.minX) === Math.floor(image.startX) && image.touchesCurrent.x < image.touchesStart.x)
              || (Math.floor(image.maxX) === Math.floor(image.startX) && image.touchesCurrent.x > image.touchesStart.x)
            )
          ) {
            image.isTouched = false;
            return;
          }
          if (
            !swiper.isHorizontal()
            && (
              (Math.floor(image.minY) === Math.floor(image.startY) && image.touchesCurrent.y < image.touchesStart.y)
              || (Math.floor(image.maxY) === Math.floor(image.startY) && image.touchesCurrent.y > image.touchesStart.y)
            )
          ) {
            image.isTouched = false;
            return;
          }
        }
        e.preventDefault();
        e.stopPropagation();

        image.isMoved = true;
        image.currentX = (image.touchesCurrent.x - image.touchesStart.x) + image.startX;
        image.currentY = (image.touchesCurrent.y - image.touchesStart.y) + image.startY;

        if (image.currentX < image.minX) {
          image.currentX = (image.minX + 1) - (Math.pow(((image.minX - image.currentX) + 1), 0.8));
        }
        if (image.currentX > image.maxX) {
          image.currentX = (image.maxX - 1) + (Math.pow(((image.currentX - image.maxX) + 1), 0.8));
        }

        if (image.currentY < image.minY) {
          image.currentY = (image.minY + 1) - (Math.pow(((image.minY - image.currentY) + 1), 0.8));
        }
        if (image.currentY > image.maxY) {
          image.currentY = (image.maxY - 1) + (Math.pow(((image.currentY - image.maxY) + 1), 0.8));
        }

        // Velocity
        if (!velocity.prevPositionX) {
          velocity.prevPositionX = image.touchesCurrent.x;
        }
        if (!velocity.prevPositionY) {
          velocity.prevPositionY = image.touchesCurrent.y;
        }
        if (!velocity.prevTime) {
          velocity.prevTime = Date.now();
        }
        velocity.x = (image.touchesCurrent.x - velocity.prevPositionX) / (Date.now() - velocity.prevTime) / 2;
        velocity.y = (image.touchesCurrent.y - velocity.prevPositionY) / (Date.now() - velocity.prevTime) / 2;
        if (Math.abs(image.touchesCurrent.x - velocity.prevPositionX) < 2) {
          velocity.x = 0;
        }
        if (Math.abs(image.touchesCurrent.y - velocity.prevPositionY) < 2) {
          velocity.y = 0;
        }
        velocity.prevPositionX = image.touchesCurrent.x;
        velocity.prevPositionY = image.touchesCurrent.y;
        velocity.prevTime = Date.now();

        gesture.$imageWrapEl.transform(("translate3d(" + (image.currentX) + "px, " + (image.currentY) + "px,0)"));
      },
      onTouchEnd: function onTouchEnd() {
        var swiper = this;
        var zoom = swiper.zoom;
        var gesture = zoom.gesture;
        var image = zoom.image;
        var velocity = zoom.velocity;
        if (!gesture.$imageEl || gesture.$imageEl.length === 0) {
          return;
        }
        if (!image.isTouched || !image.isMoved) {
          image.isTouched = false;
          image.isMoved = false;
          return;
        }
        image.isTouched = false;
        image.isMoved = false;
        var momentumDurationX = 300;
        var momentumDurationY = 300;
        var momentumDistanceX = velocity.x * momentumDurationX;
        var newPositionX = image.currentX + momentumDistanceX;
        var momentumDistanceY = velocity.y * momentumDurationY;
        var newPositionY = image.currentY + momentumDistanceY;

        // Fix duration
        if (velocity.x !== 0) {
          momentumDurationX = Math.abs((newPositionX - image.currentX) / velocity.x);
        }
        if (velocity.y !== 0) {
          momentumDurationY = Math.abs((newPositionY - image.currentY) / velocity.y);
        }
        var momentumDuration = Math.max(momentumDurationX, momentumDurationY);

        image.currentX = newPositionX;
        image.currentY = newPositionY;

        // Define if we need image drag
        var scaledWidth = image.width * zoom.scale;
        var scaledHeight = image.height * zoom.scale;
        image.minX = Math.min(((gesture.slideWidth / 2) - (scaledWidth / 2)), 0);
        image.maxX = -image.minX;
        image.minY = Math.min(((gesture.slideHeight / 2) - (scaledHeight / 2)), 0);
        image.maxY = -image.minY;
        image.currentX = Math.max(Math.min(image.currentX, image.maxX), image.minX);
        image.currentY = Math.max(Math.min(image.currentY, image.maxY), image.minY);

        gesture.$imageWrapEl.transition(momentumDuration).transform(("translate3d(" + (image.currentX) + "px, " + (image.currentY) + "px,0)"));
      },
      onTransitionEnd: function onTransitionEnd() {
        var swiper = this;
        var zoom = swiper.zoom;
        var gesture = zoom.gesture;
        if (gesture.$slideEl && swiper.previousIndex !== swiper.activeIndex) {
          gesture.$imageEl.transform('translate3d(0,0,0) scale(1)');
          gesture.$imageWrapEl.transform('translate3d(0,0,0)');

          zoom.scale = 1;
          zoom.currentScale = 1;

          gesture.$slideEl = undefined;
          gesture.$imageEl = undefined;
          gesture.$imageWrapEl = undefined;
        }
      },
      // Toggle Zoom
      toggle: function toggle(e) {
        var swiper = this;
        var zoom = swiper.zoom;

        if (zoom.scale && zoom.scale !== 1) {
          // Zoom Out
          zoom.out();
        } else {
          // Zoom In
          zoom.in(e);
        }
      },
      in: function in$1(e) {
        var swiper = this;

        var zoom = swiper.zoom;
        var params = swiper.params.zoom;
        var gesture = zoom.gesture;
        var image = zoom.image;

        if (!gesture.$slideEl) {
          gesture.$slideEl = swiper.clickedSlide ? $(swiper.clickedSlide) : swiper.slides.eq(swiper.activeIndex);
          gesture.$imageEl = gesture.$slideEl.find('img, svg, canvas');
          gesture.$imageWrapEl = gesture.$imageEl.parent(("." + (params.containerClass)));
        }
        if (!gesture.$imageEl || gesture.$imageEl.length === 0) {
          return;
        }

        gesture.$slideEl.addClass(("" + (params.zoomedSlideClass)));

        var touchX;
        var touchY;
        var offsetX;
        var offsetY;
        var diffX;
        var diffY;
        var translateX;
        var translateY;
        var imageWidth;
        var imageHeight;
        var scaledWidth;
        var scaledHeight;
        var translateMinX;
        var translateMinY;
        var translateMaxX;
        var translateMaxY;
        var slideWidth;
        var slideHeight;

        if (typeof image.touchesStart.x === 'undefined' && e) {
          touchX = e.type === 'touchend' ? e.changedTouches[0].pageX : e.pageX;
          touchY = e.type === 'touchend' ? e.changedTouches[0].pageY : e.pageY;
        } else {
          touchX = image.touchesStart.x;
          touchY = image.touchesStart.y;
        }

        zoom.scale = gesture.$imageWrapEl.attr('data-swiper-zoom') || params.maxRatio;
        zoom.currentScale = gesture.$imageWrapEl.attr('data-swiper-zoom') || params.maxRatio;
        if (e) {
          slideWidth = gesture.$slideEl[0].offsetWidth;
          slideHeight = gesture.$slideEl[0].offsetHeight;
          offsetX = gesture.$slideEl.offset().left;
          offsetY = gesture.$slideEl.offset().top;
          diffX = (offsetX + (slideWidth / 2)) - touchX;
          diffY = (offsetY + (slideHeight / 2)) - touchY;

          imageWidth = gesture.$imageEl[0].offsetWidth;
          imageHeight = gesture.$imageEl[0].offsetHeight;
          scaledWidth = imageWidth * zoom.scale;
          scaledHeight = imageHeight * zoom.scale;

          translateMinX = Math.min(((slideWidth / 2) - (scaledWidth / 2)), 0);
          translateMinY = Math.min(((slideHeight / 2) - (scaledHeight / 2)), 0);
          translateMaxX = -translateMinX;
          translateMaxY = -translateMinY;

          translateX = diffX * zoom.scale;
          translateY = diffY * zoom.scale;

          if (translateX < translateMinX) {
            translateX = translateMinX;
          }
          if (translateX > translateMaxX) {
            translateX = translateMaxX;
          }

          if (translateY < translateMinY) {
            translateY = translateMinY;
          }
          if (translateY > translateMaxY) {
            translateY = translateMaxY;
          }
        } else {
          translateX = 0;
          translateY = 0;
        }
        gesture.$imageWrapEl.transition(300).transform(("translate3d(" + translateX + "px, " + translateY + "px,0)"));
        gesture.$imageEl.transition(300).transform(("translate3d(0,0,0) scale(" + (zoom.scale) + ")"));
      },
      out: function out() {
        var swiper = this;

        var zoom = swiper.zoom;
        var params = swiper.params.zoom;
        var gesture = zoom.gesture;

        if (!gesture.$slideEl) {
          gesture.$slideEl = swiper.clickedSlide ? $(swiper.clickedSlide) : swiper.slides.eq(swiper.activeIndex);
          gesture.$imageEl = gesture.$slideEl.find('img, svg, canvas');
          gesture.$imageWrapEl = gesture.$imageEl.parent(("." + (params.containerClass)));
        }
        if (!gesture.$imageEl || gesture.$imageEl.length === 0) {
          return;
        }

        zoom.scale = 1;
        zoom.currentScale = 1;
        gesture.$imageWrapEl.transition(300).transform('translate3d(0,0,0)');
        gesture.$imageEl.transition(300).transform('translate3d(0,0,0) scale(1)');
        gesture.$slideEl.removeClass(("" + (params.zoomedSlideClass)));
        gesture.$slideEl = undefined;
      },
      // Attach/Detach Events
      enable: function enable() {
        var swiper = this;
        var zoom = swiper.zoom;
        if (zoom.enabled) {
          return;
        }
        zoom.enabled = true;

        var passiveListener = swiper.touchEvents.start === 'touchstart' && Support.passiveListener && swiper.params.passiveListeners ? {passive: true, capture: false} : false;

        // Scale image
        if (Support.gestures) {
          swiper.$wrapperEl.on('gesturestart', '.swiper-slide', zoom.onGestureStart, passiveListener);
          swiper.$wrapperEl.on('gesturechange', '.swiper-slide', zoom.onGestureChange, passiveListener);
          swiper.$wrapperEl.on('gestureend', '.swiper-slide', zoom.onGestureEnd, passiveListener);
        } else if (swiper.touchEvents.start === 'touchstart') {
          swiper.$wrapperEl.on(swiper.touchEvents.start, '.swiper-slide', zoom.onGestureStart, passiveListener);
          swiper.$wrapperEl.on(swiper.touchEvents.move, '.swiper-slide', zoom.onGestureChange, passiveListener);
          swiper.$wrapperEl.on(swiper.touchEvents.end, '.swiper-slide', zoom.onGestureEnd, passiveListener);
        }

        // Move image
        swiper.$wrapperEl.on(swiper.touchEvents.move, ("." + (swiper.params.zoom.containerClass)), zoom.onTouchMove);
      },
      disable: function disable() {
        var swiper = this;
        var zoom = swiper.zoom;
        if (!zoom.enabled) {
          return;
        }

        swiper.zoom.enabled = false;

        var passiveListener = swiper.touchEvents.start === 'touchstart' && Support.passiveListener && swiper.params.passiveListeners ? {passive: true, capture: false} : false;

        // Scale image
        if (Support.gestures) {
          swiper.$wrapperEl.off('gesturestart', '.swiper-slide', zoom.onGestureStart, passiveListener);
          swiper.$wrapperEl.off('gesturechange', '.swiper-slide', zoom.onGestureChange, passiveListener);
          swiper.$wrapperEl.off('gestureend', '.swiper-slide', zoom.onGestureEnd, passiveListener);
        } else if (swiper.touchEvents.start === 'touchstart') {
          swiper.$wrapperEl.off(swiper.touchEvents.start, '.swiper-slide', zoom.onGestureStart, passiveListener);
          swiper.$wrapperEl.off(swiper.touchEvents.move, '.swiper-slide', zoom.onGestureChange, passiveListener);
          swiper.$wrapperEl.off(swiper.touchEvents.end, '.swiper-slide', zoom.onGestureEnd, passiveListener);
        }

        // Move image
        swiper.$wrapperEl.off(swiper.touchEvents.move, ("." + (swiper.params.zoom.containerClass)), zoom.onTouchMove);
      },
    };

    var Zoom$1 = {
      name: 'zoom',
      params: {
        zoom: {
          enabled: false,
          maxRatio: 3,
          minRatio: 1,
          toggle: true,
          containerClass: 'swiper-zoom-container',
          zoomedSlideClass: 'swiper-slide-zoomed',
        },
      },
      create: function create() {
        var swiper = this;
        var zoom = {
          enabled: false,
          scale: 1,
          currentScale: 1,
          isScaling: false,
          gesture: {
            $slideEl: undefined,
            slideWidth: undefined,
            slideHeight: undefined,
            $imageEl: undefined,
            $imageWrapEl: undefined,
            maxRatio: 3,
          },
          image: {
            isTouched: undefined,
            isMoved: undefined,
            currentX: undefined,
            currentY: undefined,
            minX: undefined,
            minY: undefined,
            maxX: undefined,
            maxY: undefined,
            width: undefined,
            height: undefined,
            startX: undefined,
            startY: undefined,
            touchesStart: {},
            touchesCurrent: {},
          },
          velocity: {
            x: undefined,
            y: undefined,
            prevPositionX: undefined,
            prevPositionY: undefined,
            prevTime: undefined,
          },
        };

        ('onGestureStart onGestureChange onGestureEnd onTouchStart onTouchMove onTouchEnd onTransitionEnd toggle enable disable in out').split(' ').forEach(function (methodName) {
          zoom[methodName] = Zoom[methodName].bind(swiper);
        });
        Utils.extend(swiper, {
          zoom: zoom,
        });

        var scale = 1;
        Object.defineProperty(swiper.zoom, 'scale', {
          get: function get() {
            return scale;
          },
          set: function set(value) {
            if (scale !== value) {
              var imageEl = swiper.zoom.gesture.$imageEl ? swiper.zoom.gesture.$imageEl[0] : undefined;
              var slideEl = swiper.zoom.gesture.$slideEl ? swiper.zoom.gesture.$slideEl[0] : undefined;
              swiper.emit('zoomChange', value, imageEl, slideEl);
            }
            scale = value;
          },
        });
      },
      on: {
        init: function init() {
          var swiper = this;
          if (swiper.params.zoom.enabled) {
            swiper.zoom.enable();
          }
        },
        destroy: function destroy() {
          var swiper = this;
          swiper.zoom.disable();
        },
        touchStart: function touchStart(e) {
          var swiper = this;
          if (!swiper.zoom.enabled) {
            return;
          }
          swiper.zoom.onTouchStart(e);
        },
        touchEnd: function touchEnd(e) {
          var swiper = this;
          if (!swiper.zoom.enabled) {
            return;
          }
          swiper.zoom.onTouchEnd(e);
        },
        doubleTap: function doubleTap(e) {
          var swiper = this;
          if (swiper.params.zoom.enabled && swiper.zoom.enabled && swiper.params.zoom.toggle) {
            swiper.zoom.toggle(e);
          }
        },
        transitionEnd: function transitionEnd() {
          var swiper = this;
          if (swiper.zoom.enabled && swiper.params.zoom.enabled) {
            swiper.zoom.onTransitionEnd();
          }
        },
      },
    };

    var Lazy = {
      loadInSlide: function loadInSlide(index, loadInDuplicate) {
        if (loadInDuplicate === void 0) loadInDuplicate = true;

        var swiper = this;
        var params = swiper.params.lazy;
        if (typeof index === 'undefined') {
          return;
        }
        if (swiper.slides.length === 0) {
          return;
        }
        var isVirtual = swiper.virtual && swiper.params.virtual.enabled;

        var $slideEl = isVirtual
          ? swiper.$wrapperEl.children(("." + (swiper.params.slideClass) + "[data-swiper-slide-index=\"" + index + "\"]"))
          : swiper.slides.eq(index);

        var $images = $slideEl.find(("." + (params.elementClass) + ":not(." + (params.loadedClass) + "):not(." + (params.loadingClass) + ")"));
        if ($slideEl.hasClass(params.elementClass) && !$slideEl.hasClass(params.loadedClass) && !$slideEl.hasClass(params.loadingClass)) {
          $images = $images.add($slideEl[0]);
        }
        if ($images.length === 0) {
          return;
        }

        $images.each(function (imageIndex, imageEl) {
          var $imageEl = $(imageEl);
          $imageEl.addClass(params.loadingClass);

          var background = $imageEl.attr('data-background');
          var src = $imageEl.attr('data-src');
          var srcset = $imageEl.attr('data-srcset');
          var sizes = $imageEl.attr('data-sizes');

          swiper.loadImage($imageEl[0], (src || background), srcset, sizes, false, function () {
            if (typeof swiper === 'undefined' || swiper === null || !swiper || (swiper && !swiper.params) || swiper.destroyed) {
              return;
            }
            if (background) {
              $imageEl.css('background-image', ("url(\"" + background + "\")"));
              $imageEl.removeAttr('data-background');
            } else {
              if (srcset) {
                $imageEl.attr('srcset', srcset);
                $imageEl.removeAttr('data-srcset');
              }
              if (sizes) {
                $imageEl.attr('sizes', sizes);
                $imageEl.removeAttr('data-sizes');
              }
              if (src) {
                $imageEl.attr('src', src);
                $imageEl.removeAttr('data-src');
              }
            }

            $imageEl.addClass(params.loadedClass).removeClass(params.loadingClass);
            $slideEl.find(("." + (params.preloaderClass))).remove();
            if (swiper.params.loop && loadInDuplicate) {
              var slideOriginalIndex = $slideEl.attr('data-swiper-slide-index');
              if ($slideEl.hasClass(swiper.params.slideDuplicateClass)) {
                var originalSlide = swiper.$wrapperEl.children(("[data-swiper-slide-index=\"" + slideOriginalIndex + "\"]:not(." + (swiper.params.slideDuplicateClass) + ")"));
                swiper.lazy.loadInSlide(originalSlide.index(), false);
              } else {
                var duplicatedSlide = swiper.$wrapperEl.children(("." + (swiper.params.slideDuplicateClass) + "[data-swiper-slide-index=\"" + slideOriginalIndex + "\"]"));
                swiper.lazy.loadInSlide(duplicatedSlide.index(), false);
              }
            }
            swiper.emit('lazyImageReady', $slideEl[0], $imageEl[0]);
          });

          swiper.emit('lazyImageLoad', $slideEl[0], $imageEl[0]);
        });
      },
      load: function load() {
        var swiper = this;
        var $wrapperEl = swiper.$wrapperEl;
        var swiperParams = swiper.params;
        var slides = swiper.slides;
        var activeIndex = swiper.activeIndex;
        var isVirtual = swiper.virtual && swiperParams.virtual.enabled;
        var params = swiperParams.lazy;

        var slidesPerView = swiperParams.slidesPerView;
        if (slidesPerView === 'auto') {
          slidesPerView = 0;
        }

        function slideExist(index) {
          if (isVirtual) {
            if ($wrapperEl.children(("." + (swiperParams.slideClass) + "[data-swiper-slide-index=\"" + index + "\"]")).length) {
              return true;
            }
          } else if (slides[index]) {
            return true;
          }
          return false;
        }

        function slideIndex(slideEl) {
          if (isVirtual) {
            return $(slideEl).attr('data-swiper-slide-index');
          }
          return $(slideEl).index();
        }

        if (!swiper.lazy.initialImageLoaded) {
          swiper.lazy.initialImageLoaded = true;
        }
        if (swiper.params.watchSlidesVisibility) {
          $wrapperEl.children(("." + (swiperParams.slideVisibleClass))).each(function (elIndex, slideEl) {
            var index = isVirtual ? $(slideEl).attr('data-swiper-slide-index') : $(slideEl).index();
            swiper.lazy.loadInSlide(index);
          });
        } else if (slidesPerView > 1) {
          for (var i = activeIndex; i < activeIndex + slidesPerView; i += 1) {
            if (slideExist(i)) {
              swiper.lazy.loadInSlide(i);
            }
          }
        } else {
          swiper.lazy.loadInSlide(activeIndex);
        }
        if (params.loadPrevNext) {
          if (slidesPerView > 1 || (params.loadPrevNextAmount && params.loadPrevNextAmount > 1)) {
            var amount = params.loadPrevNextAmount;
            var spv = slidesPerView;
            var maxIndex = Math.min(activeIndex + spv + Math.max(amount, spv), slides.length);
            var minIndex = Math.max(activeIndex - Math.max(spv, amount), 0);
            // Next Slides
            for (var i$1 = activeIndex + slidesPerView; i$1 < maxIndex; i$1 += 1) {
              if (slideExist(i$1)) {
                swiper.lazy.loadInSlide(i$1);
              }
            }
            // Prev Slides
            for (var i$2 = minIndex; i$2 < activeIndex; i$2 += 1) {
              if (slideExist(i$2)) {
                swiper.lazy.loadInSlide(i$2);
              }
            }
          } else {
            var nextSlide = $wrapperEl.children(("." + (swiperParams.slideNextClass)));
            if (nextSlide.length > 0) {
              swiper.lazy.loadInSlide(slideIndex(nextSlide));
            }

            var prevSlide = $wrapperEl.children(("." + (swiperParams.slidePrevClass)));
            if (prevSlide.length > 0) {
              swiper.lazy.loadInSlide(slideIndex(prevSlide));
            }
          }
        }
      },
    };

    var Lazy$1 = {
      name: 'lazy',
      params: {
        lazy: {
          enabled: false,
          loadPrevNext: false,
          loadPrevNextAmount: 1,
          loadOnTransitionStart: false,

          elementClass: 'swiper-lazy',
          loadingClass: 'swiper-lazy-loading',
          loadedClass: 'swiper-lazy-loaded',
          preloaderClass: 'swiper-lazy-preloader',
        },
      },
      create: function create() {
        var swiper = this;
        Utils.extend(swiper, {
          lazy: {
            initialImageLoaded: false,
            load: Lazy.load.bind(swiper),
            loadInSlide: Lazy.loadInSlide.bind(swiper),
          },
        });
      },
      on: {
        beforeInit: function beforeInit() {
          var swiper = this;
          if (swiper.params.lazy.enabled && swiper.params.preloadImages) {
            swiper.params.preloadImages = false;
          }
        },
        init: function init() {
          var swiper = this;
          if (swiper.params.lazy.enabled && !swiper.params.loop && swiper.params.initialSlide === 0) {
            swiper.lazy.load();
          }
        },
        scroll: function scroll() {
          var swiper = this;
          if (swiper.params.freeMode && !swiper.params.freeModeSticky) {
            swiper.lazy.load();
          }
        },
        resize: function resize() {
          var swiper = this;
          if (swiper.params.lazy.enabled) {
            swiper.lazy.load();
          }
        },
        scrollbarDragMove: function scrollbarDragMove() {
          var swiper = this;
          if (swiper.params.lazy.enabled) {
            swiper.lazy.load();
          }
        },
        transitionStart: function transitionStart() {
          var swiper = this;
          if (swiper.params.lazy.enabled) {
            if (swiper.params.lazy.loadOnTransitionStart || (!swiper.params.lazy.loadOnTransitionStart && !swiper.lazy.initialImageLoaded)) {
              swiper.lazy.load();
            }
          }
        },
        transitionEnd: function transitionEnd() {
          var swiper = this;
          if (swiper.params.lazy.enabled && !swiper.params.lazy.loadOnTransitionStart) {
            swiper.lazy.load();
          }
        },
      },
    };

    /* eslint no-bitwise: ["error", { "allow": [">>"] }] */

    var Controller = {
      LinearSpline: function LinearSpline(x, y) {
        var binarySearch = (function search() {
          var maxIndex;
          var minIndex;
          var guess;
          return function (array, val) {
            minIndex = -1;
            maxIndex = array.length;
            while (maxIndex - minIndex > 1) {
              guess = maxIndex + minIndex >> 1;
              if (array[guess] <= val) {
                minIndex = guess;
              } else {
                maxIndex = guess;
              }
            }
            return maxIndex;
          };
        }());
        this.x = x;
        this.y = y;
        this.lastIndex = x.length - 1;
        // Given an x value (x2), return the expected y2 value:
        // (x1,y1) is the known point before given value,
        // (x3,y3) is the known point after given value.
        var i1;
        var i3;

        this.interpolate = function interpolate(x2) {
          if (!x2) {
            return 0;
          }

          // Get the indexes of x1 and x3 (the array indexes before and after given x2):
          i3 = binarySearch(this.x, x2);
          i1 = i3 - 1;

          // We have our indexes i1 & i3, so we can calculate already:
          // y2 := ((x2−x1) × (y3−y1)) ÷ (x3−x1) + y1
          return (((x2 - this.x[i1]) * (this.y[i3] - this.y[i1])) / (this.x[i3] - this.x[i1])) + this.y[i1];
        };
        return this;
      },
      // xxx: for now i will just save one spline function to to
      getInterpolateFunction: function getInterpolateFunction(c) {
        var swiper = this;
        if (!swiper.controller.spline) {
          swiper.controller.spline = swiper.params.loop
            ? new Controller.LinearSpline(swiper.slidesGrid, c.slidesGrid)
            : new Controller.LinearSpline(swiper.snapGrid, c.snapGrid);
        }
      },
      setTranslate: function setTranslate(setTranslate$1, byController) {
        var swiper = this;
        var controlled = swiper.controller.control;
        var multiplier;
        var controlledTranslate;

        function setControlledTranslate(c) {
          // this will create an Interpolate function based on the snapGrids
          // x is the Grid of the scrolled scroller and y will be the controlled scroller
          // it makes sense to create this only once and recall it for the interpolation
          // the function does a lot of value caching for performance
          var translate = swiper.rtlTranslate ? -swiper.translate : swiper.translate;
          if (swiper.params.controller.by === 'slide') {
            swiper.controller.getInterpolateFunction(c);
            // i am not sure why the values have to be multiplicated this way, tried to invert the snapGrid
            // but it did not work out
            controlledTranslate = -swiper.controller.spline.interpolate(-translate);
          }

          if (!controlledTranslate || swiper.params.controller.by === 'container') {
            multiplier = (c.maxTranslate() - c.minTranslate()) / (swiper.maxTranslate() - swiper.minTranslate());
            controlledTranslate = ((translate - swiper.minTranslate()) * multiplier) + c.minTranslate();
          }

          if (swiper.params.controller.inverse) {
            controlledTranslate = c.maxTranslate() - controlledTranslate;
          }
          c.updateProgress(controlledTranslate);
          c.setTranslate(controlledTranslate, swiper);
          c.updateActiveIndex();
          c.updateSlidesClasses();
        }

        if (Array.isArray(controlled)) {
          for (var i = 0; i < controlled.length; i += 1) {
            if (controlled[i] !== byController && controlled[i] instanceof Swiper) {
              setControlledTranslate(controlled[i]);
            }
          }
        } else if (controlled instanceof Swiper && byController !== controlled) {
          setControlledTranslate(controlled);
        }
      },
      setTransition: function setTransition(duration, byController) {
        var swiper = this;
        var controlled = swiper.controller.control;
        var i;

        function setControlledTransition(c) {
          c.setTransition(duration, swiper);
          if (duration !== 0) {
            c.transitionStart();
            if (c.params.autoHeight) {
              Utils.nextTick(function () {
                c.updateAutoHeight();
              });
            }
            c.$wrapperEl.transitionEnd(function () {
              if (!controlled) {
                return;
              }
              if (c.params.loop && swiper.params.controller.by === 'slide') {
                c.loopFix();
              }
              c.transitionEnd();
            });
          }
        }

        if (Array.isArray(controlled)) {
          for (i = 0; i < controlled.length; i += 1) {
            if (controlled[i] !== byController && controlled[i] instanceof Swiper) {
              setControlledTransition(controlled[i]);
            }
          }
        } else if (controlled instanceof Swiper && byController !== controlled) {
          setControlledTransition(controlled);
        }
      },
    };
    var Controller$1 = {
      name: 'controller',
      params: {
        controller: {
          control: undefined,
          inverse: false,
          by: 'slide', // or 'container'
        },
      },
      create: function create() {
        var swiper = this;
        Utils.extend(swiper, {
          controller: {
            control: swiper.params.controller.control,
            getInterpolateFunction: Controller.getInterpolateFunction.bind(swiper),
            setTranslate: Controller.setTranslate.bind(swiper),
            setTransition: Controller.setTransition.bind(swiper),
          },
        });
      },
      on: {
        update: function update() {
          var swiper = this;
          if (!swiper.controller.control) {
            return;
          }
          if (swiper.controller.spline) {
            swiper.controller.spline = undefined;
            delete swiper.controller.spline;
          }
        },
        resize: function resize() {
          var swiper = this;
          if (!swiper.controller.control) {
            return;
          }
          if (swiper.controller.spline) {
            swiper.controller.spline = undefined;
            delete swiper.controller.spline;
          }
        },
        observerUpdate: function observerUpdate() {
          var swiper = this;
          if (!swiper.controller.control) {
            return;
          }
          if (swiper.controller.spline) {
            swiper.controller.spline = undefined;
            delete swiper.controller.spline;
          }
        },
        setTranslate: function setTranslate(translate, byController) {
          var swiper = this;
          if (!swiper.controller.control) {
            return;
          }
          swiper.controller.setTranslate(translate, byController);
        },
        setTransition: function setTransition(duration, byController) {
          var swiper = this;
          if (!swiper.controller.control) {
            return;
          }
          swiper.controller.setTransition(duration, byController);
        },
      },
    };

    var a11y = {
      makeElFocusable: function makeElFocusable($el) {
        $el.attr('tabIndex', '0');
        return $el;
      },
      addElRole: function addElRole($el, role) {
        $el.attr('role', role);
        return $el;
      },
      addElLabel: function addElLabel($el, label) {
        $el.attr('aria-label', label);
        return $el;
      },
      disableEl: function disableEl($el) {
        $el.attr('aria-disabled', true);
        return $el;
      },
      enableEl: function enableEl($el) {
        $el.attr('aria-disabled', false);
        return $el;
      },
      onEnterKey: function onEnterKey(e) {
        var swiper = this;
        var params = swiper.params.a11y;
        if (e.keyCode !== 13) {
          return;
        }
        var $targetEl = $(e.target);
        if (swiper.navigation && swiper.navigation.$nextEl && $targetEl.is(swiper.navigation.$nextEl)) {
          if (!(swiper.isEnd && !swiper.params.loop)) {
            swiper.slideNext();
          }
          if (swiper.isEnd) {
            swiper.a11y.notify(params.lastSlideMessage);
          } else {
            swiper.a11y.notify(params.nextSlideMessage);
          }
        }
        if (swiper.navigation && swiper.navigation.$prevEl && $targetEl.is(swiper.navigation.$prevEl)) {
          if (!(swiper.isBeginning && !swiper.params.loop)) {
            swiper.slidePrev();
          }
          if (swiper.isBeginning) {
            swiper.a11y.notify(params.firstSlideMessage);
          } else {
            swiper.a11y.notify(params.prevSlideMessage);
          }
        }
        if (swiper.pagination && $targetEl.is(("." + (swiper.params.pagination.bulletClass)))) {
          $targetEl[0].click();
        }
      },
      notify: function notify(message) {
        var swiper = this;
        var notification = swiper.a11y.liveRegion;
        if (notification.length === 0) {
          return;
        }
        notification.html('');
        notification.html(message);
      },
      updateNavigation: function updateNavigation() {
        var swiper = this;

        if (swiper.params.loop) {
          return;
        }
        var ref = swiper.navigation;
        var $nextEl = ref.$nextEl;
        var $prevEl = ref.$prevEl;

        if ($prevEl && $prevEl.length > 0) {
          if (swiper.isBeginning) {
            swiper.a11y.disableEl($prevEl);
          } else {
            swiper.a11y.enableEl($prevEl);
          }
        }
        if ($nextEl && $nextEl.length > 0) {
          if (swiper.isEnd) {
            swiper.a11y.disableEl($nextEl);
          } else {
            swiper.a11y.enableEl($nextEl);
          }
        }
      },
      updatePagination: function updatePagination() {
        var swiper = this;
        var params = swiper.params.a11y;
        if (swiper.pagination && swiper.params.pagination.clickable && swiper.pagination.bullets && swiper.pagination.bullets.length) {
          swiper.pagination.bullets.each(function (bulletIndex, bulletEl) {
            var $bulletEl = $(bulletEl);
            swiper.a11y.makeElFocusable($bulletEl);
            swiper.a11y.addElRole($bulletEl, 'button');
            swiper.a11y.addElLabel($bulletEl, params.paginationBulletMessage.replace(/{{index}}/, $bulletEl.index() + 1));
          });
        }
      },
      init: function init() {
        var swiper = this;

        swiper.$el.append(swiper.a11y.liveRegion);

        // Navigation
        var params = swiper.params.a11y;
        var $nextEl;
        var $prevEl;
        if (swiper.navigation && swiper.navigation.$nextEl) {
          $nextEl = swiper.navigation.$nextEl;
        }
        if (swiper.navigation && swiper.navigation.$prevEl) {
          $prevEl = swiper.navigation.$prevEl;
        }
        if ($nextEl) {
          swiper.a11y.makeElFocusable($nextEl);
          swiper.a11y.addElRole($nextEl, 'button');
          swiper.a11y.addElLabel($nextEl, params.nextSlideMessage);
          $nextEl.on('keydown', swiper.a11y.onEnterKey);
        }
        if ($prevEl) {
          swiper.a11y.makeElFocusable($prevEl);
          swiper.a11y.addElRole($prevEl, 'button');
          swiper.a11y.addElLabel($prevEl, params.prevSlideMessage);
          $prevEl.on('keydown', swiper.a11y.onEnterKey);
        }

        // Pagination
        if (swiper.pagination && swiper.params.pagination.clickable && swiper.pagination.bullets && swiper.pagination.bullets.length) {
          swiper.pagination.$el.on('keydown', ("." + (swiper.params.pagination.bulletClass)), swiper.a11y.onEnterKey);
        }
      },
      destroy: function destroy() {
        var swiper = this;
        if (swiper.a11y.liveRegion && swiper.a11y.liveRegion.length > 0) {
          swiper.a11y.liveRegion.remove();
        }

        var $nextEl;
        var $prevEl;
        if (swiper.navigation && swiper.navigation.$nextEl) {
          $nextEl = swiper.navigation.$nextEl;
        }
        if (swiper.navigation && swiper.navigation.$prevEl) {
          $prevEl = swiper.navigation.$prevEl;
        }
        if ($nextEl) {
          $nextEl.off('keydown', swiper.a11y.onEnterKey);
        }
        if ($prevEl) {
          $prevEl.off('keydown', swiper.a11y.onEnterKey);
        }

        // Pagination
        if (swiper.pagination && swiper.params.pagination.clickable && swiper.pagination.bullets && swiper.pagination.bullets.length) {
          swiper.pagination.$el.off('keydown', ("." + (swiper.params.pagination.bulletClass)), swiper.a11y.onEnterKey);
        }
      },
    };
    var A11y = {
      name: 'a11y',
      params: {
        a11y: {
          enabled: true,
          notificationClass: 'swiper-notification',
          prevSlideMessage: 'Previous slide',
          nextSlideMessage: 'Next slide',
          firstSlideMessage: 'This is the first slide',
          lastSlideMessage: 'This is the last slide',
          paginationBulletMessage: 'Go to slide {{index}}',
        },
      },
      create: function create() {
        var swiper = this;
        Utils.extend(swiper, {
          a11y: {
            liveRegion: $(("<span class=\"" + (swiper.params.a11y.notificationClass) + "\" aria-live=\"assertive\" aria-atomic=\"true\"></span>")),
          },
        });
        Object.keys(a11y).forEach(function (methodName) {
          swiper.a11y[methodName] = a11y[methodName].bind(swiper);
        });
      },
      on: {
        init: function init() {
          var swiper = this;
          if (!swiper.params.a11y.enabled) {
            return;
          }
          swiper.a11y.init();
          swiper.a11y.updateNavigation();
        },
        toEdge: function toEdge() {
          var swiper = this;
          if (!swiper.params.a11y.enabled) {
            return;
          }
          swiper.a11y.updateNavigation();
        },
        fromEdge: function fromEdge() {
          var swiper = this;
          if (!swiper.params.a11y.enabled) {
            return;
          }
          swiper.a11y.updateNavigation();
        },
        paginationUpdate: function paginationUpdate() {
          var swiper = this;
          if (!swiper.params.a11y.enabled) {
            return;
          }
          swiper.a11y.updatePagination();
        },
        destroy: function destroy() {
          var swiper = this;
          if (!swiper.params.a11y.enabled) {
            return;
          }
          swiper.a11y.destroy();
        },
      },
    };

    var History = {
      init: function init() {
        var swiper = this;
        if (!swiper.params.history) {
          return;
        }
        if (!win.history || !win.history.pushState) {
          swiper.params.history.enabled = false;
          swiper.params.hashNavigation.enabled = true;
          return;
        }
        var history = swiper.history;
        history.initialized = true;
        history.paths = History.getPathValues();
        if (!history.paths.key && !history.paths.value) {
          return;
        }
        history.scrollToSlide(0, history.paths.value, swiper.params.runCallbacksOnInit);
        if (!swiper.params.history.replaceState) {
          win.addEventListener('popstate', swiper.history.setHistoryPopState);
        }
      },
      destroy: function destroy() {
        var swiper = this;
        if (!swiper.params.history.replaceState) {
          win.removeEventListener('popstate', swiper.history.setHistoryPopState);
        }
      },
      setHistoryPopState: function setHistoryPopState() {
        var swiper = this;
        swiper.history.paths = History.getPathValues();
        swiper.history.scrollToSlide(swiper.params.speed, swiper.history.paths.value, false);
      },
      getPathValues: function getPathValues() {
        var pathArray = win.location.pathname.slice(1).split('/').filter(function (part) {
          return part !== '';
        });
        var total = pathArray.length;
        var key = pathArray[total - 2];
        var value = pathArray[total - 1];
        return {key: key, value: value};
      },
      setHistory: function setHistory(key, index) {
        var swiper = this;
        if (!swiper.history.initialized || !swiper.params.history.enabled) {
          return;
        }
        var slide = swiper.slides.eq(index);
        var value = History.slugify(slide.attr('data-history'));
        if (!win.location.pathname.includes(key)) {
          value = key + "/" + value;
        }
        var currentState = win.history.state;
        if (currentState && currentState.value === value) {
          return;
        }
        if (swiper.params.history.replaceState) {
          win.history.replaceState({value: value}, null, value);
        } else {
          win.history.pushState({value: value}, null, value);
        }
      },
      slugify: function slugify(text) {
        return text.toString()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '')
          .replace(/--+/g, '-')
          .replace(/^-+/, '')
          .replace(/-+$/, '');
      },
      scrollToSlide: function scrollToSlide(speed, value, runCallbacks) {
        var swiper = this;
        if (value) {
          for (var i = 0, length = swiper.slides.length; i < length; i += 1) {
            var slide = swiper.slides.eq(i);
            var slideHistory = History.slugify(slide.attr('data-history'));
            if (slideHistory === value && !slide.hasClass(swiper.params.slideDuplicateClass)) {
              var index = slide.index();
              swiper.slideTo(index, speed, runCallbacks);
            }
          }
        } else {
          swiper.slideTo(0, speed, runCallbacks);
        }
      },
    };

    var History$1 = {
      name: 'history',
      params: {
        history: {
          enabled: false,
          replaceState: false,
          key: 'slides',
        },
      },
      create: function create() {
        var swiper = this;
        Utils.extend(swiper, {
          history: {
            init: History.init.bind(swiper),
            setHistory: History.setHistory.bind(swiper),
            setHistoryPopState: History.setHistoryPopState.bind(swiper),
            scrollToSlide: History.scrollToSlide.bind(swiper),
            destroy: History.destroy.bind(swiper),
          },
        });
      },
      on: {
        init: function init() {
          var swiper = this;
          if (swiper.params.history.enabled) {
            swiper.history.init();
          }
        },
        destroy: function destroy() {
          var swiper = this;
          if (swiper.params.history.enabled) {
            swiper.history.destroy();
          }
        },
        transitionEnd: function transitionEnd() {
          var swiper = this;
          if (swiper.history.initialized) {
            swiper.history.setHistory(swiper.params.history.key, swiper.activeIndex);
          }
        },
      },
    };

    var HashNavigation = {
      onHashCange: function onHashCange() {
        var swiper = this;
        var newHash = doc.location.hash.replace('#', '');
        var activeSlideHash = swiper.slides.eq(swiper.activeIndex).attr('data-hash');
        if (newHash !== activeSlideHash) {
          var newIndex = swiper.$wrapperEl.children(("." + (swiper.params.slideClass) + "[data-hash=\"" + newHash + "\"]")).index();
          if (typeof newIndex === 'undefined') {
            return;
          }
          swiper.slideTo(newIndex);
        }
      },
      setHash: function setHash() {
        var swiper = this;
        if (!swiper.hashNavigation.initialized || !swiper.params.hashNavigation.enabled) {
          return;
        }
        if (swiper.params.hashNavigation.replaceState && win.history && win.history.replaceState) {
          win.history.replaceState(null, null, (("#" + (swiper.slides.eq(swiper.activeIndex).attr('data-hash'))) || ''));
        } else {
          var slide = swiper.slides.eq(swiper.activeIndex);
          var hash = slide.attr('data-hash') || slide.attr('data-history');
          doc.location.hash = hash || '';
        }
      },
      init: function init() {
        var swiper = this;
        if (!swiper.params.hashNavigation.enabled || (swiper.params.history && swiper.params.history.enabled)) {
          return;
        }
        swiper.hashNavigation.initialized = true;
        var hash = doc.location.hash.replace('#', '');
        if (hash) {
          var speed = 0;
          for (var i = 0, length = swiper.slides.length; i < length; i += 1) {
            var slide = swiper.slides.eq(i);
            var slideHash = slide.attr('data-hash') || slide.attr('data-history');
            if (slideHash === hash && !slide.hasClass(swiper.params.slideDuplicateClass)) {
              var index = slide.index();
              swiper.slideTo(index, speed, swiper.params.runCallbacksOnInit, true);
            }
          }
        }
        if (swiper.params.hashNavigation.watchState) {
          $(win).on('hashchange', swiper.hashNavigation.onHashCange);
        }
      },
      destroy: function destroy() {
        var swiper = this;
        if (swiper.params.hashNavigation.watchState) {
          $(win).off('hashchange', swiper.hashNavigation.onHashCange);
        }
      },
    };
    var HashNavigation$1 = {
      name: 'hash-navigation',
      params: {
        hashNavigation: {
          enabled: false,
          replaceState: false,
          watchState: false,
        },
      },
      create: function create() {
        var swiper = this;
        Utils.extend(swiper, {
          hashNavigation: {
            initialized: false,
            init: HashNavigation.init.bind(swiper),
            destroy: HashNavigation.destroy.bind(swiper),
            setHash: HashNavigation.setHash.bind(swiper),
            onHashCange: HashNavigation.onHashCange.bind(swiper),
          },
        });
      },
      on: {
        init: function init() {
          var swiper = this;
          if (swiper.params.hashNavigation.enabled) {
            swiper.hashNavigation.init();
          }
        },
        destroy: function destroy() {
          var swiper = this;
          if (swiper.params.hashNavigation.enabled) {
            swiper.hashNavigation.destroy();
          }
        },
        transitionEnd: function transitionEnd() {
          var swiper = this;
          if (swiper.hashNavigation.initialized) {
            swiper.hashNavigation.setHash();
          }
        },
      },
    };

    /* eslint no-underscore-dangle: "off" */

    var Autoplay = {
      run: function run() {
        var swiper = this;
        var $activeSlideEl = swiper.slides.eq(swiper.activeIndex);
        var delay = swiper.params.autoplay.delay;
        if ($activeSlideEl.attr('data-swiper-autoplay')) {
          delay = $activeSlideEl.attr('data-swiper-autoplay') || swiper.params.autoplay.delay;
        }
        swiper.autoplay.timeout = Utils.nextTick(function () {
          if (swiper.params.autoplay.reverseDirection) {
            if (swiper.params.loop) {
              swiper.loopFix();
              swiper.slidePrev(swiper.params.speed, true, true);
              swiper.emit('autoplay');
            } else if (!swiper.isBeginning) {
              swiper.slidePrev(swiper.params.speed, true, true);
              swiper.emit('autoplay');
            } else if (!swiper.params.autoplay.stopOnLastSlide) {
              swiper.slideTo(swiper.slides.length - 1, swiper.params.speed, true, true);
              swiper.emit('autoplay');
            } else {
              swiper.autoplay.stop();
            }
          } else if (swiper.params.loop) {
            swiper.loopFix();
            swiper.slideNext(swiper.params.speed, true, true);
            swiper.emit('autoplay');
          } else if (!swiper.isEnd) {
            swiper.slideNext(swiper.params.speed, true, true);
            swiper.emit('autoplay');
          } else if (!swiper.params.autoplay.stopOnLastSlide) {
            swiper.slideTo(0, swiper.params.speed, true, true);
            swiper.emit('autoplay');
          } else {
            swiper.autoplay.stop();
          }
        }, delay);
      },
      start: function start() {
        var swiper = this;
        if (typeof swiper.autoplay.timeout !== 'undefined') {
          return false;
        }
        if (swiper.autoplay.running) {
          return false;
        }
        swiper.autoplay.running = true;
        swiper.emit('autoplayStart');
        swiper.autoplay.run();
        return true;
      },
      stop: function stop() {
        var swiper = this;
        if (!swiper.autoplay.running) {
          return false;
        }
        if (typeof swiper.autoplay.timeout === 'undefined') {
          return false;
        }

        if (swiper.autoplay.timeout) {
          clearTimeout(swiper.autoplay.timeout);
          swiper.autoplay.timeout = undefined;
        }
        swiper.autoplay.running = false;
        swiper.emit('autoplayStop');
        return true;
      },
      pause: function pause(speed) {
        var swiper = this;
        if (!swiper.autoplay.running) {
          return;
        }
        if (swiper.autoplay.paused) {
          return;
        }
        if (swiper.autoplay.timeout) {
          clearTimeout(swiper.autoplay.timeout);
        }
        swiper.autoplay.paused = true;
        if (speed === 0 || !swiper.params.autoplay.waitForTransition) {
          swiper.autoplay.paused = false;
          swiper.autoplay.run();
        } else {
          swiper.$wrapperEl[0].addEventListener('transitionend', swiper.autoplay.onTransitionEnd);
          swiper.$wrapperEl[0].addEventListener('webkitTransitionEnd', swiper.autoplay.onTransitionEnd);
        }
      },
    };

    var Autoplay$1 = {
      name: 'autoplay',
      params: {
        autoplay: {
          enabled: false,
          delay: 3000,
          waitForTransition: true,
          disableOnInteraction: true,
          stopOnLastSlide: false,
          reverseDirection: false,
        },
      },
      create: function create() {
        var swiper = this;
        Utils.extend(swiper, {
          autoplay: {
            running: false,
            paused: false,
            run: Autoplay.run.bind(swiper),
            start: Autoplay.start.bind(swiper),
            stop: Autoplay.stop.bind(swiper),
            pause: Autoplay.pause.bind(swiper),
            onTransitionEnd: function onTransitionEnd(e) {
              if (!swiper || swiper.destroyed || !swiper.$wrapperEl) {
                return;
              }
              if (e.target !== this) {
                return;
              }
              swiper.$wrapperEl[0].removeEventListener('transitionend', swiper.autoplay.onTransitionEnd);
              swiper.$wrapperEl[0].removeEventListener('webkitTransitionEnd', swiper.autoplay.onTransitionEnd);
              swiper.autoplay.paused = false;
              if (!swiper.autoplay.running) {
                swiper.autoplay.stop();
              } else {
                swiper.autoplay.run();
              }
            },
          },
        });
      },
      on: {
        init: function init() {
          var swiper = this;
          if (swiper.params.autoplay.enabled) {
            swiper.autoplay.start();
          }
        },
        beforeTransitionStart: function beforeTransitionStart(speed, internal) {
          var swiper = this;
          if (swiper.autoplay.running) {
            if (internal || !swiper.params.autoplay.disableOnInteraction) {
              swiper.autoplay.pause(speed);
            } else {
              swiper.autoplay.stop();
            }
          }
        },
        sliderFirstMove: function sliderFirstMove() {
          var swiper = this;
          if (swiper.autoplay.running) {
            if (swiper.params.autoplay.disableOnInteraction) {
              swiper.autoplay.stop();
            } else {
              swiper.autoplay.pause();
            }
          }
        },
        destroy: function destroy() {
          var swiper = this;
          if (swiper.autoplay.running) {
            swiper.autoplay.stop();
          }
        },
      },
    };

    var Fade = {
      setTranslate: function setTranslate() {
        var swiper = this;
        var slides = swiper.slides;
        for (var i = 0; i < slides.length; i += 1) {
          var $slideEl = swiper.slides.eq(i);
          var offset = $slideEl[0].swiperSlideOffset;
          var tx = -offset;
          if (!swiper.params.virtualTranslate) {
            tx -= swiper.translate;
          }
          var ty = 0;
          if (!swiper.isHorizontal()) {
            ty = tx;
            tx = 0;
          }
          var slideOpacity = swiper.params.fadeEffect.crossFade
            ? Math.max(1 - Math.abs($slideEl[0].progress), 0)
            : 1 + Math.min(Math.max($slideEl[0].progress, -1), 0);
          $slideEl
            .css({
              opacity: slideOpacity,
            })
            .transform(("translate3d(" + tx + "px, " + ty + "px, 0px)"));
        }
      },
      setTransition: function setTransition(duration) {
        var swiper = this;
        var slides = swiper.slides;
        var $wrapperEl = swiper.$wrapperEl;
        slides.transition(duration);
        if (swiper.params.virtualTranslate && duration !== 0) {
          var eventTriggered = false;
          slides.transitionEnd(function () {
            if (eventTriggered) {
              return;
            }
            if (!swiper || swiper.destroyed) {
              return;
            }
            eventTriggered = true;
            swiper.animating = false;
            var triggerEvents = ['webkitTransitionEnd', 'transitionend'];
            for (var i = 0; i < triggerEvents.length; i += 1) {
              $wrapperEl.trigger(triggerEvents[i]);
            }
          });
        }
      },
    };

    var EffectFade = {
      name: 'effect-fade',
      params: {
        fadeEffect: {
          crossFade: false,
        },
      },
      create: function create() {
        var swiper = this;
        Utils.extend(swiper, {
          fadeEffect: {
            setTranslate: Fade.setTranslate.bind(swiper),
            setTransition: Fade.setTransition.bind(swiper),
          },
        });
      },
      on: {
        beforeInit: function beforeInit() {
          var swiper = this;
          if (swiper.params.effect !== 'fade') {
            return;
          }
          swiper.classNames.push(((swiper.params.containerModifierClass) + "fade"));
          var overwriteParams = {
            slidesPerView: 1,
            slidesPerColumn: 1,
            slidesPerGroup: 1,
            watchSlidesProgress: true,
            spaceBetween: 0,
            virtualTranslate: true,
          };
          Utils.extend(swiper.params, overwriteParams);
          Utils.extend(swiper.originalParams, overwriteParams);
        },
        setTranslate: function setTranslate() {
          var swiper = this;
          if (swiper.params.effect !== 'fade') {
            return;
          }
          swiper.fadeEffect.setTranslate();
        },
        setTransition: function setTransition(duration) {
          var swiper = this;
          if (swiper.params.effect !== 'fade') {
            return;
          }
          swiper.fadeEffect.setTransition(duration);
        },
      },
    };

    var Cube = {
      setTranslate: function setTranslate() {
        var swiper = this;
        var $el = swiper.$el;
        var $wrapperEl = swiper.$wrapperEl;
        var slides = swiper.slides;
        var swiperWidth = swiper.width;
        var swiperHeight = swiper.height;
        var rtl = swiper.rtlTranslate;
        var swiperSize = swiper.size;
        var params = swiper.params.cubeEffect;
        var isHorizontal = swiper.isHorizontal();
        var isVirtual = swiper.virtual && swiper.params.virtual.enabled;
        var wrapperRotate = 0;
        var $cubeShadowEl;
        if (params.shadow) {
          if (isHorizontal) {
            $cubeShadowEl = $wrapperEl.find('.swiper-cube-shadow');
            if ($cubeShadowEl.length === 0) {
              $cubeShadowEl = $('<div class="swiper-cube-shadow"></div>');
              $wrapperEl.append($cubeShadowEl);
            }
            $cubeShadowEl.css({height: (swiperWidth + "px")});
          } else {
            $cubeShadowEl = $el.find('.swiper-cube-shadow');
            if ($cubeShadowEl.length === 0) {
              $cubeShadowEl = $('<div class="swiper-cube-shadow"></div>');
              $el.append($cubeShadowEl);
            }
          }
        }
        for (var i = 0; i < slides.length; i += 1) {
          var $slideEl = slides.eq(i);
          var slideIndex = i;
          if (isVirtual) {
            slideIndex = parseInt($slideEl.attr('data-swiper-slide-index'), 10);
          }
          var slideAngle = slideIndex * 90;
          var round = Math.floor(slideAngle / 360);
          if (rtl) {
            slideAngle = -slideAngle;
            round = Math.floor(-slideAngle / 360);
          }
          var progress = Math.max(Math.min($slideEl[0].progress, 1), -1);
          var tx = 0;
          var ty = 0;
          var tz = 0;
          if (slideIndex % 4 === 0) {
            tx = -round * 4 * swiperSize;
            tz = 0;
          } else if ((slideIndex - 1) % 4 === 0) {
            tx = 0;
            tz = -round * 4 * swiperSize;
          } else if ((slideIndex - 2) % 4 === 0) {
            tx = swiperSize + (round * 4 * swiperSize);
            tz = swiperSize;
          } else if ((slideIndex - 3) % 4 === 0) {
            tx = -swiperSize;
            tz = (3 * swiperSize) + (swiperSize * 4 * round);
          }
          if (rtl) {
            tx = -tx;
          }

          if (!isHorizontal) {
            ty = tx;
            tx = 0;
          }

          var transform = "rotateX(" + (isHorizontal ? 0 : -slideAngle) + "deg) rotateY(" + (isHorizontal ? slideAngle : 0) + "deg) translate3d(" + tx + "px, " + ty + "px, " + tz + "px)";
          if (progress <= 1 && progress > -1) {
            wrapperRotate = (slideIndex * 90) + (progress * 90);
            if (rtl) {
              wrapperRotate = (-slideIndex * 90) - (progress * 90);
            }
          }
          $slideEl.transform(transform);
          if (params.slideShadows) {
            // Set shadows
            var shadowBefore = isHorizontal ? $slideEl.find('.swiper-slide-shadow-left') : $slideEl.find('.swiper-slide-shadow-top');
            var shadowAfter = isHorizontal ? $slideEl.find('.swiper-slide-shadow-right') : $slideEl.find('.swiper-slide-shadow-bottom');
            if (shadowBefore.length === 0) {
              shadowBefore = $(("<div class=\"swiper-slide-shadow-" + (isHorizontal ? 'left' : 'top') + "\"></div>"));
              $slideEl.append(shadowBefore);
            }
            if (shadowAfter.length === 0) {
              shadowAfter = $(("<div class=\"swiper-slide-shadow-" + (isHorizontal ? 'right' : 'bottom') + "\"></div>"));
              $slideEl.append(shadowAfter);
            }
            if (shadowBefore.length) {
              shadowBefore[0].style.opacity = Math.max(-progress, 0);
            }
            if (shadowAfter.length) {
              shadowAfter[0].style.opacity = Math.max(progress, 0);
            }
          }
        }
        $wrapperEl.css({
          '-webkit-transform-origin': ("50% 50% -" + (swiperSize / 2) + "px"),
          '-moz-transform-origin': ("50% 50% -" + (swiperSize / 2) + "px"),
          '-ms-transform-origin': ("50% 50% -" + (swiperSize / 2) + "px"),
          'transform-origin': ("50% 50% -" + (swiperSize / 2) + "px"),
        });

        if (params.shadow) {
          if (isHorizontal) {
            $cubeShadowEl.transform(("translate3d(0px, " + ((swiperWidth / 2) + params.shadowOffset) + "px, " + (-swiperWidth / 2) + "px) rotateX(90deg) rotateZ(0deg) scale(" + (params.shadowScale) + ")"));
          } else {
            var shadowAngle = Math.abs(wrapperRotate) - (Math.floor(Math.abs(wrapperRotate) / 90) * 90);
            var multiplier = 1.5 - (
              (Math.sin((shadowAngle * 2 * Math.PI) / 360) / 2)
              + (Math.cos((shadowAngle * 2 * Math.PI) / 360) / 2)
            );
            var scale1 = params.shadowScale;
            var scale2 = params.shadowScale / multiplier;
            var offset = params.shadowOffset;
            $cubeShadowEl.transform(("scale3d(" + scale1 + ", 1, " + scale2 + ") translate3d(0px, " + ((swiperHeight / 2) + offset) + "px, " + (-swiperHeight / 2 / scale2) + "px) rotateX(-90deg)"));
          }
        }
        var zFactor = (Browser.isSafari || Browser.isUiWebView) ? (-swiperSize / 2) : 0;
        $wrapperEl
          .transform(("translate3d(0px,0," + zFactor + "px) rotateX(" + (swiper.isHorizontal() ? 0 : wrapperRotate) + "deg) rotateY(" + (swiper.isHorizontal() ? -wrapperRotate : 0) + "deg)"));
      },
      setTransition: function setTransition(duration) {
        var swiper = this;
        var $el = swiper.$el;
        var slides = swiper.slides;
        slides
          .transition(duration)
          .find('.swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left')
          .transition(duration);
        if (swiper.params.cubeEffect.shadow && !swiper.isHorizontal()) {
          $el.find('.swiper-cube-shadow').transition(duration);
        }
      },
    };

    var EffectCube = {
      name: 'effect-cube',
      params: {
        cubeEffect: {
          slideShadows: true,
          shadow: true,
          shadowOffset: 20,
          shadowScale: 0.94,
        },
      },
      create: function create() {
        var swiper = this;
        Utils.extend(swiper, {
          cubeEffect: {
            setTranslate: Cube.setTranslate.bind(swiper),
            setTransition: Cube.setTransition.bind(swiper),
          },
        });
      },
      on: {
        beforeInit: function beforeInit() {
          var swiper = this;
          if (swiper.params.effect !== 'cube') {
            return;
          }
          swiper.classNames.push(((swiper.params.containerModifierClass) + "cube"));
          swiper.classNames.push(((swiper.params.containerModifierClass) + "3d"));
          var overwriteParams = {
            slidesPerView: 1,
            slidesPerColumn: 1,
            slidesPerGroup: 1,
            watchSlidesProgress: true,
            resistanceRatio: 0,
            spaceBetween: 0,
            centeredSlides: false,
            virtualTranslate: true,
          };
          Utils.extend(swiper.params, overwriteParams);
          Utils.extend(swiper.originalParams, overwriteParams);
        },
        setTranslate: function setTranslate() {
          var swiper = this;
          if (swiper.params.effect !== 'cube') {
            return;
          }
          swiper.cubeEffect.setTranslate();
        },
        setTransition: function setTransition(duration) {
          var swiper = this;
          if (swiper.params.effect !== 'cube') {
            return;
          }
          swiper.cubeEffect.setTransition(duration);
        },
      },
    };

    var Flip = {
      setTranslate: function setTranslate() {
        var swiper = this;
        var slides = swiper.slides;
        var rtl = swiper.rtlTranslate;
        for (var i = 0; i < slides.length; i += 1) {
          var $slideEl = slides.eq(i);
          var progress = $slideEl[0].progress;
          if (swiper.params.flipEffect.limitRotation) {
            progress = Math.max(Math.min($slideEl[0].progress, 1), -1);
          }
          var offset = $slideEl[0].swiperSlideOffset;
          var rotate = -180 * progress;
          var rotateY = rotate;
          var rotateX = 0;
          var tx = -offset;
          var ty = 0;
          if (!swiper.isHorizontal()) {
            ty = tx;
            tx = 0;
            rotateX = -rotateY;
            rotateY = 0;
          } else if (rtl) {
            rotateY = -rotateY;
          }

          $slideEl[0].style.zIndex = -Math.abs(Math.round(progress)) + slides.length;

          if (swiper.params.flipEffect.slideShadows) {
            // Set shadows
            var shadowBefore = swiper.isHorizontal() ? $slideEl.find('.swiper-slide-shadow-left') : $slideEl.find('.swiper-slide-shadow-top');
            var shadowAfter = swiper.isHorizontal() ? $slideEl.find('.swiper-slide-shadow-right') : $slideEl.find('.swiper-slide-shadow-bottom');
            if (shadowBefore.length === 0) {
              shadowBefore = $(("<div class=\"swiper-slide-shadow-" + (swiper.isHorizontal() ? 'left' : 'top') + "\"></div>"));
              $slideEl.append(shadowBefore);
            }
            if (shadowAfter.length === 0) {
              shadowAfter = $(("<div class=\"swiper-slide-shadow-" + (swiper.isHorizontal() ? 'right' : 'bottom') + "\"></div>"));
              $slideEl.append(shadowAfter);
            }
            if (shadowBefore.length) {
              shadowBefore[0].style.opacity = Math.max(-progress, 0);
            }
            if (shadowAfter.length) {
              shadowAfter[0].style.opacity = Math.max(progress, 0);
            }
          }
          $slideEl
            .transform(("translate3d(" + tx + "px, " + ty + "px, 0px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg)"));
        }
      },
      setTransition: function setTransition(duration) {
        var swiper = this;
        var slides = swiper.slides;
        var activeIndex = swiper.activeIndex;
        var $wrapperEl = swiper.$wrapperEl;
        slides
          .transition(duration)
          .find('.swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left')
          .transition(duration);
        if (swiper.params.virtualTranslate && duration !== 0) {
          var eventTriggered = false;
          // eslint-disable-next-line
          slides.eq(activeIndex).transitionEnd(function onTransitionEnd() {
            if (eventTriggered) {
              return;
            }
            if (!swiper || swiper.destroyed) {
              return;
            }
            // if (!$(this).hasClass(swiper.params.slideActiveClass)) return;
            eventTriggered = true;
            swiper.animating = false;
            var triggerEvents = ['webkitTransitionEnd', 'transitionend'];
            for (var i = 0; i < triggerEvents.length; i += 1) {
              $wrapperEl.trigger(triggerEvents[i]);
            }
          });
        }
      },
    };

    var EffectFlip = {
      name: 'effect-flip',
      params: {
        flipEffect: {
          slideShadows: true,
          limitRotation: true,
        },
      },
      create: function create() {
        var swiper = this;
        Utils.extend(swiper, {
          flipEffect: {
            setTranslate: Flip.setTranslate.bind(swiper),
            setTransition: Flip.setTransition.bind(swiper),
          },
        });
      },
      on: {
        beforeInit: function beforeInit() {
          var swiper = this;
          if (swiper.params.effect !== 'flip') {
            return;
          }
          swiper.classNames.push(((swiper.params.containerModifierClass) + "flip"));
          swiper.classNames.push(((swiper.params.containerModifierClass) + "3d"));
          var overwriteParams = {
            slidesPerView: 1,
            slidesPerColumn: 1,
            slidesPerGroup: 1,
            watchSlidesProgress: true,
            spaceBetween: 0,
            virtualTranslate: true,
          };
          Utils.extend(swiper.params, overwriteParams);
          Utils.extend(swiper.originalParams, overwriteParams);
        },
        setTranslate: function setTranslate() {
          var swiper = this;
          if (swiper.params.effect !== 'flip') {
            return;
          }
          swiper.flipEffect.setTranslate();
        },
        setTransition: function setTransition(duration) {
          var swiper = this;
          if (swiper.params.effect !== 'flip') {
            return;
          }
          swiper.flipEffect.setTransition(duration);
        },
      },
    };

    var Coverflow = {
      setTranslate: function setTranslate() {
        var swiper = this;
        var swiperWidth = swiper.width;
        var swiperHeight = swiper.height;
        var slides = swiper.slides;
        var $wrapperEl = swiper.$wrapperEl;
        var slidesSizesGrid = swiper.slidesSizesGrid;
        var params = swiper.params.coverflowEffect;
        var isHorizontal = swiper.isHorizontal();
        var transform = swiper.translate;
        var center = isHorizontal ? -transform + (swiperWidth / 2) : -transform + (swiperHeight / 2);
        var rotate = isHorizontal ? params.rotate : -params.rotate;
        var translate = params.depth;
        // Each slide offset from center
        for (var i = 0, length = slides.length; i < length; i += 1) {
          var $slideEl = slides.eq(i);
          var slideSize = slidesSizesGrid[i];
          var slideOffset = $slideEl[0].swiperSlideOffset;
          var offsetMultiplier = ((center - slideOffset - (slideSize / 2)) / slideSize) * params.modifier;

          var rotateY = isHorizontal ? rotate * offsetMultiplier : 0;
          var rotateX = isHorizontal ? 0 : rotate * offsetMultiplier;
          // var rotateZ = 0
          var translateZ = -translate * Math.abs(offsetMultiplier);

          var translateY = isHorizontal ? 0 : params.stretch * (offsetMultiplier);
          var translateX = isHorizontal ? params.stretch * (offsetMultiplier) : 0;

          // Fix for ultra small values
          if (Math.abs(translateX) < 0.001) {
            translateX = 0;
          }
          if (Math.abs(translateY) < 0.001) {
            translateY = 0;
          }
          if (Math.abs(translateZ) < 0.001) {
            translateZ = 0;
          }
          if (Math.abs(rotateY) < 0.001) {
            rotateY = 0;
          }
          if (Math.abs(rotateX) < 0.001) {
            rotateX = 0;
          }

          var slideTransform = "translate3d(" + translateX + "px," + translateY + "px," + translateZ + "px)  rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg)";

          $slideEl.transform(slideTransform);
          $slideEl[0].style.zIndex = -Math.abs(Math.round(offsetMultiplier)) + 1;
          if (params.slideShadows) {
            // Set shadows
            var $shadowBeforeEl = isHorizontal ? $slideEl.find('.swiper-slide-shadow-left') : $slideEl.find('.swiper-slide-shadow-top');
            var $shadowAfterEl = isHorizontal ? $slideEl.find('.swiper-slide-shadow-right') : $slideEl.find('.swiper-slide-shadow-bottom');
            if ($shadowBeforeEl.length === 0) {
              $shadowBeforeEl = $(("<div class=\"swiper-slide-shadow-" + (isHorizontal ? 'left' : 'top') + "\"></div>"));
              $slideEl.append($shadowBeforeEl);
            }
            if ($shadowAfterEl.length === 0) {
              $shadowAfterEl = $(("<div class=\"swiper-slide-shadow-" + (isHorizontal ? 'right' : 'bottom') + "\"></div>"));
              $slideEl.append($shadowAfterEl);
            }
            if ($shadowBeforeEl.length) {
              $shadowBeforeEl[0].style.opacity = offsetMultiplier > 0 ? offsetMultiplier : 0;
            }
            if ($shadowAfterEl.length) {
              $shadowAfterEl[0].style.opacity = (-offsetMultiplier) > 0 ? -offsetMultiplier : 0;
            }
          }
        }

        // Set correct perspective for IE10
        if (Support.pointerEvents || Support.prefixedPointerEvents) {
          var ws = $wrapperEl[0].style;
          ws.perspectiveOrigin = center + "px 50%";
        }
      },
      setTransition: function setTransition(duration) {
        var swiper = this;
        swiper.slides
          .transition(duration)
          .find('.swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left')
          .transition(duration);
      },
    };

    var EffectCoverflow = {
      name: 'effect-coverflow',
      params: {
        coverflowEffect: {
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        },
      },
      create: function create() {
        var swiper = this;
        Utils.extend(swiper, {
          coverflowEffect: {
            setTranslate: Coverflow.setTranslate.bind(swiper),
            setTransition: Coverflow.setTransition.bind(swiper),
          },
        });
      },
      on: {
        beforeInit: function beforeInit() {
          var swiper = this;
          if (swiper.params.effect !== 'coverflow') {
            return;
          }

          swiper.classNames.push(((swiper.params.containerModifierClass) + "coverflow"));
          swiper.classNames.push(((swiper.params.containerModifierClass) + "3d"));

          swiper.params.watchSlidesProgress = true;
          swiper.originalParams.watchSlidesProgress = true;
        },
        setTranslate: function setTranslate() {
          var swiper = this;
          if (swiper.params.effect !== 'coverflow') {
            return;
          }
          swiper.coverflowEffect.setTranslate();
        },
        setTransition: function setTransition(duration) {
          var swiper = this;
          if (swiper.params.effect !== 'coverflow') {
            return;
          }
          swiper.coverflowEffect.setTransition(duration);
        },
      },
    };

    var Thumbs = {
      init: function init() {
        var swiper = this;
        var ref = swiper.params;
        var thumbsParams = ref.thumbs;
        var SwiperClass = swiper.constructor;
        if (thumbsParams.swiper instanceof SwiperClass) {
          swiper.thumbs.swiper = thumbsParams.swiper;
          Utils.extend(swiper.thumbs.swiper.originalParams, {
            watchSlidesProgress: true,
            slideToClickedSlide: false,
          });
          Utils.extend(swiper.thumbs.swiper.params, {
            watchSlidesProgress: true,
            slideToClickedSlide: false,
          });
        } else if (Utils.isObject(thumbsParams.swiper)) {
          swiper.thumbs.swiper = new SwiperClass(Utils.extend({}, thumbsParams.swiper, {
            watchSlidesVisibility: true,
            watchSlidesProgress: true,
            slideToClickedSlide: false,
          }));
          swiper.thumbs.swiperCreated = true;
        }
        swiper.thumbs.swiper.$el.addClass(swiper.params.thumbs.thumbsContainerClass);
        swiper.thumbs.swiper.on('tap', swiper.thumbs.onThumbClick);
      },
      onThumbClick: function onThumbClick() {
        var swiper = this;
        var thumbsSwiper = swiper.thumbs.swiper;
        if (!thumbsSwiper) {
          return;
        }
        var clickedIndex = thumbsSwiper.clickedIndex;
        var clickedSlide = thumbsSwiper.clickedSlide;
        if (clickedSlide && $(clickedSlide).hasClass(swiper.params.thumbs.slideThumbActiveClass)) {
          return;
        }
        if (typeof clickedIndex === 'undefined' || clickedIndex === null) {
          return;
        }
        var slideToIndex;
        if (thumbsSwiper.params.loop) {
          slideToIndex = parseInt($(thumbsSwiper.clickedSlide).attr('data-swiper-slide-index'), 10);
        } else {
          slideToIndex = clickedIndex;
        }
        if (swiper.params.loop) {
          var currentIndex = swiper.activeIndex;
          if (swiper.slides.eq(currentIndex).hasClass(swiper.params.slideDuplicateClass)) {
            swiper.loopFix();
            // eslint-disable-next-line
            swiper._clientLeft = swiper.$wrapperEl[0].clientLeft;
            currentIndex = swiper.activeIndex;
          }
          var prevIndex = swiper.slides.eq(currentIndex).prevAll(("[data-swiper-slide-index=\"" + slideToIndex + "\"]")).eq(0).index();
          var nextIndex = swiper.slides.eq(currentIndex).nextAll(("[data-swiper-slide-index=\"" + slideToIndex + "\"]")).eq(0).index();
          if (typeof prevIndex === 'undefined') {
            slideToIndex = nextIndex;
          } else if (typeof nextIndex === 'undefined') {
            slideToIndex = prevIndex;
          } else if (nextIndex - currentIndex < currentIndex - prevIndex) {
            slideToIndex = nextIndex;
          } else {
            slideToIndex = prevIndex;
          }
        }
        swiper.slideTo(slideToIndex);
      },
      update: function update(initial) {
        var swiper = this;
        var thumbsSwiper = swiper.thumbs.swiper;
        if (!thumbsSwiper) {
          return;
        }

        var slidesPerView = thumbsSwiper.params.slidesPerView === 'auto'
          ? thumbsSwiper.slidesPerViewDynamic()
          : thumbsSwiper.params.slidesPerView;

        if (swiper.realIndex !== thumbsSwiper.realIndex) {
          var currentThumbsIndex = thumbsSwiper.activeIndex;
          var newThumbsIndex;
          if (thumbsSwiper.params.loop) {
            if (thumbsSwiper.slides.eq(currentThumbsIndex).hasClass(thumbsSwiper.params.slideDuplicateClass)) {
              thumbsSwiper.loopFix();
              // eslint-disable-next-line
              thumbsSwiper._clientLeft = thumbsSwiper.$wrapperEl[0].clientLeft;
              currentThumbsIndex = thumbsSwiper.activeIndex;
            }
            // Find actual thumbs index to slide to
            var prevThumbsIndex = thumbsSwiper.slides.eq(currentThumbsIndex).prevAll(("[data-swiper-slide-index=\"" + (swiper.realIndex) + "\"]")).eq(0).index();
            var nextThumbsIndex = thumbsSwiper.slides.eq(currentThumbsIndex).nextAll(("[data-swiper-slide-index=\"" + (swiper.realIndex) + "\"]")).eq(0).index();
            if (typeof prevThumbsIndex === 'undefined') {
              newThumbsIndex = nextThumbsIndex;
            } else if (typeof nextThumbsIndex === 'undefined') {
              newThumbsIndex = prevThumbsIndex;
            } else if (nextThumbsIndex - currentThumbsIndex === currentThumbsIndex - prevThumbsIndex) {
              newThumbsIndex = currentThumbsIndex;
            } else if (nextThumbsIndex - currentThumbsIndex < currentThumbsIndex - prevThumbsIndex) {
              newThumbsIndex = nextThumbsIndex;
            } else {
              newThumbsIndex = prevThumbsIndex;
            }
          } else {
            newThumbsIndex = swiper.realIndex;
          }
          if (thumbsSwiper.visibleSlidesIndexes.indexOf(newThumbsIndex) < 0) {
            if (thumbsSwiper.params.centeredSlides) {
              if (newThumbsIndex > currentThumbsIndex) {
                newThumbsIndex = newThumbsIndex - Math.floor(slidesPerView / 2) + 1;
              } else {
                newThumbsIndex = newThumbsIndex + Math.floor(slidesPerView / 2) - 1;
              }
            } else if (newThumbsIndex > currentThumbsIndex) {
              newThumbsIndex = newThumbsIndex - slidesPerView + 1;
            }
            thumbsSwiper.slideTo(newThumbsIndex, initial ? 0 : undefined);
          }
        }

        // Activate thumbs
        var thumbsToActivate = 1;
        var thumbActiveClass = swiper.params.thumbs.slideThumbActiveClass;

        if (swiper.params.slidesPerView > 1 && !swiper.params.centeredSlides) {
          thumbsToActivate = swiper.params.slidesPerView;
        }

        thumbsSwiper.slides.removeClass(thumbActiveClass);
        if (thumbsSwiper.params.loop) {
          for (var i = 0; i < thumbsToActivate; i += 1) {
            thumbsSwiper.$wrapperEl.children(("[data-swiper-slide-index=\"" + (swiper.realIndex + i) + "\"]")).addClass(thumbActiveClass);
          }
        } else {
          for (var i$1 = 0; i$1 < thumbsToActivate; i$1 += 1) {
            thumbsSwiper.slides.eq(swiper.realIndex + i$1).addClass(thumbActiveClass);
          }
        }
      },
    };
    var Thumbs$1 = {
      name: 'thumbs',
      params: {
        thumbs: {
          swiper: null,
          slideThumbActiveClass: 'swiper-slide-thumb-active',
          thumbsContainerClass: 'swiper-container-thumbs',
        },
      },
      create: function create() {
        var swiper = this;
        Utils.extend(swiper, {
          thumbs: {
            swiper: null,
            init: Thumbs.init.bind(swiper),
            update: Thumbs.update.bind(swiper),
            onThumbClick: Thumbs.onThumbClick.bind(swiper),
          },
        });
      },
      on: {
        beforeInit: function beforeInit() {
          var swiper = this;
          var ref = swiper.params;
          var thumbs = ref.thumbs;
          if (!thumbs || !thumbs.swiper) {
            return;
          }
          swiper.thumbs.init();
          swiper.thumbs.update(true);
        },
        slideChange: function slideChange() {
          var swiper = this;
          if (!swiper.thumbs.swiper) {
            return;
          }
          swiper.thumbs.update();
        },
        update: function update() {
          var swiper = this;
          if (!swiper.thumbs.swiper) {
            return;
          }
          swiper.thumbs.update();
        },
        resize: function resize() {
          var swiper = this;
          if (!swiper.thumbs.swiper) {
            return;
          }
          swiper.thumbs.update();
        },
        observerUpdate: function observerUpdate() {
          var swiper = this;
          if (!swiper.thumbs.swiper) {
            return;
          }
          swiper.thumbs.update();
        },
        setTransition: function setTransition(duration) {
          var swiper = this;
          var thumbsSwiper = swiper.thumbs.swiper;
          if (!thumbsSwiper) {
            return;
          }
          thumbsSwiper.setTransition(duration);
        },
        beforeDestroy: function beforeDestroy() {
          var swiper = this;
          var thumbsSwiper = swiper.thumbs.swiper;
          if (!thumbsSwiper) {
            return;
          }
          if (swiper.thumbs.swiperCreated && thumbsSwiper) {
            thumbsSwiper.destroy();
          }
        },
      },
    };

    // Swiper Class

    var components = [
      Device$1,
      Support$1,
      Browser$1,
      Resize,
      Observer$1,
      Virtual$1,
      Keyboard$1,
      Mousewheel$1,
      Navigation$1,
      Pagination$1,
      Scrollbar$1,
      Parallax$1,
      Zoom$1,
      Lazy$1,
      Controller$1,
      A11y,
      History$1,
      HashNavigation$1,
      Autoplay$1,
      EffectFade,
      EffectCube,
      EffectFlip,
      EffectCoverflow,
      Thumbs$1
    ];

    if (typeof Swiper.use === 'undefined') {
      Swiper.use = Swiper.Class.use;
      Swiper.installModule = Swiper.Class.installModule;
    }

    Swiper.use(components);

    return Swiper;

  }));

/*!
 * tablesort v5.1.0 (2018-09-14)
 * http://tristen.ca/tablesort/demo/
 * Copyright (c) 2018 ; Licensed MIT
*/
!function(){function a(b,c){if(!(this instanceof a))return new a(b,c);if(!b||"TABLE"!==b.tagName)throw new Error("Element must be a table");this.init(b,c||{})}var b=[],c=function(a){var b;return window.CustomEvent&&"function"==typeof window.CustomEvent?b=new CustomEvent(a):(b=document.createEvent("CustomEvent"),b.initCustomEvent(a,!1,!1,void 0)),b},d=function(a){return a.getAttribute("data-sort")||a.textContent||a.innerText||""},e=function(a,b){return a=a.trim().toLowerCase(),b=b.trim().toLowerCase(),a===b?0:a<b?1:-1},f=function(a,b){return function(c,d){var e=a(c.td,d.td);return 0===e?b?d.index-c.index:c.index-d.index:e}};a.extend=function(a,c,d){if("function"!=typeof c||"function"!=typeof d)throw new Error("Pattern and sort must be a function");b.push({name:a,pattern:c,sort:d})},a.prototype={init:function(a,b){var c,d,e,f,g=this;if(g.table=a,g.thead=!1,g.options=b,a.rows&&a.rows.length>0)if(a.tHead&&a.tHead.rows.length>0){for(e=0;e<a.tHead.rows.length;e++)if("thead"===a.tHead.rows[e].getAttribute("data-sort-method")){c=a.tHead.rows[e];break}c||(c=a.tHead.rows[a.tHead.rows.length-1]),g.thead=!0}else c=a.rows[0];if(c){var h=function(){g.current&&g.current!==this&&g.current.removeAttribute("aria-sort"),g.current=this,g.sortTable(this)};for(e=0;e<c.cells.length;e++)f=c.cells[e],f.setAttribute("role","columnheader"),"none"!==f.getAttribute("data-sort-method")&&(f.tabindex=0,f.addEventListener("click",h,!1),null!==f.getAttribute("data-sort-default")&&(d=f));d&&(g.current=d,g.sortTable(d))}},sortTable:function(a,g){var h=this,i=a.cellIndex,j=e,k="",l=[],m=h.thead?0:1,n=a.getAttribute("data-sort-method"),o=a.getAttribute("aria-sort");if(h.table.dispatchEvent(c("beforeSort")),g||(o="ascending"===o?"descending":"descending"===o?"ascending":h.options.descending?"descending":"ascending",a.setAttribute("aria-sort",o)),!(h.table.rows.length<2)){if(!n){for(;l.length<3&&m<h.table.tBodies[0].rows.length;)k=d(h.table.tBodies[0].rows[m].cells[i]),k=k.trim(),k.length>0&&l.push(k),m++;if(!l)return}for(m=0;m<b.length;m++)if(k=b[m],n){if(k.name===n){j=k.sort;break}}else if(l.every(k.pattern)){j=k.sort;break}for(h.col=i,m=0;m<h.table.tBodies.length;m++){var p,q=[],r={},s=0,t=0;if(!(h.table.tBodies[m].rows.length<2)){for(p=0;p<h.table.tBodies[m].rows.length;p++)k=h.table.tBodies[m].rows[p],"none"===k.getAttribute("data-sort-method")?r[s]=k:q.push({tr:k,td:d(k.cells[h.col]),index:s}),s++;for("descending"===o?q.sort(f(j,!0)):(q.sort(f(j,!1)),q.reverse()),p=0;p<s;p++)r[p]?(k=r[p],t++):k=q[p-t].tr,h.table.tBodies[m].appendChild(k)}}h.table.dispatchEvent(c("afterSort"))}},refresh:function(){void 0!==this.current&&this.sortTable(this.current,!0)}},"undefined"!=typeof module&&module.exports?module.exports=a:window.Tablesort=a}();

/*!
 * tablesort v5.1.0 (2018-09-14)
 * http://tristen.ca/tablesort/demo/
 * Copyright (c) 2018 ; Licensed MIT
*/
!function(){var a=function(a){return a.replace(/[^\-?0-9.]/g,"")},b=function(a,b){return a=parseFloat(a),b=parseFloat(b),a=isNaN(a)?0:a,b=isNaN(b)?0:b,a-b};Tablesort.extend("number",function(a){return a.match(/^[-+]?[£\x24Û¢´€]?\d+\s*([,\.]\d{0,2})/)||a.match(/^[-+]?\d+\s*([,\.]\d{0,2})?[£\x24Û¢´€]/)||a.match(/^[-+]?(\d)*-?([,\.]){0,1}-?(\d)+([E,e][\-+][\d]+)?%?$/)},function(c,d){return c=a(c),d=a(d),b(d,c)})}();

'use strict';

(function () {
  window.countSlider = function (photoSlider) {
    if (!photoSlider) {
      return;
    }

    var slidersContainer = photoSlider.querySelector('.housing__slider-container');
    var wrapper = slidersContainer.querySelector('.housing__slides');
    var slides = slidersContainer.querySelectorAll('.housing__slider-slide');
    var countCursor = photoSlider.querySelector('.count-cursor');
    var countCursorCurrent = countCursor.querySelector('.current');
    var countCursorTotal = countCursor.querySelector('.total');
    var backArrow = countCursor.querySelector('.back');
    var nextArrow = countCursor.querySelector('.next');
    var footer = document.querySelector('.footer-inner');


    var width = 0;
    var total = slides.length;

    var hideCountCursor = function () {
      countCursor.classList.add('visually-hidden');
    };

    if (total <= 1) {
      hideCountCursor();
      return;
    }

    var currentIndex = 0;
    var currentSlide = slides[0];
    var cursorLeft = -1;
    var cursorTop = -1;
    var requestAnimationFrameId = null;
    var swiper;

    var geWidth = function () {
      if (width === 0) {
        width = slides[0].clientWidth;
      }
      return width;
    };

    var getSide = function (position) {
      if (position < geWidth() / 2) {
        return -1;
      }
      return 1;
    };

    var getLoopedSlide = function (attemptIndex) {
      if (attemptIndex === total) {
        return 0;
      }
      if (attemptIndex < 0) {
        return total - 1;
      }
      return attemptIndex;
    };

    var addSlideClass = function () {
      slidersContainer.classList.add('swiper-container');
      wrapper.classList.add('swiper-wrapper');

      for (var i = 0; i < slides.length; i++) {
        var slide = slides[i];
        slide.classList.add('swiper-slide');
      }
    };


    var handleClickDesktop = function (evt) {
      var x = evt.pageX;
      var newIndex = currentIndex + getSide(x);
      changeSlide(newIndex);
    };

    var handleClickMobile = function () {
      var newIndex = currentIndex + 1;
      changeSlide(newIndex);
    };

    var handleClick = function (evt) {
      if (window.isDesktop()) {
        handleClickDesktop(evt);
      } else {
        handleClickMobile();
      }
    };

    var hideSlide = function (slide) {
      slide.style.display = 'none';
    };

    var showSlide = function (slide) {
      slide.style.display = 'block';
    };

    var changeSlide = function (attemptIndex) {
      var index = getLoopedSlide(attemptIndex);

      var slide = slides[index];
      if (!slide) {
        return;
      }
      showSlide(slide);
      hideSlide(currentSlide);
      updateCursorCurrentSlide(index);
      currentSlide = slide;
      currentIndex = index;
    };

    var hideSlides = function () {
      for (var i = 0; i < slides.length; i++) {
        var slide = slides[i];
        if (i !== 0) {
          hideSlide(slide);
        }
      }
    };

    var updateCursorCurrentSlide = function (index) {
      countCursorCurrent.textContent = index + 1;
    };

    var updateCursorTotal = function (newTotal) {
      countCursorTotal.textContent = newTotal;
    };

    var positionCursorCount = function (left, top) {
      cursorLeft = left;
      cursorTop = top;
    };

    var renderCursorCount = function () {
      countCursor.style.transform = 'translate(' + (cursorLeft) + 'px, ' + cursorTop + 'px)';
      requestAnimationFrameId = window.requestAnimationFrame(renderCursorCount);
    };

    var showGradien = function () {
      photoSlider.classList.add('is-scroll');
      photoSlider.classList.remove('is-scroll--hide');
    };

    var hideGradien = function () {
      photoSlider.classList.add('is-scroll--hide');
    };

    var showBackArrow = function () {
      backArrow.classList.remove('visually-hidden');
    };

    var hideBackArrow = function () {
      backArrow.classList.add('visually-hidden');
    };

    var showNextArrow = function () {
      nextArrow.classList.remove('visually-hidden');
    };

    var hideNextArrow = function () {
      nextArrow.classList.add('visually-hidden');
    };

    var showCountCursor = function () {
      countCursor.classList.remove('visually-hidden-non-touch');
      countCursor.classList.remove('visually-hidden');
    };

    var handleMouseMove = function (evt) {
      if (window.isTouch()) {
        return;
      }
      var clientX = evt.clientX;
      var clientY = evt.clientY;
      positionCursorCount(clientX, clientY);
      updateCursorArrow(clientX);
    };

    var updateCursorArrow = function (x) {
      if (getSide(x) === 1) {
        showNextArrow();
        hideBackArrow();
      } else {
        showBackArrow();
        hideNextArrow();
      }
    };

    var handleContainerEnter = function () {
      if (window.isTouch()) {
        return;
      }
      hideGradien();
      showCountCursor();
      requestAnimationFrameId = window.requestAnimationFrame(renderCursorCount);
    };

    var handleContainerLeave = function () {
      if (window.isTouch()) {
        return;
      }
      hideCountCursor();
      if (requestAnimationFrameId) {
        window.cancelAnimationFrame(requestAnimationFrameId);
      }
    };

    var handleSwiperSlideChange = function () {
      if (!swiper) {
        return;
      }
      updateCursorCurrentSlide(swiper.realIndex);
    };

    var initSwiper = function () {
      addSlideClass();
      swiper = new window.Swiper(slidersContainer, {
        slidesPerView: 1,
        loop: true,
        observer: true,
        observeParents: true,
        on: {
          slideChange: handleSwiperSlideChange
        }
      });
    };

    updateCursorTotal(slides.length);

    photoSlider.setAttribute('style', 'cursor: none;');

    if (window.isTouch()) {
      initSwiper();
      showCountCursor();
    } else {
      photoSlider.addEventListener('click', function (evt) {
        handleClick(evt);
      });
      hideSlides();
    }

    window.addEventListener('mousemove', function (evt) {
      setTimeout(function () {
        handleMouseMove(evt);
      }, 1);
    });


    photoSlider.addEventListener('mouseenter', handleContainerEnter);
    photoSlider.addEventListener('mouseleave', handleContainerLeave);

    if (footer) {
      footer.addEventListener('mouseenter', showGradien);
    }
  };

})();

'use strict';

(function () {
  var MOBILE = 767;
  var TABLET = 1023;

  window.isMobile = function () {
    return window.matchMedia('(max-width: ' + MOBILE + 'px)').matches;
  };

  window.isTablet = function () {
    return window.matchMedia('(max-width: ' + TABLET + 'px)').matches;
  };

  window.isDesktop = function () {
    return window.matchMedia('(min-width: ' + (TABLET + 1) + 'px)').matches;
  };

  window.isMobileSafari = function () {
    var ua = window.navigator.userAgent;
    var iOS = !!ua.match(/iP(ad|od|hone)/i);
    var webkit = !!ua.match(/WebKit/i);
    return iOS && webkit && !ua.match(/CriOS/i) && !ua.match(/OPiOS/i);
  };

  window.isIE = function () {
    var ua = window.navigator.userAgent;
    var oldIe = ua.indexOf('MSIE ');
    var ie11 = ua.indexOf('Trident/');

    if (oldIe > -1 || ie11 > -1) {
      return true;
    } else {
      return false;
    }
  };

  // https://stackoverflow.com/a/4819886
  window.isTouch = function () {
    var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
    var mq = function (query) {
      return window.matchMedia(query).matches;
    };

    if (('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch) {
      return true;
    }

    // include the 'heartz' as a way to have a non matching MQ to help terminate the join
    // https://git.io/vznFH
    var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
    return mq(query);
  };
})();

'use strict';

(function () {
  var accoBtn = document.querySelectorAll('.acco-btn');
  if (accoBtn.length === 0) {
    return;
  }

  var findContent = function (element) {
    var parent = element.parentNode;
    var content = parent.querySelector('.acco-content');
    var accoCloseBtn = parent.querySelector('.acco-close-btn');
    var openBtn = parent.querySelector('.acco-btn');

    return parentObj = {
      parent: parent,
      content: content,
      close: accoCloseBtn,
      open: openBtn
    };
  };

  var hideContent = function (e) {
    e.preventDefault();
    var target = e.currentTarget;
    var openBtn = findContent(target).open;
    var content = findContent(target).content;
    content.classList.remove('acco-content--show');
    openBtn.style.display = 'block';
    target.style.display = 'none';
  };

  for (var index = 0; index < accoBtn.length; index++) {
    var element = accoBtn[index];
    element.addEventListener('click', function (e) {
      e.preventDefault();
      var target = e.currentTarget;
      var currentContent = findContent(target).content;
      var closeBtn = findContent(target).close;
      currentContent.classList.add('acco-content--show');
      target.style.display = 'none';
      closeBtn.style.display = 'block';
      closeBtn.addEventListener('click', hideContent);
    });
  }
})();

// 'use strict'

// var linkNav = document.querySelectorAll('[href^="#"]'), //выбираем все ссылки к якорю на странице
//     V = 1;  // скорость, может иметь дробное значение через точку (чем меньше значение - тем больше скорость)
// for (var i = 0; i < linkNav.length; i++) {
//     linkNav[i].addEventListener('click', function(e) { //по клику на ссылку
//         e.preventDefault(); //отменяем стандартное поведение
//         var w = window.pageYOffset,  // производим прокрутка прокрутка
//             hash = this.href.replace(/[^#]*(.*)/, '$1');  // к id элемента, к которому нужно перейти
//         t = document.querySelector(hash).getBoundingClientRect().top,  // отступ от окна браузера до id
//             start = null;
//         requestAnimationFrame(step);  // подробнее про функцию анимации [developer.mozilla.org]
//         function step(time) {
//             if (start === null) start = time;
//             var progress = time - start,
//                 r = (t < 0 ? Math.max(w - progress/V, w + t) : Math.min(w + progress/V, w + t));
//             window.scrollTo(0,r);
//             if (r != w + t) {
//                 requestAnimationFrame(step)
//             } else {
//                 location.hash = hash  // URL с хэшем
//             }
//         }
//     }, false);
// }
'use strict';


(function () {
  var ResponseCode = {
    SUCCESS: 200,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    ENTERNAL_ERROR: 500
  };


  var createXHR = function (onLoad, onError) {
    var xhr = new XMLHttpRequest();

    xhr.addEventListener('load', function () {
      switch (xhr.status) {
        case ResponseCode.SUCCESS:
          onLoad(xhr.response);
          break;
        case ResponseCode.BAD_REQUEST:
          onError('Неверный запрос к серверу.');
          break;
        case ResponseCode.NOT_FOUND:
          onError('Запрашиваемый ресурс не найден на сервере.');
          break;
        case ResponseCode.ENTERNAL_ERROR:
          onError('Произошла внутренняя ошибка сервера.');
          break;
        default:
          onError('Код ответа сервера: ' + xhr.status + ' ' + xhr.statusText + '.');
      }
    });

    xhr.addEventListener('error', function () {
      onError('Произошла ошибка соединения с сервером.');
    });

    xhr.addEventListener('timeout', function () {
      onError('Запрос к серверу не успел выполниться за отведённое время.');
    });

    return xhr;
  };


  var downloadData = function (url, onLoad, onError) {
    var xhr = createXHR(onLoad, onError);

    xhr.open('GET', url);
    xhr.send();
  };


  var uploadData = function (data, url, onLoad, onError, requestHeader) {
    var xhr = createXHR(onLoad, onError);

    xhr.open('POST', url);

    if (requestHeader) {
      xhr.setRequestHeader(requestHeader.name, requestHeader.value);
    }

    xhr.send(data);
  };

  window.backend = {
    download: downloadData,
    upload: uploadData
  };
})();

'use strict';

(function () {
  var bg = document.querySelector('.bg2x');
  if (!bg) {
    return;
  }

  if (window.devicePixelRatio >= 1.2) {
    var elems = document.getElementsByTagName('*');
    for (var i = 0; i < elems.length; i++) {
      var attr = elems[i].getAttribute('data-2x');
      if (attr) {
        elems[i].style.cssText += attr;
      }
    }
  }
})();

'use strict';

(function () {
  var planPage = document.querySelector('.blue-burger-container');
  if (!planPage) {
    return;
  }

  window.addEventListener('scroll', function () {

    var headerHeight = document.querySelector('.blue-burger-container h1').offsetHeight;
    var choiceHeight = document.querySelector('.blue-burger-container .choice').offsetHeight;
    var pageTop;
    pageTop = headerHeight + choiceHeight - 10;
    var windowScroll = window.scrollY;
    var burger = document.querySelector('.header__menu-open');

    if (windowScroll >= pageTop) {
      burger.classList.add('blue');
    } else {
      burger.classList.remove('blue');
    }
  });
})();

'use strict';

(function () {
  var buttons = document.querySelector('.choice');
  if (!buttons) {
    return;
  }

  if (!window.isMobile()) {
    return;
  }

  var mySwiper = new Swiper('.swiper-container', {
    slidesPerView: 'auto'
  });
})();

(function () {
  var month = document.querySelector('.choice-progress');
  if (!month) {
    return;
  }

  if (!window.isMobile()) {
    return;
  }

  var mySwiper = new Swiper('.swiper-container', {
    slidesPerView: 'auto'
  });
})();

'use strict';

(function () {
  var sliders = document.querySelectorAll('.housing__slider');
  for (var i = 0; i < sliders.length; i++) {
    var slider = sliders[i];
    window.countSlider(slider);
  }
})();

'use strict';

(function () {

  if (window.isTablet()) {
    return;
  }

  var controller1 = new ScrollMagic.Controller();
  var scene = new ScrollMagic.Scene({
    triggerElement: '.img-content--1',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setTween('.img-parallax-1', { y: '120%', ease: Linear.easeNone })
    .addTo(controller1);

  var scene = new ScrollMagic.Scene({
    triggerElement: '.img-content--2',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setTween('.img-parallax-2', { y: '120%', ease: Linear.easeNone })
    .addTo(controller1);

  var scene = new ScrollMagic.Scene({
    triggerElement: '.img-content--3',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setTween('.img-parallax-3', { y: '120%', ease: Linear.easeNone })
    .addTo(controller1);
  var scene = new ScrollMagic.Scene({
    triggerElement: '.img-content--4',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setTween('.img-parallax-4', { y: '120%', ease: Linear.easeNone })
    .addTo(controller1);
})();

'use strict';

(function () {
  var ESC = 27;
  var form = document.querySelector('.order-form form');
  if (!form) {
    return;
  }

  var AUTH_TOKEN = document.querySelector('meta[name="csrf-token"]').content;

  var submitBtn = form.querySelector('button[type="submit"]')
  var phone = form.querySelector('[name=user-phone]');
  var name = form.querySelector('[name=user-name]');
  var nameBlock = form.querySelector('p:nth-child(1)');
  var phoneBlock = form.querySelector('p:nth-child(2)');
  var formResult = document.querySelector('.contacts-result');
  var resultText = formResult.querySelector('.contacts-result__text');
  var successResultText = resultText.textContent;
  var closeButtonResult = document.querySelector('.contacts-result__button');

  var cleanErrors = function () {
    cleanError(phoneBlock);
    cleanError(nameBlock);
  };

  var cleanError = function (el) {
    el.classList.remove('input-error');
  };

  var setError = function (el) {
    el.classList.add('input-error');
    setTimeout(function () {
      cleanError(el);
    }, 3000);
  };

  var sendForm = function () {
    submitBtn.disabled = false;
    form.reset();

    resultText.textContent = successResultText;
  };

  var showSendError = function (serverStatusText) {
    submitBtn.disabled = false;

    resultText.textContent = 'Не удалось отправить форму. ' + serverStatusText;
  };

  Inputmask({ "mask": "+7 999 999-9999" }).mask(phone);

  form.addEventListener('submit', function (evt) {
    evt.preventDefault();
    cleanErrors();
    if (!phone.value || phone.inputmask.unmaskedvalue().length < 10) {
      setError(phoneBlock);
    } else {
      submitBtn.disabled = true;
      window.backend.upload(new FormData(form), form.action, sendForm, showSendError, {name: 'X-CSRF-Token', value: AUTH_TOKEN});

      formResult.classList.add('contacts-result--show');
      window.bodyScrollLock.disableBodyScroll(formResult);
    }
  });

  var closePopupResult = function () {
    formResult.classList.remove('contacts-result--show');
    window.bodyScrollLock.enableBodyScroll(formResult);
  };

  closeButtonResult.addEventListener('click', function () {
    window.setTimeout(closePopupResult, 100);
  });

  window.addEventListener('keydown', function (evt) {
    if (evt.keyCode === ESC) {
      if (formResult.classList.contains('contacts-result--show')) {
        evt.preventDefault();
        closePopupResult();
      }
    }
  });
})();

'use strict';

(function () {
  var ESC = 27;
  var openButton = document.querySelector('.header__menu-contacts p span');

  if (!openButton) {
    return;
  }

  var formPopup = document.querySelector('.form-popup');
  var closeButton = formPopup.querySelector('.form-popup__close--main');

  var openForm = function () {
    formPopup.classList.add('form-popup--show');
    window.bodyScrollLock.disableBodyScroll(formPopup);
  };

  var closeForm = function () {
    formPopup.classList.remove('form-popup--show');
    window.bodyScrollLock.enableBodyScroll(formPopup);
  };

  openButton.addEventListener('click', function () {
    window.setTimeout(openForm, 100);
  });

  closeButton.addEventListener('click', function () {
    window.setTimeout(closeForm, 100);
  });

  window.addEventListener('keydown', function (evt) {
    if (evt.keyCode === ESC) {
      if (formPopup.classList.contains('form-popup--show')) {
        evt.preventDefault();
        closeForm();

      }
    }
  });

  var AUTH_TOKEN = document.querySelector('meta[name="csrf-token"]').content;

  var form = document.querySelector('.form-popup form');
  var submitBtn = form.querySelector('button[type="submit"]')
  var phone = form.querySelector('[name=user-phone]');
  var name = form.querySelector('[name=user-name]');
  var nameBlock = form.querySelector('p:nth-child(1)');
  var phoneBlock = form.querySelector('p:nth-child(2)');
  var popupResult = document.querySelector('.form-popup-result');
  var resultText = popupResult.querySelector('.form-popup-result__text');
  var successResultText = resultText.textContent;
  var closeButtonResult = document.querySelector('.form-popup-result__close');

  Inputmask({ "mask": "+7 999 999-9999" }).mask(phone);

  var cleanErrors = function () {
    cleanError(phoneBlock);
  };

  var cleanError = function (el) {
    el.classList.remove('input-error');
  };

  var setError = function (el) {
    el.classList.add('input-error');
    setTimeout(function () {
      cleanError(el);
    }, 3000);
  };

  var sendForm = function () {
    submitBtn.disabled = false;
    form.reset();

    resultText.textContent = successResultText;
    formPopup.classList.remove('form-popup--show');
  };

  var showSendError = function (serverStatusText) {
    submitBtn.disabled = false;

    resultText.textContent = 'Не удалось отправить форму. ' + serverStatusText;
  };

  form.addEventListener('submit', function (evt) {
    evt.preventDefault();
    cleanErrors();
    if (!phone.value || phone.inputmask.unmaskedvalue().length < 10) {
      setError(phoneBlock);
    } else {
      submitBtn.disabled = true;
      window.backend.upload(new FormData(form), form.action, sendForm, showSendError, {name: 'X-CSRF-Token', value: AUTH_TOKEN});

      popupResult.classList.add('form-popup-result--show');
      window.bodyScrollLock.disableBodyScroll(form);
      window.bodyScrollLock.enableBodyScroll(formPopup);
    }
  });

  var closePopupResult = function () {
    popupResult.classList.remove('form-popup-result--show');
    window.bodyScrollLock.enableBodyScroll(form);
  };

  closeButtonResult.addEventListener('click', function () {
    window.setTimeout(closePopupResult, 100);
  });

  window.addEventListener('keydown', function (evt) {
    if (evt.keyCode === ESC) {
      if (popupResult.classList.contains('form-popup-result--show')) {
        evt.preventDefault();
        closePopupResult();

      }
    }
  });
})();

'use strict';

(function () {
  var gradientTop = document.querySelector('.gradient-top');
  var footer = document.querySelector('.footer-inner');

  if (window.isMobile()) {
    var swapBlock = document.querySelector('.gradient-swap');
    var swapMobileBLock = document.querySelector('.gradient-swap-mobile');

    if (swapBlock) {
      swapBlock.classList.remove('gradient-bottom');
      swapMobileBLock.classList.add('gradient-bottom');
    }
  }

  var lastScreen = document.querySelectorAll('.gradient-bottom');
  var gradient = document.querySelector('.gradient');

  if (!gradient) {
    return;
  }

  window.addEventListener('scroll', function () {
    var windowScroll = window.pageYOffset;
    var arrow = document.querySelector('.arrow');


    if (gradientTop) {
      if (windowScroll > 50) {
        var mapTop = document.querySelector('.contacts');
        var logo = document.querySelector('.header__logo');
        var header = document.querySelector('.contacts__header');
        var burger = document.querySelector('.header__menu-open');

        gradientTop.classList.add('is-scroll');
        gradientTop.classList.remove('is-scroll--show');


        if (mapTop) {
          logo.classList.add('blue');
          burger.classList.add('blue');

          setTimeout(function () {
            gradientTop.classList.add('is-under');
            gradientTop.classList.remove('is-above');
            header.classList.add('visually-hidden');
          }, 1200);
        }

      } else {
        gradientTop.classList.remove('is-scroll');
        gradientTop.classList.add('is-scroll--show');
      }
    }

    if (arrow) {
      if (windowScroll >= 200) {
        arrow.style.opacity = '0';
        arrow.style.transition = '1.75s';
      } else {
        arrow.style.opacity = '1';
        arrow.style.transition = '1.75s';
      }
    }

    if (lastScreen) {
      var footerPadding = footer ? getComputedStyle(footer).paddingBottom.slice(0, -2) : 0;
      var delta = document.documentElement.scrollHeight - window.innerHeight - Number(footerPadding);
      var sliderPage = document.querySelector('.slider-page');

      for (var index = 0; index < lastScreen.length; index++) {
        var element = lastScreen[index];
        if (!sliderPage) {
          if (windowScroll > delta) {
            element.classList.add('is-scroll');
            element.classList.remove('is-scroll--hide');
          } else {
            element.classList.add('is-scroll--hide');
          }
        }
      }

      var surroundings = document.querySelector('.surraundings');

      if (surroundings) {
        var item = document.querySelector('.surraundings-list__item.gradient-bottom');

        var showGradien = function () {
          item.classList.add('is-scroll');
          item.classList.remove('is-scroll--hide');
        };

        var hideGradien = function () {
          item.classList.add('is-scroll--hide');
        };

        footer.addEventListener('mouseenter', showGradien);
        footer.addEventListener('mouseleave', hideGradien);
      }
    }
  });
})();

(function () {
  var logo = document.querySelector('.header__logoscroll');

  if (!logo) {
    return;
  }

  window.addEventListener('scroll', function () {
    var windowScroll = window.scrollY;

    if (windowScroll > 20) {
      logo.classList.add('header__logoscroll--hide');
      logo.classList.remove('header__logoscroll--show');
    } else {
      logo.classList.remove('header__logoscroll--hide');
      logo.classList.add('header__logoscroll--show');
    }
  });
})();

'use strict';

(function () {
  var contactsPage = document.querySelector('.contacts');
  if (!contactsPage) {
    return;
  }

  window.addEventListener('scroll', function () {

    var mapHeight = document.querySelector('.map-office#map').offsetHeight;
    var logoHeight = document.querySelector('.header__logo').offsetHeight;
    var pageTop;
    pageTop = mapHeight - 50;
    var windowScroll = window.scrollY;
    var logo = document.querySelector('.header__logo');
    var burger = document.querySelector('.header__menu-open');
    if (windowScroll >= pageTop) {
      burger.classList.remove('blue');
    } else {
      burger.classList.add('blue');
    }

    if (windowScroll >= pageTop - logoHeight / 2) {
      logo.classList.remove('blue');
    } else {
      logo.classList.add('blue');
    }
  });
})();

'use strict';

(function () {

  var locationBlock = document.querySelector('.location');

  if (!locationBlock) {
    return;
  }

  var location = document.querySelector('.location').offsetHeight;
  var headerHeight = document.querySelector('.location h1').offsetHeight;
  var choiceHeight = document.querySelector('.location h1').offsetHeight;
  var mapHeight = document.getElementById('mapBig');

  // if (window.isMobile()) {
  mapHeight.style.height = location - headerHeight - choiceHeight / 2 + 'px';
  // }
})();

'use strict';

// карта без пинов POI

(function () {
  var officeRouteImage = document.getElementById('route');
  var mapContainer = document.getElementById('map');

  if (!mapContainer) {
    return;
  }

  var map;
  // eslint-disable-next-line no-unused-vars
  var overlaySVG;
  var styles = [
    {
      'featureType': 'all',
      'elementType': 'labels.text.fill',
      'stylers': [
        {
          'lightness': '-49'
        }
      ]
    },
    {
      'featureType': 'administrative',
      'elementType': 'labels.text.fill',
      'stylers': [
        {
          'color': '#444444'
        }
      ]
    },
    {
      'featureType': 'administrative.locality',
      'elementType': 'labels',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    },
    {
      'featureType': 'administrative.neighborhood',
      'elementType': 'labels.text',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    },
    {
      'featureType': 'landscape',
      'elementType': 'all',
      'stylers': [
        {
          'color': '#f2f2f2'
        }
      ]
    },
    {
      'featureType': 'landscape.man_made',
      'elementType': 'geometry',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    },
    {
      'featureType': 'poi',
      'elementType': 'all',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    },
    {
      'featureType': 'poi',
      'elementType': 'geometry',
      'stylers': [
        {
          'visibility': 'on'
        }
      ]
    },
    {
      'featureType': 'poi',
      'elementType': 'geometry.fill',
      'stylers': [
        {
          'color': '#dedede'
        }
      ]
    },
    {
      'featureType': 'poi.attraction',
      'elementType': 'geometry',
      'stylers': [
        {
          'visibility': 'on'
        },
        {
          'color': '#dedede'
        }
      ]
    },
    {
      'featureType': 'poi.attraction',
      'elementType': 'labels',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    },
    {
      'featureType': 'poi.park',
      'elementType': 'geometry',
      'stylers': [
        {
          'color': '#dedede'
        },
        {
          'visibility': 'on'
        }
      ]
    },
    {
      'featureType': 'poi.park',
      'elementType': 'geometry.fill',
      'stylers': [
        {
          'saturation': '0'
        },
        {
          'weight': '1'
        },
        {
          'color': '#dedede'
        },
        {
          'visibility': 'on'
        }
      ]
    },
    {
      'featureType': 'poi.place_of_worship',
      'elementType': 'labels',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    },
    {
      'featureType': 'poi.sports_complex',
      'elementType': 'geometry.fill',
      'stylers': [
        {
          'color': '#dedede'
        }
      ]
    },
    {
      'featureType': 'road',
      'elementType': 'all',
      'stylers': [
        {
          'saturation': -100
        },
        {
          'lightness': 45
        }
      ]
    },
    {
      'featureType': 'road.highway',
      'elementType': 'all',
      'stylers': [
        {
          'visibility': 'simplified'
        },
        {
          'color': '#ffffff'
        }
      ]
    },
    {
      'featureType': 'road.highway',
      'elementType': 'labels.text',
      'stylers': [
        {
          'color': '#8f8f8f'
        }
      ]
    },
    {
      'featureType': 'road.arterial',
      'elementType': 'labels.icon',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    },
    {
      'featureType': 'transit',
      'elementType': 'all',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    },
    {
      'featureType': 'water',
      'elementType': 'all',
      'stylers': [
        {
          'color': '#002fa7'
        },
        {
          'visibility': 'on'
        }
      ]
    },
    {
      'featureType': 'water',
      'elementType': 'geometry.fill',
      'stylers': [
        {
          'saturation': '-29'
        },
        {
          'color': '#b6caee'
        },
        {
          'lightness': '18'
        }
      ]
    }
  ]
;

  function ZoomControl(controlDiv, map) {

    // Creating divs & styles for custom zoom control
    controlDiv.style.padding = '5px';
    controlDiv.style.left = '30px';
    controlDiv.style.bottom = '30px';

    // Set CSS for the control wrapper

    var controlWrapper = document.createElement('div');
    controlWrapper.style.backgroundColor = 'transparent';
    controlWrapper.style.borderStyle = 'none';
    controlWrapper.style.cursor = 'pointer';
    controlWrapper.style.textAlign = 'center';
    controlWrapper.style.width = window.isMobile() ? '38px' : '50px';
    controlWrapper.style.height = window.isMobile() ? '80px' : '106px';
    controlWrapper.style.display = 'flex';
    controlWrapper.style.flexDirection = 'column';
    controlWrapper.style.justifyContent = 'flex-between';
    controlDiv.appendChild(controlWrapper);

    // Set CSS for the zoomIn
    var zoomInButton = document.createElement('div');
    zoomInButton.style.width = window.isMobile() ? '38px' : '50px';
    zoomInButton.style.height = window.isMobile() ? '38px' : '50px';
    zoomInButton.style.backgroundColor = 'white';
    /* Change this to be the .png image you want to use */
    zoomInButton.style.backgroundImage = 'url("img/plus.png")';
    zoomInButton.style.backgroundRepeat = 'no-repeat';
    zoomInButton.style.backgroundPosition = 'center';
    zoomInButton.style.backgroundSize = window.isMobile() ? '50%' : '80%';
    controlWrapper.appendChild(zoomInButton);

    // Set CSS for the zoomOut
    var zoomOutButton = document.createElement('div');
    zoomOutButton.style.width = window.isMobile() ? '38px' : '50px';
    zoomOutButton.style.height = window.isMobile() ? '38px' : '50px';
    zoomOutButton.style.backgroundColor = 'white';
    /* Change this to be the .png image you want to use */
    zoomOutButton.style.backgroundImage = 'url("img/minus.png")';
    zoomOutButton.style.backgroundRepeat = 'no-repeat';
    zoomOutButton.style.backgroundPosition = 'center';
    zoomOutButton.style.backgroundSize = window.isMobile() ? '50%' : '80%';
    zoomOutButton.style.marginTop = 'auto';
    controlWrapper.appendChild(zoomOutButton);

    // Setup the click event listener - zoomIn
    google.maps.event.addDomListener(zoomInButton, 'click', function () {
      map.setZoom(map.getZoom() + 1);
    });

    // Setup the click event listener - zoomOut
    google.maps.event.addDomListener(zoomOutButton, 'click', function () {
      map.setZoom(map.getZoom() - 1);
    });

  }

  var initOverlay = function (svgBounds, image) {
    // eslint-disable-next-line no-undef
    SVGOverlay.prototype = new google.maps.OverlayView();
    function SVGOverlay(bounds, image) {
      this.bounds_ = bounds;
      this.image_ = image;
      this.map_ = map;
      this.div_ = null;
      this.setMap(map);
    }

    SVGOverlay.prototype.onAdd = function () {
      var div = document.createElement('div');
      div.style.borderStyle = 'solid';
      div.style.borderWidth = '0px';
      div.style.borderColor = 'red';
      div.style.position = 'absolute';

      // Load the inline svg element and attach it to the div.
      var svg = this.image_;
      svg.style.width = '100%';
      svg.style.height = '100%';

      div.appendChild(svg);
      this.div_ = div;

      // Add the element to the "overlayLayer" pane.
      var panes = this.getPanes();
      panes.overlayLayer.appendChild(div);
    };

    SVGOverlay.prototype.draw = function () {
      // We use the south-west and north-east
      // coordinates of the overlay to peg it to the correct position and size.
      // To do this, we need to retrieve the projection from the overlay.
      var overlayProjection = this.getProjection();

      // Retrieve the south-west and north-east coordinates of this overlay
      // in LatLngs and convert them to pixel coordinates.
      // We'll use these coordinates to resize the div.
      var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
      var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());

      // Resize the image's div to fit the indicated dimensions.
      var div = this.div_;
      div.style.left = sw.x + 'px';
      div.style.top = ne.y + 'px';
      div.style.width = (ne.x - sw.x) + 'px';
      div.style.height = (sw.y - ne.y) + 'px';
    };

    overlaySVG = new SVGOverlay(svgBounds, image);
  };

  var initMap = function () {
    var centerLat;
    if (window.isMobile()) {
      centerLat = 55.770222;
    } else {
      centerLat = mapContainer.dataset.centerLat ? parseFloat(mapContainer.dataset.centerLat) : 55.769411;
    }

    var centerLng;
    if (window.isMobile()) {
      centerLng = 37.568090;
    } else {
      centerLng = mapContainer.dataset.centerLng ? parseFloat(mapContainer.dataset.centerLng) : 37.571190;
    }

    var zoom = window.isMobile() ? 15.3 : 15.5;

    // eslint-disable-next-line no-undef
    map = new google.maps.Map(mapContainer, {
      center: {lat: centerLat, lng: centerLng},
      zoom: zoom,
      // eslint-disable-next-line no-undef
      bounds: new google.maps.LatLngBounds(bounds),
      mapTypeControl: false,
      streetViewControl: false,
      zoomControl: false,
      styles: styles
    });

    var zoomControlDiv = document.createElement('div');
    var zoomControl = new ZoomControl(zoomControlDiv, map);

    zoomControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(zoomControlDiv);

    // eslint-disable-next-line no-undef
    var bounds = new google.maps.LatLngBounds(new google.maps.LatLng(55.7693797, 37.5652332), new google.maps.LatLng(55.769565, 37.572565));

    // eslint-disable-next-line no-undef, no-unused-vars
    var icon;
    if (window.isIE()) {
      icon = 'img/pin-house.png';
    } else {
      icon = 'img/pin-house.svg';
    }

    var markerHouse = new window.google.maps.Marker({
      position: {lat: 55.769362, lng: 37.572695},
      map: map,
      icon: icon
    });

    // eslint-disable-next-line no-undef, no-unused-vars
    var markerOfficeIcon = {
      url: window.isIE() ? 'img/new-office-pin.png' : 'img/new-office-pin.svg',
      size: new google.maps.Size(124, 55),
      anchor: new window.google.maps.Point(62, 0)
    };

    var markerOffice = new window.google.maps.Marker({
      position: {lat: 55.769403, lng: 37.568003},
      map: map,
      icon: markerOfficeIcon
    });

    // eslint-disable-next-line no-undef
    var svgBounds = new google.maps.LatLngBounds(
        // eslint-disable-next-line no-undef
        new google.maps.LatLng(55.769107, 37.567991),
        // eslint-disable-next-line no-undef
        new google.maps.LatLng(55.769522, 37.572582)
    );

    initOverlay(svgBounds, officeRouteImage);
  };

  window.initMap = initMap;
})();

// карта с пинами POI

(function () {
  var buttons = document.querySelectorAll('.location .choice button');
  var locationImage1 = document.getElementById('zone1');
  var locationImage2 = document.getElementById('zone2');
  var locationImage3 = document.getElementById('zone3');

  var map;
  var styles = [
    {
      'featureType': 'all',
      'elementType': 'labels.text.fill',
      'stylers': [
        {
          'lightness': '-49'
        }
      ]
    },
    {
      'featureType': 'administrative',
      'elementType': 'labels.text.fill',
      'stylers': [
        {
          'color': '#444444'
        }
      ]
    },
    {
      'featureType': 'administrative.locality',
      'elementType': 'labels',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    },
    {
      'featureType': 'administrative.neighborhood',
      'elementType': 'labels.text',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    },
    {
      'featureType': 'landscape',
      'elementType': 'all',
      'stylers': [
        {
          'color': '#f2f2f2'
        }
      ]
    },
    {
      'featureType': 'landscape.man_made',
      'elementType': 'geometry',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    },
    {
      'featureType': 'poi',
      'elementType': 'all',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    },
    {
      'featureType': 'poi',
      'elementType': 'geometry',
      'stylers': [
        {
          'visibility': 'on'
        }
      ]
    },
    {
      'featureType': 'poi',
      'elementType': 'geometry.fill',
      'stylers': [
        {
          'color': '#dedede'
        }
      ]
    },
    {
      'featureType': 'poi.attraction',
      'elementType': 'geometry',
      'stylers': [
        {
          'visibility': 'on'
        },
        {
          'color': '#dedede'
        }
      ]
    },
    {
      'featureType': 'poi.attraction',
      'elementType': 'labels',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    },
    {
      'featureType': 'poi.park',
      'elementType': 'geometry',
      'stylers': [
        {
          'color': '#dedede'
        },
        {
          'visibility': 'on'
        }
      ]
    },
    {
      'featureType': 'poi.park',
      'elementType': 'geometry.fill',
      'stylers': [
        {
          'saturation': '0'
        },
        {
          'weight': '1'
        },
        {
          'color': '#dedede'
        },
        {
          'visibility': 'on'
        }
      ]
    },
    {
      'featureType': 'poi.place_of_worship',
      'elementType': 'labels',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    },
    {
      'featureType': 'poi.sports_complex',
      'elementType': 'geometry.fill',
      'stylers': [
        {
          'color': '#dedede'
        }
      ]
    },
    {
      'featureType': 'road',
      'elementType': 'all',
      'stylers': [
        {
          'saturation': -100
        },
        {
          'lightness': 45
        }
      ]
    },
    {
      'featureType': 'road.highway',
      'elementType': 'all',
      'stylers': [
        {
          'visibility': 'simplified'
        },
        {
          'color': '#ffffff'
        }
      ]
    },
    {
      'featureType': 'road.highway',
      'elementType': 'labels.text',
      'stylers': [
        {
          'color': '#8f8f8f'
        }
      ]
    },
    {
      'featureType': 'road.arterial',
      'elementType': 'labels.icon',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    },
    {
      'featureType': 'transit',
      'elementType': 'all',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    },
    {
      'featureType': 'water',
      'elementType': 'all',
      'stylers': [
        {
          'color': '#002fa7'
        },
        {
          'visibility': 'on'
        }
      ]
    },
    {
      'featureType': 'water',
      'elementType': 'geometry.fill',
      'stylers': [
        {
          'saturation': '-29'
        },
        {
          'color': '#b6caee'
        },
        {
          'lightness': '18'
        }
      ]
    }
  ]
;
  var markerImages = [
    'img/pin-square.svg',
    'img/pin-round.svg',
    'img/pin-triangle.svg',
    'img/pin-rectangle.svg',
  ];

  var markerImagesIE = [
    'img/pin-square.png',
    'img/pin-round.png',
    'img/pin-triangle.png',
    'img/pin-rectangle.png',
  ];

  var cultureMarkers = [];
  var currentInfoBubble;
  var infoBubbleOffice;
  var markerOffice;
  var markerInfoBubbles = {};

  function ZoomControl(controlDiv, map) {

    // Creating divs & styles for custom zoom control
    controlDiv.style.padding = '15px';
    controlDiv.style.left = '30px';
    controlDiv.style.bottom = '30px';

    // Set CSS for the control wrapper
    var controlWrapper = document.createElement('div');
    controlWrapper.style.backgroundColor = 'transparent';
    controlWrapper.style.borderStyle = 'none';
    controlWrapper.style.cursor = 'pointer';
    controlWrapper.style.textAlign = 'center';
    controlWrapper.style.width = '50px';
    controlWrapper.style.height = '106px';
    controlWrapper.style.display = 'flex';
    controlWrapper.style.flexDirection = 'column';
    controlWrapper.style.justifyContent = 'flex-between';
    controlDiv.appendChild(controlWrapper);

    // Set CSS for the zoomIn
    var zoomInButton = document.createElement('div');
    zoomInButton.style.width = '50px';
    zoomInButton.style.height = '50px';
    zoomInButton.style.backgroundColor = 'white';
    /* Change this to be the .png image you want to use */
    zoomInButton.style.backgroundImage = 'url("img/plus.png")';
    zoomInButton.style.backgroundRepeat = 'no-repeat';
    zoomInButton.style.backgroundPosition = 'center';
    zoomInButton.style.backgroundSize = window.isMobile() ? '50%' : '80%';
    controlWrapper.appendChild(zoomInButton);

    // Set CSS for the zoomOut
    var zoomOutButton = document.createElement('div');
    zoomOutButton.style.width = '50px';
    zoomOutButton.style.height = '50px';
    zoomOutButton.style.backgroundColor = 'white';
    /* Change this to be the .png image you want to use */
    zoomOutButton.style.backgroundImage = 'url("img/minus.png")';
    zoomOutButton.style.backgroundRepeat = 'no-repeat';
    zoomOutButton.style.backgroundPosition = 'center';
    zoomOutButton.style.backgroundSize = window.isMobile() ? '50%' : '80%';
    zoomOutButton.style.marginTop = 'auto';
    controlWrapper.appendChild(zoomOutButton);

    // Setup the click event listener - zoomIn
    google.maps.event.addDomListener(zoomInButton, 'click', function () {
      map.setZoom(map.getZoom() + 1);
    });

    // Setup the click event listener - zoomOut
    google.maps.event.addDomListener(zoomOutButton, 'click', function () {
      map.setZoom(map.getZoom() - 1);
    });

  }

  var initOverlay = function (svgBounds, image) {
    // eslint-disable-next-line no-undef
    SVGOverlay.prototype = new google.maps.OverlayView();
    function SVGOverlay(bounds, image) {
      this.bounds_ = bounds;
      this.image_ = image;
      this.map_ = map;
      this.div_ = null;
      this.setMap(map);
    }

    SVGOverlay.prototype.onAdd = function () {
      var div = document.createElement('div');
      div.style.borderStyle = 'solid';
      div.style.borderWidth = '0px';
      div.style.borderColor = 'red';
      div.style.position = 'absolute';

      // Load the inline svg element and attach it to the div.
      var svg = this.image_;
      svg.style.width = '100%';
      svg.style.height = '100%';

      div.appendChild(svg);
      this.div_ = div;

      // Add the element to the "overlayLayer" pane.
      var panes = this.getPanes();
      panes.overlayLayer.appendChild(div);
    };

    SVGOverlay.prototype.draw = function () {
      // We use the south-west and north-east
      // coordinates of the overlay to peg it to the correct position and size.
      // To do this, we need to retrieve the projection from the overlay.
      var overlayProjection = this.getProjection();

      // Retrieve the south-west and north-east coordinates of this overlay
      // in LatLngs and convert them to pixel coordinates.
      // We'll use these coordinates to resize the div.
      var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
      var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());

      // Resize the image's div to fit the indicated dimensions.
      var div = this.div_;
      div.style.left = sw.x + 'px';
      div.style.top = ne.y + 'px';
      div.style.width = (ne.x - sw.x) + 'px';
      div.style.height = (sw.y - ne.y) + 'px';
    };

    return new SVGOverlay(svgBounds, image);
  };

  var removeCultureMarkers = function () {
    for (var i = 0; i < cultureMarkers.length; i++) {
      var cultureMarker = cultureMarkers[i];
      cultureMarker.setMap(null);
      cultureMarker = null;
    }
    cultureMarkers.length = 0;
  };

  var getPoints = function (button) {
    return button.dataset.points ? JSON.parse(button.dataset.points) : [];
  };

  var handleButtonClick = function (evt) {
    evt.preventDefault();
    removeCultureMarkers();
    var button = evt.target;
    var points = getPoints(button);
    addCultureMarkers(points);
  };

  var addCultureMarkers = function (points) {
    for (var i = 0; i < points.length; i++) {
      var point = points[i];
      point.image = getRandomMarkerImage();
      var cultureMarker = addMarker(point);
      cultureMarkers.push(cultureMarker);
    }
  };

  var getRandomMarkerImage = function () {
    var i = Math.floor(Math.random() * markerImages.length);

    return window.isIE() ? markerImagesIE[i] : markerImages[i];
  };

  // eslint-disable-next-line no-undef

  var addMarker = function (properties) {
    // eslint-disable-next-line no-undef
    var marker = new google.maps.Marker({
      position: properties.coordinates,
      map: map,
    });

    if (properties.image) {
      marker.setIcon(properties.image);
    }


    // eslint-disable-next-line no-undef
    var infoBubble = new InfoBubble({
      map: map,
      content: properties.content,
      // eslint-disable-next-line no-undef
      position: new google.maps.LatLng(properties.coordinates),
      shadowStyle: 0,
      padding: '0',
      backgroundColor: '#10069F',
      borderRadius: 0,
      arrowSize: 0,
      borderWidth: 0,
      disableAutoPan: false,
      hideCloseButton: true,
      backgroundClassName: 'transparent',
      width: 'fit-content',
      textAlign: 'center'
    });

    infoBubble.contentContainer_.style.lineHeight = '50px';
    infoBubble.contentContainer_.style.minHeight = '50px';
    infoBubble.contentContainer_.style.padding = '0 15px';

    var minWidth = window.isMobile() ? 60 : 80;

    infoBubble.setMinWidth(minWidth);

    markerInfoBubbles[infoBubble] = marker;

    marker.addListener('click', function () {
      if (infoBubble.isOpen()) {
        infoBubble.close(map, marker);
      } else {
        infoBubble.open(map, marker);
        if (currentInfoBubble) {
          currentInfoBubble.close(map, marker);
        }
        currentInfoBubble = infoBubble;
      }
      if (infoBubbleOffice && markerOffice) {
        infoBubbleOffice.close(map, markerOffice);
      }
    });

    map.addListener('click', function () {
      if (infoBubble.isOpen()) {
        infoBubble.close(map, marker);
      } else {
        return;
      }
    });

    for (var i = 0; i < buttons.length; i++) {
      var button = buttons[i];
      button.addEventListener('click', function () {
        if (infoBubble.isOpen()) {
          infoBubble.close(map, marker);
        } else {
          return;
        }
      });
    }

    return marker;
  };

  var zoom = window.isMobile() ? 14.2 : 14.8;

  var initLocationMap = function () {
    // eslint-disable-next-line no-undef
    map = new google.maps.Map(document.getElementById('mapBig'), {
      center: {lat: 55.769502, lng: 37.575971},
      zoom: zoom,
      styles: styles,
      mapTypeControl: false,
      streetViewControl: false,
      zoomControl: false,
    });

    // var transitLayer = new google.maps.TransitLayer();
    // transitLayer.setMap(map);

    // eslint-disable-next-line no-undef
    var markerHouse = new google.maps.Marker({
      position: {lat: 55.769308, lng: 37.572695},
      map: map,
      icon: window.isIE() ? 'img/pin-house.png' : 'img/pin-house.svg',
      content: 'Fantastic House'
    });

    var zoomControlDiv = document.createElement('div');
    var zoomControl = new ZoomControl(zoomControlDiv, map);

    zoomControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(zoomControlDiv);

    // var infoBubbleHouse = new InfoBubble({
    //   map: map,
    //   content: 'Fantastic House',
    //   // eslint-disable-next-line no-undef
    //   position: new google.maps.LatLng({lat: 55.7695054, lng: 37.57257244}),
    //   shadowStyle: 0,
    //   padding: '15px',
    //   backgroundColor: '#10069F',
    //   borderRadius: 0,
    //   arrowSize: 0,
    //   borderWidth: 0,
    //   disableAutoPan: false,
    //   hideCloseButton: true,
    //   backgroundClassName: 'transparent',
    // });

    // markerHouse.addListener('click', function () {
    //   if (infoBubbleHouse.isOpen()) {
    //     infoBubbleHouse.close(map, markerHouse);
    //   } else {
    //     infoBubbleHouse.open(map, markerHouse);
    //   }
    // });

    // eslint-disable-next-line no-undef
    markerOffice = new google.maps.Marker({
      position: {lat: 55.769403, lng: 37.568003},
      map: map,
      icon: window.isIE() ? 'img/pin-small.png' : 'img/pin-small.svg',
      content: 'Офис Продаж'
    });

    infoBubbleOffice = new window.InfoBubble({
      map: map,
      content: 'Офис Продаж',
      // eslint-disable-next-line no-undef
      position: new google.maps.LatLng({lat: 55.7693797, lng: 37.5652332}),
      padding: '0',
      shadowStyle: 0,
      backgroundColor: '#10069F',
      borderRadius: 0,
      arrowSize: 0,
      borderWidth: 0,
      disableAutoPan: false,
      hideCloseButton: true,
      backgroundClassName: 'transparent',
    });

    infoBubbleOffice.contentContainer_.style.lineHeight = '50px';
    infoBubbleOffice.contentContainer_.style.minHeight = '50px';
    infoBubbleOffice.contentContainer_.style.padding = '0 15px';

    infoBubbleOffice.setMinWidth(85);

    markerOffice.addListener('click', function () {
      if (infoBubbleOffice.isOpen()) {
        infoBubbleOffice.close(map, markerOffice);

      } else {
        infoBubbleOffice.open(map, markerOffice);
      }

      if (currentInfoBubble && markerInfoBubbles[currentInfoBubble]) {
        currentInfoBubble.close(map, markerInfoBubbles[currentInfoBubble]);
      }
    });

    map.addListener('click', function () {
      if (infoBubbleOffice.isOpen()) {
        infoBubbleOffice.close(map, markerOffice);
      } else {
        return;
      }
    });


    if (markerHouse) {
      addMarker(markerHouse);
    }

    if (markerOffice) {
      addMarker(markerOffice);
    }

    var points = getPoints(buttons[0]);
    addCultureMarkers(points);

    var svgBounds1 = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(55.761196, 37.563357),
        new window.google.maps.LatLng(55.773477, 37.586915)
    );

    var svgBounds2 = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(55.759645, 37.573961),
        new window.google.maps.LatLng(55.765650, 37.585430)
    );

    var svgBounds3 = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(55.757844, 37.587712),
        new window.google.maps.LatLng(55.769510, 37.605046)
    );

    initOverlay(svgBounds1, locationImage1);
    initOverlay(svgBounds2, locationImage2);
    initOverlay(svgBounds3, locationImage3);
  };

  for (var i = 0; i < buttons.length; i++) {
    var button = buttons[i];
    button.addEventListener('click', handleButtonClick);
  }

  window.initLocationMap = initLocationMap;

})();

// 'use strict';

// (function () {
//   var inp = document.getElementById('tel');

//   if (!inp) {
//     return;
//   }

//   inp.onclick = function () {
//     inp.value = '+';
//   };

//   var old = 0;

//   inp.onkeydown = function () {
//     var curLen = inp.value.length;

//     if (curLen < old) {
//       old--;
//       return;
//     }

//     if (curLen === 2) {
//       inp.value = inp.value + '(';
//     }

//     if (curLen === 6) {
//       inp.value = inp.value + ')-';
//     }

//     if (curLen === 11) {
//       inp.value = inp.value + '-';
//     }

//     if (curLen === 14) {
//       inp.value = inp.value + '-';
//     }

//     if (curLen > 16) {
//       inp.value = inp.value.substring(0, inp.value.length - 1);
//     }

//     old++;
//   };
// })();


// (function () {
//   var input = document.getElementById('tel-1');

//   input.onclick = function () {
//     input.value = '+';
//   };

//   if (!input) {
//     return;
//   }

//   var old1 = 0;

//   input.onkeydown = function () {
//     var curLen = input.value.length;

//     if (curLen < old1) {
//       old1--;
//       return;
//     }

//     if (curLen === 2) {
//       input.value = input.value + '(';
//     }

//     if (curLen === 6) {
//       input.value = input.value + ')-';
//     }

//     if (curLen === 11) {
//       input.value = input.value + '-';
//     }

//     if (curLen === 14) {
//       input.value = input.value + '-';
//     }

//     if (curLen > 16) {
//       input.value = input.value.substring(0, input.value.length - 1);
//     }

//     old1++;
//   };
// })();
// Inputmask({"mask": "+7 (999) 999-9999"}).mask('#tel');

// var phoeee = document.querySelector('#tel')

// console.log(phoeee.inputmask.unmaskedvalue().len);


'use strict';

(function () {
  var ESC = 27;

  var header = document.querySelector('.header');
  window.getScrollTop = function () {
    return window.pageYOffset || document.documentElement.scrollTop;
  };

  if (header) {

    var menu = document.querySelector('.header__menu');
    var openButton = document.querySelector('.header__menu-open');
    var closeButton = document.querySelector('.header__menu-close');

    var openMenu = function () {
      menu.classList.add('header__menu--show');
      window.bodyScrollLock.disableBodyScroll(menu);
    };

    var closeMenu = function () {
      menu.classList.remove('header__menu--show');
      window.bodyScrollLock.enableBodyScroll(menu);
    };

    openButton.addEventListener('click', function () {
      window.setTimeout(openMenu, 50);
    });

    closeButton.addEventListener('click', function () {
      window.setTimeout(closeMenu, 50);
    });

    window.addEventListener('keydown', function (evt) {
      if (evt.keyCode === ESC) {
        if (menu.classList.contains('header__menu--show')) {
          evt.preventDefault();
          closeMenu();

        }
      }
    });

    var mainMenu = document.querySelector('.header__menu--main');

    if (mainMenu) {

      var changeHoverOn = function () {
        mainMenu.classList.add('hovered');
        mainMenu.classList.remove('hide-hover');
      };

      var changeHoverOff = function () {
        mainMenu.classList.remove('hovered');
        mainMenu.classList.add('hide-hover');
      };

      var menuItems = mainMenu.querySelectorAll('li');

      for (var i = 0; i < menuItems.length; i++) {
        var menuItem = menuItems[i];
        menuItem.addEventListener('mouseenter', changeHoverOn);
        menuItem.addEventListener('mouseleave', changeHoverOff);
      }
    }
  }
})();


'use strict';

(function () {

  var plan = document.querySelector('.plan');

  if (!plan) {
    return;
  }

  var planLink = document.querySelectorAll('.plan__description ul li a');
  var planSoldOut = document.querySelectorAll('.plan__description .sold-out-floor');
  var headers = document.querySelectorAll('.plan__description ul h2');

  var changeHoverOn = function () {
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i];
      header.classList.add('hovered');
    }
  };

  var changeHoverOff = function () {
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i];
      if (header.classList.contains('hovered')) {
        header.classList.remove('hovered');
      }
    }
  };

  for (var i = 0; i < planLink.length; i++) {
    var link = planLink[i];
    link.addEventListener('mouseenter', changeHoverOn);
    link.addEventListener('mouseleave', changeHoverOff);
  }

  for (var x = 0; x < planSoldOut.length; x++) {
    var sold = planSoldOut[x];
    sold.addEventListener('mouseenter', changeHoverOn);
    sold.addEventListener('mouseleave', changeHoverOff);
  }
})();

'use strict';

(function () {
  var popup = document.querySelector('.popup');
  var popupTrigger = document.querySelector('.popup-trigger');
  if (!popup || !popupTrigger) {
    return;
  }

  var closeBtn = popup.querySelector('.popup-btn');

  popupTrigger.addEventListener('click', function (e) {
    e.preventDefault();
    popup.classList.add('show');
    window.bodyScrollLock.disableBodyScroll(popup);
  });

  closeBtn.addEventListener('click', function () {
    popup.classList.remove('show');
    window.bodyScrollLock.enableBodyScroll(popup);
  });

  window.addEventListener('keydown', function (e) {
    if (e.keyCode === 27) {
      if (popup.classList.contains('show')) {
        popup.classList.remove('show');
        window.bodyScrollLock.enableBodyScroll(popup);
      }
    }
  });
})();

'use strict';
(function () {
  var preloader = document.querySelector('.preloader');
  var mainPage = document.querySelector('.main-page');
  var mainMenu = document.querySelector('.header__menu');

  var minTimeoutMs = 2000;
  var menuTimeoutMs = 2000;
  var fadeOutTimeMs = 1000;

  if (!preloader || !mainPage) {
    return;
  }

  var timePassed = false;
  var imageLoaded = false;

  // var showMenu = function () {
  //   mainMenu.classList.add('header__menu--show');
  // };

  var showPreloader = function () {
    preloader.classList.remove('preloader--hidden');
  };

  var hidePreloader = function () {
    preloader.classList.add('preloader--faded');
    setTimeout(function () {
      preloader.classList.add('preloader--hidden');
      // setTimeout(showMenu, menuTimeoutMs);
    }, fadeOutTimeMs);
  };

  var tryHidePreloader = function () {
    if (timePassed && imageLoaded) {
      hidePreloader();
    }
  };

  var getImageUrl = function () {
    var backgroundImageCss = window.getComputedStyle(mainPage).backgroundImage;
    return backgroundImageCss.match(/url\((.*?)\)/)[1].replace(/('|")/g, '');
  };

  var onImageLoaded = function (cb) {
    try {
      var url = getImageUrl();
      var img = new Image();
      img.onload = cb;
      img.src = url;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      cb();
    }
  };

  var handleTimePassed = function () {
    timePassed = true;
    tryHidePreloader();
  };

  var handleImageLoaded = function () {
    imageLoaded = true;
    tryHidePreloader();
  };

  // var isFirstVisit = function () {
  //   var visited = localStorage.getItem('visited');
  //   return !visited;
  // };

  var setVisited = function () {
    localStorage.setItem('visited', true);
  };

  // if (isFirstVisit()) {
    showPreloader();
    setTimeout(handleTimePassed, minTimeoutMs);
    onImageLoaded(handleImageLoaded);
    // setVisited();
  // }
})();


'use strict';

(function () {
  var progresssContainer = document.querySelector('.progress__tabs-years');
  if (!progresssContainer) {
    return;
  }

  var progressTabYears = document.querySelectorAll('.progress__tab-year');

  var initYearTab = function (progressTabYear) {
    var buttons = progressTabYear.querySelectorAll('.choice-progress button');
    var tabsItems = progressTabYear.querySelectorAll('.progress-tab');

    var setButtonIds = function (array) {
      for (var i = 0; i < array.length; i++) {
        var element = array[i];
        element.dataset.id = i;
      }
    };

    var showTabContent = function (tabItem) {
      tabItem.classList.add('is-active');
    };

    var hideTabContent = function (tabItem) {
      tabItem.classList.remove('is-active');
    };

    var handleTabClick = function (evt) {
      evt.preventDefault();
      var button = evt.currentTarget;
      switchTab(button);
    };

    var switchTab = function (button) {
      unselectActiveButton(buttons);
      var targetDataIndex = parseInt(button.dataset.id, 10);
      selectTabsContent(targetDataIndex);
      button.classList.add('switch-button--active');
    };

    var selectTabsContent = function (index) {
      for (var j = 0; j < tabsItems.length; j++) {
        var tabItem = tabsItems[j];
        hideTabContent(tabItem);
        if (j === index) {
          showTabContent(tabItem);
        }
      }
    };

    var unselectActiveButton = function (array) {
      for (var index = 0; index < array.length; index++) {
        var elem = array[index];
        elem.classList.remove('switch-button--active');
      }
    };

    setButtonIds(buttons);
    for (var i = 0; i < buttons.length; i++) {
      var element = buttons[i];
      element.addEventListener('click', handleTabClick);
    }
  };

  for (var i = 0; i < progressTabYears.length; i++) {
    var progressTabYear = progressTabYears[i];
    initYearTab(progressTabYear);
  }


  // var deactivateFutureButtons = function () {
  //   var yearButtonSlides = document.querySelectorAll('.year-choice .swiper-slide');
  //   var yearTabs = document.querySelectorAll('.progress__tab-year');

  //   var disableYearButton = function (yearButtonSlide) {
  //     var button = yearButtonSlide.querySelector('button');
  //     button.classList.add('visually-hidden');
  //     var span = yearButtonSlide.querySelector('span');
  //     span.classList.remove('visually-hidden');
  //   };

  //   var disableMonthButton = function (monthSlide) {
  //     var button = monthSlide.querySelector('button');
  //     button.classList.add('visually-hidden');
  //     button.style.display = 'none';
  //     var p = monthSlide.querySelector('p');
  //     p.classList.remove('visually-hidden');
  //   };

  //   var getIsYearAvailable = function (year) {
  //     return new Date().getFullYear() >= year;
  //   };

  //   var isMonthAvailable = function (year, month) {
  //     var now = new Date(new Date().getFullYear(), new Date().getMonth()).valueOf();
  //     var compare = new Date(year, month).valueOf();
  //     return now >= compare;
  //   };

  //   var getElementYear = function (yearTab) {
  //     return parseInt(yearTab.dataset.year, 10);
  //   };

  //   var getElementMonth = function (yearTab) {
  //     return parseInt(yearTab.dataset.month, 10);
  //   };

  //   for (var i = 0; i < yearButtonSlides.length; i++) {
  //     var yearButtonSlide = yearButtonSlides[i];
  //     var buttonYear = getElementYear(yearButtonSlide);
  //     var yearTab = yearTabs[i];
  //     var tabYear = getElementYear(yearTab);
  //     var monthButtonSlides = yearTab.querySelectorAll('.swiper-slide-month');

  //     for (var j = 0; j < monthButtonSlides.length; j++) {
  //       var monthButtonSlide = monthButtonSlides[j];
  //       var buttonMonth = getElementMonth(monthButtonSlide);

  //       if (!isMonthAvailable(tabYear, buttonMonth)) {
  //         disableMonthButton(monthButtonSlide);
  //       }
  //     }

  //     if (!getIsYearAvailable(buttonYear)) {
  //       disableYearButton(yearButtonSlide);
  //     }
  //   }
  // };

  // deactivateFutureButtons();
})();

'use strict';

(function () {
  window.addEventListener('load', function () {
    // получаем текущее значение высоты
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
  });
  window.addEventListener('resize', function () {
    // получаем текущее значение высоты
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
  });
})();

'use strict';

(function () {

  if (window.isTablet()) {
    return;
  }

  var controller = new ScrollMagic.Controller();
  var wipeAnimation = new TimelineMax()
    .fromTo('.scroll-block--3', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone })
    .fromTo('.scroll-block--4', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone });

  var wipeAnimation1 = new TimelineMax()

    .fromTo('.scroll-block--7', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone })
    .fromTo('.scroll-block--8', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone });

  var wipeAnimation2 = new TimelineMax()

    .fromTo('.scroll-block--11', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone })
    .fromTo('.scroll-block--12', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone });

  var wipeAnimation3 = new TimelineMax()

    .fromTo('.scroll-block--15', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone })
    .fromTo('.scroll-block--16', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone });

  var wipeAnimation4 = new TimelineMax()

    .fromTo('.scroll-block--19', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone })
    .fromTo('.scroll-block--20', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone })
    .fromTo('.scroll-block--21', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone })
    .fromTo('.scroll-block--22', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone })
    .fromTo('.scroll-block--23', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone })
    .fromTo('.scroll-block--24', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone })

  var wipeAnimation5 = new TimelineMax()

    .fromTo('.scroll-block--27', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone })
    .fromTo('.scroll-block--28', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone })
    .fromTo('.scroll-block--29', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone })
    .fromTo('.scroll-block--30', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone });

  var wipeAnimation6 = new TimelineMax()

    .fromTo('.scroll-block--33', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone })
    .fromTo('.scroll-block--34', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone });

  var wipeAnimation7 = new TimelineMax()

    .fromTo('.scroll-block--37', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone })
    .fromTo('.scroll-block--38', 1, { y: '100%' }, { y: '0%', ease: Linear.easeNone });

  var scene = new ScrollMagic.Scene({
    triggerElement: '.surraundings-list__scroll-container',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setPin('.surraundings-list__scroll-container')
    .setTween(wipeAnimation)
    .addTo(controller);


  var scene = new ScrollMagic.Scene({
    triggerElement: '.surraundings-list__scroll-container--1',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setPin('.surraundings-list__scroll-container--1')
    .setTween(wipeAnimation1)
    .addTo(controller);

  var scene = new ScrollMagic.Scene({
    triggerElement: '.surraundings-list__scroll-container--2',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setPin('.surraundings-list__scroll-container--2')
    .setTween(wipeAnimation2)
    .addTo(controller);

  var scene = new ScrollMagic.Scene({
    triggerElement: '.surraundings-list__scroll-container--3',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setPin('.surraundings-list__scroll-container--3')
    .setTween(wipeAnimation3)
    .addTo(controller);

  var scene = new ScrollMagic.Scene({
    triggerElement: '.surraundings-list__scroll-container--4',
    triggerHook: 'onLeave',
    duration: '600%'
  })
    .setPin('.surraundings-list__scroll-container--4')
    .setTween(wipeAnimation4)
    .addTo(controller);

  var scene = new ScrollMagic.Scene({
    triggerElement: '.surraundings-list__scroll-container--5',
    triggerHook: 'onLeave',
    duration: '600%'
  })
    .setPin('.surraundings-list__scroll-container--5')
    .setTween(wipeAnimation5)
    .addTo(controller);

  var scene = new ScrollMagic.Scene({
    triggerElement: '.surraundings-list__scroll-container--6',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setPin('.surraundings-list__scroll-container--6')
    .setTween(wipeAnimation6)
    .addTo(controller);

  var scene = new ScrollMagic.Scene({
    triggerElement: '.surraundings-list__scroll-container--7',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setPin('.surraundings-list__scroll-container--7')
    .setTween(wipeAnimation7)
    .addTo(controller);

  var scene = new ScrollMagic.Scene({
    triggerElement: '.paralax-section--1',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setTween('.paralax-section-content--1', { y: '120%', ease: Linear.easeNone })
    .addTo(controller);

  var scene = new ScrollMagic.Scene({
    triggerElement: '.paralax-section--2',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setTween('.paralax-section-content--2', { y: '120%', ease: Linear.easeNone })
    .addTo(controller);

  var scene = new ScrollMagic.Scene({
    triggerElement: '.paralax-section--3',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setTween('.paralax-section-content--3', { y: '120%', ease: Linear.easeNone })
    .addTo(controller);
  var scene = new ScrollMagic.Scene({
    triggerElement: '.paralax-section--4',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setTween('.paralax-section-content--4', { y: '120%', ease: Linear.easeNone })
    .addTo(controller);

  var scene = new ScrollMagic.Scene({
    triggerElement: '.paralax-section--5',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setTween('.paralax-section-content--5', { y: '120%', ease: Linear.easeNone })
    .addTo(controller);

  var scene = new ScrollMagic.Scene({
    triggerElement: '.paralax-section--6',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setTween('.paralax-section-content--6', { y: '120%', ease: Linear.easeNone })
    .addTo(controller);

  var scene = new ScrollMagic.Scene({
    triggerElement: '.paralax-section--7',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setTween('.paralax-section-content--7', { y: '120%', ease: Linear.easeNone })
    .addTo(controller);

  var scene = new ScrollMagic.Scene({
    triggerElement: '.paralax-section--8',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setTween('.paralax-section-content--8', { y: '120%', ease: Linear.easeNone })
    .addTo(controller);

  var scene = new ScrollMagic.Scene({
    triggerElement: '.paralax-section--9',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setTween('.paralax-section-content--9', { y: '120%', ease: Linear.easeNone })
    .addTo(controller);

  var scene = new ScrollMagic.Scene({
    triggerElement: '.paralax-section--10',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setTween('.paralax-section-content--10', { y: '120%', ease: Linear.easeNone })
    .addTo(controller);

  var scene = new ScrollMagic.Scene({
    triggerElement: '.paralax-section--11',
    triggerHook: 'onLeave',
    duration: '200%'
  })
    .setTween('.paralax-section-content--11', { y: '120%', ease: Linear.easeNone })
    .addTo(controller);
})();

'use strict';

(function () {
  var scrollUpButton = document.querySelector('.phone-icon-scroll-top');
  var choice = document.querySelector('.choice');
  var timer = null;

  if (!scrollUpButton) {
    return;
  }

  var scrollStart = function (el) {
    if (el.classList.contains('js-scrool-stop')) {
      el.classList.remove('js-scrool-stop');
      el.classList.add('js-scrool-start');
    }
  };

  var scrollStop = function () {
    choice.classList.remove('js-scrool-start');
    choice.classList.add('js-scrool-stop');
  };

  if (choice) {
    if (!window.isMobile()) {
      window.addEventListener('scroll', function () {
        clearTimeout(timer);
        scrollStart(choice);

        timer = setTimeout(scrollStop, 1000);
      });
    } else {
      window.addEventListener('scroll', function () {
        if (window.scrollY >= 400) {
          scrollUpButton.classList.add('js-scrool-stop');
        } else {
          scrollUpButton.classList.remove('js-scrool-stop');
        }
      });
    }
  }

  if (!scrollUpButton || !window.isMobile()) {
    return;
  }

  scrollUpButton.addEventListener('click', function () {
    var scroll = new SmoothScroll();
    var anchor = document.querySelector('h1');
    scroll.animateScroll(anchor);
  });
})();

'use strict';

(function () {
  var surraundings = document.querySelector('.surraundings');
  if (surraundings) {
    var tabsContainer = document.querySelector('.choice-container');
    var tabs = tabsContainer.querySelectorAll('button');
    var container = document.querySelector('html');

    for (var index = 0; index < tabs.length; index++) {
      var element = tabs[index];
      element.addEventListener('click', function () {
        container.scrollIntoView();
      });
    }
  }
})();

'use strict';

(function () {
  var table = document.querySelector('#table');

  if (!table) {
    return;
  }

  new Tablesort(document.getElementById('table'));
})();

'use strict';


(function () {
  var rows = document.querySelectorAll('.plan__table tbody tr');

  if (!window.isMobile()) {

    var handleClick = function (e) {
      e.preventDefault();
      var target = e.currentTarget;
      var targetDataHref = target.dataset.href;
      window.location.href = targetDataHref;
    };

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      row.addEventListener('click', handleClick);
    }
  }
})();

'use strict';

(function () {
  var buttonsContainer = document.querySelector('.choice');
  if (!buttonsContainer) {
    return;
  }
  var buttonSoldOut = buttonsContainer.querySelector('button.soldout');

  if (buttonSoldOut) {
    return;
  }

  var buttons = buttonsContainer.querySelectorAll('button');
  var tabsItems = document.querySelectorAll('.tab');

  var setDataItems = function (array) {
    for (var i = 0; i < array.length; i++) {
      var element = array[i];
      element.dataset.id = i;
    }
  };

  var selectTabsContent = function (index) {
    for (var j = 0; j < tabsItems.length; j++) {
      tabsItems[j].classList.remove('is-active');
      if (j === index) {
        tabsItems[j].classList.add('is-active');
      }
    }
  };

  var selectTab = function (index) {
    resetActiveButton();
    selectTabsContent(index);
    var button = buttons[index];
    button.classList.add('switch-button-active');
  };

  var handleButtonClick = function (e) {
    e.preventDefault();
    var target = e.currentTarget;
    var targetDataIndex = parseInt(target.dataset.id, 10);
    selectTab(targetDataIndex);
  };

  var addEventListenersToButtons = function () {
    for (var i = 0; i < buttons.length; i++) {
      var element = buttons[i];
      element.addEventListener('click', handleButtonClick);
    }
  };

  var resetActiveButton = function () {
    for (var index = 0; index < buttons.length; index++) {
      var elem = buttons[index];
      elem.classList.remove('switch-button-active');
    }
  };

  var getParameterByName = function (name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    var results = regex.exec(url);
    if (!results) {
      return null;
    }
    if (!results[2]) {
      return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  };

  var preselectActiveTab = function () {
    var initTabParam = getParameterByName('tab');
    if (initTabParam) {
      var initTabIndex = parseInt(initTabParam, 10) - 1;
      selectTab(initTabIndex);
    }
  };

  setDataItems(buttons);
  addEventListenersToButtons();
  preselectActiveTab();
})();
