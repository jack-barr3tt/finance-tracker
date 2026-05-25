package api

import (
	"fmt"
	"sort"
	"strings"
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
		WHERE a.user_id = $1 AND (a.closed_at IS NULL OR a.closed_at > NOW())
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

	accountSummaries := []AccountSummary{}
	for _, account := range accounts {
		accountSummaries = append(accountSummaries, account)
	}

	sort.Slice(accountSummaries, func(i, j int) bool {
		return accountSummaries[i].Account.Name < accountSummaries[j].Account.Name
	})

	result := AllAccountSummary{
		Accounts: accountSummaries,
		Total:    0,
	}

	for _, account := range accountSummaries {
		result.Total += account.Balance
	}

	return c.JSON(result)
}

const summaryDateLayout = "2006-01-02"

type summaryRange struct {
	Start        *time.Time
	EndExclusive *time.Time
}

func parseSummaryRange(startDate *string, endDate *string) (summaryRange, error) {
	result := summaryRange{}

	if startDate != nil && *startDate != "" {
		start, err := time.ParseInLocation(summaryDateLayout, *startDate, time.UTC)
		if err != nil {
			return result, fmt.Errorf("start_date must use YYYY-MM-DD format")
		}
		result.Start = &start
	}

	if endDate != nil && *endDate != "" {
		end, err := time.ParseInLocation(summaryDateLayout, *endDate, time.UTC)
		if err != nil {
			return result, fmt.Errorf("end_date must use YYYY-MM-DD format")
		}
		endExclusive := end.AddDate(0, 0, 1)
		result.EndExclusive = &endExclusive
	}

	if result.Start != nil && result.EndExclusive != nil && !result.Start.Before(*result.EndExclusive) {
		return result, fmt.Errorf("start_date must be on or before end_date")
	}

	return result, nil
}

func appendSummaryRangeConditions(conditions []string, args []interface{}, dateRange summaryRange) ([]string, []interface{}) {
	if dateRange.Start != nil {
		conditions = append(conditions, fmt.Sprintf("t.date >= $%d", len(args)+1))
		args = append(args, *dateRange.Start)
	}

	if dateRange.EndExclusive != nil {
		conditions = append(conditions, fmt.Sprintf("t.date < $%d", len(args)+1))
		args = append(args, *dateRange.EndExclusive)
	}

	return conditions, args
}

func getSummaryInterval(interval *SummaryInterval) (SummaryInterval, error) {
	if interval == nil {
		return SummaryIntervalDay, nil
	}

	switch *interval {
	case SummaryIntervalDay, SummaryIntervalWeek, SummaryIntervalMonth, SummaryIntervalYear:
		return *interval, nil
	default:
		return "", fmt.Errorf("interval must be one of day, week, month, year")
	}
}

func alignSummaryStart(date time.Time, interval SummaryInterval) time.Time {
	switch interval {
	case SummaryIntervalMonth:
		return time.Date(date.Year(), date.Month(), 1, 0, 0, 0, 0, time.UTC)
	case SummaryIntervalYear:
		return time.Date(date.Year(), 1, 1, 0, 0, 0, 0, time.UTC)
	default:
		return time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
	}
}

func addSummaryInterval(date time.Time, interval SummaryInterval) time.Time {
	switch interval {
	case SummaryIntervalWeek:
		return date.AddDate(0, 0, 7)
	case SummaryIntervalMonth:
		return date.AddDate(0, 1, 0)
	case SummaryIntervalYear:
		return date.AddDate(1, 0, 0)
	default:
		return date.AddDate(0, 0, 1)
	}
}

func (s *Server) GetUserIdSummaryCategories(c *fiber.Ctx, userId string, params GetUserIdSummaryCategoriesParams) error {
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
		category := Category{
			Rules: []CategoryRule{},
		}
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

	conditions := []string{"a.user_id = $1"}
	args := []interface{}{userId}

	dateRange, err := parseSummaryRange(params.StartDate, params.EndDate)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	conditions, args = appendSummaryRangeConditions(conditions, args, dateRange)

	whereClause := strings.Join(conditions, " AND ")

	var totalCount int
	err = s.DB.QueryRow(
		c.Context(),
		fmt.Sprintf(
			`SELECT COUNT(*) FROM transaction t
			LEFT JOIN account a ON t.account_id = a.id
			WHERE %[1]s`,
			whereClause,
		),
		args...,
	).Scan(&totalCount)
	if err != nil {
		return DBError(c, err)
	}

	rows, err = s.DB.Query(
		c.Context(),
		fmt.Sprintf(
			`SELECT
				t.category_id,
				SUM(t.amount) AS total_amount,
				COUNT(t.id) AS count
			FROM transaction t
			LEFT JOIN category c ON t.category_id = c.id
			LEFT JOIN account a ON t.account_id = a.id
			WHERE %[1]s
			GROUP BY t.category_id`,
			whereClause,
		),
		args...,
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

	dateRange, err := parseSummaryRange(params.StartDate, params.EndDate)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	interval, err := getSummaryInterval(params.Interval)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
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
		`SELECT t.account_id, t.amount, t.date::DATE
		FROM transaction t
		LEFT JOIN account a ON t.account_id = a.id
		WHERE a.user_id = $1
		ORDER BY t.date ASC`,
		userId,
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

	now := time.Now().UTC()
	rangeEnd := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	if dateRange.EndExclusive != nil {
		rangeEnd = dateRange.EndExclusive.AddDate(0, 0, -1)
	}

	if len(transactions) == 0 {
		pointDate := rangeEnd
		if dateRange.Start != nil {
			pointDate = alignSummaryStart(*dateRange.Start, interval)
		}

		result := BalanceSummary{
			Total: []BalanceDatapoint{
				{
					Date:    pointDate,
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
						Date:    pointDate,
						Balance: 0,
					},
				},
			})
		}
		return c.JSON(result)
	}

	startDate := transactions[0].Date.AddDate(0, 0, -1)
	if dateRange.Start != nil {
		startDate = *dateRange.Start
	}
	startDate = alignSummaryStart(startDate, interval)
	if startDate.After(rangeEnd) {
		startDate = rangeEnd
	}

	totals := map[string][]BalanceDatapoint{}
	for _, accountId := range accountIds {
		totals[accountId] = []BalanceDatapoint{}
	}

	dayTotals := map[string]float32{}
	for _, accountId := range accountIds {
		dayTotals[accountId] = 0
	}
	grandTotal := float32(0)
	tIdx := 0

	grandTotals := []BalanceDatapoint{}
	appendPoint := func(pointDate time.Time) {
		for tIdx < len(transactions) && !transactions[tIdx].Date.After(pointDate) {
			t := transactions[tIdx]
			if _, ok := dayTotals[t.AccountId]; ok {
				dayTotals[t.AccountId] += t.Amount
			}
			grandTotal += t.Amount
			tIdx++
		}

		for accountId, amount := range dayTotals {
			totals[accountId] = append(totals[accountId], BalanceDatapoint{
				Date:    pointDate,
				Balance: amount,
			})
		}

		grandTotals = append(grandTotals, BalanceDatapoint{
			Date:    pointDate,
			Balance: grandTotal,
		})
	}

	for currentDate := startDate; !currentDate.After(rangeEnd); currentDate = addSummaryInterval(currentDate, interval) {
		appendPoint(currentDate)
	}
	if len(grandTotals) == 0 || !grandTotals[len(grandTotals)-1].Date.Equal(rangeEnd) {
		appendPoint(rangeEnd)
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

	return c.JSON(result)
}

func (s *Server) GetUserIdSummaryTotals(c *fiber.Ctx, userId string, params GetUserIdSummaryTotalsParams) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	conditions := []string{"a.user_id = $1"}
	args := []interface{}{userId}

	dateRange, err := parseSummaryRange(params.StartDate, params.EndDate)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	conditions, args = appendSummaryRangeConditions(conditions, args, dateRange)

	whereClause := strings.Join(conditions, " AND ")

	rows, err := s.DB.Query(
		c.Context(),
		fmt.Sprintf(
			`SELECT 
				t.id, t.amount, t.date::DATE, t.account_id
			FROM transaction t
			LEFT JOIN account a ON t.account_id = a.id
			WHERE %[1]s
			ORDER BY t.date`,
			whereClause,
		),
		args...,
	)
	if err != nil {
		return DBError(c, err)
	}

	type Transaction struct {
		ID        string
		Amount    float32
		Date      time.Time
		AccountID string
	}

	transactions := []Transaction{}
	for rows.Next() {
		var t Transaction
		err = rows.Scan(&t.ID, &t.Amount, &t.Date, &t.AccountID)
		if err != nil {
			return DBError(c, err)
		}
		transactions = append(transactions, t)
	}

	dateAmountMap := make(map[string]map[float32][]Transaction)

	for _, t := range transactions {
		dateKey := t.Date.Format("2006-01-02")
		if dateAmountMap[dateKey] == nil {
			dateAmountMap[dateKey] = make(map[float32][]Transaction)
		}
		dateAmountMap[dateKey][t.Amount] = append(dateAmountMap[dateKey][t.Amount], t)
	}

	transferIDs := make(map[string]bool)

	for dateKey, amountMap := range dateAmountMap {
		date, _ := time.Parse("2006-01-02", dateKey)

		checkDates := []string{
			dateKey,
			date.AddDate(0, 0, 1).Format("2006-01-02"),
		}

		for amount, txns := range amountMap {
			transferAmount := -amount

			for _, checkDateKey := range checkDates {
				if checkDayMap, exists := dateAmountMap[checkDateKey]; exists {
					if transferTxns, exists := checkDayMap[transferAmount]; exists {
						for _, t1 := range txns {
							for _, t2 := range transferTxns {
								if t1.AccountID != t2.AccountID {
									transferIDs[t1.ID] = true
									transferIDs[t2.ID] = true
								}
							}
						}
					}
				}
			}
		}
	}

	var totalIncome float32
	var totalOutgoing float32

	for _, t := range transactions {
		if !transferIDs[t.ID] {
			if t.Amount > 0 {
				totalIncome += t.Amount
			} else if t.Amount < 0 {
				totalOutgoing += -t.Amount
			}
		}
	}

	result := TotalsSummary{
		Income:   totalIncome,
		Outgoing: totalOutgoing,
		Net:      totalIncome - totalOutgoing,
	}

	return c.JSON(result)
}
