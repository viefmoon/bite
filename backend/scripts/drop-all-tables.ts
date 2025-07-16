import { AppDataSource } from '../src/database/data-source';

async function dropAllTables() {
  try {
    console.log('🔄 Iniciando eliminación completa de todas las tablas...');
    
    // Inicializar la conexión
    await AppDataSource.initialize();
    console.log('✅ Conexión establecida');
    
    // Desactivar restricciones de foreign key temporalmente
    await AppDataSource.query('SET session_replication_role = replica;');
    
    // Obtener todas las tablas
    const tables = await AppDataSource.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    console.log(`📊 Se encontraron ${tables.length} tablas`);
    
    // Eliminar cada tabla
    for (const table of tables) {
      console.log(`🗑️  Eliminando tabla: ${table.tablename}`);
      await AppDataSource.query(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`);
    }
    
    // Obtener todos los tipos ENUM
    const enums = await AppDataSource.query(`
      SELECT n.nspname, t.typname 
      FROM pg_type t 
      JOIN pg_namespace n ON n.oid = t.typnamespace 
      WHERE t.typtype = 'e' AND n.nspname = 'public'
    `);
    
    console.log(`📊 Se encontraron ${enums.length} tipos ENUM`);
    
    // Eliminar cada tipo ENUM
    for (const enumType of enums) {
      console.log(`🗑️  Eliminando tipo: ${enumType.typname}`);
      await AppDataSource.query(`DROP TYPE IF EXISTS "${enumType.typname}" CASCADE`);
    }
    
    // Reactivar restricciones
    await AppDataSource.query('SET session_replication_role = DEFAULT;');
    
    // Cerrar la conexión
    await AppDataSource.destroy();
    console.log('✅ Conexión cerrada');
    
    console.log('🎉 Todas las tablas y tipos han sido eliminados!');
    console.log('📝 La base de datos está completamente vacía.');
    console.log('📝 Ahora puedes ejecutar: npm run migration:run');
  } catch (error) {
    console.error('❌ Error durante la eliminación:', error);
    process.exit(1);
  }
}

// Ejecutar solo si es el archivo principal
if (require.main === module) {
  dropAllTables();
}