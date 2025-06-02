package api

import (
	"github.com/gofiber/fiber/v2"
)

func (s Server) PostUserIdCategories(c *fiber.Ctx, userId string) error {
	body, err := GetBody[CategoryCreateRequest](c)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	var id string

	err = s.DB.QueryRow(c.Context(), "INSERT INTO category (user_id, name) VALUES ($1, $2) RETURNING id", userId, body.Name).Scan(&id)
	if err != nil {
		return DBError(c, err)
	}

	return c.
		Status(fiber.StatusOK).
		JSON(CategoryCreateResponse{Id: id})
}

func (s Server) GetUserIdCategories(c *fiber.Ctx, userId string) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	rows, err := s.DB.Query(c.Context(), "SELECT id, name FROM category WHERE user_id = $1", userId)
	if err != nil {
		return DBError(c, err)
	}

	categories := []Category{}
	for rows.Next() {
		var id string
		var name string
		err = rows.Scan(&id, &name)
		if err != nil {
			return DBError(c, err)
		}

		categories = append(categories, Category{Id: id, Name: name})
	}

	return c.
		Status(fiber.StatusOK).
		JSON(categories)
}

func (s Server) GetUserIdCategoriesCategoryId(c *fiber.Ctx, userId string, categoryId string) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	category := Category{}
	rules := []CategoryRule{}

	rows, err := s.DB.Query(
		c.Context(),
		`SELECT 
			c.name, c.created_at,
			cr.id, cr.rule_regex,
			a.id, a.name, a.opened_at, a.closed_at
			FROM category c 
			LEFT JOIN category_rule cr ON c.id = cr.category_id 
			LEFT JOIN account a ON cr.account_id = a.id
			WHERE id = $1`,
		categoryId,
	)
	if err != nil {
		return DBError(c, err)
	}

	for rows.Next() {
		rule := CategoryRule{}
		err = rows.Scan(&category.Name, &category.CreatedAt, &rule.Id, &rule.Rule, &rule.Account.Id, &rule.Account.Name, &rule.Account.OpenedAt, &rule.Account.ClosedAt)
		if err != nil {
			return DBError(c, err)
		}
		rules = append(rules, rule)
	}

	category.Rules = rules

	return c.JSON(category)
}

func (s Server) DeleteUserIdCategoriesCategoryId(c *fiber.Ctx, userId string, categoryId string) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	tag, err := s.DB.Exec(c.Context(), "DELETE FROM category WHERE id = $1", categoryId)
	if err != nil {
		return DBError(c, err)
	}

	if tag.RowsAffected() == 0 {
		return c.SendStatus(fiber.StatusNotFound)
	}

	return c.Status(fiber.StatusOK).JSON(CategoryDeleteResponse{
		Id:      categoryId,
		Message: "Category deleted",
	})
}

func (s *Server) PostUserIdCategoriesCategoryIdRules(c *fiber.Ctx, id string, categoryId string) error {
	panic("unimplemented")
}

func (s *Server) DeleteUserIdCategoriesCategoryIdRulesRuleId(c *fiber.Ctx, id string, categoryId string, ruleId string) error {
	panic("unimplemented")
}

func (s *Server) PatchUserIdCategoriesCategoryIdRulesRuleId(c *fiber.Ctx, id string, categoryId string, ruleId string) error {
	panic("unimplemented")
}
