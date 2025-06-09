package api

import (
	"sort"
	"time"

	"github.com/gofiber/fiber/v2"
)

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
		WHERE a.user_id = $1
		ORDER BY a.name`,
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

	sort.Slice(result, func(i, j int) bool {
		return result[i].Account.Name < result[j].Account.Name
	})

	return c.JSON(result)
}

func (s *Server) GetUserIdSummaryCategories(c *fiber.Ctx, userId string) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	categories := map[string]CategorySummary{
		"uncategorized": {
			Category:   nil,
			Total:      0,
			Percentage: 0,
		},
	}

	rows, err := s.DB.Query(
		c.Context(),
		`SELECT 
			c.id, c.name, c.created_at
		FROM category c 
		WHERE c.user_id = $1
		ORDER BY c.name`,
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
			Category:   &category,
			Total:      0,
			Percentage: 0,
		}
	}

	var totalCount int
	err = s.DB.QueryRow(
		c.Context(),
		`SELECT COUNT(*) FROM transaction t
		LEFT JOIN account a ON t.account_id = a.id
		WHERE a.user_id = $1`,
		userId,
	).Scan(&totalCount)
	if err != nil {
		return DBError(c, err)
	}

	rows, err = s.DB.Query(
		c.Context(),
		`SELECT
			t.category_id,
			SUM(t.amount) AS total_amount,
			COUNT(t.id) AS count
		FROM transaction t
		LEFT JOIN category c ON t.category_id = c.id
		LEFT JOIN account a ON t.account_id = a.id
		WHERE a.user_id = $1
		GROUP BY t.category_id`,
		userId,
	)
	if err != nil {
		return DBError(c, err)
	}
	for rows.Next() {
		var categoryId *string
		var totalAmount float32
		var count int
		err = rows.Scan(&categoryId, &totalAmount, &count)
		if err != nil {
			return DBError(c, err)
		}
		if categoryId == nil {
			categories["uncategorized"] = CategorySummary{
				Category:   nil,
				Total:      totalAmount,
				Percentage: float32(count) / float32(totalCount) * 100,
			}
		} else if _, ok := categories[*categoryId]; ok {
			categories[*categoryId] = CategorySummary{
				Category:   categories[*categoryId].Category,
				Total:      totalAmount,
				Percentage: float32(count) / float32(totalCount) * 100,
			}
		}
	}

	result := []CategorySummary{}
	for _, category := range categories {
		result = append(result, category)
	}

	return c.JSON(result)
}

func (s *Server) GetUserIdSummaryBalance(c *fiber.Ctx, userId string, params GetUserIdSummaryBalanceParams) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	accounts := map[string]Account{}
	accountIds := []string{}

	rows, err := s.DB.Query(
		c.Context(),
		`SELECT id, name, opened_at, closed_at FROM account WHERE user_id = $1`,
		userId,
	)
	if err != nil {
		return DBError(c, err)
	}
	for rows.Next() {
		var account Account
		err = rows.Scan(&account.Id, &account.Name, &account.OpenedAt, &account.ClosedAt)
		if err != nil {
			return DBError(c, err)
		}
		accounts[account.Id] = account
		accountIds = append(accountIds, account.Id)
	}

	type Transaction struct {
		AccountId string
		Amount    float32
		Date      time.Time
	}

	transactions := []Transaction{}

	rows, err = s.DB.Query(
		c.Context(),
		`SELECT account_id, amount, date::DATE FROM transaction ORDER BY date ASC`,
	)
	if err != nil {
		return DBError(c, err)
	}

	for rows.Next() {
		var t Transaction
		err = rows.Scan(&t.AccountId, &t.Amount, &t.Date)
		if err != nil {
			return DBError(c, err)
		}
		transactions = append(transactions, t)
	}

	if len(transactions) == 0 {
		result := BalanceSummary{
			Total: []BalanceDatapoint{
				{
					Date:    time.Now(),
					Balance: 0,
				},
			},
			Accounts: []BalanceSummaryAccount{},
		}

		for _, accountId := range accountIds {
			result.Accounts = append(result.Accounts, BalanceSummaryAccount{
				Account: accounts[accountId],
				Balance: []BalanceDatapoint{
					{
						Date:    time.Now(),
						Balance: 0,
					},
				},
			})
		}
		return c.JSON(result)
	}

	startDate := transactions[0].Date.AddDate(0, 0, -1)

	monthStep := 0
	dayStep := 1
	if params.GroupBy != nil {
		if *params.GroupBy == Week {
			dayStep = 7
		} else if *params.GroupBy == Month {
			monthStep = 1
			dayStep = 0

			startDate = time.Date(startDate.Year(), startDate.Month(), 1, 0, 0, 0, 0, startDate.Location())
		}
	}

	grandTotals := []BalanceDatapoint{
		{
			Date:    startDate,
			Balance: 0,
		},
	}
	totals := map[string][]BalanceDatapoint{}
	for _, accountId := range accountIds {
		totals[accountId] = []BalanceDatapoint{
			{
				Date:    startDate,
				Balance: 0,
			},
		}
	}

	if params.GroupBy == nil || *params.GroupBy != Month {
		startDate = startDate.AddDate(0, 0, 1)
	}

	tIdx := 0

	for currentDate := startDate; currentDate.Before(time.Now()); currentDate = currentDate.AddDate(0, monthStep, dayStep) {
		dayTotals := map[string]float32{}
		for _, accountId := range accountIds {
			dayTotals[accountId] = 0
		}
		dayTotal := float32(0)

		for tIdx < len(transactions) && transactions[tIdx].Date.Before(currentDate) {
			t := transactions[tIdx]
			if _, ok := dayTotals[t.AccountId]; ok {
				dayTotals[t.AccountId] += t.Amount
			}
			dayTotal += t.Amount

			tIdx++
		}

		for accountId, amount := range dayTotals {
			totals[accountId] = append(totals[accountId], BalanceDatapoint{
				Date:    currentDate,
				Balance: amount + totals[accountId][len(totals[accountId])-1].Balance,
			})
		}

		grandTotals = append(grandTotals, BalanceDatapoint{
			Date:    currentDate,
			Balance: dayTotal + grandTotals[len(grandTotals)-1].Balance,
		})
	}

	result := BalanceSummary{
		Total: grandTotals,
	}

	for accountId, accountTotals := range totals {
		result.Accounts = append(result.Accounts, BalanceSummaryAccount{
			Account: accounts[accountId],
			Balance: accountTotals,
		})
	}

	sort.Slice(result.Accounts, func(i, j int) bool {
		return result.Accounts[i].Account.Name < result.Accounts[j].Account.Name
	})

	return c.JSON(result)
}
