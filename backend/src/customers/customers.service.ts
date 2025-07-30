import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CustomerRepository } from './infrastructure/persistence/customer.repository';
import { AddressesService } from './addresses.service';
import { Customer } from './domain/customer';
import { Address } from './domain/address';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { FindAllCustomersDto } from './dto/find-all-customers.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { CUSTOMER_REPOSITORY } from '../common/tokens';
import { BaseCrudService } from '../common/application/base-crud.service';

@Injectable()
export class CustomersService extends BaseCrudService<
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  FindAllCustomersDto
> {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    protected readonly repo: CustomerRepository,

    private readonly addressesService: AddressesService,
  ) {
    super(repo);
  }

  override async create(
    createCustomerDto: CreateCustomerDto,
  ): Promise<Customer> {
    const { addresses: addressDtos, ...customerData } = createCustomerDto;

    const createdCustomer = await super.create(customerData);
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
        await this.addAddressToCustomer(createdCustomer.id, addressDto);
      }
      return this.findOne(createdCustomer.id);
    }

    return createdCustomer;
  }

  override async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    await this.findOne(id);
    const customerUpdatePayload: UpdateCustomerDto = {
      firstName: updateCustomerDto.firstName,
      lastName: updateCustomerDto.lastName,
      whatsappPhoneNumber: updateCustomerDto.whatsappPhoneNumber,
      email: updateCustomerDto.email,
      birthDate: updateCustomerDto.birthDate,
      isActive: updateCustomerDto.isActive,
      isBanned: updateCustomerDto.isBanned,
      fullChatHistory: updateCustomerDto.fullChatHistory,
      relevantChatHistory: updateCustomerDto.relevantChatHistory,
      lastInteraction: updateCustomerDto.lastInteraction,
    };

    await super.update(id, customerUpdatePayload);
    return this.findOne(id);
  }

  async addAddressToCustomer(
    customerId: string,
    dto: CreateAddressDto,
  ): Promise<Address> {
    await this.findOne(customerId);
    const fullDto = { ...dto, customerId };
    if (fullDto.isDefault) {
      await this.addressesService.unsetDefaultForOtherAddresses(customerId);
    }
    return this.addressesService.create(fullDto);
  }

  async updateCustomerAddress(
    customerId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.addressesService.findOne(addressId);
    if (address.customerId !== customerId) {
      throw new NotFoundException(
        `Dirección con ID ${addressId} no encontrada o no pertenece al cliente ${customerId}.`,
      );
    }

    if (dto.isDefault === true && !address.isDefault) {
      await this.addressesService.unsetDefaultForOtherAddresses(
        customerId,
        addressId,
      );
    } else if (dto.isDefault === false && address.isDefault) {
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

    const updatedAddress = await this.addressesService.update(addressId, dto);
    if (!updatedAddress) {
      throw new InternalServerErrorException(
        `Error al actualizar la dirección con ID ${addressId}.`,
      );
    }
    return updatedAddress;
  }

  async removeCustomerAddress(
    customerId: string,
    addressId: string,
  ): Promise<void> {
    const address = await this.addressesService.findOne(addressId);
    if (address.customerId !== customerId) {
      throw new NotFoundException(
        `Dirección con ID ${addressId} no encontrada o no pertenece al cliente ${customerId}.`,
      );
    }
    if (address.isDefault) {
      throw new BadRequestException(
        'No puedes borrar la dirección predeterminada.',
      );
    }
    await this.addressesService.remove(addressId);
  }

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
    await this.findOne(customerId);

    await super.update(customerId, {
      relevantChatHistory: relevantHistory,
    });

    return this.findOne(customerId);
  }

  async updateCustomerStats(
    customerId: string,
    stats: { totalOrders?: number; totalSpent?: number },
  ): Promise<Customer> {
    await this.findOne(customerId);

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

  async banCustomer(customerId: string, banReason: string): Promise<Customer> {
    const customer = await this.findOne(customerId);

    if (customer.isBanned) {
      throw new BadRequestException('El cliente ya está baneado');
    }

    await super.update(customerId, {
      isBanned: true,
      isActive: false, // Desactivar al cliente cuando se banea
    });
    await this.updateBanFields(customerId, {
      bannedAt: new Date(),
      banReason,
    });

    return this.findOne(customerId);
  }

  async unbanCustomer(customerId: string): Promise<Customer> {
    const customer = await this.findOne(customerId);

    if (!customer.isBanned) {
      throw new BadRequestException('El cliente no está baneado');
    }

    await super.update(customerId, {
      isBanned: false,
      isActive: true, // Reactivar al cliente cuando se desbanea
    });
    await this.updateBanFields(customerId, {
      bannedAt: null,
      banReason: null,
    });

    return this.findOne(customerId);
  }

  async getBannedCustomers(): Promise<Customer[]> {
    return this.repo.findBannedCustomers();
  }

  async isCustomerBanned(customerId: string): Promise<boolean> {
    try {
      const customer = await this.findOne(customerId);
      return customer.isBanned;
    } catch {
      return false;
    }
  }

  private async updateBanFields(
    customerId: string,
    fields: { bannedAt: Date | null; banReason: string | null },
  ): Promise<void> {
    const repository = this.repo as any;
    if (repository.ormRepo) {
      await repository.ormRepo.update(customerId, fields);
    }
  }
}
