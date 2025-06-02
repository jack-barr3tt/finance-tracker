package api

import "github.com/gofiber/fiber/v2"

func (s *Server) GetBanks(c *fiber.Ctx) error {
	banks := []Bank{}

	rows, err := s.DB.Query(c.Context(), `SELECT id, name, fixed_products, csv_import_enabled, api_import_enabled FROM "bank"`)
	if err != nil {
		return DBError(c, err)
	}

	for rows.Next() {
		bank := Bank{}
		if err := rows.Scan(&bank.Id, &bank.Name, &bank.FixedProducts, &bank.CsvImportEnabled, &bank.ApiImportEnabled); err != nil {
			return DBError(c, err)
		}
		banks = append(banks, bank)
	}

	return c.JSON(banks)
}
