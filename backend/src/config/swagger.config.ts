import swaggerUi from 'swagger-ui-express';
import openapiSpec from '../docs/openapi.json';

export const swaggerOptions: swaggerUi.SwaggerUiOptions = {
  customSiteTitle: 'Syntrix API Documentation',
  customCss: `
    .swagger-ui .topbar { background-color: #1e1b4b; border-bottom: 2px solid #6366f1; }
    .swagger-ui .topbar .topbar-wrapper a { content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="24" viewBox="0 0 120 24"><text x="0" y="18" fill="%236366f1" font-family="sans-serif" font-weight="bold" font-size="18">SYNTRIX</text></svg>'); }
    .swagger-ui .info .title { color: #4338ca; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
};

export { swaggerUi, openapiSpec };
