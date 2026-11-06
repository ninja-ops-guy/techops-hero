import assert from 'node:assert/strict';

const control = (page, name) => page.getByRole('button', { name, exact: true });
export async function openApp(page, name) {
  await control(page, 'Show desktop').click();
  await page.getByRole('navigation', { name: 'Installed applications' }).getByRole('button', { name, exact: true }).click();
  await page.getByRole('region', { name, exact: true }).waitFor();
}

export async function inspectDesktop(page) {
  const desktop = page.locator('.doors-field');
  await desktop.waitFor();
  const controls = await desktop.getByRole('button').all();
  for (const el of controls) {
    await el.scrollIntoViewIfNeeded();
    const box = await el.boundingBox();
    assert.ok(box && box.width >= 44 && box.height >= 44, 'Doors desktop touch target is at least 44px');
    assert.ok(await el.evaluate(el => {
      const b = el.getBoundingClientRect(), hit = document.elementFromPoint(b.x+b.width/2, b.y+b.height/2);
      return el.contains(hit);
    }), 'Doors desktop controls are unobscured');
  }
  return desktop.evaluate(el => {
    if (el.scrollWidth > el.clientWidth + 1 || el.parentElement.scrollHeight > el.parentElement.clientHeight + 1) throw Error('Doors desktop exceeds the viewport');
    return { width: el.clientWidth, height: el.clientHeight };
  });
}

export async function traceLabels(page) {
  await openApp(page, 'Print Center');
  await control(page, 'Send test label').click();
  await page.getByText('Removed · access denied', { exact: true }).waitFor();
  await control(page, 'Authorized lead').click();
  await control(page, 'Send test label').click();
  await page.getByText('Delivered to SHIP-LBL02', { exact: true }).waitFor();
}

export async function repairQueue(page) {
  await openApp(page, 'Work Order');
  await control(page, 'permissions').click();
  await control(page, 'Open repair tool').click();
  await control(page, 'Everyone · Full control').click();
  await control(page, 'Apply and refresh token').click();
  await page.locator('.doors-message[data-error=true]').waitFor();
  await control(page, 'Approved Shipping group · Print').click();
  await control(page, 'Apply and refresh token').click();
  await openApp(page, 'Print Center');
  // The lead still prints regardless of the clerk's permission. Only retesting
  // the affected identity may satisfy the technical check.
  await control(page, 'Send test label').click();
  const rec = await page.evaluate(() => TechOpsCampaign.load(localStorage).investigations.shipping_cannot_print);
  assert.equal(rec.fixApplied, true);
  assert.equal(rec.technicalCheckPassed, false);
  await control(page, 'Shipping clerk').click();
  await control(page, 'Send test label').click();
}
