import { AppDataSource } from '../src/database/data-source';

async function runMigrations() {
  try {
    console.log('🔄 Ejecutando migraciones...');
    
    // Inicializar la conexión
    await AppDataSource.initialize();
    console.log('✅ Conexión establecida');
    
    // Ejecutar las migraciones pendientes
    const migrations = await AppDataSource.runMigrations();
    
    if (migrations.length === 0) {
      console.log('✅ No hay migraciones pendientes');
    } else {
      console.log(`✅ Se ejecutaron ${migrations.length} migraciones:`);
      migrations.forEach(migration => {
        console.log(`   - ${migration.name}`);
      });
    }
    
    // Cerrar la conexión
    await AppDataSource.destroy();
    console.log('✅ Conexión cerrada');
    
    console.log('🎉 Migraciones completadas exitosamente!');
  } catch (error) {
    console.error('❌ Error durante las migraciones:', error);
    process.exit(1);
  }
}

// Ejecutar solo si es el archivo principal
if (require.main === module) {
  runMigrations();
}