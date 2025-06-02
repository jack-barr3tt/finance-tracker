package api

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jack-barr3tt/finance-tracker/utils"
)

func (s Server) PostUserIdTransactions(ctx *fiber.Ctx, userId string) error {
	body, err := utils.GetBody[TransactionCreateRequest](ctx)
	if err != nil {
		return ctx.SendStatus(fiber.StatusBadRequest)
	}

	tokenUserId := utils.GetTokenClaim[string](ctx, "id")

	if tokenUserId != userId {
		return ctx.SendStatus(fiber.StatusUnauthorized)
	}

	var id string

	err = s.DB.QueryRow(ctx.Context(), "INSERT INTO transaction (account_id, category_id, amount, description, date) VALUES ($1, $2, $3, $4, $5) RETURNING id", body.AccountId, body.CategoryId, body.Amount, body.Description, time.Now()).Scan(&id)
	if err != nil {
		log.Println(err)
		return ctx.SendStatus(fiber.StatusInternalServerError)
	}

	return ctx.Status(fiber.StatusOK).JSON(TransactionCreateResponse{
		Id: id,
	})
}

func (s Server) GetUserIdTransactions(ctx *fiber.Ctx, userId string, params GetUserIdTransactionsParams) error {
	tokenUserId := utils.GetTokenClaim[string](ctx, "id")

	if tokenUserId != userId {
		return ctx.SendStatus(fiber.StatusUnauthorized)
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
		ctx.Context(),
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
		log.Println(err)
		return ctx.SendStatus(fiber.StatusInternalServerError)
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
			log.Println(err)
			return ctx.SendStatus(fiber.StatusInternalServerError)
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

	return ctx.Status(fiber.StatusOK).JSON(transactions)
}

func (s Server) DeleteUserIdTransactionsTransactionId(ctx *fiber.Ctx, userId, transactionId string) error {
	tokenUserId := utils.GetTokenClaim[string](ctx, "id")

	if tokenUserId != userId {
		return ctx.SendStatus(fiber.StatusUnauthorized)
	}

	tag, err := s.DB.Exec(ctx.Context(), "DELETE FROM transaction WHERE id = $1", transactionId)
	if err != nil {
		log.Println(err)
		return ctx.SendStatus(fiber.StatusInternalServerError)
	}

	if tag.RowsAffected() == 0 {
		return ctx.SendStatus(fiber.StatusNotFound)
	}

	return ctx.Status(fiber.StatusOK).JSON(TransactionDeleteResponse{
		Id:      transactionId,
		Message: "Transaction deleted",
	})
}
