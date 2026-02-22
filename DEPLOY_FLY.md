# Fly.io Deployment

## 1. Set app name
Update `fly.toml`:

- `app = "campusbite"` to your unique Fly app name.

## 2. Create app and volume
Run once:

```bash
fly apps create <your-app-name>
fly volumes create uploads_data --size 1 --region bom
```

The volume is mounted at `/app/backend/public/uploads` (configured in `fly.toml`).

## 3. Set secrets
Set backend runtime secrets:

```bash
fly secrets set \
  JWT_SECRET=... \
  JWT_REFRESH_SECRET=... \
  MONGODB_URI=... \
  SMTP_HOST=... \
  SMTP_PORT=... \
  SMTP_USER=... \
  SMTP_PASS=... \
  FROM_EMAIL=... \
  CHECKOUT_TOKEN_SECRET=... \
  FRONTEND_URL=https://<your-app-name>.fly.dev \
  APP_URL=https://<your-app-name>.fly.dev
```

## 4. Deploy
```bash
fly deploy
```

## 5. Health check
```bash
fly status
fly logs
```

App health endpoint:

- `GET /api/health`
