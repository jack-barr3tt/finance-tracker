package api

import (
	"time"

	"github.com/gofiber/fiber/v2"
)

func (s Server) PostUserIdBudgetTransactions(c *fiber.Ctx, userId string) error {
	body, err := GetBody[BudgetTransactionCreateRequest](c)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	var id string

	err = s.DB.QueryRow(c.Context(), "INSERT INTO budget_transaction (category_id, amount, description, repeat_until, repeat_every) VALUES ($1, $2, $3, $4, $5) RETURNING id", body.CategoryId, body.Amount, body.Description, body.RepeatUntil, body.RepeatEvery).Scan(&id)
	if err != nil {
		return DBError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(BudgetTransactionCreateResponse{
		Id: id,
	})
}

func (s Server) GetUserIdBudgetTransactions(c *fiber.Ctx, userId string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	rows, err := s.DB.Query(
		c.Context(),
		`SELECT 
			bt.id, bt.amount, bt.description, bt.repeat_until, bt.repeat_every, bt.created_at, bt.deleted_at,
			c.id, c.name, c.created_at
		FROM budget_transaction bt
		INNER JOIN category c ON bt.category_id = c.id
		WHERE c.user_id = $1 AND bt.deleted_at IS NULL
		ORDER BY bt.created_at DESC`,
		userId,
	)
	if err != nil {
		return DBError(c, err)
	}

	budgetTransactions := []BudgetTransaction{}
	for rows.Next() {
		budgetTransaction := BudgetTransaction{}
		var c_id string
		var c_name string
		var c_created_at time.Time
		err = rows.Scan(
			&budgetTransaction.Id, &budgetTransaction.Amount, &budgetTransaction.Description, &budgetTransaction.RepeatUntil, &budgetTransaction.RepeatEvery, &budgetTransaction.CreatedAt, &budgetTransaction.DeletedAt,
			&c_id, &c_name, &c_created_at,
		)
		if err != nil {
			return DBError(c, err)
		}

		budgetTransaction.Category = &Category{
			Id:        c_id,
			Name:      c_name,
			CreatedAt: c_created_at,
			Rules:     []CategoryRule{},
		}

		budgetTransactions = append(budgetTransactions, budgetTransaction)
	}

	return c.Status(fiber.StatusOK).JSON(budgetTransactions)
}

func (s *Server) GetUserIdBudgetTransactionsBudgetTransactionId(c *fiber.Ctx, id string, budgetTransactionId string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != id {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	row := s.DB.QueryRow(c.Context(), `
		SELECT 
			bt.id, bt.amount, bt.description, bt.repeat_until, bt.repeat_every, bt.created_at, bt.deleted_at,
			c.id, c.name, c.created_at
		FROM budget_transaction bt
		INNER JOIN category c ON bt.category_id = c.id
		WHERE bt.id = $1 AND c.user_id = $2
	`, budgetTransactionId, id)

	budgetTransaction := BudgetTransaction{}
	var c_id string
	var c_name string
	var c_created_at time.Time
	err := row.Scan(
		&budgetTransaction.Id, &budgetTransaction.Amount, &budgetTransaction.Description, &budgetTransaction.RepeatUntil, &budgetTransaction.RepeatEvery, &budgetTransaction.CreatedAt, &budgetTransaction.DeletedAt,
		&c_id, &c_name, &c_created_at,
	)
	if err != nil {
		return DBError(c, err)
	}

	budgetTransaction.Category = &Category{
		Id:        c_id,
		Name:      c_name,
		CreatedAt: c_created_at,
		Rules:     []CategoryRule{},
	}

	return c.Status(fiber.StatusOK).JSON(budgetTransaction)
}

func (s *Server) PatchUserIdBudgetTransactionsBudgetTransactionId(c *fiber.Ctx, id string, budgetTransactionId string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != id {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	body, err := GetBody[BudgetTransactionEditRequest](c)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	tag, err := s.DB.Exec(c.Context(), `
		UPDATE budget_transaction bt
		SET category_id = $1, amount = $2, description = $3, repeat_until = $4, repeat_every = $5
		FROM category c
		WHERE bt.id = $6 AND bt.category_id = c.id AND c.user_id = $7
	`, body.CategoryId, body.Amount, body.Description, body.RepeatUntil, body.RepeatEvery, budgetTransactionId, id)
	if err != nil {
		return DBError(c, err)
	}

	if tag.RowsAffected() == 0 {
		return c.SendStatus(fiber.StatusNotFound)
	}

	return c.JSON(BudgetTransactionEditResponse{
		Id: budgetTransactionId,
	})
}

func (s Server) DeleteUserIdBudgetTransactionsBudgetTransactionId(c *fiber.Ctx, userId, budgetTransactionId string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	tag, err := s.DB.Exec(c.Context(), `
		UPDATE budget_transaction bt
		SET deleted_at = NOW()
		FROM category c
		WHERE bt.id = $1 AND bt.category_id = c.id AND c.user_id = $2
	`, budgetTransactionId, userId)
	if err != nil {
		return DBError(c, err)
	}

	if tag.RowsAffected() == 0 {
		return c.SendStatus(fiber.StatusNotFound)
	}

	return c.Status(fiber.StatusOK).JSON(BudgetTransactionDeleteResponse{
		Id:      budgetTransactionId,
		Message: "Budget transaction deleted",
	})
}
