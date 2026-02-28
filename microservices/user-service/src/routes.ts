import express, { Request, Response, NextFunction } from 'express';
import { UserService } from './service';
import { z } from 'zod';

const router = express.Router();
const userService = new UserService();

// Validation schemas
const RegisterSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6).max(100),
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).max(100).optional(),
});

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input or username/email already exists
 *       500:
 *         description: Internal server error
 */
router.post('/users/register', async (req: Request, res: Response) => {
  try {
    const data = RegisterSchema.parse(req.body);
    const result = await userService.register(data);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate with username and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post('/users/login', async (req: Request, res: Response) => {
  try {
    const data = LoginSchema.parse(req.body);
    const result = await userService.login(data);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error && error.message === 'Invalid username or password') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/verify:
 *   get:
 *     summary: Verify JWT token
 *     description: Verify if a JWT token is valid and return the associated user
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPublic'
 *       401:
 *         description: Invalid or missing token
 */
router.get('/users/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = UserService.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const user = userService.getUser(decoded.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  res.json(user);
});

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve user profile by ID
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPublic'
 *       404:
 *         description: User not found
 */
router.get('/users/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = userService.getUser(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

/**
 * @swagger
 * /api/users/{userId}:
 *   put:
 *     summary: Update user profile
 *     description: Update user profile details
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPublic'
 *       400:
 *         description: Invalid data or email taken
 *       404:
 *         description: User not found
 */
router.put('/users/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const data = UpdateUserSchema.parse(req.body);
    const user = await userService.updateUser(userId, data);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: Delete user account
 *     description: Permanently delete a user account
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.delete('/users/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const deleted = userService.deleteUser(userId);
  if (!deleted) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ message: 'User deleted successfully' });
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     description: Check if the user service is healthy
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'user-service', timestamp: new Date().toISOString() });
});

export default router;
