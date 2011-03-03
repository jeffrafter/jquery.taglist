/*
 * Taglist (for jQuery)
 * version: 0.2 (3/3/2010)
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
      <div class="taglist"></div>
 *  </div> 
 *
 *  <script type="text/javascript">
 *    $('div.taglist').taglist([], {
 *      className: 'tag', // default: tag
 *      onAdd: function(tag) {},
 *      onRemove: function(tag) {},
 *      onProcess: function(tag) {}
 *    })
 *  </script>
 *
 * Available options:
 *
 *   className: the class that should be used for each new tag in the list
 *
 *   prefixUrl: the base url inside of each tag href (the tag text is encoded and added)
 *
 *   inputType: overridable input type (default is "text"), so you can use HTML 5 style inputs
 *
 */
(function($) {
  var defaults = {
    className: 'tag',
    inputType: 'text',
    onAdd: null,
    onRemove: null,
    onProcess: null,
    prefixUrl: null,
  };

  var Taglist = function(container, userTags, userOptions) {
    var options = {};
    $.extend(options, defaults, userOptions);

    var self          = this;
    var tags          = [];
    var container     = $(container);
    var inputSpan     = $("<span class='taginput'><input type='" + options.inputType +"'></span>");
    var inputMaxWidth = 0;
    var inputComfort  = 20; // Must be > width of a single char or you get jitter
    var inputVal      = null;
    var inputTest     = null;
    var input         = inputSpan.find('input');
    var tagTest       = null;

    var init = function() {
      container.empty().append(input);
      container.click(function() { input.focus() });

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

      $.each(userTags, function(i, t) {
        self.addTag(t);
      });

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
        options.prefixUrl + encodeURIComponent(tag) + "' onclick='return false' title='" + tag +"'>"+
        "<span class='tagclose'>&#x2715;</span>"+
        "<span class='tagname'>"+tag+"</span>"+
        "</a><span> </span>").insertBefore(input);
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
      if (options.onAdd) options.onAdd.apply(self, [tag]);
      return el;
    };

    this.removeTag = function(tag) {
      tag = tag.replace(/^\s*/, '').replace(/\s*$/, '');
      if (tag == '') return;
      if (tags.indexOf(tag) == -1) return;
      var el = container.find('a[title='+tag+']').remove();
      tags.splice(tags.indexOf(tag), 1);
      if (options.onRemove) options.onRemove.apply(self, [tag]);
      return el;
    };

    this.processTag = function(tag) {
      if (options.onProcess) return options.onProcess.apply(self, [tag]);
      return self.addTag(tag);
    }

    // Get things started
    init();

  };

  $.fn.taglist = function(tags, options) {
    $.each(this, function(i, e) {
      e.taglist = new Taglist(e, tags, options);
    });
    return this;
  };
}(jQuery));
