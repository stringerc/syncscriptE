# 🔗 Adding SyncScript Link to Portfolio Website

## Overview
Add a "SyncScript" navigation link to your portfolio website header that directs visitors to your hosted SyncScript application.

## Step 1: Locate Your Portfolio Header

Your portfolio website likely has a navigation header. Look for files like:
- `index.html`
- `header.html`
- `navigation.html`
- `nav.html`

## Step 2: Add SyncScript Link

### Option A: Simple Text Link
Add this HTML next to your existing "Cheers Social" link:

```html
<a href="https://www.thechristopherstringer.com/syncscript" class="nav-link">SyncScript</a>
```

### Option B: Styled Button Link
Add this HTML with custom styling:

```html
<a href="https://www.thechristopherstringer.com/syncscript" class="syncscript-nav-link">
  <span class="syncscript-icon">⚡</span>
  SyncScript
</a>
```

## Step 3: Add CSS Styling

Add this CSS to your stylesheet to make the link look professional:

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
}

.syncscript-nav-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  color: white;
  text-decoration: none;
}

.syncscript-icon {
  margin-right: 6px;
  font-size: 16px;
}

/* Alternative: Match existing nav styling */
.nav-link.syncscript {
  color: #667eea;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: border-color 0.3s ease;
}

.nav-link.syncscript:hover {
  border-bottom-color: #667eea;
  color: #764ba2;
}
```

## Step 4: Complete Example

Here's how it might look in your navigation:

```html
<nav class="main-nav">
  <a href="#home" class="nav-link">Home</a>
  <a href="#about" class="nav-link">About</a>
  <a href="#projects" class="nav-link">Projects</a>
  <a href="#contact" class="nav-link">Contact</a>
  <a href="https://www.thechristopherstringer.com/syncscript" class="syncscript-nav-link">
    <span class="syncscript-icon">⚡</span>
    SyncScript
  </a>
</nav>
```

## Step 5: Test the Integration

1. **Save your changes**
2. **Upload to Hostinger** (if editing locally)
3. **Visit your portfolio website**
4. **Click the SyncScript link** to ensure it works
5. **Verify it opens SyncScript** at the correct URL

## Step 6: Optional Enhancements

### Add a Tooltip
```html
<a href="https://www.thechristopherstringer.com/syncscript" 
   class="syncscript-nav-link" 
   title="Visit my AI-powered productivity application">
  <span class="syncscript-icon">⚡</span>
  SyncScript
</a>
```

### Add Open in New Tab
```html
<a href="https://www.thechristopherstringer.com/syncscript" 
   class="syncscript-nav-link"
   target="_blank"
   rel="noopener noreferrer">
  <span class="syncscript-icon">⚡</span>
  SyncScript
</a>
```

## Troubleshooting

- **Link not working?** Check the URL is correct
- **Styling issues?** Make sure CSS is properly linked
- **Not appearing?** Check HTML syntax and file upload

---

## Next Steps

1. ✅ Deploy SyncScript to Hostinger
2. ✅ Add SyncScript link to portfolio
3. 🔄 Test both applications
4. 🎉 Share your portfolio with the new SyncScript showcase!
