package main

import (
	"context"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/jack-barr3tt/finance-tracker/api"
)

const defaultListenAddr = "0.0.0.0:8080"

func main() {
	context := context.Background()

	// create a type that satisfies the `api.ServerInterface`, which contains an implementation of every operation from the generated code
	server, err := api.NewServer(context)
	if err != nil {
		panic(err)
	}
	defer server.DB.Close()

	app := fiber.New()

	app.Use(cors.New())

	app.Use(server.JWTAuthMiddleware)
	app.Use(recover.New(recover.Config{EnableStackTrace: true}))

	api.RegisterHandlers(app, server)

	// And we serve HTTP until the world ends.
	listenAddr := os.Getenv("API_LISTEN_ADDR")
	if listenAddr == "" {
		listenAddr = defaultListenAddr
	}

	log.Printf("Listening on %s", listenAddr)
	log.Fatal(app.Listen(listenAddr))
}
