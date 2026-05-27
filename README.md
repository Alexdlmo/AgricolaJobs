# AgriculturalJobs
Plataforma web para la búsqueda y gestión de ofertas de trabajo en el sector agrícola español, con enfoque en el sector olivarero. Conecta trabajadores del campo con empresas agrícolas.
## Tech Stack
- **Frontend**: React 19 + Vite + React Router DOM
- **Backend**: FastAPI (Python) + Uvicorn
- **Base de datos**: Supabase (PostgreSQL 15)
- **Autenticación**: Supabase Auth (JWT)
- **Estilos**: CSS vanilla con variables CSS
- **Gráficos**: Recharts
- **Iconos**: Lucide React
- **Almacenamiento**: Supabase Storage (avatares, CVs)
## Getting Started
```bash
# Clonar el repositorio
git clone <repo-url>
cd AgriculturalJobs
# Instalar dependencias del frontend
npm install
# Iniciar servidor de desarrollo (frontend)
npm run dev
# Build para producción
npm run build
# Preview del build
npm run preview
Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r app/requirements.txt
uvicorn app.main:app --reload
Estructura del Proyecto
AgriculturalJobs/
├── src/                 # Código fuente frontend (React)
│   ├── components/      # Componentes reutilizables (Navbar, Footer, ReportModal)
│   ├── pages/           # Páginas de la aplicación (Home, Login, Dashboard, etc.)
│   ├── context/         # Contextos de React (AuthContext)
│   ├── utils/           # Utilidades (supabaseClient, authService, apiService)
│   ├── styles/          # Variables CSS globales
│   ├── App.jsx          # Componente principal con enrutamiento
│   └── main.jsx         # Punto de entrada
├── backend/             # Código fuente backend (FastAPI)
│   └── app/
│       ├── main.py      # Punto de entrada FastAPI
│       └── routes/      # Endpoints (auth, offers, stats)
├── supabase-schema.sql  # Esquema completo de la base de datos
├── Memoria_Proyecto.tex # Memoria del proyecto (LaTeX)
└── img/                 # Imágenes y diagramas
Características
- Registro y autenticación con roles (trabajador, empresa, admin)
- Publicación y gestión de ofertas de empleo agrícola
- Búsqueda y filtrado de ofertas por ubicación y tipo
- Solicitudes de empleo con estados (pendiente, aceptada, rechazada)
- Sistema de mensajería en tiempo real entre empresa y trabajador
- Notificaciones internas para eventos importantes
- Valoraciones con sistema de estrellas (1-5) y comentarios
- Reportes y denuncias gestionados por el administrador
- Panel de administración con estadísticas y gráficos (Recharts)
- Subida de avatar y currículum (PDF) a Supabase Storage
- Recuperación de contraseña mediante token
- Diseño responsive adaptado a dispositivos móviles
Roles de Usuario
Rol	Funcionalidades principales
Visitante	Navegar ofertas públicas, registrarse
Trabajador	Aplicar a ofertas, gestionar perfil y CV, chatear, valorar
Empresa	Publicar ofertas, gestionar candidatos, chatear, valorar
Admin	Estadísticas globales, gestionar usuarios, ofertas y reportes
API Endpoints (Backend FastAPI)
Método	Ruta
GET	/
GET	/health
GET	/api/stats/dashboard
GET	/api/offers/
GET	/api/offers/search?q=
GET	/api/offers/filter
POST	/api/auth/reset-password
Base de Datos (Supabase/PostgreSQL)
Tablas principales: users, offers, applications, notifications, conversations, messages, reviews, reports, password_resets
- Row Level Security (RLS) para control de acceso por rol
- UUIDs como claves primarias
- Restricciones CHECK, UNIQUE y FOREIGN KEY
- Triggers para creación automática de perfiles
- Funciones PL/pgSQL para operaciones avanzadas
