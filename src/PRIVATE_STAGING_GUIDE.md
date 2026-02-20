# Private Staging Environment Guide

**Purpose**: Deploy SyncScript dashboard builds to a private URL that only you can access, separate from the live syncscript.app site.

---

## Recommended: Vercel Separate Project

You already have an `openclaw-dashboard` Vercel project (team: christopher-stringers-projects). This project has no custom domain attached, making it effectively private.

### How It Works

- The dashboard gets deployed to a URL like `openclaw-dashboard-xxx.vercel.app`
- This URL is auto-generated, not indexed by search engines, and not discoverable
- No connection to syncscript.app or quicksync.app
- The URL changes with each deployment (adds a hash), making it even harder to stumble upon

### Deployment Steps

When Nexus completes the dashboard task:

1. **Push to GitHub:**
   ```bash
   cd user-dashboard-latest  # or wherever Nexus creates the project
   git init
   git add .
   git commit -m "SyncScript AI Dashboard - Nexus build"
   gh repo create openclaw-dashboard --private --push
   ```

2. **Connect to Vercel project:**
   ```bash
   cd user-dashboard-latest
   vercel link --project openclaw-dashboard
   vercel --prod
   ```

3. **Access your private URL:**
   The CLI will output the deployment URL. Bookmark it.

### Additional Security (Optional)

- **Vercel Standard Protection**: Enable in Project Settings > Security. Preview deployments will require Vercel login (your account).
- **Environment Variables**: Set any sensitive keys (API URLs, tokens) in the Vercel dashboard, not in code.

---

## Alternative: EC2 with Basic Auth

If you want truly locked-down access (password required):

```bash
# SSH to EC2
ssh -i ~/Downloads/test.pem ubuntu@3.148.233.23

# Install nginx
sudo apt update && sudo apt install -y nginx apache2-utils

# Create password file
sudo htpasswd -c /etc/nginx/.htpasswd admin
# Enter your password when prompted

# Configure nginx
sudo tee /etc/nginx/sites-available/staging << 'EOF'
server {
    listen 8080;
    server_name _;

    auth_basic "Private Staging";
    auth_basic_user_file /etc/nginx/.htpasswd;

    root /home/ubuntu/staging-dashboard/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/staging /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Then copy the built dashboard:
```bash
# From local machine
scp -r -i ~/Downloads/test.pem user-dashboard-latest/build/ ubuntu@3.148.233.23:~/staging-dashboard/build/
```

Access via `http://3.148.233.23:8080` (password protected).

---

## Quick Reference

| Method | Privacy Level | Cost | Setup Time |
|--------|-------------|------|------------|
| Vercel separate project | Obscure URL (no domain) | Free | 2 minutes |
| Vercel + Standard Protection | Requires Vercel login | Free | 5 minutes |
| EC2 + nginx + basic auth | Password required | Free (existing EC2) | 15 minutes |
