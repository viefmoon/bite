import { Transform, TransformFnParams } from 'class-transformer';

/**
 * Decorator that transforms the property value to a default value if it is undefined.
 * @param defaultValue The default value to set if the property is undefined.
 */
export function TransformDefault(defaultValue: any): PropertyDecorator {
  return Transform(({ value }: TransformFnParams) => {
    if (value !== undefined) {
      return value;
    }
    return defaultValue;
  });
}