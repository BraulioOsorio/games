# 🎮 Juegos Aleatorios con PostgreSQL en Render.com

Una aplicación web para generar juegos aleatorios con persistencia en PostgreSQL desplegada en Render.com.

## 📋 Características

- 🎯 Generador de juegos aleatorios desde PostgreSQL
- 💾 Persistencia completa en base de datos
- 📱 Interfaz responsive con tema gaming
- 🔄 Sistema de descargas y restauración
- 🎨 Integración con RAWG API para imágenes
- 🌐 Listo para desplegar en Render.com

## 🚀 Configuración en Render.com

### 1. Crear Base de Datos PostgreSQL

1. **Ir a Render.com Dashboard**
   - Accede a tu dashboard de Render.com
   - Haz clic en "New" → "PostgreSQL"

2. **Configurar la base de datos**:
   - **Name**: `games-database` (o el nombre que prefieras)
   - **Database**: `games_db`
   - **User**: `games_user`
   - **Plan**: Free (para empezar)
   - **Region**: Selecciona la más cercana a tus usuarios

3. **Obtener credenciales**:
   - Una vez creada, ve a la pestaña "Info"
   - Copia la **Database URL** (External)
   - Formato: `postgresql://username:password@hostname:port/database`

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# URL de conexión a PostgreSQL (copia la de Render.com)
DATABASE_URL=postgresql://games_user:tu_password@dpg-xxxxx-a.oregon-postgres.render.com/games_db

# Configuración del servidor
NODE_ENV=production
PORT=3000
```

### 3. Desplegar la Aplicación

1. **Crear Web Service en Render**:
   - Ve a tu dashboard de Render.com
   - Haz clic en "New" → "Web Service"
   - Conecta tu repositorio de GitHub

2. **Configurar el servicio**:
   - **Name**: `games-app`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

3. **Agregar variables de entorno**:
   - En la configuración del servicio, ve a "Environment"
   - Agrega las variables:
     ```
     DATABASE_URL=postgresql://tu_url_completa_aqui
     NODE_ENV=production
     ```

4. **Conectar base de datos**:
   - En "Environment", también puedes agregar:
     ```
     DB_HOST=tu_host
     DB_PORT=5432
     DB_NAME=games_db
     DB_USER=games_user
     DB_PASSWORD=tu_password
     ```

## 🛠️ Instalación Local

### Prerrequisitos

- Node.js 18+ 
- PostgreSQL (local o remoto)
- npm o yarn

### Pasos

1. **Clonar el repositorio**:
   ```bash
   git clone tu-repo-url
   cd games
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales
   ```

4. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```

5. **Ejecutar en producción**:
   ```bash
   npm start
   ```

## 📊 Estructura de Base de Datos

### Tabla `games`
```sql
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'available',
    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla `downloads`
```sql
CREATE TABLE downloads (
    id SERIAL PRIMARY KEY,
    game_name VARCHAR(255) NOT NULL,
    download_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API Endpoints

### Juegos
- `GET /api/games` - Obtener juegos disponibles
- `POST /api/games` - Agregar nuevo juego
- `GET /api/random-game` - Obtener juego aleatorio

### Descargas
- `GET /api/downloads` - Obtener historial de descargas
- `POST /api/downloads` - Marcar juego como descargado
- `DELETE /api/downloads/:gameName` - Restaurar juego

### Utilidades
- `POST /api/populate` - Poblar base de datos con juegos iniciales

## 🎨 Personalización

### Agregar nuevos juegos
1. Usar la interfaz web (botón "Agregar Palabra")
2. Usar la API: `POST /api/games`
3. Directamente en PostgreSQL

### Modificar estilos
- Editar `public/styles.css`
- Cambiar colores en las variables CSS
- Personalizar tema gaming

## 🔧 Troubleshooting

### Problemas comunes

1. **Error de conexión a PostgreSQL**:
   - Verifica que la DATABASE_URL sea correcta
   - Confirma que la base de datos esté activa en Render
   - Revisa que el SSL esté configurado correctamente

2. **Error 404 en producción**:
   - Verifica que los archivos estén en `/public`
   - Confirma que el servidor esté sirviendo archivos estáticos

3. **Problemas de CORS**:
   - Ya configurado en el servidor
   - Verifica que las URLs coincidan

### Logs de depuración

```bash
# En Render.com, ve a "Logs" en tu servicio
# Localmente:
npm run dev
# Los logs aparecerán en la consola
```

## 🌟 Funcionalidades Adicionales

### Integración con RAWG API
- Obtiene automáticamente imágenes de juegos
- API key incluida (puedes cambiarla en `script.js`)
- Timeout configurado para evitar spam

### Sistema de Persistencia
- Todos los datos se guardan en PostgreSQL
- Sin dependencia de localStorage
- Sincronización automática entre sesiones

### Interfaz Responsiva
- Diseño adaptativo para móviles
- Tema gaming oscuro
- Animaciones suaves

## 📈 Escalabilidad

### Para mayor tráfico:
1. Cambiar plan de PostgreSQL en Render
2. Configurar caching con Redis
3. Implementar CDN para imágenes
4. Optimizar queries SQL

### Backup de datos:
```bash
# Desde Render.com dashboard
# PostgreSQL → Backups → Create Manual Backup
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 🎯 Próximas Funcionalidades

- [ ] Sistema de usuarios
- [ ] Categorías de juegos
- [ ] Valoraciones y reseñas
- [ ] API REST completa
- [ ] Modo offline
- [ ] Integración con Steam API

---

**¡Disfruta generando juegos aleatorios con persistencia en PostgreSQL!** 🎮🎲 