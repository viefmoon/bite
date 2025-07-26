Arquitectura y Estructura de Datos

1. Unificar Tipos y Esquemas de Zod
   Problema: Múltiples módulos contienen tanto un directorio schema para validaciones de Zod como un directorio types para definiciones de TypeScript. Esto genera duplicación, ya que los tipos a menudo se derivan de los esquemas (z.infer) y luego se reexportan, o se crean interfaces de TypeScript separadas que podrían derivarse.
   Refactorización: Consolidar todas las definiciones de datos en los archivos schema/\*.schema.ts. Utilizar z.infer<typeof schema> para generar los tipos de TypeScript y exportarlos directamente desde el mismo archivo. Eliminar los directorios types o usarlos exclusivamente para tipos que no pueden ser representados por Zod (como firmas de funciones complejas o estados de máquinas).
   Archivos Afectados:
   areasTables/types/areasTables.types.ts
   auth/types/auth.types.ts
   customers/types/customer.types.ts
   modifiers/types/modifier.types.ts
   printers/types/printer.types.ts
   Y sus correspondientes archivos en schema/.
2. Derivar Esquemas en lugar de Duplicar
   Problema: En archivos como customers/schema/customer.schema.ts, se definen múltiples esquemas (createCustomerSchema, updateCustomerSchema, customerFormSchema) con campos muy similares, lo que lleva a la duplicación de la lógica de validación.
   Refactorización: Crear un esquema base (customerBaseSchema) y usar los métodos de Zod como .partial(), .extend() y .omit() para derivar los esquemas de creación, actualización y formulario. Esto centraliza la definición de los campos y reduce la duplicación.
   Archivos Afectados:
   customers/schema/customer.schema.ts
   menu/schema/products.schema.ts
   modifiers/schema/modifierGroup.schema.ts
