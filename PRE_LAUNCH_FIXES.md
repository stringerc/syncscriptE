# 🔧 PRE-LAUNCH FIXES - PRIORITIZED

**Total Issues:** 14  
**Time Estimate:** 6-8 hours  
**Strategy:** Fix P0/P1 today, P2 tomorrow, skip P3 for post-launch  

---

## 🔴 **P0 - BLOCKERS (Must Fix Before Launch) - 3 hours**

These affect core functionality and user perception:

### **1. Energy System Broken** ⚡ (1 hour)
**Issue:** Energy doesn't reset daily, points don't convert to energy  
**Impact:** Core feature not working  
**Fix:** 
- Daily energy reset at midnight
- Points → Energy conversion
- Connect to challenges/feedback
**Priority:** CRITICAL - This is a differentiator!

### **2. Sidebar Too Long / Blank Space** 📱 (30 min)
**Issue:** Sidebar extends beyond screen, creates blank space  
**Impact:** Looks terrible, unprofessional  
**Fix:** 
- Make sidebar scrollable
- Fix height to viewport
- Remove blank space
**Priority:** CRITICAL - First impression!

### **3. ShareSync/Projects Tab Empty** 🗂️ (30 min)
**Issue:** Projects tab renamed but shows nothing  
**Impact:** Feature appears broken  
**Fix:**
- Rename "Projects" → "ShareSync" 
- Show empty state with "Create Project" CTA
- Or hide tab if no projects exist
**Priority:** HIGH - Broken feature = bad look

### **4. Friends Tab Empty** 👥 (30 min)
**Issue:** Friends tab shows nothing  
**Impact:** Feature appears broken  
**Fix:**
- Show empty state with "Add Friend" CTA
- Explain feature
**Priority:** HIGH - Broken feature

### **5. Responsive/Mobile Issues** 📱 (30 min)
**Issue:** Not all screens fit nicely on mobile  
**Impact:** 50%+ of users are mobile  
**Fix:**
- Test all pages at 375px width
- Fix overflow/scroll issues
- Ensure touch-friendly buttons
**Priority:** CRITICAL - Half your users!

---

## 🟡 **P1 - HIGH PRIORITY (Should Fix Before Launch) - 2 hours**

These affect UX but don't break functionality:

### **6. Calendar Sync Naming** 📅 (20 min)
**Issue:** "Google Calendar" should be "Calendar Sync", missing Outlook/Apple  
**Impact:** Confusing, feature seems limited  
**Fix:**
- Rename tab to "Calendar Sync"
- Show all 3 providers (Google/Outlook/Apple)
- Grey out unconnected ones
**Priority:** MEDIUM-HIGH - Clarity

### **7. "Add to Google" → "Add to Calendar"** (30 min)
**Issue:** Events show "Add to Google" but should show all calendars  
**Impact:** Confusing UX  
**Fix:**
- Change to "Add to Calendar"
- Show 3 icons (G/O/A)
- Grey out unconnected
- Click to add to that calendar
**Priority:** MEDIUM - Better UX

### **8. Energy Tab Screen Shift** 🎮 (20 min)
**Issue:** Clicking tabs shifts whole screen  
**Impact:** Jarring UX  
**Fix:**
- Set min-height on tab content
- Prevent layout shift
**Priority:** MEDIUM - Polish

### **9. Leaderboards → Friends Only** 🏆 (20 min)
**Issue:** Global leaderboard doesn't make sense for small user base  
**Impact:** Shows empty/irrelevant data  
**Fix:**
- Change to "Friends Leaderboard"
- Show only accepted friends
- Hide if no friends
**Priority:** MEDIUM - Makes more sense

### **10. No Notifications** 🔔 (30 min)
**Issue:** Not receiving notifications for points/achievements  
**Impact:** Users miss feedback  
**Fix:**
- Add in-app toasts for points earned
- Add notification for achievements unlocked
- Wire to existing notification system
**Priority:** MEDIUM - Feedback loop

---

## 🟢 **P2 - NICE TO HAVE (Can Fix Post-Launch) - 2 hours**

These are polish/enhancements:

### **11. Energy Emblem Inventory** 🎨 (45 min)
**Issue:** Can't choose which emblem to display  
**Impact:** Customization missing  
**Fix:**
- Create emblem inventory page
- Show unlocked emblems
- Click to equip
**Priority:** LOW - Cosmetic

### **12. Energy Emblem Animation Toggle** 🎭 (15 min)
**Issue:** No way to turn off emblem animation  
**Impact:** Some users prefer reduced motion  
**Fix:**
- Add toggle in Energy settings
- Respect `prefers-reduced-motion`
**Priority:** LOW - Accessibility nice-to-have

### **13. Badge Preview** 🏅 (30 min)
**Issue:** Can't see what badges exist before unlocking  
**Impact:** No aspirational goal visibility  
**Fix:**
- Show all badges (locked/unlocked)
- Show unlock criteria
- Progress bars for partial progress
**Priority:** LOW - Gamification enhancement

### **14. "Gamification" → "Achievements"** (15 min)
**Issue:** Tab says "Achievements" but some places say "Gamification"  
**Impact:** Inconsistent naming  
**Fix:**
- Rename all "Gamification" → "Achievements"
- Update routes, labels, code
**Priority:** LOW - Consistency

---

## 🎯 **RECOMMENDED EXECUTION PLAN:**

### **TODAY (Tonight - 3 hours):**

**Phase 1: Critical Fixes (P0)**
1. Energy System (1h)
2. Sidebar/Blank Space (30m)
3. ShareSync Tab (30m)
4. Friends Tab (30m)
5. Mobile Responsive (30m)

**Result:** No broken features, looks professional

---

### **TOMORROW MORNING (Thursday - 2 hours):**

**Phase 2: UX Polish (P1)**
6. Calendar Sync Renaming (20m)
7. Add to Calendar Icons (30m)
8. Energy Tab Shift (20m)
9. Friends Leaderboard (20m)
10. Notifications Working (30m)

**Result:** Smooth UX, clear features

---

### **TOMORROW AFTERNOON (Thursday - 1 hour):**

**Monitoring Setup:**
- Sentry (20m)
- UptimeRobot (15m)
- Final smoke test (25m)

**Result:** 100% launch ready!

---

### **POST-LAUNCH (Week 1):**

**Phase 3: Polish (P2)**
11. Emblem Inventory (45m)
12. Animation Toggle (15m)
13. Badge Preview (30m)
14. Naming Consistency (15m)

**Result:** Perfect polish based on real user feedback

---

## 💡 **WHY THIS ORDER:**

**P0 (Tonight):** 
- Fixes broken features
- Makes it look professional
- Mobile is critical (50% of users!)

**P1 (Tomorrow AM):**
- Improves clarity
- Better UX
- More polished

**P2 (Post-Launch):**
- Nice-to-haves
- Can wait for user feedback
- Might not even be needed

---

## 🎯 **MY STRONG RECOMMENDATION:**

**DO THIS:**
1. **Tonight:** P0 fixes (3 hours) → No broken features
2. **Thursday AM:** P1 polish (2 hours) → Great UX
3. **Thursday PM:** Monitoring (1 hour) → Launch ready!
4. **Friday:** LAUNCH! 🚀
5. **Week 1:** P2 enhancements → Perfect based on feedback

**SKIP THIS:**
- Trying to do everything tonight
- Delaying launch for P2 items
- Over-polishing before users

---

## 🚀 **READY TO START?**

**Let's tackle P0 tonight (3 hours):**
1. Energy System
2. Sidebar fix
3. ShareSync tab
4. Friends tab
5. Mobile responsive

**Then tomorrow:**
- P1 polish
- Monitoring
- Launch!

---

**Want me to start with #1 (Energy System)?** It's the most important! ⚡

**Or different priority?** Tell me and I'll adjust! 🎯
