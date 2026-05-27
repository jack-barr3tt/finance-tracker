package api

import (
	"errors"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgconn"
)

func (s Server) PostUserIdCategoryBudgets(c *fiber.Ctx, userId string) error {
	body, err := GetBody[CategoryBudgetCreateRequest](c)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	if body.Amount <= 0 {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	var id string

	err = s.DB.QueryRow(
		c.Context(),
		`INSERT INTO category_budget (category_id, amount, repeat_until, repeat_every)
		SELECT $1, $2, $3, $4
		FROM category
		WHERE id = $1 AND user_id = $5
		RETURNING id`,
		body.CategoryId,
		body.Amount,
		body.RepeatUntil,
		body.RepeatEvery,
		userId,
	).Scan(&id)
	if err != nil {
		if isUniqueViolation(err) {
			return c.Status(fiber.StatusConflict).JSON(Conflict{
				Message: "A category budget already exists for this category",
			})
		}
		return DBError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(CategoryBudgetCreateResponse{
		Id: id,
	})
}

func (s Server) GetUserIdCategoryBudgets(c *fiber.Ctx, userId string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	rows, err := s.DB.Query(
		c.Context(),
		`SELECT
			cb.id, cb.amount, cb.repeat_until, cb.repeat_every, cb.created_at, cb.deleted_at,
			c.id, c.name, c.created_at
		FROM category_budget cb
		INNER JOIN category c ON cb.category_id = c.id
		WHERE c.user_id = $1 AND cb.deleted_at IS NULL
		ORDER BY cb.created_at DESC`,
		userId,
	)
	if err != nil {
		return DBError(c, err)
	}

	categoryBudgets := []CategoryBudget{}
	for rows.Next() {
		categoryBudget := CategoryBudget{}
		var c_id string
		var c_name string
		var c_created_at time.Time
		err = rows.Scan(
			&categoryBudget.Id, &categoryBudget.Amount, &categoryBudget.RepeatUntil, &categoryBudget.RepeatEvery, &categoryBudget.CreatedAt, &categoryBudget.DeletedAt,
			&c_id, &c_name, &c_created_at,
		)
		if err != nil {
			return DBError(c, err)
		}

		categoryBudget.Category = Category{
			Id:        c_id,
			Name:      c_name,
			CreatedAt: c_created_at,
			Rules:     []CategoryRule{},
		}

		categoryBudgets = append(categoryBudgets, categoryBudget)
	}

	return c.Status(fiber.StatusOK).JSON(categoryBudgets)
}

func (s *Server) GetUserIdCategoryBudgetsCategoryBudgetId(c *fiber.Ctx, id string, categoryBudgetId string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != id {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	row := s.DB.QueryRow(c.Context(), `
		SELECT
			cb.id, cb.amount, cb.repeat_until, cb.repeat_every, cb.created_at, cb.deleted_at,
			c.id, c.name, c.created_at
		FROM category_budget cb
		INNER JOIN category c ON cb.category_id = c.id
		WHERE cb.id = $1 AND c.user_id = $2 AND cb.deleted_at IS NULL
	`, categoryBudgetId, id)

	categoryBudget := CategoryBudget{}
	var c_id string
	var c_name string
	var c_created_at time.Time
	err := row.Scan(
		&categoryBudget.Id, &categoryBudget.Amount, &categoryBudget.RepeatUntil, &categoryBudget.RepeatEvery, &categoryBudget.CreatedAt, &categoryBudget.DeletedAt,
		&c_id, &c_name, &c_created_at,
	)
	if err != nil {
		return DBError(c, err)
	}

	categoryBudget.Category = Category{
		Id:        c_id,
		Name:      c_name,
		CreatedAt: c_created_at,
		Rules:     []CategoryRule{},
	}

	return c.Status(fiber.StatusOK).JSON(categoryBudget)
}

func (s *Server) PatchUserIdCategoryBudgetsCategoryBudgetId(c *fiber.Ctx, id string, categoryBudgetId string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != id {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	body, err := GetBody[CategoryBudgetEditRequest](c)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	if body.Amount != nil && *body.Amount <= 0 {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	if body.CategoryId != nil {
		var categoryExists bool
		err = s.DB.QueryRow(
			c.Context(),
			`SELECT EXISTS(SELECT 1 FROM category WHERE id = $1 AND user_id = $2)`,
			*body.CategoryId,
			id,
		).Scan(&categoryExists)
		if err != nil {
			return DBError(c, err)
		}
		if !categoryExists {
			return c.SendStatus(fiber.StatusNotFound)
		}
	}

	tag, err := s.DB.Exec(c.Context(), `
		UPDATE category_budget cb
		SET
			category_id = COALESCE($1, cb.category_id),
			amount = COALESCE($2, cb.amount),
			repeat_until = COALESCE($3, cb.repeat_until),
			repeat_every = COALESCE($4, cb.repeat_every)
		FROM category c
		WHERE cb.id = $5 AND cb.category_id = c.id AND c.user_id = $6 AND cb.deleted_at IS NULL
	`, body.CategoryId, body.Amount, body.RepeatUntil, body.RepeatEvery, categoryBudgetId, id)
	if err != nil {
		if isUniqueViolation(err) {
			return c.Status(fiber.StatusConflict).JSON(Conflict{
				Message: "A category budget already exists for this category",
			})
		}
		return DBError(c, err)
	}

	if tag.RowsAffected() == 0 {
		return c.SendStatus(fiber.StatusNotFound)
	}

	return c.JSON(CategoryBudgetEditResponse{
		Id: categoryBudgetId,
	})
}

func (s Server) DeleteUserIdCategoryBudgetsCategoryBudgetId(c *fiber.Ctx, userId, categoryBudgetId string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	tag, err := s.DB.Exec(c.Context(), `
		UPDATE category_budget cb
		SET deleted_at = NOW()
		FROM category c
		WHERE cb.id = $1 AND cb.category_id = c.id AND c.user_id = $2 AND cb.deleted_at IS NULL
	`, categoryBudgetId, userId)
	if err != nil {
		return DBError(c, err)
	}

	if tag.RowsAffected() == 0 {
		return c.SendStatus(fiber.StatusNotFound)
	}

	return c.Status(fiber.StatusOK).JSON(CategoryBudgetDeleteResponse{
		Id:      categoryBudgetId,
		Message: "Category budget deleted",
	})
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
