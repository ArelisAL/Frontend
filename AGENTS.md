# AGENTS.md — Fran-Costuras App

> Archivo de contexto para **todos** los agentes de IA que trabajan en este repositorio.
> Léelo completo antes de cualquier tarea. La especificación funcional completa está en [`DERCAS_Fran-Costuras.pdf`](./DERCAS_Fran-Costuras.pdf); la arquitectura en `arquitectura.png`; la guía de medidas en [`MEDIDAS.md`](./MEDIDAS.md); el logo oficial en [`Logo de Costura Fran-Costuras.png`](./Logo%20de%20Costura%20Fran-Costuras.png).
> **Prioridad ante conflictos:** instrucción del humano > DERCAS (PDF) > `AGENTS.md` > tu criterio.

---

## 1. Contexto del proyecto
Sistema para el taller de costura "Fran-Costuras" (una API, dos aplicaciones web y una app móvil Android publicada en Google Play Store): clientes y medidas, pedidos con ciclo de estados, asignación a costureras, inventario de telas con descuento automático, pagos parciales y reportes PDF.

- **Arquitectura:** cliente-servidor en capas, en **cuatro repositorios** (ver diagrama `arquitectura.png`):
  - `Backend`: una sola **API REST** (Django + Django REST Framework), monolito modular con toda la lógica de negocio y la base de datos.
  - `Frontend`: cliente web (React) de la **recepcionista** y la **costurera**.
  - `AdminWeb`: cliente web (React) de la **administradora**.
  - `AppMovil`: app móvil nativa Android (React Native + Expo) de la **costurera**, distribuida por **Google Play Store**.
- **Regla principal:** los clientes (`Frontend`, `AdminWeb`, `AppMovil`) **no tienen reglas de negocio ni base de datos**; todo lo leen y guardan a través de la API.
- **Roles:** `administradora`, `recepcionista`, `costurera`.
- **Idioma:** interfaz y mensajes en español; código (variables, modelos) en español usando el glosario del DERCAS §1.5.

### 1.1 Documento base: [`DERCAS_Fran-Costuras.pdf`](./DERCAS_Fran-Costuras.pdf)
El contexto completo del proyecto está en el **DERCAS** (Documento de Especificaciones, Requerimientos y Criterios de Aceptación de Software), en **[`DERCAS_Fran-Costuras.pdf`](./DERCAS_Fran-Costuras.pdf)**. Es la **fuente de verdad del *qué* construir**; este `AGENTS.md` solo define *cómo* trabajan los agentes.

- Los agentes **no modifican** el PDF del DERCAS. Cualquier cambio lo hace el equipo humano y lo registra en el DERCAS §12 *Control de cambios*.

**Todo agente debe leer el DERCAS antes de empezar una historia** y consultar la sección que corresponda:

| Necesito saber… | Ver en el DERCAS (PDF) |
|---|---|
| Problema, objetivos y glosario (nombres a usar en código) | §1 Introducción · §1.5 Glosario |
| Qué medidas se toman por categoría y prenda | Anexo A · archivo completo [`MEDIDAS.md`](./MEDIDAS.md) |
| Qué puede y qué no puede hacer cada rol | §2 Usuarios y roles |
| Módulos, historias asignadas y orden de construcción | §3 Módulos del sistema |
| Requisitos funcionales y criterios **Dado / Cuando / Entonces** | §4 Requerimientos funcionales |
| Rendimiento, seguridad, usabilidad | §5 Requerimientos no funcionales |
| Tecnologías permitidas y prohibidas | §6 Tecnologías |
| Capas, modelo de datos y carpetas | §7 Arquitectura · [`arquitectura.png`](./arquitectura.png) |
| Lo que la app **NO** debe hacer | §8 Fuera de alcance |
| Qué historias van en cada sprint | §9 Plan de implementación |
| Roles de agentes y flujo | §10 Orquestación de agentes |
| Dudas abiertas y supuestos | §11 Supuestos, riesgos y decisiones pendientes |

Reglas:
- Si algo **no está en el DERCAS**, no se implementa: se pregunta al humano (ver §11 de este archivo).
- Si el DERCAS y `AGENTS.md` se contradicen, **manda el DERCAS**.
- En cada plan (`docs/plan/HU-XX.md`) y en cada PR, cita los requisitos que cubres (ej. `DERCAS §4 RF-04`).

## 2. Stack por repositorio (no cambiar sin aprobación humana)

| | `Backend` | `Frontend` y `AdminWeb` | `AppMovil` |
|---|---|---|---|
| Lenguaje | Python 3.12 | TypeScript | TypeScript |
| Framework | Django 5.x + Django REST Framework | React 18 + Vite | React Native + Expo (Expo Router) |
| Autenticación | djangorestframework-simplejwt (JWT) | Token JWT enviado por Axios | Token JWT en expo-secure-store, enviado por Axios |
| Otras librerías | django-cors-headers, drf-spectacular (OpenAPI), WeasyPrint (PDF) | React Router, Axios, Bootstrap 5 + `marca.css` | Axios, `StyleSheet` + `src/theme/marca.ts` |
| Base de datos | PostgreSQL (prod) / SQLite (dev) | — (ninguna) | — (ninguna) |
| Pruebas | pytest + pytest-django + pytest-cov | Vitest + React Testing Library | Jest (jest-expo) + React Native Testing Library |
| Lint / formato | ruff | ESLint + Prettier | ESLint + Prettier |
| Despliegue | Railway | Vercel | EAS Build (AAB) + EAS Submit → **Google Play Store** |

**Prohibido añadir:** Angular o Vue, Flutter, Ionic o Kotlin/Java nativo, GraphQL, MongoDB, Celery o colas, microservicios, librerías de componentes que reemplacen la paleta (§12), y cualquier dependencia nueva en `requirements.txt` o `package.json` sin aprobación humana. Tampoco se crean flujos de integración continua (`.github/workflows/`) sin que el humano lo pida.

## 3. Comandos

### `Backend`
```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver                          # API en http://localhost:8000/api/v1/
                                                    # Documentación en http://localhost:8000/api/docs/
python manage.py runserver 0.0.0.0:8000             # para probar AppMovil en un celular real
                                                    # (agregar la IP de la PC a DJANGO_ALLOWED_HOSTS)
# calidad (OBLIGATORIO antes de presentar la tarea)
ruff check . --fix && ruff format .
pytest -q
pytest --cov=. --cov-report=term-missing
```

### `Frontend` y `AdminWeb`
```bash
npm install
npm run dev            # http://localhost:5173 (Frontend) · http://localhost:5174 (AdminWeb)
# calidad (OBLIGATORIO antes de presentar la tarea)
npm run lint
npm run test
npm run build          # debe compilar sin errores
```
Variable de entorno en ambos frontends: `VITE_API_URL` (en desarrollo `http://localhost:8000/api/v1`). Va en `.env.local`, nunca en el código.

**Desplegar en Vercel (solo cuando el humano lo pida):**
1. El agente **pide al humano que inicie sesión en Vercel** y espera su confirmación:
   ```bash
   npx vercel login        # lo ejecuta y completa el humano (correo o GitHub)
   ```
2. Con la sesión iniciada por el humano, el agente despliega:
   ```bash
   npx vercel              # vista previa
   npx vercel --prod       # producción, solo con aprobación del humano
   ```
3. El agente **nunca** pide, escribe ni guarda contraseñas o tokens de Vercel (ni en archivos ni en variables de entorno del repositorio).

### `AppMovil`
```bash
npm install
npx expo start         # abrir en Expo Go o en un emulador Android
# calidad (OBLIGATORIO antes de presentar la tarea)
npm run lint
npm run test
npx expo-doctor        # revisa la configuración del proyecto
# compilar y publicar en Google Play (solo cuando el humano lo pida)
npx eas login                                     # lo ejecuta el humano con su cuenta de Expo
npx eas build -p android --profile production     # genera el AAB firmado
npx eas submit -p android --profile production    # lo sube a Google Play (pista de prueba cerrada)
```
La publicación sigue las reglas de Google Play para cuentas personales nuevas: **prueba cerrada con al menos 12 testers durante 14 días seguidos** y luego solicitud de acceso a producción. La cuenta de Google Play Console la administra el humano.
Variable de entorno: `EXPO_PUBLIC_API_URL` (en un celular real, la IP de la computadora en la red local, ej. `http://192.168.1.10:8000/api/v1`; nunca `localhost`). Va en `.env.local`, nunca en el código.

## 4. Estructura y reglas de arquitectura

### 4.1 `Backend` (API REST)
```
config/        settings, urls, JWT, CORS
usuarios/  clientes/  pedidos/  flujo/  asignacion/  inventario/  reportes/
  models.py        -> entidades (DERCAS §7.1)
  services.py      -> TODAS las reglas de negocio
  serializers.py   -> forma del JSON y validación de formato (no reglas de negocio)
  views.py         -> solo: token + permisos + llamar servicio + responder JSON
  permissions.py   -> permisos por rol
  urls.py, tests/
catalogo/fixtures/   -> catálogo de medidas cargado desde MEDIDAS.md
templates/reportes/  -> plantillas HTML solo para los PDF
```
1. **Nada de lógica de negocio en `views.py` ni en `serializers.py`.** Va en `services.py`.
2. Un módulo usa a otro **solo** mediante sus servicios (ej. `inventario.services.descontar_tela(...)`).
3. Operaciones de stock y pagos dentro de `transaction.atomic()`.
4. Todo endpoint exige JWT y declara sus permisos por rol; sin token → **401**, sin permiso → **403**.
5. No borrar físicamente pedidos entregados ni `HistorialEstado`.
6. **Contrato de la API** (DERCAS §7.2): rutas bajo `/api/v1/`, JSON, errores con formato `{"error": "codigo", "detalle": "mensaje"}`, listados paginados. Todo endpoint nuevo o modificado debe verse en `/api/docs/`.

### 4.2 `Frontend`, `AdminWeb` y `AppMovil` (clientes)
```
Frontend/ y AdminWeb/                      AppMovil/
src/                                       app/            -> pantallas (Expo Router)
  api/        -> cliente Axios + 1 función   src/
                 por endpoint                  api/          -> igual que en web
  auth/       -> login y guardas por rol       auth/         -> sesión con expo-secure-store
  pages/      -> una carpeta por pantalla      components/
  components/                                  theme/marca.ts
  styles/marca.css                         assets/logo-fran-costuras.png
  assets/logo-fran-costuras.png
```
Estas reglas valen para los tres clientes:

1. Las pantallas **solo** llaman a la API a través de `src/api/`; nunca se escribe `axios` ni `fetch` directo en una pantalla.
2. **Sin reglas de negocio**: los formularios pueden validar campos para ayudar, pero la decisión final es siempre del `Backend`. Se muestran los mensajes de error que devuelve la API.
3. Las rutas se protegen por rol (`AdminWeb` solo para `administradora`; `AppMovil` solo para `costurera`), pero eso es solo comodidad: la seguridad real está en el `Backend`.
4. Si una pantalla necesita un dato o endpoint que no existe, **no se inventa**: se pide primero en el `Backend` (tarea nueva) y se espera a que esté en `/api/docs/`.
5. `Frontend` debe funcionar en celular (ancho 360 px), sobre todo la vista «Mis pedidos» de la costurera.
6. `AppMovil` usa **los mismos endpoints** que `Frontend`; no se crean endpoints solo para la app.
7. `AppMovil` guarda el token **solo** en `expo-secure-store` (nunca en `AsyncStorage`) y muestra un mensaje claro cuando no hay conexión; no guarda datos para trabajar sin conexión.

### 4.3 Qué va en cada repositorio
| Módulo | `Backend` | `Frontend` | `AdminWeb` | `AppMovil` |
|---|---|---|---|---|
| usuarios | Login JWT, roles | Login | Login y gestión de usuarios | Login (costurera) |
| clientes y medidas | API + reglas + catálogo de `MEDIDAS.md` | Registro, búsqueda, medidas | Eliminar cliente, editar catálogo | Registrar y ver medidas |
| pedidos | API + reglas | Registro, búsqueda, tablero, notas | Editar fecha de entrega | Detalle del pedido |
| flujo | API + transiciones + historial | Cambiar estado, ver historial | Ver historial | Cambiar estado, ver historial |
| asignacion | API + reglas | «Mis pedidos» | Asignar costurera | «Mis pedidos» |
| inventario | API + descuento atómico | — | Telas y alerta de stock bajo | — |
| pagos | API + reglas | **Registrar pago y ver saldo** (recepcionista) | Pagos, saldos y anular pagos | — |
| reportes | API + PDF | — | Reportes PDF | — |

### 4.4 Medidas (guía `MEDIDAS.md`)
1. El catálogo de medidas (categorías Mujer, Hombre, Niño/a y Bebé; tipos de medida; prendas y sus medidas) se carga en el `Backend` **desde `MEDIDAS.md`** como *fixture* inicial. Nunca se escriben listas de medidas a mano en el código de los clientes: se piden a la API (`catalogo/...`).
2. Nombres de categoría en código: `MUJER`, `HOMBRE`, `NINO`, `BEBE`. Los códigos de medida y de prenda **ya están definidos en `MEDIDAS.md` (versión 2)**: se usan tal cual, sin inventar otros (ej. `contorno_busto`, `tiro_delantero`, `faldas`).
   - Cada prenda usa solo medidas de la tabla de su categoría. Las marcadas *(opcional)* no son obligatorias.
   - La sección 5 de `MEDIDAS.md` (resumen rápido) es solo referencia: **no** se carga en el catálogo.
3. Unidad única: **centímetros**, con hasta un decimal y siempre mayor que 0.
4. El formulario muestra solo las medidas de la prenda elegida, con el texto «cómo se toma» de la guía. Para Bebé se usa la tabla completa de bebé.
5. Se guardan medidas del **cuerpo**, no de la prenda terminada; cada toma es un registro nuevo (no se sobrescribe).
6. Si falta una medida o una prenda en la guía, **no se inventa**: se pide al humano que actualice `MEDIDAS.md`.

## 5. Reglas de negocio críticas (siempre con prueba)
- Cliente: teléfono y correo únicos → rechazar duplicados.
- Estados: solo `PENDIENTE → EN_PROCESO → TERMINADO → ENTREGADO`. Sin saltos ni retrocesos. Cada cambio crea `HistorialEstado` (anterior, nuevo, fecha_hora, usuario).
- Inventario: al pasar a `EN_PROCESO` se descuentan metros; si no alcanza, se rechaza **todo** el cambio.
- Stock bajo: `metros_disponibles <= stock_minimo` (por defecto 5 m) → alerta en rojo.
- Pagos: los registran la **administradora y la recepcionista**; `saldo = total - sum(pagos)`; nunca negativo; monto > 0. Solo la administradora anula pagos (sin borrarlos).
- Recepcionista: puede ver saldos, pero no reportes de ingresos.
- Medidas: solo del catálogo de su categoría, en centímetros, > 0 (§4.4).
- Costurera: solo ve sus pedidos; pedido ajeno → HTTP 403 desde la API.
- Sin token JWT válido → HTTP 401 en cualquier endpoint.
- Cliente con pedidos activos no se puede eliminar.

## 6. Fuera de alcance — NO implementar
Tienda en línea · patrones de costura · notificaciones WhatsApp/SMS/correo · facturación electrónica / SRI · app para iPhone (iOS) o App Store (solo Google Play) · notificaciones push · modo sin conexión en `AppMovil` · registro público de usuarios · pasarelas de pago · funciones de IA dentro de la app.
Si una tarea parece requerir algo de esta lista: **detente y pregunta al humano.**

## 7. Orquestación de agentes

### 7.1 Roles
| Agente | Responsabilidad | Puede modificar | No debe modificar |
|---|---|---|---|
| **Orquestador** | Lee la historia (HU-XX) y su criterio en DERCAS §4; crea el plan de tareas; asigna; verifica que todo pase antes de abrir PR | `docs/plan/HU-XX.md` | Código de producción |
| **Modelos** | Modelos, migraciones, admin (repo `Backend`) | `*/models.py`, `*/migrations/`, `*/admin.py` | Vistas, serializers, frontends |
| **Backend** | Servicios, serializers, endpoints y permisos (repo `Backend`) | `services.py`, `serializers.py`, `views.py`, `permissions.py`, `urls.py` | Modelos (pide cambios al agente Modelos), frontends |
| **Frontend** | Pantallas React con la identidad visual §12 (repos `Frontend` y `AdminWeb`) | `src/pages/`, `src/components/`, `src/api/`, `src/auth/`, `src/styles/` | `Backend` (si falta un endpoint, lo pide) |
| **Móvil** | Pantallas React Native con la identidad visual §12 (repo `AppMovil`) | `app/`, `src/`, `assets/` (sin tocar el logo), `app.json` | `Backend` (si falta un endpoint, lo pide), frontends web |
| **QA** | Pruebas a partir de los criterios Dado/Cuando/Entonces, **antes o en paralelo** al código, en el repo que corresponda | `Backend`: `*/tests/` · Web: `src/**/*.test.tsx` · `AppMovil`: `**/*.test.tsx` | Código de producción |
| **Revisor** | Revisa el diff contra DERCAS, §4–§6 de este archivo y la lista de verificación | Comentarios en el PR | Nada (solo aprueba u observa) |

### 7.2 Flujo por historia de usuario
```
1. Humano asigna HU-XX
2. Orquestador -> plan en docs/plan/HU-XX.md (tareas, archivos, criterios)
2b. Orquestador indica qué repositorios toca la historia (Backend / Frontend / AdminWeb / AppMovil)
    y crea la rama feature/HU-XX-... desde develop en cada uno
3. Modelos -> Backend -> (endpoint visible en /api/docs/) -> Frontend / Móvil   (secuencial)
   QA escribe pruebas                   (en paralelo)
   Por cada tarea: terminar -> pruebas en verde -> humano aprueba -> commit + push (§8.3)
4. Revisor -> checklist §9
5. PR a develop en cada repo afectado -> humano aprueba -> merge -> despliegue
```
Orden de historias: respetar dependencias del DERCAS §3 (`usuarios → clientes → pedidos → flujo/asignacion → inventario → reportes → AppMovil`).

### 7.3 Traspaso entre agentes (handoff)
Cada agente termina su parte dejando en `docs/plan/HU-XX.md`:
```
## [Agente] — HU-XX
- Hecho: ...
- Archivos tocados: ...
- Aprobado por: <nombre> · Commits: <repo> <hash corto> <mensaje>, ...
- Pendiente / supuestos: ...
- Siguiente agente: ...
```

## 8. Git y GitHub — commit al finalizar y aprobar cada tarea
**Regla obligatoria:** el agente **solo hace commit cuando la tarea está terminada y un humano la aprobó**. No se hace commit de trabajo a medias ni de tareas sin aprobar. Una tarea aprobada = un commit (por repositorio afectado).

### 8.1 Repositorios
El proyecto se divide en **cuatro repositorios en GitHub**. Cada uno tiene su propia copia de este `AGENTS.md`.

| Repositorio | Enlace | Contenido | Agentes que trabajan ahí |
|---|---|---|---|
| `Backend` | <https://github.com/ArelisAL/Backend.git> | API REST: modelos, migraciones, servicios (reglas de negocio), serializers, endpoints, permisos, PDF, pruebas | Modelos, Backend, QA |
| `Frontend` | <https://github.com/ArelisAL/Frontend.git> | App React de la recepcionista y la costurera (pantallas, componentes, estilos) | Frontend, QA |
| `AdminWeb` | <https://github.com/ArelisAL/AdminWeb.git> | App React de la administradora (asignación, inventario, pagos, reportes, usuarios) | Frontend, QA |
| `AppMovil` | <https://github.com/ArelisAL/AppMovil.git> | App React Native + Expo de la costurera | Móvil, QA |

Clonar los cuatro repositorios (en la misma carpeta de trabajo):
```bash
git clone https://github.com/ArelisAL/Backend.git
git clone https://github.com/ArelisAL/Frontend.git
git clone https://github.com/ArelisAL/AdminWeb.git
git clone https://github.com/ArelisAL/AppMovil.git
```
Antes de hacer `push`, comprobar que el remoto es el correcto con `git remote -v` (debe apuntar a `github.com/ArelisAL/<Repositorio>.git`). Nunca hacer `push` a otro remoto.

- Cada cambio se guarda **en el repositorio donde se hizo**. Nunca se copian archivos de un repo a otro.
- Si una tarea toca dos o más repositorios, se hace **un commit en cada uno**, con el mismo mensaje y la misma clave `HU-XX`.
- Los cuatro repositorios usan las mismas ramas, el mismo formato de commits y el mismo flujo de aprobación.

### 8.2 Ramas (iguales en los cuatro repositorios)
| Rama | Uso | Quién escribe |
|---|---|---|
| `main` | Código estable y desplegado | Solo merge de PR aprobado por un humano |
| `develop` | Integración de historias terminadas | Merge de PR aprobado |
| `feature/HU-XX-descripcion-corta` | Una rama por historia de usuario | Agentes |
| `fix/descripcion-corta` | Corrección de errores | Agentes |
| `docs/descripcion-corta` | Solo documentación | Agentes / humanos |

### 8.3 Ciclo de una tarea: terminar → aprobar → commit
```
1. Preparar la rama en el repositorio correspondiente (Backend / Frontend / AdminWeb / AppMovil)
2. Hacer la tarea completa (una tarea del plan docs/plan/HU-XX.md)
3. Verificar: lint + pruebas en verde
4. Presentar al humano: resumen + git diff + resultado de pruebas
5. ESPERAR APROBACIÓN
   ├─ Aprobada  -> commit + push
   └─ Rechazada -> corregir y volver al paso 3 (sin commit)
6. Registrar el commit en el handoff (§7.3)
```

Comandos (ejemplo en `Backend`):
```bash
# 1. Preparar la rama
cd Backend
git checkout develop
git pull origin develop
git checkout -b feature/HU-01-registrar-pedido   # o: git checkout feature/HU-01-registrar-pedido

# 2. Hacer la tarea completa (sin commits intermedios)

# 3. Verificar
ruff check . --fix && ruff format .
pytest -q

# 4. Preparar lo que se mostrará al humano
git status
git diff

# 5. SOLO DESPUÉS DE LA APROBACIÓN DEL HUMANO:
git add pedidos/models.py pedidos/services.py pedidos/tests/test_registro.py
git commit -m "feat(pedidos): registrar pedido con código único (HU-01)"
git push -u origin feature/HU-01-registrar-pedido
```
En `Frontend` y `AdminWeb` se usa el mismo ciclo, cambiando el paso 3 por:
```bash
npm run lint && npm run test && npm run build
```
En `AppMovil`, el paso 3 es:
```bash
npm run lint && npm run test && npx expo-doctor
```
La verificación la ejecuta el agente en su entorno antes de presentar la tarea; no se configuran flujos de GitHub Actions salvo que el humano lo pida.

**Qué cuenta como aprobación:** un humano del equipo escribe explícitamente "aprobado" (o equivalente) en la conversación, en el PR o en la tarjeta de Jira. El silencio o la falta de respuesta **no** es aprobación: el agente espera.

### 8.4 Formato de commits (Conventional Commits)
```
<tipo>(<módulo>): <qué se hizo en presente, en español> (HU-XX)
```
| Tipo | Cuándo |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de un error |
| `test` | Agregar o corregir pruebas |
| `refactor` | Mejorar código sin cambiar comportamiento |
| `style` | Formato, sin cambio de lógica |
| `docs` | Documentación, planes y handoffs |
| `chore` | Configuración, dependencias aprobadas, despliegue |

Ejemplos:
- `Backend` → `feat(clientes): validar teléfono y correo duplicados (HU-04)`
- `Frontend` → `feat(pedidos): pantalla de registro de pedido (HU-01)`
- `AdminWeb` → `feat(inventario): vista de telas con alerta de stock bajo (HU-12)`
- `AppMovil` → `feat(asignacion): pantalla Mis pedidos de la costurera (HU-21)`
- `fix(inventario): rechazar descuento cuando el stock es insuficiente (HU-11)`

Reglas del commit:
- **Un commit por tarea aprobada**, con todo lo de esa tarea. Nada de commits de "avance" ni "pruebas".
- Nunca hacer commit sin aprobación, ni con pruebas fallando.
- Nunca incluir `.env`, secretos, `db.sqlite3`, `__pycache__/`, `.venv/`, `node_modules/`, `.expo/`, archivos `.apk`/`.aab` ni datos reales de clientes (deben estar en `.gitignore`).
- Prohibido: `git push --force` a `main` o `develop`, `git reset --hard` sobre trabajo ajeno, reescribir historial ya subido.

### 8.5 Pull Request y merge
1. Cuando todas las tareas de la historia están aprobadas y con su commit, el Orquestador abre un PR de `feature/HU-XX-...` → `develop` **en cada repositorio afectado**.
2. Título: `[HU-XX] descripción`. Cuerpo: enlace a Jira, criterios del DERCAS cubiertos (ej. `DERCAS §4 RF-04`), commits incluidos, resultado de pruebas y enlaces a los PR de los otros repos de la misma historia.
3. El agente Revisor comenta; cada corrección es una nueva tarea que también se aprueba antes de su commit.
4. **Solo un humano aprueba y hace merge.** Al cerrar el sprint, `develop` → `main` mediante PR en los repositorios afectados y se despliega (en `AppMovil`, se compila un AAB nuevo y el humano lo publica en Google Play).
5. Tras el merge, se borra la rama `feature/`.

### 8.6 Jira
- La clave `HU-XX` va en el nombre de la rama, en cada commit y en el título del PR de los cuatro repositorios, para que Jira enlace todo el trabajo de la historia.
- Tarea terminada esperando aprobación → *En revisión*; aprobada y con commit → *Hecho*.

## 9. Lista de verificación antes de entregar (Definition of Done)
- [ ] Todos los criterios de aceptación de la HU tienen prueba y pasan.
- [ ] `Backend`: `ruff check` y `pytest` en verde; cobertura de `services.py` ≥ 80 %.
- [ ] `Frontend` / `AdminWeb`: `npm run lint`, `npm run test` y `npm run build` sin errores.
- [ ] `AppMovil`: `npm run lint`, `npm run test` y `npx expo-doctor` sin errores; probada en un celular Android real o emulador.
- [ ] Endpoints nuevos o modificados visibles en `/api/docs/` y con formato de error uniforme.
- [ ] Ninguna regla de negocio en los clientes; las pantallas usan solo `src/api/`.
- [ ] Medidas según §4.4: solo del catálogo, en centímetros, sin listas escritas a mano en los clientes.
- [ ] Permisos por rol **y por dueño del dato** probados en la API (casos 401, 403 y 429 del login).
- [ ] Requisitos de seguridad de §10 que aplican a la tarea cumplidos (DERCAS §5.1); `pip-audit` / `npm audit` sin vulnerabilidades altas ni críticas.
- [ ] Nada fuera de alcance (§6). Sin dependencias nuevas no aprobadas.
- [ ] Vista probada en ancho móvil (360 px) si es pantalla de costurera.
- [ ] Pantallas con la paleta institucional (§12): solo variables `--fc-*` y contraste correcto.
- [ ] Logo usado según §12.5 (archivo oficial vigente, ≥ 120 px, solo sobre blanco o blanco lavanda, sin deformar, con `alt`).
- [ ] `Backend`: migraciones incluidas y aplicables desde cero.
- [ ] Handoff escrito en `docs/plan/HU-XX.md`.
- [ ] Cada tarea fue aprobada por un humano antes de su commit (§8.3).
- [ ] Commits con formato §8.4 en el repositorio correcto (`Backend`, `Frontend`, `AdminWeb` o `AppMovil`), todo subido a GitHub (`git status` limpio).
- [ ] PR abierto a `develop` en cada repositorio afectado, con enlace a Jira.

## 10. Seguridad (API, web y app móvil)
Detalle y forma de verificación en el DERCAS §5.1 (SEG-01 a SEG-14). Ninguna tarea se presenta si rompe una de estas reglas.

### 10.1 Reglas comunes
- Secretos (`SECRET_KEY`, `DATABASE_URL`, claves JWT) solo por variables de entorno; nunca en el código, en commits ni en variables `VITE_*` o `EXPO_PUBLIC_*` (esas quedan visibles para cualquiera).
- No leer ni modificar `.env`. En desarrollo y pruebas se usan **datos ficticios**; nunca datos reales de clientes.
- Solo se piden los datos personales necesarios (nombre, teléfono, correo, medidas) y cada rol ve solo lo suyo.
- Antes de presentar una tarea: `pip-audit` (Backend) o `npm audit` (clientes) sin vulnerabilidades altas ni críticas. `pip-audit` es una herramienta de desarrollo aprobada; no va en `requirements.txt` de producción.
- Los registros (logs) nunca guardan contraseñas, tokens ni datos personales completos.

### 10.2 `Backend`
- **JWT:** acceso de 15 minutos y refresco de 1 día, con rotación y lista negra (`rest_framework_simplejwt.token_blacklist`); al cerrar sesión se invalida el refresco.
- **Límite de intentos:** máximo 5 inicios de sesión por minuto por usuario y por IP (throttling de DRF) → **429**.
- **Contraseñas:** mínimo 10 caracteres y validadores de Django. Las cuentas las crea la administradora con contraseña temporal; el usuario **debe cambiarla en su primer ingreso** (la API bloquea el resto de endpoints hasta que lo haga).
- **Autorización por rol y por dueño:** cada endpoint comprueba el rol y que el dato pertenezca al usuario cuando corresponda (sin token → 401, sin permiso → 403).
- **Entradas:** todo pasa por serializers; solo ORM, nunca SQL escrito a mano; listados con máximo 100 resultados por página.
- **Producción:** `DEBUG=False`, HTTPS obligatorio (`SECURE_SSL_REDIRECT`), HSTS, `SECURE_CONTENT_TYPE_NOSNIFF`, `X_FRAME_OPTIONS = "DENY"`, `SECURE_REFERRER_POLICY`; `python manage.py check --deploy` sin advertencias.
- **Errores:** respuestas con el formato `{"error": ..., "detalle": ...}` sin trazas internas; se registran inicios de sesión fallidos, pagos y anulaciones.
- **CORS:** solo los dominios de `Frontend` y `AdminWeb` (en desarrollo, `localhost:5173` y `localhost:5174`). `AppMovil` es una app nativa y no usa CORS: se protege con JWT.
- **`DJANGO_ALLOWED_HOSTS`:** en producción, solo el dominio de la API; en desarrollo se agrega la IP local de la PC solo mientras se prueba `AppMovil` en un celular.

### 10.3 `Frontend` y `AdminWeb`
- El token de acceso se guarda **solo en memoria**; el de refresco en `sessionStorage`. Nunca en `localStorage`, nunca contraseñas ni datos de clientes en el navegador.
- Cierre de sesión automático tras **30 minutos sin uso**; al cerrar sesión se llama a la API para invalidar el refresco y se borra todo.
- Prohibido `dangerouslySetInnerHTML`, `eval` y cargar scripts de terceros sin aprobación.
- `vercel.json` define las cabeceras de seguridad: `Content-Security-Policy` (scripts solo propios; `connect-src` solo la URL de la API), `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (sin cámara, micrófono ni ubicación) y `Strict-Transport-Security`.

### 10.4 `AppMovil`
- El token va **solo** en `expo-secure-store`; nada sensible en `AsyncStorage`.
- Cierre de sesión automático tras **30 minutos sin uso** y cuando vence el refresco.
- La compilación para Google Play usa **solo HTTPS** (sin tráfico sin cifrar), sin menú de desarrollo y sin `console.log` con datos sensibles.
- Permisos de Android mínimos: solo Internet. Cualquier otro permiso necesita aprobación humana.
- Firma con *Play App Signing*; las claves de firma y las cuentas de Expo y Google Play las maneja el humano y nunca se suben al repositorio.

### 10.5 Cuentas y despliegues
- **Vercel:** antes de cualquier despliegue de `Frontend` o `AdminWeb`, el agente **pide al humano que inicie sesión en Vercel** (`npx vercel login`) y espera su confirmación. El agente no crea cuentas ni maneja credenciales.
- **Railway, Expo y Google Play Console:** las cuentas e inicios de sesión los hace el humano; el agente solo ejecuta comandos cuando el humano ya inició sesión y lo pidió.

## 11. Cuándo detenerse y preguntar
- Una tarea está terminada: **detente, presenta el resultado y espera aprobación** antes del commit.
- No está claro a qué repositorio (`Backend`, `Frontend`, `AdminWeb`, `AppMovil`) pertenece un cambio.
- Falta una medida o prenda en `MEDIDAS.md`.
- Hay que desplegar en Vercel: **pedir al humano que inicie sesión en Vercel** y esperar.
- Hay que compilar o publicar la app en Google Play, o crear o usar cuentas (Expo, Google Play Console, Railway).
- Una pantalla necesita un endpoint o un dato que la API todavía no tiene (se pide primero en `Backend`).
- La especificación es ambigua o contradice el código existente.
- La tarea toca algo fuera de alcance.
- Hace falta una dependencia nueva, cambiar un modelo ya migrado en producción o borrar datos.
- Las pruebas fallan por una regla de negocio que parece incorrecta.
**No inventes requisitos.** Documenta la duda en el handoff y espera.

## 12. Identidad visual institucional (obligatoria en `Frontend`, `AdminWeb` y `AppMovil`)
Toda pantalla de `Frontend`, `AdminWeb` y `AppMovil`, cada reporte PDF del `Backend` y todo recurso gráfico usan **solo** esta paleta. No se inventan colores nuevos ni se usan los colores por defecto de Bootstrap u otra librería sin adaptarlos.

### 12.1 Paleta
| Color | Código HEX | Variable CSS | Uso recomendado | Significado |
|---|---|---|---|---|
| Celeste pastel | `#8ED8F8` | `--fc-celeste-pastel` | Fondos y elementos gráficos | Confianza y tranquilidad |
| Azul celeste | `#55BCE8` | `--fc-azul-celeste` | Botones y títulos | Tecnología e innovación |
| Rosa pastel | `#F5A6D0` | `--fc-rosa-pastel` | Detalles y fondos | Creatividad y cercanía |
| Rosa intenso | `#E879B2` | `--fc-rosa-intenso` | Elementos destacados | Energía y dinamismo |
| Lila | `#C5A3F5` | `--fc-lila` | Fondos y secciones | Imaginación y creatividad |
| Morado | `#9670D8` | `--fc-morado` | Identidad y encabezados | Innovación y elegancia |
| Morado oscuro | `#7250B5` | `--fc-morado-oscuro` | Logotipo y títulos principales | Profesionalismo |
| Verde menta | `#B8E5D0` | `--fc-verde-menta` | Detalles secundarios | Equilibrio y frescura |
| Amarillo suave | `#FFF0C9` | `--fc-amarillo-suave` | Acentos y destacados | Optimismo |
| Blanco lavanda | `#F8F7FC` | `--fc-blanco-lavanda` | Fondo general | Limpieza y simplicidad |
| Gris violeta | `#45405A` | `--fc-gris-violeta` | Textos | Claridad y legibilidad |

### 12.2 Variables CSS (mismo archivo en `Frontend` y `AdminWeb`)
```css
/* src/styles/marca.css — se importa una sola vez en src/main.tsx, después de Bootstrap */
:root {
  --fc-celeste-pastel:  #8ED8F8;
  --fc-azul-celeste:    #55BCE8;
  --fc-rosa-pastel:     #F5A6D0;
  --fc-rosa-intenso:    #E879B2;
  --fc-lila:            #C5A3F5;
  --fc-morado:          #9670D8;
  --fc-morado-oscuro:   #7250B5;
  --fc-verde-menta:     #B8E5D0;
  --fc-amarillo-suave:  #FFF0C9;
  --fc-blanco-lavanda:  #F8F7FC;
  --fc-gris-violeta:    #45405A;

  /* Roles semánticos: usar ESTOS en los componentes */
  --fc-fondo:           var(--fc-blanco-lavanda);
  --fc-texto:           var(--fc-gris-violeta);
  --fc-primario:        var(--fc-azul-celeste);
  --fc-titulo:          var(--fc-morado-oscuro);
  --fc-encabezado:      var(--fc-morado);
  --fc-destacado:       var(--fc-rosa-intenso);
  --fc-seccion:         var(--fc-lila);
  --fc-acento:          var(--fc-amarillo-suave);
  --fc-secundario:      var(--fc-verde-menta);
}
body { background: var(--fc-fondo); color: var(--fc-texto); }
```
- En el código se usan **las variables**, nunca el HEX escrito a mano.
- Para Bootstrap, sobrescribir `--bs-primary`, `--bs-body-bg` y `--bs-body-color` con estas variables, en lugar de usar el azul por defecto.
- En `AppMovil` (React Native no usa CSS) los mismos colores y roles están en `src/theme/marca.ts`:
```ts
// src/theme/marca.ts — mismos valores que marca.css
export const marca = {
  celestePastel: "#8ED8F8", azulCeleste: "#55BCE8", rosaPastel: "#F5A6D0",
  rosaIntenso: "#E879B2", lila: "#C5A3F5", morado: "#9670D8",
  moradoOscuro: "#7250B5", verdeMenta: "#B8E5D0", amarilloSuave: "#FFF0C9",
  blancoLavanda: "#F8F7FC", grisVioleta: "#45405A",
} as const;
export const tema = {
  fondo: marca.blancoLavanda, texto: marca.grisVioleta, primario: marca.azulCeleste,
  titulo: marca.moradoOscuro, encabezado: marca.morado, destacado: marca.rosaIntenso,
  seccion: marca.lila, acento: marca.amarilloSuave, secundario: marca.verdeMenta,
} as const;
```
- Las pantallas de `AppMovil` usan `tema.*`, nunca el HEX escrito a mano.

### 12.3 Reglas de contraste (accesibilidad, mínimo 4.5:1 para texto normal)
| Fondo | Texto permitido | Contraste |
|---|---|---|
| Blanco lavanda `#F8F7FC` | Gris violeta `#45405A` | 9.2 : 1 ✔ |
| Celeste pastel `#8ED8F8` | Gris violeta `#45405A` | 6.3 : 1 ✔ |
| Lila `#C5A3F5` | Gris violeta `#45405A` | 4.7 : 1 ✔ |
| Azul celeste `#55BCE8` (botones) | Gris violeta `#45405A` | 4.6 : 1 ✔ |
| Morado oscuro `#7250B5` | Blanco `#FFFFFF` | 6.0 : 1 ✔ |

- **No** poner texto blanco sobre azul celeste, rosa intenso, lila o celeste pastel: el contraste es insuficiente (entre 1.6 y 2.7 : 1).
- Rosa intenso `#E879B2` y morado `#9670D8` se usan para bordes, íconos, insignias y fondos de elementos grandes, no como fondo de texto pequeño.
- Si un botón necesita texto blanco, su fondo es **morado oscuro** `#7250B5`.

### 12.4 Colores de estado
Los estados del sistema mantienen un significado universal y **no** se reemplazan por colores de marca:
- Error, stock bajo y acciones destructivas: rojo (`#C62828`).
- Éxito: verde (`#2E7D32`).

Los estados de pedido sí usan la marca: Pendiente → amarillo suave, En Proceso → celeste pastel, Terminado → verde menta, Entregado → lila (siempre con texto gris violeta).

### 12.5 Logo oficial
Archivo: [`Logo de Costura Fran-Costuras.png`](./Logo%20de%20Costura%20Fran-Costuras.png) (PNG, 1536 × 1024 px, **fondo blanco, sin transparencia**).

Contenido del logo: emblema circular con borde de costura punteada lila, máquina de coser morada, carretes, tijeras, maniquí con cinta métrica rosa, el nombre **"Fran-Costuras"** en letra manuscrita morado oscuro y el lema **"Diseña · Cose · Crea"**. Sus colores coinciden con la paleta §12.1 (morado, lila, rosa pastel, rosa intenso y azul celeste), por eso **el logo es la referencia visual de toda la interfaz**.

**Ubicación en los repositorios:**
```
Frontend/src/assets/logo-fran-costuras.png
AdminWeb/src/assets/logo-fran-costuras.png
AppMovil/assets/logo-fran-costuras.png
Backend/templates/reportes/logo-fran-costuras.png   # para el encabezado de los PDF
```
(copias del archivo oficial, renombradas sin espacios)
- Se copia el archivo tal cual; los agentes **no** lo redibujan, recolorean ni generan versiones nuevas con IA.
- Si hace falta otra versión (fondo transparente, ícono pequeño o favicon), **se pide al humano**.
- Si el archivo oficial cambia, se reemplazan las cuatro copias con un commit `chore(marca): actualizar logo oficial` en cada repositorio.

**Dónde se usa:**
| Lugar | Tamaño recomendado | Nota |
|---|---|---|
| Pantalla de inicio de sesión | 240–320 px de ancho, centrado | Dentro de una tarjeta blanca; el resto de la pantalla puede usar lila o rosa pastel |
| Barra superior (navbar) | 120–160 px de ancho | Enlace al tablero de inicio |
| Encabezado de reportes PDF (HU-14, HU-19) | 3–4 cm de ancho, esquina superior izquierda | Junto al título del reporte |
| Página de error (403/404) | 160–200 px | Con mensaje amable en gris violeta |

**Reglas de uso:**
- Ancho mínimo **120 px**: con menos, el lema deja de leerse.
- Fondos **permitidos**: solo blanco `#FFFFFF` o blanco lavanda `#F8F7FC`. Como el PNG tiene fondo blanco, sobre cualquier otro color se vería un recuadro blanco alrededor.
- Si la sección tiene fondo de color (lila, rosa pastel, celeste, etc.), el logo va **dentro de una tarjeta blanca** con bordes redondeados.
- Fondos **prohibidos**: cualquier color de la paleta distinto de blanco o blanco lavanda, fondos oscuros y fotografías.
- **No** usar `mix-blend-mode`, filtros ni recortes para "quitar" el fondo blanco: si se necesita una versión transparente, se pide al humano.
- Mantener proporciones: usar `height: auto` (o `width: auto`); nunca estirar ni aplastar.
- No recortar, rotar, cambiar colores, agregar sombras, bordes ni filtros.
- Dejar espacio libre alrededor de al menos el 10 % del ancho del logo.
- Texto alternativo obligatorio: `alt="Fran-Costuras — Diseña, Cose, Crea"`.

Ejemplo:
```tsx
import logo from "../assets/logo-fran-costuras.png";

<Link to="/" className="navbar-brand">
  <img src={logo} alt="Fran-Costuras — Diseña, Cose, Crea"
       style={{ width: 140, height: "auto" }} />
</Link>
```

**Coherencia con el logo:**
- Títulos principales en **morado oscuro** `#7250B5`, igual que el nombre del logo.
- Bordes decorativos de tarjetas o secciones pueden usar línea **punteada lila** (`border: 2px dashed var(--fc-lila)`), como la costura del emblema; con moderación.
- Para títulos se puede usar una tipografía manuscrita de Google Fonts parecida a la del logo (ej. *Pacifico* o *Dancing Script*), **solo** en títulos grandes; el resto de la interfaz usa una tipografía legible (ej. *Poppins* o *Nunito*).

## 13. Enmienda aprobada — DERCAS v1.5 (24/11/2026)

La cliente aprobó ampliar el alcance. Esta sección y DERCAS_Fran-Costuras_v1.5-ampliacion.docx/.pdf prevalecen sobre listas anteriores de fuera de alcance solo en los puntos que se enumeran aquí. La aprobación de alcance no es aprobación de implementación, dependencias externas, cambios de producción ni despliegue. Las funciones siguen pendientes hasta implementarse, probarse y aprobarse.

### 13.1 Capacidades nuevas por rol

- **Recepcionista (Frontend):** órdenes con detalle de prendas/tela/color/marca, arreglos e indicaciones; medidas del catálogo para confección; evidencia fotográfica inicial; consulta de cotización y registro de pagos/comprobantes; calendario de carga/entrega; cambios autorizados de pedido/fecha; estados permitidos por los criterios nuevos; QR/etiqueta; cierre de pedido condicionado a saldo cero; movimientos de venta de insumos de mostrador. Sin acceso a reportes globales de ingresos, gastos, utilidad neta, caja gerencial ni nómina.
- **Costurera (Frontend y AppMovil):** consulta de pedidos asignados, sus prioridades/fechas, medidas e historial vinculados; etapas internas de producción; notas de entrega. No puede ver pagos, finanzas o pedidos ajenos.
- **Administradora (AdminWeb y permisos aprobados en Frontend):** usuarios/credenciales con recuperación segura, auditoría, catálogo de servicios y tarifas, insumos, proveedores y activos, carga/asignación, modificaciones/cancelaciones autorizadas, reportes financieros, arqueos y compensación del equipo. Backend valida cada permiso.

### 13.2 Requisitos nuevos y arquitectura

DERCAS §14 amplía pedidos con servicios/arreglos, cotización versionada, evidencia privada, QR, etapas internas y nota de entrega; agrega proveedores/activos/insumos, movimientos de mostrador, auditoría, gastos/caja/compensación y mensajería configurable. Backend conserva toda regla, persistencia, autorización, auditoría, archivos y cálculo; los cuatro clientes solo consumen la API común. Cada función debe documentarse en OpenAPI y tener errores JSON del contrato. Mantener paleta, responsividad desde 360 px y controles de privacidad.

### 13.3 Decisiones bloqueantes

No inventar fórmulas ni políticas no aprobadas. Está aprobado el registro de consumos por recepción/administración y la confirmación «En proceso» por administradora/costurera asignada con descuento atómico de inventario. El total cobrable sigue bloqueado hasta definir aceptación, redondeo, descuentos e impuestos; fotos requieren política de retención/consentimiento; mensajería y nómina se posponen. Para caja, reportes de rentabilidad, maquinaria/proveedores y etiquetas resolver decisiones de DERCAS v1.5 §14.6. No almacenar fotos públicamente. Nunca guardar/mostrar contraseñas existentes; restablecimiento debe usar un flujo seguro de un solo uso.

### 13.4 Fases de implementación

Seguir `docs/plan/AMPLIACION-DERCAS-1.5.md`: A1 consumos de pedido implementado en Backend, Frontend, AdminWeb y AppMovil; A2 catálogo/cotización pendiente; B evidencia/QR/comprobantes; C producción/agenda; D inventario extendido; E finanzas/caja; F mensajería (posterior); G compensación del equipo (pospuesta). Dependencias, seguridad, pruebas, migración y repositorios afectados están listados ahí. Las funciones no están terminadas por aparecer en esta enmienda.

### 13.5 Cambios de gobernanza documental

El original DERCAS v1.4 se conserva. La copia v1.5-ampliacion es una propuesta de enmienda elaborada a solicitud explícita de la cliente; queda pendiente la firma formal del apartado de aprobación del DERCAS por el equipo humano. La ampliación no autoriza commits, pushes, merges, publicación en tiendas ni modificaciones de datos reales.
