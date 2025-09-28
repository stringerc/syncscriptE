# 🔗 Portfolio Integration Code

## Copy & Paste This Code

### HTML - Add to Your Navigation Header
```html
<a href="https://www.thechristopherstringer.com/syncscript" 
   class="syncscript-nav-link"
   target="_blank"
   rel="noopener noreferrer">
  <span class="syncscript-icon">⚡</span>
  SyncScript
</a>
```

### CSS - Add to Your Stylesheet
```css
/* SyncScript Navigation Link */
.syncscript-nav-link {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  margin-left: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 25px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.syncscript-nav-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  color: white;
  text-decoration: none;
}

.syncscript-nav-link:active {
  transform: translateY(0);
}

.syncscript-icon {
  margin-right: 6px;
  font-size: 16px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .syncscript-nav-link {
    padding: 6px 12px;
    font-size: 12px;
    margin-left: 10px;
  }
  
  .syncscript-icon {
    font-size: 14px;
    margin-right: 4px;
  }
}
```

### Alternative: Simple Text Link (If you prefer minimal styling)
```html
<a href="https://www.thechristopherstringer.com/syncscript" 
   class="nav-link syncscript-simple"
   target="_blank">
  SyncScript
</a>
```

```css
.nav-link.syncscript-simple {
  color: #667eea;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.nav-link.syncscript-simple:hover {
  border-bottom-color: #667eea;
  color: #764ba2;
}
```

## 🎨 Visual Preview

The main button will look like:
```
[⚡ SyncScript]  ← Purple gradient button with lightning icon
```

## 📍 Where to Place It

Add it next to your existing navigation links, typically:
- After "Contact" or "Projects"
- Before any social media links
- In your main navigation menu

## 🔧 Customization Options

### Change Colors
```css
/* Blue theme */
background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);

/* Green theme */
background: linear-gradient(135deg, #10b981 0%, #047857 100%);

/* Orange theme */
background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
```

### Change Icon
```html
<!-- Lightning bolt -->
<span class="syncscript-icon">⚡</span>

<!-- Rocket -->
<span class="syncscript-icon">🚀</span>

<!-- Brain -->
<span class="syncscript-icon">🧠</span>

<!-- Code -->
<span class="syncscript-icon">💻</span>
```

## ✅ Ready to Deploy!

1. **Copy the HTML** and paste it in your navigation
2. **Copy the CSS** and add it to your stylesheet
3. **Upload SyncScript** to Hostinger
4. **Test the link** - it should open SyncScript in a new tab

**Final URL:** `https://www.thechristopherstringer.com/syncscript`
