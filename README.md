# PARAISOS — Agencia de Viajes & Turismo

Landing page de producción para **PARAISOS**, agencia colombiana especializada
en empaquetamiento de servicios turísticos: destinos de playa, planes
carreteables y cruceros por el Caribe, Europa y Asia.

El objetivo principal es **generar leads vía WhatsApp** y posicionar la marca
como una agencia profesional, moderna y confiable.

---

## 🚀 Cómo usar

No requiere build ni instalación. Es HTML5 + CSS3 + JS vanilla con dos
librerías cargadas por CDN (Three.js + GSAP).

```bash
# Opción 1 — abrir directamente
# Doble click en index.html

# Opción 2 — servidor local (recomendado para que carguen las fuentes y
# para evitar restricciones CORS de algunos navegadores)
python -m http.server 8080
# luego abrir http://localhost:8080

# Opción 3 — con Node
npx serve .
```

Abre la página en Chrome, Firefox, Edge o Safari (últimas 2 versiones).

---

## 📁 Estructura

```
paraisos/
├── index.html               · 15 secciones semánticas + SEO + JSON-LD
├── favicon.svg              · logo SVG reutilizable
├── css/
│   ├── styles.css           · variables, base, navbar, hero, layout
│   └── components.css       · mapa 3D, wizard, destinos, cruceros, etc.
├── js/
│   ├── main.js              · loader, navbar, animaciones, avión 3D,
│   │                          galería, testimonios, forms, floating
│   ├── colombia-map-3d.js   · mapa 3D Three.js de Colombia
│   └── wizard.js            · asistente 5 pasos → WhatsApp
├── assets/
│   └── images/destinos/     · vacío — reemplazar imágenes Unsplash por
│                              fotos reales de la agencia
└── README.md
```

---

## 🎨 Identidad visual

Variables CSS en `css/styles.css` (`:root`).

| Token            | Hex      | Uso                                       |
| ---------------- | -------- | ----------------------------------------- |
| `--c-blue`       | #1976D2  | Azul corporativo primario                 |
| `--c-blue-dark`  | #0D47A1  | Énfasis, headings sobre fondo claro       |
| `--c-blue-light` | #42A5F5  | Acentos, links hover                      |
| `--c-orange`     | #F39A1F  | CTA principal, marca cálida               |
| `--c-orange-dark`| #E67E22  | Gradientes y estados hover                |
| `--c-orange-light`| #FFB74D | Highlights y fondos suaves                |
| `--c-green`      | #8BC34A  | Verde acento del logo                     |
| `--c-green-dark` | #689F38  | Verde oscuro del logo                     |
| `--c-text`       | #0F2845  | Texto principal                           |
| `--c-text-soft`  | #5A6B82  | Texto secundario                          |
| `--c-bg`         | #FFFFFF  | Fondo                                     |
| `--c-bg-soft`    | #F8FAFD  | Fondos alternados                         |

**Tipografías** (Google Fonts):
- **Montserrat** 800/900 → headings, marca, contadores
- **Poppins** 400/600 → body
- **Playfair Display** italic 700 → subtítulo decorativo del hero ("a tu medida")

---

## 🏗️ Decisiones de diseño

1. **Logo recreado en SVG inline** (favicon + navbar + footer + loader) en
   lugar de un único archivo, para que sea **reutilizable** sin requests
   adicionales y se beneficie de gradientes contextuales.
2. **CSS sin frameworks**: variables nativas, grid + flex modernos y
   `clamp()` para tipografía fluida.
3. **Three.js r128** desde CDN — versión estable y caché del navegador
   suele tenerla pre-cacheada por su popularidad.
4. **Mapa 3D con outline real de ~70 puntos** (Guajira, Caribe, Pacífico,
   Amazonía) en vez de un cubo o un modelo GLTF pesado, manteniendo
   rendimiento alto y reconocibilidad visual.
5. **San Andrés modelado como isla cilíndrica aparte** (con halo de arena)
   porque su escala real lo haría invisible si se sumara al outline.
6. **Etiquetas como HTML overlay**, no Sprites: mejor accesibilidad,
   nitidez tipográfica y son clickeables.
7. **Wizard persistente en `localStorage`** (`paraisos_wizard_v1`): si el
   usuario recarga, no pierde el progreso.
8. **WhatsApp como CTA principal en TODA la página** con mensajes
   pre-poblados contextualizados (cambian según destino / paso del wizard /
   sección).
9. **Glassmorphism en navbar al hacer scroll** + animación del hamburger en
   móvil.
10. **Tilt 3D real** en cards de destinos calculado con `perspective` +
    `rotateX/Y` siguiendo el mouse.
11. **`prefers-reduced-motion`** desactiva todas las animaciones para
    usuarios con sensibilidad vestibular.

---

## 🖼️ Assets a reemplazar para producción

> Las imágenes actuales son enlaces directos a **Unsplash** (CDN gratis,
> licencia libre). Son **placeholders profesionales**, pero para producción
> conviene reemplazarlas por fotos reales del catálogo.

### Críticas (reemplazar primero)
- **Hero** (`index.html`, sección `.hero__visual`): 2 fotos asimétricas →
  ideal una foto profesional de Cartagena y una de San Andrés.
- **Tarjetas de destinos** (`js/main.js` → `PARAISOS_DATA.destinos[*].img`):
  8 fotos cuadradas/verticales de cada destino.
- **Cruceros** (`index.html`, sección `#cruceros`): 3 fotos horizontales
  (Caribe, Mediterráneo, Asia).
- **Experiencia** (`index.html`, sección `#nosotros`): foto de viajeros
  felices (vertical, aspect ratio 4:5).

### Secundarias
- **Galería** (`js/main.js` → array `fotos` en el módulo `galeria()`):
  20+ imágenes de viajes reales con propiedad `cat` para los filtros.
- **Testimonios** (`js/main.js` → array `items` en `testimonios()`): avatares
  reales (i.pravatar.cc en este momento) y reseñas verificadas.
- **Open Graph cover** (`assets/images/og-cover.jpg`): 1200×630 para redes.

### Formato recomendado
- WebP con fallback JPG (ej. `<picture><source srcset="x.webp"><img src="x.jpg"></picture>`)
- Máximo 200–300 KB cada una
- Lazy loading ya está configurado (`loading="lazy"`)

---

## 📞 WhatsApp y datos del negocio

Todos los enlaces apuntan a:

```
https://wa.me/573157347306?text=<mensaje pre-poblado>
```

Y la información de contacto se carga desde:
- **Schema.org JSON-LD** en `<head>` de `index.html`
- **Variables en `js/main.js`** → `PARAISOS_DATA.whatsapp = '573157347306'`

Para cambiar el número, modifica **ambos lugares**.

---

## ✅ Auditoría Lighthouse esperada

| Categoría       | Objetivo  | Estrategia                                       |
| --------------- | --------- | ------------------------------------------------ |
| Performance     | 90+       | `defer` en scripts, `preconnect`, `loading=lazy`, fuentes con `display=swap` |
| Accesibilidad   | 95+       | `aria-label`, contraste AA, focus visible, navegación por teclado, semántica |
| Mejores prácticas| 95+      | HTTPS por CDN, sin errores en consola, imágenes con `alt` |
| SEO             | 100       | Meta tags completas, sitemap implícito, schema.org Travel Agency + FAQPage |

> Para subir LCP: hostear las imágenes del hero localmente con `fetchpriority="high"`.
> Para bajar CLS: definir `width`/`height` explícitos en cada `<img>` (queda pendiente
> cuando se reemplacen por imágenes locales con dimensiones conocidas).

---

## 🔮 Mejoras futuras

- [ ] **i18n**: estructura preparada (texto en español neutro), agregar EN/PT.
- [ ] **Headless CMS** (Strapi / Sanity) para que el equipo edite destinos y
      precios sin tocar código.
- [ ] **Integración real** del formulario de newsletter con Mailchimp /
      Brevo (hoy es solo confirmación visual).
- [ ] **Reseñas verificadas en vivo** desde Google My Business API.
- [ ] **Backend ligero** para que el wizard guarde leads en una base de datos
      antes de redirigir a WhatsApp (analítica de funnel).
- [ ] **PWA + service worker** para soporte offline parcial.
- [ ] **Pixel de Meta + GA4** con eventos custom (`whatsapp_click`,
      `wizard_complete`, `map_pin_click`).
- [ ] **GLTF model** del avión de papel con texturas reales (hoy es un
      triángulo doblado en BufferGeometry).
- [ ] **Outline geográfico más fino** del mapa (200+ puntos desde Natural Earth)
      cuando se quiera mostrar departamentos.
- [ ] **Catálogo dinámico de cruceros** con calendario de salidas reales.

---

## 🐛 Troubleshooting

- **Fuentes no cargan** → revisa conexión, las cargamos desde Google Fonts.
- **Mapa 3D en blanco** → abre con servidor local (no `file://`), Three.js
  necesita CORS para algunas operaciones.
- **WhatsApp no abre** → verifica que `wa.me/573157347306` esté correcto en
  `js/main.js` y en los `<a href>` de `index.html`.
- **Galería sin filtros** → es lógica de JS, requiere `js/main.js` cargado.

---

## 📄 Licencia

Código entregado a PARAISOS — Agencia de Viajes & Turismo para uso comercial.

— Construido con ❤️ para clientes que sueñan en grande.
