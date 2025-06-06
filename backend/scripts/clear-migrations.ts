import { AppDataSource } from '../src/database/data-source';

async function clearMigrations() {
  try {
    console.log('🔄 Limpiando historial de migraciones...');
    
    // Inicializar la conexión
    await AppDataSource.initialize();
    console.log('✅ Conexión establecida');
    
    // Eliminar solo la tabla de migraciones
    await AppDataSource.query('DROP TABLE IF EXISTS "migrations" CASCADE');
    console.log('🗑️  Tabla de migraciones eliminada');
    
    // Cerrar la conexión
    await AppDataSource.destroy();
    console.log('✅ Conexión cerrada');
    
    console.log('🎉 Historial de migraciones limpiado!');
    console.log('📝 Ahora puedes ejecutar: npm run migration:run');
  } catch (error) {
    console.error('❌ Error al limpiar migraciones:', error);
    process.exit(1);
  }
}

// Ejecutar solo si es el archivo principal
if (require.main === module) {
  clearMigrations();
}