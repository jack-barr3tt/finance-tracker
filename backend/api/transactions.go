package api

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jack-barr3tt/finance-tracker/utils"
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

	err = s.DB.QueryRow(c.Context(), "INSERT INTO transaction (account_id, category_id, amount, description, date) VALUES ($1, $2, $3, $4, $5) RETURNING id", body.AccountId, body.CategoryId, body.Amount, body.Description, body.Date).Scan(&id)
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

	conditions := []string{"a.user_id = $"}
	args := []interface{}{userId}

	dateRange, err := parseSummaryRange(params.StartDate, params.EndDate)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	if dateRange.Start != nil {
		conditions = append(conditions, "t.date >= $")
		args = append(args, *dateRange.Start)
	}
	if dateRange.EndExclusive != nil {
		conditions = append(conditions, "t.date < $")
		args = append(args, *dateRange.EndExclusive)
	}

	if params.AccountId != nil {
		conditions = append(conditions, "t.account_id = $")
		args = append(args, *params.AccountId)
	}

	if params.CategoryId != nil {
		if *params.CategoryId == "uncategorised" {
			conditions = append(conditions, "t.category_id IS NULL")
		} else {
			conditions = append(conditions, "t.category_id = $")
			args = append(args, *params.CategoryId)
		}
	}

	if params.Cursor != nil && *params.Cursor != "0" {
		v, i, err := utils.DecodeCursor(*params.Cursor)
		if err != nil {
			return c.SendStatus(fiber.StatusBadRequest)
		}

		conditions = append(conditions, "(t.date, t.id) < ($, $)")
		args = append(args, v, i)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	limitClause := ""
	if params.Limit != nil {
		limitClause = fmt.Sprintf("LIMIT %d", *params.Limit)
	}

	rows, err := s.DB.Query(
		c.Context(),
		utils.NumberPlaceholders(
			fmt.Sprintf(
				`SELECT 
				t.id, t.amount, t.description, t.date, 
				c.id, c.name, c.created_at,
				a.id, a.name, a.opened_at, a.closed_at,
				b.id, b.name, b.short_name, b.csv_import_enabled, b.api_import_enabled,
				ENCODE(CONCAT(t.date, '_', t.id)::bytea, 'base64') AS cursor
			FROM transaction t
			LEFT JOIN category c ON t.category_id = c.id
			LEFT JOIN account a ON t.account_id = a.id
			LEFT JOIN bank b ON a.bank_id = b.id
			%[1]s
			ORDER BY t.date DESC, t.id DESC
			%[2]s`,
				whereClause,
				limitClause,
			),
		),
		args...,
	)
	if err != nil {
		return DBError(c, err)
	}

	lastCursor := ""

	transactions := []Transaction{}
	for rows.Next() {
		transaction := Transaction{}
		var c_id *string
		var c_name *string
		var c_created_at *time.Time
		var cursor string
		err = rows.Scan(
			&transaction.Id, &transaction.Amount, &transaction.Description, &transaction.Date,
			&c_id, &c_name, &c_created_at,
			&transaction.Account.Id, &transaction.Account.Name, &transaction.Account.OpenedAt, &transaction.Account.ClosedAt,
			&transaction.Account.Bank.Id, &transaction.Account.Bank.Name, &transaction.Account.Bank.ShortName, &transaction.Account.Bank.CsvImportEnabled, &transaction.Account.Bank.ApiImportEnabled,
			&cursor,
		)
		if err != nil {
			return DBError(c, err)
		}

		if c_id != nil {
			transaction.Category = &Category{
				Id:        *c_id,
				Name:      *c_name,
				CreatedAt: *c_created_at,
				Rules:     []CategoryRule{},
			}
		}

		transactions = append(transactions, transaction)
		lastCursor = cursor
	}

	var cursor *string
	if lastCursor != "" && params.Limit != nil && len(transactions) == *params.Limit {
		cursor = &lastCursor
	}

	return c.Status(fiber.StatusOK).JSON(TransactionsResponse{
		Transactions: transactions,
		Cursor:       cursor,
	})
}

func (s *Server) GetUserIdTransactionsTransactionId(c *fiber.Ctx, id string, transactionId string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != id {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	row := s.DB.QueryRow(c.Context(), `
		SELECT 
			t.id, t.amount, t.description, t.date, 
			c.id, c.name, c.created_at,
			a.id, a.name, a.opened_at, a.closed_at,
			b.id, b.name, b.short_name, b.csv_import_enabled, b.api_import_enabled
		FROM transaction t
		LEFT JOIN category c ON t.category_id = c.id
		LEFT JOIN account a ON t.account_id = a.id
		LEFT JOIN bank b ON a.bank_id = b.id
		WHERE t.id = $1 AND a.user_id = $2
	`, transactionId, id)

	transaction := Transaction{}
	var c_id *string
	var c_name *string
	var c_created_at *time.Time
	err := row.Scan(
		&transaction.Id, &transaction.Amount, &transaction.Description, &transaction.Date,
		&c_id, &c_name, &c_created_at,
		&transaction.Account.Id, &transaction.Account.Name, &transaction.Account.OpenedAt, &transaction.Account.ClosedAt,
		&transaction.Account.Bank.Id, &transaction.Account.Bank.Name, &transaction.Account.Bank.ShortName, &transaction.Account.Bank.CsvImportEnabled, &transaction.Account.Bank.ApiImportEnabled,
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

	return c.Status(fiber.StatusOK).JSON(transaction)
}

func (s *Server) PatchUserIdTransactionsTransactionId(c *fiber.Ctx, id string, transactionId string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != id {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	body, err := GetBody[TransactionEditRequest](c)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	tag, err := s.DB.Exec(c.Context(), `
		UPDATE transaction 
		SET account_id = $1, category_id = $2, amount = $3, description = $4, date = $5
		WHERE id = $6
	`, body.AccountId, body.CategoryId, body.Amount, body.Description, body.Date, transactionId)
	if err != nil {
		return DBError(c, err)
	}

	if tag.RowsAffected() == 0 {
		return c.SendStatus(fiber.StatusNotFound)
	}

	return c.JSON(TransactionEditResponse{
		Id: transactionId,
	})
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

func (s *Server) PostUserIdTransactionsBulk(c *fiber.Ctx, id string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != id {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	body, err := GetBody[TransactionBulkCreateRequest](c)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	if len(body.Transactions) == 0 {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	tx, err := s.DB.Begin(c.Context())
	if err != nil {
		return DBError(c, err)
	}
	defer tx.Rollback(c.Context())

	var fileId *string
	var ready *bool

	err = tx.QueryRow(
		c.Context(),
		"SELECT id, ready FROM file WHERE file_hash = $1 AND user_id = $2",
		body.Hash, id,
	).Scan(&fileId, &ready)
	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			return c.SendStatus(fiber.StatusInternalServerError)
		}
	}

	if fileId == nil {
		err = tx.QueryRow(
			c.Context(),
			"INSERT INTO file (file_hash, user_id) VALUES ($1, $2) RETURNING id",
			body.Hash, id,
		).Scan(&fileId)
		if err != nil {
			return DBError(c, err)
		}
	}

	if ready != nil && *ready {
		return c.Status(fiber.StatusBadRequest).JSON(TransactionBulkResponse{
			Message: "Bulk upload already finalised",
		})
	}

	for _, transaction := range body.Transactions {
		_, err = tx.Exec(
			c.Context(),
			"INSERT INTO transaction (account_id, category_id, amount, description, date, file_id) VALUES ($1, $2, $3, $4, $5, $6)",
			transaction.AccountId, transaction.CategoryId, transaction.Amount, transaction.Description, transaction.Date, *fileId,
		)
		if err != nil {
			return DBError(c, err)
		}
	}

	if err = tx.Commit(c.Context()); err != nil {
		return DBError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(TransactionBulkResponse{
		Message: "Upload completed",
	})
}

func (s *Server) PostUserIdTransactionsBulkFinalise(c *fiber.Ctx, id string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != id {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	body, err := GetBody[TransactionBulkFinaliseRequest](c)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	_, err = s.DB.Exec(
		c.Context(),
		"UPDATE file SET ready = true WHERE file_hash = $1 AND user_id = $2",
		body.Hash, id,
	)
	if err != nil {
		return DBError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(TransactionBulkResponse{
		Message: "Bulk upload finalised",
	})
}

func (s *Server) PostUserIdTransactionsBulkDelete(c *fiber.Ctx, id string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != id {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	body, err := GetBody[TransactionBulkDeleteRequest](c)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	ready := true
	if body.Cancel != nil && *body.Cancel {
		ready = false
	}

	tag, err := s.DB.Exec(
		c.Context(),
		"DELETE FROM file WHERE file_hash = $1 AND user_id = $2 AND ready = $3",
		body.Hash, id, ready,
	)
	if err != nil {
		return DBError(c, err)
	}

	if tag.RowsAffected() == 0 {
		return c.Status(fiber.StatusNotFound).JSON(TransactionBulkResponse{
			Message: "Cannot cancel a finalised bulk upload",
		})
	}

	return c.Status(fiber.StatusOK).JSON(TransactionBulkResponse{
		Message: "Bulk upload deleted",
	})
}
