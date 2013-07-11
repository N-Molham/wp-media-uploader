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
				// image url hidden field
				$url_field = $parent.find('.image-url'),
				// image id hidden field
				$id_field = $parent.find('.image-id'),
				// remove button
				$remove = $parent.find('.ml-image-remove'),
				// remove confirm message
				$remove_confirm = $parent.find('.remove-confirm'),
				// image placeholder
				$image_holder = $parent.find('.image-holder');

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
					$url_field.val('');
					$id_field.val('');
					// dummy placeholder image
					$image_holder.html('<img src="'+ nab_muploader.image_placeholder +'" '+ image_size +' alt="" />');
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
					multiple: nab_muploader.multiple == 'yes' ? true : false,
				});

				//callback for selected image
				file_frame.on('select', function() {
					var selected = [];
					if ( nab_muploader.multiple == 'yes' ) {
						// multiple images selected
						var selection = file_frame.state().get('selection');
						selection.map(function(file) {
							selected.push(file.toJSON());
						});
					} else {
						// single image
						selected.push(file_frame.state().get('selection').first().toJSON());
					}

					// loop through selected images
					for (var i in selected) {
						$url_field.val(selected[i].url);
						$id_field.val(selected[i].id);
						// check if the image has thumbnail to use instead of full size image
						if ( typeof selected[i].sizes.thumbnail != 'undefined' ) {
							// has thumb
							$image_holder.html('<img src="'+ selected[i].sizes.thumbnail.url +'" '+ image_size +' alt="" />');
						} else {
							// use full size image
							$image_holder.html('<img src="'+ selected[i].url +'" '+ image_size +' alt="" />');
						}
						// show remove button
						$remove.css('display', 'inline-block');
					}

					// trigger image(s) selected event
					$('body').trigger('nab_image_selected', [selected]);
				});

				// open file frame
				file_frame.open();
			});
		});
	});
})(window);


