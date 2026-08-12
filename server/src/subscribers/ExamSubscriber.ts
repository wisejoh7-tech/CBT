import { EventSubscriber, EntitySubscriberInterface, InsertEvent } from "typeorm";
import { Exam } from "../entities/Exam";
import { sendSMS } from "../lib/sms";

@EventSubscriber()
export class ExamSubscriber implements EntitySubscriberInterface<Exam> {
  listenTo() {
    return Exam;
  }

  async afterInsert(event: InsertEvent<Exam>) {
    const exam = event.entity;
    await sendSMS(
      "+234XXXXXXXXXX",
      `New exam "${exam.title}" scheduled for ${exam.startTime?.toDateString() || "unknown date"}`
    );
  }
}
