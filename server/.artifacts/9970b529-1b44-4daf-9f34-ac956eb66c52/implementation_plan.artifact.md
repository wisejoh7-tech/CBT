# Add Email/SMS Notifications and Phone Number Support

This plan details the implementation of email and SMS notifications, adding phone number support for candidates, and ensuring OTP delivery via SMTP.

## User Review Required

> [!IMPORTANT]
> I have chosen **Twilio** as the default SMS provider for the implementation. If you use a different provider (like Termii or Vonage), you will need to update the logic in `src/lib/sms.ts`.

> [!NOTE]
> Adding a new column to the `Candidate` table requires a database migration or synchronization. I will use TypeORM's `synchronize: true` (which is already active for your dev environment) to handle this.

## Proposed Changes

### 1. Database & Config

#### [MODIFY] [Candidate.ts](file:///C:/Users/idemu/OneDrive/Desktop/CBT/My-exam/server/src/entities/Candidate.ts)
- Add `phoneNumber` column to the `Candidate` entity.

#### [MODIFY] [config.ts](file:///C:/Users/idemu/OneDrive/Desktop/CBT/My-exam/server/src/lib/config.ts)
- Add validation for SMS configuration variables (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`).

---

### 2. Notification Utilities

#### [NEW] [sms.ts](file:///C:/Users/idemu/OneDrive/Desktop/CBT/My-exam/server/src/lib/sms.ts)
- Create a generic utility to send SMS messages using an external provider (e.g., Twilio).

---

### 3. Authentication & Registration

#### [MODIFY] [auth.ts](file:///C:/Users/idemu/OneDrive/Desktop/CBT/My-exam/server/src/routes/auth.ts)
- Update registration logic to accept and save the candidate's `phoneNumber`.
- Ensure OTP delivery via SMTP is robust.

---

### 4. Exam Result Notifications

#### [MODIFY] [exam.ts](file:///C:/Users/idemu/OneDrive/Desktop/CBT/My-exam/server/src/routes/exam.ts)
- Update the exam completion logic to trigger:
    1. An email with the result summary.
    2. An SMS with the total score and subject breakdown.

## Verification Plan

### Automated Tests
- I will create a test script `src/test-notifications.ts` to verify SMTP and SMS delivery independently of the main app flow.

### Manual Verification
1. Register a new candidate with a valid email and phone number.
2. Verify the OTP is received via email.
3. Complete an exam attempt as that candidate.
4. Verify that both an email and an SMS are received with the results.
