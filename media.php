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
		'product',
		'options-media',
);

// locale data sent to js
$nab_locale_data = array (
		'frame_title' => __('Select an Image'),
		'select_button_label' => __('Use Image'),
		'remove_confirm_message' => __('Are you sure ?'),
		'file_type' => 'image',
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
			// css
			wp_enqueue_style( 'nab-media-uploader-style', $nab_base_url . 'media.css' );

			// js
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

	// multiple files
	$is_multiple = 'yes' == $args['multiple'];

	// image(s) data
	if ( !$is_multiple ) 
		$image = wp_parse_args( $image, array ('url' => '', 'id' => 0) );

	// image(s) filter
	$image = apply_filters('nab_image_data', $image);

	// image arguments
	$args = wp_parse_args( $args, array (
			'input_name' => 'ml_image',
			'input_id_name' => 'id',
			'input_url_name' => 'url',
			'multiple' => 'no',
			'data_array' => true,
	) );
	$args = apply_filters('nab_image_args', $args);

	// image placeholder size
	$img_size = 'width="'. $nab_locale_data['image_placeholder_width'] .'" height="'. $nab_locale_data['image_placeholder_height'] .'"';

	// image(s) holder
	$out = '<span class="image-holder nab-image-holder'. ( $is_multiple ? ' multiple' : '' ) .'">';

	// inputs
	$inputs_fields = '';
	$inputs_name = array (
			'id' => $args['data_array'] ? $args['input_name'] . '['. $args['input_id_name'] .']' : $args['input_id_name'],
			'url' => $args['data_array'] ? $args['input_name'] . '['. $args['input_url_name'] .']' : $args['input_url_name'],
	);
	if ( $is_multiple )
	{
		$inputs_name = array (
				'id' => $args['data_array'] ? $args['input_name'] . '[%d]['. $args['input_id_name'] .']' : $args['input_id_name'] . '[%d]',
				'url' => $args['data_array'] ? $args['input_name'] . '[%d]['. $args['input_url_name'] .']' : $args['input_url_name'] . '[%d]',
		);
	}

	// is there file(s) selected or not
	$is_selected = null;

	if ( $is_multiple )
	{
		// multiple files
		// image item defaults
		$item_defualt = array (
				'id' => 0,
				'url' => '', 
		);

		// clear single file value if it was
		if ( isset($image['id']) )
			$image = array( $item_defualt );

		// loop
		foreach ( $image as $index => $item )
		{
			$item = wp_parse_args($item, $item_defualt);

			// set is_selected
			if ( null === $is_selected )
				$is_selected = '' != $item['url'];

			$out .= '<span class="image image-'. $index .'" data-index="'. $index .'"><img src="'. ( '' == $item['url'] ? $nab_locale_data['image_placeholder'] : $item['url'] ) .'" '. $img_size .' /></span>';
			$inputs_fields .= '<input name="'. sprintf($inputs_name['id'], $index) .'" type="hidden" value="'. (int) esc_attr( $item['id'] ) .'" class="image-id image-'. $index .'" />';
			$inputs_fields .= '<input name="'. sprintf($inputs_name['url'], $index) .'" type="hidden" value="'. esc_attr( $item['url'] ) .'" class="image-url image-'. $index .'" />';
		}
	}
	else
	{
		// single file
		$is_selected = '' != $item['url'];
		$out .= '<img src="'. ( $is_selected ? $image['url'] : $nab_locale_data['image_placeholder'] ) .'" '. $img_size .' />';
		$inputs_fields .= '<input name="'. $inputs_name['id'] .'" type="hidden" value="'. (int) esc_attr( $image['id'] ) .'" class="image-id" />';
		$inputs_fields .= '<input name="'. $inputs_name['url'] .'" type="hidden" value="'. esc_attr( $image['url'] ) .'" class="image-url" />';
	}
	$out .= '</span>';

	// library and remove buttons
	$out .= '&nbsp;&nbsp;&nbsp;<input type="button" class="ml-image button'. ( $is_multiple ? ' multiple' : '' ) .'" value="'. apply_filters('nab_uploader_button_label', __('Media Library')) .'" />';
	$out .= '&nbsp;&nbsp;&nbsp;<input type="button" class="ml-image-remove button" value="';
	$out .= apply_filters('nab_remove_button_label', $is_multiple ? __('Remove All') : __('Remove'));
	$out .= '"'. ( $is_selected ? '' : ' style="display: none;"') .' />';

	// remove confirm
	$out .= '<span class="remove-confirm nab-remove-confirm">';
	$out .= apply_filters('nab_remove_confirm_message', __('Are you sure ?'));
	$out .= '&nbsp;&nbsp;&nbsp;<input type="button" class="button confirm-button confirm-yes" value="'. apply_filters('nab_remove_confirm_yes', __('Yes')) .'" />';
	$out .= '&nbsp;&nbsp;&nbsp;<input type="button" class="button confirm-button confirm-no" value="'. apply_filters('nab_remove_confirm_no', __('No')) .'" />';
	$out .= '</span>';

	// inputs output
	$out .= '<span class="inputs nab-inputs">'. $inputs_fields .'</span>';
	$out .= '<script>var nab_inputs_name = '. json_encode($inputs_name) .';</script>';

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

// simply comment the next line to disable TEST section
add_action('admin_init', 'nab_test_admin_init');
/**
 * TEST: WP Admin init 
 */
function nab_test_admin_init()
{
	// Add the section to media settings
 	add_settings_section('nab_muploader_text_section', 'Media Uploader Test Section', '__return_false', 'media');

 	// Add the field with the section
 	add_settings_field('nab_muploader_test', 'Media Uploader Test', 'nab_muploader_test_field', 'media', 'nab_muploader_text_section');
 	
 	// Register our setting
 	register_setting('media','nab_muploader_test');
}

/**
 * TEST: setting field callback
 */
function nab_muploader_test_field()
{
	echo nab_media_uploader_input( (array) get_option('nab_muploader_test'), array( 'input_name' => 'nab_muploader_test', 'multiple' => 'yes' ) );
}
