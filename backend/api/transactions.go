package api

import (
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jack-barr3tt/finance-tracker/utils"
)

func (s Server) PostUserIdAccountsAccountIdTransactions(ctx *fiber.Ctx, userId, accountId string) error {
	body, err := utils.GetBody[TransactionCreateRequest](ctx)
	if err != nil {
		return ctx.SendStatus(fiber.StatusBadRequest)
	}

	tokenUserId := utils.GetTokenClaim[string](ctx, "id")

	if tokenUserId != userId {
		return ctx.SendStatus(fiber.StatusUnauthorized)
	}

	var id string

	err = s.DB.QueryRow(ctx.Context(), "INSERT INTO transaction (user_id, account_id, category_id, amount, description, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id", userId, accountId, body.CategoryId, body.Amount, body.Description, time.Now()).Scan(&id)
	if err != nil {
		log.Println(err)
		return ctx.SendStatus(fiber.StatusInternalServerError)
	}

	return ctx.Status(fiber.StatusOK).JSON(TransactionCreateResponse{
		Id: id,
	})
}

func (s Server) GetUserIdAccountsAccountIdTransactions(ctx *fiber.Ctx, userId, accountId string) error {
	tokenUserId := utils.GetTokenClaim[string](ctx, "id")

	if tokenUserId != userId {
		return ctx.SendStatus(fiber.StatusUnauthorized)
	}

	rows, err := s.DB.Query(ctx.Context(), `SELECT 
		t.id, t.amount, t.description, t.date, c.id, c.name, c.created_at
	FROM transaction t
	LEFT JOIN categories c ON t.category_id = c.id
	WHERE account_id = $1`, accountId)
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

func (s Server) DeleteUserIdAccountsAccountIdTransactionsTransactionId(ctx *fiber.Ctx, userId, accountId, transactionId string) error {
	tokenUserId := utils.GetTokenClaim[string](ctx, "id")

	if tokenUserId != userId {
		return ctx.SendStatus(fiber.StatusUnauthorized)
	}

	tag, err := s.DB.Exec(ctx.Context(), "DELETE FROM transaction WHERE id = $1 AND account_id = $2", transactionId, accountId)
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
