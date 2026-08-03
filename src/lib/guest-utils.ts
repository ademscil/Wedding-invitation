import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';

export interface GuestRow {
  name: string;
  phone?: string;
  email?: string;
  groupName?: string;
}

// Parse CSV/Excel file into guest rows
export function parseGuestFile(file: File): Promise<GuestRow[]> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const rows = result.data.map((row) => ({
            name: row['nama'] || row['name'] || row['Nama'] || '',
            phone: row['phone'] || row['no_hp'] || row['No HP'] || row['Nomor HP'] || '',
            email: row['email'] || row['Email'] || '',
            groupName: row['grup'] || row['group'] || row['Grup'] || '',
          })).filter((r) => r.name.trim() !== '');
          resolve(rows);
        },
        error: reject,
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
          const rows = json.map((row) => ({
            name: String(row['nama'] || row['name'] || row['Nama'] || ''),
            phone: String(row['phone'] || row['no_hp'] || row['No HP'] || row['Nomor HP'] || ''),
            email: String(row['email'] || row['Email'] || ''),
            groupName: String(row['grup'] || row['group'] || row['Grup'] || ''),
          })).filter((r) => r.name.trim() !== '');
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
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
export function exportGuestsToExcel(
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
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tamu');
  XLSX.writeFile(wb, filename);
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
    `Kepada Yth. ${guestName},\n\nDengan segala kerendahan hati, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dalam acara pernikahan kami:\n\n*${brideName} & ${groomName}*\n\nUndangan digital kami dapat diakses melalui link berikut:\n${invitationUrl}\n\nKehadiran Bapak/Ibu/Saudara/i merupakan kehormatan dan kebahagiaan bagi kami.\n\nTerima kasih atas doa dan restunya.`
  );
  const cleanPhone = phone.replace(/\D/g, '').replace(/^0/, '62');
  return `https://wa.me/${cleanPhone}?text=${message}`;
}

// Generate QR code data URL for a guest personal link
export async function generateGuestQrCode(personalLink: string, baseUrl: string): Promise<string> {
  const url = `${baseUrl}?to=${personalLink}`;
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: '#1a1a1a', light: '#ffffff' },
  });
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
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
