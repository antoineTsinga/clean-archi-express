// core/events/domain-events.ts

export type DomainEvent = {
  type: "user.created";
  payload: {
    userId: string;
    email: string;
  };
};
