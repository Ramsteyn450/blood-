# LifeFlow — Smart Blood Donor & Medical Camp Network 🩸

A premium, localized blood donor and medical camp network application with robust geofencing, appointment scheduling, and gamification.

---

## 🚀 Dummy Accounts & Test Credentials

Use these realistic accounts (pre-seeded in the database) to log in and test different user roles:

### 1. 🛡️ System Admin Role (Manages camps, reviews reports, views analytics)
* **Email:** `admin@lifeflow.com`
* **Password:** `admin123`

### 2. 🏢 Hospital / Blood Bank Organizations (Tamil Nadu)
* **Trichy General Hospital (Tiruchirappalli)**
  * **Email:** `trichy.hospital@lifeflow.com`
  * **Password:** `org123`
* **KMC Specialty Hospital (Tiruchirappalli)**
  * **Email:** `kmc.trichy@lifeflow.com`
  * **Password:** `org123`
* **Chennai Central Blood Bank (Chennai)**
  * **Email:** `chennai.blood@lifeflow.com`
  * **Password:** `org123`
* **Madurai Apollo Specialty Clinic (Madurai)**
  * **Email:** `madurai.apollo@lifeflow.com`
  * **Password:** `org123`
* **Coimbatore Red Cross (Coimbatore)**
  * **Email:** `coimbatore.redcross@lifeflow.com`
  * **Password:** `org123`

### 3. 🩸 Regular Blood Donors (Tamil Nadu)
* **Tamil Donor Siva (Trichy - O+)**
  * **Email:** `siva@lifeflow.com`
  * **Password:** `user123`
* **Tamil Donor Anjali (Trichy - B-)**
  * **Email:** `anjali@lifeflow.com`
  * **Password:** `user123`
* **Tamil Donor Vignesh (Chennai - AB-)**
  * **Email:** `vignesh@lifeflow.com`
  * **Password:** `user123`

---

## 🌟 Premium Features Implemented

### 1. 📍 Smart Radius Distance Filter
* Filters active blood donors & hospitals within **2KM, 3KM, 5KM, 10KM, 20KM** from your location.
* Displays a dashed red radius circle on the map.
* **Manual Location Fallback:** Dropdown selector to manually center the map in Trichy, Chennai, Coimbatore, Madurai, or Salem if browser GPS is blocked/unavailable.

### 2. 🏢 Organization Appointment Booking
* Browse available time slots from certified hospitals & blood banks.
* Capacity tracker (e.g. 15 remaining slots) shows theater-style booking metrics.
* 90-day donation interval checking enforced prior to booking.

### 3. 🚨 Emergency Blood Alert
* Urgent broadcasts to nearby matching donors within selected distance radius.
* Triggers desktop notifications instantly.

### 4. 🗺️ Live Hospital & Camp Markers
* Hospitals are displayed on the map using **real profile images** (Hospital avatar) as map icons.
* Organization users can edit/update their hospital name, location coordinates, description, and profile picture url.
* Active **Medical Camps** are marked with tent emojis (`⛺`) on the map for easy check-in.

### 5. ⛺ Medical Camps Drive Manager (Admin Only)
* Admins can create and host medical camps (Blood Donation, General Health, Eye Checkups, Dental Camp, Cardiology Camp).
* Support for custom posters, time, place, hospitals, and doctor teams involved.
* Donors can view camps and toggle their RSVP status.

### 6. 💳 Digital Donor Card & QR Check-In
* Premium printable Donor ID Card with live auto-generated QR code check-in key.
* Organizations can verify Donor QR codes on their dashboard to complete check-ins and award badges.

### 7. 🏆 Shareable Milestone Certificates
* Milestone badge tracker (First Drop, Life Saver, Blood Hero).
* Dynamic CSS printable certificate awarded to top donors.

### 8. 🌐 Multi-Language Support
* English, தமிழ் (Tamil), and हिन्दी (Hindi) localizations.

---

## 🛠️ Tech Stack & Run Instructions

### Start Dev Servers
```bash
npm run dev
```
Runs Client on `http://localhost:5173` and Server on `http://localhost:5000`.

### Re-seed Database
```bash
cd server
npx ts-node src/seed-data.ts
```
