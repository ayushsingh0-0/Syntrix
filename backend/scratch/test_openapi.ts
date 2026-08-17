import openapiSpec from '../src/docs/openapi.json';
import { createPaginatedResponse } from '../src/utils/pagination';

async function testOpenApiAndQuality() {
  console.log('🧪 Starting Section 20: API Quality & OpenAPI E2E Verification...\n');

  // 1. Verify OpenAPI 3.0 Document Structure
  console.log('1️⃣ Validating OpenAPI 3.0 Document Structure...');
  console.log(`   - Specification Version: ${openapiSpec.openapi}`);
  console.log(`   - API Title: "${openapiSpec.info.title}" (v${openapiSpec.info.version})`);
  console.log(`   - Gateway Server: ${openapiSpec.servers[0].url}`);

  if (openapiSpec.openapi !== '3.0.3') {
    throw new Error('Expected OpenAPI version to be 3.0.3');
  }

  // 2. Verify Security Schemes
  const securitySchemes = openapiSpec.components.securitySchemes;
  console.log(`   - Security Schemes Defined: [${Object.keys(securitySchemes).join(', ')}]`);
  if (!securitySchemes.BearerAuth || !securitySchemes.CookieAuth) {
    throw new Error('Expected BearerAuth and CookieAuth security schemes');
  }

  // 3. Verify Path & Schema Coverage
  const pathCount = Object.keys(openapiSpec.paths).length;
  const schemaCount = Object.keys(openapiSpec.components.schemas).length;
  console.log(`   - Total Documented API Routes: ${pathCount}`);
  console.log(`   - Total Documented JSON Schemas: ${schemaCount}`);

  if (pathCount < 10) {
    throw new Error(`Expected at least 10 API routes in OpenAPI spec, got ${pathCount}`);
  }
  if (schemaCount < 5) {
    throw new Error(`Expected at least 5 component schemas, got ${schemaCount}`);
  }
  console.log('✅ OpenAPI 3.0 specification structure validated.\n');

  // 4. Test Standard Pagination Envelope Helper
  console.log('2️⃣ Testing Standard Pagination Envelope Helper...');
  const sampleItems = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const paginatedResult = createPaginatedResponse(sampleItems, 55, 2, 10);

  console.log('   - Generated Pagination Envelope:', JSON.stringify(paginatedResult.meta));

  if (
    paginatedResult.meta.page !== 2 ||
    paginatedResult.meta.limit !== 10 ||
    paginatedResult.meta.total !== 55 ||
    paginatedResult.meta.totalPages !== 6 ||
    paginatedResult.meta.hasNextPage !== true ||
    paginatedResult.meta.hasPrevPage !== true
  ) {
    throw new Error('Pagination meta math assertion failed');
  }

  // Test Boundary: First Page
  const firstPage = createPaginatedResponse(sampleItems, 55, 1, 10);
  if (firstPage.meta.hasPrevPage !== false || firstPage.meta.hasNextPage !== true) {
    throw new Error('First page boundary assertion failed');
  }

  // Test Boundary: Last Page
  const lastPage = createPaginatedResponse(sampleItems, 55, 6, 10);
  if (lastPage.meta.hasPrevPage !== true || lastPage.meta.hasNextPage !== false) {
    throw new Error('Last page boundary assertion failed');
  }
  console.log('✅ Pagination helper math and boundary states verified.\n');

  console.log('🎉 Section 20: API Quality & OpenAPI Verification Completed Successfully!\n');
}

testOpenApiAndQuality().catch((err) => {
  console.error('❌ OpenAPI verification failed:', err);
  process.exit(1);
});
