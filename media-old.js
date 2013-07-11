/**
 * Media Uploader UI < 3.5
 */
(function(window){
	jQuery(function($){
		$('.ml-image').livequery(function(index, input){
			var $button = $(this),
				$parent = $button.parent(),
				$remove = $parent.find('.ml-image-remove'),
				$url_field = $parent.find('.image-url'),
				$id_field = $parent.find('.image-id'),
				$image_holder = $parent.find('.image-holder');

			$remove.click(function() {
				$url_field.val('');
				$id_field.val('');
				$image_holder.html('');
				$remove.css('display', 'none');
			});

			$button.click(function() {
				var all_types = $button.attr('data-image') && $button.attr('data-image') == 'no' ? true : false,
					return_type = $button.attr('data-return') ? $button.attr('data-return') : 'mixed';

				$('html').addClass('Image');
				if(all_types)
					tb_show('', 'media-upload.php?post_id=0&TB_iframe=1&width=640&height=482');
				else
					tb_show('', 'media-upload.php?post_id=0&type=image&TB_iframe=1&width=640&height=482');

				window.original_send_to_editor = window.send_to_editor;
				window.send_to_editor = function(html) {
					var $el = null, 
						$html = $(html),
						url = '', 
						classes = '';

					if(all_types) {
						$el = $html;
						url = $html.attr('href');
					} else {
						$el = $html.find('img');
						url = $el.attr('src');
					}

					classes = $el.attr('class');
					$url_field.val(url);
					if(return_type == 'mixed') {
						var matchs = classes.match(/wp-image-\d+/);
						if(matchs.length) {
							var image_id = matchs[0].replace('wp-image-', '');
							$id_field.val(image_id);
						}
						$image_holder.html('<img src="'+ url +'" />');
						$remove.css('display', 'inline');
					}
					tb_remove();
					$('html').removeClass('Image');
				};
			});
		}); // Media Library button
	});
})(window);