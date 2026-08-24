import { Router } from 'express';
import { getHealth, getReadiness } from '../controllers/health.controller';

const healthRouter = Router();

healthRouter.get('/', getHealth);
healthRouter.get('/ready', getReadiness);

export default healthRouter;
