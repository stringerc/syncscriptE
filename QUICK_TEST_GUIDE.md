# 🧪 QUICK TEST - Script Application

## 🎯 **Test Create Event from Script:**

### **Step 1: Refresh**
```bash
Cmd+Shift+R (hard refresh browser)
```

### **Step 2: Navigate**
1. Go to **Scripts** page (sidebar)
2. Click **"Apply to Event"** on "Wedding Planning"

### **Step 3: Fill Form**
3. Dialog opens
4. Click **"Select"** in the purple "Create New Event" box
5. Enter:
   - Title: "My Wedding"
   - Date: Next month (any date)
6. Click **"Create & Apply"**

### **Step 4: Check Backend Logs**

After clicking, **immediately check your backend terminal** for:

```
applyScript called with: { userId: '...', scriptId: '...', ... }
```

**If userId is there:** Backend will try to create tasks  
**If userId is undefined:** There's an auth issue

### **Step 5: Report Back**

Send me the **backend terminal output** starting from:
```
applyScript called with...
```

Through any errors.

---

## 📋 **WHAT I EXPECT TO SEE:**

**Success:**
```
applyScript called with: { userId: 'cmfzql79u0002krjyxplrmcri', ... }
Creating task - userId: cmfzql79u0002krjyxplrmcri, taskData: {...}
Creating task - userId: cmfzql79u0002krjyxplrmcri, taskData: {...}
[20 more task creations]
```

**Failure (what we're debugging):**
```
applyScript called with: { userId: undefined, ... }
userId is required but was undefined
```

---

## 🚀 **DO THE TEST NOW!**

Backend is running fresh and ready to show detailed logs!

**Copy the backend logs and send them to me!**

