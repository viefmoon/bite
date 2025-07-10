import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class UserAssignmentDto {
  @ApiProperty({
    type: String,
    example: 'USR-123',
    description: 'ID del usuario',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Si esta pantalla es la predeterminada para el usuario',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class AssignUsersDto {
  @ApiProperty({
    type: [UserAssignmentDto],
    description: 'Lista de usuarios a asignar con sus configuraciones',
  })
  @IsArray()
  users: UserAssignmentDto[];
}
