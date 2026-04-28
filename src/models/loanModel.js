import { pool } from '../config/db.js';

export const LoanModel = {
  async createLoan(book_id, member_id, due_date) {
    const client = await pool.connect(); // Menggunakan client untuk transaksi
    try {
      await client.query('BEGIN'); // Mulai transaksi database

      // 1. Cek ketersediaan buku
      const bookCheck = await client.query('SELECT available_copies FROM books WHERE id = $1', [book_id]);
      if (bookCheck.rows[0].available_copies <= 0) {
        throw new Error('Buku sedang tidak tersedia (stok habis).');
      }

      // 2. Kurangi stok buku
      await client.query('UPDATE books SET available_copies = available_copies - 1 WHERE id = $1', [book_id]);

      // 3. Catat transaksi peminjaman
      const loanQuery = `
        INSERT INTO loans (book_id, member_id, due_date) 
        VALUES ($1, $2, $3) RETURNING *
      `;
      const result = await client.query(loanQuery, [book_id, member_id, due_date]);

      await client.query('COMMIT'); // Simpan semua perubahan
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK'); // Batalkan jika ada error
      throw error;
    } finally {
      client.release();
    }
  },

  async getAllLoans() {
    const query = `
      SELECT l.*, b.title as book_title, m.full_name as member_name 
      FROM loans l
      JOIN books b ON l.book_id = b.id
      JOIN members m ON l.member_id = m.id
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  async getTopBorrowers() {
    const query = `
      WITH MemberLoanCounts AS (
        SELECT member_id, COUNT(id) as total_loans
        FROM loans
        GROUP BY member_id
      ),
      RankedBooks AS (
        SELECT member_id, book_id, COUNT(id) as times_borrowed,
               ROW_NUMBER() OVER(PARTITION BY member_id ORDER BY COUNT(id) DESC) as rank
        FROM loans
        GROUP BY member_id, book_id
      ),
      FavoriteBooks AS (
        SELECT rb.member_id, b.title, rb.times_borrowed
        FROM RankedBooks rb
        JOIN books b ON rb.book_id = b.id
        WHERE rb.rank = 1
      ),
      LastLoans AS (
        SELECT member_id, MAX(due_date) as last_loan_date 
        FROM loans
        GROUP BY member_id
      )
      SELECT 
        m.id as member_id,
        m.full_name,
        m.email,
        m.member_type
