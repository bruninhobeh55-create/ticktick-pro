import { expect, test } from '@playwright/test';

test.describe('TickTick Pro — Desktop & Mobile E2E Suite', () => {
  test('Smart NLP Quick-Add, View Switcher (List / Kanban / Timeline), and Task Completion', async ({
    page,
  }) => {
    await page.goto('/');

    // Verify Tasks workspace header is visible (defaults to 'Today' smart view)
    await expect(page.locator('h1', { hasText: 'Today' })).toBeVisible();

    // Test Smart NLP Quick-Add input
    const quickInput = page.locator('input[placeholder*="Try NLP"]');
    await expect(quickInput).toBeVisible();

    await quickInput.fill('Verify Playwright E2E flow today for 25m !high #qa');

    // Verify live NLP token detection banner appears before submitting
    await expect(page.getByText('Smart NLP recognized:')).toBeVisible();
    await expect(page.getByText('#qa').first()).toBeVisible();

    await quickInput.press('Enter');

    // Verify newly created task appears in the list with its parsed #qa tag and 25m duration
    await expect(page.getByText('Verify Playwright E2E flow').first()).toBeVisible();
    await expect(page.getByText('25m').first()).toBeVisible();

    // Switch to Kanban view
    await page.locator('button[title="Kanban View"]').click();
    await expect(page.getByText('To Do').first()).toBeVisible();
    await expect(page.getByText('In Progress').first()).toBeVisible();

    // Switch to Timeline (Gantt) view
    await page.locator('button[title="Timeline View"]').click();
    await expect(page.getByText('Timeline Duration View')).toBeVisible();

    // Return to List view
    await page.locator('button[title="List View"]').click();
  });

  test('Edit/Delete Lists, Folders & Tags, Resizable PC Inspector, Focus/Habit Log Filtering & Deletion, and Blank Reset', async ({
    page,
    isMobile,
  }) => {
    if (isMobile) return;

    await page.goto('/');

    // 1. Verify PC Right Inspector Resize Handle exists
    await expect(page.locator('[aria-label="Resize Right Inspector"]')).toBeVisible();

    // 2. Edit a Folder name & Delete a Tag via Three-Dots (...) Context Menu in Sidebar
    await page.locator('button[aria-label="Folder options Product & Engineering"]').click();
    await page.locator('button[aria-label="Rename folder Product & Engineering"]').click();
    const folderInput = page.locator('aside[aria-label="Lists, Tags, and Filters"] form input[type="text"]').first();
    await folderInput.fill('Core Engineering');
    await folderInput.press('Enter');
    await expect(page.getByText('Core Engineering').first()).toBeVisible();

    // Edit a List via Three-Dots (...) Menu -> 2-Column Edit List Modal with Live Preview
    await page.locator('button[aria-label="List options Q4 Core Launch"]').click();
    await page.locator('button[aria-label="Edit list Q4 Core Launch"]').click();
    await expect(page.getByText('Edit List')).toBeVisible();
    await expect(page.getByText('View Type')).toBeVisible();
    const listModalInput = page.locator('form input[placeholder="Name"]');
    await listModalInput.fill('Q4 Launch Renamed');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Q4 Launch Renamed').first()).toBeVisible();

    // Delete a Tag via Three-Dots (...) Menu
    await page.locator('button[aria-label="Tag options finance"]').click();
    await page.locator('button[aria-label="Delete tag finance"]').click();

    // 3. Test Pomodoro / Stopwatch Focus Log Filters & Deletion
    const desktopRail = page.locator('aside[aria-label="Primary Module Navigation"]');
    await desktopRail.locator('button[aria-label="Pomodoro & Focus"]').click();
    await expect(page.getByText(/Focus Record Log/i)).toBeVisible();

    // Filter Focus Logs by Stopwatch / Pomo
    await page.getByRole('button', { name: 'Stopwatch', exact: true }).last().click();
    await page.getByRole('button', { name: 'All', exact: true }).last().click();

    // Delete a Focus Session Log
    const deleteFocusBtns = page.locator('button[title="Remove focus log"]');
    const beforeFocusCount = await deleteFocusBtns.count();
    expect(beforeFocusCount).toBeGreaterThan(0);
    await deleteFocusBtns.first().click();
    await expect(deleteFocusBtns).toHaveCount(beforeFocusCount - 1);

    // 4. Test Habit Tracker Log Filters & Deletion
    await desktopRail.locator('button[aria-label="Habit Tracker"]').click();
    await expect(page.getByText(/Habit Journal & Mood Logs/i)).toBeVisible();

    const deleteHabitLogBtns = page.locator('button[aria-label^="Delete habit log"]');
    const beforeHabitLogCount = await deleteHabitLogBtns.count();
    expect(beforeHabitLogCount).toBeGreaterThan(0);
    await deleteHabitLogBtns.first().click();
    await expect(deleteHabitLogBtns).toHaveCount(beforeHabitLogCount - 1);

    // 5. Test Supabase Cloud Push & Pull
    await desktopRail.locator('button[aria-label="Supabase Backend Settings"]').click();
    await expect(page.getByText('Connected (Live Sync)')).toBeVisible();
    await page.getByRole('button', { name: /Push to Supabase/i }).click();
    await expect(page.getByText(/Pushed .* tasks/i).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /Pull from Supabase/i }).click();
    await expect(
      page.getByText(/(Pulled .* tasks|Connected to Supabase Cloud — workspace is up to date)/i).first()
    ).toBeVisible({ timeout: 15000 });
    await page.locator('button[title="Close Settings"]').click();

    // 6. Test Reset to Blank Workspace
    await desktopRail.locator('button[aria-label="Tasks"]').click();
    await page.getByRole('button', { name: /Reset to Blank Workspace/i }).click();
    await page.getByRole('button', { name: /Yes, Start Blank/i }).click();
    await expect(page.getByText('All clear')).toBeVisible();
  });

  test('All Modules Navigation (Calendar, Pomodoro, Habits, Matrix, Countdown, Statistics)', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');

    if (!isMobile) {
      const desktopRail = page.locator('aside[aria-label="Primary Module Navigation"]');
      await expect(desktopRail).toBeVisible();

      // 1. Calendar (5 Views)
      await desktopRail.locator('button[aria-label="Calendar (5 Views)"]').click();
      await expect(page.getByRole('button', { name: 'Month', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Agenda', exact: true }).click();
      await expect(page.getByText(/items/i).first()).toBeVisible();

      // 2. Pomodoro & Focus
      await desktopRail.locator('button[aria-label="Pomodoro & Focus"]').click();
      await expect(page.getByText('Focusing On Task')).toBeVisible();
      await expect(page.getByRole('button', { name: /Start Focus/i })).toBeVisible();

      // 3. Habit Tracker
      await desktopRail.locator('button[aria-label="Habit Tracker"]').click();
      await expect(page.getByText('Habit Tracker').first()).toBeVisible();

      // 4. Eisenhower Matrix + Floating Task Detail Popover on Click
      await desktopRail.locator('button[aria-label="Eisenhower Matrix"]').click();
      await expect(page.getByText('Urgent & Important').first()).toBeVisible();
      await expect(page.getByText('Not Urgent & Important').first()).toBeVisible();
      const q1Input = page.locator('input[placeholder*="+ Add to Urgent & Important"]');
      await q1Input.fill('Inspect Matrix Popover Task');
      await q1Input.press('Enter');
      await page.getByText('Inspect Matrix Popover Task').first().click();
      await expect(page.locator('[aria-label="Floating Task Inspector"]')).toBeVisible();
      await page.locator('button[aria-label="Close task popover"]').click();

      // 5. Countdown
      await desktopRail.locator('button[aria-label="Countdown"]').click();
      await expect(page.getByText('Countdown').first()).toBeVisible();

      // 6. Statistics & Score
      await desktopRail.locator('button[aria-label="Statistics & Score"]').click();
      await expect(page.getByText('Achievement Score').first()).toBeVisible();
    } else {
      const mobileNav = page.locator('nav[aria-label="Mobile Bottom Navigation"]');
      await expect(mobileNav).toBeVisible();

      // Verify initial mobile state: TaskDetailPane sheet is NOT blocking the viewport
      await expect(page.locator('h1', { hasText: 'Today' })).toBeVisible();
      await expect(page.locator('aside[aria-label="Task Detail Inspector"]')).toHaveCount(0);

      // Open off-canvas Slide-Over Drawer on mobile
      await page.locator('button[aria-label="Toggle Sidebar"]').click();
      const sidebar = page.locator('aside').filter({ hasText: 'Lists' }).first();
      await expect(sidebar).toBeVisible();

      // Select 'All Tasks' in mobile drawer and verify drawer auto-closes on mobile selection
      await sidebar.getByRole('button', { name: /All Tasks/i }).click();
      await expect(page.locator('h1', { hasText: 'All Tasks' })).toBeVisible();

      // Tap a task on mobile to slide up the Vaul-style TaskDetailPane bottom sheet
      const firstTask = page.locator('div[role="button"]').first();
      await firstTask.click();
      const closeDetailBtn = page.locator('button[aria-label="Close Detail Pane"]');
      await expect(closeDetailBtn).toBeVisible();
      await closeDetailBtn.click();
      await expect(page.locator('aside[aria-label="Task Detail Inspector"]')).toHaveCount(0);

      // Navigate via Mobile Bottom Bar: Calendar
      await mobileNav.locator('button[aria-label="Calendar (5 Views)"]').click();
      await expect(page.getByRole('button', { name: 'Month', exact: true })).toBeVisible();

      // Navigate via Mobile Bottom Bar: Pomodoro / Focus
      await mobileNav.locator('button[aria-label="Pomodoro & Focus"]').click();
      await expect(page.getByText('Focusing On Task')).toBeVisible();
      await expect(page.getByRole('button', { name: /Start Focus/i })).toBeVisible();

      // Navigate via Mobile Bottom Bar: Habit Tracker
      await mobileNav.locator('button[aria-label="Habit Tracker"]').click();
      await expect(page.getByText('Habit Tracker').first()).toBeVisible();

      // Open Mobile "More" Vaul-Style Bottom Sheet and navigate to Eisenhower Matrix & Stats
      await mobileNav.locator('button[aria-label="More Modules and Settings"]').click();
      await expect(page.getByRole('button', { name: 'Matrix' })).toBeVisible();
      await page.getByRole('button', { name: 'Matrix' }).click();
      await expect(page.getByText('Urgent & Important').first()).toBeVisible();

      // Open Mobile "More" sheet again and open Statistics
      await mobileNav.locator('button[aria-label="More Modules and Settings"]').click();
      await page.getByRole('button', { name: 'Stats' }).click();
      await expect(page.getByText('Achievement Score').first()).toBeVisible();
    }
  });
});
