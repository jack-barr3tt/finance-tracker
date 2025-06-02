package api

import (
	"time"

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

	var name string
	var createdAt time.Time

	err := s.DB.QueryRow(c.Context(), "SELECT name, created_at FROM category WHERE user_id = $1 AND id = $2", userId, categoryId).Scan(&name, &createdAt)
	if err != nil {
		return DBError(c, err)
	}

	return c.
		Status(fiber.StatusOK).
		JSON(Category{
			Id:        categoryId,
			Name:      name,
			CreatedAt: createdAt,
		})
}

func (s Server) DeleteUserIdCategoriesCategoryId(c *fiber.Ctx, userId string, categoryId string) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	tag, err := s.DB.Exec(c.Context(), "DELETE FROM category WHERE user_id = $1 AND id = $2", userId, categoryId)
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
