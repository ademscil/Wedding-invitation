import Papa from 'papaparse';
import QRCode from 'qrcode';

export interface GuestRow {
  name: string;
  phone?: string;
  email?: string;
  groupName?: string;
}

/**
 * Column headings we accept, by the field they fill.
 *
 * Compared after stripping case, spaces, underscores and punctuation, because
 * a customer's spreadsheet says "No HP", "no_hp" or "NOMOR HP" depending on
 * who typed it. Matching literally meant a heading of "Nama" worked while
 * "NAMA" imported nobody and reported no error at all.
 */
const HEADER_ALIASES: Record<keyof GuestRow, string[]> = {
  name: ['nama', 'name', 'namatamu', 'guestname', 'namalengkap'],
  phone: ['nohp', 'phone', 'nomorhp', 'nomor', 'telepon', 'telp', 'hp', 'whatsapp', 'wa'],
  email: ['email', 'surel', 'alamatemail'],
  groupName: ['grup', 'group', 'kategori', 'kelompok', 'golongan'],
};

function canonicalHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Maps one spreadsheet row onto a guest, whatever its headings look like. */
function toGuestRow(row: Record<string, unknown>): GuestRow {
  const byCanonical = new Map<string, string>();

  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined) continue;
    // A blank heading produces an empty key; keep the first non-empty value.
    const canonical = canonicalHeader(key);
    if (canonical === '' || byCanonical.has(canonical)) continue;
    byCanonical.set(canonical, String(value).trim());
  }

  const pick = (field: keyof GuestRow): string => {
    for (const alias of HEADER_ALIASES[field]) {
      const value = byCanonical.get(alias);
      if (value) return value;
    }
    return '';
  };

  return {
    name: pick('name'),
    phone: pick('phone'),
    email: pick('email'),
    groupName: pick('groupName'),
  };
}

function toGuestRows(rows: Record<string, unknown>[]): GuestRow[] {
  return rows.map(toGuestRow).filter((row) => row.name.trim() !== '');
}

// Parse CSV/Excel file into guest rows
export function parseGuestFile(file: File): Promise<GuestRow[]> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => resolve(toGuestRows(result.data)),
        error: reject,
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const ExcelJS = await import('exceljs');
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);
          const worksheet = workbook.worksheets[0];
          if (!worksheet) {
            resolve([]);
            return;
          }

          const headers: Record<number, string> = {};
          const headerRow = worksheet.getRow(1);
          headerRow.eachCell((cell, colNumber) => {
            headers[colNumber] = String(cell.text ?? cell.value ?? '').trim();
          });

          const json: Record<string, unknown>[] = [];
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const rowData: Record<string, unknown> = {};
            row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
              const header = headers[colNumber];
              if (header) {
                rowData[header] = cell.text ?? cell.value ?? '';
              }
            });
            json.push(rowData);
          });

          resolve(toGuestRows(json));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () =>
        reject(new Error('Gagal membaca file. Coba simpan ulang sebagai .xlsx atau .csv'));
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('Format file tidak didukung. Gunakan CSV atau Excel (.xlsx)'));
    }
  });
}

// Export guests to CSV file and trigger download
export function exportGuestsToCsv(
  guests: Array<{
    name: string;
    phone: string | null;
    email: string | null;
    groupName: string | null;
    rsvpStatus: string;
    rsvpGuestCount: number | null;
    personalLink: string;
    linkOpenedAt: Date | null;
    checkedIn: boolean;
  }>,
  filename = 'tamu.csv'
) {
  const rows = guests.map((g) => ({
    Nama: g.name,
    'No HP': g.phone || '',
    Email: g.email || '',
    Grup: g.groupName || '',
    'Status RSVP': g.rsvpStatus,
    'Jumlah Tamu': g.rsvpGuestCount || 1,
    'Link Personal': g.personalLink,
    'Buka Link': g.linkOpenedAt ? 'Ya' : 'Tidak',
    'Check-in': g.checkedIn ? 'Ya' : 'Tidak',
  }));
  const csv = Papa.unparse(rows);
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

// Export guests to Excel file and trigger download
export async function exportGuestsToExcel(
  guests: Array<{
    name: string;
    phone: string | null;
    email: string | null;
    groupName: string | null;
    rsvpStatus: string;
    rsvpGuestCount: number | null;
    personalLink: string;
    linkOpenedAt: Date | null;
    checkedIn: boolean;
  }>,
  filename = 'tamu.xlsx'
) {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Tamu');

  worksheet.columns = [
    { header: 'Nama', key: 'name', width: 25 },
    { header: 'No HP', key: 'phone', width: 18 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Grup', key: 'groupName', width: 15 },
    { header: 'Status RSVP', key: 'rsvpStatus', width: 15 },
    { header: 'Jumlah Tamu', key: 'rsvpGuestCount', width: 12 },
    { header: 'Link Personal', key: 'personalLink', width: 20 },
    { header: 'Buka Link', key: 'linkOpened', width: 12 },
    { header: 'Check-in', key: 'checkedIn', width: 12 },
  ];

  for (const g of guests) {
    worksheet.addRow({
      name: g.name,
      phone: g.phone || '',
      email: g.email || '',
      groupName: g.groupName || '',
      rsvpStatus: g.rsvpStatus,
      rsvpGuestCount: g.rsvpGuestCount || 1,
      personalLink: g.personalLink,
      linkOpened: g.linkOpenedAt ? 'Ya' : 'Tidak',
      checkedIn: g.checkedIn ? 'Ya' : 'Tidak',
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadFile(blob, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

/**
 * Canonical personalised invitation URL for a guest.
 * Every surface — WhatsApp, copy-link, QR — must build the link through here
 * so a scanned code and a shared link always resolve to the same page.
 */
export function buildGuestUrl(origin: string, slug: string, personalLink: string): string {
  return `${origin.replace(/\/$/, '')}/${slug}/to/${personalLink}`;
}

/** Normalises an Indonesian phone number to the international form wa.me expects. */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export function buildWhatsAppMessage(
  guestName: string,
  invitationUrl: string,
  brideName: string,
  groomName: string
): string {
  return [
    `Kepada Yth. ${guestName},`,
    '',
    'Dengan segala kerendahan hati, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dalam acara pernikahan kami:',
    '',
    `*${groomName} & ${brideName}*`,
    '',
    'Undangan digital kami dapat diakses melalui link berikut:',
    invitationUrl,
    '',
    'Kehadiran Bapak/Ibu/Saudara/i merupakan kehormatan dan kebahagiaan bagi kami.',
    '',
    'Terima kasih atas doa dan restunya.',
  ].join('\n');
}

// Generate WhatsApp invitation link for a guest
export function generateWhatsAppLink(
  guestName: string,
  phone: string,
  invitationUrl: string,
  brideName: string,
  groomName: string
): string {
  const message = encodeURIComponent(
    buildWhatsAppMessage(guestName, invitationUrl, brideName, groomName)
  );
  return `https://wa.me/${normalizePhone(phone)}?text=${message}`;
}

/** QR code encoding the guest's personalised invitation URL. */
export async function generateGuestQrCode(
  personalLink: string,
  origin: string,
  slug: string
): Promise<string> {
  return QRCode.toDataURL(buildGuestUrl(origin, slug, personalLink), {
    width: 400,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#1a1a1a', light: '#ffffff' },
  });
}

function downloadFile(content: BlobPart, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Download CSV template for guest import
export function downloadImportTemplate() {
  const template = 'nama,no_hp,email,grup\nBudi Santoso,08123456789,budi@email.com,Keluarga\nSiti Rahayu,08987654321,,Teman';
  downloadFile(template, 'template-import-tamu.csv', 'text/csv;charset=utf-8;');
}
