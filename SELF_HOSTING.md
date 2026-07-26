# Self-hosting

[Docker](https://www.docker.com/) must be installed.

Pick one setup:

- **Bundled database (Easy)** - Postgres runs in Docker alongside the app
- **External database (Advanced)** - Use your existing Postgres instance

The API runs on port `8080` and the app UI on port `3000`.

## Bundled database

### 1. Create a directory

```bash
mkdir finance-tracker && cd finance-tracker
```

### 2. Create `docker-compose.yml`

```yaml
services:
  db:
    image: ghcr.io/jack-barr3tt/finance-tracker-db:latest
    environment:
      POSTGRES_USER: finance
      POSTGRES_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD is required}
      POSTGRES_DB: finance
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U finance -d finance"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  api:
    image: ghcr.io/jack-barr3tt/finance-tracker-api:latest
    depends_on:
      db:
        condition: service_healthy
    env_file:
      - .env
    volumes:
      - .env:/app/.env:ro
    ports:
      - "8080:8080"
    restart: unless-stopped

  web:
    image: ghcr.io/jack-barr3tt/finance-tracker-frontend:latest
    depends_on:
      - api
    ports:
      - "3000:80"
    restart: unless-stopped

volumes:
  pgdata:
```

### 3. Create `.env`

```env
JWT_SECRET=change-me-to-a-long-random-string
API_LISTEN_ADDR=0.0.0.0:8080
DB_HOST=db
DB_PORT=5432
DB_USER=finance
DB_PASSWORD=change-me
DB_NAME=finance
ENABLE_SIGNUP=true
```

Change `DB_PASSWORD` and `JWT_SECRET` to secure values before continuing. Use the same value for `DB_PASSWORD` here and in the `db` service above.

### 4. Start the stack

```bash
docker compose up -d
```

### 5. Open the app

Go to [http://localhost:3000](http://localhost:3000) and create your account.

Sign-up is enabled by default. After creating your account, set `ENABLE_SIGNUP=false` in `.env` and run `docker compose up -d` again to disable it.

## External database

Use this if Postgres is already running elsewhere - for example on the host machine.

### 1. Create a directory

```bash
mkdir finance-tracker && cd finance-tracker
```

### 2. Prepare the database

Create a database in Postgres, then download and apply the schema and seed data:

```bash
curl -fsSLO https://raw.githubusercontent.com/jack-barr3tt/finance-tracker/main/database/schema.sql
curl -fsSLO https://raw.githubusercontent.com/jack-barr3tt/finance-tracker/main/database/seed.sql

psql -h localhost -U your_user -d your_database -f schema.sql
psql -h localhost -U your_user -d your_database -f seed.sql
```

### 3. Create `docker-compose.yml`

```yaml
services:
  api:
    image: ghcr.io/jack-barr3tt/finance-tracker-api:latest
    network_mode: host
    env_file:
      - .env
    volumes:
      - .env:/app/.env:ro
    restart: unless-stopped

  web:
    image: ghcr.io/jack-barr3tt/finance-tracker-frontend:latest
    ports:
      - "3000:80"
    restart: unless-stopped
```

The API uses host networking so it can reach Postgres on `localhost`.

### 4. Create `.env`

```env
JWT_SECRET=change-me-to-a-long-random-string
API_LISTEN_ADDR=0.0.0.0:8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database
ENABLE_SIGNUP=true
```

Change `JWT_SECRET` and the database settings to match your Postgres instance.

### 5. Start the stack

```bash
docker compose up -d
```

### 6. Open the app

Go to [http://localhost:3000](http://localhost:3000) and create your account.

Sign-up is enabled by default. After creating your account, set `ENABLE_SIGNUP=false` in `.env` and run `docker compose up -d` again to disable it.
