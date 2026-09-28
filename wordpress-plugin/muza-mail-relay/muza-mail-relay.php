<?php
/**
 * Plugin Name: Muza Mail Relay
 * Description: Envía de forma segura los correos transaccionales de la plataforma Muza usando el correo de WordPress.
 * Version: 1.0.0
 * Author: Muza
 */

if (!defined('ABSPATH')) {
    exit;
}

const MUZA_MAIL_RELAY_OPTION = 'muza_mail_relay_settings';

function muza_mail_relay_activate() {
    $settings = get_option(MUZA_MAIL_RELAY_OPTION, array());
    if (empty($settings['secret'])) {
        $settings['secret'] = wp_generate_password(64, false, false);
    }
    if (empty($settings['from_name'])) {
        $settings['from_name'] = 'Muza';
    }
    if (empty($settings['from_email'])) {
        $host = wp_parse_url(home_url(), PHP_URL_HOST);
        $settings['from_email'] = 'wordpress@' . preg_replace('/^www\./', '', (string) $host);
    }
    update_option(MUZA_MAIL_RELAY_OPTION, $settings, false);
}
register_activation_hook(__FILE__, 'muza_mail_relay_activate');

function muza_mail_relay_register_route() {
    register_rest_route('muza/v1', '/send-email', array(
        'methods' => 'POST',
        'callback' => 'muza_mail_relay_send',
        'permission_callback' => 'muza_mail_relay_authorize',
    ));
}
add_action('rest_api_init', 'muza_mail_relay_register_route');

function muza_mail_relay_authorize(WP_REST_Request $request) {
    $settings = get_option(MUZA_MAIL_RELAY_OPTION, array());
    $expected = isset($settings['secret']) ? (string) $settings['secret'] : '';
    $received = (string) $request->get_header('x-muza-mail-secret');

    if ($expected === '' || $received === '' || !hash_equals($expected, $received)) {
        return new WP_Error('muza_mail_unauthorized', 'No autorizado.', array('status' => 401));
    }

    return true;
}

function muza_mail_relay_send(WP_REST_Request $request) {
    $data = $request->get_json_params();
    $to = isset($data['to']) ? sanitize_email($data['to']) : '';
    $subject = isset($data['subject']) ? sanitize_text_field($data['subject']) : '';
    $html = isset($data['html']) ? wp_kses_post($data['html']) : '';

    if (!$to || !is_email($to) || $subject === '' || $html === '') {
        return new WP_Error('muza_mail_invalid', 'Faltan datos válidos para enviar el correo.', array('status' => 400));
    }

    // Protección adicional ante un error o abuso accidental del secreto.
    $rate_key = 'muza_mail_relay_rate_' . gmdate('YmdHi');
    $sent_this_minute = (int) get_transient($rate_key);
    if ($sent_this_minute >= 60) {
        return new WP_Error('muza_mail_rate_limit', 'Límite temporal de envíos alcanzado.', array('status' => 429));
    }
    set_transient($rate_key, $sent_this_minute + 1, MINUTE_IN_SECONDS * 2);

    $settings = get_option(MUZA_MAIL_RELAY_OPTION, array());
    $from_name = !empty($settings['from_name']) ? sanitize_text_field($settings['from_name']) : 'Muza';
    $from_email = !empty($settings['from_email']) ? sanitize_email($settings['from_email']) : get_option('admin_email');
    $headers = array(
        'Content-Type: text/html; charset=UTF-8',
        sprintf('From: %s <%s>', $from_name, $from_email),
    );

    $attachment_paths = array();
    $attachments = isset($data['attachments']) && is_array($data['attachments']) ? $data['attachments'] : array();
    $total_attachment_bytes = 0;

    if (!empty($attachments) && !function_exists('wp_tempnam')) {
        require_once ABSPATH . 'wp-admin/includes/file.php';
    }

    foreach ($attachments as $attachment) {
        if (empty($attachment['name']) || empty($attachment['content'])) {
            continue;
        }
        $decoded = base64_decode((string) $attachment['content'], true);
        if ($decoded === false) {
            continue;
        }
        $total_attachment_bytes += strlen($decoded);
        if ($total_attachment_bytes > 10 * MB_IN_BYTES) {
            foreach ($attachment_paths as $path) {
                @unlink($path);
            }
            return new WP_Error('muza_mail_attachments_too_large', 'Los adjuntos superan 10 MB.', array('status' => 413));
        }
        $safe_name = sanitize_file_name($attachment['name']);
        $tmp = wp_tempnam($safe_name);
        if ($tmp && file_put_contents($tmp, $decoded) !== false) {
            $renamed = dirname($tmp) . '/' . wp_unique_filename(dirname($tmp), $safe_name);
            if (@rename($tmp, $renamed)) {
                $tmp = $renamed;
            }
            $attachment_paths[] = $tmp;
        }
    }

    try {
        $sent = wp_mail($to, $subject, $html, $headers, $attachment_paths);
    } finally {
        foreach ($attachment_paths as $path) {
            @unlink($path);
        }
    }

    if (!$sent) {
        return new WP_Error('muza_mail_failed', 'WordPress no pudo aceptar el correo para envío.', array('status' => 502));
    }

    return rest_ensure_response(array('ok' => true));
}

function muza_mail_relay_admin_menu() {
    add_options_page(
        'Muza Mail Relay',
        'Muza Mail Relay',
        'manage_options',
        'muza-mail-relay',
        'muza_mail_relay_settings_page'
    );
}
add_action('admin_menu', 'muza_mail_relay_admin_menu');

function muza_mail_relay_register_settings() {
    register_setting('muza_mail_relay', MUZA_MAIL_RELAY_OPTION, array(
        'sanitize_callback' => 'muza_mail_relay_sanitize_settings',
    ));
}
add_action('admin_init', 'muza_mail_relay_register_settings');

function muza_mail_relay_sanitize_settings($input) {
    $current = get_option(MUZA_MAIL_RELAY_OPTION, array());
    return array(
        'secret' => !empty($input['secret']) ? sanitize_text_field($input['secret']) : ($current['secret'] ?? wp_generate_password(64, false, false)),
        'from_name' => !empty($input['from_name']) ? sanitize_text_field($input['from_name']) : 'Muza',
        'from_email' => !empty($input['from_email']) && is_email($input['from_email']) ? sanitize_email($input['from_email']) : get_option('admin_email'),
    );
}

function muza_mail_relay_settings_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    $settings = get_option(MUZA_MAIL_RELAY_OPTION, array());
    ?>
    <div class="wrap">
        <h1>Muza Mail Relay</h1>
        <p>Conecta la plataforma de Railway con el correo de WordPress. No compartas la clave secreta.</p>
        <form method="post" action="options.php">
            <?php settings_fields('muza_mail_relay'); ?>
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row"><label for="muza-relay-url">URL del relay</label></th>
                    <td><input id="muza-relay-url" type="text" class="regular-text code" readonly value="<?php echo esc_attr(rest_url('muza/v1/send-email')); ?>"></td>
                </tr>
                <tr>
                    <th scope="row"><label for="muza-relay-secret">Clave secreta</label></th>
                    <td><input id="muza-relay-secret" name="<?php echo esc_attr(MUZA_MAIL_RELAY_OPTION); ?>[secret]" type="text" class="large-text code" value="<?php echo esc_attr($settings['secret'] ?? ''); ?>" autocomplete="off"></td>
                </tr>
                <tr>
                    <th scope="row"><label for="muza-relay-from-name">Nombre del remitente</label></th>
                    <td><input id="muza-relay-from-name" name="<?php echo esc_attr(MUZA_MAIL_RELAY_OPTION); ?>[from_name]" type="text" class="regular-text" value="<?php echo esc_attr($settings['from_name'] ?? 'Muza'); ?>"></td>
                </tr>
                <tr>
                    <th scope="row"><label for="muza-relay-from-email">Correo del remitente</label></th>
                    <td><input id="muza-relay-from-email" name="<?php echo esc_attr(MUZA_MAIL_RELAY_OPTION); ?>[from_email]" type="email" class="regular-text" value="<?php echo esc_attr($settings['from_email'] ?? get_option('admin_email')); ?>"></td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}
