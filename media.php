<?php
/**
 * Media uploader
 * 
 * @author Nabeel Molham
 */
global $nab_media_pages, $nab_locale_data, $nab_base_url;

// enqueues base url
$nab_base_url = '';

// pages list to enqueue scripts
$nab_media_pages = array (
		'post',
		'product',
);

// locale data sent to js
$nab_locale_data = array (
		'frame_title' => __('Select an Image'),
		'select_button_label' => __('Use Image'),
		'file_type' => 'image',
		'multiple' => 'no',
		'image_placeholder_width' => '70',
		'image_placeholder_height' => '70',
);

add_action('admin_init', 'nab_admin_init');
/**
 * WP Admin Initialize
 */
function nab_admin_init()
{
	global $nab_locale_data, $nab_base_url;

	// calculate base url
	$pathinfo = pathinfo(__FILE__);
	$thems_pos = strpos( $pathinfo['dirname'], 'themes' );
	if ( $thems_pos !== false )
	{
		// in theme
		$final_path = substr($pathinfo['dirname'], $thems_pos);
		$nab_base_url = WP_CONTENT_URL . '/' .implode( '/', explode(DIRECTORY_SEPARATOR, $final_path) ) . '/';
	}
	else
	{
		// in plugin
		$nab_base_url = plugin_dir_url(__FILE__);
	}
	
	// Base url filter
	$nab_base_url = apply_filters('nab_base_url', $nab_base_url);

	// locale data image placeholder src
	$nab_locale_data['image_placeholder'] = $nab_base_url . 'placeholder.png';
	
	// locale data filter
	$nab_locale_data = apply_filters('nab_js_local_data', $nab_locale_data);
}

add_action('admin_enqueue_scripts', 'nab_media_uploader_enqueue_scripts');
/**
 * Add Media Uploader js css
*/
function nab_media_uploader_enqueue_scripts()
{
	global $nab_media_pages, $nab_locale_data, $nab_base_url;

	// current screen
	$screen = get_current_screen();

	// enqueue at needed pages only
	if( apply_filters('nab_enqueue_page_check', in_array($screen->id, $nab_media_pages), $screen) )
	{
		// register livequery js
		wp_register_script( 'nab-live-query', $nab_base_url . 'jquery.livequery.min.js', array('jquery'), false, true );

		if ( apply_filters('nab_wp_ver_check', nab_wp_new_version(), $screen) )
		{
			// load new media uploader
			wp_enqueue_script( 'nab-live-query' );
			wp_enqueue_media();
			wp_register_script( 'nab-media-uploader', $nab_base_url . 'media.js', array('jquery'), false, true );
			wp_enqueue_script( 'nab-media-uploader' );
		}
		else 
		{
			// load legacy media uploader
			// css
			wp_enqueue_style( 'thickbox' );
	
			// js
			$deps = array (
					'jquery', 
					'thickbox', 
					'media-upload',
			);
			wp_enqueue_script( 'nab-live-query' );
			wp_register_script( 'nab-media-uploader', $nab_base_url . 'media-old.js', $deps, false, true );
			wp_enqueue_script( 'nab-media-uploader' );
		}

		// locale handler
		$locale_handler = apply_filters('nab_js_locale_handler', 'nab-media-uploader');

		// locale var name
		$locale_name = apply_filters('nab_js_locale_name', 'nab_muploader');

		// locale data enqueue
		wp_localize_script($locale_handler, $locale_name, $nab_locale_data);
	}
}

/**
 * Display Media Uploader input
 *
 * @param array $image
 * @param array $args
 * @return string
 */
function nab_media_uploader_input( $image, $args = '' )
{
	global $nab_locale_data;

	// image(s) data
	$image = wp_parse_args( $image, array (
			'url' => '',
			'id' => 0,
	) );
	$image = apply_filters('nab_image_data', $image);

	// image arguments
	$args = wp_parse_args( $args, array (
			'input_name' => 'ml_image',
			'input_id_name' => 'id',
			'input_url_name' => 'url',
			'multiple' => $nab_locale_data['multiple'],
			'data_array' => true,
	) );
	$args = apply_filters('nab_image_args', $args);

	if ( 'yes' == $args['multiple'] )
		return 'Still Working On Multiple selection :D Stay tuned.';

	// image(s) holder
	$out = '<span style="display:inline-block;vertical-align:middle;" class="image-holder">';
	$out .= '<img src="'. ('' == $image['url'] ? $nab_locale_data['image_placeholder'] : $image['url']) .'" width="'. $nab_locale_data['image_placeholder_width'] .'" height="'. $nab_locale_data['image_placeholder_height'] .'" />';
	$out .= '</span>';

	// library and remove buttons
	$out .= '&nbsp;&nbsp;&nbsp;<input type="button" class="ml-image button" value="'. apply_filters('nab_uploader_button_label', __('Media Library')) .'" />';
	$out .= '&nbsp;&nbsp;&nbsp;<input type="button" class="ml-image-remove button" value="'. apply_filters('nab_remove_button_label', __('Remove')) .'"'. ('' == $image['url'] ? ' style="display: none;"' : '') .' />';

	// remove confirm
	$out .= '<span class="remove-confirm" style="display:none;">';
	$out .= apply_filters('nab_remove_confirm_message', __('Are you sure you want to remove it ?'));
	$out .= '&nbsp;&nbsp;&nbsp;<input type="button" class="button confirm-button confirm-yes" value="'. apply_filters('nab_remove_confirm_yes', __('Yes')) .'" />';
	$out .= '&nbsp;&nbsp;&nbsp;<input type="button" class="button confirm-button confirm-no" value="'. apply_filters('nab_remove_confirm_no', __('No')) .'" />';
	$out .= '</span>';

	// inputs
	$out .= '<input name="'. ( $args['data_array'] ? $args['input_name'] . '['. $args['input_id_name'] .']' : $args['input_id_name'] ) .'" type="hidden" value="'. (int) esc_attr( $image['id'] ) .'" class="image-id" />';
	$out .= '<input name="'. ( $args['data_array'] ? $args['input_name'] . '['. $args['input_url_name'] .']' : $args['input_url_name'] ) .'" type="hidden" value="'. esc_attr( $image['url'] ) .'" class="image-url" />';

	return apply_filters('nab_image_output', $out);
}

/**
 * Check WP ver. if equal or newer than 3.5
 * 
 * @return boolean
 */
function nab_wp_new_version()
{
	global $wp_version;

	return version_compare($wp_version, '3.5', '>=');
}

