# Muza Mail Relay

Plugin privado de Somos Muza que permite a la plataforma de Railway enviar
correos transaccionales mediante `wp_mail`, el mismo sistema de correo que usa
Contact Form 7.

## Instalación

1. Comprimir la carpeta `muza-mail-relay` como `muza-mail-relay.zip`.
2. En WordPress: Plugins > Añadir plugin > Subir plugin.
3. Activarlo.
4. Ir a Ajustes > Muza Mail Relay.
5. Copiar la URL y la clave secreta a estas variables de Railway:
   - `WORDPRESS_MAIL_RELAY_URL`
   - `WORDPRESS_MAIL_RELAY_SECRET`

La clave nunca debe guardarse en Git ni enviarse por canales públicos.

## Alcance

El relay cubre bienvenida/activación, recuperación de contraseña,
notificaciones y adjuntos como el certificado de Muza Fundadora. Mandrill queda
como respaldo opcional si se configura en el futuro.
