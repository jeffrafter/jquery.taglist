/*
 * Taglist (for jQuery)
 * version: 0.4 (3/15/2010)
 * @requires jQuery v1.4 or later
 *
 * Examples at http://jeffrafter.github.com/jquery.taglist
 *
 * Licensed under the MIT:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright 2011 Jeff Rafter
 *
 * Input resizing based on http://jsbin.com/ahaxe
 *
 * Makes an editable taglist that adds items as blocks
 *
 * Usage:
 *
 *  <div class="container">
      < class="taglist"></div>
 *  </div>
 *
 *  <script type="text/javascript">
 *    options = {};
 *    tags = [];
 *    $('input.taglist').taglist(tags, options)
 *  </script>
 *
 * Advanced:
 *
 *   If you want to have long tags (with spaces) you can simply set the keyCodes and delimiter options to
 *   be empty and jquery.taglist will insert a JSON version of the tags into the value:
 *
 *    $('input.taglist').taglist([], {keyCodes: null, delimiter: null})
 *
 * Available options:
 *
 *   className: the class that should be used for each new tag in the list
 *
 *   prefixUrl: the base url inside of each tag href (the tag text is encoded and added)
 *
 *   inputType: overridable input type (default is "text"), so you can use HTML 5 style inputs
 *
 *   keyCodes: a list of key codes that trigger tag processing. For example, [188, 0] are the keyCodes for "," and " " respectively
 *
 *   delimiter: the default tag delimiter (" " by default). This will be used when splitting and building up the input value.
 *
 */
(function($) {
  var defaults = {
    className: 'tag',
    inputType: 'text',
    prefixUrl: null,
    keyCodes: [188, 32],
    delimiter: ' ',
    onAdd: null,
    onRemove: null,
    onProcess: null
  };

  var Taglist = function(base, userTags, userOptions) {
    var options = {};
    $.extend(options, defaults, userOptions);

    var self          = this;
    var tags          = [];
    var nodes         = [];
    var base          = $(base);
    var container     = $("<div></div>");
    var inputSpan     = $("<span class='taginput'><input type='" + options.inputType +"'></span>");
    var inputMaxWidth = 0;
    var inputComfort  = 20; // Must be > width of a single char or you get jitter
    var inputVal      = null;
    var inputTest     = null;
    var input         = inputSpan.find('input');
    var tagTest       = null;

    var init = function() {
      base.hide();
      container.empty().append(input);
      container.attr('class', base.attr('class'));
      container.click(function() { input.focus() });
      base.after(container);

      // Based on http://jsbin.com/ahaxe
      inputMaxWidth = container.width();
      inputTest = $("<div class='test'/>").css({
        position: 'absolute',
        top: -9999,
        left: -9999,
        width: 'auto',
        fontSize: input.css('fontSize'),
        fontFamily: input.css('fontFamily'),
        fontWeight: input.css('fontWeight'),
        letterSpacing: input.css('letterSpacing'),
        whiteSpace: 'nowrap'
      });

      userTags = userTags || [];
      userTags.push(base.val());
      $.each(userTags, function(i, t) { self.processTag(t) });

      inputCheck = function() {
        if (inputVal === (inputVal = input.val())) {return;}

        // Enter new content into testSubject
        var escaped = inputVal.replace(/&/g, '&amp;').replace(/\s/g,'&nbsp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        // Sometimes this gets stuck
        inputTest.width(0);
        inputTest.width('auto');
        inputTest.html(escaped);

        // Calculate new width + whether to change
        var inputTestWidth = inputTest.width(),
            newWidth = inputTestWidth + inputComfort,
            currentWidth = input.width(),
            isValidWidthChange = (newWidth < currentWidth && newWidth >= 0) || (newWidth > currentWidth && newWidth < inputMaxWidth);
        if (isValidWidthChange) input.width(newWidth);
      };

      // Key handling for backspace, enter
      input.keydown(function(event) {
        switch (event.keyCode) {
          case 13: // Enter
            self.processTag(input.val());
            input.val('');
            event.preventDefault();
            break;
          case 8: // Delete
            if (tags.length == 0) return;
            if (input.val() == '') self.removeTag(tags[tags.length-1]);
            break;
          case 27: // ESC
            input.val('');
            input.blur();
            break;
        }
        if (options.keyCodes) {
          if (options.keyCodes.indexOf(event.which) > -1) {
            self.processTag(input.val());
            input.val('');
            event.preventDefault();
          }
        }
      });

      input.blur(function(event) {
        if (input.val() == '') return;
        self.processTag(input.val());
        input.val('');
      });

      inputTest.insertAfter(input);
      input.bind('keyup keydown blur update', inputCheck);
      inputCheck();
    }

    this.addTag = function(tag) {
      // Trim the string, we don't want leading and trailing spaces
      tag = tag.replace(/^\s*/, '').replace(/\s*$/, '');
      if (tag == '') return;
      if (tags.indexOf(tag) > -1) return;
      tags.push(tag);
      var el = $("<a class='" +
        options.className + "' href='" +
        options.prefixUrl + encodeURIComponent(tag) + "' onclick='return false' title='" +
        tag.replace(/&/g, '&amp;').replace(/\s/g,'&nbsp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\'/g, '&apos;').replace(/\"/g, '&quot;') +"'>"+
        "<span class='tagclose'>&#x2715;</span>"+
        "<span class='tagname'>"+tag+"</span>"+
        "</a><span> </span>").insertBefore(input);
      nodes.push(el);
      // Check for ellipsis adjustment
      var elided = 0;
      var abbrev = tag;
      tagTest = el.find('span.tagname');
      while (true) {
        if (tagTest.width() <= inputMaxWidth-inputComfort-10) break;
        if (elided >= tag.length) break;
        abbrev = tag.slice(0, tag.length-elided++)+'&hellip;';
        tagTest.html(abbrev);
      }
      el.find('span.tagclose').click(function(event) {
        self.removeTag(el.attr('title'));
      });
      if (options.delimiter)
        base.val(tags.join(options.delimiter));
      else
        base.val(JSON.stringify(tags));
      if (options.onAdd) options.onAdd.apply(self, [tag]);
      return el;
    };

    this.removeTag = function(tag) {
      tag = tag.replace(/^\s*/, '').replace(/\s*$/, '');
      if (tag == '') return;
      if (tags.indexOf(tag) == -1) return;
      var el = nodes[tags.indexOf(tag)];
      el.remove();
      nodes.splice(tags.indexOf(tag), 1);
      tags.splice(tags.indexOf(tag), 1);
      if (options.delimiter)
        base.val(tags.join(options.delimiter));
      else
        base.val(JSON.stringify(tags));
      if (options.onRemove) options.onRemove.apply(self, [tag]);
      return el;
    };

    this.processTag = function(tag) {
      if (options.onProcess)
        options.onProcess.apply(self, [tag]);
      else {
        var all = tag.split(options.delimiter);
        for(var i=0; i<all.length; i++) this.addTag(all[i]);
      }
    }

    // Quick access
    this.base = base;
    this.tags = tags;

    // Get things started
    init();

  };

  $.fn.taglist = function(tags, options) {
    this.filter('input:text').each(function() {
      this.taglist = new Taglist(this, tags, options);
    });
    return this;
  };
}(jQuery));
