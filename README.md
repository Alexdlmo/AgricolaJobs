# AgrícolaJobs
**Plataforma web de empleo para el sector agrícola español**
AgrícolaJobs es una aplicación web que digitaliza el mercado laboral agrícola, conectando trabajadores del campo con empresas del sector.
---
## Stack Tecnológico
| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite 8, React Router DOM 7 |
| Backend | FastAPI (Python 3.12), Uvicorn |
| Base de Datos | Supabase (PostgreSQL 15) |
| Autenticación | Supabase Auth (JWT + RLS) |
| Almacenamiento | Supabase Storage (avatares, currículums) |
| Visualización | Recharts, Lucide React |
| Estilos | CSS vanilla con sistema de variables |
---
## Arquitectura
┌─────────────────────────────────────────────────────┐
│                    Cliente Web                       │
│         React 19 · Vite · React Router               │
│              authService · apiService                │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / JSON
┌──────────────────────▼──────────────────────────────┐
│                Backend API (FastAPI)                  │
│          /api/auth · /api/offers · /api/stats         │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              Supabase (PostgreSQL 15)                 │
│     RLS · Auth · Storage · Realtime · PL/pgSQL        │
└─────────────────────────────────────────────────────┘
---
## Modelo de Datos
**9 tablas principales:** `users`, `offers`, `applications`, `notifications`, `conversations`, `messages`, `reviews`, `reports`, `password_resets`
- Claves primarias UUID (seguridad frente a enumeración)
- Row Level Security para control de acceso granular por rol
- Restricciones CHECK, UNIQUE y FOREIGN KEY con políticas de borrado en cascada
- Triggers para creación automática de perfiles de usuario
- Funciones PL/pgSQL para operaciones transaccionales
---
## Roles del Sistema
| Rol | Responsabilidad |
|---|---|
| **Visitante** | Exploración de la página principal y registro |
| **Trabajador** | Aplicación a ofertas, gestión de perfil y CV, mensajería, valoraciones |
| **Empresa** | Publicación de ofertas, gestión de candidatos, mensajería, valoraciones |
| **Administrador** | Supervisión global: estadísticas, usuarios, ofertas, reportes |
---
## Funcionalidades
- Registro y autenticación con validación en frontend y backend
- CRUD completo de ofertas de empleo con búsqueda y filtros
- Sistema de solicitudes con flujo pendiente → aceptada/rechazada
- Mensajería en tiempo real entre empresa y trabajador
- Sistema de notificaciones internas
- Valoraciones con puntuación (1-5) y comentarios
- Reportes y denuncias con gestión administrativa
- Panel de administración con análisis de datos y gráficos
- Almacenamiento de avatares y currículums en PDF
- Recuperación de contraseña mediante token seguro
- Diseño responsive adaptado a dispositivos móviles
---
## Instalación y Ejecución
### Requisitos previos
- Node.js ≥ 18
- Python ≥ 3.10
- Cuenta en Supabase (o instancia local)
### Frontend
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # Genera /dist para producción
Backend
cd backend
python -m venv venv
source venv/bin/activate      # Linux/Mac
# venv\Scripts\activate       # Windows
pip install -r app/requirements.txt
uvicorn app.main:app --reload # http://127.0.0.1:8000
Variables de Entorno
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
API REST
Método	Endpoint
GET	/
GET	/health
GET	/api/stats/dashboard
GET	/api/offers/
GET	/api/offers/search
GET	/api/offers/filter
POST	/api/auth/reset-password
Estructura del Proyecto
AgrícolaJobs/
├── src/                    # Frontend (React)
│   ├── components/         # Componentes reutilizables
│   ├── pages/              # Páginas de la aplicación
│   ├── context/            # Contexto de autenticación
│   ├── utils/              # Servicios y utilidades
│   └── styles/             # Sistema de diseño
├── backend/                # Backend (FastAPI)
│   └── app/
│       ├── main.py         # Configuración del servidor
│       └── routes/         # Endpoints de la API
├── supabase-schema.sql     # Esquema de base de datos
└── img/                    # Recursos gráficos
