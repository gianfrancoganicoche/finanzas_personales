# Fijos del mes

Checklist mensual de gastos fijos. Tildás a medida que pagás, la barra de progreso te muestra cuánto falta. Sin análisis, sin categorías, solo la lista.

Los datos viven en `localStorage` del navegador — quedan en tu dispositivo, nada se sube a ningún servidor. Si abrís la app desde otro dispositivo o navegador, arranca vacía ahí (no se sincroniza).

## Correr en local

```bash
npm install
npm run dev
```

Abre en `http://localhost:5173`.

## Subir a GitHub

```bash
git init
git add .
git commit -m "Fijos del mes"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/fijos-del-mes.git
git push -u origin main
```

## Deployar en Vercel

1. Entrá a [vercel.com](https://vercel.com) e iniciá sesión con tu cuenta de GitHub.
2. "Add New Project" → elegí el repo `fijos-del-mes`.
3. Vercel detecta el proyecto Vite solo (Build: `npm run build`, Output: `dist`). No toques nada.
4. "Deploy". Te da una URL pública.

Cada `git push` a `main` redeploya solo.

## Ojo con esto

- `localStorage` no sincroniza entre dispositivos ni navegadores. Para eso necesitarías sumar una base de datos (Supabase es gratis y fácil de conectar con Vercel) — pero para el uso que le querés dar (una checklist personal en tu celular) probablemente no haga falta.
- Sin login: cualquiera con la URL puede ver y tildar cosas. Si te importa, no la compartas.
- Si en el celular la agregás a la pantalla de inicio desde el navegador (Safari: Compartir → Agregar a pantalla de inicio), se abre como una app normal, sin la barra del navegador.
