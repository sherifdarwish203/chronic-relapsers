# رحلة التعافي — Recovery Journey

> A bilingual web application for relapse-prevention groups at the **Recovery Center for Psychiatry & Addiction, Alexandria, Egypt**

---

## What is this app?

**Recovery Journey (رحلة التعافي)** is a digital tool designed to help patients in addiction recovery map their personal history — periods of abstinence, periods of relapse, and the triggers behind each episode. It transforms a clinical conversation into a clear, visual timeline that both the patient and their facilitator can read and learn from.

The app is used **during group or individual sessions** — a facilitator registers the patient beforehand, hands them a unique code, and the patient fills in their own journey privately and at their own pace.

---

## Who uses it?

| Role | What they do |
|------|-------------|
| **Facilitator** (Dr. / Therapist) | Creates patient codes, monitors the group dashboard, exports data for research |
| **Patient** | Enters their timeline, maps relapse triggers, views their personal summary |

---

## Facilitator Guide

### 1 — Log in to the Dashboard

Go to the app and click **"أنا معالج"** (I am a facilitator), or navigate directly to `/dashboard/login`.

- **Username:** your assigned username (e.g. `dr.sherif`)
- **Password:** your assigned password

---

### 2 — Register a New Patient

Before a session, create a code for each new patient:

1. From the dashboard, click the green **"+ New Patient"** button
2. Type the patient's first name
3. Click **"Generate Code"**
4. A unique 7-character code appears (e.g. **`K482951`**)
5. Write this code on a piece of paper and hand it to the patient

> The patient will use this code — along with their first name — to access their record. No password is needed on their side.

---

### 3 — The Patient Dashboard

The dashboard shows a table of all registered patients with:

- Their assigned code and name
- Substances involved in their treatment
- Number of periods recorded
- Number of relapses
- Number of trigger events mapped

Click **View** to open a patient's full record, or **Edit** to update their name or substances profile.

---

### 4 — Aggregate Analytics

The dashboard automatically calculates group-level patterns:

- Total patients, total relapses, total events
- Percentage of internal vs. external triggers
- Most common feelings and triggers across all patients
- Anticipation breakdown (did patients see the relapse coming?)

---

### 5 — Export Research Data

Click **"Export CSV"** to download an anonymised spreadsheet of all patient data — coded by patient number only, no names included. Suitable for research and clinical reporting.

---

### 6 — Individual Patient PDF

Open any patient's record and click **"Download PDF"** to generate a clinical summary document (A4 format) suitable for case files.

---

## Patient Guide

### Step 1 — Enter the App

From the home screen, tap **"أنا مريض"** (I am a patient).

---

### Step 2 — Enter Your Details

You will be asked for:
- **Your first name** (or any name you prefer to use)
- **Your code** — the 7-character code your facilitator gave you (e.g. `K482951`)

Tap **دخول ←** to enter.

> If you have used the app before, entering the same code will reload all your previous data.

---

### Step 3 — Build Your Timeline

You will see your **personal timeline** — a record of your journey over time. Tap **"+ إضافة فترة"** to add a new period.

For each period you add, you choose:

| Field | Options |
|-------|---------|
| **Type** | Abstinence period · Relapse · Reduced use |
| **Start date** | Month and year |
| **End date** | Month and year (leave empty if still ongoing) |
| **Substances** | Which substance(s) were involved *(for relapse/reduced periods)* |
| **Note** | A short note about what was happening at the time |

Add as many periods as you need, going back as far as you can remember.

---

### Step 4 — Map a Relapse Event

For any **relapse period**, you can tap **"أحداث"** to go deeper and record what was happening just before the relapse. This is a 5-step process:

1. **What happened?** — describe the situation in your own words
2. **When did it start?** — same day, days before, weeks before, months before
3. **How were you feeling?** — choose from a list of feelings (you can select multiple)
4. **What were the external triggers?** — things happening around you (stress, family, work...)
5. **What were the internal triggers?** — things happening inside you (stopping medication, anxiety...)

At the end you answer:
- Was this mainly an **internal**, **external**, or **both** situation?
- Did you **see it coming**, partly see it, or was it unexpected?

---

### Step 5 — View Your Summary

Tap **"حفظ ومشاهدة الملخص ←"** at the bottom of the timeline to see your full personal summary:

- Number of abstinence periods and relapses
- Your longest abstinence period
- A visual timeline of your journey
- Your personal trigger pattern — what feelings and situations appear most often

You can **print** this page or save it as a PDF using **"طباعة / تحميل PDF"**.

---

## Privacy

- Patients are identified only by a **random code** — no full names, national IDs, or contact information are stored
- The research CSV export contains **codes only**, no patient names
- All data is stored on a private server at the Recovery Center

---

## Languages

The patient interface is in **Arabic (RTL)**. The facilitator dashboard is in **English**. The app supports both comfortably on the same device.

---

## Developed for

**Recovery Center for Psychiatry & Addiction**  
Alexandria, Egypt

*Built to support the relapse-prevention group programme — helping patients understand their own patterns and build lasting recovery.*
