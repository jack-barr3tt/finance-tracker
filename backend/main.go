package main

import (
	"context"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/jack-barr3tt/finance-tracker/api"
)

func main() {
	context := context.Background()

	// create a type that satisfies the `api.ServerInterface`, which contains an implementation of every operation from the generated code
	server, err := api.NewServer(context)
	if err != nil {
		panic(err)
	}

	app := fiber.New()

	app.Use(server.JWTAuthMiddleware)

	api.RegisterHandlers(app, server)

	// And we serve HTTP until the world ends.
	log.Fatal(app.Listen("0.0.0.0:8080"))
}
