# Libro de gastos v2

Checklist de fijos + registro de gastos variables + resumen mes contra mes + evolución histórica por concepto.

Los datos viven en `localStorage` del navegador (quedan en tu dispositivo, nada se sube a ningún servidor). Si abrís desde otro dispositivo o navegador, arranca vacío ahí.

## Qué trae

- **Este mes**: tildás los fijos (y podés ajustar el monto si varía, como la cuota del auto en UI). Para los variables (nafta, delivery, súper, bares...) vas agregando cada gasto suelto con fecha y nota opcional.
- **Resumen**: compara el mes que estás viendo contra el anterior, por concepto, con flechas de si subió o bajó.
- **Evolución**: gráfico de línea del total mensual y por concepto, una vez que tengas 2+ meses cargados.
- **Editar conceptos**: desde "Este mes" → "Editar conceptos" podés agregar, sacar o cambiar cualquier ítem, fijo o variable.

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
git commit -m "Libro de gastos v2"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/libro-de-gastos-v2.git
git push -u origin main
```

## Deployar en Vercel

1. [vercel.com](https://vercel.com) → iniciá sesión con GitHub.
2. "Add New Project" → elegí el repo.
3. Vercel detecta el proyecto Vite solo (Build: `npm run build`, Output: `dist`).
4. "Deploy".

Cada `git push` a `main` redeploya solo.

## Ojo con esto

- Sin sincronización entre dispositivos (localStorage es por navegador). Si más adelante lo necesitás, el paso natural es sumar Supabase (gratis, se integra fácil con Vercel) y migrar de localStorage a una tabla real.
- Sin login: cualquiera con la URL puede ver y cargar datos.
- En el celular, agregala a la pantalla de inicio desde el navegador para que se sienta como una app nativa.
