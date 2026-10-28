// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://chardevmdp.github.io',
  trailingSlash: 'always',

  // Sin resaltado de código: Shiki usa estilos inline incompatibles con la CSP
  markdown: { syntaxHighlight: false },

  security: {
    // Astro agrega un <meta> CSP por página con los hashes de scripts y estilos que incrusta.
    // GitHub Pages no permite cabeceras propias: frame-ancestors, HSTS, etc. quedan fuera.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
        'upgrade-insecure-requests',
      ],
    },
  },
});
