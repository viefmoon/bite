import 'reflect-metadata';
import { AppDataSource } from '../src/database/data-source';

async function cleanDuplicateProducts() {
  await AppDataSource.initialize();

  try {
    // Buscar productos duplicados
    const duplicates = await AppDataSource.query(`
      SELECT name, COUNT(*) as count 
      FROM product 
      WHERE "deletedAt" IS NULL 
      GROUP BY name 
      HAVING COUNT(*) > 1
    `);

    console.log('Productos duplicados encontrados:', duplicates);

    for (const dup of duplicates) {
      // Obtener todos los productos con ese nombre
      const products = await AppDataSource.query(`
        SELECT id, name, "createdAt" 
        FROM product 
        WHERE name = $1 AND "deletedAt" IS NULL 
        ORDER BY "createdAt" ASC
      `, [dup.name]);

      console.log(`\nProcesando productos con nombre "${dup.name}":`);
      
      // Mantener el primero (más antiguo) y eliminar el resto
      for (let i = 1; i < products.length; i++) {
        console.log(`  - Eliminando producto duplicado: ${products[i].id}`);
        await AppDataSource.query(`
          UPDATE product 
          SET "deletedAt" = NOW() 
          WHERE id = $1
        `, [products[i].id]);
      }
    }

    console.log('\nLimpieza completada!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

cleanDuplicateProducts();