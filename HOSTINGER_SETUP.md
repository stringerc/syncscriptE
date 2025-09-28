# 🚀 SyncScript Deployment to Hostinger

## Prerequisites
- Hostinger VPS or Cloud Hosting (Node.js support required)
- Domain: `www.thechristopherstringer.com`

## Step 1: Hostinger Node.js Setup

1. **Log into Hostinger Control Panel**
2. **Go to Advanced → Node.js**
3. **Create New Node.js Installation:**
   - Domain: `www.thechristopherstringer.com`
   - Node.js Version: 18.x or 20.x
   - Entry Point: `server/src/index.js`
   - Application Root: `/public_html/syncscript`

## Step 2: Upload SyncScript Files

1. **Access File Manager or use FTP**
2. **Navigate to:** `/public_html/syncscript/`
3. **Upload all files from:** `/Users/Apple/syncscript/`
   - Exclude: `node_modules`, `.git`, `dist`

## Step 3: Install Dependencies

```bash
cd /public_html/syncscript
npm install --production
```

## Step 4: Environment Variables

Create `.env` file in `/public_html/syncscript/`:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=your_production_database_url
OPENWEATHER_API_KEY=your_api_key
OPENAI_API_KEY=your_api_key
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://www.thechristopherstringer.com/google-calendar
```

## Step 5: Build Frontend

```bash
cd /public_html/syncscript/client
npm install
npm run build
```

## Step 6: Start Application

```bash
cd /public_html/syncscript
pm2 start server/src/index.js --name syncscript
pm2 save
pm2 startup
```

## Step 7: Configure Nginx (if needed)

If using a reverse proxy, configure Nginx to serve:
- Static files from `/public_html/syncscript/client/dist/`
- API requests to `http://localhost:3001`

## Step 8: Test Deployment

Visit: `https://www.thechristopherstringer.com/syncscript`

---

## Portfolio Integration

Add this to your portfolio website header:

```html
<a href="https://www.thechristopherstringer.com/syncscript" class="syncscript-link">
  SyncScript
</a>
```

CSS styling:
```css
.syncscript-link {
  display: inline-block;
  padding: 8px 16px;
  margin-left: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 20px;
  font-weight: 500;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.syncscript-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}
```
