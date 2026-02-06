# 🚀 Guía de Despliegue: Dashboard de Proyectos

Para que tu equipo pueda consultar el Dashboard desde cualquier lugar, necesitas "subirlo" a internet. Aquí tienes la forma más rápida y segura de hacerlo.

## Opción Recomendada: Netlify (Gratis y Rápido)
Es la opción más sencilla porque solo tienes que "arrastrar" tu carpeta.

1.  **Regístrate** en [Netlify.com](https://www.netlify.com/) (es gratis).
2.  Una vez dentro, busca la zona que dice **"Drag and drop your site output folder here"** (o "Add new site" -> "Deploy manually").
3.  Arrastra la carpeta completa `project-dashboard` desde tu ordenador a esa zona del navegador.
4.  ¡Listo! En unos segundos te dará una URL (ejemplo: `https://dashboard-think-123.netlify.app`).

---

## ⚠️ PASO CRÍTICO: Configurar Google Cloud
**IMPORTANTE**: Por seguridad, Google bloqueará tu Dashboard en esa nueva web si no le das permiso explícito.

1.  Ve a [Google Cloud Console: Credenciales](https://console.cloud.google.com/apis/credentials).
2.  Busca tu **"ID de cliente de OAuth 2.0"** (el que creamos para la App) y haz clic en el lápiz par editar.
3.  Baja hasta **"Orígenes de JavaScript autorizados"**.
    *   Haz clic en "ADD URI".
    *   Pega la dirección de tu nueva web (ej: `https://dashboard-think-123.netlify.app`). **¡OJO! Sin la barra `/` al final.**
4.  Baja hasta **"URI de redireccionamiento autorizados"**.
    *   Haz clic en "ADD URI".
    *   Pega la misma dirección exacta.
5.  Haz clic en **GUARDAR**.

> **Nota**: Los cambios de Google pueden tardar desde unos minutos hasta 1h en propagarse, pero suelen ser rápidos.

---

## Opción B: GitHub Pages (Si usas GitHub)
Si ya tienes el código en GitHub:
1.  Ve a la pestaña **Settings** de tu repositorio.
2.  Ve a la sección **Pages** (menú lateral).
3.  En "Source", elige `main` (o tu rama principal) y `/root` (o `/docs` si está ahí).
4.  Guarda. Tu web estará en `https://tu-usuario.github.io/tu-repo/`.
5.  **REPITE EL PASO CRÍTICO DE GOOGLE CLOUD** con esta nueva URL.

---

## Compartir con el Equipo
Una vez completado:
1.  Envía el enlace a tu equipo.
2.  La primera vez que entren, tendrán que pulsar **"CONECTAR GOOGLE SHEETS"** e iniciar sesión con una cuenta que tenga permiso de lectura sobre el Excel.
