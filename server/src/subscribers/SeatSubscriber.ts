import { EventSubscriber, EntitySubscriberInterface, UpdateEvent } from "typeorm";
import { Seat, SeatStatus } from "../entities/Seat";
import { sendSMS } from "../lib/sms";

@EventSubscriber()
export class SeatSubscriber implements EntitySubscriberInterface<Seat> {
  listenTo() {
    return Seat;
  }

  async afterUpdate(event: UpdateEvent<Seat>) {
    const seat = event.entity as Seat;
    if (seat?.status === SeatStatus.RESERVED && seat?.candidate?.phoneNumber) {
      await sendSMS(
        seat.candidate.phoneNumber,
        `Your seat has been reserved successfully. Seat ID: ${seat.id}`
      );
    }
  }
}
