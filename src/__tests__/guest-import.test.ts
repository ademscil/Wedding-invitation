import { describe, it, expect } from 'vitest';
import { parseGuestFile } from '@/lib/guest-utils';

/**
 * Importing a spreadsheet is how a customer enters 300 guests. Getting a
 * header wrong here does not throw — it silently imports nobody, which the
 * customer discovers only when the invitations never arrive.
 */

function csv(content: string, name = 'tamu.csv'): File {
  return new File([content], name, { type: 'text/csv' });
}

describe('parseGuestFile — CSV', () => {
  it('reads the documented Indonesian headers', async () => {
    const rows = await parseGuestFile(
      csv('nama,no_hp,email,grup\nBudi,08123456789,budi@example.com,Keluarga')
    );

    expect(rows).toEqual([
      {
        name: 'Budi',
        phone: '08123456789',
        email: 'budi@example.com',
        groupName: 'Keluarga',
      },
    ]);
  });

  it('reads the English headers', async () => {
    const rows = await parseGuestFile(
      csv('name,phone,email,group\nBudi,08123,b@example.com,Teman')
    );
    expect(rows[0]?.name).toBe('Budi');
    expect(rows[0]?.groupName).toBe('Teman');
  });

  it.each([
    ['upper case', 'NAMA,NO_HP\nBudi,08123'],
    ['title case English', 'Name,Phone\nBudi,08123'],
    ['padded with spaces', ' nama , no_hp \nBudi,08123'],
    ['mixed case', 'NaMa,No_Hp\nBudi,08123'],
  ])('reads headers written in %s', async (_label, content) => {
    const rows = await parseGuestFile(csv(content));
    expect(rows, 'a header casing difference must not silently import nobody').toHaveLength(1);
    expect(rows[0]?.name).toBe('Budi');
  });

  it('skips rows with no name rather than creating blank guests', async () => {
    const rows = await parseGuestFile(
      csv('nama,no_hp\nBudi,08123\n,08999\n   ,08777\nSiti,08555')
    );
    expect(rows.map((r) => r.name)).toEqual(['Budi', 'Siti']);
  });

  it('keeps a leading zero on a phone number', async () => {
    // 08123456789 is how every Indonesian number is written; losing the zero
    // makes the WhatsApp link point at nobody.
    const rows = await parseGuestFile(csv('nama,no_hp\nBudi,08123456789'));
    expect(rows[0]?.phone).toBe('08123456789');
  });

  it('trims stray whitespace around values', async () => {
    const rows = await parseGuestFile(csv('nama,no_hp\n  Budi  ,  08123  '));
    expect(rows[0]?.name).toBe('Budi');
    expect(rows[0]?.phone).toBe('08123');
  });

  it('handles a name containing a comma when quoted', async () => {
    const rows = await parseGuestFile(
      csv('nama,grup\n"Budi, S.Kom",Kantor')
    );
    expect(rows[0]?.name).toBe('Budi, S.Kom');
  });

  it('rejects a file type it cannot read', async () => {
    await expect(
      parseGuestFile(new File(['x'], 'tamu.pdf', { type: 'application/pdf' }))
    ).rejects.toThrow(/tidak didukung/i);
  });
});

describe('parseGuestFile — Excel', () => {
  /** Builds a real .xlsx in memory so the sheet reader is genuinely exercised. */
  async function xlsx(rows: Record<string, unknown>[]): Promise<File> {
    const ExcelJS = await import('exceljs');
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet('Tamu');
    if (rows.length > 0) {
      const headers = Object.keys(rows[0]!);
      sheet.addRow(headers);
      for (const row of rows) {
        sheet.addRow(headers.map((h) => row[h] ?? ''));
      }
    }
    const buffer = await book.xlsx.writeBuffer();
    return new File([buffer], 'tamu.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  it('reads a real spreadsheet', async () => {
    const file = await xlsx([
      { nama: 'Budi', no_hp: '08123456789', email: 'b@example.com', grup: 'Keluarga' },
      { nama: 'Siti', no_hp: '08999', email: '', grup: 'Teman' },
    ]);

    const rows = await parseGuestFile(file);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ name: 'Budi', phone: '08123456789' });
    expect(rows[1]?.groupName).toBe('Teman');
  });

  it('accepts headers in any casing, as in CSV', async () => {
    const file = await xlsx([{ NAMA: 'Budi', 'No HP': '08123' }]);
    const rows = await parseGuestFile(file);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe('Budi');
    expect(rows[0]?.phone).toBe('08123');
  });

  it('does not drop the leading zero from a numeric phone cell', async () => {
    // Excel commonly stores a phone column as a number.
    const file = await xlsx([{ nama: 'Budi', no_hp: 8123456789 }]);
    const rows = await parseGuestFile(file);
    // The zero is already lost inside the file itself; what matters is that we
    // return the digits rather than something like "8.12346e+9".
    expect(rows[0]?.phone).toMatch(/^\d+$/);
  });

  it('skips blank rows', async () => {
    const file = await xlsx([
      { nama: 'Budi' },
      { nama: '' },
      { nama: 'Siti' },
    ]);
    expect((await parseGuestFile(file)).map((r) => r.name)).toEqual(['Budi', 'Siti']);
  });
});

describe('the template we hand customers', () => {
  it('parses back through the importer', async () => {
    // The file offered for download has to survive a round trip, or the very
    // first import a customer attempts fails.
    const template =
      'nama,no_hp,email,grup\nBudi Santoso,08123456789,budi@email.com,Keluarga\nSiti Rahayu,08987654321,,Teman';

    const rows = await parseGuestFile(csv(template));

    expect(rows).toEqual([
      {
        name: 'Budi Santoso',
        phone: '08123456789',
        email: 'budi@email.com',
        groupName: 'Keluarga',
      },
      {
        name: 'Siti Rahayu',
        phone: '08987654321',
        email: '',
        groupName: 'Teman',
      },
    ]);
  });
});
