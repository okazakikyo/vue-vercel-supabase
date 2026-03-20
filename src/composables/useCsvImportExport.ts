import type { OrderPayload, OrderRecord } from "@/lib/ordersService";

type MonthlySummary = Record<
  string,
  {
    total_final: number;
    total_discount: number;
    users: Array<{
      name: string;
      total_final: number;
      total_discount: number;
    }>;
  }
>;

type LongRow = {
  date: string;
  shop: string;
  url: string;
  totalBefore: number;
  totalAfter: number;
  userName: string;
  userPrice: number;
};

function escapeCsvCell(value: string | number) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function useCsvImportExport() {
  function parseCSV(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];

      if (inQuotes) {
        if (char === '"') {
          if (text[index + 1] === '"') {
            current += '"';
            index += 1;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(current.trim());
        current = "";
      } else if (char === "\n") {
        row.push(current.trim());
        rows.push(row);
        row = [];
        current = "";
      } else if (char !== "\r") {
        current += char;
      }
    }

    if (current || row.length > 0) {
      row.push(current.trim());
      rows.push(row);
    }

    return rows;
  }

  function parseCurrency(value: string) {
    const normalized = String(value ?? "").replace(/[^0-9-]/g, "");
    return normalized ? Number.parseInt(normalized, 10) : 0;
  }

  function parseDateCell(value: string) {
    if (!value) {
      return new Date().toISOString().slice(0, 10);
    }

    const trimmed = value.trim();
    const ddmmyyyy = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);

    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return `${year!}-${month!.padStart(2, "0")}-${day!.padStart(2, "0")}`;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    return new Date(trimmed).toISOString().slice(0, 10);
  }

  function parseLongFormat(rows: string[][]) {
    const header = rows[0]?.map((cell) => cell.trim());

    if (!header || header.length === 0) {
      return [];
    }

    const indexes = {
      date: header.findIndex((cell) => cell === "Date"),
      shop: header.findIndex((cell) => cell === "Shop"),
      url: header.findIndex((cell) => cell === "URL"),
      totalBefore: header.findIndex((cell) => cell === "TotalBefore"),
      totalAfter: header.findIndex((cell) => cell === "TotalAfter"),
      userName: header.findIndex((cell) => cell === "UserName"),
      userPrice: header.findIndex((cell) => cell === "UserPrice"),
    };

    const hasRequiredColumns = Object.values(indexes).every((index) => index >= 0);
    if (!hasRequiredColumns) {
      return [];
    }

    const grouped = new Map<string, OrderPayload>();

    rows.slice(1).forEach((row) => {
      const raw: LongRow = {
        date: parseDateCell(row[indexes.date] ?? ""),
        shop: row[indexes.shop] ?? "",
        url: row[indexes.url] ?? "",
        totalBefore: parseCurrency(row[indexes.totalBefore] ?? ""),
        totalAfter: parseCurrency(row[indexes.totalAfter] ?? ""),
        userName: row[indexes.userName] ?? "",
        userPrice: parseCurrency(row[indexes.userPrice] ?? ""),
      };

      if (!raw.date || !raw.shop) {
        return;
      }

      const key = [raw.date, raw.shop, raw.url, raw.totalBefore, raw.totalAfter].join("|");
      if (!grouped.has(key)) {
        grouped.set(key, {
          date: raw.date,
          shop: raw.shop,
          url: raw.url || null,
          total_before: raw.totalBefore,
          total_after: raw.totalAfter,
          users: [],
        });
      }

      if (raw.userName || raw.userPrice > 0) {
        grouped.get(key)?.users.push({
          name: raw.userName,
          price: raw.userPrice,
        });
      }
    });

    return Array.from(grouped.values()).filter((order) => order.users.length > 0);
  }

  function parseWideFormat(rows: string[][]) {
    const headerIndex = rows.findIndex((row) => (row[0] || "") === "Date");
    if (headerIndex === -1) {
      throw new Error('Header "Date" not found');
    }

    const header = rows[headerIndex] ?? [];
    const beforeIndex = header.findIndex((cell) => cell.includes("Before"));
    const afterIndex = header.findIndex((cell) => cell.includes("After"));
    const userStart = Math.max(afterIndex + 1, 5);
    const userNames = header.slice(userStart).filter(Boolean);

    return rows
      .slice(headerIndex + 1)
      .filter((row) => row[0])
      .map((row) => ({
        date: parseDateCell(row[0] ?? ""),
        shop: row[1] ?? "",
        url: row[2] ?? "",
        total_before: beforeIndex >= 0 ? parseCurrency(row[beforeIndex] ?? "") : 0,
        total_after: afterIndex >= 0 ? parseCurrency(row[afterIndex] ?? "") : 0,
        users: userNames
          .map((name, index) => ({
            name,
            price: parseCurrency(row[userStart + index] ?? ""),
          }))
          .filter((user) => user.price > 0),
      }))
      .filter((order) => order.shop && order.users.length > 0);
  }

  function importFromCsvText(text: string) {
    const rows = parseCSV(text);
    if (rows.length === 0) {
      throw new Error("CSV is empty");
    }

    const orders = parseLongFormat(rows);
    const normalizedOrders = orders.length > 0 ? orders : parseWideFormat(rows);

    return {
      orders: normalizedOrders,
      added: normalizedOrders.length,
    };
  }

  function formatMoney(value: number | undefined) {
    if (value === null || value === undefined) {
      return "0";
    }

    return new Intl.NumberFormat("vi-VN").format(value);
  }

  function formatDate(value?: string) {
    if (!value) {
      return "-";
    }

    try {
      return new Date(value).toLocaleDateString("vi-VN");
    } catch {
      return value;
    }
  }

  function formatMonthKey(value: string) {
    const [year, month] = value.split("-");
    return `Thang ${Number(month)} / ${year}`;
  }

  function exportOrdersToCSV(orders: OrderRecord[]) {
    const rows: Array<Array<string | number>> = [
      [
        "Date",
        "Shop",
        "URL",
        "TotalBefore",
        "TotalAfter",
        "UserName",
        "UserPrice",
        "UserDiscount",
        "UserFinal",
      ],
    ];

    orders.forEach((order) => {
      order.users.forEach((user) => {
        rows.push([
          order.date,
          order.shop,
          order.url ?? "",
          order.total_before,
          order.total_after,
          user.name,
          user.price,
          user.discount,
          user.final,
        ]);
      });
    });

    return rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(",")).join("\n");
  }

  function exportMonthlySummaryToCSV(monthly: MonthlySummary) {
    const rows: Array<Array<string | number>> = [
      ["Month", "TotalFinal", "TotalDiscount", "UserName", "UserFinal", "UserDiscount"],
    ];

    Object.entries(monthly).forEach(([month, data]) => {
      data.users.forEach((user) => {
        rows.push([
          month,
          data.total_final,
          data.total_discount,
          user.name,
          user.total_final,
          user.total_discount,
        ]);
      });
    });

    return rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(",")).join("\n");
  }

  return {
    parseCSV,
    parseCurrency,
    parseDateCell,
    importFromCsvText,
    formatMoney,
    formatDate,
    formatMonthKey,
    exportOrdersToCSV,
    exportMonthlySummaryToCSV,
  };
}
