import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import cartRoutes from './routes';
import { setupSwagger } from './swagger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request/Response logging middleware (verbose for debugging)
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    console.info(`[CartService] Request: ${req.method} ${req.originalUrl}`);
    console.debug(`[CartService] Request Headers: ${JSON.stringify(req.headers)}`);
    if (req.body && Object.keys(req.body).length > 0) {
      try {
        console.debug(`[CartService] Request Body: ${JSON.stringify(req.body)}`);
      } catch (e) {
        console.debug('[CartService] Request Body: <unserializable>');
      }
    }

    const oldJson = res.json.bind(res);
    const oldSend = res.send.bind(res);

    (res as any).json = (body: any) => {
      try {
        console.debug(`[CartService] Response Body: ${JSON.stringify(body)}`);
      } catch (e) {
        console.debug('[CartService] Response Body: <unserializable>');
      }
      return oldJson(body);
    };

    (res as any).send = (body: any) => {
      try {
        if (typeof body === 'object') console.debug(`[CartService] Response Body: ${JSON.stringify(body)}`);
        else console.debug(`[CartService] Response Body: ${body}`);
      } catch (e) {
        console.debug('[CartService] Response Body: <unserializable>');
      }
      return oldSend(body);
    };
  } catch (e) {
    // swallow logging errors to avoid impacting request flow
  }
  next();
});

// Setup Swagger documentation
setupSwagger(app);

// Routes
app.use('/api', cartRoutes);

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Cart service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`API Docs: http://localhost:${PORT}/api-docs`);
});
