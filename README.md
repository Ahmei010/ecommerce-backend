# SHOP.CO backend

## Requirements

- Node.js 20 or newer
- A MongoDB Atlas cluster

## Configure MongoDB Atlas

1. Create a MongoDB Atlas cluster and a database user.
2. In **Network Access**, allow the IP address of the machine running this backend.
3. Copy the Node.js connection string from **Connect → Drivers**.
4. Copy `.env.example` to `.env` inside this `backend` directory.
5. Set `MONGO_URI` to the connection string. Replace its username/password placeholders, URL-encoding special characters in the password. The backend selects the `ecommerce` database.
6. Set `JWT_SECRET` to a long random value, or leave it empty so the backend creates and saves a cryptographically secure secret on first startup.
7. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the one-time administrator seed. The requested initial account is `admin@gmail.com` / `admin123`; change that password after setup.

The `.env` file contains credentials and is excluded by `.gitignore`. Do not commit it.

## Install and run

From PowerShell:

```powershell
Set-Location .\backend
npm install
npm run seed:admin
npm run dev
```

The server listens on `http://localhost:5000`. Check `GET /api/health` to see server and database status.

Run the existing frontend separately:

```powershell
Set-Location .\Frontend
Copy-Item .env.example .env
npm install
npm run dev
```

`Frontend/.env` uses `VITE_API_URL=http://localhost:5000/api`. The API allows the configured `FRONTEND_URL` origin and uses HTTP-only, same-site JWT cookies.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
- `GET /api/auth/profile`, `PUT /api/auth/profile` (authenticated)
- `GET /api/products`, `GET /api/products/:id`, `GET /api/products/categories`
- `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id` (admin only)
- `GET /api/admin/stats`, `GET /api/admin/users` (admin only)

Product images are uploaded to `backend/uploads` (5 MB maximum; JPG, PNG, WEBP, and GIF). Keep that directory on persistent storage when deploying.
