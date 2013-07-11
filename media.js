/**
 * Media Uploader UI >= 3.5
 */
(function(window){
	jQuery(function($) {
		// frame holder
		var file_frame,
			// placeholder image size 
			image_size = 'width="'+ nab_muploader.image_placeholder_width +'" height="'+ nab_muploader.image_placeholder_height +'"';

		$('.ml-image').livequery(function(){
			// the button itself
			var $button = $(this),
				// parent element, holder of the hold component
				$parent = $button.parent(),
				// inputs holder
				$inputs = $parent.find('.inputs');
				// image url hidden field
				$url_field = $parent.find('.image-url'),
				// image id hidden field
				$id_field = $parent.find('.image-id'),
				// remove button
				$remove = $parent.find('.ml-image-remove'),
				// remove confirm message
				$remove_confirm = $parent.find('.remove-confirm'),
				// image placeholder
				$image_holder = $parent.find('.image-holder'),
				// items index
				last_index = 1,
				// if multiple file or not
				is_multiple = $button.hasClass('multiple');

			// remove image from multiple
			$image_holder.on('click', '.image', function(){
				if ( !confirm(nab_muploader.remove_confirm_message) ) {
					return false;
				}
				var remove_index = '.image-'+ parseInt($(this).remove().attr('data-index'));
				$inputs.find(remove_index).remove();
				// reset component if all images removed
				if ( $image_holder.find('.image').length < 1 ) {
					// dummy placeholder image
					$image_holder.html('<img src="'+ nab_muploader.image_placeholder +'" '+ image_size +' alt="" />');
					// nide remove button
					$remove.css('display', 'none');
				}
			});

			// remove button clicked
			$remove.on('click', function(){
				// show remove confirm message
				$remove_confirm.show();
				// hide buttons
				$button.hide();
				$remove.hide();
			});

			// remove confirm message buttons clicked
			$remove_confirm.find('.confirm-button').click(function(){
				if ( $(this).is('.confirm-yes') ) {
					// agreed on removal, reset fields values
					if ( is_multiple ) {
						// multiple images
						clear_multiple_images();
					} else {
						// single image
						$url_field.val('');
						$id_field.val('');
					}
					// dummy placeholder image
					$image_holder.html('<img src="'+ nab_muploader.image_placeholder +'" '+ image_size +' alt="" />');
					// nide remove button
					$remove.css('display', 'none');
				} else {
					// canceled
					$remove.show();
				}
				// reset component display
				$remove_confirm.hide();
				$button.show();
			});

			$button.on('click', function(e){
				// prevent default behavior
				e.preventDefault();
				if ( typeof file_frame != 'undefined' ) {
					file_frame.close();
				}

				// create and open new file frame
				file_frame = wp.media({
					//Title of media manager frame
					title: nab_muploader.frame_title,
					library: {
						type: nab_muploader.file_type
					},
					button: {
						//Button text
						text: nab_muploader.select_button_label
					},
					//Do not allow multiple files, if you want multiple, set true
					multiple: is_multiple,
				});

				//callback for selected image
				file_frame.on('select', function() {
					var selected = [];
					if ( is_multiple ) {
						// multiple images selected
						var selection = file_frame.state().get('selection');
						selection.map(function(file) {
							selected.push(file.toJSON());
						});
					} else {
						// single image
						selected.push(file_frame.state().get('selection').first().toJSON());
					}

					// clear images and inputs if multiple
					if ( is_multiple ) {
						clear_multiple_images();
					}

					// loop through selected images
					for (var i in selected) {
						parse_selected_item( selected[i] , is_multiple );
					}

					// trigger image(s) selected event
					$('body').trigger('nab_image_selected', [selected]);
				});

				// open file frame
				file_frame.open();
			});

			// clear multiple images
			function clear_multiple_images () {
				$image_holder.empty();
				$inputs.empty();
				last_index = 1;
			}
			
			// handle selected item
			function parse_selected_item ( image_item, new_item ) {
				// create new inputs if multiple 
				if ( new_item ) {
					$id_field = $('<input name="'+ nab_sprintf(nab_inputs_name.id, last_index) +'" type="hidden" value="" class="image-id image-'+ last_index +'" />');
					$url_field = $('<input name="'+ nab_sprintf(nab_inputs_name.url, last_index) +'" type="hidden" value="" class="image-url image-'+ last_index +'" />');
				}
				// set inputs values
				$id_field.val(image_item.id);
				$url_field.val(image_item.url);
				// append inputs to it's holder if multiple
				if ( new_item ) {
					$inputs.append( [ $id_field, $url_field ] );
				}
				// check if the image has thumbnail to use instead of full size image
				if ( typeof image_item.sizes.thumbnail != 'undefined' ) {
					// has thumb
					if ( new_item ) {
						$image_holder.append('<span class="image image-'+ last_index +'" data-index="'+ last_index +'"><img src="'+ image_item.sizes.thumbnail.url +'" '+ image_size +' alt="" /></span>');
					} else {
						$image_holder.html('<img src="'+ image_item.sizes.thumbnail.url +'" '+ image_size +' alt="" />');
					}
				} else {
					// use full size image
					if ( new_item ) {
						$image_holder.append('<span class="image image-'+ last_index +'"><img src="'+ image_item.url +'" '+ image_size +' alt="" /></span>');
					} else {
						$image_holder.html('<img src="'+ image_item.url +'" '+ image_size +' alt="" />');
					}
				}
				// increase items length if multiple
				if ( new_item ) {
					last_index++;
				}
				// show remove button
				$remove.css('display', 'inline-block');
			}
		});

		// php like sprintf
		window.nab_sprintf = function () {
			// http://kevin.vanzonneveld.net
			// +   original by: Ash Searle (http://hexmen.com/blog/)
			// + namespaced by: Michael White (http://getsprink.com)
			// +    tweaked by: Jack
			// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
			// +      input by: Paulo Freitas
			// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
			// +      input by: Brett Zamir (http://brett-zamir.me)
			// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
			// +   improved by: Dj
			// +   improved by: Allidylls
			// *     example 1: sprintf("%01.2f", 123.1);
			// *     returns 1: 123.10
			// *     example 2: sprintf("[%10s]", 'monkey');
			// *     returns 2: '[    monkey]'
			// *     example 3: sprintf("[%'#10s]", 'monkey');
			// *     returns 3: '[####monkey]'
			// *     example 4: sprintf("%d", 123456789012345);
			// *     returns 4: '123456789012345'
			var regex = /%%|%(\d+\$)?([-+\'#0 ]*)(\*\d+\$|\*|\d+)?(\.(\*\d+\$|\*|\d+))?([scboxXuideEfFgG])/g;
			var a = arguments,
			i = 0,
			format = a[i++];

			// pad()
			var pad = function (str, len, chr, leftJustify) {
				if (!chr) {
					chr = ' ';
				}
				var padding = (str.length >= len) ? '' : Array(1 + len - str.length >>> 0).join(chr);
				return leftJustify ? str + padding : padding + str;
			};

			// justify()
			var justify = function (value, prefix, leftJustify, minWidth, zeroPad, customPadChar) {
				var diff = minWidth - value.length;
				if (diff > 0) {
					if (leftJustify || !zeroPad) {
						value = pad(value, minWidth, customPadChar, leftJustify);
					} else {
						value = value.slice(0, prefix.length) + pad('', diff, '0', true) + value.slice(prefix.length);
					}
				}
				return value;
			};

			// formatBaseX()
			var formatBaseX = function (value, base, prefix, leftJustify, minWidth, precision, zeroPad) {
				// Note: casts negative numbers to positive ones
				var number = value >>> 0;
				prefix = prefix && number && {
					'2': '0b',
					'8': '0',
					'16': '0x'
				}[base] || '';
				value = prefix + pad(number.toString(base), precision || 0, '0', false);
				return justify(value, prefix, leftJustify, minWidth, zeroPad);
			};

			// formatString()
			var formatString = function (value, leftJustify, minWidth, precision, zeroPad, customPadChar) {
				if (precision != null) {
					value = value.slice(0, precision);
				}
				return justify(value, '', leftJustify, minWidth, zeroPad, customPadChar);
			};

			// doFormat()
			var doFormat = function (substring, valueIndex, flags, minWidth, _, precision, type) {
				var number;
				var prefix;
				var method;
				var textTransform;
				var value;
				
				if (substring === '%%') {
					return '%';
				}

				// parse flags
				var leftJustify = false,
				positivePrefix = '',
				zeroPad = false,
				prefixBaseX = false,
				customPadChar = ' ';
				var flagsl = flags.length;
				for (var j = 0; flags && j < flagsl; j++) {
					switch (flags.charAt(j)) {
					case ' ':
						positivePrefix = ' ';
						break;
					case '+':
						positivePrefix = '+';
						break;
					case '-':
						leftJustify = true;
						break;
					case "'":
						customPadChar = flags.charAt(j + 1);
						break;
					case '0':
						zeroPad = true;
						break;
					case '#':
						prefixBaseX = true;
						break;
					}
				}

				// parameters may be null, undefined, empty-string or real valued
				// we want to ignore null, undefined and empty-string values
				if (!minWidth) {
					minWidth = 0;
				} else if (minWidth === '*') {
					minWidth = +a[i++];
				} else if (minWidth.charAt(0) == '*') {
					minWidth = +a[minWidth.slice(1, -1)];
				} else {
					minWidth = +minWidth;
				}

				// Note: undocumented perl feature:
				if (minWidth < 0) {
					minWidth = -minWidth;
					leftJustify = true;
				}

				if (!isFinite(minWidth)) {
					throw new Error('sprintf: (minimum-)width must be finite');
				}

				if (!precision) {
					precision = 'fFeE'.indexOf(type) > -1 ? 6 : (type === 'd') ? 0 : undefined;
				} else if (precision === '*') {
					precision = +a[i++];
				} else if (precision.charAt(0) == '*') {
					precision = +a[precision.slice(1, -1)];
				} else {
					precision = +precision;
				}

				// grab value using valueIndex if required?
				value = valueIndex ? a[valueIndex.slice(0, -1)] : a[i++];

				switch (type) {
				case 's':
					return formatString(String(value), leftJustify, minWidth, precision, zeroPad, customPadChar);
				case 'c':
					return formatString(String.fromCharCode(+value), leftJustify, minWidth, precision, zeroPad);
				case 'b':
					return formatBaseX(value, 2, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
				case 'o':
					return formatBaseX(value, 8, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
				case 'x':
					return formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
				case 'X':
					return formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad).toUpperCase();
				case 'u':
					return formatBaseX(value, 10, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
				case 'i':
				case 'd':
					number = +value || 0;
					number = Math.round(number - number % 1); // Plain Math.round doesn't just truncate
					prefix = number < 0 ? '-' : positivePrefix;
					value = prefix + pad(String(Math.abs(number)), precision, '0', false);
					return justify(value, prefix, leftJustify, minWidth, zeroPad);
				case 'e':
				case 'E':
				case 'f': // Should handle locales (as per setlocale)
				case 'F':
				case 'g':
				case 'G':
					number = +value;
					prefix = number < 0 ? '-' : positivePrefix;
					method = ['toExponential', 'toFixed', 'toPrecision']['efg'.indexOf(type.toLowerCase())];
					textTransform = ['toString', 'toUpperCase']['eEfFgG'.indexOf(type) % 2];
					value = prefix + Math.abs(number)[method](precision);
					return justify(value, prefix, leftJustify, minWidth, zeroPad)[textTransform]();
				default:
					return substring;
				}
			};
			return format.replace(regex, doFormat);
		};
	});
})(window);


