# PARAISOS, agencia de viajes en Mocoa, Putumayo

Sitio estático de PARAISOS - Agencia de Viajes & Turismo (RNT 84258).
En vivo: https://paraisosagencia.vercel.app/

HTML, CSS y JavaScript sin build ni dependencias. Todas las cotizaciones
terminan en WhatsApp (+57 315 734 7306).

## Páginas

- `index.html`: inicio. Hero con video, destinos y cruceros, Putumayo, mapa 3D,
  cotizador de 5 pasos, servicios, quiénes somos, franja de la tienda, galería,
  preguntas frecuentes y contacto.
- `nosotros.html`: quiénes somos, misión, visión 2030, valores, políticas y
  experiencia contractual.
- `la-tienda.html`: productos artesanales y agroindustriales del Putumayo, sin
  precios (se preguntan por WhatsApp).
- `el-piqueteadero.html`: oculto. `vercel.json` lo redirige al inicio.

## Archivos

```
css/fonts.css            fuentes autoalojadas (Montserrat, Poppins, Playfair Display)
css/styles.css           tokens, base, header, cinta, hero, pie
css/components.css       secciones y componentes
js/nav.js                header, menú, cinta, barra fija del celular, anclas (3 páginas)
js/main.js               datos de destinos (PARAISOS_DATA), chips y panel del mapa, galería, formulario, video (inicio)
js/colombia-map-3d.js    mapa 3D (Three.js r128 desde cdnjs con SRI, se carga al acercarse; dibuja solo cuando algo cambia)
js/wizard.js             cotizador de 5 pasos
assets/fonts/            woff2, solo latín
assets/images/           WebP con srcset (galeria/w480|w960|w1400, tienda), logo en 130/260/390 px
assets/videos/           hero-bg-h-1920.mp4 (pantallas grandes o retina), hero-bg-h-1600.mp4 (resto)
                         y hero-bg-v-1080.mp4 (celular vertical, 608x1080). Fuentes y receta:
                         2 tomas de Pixabay (356820 y 356815), x264 CRF 21-22, bucle de 14 s
assets/data/             colombia.geo.json simplificado
```

## Probar en local

Doble clic en `start-server.bat` (abre http://localhost:8080), o
`npx serve .`. El mapa necesita servidor: con `file://` no carga.

## Datos que se repiten

- Tarifas «desde»: tarjetas de `#viajes` en `index.html`, `PARAISOS_DATA` en
  `js/main.js` y la cinta superior de las 3 páginas.
- Preguntas frecuentes: `#faq` y el JSON-LD `FAQPage` del `<head>` de
  `index.html` deben decir lo mismo.
- Dirección, teléfono, correos, horario y RNT: `#contacto`, pie de las 3
  páginas y JSON-LD de las 3 páginas.

Por confirmar con el cliente: el horario (lunes a sábado, 8:00 a. m. a
7:00 p. m.) y el pueblo indígena que falta en la lista de 15.

## Caché y versiones

`vercel.json` guarda `css/`, `js/` y `assets/fonts/` un año (`immutable`) y el
resto de `assets/` siete días. Por eso:

- Cada vez que cambie un CSS o JS, sube el `?v=AAAAMMDD` en los `<link>` y
  `<script>` de las 3 páginas antes de publicar. Si publicas dos veces el mismo
  día, agrega una letra (`20261024b`).
- Si cambia una fuente, una foto o el video, usa un nombre de archivo nuevo.

## Publicación

Vercel publica el contenido del repositorio. `.vercelignore` deja fuera las
herramientas locales (`start-server.*`, `extract-favicon.ps1`, este README).
