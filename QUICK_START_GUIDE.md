# MediMate - Quick Start Guide

## How to Use MediMate

### Step 1: Open the App
- Open `index.html` in your web browser
- You'll see the splash screen (appears once per session)
- Dashboard shows today's date and calendar

### Step 2: Add Your First Medicine
1. Click the **"+ Add Medicine"** button in the top right
2. Fill out the form:
   - **Medicine name**: e.g., "Vitamin D", "Aspirin"
   - **Person taking medicine**: e.g., "Dad", "Mom", "Myself"
   - **Add a note**: Optional, e.g., "Take after food"
   - **Start date**: When to start taking the medicine
   - **End date**: When to stop taking the medicine
   - **How many times a day**: 1, 2, or 3
   - **Times**: Enter the times you want to take the medicine
     - Enter in 12-hour format with AM/PM (e.g., "9:00 AM", "2:00 PM")
     - Select medicine image from the carousel
3. Click **"Add Medicine"**
4. You'll see success message and return to dashboard

### Step 3: View Today's Medicines
The dashboard automatically shows:
- **Upcoming**: Doses scheduled for today that haven't been taken yet
- **Taken**: Doses you've marked as taken today
- **Missed**: Doses that were scheduled for today but you missed

Each status shows a count of doses.

### Step 4: Mark Doses as Taken
1. Click any status button (Upcoming/Taken/Missed)
2. A modal pops up showing all doses in that category
3. For each dose, you can:
   - **✓ Mark Taken** - Mark the dose as completed
   - **✕ Miss** - Acknowledge you missed it
   - **⊘ Skip** - Skip this dose intentionally
4. Changes save immediately
5. Status counts update automatically

### Step 5: View Other Dates
1. Click any date in the calendar
2. The selected date appears with a blue border
3. All medicine data updates for that date
4. You can see and modify doses from past or future dates
5. Each date has its own independent status tracking

### Step 6: Add More Medicines
- Repeat Step 2 for each medicine
- All medicines are preserved (no data loss)
- Each medicine can have different schedule

---

## Important Notes

### Time Format
- **Input format**: 12-hour with AM/PM (e.g., "9:00 AM")
- **Stored format**: 24-hour (e.g., "09:00")
- **Display format**: 12-hour with AM/PM (e.g., "9:00 AM")

### Date-Aware Status
- Each medicine has status per date
- August 28: Vitamin D 9:00 AM marked TAKEN
- August 29: Vitamin D 9:00 AM shows as PENDING (fresh start)
- No carryover between dates

### Dose Status Options
1. **Pending** (default): Dose not yet taken or acted upon
2. **Taken**: You marked the dose as completed
3. **Missed**: Dose time passed but wasn't taken (auto-marked or manual)
4. **Skipped**: You intentionally skipped this dose

### Automatic Missed Detection
If a dose time has passed and you haven't marked it taken, it automatically appears in "Missed" category. You can still mark it as taken if you take it late.

### Data Persistence
- All medicine data stored in browser's localStorage
- Data persists even if you:
  - Close the app
  - Close the browser
  - Refresh the page
  - Turn off your device
- No internet needed (works offline)
- No account required

---

## Example Workflow

**Day 1 (August 28)**
- Add "Vitamin D" for Dad
  - Start: August 28
  - End: September 28
  - Times: 9:00 AM, 2:00 PM, 9:00 PM
- See 3 upcoming doses
- At 9:00 AM: Click "Upcoming" → Click "✓ Mark Taken" for 9:00 AM dose
- "Upcoming" count drops to 2, "Taken" count is now 1
- At 3:00 PM: 2:00 PM dose auto-moves to "Missed" (time passed)
- At 10:00 PM: Mark 9:00 PM dose taken
- Day ends: 2 taken, 1 missed

**Day 2 (August 29)**
- Click August 29 in calendar
- See all 3 doses as "Upcoming" again (fresh start!)
- Status from August 28 doesn't affect today
- Can mark doses again for today

---

## Tips & Best Practices

✅ **Do This:**
- Enter times that match when you actually take medicine
- Set realistic end dates
- Use descriptive notes (e.g., "with breakfast")
- Review other dates to see past adherence
- Mark doses as skipped if intentionally not taking

❌ **Don't Do This:**
- Don't forget to click status buttons (nothing happens without action)
- Don't expect status to carry over to next day
- Don't clear browser data (will lose all medicines)
- Don't enter time in 24-hour format manually (use AM/PM)

---

## Troubleshooting

### "I don't see my medicines"
- Check the date in the calendar
- Make sure today is between startDate and endDate
- Check browser console for errors (F12 → Console)

### "Statuses didn't save"
- Make sure you clicked the action button (✓ Mark Taken, etc.)
- Check if modal closed properly
- Try refreshing the page

### "Data disappeared"
- Check if you cleared browser cache/storage
- Data is stored in localStorage - don't delete it
- If cleared accidentally, re-add medicines

### "Time is showing wrong"
- Times are stored in 24-hour format internally
- Always displayed as 12-hour with AM/PM
- If entering "9:00 AM" doesn't work, try "09:00 AM"

### "Missed dose not appearing"
- Missed is only auto-marked if time has truly passed
- For today: check your system time
- For past dates: any pending dose is marked as missed
- You can manually mark as missed too

---

## Features Summary

✅ Add multiple medicines
✅ Each medicine can have 1-3 times per day
✅ Track each dose independently
✅ Status per dose per date
✅ View any date via calendar
✅ No data loss when adding medicines
✅ Offline-first (localStorage)
✅ Automatic missed detection
✅ Skip option for intentional non-adherence
✅ Beautiful, responsive UI
✅ Smooth animations and transitions
✅ Works on phones and tablets

---

**Happy medicine tracking! Your health matters. 💊**
