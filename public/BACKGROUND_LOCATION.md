# 🖼️ CBT Background Image Configuration Guide

This document explains where the background picture for all pages is located and how you can easily change or customize it.

---

## 📍 Where the Background Picture is Configured

### 1. Primary Style Definition File
- **File Location**: [`src/index.css`](file:///C:/Users/User/Desktop/cbt/My-exam/src/index.css)
- **Variable Name**: `--cbt-bg-image`
- **Class Name**: `.cbt-background`

```css
:root {
  /* =====================================================================
     CBT BACKGROUND PICTURE LOCATION:
     You can update the image URL below to any online URL or local path.
     ===================================================================== */
  --cbt-bg-image: url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop');
}
```

---

## 🎨 How to Change the Background Picture

### Option A: Use a New Online Image URL
1. Open [`src/index.css`](file:///C:/Users/User/Desktop/cbt/My-exam/src/index.css).
2. Locate `--cbt-bg-image`.
3. Replace the URL inside `url('...')` with your desired image URL.

### Option B: Use a Local Image File
1. Save your custom background picture inside the public directory:
   - File Path: `My-exam/public/cbt-bg.jpg`
2. Open [`src/index.css`](file:///C:/Users/User/Desktop/cbt/My-exam/src/index.css).
3. Set `--cbt-bg-image`:
```css
:root {
  --cbt-bg-image: url('/cbt-bg.jpg');
}
```

---

## 📄 Pages Covered
The background image layer `.cbt-background` is applied and active on **all pages**:

1. 🏠 **Home**: [`src/pages/Home.tsx`](file:///C:/Users/User/Desktop/cbt/My-exam/src/pages/Home.tsx)
2. 🔑 **Candidate Login**: [`src/pages/CandidateLogin.tsx`](file:///C:/Users/User/Desktop/cbt/My-exam/src/pages/CandidateLogin.tsx)
3. 📝 **Candidate Register**: [`src/pages/CandidateRegister.tsx`](file:///C:/Users/User/Desktop/cbt/My-exam/src/pages/CandidateRegister.tsx)
4. 📊 **Candidate Dashboard**: [`src/pages/CandidateDashboard.tsx`](file:///C:/Users/User/Desktop/cbt/My-exam/src/pages/CandidateDashboard.tsx)
5. 🖥️ **Exam Terminal**: [`src/pages/ExamDashboard.tsx`](file:///C:/Users/User/Desktop/cbt/My-exam/src/pages/ExamDashboard.tsx)
6. 📋 **Exam Instructions**: [`src/pages/ExamInstructions.tsx`](file:///C:/Users/User/Desktop/cbt/My-exam/src/pages/ExamInstructions.tsx)
7. ✍️ **Exam Player**: [`src/pages/ExamPlayer.tsx`](file:///C:/Users/User/Desktop/cbt/My-exam/src/pages/ExamPlayer.tsx)
8. ⚙️ **Admin Panel**: [`src/pages/Admin.tsx`](file:///C:/Users/User/Desktop/cbt/My-exam/src/pages/Admin.tsx)
9. 🔐 **Admin Auth**: [`src/pages/AdminAuth.tsx`](file:///C:/Users/User/Desktop/cbt/My-exam/src/pages/AdminAuth.tsx)
10. 👤 **Staff Login**: [`src/pages/StaffLogin.tsx`](file:///C:/Users/User/Desktop/cbt/My-exam/src/pages/StaffLogin.tsx)
11. 🔎 **Result Checker**: [`src/pages/ResultChecker.tsx`](file:///C:/Users/User/Desktop/cbt/My-exam/src/pages/ResultChecker.tsx)
12. 📜 **Result Slip**: [`src/pages/ResultSlip.tsx`](file:///C:/Users/User/Desktop/cbt/My-exam/src/pages/ResultSlip.tsx)
13. 📄 **Exam Slip**: [`src/pages/ExamSlip.tsx`](file:///C:/Users/User/Desktop/cbt/My-exam/src/pages/ExamSlip.tsx)
14. 🔑 **Forgot Password**: [`src/pages/ForgotPassword.tsx`](file:///C:/Users/User/Desktop/cbt/My-exam/src/pages/ForgotPassword.tsx)
15. 🔒 **Reset Password**: [`src/pages/ResetPassword.tsx`](file:///C:/Users/User/Desktop/cbt/My-exam/src/pages/ResetPassword.tsx)
16. ℹ️ **About**: [`src/pages/About.tsx`](file:///C:/Users/User/Desktop/cbt/My-exam/src/pages/About.tsx)
17. 📞 **Contact**: [`src/pages/Contact.tsx`](file:///C:/Users/User/Desktop/cbt/My-exam/src/pages/Contact.tsx)
18. 📜 **Terms**: [`src/pages/Terms.tsx`](file:///C:/Users/User/Desktop/cbt/My-exam/src/pages/Terms.tsx)
19. 🔒 **Privacy**: [`src/pages/Privacy.tsx`](file:///C:/Users/User/Desktop/cbt/My-exam/src/pages/Privacy.tsx)
