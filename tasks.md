# Citiply Admin Dashboard Tasks & Implementation Plan

> Based on the requirements in [`changes.md`](file:///d:/07/ModeAI/citiply/changes.md), this document details all tasks, architectural breakdowns, affected files, and step-by-step execution workflows.

---

## 📌 Tasks Checklist

- [x] **Task 1: Sidebar Text Removal**
  - [x] Remove `Workspace` and `Supabase connected dashboard for catalogue operations.` from admin sidebar.
  - [x] Retain and polish the Sign Out button layout.
- [x] **Task 2: Product Form Cleanup**
  - [x] Remove `Short Description` and `Color Tone` from Zod validation schema and default values.
  - [x] Remove `Color Tone` input and align `Size` and `Quantity` into a clean grid.
  - [x] Remove `Short Description` textarea.
  - [x] Clean up payload in form submission.
- [x] **Task 3: Zustand State Management**
  - [x] Install `zustand`.
  - [x] Implement `useProductsStore` in `lib/stores/products-store.ts`.
  - [x] Implement `useCategoriesStore` in `lib/stores/categories-store.ts`.
  - [x] Implement `useCollectionsStore` in `lib/stores/collections-store.ts`.
  - [x] Implement `useCataloguesStore` in `lib/stores/catalogues-store.ts`.
  - [x] Implement `useEnquiriesStore` in `lib/stores/enquiries-store.ts`.
  - [x] Wire admin pages to use the Zustand stores instead of manual local fetch states.
- [x] **Task 4: Admin Products Filters & Sorting**
  - [x] Add sorting dropdown to Admin Products page:
    - *Recently Added* (`created_at` descending)
    - *Recently Modified* (`updated_at` descending, fallback to `created_at`)
    - *Name: A → Z* (ascending)
    - *Name: Z → A* (descending)
  - [x] Track `updated_at` timestamp in Supabase products schema and API update route.
- [x] **Task 5: Product Details Modal**
  - [x] Create `components/admin/ProductDetailsModal.tsx`.
  - [x] On clicking a product row/name, display all product details, dynamic specs, and high-res image(s).
  - [x] Include action buttons: **Edit** (opens ProductForm modal) and **Delete** (with confirmation).
- [x] **Task 6: Product Image Layout (New Products)**
  - [x] Rotate images 90° clockwise so layout is vertical (*Faded on top*, *Oiled at the bottom*).
  - [x] Update `scripts/seed-evergreen-new-photos.ts` with `.rotate(90)` in sharp pipeline.
  - [x] Re-process and update the existing Evergreen White Oak veneer images in S3 and Supabase.
- [x] **Task 7: End-to-End Verification**
  - [x] Verify build (`next build`) without TypeScript or lint errors.
  - [x] Test admin UI interactions, modals, filters, and image rendering.

---

## 🛠️ Detailed Task Specifications

### Task 1: Sidebar Text Removal
* **Target File:** [`app/admin/layout.tsx`](file:///d:/07/ModeAI/citiply/app/admin/layout.tsx)
* **Description:**
  Remove the informational workspace text block situated above the "Sign out" button:
  ```tsx
  // REMOVE:
  <p className="text-xs uppercase tracking-[0.2em] text-white/35">Workspace</p>
  <p className="mt-2 text-sm text-white/72">Supabase connected dashboard for catalogue operations.</p>
  ```
* Keep the `<button onClick={signOut}>` with `<LogOut />` properly spaced and styled in the sidebar footer.

---

### Task 2: Product Form Cleanup
* **Target File:** [`components/admin/ProductForm.tsx`](file:///d:/07/ModeAI/citiply/components/admin/ProductForm.tsx)
* **Description:**
  1. Remove `color_tone` and `short_description` from:
     - `productSchema` (zod)
     - `getProductFormDefaults`
     - Form reset effect
  2. Remove `<Input label="Color tone" ... />` from the 3-column grid, making `Size` and `Quantity` a balanced 2-column layout (`sm:grid-cols-2`).
  3. Remove `<Textarea label="Short Description ..." ... />`.
  4. In `onSubmit`, clean up payload construction so it does not submit these removed fields or cause schema mismatches.

---

### Task 3: Zustand State Management
* **Dependencies:** `npm install zustand`
* **Stores to create under `lib/stores/`:**
  1. **`lib/stores/products-store.ts` (`useProductsStore`)**:
     - State: `products`, `collections`, `loading`, `error`, `search`, `collectionFilter`, `sortOption`, `selectedProduct`
     - Actions: `fetchProducts()`, `addProduct(payload)`, `updateProduct(id, payload)`, `deleteProduct(id)`, `bulkPublish(ids, isActive)`, `setSortOption(option)`, `setFilter(...)`
  2. **`lib/stores/categories-store.ts` (`useCategoriesStore`)**:
     - State: `categories`, `catalogues`, `loading`, `error`
     - Actions: `fetchCategories()`, `addCategory(payload)`, `updateCategory(id, payload)`, `deleteCategory(id)`
  3. **`lib/stores/collections-store.ts` (`useCollectionsStore`)**:
     - State: `collections`, `categories`, `loading`, `error`, `categoryFilter`
     - Actions: `fetchCollections()`, `addCollection(payload)`, `updateCollection(id, payload)`, `deleteCollection(id)`
  4. **`lib/stores/catalogues-store.ts` (`useCataloguesStore`)**:
     - State: `catalogues`, `loading`, `error`
     - Actions: `fetchCatalogues()`, `addCatalogue(payload)`, `updateCatalogue(id, payload)`, `deleteCatalogue(id)`
  5. **`lib/stores/enquiries-store.ts` (`useEnquiriesStore`)**:
     - State: `sessions`, `loading`, `error`, `search`, `statusFilter`
     - Actions: `fetchEnquiries()`, `updateStatus(id, status)`
* **Refactoring:**
  Connect the respective admin pages ([`app/admin/products/page.tsx`](file:///d:/07/ModeAI/citiply/app/admin/products/page.tsx), [`app/admin/categories/page.tsx`](file:///d:/07/ModeAI/citiply/app/admin/categories/page.tsx), [`app/admin/collections/page.tsx`](file:///d:/07/ModeAI/citiply/app/admin/collections/page.tsx), [`app/admin/catalogues/page.tsx`](file:///d:/07/ModeAI/citiply/app/admin/catalogues/page.tsx), [`app/admin/enquiries/page.tsx`](file:///d:/07/ModeAI/citiply/app/admin/enquiries/page.tsx)) to use these stores.

---

### Task 4: Filters & Sorting (Admin Products)
* **Target Files:**
  - [`app/admin/products/page.tsx`](file:///d:/07/ModeAI/citiply/app/admin/products/page.tsx)
  - [`lib/stores/products-store.ts`](file:///d:/07/ModeAI/citiply/lib/stores/products-store.ts)
  - [`app/api/admin/products/[id]/route.ts`](file:///d:/07/ModeAI/citiply/app/api/admin/products/%5Bid%5D/route.ts)
  - [`supabase/schema.sql`](file:///d:/07/ModeAI/citiply/supabase/schema.sql)
* **Sorting Options:**
  - **Recently Added**: `b.created_at - a.created_at`
  - **Recently Modified**: `(b.updated_at || b.created_at) - (a.updated_at || a.created_at)`
  - **Name: A → Z**: Alphabetical ascending by product name
  - **Name: Z → A**: Alphabetical descending by product name
* **UI Component:** Custom or standard styled `<select>` in the products toolbar alongside search and collection filter.

---

### Task 5: Product Details Modal
* **Target Files:**
  - New Component: `components/admin/ProductDetailsModal.tsx`
  - [`app/admin/products/page.tsx`](file:///d:/07/ModeAI/citiply/app/admin/products/page.tsx)
* **Features:**
  - Opens on clicking any product row in the Admin Products table.
  - Displays:
    - Product SKU badge & title
    - Active / Hidden badge
    - Large product image preview (and thumbnail strip if multiple images exist)
    - Metadata: Family / Category, Collection, Size, Quantity, Applications, Specs table
    - Timestamps: Created Date, Last Modified Date
  - Action footer buttons:
    - **Edit**: Closes details modal and opens `ProductForm` in edit mode.
    - **Delete**: Triggers deletion confirmation and removes the product.

---

### Task 6: Product Image Layout (New Products)
* **Target Files:**
  - [`scripts/seed-evergreen-new-photos.ts`](file:///d:/07/ModeAI/citiply/scripts/seed-evergreen-new-photos.ts)
  - New Script: `scripts/rotate-evergreen-images.ts`
* **Orientation Logic:**
  - Original image: Horizontal (Left = Faded finish, Right = Oiled finish).
  - Rotation: **90° clockwise** (`sharp.rotate(90)`).
  - Result: Vertical layout (**Top = Faded finish**, **Bottom = Oiled finish**), matching standard veneer card portrait aspect ratios (`4/5`).
* **Execution:** Re-upload processed WebP variants to S3 and update `product_images` in Supabase for the Evergreen series.
