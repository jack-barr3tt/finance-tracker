package api

import (
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

func (s Server) PostUserIdTransactions(c *fiber.Ctx, userId string) error {
	body, err := GetBody[TransactionCreateRequest](c)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	var id string

	err = s.DB.QueryRow(c.Context(), "INSERT INTO transaction (account_id, category_id, amount, description, date) VALUES ($1, $2, $3, $4, $5) RETURNING id", body.AccountId, body.CategoryId, body.Amount, body.Description, time.Now()).Scan(&id)
	if err != nil {
		return DBError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(TransactionCreateResponse{
		Id: id,
	})
}

func (s Server) GetUserIdTransactions(c *fiber.Ctx, userId string, params GetUserIdTransactionsParams) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	conditions := []string{"a.user_id = $1"}
	args := []interface{}{userId}

	if params.AccountId != nil {
		conditions = append(conditions, "t.account_id = $2")
		args = append(args, *params.AccountId)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	rows, err := s.DB.Query(
		c.Context(),
		fmt.Sprintf(
			`SELECT 
				t.id, t.amount, t.description, t.date, 
				c.id, c.name, c.created_at,
				a.id, a.name, a.opened_at, a.closed_at,
				b.id, b.name, b.csv_import_enabled, b.api_import_enabled
			FROM transaction t
			LEFT JOIN category c ON t.category_id = c.id
			LEFT JOIN account a ON t.account_id = a.id
			LEFT JOIN bank b ON a.bank_id = b.id
			%[1]s`,
			whereClause,
		),
		args...,
	)
	if err != nil {
		return DBError(c, err)
	}

	transactions := []Transaction{}
	for rows.Next() {
		transaction := Transaction{}
		var c_id *string
		var c_name *string
		var c_created_at *time.Time
		err = rows.Scan(
			&transaction.Id, &transaction.Amount, &transaction.Description, &transaction.Date,
			&c_id, &c_name, &c_created_at,
			&transaction.Account.Id, &transaction.Account.Name, &transaction.Account.OpenedAt, &transaction.Account.ClosedAt,
			&transaction.Account.Bank.Id, &transaction.Account.Bank.Name, &transaction.Account.Bank.CsvImportEnabled, &transaction.Account.Bank.ApiImportEnabled,
		)
		if err != nil {
			return DBError(c, err)
		}

		if c_id != nil {
			transaction.Category = &Category{
				Id:        *c_id,
				Name:      *c_name,
				CreatedAt: *c_created_at,
			}
		}

		transactions = append(transactions, transaction)
	}

	return c.Status(fiber.StatusOK).JSON(transactions)
}

func (s Server) DeleteUserIdTransactionsTransactionId(c *fiber.Ctx, userId, transactionId string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	tag, err := s.DB.Exec(c.Context(), "DELETE FROM transaction WHERE id = $1", transactionId)
	if err != nil {
		return DBError(c, err)
	}

	if tag.RowsAffected() == 0 {
		return c.SendStatus(fiber.StatusNotFound)
	}

	return c.Status(fiber.StatusOK).JSON(TransactionDeleteResponse{
		Id:      transactionId,
		Message: "Transaction deleted",
	})
}
