<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";

import { useCsvImportExport } from "@/composables/useCsvImportExport";
import { useOrders } from "@/composables/useOrders";
import type { OrderPayload, OrderRecord, OrderUserInput } from "@/lib/ordersService";

type MonthlySummaryEntry = {
  total_final: number;
  total_discount: number;
  users: Array<{ name: string; total_final: number; total_discount: number }>;
};

const {
  orders,
  loading,
  saving,
  error,
  filterDates,
  filteredOrders,
  selectedOrderIds,
  isAllSelected,
  isSomeSelected,
  loadOrders,
  addOrder,
  updateOrderData,
  deleteOrderData,
  deleteMultipleOrders,
  importOrderBatch,
  toggleSelect,
  toggleSelectAll,
  clearSelection,
} = useOrders();

const {
  importFromCsvText,
  formatMoney,
  formatDate,
  formatMonthKey,
  exportOrdersToCSV,
  exportMonthlySummaryToCSV,
} = useCsvImportExport();

type FormState = {
  date: string;
  shop: string;
  url: string;
  total_before: number;
  total_after: number;
  users: OrderUserInput[];
};

const tab = ref<"add" | "list" | "summary">("add");
const selectMode = ref(false);
const editingId = ref<string | null>(null);

function createEmptyForm(): FormState {
  return {
    date: new Date().toISOString().slice(0, 10),
    shop: "",
    url: "",
    total_before: 0,
    total_after: 0,
    users: [{ name: "", price: 0 }],
  };
}

const form = reactive<FormState>(createEmptyForm());
const editForm = reactive<FormState>(createEmptyForm());

const monthly = computed(() => {
  const map: Record<
    string,
    {
      total_final: number;
      total_discount: number;
      users: Record<string, { name: string; total_final: number; total_discount: number }>;
    }
  > = {};

  orders.value.forEach((order) => {
    const date = new Date(`${order.date}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return;
    }

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!map[key]) {
      map[key] = {
        total_final: 0,
        total_discount: 0,
        users: {},
      };
    }

    order.users.forEach((user) => {
      const bucket = map[key]!;
      bucket.total_final += Number(user.final) || 0;
      bucket.total_discount += Number(user.discount) || 0;

      if (!bucket.users[user.name]) {
        bucket.users[user.name] = {
          name: user.name,
          total_final: 0,
          total_discount: 0,
        };
      }

      bucket.users[user.name]!.total_final += Number(user.final) || 0;
      bucket.users[user.name]!.total_discount += Number(user.discount) || 0;
    });
  });

  return Object.keys(map)
    .sort()
    .reverse()
    .reduce<Record<string, MonthlySummaryEntry>>(
      (result, key) => {
        const bucket = map[key]!;
        result[key] = {
          total_final: bucket.total_final,
          total_discount: bucket.total_discount,
          users: Object.values(bucket.users).sort((left, right) => left.name.localeCompare(right.name, "vi")),
        };
        return result;
      },
      {},
    );
});

const selectedMonth = ref("");
const monthOptions = computed(() => Object.keys(monthly.value));
const displayedMonthly = computed(() => {
  if (!selectedMonth.value) {
    return monthly.value;
  }

  const selectedEntry = monthly.value[selectedMonth.value];
  return selectedEntry ? { [selectedMonth.value]: selectedEntry } : {};
});

const displayedMonthlyEntries = computed<[string, MonthlySummaryEntry][]>(() =>
  Object.entries(displayedMonthly.value) as [string, MonthlySummaryEntry][],
);

function resetFormState(target: FormState) {
  Object.assign(target, createEmptyForm());
}

function addUser(target: FormState) {
  target.users.push({ name: "", price: 0 });
}

function removeUser(target: FormState, index: number) {
  if (target.users.length === 1) {
    target.users[0] = { name: "", price: 0 };
    return;
  }

  target.users.splice(index, 1);
}

function toPayload(target: FormState): OrderPayload {
  return {
    date: target.date,
    shop: target.shop,
    url: target.url || null,
    total_before: Number(target.total_before) || 0,
    total_after: Number(target.total_after) || 0,
    users: target.users.map((user) => ({
      name: user.name,
      price: Number(user.price) || 0,
    })),
  };
}

function startCreate() {
  editingId.value = null;
  resetFormState(form);
  tab.value = "add";
}

function startEdit(order: OrderRecord) {
  if (selectMode.value) {
    return;
  }

  editingId.value = order.id;
  Object.assign(editForm, {
    date: order.date,
    shop: order.shop,
    url: order.url ?? "",
    total_before: order.total_before,
    total_after: order.total_after,
    users: order.users.map((user) => ({
      name: user.name,
      price: user.price,
    })),
  });
}

function cancelEdit() {
  editingId.value = null;
  resetFormState(editForm);
}

async function submitCreate() {
  const created = await addOrder(toPayload(form));
  if (!created) {
    return;
  }

  resetFormState(form);
  tab.value = "list";
}

async function saveEdit(orderId: string) {
  const updated = await updateOrderData(orderId, toPayload(editForm));
  if (!updated) {
    return;
  }

  cancelEdit();
}

async function handleDelete(orderId: string, shop: string) {
  if (!window.confirm(`Xoa don "${shop || formatDate(orderId)}"?`)) {
    return;
  }

  await deleteOrderData(orderId);
}

function toggleSelectMode() {
  selectMode.value = !selectMode.value;
  clearSelection();

  if (selectMode.value && editingId.value) {
    cancelEdit();
  }
}

async function handleDeleteSelected() {
  if (selectedOrderIds.value.size === 0) {
    return;
  }

  if (!window.confirm(`Xoa ${selectedOrderIds.value.size} don da chon?`)) {
    return;
  }

  const success = await deleteMultipleOrders(Array.from(selectedOrderIds.value));
  if (success) {
    selectMode.value = false;
    clearSelection();
  }
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const { orders: importedOrders, added } = importFromCsvText(text);
    const inserted = await importOrderBatch(importedOrders);
    window.alert(`Import hoan tat. Doc ${added} don, luu thanh cong ${inserted} don.`);
  } catch (err) {
    window.alert(err instanceof Error ? err.message : "Import CSV that bai.");
  } finally {
    input.value = "";
  }
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportOrders() {
  downloadCsv(exportOrdersToCSV(filteredOrders.value), "meal_orders.csv");
}

function exportSummary() {
  downloadCsv(exportMonthlySummaryToCSV(displayedMonthly.value), "summary.csv");
}

watch(filteredOrders, (nextOrders) => {
  if (!selectMode.value) {
    return;
  }

  const visibleIds = new Set(nextOrders.map((order) => order.id));
  selectedOrderIds.value = new Set(
    Array.from(selectedOrderIds.value).filter((orderId) => visibleIds.has(orderId)),
  );

  if (editingId.value && !visibleIds.has(editingId.value)) {
    cancelEdit();
  }
});

onMounted(() => {
  loadOrders();
});
</script>

<template>
  <div class="orders-page">
    <header class="hero">
      <div class="hero__title-wrap">
        <h1><span class="hero__dot"></span>Quản lý orders chung cho người dùng</h1>
        <p class="hero__copy">Tạo order, import CSV, chọn nhiều để xoá và xem tổng hợp theo tháng từ dữ liệu Supabase.</p>
      </div>
      <div class="hero__badge">{{ orders.length }} don</div>
    </header>

    <div class="tabs">
      <button class="tab" :class="{ 'tab--active': tab === 'add' }" type="button" @click="tab = 'add'">Them don</button>
      <button class="tab" :class="{ 'tab--active': tab === 'list' }" type="button" @click="tab = 'list'">Danh sach</button>
      <button class="tab" :class="{ 'tab--active': tab === 'summary' }" type="button" @click="tab = 'summary'">Thong ke</button>
    </div>

    <section v-show="tab === 'add'" class="panel">
      <div class="import-banner">
        <div class="import-banner__icon">+</div>
        <div>
          <h2>Import CSV</h2>
          <p>Ho tro ca format CSV dang rong hien tai va format moi dong mot user tu file mau.</p>
        </div>
        <label class="button button--ghost file-button">
          Chon file
          <input type="file" accept=".csv,text/csv" @change="handleFileUpload" />
        </label>
      </div>

      <div class="section-title">
        <span>Thong tin don hang</span>
      </div>

      <div class="section-head">
        <button class="button button--ghost" type="button" @click="startCreate">Reset</button>
      </div>

      <div class="form-grid">
        <label class="field">
          <span>Ngay dat</span>
          <input v-model="form.date" type="date" />
        </label>
        <label class="field field--span-2">
          <span>Ten quan</span>
          <input v-model="form.shop" type="text" placeholder="Vi du: Cf Meraki" />
        </label>
        <label class="field field--span-2">
          <span>URL</span>
          <input v-model="form.url" type="text" placeholder="https://..." />
        </label>
        <label class="field">
          <span>Tong chua giam</span>
          <input v-model.number="form.total_before" type="number" min="0" step="1000" />
        </label>
        <label class="field">
          <span>Tong da giam</span>
          <input v-model.number="form.total_after" type="number" min="0" step="1000" />
        </label>
      </div>

      <div class="section-title">
        <span>Nguoi trong don</span>
      </div>

      <div class="section-head">
        <button class="button button--soft" type="button" @click="addUser(form)">Them nguoi</button>
      </div>

      <div class="user-list">
        <div v-for="(user, index) in form.users" :key="`form-${index}`" class="user-row">
          <input v-model="user.name" type="text" placeholder="Ten nguoi" />
          <input v-model.number="user.price" type="number" min="0" step="1000" placeholder="Gia" />
          <button class="button button--danger-soft" type="button" @click="removeUser(form, index)">Xoa</button>
        </div>
      </div>

      <div class="actions">
        <button class="button button--primary" type="button" :disabled="saving" @click="submitCreate">
          {{ saving ? 'Dang luu...' : 'Tao don' }}
        </button>
      </div>
    </section>

    <section v-show="tab === 'list'" class="panel">
      <div class="toolbar toolbar--list">
        <div class="section-title section-title--inline">
          <span>Danh sach don hang</span>
        </div>
        <div class="toolbar__controls">
          <div class="filter-pill">
            <span class="filter-pill__label">Tu</span>
            <input v-model="filterDates.from" class="filter-pill__input" type="date" />
            <span class="filter-pill__sep"></span>
            <span class="filter-pill__label">Den</span>
            <input v-model="filterDates.to" class="filter-pill__input" type="date" />
          </div>
          <button class="button button--ghost" type="button" @click="loadOrders">Tai lai</button>
          <button v-if="filteredOrders.length > 0" class="button button--ghost" type="button" @click="exportOrders">
            Xuat CSV
          </button>
          <button v-if="filteredOrders.length > 0" class="button button--ghost" type="button" @click="toggleSelectMode">
            {{ selectMode ? 'Huy chon' : 'Chon de xoa' }}
          </button>
        </div>
      </div>

      <div v-if="selectMode" class="bulk-bar" :class="{ 'bulk-bar--danger': selectedOrderIds.size > 0 }">
        <span>{{ selectedOrderIds.size > 0 ? `Da chon ${selectedOrderIds.size} don` : 'Tich vao don muon xoa' }}</span>
        <label class="check-wrap">
          <input
            type="checkbox"
            :checked="isAllSelected"
            :indeterminate.prop="isSomeSelected && !isAllSelected"
            @change="toggleSelectAll"
          />
          Chon tat ca
        </label>
        <button
          v-if="selectedOrderIds.size > 0"
          class="button button--danger"
          type="button"
          @click="handleDeleteSelected"
        >
          Xoa da chon
        </button>
      </div>

      <div v-if="loading" class="empty-state">Dang tai du lieu...</div>
      <div v-else-if="filteredOrders.length === 0" class="empty-state">Chua co don nao trong khoang loc nay.</div>
      <div v-else class="order-list">
        <article
          v-for="order in filteredOrders"
          :key="order.id"
          class="order-card"
          :class="{ 'order-card--selected': selectedOrderIds.has(order.id) }"
        >
          <div class="order-card__header">
            <div class="order-card__meta-wrap">
              <label v-if="selectMode" class="check-wrap">
                <input
                  type="checkbox"
                  :checked="selectedOrderIds.has(order.id)"
                  @change="toggleSelect(order.id)"
                />
              </label>
              <div class="order-card__meta">
                <h3 class="order-card__shop">{{ order.shop || '-' }}</h3>
                <p class="order-card__subline">
                  <span>{{ formatDate(order.date) }}</span>
                  <span v-if="order.url">·</span>
                  <a v-if="order.url" :href="order.url" target="_blank" rel="noreferrer">Link</a>
                </p>
              </div>
            </div>

            <div class="order-card__actions">
              <span class="tag tag--before">{{ formatMoney(order.total_before) }}</span>
              <span class="tag tag--after">{{ formatMoney(order.total_after) }}</span>
              <template v-if="!selectMode">
                <button class="button button--warning" type="button" @click="startEdit(order)">Sua</button>
                <button class="button button--danger" type="button" @click="handleDelete(order.id, order.shop)">Xoa</button>
              </template>
            </div>
          </div>

          <div v-if="editingId !== order.id" class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nguoi</th>
                  <th>Gia goc</th>
                  <th>Giam</th>
                  <th>Gia sau</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in order.users" :key="`${order.id}-${user.name}`">
                  <td>{{ user.name }}</td>
                  <td><span class="money">{{ formatMoney(user.price) }}</span></td>
                  <td><span class="money money--discount">{{ formatMoney(user.discount) }}</span></td>
                  <td><span class="money money--final">{{ formatMoney(user.final) }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="edit-panel">
            <div class="form-grid">
              <label class="field">
                <span>Ngay dat</span>
                <input v-model="editForm.date" type="date" />
              </label>
              <label class="field field--span-2">
                <span>Ten quan</span>
                <input v-model="editForm.shop" type="text" />
              </label>
              <label class="field field--span-2">
                <span>URL</span>
                <input v-model="editForm.url" type="text" />
              </label>
              <label class="field">
                <span>Tong chua giam</span>
                <input v-model.number="editForm.total_before" type="number" min="0" step="1000" />
              </label>
              <label class="field">
                <span>Tong da giam</span>
                <input v-model.number="editForm.total_after" type="number" min="0" step="1000" />
              </label>
            </div>

            <div class="section-title section-title--compact">
              <span>Nguoi trong don</span>
            </div>

            <div class="section-head">
              <button class="button button--soft" type="button" @click="addUser(editForm)">Them nguoi</button>
            </div>

            <div class="user-list">
              <div v-for="(user, index) in editForm.users" :key="`edit-${index}`" class="user-row">
                <input v-model="user.name" type="text" placeholder="Ten nguoi" />
                <input v-model.number="user.price" type="number" min="0" step="1000" placeholder="Gia" />
                <button class="button button--danger-soft" type="button" @click="removeUser(editForm, index)">Xoa</button>
              </div>
            </div>

            <div class="actions">
              <button class="button button--warning" type="button" :disabled="saving" @click="saveEdit(order.id)">
                {{ saving ? 'Dang luu...' : 'Luu thay doi' }}
              </button>
              <button class="button button--ghost" type="button" @click="cancelEdit">Huy</button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section v-show="tab === 'summary'" class="panel">
      <div class="toolbar toolbar--summary">
        <div class="section-title section-title--inline">
          <span>Tong hop theo thang</span>
        </div>
        <div class="toolbar__controls">
          <select v-model="selectedMonth" class="select styled-select">
            <option value="">Tat ca thang</option>
            <option v-for="month in monthOptions" :key="month" :value="month">{{ formatMonthKey(month) }}</option>
          </select>
          <button
            v-if="Object.keys(displayedMonthly).length > 0"
            class="button button--ghost"
            type="button"
            @click="exportSummary"
          >
            Xuat CSV
          </button>
        </div>
      </div>

      <div v-if="displayedMonthlyEntries.length === 0" class="empty-state">Chua co du lieu de thong ke.</div>
      <div v-else class="summary-grid">
        <article v-for="[monthKey, entry] in displayedMonthlyEntries" :key="monthKey" class="summary-card">
          <h3 class="summary-card__month">{{ formatMonthKey(monthKey) }}</h3>
          <div class="summary-stats">
            <div class="summary-stat">
              <span class="summary-label">Da thanh toan</span>
              <strong class="summary-value summary-value--accent">{{ formatMoney(entry.total_final) }}</strong>
            </div>
            <div class="summary-stat">
              <span class="summary-label">Tiet kiem</span>
              <strong class="summary-value summary-value--danger">{{ formatMoney(entry.total_discount) }}</strong>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nguoi</th>
                  <th>Da tra</th>
                  <th>Giam</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in entry.users" :key="`${monthKey}-${user.name}`">
                  <td>{{ user.name }}</td>
                  <td><span class="money money--final">{{ formatMoney(user.total_final) }}</span></td>
                  <td><span class="money money--discount">{{ formatMoney(user.total_discount) }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>

    <p v-if="error" class="error-banner">{{ error }}</p>
  </div>
</template>

<style scoped>
.orders-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: "Sora", "Space Grotesk", sans-serif;
  --orders-surface: #131828;
  --orders-surface-2: #1a2035;
  --orders-border: rgba(255, 255, 255, 0.07);
  --orders-border-hover: rgba(255, 255, 255, 0.14);
  --orders-accent: #38e8c6;
  --orders-accent-2: #6c8ef7;
  --orders-accent-glow: rgba(56, 232, 198, 0.15);
  --orders-text: #e8edf8;
  --orders-muted: #6b7799;
  --orders-danger: #f16c7a;
  --orders-warning: #f8a94b;
}

.hero,
.panel {
  border: 1px solid var(--orders-border);
  border-radius: 16px;
  background: var(--orders-surface);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.24);
  color: var(--orders-text);
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 32px;
  align-items: flex-start;
  background: linear-gradient(135deg, #0d1520, #161e35);
}

.hero__title-wrap {
  min-width: 0;
}

.hero h1 {
  margin: 0;
  font-size: clamp(15px, 3vw, 21px);
  font-weight: 700;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 10px;
}

.hero__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--orders-accent);
  box-shadow: 0 0 10px var(--orders-accent);
  display: inline-block;
  flex-shrink: 0;
}

.hero__copy {
  margin: 16px 0 0;
  max-width: 640px;
  color: var(--orders-muted);
  font-size: 13px;
  line-height: 1.7;
}

.hero__badge {
  font-size: 11px;
  font-family: "IBM Plex Mono", monospace;
  background: var(--orders-accent-glow);
  color: var(--orders-accent);
  border: 1px solid rgba(56, 232, 198, 0.25);
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 500;
  white-space: nowrap;
}

.tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  background: var(--orders-surface-2);
  border: 1px solid var(--orders-border);
  border-radius: 14px;
  padding: 8px;
}

.tab {
  flex: 1;
  min-width: 110px;
  border: none;
  background: transparent;
  color: var(--orders-muted);
  border-radius: 10px;
  padding: 11px 16px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.tab--active {
  background: var(--orders-surface);
  color: var(--orders-accent);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.panel {
  padding: 30px;
}

.import-banner,
.toolbar,
.section-head,
.order-card__header,
.order-card__actions,
.actions,
.summary-stats {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.import-banner {
  margin-bottom: 30px;
  padding: 20px 22px;
  border: 1px dashed rgba(56, 232, 198, 0.2);
  border-radius: 16px;
  background: rgba(56, 232, 198, 0.03);
}

.import-banner__icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--orders-accent-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--orders-accent);
  flex-shrink: 0;
}

.import-banner h2,
.order-card h3 {
  margin: 0;
  font-size: 15px;
}

.import-banner p {
  margin: 6px 0 0;
  color: var(--orders-muted);
  font-size: 12px;
  line-height: 1.7;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--orders-muted);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--orders-border);
}

.section-title--inline {
  margin-bottom: 0;
  flex: 1;
  min-width: 130px;
}

.section-title--compact {
  margin-top: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 18px;
  margin-bottom: 26px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field--span-2 {
  grid-column: span 2;
}

.field span,
.summary-label {
  color: var(--orders-muted);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.field input,
.user-row input,
.select,
.edit-panel input {
  border: 1px solid var(--orders-border);
  border-radius: 8px;
  background: #0c0f1a;
  color: var(--orders-text);
  padding: 10px 14px;
  width: 100%;
  font-family: inherit;
}

.field input:focus,
.user-row input:focus,
.select:focus,
.edit-panel input:focus {
  outline: none;
  border-color: rgba(56, 232, 198, 0.45);
  box-shadow: 0 0 0 3px var(--orders-accent-glow);
}

.user-list,
.order-list,
.summary-grid {
  display: grid;
  gap: 20px;
}

.user-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr auto;
  gap: 12px;
  align-items: center;
  background: #0c0f1a;
  border: 1px solid var(--orders-border);
  border-radius: 14px;
  padding: 14px 16px;
  transition: border-color 0.2s;
}

.user-row:hover {
  border-color: var(--orders-border-hover);
}

.user-row input {
  background: transparent;
  border-radius: 6px;
  padding: 8px 12px;
}

.user-row input::placeholder {
  color: #3d4a6b;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  font-size: 13px;
  transition: all 0.15s;
}

.button--primary {
  background: var(--orders-accent);
  color: #0c0f1a;
}

.button--warning {
  background: var(--orders-warning);
  color: #0c0f1a;
}

.button--ghost,
.button--soft {
  background: transparent;
  color: var(--orders-muted);
  border: 1px solid var(--orders-border);
}

.button--soft {
  background: var(--orders-surface-2);
  color: var(--orders-accent);
  border: 1px dashed rgba(56, 232, 198, 0.3);
}

.button--danger,
.button--danger-soft {
  color: var(--orders-danger);
  border: 1px solid rgba(241, 108, 122, 0.25);
  background: transparent;
}

.file-button {
  position: relative;
  overflow: hidden;
}

.file-button input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.toolbar__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.filter-pill {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--orders-surface-2);
  border: 1px solid var(--orders-border);
  border-radius: 10px;
  overflow: hidden;
}

.filter-pill:focus-within {
  border-color: rgba(56, 232, 198, 0.4);
  box-shadow: 0 0 0 3px var(--orders-accent-glow);
}

.filter-pill__label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--orders-muted);
  padding: 0 10px;
  white-space: nowrap;
}

.filter-pill__sep {
  width: 1px;
  height: 28px;
  background: var(--orders-border);
  flex-shrink: 0;
}

.filter-pill__input {
  border: none;
  background: transparent;
  outline: none;
  color: var(--orders-text);
  font-size: 12px;
  font-weight: 500;
  padding: 7px 10px;
  min-width: 110px;
  cursor: pointer;
  -webkit-appearance: none;
}

.bulk-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 22px;
  padding: 16px 18px;
  border-radius: 14px;
  background: rgba(108, 142, 247, 0.07);
  border: 1px solid rgba(108, 142, 247, 0.25);
  animation: slideIn 0.18s ease;
}

.bulk-bar--danger {
  background: rgba(241, 108, 122, 0.07);
  border-color: rgba(241, 108, 122, 0.25);
}

.bulk-bar span {
  color: var(--orders-accent-2);
  font-weight: 600;
  font-size: 13px;
  flex: 1;
}

.bulk-bar--danger span {
  color: var(--orders-danger);
}

.check-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--orders-muted);
  cursor: pointer;
}

.check-wrap input[type="checkbox"] {
  width: 17px;
  height: 17px;
  border-radius: 5px;
  border: 1.5px solid var(--orders-border-hover);
  background: #0c0f1a;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
  position: relative;
}

.check-wrap input[type="checkbox"]:checked {
  background: var(--orders-accent);
  border-color: var(--orders-accent);
}

.check-wrap input[type="checkbox"]:checked::after {
  content: "";
  position: absolute;
  left: 4px;
  top: 2px;
  width: 5px;
  height: 8px;
  border: 2px solid #0c0f1a;
  border-top: none;
  border-left: none;
  transform: rotate(45deg);
}

.order-card {
  background: var(--orders-surface-2);
  border: 1px solid var(--orders-border);
  border-radius: 16px;
  padding: 22px;
  transition: all 0.2s;
}

.order-card:hover {
  border-color: var(--orders-border-hover);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.order-card--selected {
  border-color: rgba(241, 108, 122, 0.4);
  background: rgba(241, 108, 122, 0.04);
}

.order-card__header {
  align-items: flex-start;
  margin-bottom: 16px;
}

.order-card__meta-wrap {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.order-card__meta {
  min-width: 0;
}

.order-card__shop {
  font-size: 15px;
  font-weight: 600;
  color: var(--orders-text);
  margin-bottom: 3px;
}

.order-card__subline {
  margin: 0;
  color: var(--orders-muted);
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  font-family: "IBM Plex Mono", monospace;
  line-height: 1.6;
}

.order-card__meta a {
  color: var(--orders-accent-2);
}

.tag {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 20px;
  font-family: "IBM Plex Mono", monospace;
  font-weight: 500;
}

.order-card__actions {
  flex-shrink: 0;
}

.tag--before {
  background: rgba(107, 135, 255, 0.1);
  color: var(--orders-accent-2);
  border: 1px solid rgba(107, 135, 255, 0.2);
  text-decoration: line-through;
  opacity: 0.7;
}

.tag--after {
  background: var(--orders-accent-glow);
  color: var(--orders-accent);
  border: 1px solid rgba(56, 232, 198, 0.25);
}

.table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 340px;
}

thead th {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--orders-muted);
  padding: 7px 12px;
  text-align: left;
  border-bottom: 1px solid var(--orders-border);
}

tbody tr {
  transition: background 0.15s;
}

tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

tbody td {
  padding: 11px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

tbody tr:last-child td {
  border-bottom: none;
}

.money {
  font-family: "IBM Plex Mono", monospace;
  font-size: 12px;
  font-weight: 500;
}

.money--discount {
  color: var(--orders-danger);
}

.money--final {
  color: var(--orders-accent);
}

.edit-panel {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--orders-border);
  animation: slideIn 0.18s ease;
}

.summary-grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.summary-card {
  background: var(--orders-surface-2);
  border: 1px solid var(--orders-border);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.2s;
}

.summary-card:hover {
  border-color: rgba(56, 232, 198, 0.2);
  box-shadow: 0 0 20px rgba(56, 232, 198, 0.05);
}

.summary-card__month {
  font-family: "IBM Plex Mono", monospace;
  font-size: 17px;
  font-weight: 500;
  color: var(--orders-accent);
  margin: 0 0 16px;
}

.summary-stat {
  flex: 1;
  min-width: 100px;
}

.summary-label {
  display: block;
  margin-bottom: 6px;
}

.summary-value {
  font-family: "IBM Plex Mono", monospace;
  font-size: 15px;
  font-weight: 600;
}

.summary-value--accent {
  color: var(--orders-accent);
}

.summary-value--danger {
  color: var(--orders-danger);
  font-size: 13px;
}

.styled-select {
  appearance: none;
  -webkit-appearance: none;
  background-color: var(--orders-surface-2);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b7799'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  border: 1px solid var(--orders-border);
  color: var(--orders-text);
  font-size: 12px;
  font-weight: 500;
  padding: 8px 34px 8px 12px;
  min-width: 150px;
}

.empty-state {
  text-align: center;
  padding: 58px 24px;
  color: var(--orders-muted);
}

.error-banner {
  border-radius: 10px;
  padding: 14px 18px;
  background: rgba(241, 108, 122, 0.07);
  border: 1px solid rgba(241, 108, 122, 0.25);
  color: var(--orders-danger);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .field--span-2 {
    grid-column: auto;
  }
}

@media (max-width: 720px) {
  .hero {
    flex-direction: column;
    padding: 24px 22px;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .section-title--inline {
    width: 100%;
  }

  .filter-pill {
    width: 100%;
  }

  .filter-pill__input {
    flex: 1;
    min-width: 0;
  }

  .order-card__header {
    flex-direction: column;
    gap: 10px;
  }

  .order-card__actions {
    width: 100%;
    justify-content: flex-end;
  }

  .toolbar__controls > * {
    width: 100%;
  }

  .button {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .panel {
    padding: 22px 18px;
  }

  .user-row {
    grid-template-columns: 1fr 1fr;
  }

  .user-row .button--danger-soft {
    grid-column: 1 / -1;
  }
}

@media (max-width: 420px) {
  .hero {
    padding: 22px 18px;
  }

  .tabs {
    flex-direction: column;
  }

  .tab {
    width: 100%;
  }

  .user-row,
  .filter-pill {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: stretch;
  }

  .filter-pill__sep {
    width: 100%;
    height: 1px;
  }
}
</style>
