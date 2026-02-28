import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Service API',
      version: '1.0.0',
      description: 'API documentation for the User Management & Authentication microservice',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3005',
        description: 'Development server',
      },
      {
        url: 'http://localhost:3000',
        description: 'API Gateway',
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints (register, login)',
      },
      {
        name: 'Users',
        description: 'User profile management endpoints',
      },
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/users/login or /api/users/register',
        },
      },
      schemas: {
        RegisterRequest: {
          type: 'object',
          required: ['username', 'password', 'name', 'email'],
          properties: {
            username: { type: 'string', minLength: 3, maxLength: 30, example: 'johndoe' },
            password: { type: 'string', minLength: 6, example: 'mypassword123' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', example: 'johndoe' },
            password: { type: 'string', example: 'mypassword123' },
          },
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'John Smith' },
            email: { type: 'string', format: 'email', example: 'john.smith@example.com' },
            password: { type: 'string', minLength: 6, example: 'newpassword123' },
          },
        },
        UserPublic: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user_123' },
            username: { type: 'string', example: 'johndoe' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/UserPublic' },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
  },
  apis: ['./src/routes.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'User Service API Docs',
  }));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
