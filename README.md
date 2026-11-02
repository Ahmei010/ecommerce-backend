# SHOP.CO backend

## Requirements

- Node.js 20 or newer
- A MongoDB Atlas cluster

## Configure MongoDB Atlas

1. Create a MongoDB Atlas cluster and a database user.
2. In **Network Access**, allow your development machine's IP for local use and the backend deployment's configured egress IPs for Vercel.
3. Copy the Node.js connection string from **Connect → Drivers**.
4. Copy `.env.example` to `.env` inside this `backend` directory.
5. Set `MONGO_URI` to the connection string. Replace its username/password placeholders, URL-encoding special characters in the password. The backend selects the `ecommerce` database and rejects localhost MongoDB connections in production.
6. Set `JWT_SECRET` to a long, random value. The backend does not generate or save secrets automatically.
7. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` to the administrator credentials you choose, then run the seed command once.

The `.env` file contains credentials and is excluded by `.gitignore`. Do not commit it or use sample/default credentials in production.

## Deploy to Vercel

1. Import the standalone backend repository into Vercel and leave **Root Directory** at the repository root (`.`). If deploying from the combined workspace instead, use `backend`.
2. Configure `MONGO_URI`, `JWT_SECRET`, and `FRONTEND_URL` in the Vercel project settings for the Production environment. `FRONTEND_URL` must be the exact deployed frontend origin, without a trailing path; production startup rejects localhost or an unset value.
3. Keep the framework preset on **Other** and deploy. `vercel.json` routes requests to the Express serverless function; the function does not call `app.listen()`.
4. Verify `GET /` returns the API status, then verify both `GET /health` and `GET /api/health` return `200` with `data.database` set to `connected`.

Vercel's function filesystem is not persistent. Product image uploads are saved locally only during development; in production, use an image URL for products until persistent object storage is configured.

## Install and run

From PowerShell:

```powershell
Set-Location .\backend
npm install
npm run seed:admin
npm run dev
```

The server listens on `http://localhost:5000`. Check `GET /` for the API status and `GET /health` for server and database status.

Run the existing frontend separately:

```powershell
Set-Location .\Frontend
Copy-Item .env.example .env
npm install
npm run dev
```

For local development, set `FRONTEND_URL=http://localhost:5173` in `backend/.env`; the frontend API default is the live backend, or set `VITE_API_URL=http://localhost:5000/api` in `Frontend/.env` to use the local backend. The API uses credentialed requests and HTTP-only JWT cookies.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
- `GET /api/auth/profile`, `PUT /api/auth/profile` (authenticated)
- `GET /api/products`, `GET /api/products/:id`, `GET /api/products/categories`
- `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id` (admin only)
- `GET /api/admin/stats`, `GET /api/admin/users` (admin only)
- `GET /`, `GET /health`, `GET /api/health`

There are currently no cart, checkout, or order APIs in this backend. The frontend cart is browser-local and cannot place or retrieve orders.

Product image uploads are limited to 5 MB (JPG, PNG, WEBP, and GIF). Vercel's function filesystem is not persistent; use a hosted image URL for production products until persistent object storage is configured.
