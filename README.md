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
6. Set `JWT_SECRET` to a long, random value. The backend does not generate or save secrets automatically.
7. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the one-time administrator seed. The requested initial account is `admin@gmail.com` / `admin123`; change that password after setup.

The `.env` file contains credentials and is excluded by `.gitignore`. Do not commit it.

## Deploy to Vercel

1. Import the GitHub repository into Vercel and set **Root Directory** to `backend`.
2. Configure `MONGO_URI`, `JWT_SECRET`, and `FRONTEND_URL` in the Vercel project settings for the Production environment. `FRONTEND_URL` must be the exact deployed frontend origin, without a trailing path.
3. Keep the framework preset on **Other** and deploy. `vercel.json` routes requests to the Express serverless function; the function does not call `app.listen()`.
4. Verify `GET /api/health` returns `200` with `data.database` set to `connected`.

Vercel's function filesystem is not persistent. Product image uploads are saved locally only during development; in production, use an image URL for products until persistent object storage is configured.

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
