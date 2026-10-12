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
  MAILGUN_API_KEY=... \
  MAILGUN_DOMAIN=mx.adarsh.run \
  MAILGUN_BASE_URL=https://api.mailgun.net \
  MAILGUN_SENDER_NAME=CampusBite \
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
