# Control de gastos

Checklist de fijos + carga de gastos de tarjeta (Santander y CDLC) con categorización automática + resumen mes contra mes + evolución histórica.

Datos en `localStorage` del navegador (quedan en tu dispositivo).

## Qué trae

- **Fijos**: checklist mensual, tildás y ajustás el monto si varía (auto, tarjetas).
- **Tarjetas**: cargás cada gasto (elegís Santander o CDLC, descripción, monto), se categoriza solo por palabras clave, y ves el desglose por categoría de cada tarjeta por separado.
- **Resumen**: mes actual vs anterior, fijos + categorías de tarjeta, con flechas de variación.
- **Evolución**: gráfico de línea del total mensual y por categoría de tarjeta.

## Correr en local

```bash
npm install
npm run dev
```

## Subir a GitHub

```bash
git init
git add .
git commit -m "Control de gastos"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/control-de-gastos.git
git push -u origin main
```

## Deployar en Vercel

1. [vercel.com](https://vercel.com) → iniciá sesión con GitHub.
2. "Add New Project" → elegí el repo.
3. Se detecta como proyecto Vite solo. "Deploy".

Cada `git push` a `main` redeploya solo.

## Ojo con esto

- Sin sincronización entre dispositivos (localStorage es por navegador).
- Sin login: cualquiera con la URL puede ver y cargar datos.
- En el celular, agregala a la pantalla de inicio para que se sienta como una app nativa.
