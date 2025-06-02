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
				t.id, t.amount, t.description, t.date, c.id, c.name, c.created_at
			FROM transaction t
			LEFT JOIN category c ON t.category_id = c.id
			LEFT JOIN account a ON t.account_id = a.id
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
		var id string
		var amount float32
		var description string
		var date time.Time
		var categoryId *string
		var categoryName *string
		var categoryCreatedAt *time.Time
		err = rows.Scan(&id, &amount, &description, &date, &categoryId, &categoryName, &categoryCreatedAt)
		if err != nil {
			return DBError(c, err)
		}

		transaction := Transaction{
			Id:          id,
			Amount:      amount,
			Description: description,
			Date:        date,
		}

		if categoryId != nil {
			transaction.Category = &Category{
				Id:        *categoryId,
				Name:      *categoryName,
				CreatedAt: *categoryCreatedAt,
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
