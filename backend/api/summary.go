package api

import "github.com/gofiber/fiber/v2"

func (s *Server) GetUserIdSummaryAccounts(c *fiber.Ctx, userId string) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	accounts := map[string]AccountSummary{}

	rows, err := s.DB.Query(
		c.Context(),
		`SELECT 
			a.id, a.name, a.opened_at, a.closed_at,
			b.id, b.name, b.csv_import_enabled, b.api_import_enabled
		FROM account a
		LEFT JOIN bank b ON a.bank_id = b.id
		WHERE a.user_id = $1`,
		userId,
	)
	if err != nil {
		return DBError(c, err)
	}

	for rows.Next() {
		account := Account{}
		err = rows.Scan(&account.Id, &account.Name, &account.OpenedAt, &account.ClosedAt,
			&account.Bank.Id, &account.Bank.Name, &account.Bank.CsvImportEnabled, &account.Bank.ApiImportEnabled)
		if err != nil {
			return DBError(c, err)
		}
		accounts[account.Id] = AccountSummary{
			Account: account,
			Balance: 0,
		}
	}

	rows, err = s.DB.Query(
		c.Context(),
		`SELECT
			t.account_id, SUM(t.amount) AS total_amount
		FROM transaction t
		LEFT JOIN account a ON t.account_id = a.id
		WHERE a.user_id = $1
		GROUP BY t.account_id`,
		userId,
	)
	if err != nil {
		return DBError(c, err)
	}

	for rows.Next() {
		var accountId string
		var totalAmount float32
		err = rows.Scan(&accountId, &totalAmount)
		if err != nil {
			return DBError(c, err)
		}
		if account, ok := accounts[accountId]; ok {
			accounts[accountId] = AccountSummary{
				Account: account.Account,
				Balance: totalAmount,
			}
		}
	}

	result := []AccountSummary{}
	for _, account := range accounts {
		result = append(result, account)
	}

	return c.JSON(result)
}

func (s *Server) GetUserIdSummaryCategories(c *fiber.Ctx, userId string) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	categories := map[string]CategorySummary{}

	rows, err := s.DB.Query(
		c.Context(),
		`SELECT 
			c.id, c.name, c.created_at
		FROM category c 
		WHERE c.user_id = $1`,
		userId,
	)
	if err != nil {
		return DBError(c, err)
	}

	for rows.Next() {
		category := Category{}
		err = rows.Scan(&category.Id, &category.Name, &category.CreatedAt)
		if err != nil {
			return DBError(c, err)
		}
		categories[category.Id] = CategorySummary{
			Category:   category,
			Total:      0,
			Percentage: 0,
		}
	}

	rows, err = s.DB.Query(
		c.Context(),
		`SELECT
			c.id, 
			SUM(CASE WHEN c.id = t.category_id THEN t.amount ELSE 0 END) AS total_amount, 
			COUNT(CASE WHEN c.id = t.category_id THEN 1 END) / COUNT(t.id) AS percentage
		FROM category c
		LEFT JOIN account a ON c.user_id = a.user_id
		LEFT JOIN transaction t ON t.account_id = a.id
		WHERE a.user_id = $1 AND t.category_id IS NOT NULL
		GROUP BY c.id`,
		userId,
	)
	if err != nil {
		return DBError(c, err)
	}
	for rows.Next() {
		var categoryId string
		var totalAmount float32
		var percentage float32
		err = rows.Scan(&categoryId, &totalAmount, &percentage)
		if err != nil {
			return DBError(c, err)
		}
		if _, ok := categories[categoryId]; ok {
			categories[categoryId] = CategorySummary{
				Category:   categories[categoryId].Category,
				Total:      totalAmount,
				Percentage: percentage,
			}
		}
	}

	result := []CategorySummary{}
	for _, category := range categories {
		result = append(result, category)
	}
	return c.JSON(result)
}
