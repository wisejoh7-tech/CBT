import { EventSubscriber, EntitySubscriberInterface, InsertEvent } from "typeorm";
import { Candidate } from "../entities/Candidate";
import { sendSMS } from "../lib/sms";

@EventSubscriber()
export class CandidateSubscriber implements EntitySubscriberInterface<Candidate> {
  listenTo() {
    return Candidate;
  }

  async afterInsert(event: InsertEvent<Candidate>) {
    const candidate = event.entity;
    if (candidate?.phoneNumber) {
      await sendSMS(
        candidate.phoneNumber,
        `Hello ${candidate.fullName}, your exam registration is confirmed!`
      );
    }
  }
}
