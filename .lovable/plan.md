
## Fix: Remove Blank Space from Printed Invoice

**Problem**
The printed invoice has a blank white strip at the top before the logo. This is caused by the `@media print` CSS on line 357 of `src/pages/admin/Billing.tsx`, which sets `@page { margin: 5px 10px; }` and `body { padding: 5px 10px; }`.

**Solution**
Replace the existing `@media print` rule inside the `printInvoiceDirectly` function's inline `<style>` block with corrected print styles that zero out margins and padding.

---

### Technical Details

**File:** `src/pages/admin/Billing.tsx` (line 357)

**Current code:**
```css
@media print { body { padding: 5px 10px; margin: 0; } @page { margin: 5px 10px; } }
```

**Replace with:**
```css
@media print { @page { margin: 0; } body { margin: 0; padding: 0; max-width: 100%; } .logo-section { margin-top: 0 !important; padding-top: 0 !important; } }
```

This ensures:
- `@page { margin: 0 }` removes the browser's default print page margins (the main cause of the blank strip)
- `body { padding: 0; margin: 0 }` removes extra spacing around content
- `.logo-section` override ensures the logo sits flush at the top
- Screen styles remain unchanged (the `padding: 10px 15px` on the body only applies on screen)
