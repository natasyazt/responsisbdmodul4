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
        m.member_type,
        CAST(mlc.total_loans AS INTEGER) as total_loans,
        ll.last_loan_date,
        json_build_object(
          'title', fb.title,
          'times_borrowed', CAST(fb.times_borrowed AS INTEGER)
        ) as favorite_book
      FROM MemberLoanCounts mlc
      JOIN members m ON mlc.member_id = m.id
      LEFT JOIN FavoriteBooks fb ON mlc.member_id = fb.member_id
      LEFT JOIN LastLoans ll ON mlc.member_id = ll.member_id
      ORDER BY mlc.total_loans DESC
      LIMIT 3;
    `;
    const result = await pool.query(query);
    return result.rows;
  }
