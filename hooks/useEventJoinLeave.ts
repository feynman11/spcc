import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

export function useEventJoinLeave(eventId?: string) {
  const utils = trpc.useUtils();
  const { data: currentUser } = trpc.members.getCurrentUser.useQuery();

  const joinEvent = trpc.events.joinEvent.useMutation({
    onSuccess: () => {
      toast.success("Successfully joined event!");
      if (eventId) {
        utils.events.getEvent.invalidate({ eventId });
      }
      utils.events.getAllEvents.invalidate();
      utils.events.getUpcomingEvents.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to join event");
    },
  });

  const leaveEvent = trpc.events.leaveEvent.useMutation({
    onSuccess: () => {
      toast.success("Successfully left event");
      if (eventId) {
        utils.events.getEvent.invalidate({ eventId });
      }
      utils.events.getAllEvents.invalidate();
      utils.events.getUpcomingEvents.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to leave event");
    },
  });

  const checkIsRegistered = (
    event: {
      participants?: { userId: string }[];
      waitingList?: { userId: string }[];
    } | null | undefined
  ) => {
    if (!currentUser || !event) return false;
    const isParticipant = event.participants?.some((p) => p.userId === currentUser.id);
    const isOnWaitingList = event.waitingList?.some((p) => p.userId === currentUser.id);
    return isParticipant || isOnWaitingList || false;
  };

  return {
    joinEvent,
    leaveEvent,
    currentUser,
    checkIsRegistered,
  };
}

