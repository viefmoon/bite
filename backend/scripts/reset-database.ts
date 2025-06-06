import { AppDataSource } from '../src/database/data-source';

async function resetDatabase() {
  try {
    console.log('🔄 Iniciando reset de la base de datos...');
    
    // Inicializar la conexión
    await AppDataSource.initialize();
    console.log('✅ Conexión establecida');
    
    // Eliminar el schema completamente (incluyendo la tabla de migraciones)
    await AppDataSource.dropDatabase();
    console.log('🗑️  Base de datos eliminada');
    
    // Sincronizar el schema (crea la base de datos y todas las tablas desde cero)
    await AppDataSource.synchronize();
    console.log('✅ Schema sincronizado');
    
    // Cerrar la conexión
    await AppDataSource.destroy();
    console.log('✅ Conexión cerrada');
    
    console.log('🎉 Reset completado exitosamente!');
    console.log('📝 Ahora puedes ejecutar: npm run migration:run');
  } catch (error) {
    console.error('❌ Error durante el reset:', error);
    process.exit(1);
  }
}

// Ejecutar solo si es el archivo principal
if (require.main === module) {
  resetDatabase();
}