# Guía: Usar PostgreSQL de Railway como Base de Datos Remota/Respaldo

## Opción 1: Usar la misma base de datos del cloud-service (NO recomendado)

**Problema**: Mezclarías datos del cloud-service con los del backend local, causando conflictos.

## Opción 2: Crear una base de datos separada en Railway (RECOMENDADO)

### Pasos para crear una BD adicional en Railway:

1. **En el dashboard de Railway**:
   - Ve a tu proyecto
   - Click en "New" → "Database" → "Add PostgreSQL"
   - Nómbralo algo como "backend-backup-db"

2. **Obtener las credenciales**:
   - Click en la nueva base de datos
   - Ve a "Variables"
   - Copia el `DATABASE_URL`

3. **Configurar tu backend local**:

#### Opción A: Usar siempre la BD remota
```bash
# En backend/.env
DATABASE_URL=postgresql://usuario:password@host.railway.app:puerto/railway
```

#### Opción B: Configuración dual (local + remoto)
```bash
# En backend/.env
# Base de datos local (desarrollo)
DATABASE_URL=postgresql://postgres:password@localhost:5432/bite_local

# Base de datos remota (respaldo)
REMOTE_DATABASE_URL=postgresql://usuario:password@host.railway.app:puerto/railway

# Elegir cuál usar
USE_REMOTE_DB=false  # cambiar a true para usar Railway
```

### Implementar lógica de respaldo en el backend:

Crea un servicio de respaldo en tu backend:

```typescript
// backend/src/services/backup.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';

@Injectable()
export class BackupService {
  private execAsync = promisify(exec);

  constructor(private configService: ConfigService) {}

  // Respaldar base local a Railway
  async backupToRemote(): Promise<void> {
    const localDb = this.configService.get('DATABASE_URL');
    const remoteDb = this.configService.get('REMOTE_DATABASE_URL');

    // Exportar datos locales
    await this.execAsync(
      `pg_dump ${localDb} --clean --if-exists > /tmp/backup.sql`
    );

    // Importar a Railway
    await this.execAsync(
      `psql ${remoteDb} < /tmp/backup.sql`
    );
  }

  // Restaurar desde Railway a local
  async restoreFromRemote(): Promise<void> {
    const localDb = this.configService.get('DATABASE_URL');
    const remoteDb = this.configService.get('REMOTE_DATABASE_URL');

    // Exportar datos remotos
    await this.execAsync(
      `pg_dump ${remoteDb} --clean --if-exists > /tmp/restore.sql`
    );

    // Importar a local
    await this.execAsync(
      `psql ${localDb} < /tmp/restore.sql`
    );
  }

  // Sincronización programada
  async syncDatabases(): Promise<void> {
    // Implementar lógica de sincronización bidireccional
    // según tus necesidades
  }
}
```

### Crear endpoints de respaldo:

```typescript
// backend/src/modules/backup/backup.controller.ts
import { Controller, Post, UseGuards } from '@nestjs/common';
import { BackupService } from './backup.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('backup')
@UseGuards(AuthGuard('jwt'))
export class BackupController {
  constructor(private backupService: BackupService) {}

  @Post('to-remote')
  async backupToRemote() {
    await this.backupService.backupToRemote();
    return { message: 'Backup completado' };
  }

  @Post('from-remote')
  async restoreFromRemote() {
    await this.backupService.restoreFromRemote();
    return { message: 'Restauración completada' };
  }
}
```

### Respaldo automático con CRON:

```typescript
// backend/src/modules/backup/backup.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}

// En backup.service.ts agregar:
import { Cron } from '@nestjs/schedule';

@Injectable()
export class BackupService {
  // ... código anterior ...

  // Respaldar cada día a las 2 AM
  @Cron('0 2 * * *')
  async automaticBackup() {
    console.log('Iniciando respaldo automático...');
    await this.backupToRemote();
    console.log('Respaldo automático completado');
  }
}
```

## Opción 3: Replicación en tiempo real

Para una solución más robusta, configura replicación PostgreSQL:

1. **Usar Railway como réplica de lectura**:
   - Configura tu PostgreSQL local como master
   - Railway PostgreSQL como slave
   - Requiere configuración avanzada de PostgreSQL

2. **Usar herramientas de sincronización**:
   - **pglogical**: Para replicación lógica
   - **wal2json**: Para streaming de cambios
   - **Debezium**: Para CDC (Change Data Capture)

## Scripts útiles para respaldo manual:

```bash
#!/bin/bash
# scripts/backup-to-railway.sh

# Cargar variables de entorno
source backend/.env

# Hacer backup
echo "Exportando base de datos local..."
pg_dump $DATABASE_URL --clean --if-exists > backup_$(date +%Y%m%d_%H%M%S).sql

echo "Importando a Railway..."
psql $REMOTE_DATABASE_URL < backup_*.sql

echo "Respaldo completado!"
```

```bash
#!/bin/bash
# scripts/restore-from-railway.sh

# Cargar variables de entorno
source backend/.env

# Restaurar
echo "Exportando desde Railway..."
pg_dump $REMOTE_DATABASE_URL --clean --if-exists > restore_temp.sql

echo "¿Estás seguro de sobrescribir la base local? (y/n)"
read confirm
if [ "$confirm" = "y" ]; then
  psql $DATABASE_URL < restore_temp.sql
  echo "Restauración completada!"
else
  echo "Restauración cancelada"
fi
```

## Ventajas de esta configuración:

1. **Respaldo automático**: Sin perder datos si falla el servidor local
2. **Desarrollo remoto**: Puedes trabajar desde cualquier lugar
3. **Testing**: Probar con datos reales sin afectar producción
4. **Disaster Recovery**: Recuperación rápida ante fallos

## Consideraciones importantes:

1. **Costos**: Railway cobra por uso de base de datos
2. **Latencia**: La BD remota será más lenta que local
3. **Seguridad**: Usa siempre conexiones SSL
4. **Límites**: Verifica los límites de tu plan en Railway
5. **GDPR**: Considera dónde se almacenan los datos

## Configuración recomendada para desarrollo:

```typescript
// backend/src/config/database.config.ts
export default () => ({
  database: {
    // Usar BD remota si está configurada y habilitada
    url: process.env.USE_REMOTE_DB === 'true' 
      ? process.env.REMOTE_DATABASE_URL 
      : process.env.DATABASE_URL,
    
    // Configuración específica para BD remota
    ssl: process.env.USE_REMOTE_DB === 'true' 
      ? { rejectUnauthorized: false } 
      : false,
    
    // Timeouts más largos para BD remota
    connectTimeoutMS: process.env.USE_REMOTE_DB === 'true' 
      ? 30000 
      : 10000,
  }
});
```

## Comandos útiles:

```bash
# Ver tamaño de la BD en Railway
railway run psql -c "SELECT pg_database_size('railway');"

# Hacer backup solo de estructura
pg_dump --schema-only $REMOTE_DATABASE_URL > schema.sql

# Hacer backup solo de datos
pg_dump --data-only $REMOTE_DATABASE_URL > data.sql

# Backup de tablas específicas
pg_dump -t products -t orders $REMOTE_DATABASE_URL > important_tables.sql
```