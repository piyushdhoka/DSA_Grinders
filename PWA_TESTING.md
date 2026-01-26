# 📋 PWA Testing Checklist

Use this checklist to verify your PWA is working correctly.

## 🔧 Development Testing

### Local Testing
```bash
# Build and run production version
npm run build
npm start

# Visit http://localhost:3000
```

### Chrome DevTools Testing
1. Open Chrome DevTools (F12)
2. Go to **Lighthouse** tab
3. Run PWA audit
4. Should score **100/100** ✅

### Service Worker Testing
1. DevTools → **Application** tab
2. Check **Service Workers** section
3. Verify `/sw.js` is registered
4. Status should be "activated and running"

### Manifest Testing
1. DevTools → **Application** tab
2. Click **Manifest** in left sidebar
3. Verify all fields are correct:
   - Name: "DSA Grinders - LeetCode Tracker"
   - Theme color: #1a73e8
   - Icons: 8 sizes present

### Offline Testing
1. DevTools → **Network** tab
2. Check "Offline" checkbox
3. Refresh page
4. App should still load (cached pages)
5. API calls may fail gracefully

---

## 📱 Mobile Testing

### Android (Chrome)
1. Deploy to production (Vercel)
2. Open site in Chrome on Android
3. Look for "Install app" prompt in address bar
4. Tap to install
5. Verify:
   - ✅ Icon appears on home screen
   - ✅ Opens full-screen (no browser UI)
   - ✅ Splash screen shows
   - ✅ Navigation works smoothly
   - ✅ Pull-to-refresh works

### iOS (Safari)
1. Deploy to production (Vercel)
2. Open site in Safari on iPhone
3. Tap Share button (⬆️)
4. Scroll and tap "Add to Home Screen"
5. Tap "Add"
6. Verify:
   - ✅ Icon appears on home screen
   - ✅ Opens full-screen
   - ✅ Status bar shows (not full-screen browser)
   - ✅ Splash screen shows
   - ✅ Navigation works
   - ✅ No Safari UI elements

---

## 🎯 User Experience Testing

### Performance
- ⏱️ Initial load < 3 seconds
- 🎨 Smooth 60fps animations
- 📱 No jank on scroll
- ⚡ Instant navigation

### Touch Interactions
- 👆 No blue tap highlight
- 📏 Touch targets ≥ 44x44px
- 🔄 Active states on buttons
- 🎯 No accidental zooms on inputs

### Native Feel
- 🏠 Respects iPhone notch (safe areas)
- 🔙 Browser back button works
- 🔄 Pull-to-refresh (where appropriate)
- 🚫 No overscroll bounce (controlled)

---

## ✅ Feature Testing

### Install Prompt
- [ ] Shows after 30 seconds on first visit
- [ ] Can be dismissed
- [ ] Doesn't show again after dismiss
- [ ] iOS shows instructions
- [ ] Android shows install button

### Splash Screen
- [ ] Shows on PWA launch
- [ ] Displays logo
- [ ] Smooth fade out
- [ ] Only shows in standalone mode

### Service Worker
- [ ] Caches home, login, profile pages
- [ ] API calls work offline (from cache)
- [ ] New content updates properly
- [ ] No stale data issues

### App Shortcuts
- [ ] Long-press icon shows shortcuts
- [ ] "Leaderboard" opens /home
- [ ] "Profile" opens /profile
- [ ] Shortcuts work correctly

---

## 🐛 Common Issues

### Service Worker Not Updating
**Solution:** 
```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  registrations.forEach(r => r.unregister())
})
location.reload()
```

### Install Prompt Not Showing
**Checklist:**
- [ ] On HTTPS (required)
- [ ] Service worker registered
- [ ] Manifest valid
- [ ] User hasn't dismissed before
- [ ] Not already installed

### iOS Not Full-Screen
**Check:**
- [ ] Added from Safari (not Chrome)
- [ ] Meta tag: `apple-mobile-web-app-capable` = yes
- [ ] Manifest: `display` = standalone

### Cached Content Won't Update
**Solution:**
- Update `CACHE_NAME` in sw.js
- Redeploy
- Old cache auto-deleted on activation

---

## 📊 Metrics to Track

### Lighthouse Scores (Target)
- Performance: 90+
- Accessibility: 100
- Best Practices: 100
- **PWA: 100** ✅
- SEO: 90+

### Install Metrics
- Install prompt impressions
- Install acceptance rate
- Retention after install
- Session duration (PWA vs web)

### Engagement
- Daily active users (DAU)
- Return visit rate
- Offline usage stats
- Push notification CTR

---

## 🚀 Deployment Checklist

Before going live:
- [ ] Build passes with no errors
- [ ] Lighthouse PWA score = 100
- [ ] Tested on real Android device
- [ ] Tested on real iPhone
- [ ] Offline mode works
- [ ] Icons display correctly
- [ ] Splash screen works
- [ ] Install prompt appears
- [ ] Service worker updates properly
- [ ] README updated with PWA info

---

## 📝 Post-Launch

After deployment:
- [ ] Test install on multiple devices
- [ ] Monitor error logs for SW issues
- [ ] Track install conversion rate
- [ ] Gather user feedback
- [ ] Plan push notification strategy
- [ ] Consider A/B testing install prompts

---

**Need help?** Check [PWA_SETUP.md](./PWA_SETUP.md) for detailed documentation.
