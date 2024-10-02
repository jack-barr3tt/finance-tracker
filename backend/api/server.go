package api

import (
	"context"
	"fmt"
	"log"
	"os"
	"regexp"
	"strconv"

	"github.com/getkin/kin-openapi/openapi3"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"

	"github.com/jackc/pgx/v5"
)

// ensure that we've conformed to the `ServerInterface` with a compile-time check
var _ ServerInterface = (*Server)(nil)

type Server struct {
	DB        *pgx.Conn
	JWTSecret string
	Spec      *openapi3.T
}

func NewServer(ctx context.Context) (*Server, error) {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	host := os.Getenv("DB_HOST")
	port, _ := strconv.Atoi(os.Getenv("DB_PORT"))
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")

	conn, err := pgx.Connect(ctx, fmt.Sprintf("host=%s port=%d user=%s "+
		"password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname))
	if err != nil {
		return nil, err
	}

	spec, err := GetSwagger()
	if err != nil {
		return nil, err
	}

	return &Server{
		DB:        conn,
		JWTSecret: os.Getenv("JWT_SECRET"),
		Spec:      spec,
	}, nil
}

func getOperationForMethod(pathItem *openapi3.PathItem, method string) *openapi3.Operation {
	if pathItem == nil {
		return nil
	}

	switch method {
	case fiber.MethodGet:
		return pathItem.Get
	case fiber.MethodPost:
		return pathItem.Post
	case fiber.MethodPut:
		return pathItem.Put
	case fiber.MethodDelete:
		return pathItem.Delete
	case fiber.MethodPatch:
		return pathItem.Patch
	case fiber.MethodOptions:
		return pathItem.Options
	case fiber.MethodHead:
		return pathItem.Head
	case fiber.MethodTrace:
		return pathItem.Trace
	default:
		return nil
	}
}

func (s Server) routeRequiresAuth(c *fiber.Ctx) bool {
	var pathItem *openapi3.PathItem

	variableRegex := regexp.MustCompile(`\{(.+?)\}`)
	for k, v := range s.Spec.Paths.Map() {
		path := variableRegex.ReplaceAllString(k, ".+?")
		pathRegex := regexp.MustCompile(fmt.Sprintf("^%s$", path))

		if pathRegex.MatchString(c.Path()) {
			pathItem = v
			break
		}
	}

	if pathItem == nil {
		return true
	}

	op := getOperationForMethod(pathItem, c.Method())

	if op == nil {
		return true
	}

	requiresAuth := false
	if op.Security != nil {
		for _, securityRequirement := range *op.Security {
			if _, ok := securityRequirement["BearerAuth"]; ok {
				requiresAuth = true
				break
			}
		}
	}

	return requiresAuth
}

// JWT auth middleware that applies conditionally based on openapi spec
func (s Server) JWTAuthMiddleware(c *fiber.Ctx) error {
	if !s.routeRequiresAuth(c) {
		return c.Next()
	}

	// if the operation requires authentication, check for a valid JWT
	// get the token from the Authorization header
	authHeader := c.Get("Authorization")

	re := regexp.MustCompile(`^Bearer (.+)$`)
	matches := re.FindStringSubmatch(authHeader)
	if len(matches) == 2 {
		authHeader = matches[1]
	}

	if authHeader == "" {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	// parse the token
	token, err := jwt.Parse(authHeader, func(token *jwt.Token) (interface{}, error) {
		// validate the algorithm
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.JWTSecret), nil
	})
	if err != nil {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	// set the user in the context
	c.Locals("user", token)

	return c.Next()
}
