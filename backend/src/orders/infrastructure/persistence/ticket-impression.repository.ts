import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { TicketImpression } from '../../domain/ticket-impression';

export abstract class TicketImpressionRepository {
  abstract create(
    data: Omit<
      TicketImpression,
      'id' | 'createdAt' | 'deletedAt' | 'updatedAt' | 'order' | 'user'
    >,
  ): Promise<TicketImpression>;

  abstract findManyWithPagination({
    filterOptions,
    paginationOptions,
  }: {
    filterOptions?: {
      orderId?: string;
      userId?: string;
      ticketType?: string;
    } | null;
    paginationOptions: IPaginationOptions;
  }): Promise<TicketImpression[]>;

  abstract findById(
    id: TicketImpression['id'],
  ): Promise<NullableType<TicketImpression>>;

  abstract findByOrderId(
    orderId: TicketImpression['orderId'],
  ): Promise<TicketImpression[]>;

}
