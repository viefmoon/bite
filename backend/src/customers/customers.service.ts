import {
  Injectable,
  Inject,
  NotFoundException,
  // ConflictException no se usa
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CustomerRepository } from './infrastructure/persistence/customer.repository';
import { AddressesService } from './addresses.service';
// AddressRepository ya no se inyecta directamente
import { Customer } from './domain/customer';
import { Address } from './domain/address';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
// IPaginationOptions no se usa
import { FindAllCustomersDto } from './dto/find-all-customers.dto';
// DeepPartial no se usa
// ERROR_CODES no se usa
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
// uuidv4 no se usa
import { CUSTOMER_REPOSITORY } from '../common/tokens'; // Solo CUSTOMER_REPOSITORY
import { BaseCrudService } from '../common/application/base-crud.service';
// AddressesService ya se importó arriba

@Injectable()
export class CustomersService extends BaseCrudService<
  // Extender BaseCrudService
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  FindAllCustomersDto // Usar FindAllCustomersDto como filtro base
> {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    protected readonly repo: CustomerRepository, // 'repo' como en BaseCrudService
    // Inyectar AddressesService para delegar lógica de direcciones
    private readonly addressesService: AddressesService,
  ) {
    super(repo); // Pasar el repositorio principal al constructor base
  }

  // Sobrescribir 'create' para añadir lógica de validación y creación de direcciones
  override async create(
    createCustomerDto: CreateCustomerDto,
  ): Promise<Customer> {
    // La unicidad la maneja la BD y el filtro.
    // Separar DTO del cliente y DTOs de direcciones
    const { addresses: addressDtos, ...customerData } = createCustomerDto;

    // Crear el cliente usando el método base
    const createdCustomer = await super.create(customerData);

    // Crear direcciones si se proporcionan
    if (addressDtos && addressDtos.length > 0) {
      let hasDefault = false;
      for (const addressDto of addressDtos) {
        if (addressDto.isDefault) {
          if (hasDefault) {
            throw new BadRequestException(
              'Solo puede haber una dirección predeterminada.',
            );
          }
          hasDefault = true;
        }
        // Llamar al helper refactorizado que inyecta customerId y usa AddressesService
        // Asegurarse de que addAddressToCustomer maneje la lógica de 'isDefault' internamente si es necesario
        await this.addAddressToCustomer(createdCustomer.id, addressDto);
      }
      // Recargar el cliente para obtener las direcciones asociadas
      // findOne es heredado y maneja NotFoundException
      return this.findOne(createdCustomer.id);
    }

    return createdCustomer; // Devolver cliente sin direcciones si no se proporcionaron
  }

  // Se elimina findAll con paginación. El findAll heredado de BaseCrudService no tiene paginación.

  // findOne es heredado de BaseCrudService

  // Sobrescribir 'update' para añadir lógica de validación y sincronización de direcciones
  override async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    // findOne es heredado, lo usamos para validar la existencia del cliente
    await this.findOne(id);

    // Se eliminan las validaciones preventivas de email y teléfono para la actualización.
    // La base de datos y el UniqueViolationFilter se encargarán de la unicidad.

    // Preparar payload para el update base (solo campos del cliente)
    const customerUpdatePayload: UpdateCustomerDto = {
      firstName: updateCustomerDto.firstName,
      lastName: updateCustomerDto.lastName,
      phoneNumber: updateCustomerDto.phoneNumber,
      email: updateCustomerDto.email,
      birthDate: updateCustomerDto.birthDate,
      isActive: updateCustomerDto.isActive,
      fullChatHistory: updateCustomerDto.fullChatHistory,
      relevantChatHistory: updateCustomerDto.relevantChatHistory,
      lastInteraction: updateCustomerDto.lastInteraction,
      // Excluir 'addresses' del payload para el update base
    };

    // Llamar al update base para actualizar los campos del cliente
    // Nota: El update base podría devolver null si no encuentra la entidad, pero findOne ya lo valida.
    await super.update(id, customerUpdatePayload); // Llamar al update de BaseCrudService

    // Se elimina la lógica de sincronización de direcciones (if block y syncAddresses call)
    // ya que UpdateCustomerDto no incluye 'addresses'.
    // El super.update ya guardó los campos básicos del cliente.

    // Recargar y devolver el cliente actualizado completo (con sus direcciones existentes si las tuviera)
    return this.findOne(id);
  }

  // remove es heredado de BaseCrudService

  // --- Métodos específicos para Direcciones (mantenerlos) ---

  /* --------- Address helpers --------- */

  async addAddressToCustomer(
    customerId: string,
    dto: CreateAddressDto,
  ): Promise<Address> {
    await this.findOne(customerId); // valida cliente existente
    // 🔑 Inyectar customerId en el DTO antes de llamar al servicio de direcciones
    const fullDto = { ...dto, customerId };
    // Si la nueva dirección es default, quitar la marca de las otras
    if (fullDto.isDefault) {
      await this.addressesService.unsetDefaultForOtherAddresses(customerId);
    }
    // Delegar la creación al AddressesService
    return this.addressesService.create(fullDto);
  }

  async updateCustomerAddress(
    customerId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ): Promise<Address> {
    // Usar addressesService para buscar la dirección y validar existencia
    const address = await this.addressesService.findOne(addressId);
    // Validar pertenencia al cliente
    if (address.customerId !== customerId) {
      throw new NotFoundException(
        `Dirección con ID ${addressId} no encontrada o no pertenece al cliente ${customerId}.`,
      );
    }

    // Lógica para manejar isDefault al actualizar
    if (dto.isDefault === true && !address.isDefault) {
      // Si se está marcando como default, desmarcar las otras
      await this.addressesService.unsetDefaultForOtherAddresses(
        customerId,
        addressId,
      );
    } else if (dto.isDefault === false && address.isDefault) {
      // Si se está desmarcando la default, verificar que no sea la única
      const customerAddresses = await this.addressesService.findAll({
        customerId,
      });
      const defaultAddressesCount = customerAddresses.filter(
        (a) => a.isDefault,
      ).length;
      if (defaultAddressesCount <= 1) {
        throw new BadRequestException(
          'No se puede desmarcar la única dirección predeterminada.',
        );
      }
    }

    // Delegar la actualización al AddressesService
    // El método update base ya maneja NotFoundException si la entidad no existe al momento de actualizar
    const updatedAddress = await this.addressesService.update(addressId, dto);
    // El servicio base update devuelve NullableType, pero findOne ya validó existencia.
    // Si por alguna razón falla el update (ej. concurrencia), el repo podría devolver null.
    if (!updatedAddress) {
      throw new InternalServerErrorException( // O NotFoundException si prefieres
        `Error al actualizar la dirección con ID ${addressId}.`,
      );
    }
    return updatedAddress;
  }

  async removeCustomerAddress(
    customerId: string,
    addressId: string,
  ): Promise<void> {
    // Usar addressesService para buscar la dirección y validar existencia
    const address = await this.addressesService.findOne(addressId);
    // Validar pertenencia al cliente
    if (address.customerId !== customerId) {
      throw new NotFoundException(
        `Dirección con ID ${addressId} no encontrada o no pertenece al cliente ${customerId}.`,
      );
    }
    // Validar si es la dirección predeterminada antes de borrar
    if (address.isDefault) {
      throw new BadRequestException(
        'No puedes borrar la dirección predeterminada.',
      );
    }
    // Delegar la eliminación al AddressesService
    // El método remove base ya maneja NotFoundException si no existe al momento de borrar
    await this.addressesService.remove(addressId);
  }

  // Se elimina el método syncAddresses (si existía)

  // --- Métodos específicos para Chat History ---

  async appendToChatHistory(
    customerId: string,
    message: { role: 'user' | 'assistant' | 'system'; content: string },
  ): Promise<Customer> {
    const customer = await this.findOne(customerId);

    const newMessage = {
      ...message,
      timestamp: new Date(),
    };

    const fullChatHistory = customer.fullChatHistory || [];
    fullChatHistory.push(newMessage);

    // Actualizar el historial completo y la última interacción
    await super.update(customerId, {
      fullChatHistory,
      lastInteraction: new Date().toISOString(),
    });

    return this.findOne(customerId);
  }

  async updateRelevantChatHistory(
    customerId: string,
    relevantHistory: any[],
  ): Promise<Customer> {
    await this.findOne(customerId); // Validar que existe

    await super.update(customerId, {
      relevantChatHistory: relevantHistory,
    });

    return this.findOne(customerId);
  }

  async updateCustomerStats(
    customerId: string,
    stats: { totalOrders?: number; totalSpent?: number },
  ): Promise<Customer> {
    await this.findOne(customerId); // Validar que existe

    const updatePayload: any = {};
    if (stats.totalOrders !== undefined) {
      updatePayload.totalOrders = stats.totalOrders;
    }
    if (stats.totalSpent !== undefined) {
      updatePayload.totalSpent = stats.totalSpent;
    }

    await this.repo.update(customerId, updatePayload);

    return this.findOne(customerId);
  }

  async getActiveCustomersWithRecentInteraction(
    daysAgo: number = 30,
  ): Promise<Customer[]> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysAgo);

    return this.repo.findAll({
      isActive: true,
      lastInteractionAfter: dateThreshold,
    });
  }
}
