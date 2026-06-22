# FAQ Implementation - Setup Guide

## ✅ Backend Setup Complete

### Files Created/Modified

1. **Model** ✅
   - File: `server/models/SaaS/master/FAQ.js`
   - Schema: question, answer, category, displayOrder, isActive, timestamps

2. **Controller** ✅
   - File: `server/controllers/SaaS/superAdmin/faq.controller.js`
   - Functions: getPublicFAQs, getAllFAQs, createFAQ, updateFAQ, deleteFAQ, updateFAQs

3. **Routes** ✅
   - File: `server/routes/SaaS/superAdmin.routes.js` (updated)
   - Added 5 FAQ endpoints with proper authentication
   - File: `server/routes/SaaS/public.routes.js` (updated)
   - Added public FAQ endpoint

4. **Frontend API** ✅
   - File: `clients/src/SaaS/services/adminApi.js` (updated)
   - Fixed endpoint to `/api/super/faqs`
   - Functions: getPublicFAQs(), updatePublicFAQs()

5. **Frontend Components** ✅ (Already Existed)
   - File: `clients/src/SaaS/pages/superadmin/WebsiteSettings/Faqs/Faqs.jsx`
   - File: `clients/src/SaaS/pages/superadmin/WebsiteSettings/Faqs/FaqEditor.jsx`
   - File: `clients/src/SaaS/pages/superadmin/WebsiteSettings/Faqs/FaqDesign.jsx`
   - File: `clients/src/SaaS/pages/superadmin/SuperAdminDashboard.jsx` (imported Faqs)

## 🔄 How It Works

### Frontend Flow
1. User clicks "Website" → "FAQs" in sidebar
2. FaqEditor loads FAQs via `getPublicFAQs()` from `/api/public/faqs`
3. User can Add/Edit/Delete FAQs
4. On save, calls `updatePublicFAQs(array)` to PUT `/api/super/faqs`
5. Socket.io broadcasts update to all connected clients
6. FaqDesign shows live preview

### Backend Flow
1. Request arrives at `/api/super/faqs` or `/api/public/faqs`
2. Controller method executes (authenticated for admin routes)
3. FAQ model performs database operation
4. Emits Socket.io update to clients
5. Response returned to frontend

## 🚀 Start Using

1. **Frontend**:
   ```bash
   cd clients
   npm run dev
   ```

2. **Backend**:
   ```bash
   cd server
   npm start
   ```

3. **Access**:
   - Go to Super Admin Dashboard → Website → FAQs
   - Or access API directly at `http://localhost:5000/api/public/faqs`

## 📝 Database Collections

- **Database**: Master DB (SaaS)
- **Collection**: FAQ
- **Documents**: Stored as individual documents (not as array)
- **Auto-created**: 3 default FAQs on first access

## 🔐 Authentication

- Public endpoint: `/api/public/faqs` - NO authentication needed
- Admin endpoints: `/api/super/faqs*` - Requires valid admin token

## 🐛 Troubleshooting

If FAQs don't load:
1. Verify server is running (`npm start` in server directory)
2. Check browser console for API errors
3. Verify frontend API endpoint matches: `/api/super/faqs`
4. Check database connectivity to Master DB
5. Look for Socket.io connection errors

## 📊 Default FAQ Data

System creates 3 FAQs automatically:
- "What is Inventory Management System?"
- "How do I get started?"
- "What are the system requirements?"
